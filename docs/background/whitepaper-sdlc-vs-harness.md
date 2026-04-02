# Deux modèles de développement assisté par IA : transplant SDLC vs. harness engineering

## Le problème d'une méthodologie importée

Le SDLC n'a pas été conçu pour le logiciel. Il a été conçu pour la coordination. Les jalons de phase, les artefacts de transfert, les rituels de validation — ces mécanismes existent parce que les humains oublient des choses entre deux réunions, se comprennent mal entre départements, et quittent l'organisation avant que le projet soit livré. L'artefact est un proxy de confiance : un document qu'une personne signe pour qu'une autre puisse reprendre le fil sans perdre le contexte que son prédécesseur gardait en tête.

BMAD applique cette logique aux agents IA. Il assigne des personas (Marie la PM, Jean l'architecte, Robert le développeur), définit des séquences de phases, et produit des artefacts — PRD, document d'architecture, fichiers de stories — que les agents sont censés lire, assimiler et exécuter. L'intuition est reconnaissable : la structure prévient la dérive, et les erreurs en amont coûtent moins cher que celles en aval.

L'intuition est juste. Le mécanisme est faux.

## Pourquoi la cérémonie SDLC existe — et pourquoi ça compte

La cérémonie SDLC est structurellement nécessaire pour les équipes humaines précisément à cause des modes de défaillance humains. Les humains perdent le contexte avec le temps. Les humains travaillant dans des départements différents ne partagent pas le même modèle mental. Les humains quittent les organisations. Le PRD existe pour que la PM puisse transmettre son intention à l'architecte sans une semaine de réunions. La revue d'architecture existe pour qu'un lead technique puisse vérifier si les décisions de l'architecte sont compatibles avec des contraintes que la PM ignorait. La story de sprint existe pour qu'un développeur arrivé le mois dernier comprenne ce qu'il faut construire sans lire 200 pages de contexte antérieur.

Supprimez le problème de coordination, et la cérémonie devient de la surcharge.

Les agents IA ne perdent pas le contexte comme le font les humains au cours d'une session. Ils n'ont pas de silos organisationnels. Ils peuvent tenir la structure d'une base de code entière dans leur contexte de travail simultanément. Les modes de défaillance de coordination que le SDLC a été conçu pour prévenir ne sont pas les modes de défaillance primaires du développement logiciel agentique. BMAD résout le mauvais problème.

## Les personas sont de la psychologie, pas de l'architecture

Marie, Jean et Robert sont des échafaudages pour les humains. Ils créent la sécurité psychologique de rôles familiers : « quand tu es en mode PM, pense comme un chef de produit. » C'est genuinement utile quand l'opérateur humain a besoin d'un cadre mental pour savoir quel type de raisonnement appliquer. Ça reflète la façon dont les humains changent naturellement de mode cognitif.

Pour les agents, ce cadrage ne fait rien mécaniquement. L'agent ne bénéficie pas qu'on lui dise de « penser comme un architecte ». Ce dont il bénéficie, c'est d'avoir une spécification précise des décisions à prendre, des contraintes applicables, et des critères d'acceptance. Le persona est une heuristique humaine déguisée en architecture d'agent. Ce n'est pas fonctionnel.

## Le problème des artefacts

Un PRD de 200 lignes qu'une PM trouve satisfaisant présente exactement les modes de défaillance identifiés dans les recherches sur les instructions d'agents en long contexte. Il encombre le contexte de travail. Il contient des non-directives — des sections narratives qui se lisent bien mais ne contiennent aucune contrainte actionnable. Il se dégrade dès le deuxième jour, quand la première décision d'implémentation diverge de ses hypothèses et que personne ne met le document à jour. Et il est invérifiable : il n'existe aucune vérification mécanique que le système en production satisfait ce que le PRD décrit.

Le format est optimisé pour le mauvais consommateur. Un document conçu pour obtenir l'approbation humaine — narratif, complet, lisable de haut en bas — est l'opposé de ce dont un agent a besoin pour naviguer efficacement. L'agent n'a pas besoin de la prose. Il a besoin de l'index, des contraintes, des références croisées, et des critères d'acceptance exprimés sous une forme qu'un job CI peut évaluer.

Les jalons de phase aggravent les choses. Une revue humaine donne à l'équipe un moment réconfortant de contrôle apparent : « on a vérifié avant de passer à la suite. » Mais le jalon n'impose rien mécaniquement. Il repose sur la discipline du relecteur, l'exactitude de sa revue, et la fidélité de l'artefact au comportement réel du système. Avec des agents tournant à débit machine — générant, modifiant et déployant à des vitesses qu'aucun rythme de revue humain ne peut suivre — le jalon devient soit un goulot d'étranglement qui ralentit l'agent au rythme humain, soit il est purement contourné.

```
SDLC / BMAD                          Harness engineering

Humain → [PRD] → Agent               Agent
           ↓                          ├── lit plan.md
         Jalon ← revue humaine        ├── navigue vers spec/auth.md
           ↓                          ├── code → commit → CI ✓
         Agent → [Artefact] →         └── met à jour plan.md
           ↓                               ↓
         Jalon ← revue humaine         Agent redémarré
           ↓                           └── reprend depuis plan.md
         Agent → implémentation

Rythme : humain                      Rythme : machine
```

## Harness engineering : le dépôt comme seule source de vérité

L'orientation alternative part d'un axiome différent : le dépôt est le seul artefact épistémiquement fiable. La connaissance qui vit dans des fils Slack, des notes de réunion, ou la mémoire de travail d'un agent est invisible pour un nouvel agent, pour un relecteur de code, pour un humain qui revient sur le projet après trois mois. Si ce n'est pas dans le dépôt, ça n'existe pas du point de vue du système.

Ça recadre ce à quoi servent les artefacts de planification. Ce ne sont pas des enregistrements de décisions humaines que les agents doivent lire et respecter. Ce sont des structures de navigation que les agents utilisent pour s'orienter et récupérer leur état après une interruption.

Les implications sont concrètes. Un document de planification optimisé pour les agents est court — moins de 1 300 tokens par unité, un seuil qui le maintient dans une attention efficace sans encombrer le reste du contexte. Il est indexé, avec des références croisées explicites vers les sous-artefacts qu'il coordonne. Il est modulaire, pour que des sections individuelles puissent être mises à jour atomiquement sans invalider l'ensemble. Et c'est une carte, pas une spécification : il pointe vers où vit le détail, plutôt que de contenir le détail lui-même.

C'est la divulgation progressive appliquée à la structure de projet. Un nouvel agent (ou un agent redémarré, ou un humain qui revient après des mois) part de la carte, navigue vers le sous-artefact pertinent, et obtient exactement le contexte dont il a besoin pour la tâche immédiate. L'alternative — un blob de spécification exhaustif — force l'agent à tout traiter pour trouver quoi que ce soit.

```
Blob monolithique                    Structure indexée

┌────────────────────────┐           plan.md  (<1300 tokens)
│  PRD (2000 lignes)     │            ├── → spec/auth.md
│  - contexte métier     │            ├── → spec/api.md
│  - personas            │            ├── → decisions/2024-01.md
│  - contraintes tech    │            └── → tasks/current.md
│  - stories             │
│  - critères d'acceptance│          Chaque fichier : une unité,
│  - notes de réunion    │          un sujet, récupérable seul
└────────────────────────┘
         ↓                                    ↓
  Agent lit tout                    Agent lit plan.md
  pour trouver une info              → saute au bon fichier
```

## Enforcement mécanique plutôt que revue humaine

Le changement le plus important est celui des contraintes documentées aux contraintes imposées.

Le harness engineering encode les invariants architecturaux dans des linters et des jobs CI. Une règle qui dit « ce module ne doit pas importer depuis cette couche » est soit exprimée comme une règle de lint qui échoue à la violation, soit c'est une préférence qui sera violée dès qu'un agent le trouvera commode. L'exprimer comme une phrase dans un document d'architecture revient à la laisser non-imposée.

```
Contrainte dans un document          Contrainte dans un CI job

doc/architecture.md                  .eslintrc / ci.yml
  "Le module A ne doit pas             rule: no-import A→B
   importer depuis B"
         ↓                                    ↓
  Agent lit (peut-être)               git push
  Agent oublie                               ↓
  Agent viole la règle               CI run → FAIL ✗
  Personne ne le voit                Agent ne peut pas merger
```

Ce n'est pas une critique de la documentation. C'est un constat sur la différence entre connaissance et enforcement. Une contrainte qui n'existe que dans un document est de la documentation. Une contrainte qui existe dans un job CI est de l'architecture. La première peut être ignorée, oubliée, ou contredite par le système sans que personne s'en aperçoive. La seconde ne peut pas être violée sans que le pipeline échoue.

Les plans d'exécution suivent la même logique. L'état d'exécution d'un agent — ce qui a été fait, quelles décisions ont été prises et pourquoi, ce qui vient ensuite — vit dans le dépôt sous la forme d'un document commité avec un journal de progression et un registre de décisions. Quand un agent est tué et redémarré (parce que le contexte a débordé, parce que la session a expirée, parce que l'humain a interrompu), il lit le plan d'exécution et sait exactement où il en est. Il ne re-dérive pas l'état à partir d'une archéologie de code. Le plan est le mécanisme de continuité.

