---
created: 2026-09-22
---

## Goal

Plan Reviewer — orchestrateur de review de plans

## Functional objective

Actuellement, valider un exec-plan se limite à un check mécanique de structure (plan_validate). Il n'existe pas de moyen de vérifier que le contenu d'un plan est cohérent avec les specs actives du projet ni réaliste vu le code existant. Ce plan introduit un agent plan-reviewer qui orchestre des sous-reviewers spécialisés, à la façon du review-manager, pour donner un verdict sémantique sur un plan avant son exécution. L'utilisateur choisit le niveau de review (light ou deep) selon le temps et la profondeur souhaitée.

## Scope

### In scope
- Nouvel agent `plan-reviewer` (orchestrateur, remplace `plan-validator`)
- Nouvel agent `plan-functional-reviewer` (cohérence plan vs specs fonctionnelles)
- Nouvel agent `plan-technical-reviewer` (cohérence plan vs specs techniques/architecturales)
- Nouvel agent `plan-code-reviewer` (faisabilité vu le code existant — deep only, exploration ciblée)
- Suppression de l'ancien agent `plan-validator` dans `index.js` et `agents/plan-validator.md`
- Mise à jour de `agents/prompt.md` pour référencer `plan-reviewer` au lieu de `plan-validator`
- Mise à jour de `docs/specs/plan-validator-agent.md` pour refléter la nouvelle architecture
- Enregistrement des nouveaux agents dans `index.js`

### Out of scope
- Modification du tool mécanique `plan_validate` (reste intact pour le linting structurel)
- Modification du tool `plan_create` / `plan_update` (hints déjà en place)
- Website documentation updates
- Tests automatisés des agents (prompts non testables mécaniquement)

## Building blocks

- [x] **Bloc 1 — Écrire les trois agents sous-reviewers**

  Créer `agents/plan-functional-reviewer.md`, `agents/plan-technical-reviewer.md`, et `agents/plan-code-reviewer.md`. Chaque agent suit le même patron que les reviewers du cluster review-manager : périmètre unique, output structuré (verdict + issues + positive notes), silent: true, temperature basse. Le `plan-code-reviewer` n'explore que les zones de code explicitement mentionnées dans le plan.

  Done when:
  - `agents/plan-functional-reviewer.md` existe avec frontmatter valide et sections Required/Workflow/Output
  - `agents/plan-technical-reviewer.md` existe avec frontmatter valide et sections Required/Workflow/Output
  - `agents/plan-code-reviewer.md` existe avec frontmatter valide et sections Required/Workflow/Output
  - Chaque agent déclare son périmètre unique et sa liste d'outils autorisés

- [x] **Bloc 2 — Écrire l'agent plan-reviewer (orchestrateur)**

  Créer `agents/plan-reviewer.md`. L'agent demande le niveau de review via `question` si non fourni (light / deep), sélectionne les sous-reviewers selon le niveau, les spawne en parallèle via `task`, arbitre les désaccords, et retourne un verdict global (APPROVED / CHANGES_REQUESTED / BLOCKED) dans un format structuré cohérent avec le review-manager.

  Done when:
  - `agents/plan-reviewer.md` existe avec workflow en 5 étapes (ask level → select → spawn → arbitrate → return)
  - Le niveau `light` spawne `plan-functional-reviewer` + `plan-technical-reviewer`
  - Le niveau `deep` spawne les trois sous-reviewers
  - Le format de sortie est documenté dans le prompt

- [x] **Bloc 3 — Enregistrer les agents dans index.js et supprimer plan-validator**

  Ajouter les 4 nouveaux agents (`plan-reviewer`, `plan-functional-reviewer`, `plan-technical-reviewer`, `plan-code-reviewer`) dans la section `agents` de `index.js`. Supprimer l'entrée `plan-validator`. Vérifier que les permissions (tools autorisés) correspondent aux outils déclarés dans chaque prompt.

  Done when:
  - Les 4 nouveaux agents apparaissent dans `index.js`
  - L'entrée `plan-validator` n'existe plus dans `index.js`
  - `npm test` passe (106 tests, 0 failures)

- [x] **Bloc 4 — Mettre à jour prompt.md et la spec**

  Dans `agents/prompt.md`, remplacer toutes les références à `plan-validator` par `plan-reviewer`. Mettre à jour la description du workflow de review de plan. Mettre à jour `docs/specs/plan-validator-agent.md` pour documenter la nouvelle architecture (ou la remplacer par une spec `plan-reviewer-cluster.md` sur le modèle de `review-cluster.md`).

  Done when:
  - Aucune occurrence de `plan-validator` dans `agents/prompt.md`
  - La spec reflète l'architecture à 4 agents (orchestrateur + 3 sous-reviewers)
  - `npm test` passe

## Decision log

2026-09-22 — plan-reviewer séparé du review-manager (Option B). Rationale: le review-manager est orienté post-implémentation (code delivery). Un plan est une intention future — les angles de review sont fondamentalement différents (cohérence specs, faisabilité code) et ne justifient pas de diluer le review-manager.

2026-09-22 — plan-brief-reviewer abandonné. Rationale: les briefs sont des artefacts de brainstorm, pas des contraintes structurelles actives. La cohérence fonctionnelle est capturée par les specs fonctionnelles.

2026-09-22 — plan-code-reviewer : exploration ciblée uniquement. Rationale: faire parser toute la codebase à un agent est contre-productif. L'agent identifie les zones mentionnées dans le plan et n'explore que celles-là.

2026-09-22 — plan-validator remplacé (pas conservé en parallèle). Rationale: deux agents avec des noms similaires créent de la confusion. Le linting structurel reste couvert par le tool mécanique plan_validate.

## Building blocks

## Decision log
