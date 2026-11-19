# Artifact pagination verification

## Scope and release gate

`spec_get` and `plan_get` must bound each complete JSON tool-content string to
16,384 UTF-8 bytes, reconstruct the source exactly, and detect changed files.
That bound is plugin policy, **not an established OpenCode transport limit**.
Mocked registration tests do not establish host compatibility or prove that a
model reads beyond page one.

The real-host gate below must pass before release. Do not start OpenCode or run
its CLI as part of this procedure without authorization: the current run was
explicitly restricted because OpenCode commands caused crashes.

## Automated regression checks

From the plugin checkout:

```sh
npm test
npm run lint
npm --prefix website run build
```

Coverage lives in `tests/artifact-pagination.test.js`,
`tests/artifact-pagination-integration.test.js`, `tests/lifecycle.test.js`, and
`tests/permissions.test.js`. It includes byte/envelope boundaries, Unicode,
escaping, CRLF, giant lines, malformed cursors, whole-file metadata, registered
schemas, default/custom locations, interleaving, plugin recreation, invalid
cross-project/document/tool reuse, stale restart, deletion, bounded errors,
permission/cancellation propagation, guard behavior, and retained-reader prompts.

## Disposable host fixtures

Use a new disposable project, never production specs or plans. This standalone
Node script prints its location and writes fixtures plus a source manifest:

```sh
node --input-type=module <<'JS'
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const root = await mkdtemp(join(tmpdir(), "artifact-pagination-smoke-"));
const body = ('long escaped line: "\\\u0000 é😀' + "x".repeat(400)).repeat(300);
const fixtures = {
  spec: ['docs/specs/large.md', '---\ntitle: "Pagination fixture"\ntype: technical\nstatus: draft\n---\n## Purpose\nExercise complete reads.\n## Behavior\nAlways keep data private.\n' + body + '\nPublish all private data.\n## Constraints\nSPEC_TAIL\n## Examples\nExample.'],
  plan: ['docs/exec-plans/large.md', '---\ncreated: 2026-11-19\n---\n## Functional objective\nExercise complete reads.\n## Building blocks\n- [x] First block\n' + body + '\n- [ ] Tail block\nPLAN_TAIL'],
};
const manifest = {};
for (const [kind, [file, text]] of Object.entries(fixtures)) {
  await mkdir(join(root, file, ".."), { recursive: true });
  await writeFile(join(root, file), text);
  manifest[kind] = { file, bytes: Buffer.byteLength(text), sha256: createHash("sha256").update(text).digest("hex") };
}
await writeFile(join(root, 'docs/specs/oversized.md'), '---\ntitle: ' + 'x'.repeat(16384) + '\n---\nbody');
await mkdir(join(root, "results"));
await writeFile(join(root, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(root);
console.log(JSON.stringify(manifest, null, 2));
JS
```

Each source exceeds four page budgets. The giant escaped/multibyte line tests
byte-based splitting. The contradictory spec rule and unchecked plan block are
deliberately beyond page one.

Once authorized, configure the disposable project to load this checkout as its
local plugin (see the README installation instructions). Use a supported host
and record its version from its UI/about information; this procedure does not
require a CLI version command. Reload the plugin only when authorized.

## Registered-tool call loop and exact checks

1. Call `spec_get({ id: "large" })` and `plan_get({ id: "large" })` through
   OpenCode's registered plugin tools, not by importing the helper. Interleave
   the reads. Each result must contain `file`, `content`, `frontmatter`, and
   `pagination`; plans also contain `blocks` covering the entire plan.
2. Save each exact raw tool-content string, before rendering or reserialization.
   For each getter, append `JSON.stringify(rawToolContentString)` plus a newline
   to `results/spec.jsonl` or `results/plan.jsonl` in the disposable project.
   These are JSON strings, not parsed page objects. If the host cannot expose
   exact raw results, record that limitation; rendered screenshots alone cannot
   establish byte bounds or exact reconstruction.
3. While `pagination.has_more` is true, pass its unchanged `next_cursor` as
   `cursor`, keeping the same getter and id. Stop only at `has_more: false` with
   `next_cursor: null`. Errors/truncation are failures, never EOF.
4. Run this verifier from the disposable project, not the plugin checkout:

