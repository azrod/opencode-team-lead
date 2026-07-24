<template>
  <div class="rcd-wrapper">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :nodes-draggable="false"
      :nodes-connectable="false"
      :elements-selectable="false"
      :zoom-on-scroll="true"
      :zoom-on-pinch="true"
      :pan-on-drag="true"
      :pan-on-scroll="false"
      :prevent-scrolling="true"
      :min-zoom="0.3"
      :max-zoom="2"
      fit-view-on-init
      :fit-view-options="{ padding: 0.18 }"
      :default-viewport="{ zoom: 0.75, x: 30, y: 10 }"
      class="rcd-flow"
    >
      <!-- orchestrator: review-manager (yellow, prominent) -->
      <template #node-orchestrator="{ data }">
        <div class="rcd-node rcd-node--orchestrator">
          <span class="rcd-node-icon">{{ data.icon }}</span>
          <span class="rcd-node-label">{{ data.label }}</span>
          <span v-if="data.sub" class="rcd-node-sub">{{ data.sub }}</span>
        </div>
      </template>

      <!-- reviewer: specialist agents (green) -->
      <template #node-reviewer="{ data }">
        <div class="rcd-node rcd-node--reviewer">
          <span class="rcd-node-icon">{{ data.icon }}</span>
          <span class="rcd-node-label">{{ data.label }}</span>
          <span v-if="data.sub" class="rcd-node-sub">{{ data.sub }}</span>
        </div>
      </template>

      <!-- verdict: decision diamond -->
      <template #node-verdict="{ data }">
        <div class="rcd-node rcd-node--verdict">
          <span class="rcd-node-label">{{ data.label }}</span>
        </div>
      </template>

      <!-- outcome: terminal nodes (green / orange / red) -->
      <template #node-outcome="{ data }">
        <div class="rcd-node rcd-node--outcome" :class="`rcd-node--outcome-${data.variant}`">
          <span class="rcd-node-label">{{ data.label }}</span>
          <span v-if="data.sub" class="rcd-node-sub">{{ data.sub }}</span>
        </div>
      </template>
    </VueFlow>

    <div class="rcd-legend">
      <span class="rcd-legend-item">
        <svg width="32" height="10" viewBox="0 0 32 10">
          <line x1="0" y1="5" x2="28" y2="5" stroke="var(--vp-c-brand-1)" stroke-width="2"/>
          <polygon points="24,2 32,5 24,8" fill="var(--vp-c-brand-1)"/>
          <circle cx="6" cy="5" r="2.5" fill="var(--vp-c-brand-1)" opacity="0.5"/>
          <circle cx="14" cy="5" r="2.5" fill="var(--vp-c-brand-1)" opacity="0.5"/>
        </svg>
        spawns (parallel)
      </span>
      <span class="rcd-legend-item">
        <svg width="32" height="10" viewBox="0 0 32 10">
          <line x1="0" y1="5" x2="28" y2="5" stroke="var(--vp-c-green-1, #16a34a)" stroke-width="2"/>
          <polygon points="24,2 32,5 24,8" fill="var(--vp-c-green-1, #16a34a)"/>
        </svg>
        APPROVED
      </span>
      <span class="rcd-legend-item">
        <svg width="32" height="10" viewBox="0 0 32 10">
          <line x1="0" y1="5" x2="28" y2="5" stroke="var(--vp-c-yellow-1, #d97706)" stroke-width="2"/>
          <polygon points="24,2 32,5 24,8" fill="var(--vp-c-yellow-1, #d97706)"/>
        </svg>
        CHANGES_REQUESTED
      </span>
      <span class="rcd-legend-item">
        <svg width="32" height="10" viewBox="0 0 32 10">
          <line x1="0" y1="5" x2="28" y2="5" stroke="var(--vp-c-red-1, #dc2626)" stroke-width="2"/>
          <polygon points="24,2 32,5 24,8" fill="var(--vp-c-red-1, #dc2626)"/>
        </svg>
        BLOCKED
      </span>
      <span class="rcd-legend-hint">scroll to zoom · drag to pan</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// ─── Layout ───────────────────────────────────────────────────────────────────
