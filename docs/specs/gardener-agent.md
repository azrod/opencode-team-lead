# Spec : Agent `gardener`

**Statut :** draft  
**Mis à jour :** 2026-03-31

## Résumé

Agent de maintenance récurrent — fait deux choses : corriger les docs qui ne reflètent plus le code réel, et détecter les dérives de code contre les règles du repo. S'applique au repo de l'utilisateur du plugin.

> `harness` encode les règles. `gardener` vérifie que rien n'y est passé au travers.

---

## Positionnement dans l'architecture

| Agent | Moment | Rôle |
|-------|--------|------|
| `harness` | Sur décision / bug | Encode une règle mécanique → artefact dans la chaîne dev |
| `review-manager` | À chaque livraison | Évalue inline (évaluateur dans la boucle generator/evaluator) |
| `gardener` | Périodique / post-feature | Détecte ce qui a glissé à travers le filet existant |

Le gardener ne recouvre pas le rôle du review-manager (évaluation inline) ni celui du harness (encoding de règles). Il fait de la **compliance checking** : vérifier que rien n'a dérivé par rapport aux règles déjà en place.

---

## Deux fonctions distinctes

### Fonction 1 — Doc-gardening

| Étape | Action |
|-------|--------|
| 1. Scanner | Lister les docs du repo (`README`, `AGENTS.md`, ADRs, specs, guides) |
| 2. Comparer | Croiser chaque doc avec le code réel — comportement, noms, structure |
| 3. Identifier | Docs stales : mentions de comportements inexistants, paths/noms obsolètes, décisions révoquées |
| 4. Corriger | Ouvrir une PR par doc à corriger (scope minimal, < 1 min de review) |

### Fonction 2 — Code-GC

| Étape | Action |
|-------|--------|
| 1. Charger les règles | `docs/guiding-principles.md`, `AGENTS.md`, configs lint du repo |
| 2. Lire l'historique | `git log` depuis la dernière feature boundary — commits récents uniquement |
| 3. Détecter les dérives | Anti-patterns sémantiques/architecturaux non interceptés par lint |
| 4a. Dérive one-time | Ouvrir une PR de refactoring ciblée (< 1 min de review) |
| 4b. Pattern récurrent | Déclencher l'agent `harness` (ou signaler à Orion pour confirmation) |
| 5. Scorer | Mettre à jour `QUALITY_SCORE.md` avec les scores par domaine/couche architecturale |

Note : le gardener ne re-vérifie pas ce que les artefacts harness (lint, CI) vérifient déjà. Il détecte uniquement ce qui n'est pas couvert mécaniquement — drift sémantique, duplication sémantique, cohérence d'abstraction.

---

## Déclencheurs

| Déclencheur | Description |
|-------------|-------------|
| Post-feature (Orion) | Orion suggère après des changements de code significatifs |
| Demande explicite | L'utilisateur invoque directement |
| Daily background sweep | Conçu pour un sweep autonome complet — orchestration périodique TBD |

---

## Ce que l'agent ne fait PAS

- Re-runner le lint — CI s'en charge
- Réécrire de larges sections de code
- Encoder de nouvelles règles mécaniques — rôle de `harness`
- Prendre des décisions architecturales unilatéralement
- Évaluer la qualité subjective du code — c'est le rôle du review-manager
- Re-checker ce que lint et CI vérifient déjà

---

## Distinction harness / gardener

| | `harness` | `gardener` |
|---|---|---|
| Rôle | Installe le filet (encode les règles) | Vérifie que rien n'y est passé au travers |
| Déclencheur | Pattern émergent détecté | Périodique ou post-feature |
| Output | Artefacts d'enforcement (lint, hooks, CI) | PRs de correction + quality scores |

---

## Permissions

| Ressource | Accès |
|-----------|-------|
| `task` | allow |
| `question` | allow — confirmation avant d'ouvrir des PRs |
| `bash` | allow — `git log`, `git diff`, `git status`, `gh pr create` |
| `read` | allow — lecture des fichiers du repo |

---

## Configuration

| Paramètre | Valeur |
|-----------|--------|
| Mode | `all` — invocable par l'utilisateur ET suggéré par Orion |
| Temperature | 0.2 |

---

## Liens

- [Index](../index.md)
- [Décisions D5-D6](../decisions.md)
- [Spec harness](./harness-agent.md)
- [ADR-001 : Harness engineering](../adr/001-harness-engineering.md)

---

## Format des guiding-principles

Pour que le gardener puisse détecter des dérives de façon fiable (sans biais de leniency LLM), chaque entrée dans `docs/guiding-principles.md` du repo utilisateur doit être écrite en forme évaluable :

```markdown
## Principe : [nom]

**Bon :** [description concrète + exemple]
**Mauvais :** [description concrète + contre-exemple]
**Threshold blocker :** [condition qui déclenche une PR immédiate]
**Threshold warning :** [condition qui est notée dans QUALITY_SCORE.md]
```

Un principe écrit uniquement comme directive ("préférer X à Y") n'est pas suffisant — le gardener a besoin de savoir ce que "mauvais" ressemble concrètement pour éviter de valider par défaut.
