---
created: 2026-09-24
---

## Goal

Spec & docs drift remediation

## Functional objective

Le codebase a divergé de ses specs et docs suite à plusieurs refactors (extraction de config/agents.js, tools/registry.js, ajout de nouveaux agents). Les specs lifecycle-tools, review-cluster et team-lead-delegation référencent des chemins de fichiers obsolètes. Les docs AGENTS.md, README, architecture et website contiennent des affirmations fausses. Un bug silencieux dans registerSubagent() empêche le champ silent d'atteindre OpenCode pour 9 agents. Ce plan remet tout en cohérence.

## Scope

### In scope
- Fix bug `registerSubagent()` — champ `silent` non forwardé dans `config/agents.js`
- Test de non-régression dans `tests/permissions.test.js`
- Mise à jour des specs driftées : `lifecycle-tools`, `review-cluster`, `team-lead-delegation`
- Mise à jour des docs stales : `AGENTS.md`, `README.md`, `docs/architecture.md`, `docs/index.md`, `docs/guiding-principles.md`, `website/architecture.md`, `website/lifecycle-tools.md`
- Résolution du fichier orphelin `agents/plan-validator.md`

### Out of scope
- Refactoring de `config/agents.js` au-delà du fix `silent`
- Création de nouvelles specs
- Harness / CI checks (listés comme candidats mais pas dans ce plan)
- Mise à jour du CHANGELOG et release

## Building blocks

- [x] **Bloc 1 — Clarifier et nettoyer le champ silent dans SUBAGENT_DEFS**

  Le champ `silent` est déclaré dans `SUBAGENT_DEFS` pour 8 agents (requirements-reviewer, code-reviewer, security-reviewer, spec-validator, plan-functional-reviewer, plan-technical-reviewer, plan-code-reviewer, spec-reviewer) mais n'a aucun effet : `registerSubagent()` ne le forward pas, et OpenCode ne reconnaît pas ce champ (le champ équivalent dans OpenCode est `hidden`, qui contrôle la visibilité dans le menu d'autocomplétion `@`). Ce champ est un vestige sans impact.

  Remplacer `silent` par `hidden` dans `SUBAGENT_DEFS` pour tous les agents `mode: subagent` qui ne doivent pas apparaître dans l'autocomplétion `@`, et forwarder `hidden` dans `registerSubagent()`. Les agents `hidden: true` restent invocables par les orchestrateurs via `task`.

  Règle de sélection : tous les agents `mode: subagent` invoqués exclusivement par des orchestrateurs (review-manager, plan-reviewer, team-lead via spec_validate) reçoivent `hidden: true`. Les agents invocables directement par l'utilisateur restent visibles.

  Agents ciblés (8) : requirements-reviewer, code-reviewer, security-reviewer, spec-validator, plan-functional-reviewer, plan-technical-reviewer, plan-code-reviewer, spec-reviewer.

  Done when:
  - Aucun `SUBAGENT_DEFS` ne contient le champ `silent`
  - Les 8 agents listés ci-dessus déclarent `hidden: true` dans `SUBAGENT_DEFS`
  - `registerSubagent()` forward `hidden` dans l'objet de sortie
  - `npm test` passe sans régression

- [x] **Bloc 2 — Mettre à jour les specs driftées**

  Cinq specs référencent des champs ou comportements obsolètes :
  - `lifecycle-tools` : corriger l'import pattern (`config/agents.js` + `tools/registry.js`), résoudre la contradiction interne sur la suppression d'artefacts, clarifier le statut de `@opencode-ai/plugin` (dependency vs peerDependency)
  - `review-cluster` : corriger la localisation de `SUBAGENT_DEFS` et `registerSubagent` (`config/agents.js`, pas `index.js`) ; renommer `silent` → `hidden` dans la table Config (cohérence avec Bloc 1)
  - `team-lead-delegation` : vérifier l'état actuel avant modification ; corriger uniquement si `spec-writer mode` n'est pas déjà `subagent` ; corriger la localisation de `SUBAGENT_DEFS` si erronée
  - `spec-reviewer-agent` : remplacer `silent: true` par `hidden: true` dans la section Constraints
  - `spec-writer-agent` : remplacer `silent: false` par `hidden: false` (ou supprimer si non pertinent) dans la section Constraints

  Done when:
  - Aucune des cinq specs ne contient le champ `silent`
  - `lifecycle-tools` ne contient plus la contradiction sur la suppression d'artefacts
  - `review-cluster` référence `config/agents.js` (pas `index.js`) pour `SUBAGENT_DEFS`
  - `team-lead-delegation` indique `spec-writer mode: subagent` (vérifier avant de modifier)

