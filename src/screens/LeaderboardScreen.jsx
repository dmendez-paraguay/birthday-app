import { useState, useEffect } from 'react'
import { T, btnStyle, cardStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import BackButton from '../components/BackButton.jsx'
import { loadLeaderboard } from '../lib/db.js'
import { loadShooterLeaderboard } from '../game/firebase.js'

const MEDALS = ['🥇', '🥈', '🥉']

const TABS = [
  { id: 'balloon', label: '🎈 Globos',       labelK: '🎈 Globos'       },
  { id: 'shooter', label: '🚀 Space Blaster', labelK: '🚀 Space Blaster' },
]

export default function LeaderboardScreen({ cfg, nav }) {
  const t = T[cfg.style]
  const isKawaii = cfg.style === 'kawaii'
  const [tab, setTab] = useState('balloon')
  const [lbs, setLbs] = useState({ balloon: null, shooter: null })

  const loadTab = (which) => {
    const loader = which === 'balloon' ? loadLeaderboard : () => loadShooterLeaderboard(20)
    loader().then(data => setLbs(prev => ({ ...prev, [which]: data })))
  }

  useEffect(() => { loadTab('balloon') }, [])
  useEffect(() => {
    if (tab === 'shooter' && lbs.shooter === null) loadTab('shooter')
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const lb = lbs[tab]

  return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      fontFamily: t.fB, position: 'relative', overflow: 'hidden',
    }}>
      <BgLayer style={cfg.style} />

      <div style={{ position: 'relative', zIndex: 10, padding: '20px 20px 110px', maxWidth: 500, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <BackButton t={t} onClick={() => nav('home')} />
          <div style={{
            fontFamily: t.fH, color: t.a1,
            fontSize: 'clamp(10px,2.8vw,15px)', flex: 1,
            textShadow: cfg.style === 'arcade' ? `0 0 12px ${t.a1}` : undefined,
          }}>
            {isKawaii ? '🏆 Mural de Campeones' : '🏆 MURAL DE CAMPEONES'}
          </div>
          <button
            onClick={() => loadTab(tab)}
            style={{ ...btnStyle(t, true), padding: '8px 12px', fontSize: 17 }}
            title="Actualizar"
          >
            ↻
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 18,
          background: t.card,
          border: `1px solid ${t.border}`,
          borderRadius: t.r, padding: 4,
        }}>
          {TABS.map(({ id, label, labelK }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  padding: '9px 6px',
                  fontFamily: t.fH,
                  fontSize: 'clamp(7px,2vw,10px)',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  borderRadius: `calc(${t.r} - 2px)`,
                  border: 'none',
                  background: active
                    ? `linear-gradient(135deg,${t.a1}28,${t.a2}18)`
                    : 'transparent',
                  color: active ? t.a1 : t.fg2,
                  boxShadow: active ? `0 0 10px ${t.a1}30` : 'none',
                  transition: 'all 0.18s',
                }}
              >
                {isKawaii ? labelK : label}
              </button>
            )
          })}
        </div>

        {/* Contenido */}
        {lb === null && (
          <div style={{ color: t.fg2, textAlign: 'center', padding: 40, fontFamily: t.fH, fontSize: 11 }}>
            Cargando...
          </div>
        )}

        {lb?.length === 0 && (
          <div style={{
            textAlign: 'center', color: t.fg2, padding: 50,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 56 }}>{tab === 'balloon' ? '🎈' : '🚀'}</div>
            <div style={{ fontFamily: t.fH, fontSize: 'clamp(9px,2.5vw,12px)', lineHeight: 1.8 }}>
              {isKawaii ? '¡Sé el primero en jugar! 🌟' : '¡SÉ EL PRIMERO EN JUGAR!'}
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
                  i === 0 ? t.a3
                  : i === 1 ? 'rgba(192,192,192,0.3)'
                  : i === 2 ? 'rgba(205,127,50,0.3)'
                  : t.border
                }`,
                animation: 'appear 0.3s ease-out forwards',
                animationDelay: `${i * 0.05}s`,
                opacity: 0,
              }}>
                {/* Posición */}
                <div style={{
                  fontFamily: t.fH, fontSize: i < 3 ? 22 : 12,
                  width: 32, textAlign: 'center', color: i >= 3 ? t.fg2 : undefined,
                }}>
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 42, height: 42,
                  borderRadius: cfg.style === 'kawaii' ? '50%' : t.r,
                  background: `linear-gradient(135deg,${t.a1}25,${t.a2}25)`,
                  border: `1px solid ${t.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, flexShrink: 0,
                }}>
                  {e.emoji}
                </div>

                {/* Nombre */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: t.fH, color: t.fg,
                    fontSize: 'clamp(9px,2.4vw,13px)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {e.name}
                  </div>
                  {i === 0 && (
                    <div style={{ color: t.a3, fontSize: 'clamp(7px,1.8vw,9px)', marginTop: 3, fontFamily: t.fB }}>
                      👑 LÍDER
                    </div>
                  )}
                  {/* Badge de nivel para shooter */}
                  {tab === 'shooter' && e.level && (
                    <div style={{
                      display: 'inline-block',
                      fontSize: 'clamp(7px,1.8vw,9px)',
                      fontFamily: t.fB, marginTop: 2,
                      color: '#00d4ff',
                      background: 'rgba(0,212,255,0.1)',
                      border: '1px solid rgba(0,212,255,0.25)',
                      borderRadius: 4, padding: '1px 6px',
                    }}>
                      Sector {e.level}
                    </div>
                  )}
                </div>

                {/* Score */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{
                    fontFamily: t.fH,
                    color: i === 0 ? t.a3 : t.a1,
                    fontSize: 'clamp(10px,2.8vw,14px)',
                  }}>
                    {e.score.toLocaleString()}
                  </div>
                  <div style={{
                    width: 60, height: 3, borderRadius: 2,
                    background: t.border, overflow: 'hidden',
                  }}>
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

        {/* Jugar */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button onClick={() => nav(tab === 'balloon' ? 'game' : 'shooter')} style={btnStyle(t)}>
            {tab === 'balloon'
              ? (isKawaii ? '🎈 ¡Jugar Globos!' : '🎈 JUGAR GLOBOS')
              : (isKawaii ? '🚀 ¡Jugar Shooter!' : '🚀 JUGAR SHOOTER')}
          </button>
        </div>
      </div>
    </div>
  )
}
