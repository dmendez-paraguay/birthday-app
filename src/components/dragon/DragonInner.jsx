/**
 * DragonInner.jsx — Escena Three.js del dragón autónomo.
 * Cargado lazy por Dragon3D.jsx.
 *
 * Técnicas de "articulación falsa" sin rig:
 *   - Vertex shader injection via material.onBeforeCompile
 *   - Cola: vértices bajos (Y < 35%) oscilan en X a ~3 Hz
 *   - Cabeza: vértices altos (Y > 80%) cabecea en Z a ~2 Hz
 *   - Cuerpo: onda senoidal suave a lo largo del eje Y
 *   - Uniforme uTime actualizado cada frame → movimiento continuo
 */
import { useRef, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useDragonAI, DS } from './useDragonAI.js'
import FireParticles from './FireParticles.jsx'

useGLTF.preload('/models/dragoncito.glb')

/* ── Código del vertex shader para articulación falsa ─── */
const VERT_UNIFORMS = `
  uniform float uTime;
  uniform float uYMin;
  uniform float uYRange;
  uniform float uAnim;
`

const VERT_DEFORM = /* glsl */`
  // "Articulación" procedural sin rig
  if (uYRange > 0.001) {
    float nY = clamp((position.y - uYMin) / uYRange, 0.0, 1.0);

    // Cola (parte baja): balancea en X a ~2.8 Hz, amplitud máx 16% del alto
    float tF = max(0.0, (0.35 - nY) / 0.35);
    transformed.x += sin(uTime * 2.8) * tF * uYRange * 0.16 * uAnim;

    // Onda corporal suave: sin a lo largo de Y
    transformed.x += sin(uTime * 1.4 + nY * 3.14159) * uYRange * 0.04 * uAnim;

    // Cabeza (parte alta): cabeceo en Z a ~2 Hz
    float hF = max(0.0, (nY - 0.80) / 0.20);
    transformed.z += sin(uTime * 2.0 + 1.0) * hF * uYRange * 0.08 * uAnim;
  }
`

/* ── Luces ─────────────────────────────────────────── */
function Lights() {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 7, 6]}  intensity={2.2} color="#fff0e0" />
      <directionalLight position={[-4, 1, 4]} intensity={0.6} color="#c0d8ff" />
      {/* Punto naranja fuerte: destaca el dragón del fondo oscuro */}
      <pointLight position={[0, 4, 6]}  intensity={1.5} color="#ff9000" />
      <pointLight position={[0, -2, 3]} intensity={0.4} color="#7c3aed" />
    </>
  )
}

