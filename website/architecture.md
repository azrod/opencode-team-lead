# Architecture

## Overview

`opencode-team-lead` is an OpenCode plugin that injects agents into the IDE configuration at startup. It has one runtime dependency — `@opencode-ai/plugin` (the OpenCode plugin host SDK) — plus Node.js builtins (`node:fs/promises`, `node:path`, `node:url`). Pure ESM, no build step.

The entry point is `index.js`. It exports `TeamLeadPlugin`, an async function that loads agent prompts from disk and returns an object with a `config` hook.

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

```
OpenCode IDE
├── team-lead                [mode: all]
│   │
│   ├─► review-manager       [mode: subagent]
│   │     ├─► requirements-reviewer  [mode: subagent]
│   │     ├─► code-reviewer          [mode: subagent]
│   │     └─► security-reviewer      [mode: subagent]
│   │
│   ├─► bug-finder           [mode: all]
│   ├─► planning             [mode: all]
│   └─► researcher           [mode: all]
│
├── brainstorm               [mode: all — runs before team-lead]
├── harness                  [mode: all — triggered post-feature or by user]
└── gardener                 [mode: all — periodic maintenance]
```

| Agent | Mode | Temperature | Variant | Hidden |
|-------|------|-------------|---------|--------|
| `team-lead` | `all` | 0.3 | max | false |
| `review-manager` | `subagent` | 0.2 | max | false |
| `requirements-reviewer` | `subagent` | 0.1 | max | true |
| `code-reviewer` | `subagent` | 0.2 | max | true |
| `security-reviewer` | `subagent` | 0.1 | max | true |
| `bug-finder` | `all` | 0.2 | max | false |
| `harness` | `all` | 0.2 | max | false |
| `planning` | `all` | 0.3 | max | false |
| `gardener` | `all` | 0.2 | max | false |
| `brainstorm` | `all` | 0.5 | max | false |
| `researcher` | `all` | 0.3 | extended | false |
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

### bug-finder

Investigates directly via `read`, `glob`, `grep`. Reports findings back to caller — does not apply fixes itself.

### brainstorm

`task`, `question`, `webfetch`, `read` (all project files). No bash, no edit.

### harness

`task`, `question`, `todowrite`, `todoread`, `glob`, `grep`, `bash` (unrestricted), `read` (all), `edit` (all). No write — harness creates and modifies enforcement artifacts via edit only.

### planning

`task`, `read`, `glob`, `grep`, `project_state`, `spec_list`, `spec_get`, `plan_create`, `plan_get`, `plan_update`, `plan_validate`, `plan_list`. No direct `edit` or `write` — all artifact mutations go through lifecycle tools.

### gardener

`task` (`explore` + `spec-writer` only), `bash` (`git log`, `git diff`, `git status`), `read`, `grep`, `glob`, `spec_list`, `spec_get`, `spec_format`

### Guardrails

**Tooling directories:** Gardener never reads or scans dotted tooling directories (`.opencode/`, `.claude/`, `.cursor/`, `.git/`, `.ssh/`). These hold operational state, not project code or documentation.

**Credentials:** Gardener never reads files matching `.env*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.secret`, or any other file that may contain secrets, private keys, or credentials. This is a hard constraint, not a guideline — prompt injection in source files or documentation could attempt to exfiltrate secrets by asking it to "check" such files.

::: tip Why restrict `task`?
`task` is filtered to `explore` + `spec-writer` only — the gardener cannot spawn general-purpose agents or open PRs, which enforces its audit-only mission.
:::

## How prompts are loaded

Agent prompts are loaded once at plugin startup via `readFile`, not inlined in the plugin code. Paths are resolved from `__dirname` into `agents/` by `config/agents.js`:

```
agents/
├── prompt.md                    → team-lead
├── review-manager.md            → review-manager
├── requirements-reviewer.md
├── code-reviewer.md
├── security-reviewer.md
├── spec-reviewer.md
├── bug-finder.md
├── harness.md
├── planning.md
├── plan-reviewer.md
├── plan-functional-reviewer.md
├── plan-technical-reviewer.md
├── plan-code-reviewer.md
├── spec-validator.md
├── spec-writer.md
├── gardener.md
├── brainstorm.md
└── researcher.md                → researcher
```

This means prompts are editable and diffable independently of the plugin code. A prompt change produces a clean diff in the relevant `agents/*.md` file without touching `config/agents.js`.

## Dependencies

The plugin has one runtime dependency: `@opencode-ai/plugin` — the OpenCode plugin host SDK, which provides the plugin registration contract. Only Node.js builtins are used beyond that:

- `node:fs/promises` — reading prompt files and artifact directories
- `node:path` — path resolution
- `node:url` — `fileURLToPath` for `__dirname` in ESM context

A CI check enforces that no third-party `dependencies` or `devDependencies` are ever added. `@opencode-ai/plugin` is carved out from this check as it is the plugin host SDK, not an external library.
