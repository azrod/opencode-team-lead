<template>
  <div class="agent-graph-wrapper">
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
      :min-zoom="0.4"
      :max-zoom="2"
      fit-view-on-init
      :fit-view-options="{ padding: 0.12 }"
      class="agent-flow"
    >
      <template #node-teamLead="{ data }">
        <div class="node node--team-lead">
          <span class="node-icon">{{ data.icon }}</span>
          <span class="node-label">{{ data.label }}</span>
          <span class="node-sub">{{ data.sub }}</span>
        </div>
      </template>

      <template #node-reviewManager="{ data }">
        <div class="node node--review-manager">
          <span class="node-icon">{{ data.icon }}</span>
          <span class="node-label">{{ data.label }}</span>
          <span class="node-sub">{{ data.sub }}</span>
        </div>
      </template>

      <template #node-leaf="{ data }">
        <div class="node node--leaf">
          <span class="node-icon">{{ data.icon }}</span>
          <span class="node-label">{{ data.label }}</span>
          <span class="node-sub">{{ data.sub }}</span>
        </div>
      </template>

      <template #node-reviewer="{ data }">
        <div class="node node--reviewer">
          <span class="node-icon">{{ data.icon }}</span>
          <span class="node-label">{{ data.label }}</span>
          <span class="node-sub">{{ data.sub }}</span>
        </div>
      </template>
    </VueFlow>

    <div class="agent-graph-legend">
      <span class="legend-item">
        <svg width="32" height="10" viewBox="0 0 32 10">
          <line x1="0" y1="5" x2="32" y2="5" stroke="var(--vp-c-brand-1)" stroke-width="2" stroke-dasharray="5,3"/>
          <polygon points="28,2 32,5 28,8" fill="var(--vp-c-brand-1)"/>
        </svg>
        delegation
      </span>
      <span class="legend-item">
        <svg width="32" height="10" viewBox="0 0 32 10">
          <line x1="0" y1="5" x2="32" y2="5" stroke="var(--vp-c-text-2)" stroke-width="2"/>
          <polygon points="28,2 32,5 28,8" fill="var(--vp-c-text-2)"/>
        </svg>
        review chain
      </span>
      <span class="legend-hint">scroll to zoom · drag to pan</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

// Layout constants — compact 2-row design fits ~800px wide
const TL_X = 270
const TL_Y = 20

// Row 1a — first 4 leaf agents
const ROW1A_Y = 160
const SPACING = 175
const START_X = 20

const ROW1A_NODES = [
  { id: 'explore',    label: 'explore',    icon: '🔍', sub: 'read-only exploration'   },
  { id: 'general',   label: 'general',    icon: '⚙️', sub: 'implementation'          },
  { id: 'researcher',label: 'researcher', icon: '🌐', sub: 'external knowledge'      },
  { id: 'planning',  label: 'planning',   icon: '📋', sub: 'exec-plans'              },
]

// Row 1b — next 4 leaf agents
const ROW1B_Y = 290
const ROW1B_NODES = [
  { id: 'brainstorm',label: 'brainstorm', icon: '💡', sub: 'product brief'           },
  { id: 'harness',   label: 'harness',   icon: '🔒', sub: 'pattern enforcement'     },
  { id: 'gardener',  label: 'gardener',  icon: '🌱', sub: 'maintenance & drift'     },
  { id: 'bug-finder',label: 'bug-finder',icon: '🐛', sub: 'root-cause investigation'},
]

// Review-manager
const RM_X = 240
const RM_Y = 430

// Reviewers row
const ROW3_Y = 560
const REVIEWERS = [
  { id: 'code-reviewer',         label: 'code-reviewer',         icon: '📝', sub: 'code quality'   },
  { id: 'security-reviewer',     label: 'security-reviewer',     icon: '🛡️', sub: 'security audit' },
  { id: 'requirements-reviewer', label: 'requirements-reviewer', icon: '✅', sub: 'req. compliance'},
]

