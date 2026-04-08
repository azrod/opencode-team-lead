import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

export function TerminalNode({ data }: NodeProps) {
  const d = data as { label: string; variant?: 'start' | 'end' }
  const isEnd = d.variant === 'end'

  return (
    <div
      style={{
        padding: '10px 28px',
        borderRadius: 999,
        background: isEnd ? '#052e16' : '#f0fdf4',
        border: `2px solid ${isEnd ? '#16a34a' : '#166534'}`,
        color: isEnd ? '#4ade80' : '#166534',
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: '0.02em',
        boxShadow: isEnd ? '0 0 20px rgba(74,222,128,0.2)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      {isEnd ? '✓ ' : ''}
      {d.label}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  )
}
