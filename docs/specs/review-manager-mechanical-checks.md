# Spec : Mechanical checks — phase préalable du `review-manager`

**Statut :** draft  
**Mis à jour :** 2026-04-06 (rev. 2)

## Résumé

Introduire une phase de vérification mécanique dans le workflow du `review-manager`, exécutée *avant* le spawn des reviewers sémantiques. Si les checks échouent, le review-manager retourne immédiatement `CHANGES_REQUESTED` avec les erreurs brutes — sans spawner aucun reviewer. Les résultats mécaniques informent également la sélection des reviewers quand les checks passent.

---

## Contexte

Le cluster de review actuel est purement sémantique : trois agents LLM évaluent les changements selon leur lentille respective. Ce design a une limite évidente — spawner des reviewers qui vont pointer des failing tests ou des erreurs de lint alors qu'un simple `npm run lint` aurait suffi est coûteux et bruyant.

Les checks mécaniques (lint, type-check, tests) ont des propriétés que les reviewers sémantiques n'ont pas :
- **Déterministes** — même input, même output, zéro ambiguïté d'interprétation
- **Rapides** — résultats en secondes, avant tout spawn de sous-agent
- **Exhaustifs sur leur périmètre** — un type error est un type error, pas une opinion

La règle de base : les machines d'abord, les cerveaux ensuite. Lancer des reviewers sémantiques sur du code qui ne compile pas est du gaspillage.

---

## Objectif

Définir :
1. Comment le review-manager découvre les commandes de vérification disponibles dans le projet utilisateur
2. La séquence d'exécution et les conditions de court-circuit
3. Le format du verdict retourné sur failure mécanique
4. Comment les résultats mécaniques influencent la sélection des reviewers quand les checks passent

Ce spec ne couvre **pas** la modification du prompt `agents/review-manager.md` — c'est une étape d'implémentation distincte.

---

## Design

### 1. Découverte des commandes

Le review-manager cherche les commandes dans cet ordre de priorité :

**Source 1 — Section dédiée dans `AGENTS.md` du projet utilisateur**

```markdown
## Review Checks

### Lint
- lint: npm run lint
- typecheck: npx tsc --noEmit

### Tests
- test: npm test
```

La section `## Review Checks` est la source autoritaire. Elle permet au projet de définir exactement quelles commandes exécuter, dans quel ordre, avec quels flags. Les clés (`lint`, `typecheck`, `test`) sont des labels libres — le review-manager les utilise pour nommer les checks dans son output. Les commandes déclarées sous `### Lint` sont traitées comme des checks de phase 1 (rapides, bloquants) ; celles sous `### Tests` comme des checks de phase 2 (voir section 2).

**Source 2 — Détection du toolchain (fallback automatique)**

Si `AGENTS.md` n'existe pas ou ne contient pas de section `## Review Checks`, le review-manager inspecte les fichiers présents à la racine du repo pour détecter le toolchain, puis infère les commandes conventionnelles associées :

| Fichier détecté | Toolchain | Commandes lint inférées | Commandes test inférées |
|---|---|---|---|
| `package.json` + `package-lock.json` | npm | `npm run lint`, `npm run typecheck` (si scripts présents) | `npm test` (si script présent) |
| `package.json` + `pnpm-lock.yaml` | pnpm | `pnpm run lint`, `pnpm run typecheck` (si scripts présents) | `pnpm test` (si script présent) |
| `package.json` + `yarn.lock` | yarn | `yarn lint`, `yarn typecheck` (si scripts présents) | `yarn test` (si script présent) |
| `package.json` + `bun.lockb` | bun | `bun run lint`, `bun run typecheck` (si scripts présents) | `bun test` (si script présent) |
| `Cargo.toml` | cargo | `cargo clippy` | `cargo test` |
| `go.mod` | go | `go vet ./...` | `go test ./...` |
| `pyproject.toml` + `uv.lock` | uv | `uv run ruff check .` (si ruff configuré) | `uv run pytest` (si pytest présent) |
| `pyproject.toml` | poetry / pip | `poetry run ruff check .` ou `ruff check .` | `pytest` |
| `Makefile` | make | Cibles `lint`, `check`, ou `vet` si présentes | Cible `test` si présente |

Pour `package.json`, seuls les scripts nommés `lint`, `typecheck`, `type-check`, et `check` sont reconnus comme commandes lint. Seul `test` est reconnu comme commande test. Un script `prepare` ou `precommit` n'est jamais inféré.

