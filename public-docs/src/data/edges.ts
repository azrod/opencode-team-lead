import type { Edge } from '@xyflow/react'

// Edges principaux (flux normal) — épais, colorés par phase de destination
const mainEdges: Edge[] = [
  {
    id: 'e-start-p0',
    source: 'START',
    target: 'PHASE_0',
    type: 'smoothstep',
    style: { stroke: '#7c3aed', strokeWidth: 3 },
  },
  {
    id: 'e-p0-p1',
    source: 'PHASE_0',
    target: 'PHASE_1',
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 3 },
  },
  {
    id: 'e-p1-p2',
    source: 'PHASE_1',
    target: 'PHASE_2',
    type: 'smoothstep',
    style: { stroke: '#22c55e', strokeWidth: 3 },
  },
  {
    id: 'e-p2-p3',
    source: 'PHASE_2',
    target: 'PHASE_3',
    label: 'agent succeeded',
    type: 'smoothstep',
    style: { stroke: '#22c55e', strokeWidth: 3 },
    labelStyle: { fill: '#4ade80', fontSize: 11, fontWeight: 700 },
    labelBgStyle: { fill: '#052e16', fillOpacity: 0.95 },
    labelBgPadding: [4, 8] as [number, number],
    labelBgBorderRadius: 6,
  },
  {
    id: 'e-p3-p4',
    source: 'PHASE_3',
    target: 'PHASE_4',
    label: 'APPROVED',
    type: 'smoothstep',
    style: { stroke: '#4ade80', strokeWidth: 3 },
    labelStyle: { fill: '#4ade80', fontSize: 12, fontWeight: 800 },
    labelBgStyle: { fill: '#052e16', fillOpacity: 0.98 },
    labelBgPadding: [5, 10] as [number, number],
    labelBgBorderRadius: 6,
  },
  {
    id: 'e-p4-end',
    source: 'PHASE_4',
    target: 'END',
    type: 'smoothstep',
    style: { stroke: '#4ade80', strokeWidth: 3 },
  },
]

// Edges de retour — colorés, avec sourceHandle/targetHandle pour passer À DROITE des cards
const returnEdges: Edge[] = [
  {
    id: 'e-p3-p2-changes',
    source: 'PHASE_3',
    target: 'PHASE_2',
    label: 'CHANGES_REQUESTED',
    type: 'smoothstep',
    sourceHandle: 'right-source',
    targetHandle: 'right-target',
    style: { stroke: '#f59e0b', strokeWidth: 2.5, strokeDasharray: '8 4' },
    labelStyle: { fill: '#fbbf24', fontSize: 11, fontWeight: 700 },
    labelBgStyle: { fill: '#1c1408', fillOpacity: 0.98 },
    labelBgPadding: [4, 8] as [number, number],
    labelBgBorderRadius: 6,
  },
  {
    id: 'e-p4-p2-major',
    source: 'PHASE_4',
    target: 'PHASE_2',
    label: 'major gap',
    type: 'smoothstep',
    sourceHandle: 'right-source',
    targetHandle: 'right-target',
    style: { stroke: '#f87171', strokeWidth: 2, strokeDasharray: '5 4' },
    labelStyle: { fill: '#f87171', fontSize: 11, fontWeight: 700 },
    labelBgStyle: { fill: '#1c0808', fillOpacity: 0.98 },
    labelBgPadding: [4, 8] as [number, number],
    labelBgBorderRadius: 6,
  },
]

// Edges optionnels (pointillés, passages à gauche ou droit)
const optionalEdges: Edge[] = [
  {
    id: 'e-p0-p2-skip',
    source: 'PHASE_0',
    target: 'PHASE_2',
    label: 'scope clear → skip planning',
    type: 'smoothstep',
    sourceHandle: 'left-source',
    targetHandle: 'left-target',
    style: { stroke: '#7c3aed', strokeWidth: 1.5, strokeDasharray: '6 4' },
    labelStyle: { fill: '#a78bfa', fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: '#0d0a1c', fillOpacity: 0.98 },
    labelBgPadding: [3, 6] as [number, number],
    labelBgBorderRadius: 4,
  },
  {
    id: 'e-p4-p5',
    source: 'PHASE_4',
    target: 'PHASE_5',
    label: 'optional',
    type: 'smoothstep',
    style: { stroke: '#475569', strokeWidth: 1.5, strokeDasharray: '6 4' },
    labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: '#0d1117', fillOpacity: 0.98 },
    labelBgPadding: [3, 6] as [number, number],
    labelBgBorderRadius: 4,
  },
  {
    id: 'e-p5-end',
    source: 'PHASE_5',
    target: 'END',
    type: 'smoothstep',
    style: { stroke: '#475569', strokeWidth: 2 },
  },
]

export const initialEdges: Edge[] = [...mainEdges, ...returnEdges, ...optionalEdges]
