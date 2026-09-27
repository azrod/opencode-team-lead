---
created: 2026-09-22
---

## Goal

Gardener report — sync post-refonte lifecycle tools

## Functional objective

Suite à la refonte du système d'artefacts (19→20 lifecycle tools, zones protégées, nouveaux agents), les specs, docs, et pages website décrivent encore l'ancien état. Ce plan traite systématiquement les drifts identifiés par le gardener : specs driftées, docs stales, agents sans spec, et deux candidats harness pour prévenir les récurrences.

## Scope

### In scope
- Mise à jour des 4 specs driftées : `lifecycle-tools`, `team-lead-delegation`, `planning-agent`, `review-cluster`
- Correction des docs stales : `docs/index.md`, `docs/architecture.md`, `AGENTS.md`
- Correction des pages website stales : `website/getting-started.md`, `website/index.md`, `website/architecture.md`
- Création des specs manquantes pour les 4 nouveaux agents : spec-validator, plan-validator, spec-reviewer, spec-writer
- Correction du comptage lifecycle tools (19 → 20 partout)
- Correction du statut dans le corps des 5 specs affectées par la divergence frontmatter/body

### Out of scope
- Corrections dans `package.json` (`peerDependencies` vs `dependencies`) — à décider séparément
- Implémentation harness (candidats identifiés mais non exécutés dans ce plan)
- Nouvelles fonctionnalités ou refactoring de code
- Specs pour requirements-reviewer, code-reviewer, security-reviewer (couverts par review-cluster.md)

## Building blocks

- [x] **Bloc 1 — Mettre à jour les 4 specs driftées**

  Corriger les 4 specs identifiées par le gardener. `lifecycle-tools` est la plus urgente (décrit les 5 anciens tools au lieu des 20 nouveaux). `team-lead-delegation` manque 9 agents. `planning-agent` a des permissions incorrectes. `review-cluster` ne documente pas la restriction task du review-manager.

  Done when:
  - `spec_get("lifecycle-tools")` retourne un contenu qui mentionne les 20 tools actuels (spec_*, plan_*, brief_*, spec_format, plan_format) et ne mentionne plus mark_block_done, complete_plan, register_spec, check_artifacts
  - `spec_get("team-lead-delegation")` liste au moins 13 agents (brainstorm, planning, bug-finder, review-manager, harness, requirements-reviewer, code-reviewer, security-reviewer, spec-validator, plan-validator, spec-reviewer, spec-writer, gardener, researcher)
  - `spec_get("planning-agent")` décrit les permissions réelles (lifecycle tools) et ne mentionne plus d'accès direct à docs/exec-plans/*
  - `spec_get("review-cluster")` documente la restriction `task: { "*-reviewer": "allow" }` du review-manager
  - `npm test` passe (106/106, 0 fail)

- [x] **Bloc 2 — Créer les 4 specs manquantes (nouveaux agents)**

  spec-validator, plan-validator, spec-reviewer, spec-writer n'ont aucune spec. Déléguer à spec-writer pour chacun. Les specs doivent décrire le rôle, le comportement, les permissions, et les conditions de déclenchement.

  Done when:
  - `spec_list()` contient spec-validator, plan-validator, spec-reviewer, spec-writer
  - Chaque spec passe spec_validate (APPROVED)
  - `npm test` passe (106/106, 0 fail)

- [x] **Bloc 3 — Corriger les docs stales (docs/ et AGENTS.md)**

  `docs/index.md` : table des 5 anciens tools → 20 nouveaux ; ajouter les 4 agents manquants.
  `docs/architecture.md` : hook event → tool.execute.before ; distill/prune → compress ; compléter la liste des prompts chargés (15 fichiers).
  `AGENTS.md:48` : description gardener Maintenance "fixes stale docs" → auditeur pur.

  Done when:
  - `docs/index.md` ne mentionne plus mark_block_done, complete_plan, register_spec, check_artifacts
  - `docs/index.md` liste spec-validator, plan-validator, spec-reviewer, spec-writer
  - `docs/architecture.md` ne mentionne plus le hook `event` ni `distill`/`prune`
  - `docs/architecture.md` liste au moins 15 fichiers agents chargés
  - `AGENTS.md` décrit le gardener Maintenance comme auditeur pur
  - `npm test` passe (106/106, 0 fail)

- [x] **Bloc 4 — Corriger les pages website stales**

  `website/getting-started.md` : "five built-in tools" → 20 lifecycle tools.
  `website/index.md` : "14 agents" → 15 agents.
  `website/architecture.md` : modes bug-finder et researcher (subagent → all) dans le diagramme et la table.

  Done when:
  - `website/getting-started.md` ne dit plus "five built-in tools"
  - `website/index.md` affiche le bon compte d'agents
  - `website/architecture.md` indique mode `all` pour bug-finder et researcher (diagramme + table)
  - `npm run build` dans website/ se termine sans erreur

- [x] **Bloc 5 — Fixer la divergence frontmatter/body dans 5 specs**

  5 specs ont `status: implemented` en frontmatter mais `**Statut :** draft` dans le corps : harness-agent, planning-agent, bug-finder-agent, review-cluster, review-manager-mechanical-checks. Harmoniser sur `implemented` dans les deux emplacements.

  Done when:
  - Les 5 specs ont `**Statut :** implemented` (ou `active` pour lifecycle-tools) dans leur corps
  - `npm test` passe (106/106, 0 fail)

- [x] **Bloc 6 — Corriger le comptage lifecycle tools (19 → 20) et noter les candidats harness**

  "19 lifecycle tools" apparaît dans AGENTS.md, README.md, et website/. La réalité est 20 tools (plan_format est le 20e). Corriger partout.
  Documenter dans CHANGELOG.md les deux candidats harness identifiés (divergence frontmatter/body, comptage tools codé en dur).

  Done when:
  - Aucune occurrence de "19 lifecycle tools" dans AGENTS.md, README.md, website/ (sauf dans des sections historiques)
  - Le comptage correct (20) apparaît dans au moins AGENTS.md et README.md
  - CHANGELOG.md mentionne les deux patterns identifiés comme candidats harness
  - `npm test` passe (106/106, 0 fail)

## Decision log

2026-09-22 — package.json peerDependencies vs dependencies mis hors scope. Nécessite une décision séparée sur la politique de dépendances avant toute action.

2026-09-22 — Specs pour requirements-reviewer, code-reviewer, security-reviewer laissées hors scope — review-cluster.md les couvre suffisamment comme groupe.

2026-09-22 — Harness identifié mais non exécuté dans ce plan : deux candidats (frontmatter drift, comptage codé en dur). Action = noter dans CHANGELOG, présenter à l'utilisateur en fin de plan.

2026-09-22 — Blocs 3, 4, 5, 6 peuvent être exécutés en parallèle après les Blocs 1 et 2. Blocs 1 et 2 sont indépendants entre eux.

## Building blocks

## Decision log
