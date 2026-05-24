/**
 * audio.js — Singleton de audio para el Space Blaster.
 * Fix: arpeTimeout guardado para cleanup correcto (evita memory leak).
 * Nuevos sonidos: phaseChange, comboUp, powerUp, shieldBlock.
 */

let ctx = null
let muted = false
let pulseRunning = false
let bassTimeout  = null
let arpeTimeout  = null   // FIX: ahora se guarda para poder cancelarlo

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function gain(vol) {
  const g = getCtx().createGain()
  g.gain.value = muted ? 0 : vol
  g.connect(getCtx().destination)
  return g
}

function osc(type, freq, startTime, endTime, g, freqEnd) {
  const o = getCtx().createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, startTime)
  if (freqEnd !== undefined) {
    o.frequency.exponentialRampToValueAtTime(freqEnd, endTime)
  }
  o.connect(g)
  o.start(startTime)
  o.stop(endTime)
}

export const ShooterAudio = {
  init() { getCtx() },

  setMuted(val) {
    muted = val
    if (val) this.stopPulse()
    else     this.startPulse()
  },

  /** Disparo: tono agudo corto */
  shoot() {
    try {
      const c = getCtx(), t = c.currentTime
      const g = gain(0.10)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
      osc('square', 900, t, t + 0.07, g, 400)
    } catch {}
  },

  /** Impacto en el boss */
  hit() {
    try {
      const c = getCtx(), t = c.currentTime
      const g = gain(0.16)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.11)
      osc('sawtooth', 320, t, t + 0.11, g, 160)
      const g2 = gain(0.08)
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
      osc('square', 640, t, t + 0.06, g2, 240)
    } catch {}
  },

  /** Explosión del boss */
  explosion() {
    try {
      const c = getCtx(), t = c.currentTime
      const g = gain(0.5)
      g.gain.setValueAtTime(0.5, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.65)
      osc('sawtooth', 180, t, t + 0.65, g, 30)
      const g2 = gain(0.35)
      g2.gain.setValueAtTime(0.35, t)
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
      osc('sine', 80, t, t + 0.45, g2, 20)
    } catch {}
  },

  /** Jugador recibe daño */
  playerHit() {
    try {
      const c = getCtx(), t = c.currentTime
      const g = gain(0.22)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
      osc('sine', 200, t, t + 0.28, g, 80)
    } catch {}
  },

  /** Cambio de fase del boss — sonido distorsionado */
  phaseChange(phase) {
    try {
      const c = getCtx(), t = c.currentTime
      const freqs = phase === 3 ? [110, 90, 70] : [140, 120, 100]
      freqs.forEach((f, i) => {
        const st = t + i * 0.07
        const g  = gain(0.3 - i * 0.05)
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.22)
        osc('sawtooth', f * 2, st, st + 0.22, g, f)
      })
    } catch {}
  },

  /** Combo sube de nivel — pitch ascendente según multiplicador */
  comboUp(multiplier) {
    try {
      const c = getCtx(), t = c.currentTime
      const baseFreq = 440 + multiplier * 120
      const g = gain(0.12)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
      osc('triangle', baseFreq, t, t + 0.12, g, baseFreq * 1.5)
    } catch {}
  },

  /** Power-up recolectado */
  powerUp() {
    try {
      const c = getCtx(), t = c.currentTime
      const notes = [523, 659, 784, 1047]
      notes.forEach((f, i) => {
        const st = t + i * 0.06
        const g  = gain(0.14)
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.1)
        osc('triangle', f, st, st + 0.1, g)
      })
    } catch {}
  },

  /** Escudo bloquea bala */
  shieldBlock() {
    try {
      const c = getCtx(), t = c.currentTime
      const g = gain(0.18)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      osc('sine', 880, t, t + 0.15, g, 660)
    } catch {}
  },

  /** Victoria: fanfare ascendente */
  victory() {
    try {
      const c = getCtx(), t = c.currentTime
      const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568]
      notes.forEach((freq, i) => {
        const st = t + i * 0.10
        const et = st + 0.14
        const g  = gain(0.18)
        g.gain.setValueAtTime(0.18, st)
        g.gain.exponentialRampToValueAtTime(0.001, et)
        osc('square', freq, st, et, g)
      })
    } catch {}
  },

  /** Derrota: secuencia descendiente menor */
  defeat() {
    try {
      const c = getCtx(), t = c.currentTime
      const notes = [440, 392, 349, 294, 220]
      notes.forEach((freq, i) => {
        const st = t + i * 0.13
        const et = st + 0.18
        const g  = gain(0.16)
        g.gain.setValueAtTime(0.16, st)
        g.gain.exponentialRampToValueAtTime(0.001, et)
        osc('sawtooth', freq, st, et, g)
      })
    } catch {}
  },

  /** Inicia pulso ambiental */
  startPulse() {
    if (pulseRunning || muted) return
    pulseRunning = true

    const bassNotes = [55, 65, 55, 73]
    const arpeNotes = [220, 277, 330, 415, 330, 277]
    let bassIdx = 0
    let arpeIdx = 0

    const playBass = () => {
      if (!pulseRunning || muted) return
      try {
        const c = getCtx(), t = c.currentTime
        const g = gain(0.06)
        g.gain.setValueAtTime(0.06, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
        osc('sine', bassNotes[bassIdx % bassNotes.length], t, t + 0.5, g)
        bassIdx++
      } catch {}
      bassTimeout = setTimeout(playBass, 520)
    }

    const playArpe = () => {
      if (!pulseRunning || muted) return
      try {
        const c = getCtx(), t = c.currentTime
        const g = gain(0.04)
        g.gain.setValueAtTime(0.04, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
        osc('triangle', arpeNotes[arpeIdx % arpeNotes.length], t, t + 0.18, g)
        arpeIdx++
      } catch {}
      arpeTimeout = setTimeout(playArpe, 340)  // FIX: guardado correctamente
    }

    playBass()
    setTimeout(playArpe, 160)
  },

  /** Detiene el pulso ambiental limpiando AMBOS timeouts */
  stopPulse() {
    pulseRunning = false
    if (bassTimeout) { clearTimeout(bassTimeout); bassTimeout = null }
    if (arpeTimeout) { clearTimeout(arpeTimeout); arpeTimeout = null }  // FIX
  },
}
