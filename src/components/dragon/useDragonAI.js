/**
 * useDragonAI.js — Máquina de estados del dragón compañero de esquina.
 * Sin WANDER: el dragón vive fijo en su posición. Solo animaciones en el sitio.
 */
import { useState, useEffect, useRef, useCallback } from 'react'

export const DS = {
  IDLE:      'IDLE',
  FIRE:      'FIRE',
  PIROUETTE: 'PIROUETTE',
  WIGGLE:    'WIGGLE',
  BOUNCE:    'BOUNCE',
}

export function useDragonAI() {
  const [state, setState] = useState(DS.IDLE)
  const stateRef  = useRef(DS.IDLE)
  const timerRef  = useRef(null)

  const go = useCallback((s) => {
    stateRef.current = s
    setState(s)
  }, [])

  const schedule = useCallback((fn, delay) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fn, delay)
  }, [])

  const scheduleNext = useCallback(() => {
    const delay = 3500 + Math.random() * 5000
    schedule(() => {
      if (stateRef.current !== DS.IDLE) return
      const r = Math.random()
      if (r < 0.40) {
        go(DS.PIROUETTE)
        schedule(() => { go(DS.IDLE); scheduleNext() }, 1700)
      } else if (r < 0.58) {
        go(DS.FIRE)
        schedule(() => { go(DS.IDLE); scheduleNext() }, 2600)
      } else if (r < 0.72) {
        go(DS.WIGGLE)
        schedule(() => { go(DS.IDLE); scheduleNext() }, 1100)
      } else if (r < 0.85) {
        go(DS.BOUNCE)
        schedule(() => { go(DS.IDLE); scheduleNext() }, 950)
      } else {
        go(DS.IDLE)
        scheduleNext()
      }
    }, delay)
  }, [go, schedule])

  useEffect(() => {
    scheduleNext()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [scheduleNext])

  const triggerPirouette = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    go(DS.PIROUETTE)
    setTimeout(() => { go(DS.IDLE); scheduleNext() }, 1700)
  }, [go, scheduleNext])

  const triggerFire = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    go(DS.FIRE)
    setTimeout(() => { go(DS.IDLE); scheduleNext() }, 2600)
  }, [go, scheduleNext])

  return { state, stateRef, triggerPirouette, triggerFire }
}
