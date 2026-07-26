# Quality Score — 2026-07-25 (run 1)

> **Note:** Ce fichier contient deux runs du même jour. Run 1 ci-dessous (website + AGENTS.md), Run 2 en bas de fichier (maintenance complète du repo).



## Summary

| Domain | Score | Trend |
|--------|-------|-------|
| Documentation | 3/5 | → |
| Architecture | 4/5 | → |
| Test coverage | 4/5 | → |

---

## Findings

### Documentation

- **Score:** 3/5
- **Trend:** → stable
- **Findings:**

  **[STALE — MISLEADING] `AGENTS.md` — Section "Website"**
  The entire "Website (Documentation)" section (lines 67–118) describes a legacy React SPA located at `team-lead-workflow/` with a `bundle.html` committed to the repo and deployed via a path trigger on `team-lead-workflow/bundle.html`. This directory no longer exists as the documentation site. The actual site is a VitePress portal located in `website/`, built by CI (`npm run build` from `website/`), and deployed from `website/.vitepress/dist`. The pages.yml workflow already reflects the new setup; AGENTS.md does not. This is actively misleading to anyone trying to update the documentation site.

  **[STALE — WRONG MODE] `website/architecture.md` — Agent mode table and ASCII diagram**
  - Diagram (line 59): `bug-finder` is annotated `[mode: subagent]` — actual mode in `index.js` is `all`.
  - Diagram (line 61): `researcher` is annotated `[mode: subagent]` — actual mode in `index.js` is `all`.
  - Table (line 80): `researcher` is listed as `subagent` — actual mode is `all`.
  - Table (line 80): `researcher` temperature is listed as `0.2` — actual temperature in `index.js` is `0.3`.
  - Table (line 80): `researcher` variant is listed as `max` — actual variant in `index.js` is `extended`.

  **[STALE — WRONG MODE] `website/agents/index.md` — Agent roster table**
  - Line 25: `bug-finder` listed as `subagent` — actual mode is `all`.
  - Line 30: `researcher` listed as `subagent` — actual mode is `all`.

- **Actions taken:** `QUALITY_SCORE.md` created with findings. PRs required — see below.

---

### Architecture

- **Score:** 4/5
- **Trend:** → stable
- **Findings:** Codebase is clean. All guiding principles respected: deny-all permissions ✓, zero runtime deps (plugin) ✓, external prompts ✓, non-interactive git ✓, edit target dirs exist ✓. One meta-finding: the Gardener agent's own permission set (`edit` restricted to `QUALITY_SCORE.md` only) correctly prevents it from directly editing source files — PRs must be opened manually or via a `gh` workflow.
- **Actions taken:** None required.

---

### Test coverage

- **Score:** 4/5
- **Trend:** → stable
- **Findings:** 28 tests covering all 5 lifecycle tools. No drift detected against the current implementation.
- **Actions taken:** None required.

---

## PRs to Open

The following targeted PRs should be opened to fix the stale documentation identified above:

### PR 1 — `docs: fix stale Website section in AGENTS.md`

**File:** `AGENTS.md` lines 67–118

Replace the entire "Website (Documentation)" section with an accurate description of the VitePress setup:

```markdown
## Website (Documentation)

### What it is

A VitePress documentation portal located in `website/`. Deployed automatically to GitHub Pages via `.github/workflows/pages.yml` on every push to `main` that modifies files under `website/`. Built by CI — nothing to commit manually.

### Structure

\`\`\`
website/
├── .vitepress/
│   ├── config.ts         # VitePress config (sidebar, nav, plugins)
│   ├── theme/            # Custom theme CSS
│   └── components/       # Vue components (AgentGraph, WorkflowDiagram, etc.)
├── agents/               # One page per agent
├── architecture.md
├── getting-started.md
├── principles.md
├── changelog.md
└── index.md              # Landing page
\`\`\`

### How to update the site

1. Edit the relevant `.md` file under `website/`
2. Push to `main` — GitHub Actions builds and deploys automatically

No bundle to commit. No manual build step.

### GitHub Pages setup (one-time)

GitHub Pages must be configured with source set to **"GitHub Actions"** in repo Settings → Pages.
\`\`\`
```

