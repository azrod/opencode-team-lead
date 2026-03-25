# AGENTS.md — opencode-team-lead

## Project Overview

`opencode-team-lead` is an OpenCode plugin that injects a "team-lead" orchestrator agent. The agent plans work, delegates everything to sub-agents, reviews results, and reports back. It never touches code directly.

This is a tiny project — 5 meaningful files, zero dependencies, pure ESM, no build step, no tests.

## Architecture

### Files

| File | Role |
|------|------|
| `index.js` | Plugin entry point. Exports `TeamLeadPlugin`. Two hooks: `config` (registers the agent) and `experimental.session.compacting` (preserves scratchpad across context resets). |
| `prompt.md` | **The core product.** 400+ line system prompt that defines the agent's identity, workflow, delegation rules, review protocol, error handling, and memory protocol. Most changes to this project will be here. |
| `review-manager.md` | System prompt for the review-manager agent — a review orchestrator that spawns specialized reviewers in parallel and arbitrates their verdicts. |
| `package.json` | Standard npm config. Ships `index.js`, `prompt.md`, `review-manager.md`, `README.md`. |
| `.github/workflows/publish.yml` | CI: OIDC trusted publishing to npm on `v*` tags, plus GitHub release creation. |
| `CHANGELOG.md` | Release history in Keep a Changelog format. |
| `README.md` | User-facing docs — installation, usage, permissions. |

### How the plugin works

1. **`config` hook** — Injects two agent definitions into OpenCode's config:
   - **`team-lead`** — The orchestrator. Permissions: deny-all except `task`, `todowrite`, `todoread`, `skill`, `question`, `distill`, `prune`, `compress`, `read`/`edit` restricted to `.opencode/scratchpad.md`, and git-only bash. Temperature 0.3, variant `max`, mode `all`.
   - **`review-manager`** — Review orchestrator, runs as a sub-agent only (`mode: "subagent"`). Permissions: `task`, `question` only. Temperature 0.2, variant `max`. Registered only if `review-manager.md` loads successfully — the team-lead still works without it.

2. **`experimental.session.compacting` hook** — Reads `.opencode/scratchpad.md` from the project root and injects it into the compaction context, so the team-lead's working memory survives context resets.

### Key design decisions

- The permission set is intentionally restrictive — the agent can only delegate (`task`), track progress (`todowrite`), load skills (`skill`), ask questions (`question`), manage context (`distill`/`prune`/`compress`), and run basic git commands.
- `prompt.md` is loaded at plugin init time via `readFile`, not inlined in `index.js`. This keeps the prompt editable and diffable.
- The plugin merges user config from `opencode.json` instead of overwriting it. Users can override `temperature`, `color`, `variant`, `mode` and add/override permissions; the merge applies plugin defaults first, then user overrides on top via spread order. The `prompt` is always provided by the plugin and cannot be overridden.
- The review-manager uses nested sub-agent delegation (team-lead → review-manager → reviewer agents). OpenCode supports unlimited nesting depth as long as each level has `task: "allow"`. The review-manager runs with `mode: "subagent"` so it only appears as a sub-agent, never in the main agent list.

## Development

No build step. No transpilation. No tests. What you see is what ships.

### Local testing

Link the plugin in your `opencode.json`:

```jsonc
{
  "plugin": [
    "/absolute/path/to/opencode-team-lead"
  ]
}
```

Restart OpenCode. The plugin loads from your local directory. Edit, restart, test.

### Style

- Pure ESM (`"type": "module"` in package.json)
- Zero dependencies — only Node.js builtins (`fs/promises`, `path`, `url`)
- English everywhere (code, comments, docs, changelog)

## Changelog Maintenance

The `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/). This section is detailed because getting the changelog right matters.

### Format

```markdown
## [Unreleased]

### Added
- New features

### Changed
- Changes to existing features

### Fixed
- Bug fixes

### Removed
- Removed features

## [0.2.1] - 2026-02-20

### Added
- Whatever was added

