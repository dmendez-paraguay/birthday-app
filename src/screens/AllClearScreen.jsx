/**
 * AllClearScreen.jsx — Pantalla final cuando el jugador vence todos los sectores.
 */
import { useState, useEffect } from 'react'
import { T, btnStyle } from '../themes.js'
import { saveShooterScore } from '../game/firebase.js'
import { LEVELS } from '../game/constants.js'
import { ShooterAudio } from '../game/audio.js'
import DancePicker from '../components/DancePicker.jsx'

// 20 confetti particles with varied colors
const CONFETTI_COLORS = [
  '#00d4ff', '#ff006e', '#ffd700', '#00ff78', '#ff9500',
  '#c44dff', '#ff5e5e', '#4daaff', '#ff6eb4', '#4dff91',
  '#ff6b9d', '#a855f7', '#ffd700', '#00d4ff', '#ff006e',
  '#4dffee', '#ffb347', '#7c3aed', '#00ffc8', '#ff0080',
]

function AnimatedScore({ target }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (target === 0) return
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayed(target)
        clearInterval(interval)
      } else {
        setDisplayed(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [target])

  return (
    <div style={{
      fontFamily: "'Press Start 2P',monospace",
      fontSize: 'clamp(22px,7vw,38px)',
      color: '#ffd700',
      textShadow: '0 0 30px #ffd700, 0 0 60px #ffd70088',
      animation: 'pulse 1.5s ease-in-out infinite',
      letterSpacing: 2,
    }}>
      {String(displayed).padStart(6, '0')}
    </div>
  )
}

