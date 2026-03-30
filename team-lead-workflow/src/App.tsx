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

const DETAILS: Record<string, DetailData> = {
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
};

// Y positions map for scroll-to (populated in FlowChart, read in App)
const NODE_Y_MAP: Record<string, number> = {};

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

function FlowChart({ selected, onSelect }: { selected: string; onSelect: (id: string, nodeY: number) => void }) {
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
      <PillNode {...ns} id="start" cx={CX} cy={Y.start} label="Requête utilisateur" />

      <path d={`M ${CX},${Y.start + H_PILL / 2} L ${CX},${Y.understand - H_PHASE / 2 - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── UNDERSTAND ── */}
      <PhaseNode {...ns} id="understand" cx={CX} cy={Y.understand} label="1. Understand" fill="#2563eb" />

      {/* ── MEMORY FILE NODES ── */}
      <MemFileNode {...ns} id="scratchpad" cx={MEM_LX} cy={Y.mem_files}
        label="📄 scratchpad.md" sub="Plan courant · Contexte"
        bgColor="#f0f9ff" borderColor="#0ea5e9" textColor="#0369a1" />

      <MemFileNode {...ns} id="memory" cx={MEM_RX} cy={Y.mem_files}
        label="📄 memory.md" sub="Apprentissages persistants"
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
        fontFamily="system-ui, sans-serif">lu ici</text>

      {/* Bidirectional: memory.md ↔ understand */}
      <path
        d={`M ${CX + W_PHASE / 2},${Y.understand} C ${CX + W_PHASE / 2 + 35},${Y.understand} ${MEM_RX - W_MEM / 2 - 15},${Y.mem_files - H_MEM / 2 - 8} ${MEM_RX - W_MEM / 2},${Y.mem_files - H_MEM / 2}`}
        stroke="#22c55e" strokeWidth={1.5} fill="none" strokeDasharray="5,4"
        markerEnd="url(#arrow-emerald)" markerStart="url(#arrow-emerald-rev)" />
      <text
        x={(CX + W_PHASE / 2 + MEM_RX - W_MEM / 2) / 2 + 10}
        y={Y.understand + 32}
        textAnchor="middle" fill="#22c55e" fontSize={10} fontStyle="italic"
        fontFamily="system-ui, sans-serif">lu ici</text>

      {/* understand → ambigu */}
      <path d={`M ${CX},${Y.understand + H_PHASE / 2} L ${CX},${Y.ambigu - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── AMBIGU ── */}
      <DiamondNode {...ns} id="ambigu" cx={CX} cy={Y.ambigu} label="Ambigu ?" stroke="#64748b" />

      <path d={`M ${CX - DHW},${Y.ambigu} L ${LX + W_SMALL / 2 + 6},${Y.ambigu}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
      <ArrowLabel x={CX - DHW - 6} y={Y.ambigu - 6} text="OUI" color="#f59e0b" align="end" />

      <ActionNode {...ns} id="question" cx={LX} cy={Y.question} label="Question util."
        sub="outil: question" fill="#fef9c3" stroke="#ca8a04" textFill="#854d0e"
        w={W_SMALL} h={H_SMALL + 6} />

      <path
        d={`M ${LX - W_SMALL / 2},${Y.question - 8} C ${30},${Y.question - 8} ${30},${Y.understand} ${CX - W_PHASE / 2 - 6},${Y.understand}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" strokeDasharray="5 3"
      />

      <path d={`M ${CX},${Y.ambigu + DHH} L ${CX},${Y.plan - H_PHASE / 2 - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
      <ArrowLabel x={CX + 6} y={(Y.ambigu + DHH + Y.plan - H_PHASE / 2) / 2 + 5} text="NON"
        color="#16a34a" align="start" />

      {/* ── PLAN ── */}
      <PhaseNode {...ns} id="plan" cx={CX} cy={Y.plan} label="2. Plan" fill="#4f46e5" />
      <Annot x={CX} y={Y.plan + H_PHASE / 2 + 13} text="✎ scratchpad" color="#0ea5e9" />

      <path d={`M ${CX},${Y.plan + H_PHASE / 2 + 17} L ${CX},${Y.delegate - H_PHASE / 2 - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── DELEGATE ── */}
      <PhaseNode {...ns} id="delegate" cx={CX} cy={Y.delegate} label="3. Delegate" fill="#7c3aed" />
      <Annot x={CX} y={Y.delegate + H_PHASE / 2 + 13} text="↳ MAJ scratchpad après chaque retour d'agent" color="#7c3aed" />

      <path d={`M ${CX},${Y.delegate + H_PHASE / 2 + 17} L ${CX},${Y.bug_decision - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── BUG DECISION ── */}
      <DiamondNode {...ns} id="bug_decision" cx={CX} cy={Y.bug_decision} label="Bug report ?" stroke="#be123c" />

      <path d={`M ${CX + DHW},${Y.bug_decision} L ${RX - W_SMALL / 2 - 6},${Y.bug_finder}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" />
      <ArrowLabel x={CX + DHW + 6} y={Y.bug_decision - 8} text="OUI" color="#dc2626" align="start" />

      {/* ── BUG FINDER ── */}
      <ActionNode {...ns} id="bug_finder" cx={RX} cy={Y.bug_finder} label="bug-finder"
        fill="#fef2f2" stroke="#ef4444" textFill="#991b1b" w={W_SMALL} h={H_SMALL} />

      <path d={`M ${RX},${Y.bug_finder + H_SMALL / 2} L ${RX},${Y.certitude - DHH - 6}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" />

      {/* ── CERTITUDE ── */}
      <DiamondNode {...ns} id="certitude" cx={RX} cy={Y.certitude} label="Certitude ?" stroke="#be123c" />

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
        label="Escalade utilisateur" sub="UNCERTAINTY_EXPOSED" w={W_SMALL + 10} />

      <path d={`M ${CX},${Y.bug_decision + DHH} L ${CX},${Y.agents - H_ACTION / 2 - 8}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
      <ArrowLabel x={CX + 6} y={(Y.bug_decision + DHH + Y.agents - H_ACTION / 2) / 2 + 5}
        text="NON" color="#16a34a" align="start" />

      {/* ── AGENTS ── */}
      <ActionNode {...ns} id="agents" cx={CX} cy={Y.agents} label="Agents"
        sub="explore / general / custom" fill="#ede9fe" stroke="#7c3aed" textFill="#4c1d95" />
      <Annot x={CX} y={Y.agents + H_ACTION / 2 + 13} text="✎ après retour d'agent" color="#0ea5e9" />

      <path d={`M ${CX},${Y.agents + H_ACTION / 2 + 17} L ${CX},${Y.agent_failure - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── AGENT FAILURE ── */}
      <DiamondNode {...ns} id="agent_failure" cx={CX} cy={Y.agent_failure} label="Échec agent ?" stroke="#64748b" />

      <path d={`M ${CX - DHW},${Y.agent_failure} L ${LX + W_SMALL / 2 + 6},${Y.retry}`}
        stroke="#f59e0b" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-amber)" />
      <ArrowLabel x={CX - DHW - 6} y={Y.agent_failure - 8} text="OUI" color="#f59e0b" align="end" />

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
        label="Escalade util." sub="2 retries dépassés" />

      <path d={`M ${CX},${Y.agent_failure + DHH} L ${CX},${Y.review - H_PHASE / 2 - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
      <ArrowLabel x={CX + 6} y={(Y.agent_failure + DHH + Y.review - H_PHASE / 2) / 2 + 5}
        text="NON" color="#16a34a" align="start" />

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
        label="Escalade util." sub="BLOCKED" />

      <path d={`M ${CX},${Y.verdict + DHH} L ${CX},${Y.synthesize - H_PHASE / 2 - 6}`}
        stroke="#16a34a" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-green)" />
      <ArrowLabel x={CX + 6} y={(Y.verdict + DHH + Y.synthesize - H_PHASE / 2) / 2 + 5}
        text="APPROVED" color="#16a34a" align="start" />

      {/* ── SYNTHESIZE ── */}
      <PhaseNode {...ns} id="synthesize" cx={CX} cy={Y.synthesize} label="5. Synthesize & Report" fill="#15803d" />
      <Annot x={CX} y={Y.synthesize + H_PHASE / 2 + 13} text="✎ scratchpad  ✎ memory.md" color="#0ea5e9" />
      <Annot x={CX} y={Y.synthesize + H_PHASE / 2 + 26} text="↳ Écrire memory.md si nouveaux apprentissages" color="#16a34a" />

      <path d={`M ${CX},${Y.synthesize + H_PHASE / 2 + 30} L ${CX},${Y.autoeval - DHH - 6}`}
        stroke="#94a3b8" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />

      {/* ── AUTOEVAL ── */}
      <DiamondNode {...ns} id="autoeval" cx={CX} cy={Y.autoeval} label="Auto-éval OK ?" stroke="#15803d" />

      <path d={`M ${CX - DHW},${Y.autoeval} L ${LX + W_SMALL / 2 + 6},${Y.gap_majeur}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" />
      <ArrowLabel x={CX - DHW - 6} y={Y.autoeval - 8} text="Gap majeur" color="#dc2626" align="end" />

      <ActionNode {...ns} id="gap_majeur" cx={LX} cy={Y.gap_majeur}
        label="↩ Delegate" fill="#dcfce7" stroke="#16a34a" textFill="#166534"
        w={W_SMALL} h={H_SMALL} />

      <path
        d={`M ${LX - W_SMALL / 2},${Y.gap_majeur - 8} C ${28},${Y.gap_majeur - 8} ${28},${Y.delegate} ${CX - W_PHASE / 2 - 6},${Y.delegate}`}
        stroke="#dc2626" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-red)" strokeDasharray="5 3"
      />

      <path d={`M ${CX + DHW},${Y.autoeval} L ${RX - W_SMALL / 2 - 6},${Y.fix_rapide}`}
        stroke="#f59e0b" strokeWidth={1.5} fill="none" markerEnd="url(#arrow-amber)" />
      <ArrowLabel x={CX + DHW + 6} y={Y.autoeval - 8} text="Gap mineur" color="#f59e0b" align="start" />

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
      <PillNode {...ns} id="end" cx={CX} cy={Y.end} label="Rapport à l'utilisateur" />
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

function FlowBullet({ icon, color, text, nodeColor }: { icon: string; color: string; text: string; nodeColor: string }) {
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
  if (item.startsWith("OUI")) return <FlowBullet icon="→" color="#22c55e" text={item.slice(3)} nodeColor={nodeColor} />;
  if (item.startsWith("NON")) return <FlowBullet icon="→" color="#6b7280" text={item.slice(3)} nodeColor={nodeColor} />;
  if (item.startsWith("OK →")) return <FlowBullet icon="→" color="#16a34a" text={item.slice(2)} nodeColor={nodeColor} />;
  return <NormalBullet item={item} nodeColor={nodeColor} />;
}

function DetailPanel({ nodeId }: { nodeId: string }) {
  const detail = DETAILS[nodeId];
  if (!detail) return (
    <div style={{ padding: 40, color: "#94a3b8", fontSize: 15, fontStyle: "italic" }}>
      Cliquer sur un nœud pour voir ses détails.
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

// ─── Intro Screen ─────────────────────────────────────────────────────────────

const AGENTS_DATA = [
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
];

const USE_CASES = [
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
];

function IntroScreen({ onEnter }: { onEnter: () => void }) {
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

        <div style={{ position: "relative", maxWidth: 860, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            background: "rgba(99,102,241,0.2)", color: "#a5b4fc",
            border: "1px solid rgba(99,102,241,0.35)",
            borderRadius: 4, padding: "3px 10px",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", marginBottom: 20,
          }}>
            OpenCode Plugin
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
            Orchestrateur pur. Planifie le travail, délègue tout à des sous-agents spécialisés, review les résultats, synthétise et reporte.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
            {[
              { label: "Temperature", value: "0.3" },
              { label: "Variant", value: "max" },
              { label: "Accès code direct", value: "jamais" },
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
            Voir le workflow
            <span style={{ fontSize: 16 }}>→</span>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 48px 60px" }}>

        {/* 1. Concept */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>Concept & philosophie</SectionTitle>
          <div style={{
            background: "white", border: "1px solid #e2e8f0",
            borderRadius: 10, padding: "24px 28px",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
          }}>
            {[
              { icon: "⊘", text: "Ne touche jamais au code directement — toute action technique est déléguée" },
              { icon: "◈", text: "Planifie, délègue, review, synthétise — dans cet ordre, toujours" },
              { icon: "⟳", text: "Délibéré et méthodique — temperature 0.3, variant max" },
              { icon: "✦", text: "Mémoire persistante via scratchpad + memory.md, survit aux resets de contexte" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, color: "#6366f1", flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Memory */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>Gestion de la mémoire</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            <div style={{
              background: "white", border: "1px solid #bae6fd",
              borderRadius: 10, padding: "20px 22px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>📄</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0369a1" }}>Scratchpad</div>
                  <code style={{ fontSize: 11, color: "#64748b", fontFamily: "ui-monospace, monospace" }}>scratchpad.md</code>
                </div>
              </div>
              {[
                "État de la mission courante",
                "Écrasé à chaque nouvelle mission",
                "Survit à la compaction de contexte",
                "Lu et écrit à 5 moments clés du workflow",
              ].map((t, i) => <MemItem key={i} text={t} color="#0369a1" />)}
            </div>

            <div style={{
              background: "white", border: "1px solid #bbf7d0",
              borderRadius: 10, padding: "20px 22px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>🧠</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>Memory</div>
                  <code style={{ fontSize: 11, color: "#64748b", fontFamily: "ui-monospace, monospace" }}>memory.md</code>
                </div>
              </div>
              {[
                "Connaissances projet inter-sessions",
                "Injecté dans chaque appel LLM automatiquement",
                "Append-only — jamais écrasé",
                "Commandes build, conventions, décisions archi",
              ].map((t, i) => <MemItem key={i} text={t} color="#166534" />)}
            </div>

          </div>
        </section>

        {/* 3. Agents */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>Les agents disponibles</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {AGENTS_DATA.map(agent => (
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
          <SectionTitle>Cas d'usage typiques</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {USE_CASES.map(uc => (
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
        <div style={{ textAlign: "center", paddingTop: 8 }}>
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
            Voir le workflow complet
            <span style={{ fontSize: 16 }}>→</span>
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

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<"intro" | "flowchart">("intro");
  const [selected, setSelected] = useState<string>("understand");
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

  if (view === "intro") {
    return (
      <>
        <style>{STYLE_TAG}</style>
        <IntroScreen onEnter={() => setView("flowchart")} />
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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
              ← Retour
            </button>
            <div style={{ width: 1, height: 16, background: "#e2e8f0" }} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>team-lead — Workflow</span>
              <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 12 }}>Orchestrateur pur · délègue tout · ne touche jamais au code</span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic" }}>Cliquer sur un nœud →</span>
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
              <FlowChart selected={selected} onSelect={handleSelect} />
            </div>
          </div>

          {/* RIGHT — detail panel */}
          <div style={{ flex: 1, background: "white", overflowY: "auto" }}>
            <DetailPanel nodeId={selected} />
          </div>

        </div>
      </div>
    </>
  );
}
