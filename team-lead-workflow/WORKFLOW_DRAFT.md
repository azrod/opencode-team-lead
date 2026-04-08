# Unified Workflow Draft — "From idea to maintained code"

<!-- OBJECTIF
     Un seul flowchart de bout en bout qui montre le parcours complet de l'utilisateur,
     du brainstorm jusqu'à l'amélioration continue (harness/gardener).
     Ce fichier est le brouillon de travail — on affine ici avant de toucher au code.
-->

## Structure générale

```
[User Request]
      │
      ▼
┌─────────────┐
│  BRAINSTORM │  Phase 0 — Discovery
│  (optionnel)│  Produit un brief dans docs/briefs/
└─────────────┘
      │
      ▼
┌─────────────┐
│    PLAN     │  Phase 1 — Understand + Plan
│             │  Orion lit le scratchpad, appelle project_state / check_artifacts
│             │  Planning agent si ambigu → exec-plan dans docs/exec-plans/
└─────────────┘
      │
      ▼
┌─────────────┐
│  DELEGATE   │  Phase 2 — Délégation
│             │  Bug report ? → bug-finder d'abord
│             │  Sinon → sub-agents (explore / general)
│             │  Échec ? → retry x2 → escalade user
└─────────────┘
      │
      ▼
┌─────────────┐
│   REVIEW    │  Phase 3 — Review
│             │  review-manager → code-reviewer + security-reviewer + requirements-reviewer
│             │  Verdict : APPROVED / CHANGES_REQUESTED (max 2 rounds) / BLOCKED → escalade
└─────────────┘
      │
      ▼
┌─────────────┐
│  SYNTHESIZE │  Phase 4 — Livraison
│             │  Auto-éval → rapport à l'utilisateur
└─────────────┘
      │
      ▼
┌─────────────┐
│ MAINTENANCE │  Phase 5 — Amélioration continue (post-delivery, déclenchement optionnel)
│             │  harness : pattern récurrent → règle mécanique (lint, CI, AGENTS.md)
│             │  gardener : drift doc/code → PR ciblée
└─────────────┘
```

---

## Ce que ça apporte

<!-- APPORTS
     - Un seul flowchart de bout en bout — fini les tabs isolés Orion / Brainstorm
     - Le brainstorm est "optionnel" : on peut entrer directement en phase Plan
     - Le bug-finder a sa place naturelle dans Delegate (pas un cas à part)
     - La maintenance (harness + gardener) n'est plus un nœud isolé après "End"
       mais une vraie phase du cycle de vie
     - Le scratchpad est le fil conducteur visible tout au long
-->

---

## Décisions de design — RÉSOLUES

| # | Sujet | Décision |
|---|-------|----------|
| Q1 | Interaction nœuds | **Panel latéral** — clic → panel animé à droite (comportement actuel conservé) |
| Q2 | Boucles | **Flèches SVG visibles** — flèches courbes en tirets pour les boucles importantes (retry ×2, changes_requested ×2, gap majeur) |
| Q3 | Scratchpad | **Annotations ponctuelles** — `✎` sous chaque phase + MemFileNode dans Understand |
| Q4 | Fast path brainstorm | **Flèche pointillée bypass** — flèche dashed qui court-circuite les phases 1+2, atterrit sur Phase 3 |
| Q5 | Phase 5 Maintenance | **Deux branches parallèles** — Harness et Gardener partent tous les deux du nœud post-delivery |
| Q6 | Tabs existants | **Remplacer complètement** — le flowchart unifié remplace les tabs Orion + Brainstorm existants |

---

## Nœuds détaillés (à affiner)

<!-- Cette section documente les nœuds un par un avec leur contenu de panel détail.
     À remplir au fil des itérations. -->

### Phase 0 — BRAINSTORM (optionnel)
- Agent : `brainstorm`
- Entrée : demande utilisateur vague ou projet nouveau
- Sortie : `docs/briefs/{project-name}.md`

