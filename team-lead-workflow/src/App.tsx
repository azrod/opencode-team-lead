import React, { useState, useRef, useEffect } from "react";
import mermaid from "mermaid";

// ─── CSS animation injected once ─────────────────────────────────────────────
const STYLE_TAG = `
@keyframes slideIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
`;

// ─── Detail content ───────────────────────────────────────────────────────────

interface DetailData {
  title: string;
  color: string;
  nodeType: string; // badge label in header
  sections: { heading: string; items: string[] }[];
}

// ─── Flowchart i18n data ──────────────────────────────────────────────────────

interface BrainstormSvgLabels {
  bs_start: string;
  bs_existing_check: string;
  bs_single_found: string;
  bs_multi_found: string;
  bs_status_check: string;
  bs_ask_continue: string;
  bs_load_brief: string;
  bs_phase1: string;
  bs_problem_clear: string;
  bs_phase2: string;
  bs_adversarial: string;
  bs_template_fillable: string;
  bs_phase3: string;
  bs_quality_gate: string;
  bs_quality_passed: string;
  bs_file_exists: string;
  bs_file_conflict: string;
  bs_write: string;
  bs_end: string;
  // arrow labels
  bs_arrow_yes: string;
  bs_arrow_no: string;
  bs_arrow_one: string;
  bs_arrow_multiple: string;
  bs_arrow_none: string;
  bs_arrow_draft: string;
  bs_arrow_done: string;
  bs_arrow_continue: string;
  bs_arrow_fresh: string;
  bs_arrow_choose: string;
  bs_arrow_new: string;
  bs_arrow_all_fillable: string;
  bs_arrow_missing: string;
  bs_arrow_passed: string;
  bs_arrow_tier2: string;
  bs_arrow_blocked: string;
  bs_esc_blocked_label: string;
  bs_esc_blocked_sub: string;
  bs_arrow_overwrite: string;
  bs_arrow_version: string;
  bs_arrow_rename: string;
}

interface UnifiedSvgLabels {
  uf_start: string;
  uf_scan: string;
  uf_scan_sub: string;
  uf_briefs_found: string;
  uf_no_brief: string;
  uf_brief_status: string;
  uf_ask_continue: string;
  uf_ask_revise: string;
  uf_load_brief: string;
  uf_multi_found: string;
  uf_brief_end: string;
  uf_brief_end_sub: string;
  uf_phase0_label: string;
  uf_placeholder_label: string;
  // expand/collapse brainstorm sub-steps
  uf_step1_label: string;
  uf_step2_label: string;
  uf_step3_label: string;
  uf_expand_hint: string;
  uf_collapse_hint: string;
  // arrow labels
  uf_arrow_none: string;
  uf_arrow_one: string;
  uf_arrow_multiple: string;
  uf_arrow_draft: string;
  uf_arrow_done: string;
  uf_arrow_continue: string;
  uf_arrow_fresh: string;
  uf_arrow_revise: string;
  uf_arrow_new_project: string;
  uf_arrow_phase3: string;
}

interface FlowchartData {
  svgLabels: {
    start: string;
    scratchpad_sub: string;
    ambigu: string;
    question_label: string;
    question_sub: string;
    bug_decision: string;
    certitude: string;
    agent_failure: string;
    esc_uncertainty_label: string;
    esc_retry_label: string;
    esc_retry_sub: string;
    esc_blocked_label: string;
    end: string;
    arrow_oui: string;
    arrow_non: string;
    arrow_gap_majeur: string;
    arrow_gap_mineur: string;
    scratchpad_rw_label: string;
    annot_delegate: string;
    annot_agents: string;
    agents_label: string;
    annot_plan: string;
    annot_harness: string;
    harness_arrow: string;
    harness_node_label: string;
  };
  details: Record<string, DetailData>;
  brainstormSvgLabels: BrainstormSvgLabels;
  brainstormDetails: Record<string, DetailData>;
  unifiedSvgLabels: UnifiedSvgLabels;
}

