/**
 * Game.jsx — Space Blaster
 * 5 niveles · 3 fases del boss · power-ups · combo · partículas · shake
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { T, btnStyle } from '../themes.js'
import BackButton from '../components/BackButton.jsx'
import { useGameLoop } from './useGameLoop.js'
import { ShooterAudio } from './audio.js'
import { saveShooterScore, loadShooterLeaderboard } from './firebase.js'
import { LEVELS, PLAYER, POWERUP, BOSS_PHASES } from './constants.js'
import '../styles/gameKeyframes.css'

// ── Helpers ────────────────────────────────────────────────────
const PHASE_COLORS = { 1: '#ff006e', 2: '#ff6600', 3: '#ff0000' }

// ── Fondo espacial (CSS puro) ──────────────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: (i * 127.3) % 100,
  y: (i * 97.7)  % 100,
  size: 1 + (i % 3),
  delay: (i * 0.37) % 4,
  dur:   2 + (i % 3),
}))

function SpaceBackground() {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'radial-gradient(ellipse at 50% 0%, #0d0d2a 0%, #070714 100%)',
      zIndex: 0,
    }}>
      {/* Nebulosas */}
      {[
        { x: 15, y: 20, color: '#00d4ff', size: 180 },
        { x: 75, y: 55, color: '#ff006e', size: 220 },
        { x: 45, y: 80, color: '#7c3aed', size: 160 },
      ].map((n, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${n.x}%`, top: `${n.y}%`,
          width: n.size, height: n.size, borderRadius: '50%',
          background: `radial-gradient(circle, ${n.color}22 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          animation: `nebula-pulse ${3 + i}s ease-in-out infinite`,
          animationDelay: `${i * 1.2}s`,
        }} />
      ))}

      {/* Planeta */}
      <div style={{
        position: 'absolute', right: '8%', top: '12%',
        width: 48, height: 48, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #4a9eff, #1a3a7a)',
        boxShadow: '0 0 20px #4a9eff44, inset -8px -8px 20px rgba(0,0,0,0.6)',
        opacity: 0.7,
      }} />

      {/* Estrellas */}
      {STARS.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: '50%',
          background: '#fff', opacity: 0.7,
          animation: `twinkle ${s.dur}s ease-in-out infinite alternate`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  )
}

// ── PlayerSprite ───────────────────────────────────────────────
function PlayerSprite({ player, scaleX, scaleY }) {
  if (!player) return null
  const x = player.x * scaleX
  const y = player.y * scaleY
  const w = player.w * scaleX
  const h = player.h * scaleY
  const hasShield    = player.shield > 0
  const hasRapid     = player.rapidFire > 0
  const isInvincible = player.invincible > 0

  let anim = 'ship-thrust 1.2s ease-in-out infinite'
  if (hasShield)    anim = 'ship-shield 0.8s ease-in-out infinite'
  else if (hasRapid) anim = 'ship-rapid 0.5s ease-in-out infinite'
  else if (isInvincible) anim = 'ship-invincible 0.15s ease-in-out infinite'

  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.max(26, w * 0.85),
      animation: anim,
      userSelect: 'none', pointerEvents: 'none', zIndex: 10,
    }}>
      🚀
      {/* Propulsor */}
      <div style={{
        position: 'absolute', bottom: -6, left: '50%',
        transform: 'translateX(-50%)',
        width: 14, height: 14,
        background: 'radial-gradient(circle, #ff9500, #ff4500, transparent)',
        borderRadius: '50%', filter: 'blur(3px)',
        animation: 'ship-thrust 0.4s ease-in-out infinite',
      }} />
      {/* Burbuja de escudo */}
      {hasShield && (
        <div style={{
          position: 'absolute', inset: -8,
          borderRadius: '50%',
          border: '2px solid #00d4ff88',
          boxShadow: '0 0 14px #00d4ff44',
          animation: 'ship-shield 0.8s ease-in-out infinite',
        }} />
      )}
    </div>
  )
}

