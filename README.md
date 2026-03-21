# opencode-team-lead

An [opencode](https://opencode.ai) plugin that installs **Orion**, a team-lead orchestrator agent — a pure delegation layer that plans work, dispatches it to specialized sub-agents, reviews results, and reports back.

## What it does

- **Injects the `team-lead` agent** via the `config` hook — with a locked-down permission set (no file I/O, no bash except git), `temperature: 0.3`, variant `max`
- **Preserves the scratchpad across compactions** via the `experimental.session.compacting` hook — Orion's working memory (`.opencode/scratchpad.md`) is injected into the compaction prompt so mission state survives context resets
- **Registers the `review-manager` sub-agent** — a review orchestrator that spawns specialized reviewer agents in parallel, synthesizes their verdicts, and arbitrates disagreements. Orion delegates all code reviews to it automatically.

## Installation

Add to your OpenCode config:

```jsonc
// opencode.json
{
  "plugin": [
    "opencode-team-lead@latest",
    "@tarquinen/opencode-dcp@latest"
  ]
}
```

Using `@latest` ensures you always get the newest version automatically when OpenCode starts.

To install the latest beta, use `"opencode-team-lead@beta"` instead of `@latest` in your config.

Restart OpenCode. The plugin will automatically install and register the team-lead agent.

Orion relies on [`opencode-dynamic-context-pruning`](https://github.com/Opencode-DCP/opencode-dynamic-context-pruning) for context window management. The DCP plugin provides `distill`, `prune`, and `compress` tools that the agent uses to condense verbose outputs and discard irrelevant tool calls — keeping the context clean across long sessions.

## Orion (team-lead agent)

Orion never touches code directly. It:

1. **Understands** the user's request (asks clarifying questions if needed)
2. **Plans** the work using `sequential-thinking` and `todowrite`
3. **Delegates** everything to specialized sub-agents (`explore`, `general`, or custom personas like `backend-engineer`, `security-auditor`, etc.)
4. **Reviews** every code change by delegating to the `review-manager`, which spawns specialized reviewers in parallel and arbitrates their verdicts
5. **Synthesizes** results and reports back

### Scratchpad

Orion maintains a working memory file at `.opencode/scratchpad.md` in the project root. This survives context compaction — when the agent loses in-memory context, it reads the scratchpad to resume where it left off.

### The review-manager agent

The review-manager is a sub-agent — it's never visible in the main agent list. Orion delegates reviews to it automatically.

It works in 3 steps:
1. **Selects reviewers** based on what changed (code quality, security, UX, infrastructure, etc.)
2. **Spawns them in parallel** — each reviewer gets a focused brief and works independently
3. **Synthesizes the verdict** — resolves disagreements, groups issues by severity, and returns a single structured review

The review-manager never reviews code itself. It orchestrates reviewers, just like Orion orchestrates workers.

## Permissions

The agent has a minimal permission set:

| Tool | Access |
|------|--------|
| `task` | allow |
| `todowrite` / `todoread` | allow |
| `skill` | allow |
| `question` | allow |
| `distill` / `prune` / `compress` | allow |
| `sequential-thinking_*` | allow |
| `bash` (git only) | allow |
| `read` / `edit` (`.opencode/scratchpad.md` only) | allow |
| Everything else | deny |

The `review-manager` sub-agent has a minimal permission set: `task` (to spawn reviewers), `question`, and `sequential-thinking`. It inherits no file or bash access.

## Customization

You can override agent properties in your `opencode.json` — `temperature`, `color`, `variant`, `mode`, and additional permissions are all fair game:

```jsonc
// opencode.json
{
  "agent": {
    "team-lead": {
      "temperature": 0.5,
      "color": "#FF5733",
      "permission": {
        "webfetch": "allow",
        "my_custom_tool": "allow"
      }
    }
  }
}
```

Your overrides are merged on top of the plugin defaults — anything you don't specify keeps its default value. Permissions work the same way: the plugin's built-in permissions stay intact, and yours are added (or override specific entries).

The system prompt is always provided by the plugin and cannot be overridden.

The `review-manager` agent can be customized the same way — override `temperature`, `color`, or add permissions under `"review-manager"` in the `agent` block.

To always start sessions with the team-lead agent, set it as the default in your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "team-lead"
}
```

## License

MIT
