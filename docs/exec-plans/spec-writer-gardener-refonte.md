---
created: 2026-09-21
---

## Goal

Spec Writer & Gardener Refonte

## Functional objective

Les projets legacy arrivent sans aucune spec. Les agents (spec-validator, spec-reviewer, requirements-reviewer) sont aveugles face à du code non documenté. Le gardener actuel fait de la maintenance cosmétique mais ne sait pas bootstrapper une base de specs à partir de zéro. Ce scope livre : (1) un format de spec standardisé, (2) un agent spec-writer spécialisé dans la rédaction conforme à ce format, (3) un gardener refait en orchestrateur de bootstrap qui sous-délègue à spec-writer et spec-validator pour produire une couverture de specs exploitable sur n'importe quel projet.

## Scope

### In scope

- `spec_format()` et `plan_format()` — deux nouveaux lifecycle tools retournant inline le format canonique des specs et des exec-plans
- `agents/spec-writer.md` — nouvel agent spécialisé dans la rédaction de specs conformes au format, délégué par gardener et team-lead
- `index.js` — enregistrement de spec-writer dans SUBAGENT_DEFS avec ses permissions (spec_list, spec_get, spec_create, spec_update, spec_validate, read, glob, grep)
- `agents/gardener.md` — refonte complète : gardener devient orchestrateur de bootstrap (discovery → sous-délégation à spec-writer → validation via spec-validator → rapport)
- `agents/prompt.md` — mise à jour du Spec Protocol (référence au format canonique) et du Gardener Protocol (nouveau workflow de bootstrap)
- `website/` — documentation du nouvel agent spec-writer, mise à jour de gardener

### Out of scope

- Migration automatique des specs existantes vers le nouveau format
- Détection de drift entre specs et code (gardener actuel — conservé, non supprimé)
- CLI ou commandes interactives pour le bootstrap

## Building blocks

- [x] **Bloc 1 — Tools `spec_format()` et `plan_format()`**

  Ajouter deux tools dans `tools/lifecycle.js` et les enregistrer dans `index.js` :

  - `spec_format()` — retourne inline le format canonique d'une spec : sections obligatoires (`## Purpose`, `## Behavior`, `## Constraints`, `## Examples`), sections optionnelles, longueur cible, style, frontmatter, exemples de ce qu'une spec n'est pas.
  - `plan_format()` — retourne inline le format canonique d'un exec-plan : structure des blocs (syntaxe checkbox avec crochets vides), sections obligatoires (`## Functional objective`, `## Scope`, `## Building blocks`, `## Decision log`), règles de granularité des blocs, critères "Done when".

  Ces tools sont sans paramètre et sans effets de bord. Ils retournent une string markdown que l'agent peut lire avant d'appeler `spec_create` ou `plan_create`.

  Les descriptions de `spec_create`, `spec_update`, `plan_create` sont mises à jour pour référencer ces tools : *"Call `spec_format()` first if unsure of the expected structure."*

  Done when :
  - `specFormat()` et `planFormat()` exportées depuis `tools/lifecycle.js`
  - Enregistrées dans `index.js` avec description et handler
  - Ajoutées à `LIFECYCLE_TOOLS` dans `tools/artifact-guard.js`
  - Descriptions de `spec_create`, `spec_update`, `plan_create` mises à jour
  - `npm test` : tests couvrant les deux nouveaux tools (retour non vide, contenu attendu)
  - `npm test` : ≥ 92 tests, 0 fail

- [x] **Bloc 2 — Agent spec-writer** *(dépend Bloc 1)*

  > Note : spec-writer appelle `spec_format()` en début de workflow pour s'assurer qu'il rédige conformément au format courant.

  Créer `agents/spec-writer.md` et l'enregistrer dans `index.js`.

  Rôle : reçoit un domaine ou description fonctionnelle, explore le code, produit une spec via `spec_create`, appelle `spec_validate`, corrige si REJECTED (max 2 tentatives).

  Permissions : `spec_list`, `spec_get`, `spec_create`, `spec_update`, `spec_validate`, `read`, `glob`, `grep`. Mode : `subagent`, temperature 0.3.

  Done when :
  - `agents/spec-writer.md` existe avec rôle, workflow step-by-step, règles de qualité du format canonique, gestion du rejet
  - Enregistré dans `SUBAGENT_DEFS` avec les bonnes permissions
  - `npm test` : 92/92, 0 fail

- [x] **Bloc 3 — Gardener refonte : orchestrateur de bootstrap** *(dépend Bloc 2)*

  Réécrire `agents/gardener.md` avec deux modes :

  **Mode Bootstrap (nouveau)** : si < 3 specs actives → discovery par domaine (explore, max 5–7), juge LLM des rapports, délégation à spec-writer pour chaque domaine retenu, rapport final.

  **Mode Maintenance (conservé)** : fixes stale docs, détection de drift, escalade à harness.

  Done when :
  - `agents/gardener.md` réécrit avec les deux modes documentés
  - Seuil de bascule (< 3 specs actives) explicite
  - Mode Maintenance préservé sans régression
  - `npm test` : 92/92, 0 fail

- [x] **Bloc 4 — Prompt team-lead + documentation** *(dépend Bloc 3)*

  Mettre à jour `agents/prompt.md` (Spec Protocol → référence format canonique ; Gardener Protocol → deux modes) et la documentation complète.

  Done when :
  - `agents/prompt.md` mis à jour
  - `AGENTS.md` cohérent (spec-writer ajouté, gardener mis à jour)
  - `website/agents/` : nouvelle page spec-writer, gardener mis à jour, index mis à jour
  - `CHANGELOG.md` [Unreleased] : 3 nouvelles entrées (spec-writer, gardener refonte, format canonique)
  - `npm run build` (website) sans erreur
  - `npm test` : 92/92, 0 fail

## Decision log

- **2026-09-21** — Tools plutôt que fichier markdown pour le format canonique : `spec_format()` et `plan_format()` sont découvrables via la liste des tools, toujours à jour (dans le code, pas dans un doc), et ne nécessitent pas de permission `read`. Un fichier markdown aurait pu dériver silencieusement.
- **2026-09-21** — Format canonique d'abord, agent ensuite : l'ordre Bloc 1 → Bloc 2 garantit que spec-writer est calibré sur le bon format dès sa création, pas en rattrapage.
- **2026-09-21** — Deux modes gardener plutôt qu'un agent séparé : créer un "bootstrap-agent" distinct aurait fragmenté la surface. Gardener est déjà l'agent de santé du projet — c'est son extension naturelle.
- **2026-09-21** — Seuil < 3 specs actives pour Bootstrap : arbitraire mais pragmatique. Révisable via `plan_update` si le terrain révèle un seuil plus adapté.
- **2026-09-21** — spec-writer en température 0.3 (vs. 0.1 pour validators) : la rédaction de specs nécessite une formulation créative et variée ; les validators sont des juges mécaniques.
