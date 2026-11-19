---
created: 2026-11-19
---

## Goal

Paginate Specification and Plan Reads

## Functional objective

Users and agents must be able to read large specifications and execution plans without losing content to an oversized tool response. A reader must know when more content remains and retrieve it until the document is complete. If an artifact changes during the read, the tools must report that change instead of presenting a mixture of versions as one document.

## Scope

### In scope
- Implement the current approved `artifact-read-pagination` specification for `spec_get` and `plan_get` only.
- Shared bounded pagination, opaque version-bound cursors, whole-document metadata, and bounded failure responses.
- Registered OpenCode tool schemas and descriptions, retained consumer prompts, regression tests, public API documentation, and release-facing changelog.
- A reproducible supported-OpenCode verification procedure and recorded host compatibility evidence before release.

### Out of scope
- Other getters, list/state/write operations, artifact storage migrations, or new tool names and permissions.
- Configurable page sizes, unbounded modes, random-access ranges, streaming filesystem reads, retained snapshots, locking, or update concurrency control.
- Retired-agent cleanup, unrelated OpenCode migration/documentation repairs, or changes to review scopes and delegation policies.
- Implementing any application change during architecture authorship.

## Building blocks

- [x] **Bloc 1 — Shared pagination and cursor primitives**

  Add a shared internal pagination module under `tools/`, with focused `node:test` coverage in `tests/`. It accepts a complete decoded document and its existing metadata, produces a lossless page, and supplies bounded serialization/error helpers for the next block. This block does not change either public getter or activate pagination; the existing public behavior remains intact until its consumers are updated in Bloc 2. Use Node builtins only, and keep cursor decoding and response-size policy shared by both getters.

  Done when:
  - Automated tests verify that complete `JSON.stringify` output, measured using `Buffer.byteLength(serialized, "utf8")`, never exceeds 16,384 bytes for every successful helper response and every helper-generated error.
  - Tests reconstruct the original decoded string exactly from all pages for empty input, one-page input, documents larger than four page budgets, long single lines, LF/CRLF, a missing final newline, quotes, backslashes, escaped control characters, accented characters, and emoji at candidate boundaries. Each successful nonfinal page advances by at least one complete code point; iteration terminates without duplicates or omissions.
  - Boundary tests include envelopes at and around the limit, final versus nonfinal pagination-envelope sizes, complete-line preference where a line fits, forced splitting where it does not, preservation of surrogate pairs, and CRLF preservation when possible while advancing. Tests derive expected splits from the byte contract, not a hardcoded character-count assumption.
  - Tests confirm that repeated file/frontmatter/blocks metadata is included in the size calculation, a metadata-only envelope that is too large returns `PAGE_BUDGET_EXCEEDED`, and insufficient room for a remaining code point returns that error rather than an empty nonfinal page.
  - Cursor tests cover the tool family, current-project artifact identity, a digest of the complete decoded text, continuation position, a versioned encoding, deterministic repeated input, and acceptance by a fresh pagination-module instance with no retained cache. No cursor field is used as a path or authorization source.
  - Invalid/empty/over-1,024-byte cursors, unsupported encodings or versions, wrong-tool or wrong-artifact markers, and out-of-range or split-surrogate positions return `INVALID_CURSOR`. A valid cursor used with changed decoded text returns `STALE_CURSOR`, including a same-length edit; error strings are bounded and never echo the marker or document.
  - `npm test` and `npm run lint` pass with no external dependency added. Public getter behavior and all existing tool permissions are unchanged by this isolated preparation block.

