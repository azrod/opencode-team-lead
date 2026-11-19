# Review Cluster

The review cluster is a 5-agent system that validates every delivery before it ships. `review-manager` orchestrates four specialists (`requirements-reviewer`, `code-reviewer`, `security-reviewer`, `spec-reviewer`) running in parallel, then synthesizes their verdicts into a single structured result that the team-lead acts on.

The team-lead always delegates to `review-manager`. It never spawns reviewers directly.

<ClientOnly><ReviewClusterDiagram /></ClientOnly>

## How It Works

```
team-lead
  └─► review-manager
        ├─► requirements-reviewer  (parallel)
        ├─► code-reviewer          (parallel)
        ├─► security-reviewer      (parallel)
        └─► spec-reviewer          (always — checks spec coverage)
              ↓
        Arbitrate disagreements
              ↓
        Single verdict → team-lead
```

1. The team-lead sends a review mission to `review-manager` with: what changed, which files, the original user requirements, and trade-offs made.
2. `review-manager` reads enough to classify the change type and selects which reviewers to spawn.
3. Reviewers run in parallel — each with a self-contained prompt, no shared context between them.
4. `review-manager` collects their verdicts, arbitrates disagreements, and returns one structured result.
5. The team-lead acts on the verdict.

## The 5 Agents

### review-manager

The review orchestrator. Its job is reviewer selection, prompt crafting, parallel execution, and verdict arbitration. It never reviews code itself — even a "quick look" is delegated.

**Mode:** `subagent` — invisible to the user, only reachable via `task` from the team-lead.

When it receives a mission, it:
- Classifies the change type and risk level
- Selects the appropriate reviewers (see selection matrix below)
- Crafts a self-contained prompt for each reviewer
- Launches them simultaneously
- Arbitrates disagreements: requirements failures block, security concerns win ties, critical severity always wins, minor style disputes don't block
- Returns the structured verdict

**Fast path:** For docs-only or formatting-only changes, `review-manager` returns APPROVED immediately without spawning any reviewers.

### requirements-reviewer

Verifies that the implementation does what the user asked. Nothing more, nothing less.

**Focus:** functional compliance — did we build what was asked, not how well it was built.

**Cardinal rule:** If the original user requirements are absent from the mission, returns `BLOCKED` immediately. Requirements cannot be inferred from code alone — that's guesswork, not review.

Four categories of findings:
- **Missing feature** — requirement stated, not implemented at all
- **Misinterpretation** — requirement implemented differently than specified (even if "better")
- **Partial implementation** — addressed but incomplete (happy path works, explicit edge case missing)
- **Scope creep** — implementation does things the user did not ask for

Scope creep is a real issue. If the user asked to change X and the implementation also changed Y, it gets flagged — even if Y looks like an improvement.

### code-reviewer

Evaluates technical quality: logic correctness, error handling, edge cases, API design, patterns, and maintainability.

**Focus:** is this code technically sound?

**Not in scope:** security vulnerabilities (that's `security-reviewer`), functional compliance (that's `requirements-reviewer`).

Concrete checks on every review:
- Null/undefined not guarded where inputs are uncontrolled
- Errors swallowed silently (empty `catch` body or generic log)
- Off-by-one in loops, index access, range checks
- Async errors not awaited or not caught
- Functions doing too many things (single-responsibility violation)
- Dead code or unreachable branches
- Naming that doesn't match behavior
- Inconsistent patterns vs. the rest of the codebase
- Missing tests for new logic (when tests exist in the project)

Style is only flagged when it degrades readability or creates inconsistency — not for its own sake.

### security-reviewer

Identifies vulnerabilities, misconfigurations, and data exposure risks.

**Focus:** does this change introduce or expose a security risk?

**Not in scope:** code quality, style, functional compliance.

**Seven threat categories:**

| Category | Examples |
|----------|---------|
| **Injection** | SQL/NoSQL string concatenation, shell commands from user input, prompt injection, template injection |
| **Authentication & Authorization** | Missing auth checks, bypassable auth, privilege escalation, insecure token handling, JWT flaws |
| **Data Exposure** | Sensitive data logged, over-fetching API responses, missing encryption at rest, stack traces to clients |
| **Input Validation** | Missing sanitization, path traversal, mass assignment, missing size limits |
| **Secret Handling** | Hardcoded credentials, secrets in env vars that get logged, private keys in repo |
| **Dependency & Supply Chain** | New dependencies, unpinned versions for security-critical packages, untrusted registries |
| **Infrastructure Misconfigs** | Overly permissive IAM, public storage buckets, open ports, TLS disabled |

