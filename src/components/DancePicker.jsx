/**
 * DancePicker.jsx — Selector de bailecito para el ranking.
 *
 * Muestra el emoji del usuario haciendo cada baile en tiempo real,
 * para que el jugador pueda elegir su movimiento favorito antes de guardar.
 *
 * Props:
 *   t            — objeto de tema (T.arcade, T.kawaii, etc.)
 *   value        — id del baile seleccionado ('none', 'bounce', etc.)
 *   onChange     — (id: string) => void
 *   previewEmoji — el emoji del avatar del jugador (para preview en vivo)
 */
import { DANCES } from '../themes.js'

export default function DancePicker({ t, value, onChange, previewEmoji = '🎮' }) {
  return (
    <div>
      <div style={{
        fontFamily: t.fH,
        fontSize: 'clamp(7px, 1.8vw, 9px)',
        color: t.fg2,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: '1px',
      }}>
        ¡ELEGÍ TU BAILECITO!
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 5,
        justifyContent: 'center',
      }}>
        {DANCES.map(d => {
          const selected = value === d.id
          return (
            <button
              key={d.id}
              onClick={() => onChange(d.id)}
              title={d.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '6px 7px',
                minWidth: 44,
                background: selected
                  ? `${t.a1}28`
                  : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${selected ? t.a1 : t.border}`,
                borderRadius: t.r || '8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: selected ? `0 0 12px ${t.a1}44` : 'none',
              }}
            >
              {/* El emoji del usuario bailando — preview en vivo */}
              <span style={{
                fontSize: 20,
                display: 'inline-block',          // necesario para que CSS transforms funcionen
                animation: d.anim || 'none',
              }}>
                {previewEmoji}
              </span>

              <span style={{
                fontFamily: t.fH,
                fontSize: 'clamp(5px, 1.3vw, 7px)',
                color: selected ? t.a1 : t.fg2,
                whiteSpace: 'nowrap',
              }}>
                {d.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