## Exécution en profondeur d'abord et design émergent

La spécification frontale est une autre héritage du SDLC qui mérite examen. L'hypothèse est qu'une conception plus approfondie en amont réduit le travail de reprise en aval. C'est empiriquement vrai pour les équipes humaines travaillant en waterfall, où le coût de changer de cap après les transferts est élevé. C'est moins clairement vrai pour des agents opérant dans des boucles d'itération serrées avec un feedback rapide.

Le harness engineering favorise l'exécution en profondeur d'abord : construire le premier bloc complètement, vérifier qu'il fonctirait, et utiliser ce qu'on apprend pour éclairer le suivant. Les spécifications écrites avant l'implémentation sont nécessairement sous-spécifiées là où ça compte le plus — les contraintes qui ne deviennent visibles que quand on essaie de construire la chose. Découvrir le design par l'implémentation, avec la discipline d'enregistrer les décisions au fur et à mesure, produit des contraintes plus précises qu'une spéculation exhaustive en amont.

Ce n'est pas un argument contre la planification. C'est un argument sur ce à quoi servent les plans. Un plan qui front-charge chaque décision à l'avance essaie d'éliminer l'incertitude par la documentation. Un plan qui fournit une structure de navigation tout en restant ouvert aux contraintes émergentes essaie de gérer l'incertitude par des boucles de feedback.

