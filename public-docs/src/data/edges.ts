import type { Edge } from '@xyflow/react'

const edgeStyle = {
  stroke: '#334155',
  strokeWidth: 2,
}

const labelProps = {
  labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 },
  labelBgStyle: { fill: '#1e293b', fillOpacity: 0.95 },
  labelBgPadding: [4, 8] as [number, number],
  labelBgBorderRadius: 6,
}

export const initialEdges: Edge[] = [
  {
    id: 'e-start-p0',
    source: 'START',
    target: 'PHASE_0',
    type: 'smoothstep',
    style: edgeStyle,
  },
  {
    id: 'e-p0-p1',
    source: 'PHASE_0',
    target: 'PHASE_1',
    type: 'smoothstep',
    style: edgeStyle,
  },
  {
    id: 'e-p0-p2-skip',
    source: 'PHASE_0',
    target: 'PHASE_2',
    type: 'smoothstep',
    label: 'scope clear → skip planning',
    style: { ...edgeStyle, strokeDasharray: '6 3', stroke: '#6d28d9' },
    ...labelProps,
  },
  {
    id: 'e-p1-p2',
    source: 'PHASE_1',
    target: 'PHASE_2',
    type: 'smoothstep',
    style: edgeStyle,
  },
  {
    id: 'e-p2-p3',
    source: 'PHASE_2',
    target: 'PHASE_3',
    type: 'smoothstep',
    label: 'agent succeeded',
    style: { ...edgeStyle, stroke: '#15803d' },
    ...labelProps,
  },
  {
    id: 'e-p3-p4',
    source: 'PHASE_3',
    target: 'PHASE_4',
    label: 'APPROVED',
    type: 'smoothstep',
    style: { ...edgeStyle, stroke: '#16a34a' },
    ...labelProps,
  },
  {
    id: 'e-p3-p2-fix',
    source: 'PHASE_3',
    target: 'PHASE_2',
    label: 'CHANGES_REQUESTED',
    type: 'smoothstep',
    style: { ...edgeStyle, stroke: '#f59e0b' },
    ...labelProps,
  },
  {
    id: 'e-p4-p2-major',
    source: 'PHASE_4',
    target: 'PHASE_2',
    label: 'major gap',
    type: 'smoothstep',
    style: { ...edgeStyle, stroke: '#dc2626', strokeDasharray: '4 3' },
    ...labelProps,
  },
  {
    id: 'e-p4-p5',
    source: 'PHASE_4',
    target: 'PHASE_5',
    label: 'optional',
    type: 'smoothstep',
    style: { ...edgeStyle, strokeDasharray: '6 3' },
    ...labelProps,
  },
  {
    id: 'e-p4-end',
    source: 'PHASE_4',
    target: 'END',
    type: 'smoothstep',
    style: { ...edgeStyle, stroke: '#16a34a' },
  },
  {
    id: 'e-p5-end',
    source: 'PHASE_5',
    target: 'END',
    type: 'smoothstep',
    style: edgeStyle,
  },
]
