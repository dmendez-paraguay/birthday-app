/**
 * useGameLoop.js — Hook central del game loop.
 *
 * Patrón de rendering híbrido:
 *  - stateRef.current → estado mutable, actualizado en cada frame (NO React)
 *  - setRenderState() → snapshot mínimo cada 2 frames para actualizar la UI
 *
 * Esto permite 60fps sin 60 re-renders completos de React por segundo.
 */
import { useRef, useState, useEffect, useCallback } from 'react'
import {
  buildInitialState,
  movePlayer, moveBoss, moveBullets,
  tickShooting, tickCollisions,
} from './entities.js'
import { ShooterAudio } from './audio.js'
import { GAME_W, GAME_H } from './constants.js'

/**
 * @param {object} opts
 * @param {number}   opts.level      - nivel actual (1-3)
 * @param {boolean}  opts.muted      - sonido muted
 * @param {boolean}  opts.active     - si el juego está corriendo (no paused)
 * @param {function} opts.onVictory  - callback cuando boss muere
 * @param {function} opts.onDefeat   - callback cuando player muere
 * @param {object}   opts.containerRef - ref al div contenedor del juego
 */
export function useGameLoop({ level, muted, active, onVictory, onDefeat, containerRef }) {
  // Estado mutable del juego (NO React state)
  const stateRef = useRef(null)
  // RAF ID
  const rafRef = useRef(null)
  // Input actual
  const inputRef = useRef({ left: false, right: false, targetX: null })
  // Callbacks frescos (evita closures viejos)
  const onVictoryRef = useRef(onVictory)
  const onDefeatRef  = useRef(onDefeat)
  const mutedRef     = useRef(muted)
  const activeRef    = useRef(active)
  // Dimensiones del contenedor (medidas una sola vez)
  const dimsRef = useRef({ W: GAME_W, H: GAME_H })
  // Timestamp del último frame
  const lastTimeRef = useRef(null)
  // Contador de frames para throttle de React renders
  const frameCountRef = useRef(0)

  // Estado de React — sólo lo que necesita la UI (HP bars, score, posiciones)
  const [renderState, setRenderState] = useState(null)

  // Mantener refs de callbacks actualizados
  useEffect(() => { onVictoryRef.current = onVictory }, [onVictory])
  useEffect(() => { onDefeatRef.current  = onDefeat  }, [onDefeat])
  useEffect(() => { mutedRef.current     = muted     }, [muted])
  useEffect(() => { activeRef.current    = active    }, [active])

  // ── Inicializar / reiniciar estado del juego ─────────────────
  const initGame = useCallback(() => {
    const { W, H } = dimsRef.current
    stateRef.current = buildInitialState(level, W, H)
    lastTimeRef.current = null
    frameCountRef.current = 0
    setRenderState({ ...stateRef.current })
  }, [level])

  // ── Handler de eventos del juego ──────────────────────────────
  function handleEvents(events) {
    for (const ev of events) {
      switch (ev) {
        case 'boss-hit':
          if (!mutedRef.current) ShooterAudio.hit()
          break
        case 'boss-dead':
          if (!mutedRef.current) { ShooterAudio.stopPulse(); ShooterAudio.explosion(); ShooterAudio.victory() }
          setTimeout(() => onVictoryRef.current(stateRef.current?.score ?? 0), 800)
          break
        case 'player-hit':
          if (!mutedRef.current) ShooterAudio.playerHit()
          break
        case 'player-dead':
          if (!mutedRef.current) { ShooterAudio.stopPulse(); ShooterAudio.defeat() }
          setTimeout(() => onDefeatRef.current(), 600)
          break
        default:
          break
      }
    }
  }

  // ── Game loop principal ───────────────────────────────────────
  const gameLoop = useCallback((timestamp) => {
    if (!stateRef.current) return

    // Calcular delta time normalizado a 60fps
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const elapsed = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp
    // Clamp: máximo 3 frames perdidos (para cuando la tab pierde foco)
    const dt = Math.min(elapsed / 16.667, 3)

    if (activeRef.current) {
      const { W, H } = dimsRef.current
      let s = stateRef.current

      // 1. Aplicar input al player
      const inp = inputRef.current
      let playerTarget = s.player.targetX
      if (inp.targetX !== null) {
        // Mouse / touch: mover nave al punto tocado
        playerTarget = inp.targetX - s.player.w / 2
      } else {
        // Teclado: mover de forma continua
        if (inp.left)  playerTarget = Math.max(0, s.player.x - 9999)
        if (inp.right) playerTarget = Math.min(W - s.player.w, s.player.x + 9999)
      }
      s = { ...s, player: { ...s.player, targetX: playerTarget } }

      // 2. Mover entidades
      s = { ...s, player: movePlayer(s.player, dt, W) }
      s = { ...s, boss:   moveBoss(s.boss, dt, W) }
      s = { ...s, bullets: moveBullets(s.bullets, dt, W, H) }

      // 3. Disparo automático
      const shot = tickShooting(s.player, s.boss, s.bullets, dt)
      if (!mutedRef.current && shot.bullets.length > s.bullets.length) {
        // Solo suena si se añadió bala del jugador
        const newPlayerBullets = shot.bullets.filter(b =>
          b.type === 'player' && !s.bullets.find(ob => ob.id === b.id)
        )
        if (newPlayerBullets.length) ShooterAudio.shoot()
      }
      s = { ...s, player: shot.player, boss: shot.boss, bullets: shot.bullets }

      // 4. Colisiones
      const { state: afterCollisions, events } = tickCollisions(s)
      s = afterCollisions

      // 5. Incrementar frame counter
      s = { ...s, frame: s.frame + 1 }
      stateRef.current = s

      // 6. Manejar eventos (audio + transiciones de fase)
      handleEvents(events)

      // 7. Actualizar React cada 2 frames (~30 "renders" por segundo)
      frameCountRef.current++
      if (frameCountRef.current % 2 === 0) {
        setRenderState({
          player:  s.player,
          boss:    s.boss,
          bullets: s.bullets,
          effects: s.effects,
          score:   s.score,
          frame:   s.frame,
        })
      }
    }

    rafRef.current = requestAnimationFrame(gameLoop)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Setup: medir contenedor, iniciar loop ────────────────────
  useEffect(() => {
    // Medir dimensiones reales del contenedor
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect()
      dimsRef.current = { W: rect.width, H: rect.height }
    }

    initGame()
    rafRef.current = requestAnimationFrame(gameLoop)

    // ── Input: teclado ──
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') inputRef.current.left  = true
      if (e.key === 'ArrowRight' || e.key === 'd') inputRef.current.right = true
    }
    const onKeyUp = (e) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') { inputRef.current.left = false;  inputRef.current.targetX = null }
      if (e.key === 'ArrowRight' || e.key === 'd') { inputRef.current.right = false; inputRef.current.targetX = null }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup',   onKeyUp)

    // ── Input: mouse ──
    const container = containerRef?.current
    const onMouseMove = (e) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      inputRef.current.targetX  = e.clientX - rect.left
      inputRef.current.left     = false
      inputRef.current.right    = false
    }

    // ── Input: touch ──
    const onTouchMove = (e) => {
      e.preventDefault()
      if (!container) return
      const rect = container.getBoundingClientRect()
      const touch = e.touches[0]
      inputRef.current.targetX  = touch.clientX - rect.left
      inputRef.current.left     = false
      inputRef.current.right    = false
    }

    if (container) {
      container.addEventListener('mousemove', onMouseMove)
      container.addEventListener('touchmove', onTouchMove, { passive: false })
    }

    // ── Resize ──
    let resizeTimer = null
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (containerRef?.current) {
          const rect = containerRef.current.getBoundingClientRect()
          dimsRef.current = { W: rect.width, H: rect.height }
        }
      }, 200)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup',   onKeyUp)
      window.removeEventListener('resize', onResize)
      if (container) {
        container.removeEventListener('mousemove', onMouseMove)
        container.removeEventListener('touchmove', onTouchMove)
      }
    }
  }, [level]) // reiniciar si cambia el nivel // eslint-disable-line react-hooks/exhaustive-deps

  return { renderState, initGame }
}
