import type { Edge } from '@xyflow/react';

// Helpers
const arrow = (color: string, size = 18) => ({
  markerEnd: { type: 'arrowclosed' as const, color, width: size, height: size },
});

export const initialEdges: Edge[] = [
  // START → PHASE_0
  {
    id: 'e-start-p0',
    source: 'START', target: 'PHASE_0',
    type: 'smoothstep',
    style: { stroke: '#7c3aed', strokeWidth: 3 },
    ...arrow('#7c3aed'),
  },

  // PHASE_0 → PHASE_1 (horizontal, même rangée — droite vers droite)
  {
    id: 'e-p0-p1',
    source: 'PHASE_0', target: 'PHASE_1',
    sourceHandle: 'right-source',
    targetHandle: 'left-target',
    type: 'smoothstep',
    label: 'or start here →',
    style: { stroke: '#6366f1', strokeWidth: 2.5 },
    ...arrow('#6366f1'),
    labelStyle: { fill: '#818cf8', fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: '#0f0f1a', fillOpacity: 0.95 },
    labelBgPadding: [3, 8] as [number, number],
    labelBgBorderRadius: 5,
  },

  // PHASE_1 → PHASE_2 (descend de droite vers gauche — serpent)
  {
    id: 'e-p1-p2',
    source: 'PHASE_1', target: 'PHASE_2',
    sourceHandle: 'bottom',
    targetHandle: 'right-target',
    type: 'smoothstep',
    style: { stroke: '#22c55e', strokeWidth: 3 },
    ...arrow('#22c55e'),
  },

  // PHASE_2 → PHASE_3 (horizontal, même rangée — "agent succeeded")
  {
    id: 'e-p2-p3',
    source: 'PHASE_2', target: 'PHASE_3',
    sourceHandle: 'right-source',
    targetHandle: 'left-target',
    type: 'smoothstep',
    label: 'agent succeeded',
    style: { stroke: '#22c55e', strokeWidth: 3 },
    ...arrow('#22c55e'),
    labelStyle: { fill: '#4ade80', fontSize: 11, fontWeight: 700 },
    labelBgStyle: { fill: '#052e16', fillOpacity: 0.98 },
    labelBgPadding: [4, 8] as [number, number],
    labelBgBorderRadius: 5,
  },

  // PHASE_3 → PHASE_2 CHANGES_REQUESTED (retour horizontal, même rangée)
  {
    id: 'e-p3-p2-changes',
    source: 'PHASE_3', target: 'PHASE_2',
    sourceHandle: 'left-source',
    targetHandle: 'right-target',
    type: 'smoothstep',
    label: 'CHANGES_REQUESTED',
    style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '8 4' },
    ...arrow('#f59e0b', 14),
    labelStyle: { fill: '#fbbf24', fontSize: 10, fontWeight: 700 },
    labelBgStyle: { fill: '#1a1000', fillOpacity: 0.98 },
    labelBgPadding: [3, 8] as [number, number],
    labelBgBorderRadius: 5,
  },

  // PHASE_3 → PHASE_4 APPROVED (descend de droite vers gauche — serpent)
  {
    id: 'e-p3-p4',
    source: 'PHASE_3', target: 'PHASE_4',
    sourceHandle: 'bottom',
    targetHandle: 'right-target',
    type: 'smoothstep',
    label: 'APPROVED',
    style: { stroke: '#4ade80', strokeWidth: 3 },
    ...arrow('#4ade80'),
    labelStyle: { fill: '#4ade80', fontSize: 12, fontWeight: 800 },
    labelBgStyle: { fill: '#052e16', fillOpacity: 0.98 },
    labelBgPadding: [4, 10] as [number, number],
    labelBgBorderRadius: 6,
  },

  // PHASE_4 → PHASE_5 (horizontal, optionnel dashed)
  {
    id: 'e-p4-p5',
    source: 'PHASE_4', target: 'PHASE_5',
    sourceHandle: 'right-source',
    targetHandle: 'left-target',
    type: 'smoothstep',
    label: 'optional',
    style: { stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '6 4' },
    ...arrow('#64748b', 14),
    labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: '#0d1117', fillOpacity: 0.98 },
    labelBgPadding: [3, 6] as [number, number],
    labelBgBorderRadius: 4,
  },

  // PHASE_4 → END (vertical bas)
  {
    id: 'e-p4-end',
    source: 'PHASE_4', target: 'END',
    type: 'smoothstep',
    style: { stroke: '#4ade80', strokeWidth: 3 },
    ...arrow('#4ade80'),
  },

  // PHASE_5 → END (optionnel dashed, descend de droite vers bas-gauche)
  {
    id: 'e-p5-end',
    source: 'PHASE_5', target: 'END',
    sourceHandle: 'bottom',
    targetHandle: 'right-target',
    type: 'smoothstep',
    style: { stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '6 4' },
    ...arrow('#64748b', 14),
  },
];
