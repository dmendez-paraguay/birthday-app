/**
 * FireParticles.jsx — InstancedMesh de 60 partículas de fuego.
 * IMPORTANTE: debe renderizarse en el nivel de la escena (fuera del grupo del dragón)
 * para que las posiciones sean en world-space y no en local-space.
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 60

const PALETTE = [
  new THREE.Color('#fff9c4'), // amarillo pálido
  new THREE.Color('#ffd700'), // dorado
  new THREE.Color('#ff8c00'), // naranja
  new THREE.Color('#ff4500'), // rojo-naranja
  new THREE.Color('#cc1500'), // rojo oscuro
]

export default function FireParticles({ active, dragonRef }) {
  const meshRef = useRef()
  const emitAcc = useRef(0)
  const pool = useMemo(() => Array.from({ length: COUNT }, () => ({
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 1,
    alive: false,
  })), [])
  const dummy   = useMemo(() => new THREE.Object3D(), [])
  const colBuf  = useMemo(() => new THREE.Color(), [])
  const mouthV  = useMemo(() => new THREE.Vector3(), [])

  /** Posición boca del dragón en world-space */
  const getMouth = () => {
    if (!dragonRef?.current) return new THREE.Vector3(0, 1, 0.8)
    // Asegura que la matriz esté actualizada antes de transformar
    dragonRef.current.updateWorldMatrix(true, false)
    mouthV.set(0, 0.9, 0.8)
    return dragonRef.current.localToWorld(mouthV.clone())
  }

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Emitir partículas cuando activo
    if (active) {
      emitAcc.current += delta * 38
      while (emitAcc.current >= 1) {
        emitAcc.current -= 1
        const p = pool.find(p => !p.alive)
        if (p) {
          const mouth = getMouth()
          p.alive   = true
          p.maxLife = 0.35 + Math.random() * 0.45
          p.life    = p.maxLife
          p.pos.copy(mouth).add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.15,
            0,
          ))
          p.vel.set(
            (Math.random() - 0.5) * 1.8,
            1.8 + Math.random() * 2.8,
            (Math.random() - 0.5) * 0.6,
          )
        }
      }
    } else {
      emitAcc.current = 0
    }

    // Actualizar pool
    pool.forEach((p, i) => {
      if (!p.alive) {
        dummy.position.set(0, -9999, 0)
        dummy.scale.setScalar(0.001)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
        return
      }

      p.life -= delta
      if (p.life <= 0) {
        p.alive = false
        dummy.position.set(0, -9999, 0)
        dummy.scale.setScalar(0.001)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
        return
      }

      // Física: sube y se dispersa
      p.vel.y -= delta * 0.5  // muy poca gravedad (llamas van hacia arriba)
      p.pos.addScaledVector(p.vel, delta)

      const ratio = p.life / p.maxLife         // 1=nueva, 0=muerta
      const sc    = 0.09 * ratio * (0.6 + Math.random() * 0.8)

      dummy.position.copy(p.pos)
      dummy.scale.setScalar(sc)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Gradiente de color: amarillo → rojo
      const ci   = Math.min(Math.floor((1 - ratio) * (PALETTE.length - 1)), PALETTE.length - 2)
      const frac = ((1 - ratio) * (PALETTE.length - 1)) % 1
      colBuf.lerpColors(PALETTE[ci], PALETTE[ci + 1], frac)
      meshRef.current.setColorAt(i, colBuf)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshBasicMaterial vertexColors transparent opacity={0.9} depthWrite={false} />
    </instancedMesh>
  )
}
