import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { buildSpecDocument, loadSpecCorpus, specSearch, specReadSection, serializeRetrievalError,
  serializeRetrievalResult } from "../tools/spec-retrieval.js";
import { paginateArtifact, PAGE_BYTES } from "../tools/artifact-pagination.js";

const hash = (content) => createHash("sha256").update(content).digest("hex");
const paths = { specs: "specs" };
const errorCode = (code) => (error) => {
  const result = JSON.parse(serializeRetrievalError(error));
  assert.equal(result.code, code);
  assert.ok(Buffer.byteLength(JSON.stringify(result)) <= PAGE_BYTES);
  return true;
};
const bounded = (value) => {
  assert.ok(Buffer.byteLength(JSON.stringify(value)) <= PAGE_BYTES);
  assert.deepEqual(JSON.parse(serializeRetrievalResult(value)), value);
};
let root;
beforeEach(async () => { root = await fs.mkdtemp(join(tmpdir(), "spec-retrieval-")); await fs.mkdir(join(root, "specs")); });
afterEach(async () => { await fs.rm(root, { recursive: true, force: true }); });
const write = (name, content) => fs.writeFile(join(root, "specs", name + ".md"), content);
const search = (query, rest = {}, options) => specSearch(root, paths, { query, ...rest }, options);
const read = (id, content, section_id = "preamble", rest = {}, options) => specReadSection(root, paths,
  { id, source_hash: hash(content), section_id, ...rest }, options);

