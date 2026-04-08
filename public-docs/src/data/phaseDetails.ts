import type { Node, Edge } from '@xyflow/react'

export interface PhaseDetailData {
  phaseId: string
  color: string
  nodes: Node[]
  edges: Edge[]
}

function makeStep(
  id: string,
  label: string,
  sub?: string,
  nodeType: 'step' | 'escalation' = 'step',
  color: string = '#fff',
): Node {
  return {
    id,
    type: 'phaseStep',
    position: { x: 0, y: 0 },
    data: { label, sub, nodeType, color },
  }
}

function makeDecision(id: string, label: string, color: string): Node {
  return {
    id,
    type: 'phaseDecision',
    position: { x: 0, y: 0 },
    data: { label, color },
  }
}

function edge(
  source: string,
  target: string,
  label?: string,
  dashed = false,
  sourceHandle?: string,
): Edge {
  return {
    id: `e-${source}-${target}${label ? '-' + label.replace(/\s+/g, '_') : ''}`,
    source,
    target,
    ...(sourceHandle ? { sourceHandle } : {}),
    ...(label ? { label } : {}),
    style: dashed ? { strokeDasharray: '5 3' } : undefined,
  }
}

// ─── Phase 0 — Brainstorm ────────────────────────────────────────────────────
const COLOR_0 = '#7c3aed'

const phase0Nodes: Node[] = [
  makeStep('D0_START', 'Session start', undefined, 'step', COLOR_0),
  makeStep('D0_GLOB', 'Scan docs/briefs/', 'Always — mandatory', 'step', COLOR_0),
  makeDecision('D0_COUNT', 'Brief(s) found?', COLOR_0),
  makeStep('D0_NONE', 'No brief', '→ skip to Phase 1', 'step', COLOR_0),
  makeDecision('D0_ONE', 'Brief status?', COLOR_0),
  makeStep('D0_MANY', 'Multiple found', 'List + let user choose', 'step', COLOR_0),
  makeStep('D0_DRAFT', 'Continue or fresh start?', undefined, 'step', COLOR_0),
  makeStep('D0_DONE', 'Revise or new project?', undefined, 'step', COLOR_0),
  makeStep('D0_LOAD', 'Load brief → Step 3', undefined, 'step', COLOR_0),
  makeStep('D0_STEP1', 'Step 1 — Discovery', undefined, 'step', COLOR_0),
  makeStep('D0_RUN', 'Run brainstorm agent', 'Delegates to brainstorm sub-agent', 'step', COLOR_0),
  makeStep('D0_BRIEF', 'Brief written', '→ suggest Planning or Orion', 'step', COLOR_0),
  makeStep('D0_END', '→ Phase 1', undefined, 'step', COLOR_0),
]

const phase0Edges: Edge[] = [
  edge('D0_START', 'D0_GLOB'),
  edge('D0_GLOB', 'D0_COUNT'),
  edge('D0_COUNT', 'D0_NONE', 'NONE'),
  edge('D0_COUNT', 'D0_ONE', 'ONE'),
  edge('D0_COUNT', 'D0_MANY', 'MULTIPLE'),
  edge('D0_ONE', 'D0_DRAFT', 'draft'),
  edge('D0_ONE', 'D0_DONE', 'done/other'),
  edge('D0_MANY', 'D0_DRAFT'),
  edge('D0_DRAFT', 'D0_LOAD', 'Continue'),
  edge('D0_DRAFT', 'D0_STEP1', 'Fresh start'),
  edge('D0_DONE', 'D0_LOAD', 'Revise'),
  edge('D0_DONE', 'D0_STEP1', 'New project'),
  edge('D0_NONE', 'D0_END', 'skip brainstorm', true),
  edge('D0_STEP1', 'D0_RUN'),
  edge('D0_LOAD', 'D0_RUN'),
  edge('D0_RUN', 'D0_BRIEF'),
  edge('D0_BRIEF', 'D0_END'),
]

