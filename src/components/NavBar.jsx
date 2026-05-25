import { T } from '../themes.js'

/**
 * NavBar — barra de navegación inferior.
 * Responsive: botones escalan con viewport, nunca desbordan en pantallas ≥320px.
 * Safe area: respeta la barra de gestos Android y el Home Indicator de iPhone.
 */
export default function NavBar({ cfg, nav, screen, muted, toggleMute }) {
  const t = T[cfg.style]

  // Ancho de cada botón: como mucho 44px, pero escala para no desbordar.
  // 7 elementos + ~50px de gaps/padding/separador = 50px fijo.
  // Cada botón: min(44px, (viewport - 50px) / 7)
  const btnSize = 'min(44px, calc((100vw - 50px) / 7))'
  const iconSize = 'clamp(16px, 4.5vw, 22px)'

  const items = [
    ['home',   '🏠'],
    ['games',  '🎮'],
    ['lb',     '🏆'],
    ['photos', '📷'],
    ['rsvp',   '📋'],
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'center',
      paddingTop: 8,
      paddingLeft: 12, paddingRight: 12,
      // safe-area-inset-bottom para iPhone y Android con gestos
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      background: `linear-gradient(to top,${t.bg}f4 65%,transparent)`,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', gap: 'clamp(1px, 1vw, 4px)', alignItems: 'center',
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 50,
        padding: '6px clamp(6px, 2vw, 10px)',
        backdropFilter: 'blur(24px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${t.a1}18`,
        pointerEvents: 'all',
        maxWidth: 'calc(100vw - 24px)',
      }}>

        {items.map(([s, icon]) => {
          const active = screen === s
            || (s === 'games' && (screen === 'game' || screen === 'shooter'))
          return (
            <button key={s} onClick={() => nav(s)} style={{
              width: btnSize,
              height: btnSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: iconSize,
              border: 'none', cursor: 'pointer',
              borderRadius: 36, flexShrink: 0,
              background: active ? `${t.a1}28` : 'transparent',
              boxShadow: active ? `0 0 14px ${t.a1}55` : 'none',
              transition: 'all 0.2s',
              position: 'relative',
            }}>
              {icon}
              {active && (
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
        <div style={{
          width: 1, height: 24, background: t.border,
          margin: `0 clamp(1px, 0.5vw, 3px)`,
          flexShrink: 0,
        }} />

        {/* Mute */}
        <button onClick={toggleMute} style={{
          width: btnSize, height: btnSize,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: iconSize,
          border: 'none', cursor: 'pointer',
          borderRadius: 36, flexShrink: 0,
          background: 'transparent',
          opacity: muted ? 0.45 : 1, transition: 'opacity 0.2s',
        }}>
          {muted ? '🔇' : '🔊'}
        </button>

        {/* Admin */}
        <button onClick={() => nav('admin')} style={{
          width: btnSize, height: btnSize,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: iconSize,
          border: 'none', cursor: 'pointer',
          borderRadius: 36, flexShrink: 0,
          background: screen === 'admin' ? `${t.a1}20` : 'transparent',
        }}>
          ⚙️
        </button>
      </div>
    </div>
  )
}