### PR 2 — `docs: fix researcher and bug-finder mode in website/architecture.md`

**File:** `website/architecture.md`

1. Line 59 — change `[mode: subagent]` → `[mode: all]` for `bug-finder`
2. Line 61 — change `[mode: subagent]` → `[mode: all]` for `researcher`
3. Table line 80 — change `researcher` row: mode `subagent` → `all`, temperature `0.2` → `0.3`, variant `max` → `extended`

### PR 3 — `docs: fix researcher and bug-finder mode in website/agents/index.md`

**File:** `website/agents/index.md`

1. Line 25 — `bug-finder` mode: `subagent` → `all`
2. Line 30 — `researcher` mode: `subagent` → `all`

---

# Quality Score — 2026-07-25 (run 2 — maintenance complète)

## Summary

| Domain | Score | Trend |
|--------|-------|-------|
| Documentation | 2/5 | ↓ |
| Architecture coherence | 4/5 | → |
| Spec frontmatters | 2/5 | → |
| Test coverage | 4/5 | → |

---

## Findings

### Documentation

- **Score:** 2/5
- **Trend:** ↓ declining (plusieurs stales croisés détectés)
- **Findings:**

  **[STALE — FAUX] `docs/architecture.md` — intro hook `config` seulement**
  Ligne 7 : *"retourne un objet avec le hook `config`"*. Réalité : trois hooks (`config`, `event`, `tool`). Les sections suivantes le couvrent en détail mais l'intro est fausse.

  **[STALE — FAUX] `docs/architecture.md` — permissions bug-finder**
  Ligne 74 : *"bug-finder : `task` + `question` uniquement."*
  Réalité `index.js` : `read`, `glob`, `grep`, `question` — pas de `task`.

  **[STALE — FAUX] `docs/architecture.md` — permissions reviewers**
  Ligne 72 : *"Reviewers spécialisés : `task` uniquement."*
  Réalité `index.js` : `read`, `glob`, `grep` — pas de `task`.

  **[STALE — FAUX] `README.md` — table permissions**
  Lignes 98-104 : plusieurs lignes incorrectes.
  - `review-manager` : manque `read`, `glob`, `grep` ; `task` est contraint à `*-reviewer` uniquement
  - Reviewers : listés comme `task` — en réalité `read`, `glob`, `grep`
  - `bug-finder` : listé comme `task, question` — en réalité `read`, `glob`, `grep`, `question`
  - `gardener` : listé avec `task` — absent dans `index.js`
  - `planning` : manque `glob`

  **[STALE — CADUC] `docs/decisions.md` — D4 hooks "en transition"**
  Ligne 59 : *"les hooks `experimental.session.compacting` et `experimental.chat.system.transform` restent en place pendant la transition"*. Ces hooks ont été supprimés (CHANGELOG v0.9.0 Removed). La phrase décrit un état transitoire révolu.

  **[STALE — FAUX] `docs/specs/review-cluster.md` — reviewers délèguent via `task`**
  Lignes 192-193 : *"toute exploration passe par `task`"* et table permissions indique `task: allow` pour les trois reviewers.
  Réalité : pas de `task`, accès direct via `read`, `glob`, `grep`.

  **[STALE — AMBIGU] `docs/specs/bug-finder-agent.md` — `task` vs lecture directe**
  La spec décrit un workflow de délégation via `task` (phases 2 et 4) et liste `task: allow` dans ses permissions. Réalité dans `index.js` : pas de `task`, uniquement `read`, `glob`, `grep`. Ambiguïté : régression du code, ou décision intentionnelle non reflétée dans la spec ?
  → **Décision humaine requise** avant correction.

  **[STALE — FAUX] `docs/specs/team-lead-delegation.md` — mode `planning`**
  Ligne 12 : `planning | sub-agent`. Réalité `index.js` : `mode: "all"`.

  **[POSSIBLE DÉRIVE] `index.js` permissions `distill`/`prune` vs CHANGELOG Unreleased**
  CHANGELOG Unreleased : *"The team-lead's context management instructions now reference only `compress` — `distill` and `prune` were removed."*
  `index.js` lignes 508-510 : `distill: "allow"`, `prune: "allow"`, `compress: "allow"` toujours présents.
  Si `distill` et `prune` n'existent plus dans OpenCode, ces permissions sont mortes mais inoffensives.
  → **Décision humaine requise** : enlever les permissions ou revenir en arrière sur le CHANGELOG.

  **[INFO] `AGENTS.md` — "zero dependencies"**
  `AGENTS.md` décrit "zero dependencies" mais `package.json` a `@opencode-ai/plugin` en `dependencies`. La spec `lifecycle-tools.md` (section 4) explique que ce devrait être une `peerDependency` pour passer le CI `zero-deps`. Actuellement le CI `zero-deps` check ne bloque pas (il vérifie `dependencies`/`devDependencies` dans `package.json` — `@opencode-ai/plugin` y est listé). 
  → **Décision humaine requise** : peerDep ou dependency, et clarifier "zero dependencies" dans la doc.

