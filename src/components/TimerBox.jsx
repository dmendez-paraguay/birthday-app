import { T } from '../themes.js'

export default function TimerBox({ val, lbl, style: s }) {
  const t = T[s]
  const base = {
    width: 'clamp(62px,14vw,80px)', height: 'clamp(62px,14vw,80px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: t.fH, fontSize: 'clamp(20px,5vw,34px)',
    color: t.a1, borderRadius: t.r,
    position: 'relative', overflow: 'hidden',
  }
  const box =
    s === 'arcade'
      ? { ...base, background: `linear-gradient(180deg,#0a0a2e,#060613)`, border: `2px solid ${t.a1}`, boxShadow: `0 0 18px ${t.a1}44,inset 0 0 18px ${t.a1}08`, textShadow: `0 0 12px ${t.a1}` }
      : s === 'kawaii'
      ? { ...base, background: '#fff', boxShadow: `0 5px 0 ${t.a1}44,0 8px 24px ${t.a1}22`, border: `2px solid ${t.border}`, borderRadius: 20 }
      : { ...base, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, backdropFilter: 'blur(10px)', boxShadow: `inset 0 0 0 1px ${t.a1}20` }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
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
      <div style={{ fontFamily: t.fH, color: t.fg2, fontSize: 'clamp(5px,1.4vw,8px)', letterSpacing: '1px' }}>
        {lbl}
      </div>
    </div>
  )
}
