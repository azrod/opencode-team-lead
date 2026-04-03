# Spec : Cluster `review`

**Statut :** draft  
**Mis à jour :** 2026-04-02

## Résumé

Cluster de 4 agents qui analyse les changements selon trois dimensions orthogonales — conformité aux requirements, qualité du code, sécurité. Le `review-manager` orchestre, les trois reviewers spécialisés délèguent toute lecture via `task` et ne touchent jamais le code directement.

---

## Architecture du cluster

```
Orion
  └── review-manager          (orchestrateur — mode: subagent)
        ├── requirements-reviewer   (conformité fonctionnelle)
        ├── code-reviewer           (correctness, maintenabilité)
        └── security-reviewer       (menaces, vulnérabilités)
```

| Agent | Rôle | Spawné par |
|---|---|---|
| `review-manager` | Sélectionne les reviewers, lance en parallèle, arbitre les verdicts | Orion |
| `requirements-reviewer` | Vérifie que l'implémentation couvre les requirements originaux | `review-manager` |
| `code-reviewer` | Vérifie la correction logique, les contrats d'API, la maintenabilité | `review-manager` |
| `security-reviewer` | Identifie les vulnérabilités et mauvaises configurations | `review-manager` |

---

## review-manager

**Règle cardinale :** Ne jamais reviewer le code lui-même — déléguer uniquement.

### Workflow

| Étape | Action |
|---|---|
| 1. Analyze | Taille, risque, type du changement (backend / frontend / infra / docs) |
| 2. Select | Choisir les reviewers selon la matrice de sélection |
| 3. Spawn | Lancer les reviewers en parallèle via `task`, prompt complet et indépendant pour chacun |
| 4. Confront | Si deux reviewers divergent sur le même point, arbitrer explicitement |
| 5. Return | Verdict synthétique avec tous les findings |

### Matrice de sélection des reviewers

| Type de changement | Reviewers obligatoires |
|---|---|
| Code backend / API | `code-reviewer` + `security-reviewer` |
| Code frontend | `code-reviewer` |
| Auth / secrets / permissions | `security-reviewer` (bloquant) |
| Feature avec requirements | `requirements-reviewer` + `code-reviewer` |
| Docs uniquement | `requirements-reviewer` ou skip |
| Infra / CI / config | `security-reviewer` + `code-reviewer` |

**Fast path :** Pour les changements triviaux à faible risque — un seul "combined reviewer" avec les trois lenses (fonctionnel + code + sécurité).

### Verdict thresholds

| Verdict | Condition |
|---|---|
| `APPROVED` | Tous les reviewers approuvent, ou les issues résiduelles sont toutes mineures |
| `CHANGES_REQUESTED` | ≥ 1 issue majeure, aucun bloquant |
| `BLOCKED` | ≥ 1 issue bloquante (vulnérabilité critique, requirement manquant critique) |

### Output format

```
## Review Summary
Verdict: APPROVED | CHANGES_REQUESTED | BLOCKED

### Issues
[Liste par sévérité : bloquant / majeur / mineur]

### Positive Notes
[Ce qui est bien fait]

### Disagreements
[Si deux reviewers ont divergé, expliquer l'arbitrage]
```

---

## requirements-reviewer

**Règle cardinale :** BLOCKED si les requirements sont absents de la délégation — pas de requirements, pas de review possible.

**Stance :** Skepticism par défaut — cherche les écarts, pas les confirmations.

### Workflow

| Étape | Action |
|---|---|
| 1. Parse | Lister les requirements explicites de la demande originale |
| 2. Map | Pour chaque requirement, identifier le(s) fichier(s) / fonction(s) qui l'implémentent |
| 3. Flag | Catégoriser les écarts trouvés |
| 4. Verdict | APPROVED / CHANGES_REQUESTED / BLOCKED |

### Catégories de findings

| Catégorie | Définition |
|---|---|
| Missing | Requirement non implémenté |
| Misinterpretation | Implémenté mais différent du requirement |
| Partial | Implémenté à moitié |
| Scope creep | Implémenté mais non demandé |

---

## code-reviewer

**Stance :** Skepticism par défaut.

### Workflow

