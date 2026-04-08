import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { AppNode, NodeData } from '../../data/nodes'

function TerminalNode({ data, selected }: NodeProps<AppNode>) {
  const d = data as NodeData

  return (
    <div
      style={{
        background: '#f0fdf4',
        color: '#166534',
        border: `2px solid ${selected ? '#166534' : '#bbf7d0'}`,
        borderRadius: 999,
        padding: '10px 24px',
        minWidth: 140,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        boxShadow: selected
          ? '0 0 0 3px #86efac66, 0 4px 12px rgba(0,0,0,0.15)'
          : '0 2px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease',
        userSelect: 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      {d.label}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  )
}

export default memo(TerminalNode)
