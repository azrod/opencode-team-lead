import React, { useState, useRef } from "react";

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

interface FlowchartData {
  svgLabels: {
    start: string;
    scratchpad_sub: string;
    memory_sub: string;
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
    mem_read_here: string;
    annot_delegate: string;
    annot_agents: string;
    annot_memory: string;
  };
  details: Record<string, DetailData>;
  brainstormSvgLabels: BrainstormSvgLabels;
  brainstormDetails: Record<string, DetailData>;
}

function getFlowchartData(lang: "en" | "fr"): FlowchartData {
  if (lang === "fr") {
    return {
      svgLabels: {
        start: "Requête utilisateur",
        scratchpad_sub: "Plan courant · Contexte",
        memory_sub: "Apprentissages persistants",
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
        mem_read_here: "lu ici",
        annot_delegate: "↳ MAJ scratchpad après chaque retour d'agent",
        annot_agents: "✎ après retour d'agent",
        annot_memory: "↳ Écrire memory.md si nouveaux apprentissages",
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
            { heading: "Lecture mémoire", items: [".opencode/scratchpad.md — plan de travail courant", ".opencode/memory.md — apprentissages projet persistants"] },
            { heading: "Appels lifecycle (obligatoires)", items: ["`project_state()` — vue complète des exec-plans, specs et briefs", "`check_artifacts()` — scan de cohérence inter-artefacts"] },
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
            { heading: "Quand écrire (5 moments)", items: [
              "Démarrage — objectif + plan + décisions initiales",
              "Avant délégation — sous-tâches, fichiers modifiés, contexte de reprise",
              "Après retour d'agent — résultats clés synthétisés",
              "Après review — statut des tâches + verdict",
              "Fin de mission — capture finale avant rapport utilisateur",
            ]},
          ],
        },
        memory: {
          title: "📄 memory.md",
          color: "#22c55e",
          nodeType: "MÉMOIRE PERSISTANTE",
          sections: [
            { heading: "Rôle", items: [
              "Base de connaissances projet inter-sessions",
              "Injecté dans chaque appel LLM automatiquement",
              "Append-only — ne jamais écraser, nettoyer les entrées obsolètes",
            ]},
            { heading: "Quand lire", items: ["Injecté automatiquement — pas d'action requise"] },
            { heading: "Quand écrire", items: [
              "Commandes build/test découvertes dans le projet",
              "Décisions d'architecture importantes retenues",
              "Conventions et patterns récurrents du codebase",
              "Préférences utilisateur observées",
              "Technos/contraintes spécifiques au projet",
            ]},
            { heading: "Ce qui N'y appartient PAS", items: [
              "État des tâches courantes → scratchpad",
              "Infos temporaires ou mission-spécifiques",
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
          title: "Agents",
          color: "#6d28d9",
          nodeType: "DÉLÉGATION",
          sections: [
            { heading: "Types", items: ["`explore` — recherche, lecture de fichiers, architecture", "`general` — écriture, édition, bash, implémentation", "Custom persona — `backend-engineer`, `api-architect`…"] },
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
          title: "↩ Fix + re-review",
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
            { heading: "MAJ mémoire", items: ["Écrire apprentissages dans .opencode/memory.md", "Nettoyer le scratchpad (tâches terminées)"] },
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
      },
      brainstormSvgLabels: {
        bs_start: "Démarrage session",
        bs_existing_check: "Briefs existants ?",
        bs_single_found: "Un brief trouvé",
        bs_multi_found: "Plusieurs trouvés",
        bs_status_check: "Statut = brouillon ?",
        bs_ask_continue: "Continuer ou nouveau ?",
        bs_load_brief: "Charger le brief",
        bs_phase1: "Phase 1 — Découverte",
        bs_problem_clear: "Problème clair ?",
        bs_phase2: "Phase 2 — Approfondissement",
        bs_adversarial: "Porte adversariale",
        bs_template_fillable: "Toutes sections remplissables ?",
        bs_phase3: "Phase 3 — Rédaction + Validation",
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
          title: "Session Start",
          color: "#0d9488",
          nodeType: "ENTRY POINT",
          sections: [
            { heading: "What happens", items: ["Session is initiated with brainstorm agent", "Agent globs docs/briefs/**/*.md to check for existing briefs", "Routing decision made before any questions are asked"] },
          ],
        },
        bs_existing_check: {
          title: "Existing briefs found?",
          color: "#0d9488",
          nodeType: "DECISION",
          sections: [
            { heading: "Branches", items: ["NO → Flow normal → Phase 1 (Discovery)", "ONE found → check status (draft / done)", "MULTIPLE found → list briefs, ask which one or new project"] },
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
            { heading: "What happens", items: ["Agent lists all found briefs to the user", "Asks: which one to resume, or start a new project?", "CHOOSE EXISTING → Load brief → Phase 3 (revision)", "NEW PROJECT → Flow normal → Phase 1"] },
          ],
        },
        bs_status_check: {
          title: "Status = draft?",
          color: "#0891b2",
          nodeType: "DECISION",
          sections: [
            { heading: "Branches", items: ["YES (draft) → Ask: continue or fresh start?", "NO (done/other) → Inform user, ask new project name → Phase 1"] },
          ],
        },
        bs_ask_continue: {
          title: "Continue or fresh start?",
          color: "#0891b2",
          nodeType: "ACTION",
          sections: [
            { heading: "What happens", items: ["User is shown the existing draft brief summary", "Asked: resume from where we left off, or start fresh?", "CONTINUE → Load brief → jump directly to Phase 3 (revision)", "FRESH → Ignore existing brief → Phase 1 (Discovery)"] },
          ],
        },
        bs_load_brief: {
          title: "Load brief",
          color: "#0891b2",
          nodeType: "ACTION",
          sections: [
            { heading: "What happens", items: ["Agent reads the existing brief file from docs/briefs/", "Provides full context to Phase 3 (revision mode)", "User can iterate on the existing content rather than restarting"] },
          ],
        },
        bs_phase1: {
          title: "Phase 1 — Discovery",
          color: "#2563eb",
          nodeType: "MAIN PHASE",
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
            { heading: "Exit criteria", items: ["YES → problem stated in 2–4 clear sentences AND primary user named → Phase 2", "NO → iterate — ask more targeted follow-up questions"] },
          ],
        },
        bs_phase2: {
          title: "Phase 2 — Deep Dive",
          color: "#4f46e5",
          nodeType: "MAIN PHASE",
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
            { heading: "Branches", items: ["YES → proceed to Phase 3 (draft + validation)", "NO → iterate back in Phase 2 — identify which sections are still empty"] },
            { heading: "Template sections required", items: ["Problem statement", "Primary user", "Success criteria", "Top use cases", "Constraints", "Out of scope", "Risks / adversarial answers"] },
          ],
        },
        bs_phase3: {
          title: "Phase 3 — Draft + Validation",
          color: "#6d28d9",
          nodeType: "MAIN PHASE",
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
      },
    };
  }

  // English
  return {
    svgLabels: {
      start: "User request",
      scratchpad_sub: "Current plan · Context",
      memory_sub: "Persistent learnings",
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
      mem_read_here: "read here",
      annot_delegate: "↳ Update scratchpad after each agent return",
      annot_agents: "✎ after agent return",
      annot_memory: "↳ Write memory.md if new learnings",
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
          { heading: "Memory read", items: [".opencode/scratchpad.md — current work plan", ".opencode/memory.md — persistent project learnings"] },
          { heading: "Lifecycle calls (mandatory)", items: ["`project_state()` — full view of exec-plans, specs, and briefs", "`check_artifacts()` — cross-artifact consistency scan"] },
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
          { heading: "When to write (5 moments)", items: [
            "Startup — goal + plan + initial decisions",
            "Before delegation — sub-tasks, modified files, resume context",
            "After agent return — synthesized key results",
            "After review — task status + verdict",
            "End of mission — final capture before user report",
          ]},
        ],
      },
      memory: {
        title: "📄 memory.md",
        color: "#22c55e",
        nodeType: "PERSISTENT MEMORY",
        sections: [
          { heading: "Role", items: [
            "Cross-session project knowledge base",
            "Injected into every LLM call automatically",
            "Append-only — never overwrite, clean obsolete entries",
          ]},
          { heading: "When to read", items: ["Injected automatically — no action required"] },
          { heading: "When to write", items: [
            "Build/test commands discovered in the project",
            "Important architecture decisions retained",
            "Recurring conventions and patterns in the codebase",
            "Observed user preferences",
            "Project-specific technologies/constraints",
          ]},
          { heading: "What does NOT belong here", items: [
            "Current task state → scratchpad",
            "Temporary or mission-specific info",
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
        title: "Agents",
        color: "#6d28d9",
        nodeType: "DELEGATION",
        sections: [
          { heading: "Types", items: ["`explore` — search, file reads, architecture", "`general` — writing, editing, bash, implementation", "Custom persona — `backend-engineer`, `api-architect`…"] },
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
        title: "↩ Fix + re-review",
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
          { heading: "Memory update", items: ["Write learnings to .opencode/memory.md", "Clean up scratchpad (completed tasks)"] },
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
    },
    brainstormSvgLabels: {
      bs_start: "Session Start",
      bs_existing_check: "Existing briefs?",
      bs_single_found: "One brief found",
      bs_multi_found: "Multiple found",
      bs_status_check: "Status = draft?",
      bs_ask_continue: "Continue or fresh?",
      bs_load_brief: "Load brief",
      bs_phase1: "Phase 1 — Discovery",
      bs_problem_clear: "Problem clear?",
      bs_phase2: "Phase 2 — Deep Dive",
      bs_adversarial: "Adversarial Gate",
      bs_template_fillable: "All sections fillable?",
      bs_phase3: "Phase 3 — Draft + Validate",
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
          { heading: "What happens", items: ["Session is initiated with brainstorm agent", "Agent globs docs/briefs/**/*.md to check for existing briefs", "Routing decision made before any questions are asked"] },
        ],
      },
      bs_existing_check: {
        title: "Existing briefs found?",
        color: "#0d9488",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["NO → Flow normal → Phase 1 (Discovery)", "ONE found → check status (draft / done)", "MULTIPLE found → list briefs, ask which one or new project"] },
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
          { heading: "What happens", items: ["Agent lists all found briefs to the user", "Asks: which one to resume, or start a new project?", "CHOOSE EXISTING → Load brief → Phase 3 (revision)", "NEW PROJECT → Flow normal → Phase 1"] },
        ],
      },
      bs_status_check: {
        title: "Status = draft?",
        color: "#0891b2",
        nodeType: "DECISION",
        sections: [
          { heading: "Branches", items: ["YES (draft) → Ask: continue or fresh start?", "NO (done/other) → Inform user, ask new project name → Phase 1"] },
        ],
      },
      bs_ask_continue: {
        title: "Continue or fresh start?",
        color: "#0891b2",
        nodeType: "ACTION",
        sections: [
          { heading: "What happens", items: ["User is shown the existing draft brief summary", "Asked: resume from where we left off, or start fresh?", "CONTINUE → Load brief → jump directly to Phase 3 (revision)", "FRESH → Ignore existing brief → Phase 1 (Discovery)"] },
        ],
      },
      bs_load_brief: {
        title: "Load brief",
        color: "#0891b2",
        nodeType: "ACTION",
        sections: [
          { heading: "What happens", items: ["Agent reads the existing brief file from docs/briefs/", "Provides full context to Phase 3 (revision mode)", "User can iterate on the existing content rather than restarting"] },
        ],
      },
      bs_phase1: {
        title: "Phase 1 — Discovery",
        color: "#2563eb",
        nodeType: "MAIN PHASE",
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
          { heading: "Exit criteria", items: ["YES → problem stated in 2–4 clear sentences AND primary user named → Phase 2", "NO → iterate — ask more targeted follow-up questions"] },
        ],
      },
      bs_phase2: {
        title: "Phase 2 — Deep Dive",
        color: "#4f46e5",
        nodeType: "MAIN PHASE",
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
          { heading: "Branches", items: ["YES → proceed to Phase 3 (draft + validation)", "NO → iterate back in Phase 2 — identify which sections are still empty"] },
          { heading: "Template sections required", items: ["Problem statement", "Primary user", "Success criteria", "Top use cases", "Constraints", "Out of scope", "Risks / adversarial answers"] },
        ],
      },
      bs_phase3: {
        title: "Phase 3 — Draft + Validation",
        color: "#6d28d9",
        nodeType: "MAIN PHASE",
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
    },
  };
}