//
//  Row 0  (y=20):   review-manager [orchestrator]       — top center
//  Row 1  (y=170):  code-reviewer  security-reviewer  requirements-reviewer
//  Row 2  (y=320):  review-manager [synthesize]         — center
//  Row 3  (y=440):  verdict diamond                     — center
//  Row 4  (y=580):  APPROVED   CHANGES_REQUESTED   BLOCKED  — spread
//  Row 5  (y=720):  report-to-team-lead   send-feedback      escalate

const CX = 340   // horizontal center

// Row 0 — orchestrator
const RM1_X = CX - 90
const RM1_Y = 20

// Row 1 — 3 reviewers, spread symmetrically
const REV_Y = 170
const REV_SPACING = 230
const REV_START_X = CX - REV_SPACING   // leftmost reviewer

const reviewers = [
  { id: 'code-reviewer',         label: 'code-reviewer',         icon: '📝', sub: 'code quality'    },
  { id: 'security-reviewer',     label: 'security-reviewer',     icon: '🛡️', sub: 'security audit'  },
  { id: 'requirements-reviewer', label: 'requirements-reviewer', icon: '✅', sub: 'req. compliance' },
]

// Row 2 — synthesis node (re-use orchestrator type, different sub)
const SYNTH_X = CX - 90
const SYNTH_Y = 320

// Row 3 — verdict diamond
const VERDICT_X = CX - 60
const VERDICT_Y = 440

// Row 4 — outcome nodes
const OUT_Y = 580
const OUT_APPROVED_X   = CX - 420
const OUT_CHANGES_X    = CX - 90
const OUT_BLOCKED_X    = CX + 240

// Row 5 — terminal actions
const ACT_Y = 710
const ACT_REPORT_X     = CX - 420
const ACT_FEEDBACK_X   = CX - 90
const ACT_ESCALATE_X   = CX + 240

// ─── Nodes ────────────────────────────────────────────────────────────────────

const nodes = [
  // Orchestrator — receives mission
  {
    id: 'rm-receive',
    type: 'orchestrator',
    position: { x: RM1_X, y: RM1_Y },
    data: { label: 'review-manager', icon: '🔎', sub: 'receives review mission' },
  },

  // 3 specialist reviewers
  ...reviewers.map((r, i) => ({
    id: r.id,
    type: 'reviewer',
    position: { x: REV_START_X + i * REV_SPACING, y: REV_Y },
    data: { label: r.label, icon: r.icon, sub: r.sub },
  })),

  // Synthesis node
  {
    id: 'rm-synthesize',
    type: 'orchestrator',
    position: { x: SYNTH_X, y: SYNTH_Y },
    data: { label: 'review-manager', icon: '⚖️', sub: 'arbitrates & synthesizes' },
  },

  // Verdict diamond
  {
    id: 'verdict',
    type: 'verdict',
    position: { x: VERDICT_X, y: VERDICT_Y },
    data: { label: 'final verdict?' },
  },

  // Outcome labels
  {
    id: 'out-approved',
    type: 'outcome',
    position: { x: OUT_APPROVED_X, y: OUT_Y },
    data: { label: 'APPROVED', variant: 'success' },
  },
  {
    id: 'out-changes',
    type: 'outcome',
    position: { x: OUT_CHANGES_X, y: OUT_Y },
    data: { label: 'CHANGES_REQUESTED', variant: 'warning' },
  },
  {
    id: 'out-blocked',
    type: 'outcome',
    position: { x: OUT_BLOCKED_X, y: OUT_Y },
    data: { label: 'BLOCKED', variant: 'danger' },
  },

  // Terminal actions
  {
    id: 'act-report',
    type: 'outcome',
    position: { x: ACT_REPORT_X, y: ACT_Y },
    data: { label: 'report to team-lead', sub: 'proceed to delivery', variant: 'success' },
  },
  {
    id: 'act-feedback',
    type: 'outcome',
    position: { x: ACT_FEEDBACK_X, y: ACT_Y },
    data: { label: 'send feedback', sub: 'producer fixes → re-review', variant: 'warning' },
  },
  {
    id: 'act-escalate',
    type: 'outcome',
    position: { x: ACT_ESCALATE_X, y: ACT_Y },
    data: { label: 'escalate to user', sub: 'stop — no safe path forward', variant: 'danger' },
  },
]

