# opencode-team-lead

> **Not affiliated with the OpenCode team.** This is an independent community plugin, not built or endorsed by the OpenCode project.

[![npm version](https://img.shields.io/npm/v/opencode-team-lead)](https://www.npmjs.com/package/opencode-team-lead)
[![license](https://img.shields.io/npm/l/opencode-team-lead)](https://github.com/azrod/opencode-team-lead/blob/main/LICENSE)

An [OpenCode](https://opencode.ai) plugin that installs a **team-lead** orchestrator and a full suite of specialized sub-agents. The team-lead plans work, delegates everything to sub-agents, reviews results, and reports back. It never reads or writes files directly.

## What it does

One hook powers the plugin:

- **`config`** — registers all agents into OpenCode's config, merging your overrides from `opencode.json` on top of plugin defaults

## Agents

| Agent | Role |
|-------|------|
| `team-lead` | Pure orchestrator — understands, plans, delegates, reviews, synthesizes. Never touches code. |
| `review-manager` | Spawns specialized reviewers in parallel, arbitrates disagreements, returns a single structured verdict |
| `requirements-reviewer` | Verifies implementation matches the original requirements |
| `code-reviewer` | Evaluates correctness, logic, error handling, and maintainability |
| `security-reviewer` | Identifies vulnerabilities, misconfigurations, and data exposure risks |
| `bug-finder` | Structured bug investigation — forces root-cause analysis before any fix |
| `brainstorm` | Phase 0 thinking partner — helps articulate what you want to build before planning starts |
| `harness` | Encodes recurring patterns as mechanical artifacts (lint rules, CI checks, AGENTS.md entries) |
| `planning` | Transforms complex or ambiguous requests into structured exec-plans written to disk |
| `gardener` | Periodic maintenance — fixes stale docs, detects code drift, escalates patterns to harness |

### The team-lead's workflow

1. **Understand** — asks clarifying questions if the request is ambiguous
2. **Plan** — breaks work into tasks using `todowrite`
3. **Delegate** — dispatches sub-agents (`explore`, `general`, or specialized personas)
4. **Review** — every code change goes through the `review-manager`, which spawns reviewers in parallel
5. **Synthesize** — consolidates results and reports back

### Review cluster

`review-manager`, `requirements-reviewer`, `code-reviewer`, and `security-reviewer` work together. The team-lead delegates to `review-manager`, which selects the relevant reviewers based on what changed, runs them in parallel, and returns a single verdict. None of these agents are visible in the main agent list — they're only reachable via `task`.

### bug-finder

Enforces a structured investigation workflow: frames the symptom vs. root cause, investigates via `explore` sub-agents, evaluates fix alternatives, then delegates the actual fix to a `general` sub-agent with full analysis context. Cardinal rule: never apply a workaround that masks the root cause.

### brainstorm

Run before the team-lead when you have a vague idea. Runs a 3-phase conversational flow (discovery → deep dive → draft) and produces a product brief at `docs/briefs/{project-name}.md`. Hand it to `planning` or directly to the team-lead as mission input.

### harness

When a pattern recurs (a mistake that keeps happening, a convention that keeps being missed), harness codifies it as a mechanical check — an ESLint rule, a CI job, an AGENTS.md entry — so humans and agents stop relying on memory to enforce it.

### planning

Takes a complex or ambiguous request and writes a structured exec-plan to `docs/exec-plans/`. Useful before handing a large task to the team-lead, or when you want a reviewable plan before any work starts.

### gardener

Periodic hygiene agent. Reads docs and code, spots drift (docs that describe deleted features, patterns that have evolved, stale TODOs), fixes what it can, and escalates recurring issues to harness.

## Installation

```bash
opencode plugin opencode-team-lead --global
```

To track the beta channel:

```bash
opencode plugin opencode-team-lead@beta --global
```

Restart OpenCode — the plugin loads and registers all agents automatically.

## Lifecycle Tools

The team-lead has direct access to five bookkeeping tools that enforce consistency at zero LLM cost — no delegation, no sub-agent:

| Tool | When the team-lead calls it |
|------|---------------------|
| `project_state()` | At the start of every mission — full view of exec-plans, specs, and briefs |
| `check_artifacts()` | At mission start and after completing each scope — cross-artifact consistency scan |
| `mark_block_done(plan, block)` | After each validated delivery — marks a block complete in an exec-plan |
| `complete_plan(plan)` | When all blocks are checked and the final review is APPROVED |
| `register_spec(file, title)` | When a new spec needs to exist on disk |

These are not visible in the OpenCode UI. They run automatically as part of the team-lead's internal workflow.

## Permissions

| Agent | Permissions |
|-------|-------------|
| `team-lead` | `task`, `todowrite`, `todoread`, `skill`, `question`, `compress`, `bash` (git + ls + head + echo), `read` (all), `edit`/`write` (`docs/**` only) |
| `review-manager` | `task` (`*-reviewer` only), `question`, `read`, `glob`, `grep` |
| `requirements-reviewer` / `code-reviewer` / `security-reviewer` | `read`, `glob`, `grep` |
| `bug-finder` | `read`, `glob`, `grep`, `question` |
| `brainstorm` | `task`, `question`, `webfetch`, `read` (all), `edit` (`docs/briefs/**` only) |
| `harness` | `task` (ask), `question`, `todowrite`, `todoread`, `glob`, `grep`, `bash` (unrestricted), `read` (all), `edit` (all) |
| `planning` | `task` (ask), `question`, `read` (all), `glob`, `grep`, `edit` (`docs/exec-plans/**` only) |
| `gardener` | `question`, `bash` (git log/diff/status/show/blame/shortlog, gh pr create), `read` (all), `edit` (`QUALITY_SCORE.md` only) |
| `researcher` | `read`, `webfetch`, `websearch`, `grep` |

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
