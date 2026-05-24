import { T } from '../themes.js'

export default function BgLayer({ style: s }) {
  const t = T[s]
  if (s === 'arcade') return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(1px 1px at 12% 18%,#fff,transparent),
          radial-gradient(1px 1px at 38% 42%,rgba(255,255,255,0.7),transparent),
          radial-gradient(1px 1px at 65% 12%,#fff,transparent),
          radial-gradient(1px 1px at 82% 65%,rgba(255,255,255,0.8),transparent),
          radial-gradient(1px 1px at 22% 72%,rgba(0,212,255,0.5),transparent),
          radial-gradient(2px 2px at 50% 85%,rgba(255,0,110,0.35),transparent),
          radial-gradient(1px 1px at 90% 30%,rgba(255,215,0,0.4),transparent)`,
        animation: 'twinkle 4s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
        background: `repeating-linear-gradient(90deg,transparent,transparent 49px,${t.a1}18 50px),
          repeating-linear-gradient(0deg,transparent,transparent 24px,${t.a1}12 25px)`,
        transform: 'perspective(280px) rotateX(60deg)', transformOrigin: 'bottom',
        maskImage: 'linear-gradient(to top,black 30%,transparent)',
      }} />
    </div>
  )
  if (s === 'kawaii') return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {[
        [350, 350, '#ffb3e6', '-120px', '-100px', undefined, undefined, 'blob1 6s'],
        [280, 280, '#c4b5fd', undefined, undefined, '40%', '-80px', 'blob2 8s'],
        [220, 220, '#93c5fd', '-60px', undefined, undefined, '28%', 'blob1 7s'],
      ].map(([w, h, c, top, left, bottom, right, anim], i) => (
        <div key={i} style={{
          position: 'absolute', width: w, height: h, borderRadius: '50%',
          background: c, filter: 'blur(70px)', opacity: 0.33,
          top, left, bottom, right, animation: anim + ' ease-in-out infinite',
        }} />
      ))}
    </div>
  )
  if (s === 'fiesta') return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 18% 78%,${t.a1}0d,transparent 50%),
          radial-gradient(circle at 82% 18%,${t.a2}0d,transparent 50%),
          radial-gradient(circle at 50% 50%,${t.a3}08,transparent 70%)`,
      }} />
      {[400, 620, 820].map((sz, i) => (
        <div key={sz} style={{
          position: 'absolute', width: sz, height: sz, borderRadius: '50%',
          border: `1px solid rgba(255,200,0,${0.1 - i * 0.03})`,
          top: '50%', left: '50%',
          animation: `ring ${4 + i}s ${i * 1.2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  )
  return null
}
