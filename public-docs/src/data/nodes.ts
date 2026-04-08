import type { Node } from '@xyflow/react'

export type NodeData = {
  label: string
  labelFr: string
  phase: 'terminal' | 'brainstorm' | 'plan' | 'delegate' | 'review' | 'synthesize' | 'maintenance' | 'escalation'
  nodeType?: 'phase' | 'decision' | 'terminal' | 'escalation' | 'memory'
}

// Typed node variants for NodeProps usage
export type PhaseNodeType     = Node<NodeData, 'phaseNode'>
export type DecisionNodeType  = Node<NodeData, 'decisionNode'>
export type TerminalNodeType  = Node<NodeData, 'terminalNode'>
export type EscalationNodeType = Node<NodeData, 'escalationNode'>
export type MemoryNodeType    = Node<NodeData, 'memoryNode'>
export type AppNode = PhaseNodeType | DecisionNodeType | TerminalNodeType | EscalationNodeType | MemoryNodeType

const PHASE_COLORS: Record<NodeData['phase'], string> = {
  terminal: '#166534',
  brainstorm: '#7c3aed',
  plan: '#1d4ed8',
  delegate: '#15803d',
  review: '#b45309',
  synthesize: '#4338ca',
  maintenance: '#475569',
  escalation: '#dc2626',
}

export function getPhaseColor(phase: NodeData['phase']): string {
  return PHASE_COLORS[phase]
}