function getFlowchartData(lang: "en" | "fr"): FlowchartData {
  if (lang === "fr") {
    return {
      svgLabels: {
        start: "Requête utilisateur",
        scratchpad_sub: "Plan courant · Contexte",
        ambigu: "Ambigu ?",
        question_label: "Question util.",
        question_sub: "outil: question",
        bug_decision: "Bug report ?",
        certitude: "Certitude ?",
        agent_failure: "Échec agent ?",
        esc_uncertainty_label: "Escalade utilisateur",
        esc_retry_label: "Escalade util.",
        esc_retry_sub: "2 retries dépassés",
        esc_blocked_label: "Escalade util.",
        end: "Rapport à l'utilisateur",
        arrow_oui: "OUI",
        arrow_non: "NON",
        arrow_gap_majeur: "Gap majeur",
        arrow_gap_mineur: "Gap mineur",
        scratchpad_rw_label: "← lire/écrire",
        annot_delegate: "↳ MAJ scratchpad après chaque retour d'agent",
        annot_agents: "✎ après retour d'agent",
        agents_label: "Sous-agents",
        annot_plan: "✎ scratchpad  |  planning si ambigu",
        annot_harness: "suggérer à l'utilisateur — jamais sans confirmation",
        harness_arrow: "pattern récurrent ?",
        harness_node_label: "Harness ? (optionnel)",
      },
      details: {
        start: {
          title: "Requête utilisateur",
          color: "#1e293b",
          nodeType: "POINT D'ENTRÉE",
          sections: [
            { heading: "Point d'entrée", items: ["L'utilisateur soumet une demande", "Le team-lead analyse le type de requête avant d'agir"] },
          ],
        },
        understand: {
          title: "1. Understand",
          color: "#2563eb",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Lecture mémoire", items: [".opencode/scratchpad.md — plan de travail courant"] },
            { heading: "Appels lifecycle (obligatoires au démarrage)", items: ["`project_state()` — vue complète des exec-plans, specs et briefs", "`check_artifacts()` — scan de cohérence inter-artefacts"] },
            { heading: "Appels lifecycle (tout au long du workflow)", items: ["`mark_block_done()` — après chaque livraison validée", "`complete_plan()` — quand tous les blocs sont terminés et la review APPROVED", "`register_spec()` — quand une nouvelle spec doit exister sur disque"] },
            { heading: "Objectif", items: ["Parser la requête (explicite vs implicite)", "Identifier si ambigu avant de planifier", "Vérifier si un scope était en cours (scratchpad)"] },
          ],
        },
        scratchpad: {
          title: "📄 scratchpad.md",
          color: "#0ea5e9",
          nodeType: "MÉMOIRE DE TRAVAIL",
          sections: [
            { heading: "Rôle", items: [
              "Mémoire de travail mission courante",
              "Survit à la compaction de contexte",
              "Écrasé à chaque nouvelle mission",
            ]},
            { heading: "Quand lire", items: ["Au démarrage — lire l'état de la mission si elle existe"] },
            { heading: "Quand écrire (6 moments)", items: [
              "Démarrage — objectif + plan + décisions initiales",
              "Avant délégation — sous-tâches, fichiers modifiés, contexte de reprise",
              "Après retour d'agent — résultats clés synthétisés",
              "Après review — statut des tâches + verdict",
              "Après chaque décision — noter ce qui a été décidé et pourquoi",
              "Fin de mission — capture finale avant rapport utilisateur",
            ]},
          ],
        },
        ambigu: {
          title: "Ambigu ?",
          color: "#64748b",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Décision", items: ["OUI → poser des questions via outil `question` → attendre réponse → reprendre Understand", "NON → continuer vers Plan"] },
          ],
        },
        question: {
          title: "Question utilisateur",
          color: "#64748b",
          nodeType: "ACTION",
          sections: [
            { heading: "Outil", items: ["`question` — bloque jusqu'à réponse de l'utilisateur"] },
            { heading: "Règle", items: ["Une fois la réponse reçue, reprendre depuis Understand pour intégrer les nouvelles informations"] },
          ],
        },
        plan: {
          title: "2. Plan",
          color: "#4f46e5",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Actions", items: ["Créer/MAJ todolist → todowrite", "Écrire plan + contexte dans scratchpad", "Identifier les agents nécessaires", "Déterminer parallèle vs séquentiel"] },
            { heading: "Exec-plans", items: ["Invoquer l'agent `planning` si : requête ambiguë + multi-sessions + AGENTS.md ne clarifie pas", "Plan simple → inline dans le scratchpad", "Exec-plan → fichier dans docs/exec-plans/<feature>.md", "Quand un exec-plan existe : scratchpad pointe vers lui — `See exec-plan: docs/exec-plans/<feature>.md`"] },
            { heading: "Lifecycle", items: ["`register_spec()` — quand une nouvelle spec doit exister sur disque"] },
            { heading: "Règle", items: ["Un seul scope à la fois — finir avant de passer au suivant", "Parquer les scopes secondaires dans le scratchpad"] },
          ],
        },
        delegate: {
          title: "3. Delegate",
          color: "#7c3aed",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Agents disponibles", items: ["`explore` — read-only, reconnaissance codebase", "`general` — implémentation, écriture, commandes", "Custom persona (`backend-engineer`, `react-specialist`…)"] },
            { heading: "Règles", items: ["Tâches indépendantes → spawner en parallèle", "Tâches dépendantes → séquentiel avec handoff de contexte", "Après chaque retour → MAJ scratchpad + compress"] },
          ],
        },
        bug_decision: {
          title: "Bug report ?",
          color: "#be123c",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Déclencher bug-finder si", items: ["Comportement inattendu / régression / crash / sortie incorrecte", "Quelque chose « a arrêté de fonctionner » sans cause évidente", "Un fix a été appliqué mais le problème persiste ou s'est déplacé"] },
            { heading: "Ne PAS déclencher si", items: ["Bug trivialement localisable (utilisateur pointe la ligne + typo évidente) ET fix isolé → flow normal"] },
          ],
        },
        bug_finder: {
          title: "bug-finder",
          color: "#dc2626",
          nodeType: "AGENT SPÉCIALISÉ",
          sections: [
            { heading: "Rôle", items: ["Forcer l'analyse root-cause AVANT tout fix", "Empêche les workarounds et la divergence de code"] },
            { heading: "Verdicts", items: ["HIGH → fix direct via `general` avec l'analyse", "MEDIUM → fix via `general` + signaler l'incertitude à l'utilisateur", "UNCERTAINTY_EXPOSED → remonter les questions ouvertes à l'utilisateur avant de continuer"] },
          ],
        },
        certitude: {
          title: "Certitude ?",
          color: "#be123c",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["HIGH / MEDIUM → rejoindre le flow Agents avec l'analyse en contexte", "UNCERTAINTY_EXPOSED → escalade utilisateur, attendre réponse avant tout fix"] },
          ],
        },
        escalade_uncertainty: {
          title: "Escalade — UNCERTAINTY_EXPOSED",
          color: "#991b1b",
          nodeType: "ESCALADE",
          sections: [
            { heading: "Message à l'utilisateur", items: ["Présenter les hypothèses identifiées et leurs probabilités", "Lister les questions précises qui bloquent le diagnostic", "Ne pas proposer de fix dans cet état"] },
          ],
        },
        agents: {
          title: "Sous-agents",
          color: "#6d28d9",
          nodeType: "DÉLÉGATION",
          sections: [
            { heading: "Types", items: ["`explore` (natif OpenCode) — lecture seule : recherche, glob, lecture", "`general` (natif OpenCode) — accès complet : lecture, écriture, bash", "Custom persona — `backend-engineer`, `api-architect`…"] },
            { heading: "Contexte handoff", items: ["Chaque agent repart de zéro — être explicite", "Inclure fichiers modifiés, décisions, interfaces", "Parallèle = plusieurs task calls dans le même message"] },
          ],
        },
        agent_failure: {
          title: "Échec agent ?",
          color: "#64748b",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Diagnostics", items: ["Mauvais prompt → reformuler avec plus de précision", "Contexte insuffisant → envoyer `explore` d'abord, retry avec findings", "Tâche trop grande → décomposer en sous-tâches", "Erreur outil → vérifier permissions et chemins"] },
            { heading: "Règle", items: ["Max 2 retries — toujours changer quelque chose entre les tentatives", "Si toujours KO après 2 tentatives → escalade utilisateur"] },
          ],
        },
        retry: {
          title: "↩ Retry (max 2)",
          color: "#b45309",
          nodeType: "BOUCLE",
          sections: [
            { heading: "Process", items: ["Diagnostiquer la cause de l'échec", "Reformuler / décomposer / enrichir le contexte", "Relancer l'agent avec le nouveau prompt"] },
          ],
        },
        escalade_retry: {
          title: "Escalade — 2 retries dépassés",
          color: "#991b1b",
          nodeType: "ESCALADE",
          sections: [
            { heading: "Message à l'utilisateur", items: ["Décrire ce qui a été tenté (2 tentatives)", "Expliquer le diagnostic de chaque échec", "Proposer des options : reformuler la tâche, fournir du contexte supplémentaire", "Ne jamais retenter une 3e fois sans instruction explicite"] },
          ],
        },
        review: {
          title: "4. Review",
          color: "#b45309",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Règle absolue", items: ["TOUJOURS via review-manager — jamais de reviewer direct", "Obligatoire pour tout changement code, config, infra, sécurité"] },
            { heading: "Fournir au review-manager", items: ["Fichiers modifiés + résumé des changements", "Exigences originales de l'utilisateur", "Trade-offs et décisions effectuées", "Ce qui était explicitement hors scope"] },
            { heading: "Lifecycle", items: ["`mark_block_done()` — après chaque livraison validée", "`complete_plan()` — quand tous les blocs sont terminés et la review APPROVED"] },
          ],
        },
        review_manager: {
          title: "review-manager",
          color: "#92400e",
          nodeType: "AGENT ORCHESTRATEUR",
          sections: [
            { heading: "Rôle", items: ["Orchestrateur de review — jamais reviewer direct", "Spawne en parallèle : code-reviewer, security-reviewer, requirements-reviewer", "Synthétise les verdicts et arbitre les désaccords"] },
            { heading: "Skip autorisé uniquement si", items: ["Changement docs-only (aucun code modifié)", "Aucun impact sécurité possible", "L'utilisateur demande explicitement la vitesse"] },
          ],
        },
        verdict: {
          title: "Verdict review ?",
          color: "#b45309",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["APPROVED → Synthesize & Report", "CHANGES_REQUESTED → re-déléguer fixes au producteur → re-review (max 2 rounds)", "BLOCKED → escalade immédiate à l'utilisateur, ne pas corriger sans input user"] },
          ],
        },
        changes_loop: {
          title: "↩ Fix + re-review (max 2)",
          color: "#b45309",
          nodeType: "BOUCLE",
          sections: [
            { heading: "Process", items: ["Renvoyer les fixes précis à l'agent producteur", "Re-passer par le review-manager", "Maximum 2 rounds au total"] },
          ],
        },
        escalade_blocked: {
          title: "Escalade — BLOCKED",
          color: "#991b1b",
          nodeType: "ESCALADE",
          sections: [
            { heading: "Règles strictes", items: ["Signaler le problème précis identifié par le reviewer", "Expliquer pourquoi c'est bloquant (pas juste un warning)", "Ne proposer AUCUN fix dans le message d'escalade", "Attendre une instruction explicite avant de continuer"] },
          ],
        },
        synthesize: {
          title: "5. Synthesize & Report",
          color: "#15803d",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Auto-évaluation", items: ["Répond à la vraie demande (pas l'interprétée) ?", "Pas de contradiction entre résultats d'agents ?", "Rien de manquant dans la livraison ?"] },
            { heading: "MAJ mémoire", items: ["Nettoyer le scratchpad (tâches terminées)"] },
          ],
        },
        autoeval: {
          title: "Auto-éval OK ?",
          color: "#15803d",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["OK → rapport final à l'utilisateur", "Gap mineur (détail manquant) → fix rapide puis rapport", "Gap majeur (mauvaise approche) → retour Delegate"] },
          ],
        },
        gap_majeur: {
          title: "↩ Retour Delegate",
          color: "#166534",
          nodeType: "BOUCLE",
          sections: [
            { heading: "Traitement", items: ["Traiter le gap comme une nouvelle tâche", "Reprendre depuis la phase Delegate", "MAJ todolist et scratchpad avant de déléguer"] },
          ],
        },
        fix_rapide: {
          title: "Fix rapide",
          color: "#166534",
          nodeType: "ACTION",
          sections: [
            { heading: "Traitement", items: ["Corriger le détail manquant directement", "Pas besoin de repasser par Review si le fix est trivial", "Inclure dans le rapport final"] },
          ],
        },
        end: {
          title: "Rapport à l'utilisateur",
          color: "#1e293b",
          nodeType: "LIVRAISON",
          sections: [
            { heading: "Livraison", items: ["Résumé concis des changements effectués", "Problèmes éventuels signalés honnêtement", "Prochaines étapes proposées si pertinent"] },
          ],
        },
        harness_suggest: {
          title: "Harness ? (optionnel)",
          color: "#166534",
          nodeType: "POST-LIVRAISON (OPTIONNEL)",
          sections: [
            { heading: "Quand suggérer", items: ["Un pattern a été expliqué plusieurs fois à différents agents", "Une décision architecturale est régulièrement violée", "Une convention n'est pas encore enforced par lint ou CI"] },
            { heading: "Règles", items: ["Jamais sans confirmation explicite de l'utilisateur", "Jamais au démarrage de mission — uniquement post-livraison", "Jamais sur le chemin critique — toujours en suggestion finale", "Proposer, ne jamais lancer automatiquement"] },
          ],
        },
        uf_start: {
          title: "Démarrage de session",
          color: "#1e293b",
          nodeType: "POINT D'ENTRÉE",
          sections: [
            { heading: "Première action", items: ["Toujours scanner `docs/briefs/` avant toute autre chose — sans exception"] },
          ],
        },
        uf_scan: {
          title: "Scanne docs/briefs/",
          color: "#6d28d9",
          nodeType: "ACTION OBLIGATOIRE",
          sections: [
            { heading: "Règle", items: ["Chercher les briefs existants dans `docs/briefs/` quelle que soit la quantité de contexte fournie par l'utilisateur", "C'est obligatoire — il n'y a pas d'exception"] },
          ],
        },
        uf_briefs_found: {
          title: "Brief(s) trouvé(s) ?",
          color: "#64748b",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["AUCUN → passer directement à la Phase 1, sans question", "UN SEUL → vérifier le statut (draft / done / autre)", "PLUSIEURS → lister tous les briefs, demander lequel ou nouveau projet"] },
          ],
        },
        uf_brief_status: {
          title: "Statut : draft ?",
          color: "#64748b",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["OUI (draft) → demander : continuer l'édition ou repartir de zéro ?", "NON (done/autre) → demander : réviser ce brief ou démarrer un nouveau projet ?"] },
          ],
        },
        uf_ask_continue: {
          title: "Continuer ou repartir ?",
          color: "#7c3aed",
          nodeType: "QUESTION UTILISATEUR",
          sections: [
            { heading: "Options", items: ["CONTINUER → charger le brief, sauter directement à l'Étape 3 (mode révision)", "REPARTIR → flux Étape 1 normal"] },
          ],
        },
        uf_ask_revise: {
          title: "Réviser ou nouveau projet ?",
          color: "#7c3aed",
          nodeType: "QUESTION UTILISATEUR",
          sections: [
            { heading: "Options", items: ["RÉVISER → charger le brief, sauter directement à l'Étape 3 (mode révision)", "NOUVEAU PROJET → flux Étape 1 normal"] },
          ],
        },
        uf_load_brief: {
          title: "Charger le brief",
          color: "#7c3aed",
          nodeType: "ACTION",
          sections: [
            { heading: "Ce qui se passe", items: ["Lit le brief existant pour le mode révision", "Saute directement à l'Étape 3 — ignorer les Étapes 1 et 2"] },
            { heading: "Chemin rapide", items: ["Si le message d'ouverture de l'utilisateur fournit suffisamment de contexte → proposer de rédiger immédiatement (Étape 3 directe)"] },
          ],
        },
        uf_no_brief: {
          title: "Pas de brief → Phase 1",
          color: "#475569",
          nodeType: "TRANSITION",
          sections: [
            { heading: "Règle", items: ["Pas de question posée — passer directement à la Phase 1 (Understand + Plan)", "C'est aussi le chemin quand l'utilisateur choisit 'repartir de zéro' ou 'nouveau projet'"] },
          ],
        },
        uf_multi_found: {
          title: "Plusieurs briefs trouvés",
          color: "#7c3aed",
          nodeType: "ACTION",
          sections: [
            { heading: "Ce qui se passe", items: ["Lister tous les briefs avec chemin + statut + nom du projet", "Demander : lequel traiter ? (ou nouveau projet ?)", "Une fois choisi, suit la même logique que 'un seul brief trouvé'"] },
          ],
        },
        uf_brief_end: {
          title: "Brief écrit",
          color: "#6d28d9",
          nodeType: "SORTIE PHASE 0",
          sections: [
            { heading: "Sortie", items: ["Brief sauvegardé dans `docs/briefs/{project-name}.md`"] },
            { heading: "Passation", items: ["Dire : 'Confier à Planning pour le décomposer en exec-plan, ou à Orion si la portée est déjà assez claire'", "C'est une suggestion verbale — PAS une délégation automatique"] },
          ],
        },
        // ── Phases du flowchart unifié ──
        phase0_brief_check: {
          title: "Phase 0 — BRAINSTORM (optionnel)",
          color: "#7c3aed",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Entrée", items: ["Scanner `docs/briefs/` — toujours, sans exception", "Aucun brief → Phase 1 directement", "Brief draft → demander : continuer ou repartir ?", "Plusieurs briefs → lister + choisir"] },
            { heading: "Fast path", items: ["Si scope déjà clair dans le message → flèche pointillée directe vers Phase 1", "Suggestion verbale uniquement — jamais de délégation automatique"] },
          ],
        },
        phase0_run_brainstorm: {
          title: "Lancer agent brainstorm",
          color: "#7c3aed",
          nodeType: "ACTION",
          sections: [
            { heading: "Agent brainstorm", items: ["Étape 1 — Découverte : faire émerger le problème", "Étape 2 — Approfondissement : scope, critères, contraintes, risques", "Étape 3 — Rédaction + Validation : brief complet, porte qualité"] },
          ],
        },
        phase0_produce_brief: {
          title: "Produire le brief",
          color: "#7c3aed",
          nodeType: "SORTIE PHASE 0",
          sections: [
            { heading: "Sortie", items: ["Brief écrit dans `docs/briefs/{project-name}.md`"] },
            { heading: "Passation", items: ["Suggestion verbale : confier à Planning ou à Orion si scope assez clair"] },
          ],
        },
        phase1_read_sp: {
          title: "Phase 1 — PLAN",
          color: "#1d4ed8",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Ordre strict (9 étapes)", items: [
              "1. Lire `.opencode/scratchpad.md`",
              "2. Appeler `project_state()`",
              "3. Appeler `check_artifacts()`",
              "4. Clarifier l'intention (ambigu ? bug ?)",
              "5. Identifier le nombre de scopes",
              "6. Choisir le type de plan (inline ou exec-plan)",
              "7. Appeler `todowrite`",
              "8. Écrire/mettre à jour le scratchpad",
              "9. `compress` avant d'entrer en Phase 2",
            ]},
          ],
        },
        phase1_project_state: {
          title: "project_state() + check_artifacts()",
          color: "#1d4ed8",
          nodeType: "LIFECYCLE TOOLS",
          sections: [
            { heading: "Obligatoires au démarrage", items: ["`project_state()` — état complet des exec-plans, specs et briefs", "`check_artifacts()` — scan de cohérence inter-artefacts"] },
          ],
        },
        phase1_clarify: {
          title: "Clarifier intention → scope → type plan",
          color: "#1d4ed8",
          nodeType: "ACTION",
          sections: [
            { heading: "Décisions", items: ["Ambigu ? → question via outil `question`", "Plusieurs scopes ? → proposer un ordre, attendre accord", "Plan simple → inline dans scratchpad", "Tâche complexe → invoquer agent `planning` → exec-plan"] },
          ],
        },
        phase1_todowrite: {
          title: "todowrite + écrire scratchpad",
          color: "#1d4ed8",
          nodeType: "ACTION",
          sections: [
            { heading: "Actions", items: ["Créer/MAJ liste de tâches visible", "Écrire objectif, plan, décisions, questions ouvertes dans scratchpad"] },
          ],
        },
        phase1_compress: {
          title: "compress stale context",
          color: "#1d4ed8",
          nodeType: "GESTION DU CONTEXTE",
          sections: [
            { heading: "Outils DCP", items: ["`distill` — résumer les outputs longs", "`prune` — élaguer les outputs exploratoires déjà distillés", "`compress` — nettoyer le contexte avant Phase 2"] },
          ],
        },
        phase2_bug: {
          title: "Phase 2 — DELEGATE",
          color: "#15803d",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Sélection agent (hiérarchie stricte)", items: ["1. Agents user-defined (fichiers .md dans agent/)", "2. Agents plugin nommés (bug-finder, review-manager…)", "3. `explore` — read-only, plus rapide", "4. `general` + persona — fallback uniquement"] },
            { heading: "Cycle", items: ["MAJ scratchpad avant délégation", "Déléguer via `task`", "Succès → MAJ scratchpad, distill, mark_block_done", "Échec → diagnostiquer puis retry ≤2, sinon escalade"] },
          ],
        },
        phase2_bug_finder: {
          title: "bug-finder",
          color: "#dc2626",
          nodeType: "AGENT SPÉCIALISÉ",
          sections: [
            { heading: "Rôle", items: ["Forcer l'analyse root-cause AVANT tout fix"] },
            { heading: "Verdicts", items: ["HIGH → fix via `general`", "MEDIUM → fix + signaler incertitude", "UNCERTAINTY_EXPOSED → stop, escalade user"] },
          ],
        },
        phase2_select_agent: {
          title: "Sélectionner agent (hiérarchie)",
          color: "#15803d",
          nodeType: "ACTION",
          sections: [
            { heading: "Règle", items: ["Agents user-defined > plugin nommés > explore > general+persona", "Si `explore` ou `general` suffisent → ne pas inventer une persona"] },
          ],
        },
        phase2_handoff: {
          title: "Context handoff A→B",
          color: "#15803d",
          nodeType: "ACTION",
          sections: [
            { heading: "Prompt auto-suffisant", items: ["Inclure chemins de fichiers, contraintes, output attendu", "Agents séquentiels : extraire l'essentiel de A, donner à B ce qui a changé/décidé/découvert", "Parallèle = plusieurs `task` calls dans le même message"] },
          ],
        },
        phase2_success: {
          title: "Succès agent ?",
          color: "#15803d",
          nodeType: "DÉCISION",
          sections: [
            { heading: "En cas d'échec", items: ["Prompt peu clair → reformuler", "Overflow contexte → décomposer", "Info manquante → enrichir (explore d'abord)", "Mauvaise persona → changer", "Blocage fondamental → escalade"] },
            { heading: "Règle", items: ["Max 2 retries (tous types confondus) → escalade utilisateur"] },
          ],
        },
        phase2_retry: {
          title: "retry ≤2",
          color: "#d97706",
          nodeType: "BOUCLE",
          sections: [
            { heading: "Process", items: ["Diagnostiquer la cause", "Reformuler / décomposer / enrichir / changer persona", "Toujours changer quelque chose entre deux tentatives"] },
          ],
        },
        phase2_esc_user: {
          title: "Escalade utilisateur",
          color: "#991b1b",
          nodeType: "ESCALADE",
          sections: [
            { heading: "Règles", items: ["Décrire les 2 tentatives effectuées", "Expliquer le diagnostic de chaque échec", "Proposer options : reformuler, fournir contexte", "Ne jamais retenter une 3e fois sans instruction"] },
          ],
        },
        phase3_delegate_rm: {
          title: "Phase 3 — REVIEW",
          color: "#b45309",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Règle absolue", items: ["TOUJOURS via review-manager — jamais de reviewer direct"] },
            { heading: "Fournir au review-manager", items: ["Fichiers modifiés + résumé des changements", "Exigences originales de l'utilisateur", "Trade-offs et décisions", "Ce qui est explicitement hors scope"] },
            { heading: "Fresh start vs Resume", items: ["Fresh (no task_id) pour les nouvelles reviews", "Resume (task_id) pour les corrections après CHANGES_REQUESTED"] },
          ],
        },
        phase3_verdict: {
          title: "Verdict ?",
          color: "#b45309",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["APPROVED → Phase 4 (Synthesize)", "CHANGES_REQUESTED → re-déléguer fixes au producteur → re-review (max 2 rounds)", "BLOCKED → escalade immédiate, ne pas corriger sans input user"] },
          ],
        },
        phase3_resume_fix: {
          title: "Reprendre producteur → fix",
          color: "#d97706",
          nodeType: "BOUCLE",
          sections: [
            { heading: "Process", items: ["Renvoyer les fixes précis à l'agent producteur (resume, task_id)", "Re-passer par review-manager", "Maximum 2 rounds au total"] },
          ],
        },
        phase3_blocked_esc: {
          title: "Escalade — BLOCKED",
          color: "#991b1b",
          nodeType: "ESCALADE",
          sections: [
            { heading: "Règles strictes", items: ["Signaler le problème précis identifié par le reviewer", "Expliquer pourquoi c'est bloquant", "Proposer AUCUN fix dans le message d'escalade", "Attendre instruction explicite avant de continuer"] },
          ],
        },
        phase4_self_eval: {
          title: "Phase 4 — SYNTHESIZE",
          color: "#4338ca",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Auto-évaluation (obligatoire avant rapport)", items: ["1. Répond à la vraie demande (pas l'interprétée) ?", "2. Les outputs multi-agents sont cohérents ?", "3. Quelque chose de nagging sur la correction ou les effets de bord ?"] },
            { heading: "Types de gap", items: ["Gap mineur → fix rapide puis rapport", "Gap majeur → retour vers Phase 2 (Delegate)", "Confusion scope → demander à l'utilisateur"] },
          ],
        },
        phase4_gap: {
          title: "Type gap ?",
          color: "#4338ca",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["OK → rapport final", "Mineur → fix rapide → sp_capture", "Majeur → retour Phase 2 (loop dashed)", "Scope → demander à l'utilisateur"] },
          ],
        },
        phase4_minor: {
          title: "Gap mineur → fix rapide",
          color: "#d97706",
          nodeType: "ACTION",
          sections: [
            { heading: "Traitement", items: ["Corriger le détail manquant directement", "Pas besoin de repasser par Review si trivial", "Inclure dans le rapport final"] },
          ],
        },
        phase4_scope: {
          title: "Scope confusion → demander user",
          color: "#64748b",
          nodeType: "ACTION",
          sections: [
            { heading: "Traitement", items: ["Ne pas livrer une mauvaise réponse", "Poser la question précise avant de continuer"] },
          ],
        },
        phase4_sp_capture: {
          title: "Capture finale scratchpad",
          color: "#4338ca",
          nodeType: "ACTION",
          sections: [
            { heading: "Avant le rapport", items: ["Marquer la mission comme complète dans le scratchpad", "Ne pas effacer (l'utilisateur peut revenir)", "`## Plan` — statuts finaux", "`## Decisions` — dernières décisions enregistrées"] },
          ],
        },
        phase4_report: {
          title: "Rapport (human-tone)",
          color: "#4338ca",
          nodeType: "LIVRAISON",
          sections: [
            { heading: "Règles de communication", items: ["Mener avec le résultat, pas le processus", "Mettre en avant succès et échecs honnêtement", "Ne pas édulcorer les échecs d'agents", "Proposer des prochaines étapes concrètes si pertinent"] },
          ],
        },
        phase5_pattern: {
          title: "Phase 5 — MAINTENANCE",
          color: "#475569",
          nodeType: "PHASE PRINCIPALE",
          sections: [
            { heading: "Deux chemins indépendants", items: ["Path A — Harness : encoder le pattern en artefact mécanique (lint, CI, AGENTS.md)", "Path B — Gardener : corriger docs obsolètes + détecter dérive de code"] },
            { heading: "Règles", items: ["Jamais sans confirmation explicite de l'utilisateur", "Jamais au démarrage de mission — uniquement post-livraison"] },
          ],
        },
        phase5_harness: {
          title: "Harness",
          color: "#15803d",
          nodeType: "AGENT SPÉCIALISÉ",
          sections: [
            { heading: "Quand suggérer", items: ["Pattern expliqué plusieurs fois à des agents différents", "Décision architecturale régulièrement violée", "Convention pas encore enforced par lint ou CI"] },
            { heading: "Ce que produit Harness", items: ["Convention code → règle lint custom (ESLint, Ruff…)", "Contrainte build/déploiement → job CI", "Règle agent → entrée AGENTS.md", "Principe non mécanisable → entrée docs/guiding-principles.md"] },
          ],
        },
        phase5_gardener: {
          title: "Gardener",
          color: "#475569",
          nodeType: "AGENT SPÉCIALISÉ",
          sections: [
            { heading: "Fonction 1 — Doc-Gardening", items: ["Détecte refs obsolètes, descriptions périmées, liens cassés", "Corrige le contenu, ouvre une PR par document"] },
            { heading: "Fonction 2 — Code-GC", items: ["Dérive ponctuelle → PR de refactoring ciblée", "Pattern récurrent → escalade vers Harness"] },
          ],
        },
        phase5_recurring: {
          title: "Pattern récurrent ?",
          color: "#475569",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["OUI → escalade vers Harness (confirmation requise)", "NON → PR ciblée uniquement"] },
          ],
        },
        phase5_esc_harness: {
          title: "Escalader vers Harness",
          color: "#15803d",
          nodeType: "ACTION",
          sections: [
            { heading: "Process", items: ["Gardener vérifie avec Orion / utilisateur avant d'invoquer Harness", "Harness procède directement une fois invoqué — il ne re-demande pas"] },
          ],
        },
        phase_start: {
          title: "Requête utilisateur",
          color: "#1e293b",
          nodeType: "POINT D'ENTRÉE",
          sections: [
            { heading: "Point d'entrée", items: ["L'utilisateur soumet une demande", "Orion scanne les briefs existants avant toute autre action"] },
          ],
        },
        phase_end: {
          title: "Rapport à l'utilisateur",
          color: "#1e293b",
          nodeType: "LIVRAISON",
          sections: [
            { heading: "Livraison", items: ["Résumé concis des changements effectués", "Problèmes éventuels signalés honnêtement", "Prochaines étapes proposées si pertinent"] },
          ],
        },
        phase0: {
          title: "Phase 0 — BRAINSTORM (optionnel)",
          color: "#7c3aed",
          nodeType: "PHASE",
          sections: [{ heading: "Rôle", items: ["Phase de découverte. Se déclenche quand la demande est vague ou quand un nouveau projet démarre.", "Produit un product brief dans docs/briefs/{project-name}.md.", "Optionnelle — si brief existant ou scope clair, chemin rapide vers Phase 1."] }],
        },
        phase1: {
          title: "Phase 1 — PLAN",
          color: "#1d4ed8",
          nodeType: "PHASE",
          sections: [{ heading: "Rôle", items: ["Séquence de planification en 9 étapes strictes.", "Lire scratchpad → outils lifecycle → clarifier → scope → type plan → todowrite → écrire scratchpad → compress."] }],
        },
        phase2: {
          title: "Phase 2 — DELEGATE",
          color: "#15803d",
          nodeType: "PHASE",
          sections: [{ heading: "Rôle", items: ["Sélectionner les agents (hiérarchie stricte), déléguer via task, gérer les échecs avec retry ≤2.", "Les bug reports vont toujours vers bug-finder en premier."] }],
        },
        phase3: {
          title: "Phase 3 — REVIEW",
          color: "#b45309",
          nodeType: "PHASE",
          sections: [{ heading: "Rôle", items: ["Toujours via review-manager (jamais de reviewers directs).", "APPROVED → Phase 4, CHANGES_REQUESTED → re-déléguer (max 2 rounds), BLOCKED → escalade."] }],
        },
        phase4: {
          title: "Phase 4 — SYNTHESIZE",
          color: "#4338ca",
          nodeType: "PHASE",
          sections: [{ heading: "Rôle", items: ["Auto-éval (3 questions) → traitement des gaps → capture finale scratchpad → rapport human-tone."] }],
        },
        phase5: {
          title: "Phase 5 — MAINTENANCE",
          color: "#475569",
          nodeType: "PHASE",
          sections: [{ heading: "Rôle", items: ["Post-livraison, optionnel. Deux chemins : Harness (enforcement de patterns) et Gardener (détection de dérive docs/code)."] }],
        },
      },
      unifiedSvgLabels: {
        uf_start: "Démarrage de session",
        uf_scan: "Scanne docs/briefs/",
        uf_scan_sub: "(toujours — obligatoire)",
        uf_briefs_found: "Brief(s) trouvé(s) ?",
        uf_no_brief: "Pas de brief → Phase 1",
        uf_brief_status: "Statut : draft ?",
        uf_ask_continue: "Continuer ou repartir ?",
        uf_ask_revise: "Réviser ou nouveau projet ?",
        uf_load_brief: "Charger le brief",
        uf_multi_found: "Plusieurs briefs → liste + choisir",
        uf_brief_end: "Brief écrit",
        uf_brief_end_sub: "suggérer Planning ou Orion",
        uf_phase0_label: "Phase 0 — BRAINSTORM (optionnel)",
        uf_placeholder_label: "Phase 1–5 (à venir)",
        uf_step1_label: "Étape 1 — Découverte",
        uf_step2_label: "Étape 2 — Rédaction du brief",
        uf_step3_label: "Étape 3 — Alignement",
        uf_expand_hint: "Voir les étapes",
        uf_collapse_hint: "Masquer les étapes",
        uf_arrow_none: "AUCUN",
        uf_arrow_one: "UN SEUL",
        uf_arrow_multiple: "PLUSIEURS",
        uf_arrow_draft: "BROUILLON",
        uf_arrow_done: "TERMINÉ",
        uf_arrow_continue: "CONTINUER",
        uf_arrow_fresh: "REPARTIR",
        uf_arrow_revise: "RÉVISER",
        uf_arrow_new_project: "NOUVEAU PROJET",
        uf_arrow_phase3: "→ Étape 3",
      },
      brainstormSvgLabels: {
        bs_start: "Démarrage session",
        bs_existing_check: "Briefs existants ?",
        bs_single_found: "Un brief trouvé",
        bs_multi_found: "Plusieurs trouvés",
        bs_status_check: "Statut = brouillon ?",
        bs_ask_continue: "Continuer ou nouveau ?",
        bs_load_brief: "Charger le brief",
        bs_phase1: "Étape 1 — Découverte",
        bs_problem_clear: "Problème clair ?",
        bs_phase2: "Étape 2 — Approfondissement",
        bs_adversarial: "Porte adversariale",
        bs_template_fillable: "Toutes sections remplissables ?",
        bs_phase3: "Étape 3 — Rédaction + Validation",
        bs_quality_gate: "Porte qualité",
        bs_quality_passed: "Porte qualité passée ?",
        bs_file_exists: "Fichier existant ?",
        bs_file_conflict: "Écraser / v2 / renommer ?",
        bs_write: "Écrire le brief",
        bs_end: "Brief écrit. Passer à Planning ou Orion.",
        bs_arrow_yes: "OUI",
        bs_arrow_no: "NON",
        bs_arrow_one: "UN SEUL",
        bs_arrow_multiple: "PLUSIEURS",
        bs_arrow_none: "AUCUN",
        bs_arrow_draft: "BROUILLON",
        bs_arrow_done: "TERMINÉ",
        bs_arrow_continue: "CONTINUER",
        bs_arrow_fresh: "NOUVEAU",
        bs_arrow_choose: "CHOISIR EXISTANT",
        bs_arrow_new: "NOUVEAU PROJET",
        bs_arrow_all_fillable: "OUI",
        bs_arrow_missing: "NON",
        bs_arrow_passed: "PASSÉ",
        bs_arrow_tier2: "NIVEAU 2",
        bs_arrow_blocked: "BLOQUÉ",
        bs_esc_blocked_label: "Escalade",
        bs_esc_blocked_sub: "BLOQUÉ",
        bs_arrow_overwrite: "ÉCRASER",
        bs_arrow_version: "NOUVELLE VERSION",
        bs_arrow_rename: "RENOMMER",
      },
      brainstormDetails: {
        bs_start: {
          title: "Démarrage de session",
          color: "#0d9488",
          nodeType: "POINT D'ENTRÉE",
          sections: [
            { heading: "Ce qui se passe", items: ["La session est initiée avec l'agent brainstorm", "L'agent scanne docs/briefs/ pour vérifier les briefs existants", "Décision de routage prise avant toute question"] },
          ],
        },
        bs_existing_check: {
          title: "Briefs existants ?",
          color: "#0d9488",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["AUCUN → Flux normal → Étape 1 (Découverte)", "UN SEUL → vérifier le statut (brouillon / terminé)", "PLUSIEURS → lister les briefs, demander lequel ou nouveau projet"] },
          ],
        },
        bs_single_found: {
          title: "Un brief trouvé",
          color: "#0891b2",
          nodeType: "ACTION",
          sections: [
            { heading: "Ce qui se passe", items: ["Un brief localisé dans docs/briefs/", "L'agent vérifie le champ statut dans le frontmatter du brief", "Routage vers la décision de statut"] },
          ],
        },
        bs_multi_found: {
          title: "Plusieurs briefs trouvés",
          color: "#0891b2",
          nodeType: "ACTION",
          sections: [
            { heading: "Ce qui se passe", items: ["L'agent liste tous les briefs trouvés à l'utilisateur", "Demande : lequel reprendre, ou démarrer un nouveau projet ?", "CHOISIR EXISTANT → Charger brief → Étape 3 (révision)", "NOUVEAU PROJET → Flux normal → Étape 1"] },
          ],
        },
        bs_status_check: {
          title: "Statut = brouillon ?",
          color: "#0891b2",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["OUI (brouillon) → Demander : continuer ou repartir de zéro ?", "NON (terminé/autre) → Informer l'utilisateur, demander un nouveau nom de projet → Étape 1"] },
          ],
        },
        bs_ask_continue: {
          title: "Continuer ou repartir de zéro ?",
          color: "#0891b2",
          nodeType: "ACTION",
          sections: [
            { heading: "Ce qui se passe", items: ["L'utilisateur voit le résumé du brief en brouillon existant", "Demandé : reprendre là où on s'est arrêtés, ou repartir de zéro ?", "CONTINUER → Charger brief → sauter directement à l'Étape 3 (révision)", "REPARTIR → Ignorer le brief existant → Étape 1 (Découverte)"] },
          ],
        },
        bs_load_brief: {
          title: "Charger le brief",
          color: "#0891b2",
          nodeType: "ACTION",
          sections: [
            { heading: "Ce qui se passe", items: ["L'agent lit le fichier brief existant dans docs/briefs/", "Fournit le contexte complet à l'Étape 3 (mode révision)", "L'utilisateur peut itérer sur le contenu existant plutôt que de repartir de zéro"] },
          ],
        },
        bs_phase1: {
          title: "Étape 1 — Découverte",
          color: "#2563eb",
          nodeType: "ÉTAPE PRINCIPALE",
          sections: [
            { heading: "Question centrale", items: ["\"Quel problème essaies-tu de résoudre, et qui en souffre ?\""] },
            { heading: "Règles", items: ["Max 2 questions à la fois — ne jamais surcharger", "Faire émerger le problème, pas la solution", "Ne pas accepter les réponses vagues — pousser vers des précisions", "Itérer jusqu'à ce que le problème soit clairement formulé"] },
            { heading: "Critères de sortie", items: ["Problème formulé en 2–4 phrases", "Utilisateur principal nommé", "C'est bien un problème, pas une fonctionnalité"] },
          ],
        },
        bs_problem_clear: {
          title: "Problème clair ?",
          color: "#2563eb",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Critères de sortie", items: ["OUI → problème formulé en 2–4 phrases claires ET utilisateur principal nommé → Étape 2", "NON → itérer — poser des questions de suivi plus ciblées"] },
          ],
        },
        bs_phase2: {
          title: "Étape 2 — Approfondissement",
          color: "#4f46e5",
          nodeType: "ÉTAPE PRINCIPALE",
          sections: [
            { heading: "Sujets à couvrir", items: ["Périmètre et frontières — qu'est-ce qui est explicitement hors périmètre ?", "Critères de succès — comment savoir que ça a marché ?", "Cas d'usage — top 3–5 scénarios concrets", "Contraintes — technique, temps, équipe, budget", "Idées rejetées — ce qui a été considéré et écarté ?"] },
            { heading: "Pression socratique", items: ["Challenger les hypothèses — \"Pourquoi X est la bonne approche ?\"", "Demander les modes d'échec — \"Qu'est-ce qui ferait échouer ça ?\"", "Sonder les cas limites — \"Que se passe-t-il si Y ne fonctionne pas ?\""] },
          ],
        },
        bs_adversarial: {
          title: "Porte adversariale",
          color: "#7c3aed",
          nodeType: "PORTE",
          sections: [
            { heading: "Deux questions obligatoires", items: ["\"Quel est l'argument le plus fort contre la construction de ça ?\"", "\"Que devrait-il être vrai pour que ça échoue en an 1 ?\""] },
            { heading: "But", items: ["Force l'utilisateur à articuler les vrais risques", "Empêche les briefs trop optimistes qui sautent les modes d'échec", "Si l'utilisateur ne peut pas répondre, le problème a besoin de plus de travail"] },
          ],
        },
        bs_template_fillable: {
          title: "Toutes les sections remplissables ?",
          color: "#7c3aed",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["OUI → passer à l'Étape 3 (rédaction + validation)", "NON → itérer dans l'Étape 2 — identifier les sections encore vides"] },
            { heading: "Sections requises", items: ["Énoncé du problème", "Utilisateur principal", "Critères de succès", "Top cas d'usage", "Contraintes", "Hors périmètre", "Risques / réponses adversariales"] },
          ],
        },
        bs_phase3: {
          title: "Étape 3 — Rédaction + Validation",
          color: "#6d28d9",
          nodeType: "ÉTAPE PRINCIPALE",
          sections: [
            { heading: "Ce qui se passe", items: ["L'agent génère le brief complet inline depuis le contexte collecté", "L'utilisateur révise le brouillon et donne son retour", "L'agent itère jusqu'à ce que l'utilisateur confirme que le brief est prêt", "La porte qualité est passée avant l'écriture sur disque"] },
            { heading: "Format de sortie", items: ["Fichier Markdown dans docs/briefs/{project-name}.md", "Sections structurées : problème, utilisateurs, critères de succès, cas d'usage, contraintes, risques"] },
          ],
        },
         bs_quality_gate: {
          title: "Porte qualité",
          color: "#6d28d9",
          nodeType: "PORTE",
          sections: [
            { heading: "Niveau 1 — correction silencieuse automatique", items: ["Problèmes de formatage mineurs", "Phrases incomplètes inférables", "Ponctuation ou majuscules manquantes"] },
            { heading: "Niveau 2 — demander à l'utilisateur via l'outil question", items: ["Critères de succès ambigus", "Contraintes conflictuelles", "Frontières de périmètre vagues"] },
            { heading: "BLOQUÉ — escalader immédiatement", items: ["Aucun énoncé de problème", "Aucun critère de succès", "Périmètre vide — impossible de déterminer ce qu'il faut construire"] },
          ],
        },
        bs_quality_passed: {
          title: "Porte qualité passée ?",
          color: "#6d28d9",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Branches", items: ["PASSÉ → passer à la vérification d'écriture de fichier", "Problèmes NIVEAU 2 → demander à l'utilisateur → résoudre → re-passer la porte", "BLOQUÉ (pas de problème, pas de critères de succès, périmètre vide) → STOP — escalader à l'utilisateur, ne pas écrire"] },
          ],
        },
        bs_file_exists: {
          title: "Fichier existant ?",
          color: "#7c3aed",
          nodeType: "DÉCISION",
          sections: [
            { heading: "Vérification", items: ["L'agent vérifie si docs/briefs/{project-name}.md existe déjà sur disque"] },
            { heading: "Branches", items: ["NON → écrire directement", "OUI → demander à l'utilisateur : écraser, nouvelle version, ou renommer ?"] },
          ],
        },
        bs_file_conflict: {
          title: "Écraser / nouvelle version / renommer ?",
          color: "#7c3aed",
          nodeType: "ACTION",
          sections: [
            { heading: "Options", items: ["ÉCRASER → remplacer le fichier existant par le nouveau brief", "NOUVELLE VERSION → écrire comme {name}-v2.md (ou -v3, etc.)", "RENOMMER → écrire avec un nom de fichier personnalisé fourni par l'utilisateur"] },
          ],
        },
        bs_write: {
          title: "Écrire le fichier",
          color: "#15803d",
          nodeType: "ACTION",
          sections: [
            { heading: "Ce qui se passe", items: ["L'agent écrit le brief validé dans docs/briefs/{project-name}.md", "Le fichier est créé ou écrasé selon le choix de résolution de conflit", "Le brief est prêt à être consommé par Planning ou Orion"] },
          ],
        },
        bs_end: {
          title: "Brief écrit",
          color: "#1e293b",
          nodeType: "LIVRAISON",
          sections: [
            { heading: "Passation", items: ["Brief écrit dans docs/briefs/{project-name}.md", "Confier à l'agent Planning pour le plan d'exécution", "Ou confier directement à Orion (team-lead) pour l'implémentation"] },
          ],
        },
        bs_esc_blocked: {
          title: "Escalade — BLOQUÉ",
          color: "#991b1b",
          nodeType: "ESCALADE",
          sections: [
            { heading: "Quand ça se déclenche", items: ["Aucun énoncé de problème", "Aucun critère de succès défini", "Périmètre vide — impossible de déterminer ce qu'il faut construire"] },
            { heading: "Ce qui se passe", items: ["L'agent s'arrête immédiatement — n'écrit pas le brief", "Rapporte précisément ce qui manque à l'utilisateur", "L'utilisateur doit fournir les informations manquantes avant de continuer"] },
          ],
        },
        uf_step1: {
          title: "Étape 1 — Découverte",
          color: "#2563eb",
          nodeType: "SOUS-ÉTAPE BRAINSTORM",
          sections: [
            { heading: "Rôle", items: ["L'agent pose des questions ciblées sur le projet", "Fait émerger le problème central et les utilisateurs concernés", "Max 2 questions à la fois — ne jamais surcharger"] },
            { heading: "Critères de sortie", items: ["Problème formulé en 2–4 phrases", "Utilisateur principal nommé", "C'est bien un problème, pas une fonctionnalité"] },
          ],
        },
        uf_step2: {
          title: "Étape 2 — Rédaction du brief",
          color: "#4f46e5",
          nodeType: "SOUS-ÉTAPE BRAINSTORM",
          sections: [
            { heading: "Ce qui se passe", items: ["L'agent génère le brief complet depuis le contexte collecté", "L'utilisateur révise et donne son retour", "L'agent itère jusqu'à validation", "La porte qualité est passée avant l'écriture sur disque"] },
            { heading: "Sortie", items: ["Fichier Markdown dans docs/briefs/{project-name}.md"] },
          ],
        },
        uf_step3: {
          title: "Étape 3 — Alignement",
          color: "#6d28d9",
          nodeType: "SOUS-ÉTAPE BRAINSTORM",
          sections: [
            { heading: "Ce qui se passe", items: ["Révision du brief avec l'utilisateur", "Itération jusqu'à confirmation", "Une fois validé : suggestion de passer à Planning ou Orion"] },
            { heading: "Modes", items: ["Chemin normal : Étape 1 → Étape 2 → Étape 3", "Chemin rapide : brief existant chargé → Étape 3 directement"] },
          ],
        },
      },
    };
  }

  // English
  return {
    svgLabels: {
      start: "User request",
      scratchpad_sub: "Current plan · Context",
      ambigu: "Ambiguous?",
      question_label: "User question",
      question_sub: "tool: question",
      bug_decision: "Bug report?",
      certitude: "Certainty?",
      agent_failure: "Agent failure?",
      esc_uncertainty_label: "User escalation",
      esc_retry_label: "Escalation",
      esc_retry_sub: "2 retries exceeded",
      esc_blocked_label: "Escalation",
      end: "Report to user",
      arrow_oui: "YES",
      arrow_non: "NO",
      arrow_gap_majeur: "Major gap",
      arrow_gap_mineur: "Minor gap",
      scratchpad_rw_label: "← read/write",
      annot_delegate: "↳ Update scratchpad after each agent return",
      annot_agents: "✎ after agent return",
      agents_label: "Sub-agents",
      annot_plan: "✎ scratchpad  |  planning agent if ambiguous",
      annot_harness: "suggest to user — never launch without confirmation",
      harness_arrow: "recurring pattern?",
      harness_node_label: "Harness? (optional)",
    },
    details: {
      start: {
        title: "User request",
        color: "#1e293b",
        nodeType: "ENTRY POINT",
        sections: [
          { heading: "Entry point", items: ["User submits a request", "team-lead analyzes the request type before acting"] },
        ],
      },
      understand: {
        title: "1. Understand",
        color: "#2563eb",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Memory read", items: [".opencode/scratchpad.md — current work plan"] },
          { heading: "Lifecycle calls (mandatory at mission start)", items: ["`project_state()` — full view of exec-plans, specs, and briefs", "`check_artifacts()` — cross-artifact consistency scan"] },
          { heading: "Lifecycle calls (throughout the workflow)", items: ["`mark_block_done()` — after each validated delivery", "`complete_plan()` — when all blocks are done and final review is APPROVED", "`register_spec()` — when a new spec needs to exist on disk"] },
          { heading: "Goal", items: ["Parse the request (explicit vs implicit)", "Identify ambiguity before planning", "Check if a scope was in progress (scratchpad)"] },
        ],
      },
      scratchpad: {
        title: "📄 scratchpad.md",
        color: "#0ea5e9",
        nodeType: "WORKING MEMORY",
        sections: [
          { heading: "Role", items: [
            "Working memory for current mission",
            "Survives context compaction",
            "Overwritten at each new mission",
          ]},
          { heading: "When to read", items: ["On startup — read mission state if it exists"] },
          { heading: "When to write (6 moments)", items: [
            "Startup — goal + plan + initial decisions",
            "Before delegation — sub-tasks, modified files, resume context",
            "After agent return — synthesized key results",
            "After review — task status + verdict",
            "After each decision — record what was decided and why",
            "End of mission — final capture before user report",
          ]},
        ],
      },
      ambigu: {
        title: "Ambiguous?",
        color: "#64748b",
        nodeType: "DECISION",
        sections: [
          { heading: "Decision", items: ["YES → ask questions via `question` tool → wait for answer → resume Understand", "NO → continue to Plan"] },
        ],
      },
      question: {
        title: "User question",
        color: "#64748b",
        nodeType: "ACTION",
        sections: [
          { heading: "Tool", items: ["`question` — blocks until user responds"] },
          { heading: "Rule", items: ["Once the answer is received, resume from Understand to integrate the new information"] },
        ],
      },
      plan: {
        title: "2. Plan",
        color: "#4f46e5",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Actions", items: ["Create/update todo list → todowrite", "Write plan + context in scratchpad", "Identify required agents", "Determine parallel vs sequential"] },
          { heading: "Exec-plans", items: ["Invoke `planning` agent if: ambiguous request + multi-session + AGENTS.md doesn't clarify", "Simple plan → inline in scratchpad", "Exec-plan → file at docs/exec-plans/<feature>.md", "When an exec-plan exists: scratchpad points to it — `See exec-plan: docs/exec-plans/<feature>.md`"] },
          { heading: "Lifecycle", items: ["`register_spec()` — when a new spec needs to exist on disk"] },
          { heading: "Rule", items: ["One scope at a time — finish before moving to the next", "Park secondary scopes in the scratchpad"] },
        ],
      },
      delegate: {
        title: "3. Delegate",
        color: "#7c3aed",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Available agents", items: ["`explore` — read-only, codebase reconnaissance", "`general` — implementation, writing, commands", "Custom persona (`backend-engineer`, `react-specialist`…)"] },
          { heading: "Rules", items: ["Independent tasks → spawn in parallel", "Dependent tasks → sequential with context handoff", "After each return → update scratchpad + compress"] },
        ],
      },
      bug_decision: {
        title: "Bug report?",
        color: "#be123c",
        nodeType: "DECISION",
        sections: [
          { heading: "Trigger bug-finder if", items: ["Unexpected behavior / regression / crash / incorrect output", "Something 'stopped working' with no obvious cause", "A fix was applied but the problem persists or moved"] },
          { heading: "Do NOT trigger if", items: ["Bug trivially locatable (user points to line + obvious typo) AND isolated fix → normal flow"] },
        ],
      },
      bug_finder: {
        title: "bug-finder",
        color: "#dc2626",
        nodeType: "SPECIALIZED AGENT",
        sections: [
          { heading: "Role", items: ["Force root-cause analysis BEFORE any fix", "Prevents workarounds and code divergence"] },
          { heading: "Verdicts", items: ["HIGH → direct fix via `general` with the analysis", "MEDIUM → fix via `general` + report uncertainty to user", "UNCERTAINTY_EXPOSED → surface open questions to user before continuing"] },
        ],
      },
      certitude: {
        title: "Certainty?",
        color: "#be123c",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["HIGH / MEDIUM → join Agents flow with analysis in context", "UNCERTAINTY_EXPOSED → user escalation, wait for answer before any fix"] },
        ],
      },
      escalade_uncertainty: {
        title: "Escalation — UNCERTAINTY_EXPOSED",
        color: "#991b1b",
        nodeType: "ESCALATION",
        sections: [
          { heading: "Message to user", items: ["Present identified hypotheses and their probabilities", "List the precise questions blocking the diagnosis", "Do not propose a fix in this state"] },
        ],
      },
      agents: {
        title: "Sub-agents",
        color: "#6d28d9",
        nodeType: "DELEGATION",
        sections: [
          { heading: "Types", items: ["`explore` (native OpenCode) — read-only: search, glob, read", "`general` (native OpenCode) — full access: read, write, bash", "Custom persona — `backend-engineer`, `api-architect`…"] },
          { heading: "Context handoff", items: ["Each agent starts from scratch — be explicit", "Include modified files, decisions, interfaces", "Parallel = multiple task calls in the same message"] },
        ],
      },
      agent_failure: {
        title: "Agent failure?",
        color: "#64748b",
        nodeType: "DECISION",
        sections: [
          { heading: "Diagnostics", items: ["Bad prompt → rephrase with more precision", "Insufficient context → send `explore` first, retry with findings", "Task too large → break into sub-tasks", "Tool error → check permissions and paths"] },
          { heading: "Rule", items: ["Max 2 retries — always change something between attempts", "If still failing after 2 attempts → user escalation"] },
        ],
      },
      retry: {
        title: "↩ Retry (max 2)",
        color: "#b45309",
        nodeType: "LOOP",
        sections: [
          { heading: "Process", items: ["Diagnose the cause of failure", "Rephrase / decompose / enrich context", "Relaunch the agent with the new prompt"] },
        ],
      },
      escalade_retry: {
        title: "Escalation — 2 retries exceeded",
        color: "#991b1b",
        nodeType: "ESCALATION",
        sections: [
          { heading: "Message to user", items: ["Describe what was attempted (2 attempts)", "Explain the diagnosis of each failure", "Propose options: rephrase the task, provide additional context", "Never retry a 3rd time without explicit instruction"] },
        ],
      },
      review: {
        title: "4. Review",
        color: "#b45309",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Absolute rule", items: ["ALWAYS via review-manager — never a direct reviewer", "Mandatory for any code, config, infra, security change"] },
          { heading: "Provide to review-manager", items: ["Modified files + summary of changes", "Original user requirements", "Trade-offs and decisions made", "What was explicitly out of scope"] },
          { heading: "Lifecycle", items: ["`mark_block_done()` — after each validated delivery", "`complete_plan()` — when all blocks are done and final review is APPROVED"] },
        ],
      },
      review_manager: {
        title: "review-manager",
        color: "#92400e",
        nodeType: "ORCHESTRATOR AGENT",
        sections: [
          { heading: "Role", items: ["Review orchestrator — never a direct reviewer", "Spawns in parallel: code-reviewer, security-reviewer, requirements-reviewer", "Synthesizes verdicts and arbitrates disagreements"] },
          { heading: "Skip authorized only if", items: ["Docs-only change (no code modified)", "No possible security impact", "User explicitly requests speed"] },
        ],
      },
      verdict: {
        title: "Review verdict?",
        color: "#b45309",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["APPROVED → Synthesize & Report", "CHANGES_REQUESTED → re-delegate fixes to producer → re-review (max 2 rounds)", "BLOCKED → immediate user escalation, do not fix without user input"] },
        ],
      },
      changes_loop: {
        title: "↩ Fix + re-review (max 2)",
        color: "#b45309",
        nodeType: "LOOP",
        sections: [
          { heading: "Process", items: ["Send precise fixes back to the producer agent", "Re-run through review-manager", "Maximum 2 rounds total"] },
        ],
      },
      escalade_blocked: {
        title: "Escalation — BLOCKED",
        color: "#991b1b",
        nodeType: "ESCALATION",
        sections: [
          { heading: "Strict rules", items: ["Report the precise problem identified by the reviewer", "Explain why it is blocking (not just a warning)", "Propose NO fix in the escalation message", "Wait for explicit instruction before continuing"] },
        ],
      },
      synthesize: {
        title: "5. Synthesize & Report",
        color: "#15803d",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Self-evaluation", items: ["Answers the real request (not the interpreted one)?", "No contradiction between agent results?", "Nothing missing in the deliverable?"] },
          { heading: "Memory update", items: ["Clean up scratchpad (completed tasks)"] },
        ],
      },
      autoeval: {
        title: "Self-eval OK?",
        color: "#15803d",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["OK → final report to user", "Minor gap (missing detail) → quick fix then report", "Major gap (wrong approach) → back to Delegate"] },
        ],
      },
      gap_majeur: {
        title: "↩ Back to Delegate",
        color: "#166534",
        nodeType: "LOOP",
        sections: [
          { heading: "Treatment", items: ["Treat the gap as a new task", "Resume from Delegate phase", "Update todo list and scratchpad before delegating"] },
        ],
      },
      fix_rapide: {
        title: "Quick fix",
        color: "#166534",
        nodeType: "ACTION",
        sections: [
          { heading: "Treatment", items: ["Fix the missing detail directly", "No need to go through Review if the fix is trivial", "Include in the final report"] },
        ],
      },
      end: {
        title: "Report to user",
        color: "#1e293b",
        nodeType: "DELIVERY",
        sections: [
          { heading: "Delivery", items: ["Concise summary of changes made", "Any issues reported honestly", "Suggested next steps if relevant"] },
        ],
      },
      harness_suggest: {
        title: "Harness? (optional)",
        color: "#166534",
        nodeType: "POST-DELIVERY (OPTIONAL)",
        sections: [
          { heading: "When to suggest", items: ["A pattern has been explained multiple times to different agents", "An architectural decision keeps getting violated", "A convention is not yet enforced by lint or CI"] },
          { heading: "Rules", items: ["Never without explicit user confirmation", "Never at mission start — only post-delivery", "Never on the critical path — always a final suggestion", "Propose, never launch automatically"] },
        ],
      },
      uf_start: {
        title: "Session Start",
        color: "#1e293b",
        nodeType: "ENTRY POINT",
        sections: [
          { heading: "First action", items: ["Always scan `docs/briefs/` before anything else — no exceptions"] },
        ],
      },
      uf_scan: {
        title: "Scan docs/briefs/",
        color: "#6d28d9",
        nodeType: "MANDATORY ACTION",
        sections: [
          { heading: "Rule", items: ["Scan `docs/briefs/` regardless of how much context the user provided", "This is mandatory — there are no exceptions"] },
        ],
      },
      uf_briefs_found: {
        title: "Brief(s) found?",
        color: "#64748b",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["NONE → proceed to Phase 1 directly, no question asked", "ONE → check status (draft / done / other)", "MULTIPLE → list all briefs, ask which one or new project"] },
        ],
      },
      uf_brief_status: {
        title: "Status: draft?",
        color: "#64748b",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["YES (draft) → ask: continue editing or start fresh?", "NO (done/other) → ask: revise this brief or start a new project?"] },
        ],
      },
      uf_ask_continue: {
        title: "Continue or fresh?",
        color: "#7c3aed",
        nodeType: "USER QUESTION",
        sections: [
          { heading: "Options", items: ["CONTINUE → load brief, jump directly to Step 3 (revision mode)", "FRESH → normal Step 1 flow"] },
        ],
      },
      uf_ask_revise: {
        title: "Revise or new project?",
        color: "#7c3aed",
        nodeType: "USER QUESTION",
        sections: [
          { heading: "Options", items: ["REVISE → load brief, jump directly to Step 3 (revision mode)", "NEW PROJECT → normal Step 1 flow"] },
        ],
      },
      uf_load_brief: {
        title: "Load brief",
        color: "#7c3aed",
        nodeType: "ACTION",
        sections: [
          { heading: "What happens", items: ["Reads the existing brief for revision mode", "Jumps directly to Step 3 — skip Step 1 and Step 2"] },
          { heading: "Fast path", items: ["If the user's opening message already provides sufficient context → offer to draft immediately (Step 3 direct)"] },
        ],
      },
      uf_no_brief: {
        title: "No brief → Phase 1",
        color: "#475569",
        nodeType: "TRANSITION",
        sections: [
          { heading: "Rule", items: ["No question asked — proceed directly to Phase 1 (Understand + Plan)", "Also the path when user chooses 'fresh start' or 'new project'"] },
        ],
      },
      uf_multi_found: {
        title: "Multiple briefs found",
        color: "#7c3aed",
        nodeType: "ACTION",
        sections: [
          { heading: "What happens", items: ["List all briefs with path + status + project name", "Ask: which one to work on? (or new project?)", "Once chosen, follows the same logic as 'one brief found'"] },
        ],
      },
      uf_brief_end: {
        title: "Brief written",
        color: "#6d28d9",
        nodeType: "PHASE 0 OUTPUT",
        sections: [
          { heading: "Output", items: ["Brief saved to `docs/briefs/{project-name}.md`"] },
          { heading: "Hand-off", items: ["Says: 'Hand it to Planning to break into an exec-plan, or to Orion if scope is already clear enough'", "This is a verbal suggestion — NOT an automatic delegation"] },
        ],
      },
      // ── Unified flowchart phases ──
      phase0_brief_check: {
        title: "Phase 0 — BRAINSTORM (optional)",
        color: "#7c3aed",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Entry", items: ["Scan `docs/briefs/` — always, no exceptions", "No brief → Phase 1 directly", "Draft brief → ask: continue or fresh start?", "Multiple briefs → list + choose"] },
          { heading: "Fast path", items: ["If scope is already clear in the message → dashed arrow directly to Phase 1", "Verbal suggestion only — never automatic delegation"] },
        ],
      },
      phase0_run_brainstorm: {
        title: "Run brainstorm agent",
        color: "#7c3aed",
        nodeType: "ACTION",
        sections: [
          { heading: "Agent brainstorm", items: ["Step 1 — Discovery: surface the problem", "Step 2 — Deep Dive: scope, criteria, constraints, risks", "Step 3 — Draft + Validation: full brief, quality gate"] },
        ],
      },
      phase0_produce_brief: {
        title: "Produce brief",
        color: "#7c3aed",
        nodeType: "PHASE 0 OUTPUT",
        sections: [
          { heading: "Output", items: ["Brief written to `docs/briefs/{project-name}.md`"] },
          { heading: "Hand-off", items: ["Verbal suggestion: hand to Planning or to Orion if scope is clear enough"] },
        ],
      },
      phase1_read_sp: {
        title: "Phase 1 — PLAN",
        color: "#1d4ed8",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Strict order (9 steps)", items: [
            "1. Read `.opencode/scratchpad.md`",
            "2. Call `project_state()`",
            "3. Call `check_artifacts()`",
            "4. Clarify intent (ambiguous? bug?)",
            "5. Identify number of scopes",
            "6. Choose plan type (inline or exec-plan)",
            "7. Call `todowrite`",
            "8. Write/update scratchpad",
            "9. `compress` before entering Phase 2",
          ]},
        ],
      },
      phase1_project_state: {
        title: "project_state() + check_artifacts()",
        color: "#1d4ed8",
        nodeType: "LIFECYCLE TOOLS",
        sections: [
          { heading: "Mandatory at mission start", items: ["`project_state()` — full view of exec-plans, specs, briefs", "`check_artifacts()` — cross-artifact consistency scan"] },
        ],
      },
      phase1_clarify: {
        title: "Clarify intent → scope → plan type",
        color: "#1d4ed8",
        nodeType: "ACTION",
        sections: [
          { heading: "Decisions", items: ["Ambiguous? → ask via `question` tool", "Multiple scopes? → propose order, wait for agreement", "Simple plan → inline in scratchpad", "Complex task → invoke `planning` agent → exec-plan"] },
        ],
      },
      phase1_todowrite: {
        title: "todowrite + write scratchpad",
        color: "#1d4ed8",
        nodeType: "ACTION",
        sections: [
          { heading: "Actions", items: ["Create/update visible task list", "Write goal, plan, decisions, open questions into scratchpad"] },
        ],
      },
      phase1_compress: {
        title: "compress stale context",
        color: "#1d4ed8",
        nodeType: "CONTEXT MANAGEMENT",
        sections: [
          { heading: "DCP tools", items: ["`distill` — summarize long outputs", "`prune` — cut exploratory outputs already distilled", "`compress` — clean context before Phase 2"] },
        ],
      },
      phase2_bug: {
        title: "Phase 2 — DELEGATE",
        color: "#15803d",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Agent selection hierarchy", items: ["1. User-defined agents (files in agent/)", "2. Named plugin agents (bug-finder, review-manager…)", "3. `explore` — read-only, faster", "4. `general` + persona — fallback only"] },
          { heading: "Delegation cycle", items: ["Update scratchpad before delegating", "Delegate via `task`", "Success → update scratchpad, distill, mark_block_done", "Failure → diagnose then retry ≤2, else escalate"] },
        ],
      },
      phase2_bug_finder: {
        title: "bug-finder",
        color: "#dc2626",
        nodeType: "SPECIALIZED AGENT",
        sections: [
          { heading: "Role", items: ["Force root-cause analysis BEFORE any fix"] },
          { heading: "Verdicts", items: ["HIGH → fix via `general`", "MEDIUM → fix + report uncertainty", "UNCERTAINTY_EXPOSED → stop, user escalation"] },
        ],
      },
      phase2_select_agent: {
        title: "Select agent (hierarchy)",
        color: "#15803d",
        nodeType: "ACTION",
        sections: [
          { heading: "Rule", items: ["User-defined > plugin named > explore > general+persona", "If `explore` or `general` suffice → don't invent a persona"] },
        ],
      },
      phase2_handoff: {
        title: "Context handoff A→B",
        color: "#15803d",
        nodeType: "ACTION",
        sections: [
          { heading: "Self-sufficient prompt", items: ["Include file paths, constraints, expected output", "Sequential agents: extract essentials from A, give B what changed/decided/discovered", "Parallel = multiple `task` calls in the same message"] },
        ],
      },
      phase2_success: {
        title: "Agent success?",
        color: "#15803d",
        nodeType: "DECISION",
        sections: [
          { heading: "On failure", items: ["Bad prompt → reformulate", "Context overflow → decompose", "Missing info → enrich (explore first)", "Wrong persona → change", "Fundamental block → escalate"] },
          { heading: "Rule", items: ["Max 2 retries (all types combined) → user escalation"] },
        ],
      },
      phase2_retry: {
        title: "retry ≤2",
        color: "#d97706",
        nodeType: "LOOP",
        sections: [
          { heading: "Process", items: ["Diagnose the cause", "Reformulate / decompose / enrich / change persona", "Always change something between attempts"] },
        ],
      },
      phase2_esc_user: {
        title: "Escalate to user",
        color: "#991b1b",
        nodeType: "ESCALATION",
        sections: [
          { heading: "Rules", items: ["Describe the 2 attempts made", "Explain diagnosis of each failure", "Propose options: rephrase, provide context", "Never retry a 3rd time without instruction"] },
        ],
      },
      phase3_delegate_rm: {
        title: "Phase 3 — REVIEW",
        color: "#b45309",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Absolute rule", items: ["ALWAYS via review-manager — never a direct reviewer"] },
          { heading: "Provide to review-manager", items: ["Modified files + summary of changes", "Original user requirements", "Trade-offs and decisions made", "What was explicitly out of scope"] },
          { heading: "Fresh start vs Resume", items: ["Fresh (no task_id) for new reviews", "Resume (task_id) for corrections after CHANGES_REQUESTED"] },
        ],
      },
      phase3_verdict: {
        title: "Verdict?",
        color: "#b45309",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["APPROVED → Phase 4 (Synthesize)", "CHANGES_REQUESTED → re-delegate fixes to producer → re-review (max 2 rounds)", "BLOCKED → immediate escalation, do not fix without user input"] },
        ],
      },
      phase3_resume_fix: {
        title: "Resume producer → fix",
        color: "#d97706",
        nodeType: "LOOP",
        sections: [
          { heading: "Process", items: ["Send precise fixes back to producer agent (resume, task_id)", "Re-run through review-manager", "Maximum 2 rounds total"] },
        ],
      },
      phase3_blocked_esc: {
        title: "Escalation — BLOCKED",
        color: "#991b1b",
        nodeType: "ESCALATION",
        sections: [
          { heading: "Strict rules", items: ["Report the precise problem identified by the reviewer", "Explain why it is blocking", "Propose NO fix in the escalation message", "Wait for explicit instruction before continuing"] },
        ],
      },
      phase4_self_eval: {
        title: "Phase 4 — SYNTHESIZE",
        color: "#4338ca",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Self-evaluation (mandatory before reporting)", items: ["1. Does the result fully answer the original request?", "2. Are multi-agent outputs coherent?", "3. Does anything nag about correctness or side effects?"] },
          { heading: "Gap types", items: ["Minor gap → quick fix then report", "Major gap → loop back to Phase 2 (Delegate)", "Scope confusion → ask user before delivering"] },
        ],
      },
      phase4_gap: {
        title: "Gap type?",
        color: "#4338ca",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["OK → final report", "Minor → quick fix → sp_capture", "Major → back to Phase 2 (dashed loop)", "Scope → ask user"] },
        ],
      },
      phase4_minor: {
        title: "Minor gap → quick fix",
        color: "#d97706",
        nodeType: "ACTION",
        sections: [
          { heading: "Treatment", items: ["Fix the missing detail directly", "No need to go through Review if trivial", "Include in the final report"] },
        ],
      },
      phase4_scope: {
        title: "Scope confusion → ask user",
        color: "#64748b",
        nodeType: "ACTION",
        sections: [
          { heading: "Treatment", items: ["Do not deliver a wrong answer", "Ask the precise question before continuing"] },
        ],
      },
      phase4_sp_capture: {
        title: "Final scratchpad capture",
        color: "#4338ca",
        nodeType: "ACTION",
        sections: [
          { heading: "Before reporting", items: ["Mark mission as complete in the scratchpad", "Do not delete it (user might return)", "`## Plan` — all task statuses final", "`## Decisions` — any last decisions recorded"] },
        ],
      },
      phase4_report: {
        title: "Report (human-tone)",
        color: "#4338ca",
        nodeType: "DELIVERY",
        sections: [
          { heading: "Communication rules", items: ["Lead with the outcome, not the process", "Highlight what succeeded and what failed", "Be honest about issues — don't sugarcoat agent failures", "Propose concrete next steps if applicable"] },
        ],
      },
      phase5_pattern: {
        title: "Phase 5 — MAINTENANCE",
        color: "#475569",
        nodeType: "MAIN PHASE",
        sections: [
          { heading: "Two independent paths", items: ["Path A — Harness: encode pattern as mechanical artifact (lint, CI, AGENTS.md)", "Path B — Gardener: fix stale docs + detect code drift"] },
          { heading: "Rules", items: ["Never without explicit user confirmation", "Never at mission start — only post-delivery"] },
        ],
      },
      phase5_harness: {
        title: "Harness",
        color: "#15803d",
        nodeType: "SPECIALIZED AGENT",
        sections: [
          { heading: "When to suggest", items: ["A pattern explained multiple times to sub-agents", "An architectural decision that keeps getting violated", "A convention not yet enforced by lint or CI"] },
          { heading: "What harness produces", items: ["Code convention → custom lint rule (ESLint, Ruff…)", "Build/deploy constraint → CI job", "Agent rule → AGENTS.md entry", "Non-mechanizable principle → docs/guiding-principles.md entry"] },
        ],
      },
      phase5_gardener: {
        title: "Gardener",
        color: "#475569",
        nodeType: "SPECIALIZED AGENT",
        sections: [
          { heading: "Function 1 — Doc-Gardening", items: ["Detects stale references, outdated descriptions, broken links", "Fixes stale content, opens one PR per document"] },
          { heading: "Function 2 — Code-GC", items: ["One-time drift → targeted refactoring PR", "Recurring pattern → escalate to Harness"] },
        ],
      },
      phase5_recurring: {
        title: "Recurring pattern?",
        color: "#475569",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["YES → escalate to Harness (confirmation required)", "NO → targeted PR only"] },
        ],
      },
      phase5_esc_harness: {
        title: "Escalate to Harness",
        color: "#15803d",
        nodeType: "ACTION",
        sections: [
          { heading: "Process", items: ["Gardener checks with Orion / user before triggering Harness", "Harness proceeds directly once invoked — does not re-ask"] },
        ],
      },
      phase_start: {
        title: "User request",
        color: "#1e293b",
        nodeType: "ENTRY POINT",
        sections: [
          { heading: "Entry point", items: ["User submits a request", "Orion scans existing briefs first before any other action"] },
        ],
      },
      phase_end: {
        title: "Report to user",
        color: "#1e293b",
        nodeType: "DELIVERY",
        sections: [
          { heading: "Delivery", items: ["Concise summary of changes made", "Any issues reported honestly", "Suggested next steps if relevant"] },
        ],
      },
      phase0: {
        title: "Phase 0 — BRAINSTORM (optional)",
        color: "#7c3aed",
        nodeType: "PHASE",
        sections: [{ heading: "Purpose", items: ["Discovery phase. Runs when the request is vague or a new project is starting.", "Produces a product brief at docs/briefs/{project-name}.md.", "Optional — if brief already exists or scope is clear, fast-path to Phase 1."] }],
      },
      phase1: {
        title: "Phase 1 — PLAN",
        color: "#1d4ed8",
        nodeType: "PHASE",
        sections: [{ heading: "Purpose", items: ["Strict 9-step planning sequence.", "Read scratchpad → lifecycle tools → clarify → scope → plan type → todowrite → write scratchpad → compress."] }],
      },
      phase2: {
        title: "Phase 2 — DELEGATE",
        color: "#15803d",
        nodeType: "PHASE",
        sections: [{ heading: "Purpose", items: ["Select agents (strict hierarchy), delegate via task, handle failures with retry ≤2.", "Bug reports always go to bug-finder first."] }],
      },
      phase3: {
        title: "Phase 3 — REVIEW",
        color: "#b45309",
        nodeType: "PHASE",
        sections: [{ heading: "Purpose", items: ["Always via review-manager (never direct reviewers).", "APPROVED → Phase 4, CHANGES_REQUESTED → re-delegate (max 2 rounds), BLOCKED → escalate."] }],
      },
      phase4: {
        title: "Phase 4 — SYNTHESIZE",
        color: "#4338ca",
        nodeType: "PHASE",
        sections: [{ heading: "Purpose", items: ["Self-eval (3 questions) → gap handling → final scratchpad capture → human-tone report."] }],
      },
      phase5: {
        title: "Phase 5 — MAINTENANCE",
        color: "#475569",
        nodeType: "PHASE",
        sections: [{ heading: "Purpose", items: ["Post-delivery, optional. Two paths: Harness (pattern enforcement) and Gardener (doc/code drift detection)."] }],
      },
    },
    brainstormSvgLabels: {
      bs_start: "Session Start",
      bs_existing_check: "Existing briefs?",
      bs_single_found: "One brief found",
      bs_multi_found: "Multiple found",
      bs_status_check: "Status = draft?",
      bs_ask_continue: "Continue or fresh?",
      bs_load_brief: "Load brief",
      bs_phase1: "Step 1 — Discovery",
      bs_problem_clear: "Problem clear?",
      bs_phase2: "Step 2 — Deep Dive",
      bs_adversarial: "Adversarial Gate",
      bs_template_fillable: "All sections fillable?",
      bs_phase3: "Step 3 — Draft + Validate",
      bs_quality_gate: "Quality Gate",
      bs_quality_passed: "Quality gate passed?",
      bs_file_exists: "File already exists?",
      bs_file_conflict: "Overwrite / version / rename?",
      bs_write: "Write file",
      bs_end: "Brief written. Hand to Planning or Orion.",
      bs_arrow_yes: "YES",
      bs_arrow_no: "NO",
      bs_arrow_one: "ONE",
      bs_arrow_multiple: "MULTIPLE",
      bs_arrow_none: "NONE",
      bs_arrow_draft: "DRAFT",
      bs_arrow_done: "DONE",
      bs_arrow_continue: "CONTINUE",
      bs_arrow_fresh: "FRESH",
      bs_arrow_choose: "CHOOSE EXISTING",
      bs_arrow_new: "NEW PROJECT",
      bs_arrow_all_fillable: "YES",
      bs_arrow_missing: "NO",
      bs_arrow_passed: "PASSED",
      bs_arrow_tier2: "TIER 2",
      bs_arrow_blocked: "BLOCKED",
      bs_esc_blocked_label: "Escalation",
      bs_esc_blocked_sub: "BLOCKED",
      bs_arrow_overwrite: "OVERWRITE",
      bs_arrow_version: "NEW VERSION",
      bs_arrow_rename: "RENAME",
    },
    brainstormDetails: {
      bs_start: {
        title: "Session Start",
        color: "#0d9488",
        nodeType: "ENTRY POINT",
        sections: [
          { heading: "What happens", items: ["Session is initiated with brainstorm agent", "Scans `docs/briefs/` for existing briefs", "Routing decision made before any questions are asked"] },
        ],
      },
      bs_existing_check: {
        title: "Existing briefs found?",
        color: "#0d9488",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["NO → Flow normal → Step 1 (Discovery)", "ONE found → check status (draft / done)", "MULTIPLE found → list briefs, ask which one or new project"] },
        ],
      },
      bs_single_found: {
        title: "One brief found",
        color: "#0891b2",
        nodeType: "ACTION",
        sections: [
          { heading: "What happens", items: ["Single brief located at docs/briefs/", "Agent checks the status field in the brief frontmatter", "Routes to status decision"] },
        ],
      },
      bs_multi_found: {
        title: "Multiple briefs found",
        color: "#0891b2",
        nodeType: "ACTION",
        sections: [
          { heading: "What happens", items: ["Agent lists all found briefs to the user", "Asks: which one to resume, or start a new project?", "CHOOSE EXISTING → Load brief → Step 3 (revision)", "NEW PROJECT → Flow normal → Step 1"] },
        ],
      },
      bs_status_check: {
        title: "Status = draft?",
        color: "#0891b2",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["YES (draft) → Ask: continue or fresh start?", "NO (done/other) → Inform user, ask new project name → Step 1"] },
        ],
      },
      bs_ask_continue: {
        title: "Continue or fresh start?",
        color: "#0891b2",
        nodeType: "ACTION",
        sections: [
          { heading: "What happens", items: ["User is shown the existing draft brief summary", "Asked: resume from where we left off, or start fresh?", "CONTINUE → Load brief → jump directly to Step 3 (revision)", "FRESH → Ignore existing brief → Step 1 (Discovery)"] },
        ],
      },
      bs_load_brief: {
        title: "Load brief",
        color: "#0891b2",
        nodeType: "ACTION",
        sections: [
          { heading: "What happens", items: ["Agent reads the existing brief file from docs/briefs/", "Provides full context to Step 3 (revision mode)", "User can iterate on the existing content rather than restarting"] },
        ],
      },
      bs_phase1: {
        title: "Step 1 — Discovery",
        color: "#2563eb",
        nodeType: "MAIN STEP",
        sections: [
          { heading: "Core question", items: ["\"What problem are you trying to solve, and who experiences it?\""] },
          { heading: "Rules", items: ["Max 2 questions at a time — never overwhelm", "Surface the problem, not the solution", "Do not accept vague answers — push for specifics", "Iterate until problem is stated clearly"] },
          { heading: "Exit criteria", items: ["Problem stated in 2–4 sentences", "Primary user named", "Problem is a problem, not a feature"] },
        ],
      },
      bs_problem_clear: {
        title: "Problem clear?",
        color: "#2563eb",
        nodeType: "DECISION",
        sections: [
          { heading: "Exit criteria", items: ["YES → problem stated in 2–4 clear sentences AND primary user named → Step 2", "NO → iterate — ask more targeted follow-up questions"] },
        ],
      },
      bs_phase2: {
        title: "Step 2 — Deep Dive",
        color: "#4f46e5",
        nodeType: "MAIN STEP",
        sections: [
          { heading: "Topics to cover", items: ["Scope and boundaries — what is explicitly out of scope?", "Success criteria — how will you know it worked?", "Use cases — top 3–5 concrete scenarios", "Constraints — technical, time, team, budget", "Rejected ideas — what was considered and discarded?"] },
          { heading: "Socratic pressure", items: ["Challenge assumptions — \"Why is X the right approach?\"", "Ask about failure modes — \"What would make this fail?\"", "Probe edges — \"What happens when Y doesn't work?\""] },
        ],
      },
      bs_adversarial: {
        title: "Adversarial Gate",
        color: "#7c3aed",
        nodeType: "GATE",
        sections: [
          { heading: "Two mandatory questions", items: ["\"What is the strongest case against building this?\"", "\"What would have to be true for this to fail in year 1?\""] },
          { heading: "Purpose", items: ["Forces the user to articulate real risks", "Prevents over-optimistic briefs that skip failure modes", "If user can't answer, the problem statement needs more work"] },
        ],
      },
      bs_template_fillable: {
        title: "All template sections fillable?",
        color: "#7c3aed",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["YES → proceed to Step 3 (draft + validation)", "NO → iterate back in Step 2 — identify which sections are still empty"] },
          { heading: "Template sections required", items: ["Problem statement", "Primary user", "Success criteria", "Top use cases", "Constraints", "Out of scope", "Risks / adversarial answers"] },
        ],
      },
      bs_phase3: {
        title: "Step 3 — Draft + Validation",
        color: "#6d28d9",
        nodeType: "MAIN STEP",
        sections: [
          { heading: "What happens", items: ["Agent generates the full brief inline from collected context", "User reviews the draft and provides feedback", "Agent iterates until user confirms the brief is ready", "Quality gate is run before writing to disk"] },
          { heading: "Output format", items: ["Markdown file at docs/briefs/{project-name}.md", "Structured sections: problem, users, success criteria, use cases, constraints, risks"] },
        ],
      },
      bs_quality_gate: {
        title: "Quality Gate",
        color: "#6d28d9",
        nodeType: "GATE",
        sections: [
          { heading: "Tier 1 — auto-fix silently", items: ["Minor formatting issues", "Incomplete sentences that can be inferred", "Missing punctuation or capitalization"] },
          { heading: "Tier 2 — ask user via question tool", items: ["Ambiguous success criteria", "Conflicting constraints", "Vague scope boundaries"] },
          { heading: "BLOCKED — escalate immediately", items: ["No problem statement at all", "No success criteria", "Empty scope — can't determine what to build"] },
        ],
      },
      bs_quality_passed: {
        title: "Quality gate passed?",
        color: "#6d28d9",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["PASSED → proceed to file write check", "TIER 2 issues → ask user → resolve → re-run gate", "BLOCKED (no problem, no success criteria, empty scope) → STOP — escalate to user, do not write"] },
        ],
      },
      bs_file_exists: {
        title: "File already exists?",
        color: "#7c3aed",
        nodeType: "DECISION",
        sections: [
          { heading: "Check", items: ["Agent checks if docs/briefs/{project-name}.md already exists on disk"] },
          { heading: "Branches", items: ["NO → write directly", "YES → ask user: overwrite, new version, or rename?"] },
        ],
      },
      bs_file_conflict: {
        title: "Overwrite / new version / rename?",
        color: "#7c3aed",
        nodeType: "ACTION",
        sections: [
          { heading: "Options", items: ["OVERWRITE → replace existing file with new brief", "NEW VERSION → write as {name}-v2.md (or -v3, etc.)", "RENAME → write with a custom filename provided by the user"] },
        ],
      },
      bs_write: {
        title: "Write file",
        color: "#15803d",
        nodeType: "ACTION",
        sections: [
          { heading: "What happens", items: ["Agent writes the validated brief to docs/briefs/{project-name}.md", "File is created or overwritten depending on the conflict resolution choice", "Brief is ready for Planning or Orion to consume"] },
        ],
      },
      bs_end: {
        title: "Brief written",
        color: "#1e293b",
        nodeType: "DELIVERY",
        sections: [
          { heading: "Handoff", items: ["Brief written to docs/briefs/{project-name}.md", "Hand to Planning agent for execution plan", "Or hand to Orion (team-lead) directly for implementation"] },
        ],
      },
      bs_esc_blocked: {
        title: "Escalation — BLOCKED",
        color: "#991b1b",
        nodeType: "ESCALATION",
        sections: [
          { heading: "When this triggers", items: ["No problem statement at all", "No success criteria defined", "Scope is empty — cannot determine what to build"] },
          { heading: "What happens", items: ["Agent stops immediately — does not write the brief", "Reports precisely what is missing to the user", "User must provide the missing information before continuing"] },
        ],
      },
      uf_step1: {
        title: "Step 1 — Discovery",
        color: "#2563eb",
        nodeType: "BRAINSTORM SUB-STEP",
        sections: [
          { heading: "Role", items: ["Agent asks targeted questions about the project", "Surfaces the core problem and the affected users", "Max 2 questions at a time — never overwhelm"] },
          { heading: "Exit criteria", items: ["Problem stated in 2–4 sentences", "Primary user named", "Problem is a problem, not a feature"] },
        ],
      },
      uf_step2: {
        title: "Step 2 — Brief draft",
        color: "#4f46e5",
        nodeType: "BRAINSTORM SUB-STEP",
        sections: [
          { heading: "What happens", items: ["Agent generates the full brief inline from collected context", "User reviews and provides feedback", "Agent iterates until validated", "Quality gate is run before writing to disk"] },
          { heading: "Output", items: ["Markdown file at docs/briefs/{project-name}.md"] },
        ],
      },
      uf_step3: {
        title: "Step 3 — Alignment",
        color: "#6d28d9",
        nodeType: "BRAINSTORM SUB-STEP",
        sections: [
          { heading: "What happens", items: ["Brief is reviewed with the user", "Iteration until confirmation", "Once validated: suggest handing off to Planning or Orion"] },
          { heading: "Modes", items: ["Normal path: Step 1 → Step 2 → Step 3", "Fast path: existing brief loaded → Step 3 directly"] },
        ],
      },
    },
    unifiedSvgLabels: {
      uf_start: "Session start",
      uf_scan: "Scan docs/briefs/",
      uf_scan_sub: "(always — mandatory)",
      uf_briefs_found: "Brief(s) found?",
      uf_no_brief: "No brief → Phase 1",
      uf_brief_status: "Status: draft?",
      uf_ask_continue: "Continue or fresh?",
      uf_ask_revise: "Revise or new project?",
      uf_load_brief: "Load brief",
      uf_multi_found: "Multiple briefs → list + choose",
      uf_brief_end: "Brief written",
      uf_brief_end_sub: "suggest Planning or Orion",
      uf_phase0_label: "Phase 0 — BRAINSTORM (optional)",
      uf_placeholder_label: "Phase 1–5 (coming next)",
      uf_step1_label: "Step 1 — Discovery",
      uf_step2_label: "Step 2 — Brief draft",
      uf_step3_label: "Step 3 — Alignment",
      uf_expand_hint: "Show steps",
      uf_collapse_hint: "Hide steps",
      uf_arrow_none: "NONE",
      uf_arrow_one: "ONE",
      uf_arrow_multiple: "MULTIPLE",
      uf_arrow_draft: "DRAFT",
      uf_arrow_done: "DONE",
      uf_arrow_continue: "CONTINUE",
      uf_arrow_fresh: "FRESH",
      uf_arrow_revise: "REVISE",
      uf_arrow_new_project: "NEW PROJECT",
      uf_arrow_phase3: "→ Step 3",
    },
  };
}

