# Architecture

## Ce qu'est le plugin

`opencode-team-lead` est un plugin OpenCode (v0.8.0) qui injecte des agents dans la configuration de l'IDE au démarrage. Il a une dépendance runtime — `@opencode-ai/plugin` (le SDK hôte du plugin OpenCode) — plus des builtins Node.js (`fs/promises`, `path`, `url`). Pure ESM, aucune étape de build.

Le point d'entrée est `index.js`. Il exporte `TeamLeadPlugin`, une fonction async qui charge les prompts depuis le disque, puis retourne un objet avec deux hooks : `config` et `tool.execute.before`.

Agent registration is delegated to `config/agents.js`, which exports the complete ordered `AGENT_DEFS` registry and `registerAgent()`. Team-lead is first, followed by the 12 specialized agents. The entrypoint consumes that same 13-agent list for prompt loading, registration, and temperature-hook membership; it has no separate team-lead definition. Lifecycle registration remains in `tools/registry.js` (21 tools). See [Unified Agent Registry](specs/unified-agent-registry.md) for the original relocation contract. Bug-finder was subsequently removed along with its team-lead caller instructions; retained agent permissions and overrides are unchanged.

> **Retirement transition — 2026-11-06.** The plugin no longer supplies `planning`, `brainstorm`, `harness`, `researcher`, or `gardener`; see [Retire Five Auxiliary Agents](specs/retire-five-auxiliary-agents.md). Existing artifacts, lifecycle APIs, paths, formats, guards, and permissions remain unchanged. The team-lead prompt still contains old routing pending its separate redesign. This intermediate state is not a fully repaired end-to-end workflow; no replacement responsibility is assigned, and architect retains its narrow direct-only role.

## Le hook `config`

Appelé par OpenCode pour construire la configuration des agents. Le hook :

1. Lit le config utilisateur existant (`input.agent`)
2. Injecte les définitions de tous les agents (team-lead + sous-agents)
3. Fusionne les overrides utilisateur par-dessus les defaults du plugin (voir **Fusion de config**)

## Les agents enregistrés