describe("exact-source corpus and sections", () => {
  it("includes only immediate regular Markdown files, preserves legacy/missing metadata and filename IDs", async () => {
    await write("Actual", '---\ntitle: "A \\"title\\""\nid: wrong\nstatus: implemented\n---\n# Rule\n');
    await write("bare", "unstructured text");
    await fs.writeFile(join(root, "specs", "ignore.txt"), "not a spec");
    await fs.mkdir(join(root, "specs", "nested"));
    await fs.writeFile(join(root, "specs", "nested", "ignore.md"), "nested");
    await fs.symlink(join(root, "specs", "bare.md"), join(root, "specs", "alias.md"));
    const docs = await loadSpecCorpus(root, paths);
    assert.deepEqual(docs.map((doc) => doc.spec_id), ["Actual", "bare"]);
    assert.equal(docs[0].status, "implemented");
    assert.equal(docs[1].title, null);
    assert.equal(docs[0].file, "specs/Actual.md");
  });

  it("uses configured in-project directories and safe symlink aliases", async () => {
    await write("rule", "hello");
    await fs.symlink(join(root, "specs"), join(root, "alias"));
    assert.equal((await loadSpecCorpus(root, { specs: "alias" }))[0].file, "alias/rule.md");
    assert.equal((await loadSpecCorpus(root, { specs: join(root, "specs") }))[0].file, "specs/rule.md");
    assert.deepEqual(await loadSpecCorpus(root, { specs: "missing/deep" }), []);
  });

  it("rejects traversal, external directory aliases and missing paths below those aliases", async () => {
    await fs.symlink(tmpdir(), join(root, "escape"));
    await fs.symlink(join(tmpdir(), "nonexistent-retrieval-target"), join(root, "dangling"));
    for (const specs of ["../escape", "escape", "escape/no-such-child", "dangling/child"]) {
      await assert.rejects(loadSpecCorpus(root, { specs }), errorCode("CORPUS_UNAVAILABLE"));
    }
  });

  it("rejects case-ambiguous inventories deterministically", async () => {
    // macOS commonly has a case-insensitive filesystem; inject enumeration to
    // exercise the ambiguity independently of the platform's filename rules.
    const entry = (name) => ({ name, isFile: () => true });
    const io = { ...fs, readdir: async () => [entry("Rule.md"), entry("rule.md")] };
    await assert.rejects(loadSpecCorpus(root, paths, { io }), errorCode("AMBIGUOUS_ID"));
  });

  it("refuses a directory alias retargeted between canonical validation and opening", async () => {
    await write("r", "internal rule");
    const outside = await fs.mkdtemp(join(tmpdir(), "retrieval-outside-"));
    try {
      await fs.writeFile(join(outside, "r.md"), "external secret");
      await fs.symlink(join(root, "specs"), join(root, "alias"));
      let readContent = false;
      const io = { ...fs, open: async (path, flags) => {
        assert.equal(path, await fs.realpath(join(root, "specs/r.md")));
        await fs.unlink(join(root, "alias"));
        await fs.symlink(outside, join(root, "alias"));
        const handle = await fs.open(path, flags);
        return { stat: () => handle.stat(), close: () => handle.close(),
          readFile: (...args) => { readContent = true; return handle.readFile(...args); } };
      } };
      await assert.rejects(loadSpecCorpus(root, { specs: "alias" }, { io }), errorCode("CORPUS_UNAVAILABLE"));
      assert.equal(readContent, false);
    } finally { await fs.rm(outside, { recursive: true, force: true }); }
  });

  it("does not return partial corpora after enumeration or file-read failures", async () => {
    await write("a", "visible"); await write("b", "unreadable");
    const io = { ...fs, open: async (path, flags) => {
      if (path.endsWith("b.md")) throw Object.assign(new Error("private path and contents"), { code: "EACCES" });
      return fs.open(path, flags);
    } };
    await assert.rejects(loadSpecCorpus(root, paths, { io }), errorCode("CORPUS_UNAVAILABLE"));
    await assert.rejects(loadSpecCorpus(root, paths, { io: { ...fs, readdir: async () => { throw new Error("denied"); } } }), errorCode("CORPUS_UNAVAILABLE"));
    await fs.writeFile(join(root, "not-directory"), "file");
    await assert.rejects(loadSpecCorpus(root, { specs: "not-directory" }), errorCode("CORPUS_UNAVAILABLE"));
  });

  it("hashes the complete decoded text identically to getter pagination", () => {
    const content = '---\r\ntitle: "😀"\r\n---\r\n# Rule\r\n' + "é".repeat(30_000);
    const doc = buildSpecDocument(content, "specs/rule.md", "rule");
    const page = paginateArtifact({ tool: "spec_get", projectRoot: root, artifactPath: join(root, "specs/rule.md"), content, metadata: {} });
    assert.equal(doc.source_hash, hash(content));
    assert.equal(JSON.parse(Buffer.from(page.pagination.next_cursor, "base64url").toString()).h, doc.source_hash);
  });

  it("recognizes ATX ancestry and exact direct/context bounds, including repeated titles and skipped levels", () => {
    const content = "preface\r\n# Root ###\r\nroot\r\n### Repeat\r\na\r\n### Repeat\r\nb\r\n## Next\r\nc\r\n";
    const doc = buildSpecDocument(content, "specs/r.md", "r");
    assert.deepEqual(doc.sections.map((s) => s.section_id), ["preamble", "line:2", "line:4", "line:6", "line:8"]);
    assert.deepEqual(doc.sections[2].section, ["# Root ###", "### Repeat"]);
    const source = (s, direct = false) => content.slice(s.start, direct ? s.directEnd : s.end);
    assert.equal(source(doc.sections[1], true), "# Root ###\r\nroot\r\n");
    assert.equal(source(doc.sections[1]), content.slice(content.indexOf("# Root")));
    assert.equal(source(doc.sections[2]), "### Repeat\r\na\r\n");
    assert.equal(doc.lines.length, 9);
  });

  it("ignores headings in frontmatter and CommonMark-like code fences only", () => {
    const content = ["---", "# not a heading", "title: legacy", "---", "   # Yes", "````js", "## no", "```", "### still no", "````", "  ~~~lang", "# no", "  ~~~~", "## Yes", "    # unsupported indentation", "Setext", "===", "####### no", "#not", "```has`backtick", "### Yes"].join("\n");
    const doc = buildSpecDocument(content, "specs/r.md", "r");
    assert.deepEqual(doc.sections.map((s) => s.section_id), ["preamble", "line:5", "line:14", "line:21"]);
    assert.ok(doc.content.includes("Setext"));
  });

  it("segments direct text losslessly into <=2000 code points without splitting CRLF or surrogate pairs", () => {
    for (const content of ["", "plain", "\n", "# H\n" + "😀é\r\n".repeat(2_000), "a".repeat(1_999) + "\r\n" + "😀".repeat(3_000)]) {
      const doc = buildSpecDocument(content, "specs/r.md", "r");
      assert.equal(doc.passages.map((p) => content.slice(p.start, p.end)).join(""), content);
      for (const p of doc.passages) {
        const text = content.slice(p.start, p.end);
        assert.ok(Array.from(text).length <= 2_000);
        assert.ok(!/[\ud800-\udbff]$/.test(text));
        assert.ok(!(text.endsWith("\r") && content[p.end] === "\n"));
      }
    }
  });
});

