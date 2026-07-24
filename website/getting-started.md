# Getting Started

## Prerequisites

- [OpenCode](https://opencode.ai) installed and configured
- Node.js 18+ (for npm)

## Installation

Add the plugin to your `opencode.json`:

```json
{
  "plugin": ["opencode-team-lead"]
}
```

OpenCode will automatically download and load the plugin on next startup. No manual `npm install` needed.

To track the beta channel (latest features, may have rough edges):

```json
{
  "plugin": ["opencode-team-lead@beta"]
}
```

## Set team-lead as your default agent

To start every OpenCode session in the team-lead agent automatically:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-team-lead"],
  "default_agent": "team-lead"
}
```

## Your first task

Just describe what you want to build. The team-lead handles the rest:

1. **Understand** — asks clarifying questions if the request is ambiguous
2. **Plan** — breaks work into tasks, optionally writing an exec-plan to disk for complex requests
3. **Delegate** — dispatches sub-agents (`explore`, `general`, or specialized agents)
4. **Review** — every code change goes through the `review-manager`, which spawns reviewers in parallel
5. **Synthesize** — consolidates results and reports back to you

::: tip Example prompt
```
Build a REST API endpoint that returns paginated user activity logs,
filtered by date range and event type.
```
The team-lead will plan the work, delegate implementation to a sub-agent, then run code + security reviews automatically.
:::

## Customization

You can override `temperature`, `color`, `variant`, and `mode` for any agent. The system prompt is always provided by the plugin and cannot be overridden.

```json
{
  "plugin": ["opencode-team-lead"],
  "agents": {
    "team-lead": {
      "temperature": 0.2,
      "color": "blue"
    },
    "review-manager": {
      "temperature": 0.1
    }
  }
}
```

Your overrides are merged on top of plugin defaults — anything you don't specify keeps its default value.

### Available overrides per agent

| Field | Type | Effect |
|-------|------|--------|
| `temperature` | `number` | Model sampling temperature |
| `color` | `string` | Agent color in the OpenCode UI |
| `variant` | `string` | Model variant (e.g. `"max"`) |
| `mode` | `string` | Agent mode (`"all"` or `"subagent"`) |

::: warning Prompt is not overridable
The `prompt` field is always sourced from the plugin. User-provided `prompt` values in `opencode.json` are silently ignored.
:::

## Permissions

Permissions are pre-configured by the plugin and follow a default-deny model — every agent starts with `"*": "deny"` and only has access to the tools it actually needs. You don't need to configure anything.

If you need to add extra permissions for a specific agent:

```json
{
  "plugin": ["opencode-team-lead"],
  "agents": {
    "team-lead": {
      "permission": {
        "webfetch": "allow"
      }
    }
  }
}
```

User permissions are merged on top of plugin defaults — you cannot accidentally remove default permissions.

See [Architecture](/architecture) for the full permission matrix.

## Lifecycle tools

The team-lead automatically manages project artifacts using five built-in tools — no delegation, no sub-agent overhead. These tools track exec-plans, specs, and briefs for continuity across sessions.

See [Lifecycle Tools](/lifecycle-tools) for the full reference.
