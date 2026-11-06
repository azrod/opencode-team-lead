# Agents Overview

`opencode-team-lead` registers **12 specialized agents plus `team-lead`** in OpenCode. The team-lead delegates implementation and the review cluster validates results; `architect` is selected directly.

::: warning Retirement transition
`planning`, `brainstorm`, `harness`, `researcher`, and `gardener` are retired. The unchanged team-lead prompt still routes to them in places pending a separate redesign. Those plugin-agent paths are unavailable, and no replacement workflow or responsibility transfer is defined. Lifecycle tools and existing artifacts remain intact.
:::

<ClientOnly>
  <AgentGraph />
</ClientOnly>

<p class="agent-graph-caption">Selected delegation paths, not the full roster. <code>explore</code> and <code>general</code> are host agents; <code>review-manager</code> coordinates the review cluster.</p>

Agents use three modes:

- **`mode: primary`** — visible and directly selectable by the user; not available through `task` delegation
- **`mode: all`** — visible in the OpenCode agent list, accessible directly by the user or by the team-lead
- **`mode: subagent`** — invisible to the user, only reachable via `task` delegation from another agent

## Agent Roster

| Agent | Mode | Role |
|-------|------|------|
| `team-lead` | `all` | Pure orchestrator. Plans, delegates, reviews, reports. Never touches code. |
| `review-manager` | `subagent` | Review orchestrator. Spawns reviewers in parallel, arbitrates verdicts. |
| `requirements-reviewer` | `subagent` | Verifies implementation matches original requirements. |
| `code-reviewer` | `subagent` | Evaluates logic, error handling, API design, maintainability. |
| `security-reviewer` | `subagent` | Identifies vulnerabilities across 7 threat categories. |
| `spec-validator` | `subagent` | LLM validator invoked after `spec_create`/`spec_update`. Checks completeness, clarity, and consistency. |
| `plan-reviewer` | `subagent` | Plan review orchestrator. Asks review depth (light/deep), spawns sub-reviewers in parallel, returns APPROVED / CHANGES_REQUESTED / BLOCKED. |
| `plan-functional-reviewer` | `subagent` | Checks plan alignment with functional specs. Silent, invoked by `plan-reviewer` only. |
| `plan-technical-reviewer` | `subagent` | Checks plan alignment with technical and architectural specs. Silent, invoked by `plan-reviewer` only. |
| `plan-code-reviewer` | `subagent` | Checks plan code feasibility against the codebase (deep mode only). Silent, invoked by `plan-reviewer` only. |
| `spec-reviewer` | `subagent` | Integrated into the review-manager pool. Returns `NO_ACTION_NEEDED` / `SPEC_CREATE_NEEDED` / `SPEC_UPDATE_NEEDED` / `SPEC_VIOLATION` after each delivery. |
| `architect` | `primary` | Direct-only architecture advisor. Explains boundaries, trade-offs, and incremental migration without implementing. |
| `spec-writer` | `subagent` | Writes high-quality specs conforming to the canonical format. Delegated by team-lead. |

## Agent Pages

- [team-lead](/agents/team-lead) — the orchestrator at the center of everything
- [Review Cluster](/agents/review-cluster) — review-manager + requirements, code, security, and spec reviewers
- [Architect](/agents/architect) — direct architecture advice without implementation access
- [Spec-Writer](/agents/spec-writer) — canonical spec authoring, delegated by team-lead

> `spec-validator` invocation is documented in [Lifecycle Tools](/lifecycle-tools). `plan-reviewer` and its sub-reviewers are invoked via `plan_validate`. `spec-reviewer` is part of the [Review Cluster](/agents/review-cluster).

## How delegation flows

```
User
  └─► team-lead
        ├─► explore / general sub-agents  (implementation)
        ├─► review-manager               (reviews)
        │     ├─► requirements-reviewer
        │     ├─► code-reviewer
        │     ├─► security-reviewer
        │     └─► spec-reviewer          (always — NO_ACTION_NEEDED / SPEC_CREATE_NEEDED / SPEC_UPDATE_NEEDED / SPEC_VIOLATION)
        └─► spec-writer                  (when a complex spec needs authoring)
```

`architect` is deliberately outside this delegation tree: it is a directly selected `primary` agent, never callable through `task`.
