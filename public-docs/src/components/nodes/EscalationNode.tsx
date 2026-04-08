import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { AppNode, NodeData } from '../../data/nodes'

function EscalationNode({ data, selected }: NodeProps<AppNode>) {
  const d = data as NodeData

  return (
    <div
      style={{
        background: '#fff',
        color: '#dc2626',
        border: `2px solid ${selected ? '#dc2626' : '#fca5a5'}`,
        borderRadius: 8,
        padding: '10px 18px',
        minWidth: 160,
        maxWidth: 220,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        boxShadow: selected
          ? '0 0 0 3px #fca5a566, 0 4px 12px rgba(220,38,38,0.2)'
          : '0 2px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <span>⚠️</span>
      <span>{d.label}</span>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  )
}

export default memo(EscalationNode)
