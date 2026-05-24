/**
 * audio.js — Motor de audio con Web Audio API.
 * Singleton: un solo contexto por sesión.
 */
let ctx = null
let musicOn = false
let mTimer = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function note(freq, t, dur, vol = 0.18, type = 'sine') {
  const c = getCtx()
  const o = c.createOscillator()
  const g = c.createGain()
  o.connect(g)
  g.connect(c.destination)
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.start(t)
  o.stop(t + dur)
}

let _muted = false

export const Audio = {
  init() { try { getCtx() } catch (e) {} },
  setMuted(m) { _muted = m; if (m) this.stopMusic() },
  isMuted() { return _muted },

  playPop() {
    if (_muted) return
    try {
      const c = getCtx(), t = c.currentTime
      note(700 + Math.random() * 500, t, 0.07, 0.3, 'sine')
      note(350 + Math.random() * 200, t + 0.01, 0.07, 0.15, 'triangle')
    } catch (e) {}
  },

  playChime() {
    if (_muted) return
    try {
      const c = getCtx(), t = c.currentTime
      ;[523, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.12, 0.45, 0.2, 'sine'))
    } catch (e) {}
  },

  playVictory() {
    if (_muted) return
    try {
      const c = getCtx(), t = c.currentTime
      ;[523, 659, 784, 523, 784, 1047, 1047, 1319].forEach((f, i) =>
        note(f, t + i * 0.14, 0.4, 0.18, 'triangle')
      )
    } catch (e) {}
  },

  startMusic() {
    if (musicOn || _muted) return
    musicOn = true
    const mel = [261, 294, 329, 392, 349, 294, 261, 294, 329, 392, 440, 392, 329, 261]
    const play = () => {
      if (!musicOn || _muted) return
      try {
        const c = getCtx(), t = c.currentTime
        mel.forEach((f, i) => note(f, t + i * 0.33, 0.28, 0.055, 'triangle'))
        ;[130, 146, 164, 130].forEach((f, i) => note(f, t + i * 1.1, 0.9, 0.04, 'sine'))
        mTimer = setTimeout(play, mel.length * 330 + 400)
      } catch (e) {}
    }
    play()
  },

  stopMusic() {
    musicOn = false
    if (mTimer) clearTimeout(mTimer)
  },
}
