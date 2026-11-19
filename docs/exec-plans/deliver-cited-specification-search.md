---
created: 2026-11-19
---

## Goal

Deliver Cited Specification Search

## Functional objective

Agents need to find relevant specification rules without loading every document into their context. They must receive exact passages with verifiable source citations and be able to expand a selected section from the same document version. This delivery adds that navigation capability without weakening complete-document review obligations or existing access controls.

## Scope

### In scope

- Deliver the accepted architecture governed by [Cited Specification Search](../specs/cited-specification-search.md), specification id `cited-specification-search`.
- Local, per-call lexical passage indexing of configured specification Markdown, with exact source positions and SHA-256 version identities.
- Read-only `spec_search` and bounded, version-checked `spec_read_section`, using the approved public signatures and error contract.
- Additive lifecycle registration and read-only grants for existing specification readers, retaining location isolation, protected-artifact access and user overrides.
- Focused retained-agent instructions, public documentation, automated regression coverage and a supported-OpenCode smoke test.

### Out of scope

- Knowledge graphs, semantic search, embeddings, translation, generated answers, external services and new runtime dependencies.
- Persistent indexes, watchers, recursive discovery, configurable result counts, search pagination or corpus-wide atomic snapshots.
- Changes to existing artifact storage formats, existing getter contracts, authoring responsibilities, delegation boundaries or reviewer verdicts.
- Broader team-lead redesign, retired-agent routing cleanup, unrelated documentation modernization or changes to other artifact families.
- Implementing code or coordinating delivery as part of Architect's artifact-authoring session.

## Building blocks

- [x] **Bloc 1 — Build exact-source corpus and section primitives**

  Add internal retrieval primitives in a dedicated `tools/spec-retrieval.js` module, keeping `tools/lifecycle.js` focused on existing lifecycle operations. Resolve the configured specification directory and eligible files safely inside the plugin project; build a fresh per-call in-memory corpus without registering public tools yet. Implement decoded-document hashing, original line/offset mapping, fenced-code-aware ATX heading detection, hierarchical section bounds, and deterministic passage segmentation. Share an existing helper only when its behavior matches the approved contract; the existing directory helper's swallowed errors and existing identifier resolver's first-match behavior are not suitable substitutes for the new error and ambiguity rules. Add `tests/spec-retrieval.test.js` using `node:test` and isolated temporary fixtures.

  Done when:
  - Tests establish nonrecursive `.md` discovery, exclusion of individual symlink entries, inclusion of all legacy/missing metadata statuses, filename-stem lookup compatibility, duplicate-case ambiguity rejection and custom configured spec paths.
  - Realpath containment tests reject a configured directory that escapes the project through a symlink or traversal, and reject identifiers/selectors interpreted as filesystem paths. Safe in-project aliases do not escape the same containment checks.
  - Tests verify lowercase SHA-256 over the complete decoded text, including frontmatter and line endings, and matching version identity with existing pagination for the same decoded string.
  - Citation offsets and inclusive one-based lines are exact for LF, CRLF, trailing newlines, missing final newlines, blank lines, Unicode and an empty document. A deliberately inconsistent frontmatter `id` does not replace the filename-stem lookup identifier.
  - Section fixtures cover repeated heading titles, missing heading levels, closing heading hashes, preambles, no recognized headings, nested headings, frontmatter heading-like text, backtick/tilde fences of varying lengths and supported indentation. Unsupported heading styles remain searchable text rather than disappearing.
  - Direct-text passage bounds stop before the next recognized heading; contextual section bounds include descendant headings and stop at an equal-or-higher ancestor level. Passages are contiguous, at most 2,000 Unicode code points and preserve surrogate pairs and CRLF pairs.
  - Missing spec directories produce an empty corpus; non-ENOENT directory failures and any eligible-file read failure produce `CORPUS_UNAVAILABLE`, not an apparently successful partial corpus. Use deterministic injected read/enumeration failures when filesystem permissions cannot reliably reproduce unreadability.
  - `npm test` passes with the new internal primitives unregistered and existing tool contracts unchanged.

