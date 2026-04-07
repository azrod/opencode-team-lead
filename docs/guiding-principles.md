# Guiding Principles

Principles that require human judgment to evaluate — rules that can't be fully encoded as lint or CI checks. Each principle has a concrete Good/Bad example and a threshold that triggers action.

---

## Principle: Non-interactive git commands only

All git operations in agent-executed or automated contexts must use non-interactive flags. Two commands are especially dangerous:

- `git commit` without `-m` opens a text editor and hangs non-interactive shells
- `git tag` without `-m` (when creating annotated tags with `-a`) does the same

**Good:**
```bash
git commit -m "release: v0.3.0"
git tag -a v0.3.0 -m "v0.3.0"
git push && git push --tags
```

**Bad:**
```bash
git commit           # hangs — opens $EDITOR
git tag -a v0.3.0    # hangs — opens $EDITOR for tag message
git tag v0.3.0       # lightweight tag, no message — acceptable only for temp/local use
```

**Threshold blocker:** Any PR or agent-generated commit that includes `git commit` or `git tag -a` without the `-m` flag is an immediate blocker. Do not merge. Fix before proceeding.

**Threshold warning:** A `git commit` or `git tag` in any documentation example or AGENTS.md snippet that omits `-m` should be corrected as a QUALITY_SCORE.md warning.

---

## Principle: Zero runtime dependencies

The plugin ships zero runtime dependencies. Only Node.js built-in modules are allowed (`node:fs/promises`, `node:path`, `node:url`). No `node_modules`, no lockfile, no `npm install` step.

**Good:**
```js
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
```

**Bad:**
```js
import { readFile } from "fs/promises";   // missing node: prefix — style violation
import axios from "axios";                 // external dep — BLOCKED
import _ from "lodash";                    // external dep — BLOCKED
```

**Threshold blocker:** Any PR that adds a `dependencies` or `devDependencies` key to `package.json` with non-empty entries. Blocker regardless of justification — find a Node.js built-in alternative.

**Threshold warning:** A built-in import missing the `node:` prefix (e.g. `from "fs"` instead of `from "node:fs"`) is a style warning. The CI lint check catches this automatically.

---

## Principle: CHANGELOG entries target users, not implementers

Every CHANGELOG entry must describe what changed for the *user of the plugin* — the person who installs it in their OpenCode config. Implementation details, CI changes, and refactors are omitted unless they have a user-visible side effect.

**Good:**
```markdown
- Scratchpad now survives context compaction — the team-lead resumes where it left off
- Reviews are now handled by a dedicated review-manager that spawns specialized reviewers in parallel
- npm package now ships with provenance attestation for supply chain verification
```

**Bad:**
```markdown
- Added `experimental.session.compacting` hook in index.js
- Migrated CI to OIDC trusted publishing
- Refactored registerSubagent() to use a data-driven SUBAGENT_DEFS array
```

**Threshold blocker:** A CHANGELOG entry describing internal implementation details when the user-facing impact is not explained. Rewrite before merging.

**Threshold warning:** An empty `[Unreleased]` section in a PR that contains user-visible changes. Add entries before merging.

---

## Principle: Agent permission sets are default-deny

Every agent registered in `index.js` must start with `"*": "deny"` and explicitly allow only the tools it needs. An agent with `"*": "allow"` or without an explicit deny-all has overly broad permissions.

**Good:**
```js
permission: { "*": "deny", task: "allow", question: "allow" }
permission: { "*": "deny", task: "allow" }
```

**Bad:**
```js
permission: {}                             // no deny — all tools implicitly available
permission: { task: "allow" }             // missing "*": "deny" — other tools may be available
permission: { "*": "allow" }             // unrestricted — BLOCKED
```

**Threshold blocker:** Any new agent registered without `"*": "deny"` as the first permission entry. This is a security regression — do not merge.

**Threshold warning:** An agent whose allowed tools are broader than what its system prompt uses. Audit and trim.

---

## Principle: Prompt files stay external and diffable

Agent system prompts must stay in `agents/*.md` files loaded at runtime via `readFile`. They must not be inlined as template literals or string constants in `index.js`.

**Good:**
```js
// In index.js — load from file
const prompt = await readFile(join(__dirname, "agents", "prompt.md"), "utf-8");
```

