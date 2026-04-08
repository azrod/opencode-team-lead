import { translations, type Lang } from '../translations'

type Props = {
  lang: Lang
  onLangChange: (l: Lang) => void
  onViewWorkflow: () => void
}

export default function IntroScreen({ lang, onLangChange, onViewWorkflow }: Props) {
  const t = translations[lang]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        color: '#f9fafb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '16px 32px',
        }}
      >
        <div style={{ display: 'flex', background: '#1e293b', borderRadius: 8, padding: 3, gap: 2 }}>
          {(['en', 'fr'] as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => onLangChange(l)}
              style={{
                background: lang === l ? '#334155' : 'none',
                border: 'none',
                color: lang === l ? '#f9fafb' : '#64748b',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 12px',
                borderRadius: 6,
                transition: 'all 0.15s',
                textTransform: 'uppercase',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '60px 32px 40px',
          maxWidth: 860,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Badge */}
        <div
          style={{
            background: '#312e81',
            color: '#a5b4fc',
            border: '1px solid #4338ca',
            borderRadius: 20,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          {t.pluginBadge}
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            margin: '0 0 20px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #e0e7ff, #a5b4fc, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.15,
          }}
        >
          {t.title}
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: 18,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 620,
            lineHeight: 1.6,
            margin: '0 0 12px',
          }}
        >
          {t.tagline}
        </p>

        <p
          style={{
            fontSize: 14,
            color: '#64748b',
            textAlign: 'center',
            maxWidth: 520,
            lineHeight: 1.6,
            margin: '0 0 48px',
          }}
        >
          {t.description}
        </p>

        {/* CTA */}
        <button
          onClick={onViewWorkflow}
          style={{
            background: 'linear-gradient(135deg, #4338ca, #6366f1)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '14px 36px',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 72,
            boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.target as HTMLButtonElement
            el.style.transform = 'translateY(-2px)'
            el.style.boxShadow = '0 8px 32px rgba(99,102,241,0.55)'
          }}
          onMouseLeave={e => {
            const el = e.target as HTMLButtonElement
            el.style.transform = 'translateY(0)'
            el.style.boxShadow = '0 4px 24px rgba(99,102,241,0.4)'
          }}
        >
          {t.cta}
        </button>

        {/* Feature grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            width: '100%',
            marginBottom: 56,
          }}
        >
          {t.features.map(f => (
            <div
              key={f.title}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 12,
                padding: '20px 18px',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Agents */}
        <div style={{ width: '100%' }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {t.agents}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            {t.agentList.map(a => (
              <div
                key={a.name}
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <code
                  style={{
                    color: '#818cf8',
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#1e1b4b',
                    padding: '2px 8px',
                    borderRadius: 4,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {a.name}
                </code>
                <span style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>{a.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          padding: '24px 32px',
          color: '#334155',
          fontSize: 12,
        }}
      >
        opencode-team-lead · MIT License
      </div>
    </div>
  )
}
