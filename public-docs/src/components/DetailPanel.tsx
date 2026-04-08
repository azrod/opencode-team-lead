import type { Lang } from '../translations'
import { nodeDetails } from '../data/details'
import { translations } from '../translations'

type Props = {
  nodeId: string | null
  lang: Lang
  onClose: () => void
}

export default function DetailPanel({ nodeId, lang, onClose }: Props) {
  const t = translations[lang]
  const detail = nodeId ? nodeDetails[nodeId] : null

  return (
    <div
      style={{
        position: 'fixed',
        top: 48,
        right: 0,
        bottom: 0,
        width: detail ? 340 : 0,
        background: '#111827',
        borderLeft: '1px solid #1f2937',
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {detail && (
        <>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px 12px',
              borderBottom: '1px solid #1f2937',
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: '#f9fafb',
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              {detail[lang].title}
            </h3>
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
              }}
              onMouseEnter={e => ((e.target as HTMLButtonElement).style.color = '#f9fafb')}
              onMouseLeave={e => ((e.target as HTMLButtonElement).style.color = '#6b7280')}
              aria-label={t.closePanel}
            >
              {t.closePanel}
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#d1d5db',
                fontSize: 14,
                lineHeight: 1.65,
              }}
            >
              {detail[lang].description}
            </p>

            {/* Node ID chip */}
            <div
              style={{
                marginTop: 24,
                padding: '6px 10px',
                background: '#1f2937',
                borderRadius: 6,
                display: 'inline-block',
              }}
            >
              <code style={{ color: '#6b7280', fontSize: 11 }}>{nodeId}</code>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
