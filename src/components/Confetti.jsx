import { useRef } from 'react'

export default function Confetti({ active }) {
  const pieces = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.8,
      color: ['#ffd700','#ff006e','#00d4ff','#ff6eb4','#00ffc8','#a855f7'][i % 6],
      size: 5 + Math.random() * 9,
      rot: Math.random() * 360,
      dur: 1.4 + Math.random() * 0.8,
      isRect: Math.random() > 0.5,
    }))
  ).current

  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: '-20px',
          width: p.size, height: p.isRect ? p.size * 0.5 : p.size,
          background: p.color, borderRadius: p.isRect ? '2px' : '50%',
          animation: `conffall ${p.dur}s ${p.delay}s ease-in forwards`,
          transform: `rotate(${p.rot}deg)`,
        }} />
      ))}
    </div>
  )
}
