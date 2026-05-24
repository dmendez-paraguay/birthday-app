export const T = {
  arcade: {
    name: '👾 Arcade Neon',
    bg: '#070714', surface: '#0d0d2a',
    a1: '#00d4ff', a2: '#ff006e', a3: '#ffd700',
    fg: '#ffffff', fg2: 'rgba(255,255,255,0.45)',
    card: 'rgba(0,10,50,0.82)', border: 'rgba(0,212,255,0.28)', hi: 'rgba(0,212,255,0.1)',
    fH: "'Press Start 2P',monospace", fB: "'Share Tech Mono',monospace",
    r: '4px', rL: '8px',
  },
  kawaii: {
    name: '🌸 Kawaii',
    bg: '#fff0fc', surface: '#fce7ff',
    a1: '#d946ef', a2: '#f472b6', a3: '#7c3aed',
    fg: '#3b0764', fg2: 'rgba(59,7,100,0.5)',
    card: 'rgba(255,255,255,0.82)', border: 'rgba(217,70,239,0.22)', hi: 'rgba(217,70,239,0.08)',
    fH: "'Fredoka One',cursive", fB: "'Nunito',sans-serif",
    r: '18px', rL: '28px',
  },
  fiesta: {
    name: '🎊 Fiesta',
    bg: '#0b0b0b', surface: '#141414',
    a1: '#ffc800', a2: '#ff0080', a3: '#00ffc8',
    fg: '#ffffff', fg2: 'rgba(255,255,255,0.38)',
    card: 'rgba(255,255,255,0.04)', border: 'rgba(255,200,0,0.2)', hi: 'rgba(255,200,0,0.07)',
    fH: "'Orbitron',sans-serif", fB: "'Exo 2',sans-serif",
    r: '10px', rL: '18px',
  },
}

export const EMOJIS      = ['🦄','🚀','🦊','🐉','⭐','🎯','🦁','🐼','🎮','🌈','🍕','🎸','🏆','🎪','🦋','🌺']
export const BALLOON_COLS = ['#ff6b9d','#c44dff','#4daaff','#ff9f4d','#4dff91','#ff5e5e','#ffd700','#4dffee','#ff6eb4','#a855f7']
export const BALLOON_FACE = ['😄','😎','🤩','😜','🥳','😋','🤪','😻']

export const DEFAULT_CFG = {
  name: 'Alex',
  age: 10,
  date: new Date(Date.now() + 4 * 864e5).toISOString().slice(0, 16),
  style: 'arcade',
  pin: '1234',
  musicOn: true,
}

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&family=Fredoka+One&family=Nunito:wght@400;700;900&family=Orbitron:wght@700;900&family=Exo+2:wght@400;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#000;-webkit-tap-highlight-color:transparent;overflow-x:hidden;}
input:focus{outline:none;}
@keyframes float-up{from{transform:translateY(0);opacity:1;}to{transform:translateY(-110vh);opacity:0.6;}}
@keyframes pts-up{from{opacity:1;transform:translateY(0);}to{opacity:0;transform:translateY(-60px);}}
@keyframes hero-bounce{0%,100%{transform:translateY(0) rotate(-3deg);}50%{transform:translateY(-14px) rotate(3deg);}}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
@keyframes twinkle{from{opacity:0.5;}to{opacity:1;}}
@keyframes scan{0%{top:0%;}100%{top:100%;}}
@keyframes blob1{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(20px,30px) scale(1.06);}}
@keyframes blob2{0%,100%{transform:translate(0,0);}50%{transform:translate(-18px,-22px) scale(1.08);}}
@keyframes ring{0%,100%{opacity:0.35;transform:translate(-50%,-50%) scale(1);}50%{opacity:0.7;transform:translate(-50%,-50%) scale(1.02);}}
@keyframes conffall{0%{transform:translateY(-10px) rotate(0deg);opacity:1;}100%{transform:translateY(110vh) rotate(720deg);opacity:0;}}
@keyframes appear{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes rainbow{0%{background-position:0% 50%;}100%{background-position:300% 50%;}}
`

// ── Helpers de estilos reutilizables ───────────────────────────
export function btnStyle(t, secondary = false, danger = false) {
  return {
    padding: secondary ? '9px 18px' : '12px 26px',
    fontFamily: t.fH,
    fontSize: 'clamp(8px,2.2vw,11px)',
    letterSpacing: '1.5px',
    cursor: 'pointer',
    borderRadius: t.r,
    transition: 'all 0.18s',
    background: danger
      ? 'transparent'
      : secondary
      ? 'transparent'
      : `linear-gradient(135deg,${t.a1}18,${t.a2}10)`,
    border: `${secondary || danger ? '1px' : '2px'} solid ${
      danger ? t.a2 : secondary ? t.border : t.a1
    }`,
    color: danger ? t.a2 : secondary ? t.fg2 : t.a1,
    boxShadow: secondary || danger ? 'none' : `0 0 18px ${t.a1}30`,
  }
}

export function cardStyle(t, glow = false) {
  return {
    background: t.card,
    border: `1px solid ${glow ? t.a1 : t.border}`,
    borderRadius: t.rL,
    backdropFilter: 'blur(16px)',
    boxShadow: glow
      ? `0 0 24px ${t.a1}28,0 8px 32px rgba(0,0,0,0.25)`
      : '0 4px 24px rgba(0,0,0,0.2)',
  }
}
