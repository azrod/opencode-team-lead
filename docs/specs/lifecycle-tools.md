---
status: active
created: 2026-04-06
updated: 2026-04-07
---

# Spec : Lifecycle Tools

**Statut :** active  
**Mis à jour :** 2026-04-07

## Résumé

Cinq custom tools injectés dans OpenCode par le plugin, accessibles directement par Orion, pour les opérations de bookkeeping sur les artefacts de gestion de projet (exec-plans, specs, briefs). Mécaniques, déterministes, zéro LLM en dessous.

---

## 1. Contexte et problème

### Les cratères dans la raquette

Les projets utilisant le plugin accumulent des artefacts de gestion (exec-plans, specs, briefs) qui se désynchronisent de la réalité au fil du temps :

| Symptôme | Impact |
|---|---|
| Exec-plan `status: active` alors que tous les blocs sont cochés | Orion ne sait pas si un scope est done |
| Spec en `status: draft` depuis des semaines, jamais promue | Contrainte ignorée de facto |
| Brief sans exec-plan associé | Pas de traçabilité brainstorm → implémentation |
| Exec-plan avec `brief:` pointant vers un fichier inexistant | Ref morte — confuse pour tous les agents |
| Orion doit déléguer un explore agent pour connaître l'état courant | Coût LLM inutile pour de la lecture mécanique |

Ces dérives ne sont pas des bugs de logique — elles naissent de l'inertie : personne (aucun agent) ne met à jour les statuts et les registres de façon systématique, parce que personne ne les "possède" mécaniquement.

### Pourquoi des tools, pas des agents

Les opérations concernées sont **déterministes** : cocher une case dans un fichier, lire un frontmatter, vérifier qu'un fichier existe, ajouter une ligne dans un tableau markdown. Elles ne nécessitent aucun raisonnement. Les déléguer à un sous-agent implique un context window, un appel LLM, une latence — pour un résultat qu'une fonction pure produit en quelques millisecondes.

Les custom tools OpenCode sont l'abstraction correcte : exécutés dans le process du plugin, synchrones, accessibles directement par Orion via son permission set. Pas de délégation, pas de sous-agent.

---

## 2. Les cinq tools

### `project_state`

**Signature :** `project_state()`

**Arguments :** aucun

**Rôle :** Produire un rapport structuré de l'état courant des artefacts de gestion dans le projet utilisateur. Orion l'appelle en début de mission pour avoir une vue complète sans déléguer un explore agent.

**Comportement :**

Résout les chemins depuis la config du plugin (clé `team-lead.paths` dans `opencode.json`) — si absente, utilise les defaults. Ne consulte pas `AGENTS.md`. Glob les trois dossiers dans `context.worktree`, lit le frontmatter YAML de chaque fichier. Retourne un objet JSON avec trois sections :

```json
{
  "specs": [
    {
      "file": "docs/specs/auth.md",
      "title": "Spec : Système d'auth",
      "id": "P1",
      "criticality": "CRITICAL",
      "status": "draft",
      "created": "2026-04-06"
    }
  ],
  "exec_plans": [
    {
      "file": "docs/exec-plans/auth-system.md",
      "status": "active",
      "brief": "docs/briefs/auth.md",
      "brief_exists": true,
      "blocks": { "total": 4, "checked": 4 },
      "warning": "tous les blocs sont cochés mais status != completed"
    }
  ],
  "briefs": [
    {
      "file": "docs/briefs/auth.md",
      "project": "auth",
      "type": "feature",
      "status": "active",
      "exec_plan": "docs/exec-plans/auth-system.md",
      "exec_plan_exists": true
    }
  ]
}
```

**Sources de données :**
- Specs : glob `{paths.specs}/*.md`, frontmatter YAML parsé (`title`, `id`, `criticality`, `status`, `created`)
- Exec-plans : glob `{paths.execPlans}/*.md`, frontmatter YAML parsé, blocs `- [x]` et `- [ ]` comptés, champ `brief` vérifié sur disque si présent
- Briefs : glob `{paths.briefs}/*.md`, frontmatter YAML parsé (`project`, `type`, `status`, `exec_plan`), champ `exec_plan` vérifié sur disque si présent