- [x] **Bloc 2 — Activate paged getters and update every retained consumer together**

  Depend on Bloc 1. In `tools/lifecycle.js`, extend `specGet(projectRoot, paths, id)` and `planGet(projectRoot, paths, id)` with an optional cursor argument and make them always return the specified bounded page instead of the full text. Preserve existing resolution and parsing/counting logic, using the same read for content, metadata, and version identity. In `tools/registry.js`, add the optional string `cursor` schema and pass it through; apply bounded JSON serialization to both getter success and error paths only. Activate the protocol in the same atomic deliverable as retained consumer guidance and public API documentation, so no release can expose silently partial reads.

  Done when:
  - Direct-handler tests in `tests/lifecycle.test.js` exercise each getter without a cursor and through all continuations; small files still return complete content plus final pagination, large files paginate, and `file`, `frontmatter`, and plan `blocks` retain whole-document semantics on every page. Include empty content, absent/malformed frontmatter under the current parser, and checked/unchecked plan blocks located beyond page one.
  - Both registered getter schemas require only `id`, allow optional string `cursor`, retain `additionalProperties: false`, and expose no size/unbounded arguments. Tool descriptions explain continuation through `has_more: false`, opaque `next_cursor`, and stale-read restart.
  - Registered-tool tests inspect the exact returned `result.content` string and assert `Buffer.byteLength(result.content, "utf8") <= 16384` for all pages and JSON failure responses. Include very long invalid IDs and missing/unreadable-file diagnostics; shortening those errors must preserve failure meaning and must not emit a successful page. Pagination failures include their stable `code` and no partial `content` field.
  - Case-insensitive ID resolution and custom configured artifact paths still work. Cursor reuse after an actual file edit fails stale, after deletion fails as a missing artifact, across projects/artifact IDs/getter families fails invalid, and through a freshly built registry succeeds for the same unchanged artifact. Each call resolves its `id` through the existing path rules before using a cursor position.
  - Existing permission assertions and abort checks in the registry remain outside error-to-content conversion. Permission denial and cancellation still propagate as host failures rather than becoming page data; pagination does not broaden permissions or bypass the artifact guard.
  - Add explicit continuation instructions to `agents/team-lead.md`, `agents/architect.md`, `agents/spec-validator.md`, `agents/spec-writer.md`, `agents/spec-reviewer.md`, `agents/plan-reviewer.md`, `agents/plan-functional-reviewer.md`, `agents/plan-technical-reviewer.md`, and `agents/plan-code-reviewer.md`. Whole-artifact tasks must exhaust cursors before conclusions; failed/truncated pages are not end-of-file; `STALE_CURSOR` discards accumulated pages before restart. Do not change their scope, verdicts, delegation rules, or existing approval/error-escalation ownership.
  - Prompt contract tests in `tests/permissions.test.js` verify those nine retained readers mention the completion condition, continuation marker, and stale-read handling, and reject the old one-call-full-content descriptions in `agents/team-lead.md`. Preserve the existing agent-default/registration oracle in `tests/agent-registry.test.js`; prompt changes do not authorize altering frozen permission/default baselines in `tests/agent-baseline.js`.
  - Update getter signatures and examples in `README.md` and `website/lifecycle-tools.md`; correct the getter descriptions in ordinary `docs/architecture.md` where they imply an entire document per call. Document 16 KiB as a plugin policy, whole-document repeated metadata, oversized-metadata errors, and the behavioral compatibility change for id-only calls. Add one user-facing `CHANGELOG.md` entry under `[Unreleased]` for reliable paged reading of large specs/plans. Do not use implementation tools to edit protected specifications as part of this block.
  - `npm test` and `npm run lint` pass. Tests in `tests/agent-registry.test.js` and `tests/v2-context.test.js` continue to prove unchanged agent registration, project isolation, and guard/permission behavior. Getter runtime and consumer changes are submitted and reverted as one unit; no storage migration is needed.