- **Actions taken:** Findings documentés. PRs à ouvrir — voir section ci-dessous.

---

### Architecture coherence

- **Score:** 4/5
- **Trend:** → stable
- **Findings:**
  - Tous les agents dans `SUBAGENT_DEFS` ont un fichier `agents/*.md` correspondant. Bijection parfaite.
  - Tous les agents ont `"*": "deny"` comme première permission (principe default-deny respecté).
  - Prompts chargés depuis `agents/*.md` via `readFile` (principe external-prompts respecté).
  - Dossiers `edit` déclarés (`docs/**`, `docs/exec-plans/**`, `docs/briefs/**`, `QUALITY_SCORE.md`) existent sur disque.
  - Un point de dette : `@opencode-ai/plugin` en `dependencies` au lieu de `peerDependencies` — viole techniquement la contrainte zero-deps selon `lifecycle-tools.md`, mais le CI `zero-deps` n'a pas l'air d'avoir été calibré pour le détecter.
- **Actions taken:** Aucune.

---

### Spec frontmatters

- **Score:** 2/5
- **Trend:** → stable (connu)
- **Findings:**
  Sur 12 specs dans `docs/specs/`, une seule (`lifecycle-tools.md`) a un frontmatter YAML complet. Les autres ont leurs métadonnées (`status`, `created`) uniquement en prose Markdown. Résultat : `project_state` retourne `undefined` pour `status` et `created` sur 11/12 specs, et `check_artifacts` ne peut pas détecter les specs stale-draft.
  
  Specs actives concernées : `brainstorm-agent.md`, `bug-finder-agent.md`, `harness-agent.md`, `planning-agent.md`, `gardener-agent.md`, `review-cluster.md`, `review-manager-mechanical-checks.md`, `team-lead-delegation.md`, `researcher-agent.md`.
  
  Specs archivées (ne nécessitent pas de frontmatter) : `analyst-agent.md` (abandonné), `environment-agent.md` (redirect).
  
  Champs minimum utiles à ajouter : `status` et `created` (les tools les lisent). `id` et `criticality` sont optionnels.

- **Actions taken:** Findings documentés. L'ajout des frontmatters est une correction mécanique sans ambiguïté — PRs suggérées ci-dessous.

---

### Test coverage

- **Score:** 4/5
- **Trend:** → stable
- **Findings:**
  `npm test` et `npm run lint` non exécutables depuis le Gardener (permissions bash restreintes aux commandes git). Tests à lancer manuellement.
  
  Discordance détectée : `AGENTS.md`/`README.md` disent "28 tests", le brief `plugin-v2-migration.md` dit "29 tests" (UC-003/SC-002). À vérifier.
  
  Aucun drift fonctionnel détecté par analyse statique entre `tools/lifecycle.js` (imports dans `index.js`) et les specs `lifecycle-tools.md`.
- **Actions taken:** Aucune.

---

## PRs à ouvrir (run 2)

### PR-A — `docs: fix permissions table in docs/architecture.md`

**Fichier :** `docs/architecture.md`

Trois corrections :
1. Ligne 7 : *"retourne un objet avec le hook `config`"* → *"retourne un objet avec trois hooks : `config`, `event`, et `tool`"*
2. Ligne 72 : *"Reviewers spécialisés : `task` uniquement"* → *"`read`, `glob`, `grep` uniquement — lecture directe, pas de délégation"*
3. Ligne 74 : *"bug-finder : `task` + `question` uniquement"* → *"`read`, `glob`, `grep`, `question` — lecture directe, pas de délégation"*

