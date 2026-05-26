/**
 * useDragonAI.js — Máquina de estados para el comportamiento autónomo del dragón.
 * Estados: IDLE → WANDER / FIRE / PIROUETTE / WIGGLE / BOUNCE → IDLE
 */
import { useState, useEffect, useRef, useCallback } from 'react'

export const DS = {
  IDLE: 'IDLE',
  WANDER: 'WANDER',
  FIRE: 'FIRE',
  PIROUETTE: 'PIROUETTE',
  WIGGLE: 'WIGGLE',
  BOUNCE: 'BOUNCE',
}

/** Posición aleatoria dentro de los límites del canvas world-space (estimados) */
const rndPos = () => ({
  x: (Math.random() - 0.5) * 4.5,
  y: (Math.random() - 0.5) * 5.0,
})

export function useDragonAI() {
  const [state, setState] = useState(DS.IDLE)
  const [targetPos, setTargetPos] = useState({ x: 1.5, y: -0.5 })
  const stateRef = useRef(DS.IDLE)
  const timerRef = useRef(null)

  const go = useCallback((s, pos) => {
    stateRef.current = s
    setState(s)
    if (pos) setTargetPos(pos)
  }, [])

  const schedule = useCallback((fn, delay) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fn, delay)
  }, [])

  const scheduleNext = useCallback(() => {
    const delay = 3000 + Math.random() * 4000
    schedule(() => {
      if (stateRef.current !== DS.IDLE) return // no interrumpir estados activos
      const r = Math.random()

      if (r < 0.40) {
        // Merodeo
        const pos = rndPos()
        go(DS.WANDER, pos)
        schedule(() => {
          const r2 = Math.random()
          if (r2 < 0.22) go(DS.PIROUETTE)
          else if (r2 < 0.35) go(DS.WIGGLE)
          else if (r2 < 0.45) go(DS.FIRE)
          else go(DS.IDLE)
          schedule(scheduleNext, r2 < 0.45 ? 1900 : 400)
        }, 2200 + Math.random() * 2000)
      } else if (r < 0.55) {
        go(DS.PIROUETTE)
        schedule(() => { go(DS.IDLE); scheduleNext() }, 1700)
      } else if (r < 0.68) {
        go(DS.FIRE)
        schedule(() => { go(DS.IDLE); scheduleNext() }, 2600)
      } else if (r < 0.78) {
        go(DS.WIGGLE)
        schedule(() => { go(DS.IDLE); scheduleNext() }, 1100)
      } else if (r < 0.88) {
        go(DS.BOUNCE)
        schedule(() => { go(DS.IDLE); scheduleNext() }, 900)
      } else {
        go(DS.IDLE)
        scheduleNext()
      }
    }, delay)
  }, [go, schedule])

  useEffect(() => {
    // Sin delay: empieza a merodear inmediatamente cuando el modelo carga
    go(DS.WANDER, rndPos())
    const init = setTimeout(() => {
      go(DS.IDLE)
      scheduleNext()
    }, 2500)
    return () => {
      clearTimeout(init)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [scheduleNext, go])

  /** Activado por clic del usuario */
  const triggerPirouette = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    go(DS.PIROUETTE)
    setTimeout(() => { go(DS.IDLE); scheduleNext() }, 1700)
  }, [go, scheduleNext])

  /** Activado por doble clic del usuario */
  const triggerFire = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    go(DS.FIRE)
    setTimeout(() => { go(DS.IDLE); scheduleNext() }, 2600)
  }, [go, scheduleNext])

  /** Para drag: sobreescribir posición destino */
  const setTarget = useCallback((pos) => {
    setTargetPos(pos)
  }, [])

  return { state, stateRef, targetPos, triggerPirouette, triggerFire, setTarget }
}
