import { useState, useRef, useEffect } from 'react'
import { T } from '../themes.js'

/**
 * NavBar — barra de navegación inferior.
 * El botón 📷 está bloqueado hasta cfg.date. 4 toques rápidos = admin unlock.
 */
export default function NavBar({ cfg, nav, screen, muted, toggleMute }) {
  const t = T[cfg.style]

  // ── Lógica de bloqueo de la cámara ──────────────────────────────────────────
  const eventDate    = cfg.date ? new Date(cfg.date) : null
  const [adminUnlocked, setAdminUnlocked] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem('cam_admin_unlock') === '1'
  )
  const [toast, setToast] = useState(false)
  const tapTimesRef  = useRef([])
  const toastTimer   = useRef(null)

  const isLocked = eventDate && new Date() < eventDate && !adminUnlocked

  // Countdown en segundos hasta el evento
  const [secsLeft, setSecsLeft] = useState(0)
  useEffect(() => {
    if (!isLocked) return
    const tick = () => {
      const diff = Math.max(0, Math.floor((eventDate - new Date()) / 1000))
      setSecsLeft(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isLocked]) // eslint-disable-line react-hooks/exhaustive-deps

  const fmtCountdown = (s) => {
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    const p = n => String(n).padStart(2, '0')
    return d > 0 ? `${d}d ${p(h)}h ${p(m)}m` : `${p(h)}:${p(m)}:${p(ss)}`
  }

  const handlePhotoTap = () => {
    if (!isLocked) { nav('photos'); return }

    // 4-tap admin unlock (menos de 2s entre el primero y el cuarto)
    const now = Date.now()
    tapTimesRef.current = [...tapTimesRef.current, now].filter(t => now - t < 2000)
    if (tapTimesRef.current.length >= 5) {
      sessionStorage.setItem('cam_admin_unlock', '1')
      setAdminUnlocked(true)
      tapTimesRef.current = []
      nav('photos')
      return
    }

    // Mostrar toast informativo
    clearTimeout(toastTimer.current)
    setToast(true)
    toastTimer.current = setTimeout(() => setToast(false), 2000)
  }

  // ── Tamaños responsive ───────────────────────────────────────────────────────
  const btnSize  = 'min(44px, calc((100vw - 50px) / 7))'
  const iconSize = 'clamp(16px, 4.5vw, 22px)'

  const items = [
    { screen: 'home',   icon: '🏠' },
    { screen: 'games',  icon: '🎮' },
    { screen: 'lb',     icon: '🏆' },
    { screen: 'photos', icon: '📷', locked: isLocked },
    { screen: 'rsvp',   icon: '📋' },
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'center',
      paddingTop: 8, paddingLeft: 12, paddingRight: 12,
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      background: `linear-gradient(to top,${t.bg}f4 65%,transparent)`,
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes shimmer-lock {
          0%,100% { box-shadow: 0 0 6px rgba(255,215,0,0.15), 0 0 0 1px rgba(255,215,0,0.1); }
          50%      { box-shadow: 0 0 18px rgba(255,215,0,0.55), 0 0 0 1px rgba(255,215,0,0.35); }
        }
      `}</style>

      <div style={{
        display: 'flex', gap: 'clamp(1px, 1vw, 4px)', alignItems: 'center',
        background: t.card, border: `1px solid ${t.border}`,
        borderRadius: 50, padding: '6px clamp(6px, 2vw, 10px)',
        backdropFilter: 'blur(24px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${t.a1}18`,
        pointerEvents: 'all', maxWidth: 'calc(100vw - 24px)',
        position: 'relative',
      }}>

        {items.map(({ screen: s, icon, locked }) => {
          const active = screen === s
            || (s === 'games' && ['game', 'shooter', 'pinata', 'memory'].includes(screen))
          const onTap = s === 'photos' ? handlePhotoTap : () => nav(s)

          return (
            <button key={s} onClick={onTap} style={{
              width: btnSize, height: btnSize,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: locked ? 'clamp(14px,4vw,20px)' : iconSize,
              border: 'none', cursor: 'pointer',
              borderRadius: 36, flexShrink: 0,
              background: active ? `${t.a1}28` : 'transparent',
              boxShadow: active ? `0 0 14px ${t.a1}55` : 'none',
              transition: 'all 0.2s',
              position: 'relative',
              opacity: locked ? 0.6 : 1,
              animation: locked ? 'shimmer-lock 2.2s ease-in-out infinite' : 'none',
              filter: locked ? 'grayscale(0.4)' : 'none',
            }}>
              {icon}
              {/* Badge de candado */}
              {locked && (
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  fontSize: 9, lineHeight: 1,
                  background: 'rgba(0,0,0,0.75)',
                  borderRadius: '50%', width: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,215,0,0.5)',
                }}>🔒</div>
              )}
              {/* Punto activo */}
              {active && !locked && (
                <div style={{
                  position: 'absolute', bottom: 3, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%', background: t.a1,
                }} />
              )}
            </button>
          )
        })}

        {/* Separador */}
        <div style={{ width: 1, height: 24, background: t.border, margin: `0 clamp(1px, 0.5vw, 3px)`, flexShrink: 0 }} />

        {/* Mute */}
        <button onClick={toggleMute} style={{
          width: btnSize, height: btnSize,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: iconSize, border: 'none', cursor: 'pointer',
          borderRadius: 36, flexShrink: 0, background: 'transparent',
          opacity: muted ? 0.45 : 1, transition: 'opacity 0.2s',
        }}>{muted ? '🔇' : '🔊'}</button>

        {/* Admin */}
        <button onClick={() => nav('admin')} style={{
          width: btnSize, height: btnSize,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: iconSize, border: 'none', cursor: 'pointer',
          borderRadius: 36, flexShrink: 0,
          background: screen === 'admin' ? `${t.a1}20` : 'transparent',
        }}>⚙️</button>

        {/* Toast: se muestra cuando la cámara está bloqueada y alguien la toca */}
        {toast && isLocked && (
          <div style={{
            position: 'absolute',
            bottom: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10,5,30,0.95)',
            border: '1px solid rgba(255,215,0,0.4)',
            borderRadius: 12,
            padding: '10px 16px',
            textAlign: 'center',
            maxWidth: 'min(280px, calc(100vw - 32px))',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 20px rgba(255,215,0,0.15)',
            animation: 'appear 0.18s ease-out',
            zIndex: 200,
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>🔒</div>
            <div style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 10, color: '#ffd700', letterSpacing: 0.5, marginBottom: 4,
            }}>GALERÍA BLOQUEADA</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>
              Se desbloquea en:
            </div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: '#fff', marginTop: 2 }}>
              {fmtCountdown(secsLeft)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
