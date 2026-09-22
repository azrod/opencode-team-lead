---
title: "Lifecycle Tools"
id: lifecycle-tools
type: technical
status: active
created: 2026-04-06
updated: 2026-04-07
---

# Spec : Lifecycle Tools

**Statut :** active  
**Mis à jour :** 2026-04-07

## Résumé

Cinq custom tools injectés dans OpenCode par le plugin, accessibles directement par le team-lead, pour les opérations de bookkeeping sur les artefacts de gestion de projet (exec-plans, specs, briefs). Mécaniques, déterministes, zéro LLM en dessous.

---

## 1. Contexte et problème

### Les cratères dans la raquette

Les projets utilisant le plugin accumulent des artefacts de gestion (exec-plans, specs, briefs) qui se désynchronisent de la réalité au fil du temps :

| Symptôme | Impact |
|---|---|
| Exec-plan `status: active` alors que tous les blocs sont cochés | Le team-lead ne sait pas si un scope est done |
| Spec en `status: draft` depuis des semaines, jamais promue | Contrainte ignorée de facto |
| Brief sans exec-plan associé | Pas de traçabilité brainstorm → implémentation |
| Exec-plan avec `brief:` pointant vers un fichier inexistant | Ref morte — confuse pour tous les agents |
| Le team-lead doit déléguer un explore agent pour connaître l'état courant | Coût LLM inutile pour de la lecture mécanique |

Ces dérives ne sont pas des bugs de logique — elles naissent de l'inertie : personne (aucun agent) ne met à jour les statuts et les registres de façon systématique, parce que personne ne les "possède" mécaniquement.

### Pourquoi des tools, pas des agents

Les opérations concernées sont **déterministes** : cocher une case dans un fichier, lire un frontmatter, vérifier qu'un fichier existe, ajouter une ligne dans un tableau markdown. Elles ne nécessitent aucun raisonnement. Les déléguer à un sous-agent implique un context window, un appel LLM, une latence — pour un résultat qu'une fonction pure produit en quelques millisecondes.

Les custom tools OpenCode sont l'abstraction correcte : exécutés dans le process du plugin, synchrones, accessibles directement par le team-lead via son permission set. Pas de délégation, pas de sous-agent.

---

## 2. Les tools

L'implémentation comprend **20 lifecycle tools** organisés en quatre familles. Tous sont implémentés dans `tools/lifecycle.js` comme fonctions ESM nommées (`export async function specGet(...)`, etc.) — pas d'objet groupé. Chaque tool reçoit `projectRoot` et `paths` via la closure de `TeamLeadPlugin` dans `index.js`.

### Famille `global` (1 tool)

| Tool | Fonction JS | Description |
|---|---|---|
| `project_state` | `projectState` | Rapport d'état de tous les artefacts (specs + active plans). Briefs exclus. |

### Famille `spec_*` (7 tools)

| Tool | Fonction JS | Description |
|---|---|---|
| `spec_get` | `specGet` | Récupère une spec par id — retourne chemin, contenu, frontmatter |
| `spec_create` | `specCreate` | Crée un nouveau fichier spec. Refuse d'écraser l'existant. |
| `spec_update` | `specUpdate` | Met à jour une spec par remplacement chirurgical oldString → newString |
| `spec_validate` | `specValidate` | Valide la structure d'une spec (frontmatter, champs requis, body non vide) |
| `spec_list` | `specList` | Liste toutes les specs avec leur métadonnées |
| `spec_delete` | `specDelete` | Supprime une spec par id |
| `spec_format` | `specFormat` | Retourne le format canonique attendu — raw string, pas du JSON |

### Famille `plan_*` (8 tools)

| Tool | Fonction JS | Description |
|---|---|---|
| `plan_get` | `planGet` | Récupère un exec-plan par id — retourne chemin, contenu, frontmatter, comptage des blocs |
| `plan_create` | `planCreate` | Crée un exec-plan. `functional_objective` requis. |
| `plan_update` | `planUpdate` | Met à jour un plan par remplacement chirurgical oldString → newString |
| `plan_validate` | `planValidate` | Valide la structure d'un plan (functional_objective, building blocks, ≥ 1 bloc) |
| `plan_block_done` | `planBlockDone` | Coche un bloc dans un plan (`[ ]` → `[x]`) |
| `plan_list` | `planList` | Liste tous les exec-plans avec métadonnées et progression des blocs |
| `plan_delete` | `planDelete` | Supprime un exec-plan par id |
| `plan_format` | `planFormat` | Retourne le format canonique attendu — raw string, pas du JSON |

### Famille `brief_*` (5 tools)

| Tool | Fonction JS | Description |
|---|---|---|
| `brief_get` | `briefGet` | Récupère un brief par id |
| `brief_create` | `briefCreate` | Crée un nouveau brief |
| `brief_update` | `briefUpdate` | Met à jour un brief par remplacement chirurgical oldString → newString |
| `brief_delete` | `briefDelete` | Supprime un brief par id |
| `brief_list` | `briefList` | Liste tous les briefs avec métadonnées |

> **Note :** `brief_list` est le 20ème tool — portant le total à 20, pas 19.

### `project_state`

**Signature :** `project_state()`

**Arguments :** aucun

