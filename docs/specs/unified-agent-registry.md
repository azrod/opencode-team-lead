---
title: "Unified Agent Registry"
id: unified-agent-registry
type: "architectural"
status: draft
created: 2026-11-06
---

## Purpose

> **Subsequent removal — 2026-11-06.** The user subsequently requested removal of `bug-finder`. The 14-agent roster and byte-identical team-lead prompt clauses below describe the completed registry refactor baseline, not the post-removal inventory. The current registry retains 13 definitions (team-lead plus 12 specialists) in their original relative order. Bug-finder's definition, prompt, website page, and team-lead caller instructions are removed without a replacement role. Retained defaults, overlays, permissions, SOUL behavior, lifecycle tools, and independent user agents remain unchanged. Frozen baseline tests keep the original oracle, excluding only bug-finder from current roster comparisons; prompt-byte equality is no longer a current invariant after this separately requested caller cleanup.

Remove the structural special case that stores the team-lead definition in the plugin entrypoint while other definitions live in the agent registry. The user accepted a unified registry and consistent names with unchanged runtime behavior. This is a target refactor contract, not a claim that the refactor is implemented.

## Behavior

`config/agents.js` exports one complete ordered `AGENT_DEFS` list covering all 14 plugin agents. The team-lead appears first, followed by the current 13 specialized definitions in their existing order. Each ID occurs exactly once. The registry owns each agent's prompt filename, description, mode, color, request defaults, hidden flag where applicable, and ordered permission defaults. Internal policy normalization may remain where useful; consumers receive the existing normalized definition shape. No consumer reconstructs the full roster by prepending a special definition.

The plugin entrypoint imports that list, loads its prompts, registers each definition through `registerAgent`, and uses the same list to scope the temperature hook. The helper's registration, merge, and SOUL semantics remain unchanged; only its name changes from registerSubagent. `SUBAGENT_DEFS` is replaced by `AGENT_DEFS` throughout active internal consumers. No compatibility aliases are introduced for these internal symbols; package exports currently expose only the plugin entrypoint. Independent user agent IDs and plugin configuration keys are not renamed.

The team-lead prompt moves from `agents/prompt.md` to `agents/team-lead.md` byte-for-byte. The old file is removed; the registry supplies the new filename. All existing prompt content, including deferred routing from the earlier five-agent retirement, remains unchanged. Retained prompt files are not otherwise moved or rewritten.

The normalized definitions for all agents remain equivalent to their pre-refactor values except for the team-lead prompt filename. Registered output is unchanged for a clean setup and configured overlays, including IDs, order, modes, visibility, descriptions, colors, request defaults, permissions, SOUL behavior, and context-hook temperature behavior. Native normalized permission rules are the semantic contract; moving declarations must not introduce extra deny rules, normalize distinct resource patterns into one another, or reorder rules.

The registry may import the shared lifecycle tool name set from `tools/artifact-guard.js` to preserve the existing team-lead permission list without copying it. Dependency direction must remain acyclic; the lifecycle tool implementations and guard behavior are unchanged.

Current documentation and tests use the new registry/helper names and prompt path. Historical completed plans and released changelog entries remain historical; active specs that describe the old split receive narrow structural updates through lifecycle tools. References in the earlier retirement decision to preserving `agents/prompt.md` mean preserving its content and team-lead behavior during retirement, not forbidding this separately accepted relocation. That retirement's behavior and routing deferral remain in effect.

## Constraints

- Exactly 14 plugin definitions remain: team-lead plus review-manager, requirements-reviewer, code-reviewer, security-reviewer, bug-finder, architect, spec-validator, plan-reviewer, plan-functional-reviewer, plan-technical-reviewer, plan-code-reviewer, spec-reviewer, spec-writer.
- No previously retired agent is reintroduced. No agent ID, option key, host mode, or permission is renamed or changed.
- Preserve ordered normalized defaults, configured overlay precedence, and the existing behavior that the plugin supplies system prompts. Preserve global and per-agent SOUL options.
- The team-lead keeps mode `all`, color `#ef4444`, temperature `0.3`, and its exact current permission array including shared lifecycle actions and the trailing `git push *` ask rule. Architect keeps its direct-only mode and exact review targets.
- Preserve initialization failure when any required prompt cannot be loaded. Do not add prompt fallback aliases or silent omission of definitions.
- `agents/team-lead.md` must equal the pre-refactor `agents/prompt.md` byte-for-byte, and the old prompt path must be absent from shipped files.
- Preserve all lifecycle tool registrations, artifact protections, skills, stored artifacts, and independent configured agents. No implementation of future team-lead workflows is part of this refactor.
- Baseline comparison tests must be independent of the new registry as their sole oracle; tests that derive both expected and actual values from AGENT_DEFS do not prove behavior preservation.

## Examples

A clean plugin setup reads all 14 definitions directly from AGENT_DEFS. The resulting registered agent ID list is identical to the baseline, and team-lead is registered once rather than defined in the entrypoint.

With `soul: false` and `agents: { "team-lead": { soul: true } }`, the team-lead receives the same personality suffix as before and other agents retain their previous option behavior. This refactor does not alter these options.

A user-configured team-lead permission override remains after plugin defaults, so last-match precedence is preserved. The default `git push *` ask rule remains in its original relative position before user overrides.

A package dry-run contains `agents/team-lead.md`, every other retained prompt, and no `agents/prompt.md`. The moved prompt has the same bytes as the baseline file, including any currently stale references to retired agents.

## Rationale

Keeping the split would retain two ownership locations and duplicated roster assembly in tests. Renaming only the prompt would leave that structural problem untouched. A single complete registry is selected because loading and registration already share one execution path; no new framework or per-agent directory hierarchy is needed. Internal symbol and prompt-path consumers must update together; external scripts using the unpublished old source paths may need adjustment, but no public plugin configuration migration is introduced.

## Non-goals

Team-lead functional redesign, permission tightening or expansion, native-policy modernization, prompt cleanup, lifecycle API changes, dependency additions, release/version changes, and generalized agent discovery are excluded.