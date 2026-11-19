# Architecture

## Overview

`opencode-team-lead` is an OpenCode plugin that injects agents into the IDE configuration at startup. It has one runtime dependency — `@opencode-ai/plugin` (the OpenCode plugin host SDK) — plus Node.js builtins (`node:fs/promises`, `node:path`, `node:url`). Pure ESM, no build step.

The entry point is `index.js`. It exports `TeamLeadPlugin`, an async function that loads agent prompts from disk and returns an object with a `config` hook.

All 13 agent definitions live in the ordered `AGENT_DEFS` registry in `config/agents.js`: team-lead first, then the 12 specialized agents. The entrypoint uses this same list for prompt loading, registration through `registerAgent()`, and temperature-hook membership. The team-lead prompt lives at `agents/team-lead.md`. Bug-finder was removed after the registry unification, along with its team-lead caller instructions; retained agent permissions and user overrides are unchanged.

## Plugin hooks

### `config` hook

Called by OpenCode to construct the agent configuration. The hook:

1. Reads the user's existing config (`input.agent`)
2. Injects all agent definitions (team-lead + all sub-agents)
3. Merges user overrides from `opencode.json` on top of plugin defaults

**Config merge behavior:**

```js
input.agent["team-lead"] = {
  // plugin defaults
  temperature: 0.3,
  variant: "max",
  ...
  // user overrides (applied on top)
  ...userConfigRest,
  // prompt always sourced from plugin — cannot be overridden
  prompt: teamLeadPrompt,
  // permissions deep-merged, not replaced
  permission: mergePermissions(defaultPermission, userConfigRest.permission),
};
```

Permissions are merged one level deeper via `mergePermissions`: nested keys (like `read` or `bash` which are objects) are shallow-merged rather than replaced. This means users can add permissions without accidentally removing plugin defaults.

## Agent hierarchy

The plugin registers 12 specialized agents plus team-lead. `planning`, `brainstorm`, `harness`, `researcher`, `gardener`, and `bug-finder` are retired. The team-lead prompt still contains old routes to the first five pending a separate redesign; those plugin-agent paths are unavailable. Bug-finder's caller instructions have been removed. No replacement workflow or responsibility transfer is defined. Lifecycle tools and existing artifacts remain intact.

```
OpenCode IDE
├── team-lead                [mode: all]
│   │
│   ├─► review-manager       [mode: subagent]
│   │     ├─► requirements-reviewer  [mode: subagent]
│   │     ├─► code-reviewer          [mode: subagent]
│   │     ├─► security-reviewer      [mode: subagent]
│   │     └─► spec-reviewer          [mode: subagent]
│   │
│   ├─► spec-writer          [mode: subagent]
│   ├─► spec-validator       [mode: subagent]
│   └─► plan-reviewer        [mode: subagent]
│         ├─► plan-functional-reviewer [mode: subagent]
│         ├─► plan-technical-reviewer  [mode: subagent]
│         └─► plan-code-reviewer       [mode: subagent]
│
└── architect                [mode: primary — direct only]
```

| Agent | Mode | Temperature | Variant | Hidden |
|-------|------|-------------|---------|--------|
| `team-lead` | `all` | 0.3 | max | false |
| `review-manager` | `subagent` | 0.2 | max | false |
| `requirements-reviewer` | `subagent` | 0.1 | max | true |
| `code-reviewer` | `subagent` | 0.2 | max | true |
| `security-reviewer` | `subagent` | 0.1 | max | true |
| `architect` | `primary` | 0.2 | max | false |
| `spec-validator` | `subagent` | 0.1 | max | true |
| `plan-reviewer` | `subagent` | 0.2 | max | false |
| `plan-functional-reviewer` | `subagent` | 0.1 | max | true |
| `plan-technical-reviewer` | `subagent` | 0.1 | max | true |
| `plan-code-reviewer` | `subagent` | 0.1 | max | true |
| `spec-reviewer` | `subagent` | 0.2 | max | true |
| `spec-writer` | `subagent` | 0.3 | max | false |

## Permission model

The principle is **deny-all, explicit allowlist**. Every agent starts with `"*": "deny"` and receives only the tools strictly necessary for its role.

### team-lead

| Tool | Access |
|------|--------|
| `task`, `todowrite`, `todoread`, `skill`, `question` | allow |
| `compress` | allow (context management) |
| `read` | allow on all files |
| `edit` / `write` | allow on `docs/**` only |
| `bash` | allow for git commands (`git status`, `git diff`, `git log`, `git add`, `git commit`, `git push`, `git tag`) and read-only shell commands (`ls`, `ls *`, `head *`, `echo *`) |
| Everything else | deny |

### review-manager

`task` (filtered to `*-reviewer` agents only), `question`, `read`, `glob`, `grep`.

### Specialized reviewers (`requirements-reviewer`, `code-reviewer`, `security-reviewer`)

`read`, `glob`, `grep` for direct file access. Sub-agent spawning is blocked by the default `"*": "deny"` rule.

### architect

Direct-only architecture advisor. `read`, `list`, `glob`, `grep`, and an explicit lifecycle allowlist: `spec_list`, `spec_get`, `spec_format`, `spec_create`, `spec_update`, `spec_validate`, `plan_list`, `plan_get`, `plan_format`, `plan_create`, `plan_update`, `plan_validate`. Delegation is limited to the exact `spec-validator` and `plan-reviewer` targets. `edit`, `shell`, `external_directory`, `project_state`, artifact deletion, `plan_block_done`, and all brief tools remain denied. Architect directly authors artifacts and corrections: current spec approval precedes plan creation, user acceptance precedes formalizing decisions, and closed questions precede explicitly requested deep plan review. Incomplete reviews block handoff; nested review requires `experimental.subagent_depth: 2`.

## How prompts are loaded

Agent prompts are loaded once at plugin startup via `readFile`, not inlined in the plugin code. Paths are resolved from `__dirname` into `agents/` by `config/agents.js`:

```
agents/
├── team-lead.md                 → team-lead
├── review-manager.md            → review-manager
├── requirements-reviewer.md
├── code-reviewer.md
├── security-reviewer.md
├── spec-reviewer.md
├── architect.md
├── plan-reviewer.md
├── plan-functional-reviewer.md
├── plan-technical-reviewer.md
├── plan-code-reviewer.md
├── spec-validator.md
└── spec-writer.md
```

This means prompts are editable and diffable independently of the plugin code. A prompt change produces a clean diff in the relevant `agents/*.md` file without touching `config/agents.js`.

## Dependencies

The plugin has one runtime dependency: `@opencode-ai/plugin` — the OpenCode plugin host SDK, which provides the plugin registration contract. Only Node.js builtins are used beyond that:

- `node:fs/promises` — reading prompt files and artifact directories
- `node:path` — path resolution
- `node:url` — `fileURLToPath` for `__dirname` in ESM context

A CI check enforces that no third-party `dependencies` or `devDependencies` are ever added. `@opencode-ai/plugin` is carved out from this check as it is the plugin host SDK, not an external library.
