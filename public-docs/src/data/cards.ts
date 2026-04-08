export interface PhaseStep {
  icon: string
  text: string
  sub?: string
  type?: 'action' | 'decision' | 'escalation'
}

export interface PhaseCard {
  id: string
  phase: number | null
  label: string
  sublabel?: string
  color: string
  lightColor: string
  steps: PhaseStep[]
}

export const phaseCards: PhaseCard[] = [
  {
    id: 'PHASE_0',
    phase: 0,
    label: 'Brainstorm',
    sublabel: 'optional — when scope is vague',
    color: '#7c3aed',
    lightColor: '#ede9fe',
    steps: [
      { icon: '🔍', text: 'Scan docs/briefs/', sub: 'Always runs first', type: 'action' },
      { icon: '◈', text: 'Brief(s) found?', type: 'decision', sub: 'None → skip | One → check status | Many → choose' },
      { icon: '▶', text: 'Run brainstorm agent', type: 'action' },
      { icon: '📄', text: 'Brief written → suggest Planning or Orion', type: 'action' },
    ],
  },
  {
    id: 'PHASE_1',
    phase: 1,
    label: 'Plan',
    sublabel: 'strict 5-step sequence',
    color: '#1d4ed8',
    lightColor: '#dbeafe',
    steps: [
      { icon: '📖', text: 'Read scratchpad', sub: '.opencode/scratchpad.md', type: 'action' },
      { icon: '⚙', text: 'project_state() + check_artifacts()', sub: 'Lifecycle tools — mandatory', type: 'action' },
      { icon: '💬', text: 'Clarify intent', sub: 'Ask user if ambiguous', type: 'decision' },
      { icon: '✅', text: 'todowrite()', sub: 'Visible task list', type: 'action' },
      { icon: '💾', text: 'Write scratchpad + compress', sub: 'Context insurance before delegating', type: 'action' },
    ],
  },
  {
    id: 'PHASE_2',
    phase: 2,
    label: 'Delegate',
    sublabel: 'select → handoff → verify',
    color: '#15803d',
    lightColor: '#dcfce7',
    steps: [
      { icon: '🐛', text: 'Bug report?', type: 'decision', sub: 'YES → bug-finder first, always' },
      { icon: '🤖', text: 'Select agent', sub: 'Registered agents > invented personas', type: 'action' },
      { icon: '📤', text: 'Delegate via task()', sub: 'Self-contained prompt with full context', type: 'action' },
      { icon: '◈', text: 'Success?', type: 'decision', sub: 'NO → retry ≤2 | after 2 fails → escalate' },
    ],
  },
  {
    id: 'PHASE_3',
    phase: 3,
    label: 'Review',
    sublabel: 'always via review-manager',
    color: '#b45309',
    lightColor: '#fef3c7',
    steps: [
      { icon: '🔎', text: '→ review-manager', sub: 'Never spawn reviewers directly', type: 'action' },
      { icon: '◈', text: 'Verdict?', type: 'decision', sub: 'APPROVED | CHANGES_REQUESTED | BLOCKED' },
      { icon: '🔁', text: 'Re-delegate fixes if needed', sub: 'Max 2 review rounds', type: 'action' },
      { icon: '⚠', text: 'BLOCKED → escalate immediately', type: 'escalation', sub: 'No fix without user input' },
    ],
  },
  {
    id: 'PHASE_4',
    phase: 4,
    label: 'Synthesize',
    sublabel: 'self-eval → report',
    color: '#4338ca',
    lightColor: '#e0e7ff',
    steps: [
      { icon: '🔍', text: 'Self-evaluation', sub: 'Does result fully answer the request?', type: 'action' },
      { icon: '◈', text: 'Gap?', type: 'decision', sub: 'Minor → fix | Major → back to Phase 2 | Scope → ask user' },
      { icon: '💾', text: 'Final scratchpad capture', type: 'action' },
      { icon: '📢', text: 'Report to user', sub: 'Lead with outcome, human-tone', type: 'action' },
    ],
  },
  {
    id: 'PHASE_5',
    phase: 5,
    label: 'Maintenance',
    sublabel: 'optional — post-delivery',
    color: '#475569',
    lightColor: '#f1f5f9',
    steps: [
      { icon: '◈', text: 'Recurring pattern?', type: 'decision', sub: 'Two paths: enforce or hygiene' },
      { icon: '🔒', text: 'Suggest harness', sub: 'Confirm with user first — structural change', type: 'action' },
      { icon: '🌿', text: '→ gardener', sub: 'Stale docs + code drift detection', type: 'action' },
    ],
  },
]