// ─── Phase 1 — Plan ──────────────────────────────────────────────────────────
const COLOR_1 = '#1d4ed8'

const phase1Nodes: Node[] = [
  makeStep('D1_READ', 'Read scratchpad', '.opencode/scratchpad.md', 'step', COLOR_1),
  makeStep('D1_STATE', 'project_state()', '+ check_artifacts() — mandatory lifecycle tools', 'step', COLOR_1),
  makeDecision('D1_AMBI', 'Ambiguous request?', COLOR_1),
  makeStep('D1_ASK', 'Ask user', 'tool: question', 'step', COLOR_1),
  makeStep('D1_TODO', 'todowrite()', 'Visible task list for the session', 'step', COLOR_1),
  makeDecision('D1_PLAN', 'Multi-session task?', COLOR_1),
  makeStep('D1_EXEC', '→ planning agent', 'Produces exec-plan in docs/exec-plans/', 'step', COLOR_1),
  makeStep('D1_SP', 'Write scratchpad', 'Objective + tasks + context for resume', 'step', COLOR_1),
  makeStep('D1_COMPRESS', 'compress()', 'Clean context window before delegating', 'step', COLOR_1),
  makeStep('D1_END', '→ Phase 2', undefined, 'step', COLOR_1),
]

const phase1Edges: Edge[] = [
  edge('D1_READ', 'D1_STATE'),
  edge('D1_STATE', 'D1_AMBI'),
  edge('D1_AMBI', 'D1_ASK', 'YES'),
  edge('D1_AMBI', 'D1_TODO', 'NO'),
  edge('D1_ASK', 'D1_TODO'),
  edge('D1_TODO', 'D1_PLAN'),
  edge('D1_PLAN', 'D1_EXEC', 'YES'),
  edge('D1_PLAN', 'D1_SP', 'NO'),
  edge('D1_EXEC', 'D1_SP'),
  edge('D1_SP', 'D1_COMPRESS'),
  edge('D1_COMPRESS', 'D1_END'),
]

// ─── Phase 2 — Delegate ──────────────────────────────────────────────────────
const COLOR_2 = '#15803d'

const phase2Nodes: Node[] = [
  makeStep('D2_START', 'From Phase 1', undefined, 'step', COLOR_2),
  makeDecision('D2_BUG', 'Bug report?', COLOR_2),
  makeStep('D2_FINDER', '→ bug-finder first', 'Forces root-cause analysis before any fix', 'step', COLOR_2),
  makeStep('D2_SELECT', 'Select agent', 'Registered agents > invented personas > general', 'step', COLOR_2),
  makeStep('D2_HANDOFF', 'Delegate via task()', 'Self-contained prompt — full context, expected output', 'step', COLOR_2),
  makeStep('D2_WAIT', 'Agent runs...', undefined, 'step', COLOR_2),
  makeDecision('D2_SUCCESS', 'Agent succeeded?', COLOR_2),
  makeDecision('D2_DIAG', 'Failure type?', COLOR_2),
  makeStep('D2_REFORM', 'Reformulate prompt', 'Change something — never retry identically', 'step', COLOR_2),
  makeStep('D2_DECOMP', 'Decompose task', 'Split into smaller independent sub-tasks', 'step', COLOR_2),
  makeStep('D2_ESC', 'Escalate to user', 'After 2 failed attempts', 'escalation', COLOR_2),
  makeStep('D2_SP', 'Update scratchpad', 'Add agent result summary', 'step', COLOR_2),
  makeStep('D2_END', '→ Phase 3 (review)', undefined, 'step', COLOR_2),
]

