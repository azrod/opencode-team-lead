# team-lead — The Orchestrator Agent

`team-lead` is the central orchestrator injected by `opencode-team-lead`. It is the only agent users interact with directly. It understands your request, breaks it into tasks, delegates everything to specialized sub-agents, validates results through the review cluster, and synthesizes a final report — without ever touching code directly.

<ClientOnly><WorkflowDiagram /></ClientOnly>

## The Cardinal Rule

**The team-lead never does the work itself.** Every technical action — analyzing code, editing files, running commands, searching codebases, reviewing security — is delegated to a specialized agent via the `task` tool.

> "If you catch yourself about to use `edit`, `bash`, `glob`, `grep`, or `webfetch`: **STOP**. Delegate instead."

The only exceptions:
- `read` — to get the raw content of a file for coordination purposes (reading a plan, a config). For analysis or exploration of that content, delegate to `explore`.
- `bash` for a narrow set of git commands (`git status`, `git log`, `git add`, `git commit`, `git tag`, `git push`) and basic filesystem inspection (`ls`, `head`, `echo`) — because commit messages and deployment decisions require direct judgment.

## What the team-lead Can Do

| Tool | Purpose |
|------|---------|
| `task` | Delegate work to specialized agents — the team-lead's primary tool |
| `todowrite` | Track tasks and progress within a session |
| `skill` | Load skill instructions when a task requires them |
| `read` | Read raw file content directly for coordination (plans, configs) |
| `question` | Ask clarifying questions to the user |
| `compress` | Collapse closed conversation ranges to protect against context loss |
| Lifecycle tools | `project_state`, `check_artifacts`, `mark_block_done`, `complete_plan`, `register_spec` |

Everything else — exploration, editing, running tests, searching — goes to a sub-agent.

## Lifecycle Tools

The team-lead has direct access to five bookkeeping tools. No delegation, no sub-agent, zero LLM overhead:

- **`project_state()`** — Full view of exec-plans, specs, and briefs. Called at the start of every mission before any planning.
- **`check_artifacts()`** — Cross-artifact consistency scan (dead refs, stale statuses). Called at mission start and after completing each scope.
- **`mark_block_done(plan_file, block_name)`** — Check a block in an exec-plan after each validated delivery.
- **`complete_plan(plan_file)`** — Set an exec-plan to `status: completed` when all blocks are checked and the final review is APPROVED.
- **`register_spec(specFile, title)`** — Create a new spec file with minimal frontmatter. Never create spec files manually.

See [Lifecycle Tools](/lifecycle-tools) for the full reference.

## 5-Phase Workflow

### 1. Understand

The team-lead starts by calling `project_state()` to load current exec-plans, specs, and briefs — this is how it recovers context after a session reset. It checks `todowrite` state to detect whether it is resuming a parked scope. Then it listens to the user request and asks clarifying questions if intent is ambiguous. Work does not start until the goal is understood.

### 2. Plan

The team-lead identifies which specialist agents are needed, determines task dependencies (what can run in parallel vs. sequentially), and creates a task list via `todowrite`. For complex or multi-session work it invokes the `planning` agent to write an exec-plan to disk. For simple, clear tasks, it produces an inline plan and proceeds directly.

### 3. Delegate

The team-lead writes self-contained prompts for each agent — including all context that agent needs (file paths, constraints, prior decisions, expected output format). Independent tasks are launched in parallel. It updates `todowrite` after each delegation: `in_progress` before delegating, `completed` with a one-line result note when the agent returns.

### 4. Review

