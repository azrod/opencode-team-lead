---
project: "plugin-v2-migration"
type: tool
status: draft
created: 2026-07-25
updated: 2026-07-25
---

## Problem

The plugin currently uses the OpenCode legacy plugin format (named async function export). This format does not support the `skill` hook, which means the bundled `spec-writer` skill (`skills/spec-writer/`) cannot be registered with OpenCode and is therefore unreachable for agents via `ctx.skill`. A previous attempt to register the skill via the V2 `define()` API alongside the legacy named export failed because the loader precedence rules make V1 and legacy coexist impossible: if a V1 default export is present, named exports are silently ignored; if only named exports are present, plain objects from `define()` are rejected as `"Plugin export is not a function"`.

## Vision

The plugin migrates to a single V2 default export. All existing capabilities (12 agents, 5 lifecycle tools, session directory setup) continue to work identically for end users. The `spec-writer` skill becomes properly registered and callable by the team-lead agent via `ctx.skill`. Users with `"plugin": ["opencode-team-lead"]` in their `opencode.json` change nothing.

## Users

### Primary

Developers who use `opencode-team-lead` in OpenCode — they invoke the `team-lead` agent and expect the `spec-writer` skill to be loadable. They are not aware of plugin internals; they just need things to keep working and the skill to stop being silently missing.

### Secondary

Maintainers of this plugin who need to extend or debug agent/tool/skill registration going forward. The migration also clears the path for future V2-only features.

## Core Use Cases

### UC-001 — Skill registration (Priority: P1)
**As a** team-lead agent user, **I want to** invoke the `spec-writer` skill via `ctx.skill`, **so that** I get the guided spec-writing workflow instead of a silent failure.
**Acceptance criteria:**
- Given the plugin is loaded in OpenCode, when the team-lead agent calls `ctx.skill("spec-writer")`, then the skill content (guide, template, checklist) is returned without error.

### UC-002 — Agent registration parity (Priority: P1)
**As a** user with any existing `opencode.json` config, **I want** all 12 agents (team-lead + 11 sub-agents) to register with the same descriptions, permissions, temperatures, and modes as before, **so that** there is no behavioral regression.
**Acceptance criteria:**
- Given the migrated plugin is loaded, when any registered agent is invoked, then its prompt, permissions, and metadata match the V1 output exactly (verified by inspection or test).

### UC-003 — Tool registration parity (Priority: P1)
**As a** team-lead agent, **I want** all 5 lifecycle tools (`project_state`, `mark_block_done`, `complete_plan`, `register_spec`, `check_artifacts`) to remain available, **so that** exec-plan tracking continues to work.
**Acceptance criteria:**
- Given the migrated plugin, when `npm test` runs `tests/lifecycle.test.js`, then all 29 tests pass.

### UC-004 — Session directory creation (Priority: P2)
**As a** user opening OpenCode on a fresh project, **I want** `docs/exec-plans/`, `docs/briefs/`, and `docs/specs/` to be created automatically on `session.created`, **so that** agents don't fail with missing-directory errors.
**Acceptance criteria:**
- Given a fresh project with no `docs/` tree, when a session starts with the plugin loaded, then the three directories exist on disk.

## Success Criteria

- **SC-001**: `ctx.skill("spec-writer")` succeeds in an OpenCode session — no silent failure, no "skill not found" error.
- **SC-002**: All 29 tests in `tests/lifecycle.test.js` pass without modification.
- **SC-003**: All 12 agents appear in OpenCode's agent list with unchanged configs (spot-checkable by running OpenCode locally).
- **SC-004**: No change required in any user's `opencode.json`.

## Scope

### In scope

- Migrate `index.js` from named export (`TeamLeadPlugin`) to V2 default export (`define({ id, setup })`)
- Map `config` hook agent injection → `ctx.agent.transform`
- Map `tool` hook → `ctx.tool.transform`
- Map `event` hook (`session.created` mkdir) → `ctx.event`
- Register `spec-writer` skill via `ctx.skill.transform` with `type: "embedded"` and the content from `skills/spec-writer/` (SKILL.md, template.md, checklist.md)
- Update `CHANGELOG.md` with user-facing entries
- Verify `npm test` still passes post-migration

### Out of scope

- Content of any agent prompt file in `agents/*.md` — no changes
- Logic inside `tools/lifecycle.js` — no changes
- Content of `skills/spec-writer/` files — no changes to the skill's guide, template, or checklist
- User-facing config schema (paths, permissions overrides, soul flag) — behavior preserved as-is
- The documentation website (`team-lead-workflow/`)
- Adding new agents, tools, or skills beyond spec-writer
- Supporting multiple plugin export formats simultaneously

## Constraints