// ── BossSprite ─────────────────────────────────────────────────
function BossSprite({ boss, scaleX, scaleY }) {
  if (!boss) return null
  const x   = boss.x * scaleX
  const y   = boss.y * scaleY
  const w   = boss.w * scaleX
  const h   = boss.h * scaleY
  const phaseCfg = BOSS_PHASES.find(p => p.phase === boss.phase) || BOSS_PHASES[0]

  let floatAnim = 'boss-float 2.4s ease-in-out infinite'
  if (boss.phase === 3) floatAnim = 'boss-float-fast 1s ease-in-out infinite'
  else if (boss.phase === 2) floatAnim = 'boss-float 1.6s ease-in-out infinite'

  let phaseFilter = boss.phase === 3
    ? 'boss-phase3 0.7s ease-in-out infinite'
    : boss.phase === 2
    ? 'boss-phase2 1.2s ease-in-out infinite'
    : undefined

  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 10, pointerEvents: 'none',
      animation: boss.hitFlash > 0 ? 'boss-hit 0.1s ease-in-out infinite' : floatAnim,
    }}>
      {/* Aura de fase */}
      {boss.phase > 1 && (
        <div style={{
          position: 'absolute', inset: -10, borderRadius: '50%',
          background: `radial-gradient(circle, ${phaseCfg.glowColor}22, transparent 70%)`,
          animation: phaseFilter,
        }} />
      )}

      {/* Emoji del boss (cambia por nivel) */}
      <div style={{
        fontSize: Math.max(42, w * 0.7),
        filter: `drop-shadow(0 0 14px ${phaseCfg.glowColor})`,
        lineHeight: 1, zIndex: 1,
      }}>
        {boss.emoji}
      </div>

      {/* Escudo del boss en fase 1 */}
      {boss.phase === 1 && (
        <div style={{
          position: 'absolute', inset: -4, borderRadius: 12,
          border: `1px solid ${phaseCfg.glowColor}44`,
        }} />
      )}
    </div>
  )
}

// ── Bullets ────────────────────────────────────────────────────
function Bullets({ bullets, scaleX, scaleY }) {
  if (!bullets?.length) return null
  return (
    <>
      {bullets.map(b => {
        const isPlayer = b.type === 'player'
        return (
          <div key={b.id} style={{
            position: 'absolute',
            left: b.x * scaleX, top: b.y * scaleY,
            width: b.w * scaleX, height: b.h * scaleY,
            borderRadius: isPlayer ? '3px' : '50%',
            background: isPlayer
              ? 'linear-gradient(to top, #00d4ff, #ffffff)'
              : 'radial-gradient(circle, #ff4500, #ff006e)',
            boxShadow: isPlayer
              ? '0 0 6px 2px #00d4ff'
              : '0 0 6px 2px #ff006e',
            zIndex: 8, pointerEvents: 'none',
          }} />
        )
      })}
    </>
  )
}

// ── Power-ups ──────────────────────────────────────────────────
function PowerUps({ powerUps, scaleX, scaleY }) {
  if (!powerUps?.length) return null

  const glowAnims = {
    shield:    'powerup-glow-cyan 1s ease-in-out infinite',
    rapidFire: 'powerup-glow-gold 1s ease-in-out infinite',
    bomb:      'powerup-glow-pink 0.7s ease-in-out infinite',
  }

  return (
    <>
      {powerUps.map(p => {
        const cfg = POWERUP.types[p.type]
        return (
          <div key={p.id} style={{
            position: 'absolute',
            left: p.x * scaleX, top: p.y * scaleY,
            width: p.w * scaleX, height: p.h * scaleY,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${cfg.color}44, ${cfg.color}11)`,
            border: `2px solid ${cfg.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: Math.max(14, p.w * scaleX * 0.6),
            animation: `powerup-float 1.2s ease-in-out infinite, ${glowAnims[p.type] || ''}`,
            zIndex: 12, pointerEvents: 'none',
          }}>
            {cfg.emoji}
          </div>
        )
      })}
    </>
  )
}

