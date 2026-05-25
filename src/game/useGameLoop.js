/**
 * useGameLoop.js — Hook central del game loop.
 *
 * Rendering híbrido:
 *  - stateRef.current → estado mutable (NO React), 60fps
 *  - setRenderState() → snapshot cada 2 frames para UI React
 *
 * Fix bug teclado: keydown ahora resetea targetX → null para
 * que el branch de teclado (left/right) tenga prioridad.
 */
import { useRef, useState, useEffect, useCallback } from 'react'
import {
  buildInitialState,
  movePlayer, moveBoss, moveBullets, movePowerUps, moveParticles,
  tickShooting, tickCollisions,
} from './entities.js'
import { ShooterAudio } from './audio.js'
import { GAME_W, GAME_H } from './constants.js'

export function useGameLoop({ level, muted, active, onVictory, onDefeat, containerRef }) {
  const stateRef      = useRef(null)
  const rafRef        = useRef(null)
  const inputRef      = useRef({ left: false, right: false, up: false, down: false, targetX: null, targetY: null })
  const onVictoryRef  = useRef(onVictory)
  const onDefeatRef   = useRef(onDefeat)
  const mutedRef      = useRef(muted)
  const activeRef     = useRef(active)
  const dimsRef       = useRef({ W: GAME_W, H: GAME_H })
  const lastTimeRef   = useRef(null)
  const frameCountRef = useRef(0)

  const [renderState, setRenderState] = useState(null)

  useEffect(() => { onVictoryRef.current = onVictory }, [onVictory])
  useEffect(() => { onDefeatRef.current  = onDefeat  }, [onDefeat])
  useEffect(() => { mutedRef.current     = muted     }, [muted])
  useEffect(() => { activeRef.current    = active    }, [active])

  // ── Inicializar estado ───────────────────────────────────────
  const initGame = useCallback(() => {
    const { W, H } = dimsRef.current
    stateRef.current = buildInitialState(level, W, H)
    lastTimeRef.current = null
    frameCountRef.current = 0
    setRenderState({ ...stateRef.current })
  }, [level])

  // ── Manejo de eventos del juego ──────────────────────────────
  function handleEvents(events) {
    const audio = !mutedRef.current

    for (const ev of events) {
      switch (ev) {
        case 'boss-hit':
          if (audio) ShooterAudio.hit()
          break
        case 'boss-phase-2':
          if (audio) ShooterAudio.phaseChange(2)
          break
        case 'boss-phase-3':
          if (audio) ShooterAudio.phaseChange(3)
          break
        case 'boss-dead':
          if (audio) { ShooterAudio.stopPulse(); ShooterAudio.explosion(); ShooterAudio.victory() }
          setTimeout(() => onVictoryRef.current(stateRef.current?.score ?? 0), 900)
          break
        case 'player-hit':
          if (audio) ShooterAudio.playerHit()
          // Vibración háptica en mobile
          if (navigator.vibrate) navigator.vibrate([60, 40, 60])
          break
        case 'player-dead':
          if (audio) { ShooterAudio.stopPulse(); ShooterAudio.defeat() }
          if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200])
          setTimeout(() => onDefeatRef.current(), 700)
          break
        case 'combo-up': {
          const mult = stateRef.current?.multiplier ?? 1
          if (audio) ShooterAudio.comboUp(mult)
          break
        }
        case 'shield-block':
          if (audio) ShooterAudio.shieldBlock()
          break
        case 'powerup-shield':
        case 'powerup-rapidFire':
        case 'powerup-bomb':
          if (audio) ShooterAudio.powerUp()
          if (navigator.vibrate) navigator.vibrate(80)
          break
        default: break
      }
    }
  }

  // ── Game loop principal ──────────────────────────────────────
  const gameLoop = useCallback((timestamp) => {
    if (!stateRef.current) return

    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const elapsed = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp
    const dt = Math.min(elapsed / 16.667, 3)

    if (activeRef.current) {
      const { W, H } = dimsRef.current
      let s = stateRef.current
      const inp = inputRef.current

      // 1. Input → target del jugador (X e Y)
      const minY = H * 0.18
      const maxY = H - s.player.h - 10

      let playerTargetX = s.player.targetX
      let playerTargetY = s.player.targetY

      if (inp.targetX !== null) {
        // Mouse / touch → seguir posición exacta (X)
        playerTargetX = inp.targetX - s.player.w / 2
      } else {
        // Teclado → ir al borde correspondiente
        if (inp.left)  playerTargetX = 0
        if (inp.right) playerTargetX = W - s.player.w
      }
      if (inp.targetY !== null) {
        // Mouse / touch → seguir posición exacta (Y)
        playerTargetY = inp.targetY - s.player.h / 2
      } else {
        if (inp.up)   playerTargetY = minY
        if (inp.down) playerTargetY = maxY
      }

      s = { ...s, player: { ...s.player, targetX: playerTargetX, targetY: playerTargetY } }

      // 2. Mover entidades
      s = { ...s, player:  movePlayer(s.player, dt, W, H) }
      s = { ...s, boss:    moveBoss(s.boss, dt, W) }
      s = { ...s, bullets: moveBullets(s.bullets, dt, W, H) }
      s = { ...s, powerUps: movePowerUps(s.powerUps, dt, H) }

      // 3. Mover partículas (dentro de effects)
      s = { ...s, effects: moveParticles(s.effects, dt) }

      // 4. Disparos
      const shot = tickShooting(s.player, s.boss, s.bullets, dt)
      if (shot.shotFired && !mutedRef.current) ShooterAudio.shoot()
      s = { ...s, player: shot.player, boss: shot.boss, bullets: shot.bullets }

      // 5. Colisiones
      const { state: afterCol, events } = tickCollisions(s)
      s = afterCol

      // 6. Frame counter
      s = { ...s, frame: s.frame + 1 }
      stateRef.current = s

      // 7. Eventos → audio, vibración, transiciones
      handleEvents(events)

      // 8. Snapshot React cada 2 frames
      frameCountRef.current++
      if (frameCountRef.current % 2 === 0) {
        setRenderState({
          player:     s.player,
          boss:       s.boss,
          bullets:    s.bullets,
          effects:    s.effects,
          powerUps:   s.powerUps,
          score:      s.score,
          combo:      s.combo,
          multiplier: s.multiplier,
          frame:      s.frame,
          shakeX:     s.shakeX,
          shakeY:     s.shakeY,
        })
      }
    }

    rafRef.current = requestAnimationFrame(gameLoop)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Setup / cleanup ──────────────────────────────────────────
  useEffect(() => {
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect()
      dimsRef.current = { W: rect.width || GAME_W, H: rect.height || GAME_H }
    }

    initGame()
    rafRef.current = requestAnimationFrame(gameLoop)

    // ── Teclado ──
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') { inputRef.current.left  = true;  inputRef.current.targetX = null }
      if (e.key === 'ArrowRight' || e.key === 'd') { inputRef.current.right = true;  inputRef.current.targetX = null }
      if (e.key === 'ArrowUp'    || e.key === 'w') { inputRef.current.up    = true;  inputRef.current.targetY = null }
      if (e.key === 'ArrowDown'  || e.key === 's') { inputRef.current.down  = true;  inputRef.current.targetY = null }
    }
    const onKeyUp = (e) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') inputRef.current.left  = false
      if (e.key === 'ArrowRight' || e.key === 'd') inputRef.current.right = false
      if (e.key === 'ArrowUp'    || e.key === 'w') inputRef.current.up    = false
      if (e.key === 'ArrowDown'  || e.key === 's') inputRef.current.down  = false
      // Al soltar, congelar posición actual
      const inp = inputRef.current
      if (!inp.left && !inp.right && inp.targetX === null && stateRef.current)
        inputRef.current.targetX = stateRef.current.player.x
      if (!inp.up && !inp.down && inp.targetY === null && stateRef.current)
        inputRef.current.targetY = stateRef.current.player.y
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup',   onKeyUp)

    // ── Mouse ──
    const container = containerRef?.current
    const onMouseMove = (e) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      inputRef.current.targetX = e.clientX - rect.left
      inputRef.current.targetY = e.clientY - rect.top
      inputRef.current.left = inputRef.current.right = false
      inputRef.current.up   = inputRef.current.down  = false
    }

    // ── Touch ──
    const onTouchMove = (e) => {
      e.preventDefault()
      if (!container) return
      const rect  = container.getBoundingClientRect()
      const touch = e.touches[0]
      inputRef.current.targetX = touch.clientX - rect.left
      inputRef.current.targetY = touch.clientY - rect.top
      inputRef.current.left = inputRef.current.right = false
      inputRef.current.up   = inputRef.current.down  = false
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
  }, [level]) // eslint-disable-line react-hooks/exhaustive-deps

  return { renderState, initGame }
}
