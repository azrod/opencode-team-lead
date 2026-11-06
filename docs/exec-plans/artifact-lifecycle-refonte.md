---
status: completed
created: 2026-09-20
updated: 2026-09-21
---

## Goal

Refonte du système de lifecycle tools : zones protégées via hook `tool.execute.before`, 19 nouveaux tools domaine-action (`spec_*`, `plan_*`, `brief_*`), agents `spec-validator`, `plan-validator` et `spec-reviewer`, mise à jour du prompt team-lead et de la documentation.

## Functional objective

Les agents qui explorent un repo utilisant `opencode-team-lead` prennent aujourd'hui des décisions basées sur des artefacts périmés (briefs d'intention, plans d'implémentation terminés) qu'ils lisent comme de la documentation de référence. L'objectif est d'éliminer ce bruit cognitif en rendant ces artefacts inaccessibles par défaut aux agents généraux, et en faisant des specs la seule source de vérité vivante du système — fiable, validée, et consultée de façon déterministe avant toute décision de conception ou d'implémentation.

## Scope

### In scope

- Hook `tool.execute.before` bloquant l'accès direct à `docs/briefs/`, `docs/exec-plans/`, `docs/specs/` via `read`, `edit`, `write`, `bash`
- Nouveaux lifecycle tools `spec_*`, `plan_*`, `brief_*` (19 tools au total) dans `tools/lifecycle.js`, dont `plan_validate(id)` et `spec_validate(id)`
- Conservation et adaptation de `project_state()` comme outil de focus sur le travail actif : retourne (1) les specs vivantes avec titre, short description et id ; (2) uniquement les exec-plans ayant au moins un bloc non coché (`[ ]`), avec nom de fichier et progression (blocs done / total) ; les briefs sont complètement absents — l'agent appelle `brief_list()` explicitement s'il en a besoin
- Suppression des 5 anciens tools (`mark_block_done`, `complete_plan`, `register_spec`, `check_artifacts`, et refactoring de `project_state`)
- Mise à jour des permissions dans `index.js` (team-lead, planning, brainstorm, gardener)
- Nouveaux fichiers `agents/spec-validator.md` et `agents/plan-validator.md` + enregistrement dans `SUBAGENT_DEFS`
- `plan_update(id, old_string, new_string)` pour modifier un plan via la même mécanique chirurgicale que `spec_update`
- `plan_delete(id)` pour supprimer un plan abandonné — l'abandon se traduit par la suppression du fichier, pas par un statut
- `brief_update(id, oldString, newString)` pour modifier un brief via la même mécanique que `spec_update` et `plan_update`
- `brief_delete(id)` pour supprimer un brief abandonné — même mécanique que `plan_delete`
- Mise à jour du prompt `agents/prompt.md` : nouveau workflow, nouveaux tools, règles de consultation specs
- Rétrocompatibilité : migration transparente des specs existantes dans `docs/specs/` (lecture sans casser)
- Nouveau fichier `agents/spec-reviewer.md` : reviewer spécialisé enregistré dans le pool du review-manager, déclenché après chaque livraison pour évaluer si le code produit nécessite la création ou la mise à jour d'une spec
- Mise à jour de `AGENTS.md`, `README.md`, `CHANGELOG.md`
- Mise à jour du site de documentation `website/` pour refléter le nouveau workflow (nouveaux lifecycle tools, zones protégées, spec-reviewer, validators)
- Tests unitaires pour les nouveaux tools (`tests/lifecycle.test.js`)

### Out of scope

- Interface utilisateur ou CLI pour gérer les artefacts manuellement
- Migration automatique des exec-plans existants vers le nouveau format
- Versioning des specs (historique des modifications)
- Support multi-worktree (déjà géré par la logique `projectRoot` existante)
- Modification du comportement de `brainstorm` au-delà de la mise à jour de ses permissions

## Building blocks

- [x] Bloc 1: Hook de protection des répertoires d'artefacts
  - Done when: Le hook `tool.execute.before` est implémenté dans `index.js` et bloque `read`, `edit`, `write`, `bash` sur `docs/briefs/`, `docs/exec-plans/`, `docs/specs/`. Toute tentative d'accès direct retourne une `Error` explicite indiquant quel tool utiliser à la place. Les tests unitaires couvrent les cas de blocage et de passage autorisé.
  - Note: Ne dépend d'aucun autre bloc — peut être implémenté en premier et de façon isolée. Le hook bloque l'accès mais les tools de remplacement n'ont pas besoin d'exister pour que le hook soit validé.

