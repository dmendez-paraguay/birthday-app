import { useState, useEffect, useRef, useCallback } from 'react'
import { T, BALLOON_COLS, BALLOON_FACE, btnStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import GameOver from './GameOver.jsx'
import { Audio } from '../lib/audio.js'

let _bid = 0

export default function BalloonGame({ cfg, nav }) {
  const t = T[cfg.style]
  const [phase, setPhase] = useState('ready')   // ready | playing | done
  const [balloons, setBalloons] = useState([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [pops, setPops] = useState([])
  const scoreRef = useRef(0)
  const timerRef = useRef(null)
  const spawnRef = useRef(null)
  const elRef = useRef(0)

  const spawnBalloon = useCallback(() => {
    const size = 52 + Math.random() * 50
    const pts = Math.round(150 - size + 50)
    const color = BALLOON_COLS[Math.floor(Math.random() * BALLOON_COLS.length)]
    const face = BALLOON_FACE[Math.floor(Math.random() * BALLOON_FACE.length)]
    const id = ++_bid
    const dur = Math.max(2600, 4200 - elRef.current * 80 + Math.random() * 800)
    setBalloons(b => [...b, { id, x: 4 + Math.random() * 82, size, pts, color, face, dur }])
    setTimeout(() => setBalloons(b => b.filter(x => x.id !== id)), dur + 300)
  }, [])

  const clearSpawn = () => { if (spawnRef.current) clearTimeout(spawnRef.current) }

  const startGame = () => {
    Audio.init()
    Audio.startMusic()
    setPhase('playing')
    setScore(0)
    setBalloons([])
    setPops([])
    scoreRef.current = 0
    elRef.current = 0
    let left = 30
    setTimeLeft(30)

    timerRef.current = setInterval(() => {
      left--
      elRef.current++
      setTimeLeft(left)
      if (left <= 0) {
        clearInterval(timerRef.current)
        clearSpawn()
        setPhase('done')
        Audio.playVictory()
      }
    }, 1000)

    const scheduleSpawn = () => {
      spawnBalloon()
      const interval = elRef.current > 20 ? 550 : elRef.current > 10 ? 850 : 1250
      spawnRef.current = setTimeout(scheduleSpawn, interval)
    }
    scheduleSpawn()
  }

  const popBalloon = (b, e) => {
    e.stopPropagation()
    setBalloons(prev => prev.filter(x => x.id !== b.id))
    const ns = scoreRef.current + b.pts
    scoreRef.current = ns
    setScore(ns)
    const pid = Date.now() + Math.random()
    setPops(p => [...p, { id: pid, x: b.x, pts: b.pts }])
    setTimeout(() => setPops(p => p.filter(x => x.id !== pid)), 700)
    Audio.playPop()
  }

  useEffect(() => () => { clearInterval(timerRef.current); clearSpawn() }, [])

  if (phase === 'done') return (
    <GameOver
      score={scoreRef.current}
      cfg={cfg}
      onReplay={startGame}
      onBack={() => nav('home')}
    />
  )

  return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      fontFamily: t.fB, position: 'relative', overflow: 'hidden',
    }}>
      <BgLayer style={cfg.style} />

      {/* HUD */}
      <div style={{
        position: 'relative', zIndex: 20,
        padding: '12px 20px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        background: t.card, borderBottom: `1px solid ${t.border}`,
        backdropFilter: 'blur(16px)',
      }}>
        <button
          onClick={() => { clearInterval(timerRef.current); clearSpawn(); nav('home') }}
          style={{ ...btnStyle(t, true), padding: '7px 12px' }}
        >←</button>
        <div style={{ fontFamily: t.fH, color: t.a3, fontSize: 'clamp(10px,2.8vw,16px)' }}>
          {score.toLocaleString()} PTS
        </div>
        <div style={{
          fontFamily: t.fH, fontSize: 'clamp(10px,2.8vw,16px)',
          color: timeLeft <= 10 ? t.a2 : t.a1,
          animation: timeLeft <= 10 ? 'pulse 0.5s ease-in-out infinite' : 'none',
        }}>{timeLeft}s</div>
      </div>

      {/* Game area */}
      <div style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        {phase === 'ready' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 20, padding: 24,
          }}>
            <div style={{ fontSize: 80, animation: 'hero-bounce 1.8s ease-in-out infinite' }}>🎈</div>
            <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(12px,3.5vw,18px)', textAlign: 'center' }}>
              {cfg.style === 'kawaii' ? '¡Explota los globos!' : 'EXPLOTA LOS GLOBOS'}
            </div>
            <div style={{ color: t.fg2, fontSize: 'clamp(12px,3vw,15px)', textAlign: 'center', maxWidth: 260, lineHeight: 1.6 }}>
              Tienes 30 segundos · Globos pequeños = más puntos 🎯
            </div>
            <button onClick={startGame} style={{ ...btnStyle(t), fontSize: 'clamp(10px,3vw,14px)', padding: '14px 32px' }}>
              {cfg.style === 'kawaii' ? '🎈 ¡Jugar!' : '▶ INICIAR'}
            </button>
          </div>
        )}

        {phase === 'playing' && <>
          {balloons.map(b => (
            <div
              key={b.id}
              onClick={e => popBalloon(b, e)}
              style={{
                position: 'absolute', left: `${b.x}%`, bottom: '-120px',
                animation: `float-up ${b.dur}ms linear forwards`,
                cursor: 'pointer', userSelect: 'none', zIndex: 5,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              <div style={{
                width: b.size, height: b.size * 1.15,
                borderRadius: '50% 50% 47% 47%',
                background: `radial-gradient(circle at 32% 30%,${b.color}cc,${b.color})`,
                boxShadow: `0 6px 24px ${b.color}55,inset 0 -6px 12px rgba(0,0,0,0.18),inset 3px 3px 8px rgba(255,255,255,0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: b.size * 0.38, transition: 'transform 0.08s',
              }}>{b.face}</div>
              <div style={{ width: 2, height: b.size * 0.28, background: b.color, opacity: 0.5, borderRadius: 2 }} />
            </div>
          ))}

          {pops.map(p => (
            <div key={p.id} style={{
              position: 'absolute', left: `${p.x}%`, bottom: '35%',
              fontFamily: t.fH, color: t.a3, fontSize: 'clamp(12px,3vw,17px)',
              animation: 'pts-up 0.7s ease-out forwards', zIndex: 15,
              textShadow: '0 2px 8px rgba(0,0,0,0.6)', pointerEvents: 'none',
            }}>+{p.pts}</div>
          ))}
        </>}
      </div>
    </div>
  )
}
