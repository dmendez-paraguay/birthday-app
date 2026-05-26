/**
 * DragonInner.jsx — Escena Three.js del dragón autónomo.
 * Cargado de forma lazy por Dragon3D.jsx para mantener el bundle inicial liviano.
 *
 * Interacciones:
 *   1 clic en el dragón  → pirueta
 *   2 clics / doble toque → escupe fuego
 *   arrastrar             → relocalizar dragón
 */
import { useRef, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useDragonAI, DS } from './useDragonAI.js'
import FireParticles from './FireParticles.jsx'

// Precargar modelo tan pronto como este módulo se importe
useGLTF.preload('/models/dragoncito.glb')

/* ── Iluminación ─────────────────────────────── */
function Lights() {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 8, 6]}  intensity={2.0} color="#ffe8c8" />
      <directionalLight position={[-4, 2, 3]} intensity={0.6} color="#c8e8ff" />
      <pointLight        position={[0, 3, 5]} intensity={1.1} color="#ff9a00" />
    </>
  )
}

/* ── Escena principal (dentro del Canvas) ─────── */
function DragonScene({ aiProps }) {
  const { state, targetPos, triggerPirouette, triggerFire, setTarget } = aiProps
  const { camera, gl } = useThree()

  // Grupo raíz del dragón (para raycasting y partículas)
  const dragonRef = useRef()

  // Cargar modelo GLB (draco-compressed)
  const { scene: gltfScene } = useGLTF('/models/dragoncito.glb')

  // Normalizar modelo a ~2.2 unidades y centrarlo
  const [modelScale, modelCenter] = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltfScene)
    const sz  = box.getSize(new THREE.Vector3())
    const maxD = Math.max(sz.x, sz.y, sz.z)
    const s = maxD > 0 ? 2.2 / maxD : 1
    const c = box.getCenter(new THREE.Vector3())
    return [s, c]
  }, [gltfScene])

  // Refs de animación
  const tRef    = useRef(0)
  const curPos  = useRef({ x: 1.5, y: -0.5 })
  const pirYRef = useRef(0)

  // Refs de interacción
  const isDrag       = useRef(false)
  const dragDist     = useRef(0)
  const prevPtr      = useRef({ x: 0, y: 0 })
  const raycaster    = useRef(new THREE.Raycaster())
  const lastTapTime  = useRef(0)

  /* Convierte coordenadas cliente → NDC del canvas */
  const toNDC = useCallback((cx, cy) => {
    const r = gl.domElement.getBoundingClientRect()
    return {
      x:  ((cx - r.left) / r.width)  * 2 - 1,
      y: -((cy - r.top)  / r.height) * 2 + 1,
    }
  }, [gl])

  /* Devuelve true si el raycasting choca con el dragón */
  const hitsDragon = useCallback((cx, cy) => {
    if (!dragonRef.current) return false
    const ndc = toNDC(cx, cy)
    raycaster.current.setFromCamera(ndc, camera)
    return raycaster.current.intersectObject(dragonRef.current, true).length > 0
  }, [camera, toNDC])

  /* Convierte cursor → world-space Z=0 */
  const ptrToWorld = useCallback((cx, cy) => {
    const ndc = toNDC(cx, cy)
    const v   = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(camera)
    const dir = v.sub(camera.position).normalize()
    const t   = -camera.position.z / dir.z
    return camera.position.clone().addScaledVector(dir, t)
  }, [camera, toNDC])

  /* ── Listeners globales de puntero/toque ── */
  useEffect(() => {
    let tapTimeout = null

    const getXY = (e) => ({
      x: e.clientX ?? e.changedTouches?.[0]?.clientX ?? e.touches?.[0]?.clientX,
      y: e.clientY ?? e.changedTouches?.[0]?.clientY ?? e.touches?.[0]?.clientY,
    })

    const onDown = (e) => {
      const { x, y } = getXY(e)
      if (x == null) return
      if (hitsDragon(x, y)) {
        isDrag.current   = true
        dragDist.current = 0
        prevPtr.current  = { x, y }
      }
    }

    const onMove = (e) => {
      if (!isDrag.current) return
      const { x, y } = getXY(e)
      if (x == null) return
      dragDist.current += Math.hypot(x - prevPtr.current.x, y - prevPtr.current.y)
      prevPtr.current   = { x, y }
      const w = ptrToWorld(x, y)
      setTarget({ x: w.x, y: w.y })
      curPos.current.x += (w.x - curPos.current.x) * 0.3
      curPos.current.y += (w.y - curPos.current.y) * 0.3
    }

    const onUp = () => { isDrag.current = false }

    /* Tap (clic) → si el drag fue mínimo, interpretar como toque */
    const onTap = (e) => {
      const { x, y } = getXY(e)
      if (x == null) return
      // Ignorar si fue drag real (más de 12px de movimiento)
      if (dragDist.current > 12) { dragDist.current = 0; return }
      dragDist.current = 0
      if (!hitsDragon(x, y)) return

      const now = Date.now()
      if (now - lastTapTime.current < 380) {
        // Doble toque → fuego
        clearTimeout(tapTimeout)
        lastTapTime.current = 0
        triggerFire()
      } else {
        lastTapTime.current = now
        tapTimeout = setTimeout(() => {
          if (lastTapTime.current === now) triggerPirouette()
        }, 400)
      }
    }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
    window.addEventListener('click',       onTap)
    window.addEventListener('touchend',    onTap, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
      window.removeEventListener('click',       onTap)
      window.removeEventListener('touchend',    onTap)
      clearTimeout(tapTimeout)
    }
  }, [hitsDragon, ptrToWorld, triggerFire, triggerPirouette, setTarget])

  /* ── Loop de animación ── */
  useFrame((_, delta) => {
    if (!dragonRef.current) return
    const g = dragonRef.current
    tRef.current += delta
    const t = tRef.current

    // Respiración (siempre activa)
    const breathY    = Math.sin(t * 1.3) * 0.07
    const breathRoll = Math.sin(t * 0.9) * 0.04

    // Movimiento de posición (salvo durante drag)
    if (!isDrag.current) {
      if (state === DS.WANDER) {
        const spd = Math.min(delta * 1.8, 1)
        curPos.current.x += (targetPos.x - curPos.current.x) * spd
        curPos.current.y += (targetPos.y - curPos.current.y) * spd
      } else if (state === DS.IDLE) {
        // Flotación suave estilo medusa
        curPos.current.x += Math.sin(t * 0.5 + 1.3) * delta * 0.09
        curPos.current.y += Math.cos(t * 0.4)        * delta * 0.06
      }
    }

    // Clamp dentro de bounds del canvas
    const bx = 3.5, by = 4.5
    curPos.current.x = Math.max(-bx, Math.min(bx, curPos.current.x))
    curPos.current.y = Math.max(-by, Math.min(by, curPos.current.y))

    g.position.x = curPos.current.x
    g.position.y = curPos.current.y + breathY

    // ── Animaciones por estado ──
    switch (state) {

      case DS.IDLE:
        g.rotation.z  = breathRoll
        g.rotation.x  = Math.sin(t * 0.7) * 0.04
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 3, 1)
        g.scale.setScalar(1)
        break

      case DS.WANDER: {
        const dx = targetPos.x - curPos.current.x
        g.rotation.z  = Math.max(-0.3, Math.min(0.3, -dx * 0.13)) + breathRoll
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 2, 1)
        g.rotation.x  = Math.sin(t * 0.7) * 0.03
        g.scale.setScalar(1)
        break
      }

      case DS.PIROUETTE:
        pirYRef.current += delta * 6.5
        g.rotation.y    = pirYRef.current
        g.rotation.z    = breathRoll + Math.sin(t * 8) * 0.09
        g.rotation.x    = 0
        g.scale.setScalar(1)
        break

      case DS.WIGGLE:
        g.rotation.z = Math.sin(t * 11) * 0.33 + breathRoll
        g.rotation.y = Math.sin(t * 7)  * 0.13
        g.rotation.x = 0
        g.scale.setScalar(1)
        break

      case DS.BOUNCE: {
        const sc = 1 + Math.abs(Math.sin(t * 9)) * 0.28
        g.scale.setScalar(sc)
        g.rotation.z = breathRoll
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 3, 1)
        g.rotation.x = 0
        break
      }

      case DS.FIRE:
        g.rotation.x  = -0.18 + Math.sin(t * 3.5) * 0.06
        g.rotation.z  = Math.sin(t * 2) * 0.09
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 2, 1)
        g.scale.setScalar(1 + Math.sin(t * 4) * 0.04)
        break
    }
  })

  return (
    <>
      <Lights />
      <group ref={dragonRef}>
        {/* Modelo normalizado y centrado */}
        <group
          scale={modelScale}
          position={[
            -modelCenter.x,
            -modelCenter.y,
            -modelCenter.z,
          ]}
        >
          <primitive object={gltfScene} />
        </group>

        {/* Sistema de fuego */}
        <FireParticles active={state === DS.FIRE} dragonRef={dragonRef} />
      </group>
    </>
  )
}

/* ── Componente exportado: Canvas + toda la escena ── */
export default function DragonInner() {
  const ai = useDragonAI()

  return (
    <Canvas
      style={{ background: 'transparent', position: 'absolute', inset: 0 }}
      camera={{ position: [0, 0, 11], fov: 50 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      }}
      dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}
    >
      <DragonScene aiProps={ai} />
    </Canvas>
  )
}