// ── Effects: partículas + anillos + explosiones + popups ───────
function Effects({ effects, scaleX, scaleY }) {
  if (!effects?.length) return null

  return (
    <>
      {effects.map(e => {
        if (e.type === 'particle') {
          const progress = 1 - e.ttl / e.maxTtl
          return (
            <div key={e.id} style={{
              position: 'absolute',
              left: e.x * scaleX, top: e.y * scaleY,
              width: e.size, height: e.size,
              borderRadius: '50%',
              background: e.color,
              opacity: Math.max(0, 1 - progress),
              boxShadow: `0 0 ${e.size}px ${e.color}`,
              pointerEvents: 'none', zIndex: 18,
            }} />
          )
        }

        if (e.type === 'hit') {
          return (
            <div key={e.id}>
              <div style={{
                position: 'absolute', left: e.x * scaleX, top: e.y * scaleY,
                width: 26, height: 26, borderRadius: '50%',
                border: '2px solid #00d4ff',
                animation: `hit-ring ${e.maxTtl / 60}s ease-out forwards`,
                zIndex: 15, pointerEvents: 'none',
              }} />
              {e.scoreVal && (
                <div style={{
                  position: 'absolute',
                  left: e.x * scaleX, top: (e.y - 14) * scaleY,
                  color: '#00d4ff', fontFamily: "'Press Start 2P',monospace",
                  fontSize: Math.max(7, 9 * Math.min(scaleX, scaleY)),
                  pointerEvents: 'none', zIndex: 16,
                  animation: `score-pop ${e.maxTtl / 60}s ease-out forwards`,
                  whiteSpace: 'nowrap', textShadow: '0 0 6px #00d4ff',
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

// ── HUD: Barra HP del boss ─────────────────────────────────────
function BossHpBar({ boss }) {
  if (!boss) return null
  const pct = Math.max(0, boss.health / boss.maxHealth)
  const isLow = pct < 0.3
  const color = PHASE_COLORS[boss.phase] || '#ff006e'

  return (
    <div style={{
      position: 'absolute', top: 12, left: 12, right: 52,
      zIndex: 30, animation: 'hud-slide-down 0.4s ease-out',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: 'rgba(0,0,0,0.6)', borderRadius: 8,
        padding: '6px 10px',
        border: `1px solid ${color}44`,
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 7, color, whiteSpace: 'nowrap',
          animation: isLow ? 'blink 0.5s ease-in-out infinite' : undefined,
        }}>
          {boss.emoji} BOSS
        </span>
        <div style={{
          flex: 1, height: 10, background: 'rgba(255,255,255,0.1)',
          borderRadius: 6, overflow: 'hidden', border: `1px solid ${color}55`,
        }}>
          <div style={{
            height: '100%', width: `${pct * 100}%`,
            background: `linear-gradient(to right, ${color}88, ${color})`,
            borderRadius: 6, boxShadow: `0 0 8px ${color}`,
            transition: 'width 0.1s ease-out',
            animation: isLow ? 'hp-bar-flash 0.5s ease-in-out infinite' : undefined,
          }} />
        </div>
        <span style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 7, color, minWidth: 26, textAlign: 'right',
        }}>
          {boss.health}
        </span>
        {/* Indicador de fase */}
        {boss.phase > 1 && (
          <span style={{
            fontFamily: "'Press Start 2P',monospace",
            fontSize: 6, color,
            background: `${color}22`,
            padding: '2px 4px', borderRadius: 3,
            animation: 'blink 0.8s ease-in-out infinite',
          }}>
            F{boss.phase}
          </span>
        )}
      </div>
    </div>
  )
}

// ── HUD: Vidas del jugador ─────────────────────────────────────
function PlayerHpBar({ player }) {
  if (!player) return null
  const hearts  = Array.from({ length: player.maxHealth }, (_, i) => i < player.health)
  const isLow   = player.health <= 1
  const hasShield = player.shield > 0

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 12,
      zIndex: 30, display: 'flex', alignItems: 'center', gap: 3,
      animation: 'hud-slide-up 0.4s ease-out',
    }}>
      {hasShield && (
        <span style={{
          fontSize: 13, marginRight: 2,
          animation: 'ship-shield 0.8s ease-in-out infinite',
        }}>🛡️</span>
      )}
      <span style={{
        fontFamily: "'Press Start 2P',monospace",
        fontSize: 7, color: '#ff6b9d', marginRight: 3,
      }}>HP</span>
      {hearts.map((alive, i) => (
        <span key={i} style={{
          fontSize: 14,
          opacity: alive ? 1 : 0.18,
          animation: alive && isLow ? 'blink 0.55s ease-in-out infinite' : undefined,
        }}>❤️</span>
      ))}
      {player.rapidFire > 0 && (
        <span style={{ fontSize: 13, marginLeft: 4, animation: 'ship-rapid 0.5s ease-in-out infinite' }}>⚡</span>
      )}
    </div>
  )
}

// ── HUD: Score + Combo ─────────────────────────────────────────
function ScoreDisplay({ score, combo, multiplier }) {
  const showCombo = combo >= COMBO_VIS_THRESHOLD
  return (
    <div style={{
      position: 'absolute', bottom: 16, right: 12,
      zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      gap: 3, animation: 'hud-slide-up 0.4s ease-out',
    }}>
      <div style={{
        fontFamily: "'Press Start 2P',monospace",
        fontSize: 10, color: '#ffd700',
        textShadow: '0 0 12px #ffd700',
      }}>
        {String(score).padStart(6, '0')}
      </div>
      {showCombo && (
        <div style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 7, color: MULTIPLIER_COLORS[Math.min(multiplier, 5)],
          animation: 'multiplier-glow 0.8s ease-in-out infinite',
          display: 'flex', gap: 4, alignItems: 'center',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>COMBO</span>
          <span>{combo}x</span>
          {multiplier > 1 && (
            <span style={{
              background: MULTIPLIER_COLORS[Math.min(multiplier, 5)] + '22',
              border: `1px solid ${MULTIPLIER_COLORS[Math.min(multiplier, 5)]}88`,
              padding: '1px 4px', borderRadius: 3,
              animation: 'combo-pop 0.3s ease-out',
            }}>
              ×{multiplier}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
const COMBO_VIS_THRESHOLD = 3
const MULTIPLIER_COLORS = { 1: '#ffd700', 2: '#ff9500', 3: '#ff6600', 4: '#ff3300', 5: '#ff006e' }

// ── Botón de pausa ─────────────────────────────────────────────
function PauseButton({ onPress }) {
  return (
    <button onClick={onPress} style={{
      position: 'absolute', top: 14, right: 14, zIndex: 40,
      width: 36, height: 36, borderRadius: '50%',
      background: 'rgba(0,0,0,0.55)',
      border: '1.5px solid rgba(0,212,255,0.5)',
      color: '#fff', fontSize: 13, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
      animation: 'pause-btn-pulse 2s ease-in-out infinite',
    }}>⏸</button>
  )
}

// ── Overlay genérico ───────────────────────────────────────────
function Overlay({ children, bg = 'rgba(2,2,20,0.9)' }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '24px 20px',
      animation: 'overlay-in 0.3s ease-out',
      backdropFilter: 'blur(6px)',
    }}>
      {children}
    </div>
  )
}

// ── Pantalla Intro ─────────────────────────────────────────────
function IntroScreen({ level, onStart, onBack }) {
  const lvl = LEVELS[Math.min(level - 1, LEVELS.length - 1)]
  return (
    <Overlay>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 300 }}>
        <div style={{ fontSize: 64, marginBottom: 4, lineHeight: 1 }}>🚀</div>
        <div style={{ fontSize: 52, marginBottom: 14, lineHeight: 1 }}>{lvl.bossEmoji}</div>

        <h1 style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 'clamp(13px,4vw,19px)', color: '#00d4ff',
          textShadow: '0 0 20px #00d4ff', marginBottom: 6,
          animation: 'title-glow 2s ease-in-out infinite',
        }}>SPACE BLASTER</h1>

        <div style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 8, color: '#ff006e', marginBottom: 20,
          textShadow: '0 0 10px #ff006e',
        }}>{lvl.label}</div>

        <div style={{
          background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.18)',
          borderRadius: 10, padding: '12px 14px', marginBottom: 24,
        }}>
          <p style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 2, margin: 0,
          }}>
            🎮 Deslizá / ←→ para moverte<br/>
            ⚡ Disparo automático<br/>
            🛡️⚡ Recolectá power-ups<br/>
            💥 Destruí al boss × {level}<br/>
            ❤️ Tenés {PLAYER.health} vidas
          </p>
        </div>

        <button onClick={onStart} style={{
          fontFamily: "'Press Start 2P',monospace", fontSize: 12,
          padding: '13px 32px', width: '100%', marginBottom: 12,
          background: 'linear-gradient(135deg, #00d4ff22, #ff006e22)',
          border: '2px solid #00d4ff', color: '#00d4ff',
          borderRadius: 8, cursor: 'pointer', letterSpacing: 2,
          boxShadow: '0 0 24px #00d4ff44',
          textShadow: '0 0 10px #00d4ff',
        }}>▶ JUGAR</button>

        <BackButton t={T.arcade} onClick={onBack} style={{ width: '100%', justifyContent: 'center' }} />
      </div>
    </Overlay>
  )
}

