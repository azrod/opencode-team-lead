# Architecture

## Ce qu'est le plugin

`opencode-team-lead` est un plugin OpenCode (v0.8.0) qui injecte des agents dans la configuration de l'IDE au démarrage. Il n'a aucune dépendance npm — uniquement des builtins Node.js (`fs/promises`, `path`, `url`). Pure ESM, aucune étape de build.

Le point d'entrée est `index.js`. Il exporte `TeamLeadPlugin`, une fonction async qui charge les prompts depuis le disque, puis retourne un objet avec les deux hooks.

## Les deux hooks

### `config`

Appelé par OpenCode pour construire la configuration des agents. Le hook :

1. Lit le config utilisateur existant (`input.agent`)
2. Injecte les définitions de tous les agents (team-lead + sous-agents)
3. Fusionne les overrides utilisateur par-dessus les defaults du plugin (voir **Fusion de config**)

### `experimental.session.compacting`

Appelé avant chaque compaction de contexte. Le hook lit `.opencode/scratchpad.md` et injecte son contenu dans `output.context` :

- `.opencode/scratchpad.md` — état de la mission courante (plan, résultats d'agents, contexte de reprise)

Si le fichier n'existe pas, le hook passe silencieusement (ENOENT ignoré).

## Les agents enregistrés

```
┌─────────────────────────────────────────────────────────────────┐
│  OpenCode IDE                                                   │
│                                                                 │
│  ┌──────────────┐   task   ┌─────────────────┐                 │
│  │  team-lead   │ ───────► │  review-manager │ (subagent)      │
│  │  (Orion)     │          │                 │                 │
│  │  mode: all   │          │  task ──► requirements-reviewer   │
│  └──────────────┘          │  task ──► code-reviewer           │
│         │                  │  task ──► security-reviewer       │
│         │ task             └─────────────────┘                 │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  bug-finder  │ (mode: all — visible utilisateur)            │
│  └──────────────┘                                              │
│  ┌──────────────┐                                              │
│  │  brainstorm  │ (mode: all — phase 0, avant Orion)           │
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
| `bug-finder` | `all` | 0.2 | max | Investigation structurée de bugs. Force l'analyse root-cause avant toute correction. |
| `harness` | `all` | 0.2 | max | Encode les patterns récurrents en artifacts d'enforcement mécaniques (lint rules, CI checks, AGENTS.md entries). |
| `planning` | `all` | 0.3 | max | Transforme les requêtes complexes ou ambiguës en work contracts structurés sur disque (exec-plans). |
| `gardener` | `all` | 0.2 | max | Maintenance périodique — corrige les docs stales, détecte la dérive de code, ouvre des PRs ciblées. |
| `brainstorm` | `all` | 0.5 | max | Phase 0 discovery. Aide l'utilisateur à articuler ce qu'il veut construire. Produit un product brief dans `docs/briefs/`. |

Les sous-agents `requirements-reviewer`, `code-reviewer`, `security-reviewer` sont enregistrés silencieusement (`silent: true`) — un fichier manquant ne fait pas planter le plugin.

## Le modèle de permissions

Le principe est **deny-all sauf whitelist explicite**. Chaque agent démarre avec `"*": "deny"` et ne reçoit que les outils strictement nécessaires à son rôle.

**team-lead** :

| Outil | Accès |
|---|---|
| `task`, `todowrite`, `todoread`, `skill`, `question` | allow |
| `distill`, `prune`, `compress` | allow (gestion contexte via DCP) |
| `read` / `edit` | allow uniquement sur `.opencode/scratchpad.md` |
| `bash` | allow uniquement pour les commandes git (`git status*`, `git diff*`, `git log*`, `git add*`, `git commit*`, `git push*`, `git tag*`) |
| Tout le reste | deny |

**review-manager** : `task` + `question` uniquement.

**Reviewers spécialisés** (`requirements-reviewer`, `code-reviewer`, `security-reviewer`) : `task` uniquement.

**bug-finder** : `task` + `question` uniquement.

**brainstorm** : `task`, `question`, `webfetch`, `read` (tous les fichiers du projet), `write` (`docs/briefs/**` uniquement). Pas de bash.

La restriction est intentionnelle : un orchestrateur qui peut lire des fichiers tend à le faire plutôt que de déléguer. Le deny-all force la délégation.

## Le scratchpad

Un seul fichier dans `.opencode/` à la racine du projet :

- **`.opencode/scratchpad.md`** — état de la mission courante : plan, résultats d'agents, contexte de reprise. Écrasé à chaque nouvelle mission. Injecté à la compaction.

Le scratchpad est le mécanisme de survie à la compaction : tout ce dont Orion a besoin pour reprendre doit y être.

## Chargement des prompts

Les prompts sont chargés une seule fois au démarrage du plugin via `readFile`, pas inlinés dans `index.js`. Chemins résolus depuis `__dirname` vers `agents/`:

- `agents/prompt.md` → team-lead (Orion)
- `agents/review-manager.md` → review-manager
- `agents/requirements-reviewer.md`, `agents/code-reviewer.md`, `agents/security-reviewer.md`, `agents/bug-finder.md` → reviewers + bug-finder
- `agents/harness.md` → harness
- `agents/planning.md` → planning
- `agents/gardener.md` → gardener
- `agents/brainstorm.md` → brainstorm

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

Aucune dépendance npm. Uniquement :

- `node:fs/promises` — lecture des fichiers de prompts et du scratchpad
- `node:path` — résolution de chemins
- `node:url` — `fileURLToPath` pour `__dirname` en ESM
