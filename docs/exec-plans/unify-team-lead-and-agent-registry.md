---
created: 2026-11-06
---

## Goal

Unify Team-Lead and Agent Registry

## Functional objective

Make the team-lead as easy to locate and maintain as every other plugin agent, removing the special definition hidden in the entrypoint. Keep all 14 agents and their runtime behavior unchanged, including permissions and user overrides. This change reorganizes ownership and naming only; it does not redesign the team-lead workflow.

## Scope

### In scope
- Approved governing specification: `unified-agent-registry` (spec_validate valid:true; spec-validator APPROVED for current content).
- All 14 definitions in `config/agents.js` as AGENT_DEFS; registerAgent replaces registerSubagent; index.js and tests consume the same complete list.
- Rename `agents/prompt.md` to `agents/team-lead.md` byte-for-byte; update active references.
- Independent behavior-preservation tests, current documentation/spec alignment, package and website checks.

### Out of scope
- Team-lead functional rewrite or stale-routing cleanup; any prompt content change.
- Permission changes, mode/temperature changes, policy modernization, new aliases/discovery framework, restoring retired agents.
- Lifecycle runtime, artifacts, user configuration migration, dependency additions, release/version bump, rewriting historical completed plans or released changelog entries.

### Accepted implementation boundary
Use the existing normalized definition shape and common registration path. Preserve ordered permission arrays rather than forcing the team-lead through a lossy permission object; native ordered team-lead rules can coexist as registry input with existing compact specialized policies. Reuse LIFECYCLE_TOOLS from the guard (its module imports Node builtins only); do not duplicate lifecycle names. Registry assembly is the single owner of the complete roster. No open architectural decisions remain.

## Building blocks

- [x] **Bloc 1 — Lock the pre-refactor behavior independently**

  Extend `tests/permissions.test.js` (and narrowly scoped fixtures/helpers in `tests/` if useful) before moving code. Capture an independently frozen baseline of normalized defaults and clean registered output for all 14 agents from the current implementation, excluding only the known prompt filename change from definition equality. Store prompt byte identity as a baseline digest of the original file, not by comparing two strings read from the new path. Verify ordered team-lead permissions, all lifecycle grants, trailing git-push ask, configured overrides with and without host-default prefixes, SOUL global/per-agent overrides explicitly including team-lead, and context-hook temperature scoping/precedence. Test missing required prompts using a contained fixture or mock without deleting tracked prompts. Do not derive expected defaults from the registry under test. Existing specialized-agent tests remain meaningful.

  Done when:
  - `npm test` passes against the existing split implementation with baseline fixtures/assertions committed before the move.
  - Baseline asserts the exact 14 unique IDs in existing registration order and normalized agent metadata/ordered permissions, and includes a digest of the current `agents/prompt.md` bytes.
  - Tests cover team-lead override precedence with both host-prefix cases, prompt ownership, global/per-agent SOUL, and temperature behavior: configured/default temperature applies only for plugin agents and never overwrites an already provided event temperature.
  - Required-prompt failure remains tested without mutating tracked source files during test execution.

- [x] **Bloc 2 — Move all definitions and adopt consistent names atomically**

  After Bloc 1, relocate the team-lead definition from `index.js` into `config/agents.js`, preserving its native ordered permission array and metadata. Export the complete ordered list as `AGENT_DEFS`; replace `registerSubagent` with `registerAgent`. Keep the current specialized policy normalization where useful, ensuring every consumer receives the same normalized shape. Import the shared LIFECYCLE_TOOLS set from `tools/artifact-guard.js` for the relocated team-lead rules; no new module cycle or duplicated list. Rename `agents/prompt.md` to `agents/team-lead.md` without content edits. Update `index.js` to load/register directly from AGENT_DEFS and use it for the temperature-hook membership check; remove its special inline agent definition. Update tests/imports to consume AGENT_DEFS directly, retaining independent baseline oracles. The complete registry has 14 entries; specialized-only assertions must filter or explicitly compare the 13 specialized IDs, not confuse the new full count with the prior subset.

  Done when:
  - AGENT_DEFS contains exactly 14 unique definitions in the baseline order, team-lead first, and index.js contains no inline team-lead definition or roster-prepending construction.
  - Current source/test imports use AGENT_DEFS and registerAgent; old symbol exports and compatibility aliases are absent.
  - Baseline equality tests pass for normalized defaults and registered output across clean/configured cases, allowing only the team-lead definition filename to change.
  - `agents/team-lead.md` matches the frozen pre-refactor digest, `agents/prompt.md` is absent, and setup loads all required prompts successfully.
  - SOUL, user override, architect permission, required-prompt failure, and temperature-hook regression tests pass; `npm test` and `npm run lint` pass.
  - No lifecycle runtime, skill registration, existing prompt content, retired-agent absence, or independent user-agent behavior changes appear in the diff.