[Unreleased]: https://github.com/azrod/opencode-team-lead/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/azrod/opencode-team-lead/compare/v0.2.0...v0.2.1
```

### Sections

- **Added** — New features or capabilities that users can leverage
- **Changed** — Modifications to existing behavior that affect how users interact with the plugin
- **Fixed** — Bug fixes for issues users could encounter
- **Removed** — Removed features or deprecated functionality

Only include sections that have entries. Don't add empty sections.

CI/CD changes, internal refactors, and developer tooling changes do **not** belong in the CHANGELOG unless they directly impact the user experience. If a CI change enables provenance attestation that users can verify, mention the user-facing benefit — not the pipeline change.

### Writing good entries

The CHANGELOG targets **users of the plugin** — people who install it in their OpenCode config and use the team-lead agent. Write entries in terms of what changed *for them*, functionally.

**Good:**
```markdown
- Scratchpad now survives context compaction — the team-lead resumes where it left off after context resets
- The team-lead can now manage its context window using DCP tools (distill, prune, compress)
- npm package now ships with provenance attestation for supply chain verification
```

**Bad:**
```markdown
- Added `experimental.session.compacting` hook in index.js
- Added distill, prune, compress to the permission allowlist
- Migrated CI to OIDC trusted publishing — no npm token needed
```

The good entries explain *what changed for the user*. The bad entries describe *what was done to the code*. An agent reading the changelog should understand the functional impact without looking at the diff.

CI pipeline changes, internal refactors, and cosmetic tweaks should generally be omitted. If they have a user-visible side effect (like provenance attestation), mention the side effect — not the implementation.

### Workflow: adding entries

When making changes, ask: **"Does this change something for the person using the plugin?"** If yes, add an entry under `## [Unreleased]` in the appropriate subsection. If no (CI change, internal refactor, cosmetic tweak), skip it.

When in doubt, err on the side of omitting. A lean changelog with only meaningful entries is more valuable than a comprehensive one full of noise.

### Workflow: cutting a release

When the user asks to release a new version:

1. **Move entries** from `[Unreleased]` to a new version section with today's date:
   ```markdown
   ## [0.3.0] - 2026-02-21
   ```

2. **Leave `[Unreleased]` empty** (just the header, no subsections)

3. **Update the compare links** at the bottom of the file:
   - Change the `[Unreleased]` link to compare from the new tag:
     ```
     [Unreleased]: https://github.com/azrod/opencode-team-lead/compare/v0.3.0...HEAD
     ```
   - Add the new version's compare link:
     ```
     [0.3.0]: https://github.com/azrod/opencode-team-lead/compare/v0.2.1...v0.3.0
     ```

4. **Update `package.json` version** to match

5. **Commit, tag, push:**

   > **Note:** Always use `git commit -m "..."` inline. Never run `git commit` without `-m` — it opens an editor and crashes the non-interactive shell.

   > **Note:** Same for tags — always use `git tag -a v0.x.y -m "v0.x.y"`. Plain `git tag` without `-m` also opens an editor.

   ```bash
   git add CHANGELOG.md package.json
   git commit -m "release: v0.3.0"
   git tag -a v0.3.0 -m "v0.3.0"
   git push && git push --tags
   ```

CI handles the rest (npm publish + GitHub release).

### Compare link conventions

- `[Unreleased]` always points to `compare/<latest-tag>...HEAD`
- Each version points to `compare/<previous-tag>...<this-tag>`
- The very first release uses `releases/tag/<tag>` instead of a compare URL
- Base URL: `https://github.com/azrod/opencode-team-lead`

## Release Process

### Beta releases

Use beta releases to ship work-in-progress features for testing before a stable release.

**Tag format:** `v<major>.<minor>.<patch>-beta.<n>` — e.g. `v0.7.0-beta.1`, `v0.7.0-beta.2`

```bash
git tag -a v0.7.0-beta.1 -m "v0.7.0-beta.1"
git push --tags
```

CI detects the pre-release suffix and automatically:
- Publishes to npm under the `beta` dist-tag (`npm install opencode-team-lead@beta`)
- Creates a GitHub pre-release with notes from git log since the last stable tag

**Rules:**
- Do **not** update `package.json` version or `CHANGELOG.md` manually for beta releases — CI sets the version automatically from the tag. `[Unreleased]` keeps accumulating.
- Increment `beta.<n>` for each new beta on the same version (`beta.1` → `beta.2`)
- When ready to go stable, follow the normal stable release process below — the accumulated `[Unreleased]` entries become the version section

### Stable releases

1. Ensure `CHANGELOG.md` is up to date (see above)
2. Update version in `package.json`
3. Commit the release — always with `git commit -m "..."` inline, never without `-m`
4. Tag with `v<version>` — always use `git tag -a v<version> -m "v<version>"`, never plain `git tag` without `-m`
5. Push commit and tag

CI (`.github/workflows/publish.yml`) triggers on `v*` tags and:
- Sets the package version from the tag
- Publishes to npm with OIDC trusted publishing
- Creates a GitHub release with notes extracted from the CHANGELOG

No manual npm publish. No tokens to manage. Tag it and forget it.
