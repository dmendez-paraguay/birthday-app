/**
 * Dragon3D.jsx — Hero inline del dragón 3D.
 * Import eager (no lazy) → el chunk JS arranca junto con la app.
 * Suspense con fallback 🐉 visible mientras carga el GLB.
 */
import { Suspense } from 'react'
import DragonInner from './dragon/DragonInner.jsx'

export default function Dragon3D({ size = 210 }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <Suspense fallback={
        <div style={{
          width: size, height: size,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: Math.round(size * 0.42),
          animation: 'hero-bounce 2.2s ease-in-out infinite',
        }}>🐉</div>
      }>
        <DragonInner />
      </Suspense>
    </div>
  )
}
