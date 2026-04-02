# ADR-001 : Harness engineering comme approche de développement agentique

**Date :** 2026-03-31  
**Statut :** Adopté

## Décision

Les artefacts de ce projet sont conçus pour la navigation par agent, pas pour l'approbation humaine.

## Contexte

Les approches SDLC (phases, personas, PRDs exhaustifs) ont été conçues pour des problèmes de coordination humaine. Les agents n'ont pas ces problèmes. Appliquer SDLC aux agents produit : context crowding, non-guidance, instant rot, unverifiable constraints.

## Principes adoptés

1. **Carte > manuel** — chaque doc est un index avec des liens, pas un guide exhaustif
2. **< 1 300 tokens par unité** — au-delà, c'est du context rot
3. **Contraintes mécaniques > contraintes documentées** — lint rules et CI, pas des phrases dans un doc
4. **Sur le disque, navigable** — tout contexte qu'un agent futur doit connaître doit être dans le dépôt sous forme de fichiers atomiques

## Conséquences

- `docs/background/` pour les docs narratifs humains (exclus de la navigation agentique)
- `docs/templates/` pour les templates de nouveaux fichiers
- Chaque spec doit passer sous les 1 300 tokens, pointer vers le détail plutôt que le contenir
- Les duplications de contenu sont remplacées par des liens

## Référence

[Analyse complète](../background/whitepaper-sdlc-vs-harness.md) (humain, ~3 750 tokens)
