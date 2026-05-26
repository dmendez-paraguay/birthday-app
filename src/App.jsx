import { useState, useEffect } from 'react'
import { DEFAULT_CFG, GLOBAL_CSS } from './themes.js'
import { loadConfig, saveConfig, dbStatus } from './lib/db.js'
import { Audio } from './lib/audio.js'
import NavBar from './components/NavBar.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import BalloonGame from './screens/BalloonGame.jsx'
import LeaderboardScreen from './screens/LeaderboardScreen.jsx'
import RSVPScreen from './screens/RSVPScreen.jsx'
import AdminScreen from './screens/AdminScreen.jsx'
import GamesHub from './screens/GamesHub.jsx'
import Game from './game/Game.jsx'
import AllClearScreen from './screens/AllClearScreen.jsx'
import PhotoGallery from './screens/PhotoGallery.jsx'

export default function App() {
  const [cfg, setCfg] = useState(DEFAULT_CFG)
  const [screen, setScreen] = useState('home')
  const [muted, setMuted] = useState(false)
  const [ready, setReady] = useState(false)
  const [allClearScore, setAllClearScore] = useState(0)
  const [allClearLevels, setAllClearLevels] = useState(5)
  const [dbError, setDbError] = useState(null)   // null | 'no-document' | error code

  useEffect(() => {
    loadConfig(DEFAULT_CFG).then(d => {
      setCfg(d)
      setReady(true)
      // Mostrar banner de diagnóstico si no conectó
      if (!dbStatus.ok) setDbError(dbStatus.error)
      if (d.musicOn) {
        setTimeout(() => { Audio.init(); Audio.startMusic() }, 800)
      }
    })
  }, [])

  const nav = s => {
    Audio.init()
    if (s !== 'game' && s !== 'shooter') Audio.playChime()
    setScreen(s)
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    Audio.setMuted(next)
    if (!next) { Audio.init(); Audio.startMusic() }
  }

  const handleAllClear = (score, levels = 5) => {
    setAllClearScore(score)
    setAllClearLevels(levels)
    setScreen('allclear')
  }

  const updateCfg = async newCfg => {
    setCfg(newCfg)
    Audio.stopMusic()
    if (newCfg.musicOn && !muted) {
      setTimeout(() => { Audio.init(); Audio.startMusic() }, 300)
    }
  }

  if (!ready) return (
    <div style={{
      background: '#070714', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ fontSize: 48, animation: 'hero-bounce 1.5s ease-in-out infinite' }}>🎂</div>
      <div style={{
        fontFamily: "'Press Start 2P',monospace",
        color: '#00d4ff', fontSize: 11, letterSpacing: 2,
        animation: 'pulse 1s ease-in-out infinite',
      }}>Cargando...</div>
    </div>
  )

  const showNav = !['game', 'shooter', 'allclear'].includes(screen)

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Banner de diagnóstico Firebase — solo visible cuando hay error */}
      {dbError && screen === 'home' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: dbError === 'no-document' ? '#7c3a00' : '#3a0000',
          color: '#fff',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 11, lineHeight: 1.5,
          padding: '10px 16px',
          borderBottom: '2px solid ' + (dbError === 'no-document' ? '#ff9500' : '#ff3b3b'),
        }}>
          {dbError === 'no-document'
            ? '⚠️ Firebase conectado pero config/app no existe → abrí ⚙️ Admin y guardá la configuración'
            : `❌ Firebase sin conexión — error: ${dbError} → revisá las variables de entorno en Vercel`
          }
          <span
            onClick={() => setDbError(null)}
            style={{ float: 'right', cursor: 'pointer', opacity: 0.7 }}
          >✕</span>
        </div>
      )}

      {/* paddingBottom extra para que la NavBar + safe-area nunca tape el contenido */}
      <div style={{ paddingBottom: showNav ? 'max(90px, calc(78px + env(safe-area-inset-bottom)))' : 0 }}>
        {screen === 'home'    && <HomeScreen cfg={cfg} nav={nav} />}
        {screen === 'games'   && <GamesHub cfg={cfg} nav={nav} />}
        {screen === 'game'    && <BalloonGame cfg={cfg} nav={nav} />}
        {screen === 'shooter' && <Game cfg={cfg} nav={nav} onAllClear={handleAllClear} />}
        {screen === 'lb'      && <LeaderboardScreen cfg={cfg} nav={nav} />}
        {screen === 'rsvp'    && <RSVPScreen cfg={cfg} nav={nav} />}
        {screen === 'admin'   && <AdminScreen cfg={cfg} setCfg={updateCfg} nav={nav} />}
        {screen === 'photos'  && <PhotoGallery cfg={cfg} nav={nav} />}
        {screen === 'allclear' && <AllClearScreen score={allClearScore} maxLevels={allClearLevels} name={cfg.name} nav={nav} onReplay={() => { setScreen('shooter') }} />}
      </div>
      {showNav && (
        <NavBar
          cfg={cfg}
          nav={nav}
          screen={screen}
          muted={muted}
          toggleMute={toggleMute}
        />
      )}
    </>
  )
}