**Warnings inline :** Si un exec-plan a tous les blocs cochés mais `status: active`, le champ `warning` est peuplé pour signaler à Orion qu'un appel `complete_plan` est attendu.

---

### `mark_block_done`

**Signature :** `mark_block_done(plan_file, block_name)`

**Arguments :**
- `plan_file` — chemin relatif à `projectRoot`, ex: `docs/exec-plans/auth-system.md`
- `block_name` — nom du bloc tel qu'il apparaît dans l'exec-plan, ex: `"Bloc 2: login flow"` ou une sous-chaîne non-ambiguë

**Rôle :** Cocher un bloc spécifique dans un exec-plan (`[ ]` → `[x]`). Orion l'appelle après chaque livraison de sous-tâche validée.

**Comportement :**

1. Lire le fichier `plan_file`
2. Trouver la ligne correspondant à `block_name` (match sur sous-chaîne)
3. Remplacer `- [ ]` par `- [x]` sur cette ligne uniquement
4. Écrire le fichier
5. Recompter les blocs cochés/total
6. Si tous les blocs sont maintenant cochés → inclure dans la réponse : `"Tous les blocs sont done. Appelle complete_plan('${plan_file}') pour clore ce scope."`

**Erreurs :**
- Fichier introuvable → erreur explicite avec le chemin attendu
- Bloc introuvable (aucune ligne ne matche `block_name`) → erreur explicite, liste les blocs disponibles
- Ambiguïté (plusieurs lignes matchent) → erreur explicite, demande une sous-chaîne plus précise
- Bloc déjà coché → idempotent, pas d'erreur — retourner simplement l'état courant

**Réponse :**
```json
{
  "file": "docs/exec-plans/auth-system.md",
  "block": "Bloc 2: login flow",
  "was": "unchecked",
  "now": "checked",
  "blocks": { "total": 4, "checked": 3 },
  "all_done": false
}
```

---

### `complete_plan`

**Signature :** `complete_plan(plan_file)`

**Arguments :**
- `plan_file` — chemin relatif à `projectRoot`

**Rôle :** Passer le `status` d'un exec-plan de `active` à `completed` dans son frontmatter YAML. Orion l'appelle quand un scope est livré et reviewé.

**Comportement :**

1. Lire le fichier
2. Vérifier que tous les blocs sont cochés — si ce n'est pas le cas : erreur explicite avec la liste des blocs non cochés
3. Remplacer `status: active` (ou `status: draft`) par `status: completed` dans le frontmatter
4. Mettre à jour `updated: <date ISO>` dans le frontmatter
5. Écrire le fichier

**Erreurs :**
- Fichier introuvable → erreur explicite
- Blocs non cochés → erreur explicite : `"3 blocs non cochés : [liste]. Utilise mark_block_done avant de compléter le plan."`
- Frontmatter absent ou malformé → erreur explicite

**Réponse :**
```json
{
  "file": "docs/exec-plans/auth-system.md",
  "status": "completed",
  "updated": "2026-04-06"
}
```

**Note :** Le fichier n'est pas supprimé — les exec-plans complétés restent dans `docs/exec-plans/` comme référence historique (conformément à la spec `planning-agent.md`).

---

### `register_spec`

**Signature :** `register_spec(specFile, title)`

**Arguments :**
- `specFile` — nom de fichier ou chemin relatif à `paths.specs`, ex: `auth.md` ou `docs/specs/auth.md`
- `title` — titre de la spec, ex: `"Spec : Système d'auth"`

**Rôle :** Initialiser un fichier de spec vide avec frontmatter minimal. Orion ou le harness l'appelle quand une nouvelle spec doit exister sur disque.

**Comportement :**

1. Résoudre le chemin absolu dans `paths.specs` de `context.worktree`
2. Vérifier que le fichier n'existe pas déjà → erreur explicite si présent (pas d'écrasement)
3. Créer le dossier parent si absent
4. Écrire le fichier avec le frontmatter minimal :
   ```markdown
   ---
   title: "Spec : Système d'auth"
   status: draft
   created: 2026-04-06
   ---

   # Spec : Système d'auth
   ```
