import { useState, useEffect } from 'react'
import { T, btnStyle, cardStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import { loadLeaderboard } from '../lib/db.js'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardScreen({ cfg, nav }) {
  const t = T[cfg.style]
  const [lb, setLb] = useState(null)

  useEffect(() => {
    loadLeaderboard().then(setLb)
  }, [])

  return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      fontFamily: t.fB, position: 'relative', overflow: 'hidden',
    }}>
      <BgLayer style={cfg.style} />

      <div style={{ position: 'relative', zIndex: 10, padding: '20px 20px 110px', maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <button onClick={() => nav('home')} style={{ ...btnStyle(t, true), padding: '8px 13px' }}>←</button>
          <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(10px,2.8vw,15px)', flex: 1 }}>
            {cfg.style === 'kawaii' ? '🏆 Mural de Campeones' : '🏆 MURAL DE CAMPEONES'}
          </div>
          <button onClick={() => loadLeaderboard().then(setLb)} style={{ ...btnStyle(t, true), padding: '8px 13px', fontSize: 18 }}>↻</button>
        </div>

        {lb === null && (
          <div style={{ color: t.fg2, textAlign: 'center', padding: 40 }}>Cargando...</div>
        )}

        {lb?.length === 0 && (
          <div style={{
            textAlign: 'center', color: t.fg2, padding: 50,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 56 }}>🎮</div>
            <div style={{ fontFamily: t.fH, fontSize: 'clamp(9px,2.5vw,12px)', lineHeight: 1.8 }}>
              ¡Sé el primero en jugar!
            </div>
          </div>
        )}

        {lb && lb.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lb.map((e, i) => (
              <div key={e.id || i} style={{
                ...cardStyle(t, i === 0),
                padding: '13px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                transform: i === 0 ? 'scale(1.025)' : 'scale(1)',
                border: `1px solid ${
                  i === 0 ? t.a3 : i === 1 ? 'rgba(192,192,192,0.3)' : i === 2 ? 'rgba(205,127,50,0.3)' : t.border
                }`,
                animation: 'appear 0.3s ease-out forwards',
                animationDelay: `${i * 0.05}s`, opacity: 0,
              }}>
                <div style={{
                  fontFamily: t.fH, fontSize: i < 3 ? 22 : 12,
                  width: 32, textAlign: 'center', color: i >= 3 ? t.fg2 : undefined,
                }}>
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </div>
                <div style={{
                  width: 42, height: 42,
                  borderRadius: cfg.style === 'kawaii' ? '50%' : t.r,
                  background: `linear-gradient(135deg,${t.a1}25,${t.a2}25)`,
                  border: `1px solid ${t.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  {e.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: t.fH, color: t.fg, fontSize: 'clamp(9px,2.4vw,13px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.name}
                  </div>
                  {i === 0 && (
                    <div style={{ color: t.a3, fontSize: 'clamp(7px,1.8vw,9px)', marginTop: 3, fontFamily: t.fB }}>
                      👑 LÍDER
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ fontFamily: t.fH, color: i === 0 ? t.a3 : t.a1, fontSize: 'clamp(10px,2.8vw,14px)' }}>
                    {e.score.toLocaleString()}
                  </div>
                  <div style={{ width: 60, height: 3, borderRadius: 2, background: t.border, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      background: `linear-gradient(90deg,${t.a1},${t.a2})`,
                      width: `${(e.score / lb[0].score) * 100}%`,
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button onClick={() => nav('game')} style={btnStyle(t)}>
            🎮 {cfg.style === 'kawaii' ? '¡Jugar!' : 'JUGAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