const nodes = [
  {
    id: 'team-lead',
    type: 'teamLead',
    position: { x: TL_X, y: TL_Y },
    data: { label: 'team-lead', icon: '🎯', sub: 'pure orchestrator' },
  },
  ...ROW1A_NODES.map((n, i) => ({
    id: n.id,
    type: 'leaf',
    position: { x: START_X + i * SPACING, y: ROW1A_Y },
    data: { label: n.label, icon: n.icon, sub: n.sub },
  })),
  ...ROW1B_NODES.map((n, i) => ({
    id: n.id,
    type: 'leaf',
    position: { x: START_X + i * SPACING, y: ROW1B_Y },
    data: { label: n.label, icon: n.icon, sub: n.sub },
  })),
  {
    id: 'review-manager',
    type: 'reviewManager',
    position: { x: RM_X, y: RM_Y },
    data: { label: 'review-manager', icon: '🔎', sub: 'review orchestrator' },
  },
  ...REVIEWERS.map((r, i) => ({
    id: r.id,
    type: 'reviewer',
    position: { x: 50 + i * 220, y: ROW3_Y },
    data: { label: r.label, icon: r.icon, sub: r.sub },
  })),
]

const delegationEdges = [...ROW1A_NODES, ...ROW1B_NODES].map(n => ({
  id: `tl-${n.id}`,
  source: 'team-lead',
  target: n.id,
  animated: true,
  style: { stroke: 'var(--vp-c-brand-1)', strokeDasharray: '6,3', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: 'var(--vp-c-brand-1)' },
}))

const rmDelegationEdge = {
  id: 'tl-rm',
  source: 'team-lead',
  target: 'review-manager',
  animated: true,
  style: { stroke: 'var(--vp-c-brand-1)', strokeDasharray: '6,3', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: 'var(--vp-c-brand-1)' },
}

const reviewEdges = REVIEWERS.map(r => ({
  id: `rm-${r.id}`,
  source: 'review-manager',
  target: r.id,
  animated: false,
  style: { stroke: 'var(--vp-c-text-2)', strokeWidth: 1.5 },
  markerEnd: { type: 'arrowclosed', color: 'var(--vp-c-text-2)' },
}))

const edges = [...delegationEdges, rmDelegationEdge, ...reviewEdges]
</script>

<style>
/* Vue Flow base styles loaded via JS imports above */
</style>

<style scoped>
.agent-graph-wrapper {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
  margin: 1.5rem 0;
}

.agent-flow {
  width: 100%;
  height: 750px;
  background: var(--vp-c-bg-soft);
}

.agent-flow :deep(.vue-flow__background) {
  background: var(--vp-c-bg-soft);
}

.agent-flow :deep(.vue-flow__pane) {
  cursor: grab;
}

.agent-flow :deep(.vue-flow__pane:active) {
  cursor: grabbing;
}

/* Node base */
.node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  min-width: 120px;
  text-align: center;
  font-family: inherit;
  cursor: default;
  user-select: none;
}

.node-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.node-label {
  font-size: 0.78rem;
  font-weight: 600;
  font-family: var(--vp-font-family-mono);
  color: inherit;
  white-space: nowrap;
}

.node-sub {
  font-size: 0.65rem;
  opacity: 0.7;
  white-space: nowrap;
}

/* team-lead */
.node--team-lead {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  min-width: 180px;
  padding: 12px 20px;
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.node--team-lead .node-label {
  font-size: 0.9rem;
  font-weight: 700;
}

.node--team-lead .node-sub {
  font-size: 0.7rem;
  opacity: 0.8;
}

/* review-manager */
.node--review-manager {
  background: var(--vp-c-yellow-soft, #fef3c7);
  border-color: var(--vp-c-yellow-1, #d97706);
  color: var(--vp-c-yellow-1, #d97706);
  min-width: 160px;
  padding: 10px 16px;
}

/* leaf agents */
.node--leaf {
  background: var(--vp-c-bg);
  border-color: var(--vp-c-divider);
  color: var(--vp-c-text-1);
  min-width: 120px;
}

/* reviewer agents */
.node--reviewer {
  background: var(--vp-c-green-soft, #d1fae5);
  border-color: var(--vp-c-green-1, #059669);
  color: var(--vp-c-green-1, #059669);
  min-width: 150px;
}

/* Legend */
.agent-graph-legend {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 8px 16px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-hint {
  margin-left: auto;
  opacity: 0.6;
  font-style: italic;
}
</style>