describe("cited lexical search", () => {
  it("validates Unicode queries, OR tokens and bounded input; never executes search syntax", async () => {
    await write("rule", "# Café\nÉTÉ １２ hello world\n");
    for (const query of ["ÉTÉ", "absent hello", "(hello|world).*", "hello OR nomatch", "１２"]) {
      const result = await search(query); assert.ok(result.results.length); bounded(result);
    }
    for (const query of ["", " .* + ", "é".repeat(257), Array.from({ length: 33 }, (_, i) => `t${i}`).join(" "), null]) {
      await assert.rejects(search(query), errorCode("INVALID_QUERY"));
    }
    assert.ok((await search("hello ".repeat(32))).results.length);
  });

  it("filters exact metadata case-insensitively and uses actual filename stems", async () => {
    await write("Actual", '---\nid: wrong\ntype: Technical\nstatus: Deprecated\n---\nrule');
    assert.equal((await search("rule", { id: "ACTUAL", type: "technical", status: "deprecated" })).results[0].spec_id, "Actual");
    assert.equal((await search("rule", { type: "missing" })).results.length, 0);
    await assert.rejects(search("rule", { id: "wrong" }), errorCode("SPEC_NOT_FOUND"));
    for (const rest of [{ id: "" }, { type: " " }, { status: null }, { id: "../Actual" }, { id: "/Actual" }, { id: "a\\b" }]) {
      await assert.rejects(search("rule", rest), errorCode("INVALID_ARGUMENT"));
    }
  });

  it("ranks distinct matches first, headings/title above body-only and stable paths/offsets last", async () => {
    await write("a-body", "# Plain\nalpha\n");
    await write("b-heading", "# Alpha\nplain\n");
    await write("c-title", '---\ntitle: Alpha\n---\nplain\n');
    await write("d-both", "# Plain\nalpha beta\n");
    const result = await search("alpha beta");
    assert.deepEqual(result.results.map((r) => r.spec_id), ["d-both", "b-heading", "c-title", "a-body"]);
    await write("z-tie", "# First\nalpha\n# Second\nalpha\n");
    const tie = await search("alpha", { id: "z-tie" });
    assert.deepEqual(tie.results.map((r) => r.section_id), ["line:1", "line:3"]);
  });

  it("deduplicates metadata-only candidates instead of filling the list with unrelated passages", async () => {
    await write("r", '---\ntitle: Needle\n---\n' + Array.from({ length: 20 }, (_, i) => `# Section ${i}\nunrelated\n`).join(""));
    const result = await search("needle");
    // Frontmatter itself is source text and contains a real lexical match;
    // all remaining metadata-only passages contribute at most one candidate.
    assert.equal(result.matched_passages, 2);
  });

  it("returns exact excerpts, ancestry, original inclusive lines and full-line flags", async () => {
    const content = '---\r\ntitle: "Auth"\r\nid: wrong\r\n---\r\n# Auth\r\n## Rules\r\nDeny access by default.\r\n';
    await write("auth", content);
    const hit = (await search("deny")).results[0];
    assert.equal(hit.file, "specs/auth.md"); assert.equal(hit.source_hash, hash(content));
    assert.deepEqual(hit.section, ["# Auth", "## Rules"]);
    assert.equal(hit.section_id, "line:6"); assert.equal(hit.line_start, 6); assert.equal(hit.line_end, 7);
    assert.equal(hit.excerpt, "## Rules\r\nDeny access by default.\r\n");
    assert.equal(hit.partial_start_line, false); assert.equal(hit.partial_end_line, false);
    assert.equal(content.split(/\r?\n/).slice(hit.line_start - 1, hit.line_end).join("\r\n") + "\r\n", hit.excerpt);
  });

  it("handles empty/missing corpora, zero matches and fixed top-five truncation", async () => {
    assert.deepEqual(await search("needle"), { query: "needle", corpus_files: 0, matched_passages: 0, results: [], truncated: false });
    for (let i = 0; i < 7; i++) await write(`r${i}`, "needle");
    const result = await search("needle");
    assert.equal(result.corpus_files, 7); assert.equal(result.matched_passages, 7);
    assert.equal(result.results.length, 5); assert.equal(result.truncated, true);
    assert.equal((await search("absent")).truncated, false);
    assert.equal((await specSearch(root, { specs: "missing" }, { query: "needle" })).corpus_files, 0);
  });

  it("bounds escaped multibyte excerpts, shortens around evidence and retains partial-line locations", async () => {
    const content = ('"\\\u0001😀 '.repeat(400) + "needle ").repeat(5);
    await write("long", content);
    const result = await search("needle"); bounded(result);
    for (const hit of result.results) {
      assert.ok(content.includes(hit.excerpt)); assert.ok(hit.excerpt.toLowerCase().includes("n"));
      assert.equal(hit.line_start, 1); assert.equal(hit.line_end, 1);
      assert.equal(hit.partial_end_line, true);
      assert.ok(!/[\ud800-\udbff]$/.test(hit.excerpt));
    }
  });

  it("marks byte-budget omissions even when fewer than five candidates matched", async () => {
    const content = '---\ntitle: "' + "x".repeat(7_500) + '"\n---\nneedle\n';
    for (const id of ["a", "b", "c"]) await write(id, content);
    const result = await search("needle");
    bounded(result);
    assert.equal(result.matched_passages, 3);
    assert.ok(result.results.length > 0 && result.results.length < 3);
    assert.equal(result.truncated, true);
    for (const hit of result.results) assert.ok(hit.excerpt.includes("needle"));
  });

  it("preserves Unicode token evidence when lowercasing expands a character", async () => {
    const content = '---\ntitle: "' + "x".repeat(15_000) + '"\n---\n' + "prefix ".repeat(100) + "İSTANBUL\n";
    await write("r", content);
    const result = await search("İSTANBUL");
    bounded(result);
    assert.equal(result.results.length, 1);
    assert.ok(result.results[0].excerpt.includes("İSTANBUL"));
  });

  it("fails when the highest-ranked mandatory envelope cannot fit instead of skipping it", async () => {
    await write("a", "# needle " + "x".repeat(PAGE_BYTES) + "\nbody");
    await write("z", "needle");
    await assert.rejects(search("needle"), errorCode("PAGE_BUDGET_EXCEEDED"));
  });

  it("observes create/delete/branch replacement and same-size preserved-timestamp edits every call", async () => {
    await write("r", "oldtoken"); const stat = await fs.stat(join(root, "specs/r.md"));
    assert.equal((await search("oldtoken")).results.length, 1);
    await write("r", "newtoken"); await fs.utimes(join(root, "specs/r.md"), stat.atime, stat.mtime);
    assert.equal((await search("oldtoken")).results.length, 0);
    assert.equal((await search("newtoken")).results[0].source_hash, hash("newtoken"));
    await fs.unlink(join(root, "specs/r.md")); await write("branch", "branchrule");
    assert.equal((await search("newtoken")).results.length, 0);
    assert.equal((await search("branchrule")).results[0].spec_id, "branch");
  });
});

