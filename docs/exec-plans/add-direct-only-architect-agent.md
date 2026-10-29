---
created: 2026-10-18
---

## Goal

Add Direct-Only Architect Agent

## Functional objective

Users need a dedicated architecture advisor they can invoke directly to understand an application as a whole and make sound structural decisions. The agent must explain responsibilities, boundaries, options, and migration paths in plain language with useful diagrams, while remaining unable to change application code. It must be able to turn accepted architectural direction into specs and exec-plans without becoming an implementation or delegation agent.

## Scope

### In scope
- Register a visible primary `architect` agent in `config/agents.js`.
- Add `agents/architect.md` with a whole-system architecture advisory workflow.
- Grant read and exploration capabilities for ordinary repository files only; protected specs and exec-plans remain accessible exclusively through their lifecycle tools, while briefs remain inaccessible by every route.
- Grant an explicit, non-destructive allowlist of spec lifecycle tooling and a conditional exec-plan lifecycle allowance; Architect may create or update an exec-plan only after the user explicitly accepts the architectural decision it formalizes. Deny code editing, shell execution, task delegation, external-directory access, deletion lifecycle tools, brief lifecycle tools, and project-wide state tooling.
- Require clear ASCII diagrams in Markdown fenced code blocks tagged `text`, plus plain-language explanation of responsibilities, communication, decisions, trade-offs, and incremental migration. Mermaid and `mermaid` code blocks are prohibited because OpenCode does not render them.
- Add or update automated tests that verify the agent registration and permission contract.
- Update user-facing documentation if agent lists or permissions are documented there.

### Out of scope
- Any implementation change to application code performed by Architect.
- Architect access to brief lifecycle tools.
- Architect delegation to other agents.
- A generic refactor of permission rules unrelated to Architect.

## Building blocks

- [x] **Bloc 1 — Register the direct-only agent and enforce its permissions**

  Add `architect` to the plugin agent registry as a visible primary agent, then encode its read-only, non-delegating boundaries and its narrow spec/exec-plan lifecycle access in its permission declaration.

  Done when:
  - `config/agents.js` registers an `architect` agent with `mode: "primary"` and no hidden flag that removes it from direct selection
  - Architect is not registered with `mode: "subagent"` and is therefore not selectable by `task`
  - Architect can read, list, glob, and grep ordinary repository content, while specs and exec-plans remain reachable only through their lifecycle tools and briefs remain unreachable
  - `edit`, `bash`, `task`, `external_directory`, `spec_delete`, `plan_delete`, every `brief_*` tool, and `project_state` are denied
  - The permitted spec lifecycle tools are `spec_list`, `spec_get`, `spec_format`, `spec_create`, `spec_update`, and `spec_validate`
  - The permitted exec-plan lifecycle tools are `plan_list`, `plan_get`, `plan_format`, `plan_create`, `plan_update`, and `plan_validate`; `plan_create` and `plan_update` are used only after the user explicitly accepts the architectural decision to formalize, while `plan_block_done` remains denied because Architect must not mutate delivery progress

- [x] **Bloc 2 — Write the architecture-advisor prompt**

  Add a dedicated prompt that makes Architect study the full system, name real ownership boundaries, explain recommendations in ordinary language, use ASCII diagrams in `text` code blocks when they clarify the architecture, and convert justified decisions into specs or exec-plans without modifying code.

  Done when:
  - `agents/architect.md` exists and is loaded by the registry's prompt-loading convention
  - The prompt requires clear separation of observed facts, inferences, and open questions
  - The prompt requires current-state, target-state, and migration diagrams when relevant, with a plain-language explanation for each
  - Before any `spec_create`, `spec_update`, `plan_create`, or `plan_update` that formalizes an architectural decision, the prompt requires the problem, realistic alternatives, selected option, and trade-offs to be explained
  - Before `plan_create` or `plan_update`, the prompt requires an explicit user acceptance to formalize the decision as an exec-plan
  - The prompt forbids code implementation, task delegation, unexplained jargon, and unsupported big-bang rewrites

- [x] **Bloc 3 — Verify the public contract**

  Extend the automated checks and documentation where needed so the direct-only registration and restricted permissions remain intentional and discoverable.

  Done when:
  - Automated tests cover Architect's mode, visibility, protected-artifact boundaries, explicit lifecycle allowlist and denials, and the decision-rationale requirement in its prompt
  - `docs/specs/architect-agent.md` requires explicit user acceptance before Architect creates or updates an exec-plan
  - `docs/specs/team-lead-delegation.md` records Architect as directly selectable and non-delegable, documents its narrow exception to the general rule that Planning produces exec-plans, and updates any retained agent count
  - `docs/specs/planning-agent.md` and the relevant lifecycle-tool specification clause explicitly permit Architect to create or update an exec-plan only after the user accepts the architectural decision being formalized; they preserve Planning as the general-purpose planning agent and preserve Architect's bans on delegation and implementation
  - `npm test` passes
  - `npm run lint` passes
  - User-facing agent documentation reflects Architect if the existing documentation enumerates available agents

## Decision log

2026-10-18 — Architect is a visible primary agent rather than a subagent. Rationale: architecture direction is a direct user decision and must not silently become delegated implementation work.

2026-10-18 — Architect may write only through spec and exec-plan lifecycle tools. Rationale: it can formalize decisions and delivery trajectories without changing code or product briefs.

2026-10-18 — ASCII diagrams in `text` code blocks and plain language are mandatory for non-trivial recommendations. Rationale: OpenCode does not render Mermaid, while readable boxes, arrows, and short labels make responsibilities and flows understandable beyond technical specialists.

2026-10-18 — Architect may create or update an exec-plan only after explicit user acceptance of the architectural decision being formalized. Rationale: Planning remains responsible for general planning; Architect must not turn an unaccepted recommendation into delivery work.

## Building blocks

## Decision log
