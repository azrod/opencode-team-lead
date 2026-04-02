# Spec : Agent `analyst`

> **Statut : Abandonné** — voir [decisions.md](../decisions.md#d1--abandon-de-lapproche-bmad)

## Pourquoi cette spec est archivée

L'agent `analyst` avait été conçu pour aider les utilisateurs à structurer leur pensée avant l'implémentation : brainstorming, exploration divergente, puis production d'artefacts (brief, requirements, index).

Après analyse approfondie, on a conclu que c'est de la pensée SDLC appliquée aux agents. La cérémonie de discovery (phases Mary/John, PRDs, user stories) existe pour résoudre des problèmes de coordination humaine — perte de contexte entre réunions, silos organisationnels. Les agents n'ont pas ces modes de défaillance.

Produire plus de documents n'est pas la bonne réponse. La bonne réponse est de construire un environnement dans lequel les agents peuvent opérer sans cérémonie : un `AGENTS.md` précis, des contraintes mécaniques, des artefacts navigables. Si l'environnement est bien structuré, l'analyst est superflu.

## Ce qui le remplace

L'agent `harness` — voir [harness-agent.md](harness-agent.md)
