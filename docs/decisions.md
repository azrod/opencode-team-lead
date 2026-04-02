# Décisions stratégiques — 2026-03-31

## Résumé exécutif

Session d'exploration autour de BMAD-METHOD et du modèle harness engineering (article OpenAI sur les applications longue durée). Conclusion : la direction précédente (construire de meilleurs documents pour que les agents lisent) était la mauvaise abstraction. L'objectif est de construire de meilleurs environnements dans lesquels les agents opèrent.

---

## Décisions prises

### D1 : Abandon de l'approche BMAD

BMAD transpose le SDLC sur les agents IA. Le SDLC a été conçu pour résoudre des problèmes de coordination humaine — perte de contexte entre sessions, silos organisationnels, turnover. Les agents n'ont pas ces modes de défaillance.

Les personas (Marie la PM, Jean l'architecte) sont du scaffolding psychologique pour humains, pas de l'architecture fonctionnelle. Les phase gates sont une illusion de contrôle, pas de l'enforcement mécanique. Les PRDs sont optimisés pour l'approbation humaine, pas pour la navigation agentique.

**Insight clé** : BMAD a la bonne intuition (détecter les mauvaises décisions tôt) mais le mauvais mécanisme (cérémonie documentaire au lieu de contraintes mécaniques).

Référence : [whitepaper-sdlc-vs-harness.md](whitepaper-sdlc-vs-harness.md)

---

### D2 : Agent `harness` plutôt qu'agent `analyst`

L'agent `analyst` (spec BMAD-style) aidait les utilisateurs à écrire des PRDs et des stories. Abandonné.

**Le pivot** : la question n'est pas "comment écrire de meilleurs documents pour les agents" mais "comment construire un environnement dans lequel les agents peuvent opérer sans cérémonie."

L'agent `harness` analyse un dépôt et génère ce qui manque pour qu'Orion et ses sous-agents opèrent de manière autonome : `AGENTS.md` précis (carte courte, pas manuel), structure `docs/` navigable, lint rules, pre-commit hooks, CI jobs, critères d'acceptance exécutables.

Un environnement bien structuré élimine le besoin de planification cérémoniaire. Les contraintes mécaniques remplacent les contraintes documentées.

Spec : [specs/harness-agent.md](specs/harness-agent.md)

---

### D3 : Agent `planning` conservé avec rôle restreint

L'agent `planning` est retenu — mais avec un rôle nettement plus étroit que prévu initialement.

**Ce qu'il fait** : fallback léger pour les requêtes genuinement ambiguës. Compresse l'intention utilisateur en un brief structuré écrit sur le disque (`docs/exec-plans/<feature>.md`). Identifie les décisions à prendre avant d'agir.

**Ce qu'il ne fait pas** : pas de PRD, pas de user stories, pas de requirements gathering, pas d'activation automatique à chaque session.

**Critère d'activation strict** : la requête est ambiguë ET l'environnement ne clarifie pas AND une question directe à l'utilisateur ne suffirait pas.

Un brief en mémoire est un anti-pattern (invisible aux agents futurs). L'artefact va sur le disque.

Spec : [specs/planning-agent.md](specs/planning-agent.md)

---

### D4 : Abandon de `memory.md`

`memory.md` est un mécanisme de compensation. Il existe parce que l'environnement est mal structuré — les agents ne savent pas où chercher le contexte projet, donc on leur injecte un blob de connaissance à chaque appel LLM.

Si l'agent `harness` fait son travail (`AGENTS.md` précis, `docs/` navigable, conventions encodées dans le tooling), `memory.md` devient redondant. Le contexte est dans le dépôt, navigable par référence, pas en mémoire persistante.

**Conséquence** : les hooks `experimental.session.compacting` et `experimental.chat.system.transform` (qui injectent `memory.md`) sont des dettes techniques à terme. Ils restent en place pendant la transition mais ne sont pas le modèle cible.

---

### D5 : Principes directeurs (harness engineering)

→ Voir [ADR-001](adr/001-harness-engineering.md) pour la liste complète.

En résumé : contraintes mécaniques > documentées, < 1 300 tokens/unité, carte > manuel, tout sur le disque.

---

## Ce qu'on ne va PAS faire

- **Pas de personas** (Marie la PM, Jean l'architecte) — scaffolding humain, pas fonctionnel pour les agents
- **Pas de phase gates** manuelles — l'enforcement est mécanique ou il n'est pas
- **Pas de PRDs monolithiques** — artefacts longs optimisés pour l'approbation humaine
- **Pas de `memory.md` comme mécanisme principal** — compensation temporaire, pas destination
- **Pas d'activation automatique du `planning` à chaque session** — friction inutile sur les requêtes claires
- **Pas de requirements gathering via agent** — si l'environnement est bien structuré, c'est superflu