| Étape | Action |
|---|---|
| 1. Identify | Quels fichiers, quelles fonctions, quelles interfaces constituent la change surface |
| 2. Review | Checklist exhaustive |
| 3. Return | Verdict |

### Checklist clé

| Domaine | Points vérifiés |
|---|---|
| Correctness | Logic errors, edge cases, off-by-one |
| Error handling | Tous les chemins d'erreur couverts, erreurs propagées correctement |
| API design | Contrats cohérents, breaking changes |
| State management | Mutations inattendues, race conditions |
| Maintainability | Lisibilité, nommage, duplication |

**Hors périmètre :** sécurité, conformité fonctionnelle, style pour le style.

---

## security-reviewer

**Stance :** Skepticism par défaut — cherche les vulnérabilités, pas les confirmations.

### Workflow

| Étape | Action |
|---|---|
| 1. Map | Points d'entrée, données sensibles, changements de trust boundary |
| 2. Check | 7 catégories de menaces |
| 3. Return | Verdict |

### 7 catégories de menaces

| # | Catégorie | Exemples |
|---|---|---|
| 1 | Injection | SQL, command, template, path traversal |
| 2 | Auth & Authz | Broken access control, privilege escalation |
| 3 | Data Exposure | Credentials en clair, logs sensibles, réponses trop verbeuses |
| 4 | Input Validation | Type coercion, overflow, format strings |
| 5 | Secret Handling | Hardcoded secrets, env vars exposées |
| 6 | Supply Chain | Dépendances non pinnées, scripts postinstall |
| 7 | Infra Misconfigs | Ports ouverts, CORS trop permissif, headers manquants |

**Règle absolue :** BLOCKED sur tout finding critical, sans exception, sans négociation.

**Auth/Token/Crypto Acknowledgment Rule :** Si le changement touche auth / tokens / crypto et qu'aucune vulnérabilité n'est trouvée, le documenter explicitement — l'absence de finding doit être actée.

---

## Verdict protocol

### Production des verdicts

Chaque reviewer produit un verdict individuel : `APPROVED`, `CHANGES_REQUESTED`, ou `BLOCKED`.

### Arbitrage par le review-manager

| Situation | Règle |
|---|---|
| Tous `APPROVED` | Verdict global : `APPROVED` |
| ≥ 1 `BLOCKED` | Verdict global : `BLOCKED` — sans exception |
| ≥ 1 `CHANGES_REQUESTED`, aucun `BLOCKED` | Verdict global : `CHANGES_REQUESTED` |
| Deux reviewers divergent sur le même point | Arbitrage explicite documenté dans la section `### Disagreements` |

### Sévérités des issues

| Sévérité | Impact sur le verdict |
|---|---|
| Bloquant | Force `BLOCKED` |
| Majeur | Force `CHANGES_REQUESTED` si aucun bloquant |
| Mineur | N'empêche pas `APPROVED` |

---

## Ce que le cluster ne fait PAS

- Ne lit pas le code directement — toute exploration passe par `task`
- Ne propose pas de fix — le cluster évalue, il ne corrige pas
- Le `review-manager` ne formule pas de jugement propre sur le code — il agrège et arbitre
- Ne rouvre pas une review déjà livrée sans nouveau contexte ou nouveau diff

---

## Permissions

| Agent | `task` | `question` | Tout le reste |
|---|---|---|---|
| `review-manager` | allow | allow | deny |
| `requirements-reviewer` | allow | — | deny |
| `code-reviewer` | allow | — | deny |
| `security-reviewer` | allow | — | deny |

---

## Config

| Agent | `mode` | `temperature` | `variant` | `color` | `silent` |
|---|---|---|---|---|---|
| `review-manager` | `subagent` | 0.2 | `max` | `warning` | — |
| `requirements-reviewer` | `subagent` | 0.1 | `max` | `info` | `true` |
| `code-reviewer` | `subagent` | 0.2 | `max` | `info` | `true` |
| `security-reviewer` | `subagent` | 0.1 | `max` | `error` | `true` |

---

## Liens

- [Index docs](../index.md)
- [Spec : Délégation Orion](./orion-delegation.md)
- [Spec : Planning](./planning-agent.md)
