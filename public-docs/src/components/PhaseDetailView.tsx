import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react'
import type { NodeTypes } from '@xyflow/react'

import { PhaseStepNode } from './nodes/PhaseStepNode'
import { PhaseDecisionNode } from './nodes/PhaseDecisionNode'
import { TerminalNode } from './nodes/TerminalNode'
import { getPhaseDetailData } from '../data/phaseDetails'
import { layoutPhaseNodes } from '../layout/phaseLayout'
import type { Lang } from '../translations'

interface Props {
  phaseId: string
  onBack: () => void
  lang: Lang
}

const nodeTypes: NodeTypes = {
  phaseStep: PhaseStepNode,
  phaseDecision: PhaseDecisionNode,
  terminal: TerminalNode,
}

const edgeLabelProps = {
  labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 600 },
  labelBgStyle: { fill: '#1e293b', fillOpacity: 0.95 },
  labelBgPadding: [4, 6] as [number, number],
  labelBgBorderRadius: 4,
}

const PHASE_NAMES: Record<string, string> = {
  PHASE_0: 'Brainstorm',
  PHASE_1: 'Plan',
  PHASE_2: 'Delegate',
  PHASE_3: 'Review',
  PHASE_4: 'Synthesize',
  PHASE_5: 'Maintenance',
}

const PHASE_NUMS: Record<string, number> = {
  PHASE_0: 0,
  PHASE_1: 1,
  PHASE_2: 2,
  PHASE_3: 3,
  PHASE_4: 4,
  PHASE_5: 5,
}

export function PhaseDetailView({ phaseId, onBack }: Props) {
  const detail = getPhaseDetailData(phaseId)

  const styledEdges = useMemo(
    () =>
      detail.edges.map(e => ({
        ...e,
        type: 'smoothstep',
        style: {
          stroke: '#334155',
          strokeWidth: 1.5,
          ...(e.style || {}),
        },
        ...(e.label ? edgeLabelProps : {}),
      })),
    [detail],
  )

  const layoutedNodes = useMemo(
    () => layoutPhaseNodes(detail.nodes, detail.edges),
    [detail],
  )

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes)
  const [edges, , onEdgesChange] = useEdgesState(styledEdges)

  const phaseNum = PHASE_NUMS[phaseId]
  const phaseName = PHASE_NAMES[phaseId]

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0d0d14',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 20px',
          background: '#13111c',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          height: 48,
          boxSizing: 'border-box',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.color = '#f1f5f9'
            el.style.borderColor = 'rgba(255,255,255,0.25)'
            el.style.background = 'rgba(255,255,255,0.08)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.color = '#94a3b8'
            el.style.borderColor = 'rgba(255,255,255,0.1)'
            el.style.background = 'rgba(255,255,255,0.05)'
          }}
        >
          ← Overview
        </button>

        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#475569',
            fontSize: 13,
          }}
        >
          <span>Workflow</span>
          <span style={{ color: '#334155' }}>/</span>
          <span style={{ color: detail.color, fontWeight: 600 }}>
            Phase {phaseNum} — {phaseName}
          </span>
        </div>
      </div>

      {/* ReactFlow canvas */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={2}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          style={{ background: '#0d0d14' }}
        >
          <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={24} size={1} />
          <Controls
            style={{
              background: '#13111c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
            }}
          />
          <MiniMap
            style={{
              background: '#13111c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
            }}
            nodeColor={n => {
              if (n.type === 'phaseDecision') return detail.color
              if (n.type === 'phaseStep') return `${detail.color}80`
              return '#334155'
            }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
