import { useCallback, useState, useMemo } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
} from '@xyflow/react'
import type { NodeMouseHandler, NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { initialNodes, type NodeData, type AppNode, getPhaseColor } from '../data/nodes'
import { initialEdges } from '../data/edges'
import { translations, type Lang } from '../translations'
import PhaseNode from './nodes/PhaseNode'
import DecisionNode from './nodes/DecisionNode'
import TerminalNode from './nodes/TerminalNode'
import EscalationNode from './nodes/EscalationNode'
import MemoryNode from './nodes/MemoryNode'
import DetailPanel from './DetailPanel'

const nodeTypes: NodeTypes = {
  phaseNode: PhaseNode,
  decisionNode: DecisionNode,
  terminalNode: TerminalNode,
  escalationNode: EscalationNode,
  memoryNode: MemoryNode,
}

type Props = {
  lang: Lang
  onLangChange: (l: Lang) => void
  onBack: () => void
}

export default function FlowchartView({ lang, onLangChange, onBack }: Props) {
  const t = translations[lang]
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Localise les labels selon la langue
  const localizedNodes = useMemo((): AppNode[] =>
    initialNodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        label: lang === 'fr' ? n.data.labelFr : n.data.label,
      },
    })),
    [lang]
  )

  const [nodes, , onNodesChange] = useNodesState<AppNode>(localizedNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick: NodeMouseHandler<AppNode> = useCallback((_evt, node) => {
    setSelectedNodeId(prev => prev === node.id ? null : node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const legendItems = t.legendItems

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          height: 48,
          background: '#111827',
          borderBottom: '1px solid #1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: '1px solid #374151',
            color: '#9ca3af',
            fontSize: 13,
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: 6,
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.target as HTMLButtonElement
            el.style.color = '#f9fafb'
            el.style.borderColor = '#6b7280'
          }}
          onMouseLeave={e => {
            const el = e.target as HTMLButtonElement
            el.style.color = '#9ca3af'
            el.style.borderColor = '#374151'
          }}
        >
          {t.backButton}
        </button>

        <span style={{ color: '#f9fafb', fontWeight: 700, fontSize: 14 }}>
          {t.flowchartTitle}
        </span>

        {/* Lang toggle */}
        <div
          style={{
            display: 'flex',
            background: '#1f2937',
            borderRadius: 8,
            padding: 2,
            gap: 2,
          }}
        >
          {(['en', 'fr'] as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => onLangChange(l)}
              style={{
                background: lang === l ? '#374151' : 'none',
                border: 'none',
                color: lang === l ? '#f9fafb' : '#6b7280',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '3px 10px',
                borderRadius: 6,
                transition: 'all 0.15s',
                textTransform: 'uppercase',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {/* Flow area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.05}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 2, stroke: '#475569' },
          }}
          style={{ background: '#0f172a' }}
        >
          <Background color="#1f2937" gap={24} variant={BackgroundVariant.Dots} />
          <Controls
            style={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 8,
            }}
          />
          <MiniMap
            style={{
              background: '#111827',
              border: '1px solid #374151',
              borderRadius: 8,
            }}
            nodeColor={(n) => {
              const d = n.data as NodeData
              return getPhaseColor(d.phase)
            }}
            maskColor="rgba(0,0,0,0.5)"
          />
        </ReactFlow>

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: '#111827ee',
            border: '1px solid #1f2937',
            borderRadius: 10,
            padding: '10px 14px',
            zIndex: 5,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
            {t.legend}
          </div>
          {legendItems.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
              <span style={{ color: '#d1d5db', fontSize: 11 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Click hint */}
        {!selectedNodeId && (
          <div
            style={{
              position: 'absolute',
              bottom: 180,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#111827cc',
              color: '#6b7280',
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 20,
              pointerEvents: 'none',
              backdropFilter: 'blur(4px)',
            }}
          >
            {t.detailPlaceholder}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <DetailPanel
        nodeId={selectedNodeId}
        lang={lang}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  )
}