#### Logique d'entrée (toujours exécutée — glob obligatoire)
- **Aucun brief trouvé** → Phase 1 directement, sans question
- **Un brief trouvé (status: draft)** → demande : "Continuer ce brief ou repartir de zéro ?"
  - Continuer → charge le brief, saute directement en Phase 3
  - Repartir → Phase 1 normale
- **Un brief trouvé (status: done ou autre)** → demande : "Réviser ce brief ou nouveau projet ?"
  - Réviser → charge le brief, saute directement en Phase 3
  - Nouveau projet → Phase 1 normale
- **Plusieurs briefs trouvés** → liste les briefs (path + status + nom) + demande lequel choisir
  - Choisit un brief existant → même logique que "un brief trouvé"
  - Nouveau projet → Phase 1 normale

#### Fast path (Phase 1 → Phase 3 direct)
- Si le message d'ouverture de l'utilisateur fournit déjà problème + scope suffisants :
  l'agent propose de sauter directement en Phase 3 (draft immédiat)
- Si l'utilisateur dit explicitement vouloir sauter l'exploration → Phase 3 directement

#### Fin du brainstorm
- Après écriture du brief, l'agent dit :
  *"Brief written to `docs/briefs/{project-name}.md`. Hand it to **Planning** to break this into
  an exec-plan, or to **Orion** if scope is already clear enough to start."*
- Ce n'est pas une délégation automatique — c'est une suggestion verbale à l'utilisateur

### Phase 1 — PLAN (Understand + Plan)

#### Ordre d'opérations (strict)

1. **Lire `.opencode/scratchpad.md`** — première action, avant tout le reste
   - Mission terminée → écraser avec la nouvelle mission
   - Mission en cours / parkée → demander à l'utilisateur : reprendre ou abandonner ?
   - Compaction recovery : si contexte perdu, lire le scratchpad EST la première action

2. **Appeler `project_state()`** — état des exec-plans, specs, briefs (obligatoire, non délégable)

3. **Appeler `check_artifacts()`** — détecte les incohérences bloquantes (obligatoire, non délégable)

4. **Écouter l'intention de l'utilisateur**
   - Ambigu ? → poser une question de clarification (avant tout planning)
   - Bug report ? → pas de planning, direct vers bug-finder (Phase 2)

5. **Vérifier le nombre de scopes**
   - Plusieurs scopes ? → les lister, proposer un ordre (dépendances → risque → valeur), obtenir accord
   - Un seul scope → continuer

6. **Déterminer le type de plan**
   - Tâche simple / claire → **plan simple** : écrire `## Goal` + `## Building blocks` dans le scratchpad (Orion le produit directement, sans agent)
   - Tâche complexe / multi-session ET docs ne clarifient pas ET une question ne suffirait pas → **exec-plan** : invoquer l'agent `planning` → fichier écrit dans `docs/exec-plans/<feature>.md` → scratchpad pointe vers le fichier (pas de duplication)

7. **Appeler `todowrite`** — liste de tâches visible pour l'utilisateur

8. **Écrire / mettre à jour le scratchpad** — objectif, plan, décisions, questions ouvertes, scopes parkés

9. **Nettoyer le contexte** — compress avant d'entrer en Phase 2

#### Règle "un scope à la fois"
Orion travaille sur un seul scope fonctionnel jusqu'à livraison complète.
Si l'utilisateur demande plusieurs scopes : les reconnaître tous, proposer un ordre, attendre l'accord, livrer scope par scope.
Interruption en cours de scope → parker (scratchpad), switcher, revenir.

#### Lifecycle tools disponibles
- `register_spec(specFile, title)` — si le planning détermine qu'une nouvelle spec doit exister sur disque

#### Transition vers Phase 2
La Phase 2 commence dès le premier appel `task`. Signal : plan écrit dans le scratchpad + `todowrite` appelé + dépendances des agents mappées.

### Phase 2 — DELEGATE

