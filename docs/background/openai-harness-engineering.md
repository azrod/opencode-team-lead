---
source: OpenAI
url: https://openai.com/fr-FR/index/harness-engineering/
author: Ryan Lopopolo
date: 2026-02-11
fetched: 2026-04-01
---

# Harness engineering: exploiter Codex à l'ère des agents

*Par Ryan Lopopolo, membre de l'équipe technique*

Au cours des cinq derniers mois, notre équipe a mené une expérience : développer et livrer une version bêta interne d'un logiciel **sans aucune ligne de code écrite manuellement.**

Le produit a des utilisateurs quotidiens internes et des testeurs alpha externes. Il est expédié, déployé, cassé, et réparé. La différence réside dans le fait que chaque ligne de code (logique d'application, tests, configuration CI, documentation, observabilité et outils internes) a été écrite par Codex. Nous estimons avoir réalisé cette tâche en environ un dixième du temps qu'il aurait fallu pour écrire le code à la main.

**Les humains pilotent. Les agents exécutent.**

Nous avons délibérément choisi cette contrainte afin de développer ce qui était nécessaire pour accélérer considérablement la vitesse d'ingénierie. Nous avons eu quelques semaines pour livrer ce qui s'est avéré être un million de lignes de code. Pour ce faire, nous devions comprendre ce qui change lorsque la tâche principale d'une équipe d'ingénieurs logiciels n'est plus d'écrire du code, mais de concevoir des environnements, de préciser les intentions et de créer des boucles de feedback qui permettent aux agents Codex de travailler efficacement.

Cet article traite des enseignements que nous avons tirés de la création d'un tout nouveau produit avec une équipe d'agents : ce qui a échoué, ce qui a fonctionné et comment optimiser notre ressource la plus précieuse : le temps et l'attention des personnes.

## Nous avons commencé avec un dépôt Git vide.

Le premier commit dans un dépôt vide a été effectué fin août 2025.

Le squelette initial (structure du dépôt, configuration CI, règles de formatage, configuration du gestionnaire de paquets et framework d'application) a été généré par Codex CLI à l'aide de GPT-5, en s'appuyant sur un petit ensemble de modèles existants. Même le fichier AGENTS.md initial, qui indique aux agents comment fonctionner dans le référentiel, a été rédigé par Codex.

Il n'existait aucun code écrit par l'homme pour servir de base au système. Dès le début, le dépôt a été façonné par l'agent.

Cinq mois plus tard, le dépôt contient environ un million de lignes de code réparties entre la logique d'application, l'infrastructure, les outils, la documentation et les utilitaires internes destinés aux développeurs. Au cours de cette période, environ 1 500 pull requests ont été ouvertes et fusionnées par une petite équipe de seulement trois ingénieurs chargés de Codex. Cela correspond à un débit moyen de 3,5 PRs par ingénieur et par jour. Il est intéressant de noter que ce débit a *augmenté* à mesure que l'équipe s'est élargie pour compter désormais sept ingénieurs. Il est important de souligner que ce n'était pas une production purement quantitative : le produit a été utilisé par des centaines d'utilisateurs en interne, y compris des utilisateurs expérimentés au quotidien.

Tout au long du processus de développement, aucun être humain n'a directement contribué au code. Cela est devenu une philosophie fondamentale pour l'équipe : **aucun code écrit manuellement**.

## Redéfinir le rôle de l'ingénieur

L'absence de codage manuel par des humains **a introduit un autre type de travail d'ingénierie, axé sur les systèmes, les infrastructures et les effets de levier**.

Les progrès initiaux ont été plus lents que prévu, non pas en raison d'une incapacité de Codex, mais plutôt en raison d'un manque de spécifications de l'environnement. L'agent ne disposait pas des outils, des abstractions et de la structure interne nécessaires pour atteindre des objectifs hautement ambitieux. La tâche principale de notre équipe d'ingénieurs est devenue de permettre aux agents d'effectuer un travail utile.

Dans la pratique, cela impliquait de travailler de manière approfondie : décomposer les objectifs plus importants en éléments constitutifs plus petits (conception, code, révision, test, etc.), inciter l'agent à créer ces éléments et les utiliser pour accomplir des tâches plus complexes. Lorsqu'un élément échouait, la solution n'était presque jamais de « redoubler d'efforts ». Étant donné que la seule façon de progresser était de faire en sorte que Codex effectue le travail, les ingénieurs humains intervenaient toujours à ce stade et se demandaient : « Quelle capacité manque-t-il et comment la rendre compréhensible et applicable pour l'agent ? »

Les humains interagissent avec le système presque exclusivement par le biais de prompts : un ingénieur décrit une tâche, exécute l'agent et lui permet d'ouvrir une pull request. Pour mener à bien une requête d'extraction (PR), nous demandons à Codex d'examiner ses propres modifications localement, de demander des analyses supplémentaires spécifiques à l'agent à la fois localement et dans le cloud, de répondre à tout feedback formulé par un humain ou un agent, et de répéter ces étapes jusqu'à ce que tous les agents chargés de l'analyse soient satisfaits (il s'agit en fait d'une boucle Ralph Wiggum). Codex utilise directement nos outils de développement standard (gh, scripts locaux et compétences intégrées au dépôt) pour saisir le contexte sans que les humains aient à copier-coller dans l'interface CLI.

Les humains peuvent examiner les pull requests, mais ne sont pas obligés de le faire. Au fil du temps, nous avons dirigé presque tous les efforts de révision vers un traitement d'agent à agent.

## Meilleure lisibilité des applications

À mesure que le débit de code augmentait, notre goulot d'étranglement est devenu la capacité humaine en matière d'assurance qualité. Étant donné que la contrainte constante était le temps et l'attention consacrés par les humains, nous avons travaillé à ajouter davantage de capacités à l'agent en rendant directement lisibles par Codex des éléments tels que l'interface utilisateur de l'application, les journaux et les indicateurs de l'application elles-mêmes.

Par exemple, nous avons rendu l'application amorçable par worktree git, afin que Codex puisse lancer et gérer une instance par modification. Nous avons également intégré le protocole Chrome DevTools dans l'environnement d'exécution de l'agent et créé des compétences pour traiter les instantanés DOM, les captures d'écran et la navigation. Cela a permis à Codex de reproduire des bugs, de valider des correctifs et d'analyser directement le comportement de l'interface utilisateur.

Nous avons fait de même pour les outils d'observabilité. Les journaux, les indicateurs et les traces sont exposés à Codex via une pile d'observabilité locale qui est éphémère pour tout worktree donné. Codex fonctionne sur une version entièrement isolée de cette application, y compris ses journaux et ses indicateurs, qui sont supprimés une fois la tâche terminée. Les agents peuvent interroger les journaux avec LogQL et les indicateurs avec PromQL. Dans ce contexte, des prompts telles que « s'assurer que le démarrage du service s'effectue en moins de 800 ms » ou « aucun intervalle dans ces quatre parcours utilisateur critiques ne dépasse deux secondes » deviennent gérables.

Nous observons régulièrement des exécutions uniques de Codex consacrées à une seule tâche pendant plus de six heures (souvent pendant que les humains dorment).

## Nous avons fait de la connaissance du dépôt le système de référence

La gestion du contexte représente l'un des principaux défis pour rendre les agents efficaces dans le cadre de tâches complexes et de grande envergure. L'une des premières leçons que nous avons apprises était simple : **il est préférable de fournir à Codex une carte plutôt qu'un manuel d'instructions de 1 000 pages.**

Nous avons essayé l'approche « one big AGENTS.md ». Cela a échoué, comme on pouvait s'y attendre :

- **Le contexte est une ressource précieuse.** Un fichier d'instructions volumineux prend le pas sur la tâche, le code et les documents pertinents, de sorte que l'agent passe à côté de contraintes essentielles ou commence à optimiser les mauvaises.
- **Trop de conseils finissent par ***perdre leur utilité***.** Quand tout est « important », plus rien ne l'est. Les agents finissent par comparer localement les modèles au lieu de naviguer de manière intentionnelle.
- **C'est un échec immédiat.** Un manuel monolithique se transforme en un ensemble de règles obsolètes. Les agents ne peuvent pas déterminer ce qui est encore valable, les humains cessent de le mettre à jour et le fichier devient progressivement une nuisance.
- **Il est difficile de vérifier.** Un seul bloc ne se prête pas aux contrôles mécaniques (couverture, actualité, propriété, liens croisés), de sorte que la dérive est inévitable.

Donc, au lieu de traiter `AGENTS.md` comme une encyclopédie, nous le traitons comme **la table des matières**.

La base de connaissances du dépôt réside dans un répertoire structuré `docs/`, considéré comme le système de référence. Un fichier `AGENTS.md` court (environ 100 lignes) est intégré au contexte et sert principalement de carte, avec des références vers des sources d'informations plus détaillées ailleurs.

Structure du dépôt de connaissances interne :

```
AGENTS.md
ARCHITECTURE.md
docs/
├── design-docs/
│   ├── index.md
│   ├── core-beliefs.md
│   └── ...
├── exec-plans/
│   ├── active/
│   ├── completed/
│   └── tech-debt-tracker.md
├── generated/
│   └── db-schema.md
├── product-specs/
│   ├── index.md
│   ├── new-user-onboarding.md
│   └── ...
├── references/
│   ├── design-system-reference-llms.txt
│   ├── nixpacks-llms.txt
│   ├── uv-llms.txt
│   └── ...
├── DESIGN.md
├── FRONTEND.md
├── PLANS.md
├── PRODUCT_SENSE.md
├── QUALITY_SCORE.md
├── RELIABILITY.md
└── SECURITY.md
```

La documentation relative à la conception est cataloguée et indexée, y compris le statut de vérification et un ensemble de principes fondamentaux qui définissent les principes opérationnels axés sur les agents. La documentation relative à l'architecture fournit une carte de haut niveau des domaines et de la hiérarchisation des paquets. Un document de qualité évalue chaque domaine de produit et chaque couche architecturale, en suivant les disparités au fil du temps.

Les plans sont considérés comme des artefacts de premier ordre. Les plans simples et éphémères sont utilisés pour les modifications mineures, tandis que les tâches complexes sont consignées dans des plans d'exécution accompagnés de journaux de progression et de décision qui sont enregistrés dans le dépôt. Les plans actifs, les plans terminés et les dettes techniques connues sont tous sous forme de scripts et regroupés, ce qui permet aux agents de fonctionner sans dépendre d'un contexte externe.

Cela permet une **divulgation progressive** : les agents commencent par un point d'entrée restreint et stable, et on leur indique où chercher ensuite, plutôt que de les submerger dès le départ.

Nous appliquons cette règle de manière systématique. Des linters dédiés et des tâches d'intégration continue (CI) permettent de vérifier que la base de connaissances est à jour, interconnectée et correctement structurée. Un agent de « doc-gardening » récurrent recherche les documents obsolètes qui ne reflètent pas le comportement réel du code et ouvre des pull requests pour y remédier.

## La lisibilité de l'agent est l'objectif principal.

À mesure que le code évoluait, le cadre de Codex pour les décisions de conception devait également évoluer.

Étant donné que le dépôt est entièrement généré par des agents, il est d'abord optimisé pour la *lisibilité* de *Codex*. De la même manière que les équipes cherchent à améliorer la navigabilité de leur code pour les nouveaux ingénieurs recrutés, l'objectif de nos ingénieurs humains était de permettre à un agent de raisonner sur l'ensemble du domaine d'activité **directement à partir du dépôt lui-même**.

Du point de vue de l'agent, tout ce à quoi il ne peut accéder en contexte pendant son exécution n'existe pas. Les connaissances présentes dans Google Docs, les fils de discussion ou dans l'esprit des gens ne sont pas accessibles au système. Il ne peut visualiser que les artefacts stockés sous forme de scripts dans le dépôt (par exemple, le code, markdown, les schémas, les plans exécutables).

Nous avons compris qu'il était nécessaire d'intégrer progressivement davantage de contexte dans le dépôt. Cette discussion sur Slack qui a permis à l'équipe de s'accorder sur un modèle architectural ? Si elle n'est pas accessible à l'agent, elle est illisible, tout comme elle serait inconnue d'un nouvel employé qui rejoindrait l'équipe trois mois plus tard.

Fournir davantage de contexte à Codex implique d'organiser et d'exposer les informations pertinentes afin que l'agent puisse les analyser, plutôt que de le submerger d'instructions ad hoc. De la même manière que vous formeriez un nouveau collègue aux principes du produit, aux normes d'ingénierie et à la culture d'équipe (préférences en matière d'émojis incluses), fournir ces informations à l'agent permet d'obtenir des résultats plus cohérents.

Ce cadre a permis de clarifier de nombreux compromis. Nous avons privilégié des dépendances et des abstractions qui pouvaient être entièrement intégrées et comprises dans le dépôt. Les technologies souvent qualifiées d'« ennuyeuses » ont tendance à être plus faciles à modéliser pour les agents en raison de leur modularité, de la stabilité de leurs API et de leur représentation dans l'ensemble d'apprentissage. Dans certains cas, il était plus économique de demander à l'agent de réimplémenter des sous-ensembles de fonctionnalités plutôt que de contourner le comportement peu clair des bibliothèques publiques en amont. Par exemple, plutôt que d'intégrer un package générique de type `p-limit`, nous avons implémenté notre propre aide à la cartographie avec concurrence : elle est étroitement intégrée à notre instrumentation OpenTelemetry, bénéficie d'une couverture de test à 100 % et se comporte exactement comme notre environnement d'exécution le prévoit.

Le fait de mettre davantage le système sous une forme que l'agent peut inspecter, valider et modifier directement augmente l'effet de levier, non seulement pour Codex, mais aussi pour d'autres agents qui travaillent également sur la base de code.

## Imposer l'architecture et l'esthétique

La documentation seule ne suffit pas à maintenir la cohérence d'une base de code entièrement générée par des agents. **En appliquant des contraintes invariantes, sans microgérer les implémentations, nous permettons aux agents de livrer rapidement sans compromettre les bases.** Par exemple, nous exigeons que Codex analyse les formes de données aux limites, mais nous ne donnons aucune directive sur la manière dont cela doit se faire (le modèle semble apprécier Zod, mais nous n'avons pas spécifié cette bibliothèque en particulier).

Les agents sont particulièrement efficaces dans des environnements aux limites strictes et à la structure prévisible, c'est pourquoi nous avons conçu l'application autour d'un modèle architectural rigide. Chaque domaine d'activité est divisé en un ensemble fixe de couches, avec des dépendances strictement validées et un ensemble limité de connexions autorisées. Ces contraintes sont appliquées mécaniquement via des linters personnalisés (générés par Codex, bien sûr !) et des tests structurels.

L'architecture de domaine en couches fonctionne comme suit : au sein de chaque domaine d'activité (par exemple, Paramètres de l'application), le code ne peut détenir de dépendances « en aval » que par le biais d'un ensemble fixe de couches (Types → Config → Dépôt → Service → Exécution → IU). Les préoccupations croisées (authentification, connecteurs, télémétrie, indicateurs de fonctionnalités) sont intégrées via une interface explicite unique : les fournisseurs. Tout autre élément est interdit et appliqué automatiquement.

Il s'agit du type d'architecture que l'on a tendance à différer jusqu'à ce que l'on dispose de plusieurs centaines d'ingénieurs. Avec les agents de codage, c'est une condition préalable essentielle : les contraintes sont nécessaires pour garantir la rapidité sans perte de qualité ni dérive architecturale.

Dans la pratique, nous appliquons ces règles à l'aide de linters personnalisés et de tests structurels, ainsi que d'un petit ensemble d'« invariants de goût ». Par exemple, nous appliquons de manière statique la journalisation structurée, les conventions de nommage pour les schémas et les types, les limites de taille des fichiers et les exigences de fiabilité spécifiques à la plateforme à l'aide de linters personnalisés. Les linters étant personnalisés, nous rédigeons les messages d'erreur afin d'injecter des instructions de correction dans le contexte de l'agent.

Dans un processus axé sur l'humain, ces règles peuvent sembler pointilleuses ou contraignantes. Avec les agents, elles deviennent des catalyseurs : une fois codées, elles s'appliquent instantanément partout.

Parallèlement, nous indiquons clairement quand les contraintes sont importantes et quand elles ne le sont pas. Cela s'apparente à la gestion d'une grande organisation de plateformes d'ingénierie : appliquer les limites de manière centralisée, autoriser l'autonomie au niveau local.

Le code résultant ne correspond pas toujours aux préférences stylistiques humaines, et cela est tout à fait acceptable. Tant que le résultat est correct, évolutif et lisible pour les futurs agents, il répond aux exigences.

Les préférences humaines sont continuellement intégrées au système. Les commentaires, les pull requests de refonte et les bugs signalés par les utilisateurs sont pris en compte sous forme de mises à jour de la documentation ou directement intégrés dans les outils. Lorsque la documentation est insuffisante, nous intégrons la règle dans le code.

## Le débit modifie la philosophie de fusion

À mesure que le débit de Codex augmentait, de nombreuses normes d'ingénierie conventionnelles sont devenues contre-productives.

Le dépôt fonctionne avec un nombre minimal de blocs de fusion. Les pull requests sont éphémères. Les problèmes de test sont souvent résolus par des exécutions de suivi plutôt que par un blocage prolongé. Dans un système où le débit des agents dépasse largement l'attention humaine, les corrections sont peu coûteuses, mais l'attente l'est beaucoup plus.

Cela serait inapproprié dans un environnement à faible débit. Ici, c'est souvent le bon compromis.

## Que signifie réellement « généré par un agent » ?

Lorsque nous affirmons que le code source est généré par les agents Codex, nous faisons référence à l'ensemble du code source.

Les agents produisent :

- Le code produit et les tests
- La configuration CI et les outils de déploiement
- Les outils internes pour développeurs
- La documentation et l'historique de la conception
- Des harnais d'évaluation
- Des commentaires et réponses aux avis
- Des scripts qui gèrent le dépôt lui-même
- Des fichiers de définition du tableau de bord de production

Les humains restent toujours impliqués, mais travaillent à un niveau d'abstraction différent de celui auquel nous étions habitués. Nous établissons des priorités dans le travail, traduisons le feedback des utilisateurs en critères d'acceptation et validons les résultats. Lorsque l'agent rencontre des difficultés, nous considérons cela comme un signal : nous identifions ce qui manque (outils, garde-fous, documentation) et le réinjectons dans le dépôt, en laissant toujours Codex écrire lui-même le correctif.

Les agents utilisent directement nos outils de développement standard. Ils exploitent les commentaires de révision, répondent en ligne, effectuent des mises à jour et, souvent, fusionnent leurs propres pull requests.

## Niveaux croissants d'autonomie

À mesure que davantage d'étapes du cycle de développement ont été intégrées directement dans le système (tests, validation, révision, gestion des commentaires et récupération), le dépôt a récemment franchi une étape significative permettant à Codex de gérer une nouvelle fonctionnalité de bout en bout.

Avec un seul prompt, l'agent peut désormais :

- Valider l'état actuel de la base de code
- Reproduire un bug signalé
- Générer une vidéo illustrant le dysfonctionnement
- Mettre en œuvre un correctif
- Vérifier le correctif en testant l'application
- Générer une deuxième vidéo illustrant la résolution
- Ouvrir une pull request
- Répondre au feedback des agents et des personnes
- Détecter et remédier aux échecs de build
- Recourir à un humain uniquement lorsqu'un jugement est nécessaire
- Fusionner la modification

Ce comportement dépend fortement de la structure et des outils spécifiques de ce dépôt et ne doit pas être généralisé sans un investissement similaire, du moins pas encore.

## Entropie et collecte des déchets

**L'autonomie totale des agents soulève également de nouveaux problèmes.** Codex reproduit les modèles qui existent déjà dans le dépôt, même ceux qui sont imparfaits ou sous-optimaux. Avec le temps, cela mène inévitablement à une dérive.

Au départ, les humains s'occupaient de cela manuellement. Notre équipe passait auparavant tous les vendredis (20 % de la semaine) à nettoyer les « déchets de l'IA ». Sans surprise, cela n'était pas évolutif.

Au lieu de cela, nous avons commencé à intégrer ce que nous appelons les « principes directeurs » directement dans le dépôt et avons mis en place un processus récurrent de nettoyage. Ces principes sont des règles mécaniques, assumées, qui maintiennent la base de code lisible et cohérente pour les prochaines exécutions de l'agent. Par exemple : (1) nous privilégions des packages utilitaires partagés plutôt que des helpers faits maison, afin de centraliser les invariants ; et (2) nous n'explorons pas les données de manière aléatoire : nous vérifions les limites ou nous nous appuyons sur des SDK types, pour éviter que l'agent construise par erreur sur des structures supposées. À intervalles réguliers, nous effectuons une série de tâches Codex en arrière-plan qui détectent les écarts, mettent à jour les scores de qualité et ouvrent des pull requests de refactorisation ciblées. La plupart peuvent être examinées en moins d'une minute, puis fusionnées automatiquement.

Cela fonctionne comme le ramassage des ordures. La dette technique est comparable à un prêt à taux d'intérêt élevé : il est presque toujours préférable de la rembourser progressivement par petits versements plutôt que de la laisser s'accumuler et de devoir ensuite la rembourser en une seule fois, ce qui peut être pénible. Les préférences humaines sont définies une seule fois, puis appliquées de manière cohérente à chaque ligne de code. Cela nous permet également de détecter et de résoudre quotidiennement les mauvaises pratiques, plutôt que de les laisser se propager dans le code pendant des jours ou des semaines.

## Ce que nous continuons d'apprendre

Jusqu'à présent, cette stratégie a bien fonctionné jusqu'au lancement interne et à son adoption chez OpenAI. La création d'un vrai produit pour de vrais utilisateurs nous a aidés à ancrer nos investissements dans la réalité et nous a guidés vers une évolutivité à long terme.

Ce que nous ignorons encore, c'est comment la cohérence architecturale évolue au fil des années dans un système entièrement généré par des agents. Nous continuons d'apprendre où le jugement humain apporte le plus de valeur ajoutée et comment codifier ce jugement afin qu'il puisse se cumuler. Nous ne savons pas non plus comment ce système évoluera à mesure que les modèles deviendront plus performants au fil du temps.

Ce qui est désormais clair, c'est que la création de logiciels exige toujours de la rigueur, mais celle-ci se manifeste davantage dans l'architecture que dans le code. Les outils, les abstractions et les boucles de feedback qui assurent la cohérence du code source revêtent une importance croissante.

**Nos défis les plus complexes consistent désormais à concevoir des environnements, des boucles de feedback et des systèmes de contrôle** qui aident les agents à atteindre notre objectif : développer et gérer des logiciels complexes et fiables à grande échelle.

À mesure que des agents tels que Codex prennent en charge une part plus importante du cycle de vie des logiciels, ces questions deviendront encore plus pertinentes.

---

*Remerciements particuliers à Victor Zhu et Zach Brock pour leur contribution à cet article, ainsi qu'à l'ensemble de l'équipe qui a développé ce nouveau produit.*
