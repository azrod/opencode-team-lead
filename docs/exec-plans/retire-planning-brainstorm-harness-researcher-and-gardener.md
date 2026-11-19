---
created: 2026-11-06
---

## Goal

Retire planning brainstorm harness researcher and gardener

## Functional objective

Reduce the plugin's available agents by removing planning, brainstorm, harness, researcher, and gardener. Preserve the remaining agents, lifecycle capabilities, and existing project artifacts. Keep the team-lead redesign separate, explicitly acknowledging that its old routing remains a transitional limitation rather than inventing replacement workflows.

## Scope

### In scope
- Governing architectural specification: `retire-five-auxiliary-agents` (structurally valid; semantic verdict APPROVED for current content).
- Remove exactly five definitions and prompt files; preserve 13 specialized agents and team-lead.
- Correct references in retained non-team-lead prompts, descriptions, current inventories, navigation, and website graph.
- Deprecate the five retired agent specs through lifecycle tools; apply narrow retirement notices/caller corrections to related specs and historical decision indexes.
- Regression tests, package-content verification, documentation build, and user-facing removal notice.

### Out of scope
- `agents/prompt.md`, team-lead registration/permissions, team-lead routing redesign, and replacement responsibility assignments.
- Lifecycle tools/guards/paths/formats, artifact data deletion, user configuration migration, aliases, or removal of independent custom agents.
- Rewriting completed execution plans or released changelog history; unrelated modernization; release/version bump.

### Delivery boundary
The user explicitly selected agent retirement now and team-lead redesign immediately afterward. Do not report the intermediate result as an end-to-end repaired team-lead workflow. Record the deferred routing limitation in handoff and current documentation. No new architectural decisions remain open.

## Building blocks

- [x] **Bloc 1 — Retire runtime agents and lock the retained roster**

  Remove the five exact entries from `config/agents.js` and delete `agents/planning.md`, `agents/brainstorm.md`, `agents/harness.md`, `agents/researcher.md`, and `agents/gardener.md` together. In the same deliverable, remove gardener caller claims from the spec-writer description and `agents/spec-writer.md`, and replace the harness invocation recommendation in `agents/bug-finder.md` with a neutral pattern finding (no replacement agent assignment). Preserve all other agent behavior. Update `tests/permissions.test.js`: use a retained mode-all agent such as bug-finder in the positive SOUL override case; retain retired IDs where used intentionally as negative tests. Add explicit exact-roster assertions and assertions that retired prompt files are absent. Do not modify `agents/prompt.md` or `index.js`.

  Done when:
  - `SUBAGENT_DEFS` contains exactly these 13 IDs: review-manager, requirements-reviewer, code-reviewer, security-reviewer, bug-finder, architect, spec-validator, plan-reviewer, plan-functional-reviewer, plan-technical-reviewer, plan-code-reviewer, spec-reviewer, spec-writer; a clean mock Plugin.setup registers exactly those plus team-lead.
  - Automated assertions verify all five retired IDs are absent from plugin definitions/clean registrations and all five retired prompt paths are absent; setup loads every retained prompt successfully.
  - SOUL override tests still cover global and per-agent behavior using retained agents; existing architect exact-target and permission tests pass unchanged in intent.
  - Retained non-team-lead prompts and registry descriptions contain no active instructions to invoke the five retired IDs; bug-finder still contains its pattern assessment.
  - The diff for `agents/prompt.md`, `index.js`, `tools/`, and retained agents' permission declarations is empty; `npm test` and `npm run lint` pass.