- Zero new npm dependencies. `@opencode-ai/plugin@1.18.5` (already present) is the only allowed V2 import.
- Pure ESM (`"type": "module"`), no build step, no transpilation.
- `package.json` `main` field stays pointing at `index.js`. No `exports` field needed.
- Tool logic lives in `tools/lifecycle.js` and is imported by `index.js` — this split must be preserved so `lifecycle.test.js` can import the functions directly without going through the plugin loader.
- The `mergePermissions` helper and `soul` flag behavior must be preserved exactly — they affect how users can override agent configs.
- User-configurable artifact paths (`userConfig.paths.specs`, etc.) must remain functional.

## Open Questions

- [x] **`ctx.agent.transform` V2 API shape** — In V1, agents are registered as `input.agent[id] = { ... }`. Does `ctx.agent.transform` expose a mutable draft object with the same shape (`draft[id] = { ... }`)? Or is there a different registration method (e.g. `draft.register(id, config)`)? Must be verified in `@opencode-ai/plugin@1.18.5` source before implementing. This determines whether `registerSubagent()` can be ported directly or needs a rewrite.
  **Answer**: `draft.update(id, fn)`, `draft.remove(id)`, `draft.get(id)`, `draft.list()`, `draft.default(id)` are the available methods — no `draft[id] = {...}`. Schema is `AgentV2Info`: `{ id, model, request, system, description, mode, hidden, color, steps, permissions }`. Note: no `prompt` field (→ use `system`), no `temperature` or `tools` as direct fields. `update()` is a mutation via callback.

- [x] **`ctx.tool.transform` V2 API shape** — Same question for tools. The V1 `tool` hook returns a plain object keyed by tool name. Does V2 use `draft[name] = { ... }` or a different call style? The tool definitions include Zod-like schema via `tool.schema.string()` from `@opencode-ai/plugin/tool` — does this import still work under V2, or does V2 expose its own schema builder?
  **Answer**: `ctx.tool` is **absent** from the `PluginContext` V2. The `@opencode-ai/plugin/tool` module (V1) still exists but is not integrated into V2 hooks. There is no V2 equivalent for tool registration.

- [x] **`ctx.event` signature** — In V1, the event handler receives `{ event }`. Does V2's `ctx.event(handler)` pass the same shape, or a different one?
  **Answer**: `ctx.event` is **absent** from the `PluginContext` V2. The file `effect/event.d.ts` exists internally but is not exposed in `PluginContext`. There is no V2 equivalent for session lifecycle events.

- [x] **`directory` / `worktree` equivalents in V2** — The current `setup` function uses these to resolve `projectRoot`. Does V2's `setup(ctx)` expose equivalent path context, or does the plugin need to resolve paths differently?
  **Answer**: `directory` and `worktree` are **absent** from the `PluginContext` V2 — they are only available in the V1 `ToolContext`. `ctx.options` is the only non-hook field (`Readonly<Record<string, any>>`).

- [x] **`skill.transform` embedded content format** — The brief description says `content: { guide, template, checklist }`. What are the exact field names and types expected? Are they strings (file contents) or paths? Need to verify against `@opencode-ai/plugin@1.18.5` source or examples.
  **Answer**: `draft.source({ type: "embedded", skill: { name, description?, slash?, location, content } })` where `content` is a string (the content of the SKILL.md file). Alternatives: `type: "directory"` with `path`, or `type: "url"` with `url`.

## Rejected Ideas

- **Coexisting V1 named export + V2 default export** — Rejected. The OpenCode loader detects V1 first via `mod.default` and ignores all named exports when V1 is present. There is no way to have both simultaneously.
- **Registering the skill as a second named-export plugin alongside the main V1 plugin** — Rejected. Plain objects returned by `define()` are not functions, so the legacy loader throws `"Plugin export is not a function"`. This is the exact failure mode that triggered this migration.
- **Bundling skill content inline in `index.js` as a string constant** — Rejected. The skill files (`SKILL.md`, `template.md`, `checklist.md`) are the source of truth and maintained independently. Duplicating them inline creates drift risk. They should be read from disk at init time, same as agent prompts.

## Status

**Standby** — as of 2026-07-25.

The full V2 migration is blocked. The `PluginContext` V2 does not expose `ctx.tool` or `ctx.event`, which are required for tool registration and session lifecycle events. These capabilities have no V2 equivalent yet — the V2 API is visibly still under construction at OpenCode.

Only `ctx.skill.transform` and `ctx.agent.transform` are available in V2. A partial migration (skill registration only) was attempted but cannot coexist with the V1 named export format in the same module file.

**Decision**: keep the plugin in V1 legacy format until the V2 API is complete (`ctx.tool` and `ctx.event` are available). Resume from this brief when that happens — the five open questions are now answered and the blockers are clearly identified.