```
┌─────────────────────────────────────────────────────────────────┐
│  OpenCode IDE                                                   │
│                                                                 │
│  ┌──────────────┐   task   ┌─────────────────┐                 │
│  │  team-lead   │ ───────► │  review-manager │ (subagent)      │
│  │              │          │                 │                 │
│  │  mode: all   │          │  task ──► requirements-reviewer   │
│  └──────────────┘          │  task ──► code-reviewer           │
│                            │  task ──► security-reviewer       │
│                            └─────────────────┘                 │
│  ┌──────────────┐                                              │
│  │  architect   │ (mode: primary — direct-only, hors task)     │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

| Agent | Mode | Température | Variant | Rôle |
|---|---|---|---|---|
| `team-lead` | `all` | 0.3 | max | Orchestrateur principal. Planifie, délègue, synthétise. Ne touche jamais le code. |
| `review-manager` | `subagent` | 0.2 | max | Orchestre les revues. Sélectionne les reviewers, les lance en parallèle, arbitre les désaccords. |
| `requirements-reviewer` | `subagent` | 0.1 | max | Vérifie la conformité fonctionnelle (impl. vs requirements). |
| `code-reviewer` | `subagent` | 0.2 | max | Qualité technique : logique, gestion d'erreurs, API design. |
| `security-reviewer` | `subagent` | 0.1 | max | Vulnérabilités, mauvaises configs, exposition de données. |
| `architect` | `primary` | 0.2 | max | Direct architecture advisor. Directly authors specs and plans, delegates only independent reviews to spec-validator and plan-reviewer, never implements. |
| `spec-validator` | `subagent` | 0.1 | max | Vérifie la cohérence et la complétude d'une spec après création ou mise à jour. |
| `plan-reviewer` | `subagent` | 0.2 | max | Orchestre la review d'exec-plan et arbitre les retours des reviewers de plan. |
| `plan-functional-reviewer` | `subagent` | 0.1 | max | Vérifie l'alignement fonctionnel d'un exec-plan avec les specs actives. |
| `plan-technical-reviewer` | `subagent` | 0.1 | max | Vérifie l'alignement technique et architectural d'un exec-plan. |
| `plan-code-reviewer` | `subagent` | 0.2 | max | Vérifie la faisabilité d'un exec-plan dans le codebase en review deep. |
| `spec-reviewer` | `subagent` | 0.2 | max | Détermine après livraison si une spec doit être créée ou mise à jour. |
| `spec-writer` | `subagent` | 0.3 | max | Rédige des specs conformes au format canonique. |

Les sous-agents `requirements-reviewer`, `code-reviewer`, `security-reviewer` sont enregistrés silencieusement (`hidden: true`) — un fichier manquant ne fait pas planter le plugin.

## Le modèle de permissions

Specialized agents declare explicit permission rules without a blanket deny policy. Actions not covered by these rules are left to OpenCode's permission resolution and configured policies.

**team-lead** :

| Outil | Accès |
|---|---|
| `task`, `todowrite`, `todoread`, `skill`, `question` | allow |
| `compress` | allow (gestion contexte) |
| `read` | allow sur tous les fichiers |
| `edit` / `write` | allow uniquement sur `docs/**` |
| `bash` | allow uniquement pour les commandes git (`git status*`, `git diff*`, `git log*`, `git add*`, `git commit*`, `git push*`, `git tag*`) et commandes de lecture (`ls`, `ls *`, `head *`, `echo *`) |
| Tout le reste | deny |

**review-manager** : `task` (filtré sur `*-reviewer` uniquement), `question`, `read`, `glob`, `grep`.

**Reviewers spécialisés** (`requirements-reviewer`, `code-reviewer`, `security-reviewer`) : `read`, `glob`, `grep` uniquement — lecture directe, pas de délégation.

**architect**: `read`, `list`, `glob`, `grep`, plus `spec_list`, `spec_get`, `spec_format`, `spec_create`, `spec_update`, `spec_validate`, `plan_list`, `plan_get`, `plan_format`, `plan_create`, `plan_update`, `plan_validate`. Native delegation rules allow only the exact `spec-validator` and `plan-reviewer` targets. `edit` is explicitly denied; other undeclared actions, including `external_directory`, are no longer denied by a blanket plugin rule. Prompt-level operating boundaries remain unchanged. Architect writes artifacts and corrections itself. Current specification approval precedes plan creation; explicit user acceptance is required for formalized architectural decisions. Closed questions and structural validation precede explicitly requested deep plan review. Incomplete reviews block handoff; nested review requires `experimental.subagent_depth: 2`.

Explicit permission restrictions are enforced by OpenCode; prompt-level delegation instructions alone are not a technical access restriction.

## Chargement des prompts

Les prompts sont chargés une seule fois au démarrage du plugin via `readFile`, pas inlinés dans `index.js`. Chemins résolus depuis `__dirname` vers `agents/`:

- `agents/team-lead.md` → team-lead
- `agents/review-manager.md` → review-manager
- `agents/requirements-reviewer.md` → requirements-reviewer
- `agents/code-reviewer.md` → code-reviewer
- `agents/security-reviewer.md` → security-reviewer
- `agents/architect.md` → architect
- `agents/spec-validator.md` → spec-validator
- `agents/plan-reviewer.md` → plan-reviewer
- `agents/plan-functional-reviewer.md` → plan-functional-reviewer
- `agents/plan-technical-reviewer.md` → plan-technical-reviewer
- `agents/plan-code-reviewer.md` → plan-code-reviewer
- `agents/spec-reviewer.md` → spec-reviewer
- `agents/spec-writer.md` → spec-writer

Avantage : les prompts sont modifiables et diffables indépendamment du code.

## Fusion de config

Les overrides utilisateur dans `opencode.json` s'appliquent par spread order :

```js
input.agent["team-lead"] = {
  // defaults plugin
  temperature: 0.3,
  variant: "max",
  ...
  // overrides utilisateur (écrasent les defaults)
  ...userConfigRest,
  // prompt toujours fourni par le plugin — non overridable
  prompt: teamLeadPrompt,
  permission: mergePermissions(defaultPermission, userConfigRest.permission),
};
```

Les permissions sont fusionnées un niveau plus profond via `mergePermissions` : les clés imbriquées (comme `read` ou `bash` qui sont des objets) sont shallow-mergées plutôt que remplacées. Résultat : l'utilisateur peut ajouter des permissions sans supprimer les defaults du plugin.

Le `prompt` est toujours fourni par le plugin et ne peut pas être overridé par l'utilisateur.

## Dépendances

Une dépendance runtime : `@opencode-ai/plugin` — le SDK hôte du plugin OpenCode. Uniquement des builtins Node.js au-delà :

- `node:fs/promises` — lecture des fichiers de prompts
- `node:path` — résolution de chemins
- `node:url` — `fileURLToPath` pour `__dirname` en ESM