- [x] **Bloc 2 — Align specification status and architectural navigation**

  After Bloc 1, retrieve relevant specs with lifecycle tools. Mark `planning-agent`, `brainstorm-agent`, `harness-agent`, `researcher-agent`, and `gardener-agent` deprecated with explicit retirement notices linking `retire-five-auxiliary-agents`; normalize missing required frontmatter narrowly if needed for structural validation. In `team-lead-delegation`, update the current roster and add a notice identifying old routing sections as historical/pending the separate redesign, without defining new routing or rewriting that workflow. Correct gardener caller claims/examples in `spec-writer-agent`; add a narrow notice to `bug-finder-agent` if its contract recommends harness. Inspect `architect-agent` and `lifecycle-tools` for retirement-related claims and add only necessary caller/availability notices, preserving all APIs and architect boundaries. Update `docs/index.md`, `docs/architecture.md`, `docs/decisions.md`, `docs/adr/index.md` and linked active ADRs only where needed to distinguish prior choices from current availability; do not load or modify background essays. Preserve completed execution plans and all artifact data. Artifact edits use lifecycle tools exclusively.

  Done when:
  - Lifecycle getters show deprecated status and a retirement-decision reference on each of the five retired agent specs.
  - `spec_validate` succeeds for each created/updated spec; changed specs receive explicit semantic review through spec-validator with actual APPROVED verdicts covering their final content, or remaining review blockers are reported rather than waived.
  - Current inventories list 13 specialized plugin agents plus team-lead and do not advertise retired agents as available; historical routing statements in `team-lead-delegation` are explicitly labeled deferred/historical.
  - `spec-writer-agent` no longer lists gardener as an active caller; any retained harness recommendation in other contracts is labeled superseded, not executable guidance.
  - No new team-lead ownership/routing contract, no change to lifecycle APIs, and no deletion of specs, artifacts, historical decisions, or completed plans appears in the diff.

- [x] **Bloc 3 — Remove public advertising and document the transition**

  After Blocs 1–2, update `README.md`, `AGENTS.md`, `website/index.md`, `website/architecture.md`, `website/agents/index.md`, `website/agents/spec-writer.md`, `website/agents/bug-finder.md`, and `website/lifecycle-tools.md` for the reduced roster/callers. Remove the five dedicated `website/agents/{planning,brainstorm,harness,researcher,gardener}.md` pages and their sidebar links in `website/.vitepress/config.ts`. Remove their nodes/edges in `website/.vitepress/components/AgentGraph.vue` and compact the layout without a general diagram redesign. Label the existing workflow in `website/agents/team-lead.md` as pending redesign instead of assigning replacements. Check `website/principles.md` and `website/decisions.md` for obsolete live-agent claims; qualify historical references without deleting architectural principles. Add a Removed entry under Unreleased in `CHANGELOG.md` and its website counterpart, stating the removal and deferred team-lead routing limitation without changing released entries.

  Done when:
  - The five dedicated agent pages and their active sidebar links and graph nodes/edges are absent; retained graph edges have existing endpoints.
  - Current roster/permission tables and spec-writer caller descriptions match the runtime; no replacement workflow is promised.
  - Current team-lead workflow documentation explicitly states that old references to retired agents await the separate redesign; `agents/prompt.md` remains unchanged.
  - Unreleased records the five removals and transition limitation; released changelog sections are unchanged.
  - The website build passes using `npm run build` from `website/` with its existing dependencies; a browser preview confirms the revised graph is readable and its retained nodes/labels are not clipped.

- [x] **Bloc 4 — Verify package boundaries and hand off the deferred redesign**

  After all preceding blocks, rerun regression checks and inspect a package manifest using `npm pack --dry-run --json` (not a publication). Perform scoped searches for the five identifiers across registry code, retained agent prompts, tests, README, AGENTS, and current docs/site content. Classify every remaining match as retired status/history, negative test, generic terminology, or deferred team-lead workflow; do not require zero occurrences of the ordinary word planning. Access protected specs/plans through lifecycle getters only and do not inspect stored briefs. Record command results, classified exceptions, and deferred team-lead references in the delivery handoff. Use normal implementation review through review-manager; this plan does not authorize Architect to execute or coordinate delivery.

  Done when:
  - `npm test`, `npm run lint`, and the website production build all pass with recorded results; review-manager returns an actual APPROVED verdict for the delivery or a blocker is explicitly reported.
  - Package dry-run lists no retired prompt file, includes every retained prompt and skill, and introduces no new dependency or missing required asset.
  - The reference audit lists no unclassified active invocation outside the explicitly deferred team-lead workflow; protected artifact checks use lifecycle tools.
  - Final diff verifies no change to `agents/prompt.md`, team-lead registration/permissions, lifecycle runtime, artifact paths/formats, or independent user configuration; no artifact data was deleted.
  - Handoff explicitly names deferred Brainstorm/Planning/Harness/Gardener protocols and researcher selection references in `agents/prompt.md`, notes the routing mismatch until redesign, and makes no claim that responsibility has moved to team-lead or architect.

