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