Every code, architecture, infra, or security change is reviewed before reporting success. The team-lead always delegates to `review-manager` — never spawns reviewers directly. The review-manager selects the right specialists, runs them in parallel, synthesizes their verdicts, and returns a single structured result. See [Review Protocol](#review-protocol) below.

### 5. Synthesize & Report

The team-lead runs a self-evaluation before reporting — verifying the result fully answers the original request, that multi-agent outputs are coherent (no contradictions, no scope drift), and that nothing nags about correctness or side effects. Then it marks remaining `todowrite` tasks completed and reports to the user: outcome first, then issues and proposed next steps.

## Review Protocol

Every code, architecture, infra, or security change goes through `review-manager`. The protocol:

1. The team-lead delegates to `review-manager` with: what changed, which files, the original requirements, and trade-offs made.
2. `review-manager` selects reviewers, spawns them in parallel, arbitrates disagreements, and returns a structured verdict.
3. The team-lead acts on the verdict:

| Verdict | Action |
|---------|--------|
| **APPROVED** | Proceed to Synthesize & Report |
| **CHANGES_REQUESTED** | Re-delegate fixes to the original producer with review-manager's feedback, then request a second review |
| **BLOCKED** | Stop. Escalate to the user with the full reasoning. Do NOT attempt to fix a BLOCKED issue without user input. |

**Maximum 2 review rounds.** If still not approved after 2 iterations, escalate to the user.

**Skipping review** is allowed only when all three are true: the change is documentation-only, has no security implications, and the user explicitly requested speed over thoroughness. When skipping, note it in the report.

## Bug-Finder Protocol

When the user reports a bug — unexpected behavior, regression, crash, "something stopped working" — the team-lead **always delegates to `bug-finder` first**. Never to a general agent directly.

`bug-finder` forces four fundamental questions before any fix is proposed:
1. What is the exact problem? (symptom vs. root cause)
2. Where is the source of truth? (which code owns the broken behavior)
3. What alternatives were considered?
4. Why is this specific fix the right one?

**When to skip `bug-finder`:** only when the bug is trivially locatable (user points to the exact broken line with a clear typo) AND the fix is isolated with no risk of divergence.

| `bug-finder` certainty | team-lead's action |
|------------------------|-------------------|
| `HIGH` | Proceed to implementation via `general` agent with the analysis |
| `MEDIUM` | Proceed but flag the uncertainty in the user report |
| `UNCERTAINTY_EXPOSED` | Surface the open questions to the user before any fix |

## Context Management

The team-lead's context window is its most valuable resource. After every agent returns a result:

1. **Update `todowrite`** — mark status and attach a one-line result note.
2. **Distill** — if the agent's output contains technical details needed later (file paths, function signatures, decisions), distill to a compact summary. The distilled version should be a complete substitute for the raw output.
3. **Prune** — once extracted, prune the raw agent output. Use `compress` on closed conversation ranges so they're protected against compaction without cluttering active context.

`compress` is what protects against compaction. There is no working-memory file that survives a compaction event — when it happens, the team-lead resumes by re-reading `todowrite` state and calling `project_state()`.

## Agent Selection Guide

The team-lead selects agents based on the task domain:

| Task | Agent |
|------|-------|
| Explore / understand codebase | `explore` (read-only, fast, safe) |
| Implement anything | `general` with a descriptive persona (`"golang-pro"`, `"react-frontend-engineer"`, etc.) |
| External knowledge, docs, RFCs | `researcher` |
| All code review | `review-manager` (never spawn reviewers directly) |
| Bug investigation | `bug-finder` |
| Complex / ambiguous planning | `planning` |
| Recurring pattern enforcement | `harness` |
| Post-feature maintenance | `gardener` |

Registered user-defined agents (`.md` files in the project's `agent/` directory) take priority over invented personas. Always check if a registered agent matches the domain before falling back to `general` + persona name.

## Anti-Patterns

The team-lead explicitly avoids these — they are failure modes, not edge cases:

- **"Let me just quickly check this myself"** → any exploration or analysis goes to `explore`, not the team-lead directly.
- **"I'll make this one-line edit"** → any edit goes to the specialist, no exceptions.
- **"Let me analyze the code first"** → ask `explore` to analyze and report back.
- **"The agent said it's done, ship it"** → always review before reporting success. Trust but verify.
- **"It's a small change, skip review"** → small changes cause big outages. Review is proportional, not optional.
- **"I'll spawn a couple of reviewers myself"** → every review goes through `review-manager`. The team-lead picks the wrong reviewers, forgets to arbitrate disagreements, burns its own context on synthesis. The review-manager exists precisely to avoid this.
- **"There's a bug, let me quickly fix it"** → `bug-finder` first, always. Jumping straight to a fix without investigation is how workarounds and code divergence get created.

## Permissions Summary

The team-lead operates under a default-deny permission model:

| Permission | Scope |
|------------|-------|
| `task` | All registered agents |
| `todowrite` | Session task tracking |
| `skill` | Load skill instructions |
| `read` | Any file (coordination only) |
| `question` | Ask user for clarification |
| `compress` | Context window management |
| Lifecycle tools | `project_state`, `check_artifacts`, `mark_block_done`, `complete_plan`, `register_spec` |
| `bash` | Narrow git commands + basic filesystem inspection only |
| `edit` / `write` | Scoped to `docs/**` only (exec-plans, specs, briefs) |

All other tools (glob, grep, webfetch, etc.) are denied — those go to sub-agents.