/* ── Escena dentro del Canvas ─────────────────────── */
function DragonScene({ aiProps }) {
  const { state, targetPos, triggerPirouette, triggerFire, setTarget } = aiProps
  const { camera, gl, viewport } = useThree()

  const dragonRef = useRef()
  const { scene: gltfScene } = useGLTF('/models/dragoncito.glb')

  // Normalizar: encajar el modelo en 1.9 unidades
  const [modelScale, modelCenter] = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltfScene)
    const sz  = box.getSize(new THREE.Vector3())
    const mx  = Math.max(sz.x, sz.y, sz.z)
    const s   = mx > 0 ? 1.9 / mx : 1
    const c   = box.getCenter(new THREE.Vector3())
    return [s, c]
  }, [gltfScene])

  // Referencia a los shaders para actualizar uTime en useFrame
  const shaderRefs = useRef([])

  // Inyectar el vertex shader de articulación falsa
  useEffect(() => {
    if (!gltfScene) return
    const box = new THREE.Box3().setFromObject(gltfScene)
    const yMin  = box.min.y
    const yRange = box.max.y - box.min.y

    const origMaterials = []
    shaderRefs.current = []

    gltfScene.traverse(child => {
      if (!child.isMesh) return
      origMaterials.push({ child, mat: child.material })

      const mat = child.material.clone()

      mat.onBeforeCompile = (shader) => {
        // Agregar uniforms
        shader.uniforms.uTime  = { value: 0 }
        shader.uniforms.uYMin  = { value: yMin }
        shader.uniforms.uYRange = { value: yRange }
        shader.uniforms.uAnim  = { value: 1.0 }

        // Declarar uniforms antes de void main()
        shader.vertexShader = VERT_UNIFORMS + shader.vertexShader

        // Insertar deformación después de begin_vertex
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>\n${VERT_DEFORM}`
        )

        mat.userData.shader = shader
        shaderRefs.current.push(shader)
      }

      // needsUpdate para que Three.js recompile el shader
      mat.needsUpdate = true
      child.material = mat
    })

    // Restaurar materiales originales al desmontar
    return () => {
      origMaterials.forEach(({ child, mat }) => {
        child.material = mat
      })
      shaderRefs.current = []
    }
  }, [gltfScene, modelScale])

  // Refs de animación
  const tRef    = useRef(0)
  const curPos  = useRef({ x: 0, y: -1.5 })
  const pirYRef = useRef(0)
  const animAmtRef = useRef(1) // controla intensidad de articulación (0=rígido, 1=máximo)

  // Refs de interacción
  const isDrag   = useRef(false)
  const dragDist = useRef(0)
  const prevPtr  = useRef({ x: 0, y: 0 })
  const raycaster = useRef(new THREE.Raycaster())
  const lastTap  = useRef(0)

  const toNDC = useCallback((cx, cy) => {
    const r = gl.domElement.getBoundingClientRect()
    return new THREE.Vector2(
      ((cx - r.left) / r.width)  * 2 - 1,
      -((cy - r.top)  / r.height) * 2 + 1,
    )
  }, [gl])

  const hitsDragon = useCallback((cx, cy) => {
    if (!dragonRef.current) return false
    raycaster.current.setFromCamera(toNDC(cx, cy), camera)
    return raycaster.current.intersectObject(dragonRef.current, true).length > 0
  }, [camera, toNDC])

  const ptrToWorld = useCallback((cx, cy) => {
    const ndc = toNDC(cx, cy)
    const v   = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(camera)
    const dir = v.sub(camera.position).normalize()
    const t   = -camera.position.z / dir.z
    return camera.position.clone().addScaledVector(dir, t)
  }, [camera, toNDC])

  useEffect(() => {
    let tapTimer = null

    const xy = (e) => ({
      x: e.clientX ?? e.changedTouches?.[0]?.clientX ?? e.touches?.[0]?.clientX,
      y: e.clientY ?? e.changedTouches?.[0]?.clientY ?? e.touches?.[0]?.clientY,
    })

    const onDown = (e) => {
      const { x, y } = xy(e)
      if (x == null) return
      if (hitsDragon(x, y)) {
        isDrag.current   = true
        dragDist.current = 0
        prevPtr.current  = { x, y }
      }
    }

    const onMove = (e) => {
      if (!isDrag.current) return
      const { x, y } = xy(e)
      if (x == null) return
      dragDist.current += Math.hypot(x - prevPtr.current.x, y - prevPtr.current.y)
      prevPtr.current   = { x, y }
      const w = ptrToWorld(x, y)
      setTarget({ x: w.x, y: w.y })
      curPos.current.x += (w.x - curPos.current.x) * 0.35
      curPos.current.y += (w.y - curPos.current.y) * 0.35
    }

    const onUp = () => { isDrag.current = false }

    const onTap = (e) => {
      const { x, y } = xy(e)
      if (x == null) return
      if (dragDist.current > 14) { dragDist.current = 0; return }
      dragDist.current = 0
      if (!hitsDragon(x, y)) return

      const now = Date.now()
      if (now - lastTap.current < 380) {
        clearTimeout(tapTimer)
        lastTap.current = 0
        triggerFire()
      } else {
        lastTap.current = now
        tapTimer = setTimeout(() => {
          if (lastTap.current === now) triggerPirouette()
        }, 400)
      }
    }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
    window.addEventListener('click',       onTap)

    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
      window.removeEventListener('click',       onTap)
      clearTimeout(tapTimer)
    }
  }, [hitsDragon, ptrToWorld, triggerFire, triggerPirouette, setTarget])

  /* ── Loop principal ── */
  useFrame((_, delta) => {
    if (!dragonRef.current) return
    const g = dragonRef.current
    tRef.current += delta
    const t = tRef.current

    // Actualizar uniforms del shader de articulación
    shaderRefs.current.forEach(sh => {
      sh.uniforms.uTime.value  = t
      sh.uniforms.uAnim.value  = animAmtRef.current
    })

    // Bounds dinámicos del viewport real
    const halfW = viewport.width  / 2
    const halfH = viewport.height / 2
    const bx    = Math.max(0.2, halfW - 1.3)
    const by    = Math.max(0.5, halfH - 1.6)

    const breathY    = Math.sin(t * 1.3) * 0.08
    const breathRoll = Math.sin(t * 0.9) * 0.045

    // Movimiento de posición
    if (!isDrag.current) {
      if (state === DS.WANDER) {
        const spd = Math.min(delta * 1.6, 1)
        curPos.current.x += (targetPos.x - curPos.current.x) * spd
        curPos.current.y += (targetPos.y - curPos.current.y) * spd
      } else if (state === DS.IDLE) {
        curPos.current.x += Math.sin(t * 0.45 + 1.3) * delta * 0.10
        curPos.current.y += Math.cos(t * 0.35)        * delta * 0.07
      }
    }

    curPos.current.x = Math.max(-bx, Math.min(bx, curPos.current.x))
    curPos.current.y = Math.max(-by, Math.min(by, curPos.current.y))
    g.position.x = curPos.current.x
    g.position.y = curPos.current.y + breathY

    // ── Animaciones de cuerpo entero por estado ──
    switch (state) {
      case DS.IDLE:
        animAmtRef.current  = 1.0
        g.rotation.z  = breathRoll
        g.rotation.x  = Math.sin(t * 0.65) * 0.06
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 3, 1)
        g.scale.setScalar(1)
        break

      case DS.WANDER: {
        animAmtRef.current  = 1.2  // más movimiento mientras merodea
        const dx = targetPos.x - curPos.current.x
        g.rotation.z  = Math.max(-0.35, Math.min(0.35, -dx * 0.14)) + breathRoll
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 2, 1)
        g.rotation.x  = Math.sin(t * 0.65) * 0.04
        g.scale.setScalar(1)
        break
      }

      case DS.PIROUETTE:
        animAmtRef.current  = 0.3  // menos articulación durante pirueta (se vería raro)
        pirYRef.current += delta * 7.0
        g.rotation.y    = pirYRef.current
        g.rotation.z    = breathRoll + Math.sin(t * 8) * 0.10
        g.rotation.x    = 0
        g.scale.setScalar(1)
        break

      case DS.WIGGLE:
        animAmtRef.current  = 2.0  // exagerar articulación en wiggle
        g.rotation.z = Math.sin(t * 12) * 0.38 + breathRoll
        g.rotation.y = Math.sin(t * 7)  * 0.15
        g.rotation.x = 0
        g.scale.setScalar(1)
        break

      case DS.BOUNCE: {
        animAmtRef.current  = 1.5
        const sc = 1 + Math.abs(Math.sin(t * 9)) * 0.30
        g.scale.setScalar(sc)
        g.rotation.z = breathRoll
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 3, 1)
        g.rotation.x  = 0
        break
      }

      case DS.FIRE:
        animAmtRef.current  = 0.5
        g.rotation.x  = -0.20 + Math.sin(t * 4.0) * 0.07
        g.rotation.z  = Math.sin(t * 2.2) * 0.10
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 2, 1)
        g.scale.setScalar(1 + Math.sin(t * 4) * 0.05)
        break
    }
  })

  return (
    <>
      <Lights />

      <group ref={dragonRef}>
        {/* Modelo 3D normalizado */}
        <group
          scale={modelScale}
          position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}
        >
          <primitive object={gltfScene} />
        </group>

        {/* Esfera transparente para facilitar el clic (mayor área de hit) */}
        <mesh>
          <sphereGeometry args={[1.4, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Halo púrpura detrás del dragón */}
        <sprite scale={[3.8, 3.8, 1]} position={[0, 0, -0.7]}>
          <spriteMaterial color="#6d28d9" transparent opacity={0.22} depthWrite={false} sizeAttenuation />
        </sprite>
      </group>

      {/* Fuego en world-space (FUERA del grupo del dragón) */}
      <FireParticles active={state === DS.FIRE} dragonRef={dragonRef} />
    </>
  )
}

/* ── Componente exportado ─────────────────────────── */
export default function DragonInner() {
  const ai = useDragonAI()

  return (
    <Canvas
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
