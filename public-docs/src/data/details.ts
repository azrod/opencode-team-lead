export type NodeDetail = {
  en: { title: string; description: string }
  fr: { title: string; description: string }
}

export const nodeDetails: Record<string, NodeDetail> = {
  phase_start: {
    en: { title: 'User request', description: 'A new session begins. The user sends a request to Orion. Before anything else: read the scratchpad.' },
    fr: { title: 'Demande utilisateur', description: 'Une nouvelle session commence. L\'utilisateur envoie une demande à Orion. Avant tout : lire le scratchpad.' },
  },
  phase_end: {
    en: { title: 'Report to user', description: 'Mission complete. The result is delivered with a concise, honest summary. Next steps proposed if applicable.' },
    fr: { title: 'Reporter à l\'utilisateur', description: 'Mission accomplie. Le résultat est livré avec un résumé concis et honnête. Les prochaines étapes sont proposées si applicable.' },
  },
  phase0_glob: {
    en: { title: 'Scan docs/briefs/', description: 'Always the first action at session start. Orion globs docs/briefs/ to check for existing product briefs before any planning.' },
    fr: { title: 'Scanner docs/briefs/', description: 'Toujours la première action en début de session. Orion liste docs/briefs/ pour vérifier l\'existence de briefs produit avant toute planification.' },
  },
  phase0_count: {
    en: { title: 'Brief(s) found?', description: 'Decision point: 0 briefs → skip to Phase 1 or run brainstorm. 1 brief → check status. N briefs → list and let user choose.' },
    fr: { title: 'Brief(s) trouvé(s) ?', description: 'Point de décision : 0 briefs → passer à la Phase 1 ou lancer le brainstorm. 1 brief → vérifier le statut. N briefs → lister et laisser choisir.' },
  },
  phase0_none: {
    en: { title: 'No brief — fast path', description: 'No existing brief found. Orion can skip brainstorm entirely and jump to Phase 1 planning if the request is clear enough.' },
    fr: { title: 'Pas de brief — chemin rapide', description: 'Aucun brief existant trouvé. Orion peut sauter le brainstorm et passer directement à la Phase 1 si la demande est suffisamment claire.' },
  },
  phase0_one: {
    en: { title: 'One brief found', description: 'Check its status: if draft → ask to continue or fresh start. If done/other → ask to revise or start new project.' },
    fr: { title: 'Un brief trouvé', description: 'Vérifier son statut : si brouillon → demander de continuer ou repartir de zéro. Si terminé/autre → demander de réviser ou démarrer un nouveau projet.' },
  },
  phase0_draft_ask: {
    en: { title: 'Continue or fresh start?', description: 'The brief is in draft state. User decides: continue refining the existing brief, or throw it out and start fresh.' },
    fr: { title: 'Continuer ou repartir de zéro ?', description: 'Le brief est à l\'état brouillon. L\'utilisateur décide : continuer à affiner le brief existant, ou le jeter et repartir de zéro.' },
  },
  phase0_done_ask: {
    en: { title: 'Revise or new project?', description: 'The brief is done. User decides: revise the existing brief, or start a completely new project.' },
    fr: { title: 'Réviser ou nouveau projet ?', description: 'Le brief est terminé. L\'utilisateur décide : réviser le brief existant, ou démarrer un projet complètement nouveau.' },
  },
  phase0_many: {
    en: { title: 'Multiple briefs', description: 'More than one brief exists. Orion lists them all and asks the user to choose which one to work with.' },
    fr: { title: 'Plusieurs briefs', description: 'Plus d\'un brief existe. Orion les liste tous et demande à l\'utilisateur de choisir avec lequel travailler.' },
  },
  phase0_load: {
    en: { title: 'Load brief → Step 3', description: 'Load the chosen brief and jump directly to Step 3 (Draft + Validate) — no need to redo discovery.' },
    fr: { title: 'Charger le brief → Étape 3', description: 'Charger le brief choisi et passer directement à l\'Étape 3 (Rédaction + Validation) — pas besoin de refaire la découverte.' },
  },
  phase0_step1: {
    en: { title: 'Step 1 — Discovery', description: 'Start the brainstorm process from scratch. Orion delegates to the brainstorm agent for problem discovery.' },
    fr: { title: 'Étape 1 — Découverte', description: 'Démarrer le processus de brainstorm depuis zéro. Orion délègue à l\'agent brainstorm pour la découverte du problème.' },
  },
  phase0_run_brainstorm: {
    en: { title: 'Run brainstorm agent', description: 'Delegates to the brainstorm sub-agent. It runs the 3-step discovery process: Discovery → Deep Dive → Draft + Validate.' },
    fr: { title: 'Lancer l\'agent brainstorm', description: 'Délègue à l\'agent brainstorm. Il exécute le processus de découverte en 3 étapes : Découverte → Approfondissement → Rédaction + Validation.' },
  },
  phase0_produce_brief: {
    en: { title: 'Brief written', description: 'The brainstorm agent has produced a product brief at docs/briefs/{project-name}.md. Orion suggests handing off to Planning or jumping straight to Phase 1.' },
    fr: { title: 'Brief rédigé', description: 'L\'agent brainstorm a produit un brief produit à docs/briefs/{project-name}.md. Orion suggère de passer à la Planification ou de sauter directement à la Phase 1.' },
  },
  phase1_read_sp: {
    en: { title: 'Read scratchpad', description: 'First action in every session. Read .opencode/scratchpad.md to recover state from a previous session or context compaction.' },
    fr: { title: 'Lire le scratchpad', description: 'Première action à chaque session. Lire .opencode/scratchpad.md pour récupérer l\'état d\'une session précédente ou d\'une compaction de contexte.' },
  },
  phase1_project_state: {
    en: { title: 'project_state() + check_artifacts()', description: 'Mandatory lifecycle tools. project_state() gives the full view of exec-plans, specs, and briefs. check_artifacts() surfaces dead references and stale statuses.' },
    fr: { title: 'project_state() + check_artifacts()', description: 'Outils de cycle de vie obligatoires. project_state() donne la vue complète des exec-plans, specs et briefs. check_artifacts() remonte les références mortes et les statuts périmés.' },
  },
  phase1_clarify: {
    en: { title: 'Clarify intent', description: 'If the request is ambiguous, ask the user. If clear, proceed. Never start implementing without understanding the goal.' },
    fr: { title: 'Clarifier l\'intention', description: 'Si la demande est ambiguë, demander à l\'utilisateur. Si elle est claire, continuer. Ne jamais commencer à implémenter sans comprendre l\'objectif.' },
  },
  phase1_todowrite: {
    en: { title: 'todowrite()', description: 'Create a visible task list for the session. This is the user-visible progress tracker — update it in real-time as tasks complete.' },
    fr: { title: 'todowrite()', description: 'Créer une liste de tâches visible pour la session. C\'est le tracker de progression visible par l\'utilisateur — à mettre à jour en temps réel.' },
  },
  phase1_compress: {
    en: { title: 'Write scratchpad + compress', description: 'Write the full plan to .opencode/scratchpad.md. Compress stale context to keep the context window clean before delegating.' },
    fr: { title: 'Écrire scratchpad + compresser', description: 'Écrire le plan complet dans .opencode/scratchpad.md. Compresser le contexte périmé pour garder la fenêtre de contexte propre avant de déléguer.' },
  },
  phase2_bug: {
    en: { title: 'Bug report?', description: 'Is this a bug investigation? If YES → always delegate to bug-finder first. Never jump straight to a fix without diagnosis.' },
    fr: { title: 'Rapport de bug ?', description: 'S\'agit-il d\'une investigation de bug ? Si OUI → toujours déléguer à bug-finder d\'abord. Ne jamais sauter directement à un correctif sans diagnostic.' },
  },
  phase2_bug_finder: {
    en: { title: '→ bug-finder first', description: 'The bug-finder agent forces rigorous root-cause analysis before any fix. It prevents workarounds and code divergence.' },
    fr: { title: '→ bug-finder d\'abord', description: 'L\'agent bug-finder force une analyse rigoureuse de la cause racine avant tout correctif. Il prévient les contournements et la divergence du code.' },
  },
  phase2_select_agent: {
    en: { title: 'Select agent', description: 'Choose the right specialist. Prefer registered user-defined agents over invented personas. Use explore for read-only work, general for implementation.' },
    fr: { title: 'Sélectionner l\'agent', description: 'Choisir le bon spécialiste. Préférer les agents enregistrés définis par l\'utilisateur aux personas inventées. Utiliser explore pour le travail en lecture seule, general pour l\'implémentation.' },
  },
  phase2_handoff: {
    en: { title: 'Delegate via task()', description: 'Write a detailed, self-contained prompt. Include ALL context: file paths, decisions made, constraints, expected output format. Never assume the agent knows project context.' },
    fr: { title: 'Déléguer via task()', description: 'Rédiger un prompt détaillé et autonome. Inclure TOUT le contexte : chemins de fichiers, décisions prises, contraintes, format de sortie attendu. Ne jamais supposer que l\'agent connaît le contexte du projet.' },
  },
  phase2_success: {
    en: { title: 'Success?', description: 'Did the agent complete the task correctly? If YES → proceed to review. If NO → retry with reformulated prompt (max 2 retries).' },
    fr: { title: 'Succès ?', description: 'L\'agent a-t-il accompli la tâche correctement ? Si OUI → passer à la revue. Si NON → réessayer avec un prompt reformulé (max 2 tentatives).' },
  },
  phase2_retry: {
    en: { title: 'Retry (reformulate)', description: 'Never retry with the same inputs. Change something: the prompt, the scope, the persona, or add missing context. After 2 failures → escalate.' },
    fr: { title: 'Réessayer (reformuler)', description: 'Ne jamais réessayer avec les mêmes entrées. Changer quelque chose : le prompt, la portée, la persona, ou ajouter le contexte manquant. Après 2 échecs → escalader.' },
  },
  phase2_esc_user: {
    en: { title: 'Escalate to user', description: 'After 2 failed attempts, stop and report the failure to the user with diagnosis. Never loop indefinitely.' },
    fr: { title: 'Escalader à l\'utilisateur', description: 'Après 2 tentatives échouées, s\'arrêter et rapporter l\'échec à l\'utilisateur avec le diagnostic. Ne jamais boucler indéfiniment.' },
  },
  phase3_delegate_rm: {
    en: { title: '→ review-manager', description: 'All reviews go through review-manager — never spawn reviewers directly. It selects the right reviewers, runs them in parallel, and synthesizes verdicts.' },
    fr: { title: '→ review-manager', description: 'Toutes les revues passent par review-manager — ne jamais instancier les reviewers directement. Il sélectionne les bons reviewers, les exécute en parallèle et synthétise les verdicts.' },
  },
  phase3_verdict: {
    en: { title: 'Verdict?', description: 'Three possible outcomes: APPROVED (proceed), CHANGES_REQUESTED (fix and re-review, max 2 rounds), BLOCKED (escalate immediately).' },
    fr: { title: 'Verdict ?', description: 'Trois résultats possibles : APPROVED (continuer), CHANGES_REQUESTED (corriger et re-revoir, max 2 tours), BLOCKED (escalader immédiatement).' },
  },
  phase3_resume_fix: {
    en: { title: 'Re-delegate fixes', description: 'Resume the original producer agent with review-manager\'s feedback. Then request a second review. Maximum 2 review rounds total.' },
    fr: { title: 'Re-déléguer les corrections', description: 'Reprendre l\'agent producteur original avec les retours du review-manager. Puis demander une seconde revue. Maximum 2 tours de revue au total.' },
  },
  phase3_blocked_esc: {
    en: { title: 'Escalate — BLOCKED', description: 'A BLOCKED verdict means a fundamental issue. Stop everything. Report to user with full reasoning. Do NOT attempt to fix without user input.' },
    fr: { title: 'Escalader — BLOQUÉ', description: 'Un verdict BLOCKED signifie un problème fondamental. Tout arrêter. Rapporter à l\'utilisateur avec le raisonnement complet. Ne PAS tenter de corriger sans input utilisateur.' },
  },
  phase4_self_eval: {
    en: { title: 'Self-evaluation', description: 'Before reporting: does the result fully answer the original request? Are multi-agent outputs coherent? Any nagging correctness concerns?' },
    fr: { title: 'Auto-évaluation', description: 'Avant de reporter : le résultat répond-il pleinement à la demande originale ? Les sorties multi-agents sont-elles cohérentes ? Des préoccupations persistantes sur la justesse ?' },
  },
  phase4_gap: {
    en: { title: 'Gap?', description: 'Four outcomes: OK (ship it), minor gap (quick fix), major gap (loop back to Phase 2), scope confusion (ask user before proceeding).' },
    fr: { title: 'Écart ?', description: 'Quatre résultats : OK (livrer), écart mineur (correction rapide), écart majeur (retour à la Phase 2), confusion de portée (demander à l\'utilisateur avant de continuer).' },
  },
  phase4_minor: {
    en: { title: 'Fix minor gap', description: 'Small inconsistency or missing detail. Delegate a quick follow-up task to fix it, then proceed to scratchpad capture.' },
    fr: { title: 'Corriger l\'écart mineur', description: 'Petite incohérence ou détail manquant. Déléguer une tâche de suivi rapide pour le corriger, puis passer à la capture du scratchpad.' },
  },
  phase4_scope: {
    en: { title: 'Scope confusion → ask user', description: 'If you\'re not sure what the user wanted, ask before delivering a wrong answer. Never guess on scope.' },
    fr: { title: 'Confusion de portée → demander', description: 'Si vous n\'êtes pas sûr de ce que l\'utilisateur voulait, demander avant de livrer une mauvaise réponse. Ne jamais deviner la portée.' },
  },
  phase4_sp_capture: {
    en: { title: 'Final scratchpad capture', description: 'Update .opencode/scratchpad.md with final state before reporting. This is the compaction insurance — everything needed to resume goes here.' },
    fr: { title: 'Capture finale du scratchpad', description: 'Mettre à jour .opencode/scratchpad.md avec l\'état final avant de reporter. C\'est l\'assurance contre la compaction — tout ce qui est nécessaire pour reprendre va ici.' },
  },
  phase4_report: {
    en: { title: 'Report to user', description: 'Lead with the outcome, not the process. Highlight successes and failures honestly. Propose concrete next steps. Human-tone, concise.' },
    fr: { title: 'Reporter à l\'utilisateur', description: 'Commencer par le résultat, pas le processus. Mettre en avant les succès et les échecs honnêtement. Proposer des prochaines étapes concrètes. Ton humain, concis.' },
  },
  phase5_pattern: {
    en: { title: 'Recurring pattern?', description: 'Post-delivery, optional. Did a pattern emerge that warrants enforcement? Two paths: Harness (mechanical enforcement) or Gardener (doc/drift hygiene).' },
    fr: { title: 'Pattern récurrent ?', description: 'Post-livraison, optionnel. Un pattern a-t-il émergé qui justifie une mise en application ? Deux chemins : Harness (application mécanique) ou Gardener (hygiène docs/dérive).' },
  },
  phase5_harness: {
    en: { title: 'Suggest harness', description: 'Harness encodes patterns as lint rules, CI checks, or AGENTS.md entries. Never launch without user confirmation — it\'s a structural change.' },
    fr: { title: 'Proposer harness', description: 'Harness encode les patterns en règles lint, vérifications CI, ou entrées AGENTS.md. Ne jamais lancer sans confirmation utilisateur — c\'est un changement structurel.' },
  },
  phase5_gardener: {
    en: { title: '→ gardener', description: 'Gardener fixes stale docs and detects code drift. Runs post-feature or on explicit request. Escalates recurring patterns to harness.' },
    fr: { title: '→ gardener', description: 'Gardener corrige les docs périmées et détecte la dérive du code. S\'exécute post-feature ou sur demande explicite. Escalade les patterns récurrents vers harness.' },
  },
  phase5_recurring: {
    en: { title: 'Pattern recurs?', description: 'After gardener runs: if the pattern keeps appearing, escalate to harness for mechanical enforcement. If it was a one-off, end the session.' },
    fr: { title: 'Pattern récurrent ?', description: 'Après l\'exécution de gardener : si le pattern continue d\'apparaître, escalader vers harness pour une mise en application mécanique. Si c\'était une exception, terminer la session.' },
  },
  phase5_esc_harness: {
    en: { title: 'Escalate → harness', description: 'The pattern is recurring. Propose harness to the user for permanent mechanical enforcement.' },
    fr: { title: 'Escalader → harness', description: 'Le pattern est récurrent. Proposer harness à l\'utilisateur pour une mise en application mécanique permanente.' },
  },
}
