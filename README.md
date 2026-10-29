# opencode-team-lead

> **Not affiliated with the OpenCode team.** This is an independent community plugin, not built or endorsed by the OpenCode project.

[![npm version](https://img.shields.io/npm/v/opencode-team-lead)](https://www.npmjs.com/package/opencode-team-lead)
[![license](https://img.shields.io/npm/l/opencode-team-lead)](https://github.com/azrod/opencode-team-lead/blob/main/LICENSE)

An [OpenCode](https://opencode.ai) plugin that installs a **team-lead** orchestrator and a full suite of specialized sub-agents. The team-lead plans work, delegates everything to sub-agents, reviews results, and reports back. It never reads or writes files directly.

## What it does

The plugin uses OpenCode V2's native Promise API:

- **Domain transforms** — register 19 agents, 21 lifecycle tools, and the bundled spec-writer skill, preserving configured agent overrides
- **`ctx.tool.hook("execute.before", ...)`** — protects artifact directories against direct access, including `shell` and multi-file `patch`
- **`ctx.session.hook("context", ...)`** — applies per-agent temperatures while V2 does not dispatch agent request overlays

## Agents

| Agent | Role |
|-------|------|
| `team-lead` | Pure orchestrator — understands, plans, delegates, reviews, synthesizes. Never touches code. |
| `review-manager` | Spawns specialized reviewers in parallel, arbitrates disagreements, returns a single structured verdict |
| `requirements-reviewer` | Verifies implementation matches the original requirements |
| `code-reviewer` | Evaluates correctness, logic, error handling, and maintainability |
| `security-reviewer` | Identifies vulnerabilities, misconfigurations, and data exposure risks |
| `spec-validator` | LLM validator invoked after `spec_create`/`spec_update` — checks completeness, clarity, and consistency |
| `plan-reviewer` | Plan review orchestrator — asks review depth (light/deep), spawns `plan-functional-reviewer`, `plan-technical-reviewer`, and `plan-code-reviewer` in parallel, returns APPROVED / CHANGES_REQUESTED / BLOCKED |
| `plan-functional-reviewer` | Checks plan alignment with functional specs. Silent, invoked by `plan-reviewer` only |
| `plan-technical-reviewer` | Checks plan alignment with technical and architectural specs. Silent, invoked by `plan-reviewer` only |
| `plan-code-reviewer` | Checks plan code feasibility against the codebase (deep mode only). Silent, invoked by `plan-reviewer` only |
| `spec-reviewer` | Integrated into the review-manager pool — decides whether specs need creation or update after each delivery |
| `bug-finder` | Structured bug investigation — forces root-cause analysis before any fix |
| `brainstorm` | Phase 0 thinking partner — helps articulate what you want to build before planning starts |
| `harness` | Encodes recurring patterns as mechanical artifacts (lint rules, CI checks, AGENTS.md entries) |
| `planning` | Transforms complex or ambiguous requests into structured exec-plans written to disk |
| `architect` | Direct-only architecture advisor — maps boundaries and trade-offs, then formalizes accepted decisions without changing code |
| `gardener` | Periodic audit agent — Bootstrap: discovers functional domains, delegates to spec-writer. Maintenance: pure audit orchestrator, compiles Gardener Report, returns findings to team-lead. |
| `spec-writer` | Writes high-quality specs conforming to the canonical format — delegated by team-lead or gardener (Bootstrap mode). |
| `researcher` | External knowledge research — fetches and synthesizes information from the web, official docs, and APIs |

### The team-lead's workflow

1. **Understand** — asks clarifying questions if the request is ambiguous
2. **Plan** — breaks work into tasks using `todowrite`
3. **Delegate** — dispatches sub-agents (`explore`, `general`, or specialized personas)
4. **Review** — every code change goes through the `review-manager`, which spawns reviewers in parallel
5. **Synthesize** — consolidates results and reports back

### Review cluster

The team-lead delegates to `review-manager`, which runs specialized reviewers in parallel and returns a single verdict. Reviewers are hidden from discovery but remain callable by their registered IDs through `subagent`.

### bug-finder

Enforces a structured investigation workflow: frames the symptom vs. root cause, investigates via `explore` sub-agents, evaluates fix alternatives, then delegates the actual fix to a `general` sub-agent with full analysis context. Cardinal rule: never apply a workaround that masks the root cause.

### brainstorm

Run before the team-lead when you have a vague idea. Runs a 3-phase conversational flow (discovery → deep dive → draft) and produces a product brief at `docs/briefs/{project-name}.md`. Hand it to `planning` or directly to the team-lead as mission input.

### harness

When a pattern recurs (a mistake that keeps happening, a convention that keeps being missed), harness codifies it as a mechanical check — an ESLint rule, a CI job, an AGENTS.md entry — so humans and agents stop relying on memory to enforce it.

### planning

Takes a complex or ambiguous request and writes a structured exec-plan to `docs/exec-plans/`. Useful before handing a large task to the team-lead, or when you want a reviewable plan before any work starts.

### architect

Use directly when you need a whole-system assessment before choosing a structural direction. Architect reads and explores ordinary repository files, separates evidence from inferences and unknowns, and explains current state, target state, trade-offs, and incremental migration with readable ASCII diagrams in `text` code blocks for non-trivial work. It cannot edit code, run commands, access briefs, or delegate. It can create or update a spec after a justified recommendation; it can create or update an exec-plan only after you explicitly accept the architecture decision being formalized.

### gardener

Periodic audit agent. In Bootstrap mode, discovers undocumented functional domains and delegates spec writing to `spec-writer`. In Maintenance mode, operates as a pure audit orchestrator — spawns `explore` agents, compiles a structured Gardener Report, and returns findings to the team-lead. Never edits files or opens PRs directly; all corrections are delegated by the team-lead after receiving the report.

## Installation

Requires OpenCode V2 with the `@opencode/plugin` 2.1 API. Node-based development and tests require Node.js 22 or later. V1 users should keep the previous plugin version.

Add this to your project or global `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-team-lead"],
  "experimental": {
    "subagent_depth": 2,
    "todo": true
  }
}
```

`subagent_depth: 2` is required for `team-lead → review-manager → reviewers`. `todo: true` enables optional progress tracking; without it the team-lead uses the conversation and lifecycle artifacts. Both settings are experimental and may change in OpenCode.

To track the beta channel:

Use `"opencode-team-lead@beta"` in `plugins` to load a published beta. For local testing, replace the package name with the absolute repository path.

Restart OpenCode — the plugin loads and registers all agents automatically.

## Lifecycle Tools

The team-lead has direct access to 21 lifecycle tools. Each checks its named permission before running and returns V2 structured content. Artifact formats and tool parameters are unchanged.

### Protected zones

The following directories are protected for all agents except via lifecycle tools:

- `docs/specs/` — spec files
- `docs/exec-plans/` — exec-plan files
- `docs/briefs/` — product briefs

Direct `read`, `edit`, `write`, `patch`, `shell`, `glob`, and `grep` access is guarded. Shell inspection is best effort, not a security sandbox. Paths resolve from the plugin's active location, not another worktree's canonical checkout.

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
| `plan_validate` | `plan_validate(id) → JSON` | Invoke the `plan-reviewer` cluster to check structure, block granularity, and alignment with specs |
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
| `team-lead` | `subagent`, optional `todowrite`, `skill`, `question`, `shell` (git + ls + head + echo; pushes ask), `read`, lifecycle tools, `edit` (`docs/*` only) |
| `review-manager` | `subagent` (`*-reviewer` only), `question`, `read`, `glob`, `grep` |
| `requirements-reviewer` / `code-reviewer` / `security-reviewer` | `read`, `glob`, `grep` |
| `bug-finder` | `read`, `glob`, `grep`, `question` |
| `brainstorm` | `subagent`, `question`, `webfetch`, `read`, brief lifecycle tools |
| `harness` | `subagent` (ask), `question`, optional `todowrite`, `glob`, `grep`, `shell`, `read`, `edit` |
| `planning` | `subagent` (ask), `question`, `read`, `glob`, `grep`, plan lifecycle tools |
| `architect` | `read`, `list`, `glob`, `grep`, lifecycle tools (`spec_list`, `spec_get`, `spec_format`, `spec_create`, `spec_update`, `spec_validate`, `plan_list`, `plan_get`, `plan_format`, `plan_create`, `plan_update`, `plan_validate`); no code edits, shell, delegation, external directories, briefs, deletion, `plan_block_done`, or `project_state` |
| `spec-writer` | `read`, `glob`, `grep`, spec lifecycle tools; no delegation |
| `gardener` | `subagent` (explore + spec-writer only), `shell` (git log/diff/status), `read`, `grep`, `glob`, `spec_list`, `spec_get`, `spec_format` |
| `researcher` | `read`, `webfetch`, `websearch`, `grep` |

Everything not listed is denied.

## Customization

Configure models, hex colors, modes, `request.body.temperature`, and ordered permissions under `agents`. The plugin owns `system` prompts. No model-specific `max` or `extended` variant is forced; choose a compatible `provider/model#variant` yourself.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [{
    "package": "opencode-team-lead",
    "options": {
      "soul": false,
      "paths": { "specs": "docs/specs", "execPlans": "docs/exec-plans", "briefs": "docs/briefs" }
    }
  }],
  "agents": {
    "team-lead": {
      "request": { "body": { "temperature": 0.2 } },
      "permissions": [{ "action": "webfetch", "resource": "*", "effect": "allow" }]
    }
  }
}
```

Your overrides are merged on top of plugin defaults — anything you don't specify keeps its default value.

Plugin-specific `soul` and `paths` have moved out of agent configuration into plugin `options`. Use `options.agents.<id>.soul` for a per-agent soul override. Permission overrides append after defaults: the last matching rule wins, including explicit denials. Lifecycle tools are listed directly, so they do not require Code Mode or an `execute` permission. The plugin does not enable MCP tools or other integrations implicitly.

To start sessions in the team-lead agent by default:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "team-lead"
}
```

## License

MIT
