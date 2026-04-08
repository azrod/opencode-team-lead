import { phaseCards } from '../data/cards'

type Props = {
  nodeId: string | null
  onClose: () => void
}

export default function DetailPanel({ nodeId, onClose }: Props) {
  const card = nodeId ? phaseCards.find(c => c.id === nodeId) ?? null : null
  const isTerminal = nodeId === 'START' || nodeId === 'END'
  const isOpen = card !== null || isTerminal

  return (
    <div
      style={{
        position: 'fixed',
        top: 48,
        right: 0,
        bottom: 0,
        width: isOpen ? 360 : 0,
        background: '#111827',
        borderLeft: '1px solid #1f2937',
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isOpen && (
        <>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px 12px',
              borderBottom: card ? `2px solid ${card.color}` : '1px solid #1f2937',
              flexShrink: 0,
              background: card ? `${card.color}18` : 'transparent',
            }}
          >
            <div>
              {card && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: card.color,
                    marginBottom: 4,
                  }}
                >
                  Phase {card.phase}
                </div>
              )}
              <h3
                style={{
                  margin: 0,
                  color: '#f9fafb',
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1.3,
                }}
              >
                {card ? card.label : nodeId === 'START' ? 'User request' : 'Mission complete'}
              </h3>
              {card?.sublabel && (
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>{card.sublabel}</div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: 18,
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 4,
                lineHeight: 1,
                transition: 'color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => ((e.target as HTMLButtonElement).style.color = '#f9fafb')}
              onMouseLeave={e => ((e.target as HTMLButtonElement).style.color = '#6b7280')}
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              padding: '16px 20px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {card ? (
              card.steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background:
                      step.type === 'decision'
                        ? `${card.color}12`
                        : step.type === 'escalation'
                        ? 'rgba(220,38,38,0.07)'
                        : 'rgba(255,255,255,0.03)',
                    border:
                      step.type === 'decision'
                        ? `1px solid ${card.color}28`
                        : step.type === 'escalation'
                        ? '1px solid rgba(220,38,38,0.18)'
                        : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1.4, flexShrink: 0 }}>{step.icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: step.type === 'decision' ? 600 : 500,
                        color: step.type === 'escalation' ? '#f87171' : '#e2e8f0',
                        lineHeight: 1.35,
                      }}
                    >
                      {step.text}
                    </div>
                    {step.sub && (
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
                        {step.sub}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                {nodeId === 'START'
                  ? 'The workflow starts when the user submits a request to Orion.'
                  : 'All tasks completed. Orion has reported back to the user.'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
