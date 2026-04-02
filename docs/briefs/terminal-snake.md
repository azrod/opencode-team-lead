---
project: "terminal-snake"
type: game
status: draft
created: 2026-04-02
updated: 2026-04-02
---

## Problem

Developers and hobbyists who want a quick, self-contained terminal game have no simple reference implementation of Snake written in pure Node.js that runs without dependencies or a build step.

## Vision

A zero-dependency Snake game that runs in any modern terminal with a single `node` invocation, serving as both a playable game and a readable reference implementation.

## Users

### Primary

Developers exploring terminal UI patterns in Node.js who want a working, dependency-free example they can read and modify.

## Core Use Cases

### UC-001 — Play a game of Snake (Priority: P1)

**As a** developer, **I want to** run `node snake.js` and play Snake in my terminal, **so that** I can enjoy the game without installing anything.

**Acceptance criteria:**
- Given a terminal ≥ 20×20, when the user runs `node snake.js`, then the game starts and accepts arrow-key input within 1 second.

## Success Criteria

- **SC-001**: The game starts, accepts input, tracks score, and ends with a game-over message — all without requiring `npm install`.

## Scope

### In scope

- Classic Snake mechanics (movement, eating, growing, collision)
- Arrow-key input
- Score display
- Game-over screen with final score

### Out of scope

- Multiplayer
- Persistent high-scores
- Color themes or configuration files

## Constraints

- Zero npm dependencies — Node.js builtins only (`readline`, `process`)
- Single file

## Open Questions

## Rejected Ideas
