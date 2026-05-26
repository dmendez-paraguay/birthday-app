/**
 * Dragon3D.jsx — Wrapper lazy-loaded del dragón 3D en HomeScreen.
 * Usa React.lazy para no incluir Three.js en el bundle inicial.
 *
 * Interacciones:
 *   - 1 toque/clic  → pirueta
 *   - 2 toques/clics → escupe fuego
 *   - arrastrar      → mover dragón
 *   - merodeo autónomo + piruetas, wiggles, bounces, fuego aleatorios
 */
import { Suspense, lazy } from 'react'

const DragonInner = lazy(() => import('./dragon/DragonInner.jsx'))

export default function Dragon3D() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 6,       // por encima del fondo, debajo del contenido (z-index 10)
        pointerEvents: 'none', // el canvas no bloquea clics en botones
      }}
    >
      {/* pointerEvents "auto" en el canvas para que Three.js capture eventos
          en zonas donde no hay botones de UI */}
      <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
        <Suspense fallback={null}>
          <DragonInner />
        </Suspense>
      </div>
    </div>
  )
}
