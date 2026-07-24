---
url: 'https://azrod.github.io/opencode-team-lead/principles.md'
---
# Guiding Principles

These principles require human judgment to evaluate — rules that can't be fully encoded as lint or CI checks. Each principle has concrete Good/Bad examples and a threshold that triggers action.

For the mechanical enforcement artifacts that encode these principles (lint rules, CI checks), see [Architecture](/architecture).

***

## 1. Non-interactive git commands only

All git operations in agent-executed or automated contexts must use non-interactive flags. Two commands are especially dangerous:

* `git commit` without `-m` opens a text editor and hangs non-interactive shells
* `git tag` without `-m` (when creating annotated tags with `-a`) does the same

::: code-group

```bash [Good]
git commit -m "release: v0.3.0"
git tag -a v0.3.0 -m "v0.3.0"
git push && git push --tags
```

```bash [Bad]
git commit           # hangs — opens $EDITOR
git tag -a v0.3.0    # hangs — opens $EDITOR for tag message
```

:::

**Threshold — blocker:** Any PR or agent-generated commit that includes `git commit` or `git tag -a` without the `-m` flag. Do not merge. Fix before proceeding.

**Threshold — warning:** A `git commit` or `git tag` in any documentation example or `AGENTS.md` snippet that omits `-m`.

***

## 2. Zero runtime dependencies

The plugin ships zero runtime dependencies. Only Node.js built-in modules are allowed. No `node_modules`, no lockfile, no `npm install` step.

::: code-group

```js [Good]
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
```

```js [Bad]
import { readFile } from "fs/promises";  // missing node: prefix
import axios from "axios";               // external dep — BLOCKED
import _ from "lodash";                  // external dep — BLOCKED
```

:::

**Threshold — blocker:** Any PR that adds a `dependencies` or `devDependencies` key to `package.json` with non-empty entries. Blocked regardless of justification — find a Node.js built-in alternative.

**Threshold — warning:** A built-in import missing the `node:` prefix (e.g. `from "fs"` instead of `from "node:fs"`). The CI lint check catches this automatically.

***

## 3. CHANGELOG entries target users, not implementers

Every CHANGELOG entry must describe what changed for the *user of the plugin* — the person who installs it in their OpenCode config. Implementation details, CI changes, and refactors are omitted unless they have a user-visible side effect.

::: code-group

```markdown [Good]
- The team-lead can now manage its context window using DCP tools
- Reviews are now handled by a dedicated review-manager that runs reviewers in parallel
- npm package now ships with provenance attestation for supply chain verification
```

```markdown [Bad]
- Added `experimental.session.compacting` hook in index.js
- Migrated CI to OIDC trusted publishing
- Refactored registerSubagent() to use a data-driven array
```

:::

**Threshold — blocker:** A CHANGELOG entry describing internal implementation details when the user-facing impact is not explained.

**Threshold — warning:** An empty `[Unreleased]` section in a PR that contains user-visible changes.

***

## 4. Agent permissions are default-deny

Every agent registered in `index.js` must start with `"*": "deny"` and explicitly allow only the tools it needs.

::: code-group

```js [Good]
permission: { "*": "deny", task: "allow", question: "allow" }
permission: { "*": "deny", task: "allow" }
```

```js [Bad]
permission: {}                   // no deny — all tools implicitly available
permission: { task: "allow" }   // missing "*": "deny"
permission: { "*": "allow" }    // unrestricted — BLOCKED
```

:::

**Threshold — blocker:** Any new agent registered without `"*": "deny"` as the first permission entry. This is a security regression.

**Threshold — warning:** An agent whose allowed tools are broader than what its system prompt actually uses.

***

## 5. Prompt files stay external and diffable

Agent system prompts must stay in `agents/*.md` files loaded at runtime via `readFile`. They must not be inlined as template literals or string constants in `index.js`.

::: code-group

```js [Good]
// index.js — load from file
const prompt = await readFile(join(__dirname, "agents", "prompt.md"), "utf-8");
```

```js [Bad]
// Inline — loses diffability, makes prompt changes noisy in index.js diffs
const prompt = `You are the team-lead...
...400 lines...`;
```

:::

**Threshold — blocker:** A PR that moves agent prompt content into `index.js` as a string.

**Threshold — warning:** An agent prompt file that exceeds 600 lines without a clear structural reason.

***

## 6. Agent prompt files do not declare permissions

Permissions for every agent are declared exclusively in `index.js`. An `agents/*.md` file must never contain a `## Permissions` section. Such a section is purely documentary — it has no effect on what the agent can actually do — and it will diverge from the real enforcement in `index.js`. Stale permission docs are worse than no docs.

::: code-group

```markdown [Good]
<!-- agents/my-agent.md — no permissions section -->
## Role

You are a specialist agent that...
```

```markdown [Bad]
<!-- agents/my-agent.md — permissions section present -->
## Permissions

- task: allow
- todowrite: allow
```

:::

**Threshold — blocker:** Any PR that adds a `## Permissions` section to any file under `agents/`. Caught automatically by the `no-permissions-in-agent-prompts` CI check.

***

## 7. Product briefs follow a verifiable schema

Briefs produced by the brainstorm agent are consumed by downstream agents — Planning uses them to generate exec-plans, and the team-lead uses them to scope delegated work. A brief missing required fields is not machine-actionable.

**Required frontmatter fields:** `project:`, `type:`, `status:`, `created:`, `updated:`

**Required sections:** `## Problem`, `## Vision`, `## Users`, `## Core Use Cases`, `## Success Criteria`, `## Scope`

::: code-group

```markdown [Good]
---
project: "api-usage-dashboard"
type: tool
status: draft
created: 2026-04-03
updated: 2026-04-03
---

## Problem
...

## Vision
...

## Users
...

## Core Use Cases
...

## Success Criteria
...

## Scope
...
```

```markdown [Bad]
---
project: "api-usage-dashboard"
type: tool
status: draft
created: 2026-04-03
# Missing: updated:
---

# Missing: ## Scope section
```

:::

**Threshold — blocker:** A brief file missing any of the 6 required sections or any of the 5 required frontmatter fields. Caught by the `brief-schema` CI check.

**Threshold — warning:** A brief with an empty `## Open Questions` or `## Rejected Ideas` section — may indicate a rushed brainstorm session.

***

## 8. Declared edit target directories must exist in the repo

Every directory that an agent is granted `edit` access to in `index.js` must physically exist in the repository — either with a `.gitkeep` or real content. A missing directory causes a silent runtime failure: the agent has the correct permission configured but the underlying file operation fails with a misleading error.

::: code-group

```js [Good]
// Permission declared AND docs/briefs/ exists on disk (with .gitkeep or real files)
edit: {
  "*": "deny",
  "docs/briefs/**": "allow",
}
```

```js [Bad]
// Permission declared but docs/exec-plans/ was never created
edit: {
  "*": "deny",
  "docs/exec-plans/**": "allow",  // → silent runtime failure
}
```

:::

**Threshold — blocker:** Any PR that adds or modifies an `edit` permission path in `index.js` without a corresponding directory in the repository. Caught automatically by the `agent-write-dirs-exist` CI check.
