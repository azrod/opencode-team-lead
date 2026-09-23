# opencode-team-lead — Documentation

Plugin OpenCode qui injecte un orchestrateur team-lead qui planifie, délègue, et ne touche jamais le code directement.

---

## Agents implémentés

| Agent | Mode | Rôle |
|---|---|---|
| `team-lead` | all | Orchestrateur principal |
| `review-manager` | subagent | Orchestre les reviewers en parallèle |
| `requirements-reviewer` | subagent | Vérifie l'adéquation impl ↔ exigences |
| `code-reviewer` | subagent | Correctness, logique, maintenabilité |
| `security-reviewer` | subagent | Vulnérabilités, misconfigs, exposition de données |
| `bug-finder` | all | Investigation de bugs avec analyse root-cause |
| `brainstorm` | all | Phase 0 — aide l'utilisateur à découvrir ce qu'il veut construire, produit un product brief dans `docs/briefs/` |
| `researcher` | all | External knowledge agent. Fetches and synthesizes information from the web, official docs, APIs, and public sources. Used BEFORE planning to answer technical questions requiring external research. Read-only, leaf node. |
| `harness` | all | Encode les patterns récurrents en règles mécaniques (lint, CI, AGENTS.md) |
| `planning` | all | Transforme les requêtes complexes en contrats de travail sur disque |
| `gardener` | all | Maintenance périodique — docs stales et drift de code |
| `spec-validator` | subagent | Validateur LLM invoqué après `spec_create` / `spec_update` — vérifie complétude, clarté et cohérence interne |
| `plan-reviewer` | subagent | Orchestrateur de review de plan — demande la profondeur (light/deep), spawne `plan-functional-reviewer`, `plan-technical-reviewer`, `plan-code-reviewer` en parallèle, retourne APPROVED / CHANGES_REQUESTED / BLOCKED |
| `plan-functional-reviewer` | subagent | Vérifie l'alignement du plan avec les specs fonctionnelles. Silencieux, invoqué par `plan-reviewer` uniquement |
| `plan-technical-reviewer` | subagent | Vérifie l'alignement du plan avec les specs techniques et architecturales. Silencieux, invoqué par `plan-reviewer` uniquement |
| `plan-code-reviewer` | subagent | Vérifie la faisabilité des blocs contre le codebase (mode deep uniquement). Silencieux, invoqué par `plan-reviewer` uniquement |
| `spec-reviewer` | subagent | Intégré dans le pool du review-manager — retourne `NO_ACTION_NEEDED` / `SPEC_CREATE_NEEDED` / `SPEC_UPDATE_NEEDED` après chaque livraison |
| `spec-writer` | all | Rédaction de specs de haute qualité conformes au format canonique — délégué par le team-lead ou le gardener (mode Bootstrap) |

## Abandonné

| Agent | Raison |
|---|---|
| `analyst` | Approche BMAD — résout des problèmes de coordination humaine, pas agentique |

→ Voir [specs/analyst-agent.md](specs/analyst-agent.md) et [decisions.md](decisions.md#d1--abandon-de-lapproche-bmad)

---

## Custom Tools (Lifecycle)

Vingt outils de bookkeeping injectés directement dans OpenCode — accessibles par le team-lead sans délégation :

### Global

| Tool | Rôle |
|---|---|
| `project_state()` | Vue complète des specs actives et exec-plans en cours |
| `spec_format()` | Retourne le format canonique attendu pour un fichier spec |
| `plan_format()` | Retourne le format canonique attendu pour un exec-plan |

### Spec

| Tool | Rôle |
|---|---|
| `spec_get(id)` | Récupère une spec par id — retourne chemin, contenu, frontmatter |
| `spec_create(title, type?, content?)` | Crée un nouveau fichier spec |
| `spec_update(id, old_string, new_string)` | Mise à jour chirurgicale d'une spec |
| `spec_validate(id)` | Valide la structure d'une spec (frontmatter + corps non vide) |
| `spec_list()` | Liste toutes les specs avec leurs métadonnées |
| `spec_delete(id)` | Supprime une spec par id |

### Plan

| Tool | Rôle |
|---|---|
| `plan_get(id)` | Récupère un exec-plan par id |
| `plan_create(title, functional_objective, brief?, content?)` | Crée un nouvel exec-plan |
| `plan_update(id, old_string, new_string)` | Mise à jour chirurgicale d'un exec-plan |
| `plan_validate(id)` | Valide la structure d'un exec-plan |
| `plan_block_done(plan_id, block_name)` | Coche un bloc dans un exec-plan (`[ ]` → `[x]`) |
| `plan_list()` | Liste tous les exec-plans avec leur avancement |
| `plan_delete(id)` | Supprime un exec-plan par id |

### Brief

| Tool | Rôle |
|---|---|
| `brief_get(id)` | Récupère un product brief par id |
| `brief_create(title, content?, exec_plan?)` | Crée un nouveau product brief |
| `brief_update(id, old_string, new_string)` | Mise à jour chirurgicale d'un brief |
| `brief_list()` | Liste tous les briefs avec leurs métadonnées |
| `brief_delete(id)` | Supprime un brief par id |

→ Voir [specs/lifecycle-tools.md](specs/lifecycle-tools.md)

---

## Liens

- [Architecture](architecture.md)
- [Décisions stratégiques](decisions.md) — pivots et choix de design
- [ADRs](adr/index.md) — décisions d'architecture actives
- [Whitepaper : SDLC vs. harness engineering](background/whitepaper-sdlc-vs-harness.md) — doc humain
- [Background](background/index.md) — docs narratifs humains (non agentiques)
- [Templates](templates/agent-doc.md) — templates de nouveaux fichiers
- Implémentation : [`../index.js`](../index.js)
- Prompts agents : [`../agents/`](../agents/)
