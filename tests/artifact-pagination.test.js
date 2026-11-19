import { test } from "node:test";
import assert from "node:assert/strict";
import { PAGE_BYTES, paginateArtifact, serializeGetterError, serializeGetterPage } from "../tools/artifact-pagination.js";

const options = {
  tool: "spec_get", projectRoot: "/project", artifactPath: "/project/docs/specs/test.md",
  metadata: { file: "docs/specs/test.md", frontmatter: {} },
};
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = (value) => JSON.parse(Buffer.from(value, "base64url").toString());
const size = (page) => Buffer.byteLength(JSON.stringify(page), "utf8");

function collect(content, overrides = {}) {
  let cursor;
  let text = "";
  const pages = [];
  do {
    const page = paginateArtifact({ ...options, content, ...overrides, cursor });
    assert.ok(size(page) <= PAGE_BYTES);
    assert.equal(JSON.stringify(page), serializeGetterPage(page));
    if (page.pagination.has_more) {
      assert.ok(page.content.length > 0);
      assert.equal(typeof page.pagination.next_cursor, "string");
      assert.ok(Buffer.byteLength(page.pagination.next_cursor) <= 1024);
      // Every valid surrogate pair must stay within one page.
      assert.ok(!(/[\uD800-\uDBFF]$/.test(page.content) && /^[\uDC00-\uDFFF]/.test(content.slice(text.length + page.content.length))));
    } else assert.equal(page.pagination.next_cursor, null);
    text += page.content;
    pages.push(page);
    cursor = page.pagination.next_cursor;
    assert.ok(pages.length <= content.length + 1, "pagination must terminate");
  } while (cursor !== null);
  assert.equal(text, content);
  return pages;
}

test("lossless pages: empty, small, long lines, line endings, escaping and Unicode", () => {
  for (const content of ["", "small", "line\r\nline\nlast", "x".repeat(PAGE_BYTES * 5),
    ('"\\\u0000\u0001\b\f\t é😀\r\n').repeat(9000), "😀".repeat(20000),
    "\ud800".repeat(10000), ("line\n").repeat(20000)]) {
    collect(content);
  }
});

test("final envelopes at and around the exact budget, and complete-line preference", () => {
  const empty = paginateArtifact({ ...options, content: "" });
  const capacity = PAGE_BYTES - size(empty);
  assert.equal(size(collect("a".repeat(capacity))[0]), PAGE_BYTES);
  assert.equal(collect("a".repeat(capacity)).length, 1);
  assert.equal(collect("a".repeat(capacity - 1)).length, 1);
  assert.ok(collect("a".repeat(capacity + 1)).length > 1);
  const lines = collect("first\r\n" + "x".repeat(PAGE_BYTES * 2));
  assert.equal(lines[0].content, "first\r\n");
  assert.ok(lines[1].content.length > 1000, "long lines must split and advance");
  const first = collect("a".repeat(PAGE_BYTES * 2))[0];
  const crlf = collect("a".repeat(first.content.length - 1) + "\r\n" + "z".repeat(PAGE_BYTES * 2));
  assert.ok(crlf.every((p) => !p.content.endsWith("\r")));
});

test("metadata and both envelopes consume the budget; impossible progress fails explicitly", () => {
  const metadata = { ...options.metadata, frontmatter: { title: "é".repeat(2000) }, blocks: { total: 99, checked: 1 } };
  const pages = collect("z".repeat(PAGE_BYTES * 2), { metadata });
  for (const page of pages) {
    assert.deepEqual(page.frontmatter, metadata.frontmatter);
    assert.deepEqual(page.blocks, metadata.blocks);
  }
  const enormous = { ...metadata, frontmatter: { title: "x".repeat(PAGE_BYTES) } };
  for (const content of ["", "😀", "x".repeat(PAGE_BYTES * 2)]) {
    assert.throws(() => paginateArtifact({ ...options, metadata: enormous, content }), { code: "PAGE_BUDGET_EXCEEDED" });
  }
  const content = "😀".repeat(PAGE_BYTES);
  const probe = paginateArtifact({ ...options, content });
  const firstCodePointCursor = encode({ ...decode(probe.pagination.next_cursor), p: 2 });
  const emptyContinuing = { ...probe, content: "", pagination: { has_more: true, next_cursor: firstCodePointCursor } };
  const padding = PAGE_BYTES - size(emptyContinuing) - 1;
  assert.throws(() => paginateArtifact({ ...options, content, metadata: { ...options.metadata, file: options.metadata.file + "x".repeat(padding) } }), { code: "PAGE_BUDGET_EXCEEDED" });
});

