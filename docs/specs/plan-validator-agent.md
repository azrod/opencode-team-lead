---
title: "Plan Reviewer Agent Cluster"
id: plan-reviewer-agent
type: "technical"
status: active
created: 2026-09-22
---

## Purpose

Define the contract of the `plan-reviewer` agent cluster — a semantic review orchestrator invoked after `plan_validate` when a deeper evaluation of an exec-plan is needed. The cluster is composed of one orchestrator (`plan-reviewer`) and up to three specialized sub-reviewers (`plan-functional-reviewer`, `plan-technical-reviewer`, `plan-code-reviewer`).

Note: the mechanical structural check (frontmatter, functional objective present, building blocks present) remains in the `plan_validate` tool and is unchanged. This spec covers the LLM semantic review layer only.

## Architecture

The `plan-reviewer` orchestrator receives the plan id and a review depth (`light` or `deep`), then spawns sub-reviewers in parallel:

- **`light`** — spawns `plan-functional-reviewer` (does the plan solve the right problem?) and `plan-technical-reviewer` (is the technical approach sound, are blocks atomic and sequenced correctly?).
- **`deep`** — spawns all three: `plan-functional-reviewer`, `plan-technical-reviewer`, and `plan-code-reviewer` (is the plan feasible given the actual codebase — file paths realistic, APIs referenced exist, no architectural conflicts?).

The orchestrator arbitrates their verdicts and returns a single structured verdict to the team-lead.

## Behavior

The plan-reviewer orchestrator receives the id of a plan and a depth parameter, spawns the appropriate sub-reviewers, and synthesizes their findings.

**plan-functional-reviewer checks.** Does the plan solve the right problem? Is the functional objective clear and user-grounded (not just a feature name)? Do the building blocks together deliver the stated objective? Are there obvious functional gaps or scope overloads?

**plan-technical-reviewer checks.** Is the technical approach sound? Are blocks atomic (single logical deliverable, independently reviewable)? Do "Done when" criteria exist and are they mechanically verifiable? Is the block sequencing coherent — no circular dependencies, no illogical ordering? Is the scope realistic or does it mix unrelated concerns that belong in separate plans?

**plan-code-reviewer checks (deep only).** Is the plan feasible against the actual codebase? Do referenced file paths, modules, and APIs exist? Are there architectural conflicts with existing patterns? Would the plan's sequencing hold up against real implementation constraints?

**Verdict.** The orchestrator returns a structured review report starting with `## Plan Review`, followed by `**Verdict**: APPROVED`, `**Verdict**: CHANGES_REQUESTED`, or `**Verdict**: BLOCKED`, matching the review-manager pattern:

- `APPROVED` — all active sub-reviewers cleared the plan. An optional short summary may follow.
- `CHANGES_REQUESTED` — one or more sub-reviewers flagged issues that must be resolved before execution. The output includes a structured breakdown by reviewer with concrete changes needed.
- `BLOCKED` — a critical flaw makes the plan unsafe to execute regardless of amendments (e.g., the functional objective is absent or unintelligible, the plan has irreconcilable circular dependencies). Escalated immediately to the team-lead for user input.

The default is pragmatic: a short plan with one block, a clear objective, and a "Done when" criterion is valid. CHANGES_REQUESTED requires a concrete flaw that would cause execution confusion. BLOCKED requires a flaw that makes any execution path impossible.

## Agent Config

| Agent | `temperature` | `silent` |
|---|---|---|
| `plan-reviewer` | `0.2` | `false` |
| `plan-functional-reviewer` | `0.1` | `true` |
| `plan-technical-reviewer` | `0.1` | `true` |
| `plan-code-reviewer` | `0.2` | `true` |

## Constraints

- The orchestrator's output starts with `## Plan Review`, followed by `**Verdict**: APPROVED`, `**Verdict**: CHANGES_REQUESTED`, or `**Verdict**: BLOCKED`. No bare first-line verdict — the structured header comes first.
- A plan with no "Done when" criteria on any block always triggers CHANGES_REQUESTED at minimum.
- Sub-reviewers must not flag stylistic reasons, missing "nice to have" blocks, sparse prose, or business-level disagreement with the plan's goals.
- The orchestrator operates as `mode: subagent`, `silent: false`, `temperature: 0.2`. Sub-reviewers operate as `mode: subagent`, `silent: true`.
- The `plan-reviewer` cluster is invoked by the team-lead via `task` after `plan_validate` passes. It is **never triggered automatically** — the team-lead decides when semantic review is warranted. It is **never triggered on plan updates** — plan updates are the team-lead's responsibility.
- The mechanical structural check (frontmatter present, functional objective section present, at least one building block) remains in the `plan_validate` tool and runs before the cluster is invoked.
- Permitted tools for sub-reviewers: `plan_get` only. The orchestrator passes the plan id directly — sub-reviewers do not need to list plans. The `plan-code-reviewer` also has read access to the filesystem for codebase feasibility checks.
- No agent in the cluster creates, modifies, or deletes plans. They read and judge.

## Examples

**Scenario: plan missing "Done when" criteria**

A plan has three building blocks. None has a "Done when" field. The `plan-technical-reviewer` flags the issue; the orchestrator returns:

```
## Plan Review

**Verdict**: CHANGES_REQUESTED

### plan-technical-reviewer

#### Blocks with structural flaws
- **Block 1 (API gateway)**: No "Done when" criterion. Cannot determine what success looks like.
- **Block 2 (Auth service)**: No "Done when" criterion.
- **Block 3 (Integration tests)**: No "Done when" criterion.

### What needs to change

Every block requires a mechanically verifiable "Done when" criterion. Add one to each block.
```

**Scenario: valid minimal plan (light review)**

A plan has a single block: "JWT authentication flow working end-to-end. Done when: POST /auth/login returns a signed JWT for valid credentials and 401 for invalid ones." The objective explains why users need login. Both `plan-functional-reviewer` and `plan-technical-reviewer` clear it:

```
## Plan Review

**Verdict**: APPROVED
```

**Scenario: circular dependency**

A plan declares Block A depends on Block B, and Block B depends on Block A. The `plan-technical-reviewer` flags it; the orchestrator escalates to BLOCKED because no execution path is possible:

```
## Plan Review

**Verdict**: BLOCKED

### plan-technical-reviewer

#### Dependency issues
- Block A declares a dependency on Block B, and Block B declares a dependency on Block A — circular dependency. The plan cannot be executed in any order.

### What needs to change

Break the cycle. Identify which block must be completed first and remove the reverse dependency.
```