// ─── Edge helpers ─────────────────────────────────────────────────────────────

const spawnEdge = (extra = {}) => ({
  animated: true,
  style: { stroke: 'var(--vp-c-brand-1)', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: 'var(--vp-c-brand-1)' },
  ...extra,
})

const returnEdge = (extra = {}) => ({
  animated: false,
  style: { stroke: 'var(--vp-c-text-2)', strokeWidth: 1.5, strokeDasharray: '4,3' },
  markerEnd: { type: 'arrowclosed', color: 'var(--vp-c-text-2)' },
  ...extra,
})

const approvedEdge = (extra = {}) => ({
  animated: false,
  style: { stroke: 'var(--vp-c-green-1, #16a34a)', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: 'var(--vp-c-green-1, #16a34a)' },
  ...extra,
})

const warningEdge = (extra = {}) => ({
  animated: false,
  style: { stroke: 'var(--vp-c-yellow-1, #d97706)', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: 'var(--vp-c-yellow-1, #d97706)' },
  ...extra,
})

const dangerEdge = (extra = {}) => ({
  animated: false,
  style: { stroke: 'var(--vp-c-red-1, #dc2626)', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: 'var(--vp-c-red-1, #dc2626)' },
  ...extra,
})

// ─── Edges ────────────────────────────────────────────────────────────────────

const edges = [
  // Spawn edges: rm-receive → each reviewer (animated brand color)
  ...reviewers.map(r => ({
    id: `spawn-${r.id}`,
    source: 'rm-receive',
    target: r.id,
    label: 'spawns',
    labelStyle: { fill: 'var(--vp-c-brand-1)', fontSize: '10px', fontWeight: 600 },
    labelBgStyle: { fill: 'var(--vp-c-bg-soft)' },
    type: 'smoothstep',
    ...spawnEdge(),
  })),

  // Return edges: each reviewer → rm-synthesize (dashed, subtle)
  ...reviewers.map(r => ({
    id: `return-${r.id}`,
    source: r.id,
    target: 'rm-synthesize',
    label: 'verdict',
    labelStyle: { fill: 'var(--vp-c-text-2)', fontSize: '10px' },
    labelBgStyle: { fill: 'var(--vp-c-bg-soft)' },
    type: 'smoothstep',
    ...returnEdge(),
  })),

  // Synthesis → verdict diamond
  {
    id: 'synth-verdict',
    source: 'rm-synthesize',
    target: 'verdict',
    ...spawnEdge({ animated: false }),
  },

  // Verdict → outcome nodes
  {
    id: 'verdict-approved',
    source: 'verdict',
    target: 'out-approved',
    label: 'APPROVED',
    labelStyle: { fill: 'var(--vp-c-green-1, #16a34a)', fontSize: '10px', fontWeight: 700 },
    labelBgStyle: { fill: 'var(--vp-c-bg-soft)' },
    type: 'smoothstep',
    ...approvedEdge(),
  },
  {
    id: 'verdict-changes',
    source: 'verdict',
    target: 'out-changes',
    label: 'CHANGES_REQUESTED',
    labelStyle: { fill: 'var(--vp-c-yellow-1, #d97706)', fontSize: '10px', fontWeight: 700 },
    labelBgStyle: { fill: 'var(--vp-c-bg-soft)' },
    type: 'smoothstep',
    ...warningEdge(),
  },
  {
    id: 'verdict-blocked',
    source: 'verdict',
    target: 'out-blocked',
    label: 'BLOCKED',
    labelStyle: { fill: 'var(--vp-c-red-1, #dc2626)', fontSize: '10px', fontWeight: 700 },
    labelBgStyle: { fill: 'var(--vp-c-bg-soft)' },
    type: 'smoothstep',
    ...dangerEdge(),
  },

  // Outcome → terminal actions
  {
    id: 'approved-report',
    source: 'out-approved',
    target: 'act-report',
    ...approvedEdge(),
  },
  {
    id: 'changes-feedback',
    source: 'out-changes',
    target: 'act-feedback',
    ...warningEdge(),
  },
  {
    id: 'blocked-escalate',
    source: 'out-blocked',
    target: 'act-escalate',
    ...dangerEdge(),
  },
]
</script>

