# opencode-team-lead

> **Not affiliated with the OpenCode team.** This is an independent community plugin, not built or endorsed by the OpenCode project.

[![npm version](https://img.shields.io/npm/v/opencode-team-lead)](https://www.npmjs.com/package/opencode-team-lead)
[![license](https://img.shields.io/npm/l/opencode-team-lead)](https://github.com/azrod/opencode-team-lead/blob/main/LICENSE)

An [OpenCode](https://opencode.ai) plugin that installs a **team-lead** orchestrator and a full suite of specialized sub-agents. The team-lead plans work, delegates everything to sub-agents, reviews results, and reports back. It never reads or writes files directly.

## What it does

Two hooks power the plugin:

- **`config`** — registers all agents into OpenCode's config, merging your overrides from `opencode.json` on top of plugin defaults
- **`tool.execute.before`** — guards `docs/specs/`, `docs/exec-plans/`, and `docs/briefs/` against direct access; these directories are only reachable through the 20 lifecycle tools

## Agents

| Agent | Role |
|-------|------|
| `team-lead` | Pure orchestrator — understands, plans, delegates, reviews, synthesizes. Never touches code. |
| `review-manager` | Spawns specialized reviewers in parallel, arbitrates disagreements, returns a single structured verdict |
| `requirements-reviewer` | Verifies implementation matches the original requirements |
| `code-reviewer` | Evaluates correctness, logic, error handling, and maintainability |
| `security-reviewer` | Identifies vulnerabilities, misconfigurations, and data exposure risks |
| `spec-validator` | LLM validator invoked after `spec_create`/`spec_update` — checks completeness, clarity, and consistency |
| `plan-validator` | LLM validator invoked after `plan_create` — checks exec-plan structure, block granularity, and links |
| `spec-reviewer` | Integrated into the review-manager pool — decides whether specs need creation or update after each delivery |
| `bug-finder` | Structured bug investigation — forces root-cause analysis before any fix |
| `brainstorm` | Phase 0 thinking partner — helps articulate what you want to build before planning starts |
| `harness` | Encodes recurring patterns as mechanical artifacts (lint rules, CI checks, AGENTS.md entries) |
| `planning` | Transforms complex or ambiguous requests into structured exec-plans written to disk |
| `gardener` | Periodic audit agent — Bootstrap: discovers functional domains, delegates to spec-writer. Maintenance: pure audit orchestrator, compiles Gardener Report, returns findings to team-lead. |
| `researcher` | External knowledge research — fetches and synthesizes information from the web, official docs, and APIs |

### The team-lead's workflow

1. **Understand** — asks clarifying questions if the request is ambiguous
2. **Plan** — breaks work into tasks using `todowrite`
3. **Delegate** — dispatches sub-agents (`explore`, `general`, or specialized personas)
4. **Review** — every code change goes through the `review-manager`, which spawns reviewers in parallel
5. **Synthesize** — consolidates results and reports back

### Review cluster

`review-manager`, `requirements-reviewer`, `code-reviewer`, `security-reviewer`, and `spec-reviewer` work together. The team-lead delegates to `review-manager`, which selects the relevant reviewers based on what changed, runs them in parallel, and returns a single verdict. None of these agents are visible in the main agent list — they're only reachable via `task`.

### bug-finder

Enforces a structured investigation workflow: frames the symptom vs. root cause, investigates via `explore` sub-agents, evaluates fix alternatives, then delegates the actual fix to a `general` sub-agent with full analysis context. Cardinal rule: never apply a workaround that masks the root cause.

### brainstorm

Run before the team-lead when you have a vague idea. Runs a 3-phase conversational flow (discovery → deep dive → draft) and produces a product brief at `docs/briefs/{project-name}.md`. Hand it to `planning` or directly to the team-lead as mission input.

### harness

When a pattern recurs (a mistake that keeps happening, a convention that keeps being missed), harness codifies it as a mechanical check — an ESLint rule, a CI job, an AGENTS.md entry — so humans and agents stop relying on memory to enforce it.

### planning

Takes a complex or ambiguous request and writes a structured exec-plan to `docs/exec-plans/`. Useful before handing a large task to the team-lead, or when you want a reviewable plan before any work starts.

### gardener

Periodic audit agent. In Bootstrap mode, discovers undocumented functional domains and delegates spec writing to `spec-writer`. In Maintenance mode, operates as a pure audit orchestrator — spawns `explore` agents, compiles a structured Gardener Report, and returns findings to the team-lead. Never edits files or opens PRs directly; all corrections are delegated by the team-lead after receiving the report.

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

The team-lead has direct access to 20 lifecycle tools — the only way to read or write artifacts in `docs/specs/`, `docs/exec-plans/`, and `docs/briefs/`. Direct tool access to these directories is blocked at runtime by the plugin's `tool.execute.before` hook.

### Protected zones

The following directories are protected for all agents except via lifecycle tools:

- `docs/specs/` — spec files
- `docs/exec-plans/` — exec-plan files
- `docs/briefs/` — product briefs

Any `read`, `edit`, `write`, `bash`, `glob`, or `grep` call targeting these paths is intercepted and blocked. The lifecycle tools bypass this guard transparently.

### Spec tools

| Tool | Signature | When used |
|------|-----------|-----------|
| `spec_list` | `spec_list() → JSON` | List all specs |
| `spec_get` | `spec_get(id) → JSON` | Read a spec by id |
| `spec_create` | `spec_create(title, type?, content?) → JSON` | Create a new spec — always follow with `spec_validate(id)` |
| `spec_update` | `spec_update(id, old_string, new_string) → JSON` | Edit a spec — always follow with `spec_validate(id)` |
| `spec_validate` | `spec_validate(id) → JSON` | Invoke the `spec-validator` LLM agent to check completeness and consistency |
| `spec_delete` | `spec_delete(id) → JSON` | Delete a spec |

### Plan tools

| Tool | Signature | When used |
|------|-----------|-----------|
| `plan_list` | `plan_list() → JSON` | List all exec-plans |
| `plan_get` | `plan_get(id) → JSON` | Read an exec-plan by id |
| `plan_create` | `plan_create(title, functional_objective, content?, brief_id?) → JSON` | Create an exec-plan — always follow with `plan_validate(id)` |
| `plan_update` | `plan_update(id, old_string, new_string) → JSON` | Edit an exec-plan |
| `plan_validate` | `plan_validate(id) → JSON` | Invoke the `plan-validator` LLM agent to check structure and block granularity |
| `plan_block_done` | `plan_block_done(plan_id, block_name) → JSON` | Mark a block complete in an exec-plan |
| `plan_delete` | `plan_delete(id) → JSON` | Delete an exec-plan |

### Brief tools

| Tool | Signature | When used |
|------|-----------|-----------|
| `brief_list` | `brief_list() → JSON` | List all briefs |
| `brief_get` | `brief_get(id) → JSON` | Read a brief by id |
| `brief_create` | `brief_create(title, content?, exec_plan_id?) → JSON` | Create a product brief |
| `brief_update` | `brief_update(id, old_string, new_string) → JSON` | Edit a brief |
| `brief_delete` | `brief_delete(id) → JSON` | Delete a brief |

### Global

| Tool | Signature | When used |
|------|-----------|-----------|
| `project_state` | `project_state() → JSON` | Mandatory at mission start — returns all specs + plans with at least one unchecked block |

### Spec workflow

```
spec_create(title) → spec_validate(id) → implementation → review (spec-reviewer runs automatically)
```

The `spec-reviewer` is part of the `review-manager` pool and runs after every delivery. It returns `NO_ACTION_NEEDED`, `SPEC_CREATE_NEEDED`, or `SPEC_UPDATE_NEEDED`.

These tools are not visible in the OpenCode UI. They run automatically as part of the team-lead's internal workflow.

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
| `gardener` | `task` (explore + spec-writer only), `bash` (git log/diff/status), `read` (all), `grep`, `glob`, `spec_list`, `spec_get`, `spec_format` |
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
