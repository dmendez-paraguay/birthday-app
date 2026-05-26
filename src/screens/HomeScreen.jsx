import { useState, useEffect } from 'react'
import { T, btnStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import TimerBox from '../components/TimerBox.jsx'
import Dragon3D from '../components/Dragon3D.jsx'

function useCountdown(date) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, done: false })
  useEffect(() => {
    const tick = () => {
      const diff = new Date(date) - new Date()
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0, done: true })
      setT({
        d: Math.floor(diff / 864e5),
        h: Math.floor((diff % 864e5) / 36e5),
        m: Math.floor((diff % 36e5) / 6e4),
        s: Math.floor((diff % 6e4) / 1e3),
        done: false,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [date])
  return t
}

export default function HomeScreen({ cfg, nav }) {
  const t = T[cfg.style]
  const time = useCountdown(cfg.date)
  const p = n => String(n).padStart(2, '0')
  const ageLabel = Number(cfg.age) === 1 ? 'AÑO' : 'AÑOS'
  const hasEventInfo = Boolean(cfg.eventTime || cfg.eventPlace || cfg.eventMapUrl)

  return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: t.fB,
    }}>
      <BgLayer style={cfg.style} />
      {/* Dragón 3D autónomo — canvas transparente con z-index 6 */}
      <Dragon3D />
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '36px 20px 110px', gap: 22, width: '100%', maxWidth: 480,
      }}>
        {/* Hero */}
        <div style={{
          fontSize: 'clamp(64px,16vw,88px)',
          animation: 'hero-bounce 2.2s ease-in-out infinite',
          filter: `drop-shadow(0 10px 28px ${t.a1}55)`,
        }}>🎂</div>

        {/* Title */}
        {/* Título: 2 líneas con corte limpio.
            Press Start 2P es muy ancho → 12px mínimo para no desbordar en 360px */}
        <div style={{ textAlign: 'center' }}>
          {cfg.style === 'fiesta' ? (
            <div style={{
              fontFamily: t.fH,
              fontSize: 'clamp(13px,3.8vw,24px)',
              background: `linear-gradient(90deg,${t.a1},${t.a2},${t.a3},${t.a1})`,
              backgroundSize: '300%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'rainbow 4s linear infinite',
              textAlign: 'center', lineHeight: 1.55,
            }}>
              {time.done ? (
                <><div>¡FELIZ CUMPLE</div><div>{cfg.name.toUpperCase()}!</div></>
              ) : (
                <><div>¡{cfg.name.toUpperCase()} CUMPLE</div><div>{cfg.age} {ageLabel}!</div></>
              )}
            </div>
          ) : (
            <div style={{
              fontFamily: t.fH,
              fontSize: 'clamp(12px,3.2vw,22px)',
              color: t.a3, textAlign: 'center', lineHeight: 1.55,
              textShadow: cfg.style === 'arcade' ? `0 0 22px ${t.a3}` : undefined,
            }}>
              {time.done ? (
                <><div>¡FELIZ CUMPLE</div><div>{cfg.name.toUpperCase()}!</div></>
              ) : (
                <><div>¡{cfg.name.toUpperCase()} CUMPLE</div><div>{cfg.age} {ageLabel}!</div></>
              )}
            </div>
          )}
        </div>

        {cfg.welcomeMessage && (
          <div style={{
            color: t.fg, fontSize: 'clamp(13px,3.8vw,18px)',
            lineHeight: 1.45, textAlign: 'center',
            maxWidth: 420, opacity: 0.95,
          }}>
            {cfg.welcomeMessage}
          </div>
        )}

        {/* Countdown or celebration */}
        {!time.done ? (
          <div style={{
            display: 'flex',
            gap: 'clamp(4px, 1.8vw, 10px)',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'center',
            maxWidth: 400,
            // Evita desbordamiento en pantallas pequeñas (≤360px)
            overflow: 'hidden',
          }}>
            {[[p(time.d), 'DÍAS'], [p(time.h), 'HRS'], [p(time.m), 'MIN'], [p(time.s), 'SEG']].map(
              ([v, l], i, a) => (
                <div key={l} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 'clamp(3px, 1.5vw, 8px)',
                  flexShrink: 0,
                }}>
                  <TimerBox val={v} lbl={l} style={cfg.style} />
                  {i < a.length - 1 && (
                    <div style={{
                      color: t.a2,
                      fontSize: 'clamp(16px, 4.5vw, 28px)',
                      marginBottom: 18,
                      animation: 'blink 1s step-end infinite',
                      flexShrink: 0,
                    }}>:</div>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <div style={{
            fontFamily: t.fH, color: t.a2,
            fontSize: 'clamp(13px,3.5vw,20px)',
            animation: 'pulse 1s ease-in-out infinite', textAlign: 'center',
          }}>🎉 ¡HOY ES EL DÍA! 🎉</div>
        )}

        {hasEventInfo && (
          <div style={{
            width: '100%', maxWidth: 390,
            display: 'flex', flexDirection: 'column', gap: 8,
            padding: '14px 16px',
            border: `1px solid ${t.border}`,
            borderRadius: t.r,
            background: t.hi,
            color: t.fg,
            fontSize: 'clamp(13px,3.3vw,16px)',
            lineHeight: 1.45,
          }}>
            {cfg.eventTime && <div>🕕 {cfg.eventTime}</div>}
            {cfg.eventPlace && <div>📍 {cfg.eventPlace}</div>}
            {cfg.eventMapUrl && (
              <a
                href={cfg.eventMapUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: t.a1, textDecoration: 'none', fontWeight: 700 }}
              >
                🗺️ Ver ubicación
              </a>
            )}
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320, marginTop: 8 }}>
          <button onClick={() => nav('games')} style={{ ...btnStyle(t), width: '100%', fontSize: 'clamp(9px,2.5vw,13px)' }}>
            🎮 {cfg.style === 'kawaii' ? '¡Jugar ahora!' : 'JUGAR AHORA'}
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => nav('lb')} style={{ ...btnStyle(t, true), textAlign: 'center' }}>
              🏆 {cfg.style === 'kawaii' ? 'Campeones' : 'CAMPEONES'}
            </button>
            <button onClick={() => nav('rsvp')} style={{ ...btnStyle(t, true), textAlign: 'center' }}>
              📋 {cfg.style === 'kawaii' ? 'Asistencia' : 'ASISTENCIA'}
            </button>
          </div>
        </div>

        {/* Kawaii decorations */}
        {cfg.style === 'kawaii' && ['🌸', '⭐', '💜', '🎀'].map((e, i) => (
          <div key={i} style={{
            position: 'absolute', fontSize: i % 2 ? 24 : 18, opacity: 0.5,
            top: `${15 + i * 18}%`, left: i % 2 ? '8%' : '88%',
            animation: `hero-bounce ${2.5 + i * 0.5}s ${i * 0.4}s ease-in-out infinite`,
            pointerEvents: 'none',
          }}>{e}</div>
        ))}
      </div>
    </div>
  )
}
