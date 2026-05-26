/**
 * DragonInner.jsx — Dragón hero centrado en su propio canvas inline.
 * Sin ondulación vertex-shader, sin roaming.
 * Animaciones en el sitio: flotación suave, pirueta, wiggle, bounce, fuego.
 */
import { useRef, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useDragonAI, DS } from './useDragonAI.js'
import FireParticles from './FireParticles.jsx'

useGLTF.preload('/models/dragoncito.glb')

/* ── Rugido (Web Audio API) ─────────────────────────── */
let _audioCtx = null
function getDragonCtx() {
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  if (!_audioCtx || _audioCtx.state === 'closed') {
    try { _audioCtx = new Ctor() } catch (e) { return null }
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(() => {})
  return _audioCtx
}
function dragonRoar() {
  const ctx = getDragonCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const dur = 1.5
  const layers = [
    { freq: 68,  type: 'sawtooth', vol: 0.20, delay: 0    },
    { freq: 112, type: 'sawtooth', vol: 0.13, delay: 0.02 },
    { freq: 165, type: 'square',   vol: 0.07, delay: 0.04 },
    { freq: 240, type: 'sawtooth', vol: 0.04, delay: 0.06 },
  ]
  layers.forEach(({ freq, type, vol, delay }) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq * 2.2, now + delay)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + delay + dur)
    const lfo  = ctx.createOscillator()
    const lfoG = ctx.createGain()
    lfo.frequency.value = 6
    lfoG.gain.value = 4
    lfo.connect(lfoG); lfoG.connect(osc.frequency)
    lfo.start(now + delay); lfo.stop(now + delay + dur)
    gain.gain.setValueAtTime(0, now + delay)
    gain.gain.linearRampToValueAtTime(vol, now + delay + 0.12)
    gain.gain.setValueAtTime(vol * 0.85, now + delay + 0.5)
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(now + delay); osc.stop(now + delay + dur + 0.05)
  })
}

/* ── Luces ─────────────────────────────────────────── */
function Lights() {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 7, 6]}  intensity={2.2} color="#fff0e0" />
      <directionalLight position={[-4, 1, 4]} intensity={0.6} color="#c0d8ff" />
      <pointLight position={[0, 4, 6]}  intensity={1.5} color="#ff9000" />
      <pointLight position={[0, -2, 3]} intensity={0.4} color="#7c3aed" />
    </>
  )
}

/* ── Escena ────────────────────────────────────────── */
function DragonScene({ aiProps }) {
  const { state, triggerPirouette, triggerFire } = aiProps
  const { camera, gl } = useThree()

  const dragonRef = useRef()
  const { scene: gltfScene } = useGLTF('/models/dragoncito.glb')

  const [modelScale, modelCenter] = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltfScene)
    const sz  = box.getSize(new THREE.Vector3())
    const mx  = Math.max(sz.x, sz.y, sz.z)
    const s   = mx > 0 ? 2.8 / mx : 1   // más grande para hero central
    const c   = box.getCenter(new THREE.Vector3())
    return [s, c]
  }, [gltfScene])

  // Textura gradiente radial para el halo
  const glowTexture = useMemo(() => {
    const sz = 128
    const cv = document.createElement('canvas')
    cv.width = cv.height = sz
    const ctx = cv.getContext('2d')
    const cx  = sz / 2
    const g   = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
    g.addColorStop(0,    'rgba(160, 80, 255, 0.75)')
    g.addColorStop(0.30, 'rgba(110, 40, 230, 0.45)')
    g.addColorStop(0.65, 'rgba(80,  20, 180, 0.15)')
    g.addColorStop(1,    'rgba(50,  10, 140, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, sz, sz)
    return new THREE.CanvasTexture(cv)
  }, [])

  // Rugido al entrar en FIRE
  useEffect(() => {
    if (state === DS.FIRE) dragonRoar()
  }, [state])

  // Refs de animación
  const tRef    = useRef(0)
  const pirYRef = useRef(0)
  const raycaster = useRef(new THREE.Raycaster())
  const lastTap   = useRef(0)

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

  useEffect(() => {
    let tapTimer = null
    const xy = (e) => ({
      x: e.clientX ?? e.changedTouches?.[0]?.clientX,
      y: e.clientY ?? e.changedTouches?.[0]?.clientY,
    })
    const onTap = (e) => {
      const { x, y } = xy(e)
      if (x == null) return
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
    window.addEventListener('click', onTap)
    return () => { window.removeEventListener('click', onTap); clearTimeout(tapTimer) }
  }, [hitsDragon, triggerFire, triggerPirouette])

  /* ── Loop ── */
  useFrame((_, delta) => {
    if (!dragonRef.current) return
    const g = dragonRef.current
    tRef.current += delta
    const t = tRef.current

    // Respiración suave: sube y baja ligeramente (centrado en el canvas)
    const breathY    = Math.sin(t * 1.3) * 0.12
    const breathRoll = Math.sin(t * 0.9) * 0.04

    // Centrado en el canvas
    g.position.x = 0
    g.position.y = breathY

    switch (state) {
      case DS.IDLE:
        g.rotation.z  = breathRoll
        g.rotation.x  = Math.sin(t * 0.65) * 0.05
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 3, 1)
        g.scale.setScalar(1)
        break

      case DS.PIROUETTE:
        pirYRef.current += delta * 7.0
        g.rotation.y    = pirYRef.current
        g.rotation.z    = breathRoll + Math.sin(t * 8) * 0.08
        g.rotation.x    = 0
        g.scale.setScalar(1)
        break

      case DS.WIGGLE:
        g.rotation.z = Math.sin(t * 12) * 0.35 + breathRoll
        g.rotation.y = Math.sin(t * 7)  * 0.12
        g.rotation.x = 0
        g.scale.setScalar(1)
        break

      case DS.BOUNCE: {
        const sc = 1 + Math.abs(Math.sin(t * 9)) * 0.28
        g.scale.setScalar(sc)
        g.rotation.z = breathRoll
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 3, 1)
        g.rotation.x  = 0
        break
      }

      case DS.FIRE:
        g.rotation.x  = -0.18 + Math.sin(t * 4) * 0.07
        g.rotation.z  = Math.sin(t * 2.2) * 0.09
        g.rotation.y += (0 - g.rotation.y) * Math.min(delta * 2, 1)
        g.scale.setScalar(1 + Math.sin(t * 4) * 0.04)
        break
    }
  })

  return (
    <>
      <Lights />
      <group ref={dragonRef}>
        <group scale={modelScale} position={[-modelCenter.x, -modelCenter.y, -modelCenter.z]}>
          <primitive object={gltfScene} />
        </group>

        {/* Esfera invisible para área de clic más generosa */}
        <mesh>
          <sphereGeometry args={[1.6, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Halo gradiente radial */}
        <sprite scale={[5.5, 5.5, 1]} position={[0, 0.2, -0.8]}>
          <spriteMaterial
            map={glowTexture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </sprite>
      </group>

      {/* Fuego en world-space */}
      <FireParticles active={state === DS.FIRE} dragonRef={dragonRef} />
    </>
  )
}

export default function DragonInner() {
  const ai = useDragonAI()
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      dpr={[1, Math.min(window.devicePixelRatio, 1.5)]}
    >
      <DragonScene aiProps={ai} />
    </Canvas>
  )
}
