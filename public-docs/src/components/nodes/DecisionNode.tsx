import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { getPhaseColor, type AppNode, type NodeData } from '../../data/nodes'

function DecisionNode({ data, selected }: NodeProps<AppNode>) {
  const d = data as NodeData
  const color = getPhaseColor(d.phase)
  const size = 110

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Diamond */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: color,
          borderRadius: 6,
          transform: 'rotate(45deg)',
          boxShadow: selected
            ? `0 0 0 3px ${color}99, 0 4px 12px rgba(0,0,0,0.3)`
            : '0 2px 6px rgba(0,0,0,0.2)',
          border: `2px solid ${selected ? '#ffffffcc' : color}`,
          transition: 'box-shadow 0.15s ease',
        }}
      />
      {/* Label (counter-rotated) */}
      <span
        style={{
          position: 'relative',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.25,
          padding: '0 8px',
          zIndex: 1,
        }}
      >
        {d.label}
      </span>

      <Handle type="target" position={Position.Top} style={{ background: '#fff', opacity: 0.8, top: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#fff', opacity: 0.8, bottom: 0 }} />
      <Handle type="source" position={Position.Left} id="left" style={{ background: '#fff', opacity: 0.8, left: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: '#fff', opacity: 0.8, right: 0 }} />
    </div>
  )
}

export default memo(DecisionNode)
