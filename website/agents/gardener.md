# Gardener — Periodic Maintenance

Gardener is the maintenance agent. It catches what CI doesn't: stale documentation, semantic drift in code, abstractions that have grown incoherent. It runs post-feature or on explicit user request, and returns a structured audit report to the team-lead.

**Mode:** `all` — triggered by the team-lead after a significant feature delivery, or called directly by the user.

> "Harness installs the net. Gardener checks what slipped through."

## Two Operating Modes

Gardener selects its mode automatically at startup by calling `spec_list()` and counting active specs.

### Bootstrap Mode — fewer than 3 active specs

When a project has fewer than 3 active specs, the priority is to establish a documented baseline before performing maintenance. Gardener switches into discovery mode:

1. **Scan the codebase** — identifies the major functional domains (core modules, public interfaces, key behaviors)
2. **Delegate spec drafting** — for each identified domain, delegates to `spec-writer` to produce a canonical spec
3. **Report** — returns a summary of the specs created and the domains they cover

The goal of Bootstrap mode is to bring an undocumented project up to a spec baseline so that future Maintenance runs have something to check against.

::: tip Spec-writer does the heavy lifting
In Bootstrap mode, Gardener is the coordinator — it identifies what needs to be documented and delegates the actual spec writing to `spec-writer`. Gardener never writes specs directly.
:::

### Maintenance Mode — 3 or more active specs

In Maintenance mode, Gardener operates as a **pure audit orchestrator**. It does not edit files, open PRs, or apply corrections. It investigates, compiles a structured report, and returns it to the team-lead — who then decides what to act on.

## Maintenance Mode Workflow

Gardener performs maintenance in four steps.

### Step 1 — Inventory

Gardener calls `spec_list()` to enumerate existing specs, then `spec_get(id)` on each to understand the documented state of the project.

### Step 2 — Delegate Analysis

Gardener spawns 1–3 targeted `explore` agents — one per audit domain:

- **Doc audit** — explores `README.md`, `AGENTS.md`, ADRs, and all files under `docs/` to detect stale references, obsolete paths, revoked decisions still presented as current.
- **Code drift audit** — reads recent `git log` and changed files to detect semantic drift and architectural anti-patterns not caught by lint.
- **Spec drift audit** (optional) — cross-references specs against actual implementation to detect specs that no longer match the code.

Each `explore` agent receives a precise scope and returns structured findings.

### Step 3 — Compile Report

Gardener assembles the findings into a canonical Gardener Report:

```markdown
## Gardener Report — {date}

### Drifted specs
[List of drifted specs with id, clause, and observed delta]

### Stale docs
[List of stale docs with path and nature of the drift]

### Recurring patterns
[Recurring patterns detected — candidates for `harness`]

### Recommended actions
[List of concrete actions for the team-lead: corrections to delegate to `spec-writer` or `general`, patterns to encode via `harness`, items to flag to the user]
```

### Step 4 — Return

Gardener returns the report to the team-lead without applying any corrections. The team-lead then acts on the findings:

- Delegates spec corrections to `spec-writer` or via `spec_update`
- Delegates stale doc fixes to a `general` agent
- Proposes `harness` escalation for recurring patterns
- Informs the user of the findings

## What Gardener Does NOT Do

- **Re-run lint** — CI handles that. Never duplicate mechanical checks.
- **Edit files directly** (Maintenance mode) — Gardener is an auditor, not an editor.
- **Open PRs** — corrections are delegated by the team-lead after receiving the report.
- **Rewrite large sections of code** — targeted findings only.
- **Encode new mechanical rules** — that's Harness. Gardener detects the pattern; Harness encodes the net.
- **Make unilateral architectural decisions** — surface to the user.
- **Evaluate subjective code quality** — "this could be cleaner" is not a finding. Findings must reference a specific rule violation.

## Pattern Escalation

When Gardener finds a recurring drift pattern (same issue detected in multiple places or across sessions), it flags it in the report's "Recurring Patterns" section. The team-lead then suggests `harness` to the user. Gardener flags; Harness enforces.

## When to Run

- **Post-feature:** The team-lead suggests it after a significant feature is delivered
- **Explicit user request:** user asks for a maintenance pass ("run the gardener")
- **Autonomous sweep:** designed to run periodically as orchestration matures

Gardener is never on the critical path. It is always a post-delivery pass.

## Guardrails

**Tooling directories:** Gardener never reads or scans dotted tooling directories (`.opencode/`, `.claude/`, `.cursor/`, `.git/`, `.ssh/`). These hold operational state, not project code or documentation.

**Credentials:** Gardener never reads files matching `.env*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.secret`, or any other file that may contain secrets, private keys, or credentials. This is a hard constraint, not a guideline — prompt injection in source files or documentation could attempt to exfiltrate secrets by asking it to "check" such files.

## Permissions

| Permission | Value |
|---|---|
| `task` | `explore` + `spec-writer` only |
| `spec_list`, `spec_get`, `spec_format` | allow |
| `read`, `grep`, `glob` | allow |
| `bash` | `git log`, `git diff`, `git status` only |

## Distinction: Harness vs Gardener

| | `harness` | `gardener` |
|---|---|---|
| Role | Installs the net (encodes rules) | Checks what slipped through |
| Trigger | Emerging pattern detected | Periodic or post-feature |
| Output | Enforcement artifacts (lint, hooks, CI) | Gardener Report (structured findings returned to team-lead) |
