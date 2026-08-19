# Lifecycle Tools

The team-lead has direct access to five deterministic, zero-LLM bookkeeping tools injected by the plugin. These tools enforce consistency across exec-plans, specs, and briefs — no delegation, no sub-agent overhead. They run as part of the team-lead's internal workflow and are not visible in the OpenCode UI.

::: tip When the team-lead calls these
- `project_state()` and `check_artifacts()` are called at the **start of every mission**
- `mark_block_done()` is called **after each validated delivery**
- `complete_plan()` is called **when all blocks are done and the final review is APPROVED**
- `register_spec()` is called **when a new spec needs to exist on disk**
:::

---

## `project_state()`

**Signature:** `project_state() → JSON`

**When the team-lead calls it:** Mandatory at the start of every mission, before any work begins.

**What it does:** Globs all three artifact directories (`docs/specs/`, `docs/exec-plans/`, `docs/briefs/`), reads YAML frontmatter from every file found, and returns a full inventory of the project's current state.

**Returns:**
```json
{
  "specs": [
    {
      "title": "string",
      "id": "string",
      "criticality": "string | null",
      "status": "string",
      "created": "ISO date string"
    }
  ],
  "exec_plans": [
    {
      "file": "string",
      "status": "string",
      "brief": "string | null",
      "blocks": { "total": 0, "checked": 0 },
      "warnings": ["string"]
    }
  ],
  "briefs": [
    {
      "project": "string",
      "type": "string",
      "status": "string",
      "exec_plan": "string | null"
    }
  ]
}
```

**Notes:** Warns inline when an exec-plan has all blocks checked but `status` is not `completed` — a prompt to call `complete_plan()`.

---

## `mark_block_done(plan_file, block_name)`

**Signature:** `mark_block_done(plan_file: string, block_name: string) → JSON`

**When the team-lead calls it:** After each validated sub-task delivery.

**What it does:** Finds the block in the exec-plan file by substring match on `block_name`, changes `[ ]` to `[x]`, and writes the file. If all blocks are now checked, returns `all_done: true` as a prompt to call `complete_plan()`.

**Returns:**
```json
{
  "file": "docs/exec-plans/my-feature.md",
  "block": "Bloc 2: implement validation",
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

## `complete_plan(plan_file)`

**Signature:** `complete_plan(plan_file: string) → JSON`

**When the team-lead calls it:** When all blocks are done **and** the final review is APPROVED.

**What it does:** Verifies all blocks in the exec-plan are checked. If any remain unchecked, refuses with an error. Otherwise, updates the frontmatter `status` field to `completed` and sets `updated` to today's ISO date.

**Returns:**
```json
{
  "file": "docs/exec-plans/my-feature.md",
  "status": "completed",
  "updated": "2026-05-04"
}
```

**Notes:** The file is **not deleted** after completion — it remains as a historical reference. A completed exec-plan is a record of what was built and how.

::: warning Refuses if unchecked blocks remain
`complete_plan()` will refuse with an error listing the unchecked blocks. All blocks must be marked done first via `mark_block_done()`.
:::

---

## `register_spec(specFile, title)`

**Signature:** `register_spec(specFile: string, title: string) → JSON`

**When the team-lead calls it:** When a new spec needs to exist on disk for a component, API contract, or design decision.

**What it does:** Resolves the path within `docs/specs/`, errors if the file already exists (no overwrite), then writes minimal frontmatter plus an H1 heading placeholder.

**Returns:**
```json
{
  "created": true,
  "file": "docs/specs/my-feature.md"
}
```

**Notes:** Does **not** write to any registry — the disk is the source of truth. Future calls to `project_state()` will automatically pick up the new file.

::: tip No overwrite
`register_spec()` will refuse if the target file already exists. This prevents accidental spec corruption. To update an existing spec, read it and edit it directly.
:::

---

## `check_artifacts()`

**Signature:** `check_artifacts() → JSON`

**When the team-lead calls it:** At mission start AND after each scope completion.

**What it does:** Cross-artifact consistency scan. Detects six categories of problems between exec-plans, specs, and briefs:

| Type | Condition | Severity |
|------|-----------|----------|
| `plan_stale_status` | All blocks checked, status ≠ `completed` | `blocking` |
| `plan_missing_brief` | Exec-plan has no `brief:` field | `warning` |
| `plan_brief_dead` | `brief:` points to a file that doesn't exist | `blocking` |
| `brief_missing_plan` | Brief has no `exec_plan:` field | `warning` |
| `brief_plan_dead` | `exec_plan:` points to a file that doesn't exist | `blocking` |
| `spec_stale_draft` | `status: draft` and `created` > 30 days ago | `warning` |

**Returns:**
```json
{
  "problems": [
    {
      "type": "plan_stale_status",
      "file": "docs/exec-plans/my-feature.md",
      "severity": "blocking",
      "detail": "All 4 blocks checked but status is 'in-progress'",
      "suggestion": "Call complete_plan() to close this scope"
    }
  ],
  "summary": "1 blocking problem, 0 warnings"
}
```

**Error cases:** Returns `{ problems: [], summary: "No problems found" }` if everything is consistent.

---

## Configurable paths

By default, lifecycle tools look for artifacts in:

- `docs/specs/` — spec files
- `docs/exec-plans/` — exec-plan files
- `docs/briefs/` — product briefs

The `write` tool creates these directories automatically when needed. To use custom paths, add an `opencode.json` override:

```json
{
  "plugin": ["opencode-team-lead"],
  "agents": {
    "team-lead": {
      "env": {
        "SPECS_DIR": "custom/specs",
        "PLANS_DIR": "custom/plans",
        "BRIEFS_DIR": "custom/briefs"
      }
    }
  }
}
```

::: warning Path configuration is not yet supported
Custom path configuration via environment variables is not implemented in v0.9.0. The paths above are hardcoded. This is planned for a future release.
:::