// Y positions map for scroll-to (populated in FlowChart, read in App)
const NODE_Y_MAP: Record<string, number> = {};

// Y positions map for Brainstorm flowchart scroll-to
const BRAINSTORM_NODE_Y_MAP: Record<string, number> = {};

// ─── SVG Flowchart ────────────────────────────────────────────────────────────

const CX = 330;
const LX = 105;
const RX = 540;

const W_PHASE = 220;
const H_PHASE = 58;
const W_ACTION = 190;
const H_ACTION = 44;
const W_SMALL = 170;
const H_SMALL = 40;
const W_PILL = 200;
const H_PILL = 44;
const W_MEM = 140;
const H_MEM = 44;
const DHW = 80;
const DHH = 35;

function actionBox(cx: number, cy: number, w: number, h: number) {
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

interface NodeProps {
  id: string;
  selected: string;
  onSelect: (id: string, nodeY: number) => void;
}

const SHADOW = "url(#shadow)";

function PhaseNode({ id, cx, cy, label, fill, selected: sel, onSelect }: NodeProps & { cx: number; cy: number; label: string; fill: string }) {
  const b = { x: cx - W_PHASE / 2, y: cy - H_PHASE / 2, w: W_PHASE, h: H_PHASE };
  const isSelected = sel === id;
  return (
    <g onClick={() => onSelect(id, cy)} cursor="pointer" filter={SHADOW}>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} fill={fill}
        stroke={isSelected ? "#0f172a" : "none"} strokeWidth={isSelected ? 3 : 0} />
      {isSelected && <rect x={b.x - 3} y={b.y - 3} width={b.w + 6} height={b.h + 6} rx={14}
        fill="none" stroke="#0f172a" strokeWidth={2} strokeDasharray="4 2" />}
      <text x={cx} y={cy + 6} textAnchor="middle" fill="white" fontSize={15} fontWeight="700"
        fontFamily="system-ui, sans-serif">{label}</text>
    </g>
  );
}

function DiamondNode({ id, cx, cy, label, stroke, selected: sel, onSelect }: NodeProps & { cx: number; cy: number; label: string; stroke: string }) {
  const pts = `${cx},${cy - DHH} ${cx + DHW},${cy} ${cx},${cy + DHH} ${cx - DHW},${cy}`;
  const isSelected = sel === id;
  return (
    <g onClick={() => onSelect(id, cy)} cursor="pointer">
      <polygon points={pts} fill="white" stroke={isSelected ? "#0f172a" : stroke}
        strokeWidth={isSelected ? 3 : 2.5} />
      <text x={cx} y={cy + 5} textAnchor="middle" fill={stroke} fontSize={13} fontWeight="600"
        fontFamily="system-ui, sans-serif">{label}</text>
    </g>
  );
}

function ActionNode({ id, cx, cy, label, sub, fill, stroke, textFill, selected: sel, onSelect, w = W_ACTION, h = H_ACTION }: NodeProps & { cx: number; cy: number; label: string; sub?: string; fill: string; stroke: string; textFill: string; w?: number; h?: number }) {
  const b = actionBox(cx, cy, w, h);
  const isSelected = sel === id;
  return (
    <g onClick={() => onSelect(id, cy)} cursor="pointer">
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={7} fill={fill}
        stroke={isSelected ? "#0f172a" : stroke} strokeWidth={isSelected ? 3 : 1.5} />
      <text x={cx} y={sub ? cy - 6 : cy + 5} textAnchor="middle" fill={textFill} fontSize={13}
        fontWeight="600" fontFamily="system-ui, sans-serif">{label}</text>
      {sub && <text x={cx} y={cy + 11} textAnchor="middle" fill={textFill} fontSize={11}
        fontWeight="400" fontFamily="system-ui, sans-serif" opacity={0.7}>{sub}</text>}
    </g>
  );
}

