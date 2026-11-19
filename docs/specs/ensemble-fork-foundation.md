---
title: "Ensemble Fork Foundation"
id: ensemble-fork-foundation
type: "architectural"
status: draft
created: 2026-11-08
---

## Purpose

Make an Ensemble-based distribution the foundation of the team-lead product so users install one plugin and automatically receive a predefined team composition in every new team-lead session. Replace the existing execution foundation incrementally rather than requiring users to configure two independent plugins or assemble their team repeatedly. This specification records the accepted product architecture, not an implementation-ready migration plan.

## Behavior

### One installed product

The distribution is based on a fork of hueyexe/opencode-ensemble. Users configure one plugin entry for the distribution; a separately installed Ensemble plugin is not required. Ensemble is the inherited team execution engine, not a second independently initialized engine embedded alongside the current delegation workflow.

The distribution supplies the team-lead orchestrator, retained agent definitions and applicable project artifact and review capabilities. Fork ownership includes integrating and verifying upstream fixes. No feature parity with every upstream client, dashboard or legacy OpenCode version is implied by this foundation decision.

### Responsibility boundaries

The inherited engine owns team identity, member sessions, messaging, operational task state and worktree lifecycle. The team-lead layer owns role selection, task delegation and the interpretation of results under the product's review rules. Existing spec and plan capabilities retain their distinct responsibility for durable decisions and accepted delivery progress.

```text
[One plugin installation]
           |
           v
[Team-lead and predefined composition]
           |
           v
[Inherited Ensemble engine]
           |
           v
[Member sessions, messages and worktrees]
```

The team-lead assigns work through the inherited engine. The engine runs members and delivers their messages; it does not independently decide whether their results satisfy the product's acceptance rules.

### Automatic predefined composition

Every new team-lead session obtains the configured default team composition without asking the user to rebuild it. The composition describes available working roles and their agent types. It is distinct from the registry of agent definitions and from currently running member sessions.

A fresh installation must ultimately provide a usable default composition; its exact membership is an unresolved product decision, not an empty placeholder to ship. Users may configure a composition once and reuse it across subsequent team-lead sessions. Configuration syntax, storage location, overrides and model-selection precedence are not fixed by this specification.

Loading a composition does not start its members. A member session starts only when a concrete task is assigned to that role. An unused role has no member session and triggers no member inference request or worktree creation solely because it belongs to the composition. Creating the logical team record may be deferred; this specification does not prescribe its exact timing.

The same composition is reusable across independent team-lead sessions. This does not automatically transfer old member conversations, tasks or worktrees into a new mission. Continuation of an existing mission must be distinguished from starting a new one; exact continuation policy remains open.

### Retained roles and acceptance boundaries

The fork must preserve the retained agents' applicable responsibilities and access restrictions when those capabilities are ported. Registering an agent does not make it an automatically started team member. In particular, architect remains a directly selected architecture advisor rather than a delegable delivery worker. Retired personas are not reintroduced merely because historical team-lead instructions mention them.

Specs, plans, lifecycle access protections and independent review responsibilities remain part of the target product. This foundation decision does not authorize silently broadening an agent's permissions or assigning it a new responsibility. Structural spec validation remains distinct from explicitly delegated semantic review. The spec-validator and plan-reviewer gates remain distinct from delivery review.

An Ensemble task marked completed indicates an execution result, not accepted delivery. A member's completion message is not a reviewer verdict. Approval must cover the relevant artifact content or changes before it can support accepted progress under the applicable existing workflow.

The exact transport for reviewer invocation is not selected here. Porting the review capability must retain reviewer independence, permissible delegation targets and access to the changes being reviewed; it must not turn all reviewers into permanently active team members without a separately accepted decision.

### Incremental replacement

The current plugin remains the reference for retained team-lead capabilities while the fork is established. A minimal fork-based path is verified before the existing product is replaced: a team-lead session obtains the composition, assigns one task, starts the appropriate member and receives its result.

```text
[Current plugin reference]
           |
           v
[Fork baseline and minimal task path]
           |
           v
[Retained protections and review capabilities]
           |
           v
[Replacement distribution]
```

