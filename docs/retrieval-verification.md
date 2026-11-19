# Cited specification retrieval verification

## Delivery and release status

Implementation blocks 1–4 are complete. **Release gate: incomplete.** The full
isolated, supported-host smoke test in block 5 has not been completed.

Governing artifacts:

- [Cited Specification Search](specs/cited-specification-search.md): structurally
  valid; explicit `spec-validator` verdict `APPROVED` on the implemented contract.
- [Delivery plan](exec-plans/deliver-cited-specification-search.md): structurally
  valid; functional, technical and code-feasibility reviewers approved their
  respective checks. The review orchestrator returned `BLOCKED` because an extra
  spec-reading request exceeded the code reviewer's scope. The user subsequently
  accepted the plan and authorized implementation. This is not a recorded global
  `APPROVED` verdict from the plan-reviewer.

The user prohibited the OpenCode CLI after reporting application crashes. No
OpenCode CLI command, new host process, or application restart was used after
that restriction. Ordinary calls to already exposed tools were safe to exercise;
they do not replace the missing isolated-host checks below.

## Environment (2026-11-19)

| Item | Observed value |
|---|---|
| Base revision | `055d5dffce598d48b0752aa58416b933eb3e7538` plus uncommitted changes, including pre-existing user work |
| Plugin package | `opencode-team-lead` `1.0.0` working tree; not a new release |
| Installed plugin SDK | `@opencode/plugin` `2.1.2` |
| Test runtime | Node `v26.13.0`, macOS |
| Host binary version | `v2.2.6`, discovered before the CLI restriction; the running app version was not independently confirmed |
| Website | VitePress `1.6.4` |

## Automated results

All checks passed after the final retrieval changes:

- `npm test`: **198 passed, 0 failed, 0 skipped**, including 31 retrieval-engine
  tests, 6 registered-tool integration tests, and permission/prompt assertions.
- `npm run lint`: passed.
- `npm --prefix website run build`: passed. Existing warnings concern a generated
  `llms.txt` sidebar link and bundles over 500 kB, not retrieval failures.
- `git diff --check`: passed.

The shell wrapper initially rewrote the lint command to an unrelated scope,
reporting generated VitePress chunks and rules absent from this repository's
config. The actual package scripts passed when invoked through Node without
that rewrite. Exact commands used for the final package-script checks:

```sh
node --input-type=module -e 'import { execFileSync } from "node:child_process"; execFileSync("/opt/homebrew/bin/npm", ["test"], { stdio: "inherit" });'
node --input-type=module -e 'import { execFileSync } from "node:child_process"; execFileSync("/opt/homebrew/bin/npm", ["run", "lint"], { stdio: "inherit" });'
node --input-type=module -e 'import { execFileSync } from "node:child_process"; execFileSync("/opt/homebrew/bin/npm", ["--prefix", "website", "run", "build"], { stdio: "inherit" });'
git diff --check
```

The absolute npm path is specific to this machine; the normal npm commands are
equivalent when the execution wrapper preserves their arguments.

### Registered-tool fixtures (mocked host)

`tests/spec-retrieval-integration.test.js` runs the real plugin registration and
handlers with mocked host services. These are **not real-host transport tests**.

| Configured spec directory | Source bytes | Selected subtree bytes | Pages | Largest serialized tool-content string |
|---|---:|---:|---:|---:|
| `docs/specs` | 84,156 | 84,058 | 10 | 16,379 bytes |
| `private/specifications` | 84,156 | 84,058 | 10 | 16,370 bytes |

Fixtures contain CRLF, emoji, accented text, quotes, backslashes, control
characters, nested headings and an excluded neighboring section. Assertions
compare actual tool-content strings against the 16,384-byte budget, independently
check source hashes and citation lines, and reconstruct the subtree exactly.
Recreating plugin setup between pages preserves valid cursors.

Other checks cover query/ranking/filter contracts; metadata-only deduplication;
count and byte truncation; source freshness after same-size timestamp-preserved
edits; malformed and cross-identity cursors; stale initial and continuation
reads; missing/unreadable sources; bounded errors and oversized metadata;
in-project aliases and escaping/retargeted symlinks; user-deny precedence;
pre-abort/denial before filesystem access; cross-location refusal; and unchanged
direct-artifact guards and complete-document review obligations.

## Partial smoke through the existing tool channel

The already-running session successfully executed these actual registered calls,
without starting the CLI:

```json
{"tool":"spec_search","arguments":{"query":"whole-document hash","id":"cited-specification-search"}}
{"tool":"spec_read_section","arguments":{"id":"cited-specification-search","section_id":"line:75","source_hash":"7c3e3c65a5caafe75a0eb38c6a1b00d84d04c5f0f2b4b3c8449cdbb6e709bc96"}}
```

Search reported 22 corpus files, 15 matching passages, five results and
`truncated: true`. Its first citation identified
`docs/specs/cited-specification-search.md:85-86` within section `line:75`.
Expansion returned the section at lines 75–86, matching the same text also
obtained through the complete `spec_get` read, with `has_more: false` and
`next_cursor: null`. The returned hash was identical across search and expansion.
No error or visible truncation occurred for these small responses.

This verifies basic availability and search-to-section handoff in the existing
channel only. Exact raw transport byte capture, independent on-disk verification,
large-section transport, denied actions, location switching and destructive
fixture edits were **not** exercised there. No production spec was edited for
testing, and these observations do not complete the release gate.

## Remaining supported-host gate

Use an authorized, already-running supported host and a disposable project; do
not invoke the OpenCode CLI or restart the app under the current restriction.
If that setup cannot be supplied safely, leave this gate incomplete.

1. Record the running host version from UI/about information and the exact plugin
   revision. Load the plugin only through an authorized setup workflow.
2. Reproduce the deterministic fixture from
   `tests/spec-retrieval-integration.test.js:17-18` in the disposable project's
   configured specs directory. Capture its decoded SHA-256 and exact bytes
   independently with Node. Test both default and custom paths.
3. Call `spec_search({ query: "needle" })` through registered tools. Verify every
   citation's file, inclusive lines, exact substring and full-source hash against
   the fixture, not a generated answer. Feed the returned identifier, selector
   and hash into `spec_read_section`.
4. Capture each exact raw tool-content string before rendering. Check its UTF-8
   byte length is at most 16,384; follow unchanged cursors until `has_more: false`;
   concatenate content and independently compare it with the complete selected
   subtree. Record page counts, maxima and any transport truncation/rejection.
5. In disposable files only, edit a source without changing its size (and restore
   its timestamp). Confirm old initial expansion returns `STALE_SOURCE`, and an
   old continuation returns `STALE_CURSOR`, without text or successful EOF.
   Rerun search and verify only the new source version is reconstructed. Replace
   the corpus between calls and confirm freshness without plugin restart.
6. Exercise a denied action and a session-location mismatch for both tools;
   confirm no source content is returned. Confirm retrieval itself produces no
   source changes, index files or network requests.
7. Record exact calls, raw capture locations, fixture hashes/sizes, host/model
   versions and outcomes here. If raw responses cannot be captured, report that
   limitation rather than claiming byte/transport verification. Any insufficient
   transport headroom blocks release; changing the budget requires a newly
   validated and semantically reviewed contract.

Keep block 5 unchecked until all these checks pass. No commit, tag, publication,
or release was performed or authorized by this verification work.