**Rôle :** Produire un rapport structuré de l'état courant des artefacts de gestion dans le projet utilisateur. Le team-lead l'appelle en début de mission pour avoir une vue complète sans déléguer un explore agent.

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

**Warnings inline :** Si un exec-plan a tous les blocs cochés mais `status: active`, le champ `warning` est peuplé pour signaler la situation au team-lead.

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

```
opencode-team-lead/
├── index.js              # Point d'entrée — importe et expose les tools
├── tools/
│   ├── lifecycle.js      # Implémentation des 20 lifecycle tools (fonctions nommées)
│   └── artifact-guard.js # Guard — LIFECYCLE_TOOLS Set + checkArtifactAccess()
└── agents/
    └── prompt.md
```

`tools/artifact-guard.js` exporte le `Set` `LIFECYCLE_TOOLS` (les 20 noms de tools) et la fonction `checkArtifactAccess` utilisée dans le hook `tool.execute.before`. Tout appel direct `read`/`edit`/`write`/`bash`/`glob`/`grep` ciblant `docs/specs/`, `docs/exec-plans/`, ou `docs/briefs/` est bloqué sauf si le caller est un des 20 lifecycle tools.

### Pattern d'export réel dans `tools/lifecycle.js`

Les fonctions sont exportées **nommément** — pas d'objet groupé :

```js
export async function specGet(projectRoot, paths, id) { … }
export async function specCreate(projectRoot, paths, title, type, content) { … }
export async function planCreate(projectRoot, paths, { title, functional_objective, content, brief }) { … }
export function specFormat() { … }  // pure, synchrone
// … etc.
```

### Pattern d'import dans `index.js`

```js
import {
  projectState, specGet, specCreate, specUpdate, specValidate, specList, specDelete,
  planGet, planCreate, planUpdate, planValidate, planBlockDone, planList, planDelete,
  briefGet, briefCreate, briefUpdate, briefDelete, briefList,
  specFormat, planFormat,
} from "./tools/lifecycle.js";
import { checkArtifactAccess } from "./tools/artifact-guard.js";
```

`paths` est capturé dans la closure de `TeamLeadPlugin` et passé directement à chaque `execute`. Pas de `context` — `projectRoot` est résolu une fois au démarrage via `worktree` ou `directory`.

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

### Permissions team-lead

Les 20 lifecycle tools sont listés dans `defaultPermission` du team-lead dans `index.js` :

```js
const defaultPermission = {
  "*": "deny",
  // … autres permissions (task, question, read, edit docs/**, …)
  project_state: "allow",
  spec_get: "allow",
  spec_create: "allow",
  spec_update: "allow",
  spec_validate: "allow",
  spec_list: "allow",
  spec_delete: "allow",
  spec_format: "allow",
  plan_get: "allow",
  plan_create: "allow",
  plan_update: "allow",
  plan_validate: "allow",
  plan_block_done: "allow",
  plan_list: "allow",
  plan_delete: "allow",
  plan_format: "allow",
  brief_get: "allow",
  brief_create: "allow",
  brief_update: "allow",
  brief_delete: "allow",
  brief_list: "allow",
}
```

Les utilisateurs peuvent les surcharger via leur `opencode.json` (même mécanique que les autres permissions — `mergePermissions` existant).

---

## 5. Impact sur le workflow du team-lead

### Quand appeler chaque tool

| Moment | Tool | Condition |
|---|---|---|
| Début de toute mission | `project_state` | Systématique — donne la vue complète avant de planifier |
| Après validation d'une livraison de sous-tâche | `plan_block_done` | Dès qu'un bloc d'un exec-plan est livré et approuvé par le review-manager |
| Modification chirurgicale d'un plan | `plan_update` | Pour toute modification de contenu dans un exec-plan existant |
| Création ou mise à jour d'une spec | `spec_create` / `spec_update` | Quand une décision architecturale ou un comportement doit être documenté |

### Workflow réel du team-lead

Le team-lead appelle `plan_block_done(plan_id, block_name)` pour cocher un bloc dans un exec-plan après chaque livraison validée — sans attendre la fin du scope. Exemple :

```
plan_block_done("auth-feature", "Tests unitaires")
```

Pour toute modification chirurgicale d'un exec-plan (mise à jour du decision log, correction de contenu), le team-lead utilise `plan_update(id, old_string, new_string)`.

Pour créer ou mettre à jour une spec, le team-lead appelle `spec_create(title, type, content)` ou `spec_update(id, old_string, new_string)`. Ces tools déclenchent automatiquement le `spec-validator` — le résultat (APPROVED ou REJECTED) est retourné inline.

---

## 6. Hors scope

- **Création d'exec-plans** — c'est le rôle de l'agent `planning`. Les tools lifecycle ne créent pas d'exec-plans.
- **Création de briefs** — c'est le rôle de l'agent `brainstorm`.
- **Mise à jour du decision log** — Le team-lead le fait directement dans le fichier exec-plan (via sous-agent si besoin) ; le decision log reste dans l'exec-plan.
- **Suppression d'artefacts** — les tools lifecycle ne suppriment rien.
- **Validation du contenu** des specs ou briefs — `check_artifacts` vérifie l'existence et la cohérence des références, pas la qualité du contenu.
- **Sync git** — les tools écrivent sur disque mais ne commitent pas. Le commit reste sous contrôle de l'utilisateur ou du team-lead via ses permissions git.
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