// ─── MainFlowChart ─────────────────────────────────────────────────────────────
// Unified Phase 0→5 flowchart rendered with Mermaid.js

interface MainFlowChartProps {
  lang: "en" | "fr";
  onNodeClick: (id: string) => void;
  selectedNode: string | null;
}

function buildMainDiagram(lang: "en" | "fr"): string {
  const isEn = lang === "en";
  const L = {
    start: isEn ? "User request" : "Requête utilisateur",
    p0_label: isEn ? "Phase 0 — BRAINSTORM optional" : "Phase 0 — BRAINSTORM optionnel",
    p1_label: isEn ? "Phase 1 — PLAN" : "Phase 1 — PLAN",
    p2_label: isEn ? "Phase 2 — DELEGATE" : "Phase 2 — DELEGATE",
    p3_label: isEn ? "Phase 3 — REVIEW" : "Phase 3 — REVIEW",
    p4_label: isEn ? "Phase 4 — SYNTHESIZE" : "Phase 4 — SYNTHESIZE",
    p5_label: isEn ? "Phase 5 — MAINTENANCE" : "Phase 5 — MAINTENANCE",
    brief_check: isEn ? "Brief exist?" : "Brief existe ?",
    yes: isEn ? "YES" : "OUI",
    no: isEn ? "NO" : "NON",
    fast_path: isEn ? "fast path" : "chemin rapide",
    run_brainstorm: isEn ? "Run brainstorm agent" : "Lancer agent brainstorm",
    produce_brief: isEn ? "Produce brief" : "Produire le brief",
    read_sp: isEn ? "Read scratchpad" : "Lire scratchpad",
    project_state: "project_state + check_artifacts",
    clarify: isEn ? "Clarify intent scope plan" : "Clarifier intention scope plan",
    todowrite: isEn ? "todowrite + write scratchpad" : "todowrite + scratchpad",
    compress: isEn ? "compress stale context" : "compress contexte obsolète",
    bug_q: isEn ? "Bug report?" : "Bug report ?",
    bug_finder: "bug-finder first",
    select_agent: isEn ? "Select agent hierarchy" : "Sélectionner agent",
    handoff: "Context handoff A to B",
    success_q: isEn ? "Agent success?" : "Succès agent ?",
    retry: isEn ? "retry max 2" : "retry max 2",
    esc_user: isEn ? "Escalate to user" : "Escalade utilisateur",
    delegate_rm: isEn ? "Delegate to review-manager" : "Déléguer review-manager",
    verdict_q: isEn ? "Verdict?" : "Verdict ?",
    approved: "APPROVED",
    changes: "CHANGES_REQUESTED",
    blocked: "BLOCKED",
    resume_fix: isEn ? "Resume producer fix" : "Reprendre producteur fix",
    self_eval: isEn ? "Self-eval 3 questions" : "Auto-eval 3 questions",
    gap_q: isEn ? "Gap type?" : "Type gap ?",
    minor_gap: isEn ? "minor gap quick fix" : "gap mineur fix rapide",
    scope_conf: isEn ? "scope confusion ask user" : "confusion scope demander user",
    major: isEn ? "major gap" : "gap majeur",
    sp_capture: isEn ? "Final scratchpad capture" : "Capture finale scratchpad",
    report_human: isEn ? "Report human-tone" : "Rapport human-tone",
    pattern_q: isEn ? "Pattern type?" : "Type pattern ?",
    harness: isEn ? "Harness lint CI AGENTS" : "Harness lint CI AGENTS",
    gardener: isEn ? "Gardener stale docs code GC" : "Gardener docs obsolètes code GC",
    recurring_q: isEn ? "Recurring pattern?" : "Pattern récurrent ?",
    esc_harness: isEn ? "Escalate to Harness" : "Escalader vers Harness",
    end: isEn ? "Report to user" : "Rapport à l'utilisateur",
    enforcement: isEn ? "needs enforcement" : "enforcement requis",
    docs_drift: isEn ? "docs / drift" : "docs / dérive",
  };

  return `flowchart TD
    START(["${L.start}"])

    subgraph P0["${L.p0_label}"]
        P0_CHECK{"${L.brief_check}"}
        P0_RUN["${L.run_brainstorm}"]
        P0_BRIEF["${L.produce_brief}"]
    end

    subgraph P1["${L.p1_label}"]
        P1_READ["${L.read_sp}"]
        P1_STATE["${L.project_state}"]
        P1_INTENT["${L.clarify}"]
        P1_TODO["${L.todowrite}"]
        P1_COMPRESS[/"${L.compress}"/]
    end

    subgraph P2["${L.p2_label}"]
        P2_BUG{"${L.bug_q}"}
        P2_BUGFINDER["${L.bug_finder}"]
        P2_SELECT["${L.select_agent}"]
        P2_HANDOFF["${L.handoff}"]
        P2_SUCCESS{"${L.success_q}"}
        P2_RETRY["${L.retry}"]
        P2_ESC[/"${L.esc_user}"/]
    end

    subgraph P3["${L.p3_label}"]
        P3_RM["${L.delegate_rm}"]
        P3_VERDICT{"${L.verdict_q}"}
        P3_FIX["${L.resume_fix}"]
        P3_BLOCKED[/"${L.blocked} escalate"/]
    end

    subgraph P4["${L.p4_label}"]
        P4_EVAL["${L.self_eval}"]
        P4_GAP{"${L.gap_q}"}
        P4_MINOR["${L.minor_gap}"]
        P4_SCOPE["${L.scope_conf}"]
        P4_SP["${L.sp_capture}"]
        P4_REPORT["${L.report_human}"]
    end

    subgraph P5["${L.p5_label}"]
        P5_PAT{"${L.pattern_q}"}
        P5_HARNESS["${L.harness}"]
        P5_GARDENER["${L.gardener}"]
        P5_RECUR{"${L.recurring_q}"}
        P5_ESC_H["${L.esc_harness}"]
    end

    END(["${L.end}"])

    START --> P0_CHECK
    P0_CHECK -- "${L.no}" --> P0_RUN
    P0_RUN --> P0_BRIEF
    P0_BRIEF --> P1_READ
    P0_CHECK -- "${L.yes}" --> P1_READ
    P0_CHECK -. "${L.fast_path}" .-> P2_SELECT

    P1_READ --> P1_STATE
    P1_STATE --> P1_INTENT
    P1_INTENT --> P1_TODO
    P1_TODO --> P1_COMPRESS
    P1_COMPRESS --> P2_BUG

    P2_BUG -- "${L.yes}" --> P2_BUGFINDER
    P2_BUG -- "${L.no}" --> P2_SELECT
    P2_BUGFINDER --> P2_SELECT
    P2_SELECT --> P2_HANDOFF
    P2_HANDOFF --> P2_SUCCESS
    P2_SUCCESS -- "${L.yes}" --> P3_RM
    P2_SUCCESS -- "${L.no}" --> P2_RETRY
    P2_RETRY --> P2_SUCCESS
    P2_RETRY -- "after 2 fails" --> P2_ESC

    P3_RM --> P3_VERDICT
    P3_VERDICT -- "${L.approved}" --> P4_EVAL
    P3_VERDICT -- "${L.changes}" --> P3_FIX
    P3_FIX --> P3_RM
    P3_VERDICT -- "${L.blocked}" --> P3_BLOCKED

    P4_EVAL --> P4_GAP
    P4_GAP -- "minor" --> P4_MINOR
    P4_GAP -- "${L.major}" --> P2_SELECT
    P4_GAP -- "scope?" --> P4_SCOPE
    P4_MINOR --> P4_SP
    P4_SCOPE --> P4_SP
    P4_SP --> P4_REPORT
    P4_REPORT --> P5_PAT

    P5_PAT -- "${L.enforcement}" --> P5_HARNESS
    P5_PAT -- "${L.docs_drift}" --> P5_GARDENER
    P5_GARDENER --> P5_RECUR
    P5_RECUR -- "${L.yes}" --> P5_ESC_H
    P5_ESC_H --> P5_HARNESS
    P5_RECUR -- "${L.no}" --> END
    P5_HARNESS --> END

    classDef phase0 fill:#7c3aed,color:#fff,stroke:#6d28d9
    classDef phase1 fill:#1d4ed8,color:#fff,stroke:#1e40af
    classDef phase2 fill:#15803d,color:#fff,stroke:#166534
    classDef phase3 fill:#b45309,color:#fff,stroke:#92400e
    classDef phase4 fill:#4338ca,color:#fff,stroke:#3730a3
    classDef phase5 fill:#475569,color:#fff,stroke:#334155
    classDef escalade fill:#fff,color:#dc2626,stroke:#dc2626,stroke-width:2px
    classDef terminal fill:#f0fdf4,color:#166534,stroke:#166534,stroke-width:2px

    class P0_CHECK,P0_RUN,P0_BRIEF phase0
    class P1_READ,P1_STATE,P1_INTENT,P1_TODO,P1_COMPRESS phase1
    class P2_BUG,P2_BUGFINDER,P2_SELECT,P2_HANDOFF,P2_SUCCESS,P2_RETRY phase2
    class P2_ESC escalade
    class P3_RM,P3_VERDICT,P3_FIX phase3
    class P3_BLOCKED escalade
    class P4_EVAL,P4_GAP,P4_MINOR,P4_SCOPE,P4_SP,P4_REPORT phase4
    class P5_PAT,P5_HARNESS,P5_GARDENER,P5_RECUR,P5_ESC_H phase5
    class START,END terminal`;
}