function EscaladeNode({ id, cx, cy, label, sub, selected: sel, onSelect, w = W_SMALL, h = H_SMALL }: NodeProps & { cx: number; cy: number; label: string; sub?: string; w?: number; h?: number }) {
  const b = actionBox(cx, cy, w, h);
  const isSelected = sel === id;
  return (
    <g onClick={() => onSelect(id, cy)} cursor="pointer">
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={7} fill="#fef2f2"
        stroke={isSelected ? "#0f172a" : "#ef4444"} strokeWidth={isSelected ? 3 : 2} />
      <text x={cx} y={sub ? cy - 6 : cy + 5} textAnchor="middle" fill="#991b1b" fontSize={12}
        fontWeight="700" fontFamily="system-ui, sans-serif">{label}</text>
      {sub && <text x={cx} y={cy + 10} textAnchor="middle" fill="#991b1b" fontSize={10}
        fontFamily="system-ui, sans-serif" opacity={0.8}>{sub}</text>}
    </g>
  );
}

function PillNode({ id, cx, cy, label, selected: sel, onSelect }: NodeProps & { cx: number; cy: number; label: string }) {
  const isSelected = sel === id;
  return (
    <g onClick={() => onSelect(id, cy)} cursor="pointer" filter={SHADOW}>
      <rect x={cx - W_PILL / 2} y={cy - H_PILL / 2} width={W_PILL} height={H_PILL} rx={22}
        fill="#1e293b" stroke={isSelected ? "#94a3b8" : "none"} strokeWidth={isSelected ? 3 : 0} />
      <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize={13} fontWeight="600"
        fontFamily="system-ui, sans-serif">{label}</text>
    </g>
  );
}

function MemFileNode({ id, cx, cy, label, sub, bgColor, borderColor, textColor, selected: sel, onSelect }: NodeProps & { cx: number; cy: number; label: string; sub: string; bgColor: string; borderColor: string; textColor: string }) {
  const b = actionBox(cx, cy, W_MEM, H_MEM);
  const isSelected = sel === id;
  return (
    <g onClick={() => onSelect(id, cy)} cursor="pointer">
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={7} fill={bgColor}
        stroke={isSelected ? "#0f172a" : borderColor} strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={isSelected ? "none" : "5,4"} />
      <text x={cx} y={cy - 5} textAnchor="middle" fill={textColor} fontSize={11} fontWeight="700"
        fontFamily="system-ui, sans-serif">{label}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={textColor} fontSize={9} fontWeight="400"
        fontFamily="system-ui, sans-serif" opacity={0.75}>{sub}</text>
    </g>
  );
}

function ArrowLabel({ x, y, text, color = "#64748b", align = "middle" }: { x: number; y: number; text: string; color?: string; align?: string }) {
  return (
    <text x={x} y={y} textAnchor={align as "middle" | "start" | "end"} fill={color} fontSize={11}
      fontWeight="700" fontFamily="system-ui, sans-serif">{text}</text>
  );
}

// Small annotation (italic, below a node)
function Annot({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fill={color} fontSize={10}
      fontStyle="italic" fontFamily="system-ui, sans-serif">{text}</text>
  );
}