Si plusieurs fichiers correspondent (ex : `package.json` + `Cargo.toml` dans un monorepo), le review-manager sélectionne le toolchain le plus représentatif des fichiers modifiés dans le diff, ou liste les deux avec leurs commandes respectives si les changements touchent les deux.

**Fallback final — aucun toolchain détecté**

Si aucune source ne produit de commandes, la phase mécanique est skippée silencieusement. Le workflow continue vers le spawn des reviewers sémantiques comme aujourd'hui. Pas d'erreur, pas d'avertissement — l'absence de configuration est un état valide.

---

### 2. Séquence d'exécution

Lint et tests ont des propriétés fondamentalement différentes : le lint est rapide, syntaxique, déterministe en quelques secondes ; les tests sont comportementaux, potentiellement longs, et leur failure peut être intentionnellement non-bloquante (ex : red/green TDD, tests désactivés temporairement). Traiter les deux de façon identique serait une erreur de design.

La phase mécanique se déroule donc en deux sous-phases distinctes :

```
review-manager reçoit la mission
        │
        ▼
[Phase 0-A — Lint]
Exécution des commandes lint (rapide, bloquant)
        │
        ├─ Aucune commande lint → skip, continuer vers Phase 0-B
        │
        └─ Commandes lint trouvées → exécuter séquentiellement
                │
                ├─ Tous les checks lint passent → continuer vers Phase 0-B
                │
                └─ Au moins un check lint échoue → CHANGES_REQUESTED immédiat
                    (aucune commande test lancée, aucun reviewer spawné)

[Phase 0-B — Tests]
Exécution des commandes test (potentiellement long, configurable)
        │
        ├─ Aucune commande test → skip, continuer vers Phase 1
        │
        └─ Commandes test trouvées → exécuter séquentiellement
                │
                ├─ Tests passent → continuer vers Phase 1
                │   (résultats disponibles pour la sélection des reviewers)
                │
                └─ Tests échouent → comportement selon config
                    ├─ [défaut] CHANGES_REQUESTED immédiat, aucun reviewer spawné
                    └─ [non-bloquant si configuré] note dans le rapport, continuer vers Phase 1

[Phase 1 — Sémantique]
Sélection, spawn et arbitrage des reviewers (comportement actuel)
```

**Lint — règles d'exécution**

Les commandes lint sont exécutées séquentiellement dans l'ordre déclaré (`AGENTS.md`) ou dans l'ordre inféré (lint → typecheck → build). Raison : un `tsc --noEmit` sur du code avec des import errors non résolus produit du bruit — mieux vaut que le lint passe d'abord et signale les problèmes structurels avant le type-checker.

Si une commande lint se termine avec une erreur non liée au code (commande introuvable, permission denied), le review-manager log l'incident et passe à la commande suivante. Une commande qui ne peut pas s'exécuter est un check absent, pas un check qui échoue.

**Tests — comportement sur failure**

Par défaut, un échec de test est bloquant (CHANGES_REQUESTED immédiat). Ce comportement peut être modifié via `AGENTS.md` :

```markdown
## Review Checks

### Tests
- test: cargo test
  on-failure: warn  # valeurs : block (défaut) | warn
```

`warn` : les tests échouent mais la review sémantique est quand même lancée. L'output des tests est inclus dans le rapport final comme contexte pour les reviewers. Utile en phase de développement actif où des tests en rouge sont attendus.

Le review-manager ne gère pas les timeouts — c'est le harness du projet utilisateur qui s'en charge. Si les commandes configurées ont besoin d'une limite de temps, elles doivent l'encoder elles-mêmes (ex : `timeout 120 cargo test`, ou un script wrapper). Le review-manager exécute ce qui est configuré et lit le résultat, sans imposer de limite.

---

### 3. Format du verdict sur failure mécanique

Quand au moins un check échoue de façon bloquante, le review-manager retourne immédiatement ce format — sans passer par les reviewers sémantiques :

```
## Review Summary

**Verdict**: CHANGES_REQUESTED

### Mechanical Checks

| Phase | Check | Status | Details |
|---|---|---|---|
| lint | lint | FAILED | [première ligne ou deux de l'output brut] |
| lint | typecheck | PASSED | — |
| test | test | NOT RUN | lint phase failed |

### Issues

#### Major
- **Mechanical check failure: lint** (source: automated)
  [Output brut tronqué à 50 lignes]
  **Suggested fix:** Resolve the lint errors above before requesting a semantic review.

### Notes
> Semantic reviewers were not spawned. Fix mechanical failures first.
```