const phase2Edges: Edge[] = [
  edge('D2_START', 'D2_BUG'),
  edge('D2_BUG', 'D2_FINDER', 'YES'),
  edge('D2_BUG', 'D2_SELECT', 'NO'),
  edge('D2_FINDER', 'D2_SELECT'),
  edge('D2_SELECT', 'D2_HANDOFF'),
  edge('D2_HANDOFF', 'D2_WAIT'),
  edge('D2_WAIT', 'D2_SUCCESS'),
  edge('D2_SUCCESS', 'D2_SP', 'YES'),
  edge('D2_SUCCESS', 'D2_DIAG', 'NO'),
  edge('D2_DIAG', 'D2_REFORM', 'unclear prompt'),
  edge('D2_DIAG', 'D2_DECOMP', 'too large'),
  edge('D2_REFORM', 'D2_HANDOFF', 'retry ≤2', true),
  edge('D2_DECOMP', 'D2_HANDOFF', 'retry ≤2', true),
  edge('D2_REFORM', 'D2_ESC', 'after 2 fails'),
  edge('D2_SP', 'D2_END'),
]

// ─── Phase 3 — Review ────────────────────────────────────────────────────────
const COLOR_3 = '#b45309'

const phase3Nodes: Node[] = [
  makeStep('D3_START', 'From Phase 2', undefined, 'step', COLOR_3),
  makeStep('D3_RM', '→ review-manager', 'Never spawn reviewers directly', 'step', COLOR_3),
  makeStep('D3_PARALLEL', 'Reviewers run in parallel', 'code-reviewer · security-reviewer · requirements-reviewer', 'step', COLOR_3),
  makeDecision('D3_VERDICT', 'Verdict?', COLOR_3),
  makeStep('D3_APPROVE', 'APPROVED', '→ Phase 4', 'step', COLOR_3),
  makeStep('D3_CHANGES', 'Re-delegate fixes', 'Resume producer with feedback', 'step', COLOR_3),
  makeDecision('D3_COUNT', 'Round ≤ 2?', COLOR_3),
  makeStep('D3_BLOCKED', 'BLOCKED', 'Stop. Report to user. No fix without input.', 'escalation', COLOR_3),
  makeStep('D3_END', '→ Phase 4', undefined, 'step', COLOR_3),
]

const phase3Edges: Edge[] = [
  edge('D3_START', 'D3_RM'),
  edge('D3_RM', 'D3_PARALLEL'),
  edge('D3_PARALLEL', 'D3_VERDICT'),
  edge('D3_VERDICT', 'D3_APPROVE', 'APPROVED'),
  edge('D3_VERDICT', 'D3_CHANGES', 'CHANGES_REQUESTED'),
  edge('D3_VERDICT', 'D3_BLOCKED', 'BLOCKED'),
  edge('D3_CHANGES', 'D3_COUNT'),
  edge('D3_COUNT', 'D3_RM', 'YES', true),
  edge('D3_COUNT', 'D3_BLOCKED', 'NO — max rounds exceeded'),
  edge('D3_APPROVE', 'D3_END'),
]

// ─── Phase 4 — Synthesize ────────────────────────────────────────────────────
const COLOR_4 = '#4338ca'

const phase4Nodes: Node[] = [
  makeStep('D4_START', 'From Phase 3 — APPROVED', undefined, 'step', COLOR_4),
  makeStep('D4_EVAL', 'Self-evaluation', 'Does result fully answer the original request?', 'step', COLOR_4),
  makeDecision('D4_Q1', 'Fully answers request?', COLOR_4),
  makeDecision('D4_Q2', 'Outputs coherent?', COLOR_4),
  makeDecision('D4_Q3', 'Gap type?', COLOR_4),
  makeStep('D4_MINOR', 'Fix minor gap', 'Quick follow-up delegation', 'step', COLOR_4),
  makeStep('D4_SCOPE', 'Ask user', 'Never guess on scope', 'step', COLOR_4),
  makeStep('D4_MAJOR', '→ back to Phase 2', 'Re-delegate with corrected context', 'step', COLOR_4),
  makeStep('D4_SP', 'Final scratchpad capture', 'Everything needed to resume goes here', 'step', COLOR_4),
  makeStep('D4_REPORT', 'Report to user', 'Lead with outcome · human-tone · propose next steps', 'step', COLOR_4),
  makeStep('D4_END', 'Mission complete', undefined, 'step', COLOR_4),
]

