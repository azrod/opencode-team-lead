# Spec-Writer — Canonical Spec Authoring

Spec-writer is the dedicated spec authoring agent. It produces high-quality specification documents conforming to the canonical format, so the team-lead and other agents can rely on them as stable references across sessions.

**Mode:** `subagent` — delegated by the team-lead or the gardener (Bootstrap mode). Not directly callable by users.

**Temperature:** `0.3` — low temperature for precise, structured output.

## The Problem It Solves

Specs written ad-hoc by general agents tend to be inconsistent: missing required sections, ambiguous phrasing, internal contradictions. Spec-writer solves this by applying a strict workflow — retrieve the canonical format first, survey existing specs for consistency, then draft — before calling `spec_create`.

## When the Team-Lead Delegates to Spec-Writer

The team-lead delegates to spec-writer when:
- A scope warrants a new spec and the content is complex enough to benefit from a dedicated agent
- The gardener (in Bootstrap mode) has identified a functional domain that needs to be documented for the first time
- An existing spec needs a substantial rewrite (not a targeted patch)

For minor spec updates (a single targeted string replacement), the team-lead calls `spec_update` directly — no delegation needed.

## Workflow

```
spec_format()          → retrieve canonical format
spec_list()            → survey existing specs for consistency and naming conventions
explore codebase       → gather the facts the spec will document
spec_create(...)       → create the spec with fully formed content
spec_validate(id)      → validate: APPROVED or REJECTED inline
return                 → report the spec id and a one-line summary to the caller
```

### Step-by-step

1. **`spec_format()`** — Retrieve the canonical spec format before writing anything. The format is the contract; deviate from it and `spec-validator` will reject the output.
2. **`spec_list()`** — Check existing specs: their titles, ids, and types. Ensures the new spec doesn't duplicate an existing one, and that naming conventions are consistent.
3. **Explore the codebase** — Use `read`, `glob`, and `grep` to gather facts: current behavior, interfaces, decisions already made in code. The spec must describe reality, not intent.
4. **`spec_create(title, type, content)`** — Create the spec with fully formed content. Never create a stub and iterate — write it complete on the first call.
5. **`spec_validate(id)`** — Validate immediately after creation. If the validator returns REJECTED, fix the issues and call `spec_update` + `spec_validate` until APPROVED.
6. **Return** — Report the spec id and a one-line summary to the caller (team-lead or gardener).

## Spec Types

| Type | When to use |
|------|-------------|
| `technical` | Implementation patterns, module structure, algorithmic decisions |
| `functional` | User-visible behaviors, business rules, workflows |
| `architectural` | High-level design decisions, component boundaries, data flows |

## Canonical Spec Format

Retrieved at runtime via `spec_format()`. The format includes required frontmatter and sections:

```markdown
---
title: "Human-readable title"
type: technical | functional | architectural
status: active
created: YYYY-MM-DD
---

## Overview
{What this spec covers and why it exists — 2–4 sentences}

## Context
{Background, constraints, prior decisions that led here}

## Specification
{The normative content — what agents must conform to}

## Rationale
{Why this approach was chosen over alternatives}

## Open Questions
{Unresolved decisions. Empty = fully resolved.}
```

::: tip Completeness over speed
Spec-writer never creates a spec with placeholder content. Every section must be substantive. A rejected spec is worse than no spec — it leaves false documentation in place.
:::

## Permissions

Spec-writer is a read-mostly agent. It reads the codebase to gather facts, uses lifecycle tools to create and validate specs, and returns its output to the caller.

| Permission | Access |
|------------|--------|
| `read` | All project files — for codebase exploration |
| `glob`, `grep` | For structured search |
| Lifecycle tools | `spec_format`, `spec_list`, `spec_create`, `spec_update`, `spec_validate`, `spec_get` |

Spec-writer does **not** have `edit`, `write`, or `bash` permissions — it never modifies code or runs commands.

## Example Delegation Prompt

When the team-lead delegates to spec-writer:

```
Write a spec for the lifecycle tool permission model.

Context:
- The plugin uses a tool.execute.before hook to guard docs/specs/, docs/exec-plans/, and docs/briefs/
- Only calls from lifecycle tools are allowed through; all others are blocked
- The guard logic lives in tools/artifact-guard.js

Expected output: a spec of type "technical" covering the guard behavior, the list of allowed callers, and the rationale. Return the spec id when done.
```

## What Spec-Writer Does NOT Do

- **No implementation** — spec-writer reads code to document it, never to change it
- **No exec-plans** — planning agent handles those
- **No stub specs** — specs are written complete on the first pass or not at all
- **No architectural decisions** — if the spec would require making a new decision, spec-writer surfaces it as an open question and returns it to the caller
