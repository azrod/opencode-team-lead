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

Architect is not an implementation or delegation agent. It cannot edit code, run shell commands, access external directories, spawn subagents, inspect briefs, delete artifacts, or use `project_state`.

It can read, list, glob, and grep ordinary repository files. Specs and exec-plans remain available only through lifecycle tools. Its lifecycle allowlist is limited to:

- Specs: `spec_list`, `spec_get`, `spec_format`, `spec_create`, `spec_update`, `spec_validate`
- Exec-plans: `plan_list`, `plan_get`, `plan_format`, `plan_create`, `plan_update`, `plan_validate`

Architect may create or update a spec after explaining the problem, alternatives, recommendation, and trade-offs. It may create or update an exec-plan only after the user explicitly accepts the architecture decision the plan records. It cannot use `plan_block_done`: marking delivery work complete is outside its decision-advisory role. That does not replace Planning as the general-purpose exec-plan author.
