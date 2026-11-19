---
created: 2026-11-05
---

## Goal

Architect — Direct authorship with gated spec and plan reviews

## Functional objective

Users keep working directly with architect to make architectural decisions and write specifications and execution plans, while independent reviewers check those artifacts before handoff. A specification must be approved before the corresponding plan is created, and a plan must have no unresolved questions before its deep review. Architect remains responsible for discussion and corrections without becoming an implementation agent or delivery coordinator.

## Scope

### In scope
- Implement the accepted target behavior in specification `architect-agent`, preserving direct artifact authorship and explicit user acceptance for architectural decisions formalized in plans.
- Permit architect to delegate only to `spec-validator` and `plan-reviewer`; preserve all other implementation and artifact-access restrictions.
- Separate structural lifecycle validation from explicitly delegated semantic review.
- Require current specification approval before plan creation, and no unresolved questions before plan review; use `deep` plan review by default.
- Handle correction loops, changed specifications, new decisions, incomplete reviews and infrastructure blockers without claiming readiness prematurely.
- Align related reviewer contracts, regression tests and user-facing documentation.

### Out of scope
- Delegated artifact authorship, exploration, implementation or delivery coordination by architect.
- General lifecycle-tool redesign or automatic reviewer invocation from lifecycle tools.
- Expanding spec-validator into a completeness, architecture-quality or implementation reviewer.
- Changing the restrictions on direct access to protected artifacts or enabling plan progress updates and artifact deletion for architect.

## Building blocks

- [x] **Bloc 1 — Review and reconcile the specification contracts**

  Have an agent authorized to delegate submit the current `architect-agent` specification to `spec-validator`, correct contradictions and resubmit until approved. Align the related specification contracts, particularly `spec-validator-agent` and `plan-reviewer-agent-cluster`, with explicit invocation and architect as an authorized review caller. Changes describe intended evolution rather than pretending the implementation already exists. This plan was explicitly requested before the new spec-review gate could be exercised; it is a bootstrap delivery artifact, not evidence that the target gate has passed. No implementation starts until specification review and this plan's deep review are complete.

  Done when:
  - A recorded `APPROVED` semantic verdict covers the final current `architect-agent` specification, and every substantively changed related specification has passed structural validation and semantic review.
  - Related contracts support explicit spec-validator invocation and architect as a caller without claiming structural validation itself launches a reviewer.
  - The existing scopes of spec-validator and plan-reviewer remain unchanged.

- [x] **Bloc 2 — Implement architect's narrowly scoped review workflow**

  Update `agents/architect.md`, architect registration in `config/agents.js`, and affected reviewer prompts or descriptions. Permit exact reviewer targets only, preserve the primary-only agent role and direct lifecycle authorship, and encode the approved ordering and correction loops. Reuse the repository's native permission conversion and registration conventions; do not introduce a second permission mechanism. Make the plan-review caller provide `deep` explicitly by default and retain the existing nested reviewer chain.

  Done when:
  - Architect can delegate to `spec-validator` and `plan-reviewer` but not to implementation agents, explore agents, artifact writers or other orchestrators.
  - The prompt requires a structurally valid, semantically approved current specification before creating the corresponding plan and supports reuse of an already approved current specification.
  - Plan creation and updates retain explicit architectural-decision acceptance and the conversational checkpoint for unresolved choices; plan review waits until none remain and requests `deep` by default.
  - Rejected specs and requested plan changes require correction and fresh review; newly exposed decisions return to the user, and substantive spec changes invalidate the affected prior approval and trigger plan reassessment.
  - Failed, blocked or incomplete reviews cannot be represented as sufficient approval or a ready-to-execute plan.
  - Reviewer prompts accept architect as a caller; infrastructure failures, including nested delegation restrictions, are reported without bypass or repeated identical attempts.