5. Retourner le chemin créé

**Ce que le tool ne fait PAS :** pas de registry externe, pas d'écriture dans `AGENTS.md`. La source de vérité est le dossier — `project_state` le découvre par glob.

**Erreurs :**
- Fichier déjà existant → `"Le fichier 'docs/specs/auth.md' existe déjà."`

**Réponse :**
```json
{
  "created": true,
  "file": "docs/specs/auth.md"
}
```

---

### `check_artifacts`

**Signature :** `check_artifacts()`

**Arguments :** aucun

**Rôle :** Scan de consistance transversal — détecter les incohérences entre les artefacts de gestion. Orion l'appelle en début de mission ou le gardener l'utilise dans ses sweeps de maintenance.

**Comportement :**

Glob des trois dossiers dans `context.worktree`, lit les frontmatters. Détecte les problèmes suivants :

| Type | Condition | Sévérité |
|---|---|---|
| `plan_stale_status` | Exec-plan avec tous les blocs cochés mais `status != completed` | bloquant |
| `plan_missing_brief` | Exec-plan avec champ `brief` absent ou vide | warning |
| `plan_brief_dead` | Exec-plan avec `brief` pointant vers un fichier inexistant | bloquant |
| `brief_missing_plan` | Brief avec champ `exec_plan` absent ou vide | warning |
| `brief_plan_dead` | Brief avec `exec_plan` pointant vers un fichier inexistant | bloquant |
| `spec_stale_draft` | Spec avec `status: draft` et `created` il y a plus de 30 jours | warning |

**Réponse :**
```json
{
  "problems": [
    {
      "type": "plan_stale_status",
      "file": "docs/exec-plans/auth-system.md",
      "severity": "blocking",
      "detail": "tous les blocs sont cochés mais status est 'active'",
      "suggestion": "complete_plan('docs/exec-plans/auth-system.md')"
    },
    {
      "type": "spec_stale_draft",
      "file": "docs/specs/old-idea.md",
      "severity": "warning",
      "detail": "status: draft depuis 45 jours",
      "suggestion": "promouvoir en 'active' ou supprimer si abandonné"
    }
  ],
  "summary": "2 problèmes détectés (1 bloquant, 1 warning)"
}
```

Si aucun problème : `{ "problems": [], "summary": "Tous les artefacts sont cohérents." }`

---

## 3. Format des frontmatters

Les tools parsent et écrivent exclusivement ces champs. Tout champ additionnel est ignoré silencieusement.

### Spec (`paths.specs/*.md`)

```yaml
---
title: "Nom de la spec"
id: "P1"                            # optionnel — assigné manuellement
criticality: CRITICAL | MAJOR | MINOR  # optionnel
status: draft | active | superseded
created: 2026-04-06
---
```

### Exec-plan (`paths.execPlans/*.md`)

```yaml
---
status: draft | active | completed
brief: "docs/briefs/nom.md"         # optionnel — lien vers le brief associé
created: 2026-04-06
---
```

### Brief (`paths.briefs/*.md`)

```yaml
---
project: "nom-du-projet"
type: feature | refactor | fix
status: draft | active | implemented
exec_plan: "docs/exec-plans/nom.md" # optionnel — lien vers l'exec-plan associé
created: 2026-04-06
---
```

La relation brief ↔ exec-plan est **bidirectionnelle et optionnelle** : chaque côté déclare l'autre via son frontmatter. `check_artifacts` vérifie la cohérence des deux côtés.

---

## 4. Intégration dans le plugin

### Structure des fichiers

Les tools sont déclarés dans un fichier séparé pour garder `index.js` lisible :

```
opencode-team-lead/
├── index.js            # Point d'entrée — importe et expose les tools
├── tools/
│   └── lifecycle.js    # Implémentation des 5 tools
└── agents/
    └── prompt.md
```

`tools/lifecycle.js` exporte un objet `lifecycleTools` consommé par `index.js`.

### Pattern d'export dans `index.js`

