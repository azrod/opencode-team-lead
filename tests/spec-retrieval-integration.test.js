import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import Plugin from "../index.js";
import { buildToolRegistry } from "../tools/registry.js";
import { LIFECYCLE_TOOLS } from "../tools/artifact-guard.js";
import { PAGE_BYTES } from "../tools/artifact-pagination.js";
import { mockContext, permission, toolContext } from "./v2-helper.js";

const defaults = { specs: "docs/specs", execPlans: "docs/exec-plans", briefs: "docs/briefs" };
const custom = { specs: "private/specifications", execPlans: "private/plans", briefs: "private/briefs" };
const names = ["spec_search", "spec_read_section"];
const hash = (text) => createHash("sha256").update(text).digest("hex");
const section = "## Needle\r\nneedle remains private\r\n" + '😀é "\\\u0001\r\n'.repeat(7_000) + "### Child\r\nchild rule\r\n";
const source = '---\r\ntitle: Fixture\r\ntype: Technical\r\nstatus: Deprecated\r\n---\r\n# Root\r\n' + section + "## Neighbor\r\nnot selected\r\n";
const sectionInput = (hit) => ({ id: hit.spec_id, section_id: hit.section_id, source_hash: hit.source_hash });

async function fixture(t, paths = defaults, content = source) {
  const root = await fs.mkdtemp(join(tmpdir(), "retrieval-plugin-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = join(root, paths.specs, "actual.md");
  await fs.mkdir(join(root, paths.specs), { recursive: true });
  await fs.writeFile(file, content);
  const ctx = mockContext(root, { paths });
  await Plugin.setup(ctx);
  return { root, file, ctx };
}

async function call(ctx, name, input, context = toolContext) {
  const output = await ctx.tools.get(name).execute(input, context);
  assert.equal(typeof output.content, "string");
  assert.ok(Buffer.byteLength(output.content) <= PAGE_BYTES);
  return JSON.parse(output.content);
}

test("retrieval schemas add exactly two lifecycle tools without changing existing contracts", () => {
  const registry = buildToolRegistry(process.cwd(), defaults, permission);
  assert.equal(Object.keys(registry).length, 23);
  assert.deepEqual(Object.keys(registry).sort(), [...LIFECYCLE_TOOLS].sort());
  for (const [name, required, optional] of [
    ["spec_search", ["query"], ["id", "type", "status"]],
    ["spec_read_section", ["id", "section_id", "source_hash"], ["cursor"]],
  ]) {
    const tool = registry[name];
    assert.deepEqual(tool.input.required, required);
    assert.deepEqual(Object.keys(tool.input.properties).sort(), [...required, ...optional].sort());
    assert.ok(Object.values(tool.input.properties).every((property) => property.type === "string"));
    assert.equal(tool.input.additionalProperties, false);
    assert.equal(tool.options.codemode, false);
    assert.match(tool.description, /source_hash/);
    assert.match(tool.description, /untrusted/i);
    assert.match(tool.description, /spec_get/);
  }
});

for (const paths of [defaults, custom]) {
  test(`registered cited search and lossless section pagination survive setup recreation: ${paths.specs}`, async (t) => {
    const { root, ctx } = await fixture(t, paths);
    const found = await call(ctx, "spec_search", { query: "needle", type: "technical", status: "deprecated" });
    assert.equal(found.error, undefined);
    const hit = found.results[0];
    assert.equal(hit.file, `${paths.specs}/actual.md`);
    assert.equal(hit.spec_id, "actual");
    assert.equal(hit.source_hash, hash(source));
    assert.equal(hit.section_id, "line:7");
    assert.deepEqual(hit.section, ["# Root", "## Needle"]);
    assert.equal(hit.line_start, 7);
    assert.equal(source.split(/\r?\n/).slice(hit.line_start - 1, hit.line_end).join("\r\n") + "\r\n", hit.excerpt);
    const input = sectionInput(hit);
    let page = await call(ctx, "spec_read_section", input);
    assert.equal(page.pagination.has_more, true);
    const fresh = mockContext(root, { paths });
    await Plugin.setup(fresh);
    const pages = [];
    do {
      assert.equal(page.error, undefined);
      assert.equal(page.source_hash, hit.source_hash);
      assert.equal(page.section_line_start, 7);
      assert.equal(page.section_line_end, 7_010);
      pages.push(page);
      assert.ok(pages.length < 100);
      if (!page.pagination.has_more) { assert.equal(page.pagination.next_cursor, null); break; }
      assert.ok(page.content);
      assert.ok(Buffer.byteLength(page.pagination.next_cursor) <= 1_024);
      page = await call(fresh, "spec_read_section", { ...input, cursor: page.pagination.next_cursor });
    } while (true);
    assert.equal(pages.map((item) => item.content).join(""), section);
    for (const name of names) {
      await assert.doesNotReject(() => ctx.hooks["execute.before"]({ tool: name, input: {}, sessionID: "ses_test" }));
    }
    for (const [tool, input] of [["read", { filePath: hit.file }], ["glob", { path: paths.specs, pattern: "*.md" }], ["grep", { path: paths.specs, pattern: "needle" }]]) {
      await assert.rejects(() => ctx.hooks["execute.before"]({ tool, input, sessionID: "ses_test" }), /blocked/);
    }
    t.diagnostic(JSON.stringify({ kind: "mocked Plugin.setup only", paths: paths.specs,
      sourceBytes: Buffer.byteLength(source), sectionBytes: Buffer.byteLength(section), pages: pages.length,
      maxPageBytes: Math.max(...pages.map((item) => Buffer.byteLength(JSON.stringify(item)))) }));
  });
}

test("registered failures are bounded JSON, never partial content or false EOF", async (t) => {
  const { ctx, root, file } = await fixture(t);
  const hit = (await call(ctx, "spec_search", { query: "needle" })).results[0];
  const input = sectionInput(hit);
  const first = await call(ctx, "spec_read_section", input);
  const cases = [
    ["spec_search", { query: "x".repeat(100_000) }, "INVALID_QUERY"],
    ["spec_search", { query: "needle", status: "" }, "INVALID_ARGUMENT"],
    ["spec_search", { query: "needle", id: "missing" }, "SPEC_NOT_FOUND"],
    ["spec_read_section", { ...input, section_id: "line:999999" }, "SECTION_NOT_FOUND"],
    ["spec_read_section", { ...input, cursor: "x".repeat(100_000) }, "INVALID_CURSOR"],
    ["spec_read_section", { ...input, source_hash: "0".repeat(64) }, "STALE_SOURCE"],
  ];
  const check = async (name, args, code) => {
    const result = await call(ctx, name, args);
    assert.equal(result.code, code);
    assert.equal(result.content, undefined);
    assert.equal(result.pagination, undefined);
    assert.equal(result.results, undefined);
  };
  for (const args of cases) await check(...args);
  const stat = await fs.stat(file);
  await fs.writeFile(file, source.replace("private", "changed"));
  await fs.utimes(file, stat.atime, stat.mtime);
  await check("spec_read_section", input, "STALE_SOURCE");
  await check("spec_read_section", { ...input, cursor: first.pagination.next_cursor }, "STALE_CURSOR");
  assert.notEqual((await call(ctx, "spec_search", { query: "needle" })).results[0].source_hash, hit.source_hash);
  const overflow = "# needle " + "x".repeat(PAGE_BYTES) + "\nbody";
  await fs.writeFile(file, overflow);
  await check("spec_search", { query: "needle" }, "PAGE_BUDGET_EXCEEDED");
  await check("spec_read_section", { id: "actual", section_id: "line:1", source_hash: hash(overflow) }, "PAGE_BUDGET_EXCEEDED");
  if (process.getuid?.() !== 0 && process.platform !== "win32") {
    await fs.chmod(file, 0);
    try {
      await check("spec_search", { query: "needle" }, "CORPUS_UNAVAILABLE");
      await check("spec_read_section", input, "SOURCE_UNAVAILABLE");
    } finally { await fs.chmod(file, 0o600); }
  } else t.diagnostic("Unreadable-file integration unavailable as root/Windows; deterministic engine fault injection covers it.");
  await fs.rm(file);
  await fs.rmdir(join(root, defaults.specs));
  await fs.writeFile(join(root, defaults.specs), "not a directory");
  await check("spec_search", { query: "needle" }, "CORPUS_UNAVAILABLE");
});

test("independent locations cannot mix section cursors or bypass lifecycle location checks", async (t) => {
  const a = await fixture(t), b = await fixture(t);
  const hit = (await call(a.ctx, "spec_search", { query: "needle" })).results[0];
  const input = sectionInput(hit);
  const page = await call(a.ctx, "spec_read_section", input);
  assert.equal((await call(b.ctx, "spec_read_section", { ...input, cursor: page.pagination.next_cursor })).code, "INVALID_CURSOR");
  await fs.writeFile(b.file, "different corpus");
  assert.equal((await call(b.ctx, "spec_search", { query: "needle" })).results.length, 0);
  assert.ok((await call(a.ctx, "spec_search", { query: "needle" })).results.length);
  a.ctx.session.get = async () => ({ location: { directory: b.root } });
  for (const name of names) await assert.rejects(() => a.ctx.hooks["execute.before"]({ tool: name, input, sessionID: "ses_test" }), /different location/);
});

test("named permissions and cancellation propagate before validation or corpus access", async () => {
  for (const name of names) {
    const denied = new Error("denied");
    const cancelled = new Error("cancelled");
    let asserted;
    // Even invalid inputs and nonexistent roots cannot reach argument parsing
    // or filesystem work before the host's denial/pre-abort is honored.
    const registry = buildToolRegistry("/does-not-exist-retrieval-fixture", defaults, { async assert(input) { asserted = input; throw denied; } });
    await assert.rejects(() => registry[name].execute(null, toolContext), (error) => error === denied);
    assert.deepEqual(asserted, { sessionID: toolContext.sessionID, agent: toolContext.agent,
      source: { type: "tool", messageID: toolContext.messageID, id: toolContext.id }, action: name, resources: ["*"], save: ["*"] });
    const controller = new AbortController(); controller.abort(cancelled);
    const allowed = buildToolRegistry("/does-not-exist-retrieval-fixture", defaults, permission);
    await assert.rejects(() => allowed[name].execute(null, { ...toolContext, signal: controller.signal }), (error) => error === cancelled);
  }
});
