import { useState } from 'react'
import { T, EMOJIS, btnStyle, cardStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import Confetti from '../components/Confetti.jsx'
import { addScore, loadLeaderboard } from '../lib/db.js'
import { Audio } from '../lib/audio.js'

export default function GameOver({ score, cfg, onReplay, onBack }) {
  const t = T[cfg.style]
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [saved, setSaved] = useState(false)
  const [isRecord, setIsRecord] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [loading, setLoading] = useState(false)

  const saveScore = async () => {
    if (!name.trim() || loading) return
    setLoading(true)
    try {
      const lb = await loadLeaderboard()
      const topScore = lb[0]?.score ?? 0
      const entry = {
        name: name.trim(),
        emoji,
        score,
        date: new Date().toLocaleDateString('es'),
      }
      await addScore(entry)
      const rec = score >= topScore || lb.length === 0
      setIsRecord(rec)
      setSaved(true)
      if (rec) { setConfetti(true); Audio.playVictory() }
      else Audio.playChime()
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    background: 'transparent', border: `1px solid ${t.border}`,
    borderRadius: t.r, padding: '10px 14px',
    color: t.fg, fontFamily: t.fB, fontSize: 16,
    width: '100%', textAlign: 'center',
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
        <div style={{ fontSize: 72, animation: 'hero-bounce 1.8s ease-in-out infinite' }}>
          {isRecord ? '🏆' : '🎮'}
        </div>

        <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(12px,3.5vw,18px)', textAlign: 'center' }}>
          {isRecord ? '¡NUEVO RÉCORD!' : 'FIN DEL JUEGO'}
        </div>

        <div style={{
          fontFamily: t.fH, color: t.a3,
          fontSize: 'clamp(22px,6vw,38px)',
          textShadow: cfg.style === 'arcade' ? `0 0 20px ${t.a3}` : 'none',
        }}>
          {score.toLocaleString()} <span style={{ fontSize: '0.5em' }}>PTS</span>
        </div>

        {!saved ? (
          <div style={{ ...cardStyle(t), padding: 22, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: t.fH, color: t.fg, fontSize: 'clamp(8px,2.2vw,11px)', textAlign: 'center' }}>
              INGRESA TU NOMBRE
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveScore()}
              placeholder="Tu nombre..."
              maxLength={20}
              style={inp}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
              {EMOJIS.slice(0, 10).map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  background: emoji === e ? `${t.a1}22` : 'transparent',
                  border: `1px solid ${emoji === e ? t.a1 : t.border}`,
                  borderRadius: t.r, padding: '5px 7px', fontSize: 20, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>{e}</button>
              ))}
            </div>
            <button
              onClick={saveScore}
              disabled={!name.trim() || loading}
              style={{ ...btnStyle(t), opacity: name.trim() && !loading ? 1 : 0.45, width: '100%' }}
            >
              {loading ? '...' : cfg.style === 'kawaii' ? '💾 ¡Guardar puntaje!' : 'GUARDAR PUNTAJE'}
            </button>
          </div>
        ) : (
          <div style={{ ...cardStyle(t, true), padding: 16, textAlign: 'center', color: t.fg2, fontSize: 'clamp(12px,3vw,15px)' }}>
            ✓ Puntaje guardado en el mural 🏆
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={onReplay} style={btnStyle(t)}>
            {cfg.style === 'kawaii' ? '🔄 ¡Otra vez!' : '↺ JUGAR DE NUEVO'}
          </button>
          <button onClick={onBack} style={btnStyle(t, true)}>
            {cfg.style === 'kawaii' ? '🏠 Salir' : '← SALIR'}
          </button>
        </div>
      </div>
    </div>
  )
}
