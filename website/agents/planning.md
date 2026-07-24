# Planning — Work Contracts on Disk

Planning transforms complex or ambiguous requests into structured work contracts written to disk at `docs/exec-plans/`. Multi-session work survives context resets because the plan lives on disk — not in conversation history.

**Mode:** `all` — callable by users directly, or delegated by the team-lead.

## The Problem It Solves

When a task spans multiple sessions, is genuinely ambiguous, or involves hidden dependencies, relying on conversation history is fragile. An exec-plan written to disk is permanent, versioned in git, and shared across all agents. The team-lead and future sessions can navigate it without relying on what was said three context windows ago.

## Two Plan Types

### Plan Simple

For small, clear tasks. Produced inline — no file written.

```markdown
## Goal
{The real outcome in 1-2 sentences — the problem solved, not just the feature name}

## Building blocks
- [ ] Block 1
- [ ] Block 2
```

### Exec-Plan

For complex, multi-session, or genuinely ambiguous tasks. Written to `docs/exec-plans/<feature>.md`.

```markdown
---
status: draft | active | completed
created: {date}
updated: {date}
---

## Goal
{The real outcome in 1-3 sentences}

## Scope
### In scope
- {what this work covers}

### Out of scope
- {what is explicitly excluded}

## Building blocks
- [ ] Block 1: {deliverable}
  - Done when: {verifiable criterion}
- [ ] Block 2: {deliverable}
  - Done when: {verifiable criterion}
  - Depends on: Block 1

## Open questions
{Blocking decisions that must be resolved before implementation can start.}

## Decision log
{Decisions made and their rationale.}
```

## Strict Activation Criteria

Planning is invoked only when **all three** conditions are true:

1. The request is **genuinely ambiguous** — multiple plausible interpretations that would lead to meaningfully different implementations
2. **AND** `AGENTS.md` / `docs/` don't clarify the intent
3. **AND** a direct question to the user wouldn't suffice — the ambiguity is structural, not just a missing clarification

If any condition is false: produce a plan simple, or tell the team-lead to proceed directly.

**For simple, clear tasks — skip planning entirely.** Unnecessary exec-plans are overhead. Direct execution is always preferred for clear, small tasks.

**For bug reports — use `bug-finder`, not planning.**

## What Makes a Good Exec-Plan

### Each block is a deliverable, not a task list

- **Good:** "Authentication flow working end-to-end"
- **Bad:** "Write the auth service"

Each block must be independently reviewable — something that can be handed to `review-manager` and evaluated on its own.

### "Done when" criteria are verifiable

- **Good:** "Done when: the `/auth/login` endpoint returns a JWT on valid credentials and a 401 on invalid ones, with test coverage"
- **Bad:** "Done when: authentication works"

If a concrete criterion can't be written, the block isn't scoped precisely enough — split it or sharpen it.

### Scope includes what's OUT

The out-of-scope list is as load-bearing as the in-scope list. Explicit exclusions prevent scope creep downstream.

### Open questions are genuinely blocking

Open questions are decisions that must be answered before implementation can start. If a question is interesting but not blocking, leave it out. An exec-plan with no open questions can start immediately.

## Exec-Plan Lifecycle

```
draft → active → completed
```

| Status | Meaning |
|--------|---------|
| `draft` | Created by Planning. Open questions must be resolved before the team-lead starts. |
| `active` | The team-lead has started implementation. It updates the decision log and checks off blocks as they complete via `mark_block_done()`. |
| `completed` | All blocks checked off, final review APPROVED. The team-lead calls `complete_plan()`. Do not delete — it's the record of what was built and why. |

The exec-plan belongs to the team-lead after creation. Planning only writes at creation time.

## Traceability

An exec-plan can link to a brainstorm brief via a `brief:` frontmatter field. The team-lead uses `check_artifacts()` to surface dead links between exec-plans, specs, and briefs — catching stale references before they cause confusion.

The team-lead treats the exec-plan as the single source of truth for the mission. It does not duplicate its task list in `todowrite` — it references the exec-plan file path directly.

## What Planning Does NOT Do

- **No implementation details** — the "how" (which library, which approach, which architecture) is the generator's job. Planning defines what must be delivered, not how.
- **No PRD, user stories, or requirements gathering** — Planning structures what's already known, not interviews stakeholders.
- **No unilateral architectural decisions** — if the plan requires a significant architectural choice, it flags it as an open question.
- **No validation of produced work** — that's `review-manager`'s job. Planning defines "done when"; it doesn't check it.
- **No code execution** — Planning is read-only and disk-write for the exec-plan file only.
