# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New `brainstorm` agent — helps developers discover and articulate what they want to build before planning starts. Run it before Orion to produce a structured product brief at `docs/briefs/{project-name}.md`.
- New `harness` agent — encodes emerging patterns as permanent mechanical enforcement artifacts (lint rules, CI workflows, AGENTS.md entries, guiding principles). Triggered by the user, Orion post-feature, or the Gardener on recurring drift.
- New `planning` agent — transforms complex or ambiguous requests into structured work contracts on disk (`docs/exec-plans/`). Returns inline plan simples for small tasks; full exec-plans for multi-session work.
- New `gardener` agent — periodic maintenance agent that fixes stale documentation and detects code drift against established rules. Opens targeted PRs; updates `QUALITY_SCORE.md`; escalates recurring patterns to `harness`.
- Orion now knows when to invoke `planning` (complex/ambiguous requests) and when to suggest `harness` post-delivery (recurring patterns).
- Five lifecycle tools now available directly to Orion — no delegation needed for project bookkeeping: `project_state` (full artifact inventory), `check_artifacts` (consistency scan), `mark_block_done` (check a block in an exec-plan), `complete_plan` (close a scope), and `register_spec` (create a new spec file). Orion calls these at mission start and after each delivery automatically.
- Exec-plans now support an optional `brief:` frontmatter field to trace the brainstorm → implementation link bidirectionally.

### Changed
- Harness now operates fully autonomously — it explores the codebase, decides what to encode, and acts without asking for confirmation at each step. It only stops in three explicit cases: the pattern can't be mechanized, encoding requires creating a new workflow file, or the trigger is too vague with no codebase signal to anchor it.

### Fixed
- Lifecycle tools (`project_state`, `mark_block_done`, `complete_plan`, `register_spec`, `check_artifacts`) now return valid responses — previously the `execute` functions returned raw objects instead of strings, causing the OpenCode plugin API to silently discard their output
- Harness agent now has full `bash`, `read`, `write`, `edit`, `glob`, and `grep` permissions — previously it was registered with a restricted command allowlist and scoped file targets, which prevented it from running arbitrary lint commands or writing enforcement artifacts outside the predefined list.
- The harness agent no longer writes human-facing checklists to `AGENTS.md` — it now correctly identifies them as documentation and routes them to CI checks or `docs/guiding-principles.md` instead. An unwired script in the repo is also no longer treated as a valid enforcement artifact.

### Removed
- `memory.md` concept removed — the persistent project memory feature has been deprecated. The `experimental.chat.system.transform` hook and memory.md injections have been removed from the plugin. Only the scratchpad survives compaction.

## [0.8.0] - 2026-03-30

### Added

- New `bug-finder` agent — a structured bug investigation orchestrator that forces root-cause analysis before any fix is applied. Prevents Orion from rushing to workarounds that mask symptoms and create code divergence.
- Persistent memory across sessions — Orion now maintains `.opencode/memory.md`, a project-level knowledge base that accumulates architecture decisions, conventions, and user preferences. The plugin injects it automatically into every session via `experimental.chat.system.transform`, so it's available from the first message without any tool call.
- The default soul directives are now in English — previously the built-in personality guidelines were in French, which was unexpected for non-French speakers. Disable with `soul: false` if you prefer a neutral voice.
- Orion now prefers registered user-defined agents over invented personas — when a project defines domain-specific agents (e.g., `languages/typescript-pro`, `mcp/mcp-developer`, `web/react-specialist`), Orion selects them instead of defaulting to a `general` + invented persona name

### Changed

- The `review-manager` is now significantly faster for trivial changes — it instantly approves docs-only or formatting updates without spawning sub-agents, and only spins up a single `code-reviewer` for low-risk tweaks.
- The reviewer delegation prompt has been drastically slimmed down — the `review-manager` no longer wastes tokens re-explaining focus, stance, or formatting to specialized reviewers that already know their job.

### Fixed

- Reviewer agents (requirements, code, security) now have a hardcoded skeptical stance in their system prompts — this counteracts the default LLM approval bias where agents would spot real issues but rationalize them away instead of flagging them.

### Removed

