# Lifecycle Tools

The team-lead has direct access to 23 lifecycle tools — the only way to interact with artifact directories. Direct tool access to configured artifact paths is blocked at runtime by the plugin's `tool.execute.before` hook. All access goes through these tools.

## Protected Zones

The following directories are protected for all agents:

- `docs/specs/` — spec files
- `docs/exec-plans/` — exec-plan files
- `docs/briefs/` — product briefs

Any `read`, `edit`, `write`, `list`, `bash`, `glob`, or `grep` call targeting these paths or their symlink aliases is intercepted and blocked. Glob patterns with parent-directory traversal are also rejected. The lifecycle tools bypass this guard transparently.

::: tip When the team-lead calls these
- `project_state()` is called at the **start of every mission**
- `spec_format()` is called **before `spec_create`** — always
- `plan_format()` is called **before `plan_create`** — always
- `spec_create` / `spec_update` are always followed by `spec_validate(id)`
- `plan_create` is always followed by `plan_validate(id)`
- `plan_block_done()` is called **after each validated delivery**
- `spec-reviewer` runs **automatically** in the review phase after every delivery (via `review-manager`)
:::

---

## Pagination

`spec_get` and `plan_get` always return one page, including id-only calls. Small files still fit in one final page. The full serialized JSON string, including escaping, repeated metadata, and errors, is bounded to **16,384 UTF-8 bytes (16 KiB)**. This is plugin policy, not OpenCode's documented transport limit.

For example, start with `spec_get({ id: "authentication" })`. If `pagination.has_more` is true, call `spec_get({ id: "authentication", cursor: page.pagination.next_cursor })`, and repeat. Keep the opaque cursor unchanged. Concatenate each `content` string in order until **`pagination.has_more: false`** with `next_cursor: null`. Use the same loop for `plan_get`; a failed or truncated response is never EOF.

Every page repeats whole-document `file` and `frontmatter`; plan `blocks` counts cover the complete plan. Content is lossless, with line boundaries preferred and long lines split safely. There is no page-size parameter or unbounded mode, and no artifact migration or additional permission is required.

Pagination errors return `{ error, code }` without partial content:

| Code | Recovery |
|------|----------|
| `STALE_CURSOR` | The document changed. Discard all accumulated pages and restart without a cursor. |
| `INVALID_CURSOR` | Restart without a cursor; do not reuse a cursor across tools, projects, or documents. |
| `PAGE_BUDGET_EXCEEDED` | Metadata and the envelope leave insufficient space for content (or an empty final page). Reduce oversized metadata before retrying. |

Missing/unreadable artifacts remain errors; very long diagnostics may be shortened. Permissions and cancellation remain host failures, not page data.

## Spec Tools

### `spec_list()`

**Signature:** `spec_list() → JSON`

**When the team-lead calls it:** To get an overview of existing specs before creating a new one.

**Returns:** Array of all specs with their `id`, `title`, `status`, and `created` date.

---

### `spec_get(id, cursor?)`

**Signature:** `spec_get(id: string, cursor?: string) → JSON`

