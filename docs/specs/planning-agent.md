# Spec : Agent `planning`

**Statut :** draft  
**Mis à jour :** 2026-04-01

## Résumé

Spec de l'agent `planning` — producteur de contrats de travail. S'adresse aux contributeurs du plugin et à Orion.

---

## Rôle

Transformer un prompt (vague ou clair) en contrat de travail structuré sur disque, avant que l'implémentation commence.

> *"Constraindre les livrables, laisser les agents décider comment."*

Le plan n'est pas un outil de clarification. C'est un contrat qui définit **quoi** sera construit, à quel niveau d'ambition, avec quels critères de "done" — avant qu'une ligne de code soit écrite. Une erreur de spec en amont cascade dans toute l'implémentation : le plan reste délibérément haut niveau, jamais de détails d'implémentation.

---

## Deux types de plans

### Plan simple

Pour les tâches petites et claires. Orion peut le produire lui-même sans invoquer l'agent.

```markdown
## Goal
{L'outcome réel en 1-2 phrases}

## Building blocks
- [ ] Bloc 1
- [ ] Bloc 2
```

### Exec-plan

Pour les tâches complexes ou multi-sessions. Produit par l'agent `planning`.

```markdown
---
status: draft | active | completed
created: {date}
updated: {date}
brief: docs/briefs/{nom}.md   # optionnel — brief associé
---

## Goal
{L'outcome réel, 1-3 phrases — le vrai problème résolu, pas juste le nom de la feature}

## Scope
{Ce qui est dans le périmètre / ce qui est explicitement hors périmètre}

## Building blocks
- [ ] Bloc 1: {livrable}
  - Done when: {critère vérifiable par le review-manager}
- [ ] Bloc 2: {livrable}
  - Done when: {critère vérifiable}
  - Depends on: Bloc 1

## Open questions
{Décisions bloquantes à résoudre avant d'agir — si vide, on peut commencer}

## Decision log
{Décisions prises + rationale — mis à jour par Orion pendant l'implémentation}
```

---

## Ce que l'agent fait

1. **Expand** le scope — ambitieux par défaut, cherche les gaps implicites et les dépendances cachées
2. Structure le travail en blocs livrables avec dépendances explicites
3. Définit un critère "done when" par bloc — ce qui permettra au review-manager de valider
4. Identifie les décisions bloquantes (open questions) à résoudre avant d'agir
5. Écrit l'exec-plan sur disque comme artefact vivant

---

## Ce que l'agent ne fait PAS

- Pas de détails d'implémentation (comment faire — c'est le rôle du générateur)
- Pas de PRD, user stories, ou requirements gathering
- Pas de décisions architecturales unilatérales
- Pas de validation du travail produit (→ review-manager)
- Pas d'exécution de code ou de commandes

---

## Déclencheurs

| Situation | Action |
|-----------|--------|
| Tâche complexe ou multi-session | Orion invoque `planning` → exec-plan |
| Tâche ambiguë (plusieurs interprétations) | Orion invoque `planning` → exec-plan |
| Invocation directe par l'utilisateur | Exec-plan |
| Tâche simple et claire | Orion procède directement (plan simple inline si besoin) |
| Bug identifié | `bug-finder`, pas `planning` |

---

## Artefacts produits

| Type | Chemin | Usage |
|------|--------|-------|
| Exec-plan | `docs/exec-plans/<feature>.md` | Tâches complexes / multi-sessions |
| Plan simple | Inline dans le scratchpad Orion | Tâches simples — pas de fichier dédié |

Les exec-plans complétés restent dans `docs/exec-plans/` avec `status: completed` — ils servent de référence historique pour les agents futurs.

---

## Cycle de vie d'un exec-plan

1. **draft** — produit par `planning`, pas encore validé
2. **active** — Orion démarre l'implémentation, met à jour le decision log au fil du travail
3. **completed** — tous les blocs cochés, plan archivé (status: completed, ne pas supprimer)

Orion est responsable de la mise à jour du decision log et du status pendant l'implémentation. L'agent `planning` ne modifie le plan qu'à sa création.

---

## Permissions

| Ressource | Accès |
|-----------|-------|
| `task` | allow |
| `question` | allow — pour lever les open questions bloquantes |
| `read` | allow — AGENTS.md, README, docs/ du repo utilisateur |
| `docs/exec-plans/*` | Écriture uniquement |
| Reste du projet | Lecture seule, pas d'écriture |
| `bash` | Non |
| Web search | Non |

---

## Configuration

| Paramètre | Valeur |
|-----------|--------|
| `mode` | `all` — invocable directement par l'utilisateur ET par Orion |
| `temperature` | 0.3 |
| `variant` | `max` |

---

## Relation avec le scratchpad d'Orion

L'exec-plan et le scratchpad d'Orion opèrent à des niveaux différents et ne doivent pas dupliquer d'information.

| | Exec-plan | Scratchpad |
|---|---|---|
| Contenu | Quoi, done-when, décisions, open questions | État d'orchestration session — délégations en vol, résultats agents, fichiers modifiés |
| Durée de vie | Permanent — versionné dans git | Éphémère — réinitialisé à chaque mission |
| Audience | Tous les agents du repo | Orion uniquement |
| Mis à jour par | Planning agent (création) + Orion (decision log, status) | Orion en continu |

**Règle :** quand un exec-plan existe, le scratchpad pointe vers lui plutôt que de dupliquer les tâches. Le scratchpad ne garde que ce que l'exec-plan ne peut pas contenir : état des délégations actives, résultats des agents, contexte de reprise.

Exemple de scratchpad avec exec-plan actif :

```markdown
# Current Mission
Voir exec-plan : docs/exec-plans/auth-system.md

## Active Task
Bloc 2 (login flow) — en cours

### Sub-tasks
- [x] General agent — impl login endpoint → auth/login.ts, auth/middleware.ts
- [ ] Review-manager — en attente

### Context for Resume
[état de la délégation en cours, pas les tâches du plan]
```

Les open questions et le decision log vont dans l'exec-plan, pas dans le scratchpad.

---

## Liens

- [Index docs](../index.md)
- [Décisions D3](../decisions.md)
- [Spec : Harness](./harness-agent.md)
- [Spec : Gardener](./gardener-agent.md)