- `sequential-thinking` has been removed — modern models decompose complex workflows natively, making the explicit planning tool unnecessary friction
- The "What you MUST NOT do" tool list has been removed — the Cardinal Rule and Anti-Patterns section already cover this constraint more effectively
- The delegation prompt template (the 5-section ## Context / ## Task / ## Files / ## Constraints / ## Deliverable scaffold) has been removed — modern models structure delegations well without an explicit template, and the surrounding prose conveys the substance
- In-Flight Delegations tracking from the scratchpad template has been removed — the compaction hook already preserves the full scratchpad, making the urgent task_id recording instruction redundant
- The Self-Evaluation numbered checklist has been collapsed to prose — the core checks (original request coverage, multi-agent coherence, scope drift, side effects) are preserved but without the mechanical 6-item format
- The `< 1-2 delegations away` interruption threshold has been removed from the scope-switching protocol — the metric was unmeasurable and the principle (park state, switch, return) stands without it
- The "When NOT to Prune" subsection has been removed from the Context Management section — all three bullets described actions a model wouldn't take anyway
- The "Max Retries" column has been removed from the error handling retry table — the "2 total attempts → escalate" rule in prose is the one that matters, the per-cause counters were redundant and contradictory

## [0.7.0] - 2026-03-25

### Added

- Three specialized reviewer agents are now included: `requirements-reviewer`, `code-reviewer`, and `security-reviewer` — the review-manager spawns them automatically based on change type and risk level (size × risk axes), and always runs `requirements-reviewer` on non-trivial reviews; high-risk patterns (auth, SQL, crypto, secrets) force `security-reviewer` regardless of change size
- Orion can now embody a personality — embed your tone and communication directives in the plugin and Orion applies them automatically in every session. Disable with `soul: false` in your `opencode.json` agent config if you prefer a neutral voice.

### Fixed

- Overriding a permission key in `opencode.json` no longer silently drops the plugin defaults for that key — your custom permissions are now merged on top instead of replacing the entire group
- In-flight delegations are now tracked in the scratchpad with their `task_id` — if compaction hits while a delegation is running, Orion can resume without losing track of what was dispatched
- Adding the `requirements-reviewer` no longer reduces technical review coverage — functional and technical reviews now run in full, independently

## [0.6.2] - 2026-03-19

### Changed
- The team-lead agent now has a name — meet **Orion**. Referenced as Orion throughout the system prompt and documentation.

## [0.6.1] - 2026-03-13

### Removed

- Removed the memoai memory integration — the team-lead no longer uses `memoai_memo_search` and `memoai_memo_record` to record decisions or search past context across sessions

## [0.5.0] - 2026-02-20

### Added

- The team-lead now proactively manages its context window — clear guidance on when to distill, prune, and compress tool outputs to prevent compaction surprises
- The scratchpad now tracks the active task in detail (sub-tasks, files being modified, resume context) — if compaction hits mid-step, the team-lead can resume exactly where it left off instead of losing implementation details

## [0.4.1] - 2026-02-20

### Fixed

- The team-lead now consistently delegates reviews to the review-manager instead of spawning reviewer agents directly — reinforced with explicit constraints in three places across the prompt

## [0.4.0] - 2026-02-20

### Added

- Reviews are now handled by a dedicated review-manager agent that spawns specialized reviewers in parallel and arbitrates disagreements — the team-lead no longer manages reviews directly
- The review-manager agent can be customized from `opencode.json` just like the team-lead (temperature, color, permissions)

## [0.3.1] - 2026-02-20

### Fixed

- The team-lead now reads and writes its scratchpad (`.opencode/scratchpad.md`) directly — previously it couldn't maintain its working memory due to missing file permissions

## [0.3.0] - 2026-02-20

### Added

- Agent properties and permissions can now be customized from your `opencode.json` — override temperature, color, or add extra tool permissions without forking the plugin

## [0.2.1] - 2026-02-20

### Added

- The team-lead can now manage its context window using DCP tools (`distill`, `prune`, `compress`) — keeping sessions clean across long conversations

## [0.2.0] - 2026-02-20

### Changed

- npm package now ships with provenance attestation for supply chain verification

## [0.1.0] - 2026-02-20

### Added

- Initial release of the team-lead orchestrator plugin for OpenCode
- npm package with installation docs

[Unreleased]: https://github.com/azrod/opencode-team-lead/compare/v0.8.0...HEAD
[0.8.0]: https://github.com/azrod/opencode-team-lead/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/azrod/opencode-team-lead/compare/v0.6.2...v0.7.0
[0.6.2]: https://github.com/azrod/opencode-team-lead/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/azrod/opencode-team-lead/compare/v0.5.0...v0.6.1
[0.5.0]: https://github.com/azrod/opencode-team-lead/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/azrod/opencode-team-lead/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/azrod/opencode-team-lead/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/azrod/opencode-team-lead/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/azrod/opencode-team-lead/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/azrod/opencode-team-lead/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/azrod/opencode-team-lead/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/azrod/opencode-team-lead/releases/tag/v0.1.0
