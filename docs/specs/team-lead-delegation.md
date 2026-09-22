---
title: "Team-Lead Delegation"
id: team-lead-delegation
type: functional
status: implemented
created: 2025-01-01
---

# The team-lead — Workflow de délégation

Décrit le comportement du team-lead une fois les agents `harness` et `planning` implémentés.

---

## Agents disponibles

14 agents enregistrés dans `SUBAGENT_DEFS` dans `index.js` :

| Agent | Rôle | Mode | Spec |
|-------|------|------|------|
| `review-manager` | Orchestre les reviewers spécialisés en parallèle, arbitre les verdicts | subagent | [review-cluster.md](review-cluster.md) |
| `requirements-reviewer` | Vérifie que l'implémentation couvre les requirements originaux | subagent | [review-cluster.md](review-cluster.md) |
| `code-reviewer` | Évalue correctness, logique, gestion d'erreurs, maintenabilité | subagent | [review-cluster.md](review-cluster.md) |
| `security-reviewer` | Identifie les vulnérabilités, mauvaises configurations, risques d'exposition | subagent | [review-cluster.md](review-cluster.md) |
| `bug-finder` | Orchestre l'investigation de bugs, force root-cause avant fix | all | — |
| `harness` | Produit les artefacts d'enforcement (lint, CI, hooks, AGENTS.md) | all | [harness-agent.md](harness-agent.md) |
| `planning` | Transforme les requêtes complexes ou ambiguës en exec-plans structurés sur disque | all | [planning-agent.md](planning-agent.md) |
| `gardener` | Maintenance périodique — Bootstrap : découvre les domaines, délègue à spec-writer. Maintenance : détecte la dérive et escalade. | all | [gardener-agent.md](gardener-agent.md) |
| `brainstorm` | Phase 0 discovery — aide l'utilisateur à formuler ce qu'il veut construire. Produit un brief dans `docs/briefs/`. | all | — |
| `researcher` | Cherche et synthétise des informations externes (web, docs officiels, APIs). Read-only, nœud feuille. | all | [researcher-agent.md](researcher-agent.md) |
| `spec-validator` | Vérificateur sémantique — cohérence interne et compatibilité avec le corpus de specs existant. Retourne APPROVED ou REJECTED. | subagent | — |
| `plan-validator` | Vérificateur structurel des exec-plans — functional_objective, blocs atomiques, critères Done when vérifiables. | subagent | — |
| `spec-reviewer` | Revieweur post-livraison de couverture spec — retourne NO_ACTION_NEEDED, SPEC_CREATE_NEEDED, ou SPEC_UPDATE_NEEDED. | subagent | — |
| `spec-writer` | Rédige des specs conformes au format canonique. Délégué par le team-lead ou le gardener. | subagent | — |

`harness` est un agent de **consolidation**, pas un prérequis de mission. Il n'est jamais dans le chemin critique.

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
 └────────────────────────────────┘        │  → brief sur le disque   │
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

The team-lead invoque `planning` seulement si **les trois conditions** sont réunies — voir [`planning-agent.md`](planning-agent.md#critères-dactivation) pour les critères complets.

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
     └── → docs/exec-plans/<feature>.md   ← produit par `planning`
```

---

## Ce que le team-lead ne fait pas

| Interdit | Pourquoi |
|----------|----------|
| Lancer `harness` sans confirmation utilisateur | C'est un choix structurant |
| Proposer `harness` en début de mission | Agent de consolidation, pas prérequis |
| Invoquer `planning` sur une requête claire | Friction inutile |
| Générer des PRD ou personas | Artefacts humains, non fonctionnels pour les agents |
| Toucher le code directement | Délégation systématique |
