import { T } from '../themes.js'

export default function NavBar({ cfg, nav, screen, muted, toggleMute }) {
  const t = T[cfg.style]
  const items = [['home','🏠'],['game','🎮'],['shooter','🚀'],['lb','🏆'],['rsvp','📋']]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'center',
      padding: '10px 20px 18px',
      background: `linear-gradient(to top,${t.bg}f0 60%,transparent)`,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', gap: 4, alignItems: 'center',
        background: t.card, border: `1px solid ${t.border}`,
        borderRadius: 50, padding: '7px 10px',
        backdropFilter: 'blur(24px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.35),0 0 0 1px ${t.a1}18`,
        pointerEvents: 'all',
      }}>
        {items.map(([s, icon]) => {
          const active = screen === s
          return (
            <button key={s} onClick={() => nav(s)} style={{
              width: 46, height: 46, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 22, border: 'none', cursor: 'pointer',
              borderRadius: 36,
              background: active ? `${t.a1}28` : 'transparent',
              boxShadow: active ? `0 0 14px ${t.a1}55` : 'none',
              transition: 'all 0.2s', position: 'relative',
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
        <div style={{ width: 1, height: 26, background: t.border, margin: '0 2px' }} />
        <button onClick={toggleMute} style={{
          width: 46, height: 46, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 20, border: 'none', cursor: 'pointer',
          borderRadius: 36, background: 'transparent',
          opacity: muted ? 0.5 : 1, transition: 'opacity 0.2s',
        }}>
          {muted ? '🔇' : '🔊'}
        </button>
        <button onClick={() => nav('admin')} style={{
          width: 46, height: 46, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 20, border: 'none', cursor: 'pointer',
          borderRadius: 36,
          background: screen === 'admin' ? `${t.a1}20` : 'transparent',
        }}>
          ⚙️
        </button>
      </div>
    </div>
  )
}
