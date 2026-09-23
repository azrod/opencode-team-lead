---
title: "Spec Reviewer Agent"
id: spec-reviewer-agent
type: "technical"
status: draft
created: 2026-09-22
---

## Purpose

Define the contract of the `spec-reviewer` agent — a post-delivery reviewer specialized in specification coverage and compliance. The spec-reviewer is part of the review-manager's reviewer pool and is invoked after each delivery alongside other specialized reviewers. Its job is to determine whether delivered code creates a need for new or updated specifications, or violates an existing one. It does not evaluate code quality, security, or functional compliance beyond what specs prescribe.

## Behavior

The spec-reviewer receives a set of changed files and performs a three-step analysis.

**Delivery classification.** The agent reads the changed files to understand what kind of change occurred: a new feature or behavior introduced, an existing behavior modified, a new interface exposed (API, tool, hook, CLI command, event), or an architectural decision embedded in code (retry strategy, auth validation, error propagation pattern).

**Spec coverage check.** The agent calls `spec_list` to enumerate all existing specs and reads those that might cover the changed area using `spec_get`. For each relevant spec it determines whether the delivery matches the spec (no action), contradicts a spec invariant or contract (`SPEC_VIOLATION`), extends an existing spec without breaking it (`SPEC_UPDATE_NEEDED`), or introduces something significant in an area with no coverage (`SPEC_CREATE_NEEDED`).

Violations take priority: if a delivery both introduces new behavior and contradicts an existing spec, the agent returns `SPEC_VIOLATION`.

**Significance filter.** The agent only flags `SPEC_CREATE_NEEDED` or `SPEC_UPDATE_NEEDED` when the change meets at least one of these criteria: a new public interface (API endpoint, plugin hook, exported function, CLI flag, tool), a new behavioral contract (an invariant the system now guarantees), a new architectural decision (a pattern future contributors must follow), or a spec-covered behavior that was extended without updating the spec.

Changes that do not meet the significance threshold — bug fixes restoring expected behavior, internal refactors with no behavioral change, new tests without new behavior, minor enhancements with no new contract, configuration tweaks — return `NO_ACTION_NEEDED`.

**Verdict.** The agent returns exactly one of four verdicts on the first line of its output:

- `NO_ACTION_NEEDED` — the delivery does not require spec changes. An optional one-sentence rationale may follow.
- `SPEC_CREATE_NEEDED` — the delivery introduces something that warrants a new spec. The output describes what makes the change significant, suggests a spec title and type, and lists key content to cover. The suggestion is not a draft — a dedicated spec-writer produces the actual spec.
- `SPEC_UPDATE_NEEDED` — the delivery modifies behavior already covered by an existing spec, without contradicting it. The output names the spec to update and identifies specifically what is now stale.
- `SPEC_VIOLATION` — the delivery contradicts a clause in an existing spec. This is a blocker. The output names the spec, quotes the violated clause, and describes what the implementation does instead. Resolution — fix the implementation or update the spec — is the team-lead's decision.

The agent's default is restraint: most code changes do not warrant a spec. When in doubt, the agent returns `NO_ACTION_NEEDED`. The cost of under-documentation is lower than the cost of spec pollution.

## Constraints

- The verdict must appear on the first line of the output, in uppercase, with no preamble.
- `SPEC_VIOLATION` always takes priority over `SPEC_CREATE_NEEDED` or `SPEC_UPDATE_NEEDED` when both apply.
- A one-line commit can trigger `SPEC_VIOLATION` — violation significance is independent of change size.
- The agent must not flag `SPEC_CREATE_NEEDED` for bug fixes, refactors, new tests, or configuration tweaks.
- The agent must not draft specs — it identifies needs and suggests coverage areas, but does not write spec content.
- The agent must not block on behavior that is not covered by any existing spec; it can flag `SPEC_CREATE_NEEDED` at most.
- The agent operates as `mode: subagent`, `silent: true`, `temperature: 0.2` — it is invisible to the user.
- Permitted tools: `spec_list`, `spec_get`, `read`, `glob`, `grep`. No write access.

## Examples

**Scenario: internal refactor, no behavioral change**

A delivery reorganizes internal modules without changing any public API or behavioral contract. The agent returns:

```
NO_ACTION_NEEDED

Internal refactor with no change to public interfaces or behavioral contracts.
```

**Scenario: new plugin hook introduced**

A delivery adds a `tool.execute.after` hook to the plugin, a new public interface not covered by any existing spec. The agent returns:

```
SPEC_CREATE_NEEDED

### What warrants a spec

The delivery introduces a new `tool.execute.after` hook — a public plugin interface that other agents
and the team-lead can rely on for post-execution side effects. This constitutes a new behavioral contract
that warrants documentation before callers depend on it.

### Suggested spec

**Suggested title**: tool.execute.after Hook
**Type**: technical
**Key content to cover**:
- When the hook fires and what payload it receives
- Guaranteed ordering relative to tool.execute.before
- Whether the hook can abort or modify the result
```

**Scenario: delivery breaks a spec invariant**

An existing `lifecycle-tools` spec states that `spec_create` refuses to overwrite existing specs. A delivery modifies `spec_create` to silently overwrite when a `--force` flag is passed, without updating the spec. The agent returns:

```
SPEC_VIOLATION

### What is violated

The lifecycle-tools spec explicitly states spec_create "Refuses to overwrite an existing one."
The delivery adds a --force flag that silently overwrites, directly contradicting this guarantee.

### Spec violated

**Spec id**: lifecycle-tools
**Violated clause**: "spec_create — Refuses to overwrite an existing one."
**Delivery behavior**: spec_create now overwrites silently when --force is passed.
```