export const initialNodes: AppNode[] = [
  // ─── Terminaux ───────────────────────────────────────────────
  {
    id: 'phase_start',
    type: 'terminalNode',
    position: { x: 400, y: 0 },
    data: { label: 'User request', labelFr: 'Demande utilisateur', phase: 'terminal', nodeType: 'terminal' },
  },
  {
    id: 'phase_end',
    type: 'terminalNode',
    position: { x: 400, y: 4440 },
    data: { label: 'Report to user', labelFr: 'Reporter à l\'utilisateur', phase: 'terminal', nodeType: 'terminal' },
  },

  // ─── Phase 0 — Brainstorm ────────────────────────────────────
  {
    id: 'phase0_glob',
    type: 'phaseNode',
    position: { x: 400, y: 120 },
    data: { label: 'Scan docs/briefs/', labelFr: 'Scanner docs/briefs/', phase: 'brainstorm' },
  },
  {
    id: 'phase0_count',
    type: 'decisionNode',
    position: { x: 400, y: 260 },
    data: { label: 'Brief(s) found?', labelFr: 'Brief(s) trouvé(s) ?', phase: 'brainstorm', nodeType: 'decision' },
  },
  {
    id: 'phase0_none',
    type: 'phaseNode',
    position: { x: 0, y: 420 },
    data: { label: 'No brief → Phase 1', labelFr: 'Pas de brief → Phase 1', phase: 'brainstorm' },
  },
  {
    id: 'phase0_one',
    type: 'decisionNode',
    position: { x: 400, y: 420 },
    data: { label: 'One brief', labelFr: 'Un brief', phase: 'brainstorm', nodeType: 'decision' },
  },
  {
    id: 'phase0_many',
    type: 'phaseNode',
    position: { x: 800, y: 420 },
    data: { label: 'Multiple → list + choose', labelFr: 'Plusieurs → lister + choisir', phase: 'brainstorm' },
  },
  {
    id: 'phase0_draft_ask',
    type: 'phaseNode',
    position: { x: 300, y: 600 },
    data: { label: 'Continue or fresh start?', labelFr: 'Continuer ou repartir de zéro ?', phase: 'brainstorm' },
  },
  {
    id: 'phase0_done_ask',
    type: 'phaseNode',
    position: { x: 700, y: 600 },
    data: { label: 'Revise or new project?', labelFr: 'Réviser ou nouveau projet ?', phase: 'brainstorm' },
  },
  {
    id: 'phase0_step1',
    type: 'phaseNode',
    position: { x: 150, y: 760 },
    data: { label: 'Step 1 — Discovery', labelFr: 'Étape 1 — Découverte', phase: 'brainstorm' },
  },
  {
    id: 'phase0_load',
    type: 'phaseNode',
    position: { x: 600, y: 760 },
    data: { label: 'Load brief → Step 3', labelFr: 'Charger le brief → Étape 3', phase: 'brainstorm' },
  },
  {
    id: 'phase0_run_brainstorm',
    type: 'phaseNode',
    position: { x: 400, y: 920 },
    data: { label: 'Run brainstorm agent', labelFr: 'Lancer l\'agent brainstorm', phase: 'brainstorm' },
  },
  {
    id: 'phase0_produce_brief',
    type: 'phaseNode',
    position: { x: 400, y: 1060 },
    data: { label: 'Brief written → suggest Planning or Orion', labelFr: 'Brief rédigé → suggérer Planning ou Orion', phase: 'brainstorm' },
  },

  // ─── Phase 1 — Plan ──────────────────────────────────────────
  {
    id: 'phase1_read_sp',
    type: 'phaseNode',
    position: { x: 400, y: 1220 },
    data: { label: 'Read scratchpad', labelFr: 'Lire le scratchpad', phase: 'plan' },
  },
  {
    id: 'phase1_project_state',
    type: 'phaseNode',
    position: { x: 400, y: 1360 },
    data: { label: 'project_state() + check_artifacts()', labelFr: 'project_state() + check_artifacts()', phase: 'plan' },
  },
  {
    id: 'phase1_clarify',
    type: 'phaseNode',
    position: { x: 400, y: 1480 },
    data: { label: 'Clarify intent', labelFr: 'Clarifier l\'intention', phase: 'plan' },
  },
  {
    id: 'phase1_todowrite',
    type: 'phaseNode',
    position: { x: 400, y: 1600 },
    data: { label: 'todowrite()', labelFr: 'todowrite()', phase: 'plan' },
  },
  {
    id: 'phase1_compress',
    type: 'memoryNode',
    position: { x: 400, y: 1720 },
    data: { label: 'Write scratchpad + compress', labelFr: 'Écrire scratchpad + compresser', phase: 'plan', nodeType: 'memory' },
  },

  // ─── Phase 2 — Delegate ──────────────────────────────────────
  {
    id: 'phase2_bug',
    type: 'decisionNode',
    position: { x: 400, y: 1880 },
    data: { label: 'Bug report?', labelFr: 'Rapport de bug ?', phase: 'delegate', nodeType: 'decision' },
  },
  {
    id: 'phase2_bug_finder',
    type: 'phaseNode',
    position: { x: 100, y: 2020 },
    data: { label: '→ bug-finder first', labelFr: '→ bug-finder d\'abord', phase: 'delegate' },
  },
  {
    id: 'phase2_select_agent',
    type: 'phaseNode',
    position: { x: 400, y: 2020 },
    data: { label: 'Select agent', labelFr: 'Sélectionner l\'agent', phase: 'delegate' },
  },
  {
    id: 'phase2_handoff',
    type: 'phaseNode',
    position: { x: 400, y: 2160 },
    data: { label: 'Delegate via task()', labelFr: 'Déléguer via task()', phase: 'delegate' },
  },
  {
    id: 'phase2_success',
    type: 'decisionNode',
    position: { x: 400, y: 2300 },
    data: { label: 'Success?', labelFr: 'Succès ?', phase: 'delegate', nodeType: 'decision' },
  },
  {
    id: 'phase2_retry',
    type: 'phaseNode',
    position: { x: 700, y: 2440 },
    data: { label: 'Retry (reformulate)', labelFr: 'Réessayer (reformuler)', phase: 'delegate' },
  },
  {
    id: 'phase2_esc_user',
    type: 'escalationNode',
    position: { x: 700, y: 2580 },
    data: { label: 'Escalate to user', labelFr: 'Escalader à l\'utilisateur', phase: 'escalation', nodeType: 'escalation' },
  },

  // ─── Phase 3 — Review ────────────────────────────────────────
  {
    id: 'phase3_delegate_rm',
    type: 'phaseNode',
    position: { x: 400, y: 2720 },
    data: { label: '→ review-manager', labelFr: '→ review-manager', phase: 'review' },
  },
  {
    id: 'phase3_verdict',
    type: 'decisionNode',
    position: { x: 400, y: 2860 },
    data: { label: 'Verdict?', labelFr: 'Verdict ?', phase: 'review', nodeType: 'decision' },
  },
  {
    id: 'phase3_resume_fix',
    type: 'phaseNode',
    position: { x: 700, y: 3000 },
    data: { label: 'Re-delegate fixes', labelFr: 'Re-déléguer les corrections', phase: 'review' },
  },
  {
    id: 'phase3_blocked_esc',
    type: 'escalationNode',
    position: { x: 100, y: 3000 },
    data: { label: 'Escalate — BLOCKED', labelFr: 'Escalader — BLOQUÉ', phase: 'escalation', nodeType: 'escalation' },
  },

  // ─── Phase 4 — Synthesize ────────────────────────────────────
  {
    id: 'phase4_self_eval',
    type: 'phaseNode',
    position: { x: 400, y: 3140 },
    data: { label: 'Self-evaluation', labelFr: 'Auto-évaluation', phase: 'synthesize' },
  },
  {
    id: 'phase4_gap',
    type: 'decisionNode',
    position: { x: 400, y: 3280 },
    data: { label: 'Gap?', labelFr: 'Écart ?', phase: 'synthesize', nodeType: 'decision' },
  },
  {
    id: 'phase4_minor',
    type: 'phaseNode',
    position: { x: 700, y: 3420 },
    data: { label: 'Fix minor gap', labelFr: 'Corriger l\'écart mineur', phase: 'synthesize' },
  },
  {
    id: 'phase4_scope',
    type: 'phaseNode',
    position: { x: 1000, y: 3420 },
    data: { label: 'Scope confusion → ask user', labelFr: 'Confusion de portée → demander', phase: 'synthesize' },
  },
  {
    id: 'phase4_sp_capture',
    type: 'memoryNode',
    position: { x: 400, y: 3560 },
    data: { label: 'Final scratchpad capture', labelFr: 'Capture finale du scratchpad', phase: 'synthesize', nodeType: 'memory' },
  },
  {
    id: 'phase4_report',
    type: 'phaseNode',
    position: { x: 400, y: 3700 },
    data: { label: 'Report to user', labelFr: 'Reporter à l\'utilisateur', phase: 'synthesize' },
  },

  // ─── Phase 5 — Maintenance ───────────────────────────────────
  {
    id: 'phase5_pattern',
    type: 'decisionNode',
    position: { x: 400, y: 3880 },
    data: { label: 'Recurring pattern?', labelFr: 'Pattern récurrent ?', phase: 'maintenance', nodeType: 'decision' },
  },
  {
    id: 'phase5_harness',
    type: 'phaseNode',
    position: { x: 100, y: 4020 },
    data: { label: 'Suggest harness', labelFr: 'Proposer harness', phase: 'maintenance' },
  },
  {
    id: 'phase5_gardener',
    type: 'phaseNode',
    position: { x: 700, y: 4020 },
    data: { label: '→ gardener', labelFr: '→ gardener', phase: 'maintenance' },
  },
  {
    id: 'phase5_recurring',
    type: 'decisionNode',
    position: { x: 700, y: 4160 },
    data: { label: 'Pattern recurs?', labelFr: 'Pattern récurrent ?', phase: 'maintenance', nodeType: 'decision' },
  },
  {
    id: 'phase5_esc_harness',
    type: 'phaseNode',
    position: { x: 1000, y: 4300 },
    data: { label: 'Escalate → harness', labelFr: 'Escalader → harness', phase: 'maintenance' },
  },
]