export default function AllClearScreen({ score, maxLevels = 5, name = '', nav, onReplay }) {
  const t = T.arcade
  const [playerName, setPlayerName] = useState('')
  const [emoji, setEmoji] = useState('🏆')
  const [dance, setDance] = useState('spin')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Tocar Feliz Cumpleaños al entrar
  useEffect(() => {
    ShooterAudio.init()
    ShooterAudio.happyBirthday()
  }, [])

  const handleSave = async () => {
    if (!playerName.trim()) return
    setSaving(true)
    setError('')
    try {
      await saveShooterScore({ name: playerName.trim(), emoji, dance, score, level: maxLevels })
      setSaved(true)
    } catch (e) {
      setError('Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%, #0d0d2a 0%, #020210 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      fontFamily: t.fB,
    }}>
      {/* Confetti particles */}
      {CONFETTI_COLORS.map((color, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '-10px',
          left: `${(i * 127.3) % 100}%`,
          width: `${6 + (i % 6)}px`,
          height: `${10 + (i % 8)}px`,
          background: color,
          borderRadius: i % 3 === 0 ? '50%' : '2px',
          animation: `conffall ${2.5 + (i % 3) * 0.8}s ${(i * 0.25) % 3}s linear infinite`,
          opacity: 0.85,
          zIndex: 5,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Stars background */}
      {Array.from({ length: 50 }, (_, i) => (
        <div key={`star-${i}`} style={{
          position: 'absolute',
          left: `${(i * 137.5) % 100}%`,
          top: `${(i * 97.3) % 100}%`,
          width: 1 + (i % 2),
          height: 1 + (i % 2),
          background: '#fff',
          borderRadius: '50%',
          opacity: 0.6,
          animation: `twinkle ${2 + (i % 3)}s ease-in-out ${(i * 0.3) % 2}s infinite alternate`,
          zIndex: 1,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 420,
        padding: '32px 24px 40px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 20,
        overflowY: 'auto', maxHeight: '100vh',
      }}>

        {/* Boss emojis row — all defeated */}
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {LEVELS.slice(0, maxLevels).map((lvl, i) => (
            <div key={i} style={{
              position: 'relative',
              animation: `appear 0.4s ease-out ${i * 0.12}s both`,
            }}>
              <div style={{
                fontSize: 'clamp(28px,8vw,40px)',
                filter: 'grayscale(0.5) drop-shadow(0 0 8px #ffd700)',
                opacity: 0.75,
              }}>
                {lvl.bossEmoji}
              </div>
              {/* Checkmark */}
              <div style={{
                position: 'absolute', top: -6, right: -6,
                width: 18, height: 18,
                background: '#00ff78',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10,
                boxShadow: '0 0 8px #00ff78',
              }}>✓</div>
            </div>
          ))}
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'Press Start 2P',monospace",
            fontSize: 'clamp(12px,4vw,20px)',
            color: '#ffd700',
            textShadow: '0 0 20px #ffd700, 0 0 40px #ffd70066',
            animation: 'pulse 2s ease-in-out infinite',
            lineHeight: 1.6,
            marginBottom: 10,
          }}>
            ¡FELIZ CUMPLE<br />{birthdayName.toUpperCase() || 'CAMPEÓN'}!
          </h1>
          <p style={{
            fontFamily: t.fB,
            fontSize: 'clamp(10px,3vw,13px)',
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: 1,
          }}>
            {maxLevels > 1 ? `Todos los ${maxLevels} sectores conquistados` : 'Sector conquistado'} 🎂
          </p>
        </div>

        {/* Score */}
        <div style={{
          textAlign: 'center',
          background: 'rgba(255,215,0,0.06)',
          border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: 12,
          padding: '18px 28px',
          width: '100%',
        }}>
          <div style={{
            fontFamily: "'Press Start 2P',monospace",
            fontSize: 8, color: 'rgba(255,255,255,0.45)',
            letterSpacing: 2, marginBottom: 10,
          }}>
            PUNTUACIÓN TOTAL
          </div>
          <AnimatedScore target={score} />
        </div>

        {/* Save form */}
        {!saved ? (
          <div style={{
            width: '100%',
            background: 'rgba(0,10,50,0.7)',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: 10, padding: '16px',
          }}>
            <div style={{
              fontFamily: "'Press Start 2P',monospace",
              fontSize: 8, color: t.a1,
              textAlign: 'center', marginBottom: 12,
            }}>
              GUARDA TU RÉCORD
            </div>

            {/* Emoji picker */}
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              {['🏆','🚀','⭐','🦁','🐉','🎮','👾','🤖'].map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  fontSize: 18,
                  background: emoji === e ? 'rgba(0,212,255,0.2)' : 'transparent',
                  border: emoji === e ? '1.5px solid #00d4ff' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8, padding: '3px 5px', cursor: 'pointer',
                }}>{e}</button>
              ))}
            </div>

            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Tu nombre"
              maxLength={14}
              style={{
                width: '100%', padding: '9px 12px', marginBottom: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(0,212,255,0.4)',
                borderRadius: 8, color: '#fff',
                fontFamily: "'Share Tech Mono',monospace", fontSize: 14,
                boxSizing: 'border-box',
              }}
            />

            {/* Bailecito */}
            <div style={{ marginBottom: 4 }}>
              <DancePicker t={t} value={dance} onChange={setDance} previewEmoji={emoji} />
            </div>

            {error && (
              <div style={{
                fontSize: 10, color: t.a2, marginBottom: 8,
                fontFamily: t.fB, textAlign: 'center',
              }}>{error}</div>
            )}

            <button
              onClick={handleSave}
              disabled={!playerName.trim() || saving}
              style={{
                fontFamily: "'Press Start 2P',monospace", fontSize: 9,
                padding: '10px', width: '100%',
                background: playerName.trim() ? 'linear-gradient(135deg,#ffd70022,#ff006e22)' : 'transparent',
                border: `2px solid ${playerName.trim() ? '#ffd700' : 'rgba(255,255,255,0.15)'}`,
                color: playerName.trim() ? '#ffd700' : 'rgba(255,255,255,0.3)',
                borderRadius: 8, cursor: playerName.trim() ? 'pointer' : 'default',
                boxSizing: 'border-box',
              }}
            >
              {saving ? '⏳ GUARDANDO...' : '💾 GUARDAR RÉCORD'}
            </button>
          </div>
        ) : (
          <div style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: '#00d4ff',
            padding: '12px 20px',
            background: 'rgba(0,212,255,0.1)',
            borderRadius: 8, border: '1px solid rgba(0,212,255,0.3)',
            textAlign: 'center', width: '100%',
            boxSizing: 'border-box',
          }}>
            ✅ ¡Récord guardado! Eres una leyenda.
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button
            onClick={() => nav('home')}
            style={{
              ...btnStyle(t),
              width: '100%', textAlign: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            🏠 VOLVER AL INICIO
          </button>
          <button
            onClick={onReplay}
            style={{
              ...btnStyle(t, true),
              width: '100%', textAlign: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            🔄 JUGAR DE NUEVO
          </button>
        </div>
      </div>
    </div>
  )
}