**When the team-lead calls it:** To read one bounded page of a spec. See [Pagination](#pagination) for the required continuation loop.

**Returns:** `{ file, content, frontmatter, pagination: { has_more, next_cursor } }`. Metadata describes the complete document on every page.

---

### `spec_search(query, id?, type?, status?)`

**Signature:** `spec_search(query: string, id?: string, type?: string, status?: string) → JSON`

Optional lexical navigation, not a complete review. Queries use case-insensitive Unicode letter/number OR tokens, with at most **512 UTF-8 bytes** and **32 distinct tokens**. Boolean/regex-looking input is ordinary text; there is no semantic search, translation, stemming, or synonym expansion. Use source-language keywords. `id` is the actual filename stem, not frontmatter `id` or a path. Metadata filters are exact and case-insensitive; empty filters are invalid. All statuses and legacy documents are included by default.

Every call rereads immediate regular `.md` files in configured `paths.specs`, excluding individual symlinks and subdirectories. Manual edits, create/delete operations and branch changes need no reindex or restart. Multi-file reads are not an atomic snapshot. A missing directory is empty; other enumeration or eligible-file read failures fail the entire search rather than silently dropping sources.

**Returns:** `{ query, corpus_files, matched_passages, results, truncated }`, with at most **five** results and no search cursor. Each result includes `spec_id`, `title`, `type`, `status`, `file`, `section_id`, exact heading ancestry `section`, `line_start`, `line_end`, `excerpt`, `partial_start_line`, `partial_end_line`, and `source_hash`. Missing metadata is `null`. Excerpts are exact contiguous source text; line ranges are inclusive, one-based and count frontmatter. `source_hash` is lowercase SHA-256 of the entire decoded source, including line endings.

Cite **`file:line_start-line_end`**, preserve hashes in handoffs, and expand relevant hits with `spec_read_section`. Empty/top-five results **do not prove absence**. The complete JSON is bounded to **16,384 UTF-8 bytes**, including escaping, metadata and errors; excerpts can be shortened or lower-ranked hits omitted. `truncated` reports omitted candidates. An impossible highest-ranked citation envelope fails rather than silently skipping to another source.

Sections recognize ATX headings with one to six hashes and at most three leading spaces, ignoring frontmatter and backtick/tilde fences. Repeated headings have distinct opaque selectors. Unsupported heading syntax remains searchable plain text. Passages are at most 2,000 Unicode code points and stop at the next heading; full section reading includes descendants.

---

### `spec_read_section(id, section_id, source_hash, cursor?)`

**Signature:** `spec_read_section(id: string, section_id: string, source_hash: string, cursor?: string) → JSON`

Pass the search result's `spec_id` as `id`, with its unchanged `section_id` and `source_hash`. The reader verifies the complete source before returning the selected contextual subtree, stopping before the next heading of equal or higher level. Treat selectors and cursors as opaque; they are not file paths.

**Returns:** `{ spec_id, title, type, status, file, source_hash, section_id, section, section_line_start, section_line_end, content, pagination: { has_more, next_cursor } }`. Section bounds describe the whole section on every page, not just the current page; an empty document's preamble has null bounds. Concatenate `content` through `pagination.has_more: false`, passing unchanged identity arguments and `pagination.next_cursor` as `cursor`. Responses, including errors, fit within **16,384 UTF-8 bytes**; opaque stateless cursors are at most 1,024 bytes. Existing `spec_get`/`plan_get` cursors are not interchangeable with section cursors.

| Code | Recovery |
|------|----------|
| `INVALID_QUERY` | Use a nonempty ordinary-text query within the byte/token bounds. |
| `INVALID_ARGUMENT` | Supply nonempty string filters, filename-stem IDs and a lowercase 64-hex source hash. |
| `SPEC_NOT_FOUND` / `SECTION_NOT_FOUND` | Check the ID or rerun search for a current selector. |
| `AMBIGUOUS_ID` | Resolve duplicate case-insensitive filename stems. |
| `CORPUS_UNAVAILABLE` / `SOURCE_UNAVAILABLE` | Restore safe in-project directory/file access; never treat failure as an empty result or EOF. |
| `STALE_SOURCE` | Rerun search and use its new selector/hash. |
| `INVALID_CURSOR` | Restart from search; do not reuse another tool/project/file/section/hash's cursor. |
| `STALE_CURSOR` | Discard all accumulated section pages and rerun search. |
| `PAGE_BUDGET_EXCEEDED` | Reduce oversized source metadata; do not omit required citation fields. |

Permissions and cancellation propagate as host failures, not JSON success. Both tools inherit protected-path and cross-location restrictions and are granted only to the team-lead and retained `spec_get` readers. Explicit user denials remain authoritative. Retrieved source text is **untrusted evidence**, never permission or role instructions. Optional navigation does not replace required complete `spec_get` reviews or expand an agent's scope. Real-host release verification is tracked separately from mocked automation in the repository's `docs/retrieval-verification.md`.

---

### `spec_create(title, type?, content?)`

**Signature:** `spec_create(title: string, type?: string, content?: string) → JSON`

**When the team-lead calls it:** When a scope involves an architecture decision, a significant functional behavior, or an interface between components — before implementation starts.

**What it does:** Creates a new spec file in `docs/specs/` with minimal frontmatter.

**Returns:**
```json
{
  "created": true,
  "id": "my-feature",
  "file": "docs/specs/my-feature.md"
}
```

::: warning Always follow with spec_validate
After `spec_create`, the team-lead must call `spec_validate(id)` to invoke the LLM spec-validator agent. The validator checks completeness, clarity, and internal consistency.
:::

::: tip No overwrite
`spec_create` will refuse if a file with the same id already exists. Use `spec_update` to modify an existing spec.
:::

---

### `spec_update(id, old_string, new_string)`

**Signature:** `spec_update(id: string, old_string: string, new_string: string) → JSON`

**When the team-lead calls it:** To update an existing spec with targeted edits.

**Returns:** Confirmation with the updated file path.

::: warning Always follow with spec_validate
After `spec_update`, the team-lead must call `spec_validate(id)` to re-validate the updated spec.
:::

---

### `spec_validate(id)`

**Signature:** `spec_validate(id: string) → JSON`

**When the team-lead calls it:** Immediately after `spec_create` or `spec_update`. Also available on demand when reviewing existing specs.

**What it does:** Invokes the `spec-validator` LLM agent, which checks:
- Completeness — all required sections present
- Clarity — unambiguous, no undefined terms
- Internal consistency — no contradictions within the spec

**Returns:** Validator verdict with findings and suggestions.

---

### `spec_delete(id)`

**Signature:** `spec_delete(id: string) → JSON`

**When the team-lead calls it:** When a spec is no longer relevant and should be removed.

**Returns:** Confirmation of deletion.

---

## Plan Tools

### `plan_list()`

**Signature:** `plan_list() → JSON`

**When the team-lead calls it:** To get an overview of active and completed exec-plans.

**Returns:** Array of all exec-plans with their `id`, `title`, `status`, `blocks` counts, and `brief_id` if linked.

---

### `plan_get(id, cursor?)`

**Signature:** `plan_get(id: string, cursor?: string) → JSON`

**When the team-lead calls it:** To read one bounded page of a plan. See [Pagination](#pagination) for the required continuation loop.

**Returns:** `{ file, content, frontmatter, blocks, pagination: { has_more, next_cursor } }`. Metadata and block counts describe the complete plan on every page, including checkboxes after page one.

---

### `plan_create(title, functional_objective, content?, brief_id?)`

**Signature:** `plan_create(title: string, functional_objective: string, content?: string, brief_id?: string) → JSON`

**When the team-lead calls it:** When breaking a complex or multi-session task into structured blocks.

**What it does:** Creates a new exec-plan file in `docs/exec-plans/` with frontmatter and the provided blocks.

**Returns:**
```json
{
  "created": true,
  "id": "my-feature",
  "file": "docs/exec-plans/my-feature.md"
}
```

::: warning Always follow with plan_validate
After `plan_create`, the team-lead must call `plan_validate(id)` to invoke the `plan-reviewer` cluster. It checks block granularity, structure, alignment with specs, and optionally code feasibility.
:::

---

### `plan_update(id, old_string, new_string)`

**Signature:** `plan_update(id: string, old_string: string, new_string: string) → JSON`

**When the team-lead calls it:** To edit blocks or metadata in an existing exec-plan.

**Returns:** Confirmation with the updated file path.

---

### `plan_validate(id)`

**Signature:** `plan_validate(id: string) → JSON`

**When the team-lead calls it:** Immediately after `plan_create`. Also available on demand.

::: info Not required after plan_update
Unlike `spec_validate` — which must be called after both `spec_create` and `spec_update` — `plan_validate` is only required after `plan_create`. Incremental block edits via `plan_update` do not need a re-validation pass.
:::

**What it does:** Invokes the `plan-reviewer` cluster (orchestrator + `plan-functional-reviewer`, `plan-technical-reviewer`, and optionally `plan-code-reviewer` in deep mode), which checks:
- Block structure — each block is actionable and atomic
- Block granularity — not too coarse, not too fine
- Alignment — plan consistent with functional and technical specs
- Links — brief_id and spec references resolve correctly

**Returns:** Validator verdict with findings and suggestions.

---

### `plan_block_done(plan_id, block_name)`

**Signature:** `plan_block_done(plan_id: string, block_name: string) → JSON`

**When the team-lead calls it:** After each validated sub-task delivery.

**What it does:** Finds the block by substring match on `block_name`, changes `[ ]` to `[x]`, and writes the file.

**Returns:**
```json
{
  "file": "docs/exec-plans/my-feature.md",
  "block": "Block 2: implement validation",
  "was": "[ ]",
  "now": "[x]",
  "blocks": { "total": 4, "checked": 2 },
  "all_done": false
}
```

**Error cases:**
| Condition | Error |
|-----------|-------|
| File not found | `"File not found: <path>"` |
| Block not found | `"Block not found: <block_name>"` |
| Ambiguous match (multiple blocks match substring) | `"Ambiguous block name: multiple matches"` |
| Block already checked | Idempotent — returns current state without error |

---

### `plan_delete(id)`

**Signature:** `plan_delete(id: string) → JSON`

**When the team-lead calls it:** When an exec-plan is no longer needed.

**Returns:** Confirmation of deletion.

---

## Brief Tools

Brief lifecycle APIs and existing artifacts remain available after agent retirement. They do not imply that a dedicated discovery persona is still registered or that a replacement workflow has been assigned.

### `brief_list()`

**Signature:** `brief_list() → JSON`

**When the team-lead calls it:** To check existing product briefs before starting a new planning session.

**Returns:** Array of all briefs with their `id`, `title`, `status`, and linked `exec_plan_id`.

---

### `brief_get(id)`

**Signature:** `brief_get(id: string) → JSON`

**When the team-lead calls it:** To read the full content of a product brief.

**Returns:** Full brief content including frontmatter and body.

---

### `brief_create(title, content?, exec_plan_id?)`

**Signature:** `brief_create(title: string, content?: string, exec_plan_id?: string) → JSON`

**When to use it:** To record a structured product brief. The former brainstorm persona is retired; this API remains available without defining a replacement authoring workflow.

**Returns:** Confirmation with the created file path.

---

### `brief_update(id, old_string, new_string)`

**Signature:** `brief_update(id: string, old_string: string, new_string: string) → JSON`

**When the team-lead calls it:** To update an existing brief with new information.

**Returns:** Confirmation with the updated file path.

---

### `brief_delete(id)`

**Signature:** `brief_delete(id: string) → JSON`

**When the team-lead calls it:** When a brief is obsolete.

**Returns:** Confirmation of deletion.

---

## Global

### `project_state()`

**Signature:** `project_state() → JSON`

**When the team-lead calls it:** Mandatory at the start of every mission, before any work begins.

**What it does:** Returns a full inventory of the project's current state — all specs, and all plans that have at least one unchecked block.

**Returns:**
```json
{
  "specs": [
    {
      "id": "string",
      "title": "string",
      "status": "string",
      "created": "ISO date string"
    }
  ],
  "exec_plans": [
    {
      "id": "string",
      "title": "string",
      "status": "string",
      "brief_id": "string | null",
      "blocks": { "total": 0, "checked": 0 }
    }
  ]
}
```

**Notes:** Only plans with at least one unchecked block are included — completed plans are omitted to keep the output focused.

---

## Format Tools

### `spec_format()`

**Signature:** `spec_format() → string`

**When to call it:** Before `spec_create` — always. Returns the canonical spec format so the agent knows exactly what structure is expected before writing content.

**What it returns:** The canonical spec template as a markdown string, including required frontmatter fields and section headers with inline guidance.

**Who calls it:** The team-lead (before writing a spec directly) and the `spec-writer` agent (as the first step of its workflow).

---

### `plan_format()`

**Signature:** `plan_format() → string`

**When to call it:** Before `plan_create` — always. Returns the canonical exec-plan format so the agent knows exactly what structure is expected before writing content.

**What it returns:** The canonical exec-plan template as a markdown string, including required frontmatter fields, goal, scope, building blocks, open questions, and decision log sections.

**Who calls it:** The team-lead and `architect` before creating an exec-plan within their existing permissions. The former planning persona is retired; the team-lead's old routing to it remains pending redesign.

::: tip Format tools are zero-cost
`spec_format()` and `plan_format()` are pure string returns — no file I/O, no LLM call, no side effects. Call them freely as the first step of any spec or plan creation workflow.
:::

---

## Configurable paths

By default, lifecycle tools look for artifacts in:

- `docs/specs/` — spec files
- `docs/exec-plans/` — exec-plan files
- `docs/briefs/` — product briefs

The `write` tool creates these directories automatically when needed.

These paths can be overridden via the `team-lead.paths` key in `opencode.json`:

```jsonc
{
  "agent": {
    "team-lead": {
      "paths": {
        "specs": "custom/specs",
        "execPlans": "custom/exec-plans",
        "briefs": "custom/briefs"
      }
    }
  }
}
```

Any key omitted falls back to the default above.