Points clés du format :
- La colonne `Phase` distingue lint et test pour la lisibilité
- Les checks de phase test non exécutés suite à un échec lint sont marqués `NOT RUN` (pas `SKIPPED` — ils n'ont pas été ignorés par config, ils n'ont juste pas eu lieu)
- L'output brut est tronqué à **50 lignes** par check. Si l'output dépasse, indiquer `[... N lignes supplémentaires — voir output complet dans les logs]`
- La sévérité est toujours **Major**, jamais Critical ni Blocking — un check mécanique qui échoue est corrigeable, pas une raison de bloquer sans recours
- La section `### Notes` signale explicitement que les reviewers sémantiques n'ont pas été spawnés

**Pourquoi CHANGES_REQUESTED et non BLOCKED ?**

BLOCKED est réservé aux situations où l'utilisateur doit intervenir pour débloquer — vulnérabilité critique sans chemin de fix évident, requirement fondamentalement manqué. Un failing lint ou un type error a toujours un fix mécanique et déterministe. L'agent qui a produit le code peut le corriger sans input utilisateur.

---

### 4. Influence sur la sélection des reviewers (checks passants)

Quand les checks passent, leurs résultats sont disponibles comme signal pour la sélection des reviewers :

**Règle principale : les fichiers en erreur signalent le risque**

Si un check (avant correction) a produit des warnings non-bloquants sur des fichiers spécifiques, ou si les tests couvrent certains modules et pas d'autres, le review-manager peut utiliser ces informations pour affiner sa sélection.

| Signal mécanique | Ajustement possible |
|---|---|
| Warnings lint dans `auth/`, `session/`, `crypto/` | Force `security-reviewer` même si la matrice ne l'imposerait pas |
| Tests couvrant moins de 50% des fichiers modifiés | Ajouter une note explicite dans le prompt du `code-reviewer` sur les gaps de couverture |
| Build warnings sur des imports non utilisés dans un module critique | Mention dans le contexte du `code-reviewer` |

**Important :** il s'agit de signaux, pas de règles. Le review-manager conserve son jugement sur la sélection finale. Si les checks passent proprement, la sélection des reviewers suit la matrice existante sans modification.

---

## Hors scope

- **Modification du prompt `agents/review-manager.md`** — cette spec décrit le design ; l'implémentation dans le prompt est une étape séparée
- **Checks parallèles** — l'exécution séquentielle est un choix délibéré pour cette version ; la parallélisation peut être revisitée si les temps d'exécution deviennent un problème
- **Parsing sémantique de l'output des checks** — le review-manager ne cherche pas à comprendre les erreurs lint ou tsc ; il retourne l'output brut. L'analyse sémantique des erreurs appartient aux reviewers spécialisés dans les cycles suivants
- **Gestion des timeouts** — délégué au harness du projet utilisateur ; les commandes configurées encodent leurs propres limites si nécessaire
- **Intégration CI** — cette spec couvre uniquement le comportement du review-manager en session OpenCode. L'alignement avec les pipelines CI existants est hors périmètre

---

## Décisions ouvertes

| # | Question | Options | Impact |
|---|---|---|---|
| D1 | **Granularité du court-circuit lint** — Faut-il exécuter tous les checks lint même après un premier échec, ou s'arrêter au premier ? | Stop at first failure (rapide, output partiel) / Run all then report (plus lent, vue complète) | Actuellement spécifié "séquentiel mais exhaustif" — à confirmer |
| D2 | **Monorepo multi-toolchain** — Si le diff touche à la fois du Rust et du TypeScript, les deux toolchains sont-ils détectés et exécutés en séquence, ou seulement le toolchain dominant ? | Les deux (complet mais potentiellement long) / Dominant uniquement (heuristique à définir) | Impact sur les repos hybrides ; le spec dit "lister les deux" mais la sélection du dominant reste floue |

---

## Liens

- [Spec : Cluster review](./review-cluster.md)
- [Spec : Délégation Orion](./orion-delegation.md)
- [Prompt review-manager](../../agents/review-manager.md)
- [Index docs](../index.md)
