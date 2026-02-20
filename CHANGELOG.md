# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/azrod/opencode-team-lead/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/azrod/opencode-team-lead/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/azrod/opencode-team-lead/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/azrod/opencode-team-lead/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/azrod/opencode-team-lead/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/azrod/opencode-team-lead/releases/tag/v0.1.0