```js
import { tool } from "@opencode-ai/plugin"
import { lifecycleTools } from "./tools/lifecycle.js"

export const TeamLeadPlugin = async ({ directory, worktree }) => {
  const projectRoot = worktree ?? directory ?? "."

  return {
    config: async (input) => { /* ... */ },

    "experimental.session.compacting": async (_input, output) => { /* ... */ },

    tool: {
      project_state: tool({
        description: "...",
        args: {},
        async execute(_args, context) {
          return JSON.stringify(await lifecycleTools.projectState(context.worktree, paths))
        },
      }),
      // ... quatre autres tools
    },
  }
}
```

`paths` est capturé dans la closure de `TeamLeadPlugin` et passé directement à chaque fonction `execute`. Les fonctions dans `lifecycle.js` sont des fonctions pures qui reçoivent `projectRoot` et `paths` et retournent des données.

### Chemins configurables

Les chemins des dossiers d'artefacts sont configurables via un objet `paths` dans la config du plugin dans `opencode.json` :

```jsonc
{
  "plugin": ["opencode-team-lead"],
  "team-lead": {
    "paths": {
      "specs": "docs/specs",
      "execPlans": "docs/exec-plans",
      "briefs": "docs/briefs"
    }
  }
}
```

Les valeurs ci-dessus sont les **défauts** — un projet qui suit les conventions du plugin n'a pas besoin de les déclarer. Un projet avec une structure existante différente peut les surcharger.

Dans `index.js`, les chemins sont résolus lors du hook `config` :

```js
const userPaths = input.agent?.["team-lead"]?.paths ?? {}
const paths = {
  specs:    userPaths.specs    ?? "docs/specs",
  execPlans: userPaths.execPlans ?? "docs/exec-plans",
  briefs:   userPaths.briefs   ?? "docs/briefs",
}
```