## Decision log

2026-11-06 — User requested retirement of planning, brainstorm, harness, researcher and gardener (brainstorm was listed twice). Exactly five unique agents are removed.

2026-11-06 — User explicitly excluded team-lead work because it will be reworked immediately afterward. No ownership transfer is selected; temporary obsolete team-lead routing is an acknowledged follow-up, not a hidden implementation gap.

2026-11-06 — Keep lifecycle tools, existing artifacts, and independent user agents intact. Deprecate retired specs instead of deleting them; preserve historical records. Rationale: retiring personas does not require an API or data migration.

2026-11-06 — Governing spec `retire-five-auxiliary-agents` passed structural validation and explicit spec-validator semantic review (APPROVED) before plan creation.

### Delivery validation — 2026-11-06

- Runtime regression: `npm test` passed (139 tests, 0 failures); `npm run lint` and `git diff --check` passed.
- Website: production `npm run build` passed using existing dependencies. Non-blocking warnings remain for the external llms.txt sidebar URL and chunks over 500 kB.
- Browser: Chromium preview confirmed 8 retained graph nodes and 7 edges, all node bounds inside the graph; desktop screenshot inspected with readable labels and no clipping. The temporary preview and browser processes were stopped afterward.
- Package: `npm pack --dry-run --json` passed (28 files). All 14 retained prompts and all 7 bundled skill assets are included; all 5 retired runnable prompt paths are absent. Historical skill examples are reference assets, not registered agents.
- Boundaries: final diff is empty for `agents/prompt.md`, `index.js`, `tools/`, package manifests, and `opencode.json`. No dependency, artifact API, configuration migration, release, or ownership transfer is introduced.
- Spec review: explicit spec-validator review APPROVED final content of all 9 changed specs after structural validation. Independent delivery review and scoped reference classification are tracked in Bloc 4.
- Deferred handoff: `agents/prompt.md` still contains Brainstorm, Planning, Harness, and Gardener protocols, plus researcher selection/understanding-phase routing. These plugin-agent targets are unavailable until the separate team-lead redesign; no responsibility is reassigned to team-lead or architect.
- Reference categories: removal notices and deprecated specs describe retired status; dated decisions and released changelogs preserve history; tests name retired IDs only as negative assertions; generic planning and harness-engineering terminology remains valid; bundled spec-writer examples are non-runtime historical references. Current inventories, sidebar routes, graph endpoints, and retained caller guidance were corrected. The independent final audit found one unqualified ownership claim in `docs/guiding-principles.md:166`; it now explicitly labels brainstorm/planning ownership as historical, identifies retirement and deferred replacement routing, and preserves the brief-schema principle without assigning a new owner. The generic “brainstorm session” wording remains valid. Independent review-manager final verdict is APPROVED: requirements-reviewer and code-reviewer inspected and approved the correction; security-reviewer's prior approval carries forward. No unclassified active invocation remains outside the explicitly deferred team-lead workflow. Reviewers inspected content but could not rerun shell commands (`Permission denied: shell`); command, package, and browser results above are supplied delivery evidence, not independently reproduced checks.

### Ordering, rollback, and review

Execute Bloc 1, then Bloc 2, then Bloc 3, then Bloc 4. Keep the removal unadvertised as an end-to-end repaired workflow while team-lead routing remains deferred. Each block is a bounded deliverable; runtime definitions and removed prompts are one coordinated change. Rollback uses version control to restore definitions, prompts, corrected callers and documentation together; no data restoration or configuration migration is needed. This is a retirement plan, not authorization to redesign team-lead or publish a release. No unresolved architectural questions remain.
