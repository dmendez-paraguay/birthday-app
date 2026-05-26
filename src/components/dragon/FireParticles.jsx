/**
 * FireParticles.jsx — Sistema de partículas de fuego usando InstancedMesh.
 * ~60 esferas que imitan llamas emanando de la boca del dragón.
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 60

const FIRE_PALETTE = [
  new THREE.Color('#fff176'), // amarillo claro
  new THREE.Color('#ffd700'), // dorado
  new THREE.Color('#ff8c00'), // naranja
  new THREE.Color('#ff4500'), // rojo-naranja
  new THREE.Color('#cc1500'), // rojo oscuro
]

export default function FireParticles({ active, dragonRef }) {
  const meshRef = useRef()
  const emitAccRef = useRef(0)
  const tRef = useRef(0)

  // Pool de partículas
  const pool = useMemo(() => Array.from({ length: COUNT }, () => ({
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 1,
    alive: false,
  })), [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorBuf = useMemo(() => new THREE.Color(), [])

  /** Obtiene posición de la boca del dragón en world-space */
  const getMouthWorld = () => {
    if (!dragonRef?.current) return new THREE.Vector3(0, 1, 1)
    const local = new THREE.Vector3(0, 0.85, 0.9)
    return dragonRef.current.localToWorld(local)
  }

  useFrame((_, delta) => {
    if (!meshRef.current) return
    tRef.current += delta

    // Emitir nuevas partículas si activo
    if (active) {
      emitAccRef.current += delta * 35
      while (emitAccRef.current >= 1) {
        emitAccRef.current -= 1
        const dead = pool.find(p => !p.alive)
        if (dead) {
          const mouth = getMouthWorld()
          dead.alive = true
          dead.maxLife = 0.35 + Math.random() * 0.45
          dead.life = dead.maxLife
          dead.pos.copy(mouth).add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.18,
            (Math.random() - 0.5) * 0.12,
            (Math.random() - 0.5) * 0.1,
          ))
          // Velocidad: hacia arriba y ligeramente hacia los lados
          dead.vel.set(
            (Math.random() - 0.5) * 2.0,
            1.5 + Math.random() * 2.5,
            (Math.random() - 0.5) * 0.8,
          )
        }
      }
    } else {
      emitAccRef.current = 0
    }

    // Actualizar partículas
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

      // Física simple: gravedad reducida (el fuego sube)
      p.vel.y -= delta * 0.4
      p.pos.addScaledVector(p.vel, delta)

      const ratio = p.life / p.maxLife  // 1=recién nacida, 0=muriendo
      const scale = 0.10 * ratio * (0.7 + Math.random() * 0.6)

      dummy.position.copy(p.pos)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Color: amarillo→naranja→rojo según vejez
      const ci = Math.min(Math.floor((1 - ratio) * (FIRE_PALETTE.length - 1)), FIRE_PALETTE.length - 2)
      const frac = ((1 - ratio) * (FIRE_PALETTE.length - 1)) % 1
      colorBuf.lerpColors(FIRE_PALETTE[ci], FIRE_PALETTE[ci + 1], frac)
      meshRef.current.setColorAt(i, colorBuf)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshBasicMaterial vertexColors transparent opacity={0.92} depthWrite={false} />
    </instancedMesh>
  )
}
