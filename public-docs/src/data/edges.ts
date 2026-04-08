import type { Edge } from '@xyflow/react'

const edgeBase = {
  type: 'smoothstep',
  style: { strokeWidth: 2 },
}

const labelStyle = { fill: '#94a3b8', fontSize: 11, fontWeight: 500 }
const labelBgStyle = { fill: '#1e293b', fillOpacity: 0.9 }
const labelBgPadding: [number, number] = [4, 6]
const labelBgBorderRadius = 4

const labelProps = {
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}

export const initialEdges: Edge[] = [
  // START → Phase 0
  { id: 'e-start-glob', source: 'phase_start', target: 'phase0_glob', ...edgeBase },
  { id: 'e-glob-count', source: 'phase0_glob', target: 'phase0_count', ...edgeBase },

  // Phase 0 branching
  { id: 'e-count-none', source: 'phase0_count', target: 'phase0_none', label: '0', ...labelProps, ...edgeBase },
  { id: 'e-count-one', source: 'phase0_count', target: 'phase0_one', label: '1', ...labelProps, ...edgeBase },
  { id: 'e-count-many', source: 'phase0_count', target: 'phase0_many', label: 'N', ...labelProps, ...edgeBase },

  { id: 'e-one-draft', source: 'phase0_one', target: 'phase0_draft_ask', label: 'draft', ...labelProps, ...edgeBase },
  { id: 'e-one-done', source: 'phase0_one', target: 'phase0_done_ask', label: 'done/other', ...labelProps, ...edgeBase },

  { id: 'e-draft-continue', source: 'phase0_draft_ask', target: 'phase0_load', label: 'Continue', ...labelProps, ...edgeBase },
  { id: 'e-draft-fresh', source: 'phase0_draft_ask', target: 'phase0_step1', label: 'Fresh start', ...labelProps, ...edgeBase },
  { id: 'e-done-revise', source: 'phase0_done_ask', target: 'phase0_load', label: 'Revise', ...labelProps, ...edgeBase },
  { id: 'e-done-new', source: 'phase0_done_ask', target: 'phase0_step1', label: 'New project', ...labelProps, ...edgeBase },

  { id: 'e-many-draft', source: 'phase0_many', target: 'phase0_draft_ask', ...edgeBase },

  { id: 'e-none-run', source: 'phase0_none', target: 'phase0_run_brainstorm', ...edgeBase },
  { id: 'e-step1-run', source: 'phase0_step1', target: 'phase0_run_brainstorm', ...edgeBase },
  { id: 'e-load-run', source: 'phase0_load', target: 'phase0_run_brainstorm', ...edgeBase },

  { id: 'e-run-brief', source: 'phase0_run_brainstorm', target: 'phase0_produce_brief', ...edgeBase },
  { id: 'e-brief-p1', source: 'phase0_produce_brief', target: 'phase1_read_sp', ...edgeBase },

  // Phase 1
  { id: 'e-p1read-state', source: 'phase1_read_sp', target: 'phase1_project_state', ...edgeBase },
  { id: 'e-p1state-clarify', source: 'phase1_project_state', target: 'phase1_clarify', ...edgeBase },
  { id: 'e-p1clarify-todo', source: 'phase1_clarify', target: 'phase1_todowrite', ...edgeBase },
  { id: 'e-p1todo-compress', source: 'phase1_todowrite', target: 'phase1_compress', ...edgeBase },
  { id: 'e-p1compress-bug', source: 'phase1_compress', target: 'phase2_bug', ...edgeBase },

  // Phase 2
  { id: 'e-bug-yes', source: 'phase2_bug', target: 'phase2_bug_finder', label: 'YES', ...labelProps, ...edgeBase },
  { id: 'e-bug-no', source: 'phase2_bug', target: 'phase2_select_agent', label: 'NO', ...labelProps, ...edgeBase },
  { id: 'e-bugfinder-select', source: 'phase2_bug_finder', target: 'phase2_select_agent', ...edgeBase },
  { id: 'e-select-handoff', source: 'phase2_select_agent', target: 'phase2_handoff', ...edgeBase },
  { id: 'e-handoff-success', source: 'phase2_handoff', target: 'phase2_success', ...edgeBase },
  { id: 'e-success-yes', source: 'phase2_success', target: 'phase3_delegate_rm', label: 'YES', ...labelProps, ...edgeBase },
  { id: 'e-success-no', source: 'phase2_success', target: 'phase2_retry', label: 'NO', ...labelProps, ...edgeBase },
  { id: 'e-retry-success', source: 'phase2_retry', target: 'phase2_success', ...edgeBase },
  { id: 'e-retry-esc', source: 'phase2_retry', target: 'phase2_esc_user', label: 'after 2 fails', ...labelProps, ...edgeBase },

  // Phase 3
  { id: 'e-rm-verdict', source: 'phase3_delegate_rm', target: 'phase3_verdict', ...edgeBase },
  { id: 'e-verdict-approved', source: 'phase3_verdict', target: 'phase4_self_eval', label: 'APPROVED', ...labelProps, ...edgeBase },
  { id: 'e-verdict-changes', source: 'phase3_verdict', target: 'phase3_resume_fix', label: 'CHANGES_REQUESTED', ...labelProps, ...edgeBase },
  { id: 'e-fix-rm', source: 'phase3_resume_fix', target: 'phase3_delegate_rm', ...edgeBase },
  { id: 'e-verdict-blocked', source: 'phase3_verdict', target: 'phase3_blocked_esc', label: 'BLOCKED', ...labelProps, ...edgeBase },

  // Phase 4
  { id: 'e-eval-gap', source: 'phase4_self_eval', target: 'phase4_gap', ...edgeBase },
  { id: 'e-gap-ok', source: 'phase4_gap', target: 'phase4_sp_capture', label: 'OK', ...labelProps, ...edgeBase },
  { id: 'e-gap-minor', source: 'phase4_gap', target: 'phase4_minor', label: 'minor', ...labelProps, ...edgeBase },
  { id: 'e-gap-major', source: 'phase4_gap', target: 'phase2_select_agent', label: 'major gap', ...labelProps, ...edgeBase },
  { id: 'e-gap-scope', source: 'phase4_gap', target: 'phase4_scope', label: 'scope?', ...labelProps, ...edgeBase },
  { id: 'e-minor-sp', source: 'phase4_minor', target: 'phase4_sp_capture', ...edgeBase },
  { id: 'e-scope-sp', source: 'phase4_scope', target: 'phase4_sp_capture', ...edgeBase },
  { id: 'e-sp-report', source: 'phase4_sp_capture', target: 'phase4_report', ...edgeBase },
  { id: 'e-report-end', source: 'phase4_report', target: 'phase_end', ...edgeBase },

  // Optional: report → phase5 (dashed)
  {
    id: 'e-report-pat',
    source: 'phase4_report',
    target: 'phase5_pattern',
    label: 'optional',
    ...labelProps,
    ...edgeBase,
    style: { ...edgeBase.style, strokeDasharray: '6 3', stroke: '#9ca3af' },
  },

  // Phase 5
  { id: 'e-pat-harness', source: 'phase5_pattern', target: 'phase5_harness', label: 'needs enforcement', ...labelProps, ...edgeBase },
  { id: 'e-pat-gardener', source: 'phase5_pattern', target: 'phase5_gardener', label: 'docs / drift', ...labelProps, ...edgeBase },
  { id: 'e-gardener-recur', source: 'phase5_gardener', target: 'phase5_recurring', ...edgeBase },
  { id: 'e-recur-yes', source: 'phase5_recurring', target: 'phase5_esc_harness', label: 'YES', ...labelProps, ...edgeBase },
  { id: 'e-esc-harness', source: 'phase5_esc_harness', target: 'phase5_harness', ...edgeBase },
  { id: 'e-recur-no', source: 'phase5_recurring', target: 'phase_end', label: 'NO', ...labelProps, ...edgeBase },
  { id: 'e-harness-end', source: 'phase5_harness', target: 'phase_end', ...edgeBase },
]
