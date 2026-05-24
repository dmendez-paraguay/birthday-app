/**
 * audio.js — Singleton de audio para el Space Shooter.
 * Usa Web Audio API nativa, sin librerías externas.
 * Se inicializa con ShooterAudio.init() en el primer click del usuario.
 */

let ctx = null
let muted = false
let pulseTimeout = null
let pulseRunning = false

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
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
  init() {
    getCtx()
  },

  setMuted(val) {
    muted = val
    if (val) this.stopPulse()
    else     this.startPulse()
  },

  /** Disparo del jugador: tono agudo y corto */
  shoot() {
    try {
      const c = getCtx()
      const t = c.currentTime
      const g = gain(0.12)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
      osc('square', 900, t, t + 0.07, g, 400)
    } catch {}
  },

  /** Impacto en el boss */
  hit() {
    try {
      const c = getCtx()
      const t = c.currentTime
      const g = gain(0.18)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
      osc('sawtooth', 320, t, t + 0.12, g, 160)
      // segundo tono de "crunchy"
      const g2 = gain(0.09)
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
      osc('square', 640, t, t + 0.06, g2, 240)
    } catch {}
  },

  /** Explosión del boss: boom profundo descendente */
  explosion() {
    try {
      const c = getCtx()
      const t = c.currentTime
      // tono bajo decayendo
      const g = gain(0.5)
      g.gain.setValueAtTime(0.5, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
      osc('sawtooth', 180, t, t + 0.6, g, 30)
      // componente de ruido con sine
      const g2 = gain(0.35)
      g2.gain.setValueAtTime(0.35, t)
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc('sine', 80, t, t + 0.4, g2, 20)
    } catch {}
  },

  /** Jugador recibe daño */
  playerHit() {
    try {
      const c = getCtx()
      const t = c.currentTime
      const g = gain(0.22)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      osc('sine', 200, t, t + 0.25, g, 80)
    } catch {}
  },

  /** Victoria: fanfare ascendente 8 notas */
  victory() {
    try {
      const c = getCtx()
      const t = c.currentTime
      const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568]
      notes.forEach((freq, i) => {
        const st = t + i * 0.1
        const et = st + 0.14
        const g = gain(0.2)
        g.gain.setValueAtTime(0.2, st)
        g.gain.exponentialRampToValueAtTime(0.001, et)
        osc('square', freq, st, et, g)
      })
    } catch {}
  },

  /** Derrota: secuencia descendiente menor */
  defeat() {
    try {
      const c = getCtx()
      const t = c.currentTime
      const notes = [440, 392, 349, 294, 220]
      notes.forEach((freq, i) => {
        const st = t + i * 0.13
        const et = st + 0.18
        const g = gain(0.18)
        g.gain.setValueAtTime(0.18, st)
        g.gain.exponentialRampToValueAtTime(0.001, et)
        osc('sawtooth', freq, st, et, g)
      })
    } catch {}
  },

  /** Inicia pulso ambiental: bass drone + arpegio lento */
  startPulse() {
    if (pulseRunning || muted) return
    pulseRunning = true
    const bassNotes  = [55, 65, 55, 73]
    const arpeNotes  = [220, 277, 330, 415, 330, 277]
    let bassIdx = 0
    let arpeIdx = 0

    const playBass = () => {
      if (!pulseRunning || muted) return
      try {
        const c = getCtx()
        const t = c.currentTime
        const g = gain(0.06)
        g.gain.setValueAtTime(0.06, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
        osc('sine', bassNotes[bassIdx % bassNotes.length], t, t + 0.5, g)
        bassIdx++
      } catch {}
      pulseTimeout = setTimeout(playBass, 520)
    }

    const playArpe = () => {
      if (!pulseRunning || muted) return
      try {
        const c = getCtx()
        const t = c.currentTime
        const g = gain(0.04)
        g.gain.setValueAtTime(0.04, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
        osc('triangle', arpeNotes[arpeIdx % arpeNotes.length], t, t + 0.18, g)
        arpeIdx++
      } catch {}
      setTimeout(playArpe, 340)
    }

    playBass()
    setTimeout(playArpe, 160)
  },

  stopPulse() {
    pulseRunning = false
    if (pulseTimeout) clearTimeout(pulseTimeout)
    pulseTimeout = null
  },
}