- [x] Bloc 2: Nouveaux lifecycle tools `spec_*`, `plan_*`, `brief_*` dans `tools/lifecycle.js`
  - Done when: Les 18 fonctions suivantes sont implémentées, exportées, et couvertes par des tests unitaires dans `tests/lifecycle.test.js` : `specGet(id)`, `specCreate(title, type, content)`, `specUpdate(id, oldString, newString)`, `specValidate(id)`, `specList()`, `specDelete(id)`, `planGet(id)`, `planCreate(...)`, `planValidate(id)`, `planBlockDone(planId, blockName)`, `planUpdate(id, oldString, newString)`, `planDelete(id)`, `planList()`, `briefGet(id)`, `briefCreate(...)`, `briefUpdate(id, oldString, newString)`, `briefDelete(id)`, `briefList()`. `planCreate` déclenche automatiquement `planValidate` avant d'écrire le fichier — si le validator rejette (objectif fonctionnel absent ou flou, blocs non atomiques, dépendances circulaires, scope irréaliste), le plan n'est pas créé et la fonction lève une erreur avec le détail. `planCreate` prend un paramètre obligatoire `functional_objective` (string, 2-4 phrases) inséré comme section `## Functional objective` dans le corps du plan, juste après `## Goal` — ce champ n'est pas optionnel : un appel sans `functional_objective` lève une erreur et aucun fichier n'est créé. Plans et briefs n'ont pas de champ `status` dans leur frontmatter — l'état d'un plan est porté par ses blocs (`[ ]`/`[x]`) ; l'abandon se traduit par la suppression du fichier via `plan_delete` ou `brief_delete`. `briefCreate` et `planCreate` créent le lien `exec_plan` / `brief` dans le frontmatter si l'identifiant de l'artefact lié est fourni, mais ce lien est optionnel et son absence ne lève aucune alerte. `project_state()` est conservé et refactorisé : retourne les specs vivantes (titre, short description, id) ; pour les plans, ne retourne que les exec-plans ayant au moins un bloc non coché (`[ ]`), avec nom de fichier et progression (blocs done / total) — calculés en parsant les occurrences de `[ ]` et `[x]` dans le markdown, sans champ `status` (il n'y en a plus) ; les briefs sont complètement supprimés de la sortie de `project_state()` — l'agent appelle `brief_list()` explicitement s'il en a besoin. L'ancien `completePlan` est remplacé par `planUpdate(id, oldString, newString)`. Les anciens tools (`mark_block_done`, `complete_plan`, `register_spec`, `check_artifacts`) sont supprimés de `lifecycle.js`.
  - Depends on: Bloc 1 (les tools doivent contourner le hook — ils opèrent directement sur le FS sans passer par les tools natifs OpenCode bloqués)

- [x] Bloc 3: Enregistrement des nouveaux tools dans `index.js` et mise à jour des permissions
  - Done when: Tous les nouveaux tools (`spec_get`, `spec_create`, `spec_update`, `spec_validate`, `spec_list`, `spec_delete`, `plan_get`, `plan_create`, `plan_validate`, `plan_update`, `plan_block_done`, `plan_delete`, `plan_list`, `brief_get`, `brief_create`, `brief_update`, `brief_delete`, `brief_list`, `project_state`) sont enregistrés dans le hook `tool` de `index.js` avec leurs schémas d'arguments corrects. Les anciens tools sont déprégistrés. Les permissions du team-lead, planning, brainstorm, et gardener sont mises à jour pour autoriser les nouveaux tools et retirer les anciens. Le plugin se charge sans erreur et `npm test` passe.
  - Depends on: Bloc 2

- [x] Bloc 4: Agent `spec-validator` et agent `spec-reviewer`
  - Done when: `agents/spec-validator.md` existe avec un prompt définissant son rôle (vérification cohérence interne spec, cohérence avec code produit, cohérence inter-specs), son mode (`subagent`), et ses permissions (read-only + glob + grep). `agents/plan-validator.md` existe avec un prompt distinct définissant son rôle (vérification de la structure et de la clarté d'un exec-plan : objectif fonctionnel présent et clair, blocs atomiques et actionnables, dépendances cohérentes sans circulaires, scope réaliste), son mode (`subagent`), et ses permissions (read-only). Les deux agents sont enregistrés dans `SUBAGENT_DEFS` de `index.js`. Le déclencheur du `spec-validator` est `specCreate` et `specUpdate` dans `lifecycle.js` — à chaque écriture de spec, le validator est invoqué automatiquement ; si le verdict est `REJECTED`, la fonction lève une erreur avec le détail. Le déclencheur du `plan-validator` est `planCreate` uniquement (pas `planUpdate`) — avant d'écrire le fichier, `planCreate` invoque `planValidate` ; si le verdict est `REJECTED`, le plan n'est pas créé. `planValidate(id)` et `specValidate(id)` sont également disponibles explicitement à la demande. Ces comportements sont couverts par des tests. `agents/spec-reviewer.md` existe également : c'est un reviewer distinct du spec-validator, enregistré dans le pool du review-manager. Son rôle est d'évaluer, après chaque livraison et au vu du code produit et des specs existantes, si une spec doit être créée ou mise à jour — et laquelle. Il est déclenché systématiquement par le review-manager, en parallèle des autres reviewers.
  - Depends on: Bloc 2, Bloc 3
  - Note: Bloc le plus complexe du plan — trois agents à créer, deux mécaniques de déclenchement automatique (spec-validator sur spec_create/spec_update, plan-validator sur plan_create), tests associés. Prévoir un effort supérieur aux autres blocs et envisager de le découper en deux sessions si nécessaire.

- [x] Bloc 5: Mise à jour du prompt team-lead (`agents/prompt.md`)
  - Done when: Le prompt du team-lead décrit le nouveau workflow en trois points : (1) au planning, `spec_create` (draft) est utilisé lorsque le scope mérite une spec (décision d'architecture, comportement fonctionnel significatif, interface entre composants) — ce n'est pas une règle "toujours avant un plan" mais une décision basée sur la nature du travail, encodée dans le prompt ; (2) avant implémentation, `spec_list` / `spec_get` sont utilisés pour détecter les divergences avec l'existant et les remonter ; (3) à la complétion, les specs sont mises à jour puis `plan_update` est utilisé pour passer le statut du plan à `completed`. Le prompt inclut des critères explicites pour que le team-lead sache **quand** créer une spec. Les anciens tools (`mark_block_done`, `complete_plan`, `register_spec`, `check_artifacts`) ne sont plus mentionnés. La section permissions du prompt reflète les nouveaux tools autorisés.
  - Depends on: Bloc 3, Bloc 4

- [x] Bloc 6: Tests et validation end-to-end
  - Done when: `npm test` passe avec une couverture complète des nouveaux tools dans `tests/lifecycle.test.js` : cas nominaux, erreurs attendues (fichier inexistant, patch qui ne matche pas, plan incomplet), et rejet du spec-validator si la spec est incohérente. Le hook de protection est testé (tentative d'accès bloqué vs accès via tool autorisé). Le total de tests est supérieur ou égal au total précédent (28 tests).
  - Depends on: Bloc 4, Bloc 5

- [x] Bloc 7: Mise à jour de la documentation (`AGENTS.md`, `README.md`, `CHANGELOG.md`)
  - Done when:
    - `README.md` : les 19 nouveaux tools sont documentés avec leur signature et leur usage ; le nouveau workflow (spec-avant-plan, validate-avant-completion, spec-reviewer post-livraison) est décrit ; les zones protégées et la façon d'y accéder via les tools sont expliquées.
    - `AGENTS.md` : le tableau des fichiers est mis à jour pour inclure les nouveaux agents (`spec-validator.md`, `plan-validator.md`, `spec-reviewer.md`) ; le tableau des enforcement artifacts intègre le hook de protection ; la section de navigation est cohérente avec les nouveaux agents.
    - `CHANGELOG.md` : une entrée sous `[Unreleased]` décrit les changements utilisateur-facing (19 nouveaux tools, zones protégées, gate validator spec et plan, spec-reviewer intégré au review-manager).
    - Aucune mention des anciens tools (`mark_block_done`, `complete_plan`, `register_spec`, `check_artifacts`) ne subsiste dans ces fichiers sans note de dépréciation ou de migration.
    - `website/src/App.tsx` : le site reflète les nouveaux lifecycle tools (dans le flowchart ou la section agents), la notion de zones protégées, et le rôle du spec-reviewer dans la phase Review. Après modification, `npm run bundle` est exécuté depuis `website/` et `bundle.html` est commité avec les sources.
  - Depends on: Bloc 6

## Open questions

Aucune — toutes les décisions de design ont été arrêtées avant la rédaction de ce plan. L'implémentation peut commencer par le Bloc 1.

## Decision log

- **2026-09-20** — Architecture à accès contrôlé retenue (hook `tool.execute.before` + lifecycle tools dédiés) plutôt qu'une convention documentaire, parce que les conventions ne sont pas applicables mécaniquement et échouent dès qu'un agent lit les répertoires directement.
- **2026-09-20** — Naming convention `domaine_action` (ex: `spec_get`, `plan_create`) retenu pour tous les nouveaux tools, par cohérence avec `project_state` existant et pour éviter les collisions avec les tools natifs OpenCode.
- **2026-09-20** — `spec-validator` implémenté comme subagent (dans le style `review-manager`) plutôt que comme logique inline dans `specCreate`/`specUpdate`, pour permettre une évaluation LLM de la cohérence sémantique que du code déterministe ne peut pas faire.
- **2026-09-20** — Rétrocompatibilité requise : les specs existantes dans `docs/specs/` doivent être lisibles sans migration manuelle. Aucun changement de format de fichier n'est introduit.
- **2026-09-20** — Le `spec-validator` est déclenché par `specCreate` et `specUpdate`. Justification : le planning n'est pas un passage obligatoire dans le workflow (un scope peut mériter une spec sans exec-plan associé). Le déclencheur naturel et déterministe est l'écriture d'une spec.
- **2026-09-20** — `plan_complete` supprimé au profit de `plan_update(id, old_string, new_string)` — même mécanique que `spec_update`, pas de gate supplémentaire. Le déterminisme est assuré par le spec-validator et le spec-reviewer, pas par un tool de complétion dédié.
- **2026-09-20** — C'est le team-lead qui décide quand créer une spec, pas le planning agent. Le planning n'est pas un prérequis systématique : le team-lead évalue si un scope mérite une spec (décision d'architecture, comportement fonctionnel significatif, interface entre composants) et crée la spec directement si c'est le cas. Cette décision est encodée dans le prompt du team-lead, pas dans un critère mécanique imposé par les tools.
- **2026-09-20** — Le `spec-reviewer` est intégré au pool du review-manager plutôt qu'au début du workflow, parce que la décision est meilleure avec le code réel en main qu'avec une intention. Le review-manager le déclenche systématiquement après chaque livraison — c'est un filet de sécurité qui rattrape les specs oubliées sans ajouter de friction avant l'implémentation.
- **2026-09-20** — `project_state()` retourne l'inventaire complet des specs uniquement ; pour les plans et briefs, il retourne des compteurs (nombre de plans actifs, nombre de briefs en cours) sans contenu ni détails. Justification : charger tous les briefs et exec-plans au démarrage de session génère du bruit dans le contexte et contribue au phénomène "lost in the middle" — les artefacts temporaires dilue la densité d'information utile. Les specs sont la seule source de vérité permanente qui justifie un chargement systématique ; les plans et briefs sont consultés explicitement via `plan_list()` / `brief_list()` quand l'agent en a effectivement besoin. Cette décision est cohérente avec la philosophie zones protégées : accès contrôlé et intentionnel, pas d'exposition passive.
- **2026-09-20** — `plan_delete` et `brief_delete` ajoutés (même mécanique que `spec_delete`) : plans et briefs n'ont pas de champ `status` dans leur frontmatter — l'état d'un plan est porté par ses blocs (`[ ]`/`[x]`), et l'abandon d'un plan ou d'un brief se traduit par la suppression du fichier, pas par une transition de statut. Cette décision simplifie le frontmatter et rend l'intention explicite : un artefact qui existe est actif, un artefact qui n'existe plus est abandonné.
- **2026-09-20** — La section `## Functional objective` est obligatoire dans les exec-plans et doit être fournie à `plan_create`. Elle capture le pourquoi fonctionnel indépendamment du brief (qui peut ne pas exister ou être supprimé). Notre propre exec-plan était un exemple concret du manque : créé sans passer par un brief ni l'agent planning, il ne traçait pas l'intention fonctionnelle.
- **2026-09-20** — Sans champ `status` sur les plans, `project_state()` calcule la progression en parsant les blocs `[ ]`/`[x]`. C'est la source de vérité naturelle — pas de risque de dérive entre statut déclaré et état réel des blocs.
- **2026-09-20** — `project_state()` ne liste plus les briefs et filtre les plans terminés (tous blocs cochés). C'est un outil de focus sur le travail actif — specs vivantes + plans en cours — pas un inventaire global. Les briefs sont accessibles via `brief_list()` à la demande.
- **2026-09-20** — `plan_validate` déclenché automatiquement sur `plan_create` uniquement — pas sur `plan_update` (trop de friction sur un plan en cours d'édition). `spec_validate` et `plan_validate` sont aussi disponibles explicitement à la demande. Le `plan-validator` est un nouvel agent subagent symétrique au `spec-validator`.
- **2026-09-20** — Le lien `brief ↔ exec_plan` (champ `exec_plan` dans le frontmatter du brief, champ `brief` dans le frontmatter du plan) est une aide à la navigation, pas une contrainte d'intégrité. Son absence ne lève aucune alerte. `briefCreate` et `planCreate` acceptent l'identifiant de l'artefact lié en paramètre optionnel et le renseignent s'il est fourni, mais ne le requièrent pas. Justification : tous les plans n'ont pas de brief associé (scope clair dès le départ), et tous les briefs ne débouchent pas sur un plan (exploration abandonnée). Forcer le lien introduirait de la friction sans gain réel.