`paths` est ensuite transmis à chaque tool via sa closure ou via `context` (à trancher à l'implémentation).

### `peerDependency` sur `@opencode-ai/plugin`

```json
"peerDependencies": {
  "@opencode-ai/plugin": "*"
}
```

`@opencode-ai/plugin` est fourni par l'hôte OpenCode — il est toujours présent dans l'environnement d'exécution du plugin. L'ajouter en `dependency` installerait une copie supplémentaire dans `node_modules/opencode-team-lead/`, ce qui violerait la contrainte zero-deps du CI (job `zero-deps` dans `.github/workflows/checks.yml`). En `peerDependency`, on déclare l'attente sans embarquer le package — zéro violation CI, zéro doublon à runtime.

### Permissions Orion

Les tools sont déclarés dans `experimental.primary_tools` dans la config team-lead pour qu'Orion les voie en priorité. Les permissions sont ajoutées au `defaultPermission` d'Orion :

```js
const defaultPermission = {
  "*": "deny",
  // ... permissions existantes ...
  project_state: "allow",
  mark_block_done: "allow",
  complete_plan: "allow",
  register_spec: "allow",
  check_artifacts: "allow",
}
```

Les utilisateurs peuvent les surcharger via leur `opencode.json` (même mécanique que les autres permissions — `mergePermissions` existant).

### `experimental.primary_tools`

```js
input.agent["team-lead"] = {
  // ...
  experimental: {
    primary_tools: [
      "project_state",
      "mark_block_done",
      "complete_plan",
      "register_spec",
      "check_artifacts",
    ],
  },
}
```

Cela place les tools lifecycle en tête de la liste des tools disponibles pour Orion, sans exclure les autres.

---

## 5. Impact sur le workflow Orion

### Quand appeler chaque tool

| Moment | Tool | Condition |
|---|---|---|
| Début de toute mission | `project_state` | Systématique — donne la vue complète avant de planifier |
| Début de mission | `check_artifacts` | Systématique — détecte les incohérences avant de commencer |
| Après validation d'une livraison de sous-tâche | `mark_block_done` | Dès qu'un bloc d'un exec-plan est livré et approuvé par le review-manager |
| Après livraison complète d'un scope | `complete_plan` | Quand tous les blocs sont cochés et le review final est APPROVED |
| Après écriture d'une nouvelle spec | `register_spec` | Systématique — Orion ou le harness l'appelle dans la même session |
| Maintenance périodique | `check_artifacts` | Gardener l'utilise dans ses sweeps |

### Changements dans `agents/prompt.md`

La section "Outils disponibles" (ou équivalent) d'Orion doit être mise à jour pour documenter les 5 tools et leurs déclencheurs. Points clés à ajouter :

1. **Début de mission** — appeler `project_state` + `check_artifacts` avant toute délégation. Ce n'est pas optionnel.
2. **Après chaque livraison** — `mark_block_done` est la "fermeture de boucle" d'un bloc. Orion ne doit pas attendre la fin du scope pour le faire.
3. **Complétion de scope** — `complete_plan` est bloquant tant que des blocs sont non cochés. Le tool l'enforcer lui-même, mais Orion doit comprendre la séquence.
4. **Nouvelle spec** — `register_spec` fait partie du workflow de livraison d'une spec, pas une tâche post-hoc.

Exemple de section à ajouter dans `prompt.md` :

```markdown
## Lifecycle Tools

Tu as accès à des tools de bookkeeping directs — pas de délégation, pas de sous-agent :

- `project_state()` — vue complète des exec-plans, specs, briefs. Appelle en début de mission.
- `check_artifacts()` — scan de consistance. Appelle en début de mission et après chaque scope.
- `mark_block_done(plan_file, block_name)` — coche un bloc. Appelle après chaque livraison validée.
- `complete_plan(plan_file)` — clôt un exec-plan. Appelle quand tous les blocs sont done.
- `register_spec(specFile, title)` — crée le fichier de spec. Appelle quand une nouvelle spec doit être initialisée.
```

---

## 6. Hors scope

- **Création d'exec-plans** — c'est le rôle de l'agent `planning`. Les tools lifecycle ne créent pas d'exec-plans.
- **Création de briefs** — c'est le rôle de l'agent `brainstorm`.
- **Mise à jour du decision log** — Orion le fait via ses permissions `edit` sur le scratchpad ; le decision log reste dans l'exec-plan, édité par Orion directement (via sous-agent si besoin).
- **Suppression d'artefacts** — les tools lifecycle ne suppriment rien.
- **Validation du contenu** des specs ou briefs — `check_artifacts` vérifie l'existence et la cohérence des références, pas la qualité du contenu.
- **Sync git** — les tools écrivent sur disque mais ne commitent pas. Le commit reste sous contrôle de l'utilisateur ou d'Orion via ses permissions git.
- **Support multi-repo / monorepo** — les tools opèrent dans `projectRoot` unique.

---

## 7. Décisions ouvertes

### D1 — Format du frontmatter `brief:` dans les exec-plans (acté — dépendance sur spec planning)

`project_state` et `check_artifacts` s'appuient sur un champ `brief:` optionnel dans le frontmatter YAML des exec-plans pour tracer la relation exec-plan → brief. Ce champ n'existe pas dans le format actuel défini par `planning-agent.md`.

**Décision :** Le champ `brief:` est ajouté au format standard des exec-plans. Il est optionnel — un exec-plan sans brief associé est valide. La relation est bidirectionnelle : le brief a un champ `exec_plan:`, l'exec-plan a un champ `brief:`. Les deux sont facultatifs mais recommandés pour la traçabilité.

**Action requise :** Mettre à jour `docs/specs/planning-agent.md` (format de l'exec-plan) et le prompt de l'agent `planning` pour qu'il renseigne `brief:` dans le frontmatter quand un brief est passé en contexte.

Format exec-plan mis à jour :

```markdown
---
status: draft | active | completed
created: {date}
updated: {date}
brief: docs/briefs/{nom}.md   # optionnel — brief associé
---
```

### D2 — Transmission de `paths` aux tool handlers (acté — closure)

`paths` est capturé dans la closure de `TeamLeadPlugin` et passé directement à chaque fonction `execute`. Les fonctions de `lifecycle.js` sont des fonctions pures qui reçoivent `projectRoot` et `paths` en arguments.

---

## Liens

- [Index docs](../index.md)
- [Spec : Planning](./planning-agent.md)
- [Spec : Harness](./harness-agent.md)
- [Spec : Gardener](./gardener-agent.md)
- [Architecture](../architecture.md)
- [Décisions stratégiques](../decisions.md)
