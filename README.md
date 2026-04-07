# opencode-team-lead

[![npm version](https://img.shields.io/npm/v/opencode-team-lead)](https://www.npmjs.com/package/opencode-team-lead)
[![license](https://img.shields.io/npm/l/opencode-team-lead)](https://github.com/azrod/opencode-team-lead/blob/main/LICENSE)

An [OpenCode](https://opencode.ai) plugin that installs **Orion**, a team-lead orchestrator, and a full suite of specialized sub-agents. Orion plans work, delegates everything to sub-agents, reviews results, and reports back. It never reads or writes files directly.

## What it does

Two hooks power the plugin:

- **`config`** — registers all agents into OpenCode's config, merging your overrides from `opencode.json` on top of plugin defaults
- **`experimental.session.compacting`** — injects `.opencode/scratchpad.md` into the compaction context so Orion's working state survives context resets

## Agents

| Agent | Role |
|-------|------|
| `team-lead` (Orion) | Pure orchestrator — understands, plans, delegates, reviews, synthesizes. Never touches code. |
| `review-manager` | Spawns specialized reviewers in parallel, arbitrates disagreements, returns a single structured verdict |
| `requirements-reviewer` | Verifies implementation matches the original requirements |
| `code-reviewer` | Evaluates correctness, logic, error handling, and maintainability |
| `security-reviewer` | Identifies vulnerabilities, misconfigurations, and data exposure risks |
| `bug-finder` | Structured bug investigation — forces root-cause analysis before any fix |
| `brainstorm` | Phase 0 thinking partner — helps articulate what you want to build before planning starts |
| `harness` | Encodes recurring patterns as mechanical artifacts (lint rules, CI checks, AGENTS.md entries) |
| `planning` | Transforms complex or ambiguous requests into structured exec-plans written to disk |
| `gardener` | Periodic maintenance — fixes stale docs, detects code drift, escalates patterns to harness |

### Orion's workflow

1. **Understand** — asks clarifying questions if the request is ambiguous
2. **Plan** — breaks work into tasks using `todowrite`
3. **Delegate** — dispatches sub-agents (`explore`, `general`, or specialized personas)
4. **Review** — every code change goes through the `review-manager`, which spawns reviewers in parallel
5. **Synthesize** — consolidates results and reports back

### Review cluster

`review-manager`, `requirements-reviewer`, `code-reviewer`, and `security-reviewer` work together. Orion delegates to `review-manager`, which selects the relevant reviewers based on what changed, runs them in parallel, and returns a single verdict. None of these agents are visible in the main agent list — they're only reachable via `task`.

### bug-finder

Enforces a structured investigation workflow: frames the symptom vs. root cause, investigates via `explore` sub-agents, evaluates fix alternatives, then delegates the actual fix to a `general` sub-agent with full analysis context. Cardinal rule: never apply a workaround that masks the root cause.

### brainstorm

Run before Orion when you have a vague idea. Runs a 3-phase conversational flow (discovery → deep dive → draft) and produces a product brief at `docs/briefs/{project-name}.md`. Hand it to `planning` or directly to Orion as mission input.

### harness

When a pattern recurs (a mistake that keeps happening, a convention that keeps being missed), harness codifies it as a mechanical check — an ESLint rule, a CI job, an AGENTS.md entry — so humans and agents stop relying on memory to enforce it.

### planning

Takes a complex or ambiguous request and writes a structured exec-plan to `docs/exec-plans/`. Useful before handing a large task to Orion, or when you want a reviewable plan before any work starts.

### gardener

Periodic hygiene agent. Reads docs and code, spots drift (docs that describe deleted features, patterns that have evolved, stale TODOs), fixes what it can, and escalates recurring issues to harness.

## Installation

```bash
npm install -g opencode-team-lead
```

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-team-lead"]
}
```

Use `opencode-team-lead@beta` to track the beta channel.

Restart OpenCode — the plugin loads and registers all agents automatically.

## Scratchpad

Orion maintains `.opencode/scratchpad.md` in the project root. It contains the current mission, plan, delegated tasks, agent results, decisions, and enough context to resume after a crash or reset.

The `experimental.session.compacting` hook injects this file into compaction so its content survives context resets. Orion reads it on resume — no re-briefing needed.

The scratchpad is ephemeral: overwritten at the start of each new mission. It's not a journal.

## Lifecycle Tools

Orion has direct access to five bookkeeping tools that enforce consistency at zero LLM cost — no delegation, no sub-agent:

| Tool | When Orion calls it |
|------|---------------------|
| `project_state()` | At the start of every mission — full view of exec-plans, specs, and briefs |
| `check_artifacts()` | At mission start and after completing each scope — cross-artifact consistency scan |
| `mark_block_done(plan, block)` | After each validated delivery — marks a block complete in an exec-plan |
| `complete_plan(plan)` | When all blocks are checked and the final review is APPROVED |
| `register_spec(file, title)` | When a new spec needs to exist on disk |

These are not visible in the OpenCode UI. They run automatically as part of Orion's internal workflow.

## Permissions

| Agent | Permissions |
|-------|-------------|
| `team-lead` | `task`, `todowrite`, `todoread`, `skill`, `question`, `distill`, `prune`, `compress`, `bash` (git: status, diff, log, add, commit, push, tag), `read`/`edit` (`.opencode/scratchpad.md` only) |
| `review-manager` | `task`, `question` |
| `requirements-reviewer` / `code-reviewer` / `security-reviewer` | `task` |
| `bug-finder` | `task`, `question` |
| `brainstorm` | `task`, `question`, `webfetch`, `read` (all), `write` (`docs/briefs/**` only) |
| `harness` | `task`, `question`, `todowrite`, `todoread`, `glob`, `grep`, `bash` (unrestricted), `read` (all), `edit` (all), `write` (all) |
| `planning` | `task`, `question`, `read` (AGENTS.md, README.md, `docs/**`), `edit`/`write` (`docs/exec-plans/**` only) |
| `gardener` | `task`, `question`, `bash` (git log/diff/status, gh pr create), `read` (all), `edit`/`write` (`QUALITY_SCORE.md` only) |

Everything not listed is denied.

## Customization

You can override `temperature`, `color`, `variant`, `mode`, and add permissions for any agent. The system prompt is always provided by the plugin and cannot be overridden.

```json
{
  "plugin": ["opencode-team-lead"],
  "agents": {
    "team-lead": {
      "temperature": 0.2
    }
  }
}
```

Your overrides are merged on top of plugin defaults — anything you don't specify keeps its default value.

To start sessions in the team-lead agent by default:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "team-lead"
}
```

## License

MIT
