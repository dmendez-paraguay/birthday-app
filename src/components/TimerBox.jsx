import { T } from '../themes.js'

export default function TimerBox({ val, lbl, style: s }) {
  const t = T[s]
  const base = {
    // Tamaños completamente fluidos: min más bajo para soportar pantallas de 320-360px
    width:  'clamp(52px, 13vw, 80px)',
    height: 'clamp(52px, 13vw, 80px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: t.fH,
    fontSize: 'clamp(17px, 4.5vw, 33px)',
    color: t.a1, borderRadius: t.r,
    position: 'relative', overflow: 'hidden',
    flexShrink: 0,
  }
  const box =
    s === 'arcade'
      ? { ...base, background: `linear-gradient(180deg,#0a0a2e,#060613)`, border: `2px solid ${t.a1}`, boxShadow: `0 0 18px ${t.a1}44,inset 0 0 18px ${t.a1}08`, textShadow: `0 0 12px ${t.a1}` }
      : s === 'kawaii'
      ? { ...base, background: '#fff', boxShadow: `0 5px 0 ${t.a1}44,0 8px 24px ${t.a1}22`, border: `2px solid ${t.border}`, borderRadius: 20 }
      : { ...base, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, backdropFilter: 'blur(10px)', boxShadow: `inset 0 0 0 1px ${t.a1}20` }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      <div style={box}>
        {s === 'arcade' && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '1px',
            background: `linear-gradient(90deg,transparent,${t.a1},transparent)`,
            animation: 'scan 2s linear infinite',
          }} />
        )}
        {val}
      </div>
      {/* Etiqueta responsive */}
      <div style={{
        fontFamily: t.fH,
        color: t.fg2,
        fontSize: 'clamp(8px, 2.2vw, 10px)',
        letterSpacing: '0.5px',
        whiteSpace: 'nowrap',
      }}>
        {lbl}
      </div>
    </div>
  )
}