// ── Pantalla Pausa ─────────────────────────────────────────────
function PauseScreen({ onResume, onBack }) {
  return (
    <Overlay>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>⏸️</div>
        <h2 style={{
          fontFamily: "'Press Start 2P',monospace", fontSize: 17,
          color: '#00d4ff', textShadow: '0 0 16px #00d4ff', marginBottom: 26,
        }}>PAUSA</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <button onClick={onResume} style={{
            fontFamily: "'Press Start 2P',monospace", fontSize: 11, padding: '13px 28px',
            background: 'linear-gradient(135deg, #00d4ff22, #ff006e22)',
            border: '2px solid #00d4ff', color: '#00d4ff',
            borderRadius: 8, cursor: 'pointer', boxShadow: '0 0 18px #00d4ff33',
          }}>▶ CONTINUAR</button>
          <BackButton t={T.arcade} onClick={onBack} style={{ justifyContent: 'center' }} />
        </div>
      </div>
    </Overlay>
  )
}

// ── Pantalla Victoria ──────────────────────────────────────────
function VictoryScreen({ score, level, onNextLevel, onRetry, onBack, onSave }) {
  const [name, setName]     = useState('')
  const [emoji, setEmoji]   = useState('🚀')
  const [saved, setSaved]   = useState(false)
  const [ranking, setRanking] = useState([])
  const hasNextLevel = level < LEVELS.length

  useEffect(() => { loadShooterLeaderboard(5).then(setRanking) }, [])

  const handleSave = () => {
    if (!name.trim()) return
    setSaved(true)
    onSave(name.trim(), emoji, score, level)
  }

  return (
    <Overlay bg="rgba(0,8,24,0.94)">
      <div style={{
        textAlign: 'center', width: '100%', maxWidth: 300,
        overflowY: 'auto', maxHeight: '92vh',
      }}>
        <div style={{ fontSize: 48, marginBottom: 4, animation: 'victory-pulse 1s ease-in-out infinite' }}>🏆</div>
        <h2 style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 'clamp(13px,4vw,17px)', color: '#ffd700',
          textShadow: '0 0 20px #ffd700', marginBottom: 6,
          animation: 'title-glow 1.5s ease-in-out infinite',
        }}>¡GANASTE!</h2>

        <div style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 20, color: '#00d4ff', marginBottom: 16,
          textShadow: '0 0 14px #00d4ff',
        }}>{String(score).padStart(6, '0')}</div>

        {/* Guardar score */}
        {!saved ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['🚀','⭐','🦁','🐉','🎮','🏆','👾','🤖'].map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  fontSize: 18,
                  background: emoji === e ? 'rgba(0,212,255,0.2)' : 'transparent',
                  border: emoji === e ? '1.5px solid #00d4ff' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8, padding: '3px 5px', cursor: 'pointer',
                }}>{e}</button>
              ))}
            </div>
            <input
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Tu nombre" maxLength={14}
              style={{
                width: '100%', padding: '9px 12px', marginBottom: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(0,212,255,0.4)',
                borderRadius: 8, color: '#fff',
                fontFamily: "'Share Tech Mono',monospace", fontSize: 14,
              }}
            />
            <button onClick={handleSave} disabled={!name.trim()} style={{
              fontFamily: "'Press Start 2P',monospace", fontSize: 9,
              padding: '10px', width: '100%', marginBottom: 10,
              background: name.trim() ? 'linear-gradient(135deg,#00d4ff22,#ff006e22)' : 'transparent',
              border: `2px solid ${name.trim() ? '#00d4ff' : 'rgba(255,255,255,0.15)'}`,
              color: name.trim() ? '#00d4ff' : 'rgba(255,255,255,0.3)',
              borderRadius: 8, cursor: name.trim() ? 'pointer' : 'default',
            }}>💾 GUARDAR</button>
          </div>
        ) : (
          <div style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: '#00d4ff',
            marginBottom: 14, padding: 10,
            background: 'rgba(0,212,255,0.1)',
            borderRadius: 8, border: '1px solid rgba(0,212,255,0.3)',
          }}>✅ Score guardado!</div>
        )}

        {/* Mini ranking */}
        {ranking.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {ranking.slice(0, 3).map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '4px 8px', background: 'rgba(255,255,255,0.04)',
                borderRadius: 6, marginBottom: 3,
              }}>
                <span style={{ fontSize: 11 }}>{['🥇','🥈','🥉'][i]}</span>
                <span style={{ flex: 1, fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: '#fff' }}>
                  {r.emoji} {r.name}
                </span>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 7, color: '#ffd700' }}>
                  {r.score}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {hasNextLevel && (
            <button onClick={onNextLevel} style={{
              fontFamily: "'Press Start 2P',monospace", fontSize: 9, padding: '11px',
              background: 'linear-gradient(135deg,#ffd70022,#ff006e22)',
              border: '2px solid #ffd700', color: '#ffd700',
              borderRadius: 8, cursor: 'pointer', boxShadow: '0 0 18px #ffd70033',
            }}>⚡ SECTOR {level + 1} →</button>
          )}
          <button onClick={onRetry} style={{
            fontFamily: "'Press Start 2P',monospace", fontSize: 9, padding: '10px',
            background: 'transparent', border: '1px solid rgba(0,212,255,0.4)',
            color: '#00d4ff', borderRadius: 8, cursor: 'pointer',
          }}>🔄 REINTENTAR</button>
          <BackButton t={T.arcade} onClick={onBack} style={{ justifyContent: 'center' }} />
        </div>
      </div>
    </Overlay>
  )
}