const phase4Edges: Edge[] = [
  edge('D4_START', 'D4_EVAL'),
  edge('D4_EVAL', 'D4_Q1'),
  edge('D4_Q1', 'D4_Q2', 'YES'),
  edge('D4_Q1', 'D4_Q3', 'NO'),
  edge('D4_Q2', 'D4_Q3', 'NO — incoherent'),
  edge('D4_Q2', 'D4_SP', 'YES'),
  edge('D4_Q3', 'D4_MINOR', 'minor'),
  edge('D4_Q3', 'D4_SCOPE', 'scope?'),
  edge('D4_Q3', 'D4_MAJOR', 'major'),
  edge('D4_MINOR', 'D4_SP'),
  edge('D4_SCOPE', 'D4_SP'),
  edge('D4_MAJOR', 'D4_END', 'loop back', true),
  edge('D4_SP', 'D4_REPORT'),
  edge('D4_REPORT', 'D4_END'),
]

// ─── Phase 5 — Maintenance ───────────────────────────────────────────────────
const COLOR_5 = '#475569'

const phase5Nodes: Node[] = [
  makeStep('D5_START', 'Post-delivery — optional', undefined, 'step', COLOR_5),
  makeDecision('D5_PAT', 'Recurring pattern?', COLOR_5),
  makeStep('D5_HARNESS', 'Suggest harness', 'User confirms → lint rules · CI checks · AGENTS.md', 'step', COLOR_5),
  makeStep('D5_GARDEN', '→ gardener', 'Stale docs + code drift detection', 'step', COLOR_5),
  makeDecision('D5_RECUR', 'Pattern still recurs?', COLOR_5),
  makeStep('D5_ESC', 'Escalate to harness', 'Mechanical enforcement needed', 'step', COLOR_5),
  makeStep('D5_END', 'Session complete', undefined, 'step', COLOR_5),
]

const phase5Edges: Edge[] = [
  edge('D5_START', 'D5_PAT'),
  edge('D5_PAT', 'D5_HARNESS', 'needs enforcement'),
  edge('D5_PAT', 'D5_GARDEN', 'docs/drift'),
  edge('D5_PAT', 'D5_END', 'no pattern', true),
  edge('D5_GARDEN', 'D5_RECUR'),
  edge('D5_RECUR', 'D5_ESC', 'YES'),
  edge('D5_RECUR', 'D5_END', 'NO'),
  edge('D5_ESC', 'D5_HARNESS'),
  edge('D5_HARNESS', 'D5_END'),
]

// ─── Registry ────────────────────────────────────────────────────────────────
const phaseRegistry: Record<string, PhaseDetailData> = {
  PHASE_0: { phaseId: 'PHASE_0', color: COLOR_0, nodes: phase0Nodes, edges: phase0Edges },
  PHASE_1: { phaseId: 'PHASE_1', color: COLOR_1, nodes: phase1Nodes, edges: phase1Edges },
  PHASE_2: { phaseId: 'PHASE_2', color: COLOR_2, nodes: phase2Nodes, edges: phase2Edges },
  PHASE_3: { phaseId: 'PHASE_3', color: COLOR_3, nodes: phase3Nodes, edges: phase3Edges },
  PHASE_4: { phaseId: 'PHASE_4', color: COLOR_4, nodes: phase4Nodes, edges: phase4Edges },
  PHASE_5: { phaseId: 'PHASE_5', color: COLOR_5, nodes: phase5Nodes, edges: phase5Edges },
}

export function getPhaseDetailData(phaseId: string): PhaseDetailData {
  const data = phaseRegistry[phaseId]
  if (!data) throw new Error(`Unknown phaseId: ${phaseId}`)
  return data
}