describe("version-checked section reading", () => {
  it("expands a search hit into exactly its subsection tree and not its neighbor", async () => {
    const content = "preamble\n# Root\nintro\n## Rule\nneedle\n### Detail\nchild\n## Neighbor\nother\n";
    await write("r", content);
    const hit = (await search("needle")).results[0];
    const page = await specReadSection(root, paths, { id: hit.spec_id, section_id: hit.section_id, source_hash: hit.source_hash });
    assert.equal(page.content, "## Rule\nneedle\n### Detail\nchild\n");
    assert.equal(page.section_line_start, 4); assert.equal(page.section_line_end, 7);
    assert.deepEqual(page.pagination, { has_more: false, next_cursor: null });
    assert.equal((await read("R", content)).content, "preamble\n");
  });

  it("returns null line bounds only for an empty document's preamble", async () => {
    for (const content of ["", "\n", "no final newline"]) {
      await write("r", content); const page = await read("r", content); bounded(page);
      assert.equal(page.content, content);
      assert.equal(page.section_line_start, content ? 1 : null);
      assert.equal(page.section_line_end, content ? 1 : null);
    }
  });

  it("checks hash before resolving a stale selector, including same-size timestamp-preserved edits", async () => {
    const content = "# Old\nold\n"; await write("r", content);
    const stat = await fs.stat(join(root, "specs/r.md"));
    await write("r", "# New\nnew\n"); await fs.utimes(join(root, "specs/r.md"), stat.atime, stat.mtime);
    await assert.rejects(read("r", content, "line:1"), errorCode("STALE_SOURCE"));
    await assert.rejects(read("r", content, "line:99"), errorCode("STALE_SOURCE"));
    await assert.rejects(read("r", content, "invalid-selector"), errorCode("STALE_SOURCE"));
  });

  it("reconstructs large sections exactly across stateless bounded Unicode/CRLF/control-character pages", async () => {
    for (const body of ["line 😀\r\n".repeat(8_000), "😀\\\"\u0001".repeat(12_000), "x".repeat(35_000)]) {
      const content = "# Other\n" + "padding\n".repeat(2_000) + "# Target\n" + body + "\n# End\nstop";
      await write("r", content);
      const section_id = `line:${2_002}`;
      const expected = "# Target\n" + body + "\n";
      let cursor, reconstructed = "", count = 0;
      do {
        const page = await read("r", content, section_id, cursor === undefined ? {} : { cursor });
        bounded(page); reconstructed += page.content; count++;
        assert.equal(page.section_line_start, 2_002);
        if (page.pagination.has_more) { assert.ok(page.content); assert.ok(page.pagination.next_cursor); }
        else assert.equal(page.pagination.next_cursor, null);
        assert.ok(!/[\ud800-\udbff]$/.test(page.content));
        assert.ok(!page.content.endsWith("\r"));
        cursor = page.pagination.next_cursor;
      } while (cursor);
      assert.ok(count > 1); assert.equal(reconstructed, expected);
    }
  });

  it("rejects malformed, oversized, wrong-identity and invalid-position cursors", async () => {
    const content = "# Root\n" + "😀".repeat(30_000) + "\n## Child\ntext";
    await write("r", content); await write("other", content);
    const first = await read("r", content, "line:1");
    const cursor = first.pagination.next_cursor;
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString());
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    for (const invalid of ["", "bad!", "a".repeat(1_025), encode({ ...decoded, v: 2 }), encode({ ...decoded, t: "spec_get" }),
      encode({ ...decoded, p: -1 }), encode({ ...decoded, p: 0 }), encode({ ...decoded, p: 999_999 }),
      encode({ ...decoded, p: 8 }), encode({ ...decoded, extra: true })]) {
      await assert.rejects(read("r", content, "line:1", { cursor: invalid }), errorCode("INVALID_CURSOR"));
    }
    await assert.rejects(read("other", content, "line:1", { cursor }), errorCode("INVALID_CURSOR"));
    await assert.rejects(read("r", content, `line:3`, { cursor }), errorCode("INVALID_CURSOR"));
    await assert.rejects(read("r", content, "line:1", { cursor, source_hash: "0".repeat(64) }), errorCode("INVALID_CURSOR"));
    const getter = paginateArtifact({ tool: "spec_get", projectRoot: root, artifactPath: join(root, "specs/r.md"), content, metadata: {} });
    await assert.rejects(read("r", content, "line:1", { cursor: getter.pagination.next_cursor }), errorCode("INVALID_CURSOR"));
    assert.throws(() => paginateArtifact({ tool: "spec_get", projectRoot: root, artifactPath: join(root, "specs/r.md"), content, metadata: {}, cursor }), /Invalid pagination cursor/);
  });

  it("rejects valid continuations after edits as STALE_CURSOR, and deletion is not EOF", async () => {
    const content = "# Rule\n" + "old ".repeat(20_000); await write("r", content);
    const first = await read("r", content, "line:1");
    await write("r", "# Rule\nnew");
    await assert.rejects(read("r", content, "line:1", { cursor: first.pagination.next_cursor }), errorCode("STALE_CURSOR"));
    await fs.unlink(join(root, "specs/r.md"));
    await assert.rejects(read("r", content, "line:1", { cursor: first.pagination.next_cursor }), errorCode("SPEC_NOT_FOUND"));
  });

  it("reports missing sections, invalid hashes, ambiguous IDs and unreadable selected files", async () => {
    await write("r", "text");
    await assert.rejects(read("r", "text", "line:9"), errorCode("SECTION_NOT_FOUND"));
    await assert.rejects(read("r", "text", "../r"), errorCode("SECTION_NOT_FOUND"));
    for (const source_hash of ["ABC", "A".repeat(64), "", null]) {
      await assert.rejects(read("r", "text", "preamble", { source_hash }), errorCode("INVALID_ARGUMENT"));
    }
    await assert.rejects(read("../r", "text"), errorCode("INVALID_ARGUMENT"));
    await assert.rejects(read("missing", "text"), errorCode("SPEC_NOT_FOUND"));
    const entry = (name) => ({ name, isFile: () => true });
    await assert.rejects(read("r", "text", "preamble", {}, { io: { ...fs, readdir: async () => [entry("r.md"), entry("R.md")] } }), errorCode("AMBIGUOUS_ID"));
    await assert.rejects(read("r", "text", "preamble", {}, { io: { ...fs, open: async () => { throw new Error("private"); } } }), errorCode("SOURCE_UNAVAILABLE"));
  });

  it("does not share mutable state or cursors between projects", async () => {
    const content = "# Rule\n" + "text\n".repeat(10_000); await write("r", content);
    const other = await fs.mkdtemp(join(tmpdir(), "spec-retrieval-other-"));
    try {
      await fs.mkdir(join(other, "specs")); await fs.writeFile(join(other, "specs/r.md"), content);
      const page = await read("r", content, "line:1");
      await assert.rejects(specReadSection(other, paths, { id: "r", section_id: "line:1", source_hash: hash(content), cursor: page.pagination.next_cursor }), errorCode("INVALID_CURSOR"));
      const again = await read("r", content, "line:1", { cursor: page.pagination.next_cursor });
      assert.ok(again.content); bounded(again);
    } finally { await fs.rm(other, { recursive: true, force: true }); }
  });

  it("bounds oversized metadata and unexpected diagnostics without content or false EOF", async () => {
    const content = "# " + "x".repeat(PAGE_BYTES) + "\nbody"; await write("r", content);
    await assert.rejects(read("r", content, "line:1"), errorCode("PAGE_BUDGET_EXCEEDED"));
    const error = JSON.parse(serializeRetrievalError(new Error("secret".repeat(30_000))));
    assert.equal(error.code, "SOURCE_UNAVAILABLE"); assert.ok(!("content" in error)); assert.ok(!("pagination" in error));
  });

  it("propagates cancellation without scanning when already aborted", async () => {
    const controller = new AbortController(); controller.abort(new Error("cancelled"));
    let enumerated = false;
    const options = { signal: controller.signal, io: { ...fs, readdir: async () => { enumerated = true; return []; } } };
    await assert.rejects(search("needle", {}, options), /cancelled/);
    await assert.rejects(read("r", "text", "preamble", {}, options), /cancelled/);
    assert.equal(enumerated, false);
  });
});
