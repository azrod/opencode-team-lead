---
title: "Retire Five Auxiliary Agents"
id: retire-five-auxiliary-agents
type: "architectural"
status: draft
created: 2026-11-06
---

## Purpose

Reduce the plugin-provided agent surface by retiring `planning`, `brainstorm`, `harness`, `researcher`, and `gardener`, without deciding their replacement workflows. The user explicitly excluded the team-lead redesign from this change; that redesign follows separately. This specification describes the accepted target, not current implemented behavior.

## Behavior

> **Subsequent structural relocation — 2026-11-06.** [Unified Agent Registry](unified-agent-registry.md) separately authorizes moving the unchanged team-lead prompt from `agents/prompt.md` to `agents/team-lead.md` and replacing the former 13-entry `SUBAGENT_DEFS` plus separate team-lead definition with one complete 14-entry `AGENT_DEFS` registry in `config/agents.js`. The old names and no-edit boundary below describe the retirement-time layout and scope, not a prohibition on that accepted relocation. Prompt content, permissions, behavior, and routing deferral remain unchanged.

The plugin stops registering the five retired identifiers and stops shipping their prompt files (`agents/planning.md`, `agents/brainstorm.md`, `agents/harness.md`, `agents/researcher.md`, `agents/gardener.md`). No aliases, replacement personas, redirects, or automatic responsibility transfers are introduced.

The retained specialized agents are `review-manager`, `requirements-reviewer`, `code-reviewer`, `security-reviewer`, `bug-finder`, `architect`, `spec-validator`, `plan-reviewer`, `plan-functional-reviewer`, `plan-technical-reviewer`, `plan-code-reviewer`, `spec-reviewer`, and `spec-writer`. Alongside `team-lead`, a clean plugin setup registers 14 plugin agents, including 13 entries in `SUBAGENT_DEFS`. Native host agents are not part of that count.

Retained non-team-lead agent prompts and descriptions no longer instruct callers to invoke retired agents. In particular, bug-finder retains its pattern assessment but no longer recommends invoking harness; spec-writer no longer describes gardener as an active caller. No new permissions are granted to retained agents.

Current agent inventories, installation guidance, navigation, and website graphs reflect the reduced roster. Dedicated website pages for the retired agents and links advertising their availability are removed. Documentation describing team-lead workflows is not redesigned: where it still describes the old routing, it is explicitly labeled as pending the separate team-lead redesign rather than presented as a supported post-retirement workflow. The user-facing changelog records the removal and the transitional limitation without rewriting released history.

The five retired agent specifications are preserved and marked deprecated through lifecycle tools, with a reference to this decision. Other affected specifications receive narrowly scoped retirement notices or caller/inventory corrections as needed. Historical decisions and completed execution plans are preserved; notices distinguish historical statements from active availability. Existing historical references are not subject to a blanket zero-occurrence rule.

The transitional exception is explicit: `agents/prompt.md`, the team-lead registration and permissions, and the definition of future team-lead behavior remain outside this scope. Its existing routing may still mention retired agents. Those references are a known follow-up dependency, not a reason to invent replacement routing in this change. This intermediate state must not be described as a fully repaired end-to-end team-lead workflow.

Custom user-defined agents with matching identifiers are not deleted or disabled. The guarantee concerns registrations and files supplied by this plugin, not global host availability or user configuration.

## Constraints

- Only the five named plugin agents are retired. Architect, spec-writer, all review agents, and bug-finder are preserved.
- Do not modify `agents/prompt.md` or redesign team-lead behavior, permissions, or delegation policy in this scope.
- Do not transfer general planning to architect or change its direct-only role and exact review delegation targets.
- Lifecycle tools, artifact guards, configured artifact paths, artifact formats, stored artifacts, and lifecycle permissions remain unchanged.
- Retired specifications are deprecated, not deleted. Completed execution plans and released changelog history are retained.
- Configuration overlays for removed identifiers are not migrated, purged, or turned into aliases. Do not remove independently configured user agents.
- Removing prompt files and definitions is coordinated so plugin initialization never references a missing required prompt.
- Tests verify both the exact retained roster and the absence of retired plugin registrations. Existing permission and SOUL coverage remains meaningful by using retained agents in positive override cases.
- Reference checks distinguish actionable references in retained non-team-lead prompts and current inventories from allowed historical mentions, deprecation notices, negative tests, and the deferred team-lead routing.

## Examples

On a clean mocked setup, `SUBAGENT_DEFS` contains the 13 retained specialized identifiers and no retired identifier. Plugin setup succeeds and registers those 13 plus `team-lead`; no removed prompt is loaded.

A bug-finder report can still identify a mechanically preventable recurring pattern, but its prompt no longer directs the team-lead to invoke an agent named `harness`.

A user supplies a separate custom agent called `researcher`. This retirement does not delete that agent; it only stops supplying the plugin's own researcher definition and prompt.

After retirement, an old completed gardener plan still exists, the gardener specification is deprecated, and current agent navigation no longer advertises gardener. The unchanged team-lead prompt may still contain its old Gardener Protocol pending the separate redesign.

## Rationale

Keeping the five agents would preserve existing workflows but would not meet the user's requested reduction. Transferring their responsibilities now would mix the retirement with the explicitly deferred team-lead redesign. A scoped removal is selected instead: it is reversible through version control and requires no data migration, at the cost of an acknowledged intermediate routing mismatch.

This decision supersedes active availability claims for the five retired identifiers in `team-lead-delegation`, `planning-agent`, `brainstorm-agent`, `harness-agent`, `researcher-agent`, and `gardener-agent`. It narrows gardener caller references in `spec-writer-agent`; it does not otherwise replace retained agent contracts. The retirement notices and caller corrections are delivery work, not claims that those existing artifacts have already been updated.

## Non-goals

Team-lead redesign, replacement planning ownership, replacement discovery or maintenance workflows, lifecycle API removal, artifact deletion, configuration migration, a release/version bump, and unrelated documentation modernization are excluded.