## Le compromis fondamental

Le SDLC et BMAD optimisent pour la lisibilité humaine et la supervision. Ils produisent des artefacts que les humains peuvent lire, approuver, et qui leur donnent confiance. Le workflow produit des points de contrôle visibles où une personne en autorité peut vérifier que le projet est sur la bonne voie. C'est genuinement précieux dans les contextes où la supervision humaine est le mécanisme de qualité principal.

Le harness engineering optimise pour l'efficacité des agents et l'autonomie longue durée. Elle produit des environnements que les agents peuvent naviguer sans intervention humaine, avec un enforcement mécanique de la correction plutôt qu'une dépendance à la discipline de revue humaine. Le mécanisme de qualité est la vérification automatisée et les cycles de revue agent-à-agent, pas des jalons d'approbation séquentiels.

Ces deux objectifs produisent des artefacts différents, des workflows différents, et des définitions différentes de ce que signifie « qualité » à chaque phase de développement.

Le bon choix dépend de ce qu'on optimise. Si la supervision humaine est le prérequis principal — industries réglementées, décisions à forts enjeux, organisations où un humain doit être responsable de chaque décision — alors la lisibilité humaine du SDLC est une fonctionnalité, pas de la surcharge. Si l'exécution autonome longue durée est l'objectif, alors les artefacts conçus pour l'approbation humaine sont de la friction.

## Ce qui change — et ce qui ne change pas

L'intuition centrale du SDLC reste valide : les mauvaises décisions coûtent moins cher à corriger tôt que tard. Construire la mauvaise chose avec des agents IA reste coûteux. La boucle de feedback entre les exigences métier et l'implémentation compte toujours.

Ce qui a changé, c'est le mécanisme pour détecter les mauvaises décisions. Les jalons de revue humaine sont lents et ne passent pas à l'échelle avec le débit des agents. L'équivalent fonctionnel pour le développement agentique est l'enforcement mécanique : des critères d'acceptance exécutables qu'une suite de tests peut évaluer, des contraintes architecturales qu'un linter peut vérifier, un état de progression qui vit dans le dépôt plutôt que dans la mémoire de quelqu'un.

BMAD est une méthodologie de transition. Elle fournit une structure qui aide les opérateurs humains à raisonner sur le développement assisté par agents avec des modèles mentaux familiers. Pour les équipes au début de cette transition, l'échafaudage familier a une vraie valeur. Ce n'est pas la destination. La destination, c'est un environnement de développement où la correction est imposée mécaniquement, où le contexte est navigable par référence plutôt que par lecture, et où les agents peuvent opérer pendant des périodes prolongées sans point de contrôle humain — parce que l'environnement lui-même fournit les garde-fous que les jalons de revue humaine approximaient.

La question qui vaut la peine d'être posée avant d'écrire le moindre artefact de planification : qui est le consommateur principal ? Un humain qui approuve, ou un agent qui navigue ? La réponse change tout sur ce que le document doit contenir et comment il doit être structuré. La plupart des artefacts SDLC répondent bien à la première question et pas du tout à la seconde.