function FlowChart({ selected, onSelect, lang }: { selected: string; onSelect: (id: string, nodeY: number) => void; lang: Lang }) {
  const { svgLabels: L } = getFlowchartData(lang);
  const svgWidth = 700;
  const svgHeight = 1850;
  const ns: NodeProps = { id: "", selected, onSelect };

  const Y_UNDERSTAND = 130;
  const Y_MEM_FILES = Y_UNDERSTAND + 78;
  const OFFSET = 90;

  const Y = {
    start: 40,
    understand: Y_UNDERSTAND,
    mem_files: Y_MEM_FILES,
    ambigu: 240 + OFFSET,
    question: 250 + OFFSET,       // left branch — slightly below ambigu diamond centre
    plan: 370 + OFFSET,
    delegate: 470 + OFFSET,
    bug_decision: 578 + OFFSET,
    bug_finder: 570 + OFFSET,     // right branch — aligned near bug_decision
    certitude: 655 + OFFSET,
    esc_uncertainty: 748 + OFFSET,
    agents: 715 + OFFSET,
    agent_failure: 830 + OFFSET,
    retry: 830 + OFFSET,          // left branch — same row as agent_failure diamond
    esc_retry: 920 + OFFSET,
    review: 990 + OFFSET,
    review_manager: 1095 + OFFSET,
    verdict: 1205 + OFFSET,
    changes_loop: 1210 + OFFSET,  // left branch — same row as verdict diamond
    esc_blocked: 1210 + OFFSET,   // right branch — same row as verdict diamond
    synthesize: 1345 + OFFSET,
    autoeval: 1445 + OFFSET,
    gap_majeur: 1450 + OFFSET,    // left branch — same row as autoeval diamond
    fix_rapide: 1450 + OFFSET,    // right branch — same row as autoeval diamond
    end: 1595 + OFFSET,
  };

  // Populate the global Y map for scroll-to
  Object.entries(Y).forEach(([k, v]) => { NODE_Y_MAP[k] = v; });
  NODE_Y_MAP["scratchpad"] = Y.mem_files;
  NODE_Y_MAP["memory"] = Y.mem_files;

  // Memory file node X (adjusted for Fix 1)
  const MEM_LX = 85;
  const MEM_RX = 575;

  return (
    <svg width={svgWidth} height={svgHeight} style={{ display: "block", margin: "0 auto" }}>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.15)" />
        </filter>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#16a34a" />
        </marker>
        <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#dc2626" />
        </marker>
        <marker id="arrow-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#d97706" />
        </marker>
        <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#0ea5e9" />
        </marker>
        <marker id="arrow-blue-rev" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto">
          <path d="M8,0 L8,6 L0,3 z" fill="#0ea5e9" />
        </marker>
        <marker id="arrow-emerald" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#22c55e" />
        </marker>
        <marker id="arrow-emerald-rev" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto">
          <path d="M8,0 L8,6 L0,3 z" fill="#22c55e" />
        </marker>
      </defs>

      {/* ── START ── */}
      <PillNode {...ns} id="start" cx={CX} cy={Y.start} label={L.start} />

      <path d={`M ${CX},${Y.start + H_PILL / 2} L ${CX},${Y.understand - H_PHASE / 2 - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── UNDERSTAND ── */}
      <PhaseNode {...ns} id="understand" cx={CX} cy={Y.understand} label="1. Understand" fill="#2563eb" />

      {/* ── MEMORY FILE NODES ── */}
      <MemFileNode {...ns} id="scratchpad" cx={MEM_LX} cy={Y.mem_files}
        label="📄 scratchpad.md" sub={L.scratchpad_sub}
        bgColor="#f0f9ff" borderColor="#0ea5e9" textColor="#0369a1" />

      <MemFileNode {...ns} id="memory" cx={MEM_RX} cy={Y.mem_files}
        label="📄 memory.md" sub={L.memory_sub}
        bgColor="#f0fdf4" borderColor="#22c55e" textColor="#166534" />

      {/* Bidirectional: scratchpad ↔ understand */}
      {/* Compute midpoint of the curve for label placement */}
      <path
        d={`M ${CX - W_PHASE / 2},${Y.understand} C ${CX - W_PHASE / 2 - 35},${Y.understand} ${MEM_LX + W_MEM / 2 + 15},${Y.mem_files - H_MEM / 2 - 8} ${MEM_LX + W_MEM / 2},${Y.mem_files - H_MEM / 2}`}
        stroke="#0ea5e9" strokeWidth={1.5} fill="none" strokeDasharray="5,4"
        markerEnd="url(#arrow-blue)" markerStart="url(#arrow-blue-rev)" />
      {/* label on the curve, roughly at 40% of the path */}
      <text
        x={(CX - W_PHASE / 2 + MEM_LX + W_MEM / 2) / 2 - 10}
        y={Y.understand + 32}
        textAnchor="middle" fill="#0ea5e9" fontSize={10} fontStyle="italic"
        fontFamily="system-ui, sans-serif">{L.mem_read_here}</text>

      {/* Bidirectional: memory.md ↔ understand */}
      <path
        d={`M ${CX + W_PHASE / 2},${Y.understand} C ${CX + W_PHASE / 2 + 35},${Y.understand} ${MEM_RX - W_MEM / 2 - 15},${Y.mem_files - H_MEM / 2 - 8} ${MEM_RX - W_MEM / 2},${Y.mem_files - H_MEM / 2}`}
        stroke="#22c55e" strokeWidth={1.5} fill="none" strokeDasharray="5,4"
        markerEnd="url(#arrow-emerald)" markerStart="url(#arrow-emerald-rev)" />
      <text
        x={(CX + W_PHASE / 2 + MEM_RX - W_MEM / 2) / 2 + 10}
        y={Y.understand + 32}
        textAnchor="middle" fill="#22c55e" fontSize={10} fontStyle="italic"
        fontFamily="system-ui, sans-serif">{L.mem_read_here}</text>

      {/* understand → ambigu */}
      <path d={`M ${CX},${Y.understand + H_PHASE / 2} L ${CX},${Y.ambigu - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── AMBIGU ── */}
      <DiamondNode {...ns} id="ambigu" cx={CX} cy={Y.ambigu} label={L.ambigu} stroke="#64748b" />

      <path d={`M ${CX - DHW},${Y.ambigu} L ${LX + W_SMALL / 2 + 6},${Y.ambigu}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
      <ArrowLabel x={CX - DHW - 6} y={Y.ambigu - 6} text={L.arrow_oui} color="#f59e0b" align="end" />

      <ActionNode {...ns} id="question" cx={LX} cy={Y.question} label={L.question_label}
        sub={L.question_sub} fill="#fef9c3" stroke="#ca8a04" textFill="#854d0e"
        w={W_SMALL} h={H_SMALL + 6} />

      <path
        d={`M ${LX - W_SMALL / 2},${Y.question - 8} C ${30},${Y.question - 8} ${30},${Y.understand} ${CX - W_PHASE / 2 - 6},${Y.understand}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" strokeDasharray="5 3"
      />

      <path d={`M ${CX},${Y.ambigu + DHH} L ${CX},${Y.plan - H_PHASE / 2 - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
      <ArrowLabel x={CX + 6} y={(Y.ambigu + DHH + Y.plan - H_PHASE / 2) / 2 + 5} text={L.arrow_non}
        color="#16a34a" align="start" />

      {/* ── PLAN ── */}
      <PhaseNode {...ns} id="plan" cx={CX} cy={Y.plan} label="2. Plan" fill="#4f46e5" />
      <Annot x={CX} y={Y.plan + H_PHASE / 2 + 13} text="✎ scratchpad" color="#0ea5e9" />

      <path d={`M ${CX},${Y.plan + H_PHASE / 2 + 17} L ${CX},${Y.delegate - H_PHASE / 2 - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── DELEGATE ── */}
      <PhaseNode {...ns} id="delegate" cx={CX} cy={Y.delegate} label="3. Delegate" fill="#7c3aed" />
      <Annot x={CX} y={Y.delegate + H_PHASE / 2 + 13} text={L.annot_delegate} color="#7c3aed" />

      <path d={`M ${CX},${Y.delegate + H_PHASE / 2 + 17} L ${CX},${Y.bug_decision - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── BUG DECISION ── */}
      <DiamondNode {...ns} id="bug_decision" cx={CX} cy={Y.bug_decision} label={L.bug_decision} stroke="#be123c" />

      <path d={`M ${CX + DHW},${Y.bug_decision} L ${RX - W_SMALL / 2 - 6},${Y.bug_finder}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" />
      <ArrowLabel x={CX + DHW + 6} y={Y.bug_decision - 8} text={L.arrow_oui} color="#dc2626" align="start" />

      {/* ── BUG FINDER ── */}
      <ActionNode {...ns} id="bug_finder" cx={RX} cy={Y.bug_finder} label="bug-finder"
        fill="#fef2f2" stroke="#ef4444" textFill="#991b1b" w={W_SMALL} h={H_SMALL} />

      <path d={`M ${RX},${Y.bug_finder + H_SMALL / 2} L ${RX},${Y.certitude - DHH - 6}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" />

      {/* ── CERTITUDE ── */}
      <DiamondNode {...ns} id="certitude" cx={RX} cy={Y.certitude} label={L.certitude} stroke="#be123c" />

      <path
        d={`M ${RX - DHW},${Y.certitude} L ${CX + W_ACTION / 2 + 6},${Y.agents}`}
        stroke="#16a34a" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-green)"
      />
      <ArrowLabel x={RX - DHW - 6} y={Y.certitude - 10} text="HIGH/MED" color="#16a34a" align="end" />

      <path d={`M ${RX},${Y.certitude + DHH} L ${RX},${Y.esc_uncertainty - H_SMALL / 2 - 6}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" />
      <ArrowLabel x={RX + 5} y={(Y.certitude + DHH + Y.esc_uncertainty - H_SMALL / 2) / 2 + 5}
        text="UNCERT." color="#dc2626" align="start" />

      <EscaladeNode {...ns} id="escalade_uncertainty" cx={RX} cy={Y.esc_uncertainty}
        label={L.esc_uncertainty_label} sub="UNCERTAINTY_EXPOSED" w={W_SMALL + 10} />

      <path d={`M ${CX},${Y.bug_decision + DHH} L ${CX},${Y.agents - H_ACTION / 2 - 8}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
      <ArrowLabel x={CX + 6} y={(Y.bug_decision + DHH + Y.agents - H_ACTION / 2) / 2 + 5}
        text={L.arrow_non} color="#16a34a" align="start" />

      {/* ── AGENTS ── */}
      <ActionNode {...ns} id="agents" cx={CX} cy={Y.agents} label="Agents"
        sub="explore / general / custom" fill="#ede9fe" stroke="#7c3aed" textFill="#4c1d95" />
      <Annot x={CX} y={Y.agents + H_ACTION / 2 + 13} text={L.annot_agents} color="#0ea5e9" />

      <path d={`M ${CX},${Y.agents + H_ACTION / 2 + 17} L ${CX},${Y.agent_failure - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── AGENT FAILURE ── */}
      <DiamondNode {...ns} id="agent_failure" cx={CX} cy={Y.agent_failure} label={L.agent_failure} stroke="#64748b" />

      <path d={`M ${CX - DHW},${Y.agent_failure} L ${LX + W_SMALL / 2 + 6},${Y.retry}`}
        stroke="#f59e0b" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-amber)" />
      <ArrowLabel x={CX - DHW - 6} y={Y.agent_failure - 8} text={L.arrow_oui} color="#f59e0b" align="end" />

      {/* ── RETRY ── */}
      <ActionNode {...ns} id="retry" cx={LX} cy={Y.retry} label="↩ Retry (max 2)"
        fill="#fef3c7" stroke="#d97706" textFill="#92400e" w={W_SMALL} h={H_SMALL} />

      <path
        d={`M ${LX - W_SMALL / 2},${Y.retry - 8} C ${28},${Y.retry - 8} ${28},${Y.agents} ${CX - W_PHASE / 2 - 6},${Y.agents}`}
        stroke="#f59e0b" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-amber)" strokeDasharray="5 3"
      />

      <path d={`M ${LX},${Y.retry + H_SMALL / 2} L ${LX},${Y.esc_retry - H_SMALL / 2 - 6}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" />
      <ArrowLabel x={LX + 5} y={(Y.retry + H_SMALL / 2 + Y.esc_retry - H_SMALL / 2) / 2 + 5}
        text="2×" color="#dc2626" align="start" />

      <EscaladeNode {...ns} id="escalade_retry" cx={LX} cy={Y.esc_retry}
        label={L.esc_retry_label} sub={L.esc_retry_sub} />

      <path d={`M ${CX},${Y.agent_failure + DHH} L ${CX},${Y.review - H_PHASE / 2 - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
      <ArrowLabel x={CX + 6} y={(Y.agent_failure + DHH + Y.review - H_PHASE / 2) / 2 + 5}
        text={L.arrow_non} color="#16a34a" align="start" />

      {/* ── REVIEW ── */}
      <PhaseNode {...ns} id="review" cx={CX} cy={Y.review} label="4. Review" fill="#b45309" />
      <Annot x={CX} y={Y.review + H_PHASE / 2 + 13} text="✎ scratchpad" color="#0ea5e9" />

      <path d={`M ${CX},${Y.review + H_PHASE / 2 + 17} L ${CX},${Y.review_manager - H_ACTION / 2 - 8}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── REVIEW MANAGER ── */}
      <ActionNode {...ns} id="review_manager" cx={CX} cy={Y.review_manager}
        label="review-manager" sub="code · security · requirements"
        fill="#fef3c7" stroke="#d97706" textFill="#92400e" />

      <path d={`M ${CX},${Y.review_manager + H_ACTION / 2 + 8} L ${CX},${Y.verdict - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── VERDICT ── */}
      <DiamondNode {...ns} id="verdict" cx={CX} cy={Y.verdict} label="Verdict ?" stroke="#b45309" />

      <path d={`M ${CX - DHW},${Y.verdict} L ${LX + W_SMALL / 2 + 6},${Y.changes_loop}`}
        stroke="#f59e0b" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-amber)" />
      <ArrowLabel x={CX - DHW - 6} y={Y.verdict - 8} text="CHANGES" color="#f59e0b" align="end" />

      <ActionNode {...ns} id="changes_loop" cx={LX} cy={Y.changes_loop}
        label="↩ Fix + re-review" fill="#fef3c7" stroke="#d97706" textFill="#92400e"
        w={W_SMALL} h={H_SMALL} />

      <path
        d={`M ${LX - W_SMALL / 2},${Y.changes_loop - 8} C ${28},${Y.changes_loop - 8} ${28},${Y.review} ${CX - W_PHASE / 2 - 6},${Y.review}`}
        stroke="#f59e0b" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-amber)" strokeDasharray="5 3"
      />

      <path d={`M ${CX + DHW},${Y.verdict} L ${RX - W_SMALL / 2 - 6},${Y.esc_blocked}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" />
      <ArrowLabel x={CX + DHW + 6} y={Y.verdict - 8} text="BLOCKED" color="#dc2626" align="start" />

      <EscaladeNode {...ns} id="escalade_blocked" cx={RX} cy={Y.esc_blocked}
        label={L.esc_blocked_label} sub="BLOCKED" />

      <path d={`M ${CX},${Y.verdict + DHH} L ${CX},${Y.synthesize - H_PHASE / 2 - 6}`}
        stroke="#16a34a" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-green)" />
      <ArrowLabel x={CX + 6} y={(Y.verdict + DHH + Y.synthesize - H_PHASE / 2) / 2 + 5}
        text="APPROVED" color="#16a34a" align="start" />

      {/* ── SYNTHESIZE ── */}
      <PhaseNode {...ns} id="synthesize" cx={CX} cy={Y.synthesize} label="5. Synthesize & Report" fill="#15803d" />
      <Annot x={CX} y={Y.synthesize + H_PHASE / 2 + 13} text="✎ scratchpad  ✎ memory.md" color="#0ea5e9" />
      <Annot x={CX} y={Y.synthesize + H_PHASE / 2 + 26} text={L.annot_memory} color="#16a34a" />

      <path d={`M ${CX},${Y.synthesize + H_PHASE / 2 + 30} L ${CX},${Y.autoeval - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── AUTOEVAL ── */}
      <DiamondNode {...ns} id="autoeval" cx={CX} cy={Y.autoeval} label="Auto-eval OK?" stroke="#15803d" />

      <path d={`M ${CX - DHW},${Y.autoeval} L ${LX + W_SMALL / 2 + 6},${Y.gap_majeur}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" />
      <ArrowLabel x={CX - DHW - 6} y={Y.autoeval - 8} text={L.arrow_gap_majeur} color="#dc2626" align="end" />

      <ActionNode {...ns} id="gap_majeur" cx={LX} cy={Y.gap_majeur}
        label="↩ Delegate" fill="#dcfce7" stroke="#16a34a" textFill="#166534"
        w={W_SMALL} h={H_SMALL} />

      <path
        d={`M ${LX - W_SMALL / 2},${Y.gap_majeur - 8} C ${28},${Y.gap_majeur - 8} ${28},${Y.delegate} ${CX - W_PHASE / 2 - 6},${Y.delegate}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" strokeDasharray="5 3"
      />

      <path d={`M ${CX + DHW},${Y.autoeval} L ${RX - W_SMALL / 2 - 6},${Y.fix_rapide}`}
        stroke="#f59e0b" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-amber)" />
      <ArrowLabel x={CX + DHW + 6} y={Y.autoeval - 8} text={L.arrow_gap_mineur} color="#f59e0b" align="start" />

      <ActionNode {...ns} id="fix_rapide" cx={RX} cy={Y.fix_rapide}
        label="Fix rapide" fill="#dcfce7" stroke="#16a34a" textFill="#166534"
        w={W_SMALL} h={H_SMALL} />

      <path
        d={`M ${RX},${Y.fix_rapide + H_SMALL / 2} C ${RX},${Y.fix_rapide + 70} ${CX + 120},${Y.end - 40} ${CX + W_PILL / 2 + 6},${Y.end}`}
        stroke="#16a34a" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-green)" strokeDasharray="5 3"
      />

      <path d={`M ${CX},${Y.autoeval + DHH} L ${CX},${Y.end - H_PILL / 2 - 6}`}
        stroke="#16a34a" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-green)" />
      <ArrowLabel x={CX + 6} y={(Y.autoeval + DHH + Y.end - H_PILL / 2) / 2 + 5}
        text="OK" color="#16a34a" align="start" />

      {/* ── END ── */}
      <PillNode {...ns} id="end" cx={CX} cy={Y.end} label={L.end} />
    </svg>
  );
}

// ─── Brainstorm Flowchart ─────────────────────────────────────────────────────

const BS_CX = 330;   // main center x
const BS_LX = 100;   // left branch x
const BS_RX = 555;   // right branch x

function BrainstormFlowChart({ selected, onSelect, lang }: { selected: string; onSelect: (id: string, nodeY: number) => void; lang: Lang }) {
  const { brainstormSvgLabels: L } = getFlowchartData(lang);
  const svgWidth = 700;
  const svgHeight = 1980;
  const ns: NodeProps = { id: "", selected, onSelect };

  // ── Y positions ──
  const Y = {
    bs_start:             50,
    bs_existing_check:   145,
    bs_single_found:     240,   // right branch
    bs_multi_found:      240,   // far right — same row but shifted to RX+30
    bs_status_check:     340,   // right branch (continuing from single_found)
    bs_ask_continue:     440,   // right branch
    bs_load_brief:       540,   // right + multi load
    bs_phase1:           680,
    bs_problem_clear:    790,
    bs_phase2:           920,
    bs_adversarial:     1040,
    bs_template_fillable:1140,
    bs_phase3:          1280,
    bs_quality_gate:    1390,
    bs_quality_passed:  1495,
    bs_file_exists:     1610,
    bs_file_conflict:   1710,
  };

  // The "write" nodes sit at Y_WRITE, end node at Y_END
  const Y_WRITE = 1810;
  const Y_END = 1910;

  // Populate BRAINSTORM_NODE_Y_MAP
  Object.entries(Y).forEach(([k, v]) => { BRAINSTORM_NODE_Y_MAP[k] = v; });
  BRAINSTORM_NODE_Y_MAP["bs_write_overwrite"] = Y_WRITE;
  BRAINSTORM_NODE_Y_MAP["bs_write_version"] = Y_WRITE;
  BRAINSTORM_NODE_Y_MAP["bs_write_rename"] = Y_WRITE;
  BRAINSTORM_NODE_Y_MAP["bs_end"] = Y_END;
  BRAINSTORM_NODE_Y_MAP["bs_esc_blocked"] = Y.bs_quality_passed;

  // Widths
  const W_P = W_PHASE;
  const W_A = W_ACTION;
  const W_S = W_SMALL;

  return (
    <svg width={svgWidth} height={svgHeight} style={{ display: "block", margin: "0 auto" }}>
      <defs>
        <filter id="bs-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.15)" />
        </filter>
        <marker id="bs-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
        </marker>
        <marker id="bs-arrow-teal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#0d9488" />
        </marker>
        <marker id="bs-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#2563eb" />
        </marker>
        <marker id="bs-arrow-indigo" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#4f46e5" />
        </marker>
        <marker id="bs-arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#7c3aed" />
        </marker>
        <marker id="bs-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#16a34a" />
        </marker>
        <marker id="bs-arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#dc2626" />
        </marker>
        <marker id="bs-arrow-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#d97706" />
        </marker>
        <marker id="bs-arrow-cyan" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#0891b2" />
        </marker>
      </defs>

      {/* ── SESSION START ── */}
      <PillNode {...ns} id="bs_start" cx={BS_CX} cy={Y.bs_start} label={L.bs_start} />

      <path d={`M ${BS_CX},${Y.bs_start + H_PILL / 2} L ${BS_CX},${Y.bs_existing_check - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow)" />

      {/* ── EXISTING BRIEFS? ── */}
      <DiamondNode {...ns} id="bs_existing_check" cx={BS_CX} cy={Y.bs_existing_check} label={L.bs_existing_check} stroke="#0d9488" />

      {/* NO branch from existing_check: goes straight down to Phase 1 */}
      <path d={`M ${BS_CX - DHW - 2},${Y.bs_existing_check} L ${60},${Y.bs_existing_check} L ${60},${Y.bs_phase1} L ${BS_CX - W_P / 2 - 6},${Y.bs_phase1}`}
        stroke="#0d9488" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-teal)" />
      <ArrowLabel x={66} y={Math.round((Y.bs_existing_check + Y.bs_phase1) / 2)} text={L.bs_arrow_none} color="#0d9488" align="start" />
      <path d={`M ${BS_CX + DHW},${Y.bs_existing_check} L ${BS_RX - W_S / 2 - 6},${Y.bs_single_found}`}
        stroke="#0891b2" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-cyan)" />
      <ArrowLabel x={BS_CX + DHW + 6} y={Y.bs_existing_check - 8} text={L.bs_arrow_one} color="#0891b2" align="start" />

      {/* ── SINGLE FOUND ── */}
      <ActionNode {...ns} id="bs_single_found" cx={BS_RX} cy={Y.bs_single_found}
        label={L.bs_single_found} fill="#ecfeff" stroke="#0891b2" textFill="#0e7490"
        w={W_S + 20} h={H_SMALL} />

      {/* single_found → status_check */}
      <path d={`M ${BS_RX},${Y.bs_single_found + H_SMALL / 2} L ${BS_RX},${Y.bs_status_check - DHH - 6}`}
        stroke="#0891b2" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-cyan)" />

      {/* ── STATUS = DRAFT? ── */}
      <DiamondNode {...ns} id="bs_status_check" cx={BS_RX} cy={Y.bs_status_check} label={L.bs_status_check} stroke="#0891b2" />

      {/* status: YES (draft) → ask_continue (straight down) */}
      <path d={`M ${BS_RX},${Y.bs_status_check + DHH} L ${BS_RX},${Y.bs_ask_continue - H_ACTION / 2 - 6}`}
        stroke="#0891b2" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-cyan)" />
      <ArrowLabel x={BS_RX + 6} y={(Y.bs_status_check + DHH + Y.bs_ask_continue - H_ACTION / 2) / 2 + 5} text={L.bs_arrow_draft} color="#0891b2" align="start" />

      {/* status: NO → done/other: goes back left to Phase 1 path */}
      <path d={`M ${BS_RX - DHW},${Y.bs_status_check} C ${BS_CX + 40},${Y.bs_status_check} ${BS_CX + 40},${Y.bs_phase1 - H_PHASE / 2} ${BS_CX + W_P / 2 + 6},${Y.bs_phase1}`}
        stroke="#64748b" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow)" strokeDasharray="5 3" />
      <ArrowLabel x={BS_RX - DHW - 6} y={Y.bs_status_check - 8} text={L.bs_arrow_done} color="#64748b" align="end" />

      {/* ── ASK CONTINUE ── */}
      <ActionNode {...ns} id="bs_ask_continue" cx={BS_RX} cy={Y.bs_ask_continue}
        label={L.bs_ask_continue} fill="#ecfeff" stroke="#0891b2" textFill="#0e7490"
        w={W_S + 20} h={H_SMALL} />

      {/* CONTINUE → load_brief */}
      <path d={`M ${BS_RX},${Y.bs_ask_continue + H_SMALL / 2} L ${BS_RX},${Y.bs_load_brief - H_ACTION / 2 - 6}`}
        stroke="#0891b2" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-cyan)" />
      <ArrowLabel x={BS_RX + 6} y={(Y.bs_ask_continue + H_SMALL / 2 + Y.bs_load_brief - H_ACTION / 2) / 2 + 5} text={L.bs_arrow_continue} color="#0891b2" align="start" />

      {/* FRESH → Phase 1 (curved back to center) */}
      <path d={`M ${BS_RX - W_S / 2 - 10},${Y.bs_ask_continue} C ${BS_CX + 60},${Y.bs_ask_continue} ${BS_CX + 60},${Y.bs_phase1 - H_PHASE / 2} ${BS_CX + W_P / 2 + 6},${Y.bs_phase1}`}
        stroke="#64748b" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow)" strokeDasharray="5 3" />
      <ArrowLabel x={BS_RX - W_S / 2 - 16} y={Y.bs_ask_continue - 8} text={L.bs_arrow_fresh} color="#64748b" align="end" />

      {/* ── LOAD BRIEF ── */}
      <ActionNode {...ns} id="bs_load_brief" cx={BS_RX} cy={Y.bs_load_brief}
        label={L.bs_load_brief} fill="#ecfeff" stroke="#0891b2" textFill="#0e7490"
        w={W_S + 20} h={H_SMALL} />

      {/* load_brief → phase3 (jump ahead, curved) */}
      <path d={`M ${BS_RX},${Y.bs_load_brief + H_SMALL / 2} C ${BS_RX + 60},${Y.bs_load_brief + 60} ${BS_RX + 60},${Y.bs_phase3 - 60} ${BS_CX + W_P / 2 + 6},${Y.bs_phase3}`}
        stroke="#0891b2" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-cyan)" strokeDasharray="5 3" />
      <ArrowLabel x={BS_RX + 66} y={(Y.bs_load_brief + Y.bs_phase3) / 2} text="→ Ph.3" color="#0891b2" align="start" />

      {/* MULTIPLE branch from existing_check: goes to multi_found (left branch) */}
      <path d={`M ${BS_CX - DHW},${Y.bs_existing_check} L ${BS_LX + W_S / 2 + 6},${Y.bs_multi_found}`}
        stroke="#0891b2" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-cyan)" />
      <ArrowLabel x={BS_CX - DHW - 6} y={Y.bs_existing_check - 6} text={L.bs_arrow_multiple} color="#0891b2" align="end" />

      {/* ── MULTI FOUND ── */}
      <ActionNode {...ns} id="bs_multi_found" cx={BS_LX} cy={Y.bs_multi_found}
        label={L.bs_multi_found} fill="#ecfeff" stroke="#0891b2" textFill="#0e7490"
        w={W_S + 20} h={H_SMALL} />

      {/* multi: CHOOSE EXISTING → load_brief (curved right + down) */}
      <path d={`M ${BS_LX + W_S / 2 + 10},${Y.bs_multi_found} C ${BS_CX - 60},${Y.bs_multi_found} ${BS_CX - 60},${Y.bs_load_brief} ${BS_RX - W_S / 2 - 10},${Y.bs_load_brief}`}
        stroke="#0891b2" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-cyan)" strokeDasharray="5 3" />
      <ArrowLabel x={BS_LX + W_S / 2 + 16} y={Y.bs_multi_found - 10} text={L.bs_arrow_choose} color="#0891b2" align="start" />

      {/* multi: NEW PROJECT → Phase 1 */}
      <path d={`M ${BS_LX},${Y.bs_multi_found + H_SMALL / 2} C ${BS_LX},${Y.bs_multi_found + 60} ${BS_CX - W_P / 2 - 30},${Y.bs_phase1 - 30} ${BS_CX - W_P / 2 - 6},${Y.bs_phase1}`}
        stroke="#64748b" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow)" strokeDasharray="5 3" />
      <ArrowLabel x={BS_LX - 4} y={Y.bs_multi_found + H_SMALL / 2 + 14} text={L.bs_arrow_new} color="#64748b" align="middle" />

      {/* ── PHASE 1 — DISCOVERY ── */}
      <PhaseNode {...ns} id="bs_phase1" cx={BS_CX} cy={Y.bs_phase1} label={L.bs_phase1} fill="#2563eb" />

      <path d={`M ${BS_CX},${Y.bs_phase1 + H_PHASE / 2} L ${BS_CX},${Y.bs_problem_clear - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow)" />

      {/* ── PROBLEM CLEAR? ── */}
      <DiamondNode {...ns} id="bs_problem_clear" cx={BS_CX} cy={Y.bs_problem_clear} label={L.bs_problem_clear} stroke="#2563eb" />

      {/* NO → loop back to Phase 1 */}
      <path d={`M ${BS_CX - DHW},${Y.bs_problem_clear} L ${50},${Y.bs_problem_clear} L ${50},${Y.bs_phase1} L ${BS_CX - W_P / 2 - 6},${Y.bs_phase1}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-red)" strokeDasharray="5 3" />
      <ArrowLabel x={BS_CX - DHW - 6} y={Y.bs_problem_clear - 8} text={L.bs_arrow_no} color="#dc2626" align="end" />

      {/* YES → Phase 2 */}
      <path d={`M ${BS_CX},${Y.bs_problem_clear + DHH} L ${BS_CX},${Y.bs_phase2 - H_PHASE / 2 - 6}`}
        stroke="#2563eb" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-blue)" />
      <ArrowLabel x={BS_CX + 6} y={(Y.bs_problem_clear + DHH + Y.bs_phase2 - H_PHASE / 2) / 2 + 5} text={L.bs_arrow_yes} color="#2563eb" align="start" />

      {/* ── PHASE 2 — DEEP DIVE ── */}
      <PhaseNode {...ns} id="bs_phase2" cx={BS_CX} cy={Y.bs_phase2} label={L.bs_phase2} fill="#4f46e5" />

      <path d={`M ${BS_CX},${Y.bs_phase2 + H_PHASE / 2} L ${BS_CX},${Y.bs_adversarial - H_ACTION / 2 - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow)" />

      {/* ── ADVERSARIAL GATE ── */}
      <ActionNode {...ns} id="bs_adversarial" cx={BS_CX} cy={Y.bs_adversarial}
        label={L.bs_adversarial} fill="#ede9fe" stroke="#7c3aed" textFill="#4c1d95"
        w={W_A} h={H_ACTION} />

      <path d={`M ${BS_CX},${Y.bs_adversarial + H_ACTION / 2} L ${BS_CX},${Y.bs_template_fillable - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow)" />

      {/* ── ALL SECTIONS FILLABLE? ── */}
      <DiamondNode {...ns} id="bs_template_fillable" cx={BS_CX} cy={Y.bs_template_fillable} label={L.bs_template_fillable} stroke="#7c3aed" />

      {/* NO → back to Phase 2 */}
      <path d={`M ${BS_CX - DHW},${Y.bs_template_fillable} L ${50},${Y.bs_template_fillable} L ${50},${Y.bs_phase2} L ${BS_CX - W_P / 2 - 6},${Y.bs_phase2}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-red)" strokeDasharray="5 3" />
      <ArrowLabel x={BS_CX - DHW - 6} y={Y.bs_template_fillable - 8} text={L.bs_arrow_missing} color="#dc2626" align="end" />

      {/* YES → Phase 3 */}
      <path d={`M ${BS_CX},${Y.bs_template_fillable + DHH} L ${BS_CX},${Y.bs_phase3 - H_PHASE / 2 - 6}`}
        stroke="#7c3aed" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-purple)" />
      <ArrowLabel x={BS_CX + 6} y={(Y.bs_template_fillable + DHH + Y.bs_phase3 - H_PHASE / 2) / 2 + 5} text={L.bs_arrow_all_fillable} color="#7c3aed" align="start" />

      {/* ── PHASE 3 — DRAFT + VALIDATE ── */}
      <PhaseNode {...ns} id="bs_phase3" cx={BS_CX} cy={Y.bs_phase3} label={L.bs_phase3} fill="#6d28d9" />

      <path d={`M ${BS_CX},${Y.bs_phase3 + H_PHASE / 2} L ${BS_CX},${Y.bs_quality_gate - H_ACTION / 2 - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow)" />

      {/* ── QUALITY GATE ── */}
      <ActionNode {...ns} id="bs_quality_gate" cx={BS_CX} cy={Y.bs_quality_gate}
        label={L.bs_quality_gate} fill="#ede9fe" stroke="#6d28d9" textFill="#3b0764"
        w={W_A} h={H_ACTION} />

      <path d={`M ${BS_CX},${Y.bs_quality_gate + H_ACTION / 2} L ${BS_CX},${Y.bs_quality_passed - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow)" />

      {/* ── QUALITY GATE PASSED? ── */}
      <DiamondNode {...ns} id="bs_quality_passed" cx={BS_CX} cy={Y.bs_quality_passed} label={L.bs_quality_passed} stroke="#6d28d9" />

      {/* BLOCKED → escalade (right) */}
      <EscaladeNode {...ns} id="bs_esc_blocked" cx={BS_RX} cy={Y.bs_quality_passed}
        label={L.bs_esc_blocked_label} sub={L.bs_esc_blocked_sub} w={W_S} />
      <path d={`M ${BS_CX + DHW},${Y.bs_quality_passed} L ${BS_RX - W_S / 2 - 6},${Y.bs_quality_passed}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-red)" />
      <ArrowLabel x={BS_CX + DHW + 6} y={Y.bs_quality_passed - 8} text={L.bs_arrow_blocked} color="#dc2626" align="start" />

      {/* TIER 2 → left branch (ask user → re-run gate) */}
      <path d={`M ${BS_CX - DHW},${Y.bs_quality_passed} L ${60},${Y.bs_quality_passed} L ${60},${Y.bs_quality_gate} L ${BS_CX - W_A / 2 - 6},${Y.bs_quality_gate}`}
        stroke="#d97706" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-amber)" strokeDasharray="5 3" />
      <ArrowLabel x={BS_CX - DHW - 6} y={Y.bs_quality_passed - 8} text={L.bs_arrow_tier2} color="#d97706" align="end" />

      {/* PASSED → file_exists */}
      <path d={`M ${BS_CX},${Y.bs_quality_passed + DHH} L ${BS_CX},${Y.bs_file_exists - DHH - 6}`}
        stroke="#16a34a" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-green)" />
      <ArrowLabel x={BS_CX + 6} y={(Y.bs_quality_passed + DHH + Y.bs_file_exists - DHH) / 2 + 5} text={L.bs_arrow_passed} color="#16a34a" align="start" />

      {/* ── FILE ALREADY EXISTS? ── */}
      <DiamondNode {...ns} id="bs_file_exists" cx={BS_CX} cy={Y.bs_file_exists} label={L.bs_file_exists} stroke="#7c3aed" />

      {/* NO → write directly */}
      <path d={`M ${BS_CX - DHW},${Y.bs_file_exists} L ${BS_LX + W_S / 2 + 6},${Y_WRITE}`}
        stroke="#16a34a" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-green)" />
      <ArrowLabel x={BS_CX - DHW - 6} y={Y.bs_file_exists - 8} text={L.bs_arrow_no} color="#16a34a" align="end" />

      {/* YES → file_conflict */}
      <path d={`M ${BS_CX},${Y.bs_file_exists + DHH} L ${BS_CX},${Y.bs_file_conflict - H_ACTION / 2 - 6}`}
        stroke="#7c3aed" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-purple)" />
      <ArrowLabel x={BS_CX + 6} y={(Y.bs_file_exists + DHH + Y.bs_file_conflict - H_ACTION / 2) / 2 + 5} text={L.bs_arrow_yes} color="#7c3aed" align="start" />

      {/* ── FILE CONFLICT ── */}
      <ActionNode {...ns} id="bs_file_conflict" cx={BS_CX} cy={Y.bs_file_conflict}
        label={L.bs_file_conflict} fill="#f5f3ff" stroke="#7c3aed" textFill="#4c1d95"
        w={W_A + 20} h={H_ACTION} />

      {/* OVERWRITE → write */}
      <path d={`M ${BS_CX - W_A / 2 - 10},${Y.bs_file_conflict} L ${BS_LX + W_S / 2 + 6},${Y_WRITE}`}
        stroke="#7c3aed" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-purple)" />
      <ArrowLabel x={BS_CX - W_A / 2 - 16} y={Y.bs_file_conflict - 8} text={L.bs_arrow_overwrite} color="#7c3aed" align="end" />

      {/* NEW VERSION → write */}
      <path d={`M ${BS_CX},${Y.bs_file_conflict + H_ACTION / 2} L ${BS_CX},${Y_WRITE - H_SMALL / 2 - 6}`}
        stroke="#7c3aed" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-purple)" />
      <ArrowLabel x={BS_CX + 6} y={(Y.bs_file_conflict + H_ACTION / 2 + Y_WRITE - H_SMALL / 2) / 2 + 5} text={L.bs_arrow_version} color="#7c3aed" align="start" />

      {/* RENAME → write (right branch) */}
      <path d={`M ${BS_CX + W_A / 2 + 10},${Y.bs_file_conflict} L ${BS_RX - W_S / 2 - 6},${Y_WRITE}`}
        stroke="#7c3aed" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-purple)" />
      <ArrowLabel x={BS_CX + W_A / 2 + 16} y={Y.bs_file_conflict - 8} text={L.bs_arrow_rename} color="#7c3aed" align="start" />

      {/* ── WRITE FILE (center — from NEW VERSION) ── */}
      <ActionNode {...ns} id="bs_write_version" cx={BS_CX} cy={Y_WRITE}
        label={L.bs_write} fill="#dcfce7" stroke="#16a34a" textFill="#166534"
        w={W_S} h={H_SMALL} />

      {/* Left write (OVERWRITE path): arrow from left */}
      <ActionNode {...ns} id="bs_write_overwrite" cx={BS_LX} cy={Y_WRITE}
        label={L.bs_write} fill="#dcfce7" stroke="#16a34a" textFill="#166534"
        w={W_S} h={H_SMALL} />

      {/* Right write (RENAME path) */}
      <ActionNode {...ns} id="bs_write_rename" cx={BS_RX} cy={Y_WRITE}
        label={L.bs_write} fill="#dcfce7" stroke="#16a34a" textFill="#166534"
        w={W_S} h={H_SMALL} />

      {/* All three write nodes → end */}
      <path d={`M ${BS_LX},${Y_WRITE + H_SMALL / 2} C ${BS_LX},${Y_WRITE + 50} ${BS_CX - W_PILL / 2 - 20},${Y_END - 10} ${BS_CX - W_PILL / 2 - 6},${Y_END}`}
        stroke="#16a34a" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-green)" strokeDasharray="5 3" />
      <path d={`M ${BS_CX},${Y_WRITE + H_SMALL / 2} L ${BS_CX},${Y_END - H_PILL / 2 - 6}`}
        stroke="#16a34a" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-green)" />
      <path d={`M ${BS_RX},${Y_WRITE + H_SMALL / 2} C ${BS_RX},${Y_WRITE + 50} ${BS_CX + W_PILL / 2 + 20},${Y_END - 10} ${BS_CX + W_PILL / 2 + 6},${Y_END}`}
        stroke="#16a34a" strokeWidth={1.5} fill="none" markerEnd="url(#bs-arrow-green)" strokeDasharray="5 3" />

      {/* ── END ── */}
      <PillNode {...ns} id="bs_end" cx={BS_CX} cy={Y_END} label={L.bs_end} />
    </svg>
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
  memory_label: string;
  memory_items: string[];
  section_agents: string;
  agents: AgentEntry[];
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
      { icon: "✦", text: "Persistent memory via scratchpad + memory.md, survives context resets" },
      { icon: "⬡", text: "Lifecycle tools enforce consistency at mission start — project_state() and check_artifacts() run before any planning" },
      { icon: "◉", text: "Tone shaped by human-tone directives — direct, opinionated, concise. Disable with %%code%% in your config for raw behavior.", code: "soul: false" },
    ],
    section_memory: "Memory Management",
    scratchpad_label: "Scratchpad",
    scratchpad_items: [
      "Current mission state",
      "Overwritten at each new mission",
      "Survives context compaction",
      "Read and written at 5 key moments in the workflow",
    ],
    memory_label: "Memory",
    memory_items: [
      "Cross-session project knowledge",
      "Injected into every LLM call automatically",
      "Append-only — never overwritten",
      "Build commands, conventions, architecture decisions",
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
        name: "explore",
        badge: "READ-ONLY",
        badgeColor: "#0369a1",
        badgeBg: "#e0f2fe",
        desc: "Search, glob, grep, file reads. No write or command access. Use for reconnaissance and codebase mapping.",
      },
      {
        name: "general",
        badge: "FULL ACCESS",
        badgeColor: "#166534",
        badgeBg: "#dcfce7",
        desc: "Read, edit, write, bash. All permissions. Use for any implementation, refactoring, or system command.",
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
          "read: allow (.opencode/scratchpad.md, .opencode/memory.md)",
          "edit: allow (.opencode/scratchpad.md, .opencode/memory.md)",
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
      "Memory file path: .opencode/memory.md (project root, not configurable)",
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
      { icon: "✦", text: "Mémoire persistante via scratchpad + memory.md, survit aux resets de contexte" },
      { icon: "⬡", text: "Les outils lifecycle assurent la cohérence au démarrage — project_state() et check_artifacts() s'exécutent avant toute planification" },
      { icon: "◉", text: "Ton façonné par les directives human-tone — direct, tranché, concis. Désactivable via %%code%% dans la config.", code: "soul: false" },
    ],
    section_memory: "Gestion de la mémoire",
    scratchpad_label: "Scratchpad",
    scratchpad_items: [
      "État de la mission courante",
      "Écrasé à chaque nouvelle mission",
      "Survit à la compaction de contexte",
      "Lu et écrit à 5 moments clés du workflow",
    ],
    memory_label: "Memory",
    memory_items: [
      "Connaissances projet inter-sessions",
      "Injecté dans chaque appel LLM automatiquement",
      "Append-only — jamais écrasé",
      "Commandes build, conventions, décisions archi",
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
        name: "explore",
        badge: "READ-ONLY",
        badgeColor: "#0369a1",
        badgeBg: "#e0f2fe",
        desc: "Recherche, glob, grep, lecture de fichiers. Aucun droit d'écriture ni de commande. Usage : reconnaissance et cartographie du codebase.",
      },
      {
        name: "general",
        badge: "FULL ACCESS",
        badgeColor: "#166534",
        badgeBg: "#dcfce7",
        desc: "Lecture, édition, écriture, bash. Toutes les permissions. Usage : toute implémentation, refactoring, ou commande système.",
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
          "read: allow (.opencode/scratchpad.md, .opencode/memory.md)",
          "edit: allow (.opencode/scratchpad.md, .opencode/memory.md)",
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
      "Chemin du fichier mémoire : .opencode/memory.md (racine du projet, non configurable)",
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

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

            <div style={{
              background: "white", border: "1px solid #bbf7d0",
              borderRadius: 10, padding: "20px 22px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>🧠</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>{t.memory_label}</div>
                  <code style={{ fontSize: 11, color: "#64748b", fontFamily: "ui-monospace, monospace" }}>memory.md</code>
                </div>
              </div>
              {t.memory_items.map((text, i) => <MemItem key={i} text={text} color="#166534" />)}
            </div>

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
  const [selected, setSelected] = useState<string>("understand");
  const [zoom, setZoom] = useState<number>(1.0);
  const [flowchartTab, setFlowchartTab] = useState<"orion" | "brainstorm">("orion");
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

  const handleTabChange = (tab: "orion" | "brainstorm") => {
    setFlowchartTab(tab);
    setSelected(tab === "orion" ? "understand" : "bs_start");
    setZoom(1.0);
    const container = containerRef.current;
    if (container) container.scrollTo({ top: 0, behavior: "smooth" });
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
            <div style={{ width: 1, height: 16, background: "#e2e8f0" }} />
            {/* Flowchart tab switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#f1f5f9", borderRadius: 8, padding: "3px" }}>
              {([
                { key: "orion" as const, label: t.tab_orion, activeColor: "#4f46e5", activeBg: "white" },
                { key: "brainstorm" as const, label: t.tab_brainstorm, activeColor: "#6d28d9", activeBg: "white" },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  style={{
                    background: flowchartTab === tab.key ? tab.activeBg : "none",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: flowchartTab === tab.key ? 700 : 500,
                    color: flowchartTab === tab.key ? tab.activeColor : "#64748b",
                    padding: "4px 12px",
                    fontFamily: "system-ui, sans-serif",
                    boxShadow: flowchartTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
              width: "45%", minWidth: 320, background: "#f8f9fa",
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
            <div style={{ transformOrigin: "top center", transform: `scale(${zoom})`, width: "fit-content" }}>
              {flowchartTab === "orion"
                ? <FlowChart selected={selected} onSelect={handleSelect} lang={lang} />
                : <BrainstormFlowChart selected={selected} onSelect={handleSelect} lang={lang} />
              }
            </div>
          </div>

          {/* RIGHT — detail panel */}
          <div style={{ flex: 1, background: "white", overflowY: "auto" }}>
            <DetailPanel nodeId={selected} lang={lang} />
          </div>

        </div>
      </div>
    </>
  );
}
