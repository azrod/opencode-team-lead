import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { getPhaseColor, type AppNode, type NodeData } from '../../data/nodes'

function MemoryNode({ data, selected }: NodeProps<AppNode>) {
  const d = data as NodeData
  const color = getPhaseColor(d.phase)

  return (
    <div
      style={{
        background: color,
        color: '#fff',
        border: `2px solid ${selected ? '#ffffffcc' : color}`,
        borderRadius: 8,
        padding: '10px 18px',
        minWidth: 160,
        maxWidth: 240,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.35,
        boxShadow: selected
          ? `0 0 0 3px ${color}99, 0 4px 12px rgba(0,0,0,0.3)`
          : '0 2px 6px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#fff', opacity: 0.7 }} />
      <span style={{ fontSize: 14 }}>💾</span>
      <span>{d.label}</span>
      <Handle type="source" position={Position.Bottom} style={{ background: '#fff', opacity: 0.7 }} />
    </div>
  )
}

export default memo(MemoryNode)
