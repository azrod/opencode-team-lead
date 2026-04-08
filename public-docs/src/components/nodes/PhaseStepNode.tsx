import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

interface StepData {
  label: string
  sub?: string
  color: string
  nodeType: 'step' | 'escalation'
}

export function PhaseStepNode({ data, selected }: NodeProps) {
  const d = data as unknown as StepData

  if (d.nodeType === 'escalation') {
    return (
      <div
        style={{
          minWidth: 180,
          maxWidth: 220,
          padding: '8px 14px',
          borderRadius: 8,
          background: 'rgba(220,38,38,0.08)',
          border: selected ? '2px solid #dc2626' : '1px solid rgba(220,38,38,0.4)',
          boxShadow: selected ? '0 0 0 3px rgba(220,38,38,0.2)' : 'none',
        }}
      >
        <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#f87171',
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span>⚠</span> {d.label}
        </div>
        {d.sub && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{d.sub}</div>
        )}
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      </div>
    )
  }

  return (
    <div
      style={{
        minWidth: 180,
        maxWidth: 220,
        padding: '8px 14px',
        borderRadius: 8,
        background: `${d.color}18`,
        border: selected ? `2px solid ${d.color}` : `1px solid ${d.color}40`,
        boxShadow: selected ? `0 0 0 3px ${d.color}25` : 'none',
        transition: 'all 0.15s',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#e2e8f0',
          lineHeight: 1.3,
        }}
      >
        {d.label}
      </div>
      {d.sub && (
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, lineHeight: 1.4 }}>{d.sub}</div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  )
}
