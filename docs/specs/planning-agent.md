# Spec : Agent `planning`

**Statut :** draft  
**Mis à jour :** 2026-04-01

## Résumé

Spec de l'agent `planning` — producteur de contrats de travail. S'adresse aux contributeurs du plugin et à Orion.

---

## Rôle

Transformer un prompt (vague ou clair) en contrat de travail structuré sur disque, avant que l'implémentation commence.

> *"Constraindre les livrables, laisser les agents décider comment."*

Le plan n'est pas un outil de clarification. C'est un contrat qui définit **quoi** sera construit, à quel niveau d'ambition, avec quels critères de "done" — avant qu'une ligne de code soit écrite. Une erreur de spec en amont cascade dans toute l'implémentation : le plan reste délibérément haut niveau, jamais de détails d'implémentation.

---

## Deux types de plans

### Plan simple

Pour les tâches petites et claires. Orion peut le produire lui-même sans invoquer l'agent.

```markdown
## Goal
{L'outcome réel en 1-2 phrases}

## Building blocks
- [ ] Bloc 1
- [ ] Bloc 2
```

### Exec-plan

Pour les tâches complexes ou multi-sessions. Produit par l'agent `planning`.

```markdown
---
status: draft | active | completed
created: {date}
updated: {date}
brief: docs/briefs/{nom}.md   # optionnel — brief associé
---

## Goal
{L'outcome réel, 1-3 phrases — le vrai problème résolu, pas juste le nom de la feature}

## Scope
{Ce qui est dans le périmètre / ce qui est explicitement hors périmètre}

## Building blocks
- [ ] Bloc 1: {livrable}
  - Done when: {critère vérifiable par le review-manager}
- [ ] Bloc 2: {livrable}
  - Done when: {critère vérifiable}
  - Depends on: Bloc 1

## Open questions
{Décisions bloquantes à résoudre avant d'agir — si vide, on peut commencer}

## Decision log
{Décisions prises + rationale — mis à jour par Orion pendant l'implémentation}
```

---

## Ce que l'agent fait

1. **Expand** le scope — ambitieux par défaut, cherche les gaps implicites et les dépendances cachées
2. Structure le travail en blocs livrables avec dépendances explicites
3. Définit un critère "done when" par bloc — ce qui permettra au review-manager de valider
4. Identifie les décisions bloquantes (open questions) à résoudre avant d'agir
5. Écrit l'exec-plan sur disque comme artefact vivant

---

## Ce que l'agent ne fait PAS

- Pas de détails d'implémentation (comment faire — c'est le rôle du générateur)
- Pas de PRD, user stories, ou requirements gathering
- Pas de décisions architecturales unilatérales
- Pas de validation du travail produit (→ review-manager)
- Pas d'exécution de code ou de commandes

---

## Déclencheurs

| Situation | Action |
|-----------|--------|
| Tâche complexe ou multi-session | Orion invoque `planning` → exec-plan |
| Tâche ambiguë (plusieurs interprétations) | Orion invoque `planning` → exec-plan |
| Invocation directe par l'utilisateur | Exec-plan |
| Tâche simple et claire | Orion procède directement (plan simple inline si besoin) |
| Bug identifié | `bug-finder`, pas `planning` |

---

## Artefacts produits

| Type | Chemin | Usage |
|------|--------|-------|
| Exec-plan | `docs/exec-plans/<feature>.md` | Tâches complexes / multi-sessions |
| Plan simple | Inline dans la réponse d'Orion / todowrite | Tâches simples — pas de fichier dédié |

Les exec-plans complétés restent dans `docs/exec-plans/` avec `status: completed` — ils servent de référence historique pour les agents futurs.

---

## Cycle de vie d'un exec-plan

1. **draft** — produit par `planning`, pas encore validé
2. **active** — Orion démarre l'implémentation, met à jour le decision log au fil du travail
3. **completed** — tous les blocs cochés, plan archivé (status: completed, ne pas supprimer)

Orion est responsable de la mise à jour du decision log et du status pendant l'implémentation. L'agent `planning` ne modifie le plan qu'à sa création.

---

## Permissions

| Ressource | Accès |
|-----------|-------|
| `task` | allow |
| `question` | allow — pour lever les open questions bloquantes |
| `read` | allow — AGENTS.md, README, docs/ du repo utilisateur |
| `docs/exec-plans/*` | Écriture uniquement |
| Reste du projet | Lecture seule, pas d'écriture |
| `bash` | Non |
| Web search | Non |

---

## Configuration

| Paramètre | Valeur |
|-----------|--------|
| `mode` | `all` — invocable directement par l'utilisateur ET par Orion |
| `temperature` | 0.3 |
| `variant` | `max` |

---

## Relation avec le suivi de session d'Orion

L'exec-plan est la source de vérité unique pour la mission — permanent, versionné dans git, partagé par tous les agents. Orion ne duplique pas sa liste de tâches ailleurs : il référence le chemin du fichier exec-plan directement dans ses items `todowrite` et dans ses réponses à l'utilisateur, et met à jour le decision log et le status directement dans le fichier exec-plan pendant l'implémentation.

---

## Liens

- [Index docs](../index.md)
- [Décisions D3](../decisions.md)
- [Spec : Harness](./harness-agent.md)
- [Spec : Gardener](./gardener-agent.md)
