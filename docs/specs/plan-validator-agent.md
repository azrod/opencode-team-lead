---
title: "Plan Validator Agent"
id: plan-validator-agent
type: "technical"
status: draft
created: 2026-09-22
---

## Purpose

Define the contract of the `plan-validator` agent — a structural clarity checker invoked automatically after every `plan_create` call. Its job is to verify that a newly created exec-plan has a clear functional objective, atomic actionable blocks, and coherent internal dependencies. It does not evaluate whether the plan solves the right problem, whether the technical approach is sound, or whether the implementation will be easy.

## Behavior

The plan-validator receives the id of a newly created plan and performs four structural checks.

**Functional objective check.** The plan must have a `## Functional objective` section (or equivalent) that is present, non-empty, and explains the user problem being solved — not just the feature name. A section that reads "Add auth system" is insufficient; the validator expects the *why* behind the work, understandable without additional context.

**Block atomicity and actionability check.** Each building block must be a single logical deliverable, independently reviewable by the review-manager. A block that bundles multiple deliverables ("write service, write tests, update docs, fix bugs") is flagged as a structural flaw. Every block must carry a "Done when" criterion that is mechanically verifiable — not vague ("Done when: it works") and not ambiguous. A plan with no "Done when" criteria on any block is always rejected.

**Dependency coherence check.** If blocks declare dependencies on each other, the validator checks for circular dependencies (A depends on B, B depends on A) and illogical ordering (Block 2 depends on Block 1, which comes after it in the plan). If no dependencies are declared, this check is skipped.

**Scope realism check.** A catch-all block that vaguely covers everything not listed elsewhere is flagged as a structural flaw. A plan with 15+ blocks covering unrelated concerns may indicate scope that belongs in multiple plans — the validator flags it without rejecting for that reason alone.

**Verdict.** The agent returns exactly one of two verdicts on the first line of its output:

- `APPROVED` — the plan is structurally sound and safe to delegate. An optional short comment may follow.
- `REJECTED` — one or more structural flaws make the plan unsafe to execute as-is. The output includes a structured breakdown: missing or unclear functional objective, blocks with structural flaws (by name or number), dependency issues, and a short list of concrete changes needed.

The agent's default is pragmatic: a short plan with one block and a clear objective is perfectly valid. Rejection requires a concrete structural flaw that would make execution impossible without constant clarification — not a judgment that the plan could be more detailed.

## Constraints

- The verdict (`APPROVED` or `REJECTED`) must appear on the first line of the output, in uppercase, with no preamble.
- A plan with no "Done when" criteria on any block is always rejected.
- The agent must not reject for stylistic reasons, missing "nice to have" blocks, sparse prose, or business-level disagreement with the plan's goals.
- The agent operates as `mode: subagent`, `silent: true`, `temperature: 0.1` — invisible to the user, deterministic output.
- The agent is triggered by `plan_validate` only, invoked automatically on `plan_create`. It is **never triggered on plan updates** — plan updates are the team-lead's responsibility.
- Permitted tools: `plan_get`, `plan_list`. No access to the filesystem, specs, or code.
- The agent never creates, modifies, or deletes plans. It reads and judges.

## Examples

**Scenario: plan missing "Done when" criteria**

A plan has three building blocks. None of them has a "Done when" field. The validator rejects:

```
REJECTED

### Problems Found

#### Blocks with structural flaws
- **Block 1 (API gateway)**: No "Done when" criterion. Cannot determine what success looks like.
- **Block 2 (Auth service)**: No "Done when" criterion.
- **Block 3 (Integration tests)**: No "Done when" criterion.

### What needs to change

Every block requires a mechanically verifiable "Done when" criterion. Add one to each block.
```

**Scenario: valid minimal plan**

A plan has a single block: "JWT authentication flow working end-to-end. Done when: POST /auth/login returns a signed JWT for valid credentials and 401 for invalid ones." The objective explains why users need login. The validator approves:

```
APPROVED
```

**Scenario: circular dependency**

A plan declares Block A depends on Block B, and Block B depends on Block A. The validator rejects:

```
REJECTED

### Problems Found

#### Dependency issues
- Block A declares a dependency on Block B, and Block B declares a dependency on Block A — circular dependency. The plan cannot be executed.

### What needs to change

Break the cycle. Identify which block must be completed first and remove the reverse dependency.
```