test("stateless deterministic versioned cursors reject malformed or misplaced continuations", async () => {
  const content = "😀abc".repeat(PAGE_BYTES);
  const first = paginateArtifact({ ...options, content });
  const cursor = first.pagination.next_cursor;
  assert.deepEqual(paginateArtifact({ ...options, content }), first);
  const fresh = await import("../tools/artifact-pagination.js?fresh");
  assert.deepEqual(fresh.paginateArtifact({ ...options, content, cursor }), paginateArtifact({ ...options, content, cursor }));
  const marker = decode(cursor);
  for (const bad of ["", null, 3, "not-a-cursor", cursor + "=", "a".repeat(1025), "é".repeat(513),
    encode(null), encode({}), encode({ ...marker, v: 2 }), encode({ ...marker, t: "plan_get" }),
    encode({ ...marker, a: "another" }), encode({ ...marker, p: 0 }), encode({ ...marker, p: 1 }),
    encode({ ...marker, p: -1 }), encode({ ...marker, p: 1.5 }), encode({ ...marker, p: content.length }),
    encode({ ...marker, p: Number.MAX_SAFE_INTEGER + 1 }), encode({ ...marker, extra: true })]) {
    assert.throws(() => paginateArtifact({ ...options, content, cursor: bad }), { code: "INVALID_CURSOR" });
  }
  for (const change of [{ tool: "plan_get" }, { projectRoot: "/other" }, { artifactPath: "/project/docs/specs/other.md" }]) {
    assert.throws(() => paginateArtifact({ ...options, content, cursor, ...change }), { code: "INVALID_CURSOR" });
  }
  for (const changed of [content.replace("a", "b"), "shorter"]) {
    assert.throws(() => paginateArtifact({ ...options, content: changed, cursor }), { code: "STALE_CURSOR" });
  }
});

test("registered-boundary serializers bound errors and refuse oversized success", () => {
  for (const error of [new Error("\u0000😀".repeat(PAGE_BYTES)), "x".repeat(PAGE_BYTES), null]) {
    const raw = serializeGetterError(error);
    assert.ok(Buffer.byteLength(raw, "utf8") <= PAGE_BYTES);
    assert.equal(typeof JSON.parse(raw).error, "string");
  }
  const oversized = JSON.parse(serializeGetterPage({ content: "x".repeat(PAGE_BYTES) }));
  assert.equal(oversized.code, "PAGE_BUDGET_EXCEEDED");
  assert.equal(oversized.content, undefined);
  for (const [content, cursor, code] of [["x", "bad", "INVALID_CURSOR"], ["x".repeat(PAGE_BYTES), undefined, "PAGE_BUDGET_EXCEEDED"]]) {
    try {
      paginateArtifact({ ...options, content, cursor, metadata: { file: "x".repeat(PAGE_BYTES) } });
      assert.fail("expected pagination error");
    } catch (error) {
      const raw = serializeGetterError(error);
      assert.ok(Buffer.byteLength(raw, "utf8") <= PAGE_BYTES);
      assert.equal(JSON.parse(raw).code, code);
      assert.equal(JSON.parse(raw).content, undefined);
      assert.ok(!raw.includes("x".repeat(100)));
    }
  }
});