// Node ID to detail panel ID mapping
const MERMAID_NODE_MAP: Record<string, string> = {
  START: "phase_start",
  END: "phase_end",
  P0_CHECK: "phase0_brief_check",
  P0_RUN: "phase0_run_brainstorm",
  P0_BRIEF: "phase0_produce_brief",
  P1_READ: "phase1_read_sp",
  P1_STATE: "phase1_project_state",
  P1_INTENT: "phase1_clarify",
  P1_TODO: "phase1_todowrite",
  P1_COMPRESS: "phase1_compress",
  P2_BUG: "phase2_bug",
  P2_BUGFINDER: "phase2_bug_finder",
  P2_SELECT: "phase2_select_agent",
  P2_HANDOFF: "phase2_handoff",
  P2_SUCCESS: "phase2_success",
  P2_RETRY: "phase2_retry",
  P2_ESC: "phase2_esc_user",
  P3_RM: "phase3_delegate_rm",
  P3_VERDICT: "phase3_verdict",
  P3_FIX: "phase3_resume_fix",
  P3_BLOCKED: "phase3_blocked_esc",
  P4_EVAL: "phase4_self_eval",
  P4_GAP: "phase4_gap",
  P4_MINOR: "phase4_minor",
  P4_SCOPE: "phase4_scope",
  P4_SP: "phase4_sp_capture",
  P4_REPORT: "phase4_report",
  P5_PAT: "phase5_pattern",
  P5_HARNESS: "phase5_harness",
  P5_GARDENER: "phase5_gardener",
  P5_RECUR: "phase5_recurring",
  P5_ESC_H: "phase5_esc_harness",
  P0: "phase0",
  P1: "phase1",
  P2: "phase2",
  P3: "phase3",
  P4: "phase4",
  P5: "phase5",
};