### PR-B — `docs: fix permissions table in README.md`

**Fichier :** `README.md`, tableau lignes 95-104

Réécrire la table avec les vraies permissions de `index.js` :

```markdown
| Agent | Permissions |
|-------|-------------|
| `team-lead` | `task`, `todowrite`, `todoread`, `skill`, `question`, `distill`, `prune`, `compress`, `bash` (git + ls + head + echo), `read` (all), `edit`/`write` (`docs/**` only) |
| `review-manager` | `task` (`*-reviewer` only), `question`, `read`, `glob`, `grep` |
| `requirements-reviewer` / `code-reviewer` / `security-reviewer` | `read`, `glob`, `grep` |
| `bug-finder` | `read`, `glob`, `grep`, `question` |
| `brainstorm` | `task`, `question`, `webfetch`, `read` (all), `edit` (`docs/briefs/**` only) |
| `harness` | `task` (ask), `question`, `todowrite`, `todoread`, `glob`, `grep`, `bash` (unrestricted), `read` (all), `edit` (all) |
| `planning` | `task` (ask), `question`, `read` (all), `glob`, `grep`, `edit` (`docs/exec-plans/**` only) |
| `gardener` | `question`, `bash` (git log/diff/status/show/blame/shortlog, gh pr create), `read` (all), `edit` (`QUALITY_SCORE.md` only) |
| `researcher` | `read`, `webfetch`, `websearch`, `grep` |
```

### PR-C — `docs: fix planning mode and reviewer permissions in specs`

**Fichiers :**
- `docs/specs/team-lead-delegation.md` ligne 12 : `sub-agent` → `all` pour `planning`
- `docs/specs/review-cluster.md` lignes 192-193 et table permissions : supprimer `task: allow` pour les reviewers, ajouter `read`, `glob`, `grep`

### PR-D — `docs: add YAML frontmatter to active specs`

**Fichiers :** toutes les specs actives sans frontmatter YAML.

Ajouter à chacune un bloc frontmatter minimal en tête de fichier :
```yaml
---
status: draft    # ou implemented/active selon l'état réel
created: YYYY-MM-DD   # date visible dans le fichier en prose
---
```

Specs concernées (9) : `brainstorm-agent.md`, `bug-finder-agent.md`, `harness-agent.md`, `planning-agent.md`, `gardener-agent.md`, `review-cluster.md`, `review-manager-mechanical-checks.md`, `team-lead-delegation.md`, `researcher-agent.md`.

---

## Décisions humaines requises

### D1 — `bug-finder` : délégation via `task` ou lecture directe ?

La spec (`bug-finder-agent.md`) décrit un agent qui délègue l'exploration via `task` et ne lit jamais directement. L'implémentation dans `index.js` lui donne `read`, `glob`, `grep` et pas de `task`.

Options :
- **A)** Le code est intentionnel (le bug-finder enquête directement) → mettre à jour la spec et le prompt pour refléter ce comportement. C'est la cohérence avec `review-cluster` (les reviewers lisent directement aussi).
- **B)** La spec est l'intention cible et le code a régressé → remettre `task` dans les permissions.

### D2 — permissions `distill`/`prune` mortes dans le team-lead

CHANGELOG Unreleased dit qu'elles ont été retirées du prompt. Les permissions restent dans `index.js`. Si `distill` et `prune` n'existent plus dans l'API OpenCode, les enlever des permissions nettoie la config. Si elles existent encore mais ne sont juste plus mentionnées dans le prompt, c'est moins urgent.

### D3 — `@opencode-ai/plugin` : peerDependency ou dependency

La spec `lifecycle-tools.md` dit peerDep. `package.json` a une dep ordinaire. L'impact pratique est que le CI `zero-deps` check (qui vérifie `dependencies`/`devDependencies`) devrait bloquer — mais `@opencode-ai/plugin` y est actuellement listé. Soit le CI `zero-deps` a une exception pour ce package, soit il n'est pas calibré pour détecter ce cas.
