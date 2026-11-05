# Architect — Direct Architecture Advice

Architect is a visible, directly selectable `primary` agent for structural decisions. It reads the repository as a whole, explains what each part owns, identifies coupling and risks, and recommends an incremental direction without changing code.

## What It Produces

For a substantive assessment, Architect separates:

- **Observed facts**: evidence directly visible in the repository.
- **Inferences**: conclusions drawn from that evidence.
- **Unknowns**: information that could change the recommendation.

It then describes the current context, target architecture, alternatives and trade-offs, and an incremental migration path. Non-trivial assessments include readable ASCII diagrams in `text` code blocks for the current state, target state, and migration where applicable. These diagrams use boxes, arrows, and short labels without decorative art. Every diagram is followed by a plain-language explanation of ownership and communication.

Architect avoids unexplained acronyms and does not recommend a big-bang rewrite unless it can show a measurable reason incremental change is inadequate.

## Boundaries

Architect is not an implementation or delivery coordinator. It cannot edit code, run shell commands, access external directories, inspect briefs, delete artifacts, mark delivery progress, or use `project_state`. Its only delegation targets are `spec-validator` and `plan-reviewer`, for independent read-only reviews. It writes specs, plans, and all corrections itself.

It can read, list, glob, and grep ordinary repository files. Specs and exec-plans remain available only through lifecycle tools. Its lifecycle allowlist is limited to:

- Specs: `spec_list`, `spec_get`, `spec_format`, `spec_create`, `spec_update`, `spec_validate`
- Exec-plans: `plan_list`, `plan_get`, `plan_format`, `plan_create`, `plan_update`, `plan_validate`

Architect may create or update a spec after explaining the problem, alternatives, recommendation, and trade-offs. It may create or update an exec-plan only after the user explicitly accepts the architecture decision the plan records. It cannot use `plan_block_done`: marking delivery work complete is outside its decision-advisory role. That does not replace Planning as the general-purpose exec-plan author.

After creating or updating and validating an exec-plan, Architect presents only the remaining points that need your decision: the question, realistic options and their main consequences, and its recommendation with trade-offs. It explicitly asks you to choose, without replaying the plan or reopening accepted decisions unless new evidence warrants it. If no decisions remain open, it says so briefly. Unresolved architectural choices stay open; a recommendation or validated plan never counts as your acceptance.

## Review Gates

Before creating a plan, Architect needs a relevant current spec that passes `spec_validate` and receives `APPROVED` from `spec-validator`. An already approved current spec can be reused. Lifecycle validation checks structure only: semantic review is explicitly delegated, not automatically launched. Spec-validator checks consistency, not completeness or architecture quality.

Architect can draft a plan with open questions, but closes them with you before requesting review. It then explicitly requests `deep` review by default from `plan-reviewer`, covering spec coherence and code feasibility. The nested reviewer chain requires `experimental.subagent_depth: 2` in the host configuration.

Rejected specs and requested plan changes return to Architect for corrections, structural validation, and fresh review. New architectural choices return to you. Substantive spec changes invalidate prior approval and require reassessing affected plans; substantive plan changes also require fresh review. Reviewer approval never replaces your acceptance.

A plan is ready for handoff only when its current content has an `APPROVED` review against the current approved spec. Failed, blocked, or incomplete reviews are not approval. Infrastructure restrictions are reported without bypasses or repeated identical attempts. Architect hands off the reviewed artifacts; it does not implement or coordinate delivery.
