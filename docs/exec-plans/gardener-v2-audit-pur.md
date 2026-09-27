---
created: 2026-09-21
---

## Goal

Gardener v2 — Audit pur

## Functional objective

Le gardener actuel se contredit lui-même : son prompt lui demande d'éditer des docs et d'ouvrir des PRs, mais ses permissions ne couvrent que QUALITY_SCORE.md. Il tente aussi d'appeler des outils non autorisés. Ce plan refait le gardener en orchestrateur d'audit pur — il observe, délègue des explores, compile un rapport structuré, et remonte les résultats au team-lead qui reprend le workflow normal (spec-writer, general, harness). Le gardener ne corrige plus rien directement.

## Scope

### In scope
- Réécriture de `agents/gardener.md` (mode Maintenance uniquement — mode Bootstrap conservé à l'identique)
- Mise à jour des permissions gardener dans `index.js` : `task` filtré sur `explore`, suppression de `plan_*`, `edit`, `write`, `gh pr create`, `QUALITY_SCORE.md`
- Suppression de toute référence à QUALITY_SCORE.md dans le prompt gardener
- Suppression de la création de PR dans le prompt gardener
- Mise à jour du prompt team-lead (`agents/prompt.md`) — section Gardener Protocol adaptée au nouveau comportement
- Mise à jour de la spec `gardener-agent` via `spec_update`
- Mise à jour de la doc website (`website/agents/gardener.md`)
- Mise à jour CHANGELOG.md

### Out of scope
- Mode Bootstrap du gardener (inchangé)
- Agent spec-writer (inchangé)
- Autres agents (inchangé)
- QUALITY_SCORE.md lui-même (pas de suppression du fichier s'il existe dans les repos utilisateurs)

## Building blocks

## Building blocks

- [x] **Bloc 1 — Réécriture du prompt gardener (mode Maintenance)**

  Réécrire `agents/gardener.md` mode Maintenance pour en faire un orchestrateur d'audit pur. Le gardener spawn des agents `explore` via `task`, compile un rapport structuré, et retourne ce rapport au team-lead sans rien modifier. Supprimer toutes les références à : édition de fichiers, création de PR, QUALITY_SCORE.md, `gh pr create`, `git log` direct (remplacé par délégation explore).

  Format de rapport standardisé à produire :
  - `### Drifted specs` — spec id + clause contredite + fichier source
  - `### Stale docs` — fichier + info obsolète
  - `### Recurring patterns` — pattern + candidature harness
  - `### Recommended actions` — liste d'actions pour le team-lead

  Done when:
  - `agents/gardener.md` mode Maintenance ne contient plus aucune instruction d'édition directe de fichier
  - Plus aucune référence à `gh pr create` ou `QUALITY_SCORE.md` dans le prompt
  - Le format de rapport attendu est documenté dans le prompt
  - `npm test` passe (0 régression)

- [x] **Bloc 2 — Mise à jour des permissions gardener dans `index.js`**

  Corriger le bloc permissions du gardener dans `SUBAGENT_DEFS` :
  - `task` : `{ "*": "deny", "explore": "allow" }` — explore uniquement
  - Conserver : `spec_list`, `spec_get`, `spec_format`, `read`, `grep`
  - Ajouter : `bash: { "*": "deny", "git log*": "allow", "git diff*": "allow", "git status*": "allow" }`
  - Supprimer : `plan_list`, `plan_get`, `edit`, `write`, `bash: { "gh pr create*": "allow" }`

  Done when:
  - Le bloc gardener dans `SUBAGENT_DEFS` reflète exactement les permissions listées ci-dessus
  - `npm test` passe (0 régression)

- [x] **Bloc 3 — Prompt team-lead + spec gardener-agent + doc website**

  Trois mises à jour coordonnées :
  1. `agents/prompt.md` section "Gardener Protocol" — adapter la description du mode Maintenance (le gardener retourne un rapport, le team-lead agit dessus)
  2. Spec `gardener-agent` via `spec_update` — mettre à jour la description du mode Maintenance
  3. `website/agents/gardener.md` — aligner sur le nouveau comportement

  Done when:
  - `agents/prompt.md` décrit correctement que le gardener retourne un rapport (pas qu'il corrige directement)
  - La spec `gardener-agent` est à jour
  - `website/agents/gardener.md` ne mentionne plus PR creation ni QUALITY_SCORE.md
  - `npm run build` (website) passe sans erreur
  - CHANGELOG.md contient une entrée `[Unreleased]` pour ce changement

## Decision log

2026-09-21 — QUALITY_SCORE.md supprimé du scope gardener. Rationale : artefact conçu pour l'auto-évaluation d'un gardener qui agissait directement. Maintenant que le gardener rapporte seulement, un score numérique n'a plus de sens — le rapport lui-même est l'output de qualité.

2026-09-21 — `task` filtré sur `explore` uniquement. Rationale : le gardener délègue uniquement de l'analyse (explore), pas de l'exécution (general). Lui donner accès à `general` via task ouvrirait la porte à des corrections directes, ce qui contredit sa mission d'audit pur.

2026-09-21 — `plan_*` supprimé des permissions. Rationale : hors scope — le gardener audite le code et les specs, pas les exec-plans en cours.