These are successive validation states, not two production engines running together. The original product remains a fallback during migration; reverting a trial must not require deleting unfinished team work.

Existing specs and plans are not silently rewritten, deleted or declared incompatible by adopting the fork. No direct migration of upstream SQLite data, old teams or user configuration is authorized by this document. A concrete compatibility contract is required before a replacement release.

## Constraints

- A clean installation must operate with one configured distribution plugin and no separately configured upstream Ensemble plugin.
- One team operation must not be executed twice by independently initialized old and forked engines.
- New-session initialization must resolve the default composition without a per-session composition questionnaire.
- Composition loading alone must create zero member sessions and zero member worktrees.
- First-task tests must demonstrate that assignment starts the selected member, not every role in the composition.
- Independent mission tests must demonstrate that reusing a composition does not automatically reuse old member conversations or worktrees.
- Existing direct-only and reviewer access boundaries must have regression tests before the corresponding capabilities replace the current plugin's behavior.
- Operational completion alone must not satisfy a review gate or mark a delivery block accepted.
- The selected upstream baseline must be identified by an immutable commit before porting starts; a moving main branch is not a reproducible baseline.
- Retain the inherited MIT copyright and license notices in redistributed material as required by that license.
- Declared runtime requirements must match the selected fork baseline and be verified in the supported host. The current plugin's Node >=22 declaration is not proof that Ensemble's engine supports that runtime.
- Current constraints on dependencies and build tooling describe the old product baseline, not an assurance that the fork remains dependency-free or build-free. Changes must be inventoried and documented before replacement.

## Examples

A user installs the distribution and configures their preferred team composition once. In a new team-lead session, the roles are immediately known but no member session starts. When the user requests work and the team-lead assigns a concrete task to one role, the engine starts that role's member. Other roles remain definitions rather than running sessions.

In a second independent team-lead session, the same composition is available without asking the user to enter it again. The session does not automatically inherit the first mission's member conversation or worktree.

A member reports completion and the operational board records its task as completed. The team-lead still applies the applicable review process; the completion state alone does not authorize accepted delivery progress.

An illustrative configured role points to an unavailable agent type. The system must not pretend that a member of the requested type is available. Whether this invalidates the composition at session initialization or blocks assignment is an open validation-policy choice to settle before delivery planning.

## Rationale

Keeping only native delegation would not provide the requested Ensemble foundation. Configuring two separate plugins would violate the single-installation requirement. Embedding Ensemble as a dependency could reduce maintenance, but the user explicitly selected a fork instead so the product can evolve directly on that foundation.

A fork permits first-class composition and team-lead behavior without relying on unpublished internal cross-plugin interfaces. Its continuing cost is responsibility for upstream integration, runtime compatibility and regression testing. Keeping inherited execution responsibilities separate from team-lead policy limits unnecessary divergence.

The previously scoped Unified Agent Registry refactor remains historical and behavior-preserving within its own scope. This separately accepted foundation introduces future behavioral changes; it does not retroactively change that refactor's acceptance conditions. Historical retired-agent routing in Team-Lead Delegation is not an active workflow to port unchanged. Lifecycle Tools and the review specifications remain compatibility references for retained capabilities; any necessary contract changes require explicit amendments rather than an implicit override by this foundation document.

## Non-goals

This document does not create a GitHub fork, change repository remotes, implement code, change dependencies, publish a release or authorize delivery execution.

It does not select the fork repository or publication identity, immutable upstream baseline, supported host/runtime matrix, exact default roster, profile configuration format, mission continuation policy, or replacement-release migration contract. Those remain open decisions for subsequent specification work before a delivery plan can be approved.

Failing closed on worktree creation errors and disabling merge-on-cleanup were architectural recommendations during exploration, not explicit user decisions. The fork's isolation-failure and integration/cleanup policies remain open and must be resolved before delivery planning; no silent acceptance of upstream fallback behavior is implied either.

Rewriting the entire review transport, adding a dashboard, supporting legacy hosts and redesigning all retained agents are not implied by choosing the fork.