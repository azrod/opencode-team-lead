import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

interface DecisionData {
  label: string
  color: string
}

export function PhaseDecisionNode({ data, selected }: NodeProps) {
  const d = data as unknown as DecisionData
  const size = 120

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, pointerEvents: 'none', top: 0 }}
      />
      {/* Diamond */}
      <div
        style={{
          width: size * 0.75,
          height: size * 0.75,
          background: `${d.color}22`,
          border: selected ? `2px solid ${d.color}` : `1.5px solid ${d.color}70`,
          transform: 'rotate(45deg)',
          borderRadius: 4,
          boxShadow: selected ? `0 0 0 3px ${d.color}25` : 'none',
          transition: 'all 0.15s',
        }}
      />
      {/* Label — counter-rotated */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: d.color,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {d.label}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, pointerEvents: 'none', bottom: 0 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ opacity: 0, pointerEvents: 'none', left: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ opacity: 0, pointerEvents: 'none', right: 0 }}
      />
    </div>
  )
}