**Unconditional blocker:** any critical security finding triggers BLOCKED, no exceptions, regardless of other reviewers' verdicts.

For changes touching auth, session/token handling, or cryptographic operations, the security-reviewer must explicitly acknowledge the review in its output — even if no issues were found. Absence of a finding is not implicit.

### spec-reviewer

Runs automatically in every review cycle as part of the review-manager pool. Evaluates whether the delivery introduces or changes behavior that should be captured in a spec.

**Focus:** spec coverage — does this delivery need a new spec, or should an existing spec be updated?

**Not in scope:** code quality, functional compliance, security.

Four possible verdicts:
- **`NO_ACTION_NEEDED`** — no spec impact, delivery proceeds
- **`SPEC_CREATE_NEEDED`** — delivery introduces new behavior not captured in any spec; team-lead must call `spec_create` then `spec_validate`
- **`SPEC_UPDATE_NEEDED`** — delivery changes behavior documented in an existing spec; team-lead must call `spec_update` then `spec_validate`
- **`SPEC_VIOLATION`** — delivery contradicts an existing spec; this is a blocker — the team-lead escalates to the user to decide: fix the implementation or update the spec

`SPEC_VIOLATION` is the only verdict that blocks delivery. The other three are informational — the team-lead handles spec maintenance after delivery.

## Verdict Protocol

| Verdict | Meaning | team-lead's action |
|---------|---------|-------------------|
| **APPROVED** | All reviewers found no critical or major issues; requirements met; no open questions | Proceed to delivery |
| **CHANGES_REQUESTED** | Issues that can be fixed without architectural rework | Re-delegate fixes to the original producer, then request a second review |
| **BLOCKED** | Critical issue with no safe path forward, or implementation fundamentally mismatches requirements | Stop. Escalate to user with full reasoning. Do NOT fix without user input. |

When in doubt between APPROVED and CHANGES_REQUESTED, `review-manager` defaults to CHANGES_REQUESTED. The cost of a false approval is higher than the cost of an extra fix cycle.

**Maximum 2 review rounds.** If not approved after 2 iterations, the team-lead escalates to the user rather than looping further.

## Reviewer Selection Matrix

`review-manager` applies proportionality rules — risk overrides size:

| Change type | Size | Risk | Reviewers spawned |
|-------------|------|------|------------------|
| Docs-only / formatting | any | n/a | **None** — instant APPROVED |
| Any code change | Trivial (1–2 files, <50 lines) | Low | 1 combined reviewer (`code-reviewer` with requirements mandate folded in) |
| Any code change | Trivial (1–2 files, <50 lines) | **High** | `requirements-reviewer` + `security-reviewer` + `code-reviewer` |
| Any code change | Normal (3–10 files) | Low | `requirements-reviewer` + `code-reviewer` + 1 domain reviewer |
| Any code change | Normal (3–10 files) | **High** | `requirements-reviewer` + `security-reviewer` + `code-reviewer` + 1 domain reviewer |
| Any code change | Large (10+ files) | Low | `requirements-reviewer` + `code-reviewer` + 2 domain reviewers |
| Any code change | Large (10+ files) | **High** | `requirements-reviewer` + `security-reviewer` + `code-reviewer` + 1 domain reviewer |

**Hard cap:** never more than 3 technical reviewers. `requirements-reviewer` does not count toward this cap.

::: tip spec-reviewer scope
`spec-reviewer` runs on every review cycle that actually spawns reviewers. It does **not** run on the docs-only fast-path (instant APPROVED without spawning any reviewers). It is also not triggered when review is skipped entirely (see [When to Skip Review](#when-to-skip-review)).
:::

**High-risk patterns that always require `security-reviewer`** regardless of size:
- Auth, session, or token handling
- SQL queries or ORM calls
- Cryptographic operations
- Permission or access control checks
- Secret, credential, or API key handling
- External API calls transmitting user data
- Prompt injection vectors (LLM integration)

## When to Skip Review

The team-lead MAY skip review entirely only when **all three** are true:
1. The change is documentation-only (no code, no config, no infra)
2. The change has no security implications
3. The user explicitly requested speed over thoroughness

When skipping, the team-lead notes it in the report: _"Review skipped — documentation-only change."_
