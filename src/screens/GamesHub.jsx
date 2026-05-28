/**
 * GamesHub.jsx — Hub selector de mini-juegos.
 * Los 2 juegos nuevos están bloqueados hasta cfg.date (día del evento).
 * 4 toques rápidos sobre el botón 📷 en NavBar = desbloqueo admin (mismo mecanismo).
 */
import { useState, useEffect, useRef } from 'react'
import { T, btnStyle, cardStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import BackButton from '../components/BackButton.jsx'

const GAMES_FREE = [
  {
    id: 'game',
    emoji: '🎈',
    title: 'GLOBOS',
    titleK: 'Globos',
    desc: '¡Revienta globos en 30 segundos! Cuanto más pequeño, más puntos.',
    color: '#ff6b9d',
  },
  {
    id: 'shooter',
    emoji: '🚀',
    title: 'SPACE BLASTER',
    titleK: 'Space Blaster',
    desc: 'Disparo automático. Destruí el boss antes de quedarte sin vidas.',
    color: '#00d4ff',
  },
]

const GAMES_LOCKED = [
  {
    id: 'pinata',
    emoji: '🪅',
    title: 'PIÑATA BASH',
    titleK: 'Piñata Bash',
    desc: '¡Golpeá la piñata lo más rápido que puedas en 15 segundos!',
    color: '#ff9f43',
    teaser: '15 segundos · partículas · caramelos',
  },
  {
    id: 'memory',
    emoji: '🧩',
    title: 'MEMORIA',
    titleK: 'Memoria',
    desc: 'Encontrá los 8 pares de emojis. Menos movimientos = más puntos.',
    color: '#a29bfe',
    teaser: '16 cartas · flip animations · tiempo',
  },
]

function useSecondsLeft(date) {
  const [s, setS] = useState(() => Math.max(0, Math.floor((new Date(date) - new Date()) / 1000)))
  useEffect(() => {
    if (!date) return
    const id = setInterval(() => {
      setS(Math.max(0, Math.floor((new Date(date) - new Date()) / 1000)))
    }, 1000)
    return () => clearInterval(id)
  }, [date])
  return s
}

function fmtCountdown(s) {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const p = n => String(n).padStart(2, '0')
  return d > 0
    ? `${d}d ${p(h)}h ${p(m)}m ${p(ss)}s`
    : `${p(h)}:${p(m)}:${p(ss)}`
}

export default function GamesHub({ cfg, nav }) {
  const t = T[cfg.style]
  const isKawaii = cfg.style === 'kawaii'
  const secsLeft = useSecondsLeft(cfg.date)
  const isLocked = secsLeft > 0

  // 5-tap admin unlock por card — persiste en sessionStorage
  const [adminUnlocked, setAdminUnlocked] = useState(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem('games_admin_unlock') || '[]'))
    } catch { return new Set() }
  })
  const tapTimesRef = useRef({})   // { [gameId]: [timestamps] }

  const handleLockedTap = (gameId) => {
    const now = Date.now()
    const prev = (tapTimesRef.current[gameId] || []).filter(t => now - t < 2000)
    const next = [...prev, now]
    tapTimesRef.current[gameId] = next
    if (next.length >= 5) {
      tapTimesRef.current[gameId] = []
      setAdminUnlocked(s => {
        const updated = new Set([...s, gameId])
        sessionStorage.setItem('games_admin_unlock', JSON.stringify([...updated]))
        return updated
      })
    }
  }

  return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      position: 'relative', overflow: 'hidden', fontFamily: t.fB,
    }}>
      <BgLayer style={cfg.style} />
      <style>{`
        @keyframes lock-pulse {
          0%,100% { box-shadow: 0 0 0 1px rgba(255,215,0,0.15), 0 0 16px rgba(255,215,0,0.06); }
          50%      { box-shadow: 0 0 0 1px rgba(255,215,0,0.5),  0 0 28px rgba(255,215,0,0.18); }
        }
        @keyframes chain-sway {
          0%,100% { transform: rotate(-3deg); }
          50%      { transform: rotate(3deg); }
        }
      `}</style>

      <div style={{
        position: 'relative', zIndex: 10,
        padding: '24px 20px 110px', maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <BackButton t={t} onClick={() => nav('home')} />
          <div style={{
            fontFamily: t.fH, color: t.a1,
            fontSize: 'clamp(11px,3vw,16px)', flex: 1,
            textShadow: cfg.style === 'arcade' ? `0 0 14px ${t.a1}` : undefined,
          }}>
            {isKawaii ? '🎮 Mini Juegos' : '🎮 MINI JUEGOS'}
          </div>
        </div>

        <div style={{ color: t.fg2, fontSize: 'clamp(12px,3vw,15px)', marginBottom: 22, lineHeight: 1.5 }}>
          {isKawaii ? '¡Elegí tu juego favorito y a ganar! 🌟' : 'Elegí un juego y subí al mural de campeones.'}
        </div>

        {/* ── Juegos disponibles ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {GAMES_FREE.map(g => (
            <div
              key={g.id}
              style={{
                ...cardStyle(t),
                padding: '20px 18px',
                display: 'flex', gap: 16, alignItems: 'center',
                border: `1px solid ${g.color}33`,
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onClick={() => nav(g.id)}
            >
              <div style={{
                width: 64, height: 64,
                borderRadius: isKawaii ? '50%' : t.r,
                background: `linear-gradient(135deg, ${g.color}22, ${g.color}08)`,
                border: `1px solid ${g.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, flexShrink: 0,
                boxShadow: `0 0 18px ${g.color}22`,
              }}>{g.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: t.fH, color: g.color,
                  fontSize: 'clamp(10px,2.8vw,14px)', marginBottom: 6,
                  textShadow: cfg.style === 'arcade' ? `0 0 10px ${g.color}` : undefined,
                }}>{isKawaii ? g.titleK : g.title}</div>
                <div style={{ color: t.fg2, fontSize: 'clamp(11px,2.8vw,13px)', lineHeight: 1.45 }}>{g.desc}</div>
              </div>
              <div style={{ color: g.color, fontSize: 20, opacity: 0.7, flexShrink: 0 }}>›</div>
            </div>
          ))}
        </div>

        {/* ── Separador "próximamente" ── */}
        {isLocked && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)' }} />
            <div style={{
              fontFamily: t.fH,
              fontSize: 'clamp(6px,1.7vw,8px)',
              color: 'rgba(255,215,0,0.7)',
              letterSpacing: '0.5px',
              textAlign: 'center',
              lineHeight: 1.6,
            }}>
              🔒 DÍA DEL EVENTO
            </div>
            <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)' }} />
          </div>
        )}

        {/* ── Juegos bloqueados / desbloqueados ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {GAMES_LOCKED.map(g => {
            const cardLocked = isLocked && !adminUnlocked.has(g.id)
            return (
            <div
              key={g.id}
              onClick={() => {
                if (cardLocked) { handleLockedTap(g.id); return }
                nav(g.id)
              }}
              style={{
                position: 'relative',
                ...cardStyle(t),
                padding: '20px 18px',
                display: 'flex', gap: 16, alignItems: 'center',
                border: `1px solid ${cardLocked ? 'rgba(255,215,0,0.18)' : g.color + '33'}`,
                cursor: 'pointer',
                transition: 'all 0.18s',
                animation: cardLocked ? 'lock-pulse 2.5s ease-in-out infinite' : 'none',
                overflow: 'hidden',
              }}
            >
              {/* Contenido real (visible debajo del overlay) */}
              <div style={{
                width: 64, height: 64,
                borderRadius: isKawaii ? '50%' : t.r,
                background: `linear-gradient(135deg, ${g.color}22, ${g.color}08)`,
                border: `1px solid ${g.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, flexShrink: 0,
                filter: cardLocked ? 'grayscale(0.5) brightness(0.6)' : 'none',
                transition: 'filter 0.3s',
              }}>{g.emoji}</div>
              <div style={{ flex: 1, minWidth: 0, filter: cardLocked ? 'grayscale(0.3) brightness(0.6)' : 'none', transition: 'filter 0.3s' }}>
                <div style={{
                  fontFamily: t.fH, color: cardLocked ? t.fg2 : g.color,
                  fontSize: 'clamp(10px,2.8vw,14px)', marginBottom: 6,
                }}>{isKawaii ? g.titleK : g.title}</div>
                <div style={{ color: t.fg2, fontSize: 'clamp(11px,2.8vw,13px)', lineHeight: 1.45 }}>{g.desc}</div>
                {!cardLocked && (
                  <div style={{ color: g.color, fontSize: 10, marginTop: 4, opacity: 0.7 }}>{g.teaser}</div>
                )}
              </div>
              {!cardLocked && <div style={{ color: g.color, fontSize: 20, opacity: 0.7, flexShrink: 0 }}>›</div>}

              {/* ── Overlay bloqueado ── */}
              {cardLocked && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(5,3,20,0.78)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: 16,
                  borderRadius: 'inherit',
                }}>
                  {/* Cadena + candado */}
                  <div style={{
                    fontSize: 32,
                    animation: 'chain-sway 3s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))',
                  }}>🔒</div>

                  <div style={{
                    fontFamily: t.fH, fontSize: 8,
                    color: '#ffd700', letterSpacing: 1.5,
                    textShadow: '0 0 10px rgba(255,215,0,0.6)',
                  }}>⛓️ {isKawaii ? g.titleK : g.title} ⛓️</div>

                  <div style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 9, color: 'rgba(255,255,255,0.5)',
                    letterSpacing: 0.5,
                  }}>SE DESBLOQUEA EN</div>

                  <div style={{
                    fontFamily: t.fH,
                    fontSize: 'clamp(10px,3vw,13px)',
                    color: '#fff',
                    letterSpacing: 1,
                    textShadow: '0 0 12px rgba(255,215,0,0.4)',
                  }}>{fmtCountdown(secsLeft)}</div>

                  <div style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 8, color: 'rgba(255,215,0,0.6)',
                    marginTop: 2,
                  }}>{g.teaser}</div>
                </div>
              )}
            </div>
          )})}
        </div>

        {/* Acceso al ranking */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <button onClick={() => nav('lb')} style={{ ...btnStyle(t, true), width: '100%', fontSize: 'clamp(9px,2.5vw,12px)' }}>
            🏆 {isKawaii ? 'Ver el mural de campeones' : 'VER MURAL DE CAMPEONES'}
          </button>
        </div>
      </div>
    </div>
  )
}
