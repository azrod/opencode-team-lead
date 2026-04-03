# Spec : Agent `harness`

**Statut :** draft  
**Mis à jour :** 2026-04-03

## Résumé

Spec de l'agent `harness` — encodeur progressif de contraintes. S'adresse aux contributeurs du plugin et à Orion.

---

## Rôle

Transformer un pattern émergent en règle mécanique permanente dans le repo utilisateur.

> *"En appliquant des contraintes invariantes, sans microgérer les implémentations, nous permettons aux agents de livrer rapidement sans compromettre les bases."* — OpenAI, Harness engineering

Ce n'est **pas** un agent de setup one-shot. Il n'entre en jeu qu'une fois qu'un pattern a émergé dans le code — pour l'encoder mécaniquement, pas pour le documenter.

---

## Déclencheurs

| Source | Condition |
|--------|-----------|
| Utilisateur | Invocation directe |
| Orion | Suggestion post-feature quand des patterns récurrents ont émergé, suite à une prise de décision architecturale ou un bug récurrent |
| Gardener | Déclenchement automatique : pattern récurrent détecté (≠ drift one-time) |

Une fois les artefacts produits, ils s'exécutent de façon autonome tout au long de la chaîne de dev (dev local, code review, PR, CI, git hooks) — le harness n'a pas besoin d'être rappelé pour que les règles soient appliquées.

---

## Workflow

### Étape 1 — Identification du pattern

- Lire le git log, les diffs récents, le code courant
- Identifier le pattern récurrent à encoder : convention de nommage, structure de fichier, règle d'import, guard clause, etc.
- Si le pattern n'est pas clair ou trop subjectif → stopper et demander à l'utilisateur

### Étape 2 — Choix de l'artefact d'enforcement

Sélectionner l'artefact le plus mécanique possible :

| Pattern | Artefact préféré |
|---------|-----------------|
| Convention syntaxique ou structurelle | Lint custom (eslint rule, ruff plugin, etc.) |
| Contrainte de build / CI | Workflow GitHub Actions |
| Comment les agents naviguent ou délèguent dans CE repo | Entrée dans `AGENTS.md` — uniquement pour les règles de comportement agentique (quel agent appeler, quels patterns suivre dans les prompts, comment interpréter les conventions du projet). JAMAIS pour des checklists opérationnelles humaines — même si l'action en question implique des agents. |
| Principe architectural non-mécanisable | Entrée dans `docs/guiding-principles.md` |

Règle : si ça peut être vérifié mécaniquement → lint ou CI. Jamais un document quand un check suffit.

**Le piège de la checklist.** Si tu te retrouves à écrire un bullet point qui prescrit une action manuelle humaine — quelque chose que quelqu'un doit se rappeler de faire lui-même — plutôt que de décrire un check automatique, arrête. Exemples : "vérifier X avant de merger", "toujours lancer le scan", "checker les trois chemins" — tout ça c'est de la documentation. Convertis-la : un job CI qui exécute le check automatiquement, une règle lint qui détecte la violation au commit, un git hook avant le push. Si rien de tout ça n'est faisable, le pattern va dans `docs/guiding-principles.md` — jamais dans `AGENTS.md`.

**Un script n'est pas un artefact d'enforcement sauf s'il est déclenché automatiquement.** Un script de validation que les humains exécutent manuellement est un outil de confort, pas de l'enforcement. Pour qu'un script compte comme artefact mécanique, il doit être appelé automatiquement — depuis un job CI, un git hook, ou un pre-commit. Quand tu crées un script de validation, tu dois toujours le câbler dans un déclencheur automatique dans la même PR.

### Étape 3 — Génération de l'artefact

- Générer l'artefact directement (le linter est généré par l'agent, pas décrit)
- Pour les patterns complexes : web search ou skill si disponible
- Pour les règles lint custom : générer + documenter l'intention en commentaire inline

### Étape 4 — Test de la règle

- Lancer l'artefact contre le code existant
- Vérifier : pas de faux positifs sur le code sain, détection correcte des violations
- Si la règle est trop bruyante → recalibrer avant de continuer

### Étape 5 — PR

- Ouvrir une PR avec l'artefact + un message expliquant le pattern encodé
- Ne pas corriger le code existant en violation : c'est le rôle du gardener

---

## Artefacts produits

| Artefact | Enforcement |
|----------|-------------|
| Lint rule custom (eslint / ruff / etc.) | Bloque en CI + feedback local |
| `.github/workflows/*.yml` | Bloque les PRs en violation |
| Entrée `AGENTS.md` | Navigation agentique |
| Entrée `docs/guiding-principles.md` | Référence pour agents + humains |

---

## Ce que l'agent ne fait PAS

- Ne réécrit pas le code existant (→ gardener)
- Ne crée pas de règles subjectives ou non-vérifiables mécaniquement
- Ne fait pas de setup from scratch (→ rôle initial d'Orion)
- N'ouvre pas de PR sans avoir testé la règle
- Ne re-vérifie pas les artefacts existants — leur exécution est assurée par la chaîne de dev
- N'écrit pas de checklists humaines dans `AGENTS.md` — AGENTS.md est exclusivement pour les règles de navigation et délégation agentique. Les règles opérationnelles humaines vont en CI si automatisables, en `docs/guiding-principles.md` sinon.
- Ne valide pas un script existant non-câblé comme artefact d'enforcement — un script sans déclencheur automatique n'est pas de l'enforcement, peu importe qu'il existe déjà dans le repo. L'action correcte est de le câbler dans un déclencheur automatique dans la même PR.

---

## Permissions

| Ressource | Accès |
|-----------|-------|
| `task` | allow |
| `bash` | allow (git, gh, npm/scripts, linters) |
| Fichiers projet | Lecture complète |
| Configs lint, CI, `AGENTS.md`, `docs/*` | Écriture |

---

## Config

| Paramètre | Valeur |
|-----------|--------|
| `mode` | `all` |
| `temperature` | 0.2 |
| `variant` | `max` |

---

## Liens

- [Index docs](../index.md)
- [ADR-001 : Harness engineering](../adr/001-harness-engineering.md)
- [Spec : Gardener](./gardener-agent.md)