- [x] **Bloc 3 — Add regression coverage and complete the reviewed handoff**

  Extend `tests/permissions.test.js` and appropriate existing tests to enforce the allowlist, preserve restrictions and check the workflow contracts. Update relevant ordinary documentation, including the architect website page and user-facing changelog. An authorized orchestrator requests deep review of this finalized delivery plan after questions are resolved, before implementation starts, and repeats review after substantive changes. Validate the implementation through the normal test and review workflow without making architect its delivery coordinator.

  Done when:
  - Permission tests assert exact reviewer-target allowances and denial for unknown targets, implementation, exploration and artifact authorship, both in definitions and registered defaults.
  - Tests preserve primary visibility, no implementation access, no brief access, no artifact deletion and no `plan_block_done` access.
  - Prompt contract tests cover spec approval before plan creation, no open questions before deep plan review, direct authorship, user acceptance, correction loops, stale approvals and incomplete-review blocking.
  - `npm test` and `npm run lint` pass.
  - Relevant documentation describes the new workflow and `CHANGELOG.md` includes its user-visible benefit under Unreleased.
  - An `APPROVED` deep review of the current delivery plan is recorded before implementation; any substantive plan changes receive a fresh review.

## Decision log

2026-11-05 — User accepted direct specification and execution-plan authorship by architect, with delegation limited to `spec-validator` and `plan-reviewer`. Rationale: retain a single author and user-facing architecture advisor while adding independent review.

2026-11-05 — User accepted specification approval before plan creation and plan review only after all questions are closed, with `deep` as the default. Rationale: avoid planning from inconsistent decisions or reviewing unresolved alternatives, and check feasibility against the codebase.

2026-11-05 — User accepted correction loops, renewed review after substantive specification changes, and retention of explicit user acceptance for architectural decisions. Reviewer approval is not user acceptance.

2026-11-05 — Current-session limitation: architect is still forbidden to delegate, so the updated specification has passed structural validation only. At the user's explicit request, this bootstrap delivery plan is recorded with specification semantic review and deep plan review pending. Neither approval is presumed; an authorized orchestrator must obtain both before implementation. No runtime permissions or application code were changed by drafting this plan.

## Review status

- Architectural decisions: accepted by the user.
- Open architectural questions: none identified.
- Specifications `architect-agent`, `spec-validator-agent`, and `plan-reviewer-agent-cluster`: structurally valid and semantically APPROVED on 2026-11-05 by spec-validator (session ses_e531c3fd2ffe3yeWtpYTgLPff5). Review covered the current contents and intentional evolution from historical caller/automatic-invocation wording; reviewer scopes remain unchanged.
- This delivery plan: deep review APPROVED on 2026-11-05 by plan-reviewer (session ses_e531ba429ffesbTlqYLaX5NOD9), with all three specialized reviewers APPROVED. Optional minor follow-up: correct lifecycle-tool descriptions to state structural-only validation and cover this distinction in tests; included as description/contract alignment, not lifecycle redesign.
- Implementation gate: passed before implementation. Implementation and delivery validation completed on 2026-11-05: `npm test` 136/136 passing; `npm run lint` passing; website `npm run build` passing (nonblocking chunk-size and external sidebar URL warnings); `git diff --check` clean.
- Independent delivery review: initial CHANGES_REQUESTED corrected, then APPROVED by review-manager session ses_e53187a24ffeVAOK0lm1CBBzg4 with requirements, code and security APPROVED and spec-reviewer NO_ACTION_NEEDED. Review was file-based; commands were run by the implementing agent.
- Related specification reconciliation: `lifecycle-tools`, `team-lead-delegation`, `planning-agent`, `spec-writer-agent` structurally valid and semantically APPROVED for current content by independent validator session ses_e531511feffeVfmVJPnD1pDnT2. This also reconciles historical automatic-review examples and overlapping no-delegation wording. No architectural decisions or delivery requirements changed.
- Native default-deny conversion restored in the existing common permission path after regression tests exposed the missing wildcard deny; configured overrides remain last-match-wins and have regression coverage. No second permission mechanism introduced.
- Existing Independent Judgment user edits preserved. No commit, tag or push performed.
- Execution ownership: the user requested implementation directly by the current coding agent; only independent reviews are delegated. This does not change architect's target role.
