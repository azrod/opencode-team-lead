# opencode-team-lead

An [opencode](https://opencode.ai) plugin that installs a **team-lead orchestrator agent** — a pure delegation layer that plans work, dispatches it to specialized sub-agents, reviews results, and reports back.

## What it does

- **Injects the `team-lead` agent** via the `config` hook — with a locked-down permission set (no file I/O, no bash except git), `temperature: 0.3`, variant `max`
- **Preserves the scratchpad across compactions** via the `experimental.session.compacting` hook — the team-lead's working memory (`.opencode/scratchpad.md`) is injected into the compaction prompt so mission state survives context resets

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

Restart OpenCode. The plugin will automatically install and register the team-lead agent.

The team-lead relies on [`opencode-dynamic-context-pruning`](https://github.com/Opencode-DCP/opencode-dynamic-context-pruning) for context window management. The DCP plugin provides `distill`, `prune`, and `compress` tools that the agent uses to condense verbose outputs and discard irrelevant tool calls — keeping the context clean across long sessions.

## The team-lead agent

The team-lead never touches code directly. It:

1. **Understands** the user's request (asks clarifying questions if needed)
2. **Plans** the work using `sequential-thinking` and `todowrite`
3. **Delegates** everything to specialized sub-agents (`explore`, `general`, or custom personas like `backend-engineer`, `security-auditor`, etc.)
4. **Reviews** every code change via a separate reviewer agent (producer never reviews own work)
5. **Synthesizes** results and reports back

### Scratchpad

The team-lead maintains a working memory file at `.opencode/scratchpad.md` in the project root. This survives context compaction — when the agent loses in-memory context, it reads the scratchpad to resume where it left off.

### Memory

Uses `memoai` for cross-session memory — architecture decisions, pitfalls, patterns. Searches before planning, records after completing significant tasks.

## Permissions

The agent has a minimal permission set:

| Tool | Access |
|------|--------|
| `task` | allow |
| `todowrite` / `todoread` | allow |
| `skill` | allow |
| `question` | allow |
| `distill` / `prune` / `compress` | allow |
| `memoai_*` | allow |
| `sequential-thinking_*` | allow |
| `bash` (git only) | allow |
| Everything else | deny |

## License

MIT
