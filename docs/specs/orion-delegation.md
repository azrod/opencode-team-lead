# Orion — Workflow de délégation

Décrit le comportement d'Orion une fois les agents `harness` et `planning` implémentés.

---

## Agents disponibles

| Agent | Rôle | Mode | Spec |
|-------|------|------|------|
| `brainstorm` | Phase 0 discovery — aide l'utilisateur à formuler ce qu'il veut construire avant d'engager Orion. Produit un brief dans `docs/briefs/`. | user-facing | — |
| `planning` | Compresse une requête ambiguë en brief structuré sur le disque | sub-agent | [planning-agent.md](planning-agent.md) |
| `bug-finder` | Orchestre l'investigation de bugs, force root-cause avant fix | user-facing + sub-agent | — |
| `review-manager` | Orchestre les reviewers spécialisés en parallèle | sub-agent | — |
| `harness` | Produit les artefacts d'enforcement (lint, CI, hooks, AGENTS.md) | user-facing + sub-agent | [harness-agent.md](harness-agent.md) |

`harness` est un agent de **consolidation**, pas un prérequis de mission. Il n'est jamais dans le chemin critique.

---

## Workflow

```
User request
      │
      ▼
 ┌────────────────────────────────┐
 │  Lire scratchpad + AGENTS.md   │
 └────────────────────────────────┘
      │
      ▼
 ┌────────────────────────────────┐        ┌──────────────────────────┐
 │  Requête ambiguë ?             │──OUI──▶│  Déléguer à `planning`   │
 └────────────────────────────────┘        │  → brief sur le disque   │
      │ NON                                └──────────┬───────────────┘
      └─────────────────────────────────────────────▶│
                                                      ▼
                                           ┌──────────────────────────┐
                                           │  PLAN                    │
                                           │  todowrite + scratchpad  │
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
                    ║  ou suggéré par Orion post-mission ║
                    ╚══════════════════════════════════╝
```

---

## Invocation de `planning`

Orion invoque `planning` seulement si **les trois conditions** sont réunies — voir [`planning-agent.md`](planning-agent.md#critères-dactivation) pour les critères complets.

Résumé :
1. Requête genuinement ambiguë (plusieurs interprétations plausibles)
2. ET `AGENTS.md` / `docs/` ne clarifient pas l'intention
3. ET une question directe à l'utilisateur ne suffirait pas

---

## Navigation des artefacts projet

Orion lit `AGENTS.md` en premier (< 1 300 tokens, index), puis navigue vers ce qui est pertinent pour la requête courante.

```
AGENTS.md
     │
     ├── → docs/architecture.md
     ├── → docs/decisions.md
     ├── → docs/specs/<agent>.md
     └── → docs/exec-plans/<feature>.md   ← produit par `planning`
```

---

## Ce qu'Orion ne fait pas

| Interdit | Pourquoi |
|----------|----------|
| Lancer `harness` sans confirmation utilisateur | C'est un choix structurant |
| Proposer `harness` en début de mission | Agent de consolidation, pas prérequis |
| Invoquer `planning` sur une requête claire | Friction inutile |
| Générer des PRD ou personas | Artefacts humains, non fonctionnels pour les agents |
| Toucher le code directement | Délégation systématique |
