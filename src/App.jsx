import { useState, useEffect } from 'react'
import { DEFAULT_CFG, GLOBAL_CSS } from './themes.js'
import { loadConfig, saveConfig } from './lib/db.js'
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

  useEffect(() => {
    loadConfig(DEFAULT_CFG).then(d => {
      setCfg(d)
      setReady(true)
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

  const handleAllClear = (score) => {
    setAllClearScore(score)
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
      <div style={{ paddingBottom: showNav ? 90 : 0 }}>
        {screen === 'home'    && <HomeScreen cfg={cfg} nav={nav} />}
        {screen === 'games'   && <GamesHub cfg={cfg} nav={nav} />}
        {screen === 'game'    && <BalloonGame cfg={cfg} nav={nav} />}
        {screen === 'shooter' && <Game cfg={cfg} nav={nav} onAllClear={handleAllClear} />}
        {screen === 'lb'      && <LeaderboardScreen cfg={cfg} nav={nav} />}
        {screen === 'rsvp'    && <RSVPScreen cfg={cfg} nav={nav} />}
        {screen === 'admin'   && <AdminScreen cfg={cfg} setCfg={updateCfg} nav={nav} />}
        {screen === 'photos'  && <PhotoGallery cfg={cfg} nav={nav} />}
        {screen === 'allclear' && <AllClearScreen score={allClearScore} nav={nav} onReplay={() => { setScreen('shooter') }} />}
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
