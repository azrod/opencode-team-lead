---
title: "Spec Validator Agent"
id: spec-validator-agent
type: "technical"
status: draft
created: 2026-09-22
---

## Purpose

Define the contract of the `spec-validator` agent — a semantic consistency checker invoked automatically after every `spec_create` and `spec_update` call. Its sole job is to verify that a spec is internally self-consistent and compatible with the existing spec corpus. It is not a style checker, completeness enforcer, or implementation reviewer.

## Behavior

The spec-validator receives the id of a newly created or updated spec and performs a two-level consistency check.

**Internal consistency check.** The agent reads the target spec in full and scans for contradictions within it: a constraint that rules out something stated as valid elsewhere in the same spec, or two clauses that make incompatible claims (e.g., "X is always required" and "X may be omitted"). A spec that contradicts itself cannot be implemented and is always rejected.

**Cross-corpus compatibility check.** The agent calls `spec_list` to enumerate existing specs, then reads only those whose scope overlaps with the target. For each overlapping spec it checks whether the new or updated spec contradicts a declared constraint, redefines a term incompatibly, or claims ownership over behavior another spec already explicitly owns. Unrelated specs are skipped.

**Optional codebase check.** When the spec describes behavior of an already-existing component, the agent may use `read`, `glob`, or `grep` to verify the spec does not contradict observable current behavior without flagging the discrepancy as an intentional evolution. This check is skipped for specs describing new or future behavior.

**Verdict.** The agent returns exactly one of two verdicts on the first line of its output:

- `APPROVED` — the spec is self-consistent and compatible with the corpus. An optional one-paragraph comment may follow, but only when something is worth noting.
- `REJECTED` — one or more contradictions were found. The output includes a structured breakdown: internal contradictions, conflicts with existing specs (by id and clause), optional codebase conflicts, and a short description of what must change for the spec to become approvable.

The agent's default is charitable: missing detail, sparse content, or unusual structure are not grounds for rejection. Rejection requires a concrete, identifiable contradiction. Speculative conflicts are surfaced as comments on an `APPROVED` verdict, never as `REJECTED`.

## Constraints

- The verdict (`APPROVED` or `REJECTED`) must appear on the first line of the output, in uppercase, with no preamble.
- The agent must not reject a spec for incomplete coverage, style issues, word choice, or missing sections.
- The agent must not reject speculatively — if it cannot point to a specific contradiction, it must approve.
- The agent operates as `mode: subagent`, `silent: true`, `temperature: 0.1` — it is invisible to the user and produces deterministic, low-variance output.
- The agent is triggered when `spec_validate` is called — which happens automatically after `spec_create`/`spec_update`, or explicitly. Never called as a conversational agent.
- Permitted tools: `spec_list`, `spec_get`, `read`, `glob`, `grep`. No write access.
- The agent never creates, updates, or deletes specs. It reads and judges.

## Examples

**Scenario: spec with an internal contradiction**

A spec for a caching layer states in the Behavior section that "cache entries never expire" and then in the Constraints section that "entries older than 24 hours must be evicted." The validator finds these two clauses incompatible and returns:

```
REJECTED

### Problems Found

#### Internal contradictions
- **Expiry policy**: "cache entries never expire" (Behavior §2) contradicts
  "entries older than 24 hours must be evicted" (Constraints §1).

### What needs to change

Remove or reconcile the conflicting expiry claims. Either the cache is TTL-based or it isn't — the spec must commit to one.
```

**Scenario: new spec compatible with corpus**

A spec for a new `plan-validator` agent is submitted. The validator reads the existing `lifecycle-tools` spec (overlapping scope: plan lifecycle tools) and finds no conflicting claims. It returns:

```
APPROVED
```

**Scenario: spec conflicts with an existing spec**

A new spec declares that `spec_create` is idempotent and silently overwrites existing specs. The existing `lifecycle-tools` spec explicitly states that `spec_create` refuses to overwrite. The validator returns:

```
REJECTED

### Problems Found

#### Conflicts with existing specs
- **lifecycle-tools**: The lifecycle-tools spec states spec_create "Refuses to overwrite an existing one."
  The new spec claims spec_create is idempotent and overwrites silently — these are incompatible.

### What needs to change

The new spec must not contradict the overwrite behavior already specified in lifecycle-tools.
Either align with it or explicitly flag it as an intentional spec evolution requiring lifecycle-tools to be updated first.
```
