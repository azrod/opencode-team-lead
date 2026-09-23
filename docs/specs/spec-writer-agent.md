---
title: "Spec Writer Agent"
id: spec-writer-agent
type: "technical"
status: draft
created: 2026-09-22
---

## Purpose

Define the contract of the `spec-writer` agent — a specialist in producing high-quality specification files that conform to the project's canonical format. The spec-writer is delegated by the team-lead or the gardener (in Bootstrap mode) with a domain or functional description to document. It writes specs; it does not plan work, modify code, or make architectural decisions.

## Behavior

The spec-writer follows a strict sequential workflow on every invocation.

**Step 1 — Get the canonical format.** The agent calls `spec_format()` before doing anything else. This returns the required frontmatter fields, mandatory sections, and structural conventions. The agent applies the format exactly and does not invent structure.

**Step 2 — Check for existing coverage.** The agent calls `spec_list()` to enumerate all existing specs and scans for specs that might already cover the domain it was asked to document. If a closely related spec exists and the domain is an extension of it, the agent proposes an update to that spec instead of creating a new one and stops — it does not create a new file. If the domain overlaps with an existing spec but introduces something genuinely new, the agent creates the new spec with an explicit reference to the related one. If no overlap exists, it proceeds.

**Step 3 — Explore the domain.** The agent uses `read`, `glob`, and `grep` to understand the code area it is documenting. It looks for exported interfaces, hook signatures, behavioral invariants (what is always true, always rejected, always returned), error handling contracts, and configuration options. It documents what exists and is guaranteed — not aspirations or intended future behavior.

**Step 4 — Write and create the spec.** The agent applies the canonical format: Purpose, Behavior, Constraints, Examples (in that order). It calls `spec_create(title, type, content)` to write the spec to disk. The type is chosen based on what the spec describes: `technical` for implementation contracts and API behavior, `functional` for user-visible behavior and workflow invariants, `architectural` for structural decisions and patterns.

**Step 5 — Validate.** The agent calls `spec_validate(id)` immediately after creation. If the validator returns `REJECTED`, the agent reads the feedback, applies a targeted fix via `spec_update`, and re-validates. The agent attempts at most 2 corrections. If the spec is still rejected after 2 attempts, the agent returns the `REJECTED` verdict with the validator's feedback and a clear explanation of what would need to resolve the conflict — it does not loop further.

**Step 6 — Return.** On completion the agent reports: the spec id on disk, the human-readable title, the final verdict (`APPROVED` or `REJECTED` with reason), and a 2–3 sentence summary of what the spec covers and its key invariants.

When the domain is too large for a single spec, the agent returns a decomposition plan instead of creating a catch-all. The decomposition lists proposed spec titles, types, and a one-line description of what each would cover, along with the rationale for splitting.

## Constraints

- The agent must call `spec_format()` before every `spec_create()` call — no exceptions.
- The agent must call `spec_list()` before every `spec_create()` call to detect duplicates.
- The agent must not overwrite an existing spec — `spec_create` refuses to do so, and the agent must detect the conflict via `spec_list` before attempting creation.
- The agent must not write specs for behavior that is not implemented. If something isn't in the code, it is not in the spec.
- The agent must not make architectural decisions. If the code is ambiguous, the ambiguity is surfaced in the return value — not resolved by the spec.
- The agent must not delete specs. If a spec is stale, it flags it in the return value.
- Maximum 2 correction attempts after a `REJECTED` verdict. On the third rejection, the agent stops and reports.
- The agent operates as `mode: subagent`, `silent: false`, `temperature: 0.3`.
- Permitted tools: `spec_format`, `spec_list`, `spec_get`, `spec_create`, `spec_update`, `spec_validate`, `read`, `glob`, `grep`. No exec-plan tools, no code modification tools.

## Examples

**Scenario: straightforward delegation**

The team-lead delegates "document the artifact-guard module" to the spec-writer. The agent:
1. Calls `spec_format()` — gets the canonical structure.
2. Calls `spec_list()` — finds no existing spec for artifact-guard.
3. Reads `tools/artifact-guard.js` and relevant sections of `index.js`.
4. Creates the spec with `spec_create("Artifact Guard", "technical", content)`.
5. Calls `spec_validate("artifact-guard")` — receives `APPROVED`.
6. Returns: id `artifact-guard`, verdict `APPROVED`, summary: "Documents the guard module that intercepts direct filesystem access to protected artifact directories. Key invariant: all 20 lifecycle tools bypass the guard unconditionally."

**Scenario: domain already covered**

The gardener delegates "document spec creation." The agent calls `spec_list()` and finds `lifecycle-tools` already covers `spec_create` in detail. The agent returns a recommendation to update `lifecycle-tools` rather than creating a new file, and stops without calling `spec_create`.

**Scenario: validator rejects, one fix sufficient**

The spec-writer creates a spec that the validator rejects for an internal contradiction. The agent reads the feedback, identifies the conflicting clauses, calls `spec_update` to fix the contradiction, and re-validates. The validator returns `APPROVED`. The agent reports the final `APPROVED` verdict.

**Scenario: domain too large**

The team-lead asks for "a spec covering the entire review pipeline." The agent determines this spans at least three distinct contracts (review-manager orchestration, individual reviewer contracts, arbitration logic) and returns a decomposition plan with three proposed specs instead of one catch-all.
