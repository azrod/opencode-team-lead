# opencode-team-lead — Documentation

Plugin OpenCode qui injecte Orion, un orchestrateur team-lead qui planifie, délègue, et ne touche jamais le code directement.

---

## Agents implémentés

| Agent | Mode | Rôle |
|---|---|---|
| `team-lead` | all | Orchestrateur principal (Orion) |
| `review-manager` | subagent | Orchestre les reviewers en parallèle |
| `requirements-reviewer` | subagent | Vérifie l'adéquation impl ↔ exigences |
| `code-reviewer` | subagent | Correctness, logique, maintenabilité |
| `security-reviewer` | subagent | Vulnérabilités, misconfigs, exposition de données |
| `bug-finder` | all | Investigation de bugs avec analyse root-cause |
| `brainstorm` | all | Phase 0 — aide l'utilisateur à découvrir ce qu'il veut construire, produit un product brief dans `docs/briefs/` |
| `harness` | all | Encode les patterns récurrents en règles mécaniques (lint, CI, AGENTS.md) |
| `planning` | all | Transforme les requêtes complexes en contrats de travail sur disque |
| `gardener` | all | Maintenance périodique — docs stales et drift de code |

## Abandonné

| Agent | Raison |
|---|---|
| `analyst` | Approche BMAD — résout des problèmes de coordination humaine, pas agentique |

→ Voir [specs/analyst-agent.md](specs/analyst-agent.md) et [decisions.md](decisions.md#d1--abandon-de-lapproche-bmad)

---

## Custom Tools (Lifecycle)

Cinq tools de bookkeeping injectés directement dans OpenCode — accessibles par Orion sans délégation :

| Tool | Rôle |
|---|---|
| `project_state()` | Vue complète des exec-plans, specs et briefs courants |
| `mark_block_done(plan_file, block_name)` | Coche un bloc dans un exec-plan |
| `complete_plan(plan_file)` | Passe un exec-plan à `status: completed` |
| `register_spec(specFile, title)` | Crée un nouveau fichier de spec avec frontmatter minimal |
| `check_artifacts()` | Scan de consistance transversal — refs mortes, statuts stales |

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
