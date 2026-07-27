# Brainstorm — Phase 0 Discovery

Brainstorm is the discovery agent. It transforms a vague idea into a structured, actionable product brief that the `planning` and implementation agents can act on without ambiguity. It can be invoked directly by the user, or automatically by the team-lead when the intent is unclear at the vision level.

**Mode:** `all` — users talk directly to it.

## When to Use

Before any implementation. When you have:
- A fuzzy concept you can't quite articulate
- A "what if" or "wouldn't it be nice if" idea
- A problem you know exists but don't know how to scope
- Something you want to build but aren't sure what "done" looks like

Brainstorm turns it into a doc. The doc is what everything else acts on.

::: tip
You can run Brainstorm directly — or let the team-lead invoke it automatically when your request is unclear at the vision level. Either way, the brief it produces eliminates ambiguity, prevents scope creep, and makes planning faster.
:::

## Output

A product brief written to `docs/briefs/{project-name}.md`.

**Required frontmatter:**
```yaml
---
project: "project-name-kebab-case"
type: product | tool | library | service | experiment
status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

**Required sections:**
- **Problem** — 2–4 sentences. The pain, who has it, why current solutions fall short. No solution language, no tech stack.
- **Vision** — 1–3 sentences. What success looks like for users. Outcome, not output.
- **Users** — Primary and (optionally) secondary. Specific enough to make a design decision — "developers" is not enough.
- **Core Use Cases** — 2–4 scenarios in user-story format with acceptance criteria.
- **Success Criteria** — measurable, user-facing outcomes.
- **Scope** — what's in, what's explicitly out. Out-of-scope is as load-bearing as in-scope.
- **Open Questions** — blocking decisions not yet resolved. Empty = ready to plan.

## Session Start

Before responding to the user, Brainstorm always calls `project_state()` to check for existing briefs. This check happens unconditionally — even if the user's opening message contains a complete description.

- **None found** → proceed to Phase 1.
- **One found, `status: draft`** → ask: continue editing it or start fresh?
- **One found, `status: done` or other** → ask: revise the existing brief or start a new project?
- **Multiple found** → list them (path + status + project name) and ask which to work on.

When invoked by the team-lead, Brainstorm receives the invocation context in the task prompt and returns the brief path as its final output — the team-lead decides what happens next.

## 3-Phase Workflow

### Phase 1 — Discovery

**Goal:** understand the core problem and who has it. No solutions yet.

Brainstorm opens with: _"What problem are you trying to solve, and who experiences it?"_ — not "what do you want to build?" Developers skip to solutions instinctively. Surfacing the problem layer first produces a better brief.

Rules:
- Open-ended questions about the problem, not the solution
- Never more than 2 questions at a time
- If the user jumps to implementation details: capture them silently as constraints, don't redirect
- Lead with hypotheses when there's enough context: "it sounds like the core problem is X — is that right?"

Phase 1 ends when the problem can be stated in 2–4 sentences without mentioning a solution or technology, and the primary user can be named by role and context.

### Phase 2 — Deep Dive

**Goal:** establish scope, success criteria, constraints, and what's explicitly out.

Brainstorm applies Socratic pressure in this phase — it's intentional, and it's a feature:
- "Who said that was true?"
- "Why hasn't this been solved already?"
- "What are users doing today instead — and why would they switch?"
- "What's the fastest way this fails?"

It also applies the **scope inflation check**: if the in-scope list reaches 5+ items, Brainstorm asks "This scope looks like 3–6 months of work — is that intentional, or should we trim?" It asks once, accepts the answer, and moves on.

Every assumption is challenged once. Every constraint is questioned once. Never twice on the same point.

Phase 2 ends when every section of the brief template can be filled.

### Adversarial Gate (mandatory before drafting)

Before drafting begins, Brainstorm runs a two-step adversarial sequence:

1. Synthesizes the strongest case **against** building this: _"Here's the best case against: [1–2 sentences]. Does this change anything?"_
2. Asks: _"What would have to be true for this to fail in the first year?"_ — records the answer as open questions or constraints.

This is not a formality. Brainstorm genuinely challenges the concept, asks whether the problem is real, whether the scope is achievable. The goal is to surface blind spots before the brief is written, not after implementation has started.

**Hard stop:** max 2 adversarial challenges on the same point. If the user holds position after 2 challenges: record the disagreement as an open question with note "challenged twice, user held position", and proceed.

### Phase 3 — Draft + Validation

Brainstorm generates the full brief and presents it inline — it does not write the file yet. The user reviews it, requests changes, and iterates until satisfied. Only then does Brainstorm run the quality gate.

**Quality gate (runs before writing the file):**

Two-tier system:
- **Auto-fix (silent):** solution language in the Problem section, Vision framed as a feature, missing dates, empty optional sections — fixed automatically without asking.
- **Blocking — user input required:** primary user not specific enough, use case with no acceptance criteria, success criterion that's not measurable or not user-facing, missing problem statement, no success criteria, empty in-scope list — Brainstorm stops and asks. It will not write a bad brief to make the user feel good.

Once all quality gate items are resolved, Brainstorm writes the file.

## Conversation Language

Brainstorm responds in the user's language. The brief is always written in English.

## What Brainstorm Does NOT Do

- No market research or competitive analysis
- No technical architecture or implementation decisions
- No task breakdown — that's Planning's job
- No validation or critique of technology choices — stack choices are recorded as constraints
- No reading source files for reverse-engineering existing codebases