- [x] **Bloc 3 — Corriger AGENTS.md**

  `AGENTS.md` contient plusieurs affirmations fausses :
  - Tableau des fichiers : ajouter `config/agents.js`, `tools/registry.js`, `agents/researcher.md` ; corriger la description de `package.json` (ajouter `skills/`, `config/`)
  - Section style : "Zero dependencies — only Node.js builtins" → faux, ajouter note sur `@opencode-ai/plugin`
  - Tableau Enforcement Artifacts : ajouter `tests/permissions.test.js`
  - Tableau bash permissions du team-lead : ajouter `ls`, `ls *`, `head *`, `echo *`

  Done when:
  - `config/agents.js` et `tools/registry.js` figurent dans le tableau des fichiers de `AGENTS.md`
  - `agents/researcher.md` figure dans le tableau des fichiers
  - La mention "Zero dependencies — only Node.js builtins" est corrigée ou assortie d'une note d'exception
  - `tests/permissions.test.js` figure dans le tableau Enforcement Artifacts

- [x] **Bloc 4 — Corriger README.md et docs/**

  Plusieurs docs narratifs contiennent des erreurs :
  - `README.md` : permissions brainstorm/planning incorrectes (pas d'`edit`, lifecycle tools) ; `spec-writer` absent du tableau des agents
  - `docs/architecture.md` : split `config/agents.js` + `tools/registry.js` non documenté ; permissions bash team-lead incomplètes
  - `docs/index.md` : `spec-writer` mode `all` → `subagent`
  - `docs/guiding-principles.md` : ajouter note d'exception explicite pour `@opencode-ai/plugin` dans la section "Zero runtime dependencies"

  Done when:
  - `README.md` ne liste plus `edit` pour brainstorm et planning
  - `spec-writer` figure dans le tableau des agents de `README.md`
  - `docs/architecture.md` mentionne `config/agents.js` et `tools/registry.js`
  - `docs/index.md` indique `spec-writer mode: subagent`
  - `docs/guiding-principles.md` contient une note d'exception pour `@opencode-ai/plugin`

- [x] **Bloc 5 — Corriger website/**

  Le site de documentation contient des affirmations obsolètes :
  - `website/architecture.md` : "zero deps" faux ; liste de prompts chargés dans `index.js` obsolète (manque 7 agents, mauvaise localisation) ; `distill`/`prune` au lieu de `compress` ; "paths hardcodés" faux
  - `website/lifecycle-tools.md` : "paths hardcodés" faux (configurable via `userConfig.paths`)

  Done when:
  - `website/architecture.md` ne contient plus "No npm dependencies" ou équivalent sans note d'exception
  - La liste des agents chargés dans `website/architecture.md` est complète et pointe vers `config/agents.js`
  - `compress` remplace `distill`/`prune` dans les permissions du team-lead
  - `website/lifecycle-tools.md` mentionne la configurabilité des paths

- [x] **Bloc 6 — Supprimer agents/plan-validator.md**

  `agents/plan-validator.md` est un vestige de l'ancienne architecture : cet agent a été remplacé par `plan-reviewer`. Le fichier existe encore sur disque mais n'est plus enregistré dans `SUBAGENT_DEFS`. La spec `plan-validator-agent` (`docs/specs/plan-validator-agent.md`) doit également être archivée ou supprimée puisque son implémentation a migré vers `plan-reviewer`.

  Done when:
  - `agents/plan-validator.md` est supprimé du repo
  - La spec `plan-validator-agent` est supprimée ou marquée `status: deprecated`
  - Aucun fichier `agents/*.md` n'est orphelin (non référencé dans `config/agents.js`)
  - `npm test` passe sans régression

## Decision log

2026-09-24 — Plan créé suite au Gardener Report. Priorité haute sur Bloc 1 (bug code), puis Blocs 2-3 (specs + AGENTS.md), puis Blocs 4-6 (docs secondaires).
2026-09-24 — Review plan-reviewer : CHANGES_REQUESTED. Corrections appliquées : règle de sélection `hidden` documentée (8 agents, mode subagent orchestrateur-only) ; `review-cluster`, `spec-reviewer-agent`, `spec-writer-agent` ajoutées au scope Bloc 2 ; Bloc 6 conditionné à la lecture préalable de `plan-validator-agent` spec ; vérification préalable de `team-lead-delegation` avant modification.
2026-09-24 — Décision utilisateur : `plan-validator` remplacé par `plan-reviewer`. Bloc 6 simplifié : supprimer `agents/plan-validator.md` et archiver/supprimer la spec `plan-validator-agent`.

## Decision log
