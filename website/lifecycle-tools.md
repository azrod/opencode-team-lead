# Lifecycle Tools

The team-lead has direct access to 19 lifecycle tools — the only way to interact with artifact directories. Direct tool access to `docs/specs/`, `docs/exec-plans/`, and `docs/briefs/` is blocked at runtime by the plugin's `tool.execute.before` hook. All access goes through these tools.

## Protected Zones

The following directories are protected for all agents:

- `docs/specs/` — spec files
- `docs/exec-plans/` — exec-plan files
- `docs/briefs/` — product briefs

Any `read`, `edit`, `write`, `bash`, `glob`, or `grep` call targeting these paths is intercepted and blocked. The lifecycle tools bypass this guard transparently.

::: tip When the team-lead calls these
- `project_state()` is called at the **start of every mission**
- `spec_create` / `spec_update` are always followed by `spec_validate(id)`
- `plan_create` is always followed by `plan_validate(id)`
- `plan_block_done()` is called **after each validated delivery**
- `spec-reviewer` runs **automatically** in the review phase after every delivery (via `review-manager`)
:::

---

## Spec Tools

### `spec_list()`

**Signature:** `spec_list() → JSON`

**When the team-lead calls it:** To get an overview of existing specs before creating a new one.

**Returns:** Array of all specs with their `id`, `title`, `status`, and `created` date.

---

### `spec_get(id)`

**Signature:** `spec_get(id: string) → JSON`

**When the team-lead calls it:** To read the full content of a specific spec.

**Returns:** Full spec content including frontmatter and body.

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

### `plan_get(id)`

**Signature:** `plan_get(id: string) → JSON`

**When the team-lead calls it:** To read the full content of a specific exec-plan.

**Returns:** Full exec-plan content including frontmatter, functional objective, and all blocks.

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
After `plan_create`, the team-lead must call `plan_validate(id)` to invoke the LLM plan-validator agent. The validator checks block granularity, structure, and links to brief/specs.
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

**What it does:** Invokes the `plan-validator` LLM agent, which checks:
- Block structure — each block is actionable and atomic
- Block granularity — not too coarse, not too fine
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

**When the team-lead calls it:** When a brainstorm session produces a structured product brief to record.

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

## Configurable paths

By default, lifecycle tools look for artifacts in:

- `docs/specs/` — spec files
- `docs/exec-plans/` — exec-plan files
- `docs/briefs/` — product briefs

The `write` tool creates these directories automatically when needed.

::: warning Path configuration is not yet supported
Custom path configuration via environment variables is not implemented. The paths above are hardcoded.
:::
