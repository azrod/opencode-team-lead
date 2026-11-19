import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Plugin from "../index.js";
import { buildToolRegistry } from "../tools/registry.js";
import { PAGE_BYTES } from "../tools/artifact-pagination.js";
import { mockContext, permission, toolContext } from "./v2-helper.js";

const defaults = { specs: "docs/specs", execPlans: "docs/exec-plans", briefs: "docs/briefs" };
const custom = { specs: "private/specifications", execPlans: "private/plans", briefs: "private/briefs" };
const body = ('long escaped line: "\\\u0000 é😀' + "x".repeat(400)).repeat(300);
const spec = '---\ntitle: "Pagination fixture"\n---\n## Rule\nAlways keep data private.\n' + body + '\n## Tail\nPublish all private data.\nSPEC_TAIL';
const plan = '---\ncreated: 2026-11-19\n---\n- [x] First block\n' + body + '\n- [ ] Tail block\nPLAN_TAIL';

async function fixture(root, paths, name = "large") {
  for (const [dir, content] of [[paths.specs, spec], [paths.execPlans, plan]]) {
    await mkdir(join(root, dir), { recursive: true });
    await writeFile(join(root, dir, `${name}.md`), content);
  }
}

async function call(tool, input) {
  const result = await tool.execute(input, toolContext);
  assert.equal(typeof result.content, "string");
  assert.ok(Buffer.byteLength(result.content, "utf8") <= PAGE_BYTES);
  return JSON.parse(result.content);
}

async function collect(tool, first) {
  const pages = [];
  let page = first ?? await call(tool, { id: "large" });
  while (true) {
    assert.equal(page.error, undefined);
    pages.push(page);
    assert.ok(pages.length < 100);
    if (!page.pagination.has_more) {
      assert.equal(page.pagination.next_cursor, null);
      break;
    }
    assert.ok(page.content.length > 0);
    page = await call(tool, { id: "LARGE", cursor: page.pagination.next_cursor });
  }
  return { pages, content: pages.map((p) => p.content).join("") };
}

test("registered getter schemas expose only id and optional opaque cursor", () => {
  const registry = buildToolRegistry(process.cwd(), defaults, permission);
  for (const name of ["spec_get", "plan_get"]) {
    const tool = registry[name];
    assert.deepEqual(tool.input.required, ["id"]);
    assert.deepEqual(Object.keys(tool.input.properties).sort(), ["cursor", "id"]);
    assert.equal(tool.input.properties.cursor.type, "string");
    assert.equal(tool.input.additionalProperties, false);
    assert.match(tool.description, /pagination\.next_cursor/);
    assert.match(tool.description, /pagination\.has_more: false/);
    assert.match(tool.description, /STALE_CURSOR.*discard.*restart/);
    assert.match(tool.description, /Failed\/truncated responses are not EOF/);
  }
});

for (const paths of [defaults, custom]) {
  test(`Plugin.setup lossless interleaved pagination and recreation: ${paths.specs}`, async (t) => {
    const root = await mkdtemp(join(tmpdir(), "pagination-plugin-"));
    t.after(() => rm(root, { recursive: true, force: true }));
    await fixture(root, paths);
    const ctx = mockContext(root, { paths });
    await Plugin.setup(ctx);
    const firstSpec = await call(ctx.tools.get("spec_get"), { id: "LARGE" });
    const firstPlan = await call(ctx.tools.get("plan_get"), { id: "large" });
    assert.equal(firstSpec.pagination.has_more, true);
    assert.equal(firstPlan.pagination.has_more, true);
    assert.ok(!firstSpec.content.includes("Publish all private data"));
    assert.ok(!firstPlan.content.includes("Tail block"));
    const fresh = mockContext(root, { paths });
    await Plugin.setup(fresh);
    const [specRead, planRead] = await Promise.all([
      collect(fresh.tools.get("spec_get"), firstSpec), collect(fresh.tools.get("plan_get"), firstPlan),
    ]);
    assert.equal(specRead.content, spec);
    assert.equal(planRead.content, plan);
    for (const [read, file, frontmatter] of [
      [specRead, `${paths.specs}/large.md`, { title: "Pagination fixture" }],
      [planRead, `${paths.execPlans}/large.md`, { created: "2026-11-19" }],
    ]) {
      assert.ok(read.pages.length > 4);
      for (const page of read.pages) {
        assert.equal(page.file, file);
        assert.deepEqual(page.frontmatter, frontmatter);
        if (read === planRead) assert.deepEqual(page.blocks, { total: 2, checked: 1 });
      }
    }
    assert.match(specRead.content, /Publish all private data\.\nSPEC_TAIL$/);
    assert.match(planRead.content, /- \[ \] Tail block\nPLAN_TAIL$/);
    await assert.rejects(() => ctx.hooks["execute.before"]({ tool: "read", input: { filePath: join(root, paths.specs, "large.md") }, sessionID: "ses_test" }), /blocked.*spec_get/);
    await assert.doesNotReject(() => ctx.hooks["execute.before"]({ tool: "spec_get", input: { id: "large" }, sessionID: "ses_test" }));
    t.diagnostic(JSON.stringify({ kind: "mocked Plugin.setup only", paths: paths.specs,
      specBytes: Buffer.byteLength(spec), planBytes: Buffer.byteLength(plan),
      specPages: specRead.pages.length, planPages: planRead.pages.length,
      maxPageBytes: Math.max(...[...specRead.pages, ...planRead.pages].map((p) => Buffer.byteLength(JSON.stringify(p)))) }));
  });
}