function MainFlowChart({ lang, onNodeClick }: MainFlowChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      flowchart: { curve: "basis", htmlLabels: true, padding: 20 },
      themeVariables: {
        primaryColor: "#1d4ed8",
        primaryTextColor: "#ffffff",
        primaryBorderColor: "#1e40af",
        lineColor: "#64748b",
        secondaryColor: "#f1f5f9",
        tertiaryColor: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
      },
    });

    const diagramDef = buildMainDiagram(lang);
    const id = `main-flowchart-${Date.now()}`;

    mermaid.render(id, diagramDef).then(({ svg }) => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = svg;

      // Wire up click handlers on Mermaid nodes
      const svgEl = containerRef.current.querySelector("svg");
      if (svgEl) {
        svgEl.style.width = "100%";
        svgEl.style.maxWidth = "100%";
        svgEl.style.height = "auto";

        // Mermaid renders nodes as <g class="node"> with an id like "flowchart-P0_CHECK-N"
        svgEl.querySelectorAll("g.node").forEach((el) => {
          const rawId = el.id || "";
          // Extract node ID from Mermaid-generated IDs like "flowchart-P0_CHECK-0"
          const match = rawId.match(/flowchart-([A-Z0-9_]+)-\d+/);
          if (match) {
            const nodeKey = match[1];
            const detailId = MERMAID_NODE_MAP[nodeKey];
            if (detailId) {
              (el as HTMLElement).style.cursor = "pointer";
              el.addEventListener("click", () => onNodeClick(detailId));
            }
          }
        });

        // Also handle subgraph labels (phase headers)
        svgEl.querySelectorAll("g.cluster").forEach((el) => {
          const labelEl = el.querySelector(".cluster-label span, .nodeLabel");
          if (labelEl) {
            (el as HTMLElement).style.cursor = "pointer";
          }
        });
      }
    }).catch((err) => {
      console.error("Mermaid render error:", err);
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div style="color:#dc2626;padding:16px;font-family:monospace;font-size:12px;">Diagram render error. Check console.</div>`;
      }
    });
  }, [lang, onNodeClick]);

  return (
    <div style={{ width: "100%", overflowX: "auto", padding: "24px" }}>
      <div ref={containerRef} style={{ minWidth: "800px" }} />
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
  const parts = children.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} style={{ background: "#1e293b", color: "#e2e8f0", padding: "2px 6px", borderRadius: 4, fontSize: 13, fontFamily: "ui-monospace, monospace" }}>
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function VerdictBadge({ color, label, rest }: { color: string; label: string; rest: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
      <span style={{
        background: color + "20", color, border: `1px solid ${color}40`,
        borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700,
        whiteSpace: "nowrap", marginTop: 3, flexShrink: 0,
        fontFamily: "system-ui, sans-serif",
      }}>{label}</span>
      <span style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, fontFamily: "system-ui, sans-serif" }}>
        <Code>{rest.replace(/^[ →]+/, "→ ")}</Code>
      </span>
    </div>
  );
}

function FlowBullet({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
      <span style={{ color, fontWeight: 700, fontSize: 14, marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, fontFamily: "system-ui, sans-serif" }}>
        <Code>{text.replace(/^[ →]+/, "")}</Code>
      </span>
    </div>
  );
}

function NormalBullet({ item, nodeColor }: { item: string; nodeColor: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
      <span style={{ marginTop: 8, width: 7, height: 7, borderRadius: "50%", background: nodeColor + "60", border: `1.5px solid ${nodeColor}`, flexShrink: 0 }} />
      <span style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, fontFamily: "system-ui, sans-serif" }}>
        <Code>{item}</Code>
      </span>
    </div>
  );
}

function BulletItem({ item, nodeColor }: { item: string; nodeColor: string }) {
  if (item.startsWith("HIGH →") || item.startsWith("HIGH /")) return <VerdictBadge color="#16a34a" label="HIGH" rest={item.slice(4)} />;
  if (item.startsWith("MEDIUM")) return <VerdictBadge color="#d97706" label="MEDIUM" rest={item.slice(6)} />;
  if (item.startsWith("UNCERTAINTY_EXPOSED")) return <VerdictBadge color="#dc2626" label="UNCERTAINTY" rest={item.slice(19)} />;
  if (item.startsWith("APPROVED")) return <VerdictBadge color="#16a34a" label="APPROVED" rest={item.slice(8)} />;
  if (item.startsWith("CHANGES_REQUESTED")) return <VerdictBadge color="#d97706" label="CHANGES" rest={item.slice(17)} />;
  if (item.startsWith("BLOCKED")) return <VerdictBadge color="#dc2626" label="BLOCKED" rest={item.slice(7)} />;
  if (item.startsWith("OUI")) return <FlowBullet icon="→" color="#22c55e" text={item.slice(3)} />;
  if (item.startsWith("NON")) return <FlowBullet icon="→" color="#6b7280" text={item.slice(3)} />;
  if (item.startsWith("YES")) return <FlowBullet icon="→" color="#22c55e" text={item.slice(3)} />;
  if (item.startsWith("NO →") || item.startsWith("NO ")) return <FlowBullet icon="→" color="#6b7280" text={item.slice(2)} />;
  if (item.startsWith("OK →")) return <FlowBullet icon="→" color="#16a34a" text={item.slice(2)} />;
  return <NormalBullet item={item} nodeColor={nodeColor} />;
}

function DetailPanel({ nodeId, lang }: { nodeId: string; lang: Lang }) {
  const { details: DETAILS, brainstormDetails: BS_DETAILS } = getFlowchartData(lang);
  const lookupId = nodeId.startsWith("bs_write_") ? "bs_write" : nodeId;
  const detail = DETAILS[lookupId] ?? BS_DETAILS[lookupId];
  const placeholder = lang === "fr" ? "Cliquer sur un nœud pour voir ses détails." : "Click a node to see its details.";
  if (!detail) return (
    <div style={{ padding: 40, color: "#94a3b8", fontSize: 15, fontStyle: "italic" }}>
      {placeholder}
    </div>
  );

  const { title, color, nodeType, sections } = detail;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header with gradient */}
      <div style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        padding: "24px 28px",
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 11, opacity: 0.8, textTransform: "uppercase",
          letterSpacing: "0.12em", marginBottom: 8, color: "white",
          fontFamily: "system-ui, sans-serif", fontWeight: 600,
        }}>{nodeType}</div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, color: "white", fontFamily: "system-ui, sans-serif" }}>
          {title}
        </div>
      </div>

      {/* Content — animated on change */}
      <div
        key={nodeId}
        style={{
          flex: 1, overflowY: "auto", padding: "20px 24px",
          animation: "slideIn 0.18s ease-out",
        }}
      >
        {sections.map((section, si) => (
          <div key={si} style={{
            background: "#f8fafc",
            borderRadius: 10,
            padding: "14px 18px",
            marginBottom: 14,
            border: "1px solid #e2e8f0",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 10,
              fontFamily: "system-ui, sans-serif",
            }}>
              {section.heading}
            </div>
            {section.items.map((item, ii) => (
              <BulletItem key={ii} item={item} nodeColor={color} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Translations ─────────────────────────────────────────────────────────────

type Lang = "en" | "fr";

interface AgentEntry { name: string; badge: string; badgeColor: string; badgeBg: string; desc: string; }
interface UseCaseEntry { label: string; steps: string[]; color: string; }

interface ConfigFieldEntry { field: string; type: string; default: string; description: string; }
interface AgentDefaultEntry {
  name: string;
  temperature: string;
  variant: string;
  mode: string;
  color: string;
  permissions: string[];
}

interface Translations {
  plugin_label: string;
  hero_tagline: string;
  pill_direct_access: string;
  pill_never: string;
  cta_workflow: string;
  cta_workflow_full: string;
  cta_config: string;
  back: string;
  back_to_intro: string;
  nav_config: string;
  nav_workflow: string;
  click_node_hint: string;
  flowchart_subtitle: string;
  section_concept: string;
  concept_items: { icon: string; text: string; code?: string }[];
  section_memory: string;
  scratchpad_label: string;
  scratchpad_items: string[];
  section_agents: string;
  agents: AgentEntry[];
  section_review_cluster: string;
  review_cluster_subtitle: string;
  review_cluster_agents: AgentEntry[];
  section_usecases: string;
  usecases: UseCaseEntry[];
  // Config page
  config_title: string;
  config_subtitle: string;
  config_intro_heading: string;
  config_intro_body: string;
  config_merge_heading: string;
  config_merge_body: string;
  config_merge_note: string;
  config_fields_heading: string;
  config_fields_caption: string;
  config_fields: ConfigFieldEntry[];
  config_soul_heading: string;
  config_soul_fields: ConfigFieldEntry[];
  config_defaults_heading: string;
  config_defaults_expand: string;
  config_defaults_collapse: string;
  config_agent_defaults: AgentDefaultEntry[];
  config_example_heading: string;
  config_example_note: string;
  config_limits_heading: string;
  config_limits: string[];
  col_field: string;
  col_type: string;
  col_default: string;
  col_description: string;
  col_agent: string;
  col_temp: string;
  col_variant: string;
  col_mode: string;
  col_color: string;
  col_permissions: string;
  tab_orion: string;
  tab_brainstorm: string;
}

const translations: Record<Lang, Translations> = {
  en: {
    plugin_label: "OpenCode Plugin",
    hero_tagline: "A pure orchestrator. Plans the work, delegates everything to specialized sub-agents, reviews results, synthesizes and reports.",
    pill_direct_access: "Direct code access",
    pill_never: "never",
    cta_workflow: "View workflow",
    cta_workflow_full: "View full workflow",
    back: "← Back",
    click_node_hint: "Click a node →",
    flowchart_subtitle: "Pure orchestrator · delegates everything · never touches code",
    section_concept: "Concept & Philosophy",
    concept_items: [
      { icon: "⊘", text: "Never touches code directly — every technical action is delegated to a sub-agent" },
      { icon: "◈", text: "Plan, delegate, review, synthesize — in that order, always" },
      { icon: "⟳", text: "Deliberate and methodical — temperature 0.3, variant max" },
      { icon: "✦", text: "Persistent working memory via scratchpad — survives context resets, overwritten at each new mission" },
      { icon: "⬡", text: "Lifecycle tools enforce consistency at mission start — project_state() and check_artifacts() run before any planning" },
      { icon: "◉", text: "Tone shaped by human-tone directives — direct, opinionated, concise. Disable with %%code%% in your config for raw behavior.", code: "soul: false" },
    ],
    section_memory: "Memory Management",
    scratchpad_label: "Scratchpad",
    scratchpad_items: [
      "Current mission state",
      "Overwritten at each new mission",
      "Survives context compaction",
      "Read and written at 6 key moments in the workflow",
    ],
    section_agents: "Available Agents",
    agents: [
      {
        name: "brainstorm",
        badge: "PHASE 0",
        badgeColor: "#6d28d9",
        badgeBg: "#ede9fe",
        desc: "Discovery agent. Helps you articulate what to build before planning starts. Produces a structured product brief at docs/briefs/{project-name}.md.",
      },
      {
        name: "review-manager",
        badge: "SUB-AGENT",
        badgeColor: "#92400e",
        badgeBg: "#fef3c7",
        desc: "Review orchestrator. Spawns code-reviewer, security-reviewer and requirements-reviewer in parallel, then arbitrates verdicts.",
      },
      {
        name: "bug-finder",
        badge: "DIAGNOSTIC",
        badgeColor: "#991b1b",
        badgeBg: "#fee2e2",
        desc: "Structured bug investigation. Forces full root-cause analysis before any fix — prevents workarounds and code divergence.",
      },
      {
        name: "planning",
        badge: "PLANNER",
        badgeColor: "#0369a1",
        badgeBg: "#e0f2fe",
        desc: "Transforms complex or ambiguous requests into structured exec-plans written to docs/exec-plans/. Invoke before handing a large task to Orion.",
      },
      {
        name: "harness",
        badge: "ENFORCER",
        badgeColor: "#166534",
        badgeBg: "#dcfce7",
        desc: "Encodes recurring patterns as mechanical enforcement artifacts — ESLint rules, CI checks, AGENTS.md entries. Invoke when a pattern keeps being missed.",
      },
      {
        name: "gardener",
        badge: "MAINTENANCE",
        badgeColor: "#64748b",
        badgeBg: "#f8fafc",
        desc: "Periodic hygiene agent. Fixes stale docs, detects code drift, escalates recurring patterns to harness. Run post-feature or on explicit request.",
      },
    ],
    section_review_cluster: "Review cluster",
    review_cluster_subtitle: "Spawned in parallel by review-manager — never called directly",
    review_cluster_agents: [
      {
        name: "requirements-reviewer",
        badge: "INTERNAL",
        badgeColor: "#475569",
        badgeBg: "#f1f5f9",
        desc: "Verifies the implementation matches the original requirements. Spawned by review-manager.",
      },
      {
        name: "code-reviewer",
        badge: "INTERNAL",
        badgeColor: "#475569",
        badgeBg: "#f1f5f9",
        desc: "Evaluates correctness, logic, error handling, and maintainability. Spawned by review-manager.",
      },
      {
        name: "security-reviewer",
        badge: "INTERNAL",
        badgeColor: "#475569",
        badgeBg: "#f1f5f9",
        desc: "Identifies vulnerabilities, misconfigurations, and data exposure risks. Spawned by review-manager.",
      },
    ],
    section_usecases: "Typical Use Cases",
    usecases: [
      {
        label: "Implement a feature",
        steps: ["explore maps the codebase", "general implements", "review-manager validates"],
        color: "#2563eb",
      },
      {
        label: "Fix a bug",
        steps: ["bug-finder diagnoses the root-cause", "general applies the fix", "review-manager reviews"],
        color: "#dc2626",
      },
      {
        label: "Refactoring",
        steps: ["explore maps dependencies", "general refactors", "review-manager approves"],
        color: "#7c3aed",
      },
      {
        label: "Security audit",
        steps: ["review-manager spawns security-reviewer", "vulnerability report", "escalate if BLOCKED"],
        color: "#b45309",
      },
    ],
    cta_config: "Configuration →",
    back_to_intro: "← Back",
    nav_config: "Configuration",
    nav_workflow: "Workflow →",
    config_title: "Configuration",
    config_subtitle: "Per-agent overrides in opencode.json",
    config_intro_heading: "How it works",
    config_intro_body: "All agents can be configured per-agent in your opencode.json. The plugin applies its defaults first; your config overrides on top. The prompt field is always controlled by the plugin and cannot be overridden.",
    config_merge_heading: "Merge strategy",
    config_merge_body: "Top-level fields (temperature, variant, mode, color) are replaced by your value when present. Permission tool maps (bash, read, edit) are shallow-merged — your entries are additive, not a replacement.",
    config_merge_note: "Example: adding npm run* to bash permissions extends the default git allowlist. Both sets of commands will be allowed.",
    config_fields_heading: "Configurable fields — all agents",
    config_fields_caption: "These fields apply to every agent registered by the plugin.",
    config_fields: [
      { field: "temperature", type: "number", default: "varies", description: "LLM sampling temperature. Lower = more deterministic." },
      { field: "variant", type: "string", default: "\"max\"", description: "Model variant: \"max\" for best quality, \"fast\" for speed." },
      { field: "mode", type: "string", default: "varies", description: "\"all\" = visible in agent list + usable as sub-agent. \"subagent\" = sub-agent only, invisible in main UI." },
      { field: "color", type: "string", default: "varies", description: "UI accent color: \"error\", \"warning\", \"info\", \"success\"." },
      { field: "description", type: "string", default: "hardcoded", description: "Agent description shown in the UI." },
      { field: "permission", type: "object", default: "varies", description: "Tool access control map. Shallow-merged with plugin defaults for nested tools (bash, read, edit)." },
    ],
    config_soul_heading: "team-lead only",
    config_soul_fields: [
      { field: "soul", type: "boolean", default: "true", description: "Append the human-tone personality directives to Orion's prompt. Set false for raw behavior." },
    ],
    config_defaults_heading: "Agent defaults",
    config_defaults_expand: "Show details",
    config_defaults_collapse: "Hide",
    config_agent_defaults: [
      {
        name: "team-lead",
        temperature: "0.3",
        variant: "max",
        mode: "all",
        color: "error",
        permissions: [
          "task: allow",
          "todowrite: allow",
          "todoread: allow",
          "skill: allow",
          "question: allow",
          "distill: allow",
          "prune: allow",
          "compress: allow",
          "read: allow (.opencode/scratchpad.md)",
          "edit: allow (.opencode/scratchpad.md)",
          "bash: allow (git status/diff/log/add/commit/push/tag only)",
          "Everything else: deny",
        ],
      },
      {
        name: "review-manager",
        temperature: "0.2",
        variant: "max",
        mode: "subagent",
        color: "warning",
        permissions: ["task: allow", "question: allow", "Everything else: deny"],
      },
      {
        name: "requirements-reviewer",
        temperature: "0.1",
        variant: "max",
        mode: "subagent",
        color: "info",
        permissions: ["task: allow", "Everything else: deny"],
      },
      {
        name: "code-reviewer",
        temperature: "0.2",
        variant: "max",
        mode: "subagent",
        color: "info",
        permissions: ["task: allow", "Everything else: deny"],
      },
      {
        name: "security-reviewer",
        temperature: "0.1",
        variant: "max",
        mode: "subagent",
        color: "error",
        permissions: ["task: allow", "Everything else: deny"],
      },
      {
        name: "bug-finder",
        temperature: "0.2",
        variant: "max",
        mode: "all",
        color: "warning",
        permissions: ["task: allow", "question: allow", "Everything else: deny"],
      },
      {
        name: "brainstorm",
        temperature: "0.5",
        variant: "max",
        mode: "all",
        color: "info",
        permissions: [
          "task: allow",
          "question: allow",
          "webfetch: allow",
          "read: allow (all project files)",
          "write: allow (docs/briefs/** only)",
          "Everything else: deny",
        ],
      },
    ],
    config_example_heading: "Example opencode.json",
    config_example_note: "The bash permission above extends the default git allowlist — both sets of commands are allowed.",
    config_limits_heading: "Fixed behaviors",
    config_limits: [
      "Memory injection truncation: hardcoded at 50,000 characters",
      "Scratchpad file path: .opencode/scratchpad.md (project root, not configurable)",
    ],
    col_field: "Field",
    col_type: "Type",
    col_default: "Default",
    col_description: "Description",
    col_agent: "Agent",
    col_temp: "Temp.",
    col_variant: "Variant",
    col_mode: "Mode",
    col_color: "Color",
    col_permissions: "Permissions",
    tab_orion: "Orion workflow",
    tab_brainstorm: "Brainstorm workflow",
  },
  fr: {
    plugin_label: "OpenCode Plugin",
    hero_tagline: "Orchestrateur pur. Planifie le travail, délègue tout à des sous-agents spécialisés, review les résultats, synthétise et reporte.",
    pill_direct_access: "Accès code direct",
    pill_never: "jamais",
    cta_workflow: "Voir le workflow",
    cta_workflow_full: "Voir le workflow complet",
    back: "← Retour",
    click_node_hint: "Cliquer sur un nœud →",
    flowchart_subtitle: "Orchestrateur pur · délègue tout · ne touche jamais au code",
    section_concept: "Concept & philosophie",
    concept_items: [
      { icon: "⊘", text: "Ne touche jamais au code directement — toute action technique est déléguée" },
      { icon: "◈", text: "Planifie, délègue, review, synthétise — dans cet ordre, toujours" },
      { icon: "⟳", text: "Délibéré et méthodique — temperature 0.3, variant max" },
      { icon: "✦", text: "Mémoire de travail persistante via scratchpad — survit aux resets de contexte, écrasé à chaque nouvelle mission" },
      { icon: "⬡", text: "Les outils lifecycle assurent la cohérence au démarrage — project_state() et check_artifacts() s'exécutent avant toute planification" },
      { icon: "◉", text: "Ton façonné par les directives human-tone — direct, tranché, concis. Désactivable via %%code%% dans la config.", code: "soul: false" },
    ],
    section_memory: "Gestion de la mémoire",
    scratchpad_label: "Scratchpad",
    scratchpad_items: [
      "État de la mission courante",
      "Écrasé à chaque nouvelle mission",
      "Survit à la compaction de contexte",
      "Lu et écrit à 6 moments clés du workflow",
    ],
    section_agents: "Les agents disponibles",
    agents: [
      {
        name: "brainstorm",
        badge: "PHASE 0",
        badgeColor: "#6d28d9",
        badgeBg: "#ede9fe",
        desc: "Agent de découverte. Vous aide à articuler ce que vous voulez construire avant la planification. Produit un product brief dans docs/briefs/{project-name}.md.",
      },
      {
        name: "review-manager",
        badge: "SUB-AGENT",
        badgeColor: "#92400e",
        badgeBg: "#fef3c7",
        desc: "Orchestrateur de review. Spawne code-reviewer, security-reviewer et requirements-reviewer en parallèle, puis arbitre les verdicts.",
      },
      {
        name: "bug-finder",
        badge: "DIAGNOSTIC",
        badgeColor: "#991b1b",
        badgeBg: "#fee2e2",
        desc: "Investigation structurée de bugs. Force l'analyse root-cause complète avant tout fix — empêche les workarounds et la divergence.",
      },
      {
        name: "planning",
        badge: "PLANIFICATEUR",
        badgeColor: "#0369a1",
        badgeBg: "#e0f2fe",
        desc: "Transforme les demandes complexes ou ambiguës en exec-plans structurés dans docs/exec-plans/. À invoquer avant de confier une grande tâche à Orion.",
      },
      {
        name: "harness",
        badge: "ENFORCEMENT",
        badgeColor: "#166534",
        badgeBg: "#dcfce7",
        desc: "Encode les patterns récurrents en artefacts d'enforcement mécaniques — règles ESLint, jobs CI, entrées AGENTS.md. À invoquer quand un pattern est sans cesse oublié.",
      },
      {
        name: "gardener",
        badge: "MAINTENANCE",
        badgeColor: "#64748b",
        badgeBg: "#f8fafc",
        desc: "Agent de maintenance périodique. Corrige les docs obsolètes, détecte la dérive de code, remonte les patterns récurrents à harness. À lancer post-feature ou sur demande explicite.",
      },
    ],
    section_review_cluster: "Cluster de review",
    review_cluster_subtitle: "Lancés en parallèle par review-manager — jamais appelés directement",
    review_cluster_agents: [
      {
        name: "requirements-reviewer",
        badge: "INTERNAL",
        badgeColor: "#475569",
        badgeBg: "#f1f5f9",
        desc: "Vérifie que l'implémentation correspond aux exigences initiales. Lancé par review-manager.",
      },
      {
        name: "code-reviewer",
        badge: "INTERNAL",
        badgeColor: "#475569",
        badgeBg: "#f1f5f9",
        desc: "Évalue la correction, la logique, la gestion d'erreurs et la maintenabilité. Lancé par review-manager.",
      },
      {
        name: "security-reviewer",
        badge: "INTERNAL",
        badgeColor: "#475569",
        badgeBg: "#f1f5f9",
        desc: "Identifie les vulnérabilités, mauvaises configurations et risques d'exposition. Lancé par review-manager.",
      },
    ],
    section_usecases: "Cas d'usage typiques",
    usecases: [
      {
        label: "Implémenter une feature",
        steps: ["explore cartographie le codebase", "general implémente", "review-manager valide"],
        color: "#2563eb",
      },
      {
        label: "Corriger un bug",
        steps: ["bug-finder diagnostique la root-cause", "general applique le fix", "review-manager review"],
        color: "#dc2626",
      },
      {
        label: "Refactoring",
        steps: ["explore mappe les dépendances", "general refactorise", "review-manager approuve"],
        color: "#7c3aed",
      },
      {
        label: "Audit de sécurité",
        steps: ["review-manager spawne security-reviewer", "rapport de vulnérabilités", "escalade si BLOCKED"],
        color: "#b45309",
      },
    ],
    cta_config: "Configuration →",
    back_to_intro: "← Retour",
    nav_config: "Configuration",
    nav_workflow: "Workflow →",
    config_title: "Configuration",
    config_subtitle: "Surcharges par agent dans opencode.json",
    config_intro_heading: "Fonctionnement",
    config_intro_body: "Chaque agent peut être configuré individuellement dans votre opencode.json. Le plugin applique ses valeurs par défaut en premier ; votre config vient en surcharge par-dessus. Le champ prompt est toujours contrôlé par le plugin et ne peut pas être surchargé.",
    config_merge_heading: "Stratégie de fusion",
    config_merge_body: "Les champs de premier niveau (temperature, variant, mode, color) sont remplacés par votre valeur si elle est présente. Les maps d'outils dans permission (bash, read, edit) sont fusionnées superficiellement — vos entrées s'ajoutent aux défauts, elles ne les remplacent pas.",
    config_merge_note: "Exemple : ajouter npm run* aux permissions bash étend la liste git par défaut. Les deux ensembles de commandes seront autorisés.",
    config_fields_heading: "Champs configurables — tous les agents",
    config_fields_caption: "Ces champs s'appliquent à chaque agent enregistré par le plugin.",
    config_fields: [
      { field: "temperature", type: "number", default: "variable", description: "Température d'échantillonnage LLM. Plus bas = plus déterministe." },
      { field: "variant", type: "string", default: "\"max\"", description: "Variante de modèle : \"max\" pour la meilleure qualité, \"fast\" pour la vitesse." },
      { field: "mode", type: "string", default: "variable", description: "\"all\" = visible dans la liste + utilisable en sous-agent. \"subagent\" = sous-agent uniquement, invisible dans l'UI." },
      { field: "color", type: "string", default: "variable", description: "Couleur d'accentuation UI : \"error\", \"warning\", \"info\", \"success\"." },
      { field: "description", type: "string", default: "intégrée", description: "Description de l'agent affichée dans l'UI." },
      { field: "permission", type: "object", default: "variable", description: "Map de contrôle d'accès aux outils. Fusionnée superficiellement avec les défauts du plugin pour les outils imbriqués (bash, read, edit)." },
    ],
    config_soul_heading: "team-lead uniquement",
    config_soul_fields: [
      { field: "soul", type: "boolean", default: "true", description: "Injecte les directives de personnalité human-tone dans le prompt d'Orion. Mettre false pour le comportement brut." },
    ],
    config_defaults_heading: "Défauts par agent",
    config_defaults_expand: "Voir les détails",
    config_defaults_collapse: "Masquer",
    config_agent_defaults: [
      {
        name: "team-lead",
        temperature: "0.3",
        variant: "max",
        mode: "all",
        color: "error",
        permissions: [
          "task: allow",
          "todowrite: allow",
          "todoread: allow",
          "skill: allow",
          "question: allow",
          "distill: allow",
          "prune: allow",
          "compress: allow",
          "read: allow (.opencode/scratchpad.md)",
          "edit: allow (.opencode/scratchpad.md)",
          "bash: allow (git status/diff/log/add/commit/push/tag uniquement)",
          "Tout le reste : deny",
        ],
      },
      {
        name: "review-manager",
        temperature: "0.2",
        variant: "max",
        mode: "subagent",
        color: "warning",
        permissions: ["task: allow", "question: allow", "Tout le reste : deny"],
      },
      {
        name: "requirements-reviewer",
        temperature: "0.1",
        variant: "max",
        mode: "subagent",
        color: "info",
        permissions: ["task: allow", "Tout le reste : deny"],
      },
      {
        name: "code-reviewer",
        temperature: "0.2",
        variant: "max",
        mode: "subagent",
        color: "info",
        permissions: ["task: allow", "Tout le reste : deny"],
      },
      {
        name: "security-reviewer",
        temperature: "0.1",
        variant: "max",
        mode: "subagent",
        color: "error",
        permissions: ["task: allow", "Tout le reste : deny"],
      },
      {
        name: "bug-finder",
        temperature: "0.2",
        variant: "max",
        mode: "all",
        color: "warning",
        permissions: ["task: allow", "question: allow", "Tout le reste : deny"],
      },
      {
        name: "brainstorm",
        temperature: "0.5",
        variant: "max",
        mode: "all",
        color: "info",
        permissions: [
          "task: allow",
          "question: allow",
          "webfetch: allow",
          "read: allow (tous les fichiers du projet)",
          "write: allow (docs/briefs/** uniquement)",
          "Tout le reste : deny",
        ],
      },
    ],
    config_example_heading: "Exemple opencode.json",
    config_example_note: "La permission bash ci-dessus étend la liste git par défaut — les deux ensembles de commandes sont autorisés.",
    config_limits_heading: "Comportements figés",
    config_limits: [
      "Troncature de l'injection mémoire : fixée à 50 000 caractères",
      "Chemin du scratchpad : .opencode/scratchpad.md (racine du projet, non configurable)",
    ],
    col_field: "Champ",
    col_type: "Type",
    col_default: "Défaut",
    col_description: "Description",
    col_agent: "Agent",
    col_temp: "Temp.",
    col_variant: "Variante",
    col_mode: "Mode",
    col_color: "Couleur",
    col_permissions: "Permissions",
    tab_orion: "Workflow Orion",
    tab_brainstorm: "Workflow Brainstorm",
  },
};

// ─── Lang Toggle ──────────────────────────────────────────────────────────────

function LangToggle({ lang, setLang, dark = false }: { lang: Lang; setLang: (l: Lang) => void; dark?: boolean }) {
  const base: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
    fontFamily: "system-ui, sans-serif",
    padding: "3px 7px", borderRadius: 4,
    transition: "background 0.12s",
  };
  const activeColor = dark ? "white" : "#0f172a";
  const inactiveColor = dark ? "#64748b" : "#94a3b8";
  const activeBg = dark ? "rgba(255,255,255,0.12)" : "#f1f5f9";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {(["en", "fr"] as Lang[]).map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && <span style={{ color: dark ? "#334155" : "#e2e8f0", fontSize: 12 }}>|</span>}
          <button
            onClick={() => setLang(l)}
            style={{
              ...base,
              color: lang === l ? activeColor : inactiveColor,
              background: lang === l ? activeBg : "none",
              textDecoration: lang === l ? "underline" : "none",
              textUnderlineOffset: 3,
            }}
          >
            {l.toUpperCase()}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────

function IntroScreen({ onEnter, onConfig, lang, setLang }: { onEnter: () => void; onConfig: () => void; lang: Lang; setLang: (l: Lang) => void }) {
  const t = translations[lang];
  return (
    <div style={{
      height: "100vh", width: "100vw", overflowY: "auto",
      fontFamily: "system-ui, 'Segoe UI', sans-serif",
      background: "#f8f9fa",
      animation: "fadeIn 0.3s ease-out",
    }}>

      {/* ── Hero ── */}
      <div style={{
        background: "#0f172a",
        padding: "56px 48px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle grid texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }} />

        {/* Lang toggle — top right of hero */}
        <div style={{ position: "absolute", top: 20, right: 24 }}>
          <LangToggle lang={lang} setLang={setLang} dark />
        </div>

        <div style={{ position: "relative", maxWidth: 860, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(99,102,241,0.2)", color: "#a5b4fc",
            border: "1px solid rgba(99,102,241,0.35)",
            borderRadius: 4, padding: "3px 10px",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", marginBottom: 20,
          }}>
            {t.plugin_label}
          </div>

          <h1 style={{
            fontSize: 44, fontWeight: 800, color: "white",
            margin: "0 0 12px", lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}>
            team-lead
          </h1>
          <p style={{
            fontSize: 18, color: "#94a3b8", margin: "0 0 36px",
            lineHeight: 1.5, maxWidth: 560,
          }}>
            {t.hero_tagline}
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
            {[
              { label: "Temperature", value: "0.3" },
              { label: "Variant", value: "max" },
              { label: t.pill_direct_access, value: t.pill_never },
            ].map(pill => (
              <div key={pill.label} style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6, padding: "6px 14px",
                display: "flex", gap: 8, alignItems: "center",
              }}>
                <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{pill.label}</span>
                <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700 }}>{pill.value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={onEnter}
            style={{
              background: "#4f46e5", color: "white",
              border: "none", borderRadius: 8,
              padding: "13px 28px", fontSize: 15, fontWeight: 700,
              cursor: "pointer", letterSpacing: "-0.01em",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
              transition: "background 0.15s, transform 0.1s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#4338ca"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#4f46e5"; }}
          >
            {t.cta_workflow}
            <span style={{ fontSize: 16 }}>→</span>
          </button>
          <button
            onClick={onConfig}
            style={{
              background: "none", color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
              padding: "12px 22px", fontSize: 14, fontWeight: 600,
              cursor: "pointer", letterSpacing: "-0.01em",
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.35)";
              (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
          >
            {t.cta_config}
          </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 48px 60px" }}>

        {/* 1. Concept */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>{t.section_concept}</SectionTitle>
          <div style={{
            background: "white", border: "1px solid #e2e8f0",
            borderRadius: 10, padding: "24px 28px",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
          }}>
            {t.concept_items.map((item, i) => {
              const parts = item.code ? item.text.split("%%code%%") : null;
              return (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, color: "#6366f1", flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                    {parts ? (
                      <>{parts[0]}<code style={{ fontFamily: "monospace", fontSize: 12, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 4, padding: "1px 5px", color: "#0f172a" }}>{item.code}</code>{parts[1]}</>
                    ) : item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Memory */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>{t.section_memory}</SectionTitle>
          <div style={{
            background: "white", border: "1px solid #bae6fd",
            borderRadius: 10, padding: "20px 22px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>📄</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0369a1" }}>{t.scratchpad_label}</div>
                <code style={{ fontSize: 11, color: "#64748b", fontFamily: "ui-monospace, monospace" }}>scratchpad.md</code>
              </div>
            </div>
            {t.scratchpad_items.map((text, i) => <MemItem key={i} text={text} color="#0369a1" />)}
          </div>
        </section>

        {/* 3. Agents */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>{t.section_agents}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {t.agents.map(agent => (
              <div key={agent.name} style={{
                background: "white", border: "1px solid #e2e8f0",
                borderRadius: 10, padding: "18px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <code style={{
                    fontSize: 14, fontWeight: 700, color: "#0f172a",
                    fontFamily: "ui-monospace, monospace",
                    background: "#f1f5f9", padding: "2px 8px", borderRadius: 4,
                  }}>{agent.name}</code>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                    color: agent.badgeColor, background: agent.badgeBg,
                    padding: "2px 7px", borderRadius: 3,
                  }}>{agent.badge}</span>
                </div>
                <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
                  {agent.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3b. Review cluster */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>{t.section_review_cluster}</SectionTitle>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14, marginTop: -4 }}>
            {t.review_cluster_subtitle}
          </p>
          <div style={{
            border: "1px dashed #cbd5e1", borderRadius: 10, padding: "16px 16px 2px",
            background: "#f8fafc",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {t.review_cluster_agents.map(agent => (
                <div key={agent.name} style={{
                  background: "white", border: "1px solid #e2e8f0",
                  borderRadius: 8, padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <code style={{
                      fontSize: 13, fontWeight: 700, color: "#0f172a",
                      fontFamily: "ui-monospace, monospace",
                      background: "#f1f5f9", padding: "2px 7px", borderRadius: 4,
                    }}>{agent.name}</code>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                      color: agent.badgeColor, background: agent.badgeBg,
                      padding: "2px 7px", borderRadius: 3,
                    }}>{agent.badge}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>
                    {agent.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Use cases */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>{t.section_usecases}</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {t.usecases.map(uc => (
              <div key={uc.label} style={{
                background: "white", border: "1px solid #e2e8f0",
                borderRadius: 10, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{
                  width: 4, borderRadius: 2, alignSelf: "stretch",
                  background: uc.color, flexShrink: 0,
                }} />
                <div style={{ minWidth: 200, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                  {uc.label}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {uc.steps.map((step, si) => (
                    <span key={si} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontSize: 12, color: "#475569",
                        background: "#f8fafc", border: "1px solid #e2e8f0",
                        borderRadius: 5, padding: "3px 9px",
                      }}>{step}</span>
                      {si < uc.steps.length - 1 && (
                        <span style={{ fontSize: 12, color: "#cbd5e1" }}>→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, paddingTop: 8, flexWrap: "wrap" }}>
          <button
            onClick={onEnter}
            style={{
              background: "#0f172a", color: "white",
              border: "none", borderRadius: 8,
              padding: "13px 32px", fontSize: 15, fontWeight: 700,
              cursor: "pointer", letterSpacing: "-0.01em",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#1e293b"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#0f172a"; }}
          >
            {t.cta_workflow_full}
            <span style={{ fontSize: 16 }}>→</span>
          </button>
          <button
            onClick={onConfig}
            style={{
              background: "none", color: "#64748b",
              border: "1px solid #e2e8f0", borderRadius: 8,
              padding: "12px 24px", fontSize: 14, fontWeight: 600,
              cursor: "pointer", letterSpacing: "-0.01em",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
              (e.currentTarget as HTMLButtonElement).style.color = "#0f172a";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
              (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
            }}
          >
            {t.cta_config}
          </button>
        </div>

      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.1em", color: "#64748b",
      marginBottom: 14,
    }}>{children}</div>
  );
}

function MemItem({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 7 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color + "60", border: `1.5px solid ${color}`, flexShrink: 0, marginTop: 6 }} />
      <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

// ─── Config Screen ────────────────────────────────────────────────────────────

const CONFIG_EXAMPLE = `{
  "agent": {
    "team-lead": {
      "temperature": 0.5,
      "variant": "fast",
      "color": "info",
      "soul": false,
      "permission": {
        "bash": {
          "npm run*": "allow",
          "npx*": "allow"
        }
      }
    },
    "bug-finder": {
      "temperature": 0.1,
      "mode": "subagent"
    }
  }
}`;

function JsonBlock({ code }: { code: string }) {
  // Minimal JSON syntax colouring via regex splits
  const lines = code.split("\n");
  return (
    <pre style={{
      background: "#0f172a", color: "#e2e8f0",
      borderRadius: 8, padding: "18px 20px",
      fontSize: 13, lineHeight: 1.65,
      fontFamily: "ui-monospace, 'Cascadia Code', monospace",
      overflowX: "auto", margin: 0,
    }}>
      {lines.map((line, i) => {
        // Colourise: keys in slate-blue, strings in green, numbers/booleans in amber
        const coloured = line
          .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<k>$1</k>$2')
          .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <s>$1</s>')
          .replace(/:\s*(true|false|null)/g, ': <b>$1</b>')
          .replace(/:\s*(-?\d+(?:\.\d+)?)/g, ': <n>$1</n>');
        const parts = coloured.split(/(<k>|<\/k>|<s>|<\/s>|<b>|<\/b>|<n>|<\/n>)/);
        let currentTag = "";
        const rendered: React.ReactNode[] = [];
        parts.forEach((part, pi) => {
          if (part === "<k>") { currentTag = "k"; return; }
          if (part === "</k>") { currentTag = ""; return; }
          if (part === "<s>") { currentTag = "s"; return; }
          if (part === "</s>") { currentTag = ""; return; }
          if (part === "<b>") { currentTag = "b"; return; }
          if (part === "</b>") { currentTag = ""; return; }
          if (part === "<n>") { currentTag = "n"; return; }
          if (part === "</n>") { currentTag = ""; return; }
          if (!part) return;
          const color = currentTag === "k" ? "#93c5fd"
            : currentTag === "s" ? "#86efac"
            : currentTag === "b" || currentTag === "n" ? "#fcd34d"
            : "#e2e8f0";
          rendered.push(<span key={pi} style={{ color }}>{part}</span>);
        });
        return <div key={i}>{rendered}</div>;
      })}
    </pre>
  );
}

function ConfigFieldTable({ fields, t }: { fields: { field: string; type: string; default: string; description: string }[]; t: Translations }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "system-ui, sans-serif" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
            {[t.col_field, t.col_type, t.col_default, t.col_description].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafafa" }}>
              <td style={{ padding: "9px 12px" }}>
                <code style={{ background: "#f1f5f9", color: "#0f172a", padding: "2px 7px", borderRadius: 4, fontSize: 12, fontFamily: "ui-monospace, monospace" }}>{row.field}</code>
              </td>
              <td style={{ padding: "9px 12px", color: "#7c3aed", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{row.type}</td>
              <td style={{ padding: "9px 12px", color: "#64748b", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{row.default}</td>
              <td style={{ padding: "9px 12px", color: "#374151", lineHeight: 1.5 }}>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgentDefaultCard({ agent, t }: { agent: { name: string; temperature: string; variant: string; mode: string; color: string; permissions: string[] }; t: Translations }) {
  const [open, setOpen] = useState(false);
  const colorMap: Record<string, string> = { error: "#dc2626", warning: "#d97706", info: "#0369a1", success: "#16a34a" };
  const bgMap: Record<string, string> = { error: "#fef2f2", warning: "#fffbeb", info: "#eff6ff", success: "#f0fdf4" };
  const c = colorMap[agent.color] ?? "#64748b";
  const bg = bgMap[agent.color] ?? "#f8fafc";
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
      {/* Card header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <code style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: "ui-monospace, monospace", background: "#f1f5f9", padding: "2px 8px", borderRadius: 4 }}>{agent.name}</code>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: c, background: bg, border: `1px solid ${c}30`, padding: "2px 7px", borderRadius: 3 }}>{agent.color.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { label: t.col_temp, value: agent.temperature },
              { label: t.col_variant, value: agent.variant },
              { label: t.col_mode, value: agent.mode },
            ].map(f => (
              <div key={f.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>{f.value}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#64748b", fontWeight: 600, fontFamily: "system-ui, sans-serif" }}
          >
            {open ? t.config_defaults_collapse : t.config_defaults_expand}
          </button>
        </div>
      </div>
      {/* Expandable permissions */}
      {open && (
        <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: 8 }}>{t.col_permissions}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {agent.permissions.map((p, i) => {
              const isDeny = p.toLowerCase().includes("deny") || p.toLowerCase().includes("tout le reste");
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                    background: isDeny ? "#dc262640" : "#16a34a40",
                    border: `1.5px solid ${isDeny ? "#dc2626" : "#16a34a"}`,
                  }} />
                  <span style={{ fontSize: 12, color: isDeny ? "#991b1b" : "#374151", fontFamily: "ui-monospace, monospace" }}>{p}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigScreen({ onBack, onWorkflow, lang, setLang }: { onBack: () => void; onWorkflow: () => void; lang: Lang; setLang: (l: Lang) => void }) {
  const t = translations[lang];

  return (
    <div style={{
      height: "100vh", width: "100vw", overflowY: "auto",
      fontFamily: "system-ui, 'Segoe UI', sans-serif",
      background: "#f8f9fa",
      animation: "fadeIn 0.25s ease-out",
    }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "10px 24px", position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#64748b", fontWeight: 600, padding: "4px 8px", borderRadius: 5, fontFamily: "system-ui, sans-serif" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
          >{t.back_to_intro}</button>
          <div style={{ width: 1, height: 16, background: "#e2e8f0" }} />
          <button
            onClick={onWorkflow}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#64748b", fontWeight: 600, padding: "4px 8px", borderRadius: 5, fontFamily: "system-ui, sans-serif" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
          >{t.nav_workflow}</button>
          <div style={{ width: 1, height: 16, background: "#e2e8f0" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>team-lead — {t.config_title}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{t.config_subtitle}</span>
        </div>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 48px 72px" }}>

        {/* 1. How it works */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>{t.config_intro_heading}</SectionTitle>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "18px 22px" }}>
            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
              {t.config_intro_body.split("prompt").map((part, i, arr) =>
                i < arr.length - 1 ? (
                  <React.Fragment key={i}>
                    {part}<code style={{ background: "#f1f5f9", color: "#0f172a", padding: "1px 5px", borderRadius: 3, fontSize: 13, fontFamily: "ui-monospace, monospace" }}>prompt</code>
                  </React.Fragment>
                ) : part
              )}
            </p>
          </div>
        </section>

        {/* 2. Merge strategy */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>{t.config_merge_heading}</SectionTitle>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "18px 22px" }}>
            <p style={{ margin: "0 0 14px", fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{t.config_merge_body}</p>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 7, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
              <span style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>{t.config_merge_note}</span>
            </div>
          </div>
        </section>

        {/* 3. Configurable fields */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>{t.config_fields_heading}</SectionTitle>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px 4px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>{t.config_fields_caption}</span>
            </div>
            <ConfigFieldTable fields={t.config_fields} t={t} />
          </div>
        </section>

        {/* team-lead only: soul */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>{t.config_soul_heading}</SectionTitle>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <ConfigFieldTable fields={t.config_soul_fields} t={t} />
          </div>
        </section>

        {/* 4. Agent defaults */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>{t.config_defaults_heading}</SectionTitle>
          {t.config_agent_defaults.map(agent => (
            <AgentDefaultCard key={agent.name} agent={agent} t={t} />
          ))}
        </section>

        {/* 5. Example */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>{t.config_example_heading}</SectionTitle>
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
            <JsonBlock code={CONFIG_EXAMPLE} />
          </div>
          <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 13, color: "#166534", lineHeight: 1.6 }}>{t.config_example_note}</span>
          </div>
        </section>

        {/* 6. Fixed behaviors */}
        <section style={{ marginBottom: 40 }}>
          <SectionTitle>{t.config_limits_heading}</SectionTitle>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px" }}>
            {t.config_limits.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < t.config_limits.length - 1 ? 10 : 0 }}>
                <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: "50%", background: "#94a3b840", border: "1.5px solid #94a3b8", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<"intro" | "flowchart" | "config">("intro");
  const [lang, setLang] = useState<Lang>("en");
  const [selected, setSelected] = useState<string>("uf_start");
  const [zoom, setZoom] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom(z => Math.min(2.0, Math.round((z + 0.1) * 10) / 10));
  const zoomOut = () => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10));
  const zoomReset = () => setZoom(1.0);

  const handleSelect = (id: string, nodeY: number) => {
    setSelected(id);
    const container = containerRef.current;
    if (container) {
      const targetScroll = nodeY * zoom - container.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
    }
  };

  const t = translations[lang];

  if (view === "intro") {
    return (
      <>
        <style>{STYLE_TAG}</style>
        <IntroScreen onEnter={() => setView("flowchart")} onConfig={() => setView("config")} lang={lang} setLang={setLang} />
      </>
    );
  }

  if (view === "config") {
    return (
      <>
        <style>{STYLE_TAG}</style>
        <ConfigScreen onBack={() => setView("intro")} onWorkflow={() => setView("flowchart")} lang={lang} setLang={setLang} />
      </>
    );
  }

  return (
    <>
      <style>{STYLE_TAG}</style>
      <div style={{
        display: "flex", flexDirection: "column", height: "100vh", width: "100vw",
        background: "#f8f9fa", fontFamily: "system-ui, 'Segoe UI', sans-serif",
        overflow: "hidden",
        animation: "fadeIn 0.25s ease-out",
      }}>

        {/* Header */}
        <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "10px 20px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setView("intro")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "#64748b", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 8px", borderRadius: 5,
                fontFamily: "system-ui, sans-serif",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              {t.back_to_intro}
            </button>
            <div style={{ width: 1, height: 16, background: "#e2e8f0" }} />
            <button
              onClick={() => setView("config")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "#64748b", fontWeight: 600,
                padding: "4px 8px", borderRadius: 5,
                fontFamily: "system-ui, sans-serif",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              {t.nav_config}
            </button>

          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <LangToggle lang={lang} setLang={setLang} />
            <span style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic" }}>{t.click_node_hint}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* LEFT — flowchart */}
          <div
            id="flowchart-container"
            ref={containerRef}
            style={{
              width: "62%", minWidth: 320, background: "#f8f9fa",
              borderRight: "1px solid #e2e8f0",
              overflowY: "auto", overflowX: "hidden",
              display: "flex", flexDirection: "column", alignItems: "center",
              position: "relative",
            }}
          >
            {/* Zoom controls */}
            <div style={{
              position: "sticky", top: 10, zIndex: 10,
              alignSelf: "flex-start", marginLeft: 10,
              display: "flex", alignItems: "center", gap: 4,
              background: "white", border: "1px solid #e2e8f0",
              borderRadius: 8, padding: "4px 8px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}>
              <button onClick={zoomOut} style={{ background: "#f1f5f9", border: "none", borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontSize: 14, color: "#475569", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, minWidth: 36, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>{Math.round(zoom * 100)}%</span>
              <button onClick={zoomIn} style={{ background: "#f1f5f9", border: "none", borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontSize: 14, color: "#475569", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              <button onClick={zoomReset} style={{ background: "#f1f5f9", border: "none", borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontSize: 13, color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>↺</button>
            </div>

            {/* SVG with zoom */}
            <div style={{ transformOrigin: "top center", transform: `scale(${zoom})`, width: "100%" }}>
              <MainFlowChart lang={lang} onNodeClick={(id) => handleSelect(id, 0)} selectedNode={selected} />
            </div>
          </div>

          {/* RIGHT — detail panel */}
          <div style={{ flex: "0 0 38%", background: "white", overflowY: "auto" }}>
            <DetailPanel nodeId={selected} lang={lang} />
          </div>

        </div>
      </div>
    </>
  );
}