- [x] **Bloc 2 — Deliver deterministic cited lexical search internally**

  Depending on Bloc 1, implement the internal `spec_search` handler in `tools/spec-retrieval.js` with the approved string-only arguments, Unicode tokenization, filters, deterministic lexical ranking, exact excerpts and mandatory citation envelope. Bound the complete serialized response rather than only the excerpt length. Keep the handler unregistered until the coherent activation in Bloc 4; add search tests to `tests/spec-retrieval.test.js`.

  Done when:
  - Tests accept ordinary text with case-insensitive Unicode letter/number tokens and OR semantics; reject no-token, over-512-UTF-8-byte and over-32-distinct-token queries with `INVALID_QUERY`. Regex and boolean-looking input is treated as ordinary text, not executable syntax.
  - ID, type and status filters follow the approved contract, including case-insensitive matching, empty-filter `INVALID_ARGUMENT`, unknown-ID `SPEC_NOT_FOUND` and successful empty metadata-filter matches.
  - Table-driven fixtures verify heading/title weighting over otherwise equivalent body-only matches, increased relevance for additional distinct matches, deterministic file-path/source-offset ties, and at most one metadata-only candidate per document.
  - Every returned hit has all approved source fields, a nonempty exact contiguous excerpt, actual inclusive source lines, exact heading ancestry, correct partial-line flags, the actual project-relative path and the matching complete-document hash. A test reconstructs each excerpt from the source rather than comparing only display strings.
  - Response tests verify `corpus_files`, `matched_passages`, no more than five results and correct `truncated` for count and byte omissions, including empty corpora, zero matches and more than five candidates.
  - JSON-escaped control characters, quotes, backslashes, multibyte text, very long lines and oversized heading/title metadata cannot exceed 16,384 serialized UTF-8 bytes. Excerpt shortening preserves matching evidence and recomputes citation flags; an unrepresentable top-result envelope returns `PAGE_BUDGET_EXCEEDED` without dropping required source fields or skipping to a lower result.
  - Consecutive queries reflect completed create/delete/edit operations and same-size edits with restored modification times. Tests model branch replacement by replacing the fixture corpus between calls, without requiring Git commands in the retrieval engine.
  - `npm test` passes; this block adds no callable public tool or permission grant.

- [x] **Bloc 3 — Deliver version-checked section reading internally**

  Depending on Bloc 1, add the internal `spec_read_section` handler and a focused section-pagination adapter in `tools/spec-retrieval.js`. Reuse the byte-budget and code-point-safe boundary principles from `tools/artifact-pagination.js`, but do not change existing getter cursor identities or behavior. The new cursor identity must bind the tool, resolved project/file, selector, expected whole-document hash and section-relative offset. Add section-reader fixtures and keep the handler unregistered until Bloc 4.

  Done when:
  - Tests feed actual search-result selectors and hashes into section reading, and assert exact contextual subtree content, repeated whole-section source metadata, null bounds for an empty document, and exclusion of neighboring unrelated sections.
  - Initial changed-source reads return `STALE_SOURCE` without text, even when old line selectors still resolve and file size/timestamps are unchanged. Missing files, unreadable selected files, ambiguous IDs, malformed hashes and missing sections produce their specified non-success errors.
  - A large section is reconstructed exactly by concatenating all successful pages through `has_more: false`, with final `next_cursor: null`. Test LF/CRLF, a single long line, escaped controls, Unicode, duplicate headings, empty and one-page sections, and sections beginning near the end of a large file.
  - Nonfinal pages make code-point-safe progress. Every page and diagnostic is at most 16,384 serialized UTF-8 bytes; oversized required metadata produces `PAGE_BUDGET_EXCEEDED` instead of missing fields or a stalled cursor.
  - Cursor tests reject malformed, empty, unsupported-version, over-1,024-byte, wrong-tool, wrong-project, wrong-file, wrong-section, wrong-expected-hash and invalid-offset inputs with `INVALID_CURSOR`. Existing getter cursors cannot be used with the section reader or vice versa.
  - A valid continuation after an edit returns `STALE_CURSOR` with no partial page; a deleted source fails rather than looking like a final page. Recreating handlers against unchanged sources preserves cursor validity, and interleaving calls across independent projects cannot mix content or identities.
  - `npm test` passes, including all unchanged getter-pagination unit and integration tests.