**Bad:**
```js
// Inline — loses diffability, makes prompt changes noisy in index.js diffs
const prompt = `You are Orion...
...400 lines...`;
```

**Threshold blocker:** A PR that moves agent prompt content into `index.js` as a string. Reject — extract to `agents/<name>.md`.

**Threshold warning:** An agent prompt file that exceeds 600 lines without a clear structural reason. Consider splitting into focused sections or extracting shared boilerplate to a separate file.

---

## Principle: Agent prompt files do not declare permissions

Permissions for every agent are declared exclusively in `index.js` via the `SUBAGENT_DEFS` array. An `agents/*.md` file must never contain a `## Permissions` section. Such a section is purely documentary — it has no effect on what the agent can actually do — and it diverges from the real enforcement in `index.js`. Stale or incorrect permission docs are worse than no docs.

**Good:**
```markdown
<!-- agents/my-agent.md — no permissions section -->
## Role

You are a specialist agent that...

## Workflow

1. Receive task from orchestrator
2. ...
```

**Bad:**
```markdown
<!-- agents/my-agent.md — permissions section present -->
## Permissions

- task: allow
- todowrite: allow

## Role

You are a specialist agent that...
```

**Threshold blocker:** Any PR that adds a `## Permissions` section to any file under `agents/`. This is caught automatically by the `no-permissions-in-agent-prompts` CI check — do not merge until the section is removed.

---

## Principle: Product briefs follow a verifiable schema

Briefs produced by the brainstorm agent are consumed by downstream agents — Planning uses them to generate exec-plans, and Orion uses them to scope delegated work. A brief missing required frontmatter fields or section headings is not machine-actionable: a downstream agent cannot reliably extract the project name, scope, or success criteria without a predictable structure. The schema enforces the minimum structural contract. Content quality — whether the Vision is compelling, whether the Use Cases are realistic — remains the brainstorm agent's responsibility and is not checked here.

**Good:**
```markdown
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

**Bad:**
```markdown
---
project: "api-usage-dashboard"
type: tool
status: draft
created: 2026-04-03
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
```
*(Missing `updated:` frontmatter field and `## Scope` section — this brief would be rejected by CI.)*

**Threshold blocker:** A brief file in `docs/briefs/` that is missing any of the 6 required sections (`## Problem`, `## Vision`, `## Users`, `## Core Use Cases`, `## Success Criteria`, `## Scope`) or any of the 5 required frontmatter fields (`project:`, `type:`, `status:`, `created:`, `updated:`). Caught automatically by the `brief-schema` CI check.

**Threshold warning:** A brief with an `## Open Questions` or `## Rejected Ideas` section that is empty (no items) — indicates the brainstorm session may have been rushed.

---

## Principle: Declared write/edit target directories must exist in the repo

Every directory that an agent is granted `write` or `edit` access to in `index.js` must physically exist in the repository — either with a `.gitkeep` or real content. A missing directory causes a silent runtime failure: the agent has the correct permission configured but the underlying file operation fails with a misleading error (permissions conflict rather than "directory not found"). Without this check, a new agent permission can be declared and code-reviewed without anyone noticing the target directory was never created.

**Good:**
```js
// In SUBAGENT_DEFS — write permission declared AND directory exists on disk
write: {
  "*": "deny",
  "docs/briefs/**": "allow",   // docs/briefs/ exists (has .gitkeep or real files)
},
```
```
docs/
  briefs/
    .gitkeep    ← guarantees the directory is tracked by git
```

**Bad:**
```js
// Permission declared but directory absent from the repo
write: {
  "*": "deny",
  "docs/exec-plans/**": "allow",   // docs/exec-plans/ does NOT exist → runtime failure
},
```
```
docs/
  briefs/
  # exec-plans/ never created — agent silently fails at write time
```

**Threshold blocker:** Any PR that adds or modifies a `write` or `edit` permission path in `index.js` without a corresponding directory in the repository. Caught automatically by the `agent-write-dirs-exist` CI check — do not merge until the directory (with `.gitkeep`) is committed alongside the permission change.

**Threshold warning:** A directory tracked only by `.gitkeep` that has accumulated real files — the `.gitkeep` can be removed, but is harmless if left in place.
