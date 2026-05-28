/**
 * MemoryGame.jsx — Memoria de emojis de cumpleaños.
 * 4×4 grid, 8 pares. Score basado en tiempo + movimientos.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { T, EMOJIS, btnStyle, cardStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import Confetti from '../components/Confetti.jsx'
import BackButton from '../components/BackButton.jsx'
import DancePicker from '../components/DancePicker.jsx'
import { saveMinigameScore } from '../lib/minigames.js'
import { Audio } from '../lib/audio.js'

const CARD_EMOJIS = ['🎂', '🎈', '🎉', '🦄', '🚀', '🌟', '🎁', '🏆']

function shuffled(arr) {
  const a = [...arr, ...arr]  // duplicate for pairs
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
}

function calcScore(moves, seconds) {
  // Max 1000 pts. Penaliza movimientos y tiempo.
  return Math.max(50, 1000 - moves * 25 - seconds * 3)
}

// ── Pantalla de victoria ──────────────────────────────────────────────────────
function MemoryVictory({ moves, seconds, cfg, onReplay, onBack }) {
  const t = T[cfg.style]
  const score = calcScore(moves, seconds)
  const [name, setName]     = useState('')
  const [emoji, setEmoji]   = useState(EMOJIS[0])
  const [dance, setDance]   = useState('bounce')
  const [saved, setSaved]   = useState(false)
  const [loading, setLoad]  = useState(false)

  const p = n => String(n).padStart(2, '0')
  const timeStr = `${p(Math.floor(seconds / 60))}:${p(seconds % 60)}`

  const save = async () => {
    if (!name.trim() || loading) return
    setLoad(true)
    try {
      await saveMinigameScore('memory', { name: name.trim(), emoji, dance, score, moves, seconds })
      setSaved(true)
      Audio.playVictory()
    } finally { setLoad(false) }
  }

  return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 18, padding: '24px 20px',
      fontFamily: t.fB, position: 'relative', overflow: 'hidden',
    }}>
      <BgLayer style={cfg.style} />
      <Confetti active />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ fontSize: 80, animation: 'hero-bounce 1.8s ease-in-out infinite' }}>🧩</div>
        <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(13px,3.5vw,18px)', textAlign: 'center' }}>
          ¡COMPLETASTE LA MEMORIA!
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, width: '100%', justifyContent: 'center' }}>
          {[['🥊', moves, 'MOVIMIENTOS'], ['⏱️', timeStr, 'TIEMPO'], ['⭐', score, 'PUNTOS']].map(([e, v, l]) => (
            <div key={l} style={{ ...cardStyle(t), padding: '12px 16px', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{e}</div>
              <div style={{ fontFamily: t.fH, color: t.a3, fontSize: 'clamp(12px,3.5vw,18px)' }}>{v}</div>
              <div style={{ color: t.fg2, fontSize: 8, fontFamily: t.fH, letterSpacing: 0.5, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        {!saved ? (
          <div style={{ ...cardStyle(t), padding: 20, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          <div style={{ ...cardStyle(t, true), padding: 14, textAlign: 'center', color: t.fg2, fontSize: 'clamp(12px,3vw,15px)' }}>
            ✓ Puntaje guardado 🏆
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onReplay} style={btnStyle(t)}>↺ JUGAR DE NUEVO</button>
          <BackButton t={t} onClick={onBack} label="Salir" />
        </div>
      </div>
    </div>
  )
}

// ── Juego principal ────────────────────────────────────────────────────────────
export default function MemoryGame({ cfg, nav }) {
  const t = T[cfg.style]
  const [phase, setPhase]   = useState('idle')   // idle | playing | won
  const [cards, setCards]   = useState([])
  const [selected, setSel]  = useState([])        // indices of face-up unmatched cards
  const [moves, setMoves]   = useState(0)
  const [seconds, setSecs]  = useState(0)
  const [matches, setMatches] = useState(0)
  const [blocked, setBlocked] = useState(false)   // true while checking a pair
  const timerRef = useRef(null)

  const start = useCallback(() => {
    clearInterval(timerRef.current)
    setCards(shuffled(CARD_EMOJIS))
    setSel([]); setMoves(0); setSecs(0); setMatches(0); setBlocked(false)
    setPhase('playing')
    timerRef.current = setInterval(() => setSecs(s => s + 1), 1000)
  }, [])

  useEffect(() => () => clearInterval(timerRef.current), [])

  // Win condition
  useEffect(() => {
    if (phase === 'playing' && matches === CARD_EMOJIS.length) {
      clearInterval(timerRef.current)
      setPhase('won')
    }
  }, [matches, phase])

  const handleCardTap = useCallback((idx) => {
    if (phase !== 'playing' || blocked) return
    if (cards[idx].flipped || cards[idx].matched) return

    setCards(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], flipped: true }
      return next
    })

    setSel(prev => {
      const next = [...prev, idx]
      if (next.length === 2) {
        setMoves(m => m + 1)
        const [a, b] = next
        if (cards[a].emoji === cards[b].emoji) {
          // Match!
          setTimeout(() => {
            setCards(c => {
              const n = [...c]
              n[a] = { ...n[a], matched: true }
              n[b] = { ...n[b], matched: true }
              return n
            })
            setMatches(m => m + 1)
          }, 300)
        } else {
          // No match — flip back after delay
          setBlocked(true)
          setTimeout(() => {
            setCards(c => {
              const n = [...c]
              n[a] = { ...n[a], flipped: false }
              n[b] = { ...n[b], flipped: false }
              return n
            })
            setBlocked(false)
          }, 900)
        }
        return []
      }
      return next
    })
  }, [phase, blocked, cards])

  const p = n => String(n).padStart(2, '0')
  const timeStr = `${p(Math.floor(seconds / 60))}:${p(seconds % 60)}`
  const pairsLeft = CARD_EMOJIS.length - matches

  if (phase === 'won') {
    return <MemoryVictory moves={moves} seconds={seconds} cfg={cfg} onReplay={start} onBack={() => nav('games')} />
  }

  return (
    <div style={{ background: t.bg, minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: t.fB }}>
      <BgLayer style={cfg.style} />
      <style>{`
        .mem-card { perspective: 600px; }
        .mem-inner {
          position: relative;
          width: 100%; height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.3s ease;
        }
        .mem-inner.flipped { transform: rotateY(180deg); }
        .mem-face, .mem-back {
          position: absolute; inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex; align-items: center; justify-content: center;
          border-radius: inherit;
        }
        .mem-back { transform: rotateY(180deg); }
      `}</style>

      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 16px 100px', maxWidth: 480, margin: '0 auto',
      }}>

        {/* HUD */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <BackButton t={t} onClick={() => nav('games')} />
          {phase === 'playing' && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontFamily: t.fH, color: t.a3, fontSize: 'clamp(10px,3vw,14px)' }}>⏱️ {timeStr}</span>
              <span style={{ fontFamily: t.fH, color: t.fg2, fontSize: 'clamp(9px,2.5vw,12px)' }}>🥊 {moves}</span>
              <span style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(9px,2.5vw,12px)' }}>🧩 {pairsLeft} rest.</span>
            </div>
          )}
        </div>

        {/* Título idle */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(13px,4vw,20px)', marginBottom: 8 }}>
              MEMORIA
            </div>
            <div style={{ color: t.fg2, fontSize: 'clamp(12px,3.2vw,15px)', lineHeight: 1.6, maxWidth: 320 }}>
              Encontrá los 8 pares de emojis.<br />
              ¡Menos movimientos = más puntos!
            </div>
          </div>
        )}

        {/* Grilla 4×4 */}
        {phase === 'playing' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'clamp(6px, 1.8vw, 10px)',
            width: '100%',
            maxWidth: 380,
          }}>
            {cards.map((card, idx) => {
              const isFlipped = card.flipped || card.matched
              return (
                <div
                  key={card.id}
                  className="mem-card"
                  onClick={() => handleCardTap(idx)}
                  style={{
                    aspectRatio: '1 / 1.1',
                    cursor: isFlipped ? 'default' : 'pointer',
                    borderRadius: t.r,
                  }}
                >
                  <div className={`mem-inner${isFlipped ? ' flipped' : ''}`}>
                    {/* Cara oculta */}
                    <div className="mem-face" style={{
                      background: `linear-gradient(135deg,${t.a1}22,${t.a2}18)`,
                      border: `1.5px solid ${t.border}`,
                      borderRadius: t.r,
                      fontSize: 'clamp(18px,5vw,26px)',
                    }}>🎁</div>
                    {/* Cara con emoji */}
                    <div className="mem-back" style={{
                      background: card.matched
                        ? `linear-gradient(135deg,${t.a1}30,${t.a2}20)`
                        : `linear-gradient(135deg,${t.card},rgba(255,255,255,0.04))`,
                      border: `1.5px solid ${card.matched ? t.a1 : t.a2}`,
                      borderRadius: t.r,
                      fontSize: 'clamp(24px,7vw,34px)',
                      boxShadow: card.matched ? `0 0 14px ${t.a1}55` : 'none',
                    }}>{card.emoji}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Start button */}
        {phase === 'idle' && (
          <button onClick={start} style={{ ...btnStyle(t), marginTop: 24, fontSize: 'clamp(12px,3.5vw,15px)', padding: '14px 36px' }}>
            🧩 ¡JUGAR!
          </button>
        )}
      </div>
    </div>
  )
}