- [x] **Bloc 4 — Activate tools, scoped permissions and consumer guidance together**

  Depending on Blocs 1–3, register both handlers through `tools/registry.js`, add both names to `LIFECYCLE_TOOLS` in `tools/artifact-guard.js`, and grant both read-only tools in `config/agents.js` only to retained agents with existing `spec_get` access. Preserve permission assertions before filesystem work and outside JSON failure conversion; retain the location refusal in `index.js` by using the shared lifecycle set rather than bypassing the hook. In this same deliverable, update affected retained-agent prompts, `README.md`, `website/lifecycle-tools.md` and relevant architecture/agent documentation to teach citation, stale-source recovery, bounded section continuation and unchanged whole-document review obligations. Add the user-facing feature entry under `CHANGELOG.md` Unreleased. This is the first block that may expose the tools publicly; do not release runtime activation without the matching instructions and permissions.

  Done when:
  - A new `tests/spec-retrieval-integration.test.js` verifies registered JSON Schemas exactly: search requires `query` with optional string `id`, `type`, `status`; section reading requires string `id`, `section_id`, `source_hash` with optional string `cursor`; unknown properties are rejected by the declared schema. Registry tool count is 23, without removing existing names.
  - Plugin.setup integration tests exercise both tools at default and custom paths, verify exact citations and section reassembly from registered responses, and measure the actual returned `content` string's full byte size on success and all failure classes.
  - Permission-denied and pre-aborted invocations propagate as host failures rather than successful JSON output and do not enumerate/read the corpus. Tests cover permission context, both new action names, preserved user-deny precedence and independent user agents remaining untouched.
  - A policy matrix in `tests/permissions.test.js` proves every retained `spec_get` reader receives both new read-only grants and agents without `spec_get` do not. In particular, `plan-reviewer` remains an orchestrator without spec-reading access; no writing, delegation, shell or other artifact-family permissions broaden.
  - Tests cover the existing cross-location refusal for both new lifecycle names, simultaneous independent plugin locations, rejection of cross-project section cursors, and continued blocking of direct read/glob/grep access to protected source paths.
  - The frozen-agent comparison in `tests/agent-registry.test.js` accounts narrowly for these two intentional additive read grants while preserving the original baseline and detecting every unrelated default/registration change. Update explicit lifecycle-name assertions in existing tests without weakening their non-retrieval guarantees.
  - Prompt/documentation assertions verify that permitted consumers can search optionally, cite real paths and line ranges, preserve hashes when handing off evidence, recover from `STALE_SOURCE`/`STALE_CURSOR`, follow section pagination when complete context is required and never treat empty/top-five search as exhaustive. Reviewers retain required full-document getter reads and existing scope/verdict rules; do not add tool-use instructions to agents lacking permission.
  - Documentation explains lexical and cross-language limits, all-status defaults, per-call freshness and non-atomic concurrent reads, supported section syntax, fixed top-five and 16 KiB limits, and the unchanged purpose of `spec_get`/`plan_get`. All new code, docs and changelog text is English.
  - `npm test` and `npm run lint` pass. If website pages change, `npm --prefix website run build` also passes. No implementation-time edits to this approved source spec are required; any substantive contract correction returns through acceptance/validation/review before dependent delivery continues.

- [ ] **Bloc 5 — Verify supported-host behavior and release handoff**

  Depending on Bloc 4, run a real supported-OpenCode smoke test, distinct from mocked Plugin.setup tests. Load the plugin in an isolated fixture location and exercise search, source verification, complete section pagination, permission denial and stale-source recovery through the host's actual registered tools. Record the host/plugin versions, fixture sizes, maximum serialized response size, observed transport behavior and exact test commands in an ordinary release-verification report such as `docs/retrieval-verification.md`. This block is a release gate, not authority to commit, tag, publish or implement during Architect's current session.

  Done when:
  - An agent uses actual returned citations to locate a fixture rule and reads only its relevant section; an independent source comparison verifies the path, lines, exact excerpt and complete decoded-content SHA-256.
  - A section larger than 16 KiB is retrieved through all host-returned cursors and compared exactly with the fixture. The host does not truncate/reject compliant payloads, and failure cases do not look like successful empty results or final pages.
  - A manual same-size source edit triggers `STALE_SOURCE` on initial expansion and `STALE_CURSOR` after a first page; restarting from search retrieves only the new version. Switching the fixture corpus between calls exposes fresh results without a plugin restart.
  - A denied action does not return source content, and a session-location change is refused for both tool names. No network service, index files or source-file modifications are produced by retrieval.
  - The report distinguishes successful real-host checks from mocked automation and records any skipped or blocked check explicitly. An unavailable host or insufficient transport headroom blocks release rather than being marked complete; a contract/budget change requires a newly validated and semantically reviewed specification before implementation is adjusted.
  - Final `npm test`, `npm run lint` and the website build when applicable pass, and the report links the approved spec and this plan with their current review results.

## Decision log

2026-11-19 — The user explicitly accepted lexical passage retrieval with mandatory source citations and targeted section expansion, then requested this specification and execution plan. The decision solves finding and verifying rules without loading the complete spec corpus; knowledge graphs and semantic search are deferred.

2026-11-19 — Governing specification: `cited-specification-search` at `docs/specs/cited-specification-search.md`. Structural validation returned `valid: true` with no issues; `spec-validator` returned explicit `APPROVED` for its current content before this plan was created. Related contracts checked by that review include `lifecycle-tools`, `artifact-read-pagination`, `architect-agent`, `spec-validator-agent` and `unified-agent-registry`.

2026-11-19 — Build a fresh in-memory index per search. Rationale: the current small corpus does not justify persistent state, watchers or cache invalidation; rereading detects manual/branch changes and preserved-timestamp edits. Query CPU and I/O scale with corpus size; later optimization requires measured need rather than an index service now.

2026-11-19 — Internal helpers may land without registration; runtime tools, their scoped grants and consumer instructions activate together in Bloc 4. Before activation rollback is removal of unused helpers; after activation rollback is reverting that coherent activation deliverable, retaining original getters and untouched Markdown sources. No data backfill or destructive migration is required. A released-tool removal would be a separate user-visible compatibility decision, not an automatic rollback promise.

2026-11-19 — No unresolved architectural or user choices remain. Numeric limits, corpus scope, stateless version checks, permission scope and review obligations are governed by the approved specification. Exact ranking implementation may be chosen within its tested observable rules; changing the public contract is not an implementation detail.
