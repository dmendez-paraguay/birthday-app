/**
 * audio.js — Motor de audio con Web Audio API.
 * Singleton: un solo contexto por sesión.
 *
 * Fix: Page Visibility API detiene/reanuda el contexto cuando la tab
 * queda en segundo plano (cambia de app, minimiza, etc.).
 * Fix: setTimeout del loop de música fuera del try-catch para que el
 * loop nunca muera silenciosamente ante excepciones de AudioContext.
 */
let ctx = null
let musicOn = false
let mTimer = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  // Solo reanudar si la página está visible — evita que el loop de música
  // reactive el contexto cuando la app está en background.
  if (ctx.state === 'suspended' && !document.hidden) ctx.resume()
  return ctx
}

// ── Page Visibility API ───────────────────────────────────────
// Al pasar a background: suspender contexto y cancelar el timer del loop.
// Al volver al primer plano: reanudar contexto y reiniciar el loop.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) {
      ctx.suspend()
      if (mTimer) { clearTimeout(mTimer); mTimer = null }
    } else if (musicOn && !_muted) {
      ctx.resume()
      musicOn = false      // resetear para que startMusic() no haga early return
      Audio.startMusic()   // reiniciar el loop desde cero
    }
  })
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
      // Si la página está oculta, no programar notas ni nuevo timer.
      // visibilitychange (visible) llamará startMusic() para reiniciar.
      if (document.hidden) return
      try {
        const c = getCtx(), t = c.currentTime
        mel.forEach((f, i) => note(f, t + i * 0.33, 0.28, 0.055, 'triangle'))
        ;[130, 146, 164, 130].forEach((f, i) => note(f, t + i * 1.1, 0.9, 0.04, 'sine'))
      } catch (e) {}
      mTimer = setTimeout(play, mel.length * 330 + 400)
    }
    play()
  },

  stopMusic() {
    musicOn = false
    if (mTimer) clearTimeout(mTimer)
  },
}