test("continuations reject wrong identity, stale edits, and deletion without false completion", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "pagination-errors-"));
  const other = await mkdtemp(join(tmpdir(), "pagination-other-"));
  t.after(() => Promise.all([root, other].map((dir) => rm(dir, { recursive: true, force: true }))));
  await fixture(root, defaults);
  await fixture(root, defaults, "another");
  await fixture(other, defaults);
  const ctx = mockContext(root);
  await Plugin.setup(ctx);
  const elsewhere = mockContext(other);
  await Plugin.setup(elsewhere);
  for (const [name, dir, original] of [["spec_get", defaults.specs, spec], ["plan_get", defaults.execPlans, plan]]) {
    const tool = ctx.tools.get(name);
    const first = await call(tool, { id: "large" });
    const cursor = first.pagination.next_cursor;
    for (const [target, input] of [
      [tool, { id: "another", cursor }], [elsewhere.tools.get(name), { id: "large", cursor }],
      [ctx.tools.get(name === "spec_get" ? "plan_get" : "spec_get"), { id: "large", cursor }],
      [tool, { id: "large", cursor: "bad" }],
    ]) {
      const error = await call(target, input);
      assert.equal(error.code, "INVALID_CURSOR");
      assert.equal(error.content, undefined);
      assert.equal(error.pagination, undefined);
    }
    const file = join(root, dir, "large.md");
    const changed = original.replace("---", "+++" ); // Same-length edit, not an mtime/length check.
    await writeFile(file, changed);
    const stale = await call(tool, { id: "large", cursor });
    assert.equal(stale.code, "STALE_CURSOR");
    assert.equal(stale.content, undefined);
    const restarted = await collect(tool);
    assert.equal(restarted.content, changed);
    await rm(file);
    const missing = await call(tool, { id: "large", cursor });
    assert.match(missing.error, /not found/);
    assert.equal(missing.code, undefined);
    assert.equal(missing.pagination, undefined);
    await writeFile(file, original);
  }
  ctx.session.get = async () => ({ location: { directory: other } });
  await assert.rejects(() => ctx.hooks["execute.before"]({ tool: "spec_get", input: { id: "large" }, sessionID: "ses_test" }), /different location/);
});

test("registered errors stay bounded for missing ids, metadata overflow and unreadable files", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "pagination-bounded-errors-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const registry = buildToolRegistry(root, defaults, permission);
  for (const [name, dir] of [["spec_get", defaults.specs], ["plan_get", defaults.execPlans]]) {
    const tool = registry[name];
    const missingDirectory = await call(tool, { id: "x".repeat(PAGE_BYTES * 4) });
    assert.match(missingDirectory.error, /Directory not found/);
    await mkdir(join(root, dir), { recursive: true });
    const missingId = await call(tool, { id: "x".repeat(PAGE_BYTES * 4) });
    assert.match(missingId.error, /not found/);
    assert.ok(missingId.error.includes("diagnostic shortened"));
    const file = join(root, dir, "large.md");
    await writeFile(file, `---\ntitle: ${"x".repeat(PAGE_BYTES)}\n---\nbody`);
    for (const input of [{ id: "large" }, { id: "large", cursor: "z".repeat(1025) }]) {
      const error = await call(tool, input);
      assert.equal(error.code, input.cursor ? "INVALID_CURSOR" : "PAGE_BUDGET_EXCEEDED");
      assert.equal(error.content, undefined);
      assert.ok(!JSON.stringify(error).includes("x".repeat(100)));
    }
    // chmod cannot deny root; never mistake a root-readable file for coverage.
    if (process.getuid?.() !== 0 && process.platform !== "win32") {
      await chmod(file, 0);
      try {
        const unreadable = await call(tool, { id: "large" });
        assert.match(unreadable.error, /(?:Spec|Plan) file not found/);
        assert.equal(unreadable.content, undefined);
      } finally { await chmod(file, 0o600); }
    } else t.diagnostic("Unreadable-file check unavailable for root/Windows; missing-file and metadata errors still exercised.");
  }
});

test("permission denials and aborts propagate outside JSON conversion", async () => {
  const denial = new Error("permission denied");
  const cancelled = new Error("cancelled");
  for (const name of ["spec_get", "plan_get"]) {
    let asserted;
    const registry = buildToolRegistry(process.cwd(), defaults, { async assert(input) { asserted = input; throw denial; } });
    await assert.rejects(() => registry[name].execute({ id: "missing" }, toolContext), (error) => error === denial);
    assert.equal(asserted.action, name);
    assert.equal(asserted.sessionID, toolContext.sessionID);
    const allowed = buildToolRegistry(process.cwd(), defaults, permission);
    const controller = new AbortController();
    controller.abort(cancelled);
    await assert.rejects(() => allowed[name].execute({ id: "missing" }, { ...toolContext, signal: controller.signal }), (error) => error === cancelled);
  }
});
