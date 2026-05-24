/**
 * Game.jsx — Space Shooter mini-game.
 * Componente raíz que orquesta estados, HUD y renderizado de sprites.
 *
 * Estados: intro → playing → paused → victory | defeat
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { T, btnStyle, EMOJIS } from '../themes.js'
import { useGameLoop } from './useGameLoop.js'
import { ShooterAudio } from './audio.js'
import { saveShooterScore, loadShooterLeaderboard } from './firebase.js'
import { LEVELS, PLAYER } from './constants.js'
import '../styles/gameKeyframes.css'

// ── Fondo espacial (puro CSS) ─────────────────────────────────
function SpaceBackground() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    dur: Math.random() * 3 + 2,
  }))

  const nebulae = [
    { x: 15, y: 20, color: '#00d4ff', size: 180 },
    { x: 75, y: 55, color: '#ff006e', size: 220 },
    { x: 45, y: 80, color: '#7c3aed', size: 160 },
  ]

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 0%, #0d0d2a 0%, #070714 100%)',
      zIndex: 0,
    }}>
      {/* Nebulosas */}
      {nebulae.map((n, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${n.x}%`, top: `${n.y}%`,
          width: n.size, height: n.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${n.color}22 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          animation: `nebula-pulse ${3 + i}s ease-in-out infinite`,
          animationDelay: `${i * 1.2}s`,
        }} />
      ))}

      {/* Planeta decorativo */}
      <div style={{
        position: 'absolute', right: '8%', top: '12%',
        width: 48, height: 48, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #4a9eff, #1a3a7a)',
        boxShadow: '0 0 20px #4a9eff44, inset -8px -8px 20px rgba(0,0,0,0.6)',
        opacity: 0.7,
      }} />

      {/* Estrellas */}
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: '50%',
          background: '#fff',
          opacity: 0.7,
          animation: `twinkle ${s.dur}s ease-in-out infinite alternate`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  )
}

// ── Sprite de la nave del jugador ─────────────────────────────
function PlayerSprite({ player, W, H }) {
  if (!player) return null
  const scaleX = W / 390
  const scaleY = H / 844
  const x = player.x * scaleX
  const y = player.y * scaleY
  const w = player.w * scaleX
  const h = player.h * scaleY
  const isInvincible = player.invincible > 0

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: w, height: h,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: isInvincible
        ? 'ship-invincible 0.15s ease-in-out infinite'
        : 'ship-thrust 1.2s ease-in-out infinite',
      fontSize: Math.max(28, w * 0.9),
      userSelect: 'none',
      pointerEvents: 'none',
      filter: 'drop-shadow(0 0 8px #00d4ff)',
      zIndex: 10,
    }}>
      🚀
      {/* Propulsores */}
      <div style={{
        position: 'absolute', bottom: -6, left: '50%',
        transform: 'translateX(-50%)',
        width: 14, height: 14,
        background: 'radial-gradient(circle, #ff9500, #ff4500, transparent)',
        borderRadius: '50%',
        filter: 'blur(3px)',
        animation: 'ship-thrust 0.4s ease-in-out infinite',
      }} />
    </div>
  )
}

// ── Sprite del boss ───────────────────────────────────────────
function BossSprite({ boss, W, H }) {
  if (!boss) return null
  const scaleX = W / 390
  const scaleY = H / 844
  const x = boss.x * scaleX
  const y = boss.y * scaleY
  const w = boss.w * scaleX
  const h = boss.h * scaleY
  const hitPct = Math.max(0, boss.health / boss.maxHealth)
  const isAngry = hitPct < 0.4

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: w, height: h,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 10,
      pointerEvents: 'none',
      animation: boss.hitFlash > 0
        ? 'boss-hit 0.1s ease-in-out infinite'
        : boss.entryDone
          ? 'boss-float 2.4s ease-in-out infinite'
          : undefined,
    }}>
      {/* Cuerpo del boss */}
      <div style={{
        fontSize: Math.max(44, w * 0.72),
        filter: `drop-shadow(0 0 12px ${isAngry ? '#ff4500' : '#ff006e'})`,
        lineHeight: 1,
      }}>
        {isAngry ? '👾' : '👾'}
      </div>
      {/* Aura de daño cuando está bajo de vida */}
      {isAngry && (
        <div style={{
          position: 'absolute', inset: -8,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ff450022, transparent 70%)',
          animation: 'hit-ring 0.8s ease-out infinite',
        }} />
      )}
    </div>
  )
}

// ── Proyectiles ───────────────────────────────────────────────
function Bullets({ bullets, W, H }) {
  if (!bullets?.length) return null
  const scaleX = W / 390
  const scaleY = H / 844

  return (
    <>
      {bullets.map(b => {
        const isPlayer = b.type === 'player'
        return (
          <div key={b.id} style={{
            position: 'absolute',
            left: b.x * scaleX,
            top:  b.y * scaleY,
            width:  b.w * scaleX,
            height: b.h * scaleY,
            borderRadius: isPlayer ? '3px' : '50%',
            background: isPlayer
              ? 'linear-gradient(to top, #00d4ff, #ffffff)'
              : 'radial-gradient(circle, #ff4500, #ff006e)',
            boxShadow: isPlayer
              ? '0 0 6px 2px #00d4ff, 0 0 2px 0 #fff'
              : '0 0 6px 2px #ff006e',
            zIndex: 8,
            pointerEvents: 'none',
          }} />
        )
      })}
    </>
  )
}

// ── Efectos visuales ──────────────────────────────────────────
function Effects({ effects, W, H }) {
  if (!effects?.length) return null
  const scaleX = W / 390
  const scaleY = H / 844

  return (
    <>
      {effects.map(e => {
        const progress = 1 - e.ttl / e.maxTtl
        if (e.type === 'hit') {
          return (
            <div key={e.id}>
              {/* Anillo de impacto */}
              <div style={{
                position: 'absolute',
                left: e.x * scaleX, top: e.y * scaleY,
                width: 24, height: 24,
                borderRadius: '50%',
                border: '2px solid #00d4ff',
                animation: `hit-ring ${e.maxTtl / 60}s ease-out forwards`,
                zIndex: 15, pointerEvents: 'none',
              }} />
              {/* Score popup */}
              {e.scoreVal && (
                <div style={{
                  position: 'absolute',
                  left: e.x * scaleX, top: (e.y - 10) * scaleY,
                  color: '#00d4ff', fontFamily: "'Press Start 2P',monospace",
                  fontSize: 9, pointerEvents: 'none', zIndex: 16,
                  animation: `score-pop ${e.maxTtl / 60}s ease-out forwards`,
                  whiteSpace: 'nowrap',
                }}>
                  {e.scoreVal}
                </div>
              )}
            </div>
          )
        }
        if (e.type === 'explosion') {
          return (
            <div key={e.id} style={{
              position: 'absolute',
              left: e.x * scaleX, top: e.y * scaleY,
              width: 80, height: 80,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 52,
              animation: `explosion ${e.maxTtl / 60}s ease-out forwards`,
              zIndex: 20, pointerEvents: 'none',
            }}>
              💥
            </div>
          )
        }
        return null
      })}
    </>
  )
}

// ── HUD: barra de vida del boss ───────────────────────────────
function BossHpBar({ boss, t }) {
  if (!boss) return null
  const pct = Math.max(0, boss.health / boss.maxHealth)
  const isLow = pct < 0.3
  const color = pct > 0.5 ? '#ff006e' : pct > 0.25 ? '#ff9500' : '#ff2200'

  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, right: 12,
      zIndex: 30,
      animation: 'hud-slide-down 0.4s ease-out',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(0,0,0,0.6)', borderRadius: 8,
        padding: '6px 10px',
        border: `1px solid ${color}44`,
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 8, color: color,
          whiteSpace: 'nowrap',
          animation: isLow ? 'blink 0.5s ease-in-out infinite' : undefined,
        }}>
          👾 BOSS
        </span>
        <div style={{
          flex: 1, height: 10, background: 'rgba(255,255,255,0.1)',
          borderRadius: 6, overflow: 'hidden',
          border: `1px solid ${color}55`,
        }}>
          <div style={{
            height: '100%', width: `${pct * 100}%`,
            background: `linear-gradient(to right, ${color}88, ${color})`,
            borderRadius: 6,
            boxShadow: `0 0 8px ${color}`,
            transition: 'width 0.1s ease-out',
            animation: isLow ? 'hp-bar-flash 0.5s ease-in-out infinite' : undefined,
          }} />
        </div>
        <span style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 8, color: color, minWidth: 28, textAlign: 'right',
        }}>
          {boss.health}
        </span>
      </div>
    </div>
  )
}

// ── HUD: barra de vida del jugador ────────────────────────────
function PlayerHpBar({ player, t }) {
  if (!player) return null
  const hearts = Array.from({ length: player.maxHealth }, (_, i) => i < player.health)
  const isLow = player.health <= 1

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 12,
      zIndex: 30,
      display: 'flex', alignItems: 'center', gap: 4,
      animation: 'hud-slide-up 0.4s ease-out',
    }}>
      <span style={{
        fontFamily: "'Press Start 2P',monospace",
        fontSize: 7, color: '#ff6b9d', marginRight: 4,
      }}>HP</span>
      {hearts.map((alive, i) => (
        <span key={i} style={{
          fontSize: 16,
          opacity: alive ? 1 : 0.2,
          filter: alive ? (isLow ? 'drop-shadow(0 0 4px #ff2200)' : 'none') : undefined,
          animation: alive && isLow ? 'blink 0.6s ease-in-out infinite' : undefined,
        }}>❤️</span>
      ))}
    </div>
  )
}

// ── HUD: score ────────────────────────────────────────────────
function ScoreDisplay({ score }) {
  return (
    <div style={{
      position: 'absolute', bottom: 16, right: 12,
      zIndex: 30,
      fontFamily: "'Press Start 2P',monospace",
      fontSize: 10, color: '#ffd700',
      textShadow: '0 0 12px #ffd700',
      animation: 'hud-slide-up 0.4s ease-out',
    }}>
      {String(score).padStart(6, '0')}
    </div>
  )
}

// ── Botón de pausa ────────────────────────────────────────────
function PauseButton({ onPress }) {
  return (
    <button onClick={onPress} style={{
      position: 'absolute', top: 14, right: 14,
      zIndex: 40,
      width: 38, height: 38,
      borderRadius: '50%',
      background: 'rgba(0,0,0,0.55)',
      border: '1.5px solid rgba(0,212,255,0.5)',
      color: '#fff', fontSize: 14,
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
      animation: 'pause-btn-pulse 2s ease-in-out infinite',
      transition: 'transform 0.15s',
    }}>
      ⏸
    </button>
  )
}

// ── Overlay genérico ──────────────────────────────────────────
function Overlay({ children, bg = 'rgba(2,2,20,0.88)' }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 50,
      padding: 28,
      animation: 'overlay-in 0.3s ease-out',
      backdropFilter: 'blur(6px)',
    }}>
      {children}
    </div>
  )
}

// ── Pantalla de intro ─────────────────────────────────────────
function IntroScreen({ level, onStart, onBack }) {
  const levelInfo = LEVELS[Math.min(level - 1, LEVELS.length - 1)]
  return (
    <Overlay>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 320 }}>
        {/* Logo */}
        <div style={{ fontSize: 72, marginBottom: 8, lineHeight: 1 }}>🚀</div>
        <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>👾</div>

        <h1 style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 'clamp(14px,4vw,20px)',
          color: '#00d4ff',
          textShadow: '0 0 20px #00d4ff',
          marginBottom: 8,
          animation: 'title-glow 2s ease-in-out infinite',
        }}>
          SPACE BLASTER
        </h1>

        <div style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 9, color: '#ff006e',
          marginBottom: 24,
          textShadow: '0 0 10px #ff006e',
        }}>
          {levelInfo.label}
        </div>

        <div style={{
          background: 'rgba(0,212,255,0.08)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: 10, padding: 14,
          marginBottom: 28,
        }}>
          <p style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 11, color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.8, margin: 0,
          }}>
            🎮 Deslizá o usá ←→<br/>
            ⚡ Disparo automático<br/>
            💥 Destruí el boss<br/>
            ❤️ Tenés {PLAYER.health} vidas
          </p>
        </div>

        <button onClick={onStart} style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 13,
          padding: '14px 36px',
          background: 'linear-gradient(135deg, #00d4ff22, #ff006e22)',
          border: '2px solid #00d4ff',
          color: '#00d4ff',
          borderRadius: 8,
          cursor: 'pointer',
          letterSpacing: 2,
          boxShadow: '0 0 24px #00d4ff44',
          marginBottom: 14,
          width: '100%',
          textShadow: '0 0 10px #00d4ff',
        }}>
          ▶ JUGAR
        </button>

        <button onClick={onBack} style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 9, padding: '10px 20px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.45)',
          borderRadius: 8, cursor: 'pointer',
          width: '100%',
        }}>
          ← VOLVER
        </button>
      </div>
    </Overlay>
  )
}

// ── Pantalla de pausa ─────────────────────────────────────────
function PauseScreen({ onResume, onBack }) {
  return (
    <Overlay>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏸️</div>
        <h2 style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 18, color: '#00d4ff',
          textShadow: '0 0 16px #00d4ff',
          marginBottom: 28,
        }}>
          PAUSA
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onResume} style={{
            fontFamily: "'Press Start 2P',monospace", fontSize: 11,
            padding: '13px 28px',
            background: 'linear-gradient(135deg, #00d4ff22, #ff006e22)',
            border: '2px solid #00d4ff', color: '#00d4ff',
            borderRadius: 8, cursor: 'pointer',
            boxShadow: '0 0 18px #00d4ff33',
          }}>
            ▶ CONTINUAR
          </button>
          <button onClick={onBack} style={{
            fontFamily: "'Press Start 2P',monospace", fontSize: 9,
            padding: '11px 20px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.45)',
            borderRadius: 8, cursor: 'pointer',
          }}>
            ← SALIR
          </button>
        </div>
      </div>
    </Overlay>
  )
}

// ── Pantalla de victoria ──────────────────────────────────────
function VictoryScreen({ score, level, onNextLevel, onRetry, onBack, saving }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🚀')
  const [submitted, setSubmitted] = useState(false)
  const [ranking, setRanking] = useState([])
  const hasNextLevel = level < LEVELS.length

  useEffect(() => {
    loadShooterLeaderboard(5).then(setRanking)
  }, [])

  return (
    <Overlay bg="rgba(0,8,24,0.92)">
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 300, overflowY: 'auto', maxHeight: '90%' }}>
        <div style={{
          fontSize: 52, marginBottom: 4,
          animation: 'victory-pulse 1s ease-in-out infinite',
        }}>🏆</div>

        <h2 style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 'clamp(14px,4vw,18px)',
          color: '#ffd700',
          textShadow: '0 0 20px #ffd700',
          marginBottom: 6,
          animation: 'title-glow 1.5s ease-in-out infinite',
        }}>
          ¡GANASTE!
        </h2>

        <div style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 22, color: '#00d4ff',
          marginBottom: 18,
          textShadow: '0 0 14px #00d4ff',
        }}>
          {String(score).padStart(6, '0')}
        </div>

        {!submitted ? (
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 10, color: 'rgba(255,255,255,0.6)',
              marginBottom: 10,
            }}>
              Guardá tu score:
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['🚀','⭐','🦁','🐉','🎮','🏆'].map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  fontSize: 20, background: emoji === e ? 'rgba(0,212,255,0.2)' : 'transparent',
                  border: emoji === e ? '1.5px solid #00d4ff' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8, padding: '4px 6px', cursor: 'pointer',
                }}>
                  {e}
                </button>
              ))}
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && !saving && saving !== undefined && onBack()}
              placeholder="Tu nombre"
              maxLength={14}
              style={{
                width: '100%', padding: '9px 12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(0,212,255,0.4)',
                borderRadius: 8, color: '#fff',
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: 14, marginBottom: 10,
              }}
            />
            <button
              onClick={() => { if (name.trim()) { setSubmitted(true); saving(name.trim(), emoji, score, level) } }}
              disabled={!name.trim()}
              style={{
                fontFamily: "'Press Start 2P',monospace", fontSize: 9,
                padding: '11px', width: '100%',
                background: name.trim() ? 'linear-gradient(135deg,#00d4ff22,#ff006e22)' : 'transparent',
                border: `2px solid ${name.trim() ? '#00d4ff' : 'rgba(255,255,255,0.15)'}`,
                color: name.trim() ? '#00d4ff' : 'rgba(255,255,255,0.3)',
                borderRadius: 8, cursor: name.trim() ? 'pointer' : 'default',
                marginBottom: 12,
              }}
            >
              💾 GUARDAR
            </button>
          </div>
        ) : (
          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 11, color: '#00d4ff',
            marginBottom: 16, padding: '10px',
            background: 'rgba(0,212,255,0.1)',
            borderRadius: 8, border: '1px solid rgba(0,212,255,0.3)',
          }}>
            ✅ Score guardado!
          </div>
        )}

        {/* Mini ranking */}
        {ranking.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontFamily: "'Press Start 2P',monospace",
              fontSize: 8, color: '#ffd700', marginBottom: 8,
            }}>
              TOP SCORES
            </div>
            {ranking.slice(0, 3).map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 6, marginBottom: 3,
              }}>
                <span style={{ fontSize: 12 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </span>
                <span style={{ flex: 1, fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: '#fff' }}>
                  {r.emoji} {r.name}
                </span>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 8, color: '#ffd700' }}>
                  {r.score}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hasNextLevel && (
            <button onClick={onNextLevel} style={{
              fontFamily: "'Press Start 2P',monospace", fontSize: 10,
              padding: '12px', background: 'linear-gradient(135deg,#ffd70022,#ff006e22)',
              border: '2px solid #ffd700', color: '#ffd700',
              borderRadius: 8, cursor: 'pointer',
              boxShadow: '0 0 18px #ffd70033',
            }}>
              ⚡ NIVEL {level + 1} →
            </button>
          )}
          <button onClick={onRetry} style={{
            fontFamily: "'Press Start 2P',monospace", fontSize: 9,
            padding: '11px', background: 'transparent',
            border: '1px solid rgba(0,212,255,0.4)', color: '#00d4ff',
            borderRadius: 8, cursor: 'pointer',
          }}>
            🔄 REINTENTAR
          </button>
          <button onClick={onBack} style={{
            fontFamily: "'Press Start 2P',monospace", fontSize: 9,
            padding: '11px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)',
            borderRadius: 8, cursor: 'pointer',
          }}>
            ← SALIR
          </button>
        </div>
      </div>
    </Overlay>
  )
}

// ── Pantalla de derrota ───────────────────────────────────────
function DefeatScreen({ score, onRetry, onBack }) {
  return (
    <Overlay bg="rgba(12,0,0,0.92)">
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 56, marginBottom: 8,
          animation: 'defeat-shake 0.5s ease-in-out infinite',
        }}>💀</div>

        <h2 style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 'clamp(14px,4vw,18px)',
          color: '#ff2200',
          textShadow: '0 0 20px #ff2200',
          marginBottom: 8,
        }}>
          GAME OVER
        </h2>

        <div style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 20, color: '#ff6b6b',
          marginBottom: 24,
        }}>
          {String(score).padStart(6, '0')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onRetry} style={{
            fontFamily: "'Press Start 2P',monospace", fontSize: 11,
            padding: '13px 28px',
            background: 'linear-gradient(135deg,#ff220022,#ff006e22)',
            border: '2px solid #ff2200', color: '#ff6b6b',
            borderRadius: 8, cursor: 'pointer',
            boxShadow: '0 0 18px #ff220033',
          }}>
            🔄 REINTENTAR
          </button>
          <button onClick={onBack} style={{
            fontFamily: "'Press Start 2P',monospace", fontSize: 9,
            padding: '11px 20px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.45)',
            borderRadius: 8, cursor: 'pointer',
          }}>
            ← VOLVER
          </button>
        </div>
      </div>
    </Overlay>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function Game({ cfg, nav }) {
  const [phase, setPhase] = useState('intro')   // intro | playing | paused | victory | defeat
  const [level, setLevel] = useState(1)
  const [finalScore, setFinalScore] = useState(0)
  const [muted] = useState(false)
  const containerRef = useRef(null)

  const handleVictory = useCallback((score) => {
    setFinalScore(score)
    setPhase('victory')
  }, [])

  const handleDefeat = useCallback(() => {
    setPhase('defeat')
  }, [])

  const { renderState, initGame } = useGameLoop({
    level,
    muted,
    active: phase === 'playing',
    onVictory: handleVictory,
    onDefeat:  handleDefeat,
    containerRef,
  })

  const handleStart = () => {
    ShooterAudio.init()
    if (!muted) ShooterAudio.startPulse()
    initGame()
    setPhase('playing')
  }

  const handlePause = () => {
    setPhase('paused')
    ShooterAudio.stopPulse()
  }

  const handleResume = () => {
    setPhase('playing')
    if (!muted) ShooterAudio.startPulse()
  }

  const handleRetry = () => {
    initGame()
    setPhase('intro')
    ShooterAudio.stopPulse()
  }

  const handleNextLevel = () => {
    const next = Math.min(level + 1, LEVELS.length)
    setLevel(next)
    ShooterAudio.stopPulse()
    setPhase('intro')
  }

  const handleBack = () => {
    ShooterAudio.stopPulse()
    nav('home')
  }

  const handleSaveScore = async (name, emoji, score, lvl) => {
    try {
      await saveShooterScore({ name, emoji, score, level: lvl })
    } catch (e) {
      console.warn('Error guardando score:', e)
    }
  }

  const rs = renderState

  return (
    <div style={{
      // Pantalla completa, centrada
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000',
    }}>
      {/* Contenedor 9:16 */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 'min(100vw, calc(100vh * 9 / 16))',
          aspectRatio: '9 / 16',
          overflow: 'hidden',
          borderRadius: 0,
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* Fondo siempre visible */}
        <SpaceBackground />

        {/* Sprites del juego */}
        {(phase === 'playing' || phase === 'paused') && rs && (
          <>
            <BossSprite   boss={rs.boss}     W={containerRef.current?.clientWidth || 390} H={containerRef.current?.clientHeight || 844} />
            <PlayerSprite player={rs.player} W={containerRef.current?.clientWidth || 390} H={containerRef.current?.clientHeight || 844} />
            <Bullets      bullets={rs.bullets} W={containerRef.current?.clientWidth || 390} H={containerRef.current?.clientHeight || 844} />
            <Effects      effects={rs.effects} W={containerRef.current?.clientWidth || 390} H={containerRef.current?.clientHeight || 844} />

            {/* HUD */}
            <BossHpBar   boss={rs.boss}     t={T[cfg.style]} />
            <PlayerHpBar player={rs.player} t={T[cfg.style]} />
            <ScoreDisplay score={rs.score} />
            <PauseButton onPress={handlePause} />

            {/* Nivel */}
            <div style={{
              position: 'absolute', top: 48, left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Press Start 2P',monospace",
              fontSize: 7, color: 'rgba(255,255,255,0.35)',
              zIndex: 25, whiteSpace: 'nowrap',
            }}>
              {LEVELS[Math.min(level - 1, LEVELS.length - 1)].label}
            </div>
          </>
        )}

        {/* Overlays de estado */}
        {phase === 'intro'   && <IntroScreen   level={level} onStart={handleStart} onBack={handleBack} />}
        {phase === 'paused'  && <PauseScreen   onResume={handleResume} onBack={handleBack} />}
        {phase === 'victory' && (
          <VictoryScreen
            score={finalScore}
            level={level}
            onNextLevel={handleNextLevel}
            onRetry={handleRetry}
            onBack={handleBack}
            saving={handleSaveScore}
          />
        )}
        {phase === 'defeat'  && (
          <DefeatScreen
            score={rs?.score ?? 0}
            onRetry={handleRetry}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}
