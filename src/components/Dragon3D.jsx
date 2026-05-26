/**
 * Dragon3D.jsx — Wrapper lazy-loaded del dragón 3D.
 * position:fixed para viewport coordinates exactas.
 * pointer-events:none en el outer div → los botones de UI siguen recibiendo clics.
 * pointer-events:auto en el inner div → el canvas 3D recibe clics para el dragón.
 */
import { Suspense, lazy } from 'react'

const DragonInner = lazy(() => import('./dragon/DragonInner.jsx'))

export default function Dragon3D() {
  return (
    // Outer: fixed al viewport, z-index 6 (bajo el contenido en z-10, sobre BgLayer)
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 6,
      pointerEvents: 'none',
    }}>
      {/* Inner: posicionado absolutamente para que R3F mida el tamaño correctamente */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
      }}>
        <Suspense fallback={null}>
          <DragonInner />
        </Suspense>
      </div>
    </div>
  )
}