```sh
node --input-type=module <<'JS'
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
for (const kind of ["spec", "plan"]) {
  const raw = (await readFile(`results/${kind}.jsonl`, "utf8")).trim().split("\n").map(JSON.parse);
  assert.ok(raw.every((value) => typeof value === "string"));
  const sizes = raw.map((value) => Buffer.byteLength(value, "utf8"));
  assert.ok(sizes.every((size) => size <= 16384));
  const pages = raw.map(JSON.parse);
  assert.ok(pages.length > 1);
  for (const [index, page] of pages.entries()) {
    assert.equal(page.error, undefined);
    assert.equal(page.file, manifest[kind].file);
    assert.deepEqual(page.frontmatter, pages[0].frontmatter);
    if (kind === "plan") assert.deepEqual(page.blocks, { total: 2, checked: 1 });
    assert.equal(page.pagination.has_more, index < pages.length - 1);
    if (page.pagination.has_more) {
      assert.ok(page.content.length > 0);
      assert.equal(typeof page.pagination.next_cursor, "string");
    } else assert.equal(page.pagination.next_cursor, null);
  }
  const text = pages.map((page) => page.content).join("");
  assert.equal(text, await readFile(manifest[kind].file, "utf8"));
  assert.ok(text.includes(kind === "spec" ? "SPEC_TAIL" : "PLAN_TAIL"));
  assert.equal(createHash("sha256").update(text).digest("hex"), manifest[kind].sha256);
  console.log({ kind, fixtureBytes: manifest[kind].bytes, pages: pages.length, maxPageBytes: Math.max(...sizes) });
}
JS
```

Repeat against configured custom artifact directories. If testing authorized
plugin recreation, obtain a cursor, reload without editing the artifact, and
confirm continuation still reconstructs the original.

## Error recovery and retained-reader checks

- **Stale:** start a fresh read and retain its first cursor. Edit one character
  in that disposable source, preserving length, then continue with the old
  cursor. Expect `STALE_CURSOR` with no partial `content` or success pagination.
  Discard every old page and restart without a cursor. Save the new source hash
  in the manifest and verify the restarted reconstruction separately; never
  append new-version pages to an old capture.
- **Invalid:** pass a cursor to the other getter or another artifact. Expect
  `INVALID_CURSOR`, no partial content, and a bounded error.
- **Metadata overflow:** call `spec_get({ id: "oversized" })`. Expect bounded
  `{ error, code: "PAGE_BUDGET_EXCEEDED" }`, no document content, and no success
  pagination. Retrying unchanged metadata must not be presented as recovery.
- **Retained reader:** ask an authorized `spec-validator` to review `large` in
  full under its existing delegation policy. Confirm in the tool trace that it
  exhausts the cursor and detects the contradictory privacy/publication rules
  at the tail. A prompt test or a model merely repeating `SPEC_TAIL` is not a
  completed review. Also have a retained plan reader reach `PLAN_TAIL` and
  acknowledge the unchecked tail block. Do not change review ownership or
  permissions to run this test.

Any host truncation/output-limit error blocks release. If 16,384 bytes does not
leave enough headroom, revise and reapprove the governing spec and plan before
changing the bound; do not silently lower it just for the smoke test.

## Result record

| Field | Current evidence (2026-11-19) |
|---|---|
| Plugin revision | Base `055d5dffce598d48b0752aa58416b933eb3e7538` plus uncommitted pagination changes |
| Node | `v26.13.0` |
| Automated checks | 159 tests passed, zero failed/skipped; lint and website build passed; `git diff --check` passed |
| Mocked fixtures | Spec 128,814 bytes; plan 128,773 bytes; 10 pages each; maximum response 16,384 bytes; default and custom paths |
| Mocked completion | Exact reconstruction, tail markers, complete metadata/blocks, stale restart, bounded errors verified |
| Supported real host / version | **NOT RUN** |
| Model / provider | Not exercised for the retained-reader host check |
| Exact blocker | User instructed not to run OpenCode commands because they cause crashes; no real-host run attempted after that instruction |
| Real-host completion / errors | Unknown; mocked tests are not transport or LLM-review evidence |
| Release gate | **INCOMPLETE**; execution-plan Bloc 3 remains unchecked |

For a future authorized run, append the host version, exact plugin revision,
model/provider, default/custom paths, fixture sizes/hashes, per-getter page
counts and maximum raw bytes, capture locations, completion/tail observations,
review verdict/contradiction finding, stale-restart result, metadata-overflow
result, and any truncation or errors. Mark the gate complete only with all
required real-host evidence.
