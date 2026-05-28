/**
 * PinataBash.jsx — Golpeá la piñata lo más rápido posible en 15 segundos.
 * Score = total de golpes. Partículas de caramelos en cada hit.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { T, EMOJIS, btnStyle, cardStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import Confetti from '../components/Confetti.jsx'
import BackButton from '../components/BackButton.jsx'
import DancePicker from '../components/DancePicker.jsx'
import { saveMinigameScore } from '../lib/minigames.js'
import { Audio } from '../lib/audio.js'

const CANDIES = ['🍭', '🍬', '🍫', '🍡', '🍰', '🎊', '✨', '⭐', '🌟', '🎁']
const DURATION = 15

// Piñata visual por etapas de daño
const STAGE_EMOJI = ['🪅', '🪅', '🪅', '🎊']
const STAGE_FILTER = [
  '',
  'brightness(0.82) sepia(0.3)',
  'brightness(0.65) sepia(0.6) saturate(1.4)',
  'brightness(0.4) contrast(1.4)',
]

function useCountdown(seconds) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const p = n => String(n).padStart(2, '0')
  return d > 0 ? `${d}d ${p(h)}h ${p(m)}m` : `${p(h)}:${p(m)}:${p(s)}`
}

// ── Pantalla de fin ────────────────────────────────────────────────────────────
function PinataGameOver({ score, cfg, onReplay, onBack }) {
  const t = T[cfg.style]
  const [name, setName]     = useState('')
  const [emoji, setEmoji]   = useState(EMOJIS[0])
  const [dance, setDance]   = useState('bounce')
  const [saved, setSaved]   = useState(false)
  const [isRec, setIsRec]   = useState(false)
  const [confetti, setConf] = useState(false)
  const [loading, setLoad]  = useState(false)

  const save = async () => {
    if (!name.trim() || loading) return
    setLoad(true)
    try {
      await saveMinigameScore('pinata', { name: name.trim(), emoji, dance, score })
      setIsRec(score >= 60)   // 60+ golpes en 15s = récord impresionante
      setSaved(true)
      if (score >= 60) { setConf(true); Audio.playVictory() }
      else Audio.playChime()
    } finally { setLoad(false) }
  }

  return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 20, padding: '24px 20px',
      fontFamily: t.fB, position: 'relative', overflow: 'hidden',
    }}>
      <BgLayer style={cfg.style} />
      <Confetti active={confetti} />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ fontSize: 80, animation: 'hero-bounce 1.8s ease-in-out infinite' }}>
          {score >= 60 ? '🏆' : '🪅'}
        </div>
        <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(12px,3.5vw,18px)', textAlign: 'center' }}>
          {isRec ? '¡RÉCORD APLASTANTE!' : 'FIN DEL JUEGO'}
        </div>
        <div style={{ fontFamily: t.fH, color: t.a3, fontSize: 'clamp(24px,7vw,42px)', textShadow: cfg.style === 'arcade' ? `0 0 20px ${t.a3}` : 'none' }}>
          {score} <span style={{ fontSize: '0.5em' }}>GOLPES</span>
        </div>
        {!saved ? (
          <div style={{ ...cardStyle(t), padding: 22, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: t.fH, color: t.fg, fontSize: 'clamp(8px,2.2vw,11px)', textAlign: 'center' }}>
              INGRESA TU NOMBRE
            </div>
            <input
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="Tu nombre..." maxLength={20}
              style={{ background: 'transparent', border: `1px solid ${t.border}`, borderRadius: t.r, padding: '10px 14px', color: t.fg, fontFamily: t.fB, fontSize: 16, width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
              {EMOJIS.slice(0, 10).map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  background: emoji === e ? `${t.a1}22` : 'transparent',
                  border: `1px solid ${emoji === e ? t.a1 : t.border}`,
                  borderRadius: t.r, padding: '5px 7px', fontSize: 20, cursor: 'pointer',
                }}>{e}</button>
              ))}
            </div>
            <DancePicker t={t} value={dance} onChange={setDance} previewEmoji={emoji} />
            <button onClick={save} disabled={!name.trim() || loading}
              style={{ ...btnStyle(t), opacity: name.trim() && !loading ? 1 : 0.45, width: '100%' }}>
              {loading ? '...' : '💾 GUARDAR PUNTAJE'}
            </button>
          </div>
        ) : (
          <div style={{ ...cardStyle(t, true), padding: 16, textAlign: 'center', color: t.fg2, fontSize: 'clamp(12px,3vw,15px)' }}>
            ✓ Puntaje guardado 🏆
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={onReplay} style={btnStyle(t)}>↺ DE NUEVO</button>
          <BackButton t={t} onClick={onBack} label="Salir" />
        </div>
      </div>
    </div>
  )
}

// ── Juego principal ────────────────────────────────────────────────────────────
export default function PinataBash({ cfg, nav }) {
  const t = T[cfg.style]
  const [phase, setPhase]       = useState('idle')    // idle | playing | done
  const [score, setScore]       = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [particles, setParticles] = useState([])
  const [hitKey, setHitKey]     = useState(0)
  const scoreRef   = useRef(0)
  const timerRef   = useRef(null)
  const particleId = useRef(0)

  const hitCount = score
  const stage = hitCount < 20 ? 0 : hitCount < 50 ? 1 : hitCount < 80 ? 2 : 3

  const start = useCallback(() => {
    clearInterval(timerRef.current)
    scoreRef.current = 0
    setScore(0); setTimeLeft(DURATION); setParticles([]); setHitKey(0)
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setPhase('done'); return 0 }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => clearInterval(timerRef.current), [])

  const handleHit = useCallback((e) => {
    if (phase !== 'playing') return
    e.preventDefault()
    scoreRef.current += 1
    setScore(scoreRef.current)
    setHitKey(k => k + 1)

    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const touch = e.touches?.[0] ?? e
    const cx = touch.clientX - rect.left
    const cy = touch.clientY - rect.top

    const burst = Array.from({ length: 7 }, (_, i) => {
      const angle = (i / 7) * 360 + Math.random() * 51
      const rad   = (angle * Math.PI) / 180
      const dist  = 30 + Math.random() * 55
      particleId.current += 1
      return {
        id:    particleId.current,
        x:     cx + Math.cos(rad) * dist - 9,
        y:     cy + Math.sin(rad) * dist - 9,
        emoji: CANDIES[Math.floor(Math.random() * CANDIES.length)],
      }
    })

    setParticles(prev => [...prev.slice(-42), ...burst])
    const ids = burst.map(p => p.id)
    setTimeout(() => setParticles(prev => prev.filter(p => !ids.includes(p.id))), 700)
  }, [phase])

  if (phase === 'done') {
    return <PinataGameOver score={scoreRef.current} cfg={cfg} onReplay={start} onBack={() => nav('games')} />
  }

  const progress = Math.min(1, hitCount / 80)
  const pct = Math.round(progress * 100)

  return (
    <div style={{ background: t.bg, minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: t.fB }}>
      <BgLayer style={cfg.style} />
      <style>{`
        @keyframes pinatashake {
          0%,100% { transform: rotate(0deg) scale(1); }
          18%     { transform: rotate(-9deg) scale(1.1); }
          40%     { transform: rotate(9deg) scale(1.12); }
          62%     { transform: rotate(-5deg) scale(1.07); }
          82%     { transform: rotate(3deg) scale(1.04); }
        }
        @keyframes candy-pop {
          0%   { opacity: 1; transform: scale(0.4); }
          35%  { opacity: 1; transform: scale(1.3); }
          100% { opacity: 0; transform: scale(0.7) translateY(-22px); }
        }
        @keyframes rope-sway {
          0%,100% { transform: rotate(-2deg); }
          50%     { transform: rotate(2deg); }
        }
      `}</style>

      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 20px 100px', maxWidth: 480, margin: '0 auto',
      }}>

        {/* HUD */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <BackButton t={t} onClick={() => nav('games')} />
          {phase === 'playing' && (
            <div style={{ fontFamily: t.fH, color: t.a3, fontSize: 'clamp(14px,4vw,22px)' }}>
              {scoreRef.current} 🥊
            </div>
          )}
          <div style={{
            fontFamily: t.fH,
            fontSize: 'clamp(15px,4.5vw,26px)',
            color: phase === 'playing' && timeLeft <= 5 ? '#ff4040' : t.a1,
            animation: phase === 'playing' && timeLeft <= 5 ? 'pulse 0.5s ease-in-out infinite' : 'none',
            minWidth: 48, textAlign: 'right',
          }}>
            {phase === 'playing' ? `${timeLeft}s` : '🪅'}
          </div>
        </div>

        {/* Título idle */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(13px,4vw,20px)', marginBottom: 6 }}>
              PIÑATA BASH
            </div>
            <div style={{ color: t.fg2, fontSize: 'clamp(12px,3.2vw,15px)', lineHeight: 1.6 }}>
              ¡Golpeá la piñata lo más rápido que puedas!<br />
              Tenés <strong style={{ color: t.a1 }}>15 segundos</strong>.
            </div>
          </div>
        )}

        {/* Cuerda + Piñata + Partículas */}
        <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
          {/* Cuerda */}
          <div style={{
            width: 4, height: 52,
            background: `linear-gradient(180deg, ${t.fg2}80, ${t.fg2}30)`,
            borderRadius: 2,
            marginBottom: -6,
            animation: 'rope-sway 3s ease-in-out infinite',
            transformOrigin: 'top center',
          }} />

          {/* Zona de golpe */}
          <div
            key={`shake-${hitKey}`}
            onTouchStart={handleHit}
            onClick={handleHit}
            style={{
              fontSize: 'clamp(90px,24vw,130px)',
              cursor: phase === 'playing' ? 'pointer' : 'default',
              userSelect: 'none', WebkitUserSelect: 'none',
              position: 'relative',
              padding: '10px 20px',
              animation: phase === 'playing'
                ? 'pinatashake 0.14s ease-out'
                : 'rope-sway 3s ease-in-out infinite',
              filter: STAGE_FILTER[stage],
              transition: 'filter 0.3s',
              touchAction: 'none',
            }}
          >
            {STAGE_EMOJI[stage]}

            {/* Partículas */}
            {particles.map(p => (
              <div key={p.id} style={{
                position: 'absolute',
                left: p.x, top: p.y,
                fontSize: 18,
                pointerEvents: 'none',
                animation: 'candy-pop 0.7s ease-out forwards',
                zIndex: 5,
              }}>{p.emoji}</div>
            ))}
          </div>

          {/* +1 flotante */}
          {phase === 'playing' && hitKey > 0 && (
            <div key={hitKey} style={{
              position: 'absolute',
              top: 10,
              fontFamily: t.fH,
              color: '#ffd700',
              fontSize: 'clamp(13px,4vw,18px)',
              animation: 'float-up 0.6s ease-out forwards',
              pointerEvents: 'none',
            }}>+1</div>
          )}
        </div>

        {/* Barra de daño */}
        {phase === 'playing' && (
          <div style={{ width: '100%', maxWidth: 320, marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: t.fH, fontSize: 8, color: t.fg2, letterSpacing: 1 }}>
                DAÑO A LA PIÑATA
              </span>
              <span style={{ fontFamily: t.fH, fontSize: 8, color: pct < 100 ? t.a1 : '#ffd700' }}>
                {pct}%
              </span>
            </div>
            <div style={{ height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.07)', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                borderRadius: 7,
                background: pct < 40
                  ? 'linear-gradient(90deg,#ff6b35,#ffa040)'
                  : pct < 70
                    ? 'linear-gradient(90deg,#ff4040,#ff8040)'
                    : 'linear-gradient(90deg,#ff2020,#ffd700)',
                transition: 'width 0.08s',
                boxShadow: `0 0 10px rgba(255,${pct < 70 ? 100 : 200},0,0.5)`,
              }} />
            </div>
          </div>
        )}

        {/* Instrucción hint */}
        {phase === 'playing' && hitKey === 0 && (
          <div style={{ color: t.fg2, fontSize: 13, marginTop: 16, animation: 'pulse 1s ease-in-out infinite' }}>
            ¡Toca la piñata!
          </div>
        )}

        {/* Start button */}
        {phase === 'idle' && (
          <button onClick={start} style={{ ...btnStyle(t), marginTop: 28, fontSize: 'clamp(12px,3.5vw,15px)', padding: '14px 36px' }}>
            🥊 ¡EMPEZAR!
          </button>
        )}
      </div>

      <style>{`
        @keyframes float-up {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-50px) scale(1.4); }
        }
      `}</style>
    </div>
  )
}
