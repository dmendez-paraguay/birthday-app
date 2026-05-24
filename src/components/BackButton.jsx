/**
 * BackButton.jsx — Botón de volver uniforme para todas las pantallas.
 * Uso: <BackButton t={t} onClick={() => nav('home')} />
 */
import { T, btnStyle } from '../themes.js'

export default function BackButton({ t, onClick, label, style: extraStyle }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...btnStyle(t, true),
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 16px',
        fontSize: 'clamp(9px,2.4vw,12px)',
        ...extraStyle,
      }}
    >
      <span style={{ fontSize: '1.1em', lineHeight: 1 }}>←</span>
      <span>{label || 'Volver'}</span>
    </button>
  )
}
