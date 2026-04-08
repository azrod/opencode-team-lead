import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

interface StepItem {
  icon: string
  text: string
  sub?: string
  type?: 'action' | 'decision' | 'escalation'
}

interface PhaseCardData {
  phase: number | null
  label: string
  sublabel?: string
  color: string
  lightColor: string
  steps: StepItem[]
}

export function PhaseCardNode({ data, selected }: NodeProps) {
  const d = data as unknown as PhaseCardData

  return (
    <div
      style={{
        width: 520,
        borderRadius: 16,
        overflow: 'hidden',
        border: selected ? `2px solid ${d.color}` : '1px solid rgba(255,255,255,0.08)',
        background: '#13111c',
        boxShadow: selected
          ? `0 0 0 4px ${d.color}33, 0 20px 60px rgba(0,0,0,0.5)`
          : '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.2s, border 0.2s',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />

      {/* Header */}
      <div
        style={{
          background: d.color,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {d.phase !== null && (
          <span
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            Phase {d.phase}
          </span>
        )}
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{d.label}</div>
          {d.sublabel && (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>{d.sublabel}</div>
          )}
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {d.steps.map((step: StepItem, i: number) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background:
                step.type === 'decision'
                  ? `${d.color}15`
                  : step.type === 'escalation'
                  ? 'rgba(220,38,38,0.08)'
                  : 'rgba(255,255,255,0.04)',
              border:
                step.type === 'decision'
                  ? `1px solid ${d.color}30`
                  : step.type === 'escalation'
                  ? '1px solid rgba(220,38,38,0.2)'
                  : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>{step.icon}</span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: step.type === 'decision' ? 600 : 500,
                  color: step.type === 'escalation' ? '#f87171' : '#e2e8f0',
                  lineHeight: 1.3,
                }}
              >
                {step.text}
              </div>
              {step.sub && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>
                  {step.sub}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Explore badge */}
      <div
        style={{
          padding: '6px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: `${d.color}99`,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Explore →
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  )
}
