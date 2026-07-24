---
url: 'https://azrod.github.io/opencode-team-lead/decisions.md'
---
# Decisions & ADRs

This page documents the strategic decisions and architectural choices behind `opencode-team-lead`. These are the "why we built it this way" decisions — the reasoning that shapes the plugin's design.

## Strategic Decisions (2026-03-31)

### D1: Abandon the BMAD approach

BMAD transposes the SDLC onto AI agents. The SDLC was designed to solve human coordination problems — context loss between sessions, organizational silos, team turnover. Agents don't have those failure modes.

BMAD personas (e.g. "Marie the PM", "Jean the architect") are psychological scaffolding for humans, not functional architecture. Phase gates are an illusion of control, not mechanical enforcement. PRDs are optimized for human approval, not agent navigation.

**Key insight:** BMAD has the right intuition (catch bad decisions early) but the wrong mechanism (documentary ceremony instead of mechanical constraints).

***

### D2: `harness` instead of `analyst`

The `analyst` agent (BMAD-style spec writer that helped users write PRDs and stories) was abandoned.

**The pivot:** The question is not "how do we write better documents for agents" but "how do we build an environment in which agents can operate without ceremony."

The `harness` agent analyzes a repository and generates what's missing for the team-lead and sub-agents to operate autonomously: precise `AGENTS.md` (map, not manual), navigable `docs/` structure, lint rules, pre-commit hooks, CI jobs, executable acceptance criteria.

A well-structured environment eliminates the need for ceremonial planning. Mechanical constraints replace documented constraints.

***

### D3: `planning` kept with a restricted role

The `planning` agent is retained — but with a significantly narrower role than originally planned.

**What it does:** Lightweight fallback for genuinely ambiguous requests. Compresses user intent into a structured brief written to disk (`docs/exec-plans/<feature>.md`). Identifies decisions to make before acting.

**What it does NOT do:** No PRDs, no user stories, no requirements gathering, no automatic activation on every session.

**Strict activation criterion:** The request is ambiguous AND the environment doesn't clarify it AND a direct question to the user wouldn't be enough.

A brief kept only in memory is an anti-pattern — invisible to future agents. The artifact goes to disk.

***

### D4: Abandon `memory.md`

`memory.md` was a compensation mechanism. It existed because the environment was poorly structured — agents didn't know where to find project context, so a knowledge blob was injected into every LLM call.

If the `harness` agent does its job (precise `AGENTS.md`, navigable `docs/`, conventions encoded in tooling), `memory.md` becomes redundant. Context is in the repository, navigable by reference, not in persistent memory.

This is now reflected in the plugin: the `experimental.chat.system.transform` hook (which injected `memory.md`) has been removed. See [v0.9.0 changelog](/changelog#090---2026-05-04).

***

### D5: Harness engineering principles → ADR-001

The four principles that govern how artifacts in this project are designed. See [ADR-001](#adr-001-harness-engineering-as-agentic-development-approach) below.

***

## What we will NOT do

* **No personas** (Marie the PM, Jean the architect) — human scaffolding, not functional for agents
* **No manual phase gates** — enforcement is mechanical or it isn't
* **No monolithic PRDs** — long artifacts optimized for human approval
* **No automatic `planning` activation** — unnecessary friction on clear requests
* **No requirements gathering via agent** — if the environment is well-structured, it's superfluous

***

## ADR-001: Harness Engineering as Agentic Development Approach

**Status:** Adopted\
**Date:** 2026-03-31

### Decision

Artifacts in this project are designed for agent navigation, not human approval.

### Context

SDLC approaches (phases, personas, exhaustive PRDs) were designed for human coordination problems. Agents don't have those problems. Applying SDLC to agents produces: context crowding, non-guidance, instant rot, and unverifiable constraints.

### Adopted principles

1. **Map over manual** — every doc is an index with links, not an exhaustive guide
2. **< 1,300 tokens per unit** — beyond that, it's context rot
3. **Mechanical constraints over documented constraints** — lint rules and CI checks, not phrases in a doc
4. **On disk, navigable** — any context a future agent needs must be in the repository as atomic files

### Consequences

* `docs/background/` holds narrative human docs (excluded from agent navigation)
* `docs/templates/` holds templates for new files
* Each spec must fit under 1,300 tokens, linking to detail rather than containing it
* Content duplication is replaced by links

::: tip Why 1,300 tokens?
The limit isn't arbitrary. Beyond ~1,300 tokens, a single spec file starts to crowd the context window when multiple files are read in a single session. Keeping each unit small means agents can load more context simultaneously without hitting limits.
:::