- [x] **Bloc 3 — Align references and verify the distributed boundary**

  After Bloc 2, locate old symbols and prompt path in ordinary source, tests, README, AGENTS.md, docs/architecture.md, docs/index.md, and current website docs; update active structural descriptions only. Enumerate specs through spec_list/spec_get, never direct filesystem searches into protected artifact directories. Narrowly update active specs that describe the old definition location/list/helper/path (including team-lead-delegation and architect-agent where applicable); preserve behavioral clauses and retirement deferral, and explicitly distinguish the accepted relocation from the earlier retirement's no-edit boundary. Read `retire-five-auxiliary-agents` through lifecycle tools if needed and add only a relocation cross-reference if current wording would mislead consumers. Validate and semantically review every changed spec. Leave historical completed plans and released changelog entries intact. This is an internal refactor: do not add a user-facing changelog entry absent an actual user-visible behavior change. Run package dry-run and website build, then obtain normal delivery review through review-manager; this plan does not authorize Architect to implement or coordinate delivery.

  Done when:
  - Scoped reference audit reports no unexplained active use of SUBAGENT_DEFS, registerSubagent, or agents/prompt.md; historical references and explicit relocation explanations are classified exceptions, not blindly replaced. No protected filesystem access or stored-brief inspection is used.
  - Current docs describe one complete 14-agent registry, 13 specialized agents plus team-lead, registerAgent, and agents/team-lead.md; no claim that the team-lead functional workflow was redesigned is introduced.
  - Every updated spec passes spec_validate and explicit spec-validator review with an APPROVED verdict covering final content; specification changes remain structural and do not alter the approved behavioral boundaries.
  - `npm test` and `npm run lint` pass; `npm run build` in website/ passes using its existing dependency setup.
  - `npm pack --dry-run --json` includes agents/team-lead.md and every other retained prompt/skill, excludes agents/prompt.md and all five retired prompt files, and introduces no dependency or public configuration migration.
  - Delivery review-manager returns an actual APPROVED verdict covering the final diff, or findings/blockers are reported without claiming completion.

## Decision log

2026-11-06 — User explicitly accepted a single complete registry, AGENT_DEFS/registerAgent naming, and prompt.md to team-lead.md relocation, at unchanged behavior. Rationale: existing shared loading/registration means the split has no runtime justification.

2026-11-06 — Preserve normalized ordered permission defaults and overlays rather than modernizing declarations or forcing the team-lead into a lossy object conversion. Rationale: a structural refactor must not alter authorization behavior.

2026-11-06 — Keep all prompt content and previously deferred team-lead routing unchanged; the new accepted decision supersedes only structural file/symbol locations from earlier specs. No replacement workflow is selected.

2026-11-06 — Governing specification unified-agent-registry passed structural validation and explicit spec-validator review APPROVED before this plan was created.

### Sequence, intermediate states, and rollback

Run Bloc 1, then Bloc 2, then Bloc 3. The first intermediate state adds tests only. Bloc 2 coordinates moves and consumer updates in one deliverable, avoiding an entrypoint that references deleted files or renamed exports. Bloc 3 makes active navigation match the runtime before handoff. Roll back Bloc 2 and its reference updates together through version control; baseline tests remain useful, and no data/configuration migration is required. No unresolved decisions remain.
