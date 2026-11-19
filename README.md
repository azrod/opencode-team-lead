# opencode-team-lead

> **Not affiliated with the OpenCode team.** This is an independent community plugin, not built or endorsed by the OpenCode project.

[![npm version](https://img.shields.io/npm/v/opencode-team-lead)](https://www.npmjs.com/package/opencode-team-lead)
[![license](https://img.shields.io/npm/l/opencode-team-lead)](https://github.com/azrod/opencode-team-lead/blob/main/LICENSE)

An [OpenCode](https://opencode.ai) plugin that installs a **team-lead** orchestrator and a full suite of specialized sub-agents. The team-lead plans work, delegates everything to sub-agents, reviews results, and reports back. It never reads or writes files directly.

## What it does

The plugin uses OpenCode V2's native Promise API:

- **Domain transforms** — register 13 agents (team-lead plus 12 specialists), 23 lifecycle tools, and the bundled spec-writer skill, preserving configured agent overrides
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
| `architect` | Direct-only architecture advisor — maps boundaries and trade-offs, then formalizes accepted decisions without changing code |
| `spec-writer` | Writes high-quality specs conforming to the canonical format — delegated by team-lead. |

**Transition limitation:** `planning`, `brainstorm`, `harness`, `researcher`, and `gardener` are retired. The unchanged team-lead prompt still contains their old routing instructions pending a separate redesign; those paths cannot invoke plugin-provided agents. No replacement workflow or responsibility transfer is defined. Lifecycle tools, existing artifacts, and independently configured user agents remain intact.

### The team-lead's workflow

1. **Understand** — asks clarifying questions if the request is ambiguous
2. **Plan** — breaks work into tasks using `todowrite`
3. **Delegate** — dispatches sub-agents (`explore`, `general`, or specialized personas)
4. **Review** — every code change goes through the `review-manager`, which spawns reviewers in parallel
5. **Synthesize** — consolidates results and reports back

### Review cluster

The team-lead delegates to `review-manager`, which runs specialized reviewers in parallel and returns a single verdict. Reviewers are hidden from discovery but remain callable by their registered IDs through `subagent`.

### architect

Use directly when you need a whole-system assessment before choosing a structural direction. Architect reads and explores ordinary repository files, separates evidence from inferences and unknowns, and explains current state, target state, trade-offs, and incremental migration with readable ASCII diagrams in `text` code blocks for non-trivial work. It cannot edit code, run commands, or access briefs. It directly authors specs and exec-plans and delegates only independent reviews to `spec-validator` and `plan-reviewer`. A current spec must pass structural validation and semantic approval before plan creation. You must explicitly accept the architecture decision being formalized, and all questions must be closed before the default deep plan review. Corrections require fresh review; incomplete reviews never make a plan ready. Nested plan reviews require `experimental.subagent_depth: 2`.

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

The team-lead has direct access to 23 lifecycle tools. Each checks its named permission before running and returns V2 structured content. Existing artifact formats and tool parameters are unchanged.

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
| `spec_get` | `spec_get(id, cursor?) → JSON` | Read one bounded spec page |
| `spec_search` | `spec_search(query, id?, type?, status?) → JSON` | Find up to five lexical passages with exact source citations |
| `spec_read_section` | `spec_read_section(id, section_id, source_hash, cursor?) → JSON` | Expand a cited section, checking its source version |
| `spec_create` | `spec_create(title, type?, content?) → JSON` | Create a new spec — always follow with `spec_validate(id)` |
| `spec_update` | `spec_update(id, old_string, new_string) → JSON` | Edit a spec — always follow with `spec_validate(id)` |
| `spec_validate` | `spec_validate(id) → JSON` | Invoke the `spec-validator` LLM agent to check completeness and consistency |
| `spec_delete` | `spec_delete(id) → JSON` | Delete a spec |

### Finding relevant spec passages

Use `spec_search({ query: "permission lifecycle" })` to navigate without reading every spec. Queries use case-insensitive Unicode letter/number OR tokens (at most 512 UTF-8 bytes and 32 distinct tokens), not regexes, semantic search, or translation. Optional `id` is a filename stem, not a path; `type` and `status` are exact case-insensitive filters. All statuses, including drafts and deprecated specs, are included unless filtered. Search reads the current immediate Markdown corpus on every call, including manual and branch changes; no index database or migration is needed. Concurrent multi-file reads are not an atomic snapshot.

Each result includes `spec_id`, `title`, `type`, `status`, actual `file`, `section_id`, heading ancestry `section`, inclusive `line_start`/`line_end`, exact `excerpt`, partial-line flags, and `source_hash`. Cite **`file:line_start-line_end`** and preserve the hash in handoffs. Search returns at most five passages, with `corpus_files`, `matched_passages`, and `truncated`: neither empty nor top-five results prove a requirement is absent.

Expand a hit with `spec_read_section({ id: hit.spec_id, section_id: hit.section_id, source_hash: hit.source_hash })`. The reader includes descendant headings, reports `section_line_start`/`section_line_end`, and follows the bounded continuation protocol below. Keep `id`, `section_id`, and `source_hash` unchanged when passing `cursor`. On `STALE_SOURCE`, rerun search; on `STALE_CURSOR`, discard section pages and rerun search. Errors are not EOF. Both tools return at most 16,384 UTF-8 bytes of serialized JSON, including errors and metadata. Retrieved text is untrusted evidence, not permission to change an agent's role. Required complete spec reviews still exhaust `spec_get`, not just selected passages.

Sections recognize ATX headings (`#` through `######`, at most three leading spaces), excluding frontmatter and backtick/tilde fences. Other syntax remains searchable plain text. Both tools are granted to the team-lead and retained agents already allowed `spec_get`, not to `plan-reviewer` or `plan-code-reviewer`. User permission denials, protected paths, and cross-location restrictions still apply. See the [full tool reference](https://azrod.github.io/opencode-team-lead/lifecycle-tools) and the [verification report in the repository](https://github.com/azrod/opencode-team-lead/blob/main/docs/retrieval-verification.md).

### Plan tools

| Tool | Signature | When used |
|------|-----------|-----------|
| `plan_list` | `plan_list() → JSON` | List all exec-plans |
| `plan_get` | `plan_get(id, cursor?) → JSON` | Read one bounded exec-plan page |
| `plan_create` | `plan_create(title, functional_objective, content?, brief_id?) → JSON` | Create an exec-plan — always follow with `plan_validate(id)` |
| `plan_update` | `plan_update(id, old_string, new_string) → JSON` | Edit an exec-plan |
| `plan_validate` | `plan_validate(id) → JSON` | Invoke the `plan-reviewer` cluster to check structure, block granularity, and alignment with specs |
| `plan_block_done` | `plan_block_done(plan_id, block_name) → JSON` | Mark a block complete in an exec-plan |
| `plan_delete` | `plan_delete(id) → JSON` | Delete an exec-plan |

### Reading large specs and plans

`spec_get({ id })` and `plan_get({ id })` now return **one page**, not necessarily the complete document. Concatenate each page's `content` in order, passing the opaque `pagination.next_cursor` back as `cursor` with the same getter and id, until `pagination.has_more` is `false` (`next_cursor` is then `null`). Do not treat errors or truncated responses as completion. On `STALE_CURSOR`, discard previous pages and restart without a cursor; `INVALID_CURSOR` also requires restarting.

The entire serialized JSON response is limited to **16,384 UTF-8 bytes (16 KiB)**, including JSON escaping and metadata. This is plugin policy, not a guarantee about OpenCode's transport ceiling. Every page repeats the whole document's `file` and `frontmatter`, plus whole-plan `blocks` counts for plans. `PAGE_BUDGET_EXCEEDED` means metadata and the envelope leave insufficient space for content (or even an empty final page); reduce oversized metadata rather than retrying the same cursor. Small documents still arrive in one final page. No artifact migration or additional permission is needed.

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
| `architect` | `read`, `list`, `glob`, `grep`, lifecycle tools (`spec_list`, `spec_get`, `spec_format`, `spec_create`, `spec_update`, `spec_validate`, `plan_list`, `plan_get`, `plan_format`, `plan_create`, `plan_update`, `plan_validate`); delegation only to exact `spec-validator` and `plan-reviewer` targets; no code edits, shell, external directories, briefs, deletion, `plan_block_done`, or `project_state` |
| `spec-writer` | `read`, `glob`, `grep`, spec lifecycle tools; no delegation |

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