- [ ] **Bloc 3 — End-to-end regression evidence and real-host compatibility gate**

  Depend on Bloc 2. Extend plugin-level regression coverage using `tests/v2-helper.js`, `tests/lifecycle.test.js`, and `tests/v2-context.test.js` as appropriate, and add an ordinary documentation procedure at `docs/testing/artifact-pagination.md`. Verify the complete path from a registered plugin tool to reconstructed artifact text, including a supported real OpenCode host. This deliverable supplies release evidence rather than assuming a mocked registration proves transport compatibility.

  Done when:
  - Tests run through `Plugin.setup`/registered tool execution with both default and custom artifact locations, retrieve a large spec and a large plan across multiple pages, and compare the reconstruction with the original fixture string and complete metadata/block counts. The fixtures contain unique tail markers and long escaped/multibyte lines to detect first-page-only or character-count-only implementations.
  - Regression tests cover interleaved reads, continuation after registry/plugin recreation, cross-project cursor rejection, failed continuation without false completion, and stale restart reconstructing the new file from its beginning. Include a later-page plan checkbox and a relevant constraint beyond page one.
  - `docs/testing/artifact-pagination.md` contains reproducible fixture creation and call-loop steps, byte/reconstruction checks, stale-cursor and oversized-metadata cases, and a result template recording OpenCode version, plugin revision, model/provider where relevant, fixture byte sizes, number of pages, maximum observed response bytes, and observed completion/error behavior. Use a disposable project rather than protected production artifacts.
  - A supported real OpenCode run is recorded using the template: both getters finish a document of at least four page budgets with no truncation/output-limit error, tail markers are reached, and concatenation matches the source. A retained reader completes a full multi-page read; for review, a deliberately conflicting rule at the tail is detected, demonstrating that page one was not treated as the entire specification. Changed-file continuation reports `STALE_CURSOR` and restarts without mixing versions.
  - If the real-host run is unavailable, truncated, or fails, record the exact blocker and keep this gate incomplete; do not infer success from unit tests. If 16,384-byte tool content does not leave sufficient host headroom, stop release, revise and reapprove the size policy in the specification and affected plan, and rerun the tests. Do not silently override the approved bound.
  - Final verification records successful `npm test`, `npm run lint`, and `npm --prefix website run build`. Review the changed-file list against scope: no artifact-format migration, tool/permission additions, unrelated agent redesign, or runtime dependency change.

## Decision log

2026-11-19 — The user accepted automatic cursor pagination for `spec_get` and `plan_get` after comparison with keeping whole-document responses, increasing host limits, and line-count-only pagination. Rationale: bound the actual serialized response while permitting lossless complete reads and detecting mixed versions.

2026-11-19 — Governing specification: `artifact-read-pagination` (`docs/specs/artifact-read-pagination.md`), structurally valid with no issues and semantically `APPROVED` by `spec-validator` before plan creation. The 16,384-byte initial policy is provisional only with respect to real-host compatibility; successful compatibility verification is a release gate, not evidence already obtained.

2026-11-19 — Keep a nonactivated helper step, then activate handlers, registration, consumer prompts, and API documentation together. Rationale: incremental implementation is possible without releasing a state where an agent silently reviews only the first page. Roll back activation and its consumer guidance together if needed; stored files remain unchanged.

## Verification and handoff status

2026-11-19 — Blocs 1 and 2 are implemented and validated: bounded shared pagination, activated getters/registration, nine retained-reader prompts, public documentation, and regression coverage. Automated verification passed: 159 tests with zero failures/skips, lint, website build, and diff whitespace checks. Mocked Plugin.setup runs reconstructed default/custom-path fixtures (spec 128,814 bytes; plan 128,773 bytes) in 10 pages each, with maximum serialized page size 16,384 bytes. Reproducible verification steps and evidence are recorded in `docs/testing/artifact-pagination.md`.

Bloc 3 remains incomplete solely at its real-host compatibility/retained-reader gate. The user explicitly instructed that OpenCode commands must not be run because they cause crashes; no real-host run was attempted after that instruction. Mocked tests do not establish host transport compatibility or demonstrate an LLM review detecting the tail contradiction. The actual host ceiling remains unknown. Do not mark Bloc 3 complete or release on the strength of the automated results alone; obtain authorized real-host evidence using the documented procedure.
