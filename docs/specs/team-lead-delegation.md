---
title: "Team-Lead Delegation"
id: team-lead-delegation
type: functional
status: implemented
created: 2025-01-01
---

# The team-lead — Workflow de délégation

The current inventory below reflects [Retire Five Auxiliary Agents](retire-five-auxiliary-agents.md) and the subsequent removal of `bug-finder`: 12 specialized plugin agents plus `team-lead` remain available. Bug-finder's team-lead caller instructions are removed without assigning a replacement role; its [specification](bug-finder-agent.md) is historical.

> **Deferred routing — 2026-11-06.** The Workflow section and all subsequent routing sections are preserved historical descriptions pending the separate team-lead redesign. Their planning/harness invocation rules and other retired-agent references are not supported post-retirement routing instructions. The prompt was relocated byte-for-byte to `agents/team-lead.md` under [Unified Agent Registry](unified-agent-registry.md). The subsequent bug-finder removal deletes only its caller guidance; the prompt may still route to the other retired agents, including Brainstorm, Planning, Harness and Gardener protocols and researcher selection. This is a known transitional mismatch, not a fully repaired end-to-end workflow. No responsibilities are transferred to team-lead, architect, or another replacement by this retirement.

---

## Agents disponibles

`AGENT_DEFS` in `config/agents.js` contains all 13 plugin definitions in registration order: `team-lead` first, followed by the 12 specialized agents below. The entrypoint consumes this complete list through `registerAgent`; native host agents are not included in this count. This structural unification changes no agent behavior or permissions.

| Agent | Role | Mode | Spec |
|-------|------|------|------|
| `review-manager` | Coordinates specialized reviews and arbitrates verdicts | subagent | [review-cluster](review-cluster.md) |
| `requirements-reviewer` | Checks implementation against requirements | subagent | [review-cluster](review-cluster.md) |
| `code-reviewer` | Reviews correctness and maintainability | subagent | [review-cluster](review-cluster.md) |
| `security-reviewer` | Reviews security risks | subagent | [review-cluster](review-cluster.md) |
| `bug-finder` | Investigates root causes before correction | all | [bug-finder-agent](bug-finder-agent.md) |
| `architect` | Direct-only architecture advisor; authors specs and accepted-decision plans, delegates only exact `spec-validator` and `plan-reviewer` reviews, never implements or coordinates delivery | primary, non-hidden, not task-delegable | [architect-agent](architect-agent.md) |
| `spec-validator` | Reviews internal consistency and compatibility with related specs | subagent | [spec-validator-agent](spec-validator-agent.md) |
| `plan-reviewer` | Coordinates plan review | subagent | [plan-reviewer-agent-cluster](plan-reviewer-agent-cluster.md) |
| `plan-functional-reviewer` | Checks functional alignment; hidden, called only by plan-reviewer | subagent | [plan-reviewer-agent-cluster](plan-reviewer-agent-cluster.md) |
| `plan-technical-reviewer` | Checks technical alignment; hidden, called only by plan-reviewer | subagent | [plan-reviewer-agent-cluster](plan-reviewer-agent-cluster.md) |
| `plan-code-reviewer` | Checks code feasibility in deep review; hidden, called only by plan-reviewer | subagent | [plan-reviewer-agent-cluster](plan-reviewer-agent-cluster.md) |
| `spec-reviewer` | Reviews specification coverage after delivery | subagent | [spec-reviewer-agent](spec-reviewer-agent.md) |
| `spec-writer` | Writes canonical specifications when delegated by team-lead | subagent | [spec-writer-agent](spec-writer-agent.md) |

The retired agents' former routing is preserved below for historical reference only.

---

## Workflow

```
User request
      │
      ▼
 ┌────────────────────────────────┐
 │  Lire AGENTS.md                │
 └────────────────────────────────┘
      │
      ▼
 ┌────────────────────────────────┐        ┌──────────────────────────┐
 │  Requête ambiguë ?             │──OUI──▶│  Déléguer à `planning`   │
 └────────────────────────────────┘        │  → exec-plan sur disque   │
      │ NON                                └──────────┬───────────────┘
      └─────────────────────────────────────────────▶│
                                                      ▼
                                           ┌──────────────────────────┐
                                           │  PLAN                    │
                                           │  todowrite               │
                                           └──────────┬───────────────┘
                                                      │
                                                      ▼
                                           ┌──────────────────────────┐
                                           │  DELEGATE                │
                                           │  explore / general       │
                                           └──────────┬───────────────┘
                                                      │
                                                      ▼
                                           ┌──────────────────────────┐
                                           │  REVIEW                  │
                                           │  → review-manager        │
                                           └──────────┬───────────────┘
                                                      │
                              ┌───────────────────────┼───────────────┐
                         APPROVED              CHANGES_REQUESTED    BLOCKED
                              │                       │               │
                              │               ┌───────▼──────┐        │
                              │               │  Fix + retry │        ▼
                              │               │  (max 2×)    │   Escalate
                              │               └───────┬──────┘   to user
                              └───────────────────────┘
                                                      │
                                                      ▼
                                           ┌──────────────────────────┐
                                           │  SYNTHESIZE & REPORT     │
                                           │  + signal lacunes env ?  │──▶ suggérer `harness`
                                           └──────────────────────────┘


                    ╔══════════════════════════════════╗
                    ║  `harness` — agent de consolidation ║
                    ║  Déclenché à la demande            ║
                     ║  ou suggéré par le team-lead post-mission ║
                    ╚══════════════════════════════════╝
```

---

## Invocation de `planning`

`planning` reste le producteur généraliste des exec-plans. `architect` est une exception étroite : directement sélectionnable par l'utilisateur, jamais déléguable via `task`, il peut créer ou mettre à jour un exec-plan uniquement après acceptation explicite par l'utilisateur de la décision architecturale que le plan formalise. Il ne remplace ni le cadrage généraliste de `planning`, ni l'implémentation, ni la délégation.

The team-lead uses two independent planning triggers: complexity/multi-session scope (propose an exec-plan and invoke planning if the user agrees), or ambiguity when all three conditions below hold. Simple clear self-contained tasks skip planning. See `planning-agent.md` and the team-lead prompt for details.

Résumé :
1. Requête genuinement ambiguë (plusieurs interprétations plausibles)
2. ET `AGENTS.md` / `docs/` ne clarifient pas l'intention
3. ET une question directe à l'utilisateur ne suffirait pas

---

## Navigation des artefacts projet

The team-lead lit `AGENTS.md` en premier (< 1 300 tokens, index), puis navigue vers ce qui est pertinent pour la requête courante.

```
AGENTS.md
     │
     ├── → docs/architecture.md
     ├── → docs/decisions.md
     ├── → docs/specs/<agent>.md
     └── → docs/exec-plans/<feature>.md   ← produit en règle générale par `planning`; `architect` uniquement après acceptation explicite de la décision architecturale
```

---

## Ce que le team-lead ne fait pas

| Interdit | Pourquoi |
|----------|----------|
| Lancer `harness` sans confirmation utilisateur | C'est un choix structurant |
| Proposer `harness` en début de mission | Agent de consolidation, pas prérequis |
| Invoke `planning` on a simple, clear, self-contained task | Unnecessary friction; complex clear tasks remain eligible |
| Générer des PRD ou personas | Artefacts humains, non fonctionnels pour les agents |
| Toucher le code directement | Délégation systématique |