<style>
/* Vue Flow base styles loaded via JS imports above */
</style>

<style scoped>
.rcd-wrapper {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
  margin: 1.5rem 0;
}

.rcd-flow {
  width: 100%;
  height: 790px;
  background: var(--vp-c-bg-soft);
}

.rcd-flow :deep(.vue-flow__background) {
  background: var(--vp-c-bg-soft);
}

.rcd-flow :deep(.vue-flow__pane) {
  cursor: grab;
}

.rcd-flow :deep(.vue-flow__pane:active) {
  cursor: grabbing;
}

/* ── Shared node base ─────────────────────────────────────────────────────── */
.rcd-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  text-align: center;
  font-family: inherit;
  cursor: default;
  user-select: none;
}

.rcd-node-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.rcd-node-label {
  font-size: 0.78rem;
  font-weight: 600;
  font-family: var(--vp-font-family-mono);
  color: inherit;
  white-space: nowrap;
}

.rcd-node-sub {
  font-size: 0.65rem;
  opacity: 0.72;
  white-space: nowrap;
}

/* ── Orchestrator (review-manager) — yellow, prominent ───────────────────── */
.rcd-node--orchestrator {
  background: var(--vp-c-yellow-soft, #fef3c7);
  border-color: var(--vp-c-yellow-1, #d97706);
  color: var(--vp-c-yellow-1, #d97706);
  min-width: 170px;
  padding: 10px 18px;
  box-shadow: 0 0 0 3px var(--vp-c-yellow-soft, #fef3c7);
}

.rcd-node--orchestrator .rcd-node-label {
  font-size: 0.88rem;
  font-weight: 700;
}

/* ── Reviewer agents — green ─────────────────────────────────────────────── */
.rcd-node--reviewer {
  background: var(--vp-c-green-soft, #d1fae5);
  border-color: var(--vp-c-green-1, #059669);
  color: var(--vp-c-green-1, #059669);
  min-width: 150px;
}

/* ── Verdict diamond ─────────────────────────────────────────────────────── */
.rcd-node--verdict {
  background: var(--vp-c-yellow-soft, #fef3c7);
  border-color: var(--vp-c-yellow-1, #d97706);
  color: var(--vp-c-yellow-1, #d97706);
  min-width: 120px;
  transform: rotate(45deg);
  border-radius: 4px;
  padding: 18px 14px;
}

.rcd-node--verdict .rcd-node-label {
  transform: rotate(-45deg);
  font-size: 0.72rem;
  white-space: nowrap;
}

/* ── Outcome nodes ───────────────────────────────────────────────────────── */
.rcd-node--outcome {
  border-radius: 20px;
  min-width: 140px;
  padding: 7px 16px;
}

.rcd-node--outcome-success {
  background: var(--vp-c-green-soft, #d1fae5);
  border-color: var(--vp-c-green-1, #16a34a);
  color: var(--vp-c-green-1, #16a34a);
}

.rcd-node--outcome-warning {
  background: var(--vp-c-yellow-soft, #fef3c7);
  border-color: var(--vp-c-yellow-1, #d97706);
  color: var(--vp-c-yellow-1, #d97706);
}

.rcd-node--outcome-danger {
  background: var(--vp-c-red-soft, #fee2e2);
  border-color: var(--vp-c-red-1, #dc2626);
  color: var(--vp-c-red-1, #dc2626);
}

/* ── Legend ──────────────────────────────────────────────────────────────── */
.rcd-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  padding: 8px 16px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
}

.rcd-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rcd-legend-hint {
  margin-left: auto;
  opacity: 0.6;
  font-style: italic;
}
</style>