// ── Pantalla Derrota ───────────────────────────────────────────
function DefeatScreen({ score, level, onRetry, onBack }) {
  const lvl = LEVELS[Math.min(level - 1, LEVELS.length - 1)]
  return (
    <Overlay bg="rgba(12,0,0,0.94)">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 8, animation: 'defeat-shake 0.5s ease-in-out infinite' }}>💀</div>
        <h2 style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 'clamp(13px,4vw,17px)', color: '#ff2200',
          textShadow: '0 0 20px #ff2200', marginBottom: 6,
        }}>GAME OVER</h2>
        <div style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 8, color: '#ff6600', marginBottom: 8,
        }}>{lvl.label}</div>
        <div style={{
          fontFamily: "'Press Start 2P',monospace",
          fontSize: 20, color: '#ff6b6b', marginBottom: 26,
        }}>{String(score).padStart(6, '0')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <button onClick={onRetry} style={{
            fontFamily: "'Press Start 2P',monospace", fontSize: 11, padding: '13px 28px',
            background: 'linear-gradient(135deg,#ff220022,#ff006e22)',
            border: '2px solid #ff2200', color: '#ff6b6b',
            borderRadius: 8, cursor: 'pointer', boxShadow: '0 0 18px #ff220033',
          }}>🔄 REINTENTAR</button>
          <BackButton t={T.arcade} onClick={onBack} style={{ justifyContent: 'center' }} />
        </div>
      </div>
    </Overlay>
  )
}