#### Sélection de l'agent (hiérarchie stricte)
1. **Agents user-defined enregistrés** (fichiers `.md` dans `agent/`) — priorité absolue, prompts spécialisés
2. **Agents plugin nommés** (`review-manager`, `bug-finder`, `harness`, `planning`, `gardener`) — pour leurs protocoles spécifiques
3. **`explore`** — pour tout travail read-only (search, glob, grep, lecture de fichiers) — plus rapide, ne peut pas casser quoi que ce soit
4. **`general` + persona descriptive** — fallback uniquement, pour l'implémentation

Règle : si `explore` ou `general` suffisent, ne pas inventer une persona inutile.

#### Cas particulier — Bug report
- **Règle** : toujours déléguer à `bug-finder` d'abord — jamais directement à `general`
- **Skip autorisé uniquement si** : bug trivialement localisable (l'utilisateur pointe la ligne exacte) ET fix isolé (aucun risque de divergence) — les deux conditions doivent être vraies
- **Fournir à `bug-finder`** : description des symptômes, steps de reproduction, fichiers suspects, tentatives précédentes de fix
- **Résultat de `bug-finder` :**
  - `HIGH` → implémenter le fix via agent `general`
  - `MEDIUM` → implémenter, mais signaler l'incertitude à l'utilisateur
  - `UNCERTAINTY_EXPOSED` → **stop** — poser les questions ouvertes à l'utilisateur avant toute implémentation

#### Context handoff (chaque prompt d'agent doit être auto-suffisant)
- Inclure : chemins de fichiers, contraintes, output attendu
- Agents séquentiels (B dépend de A) : extraire l'essentiel de A (pas le dump brut), donner à B ce que A a changé / décidé / découvert, spécifier les interfaces
- Passage au reviewer : fournir la requête originale, les fichiers changés + pourquoi, les trade-offs faits, ce qui est explicitement hors scope

#### Cycle d'une délégation
1. Mettre à jour le scratchpad **avant** de déléguer (Active Task : sous-tâches, fichiers, Context for Resume)
2. Déléguer via `task`
3. Agent retourne → détecter succès ou échec

**En cas d'échec** — diagnostiquer d'abord, puis agir :

| Cause | Action |
|---|---|
| Prompt peu clair | **Reformuler** — réécrire avec plus de précision, exemples, contraintes |
| Overflow contexte / compaction | **Décomposer** — découper en sous-tâches indépendantes, déléguer séparément |
| Information manquante | **Enrichir** — envoyer un agent `explore` d'abord, puis re-déléguer avec les findings |
| Mauvaise persona | Changer de `subagent_type` |
| Blocage fondamental | **Escalader** à l'utilisateur |

Règle : toujours changer quelque chose entre deux tentatives. **Max 2 tentatives totales** (tous types de retry confondus) → escalade utilisateur.

**En cas de succès** :
4. Mettre à jour le scratchpad (résumés dans Agent Results + statut sous-tâches dans Active Task)
5. Distiller les outputs longs → résumé compact (substitut complet du raw)
6. Élaguer les outputs purement exploratoires ou déjà distillés
7. Si un bloc d'exec-plan est complété → appeler `mark_block_done(plan_file, block_name)`
8. Répéter pour l'agent suivant

#### Gestion du contexte (rythme après chaque retour agent)
**Scratchpad d'abord → Distiller → Élaguer** (ordre strict, non interchangeable)

Règle d'or : le scratchpad doit toujours contenir tout ce qu'il faut pour reprendre si le contexte in-memory disparaît. Distill/prune = efficacité. Scratchpad = survie.

#### Lifecycle tools
- `mark_block_done(plan_file, block_name)` — après chaque livraison validée, pas en batch à la fin

#### Transition vers Phase 3 (Review)
La Phase 3 commence quand tous les agents ont retourné leurs résultats et le scratchpad est à jour.
**Toute modification de code / architecture / infra / sécurité doit être reviewée** — sans exception.
Seul skip autorisé : changement documentation uniquement + aucune implication sécurité + utilisateur a explicitement demandé la vitesse.
Checkpoint de contexte obligatoire avant de passer en Review (distill/prune outputs de la phase Delegate).

## Phase 3 — REVIEW

> **Source:** `agents/prompt.md` — "### 4. Review", "Review Protocol", lifecycle tools section

### Entry condition
- All delegated agents from Phase 2 have returned results
- Scratchpad is up to date with all agent summaries
- Any code / architecture / infra / security change was produced

### When review is MANDATORY
Any change that is code, architecture, infrastructure, or security-related. No exceptions. "Small changes cause big outages. Review is proportional, not optional."

### When review can be SKIPPED (ALL three required)
1. The change is documentation-only (no code, no config, no infra)
2. The change has no security implications
3. The user explicitly requested speed over thoroughness
→ If skipped: note in report `"Review skipped — documentation-only change."`

### Absolute rule: delegate ALL reviews to `review-manager`
- NEVER spawn reviewer agents directly
- `review-manager` selects the right reviewers, spawns them in parallel, synthesizes their verdicts
- Provide this exact structure:
  ```
  ## Context
  [What was changed, by which agent, and why — include trade-offs and decisions made]

  ## Changed Files
  [List of files modified with a summary of each change]

  ## Original Requirements
  [What the user asked for, so reviewers can verify intent — not just code quality]
  ```
- Include: original request, files changed + why, trade-offs made, what was explicitly out of scope

### Resume vs fresh start for review-manager
- **Fresh start** (no `task_id`) — reviewer must see the work with fresh eyes
- **Resume** (`task_id` provided) for corrections after CHANGES_REQUESTED — producer has full context

### Verdict handling
| Verdict | Action |
|---|---|
| **APPROVED** | Proceed to Phase 4 (Synthesize) |
| **CHANGES_REQUESTED** | Re-delegate fixes to the original producer (resume, use `task_id`) → request second review via fresh `review-manager` |
| **BLOCKED** | Stop immediately. Report the blocker to the user with the review-manager's full reasoning. Do NOT fix BLOCKED issues without user input. |

### Hard limit: 2 review rounds maximum
- If still not approved after 2 iterations → escalate to the user (no third round)
- Counter is per-scope, not per-file

### Lifecycle tools in Review
- `mark_block_done(plan_file, block_name)` — call after each **approved** delivery (block is validated only once review passes)
- `complete_plan(plan_file)` — call when ALL blocks are checked AND the final review is APPROVED

### Scratchpad update after review
- Update `## Plan` task statuses
- Update `## Active Task > Sub-tasks` (tick review sub-task)
- Add `review-manager` verdict to `## Agent Results`
- Record any decisions triggered by the verdict in `## Decisions`

### Transition to Phase 4
Exit condition: `review-manager` returns **APPROVED**
Sequence:
1. Update scratchpad (verdict, task statuses, decisions)
2. Call `mark_block_done` if a block is now validated
3. Call `complete_plan` if all blocks done
4. Enter Phase 4 — begin with self-evaluation

### Phase 4 — SYNTHESIZE & REPORT

> **Source:** `agents/prompt.md` — "### 5. Synthesize & Report", "Self-Evaluation", "Communication Style", scratchpad lifecycle

### Entry condition
- `review-manager` returned **APPROVED**
- `mark_block_done` and `complete_plan` called as applicable
- Scratchpad updated with review outcome

### Step 1 — Self-evaluation (mandatory before reporting)

Run this checklist before reporting anything:
1. **Does the result fully answer the original request?** — not what was interpreted, what the user actually asked
2. **Are multi-agent outputs coherent?** — no contradictions, no scope drift, no missing parts
3. **Does anything nag about correctness or side effects?** — if yes, fix before reporting

**When self-eval fails:**
| Gap type | Action |
|---|---|
| **Minor gap** (missing detail, small inconsistency) | Delegate a quick follow-up task |
| **Major gap** (wrong approach, missing requirement) | Loop back to relevant phase (Plan, Delegate, or Review) |
| **Scope confusion** (not sure what user wanted) | Ask the user before delivering a wrong answer |

### Step 2 — Collect and synthesize

- Collect outputs from all agents
- Summarize results concisely
- Flag any issues, conflicts, or failures

### Step 3 — Update scratchpad (final state capture)

Before reporting:
- Mark the mission as complete in the scratchpad
- Do not delete it (user might come back to it)
- `## Plan` — all task statuses final
- `## Decisions` — any last decisions recorded

### Step 4 — Report to user

Communication rules (from `human-tone`):
- Lead with the outcome, not the process
- Highlight what succeeded and what failed
- Be honest about issues — don't sugarcoat agent failures
- Propose concrete next steps if applicable

### Step 5 — Post-delivery: harness suggestion (optional)

After significant code changes, check if a recurring pattern emerged:
- A pattern explained multiple times to sub-agents
- An architectural decision that keeps getting violated
- A convention that lint doesn't yet enforce

If yes → **suggest harness to the user** (verbal only, never launch without confirmation)

Rules:
- Never propose harness at mission start — only post-delivery
- Never launch without explicit user confirmation
- Harness is never on the critical path

### Step 6 — Gardener (optional, low frequency)

Suggest the `gardener` agent post-feature or when user asks. No automatic trigger.

### Parked scopes

No automatic resumption. The scratchpad lifecycle check at the next mission start handles it:
- If scratchpad contains a parked/in-progress mission → ask user: resume or abandon?
- If scratchpad contains a completed mission → overwrite

### Phase 5 — MAINTENANCE (post-delivery, optional)

> **Source:** `agents/prompt.md` — "Harness Protocol", agent selection descriptions; `agents/harness.md`; `agents/gardener.md`

### Two independent paths — can run together or separately

```
After delivery
    ├── Harness (recurring pattern → mechanical enforcement)
    └── Gardener (stale docs + code drift detection)
```

---

### Path A — Harness

**Trigger:** After significant code changes, Orion checks if a recurring pattern emerged.

**When to suggest to the user:**
- A pattern explained multiple times to sub-agents
- An architectural decision that keeps getting violated
- A convention that lint doesn't yet enforce

**Hard rules:**
- Never launch without explicit user confirmation — it's a structural change
- Never propose at mission start — always post-delivery
- Never on the critical path

**What harness produces** (one of the following, depending on pattern type):

| Pattern type | Artifact |
|---|---|
| Syntactic/structural code convention | Custom lint rule (ESLint, Ruff, etc.) — complete, runnable |
| Build/deployment constraint | CI pipeline job (GitHub Actions YAML, etc.) — complete |
| Agent navigation/delegation rule | Entry in `AGENTS.md` |
| Non-mechanizable architectural principle | Entry in `docs/guiding-principles.md` |

**How it's invoked:**
- By **user directly** → Harness opens a PR with the artifact
- By **Orion** (after observing recurring pattern) → Harness delivers artifact files back to Orion (no PR — Orion decides when to ship)
- By **Gardener** (after detecting recurring drift) → same as Orion path

---

### Path B — Gardener

**Trigger:** Post-feature (Orion suggests it) or explicit user request.

**What gardener does — two independent functions:**

**Function 1 — Doc-Gardening:**
- Detects stale references, outdated descriptions, broken links in documentation
- Fixes stale content
- Opens one PR per document, minimal scope, titled `docs: fix stale references in <file>`

**Function 2 — Code-GC (code drift detection):**

| Finding type | Action |
|---|---|
| One-time drift | Opens targeted refactoring PR — minimal, non-breaking, self-explanatory |
| Recurring pattern (multiple places or sessions) | Triggers `harness` agent (or reports to Orion for user confirmation) |

After every run: updates or creates `QUALITY_SCORE.md` with scores per domain (new dated section, never overwrites old scores).

---

### Harness ← Gardener escalation

Gardener escalates to Harness when it detects the same drift recurring across multiple places or sessions:
- Gardener checks with Orion / user before triggering Harness (confirmation required)
- Once Harness is invoked, it proceeds directly — it does not re-ask (Gardener/Orion already made the recurrence judgment)

The conceptual model: **Harness installs the net. Gardener checks what slipped through.**
