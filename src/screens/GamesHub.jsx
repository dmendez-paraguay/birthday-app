/**
 * GamesHub.jsx — Hub selector de mini-juegos.
 * Centraliza el acceso a todos los juegos disponibles.
 */
import { T, btnStyle, cardStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import BackButton from '../components/BackButton.jsx'

const GAMES = [
  {
    id: 'game',
    emoji: '🎈',
    title: 'GLOBOS',
    titleKawaii: 'Globos',
    desc: '¡Revienta globos en 30 segundos! Cuanto más pequeño, más puntos.',
    color: '#ff6b9d',
    glow: '#ff6b9d',
  },
  {
    id: 'shooter',
    emoji: '🚀',
    title: 'SPACE BLASTER',
    titleKawaii: 'Space Blaster',
    desc: 'Disparo automático. Destruí el boss antes de quedarte sin vidas.',
    color: '#00d4ff',
    glow: '#00d4ff',
  },
]

export default function GamesHub({ cfg, nav }) {
  const t = T[cfg.style]
  const isKawaii = cfg.style === 'kawaii'

  return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      position: 'relative', overflow: 'hidden',
      fontFamily: t.fB,
    }}>
      <BgLayer style={cfg.style} />

      <div style={{
        position: 'relative', zIndex: 10,
        padding: '24px 20px 110px',
        maxWidth: 480, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <BackButton t={t} onClick={() => nav('home')} />
          <div style={{
            fontFamily: t.fH,
            color: t.a1,
            fontSize: 'clamp(11px,3vw,16px)',
            flex: 1,
            textShadow: cfg.style === 'arcade' ? `0 0 14px ${t.a1}` : undefined,
          }}>
            {isKawaii ? '🎮 Mini Juegos' : '🎮 MINI JUEGOS'}
          </div>
        </div>

        {/* Subtítulo */}
        <div style={{
          color: t.fg2,
          fontSize: 'clamp(12px,3vw,15px)',
          marginBottom: 22,
          lineHeight: 1.5,
        }}>
          {isKawaii
            ? '¡Elegí tu juego favorito y a ganar! 🌟'
            : 'Elegí un juego y subí al mural de campeones.'}
        </div>

        {/* Cards de juegos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {GAMES.map((g) => (
            <div
              key={g.id}
              style={{
                ...cardStyle(t),
                padding: '20px 18px',
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                border: `1px solid ${g.color}33`,
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onClick={() => nav(g.id)}
            >
              {/* Icono */}
              <div style={{
                width: 64, height: 64,
                borderRadius: cfg.style === 'kawaii' ? '50%' : t.r,
                background: `linear-gradient(135deg, ${g.color}22, ${g.color}08)`,
                border: `1px solid ${g.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, flexShrink: 0,
                boxShadow: `0 0 18px ${g.color}22`,
              }}>
                {g.emoji}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: t.fH,
                  color: g.color,
                  fontSize: 'clamp(10px,2.8vw,14px)',
                  marginBottom: 6,
                  textShadow: cfg.style === 'arcade' ? `0 0 10px ${g.color}` : undefined,
                }}>
                  {isKawaii ? g.titleKawaii : g.title}
                </div>
                <div style={{
                  color: t.fg2,
                  fontSize: 'clamp(11px,2.8vw,13px)',
                  lineHeight: 1.45,
                }}>
                  {g.desc}
                </div>
              </div>

              {/* Flecha */}
              <div style={{
                color: g.color,
                fontSize: 20,
                opacity: 0.7,
                flexShrink: 0,
              }}>›</div>
            </div>
          ))}
        </div>

        {/* Acceso rápido al ranking */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <button
            onClick={() => nav('lb')}
            style={{
              ...btnStyle(t, true),
              width: '100%',
              fontSize: 'clamp(9px,2.5vw,12px)',
            }}
          >
            🏆 {isKawaii ? 'Ver el mural de campeones' : 'VER MURAL DE CAMPEONES'}
          </button>
        </div>
      </div>
    </div>
  )
}