// ── Componente principal ───────────────────────────────────────
export default function Game({ cfg, nav }) {
  const [phase, setPhase]       = useState('intro')
  const [level, setLevel]       = useState(1)
  const [finalScore, setFinalScore] = useState(0)
  const muted = false
  const containerRef = useRef(null)
  // Dimensiones del contenedor para scaling
  const [dims, setDims] = useState({ W: 390, H: 844 })

  useEffect(() => {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect()
      setDims({ W: r.width || 390, H: r.height || 844 })
    }
  }, [])

  const scaleX = dims.W / 390
  const scaleY = dims.H / 844

  const handleVictory = useCallback((score) => {
    setFinalScore(score)
    setPhase('victory')
  }, [])

  const handleDefeat = useCallback(() => {
    setPhase('defeat')
  }, [])

  const { renderState, initGame } = useGameLoop({
    level, muted,
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
    ShooterAudio.stopPulse()
    initGame()
    setPhase('intro')
  }

  const handleNextLevel = () => {
    ShooterAudio.stopPulse()
    setLevel(l => Math.min(l + 1, LEVELS.length))
    setPhase('intro')
  }

  const handleBack = () => {
    ShooterAudio.stopPulse()
    nav('games')
  }

  const handleSaveScore = async (name, emoji, score, lvl) => {
    try { await saveShooterScore({ name, emoji, score, level: lvl }) }
    catch (e) { console.warn('Error guardando score:', e) }
  }

  const rs = renderState
  // Camera shake → aplicar al contenedor interno
  const shakeStyle = rs ? {
    transform: `translate(${(rs.shakeX || 0).toFixed(1)}px, ${(rs.shakeY || 0).toFixed(1)}px)`,
  } : {}

  const isActive = phase === 'playing' || phase === 'paused'

  return (
    <div style={{
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
          touchAction: 'none', userSelect: 'none',
        }}
      >
        <SpaceBackground />

        {/* Contenedor con shake */}
        <div style={{ position: 'absolute', inset: 0, ...shakeStyle }}>
          {isActive && rs && (
            <>
              <BossSprite   boss={rs.boss}     scaleX={scaleX} scaleY={scaleY} />
              <PlayerSprite player={rs.player} scaleX={scaleX} scaleY={scaleY} />
              <Bullets      bullets={rs.bullets} scaleX={scaleX} scaleY={scaleY} />
              <PowerUps     powerUps={rs.powerUps} scaleX={scaleX} scaleY={scaleY} />
              <Effects      effects={rs.effects}   scaleX={scaleX} scaleY={scaleY} />
            </>
          )}
        </div>

        {/* HUD (fuera del shake) */}
        {isActive && rs && (
          <>
            <BossHpBar   boss={rs.boss} />
            <PlayerHpBar player={rs.player} />
            <ScoreDisplay score={rs.score} combo={rs.combo} multiplier={rs.multiplier} />
            <PauseButton onPress={handlePause} />
            {/* Etiqueta de nivel */}
            <div style={{
              position: 'absolute', top: 48, left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Press Start 2P',monospace",
              fontSize: 6, color: 'rgba(255,255,255,0.3)',
              zIndex: 25, whiteSpace: 'nowrap',
            }}>
              {LEVELS[Math.min(level - 1, LEVELS.length - 1)].label}
            </div>
          </>
        )}

        {/* Overlays */}
        {phase === 'intro'   && <IntroScreen   level={level} onStart={handleStart} onBack={handleBack} />}
        {phase === 'paused'  && <PauseScreen   onResume={handleResume} onBack={handleBack} />}
        {phase === 'victory' && (
          <VictoryScreen
            score={finalScore} level={level}
            onNextLevel={handleNextLevel}
            onRetry={handleRetry}
            onBack={handleBack}
            onSave={handleSaveScore}
          />
        )}
        {phase === 'defeat' && (
          <DefeatScreen
            score={rs?.score ?? 0} level={level}
            onRetry={handleRetry}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}
