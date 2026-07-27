# Agents Overview

`opencode-team-lead` installs a complete multi-agent system into OpenCode. At the top sits **`team-lead`**, a pure orchestrator that never touches code directly. Everything flows through delegation: the team-lead plans, sub-agents execute, the review cluster validates.

<ClientOnly>
  <AgentGraph />
</ClientOnly>

<p class="agent-graph-caption">Agent hierarchy — <code>team-lead</code> orchestrates everything; <code>review-manager</code> sub-orchestrates the review cluster.</p>

Agents are split into two modes:

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
| `bug-finder` | `subagent` | Structured investigation. Forces root-cause before any fix. |
| `brainstorm` | `all` | Phase 0 discovery. Transforms vague ideas into structured product briefs. |
| `harness` | `all` | Encodes recurring patterns as permanent enforcement artifacts. |
| `planning` | `all` | Writes complex requests as exec-plans to disk. |
| `gardener` | `all` | Periodic maintenance. Fixes stale docs, detects code drift. |
| `researcher` | `subagent` | External knowledge retrieval. Searches docs, RFCs, APIs. |

## Agent Pages

- [team-lead](/agents/team-lead) — the orchestrator at the center of everything
- [Review Cluster](/agents/review-cluster) — review-manager + requirements, code, and security reviewers
- [Brainstorm](/agents/brainstorm) — Phase 0 thinking partner for vague ideas
- [Bug-Finder](/agents/bug-finder) — structured investigation before any fix
- [Harness](/agents/harness) — pattern encoder that makes recurring mistakes impossible
- [Planning](/agents/planning) — turns complex requests into reviewable exec-plans
- [Gardener](/agents/gardener) — periodic hygiene and drift detection
- [Researcher](/agents/researcher) — external knowledge retrieval

## How delegation flows

```
User
  └─► team-lead
        ├─► explore / general sub-agents  (implementation)
        ├─► review-manager               (reviews)
        │     ├─► requirements-reviewer
        │     ├─► code-reviewer
        │     └─► security-reviewer
        ├─► bug-finder                   (when debugging)
        ├─► brainstorm                   (when intent is unclear at vision level)
        ├─► planning                     (when request is ambiguous on structure)
        └─► researcher                   (when external knowledge needed)
```

::: tip Brainstorm — direct or automatic
You can invoke `brainstorm` directly when you have a vague idea, or let the team-lead invoke it automatically when your request is unclear at the vision level. Either path produces a structured product brief at `docs/briefs/{project-name}.md` that feeds directly into `planning`.
:::

::: tip Harness runs after patterns emerge
The `harness` agent is triggered after recurring patterns are detected — either by the user, by the team-lead post-feature, or automatically by the Gardener. It encodes the pattern as a mechanical check so it never needs to be enforced manually again.
:::
