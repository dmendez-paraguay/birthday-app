import { useState } from 'react'
import { T, btnStyle, cardStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import { saveConfig, clearLeaderboard, clearRsvp } from '../lib/db.js'
import { Audio } from '../lib/audio.js'

function firebaseSaveErrorMessage(error) {
  const message = error?.message || ''
  if (message.includes('firestore.googleapis.com') || message.includes('SERVICE_DISABLED')) {
    return 'Firestore no esta activado en Firebase'
  }
  if (error?.code === 'permission-denied') {
    return 'Firebase rechazo el guardado: revisa las reglas de Firestore'
  }
  if (error?.code === 'unavailable') {
    return 'Firebase no esta disponible: revisa la conexion'
  }
  return `No se pudo guardar en Firebase${error?.code ? ` (${error.code})` : ''}`
}

export default function AdminScreen({ cfg, setCfg, nav }) {
  const t = T[cfg.style]
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [form, setForm] = useState({ ...cfg })
  const [tab, setTab] = useState('config')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [pinErr, setPinErr] = useState('')

  const flash = text => { setMsg(text); setTimeout(() => setMsg(''), 2500) }

  const unlock = () => {
    if (pin === cfg.pin) { setUnlocked(true); Audio.init(); Audio.playChime() }
    else { setPinErr('PIN incorrecto ✗'); setPin(''); setTimeout(() => setPinErr(''), 2000) }
  }

  const saveAll = async () => {
    if (saving) return
    setSaving(true)
    try {
      await saveConfig(form)
      setCfg(form)
      flash('✓ Configuración guardada')
      Audio.playChime()
    } catch (error) {
      console.error('No se pudo guardar la configuracion en Firebase:', error)
      flash(firebaseSaveErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const resetLb = async () => {
    if (!window.confirm('¿Borrar todos los puntajes?')) return
    await clearLeaderboard()
    flash('✓ Puntajes borrados')
  }

  const resetRsvp = async () => {
    if (!window.confirm('¿Borrar todas las confirmaciones?')) return
    await clearRsvp()
    flash('✓ Confirmaciones borradas')
  }

  const inp = {
    background: 'transparent', border: `1px solid ${t.border}`,
    borderRadius: t.r, padding: '10px 14px',
    color: t.fg, fontFamily: t.fB, fontSize: 15, width: '100%',
  }
  const lbl = {
    color: t.fg2, fontSize: 'clamp(8px,2.2vw,11px)',
    fontFamily: t.fH, marginBottom: 6, display: 'block',
  }

  /* ── PIN screen ─────────────────────────────────────── */
  if (!unlocked) return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 20, padding: 24,
      position: 'relative', overflow: 'hidden',
    }}>
      <BgLayer style={cfg.style} />
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%', maxWidth: 320 }}>
        <div style={{ fontSize: 56, animation: 'hero-bounce 2s ease-in-out infinite' }}>🔐</div>
        <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(12px,3.5vw,18px)' }}>ADMIN</div>
        <div style={{ ...cardStyle(t), padding: 28, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="password" value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && unlock()}
            placeholder="PIN..." maxLength={8}
            style={{ ...inp, textAlign: 'center', letterSpacing: 6, fontSize: 24, fontFamily: t.fH }}
          />
          {pinErr && <div style={{ color: t.a2, textAlign: 'center', fontFamily: t.fH, fontSize: 'clamp(8px,2vw,10px)' }}>{pinErr}</div>}
          <button onClick={unlock} style={{ ...btnStyle(t), width: '100%' }}>ENTRAR</button>
          <button onClick={() => nav('home')} style={{ ...btnStyle(t, true), width: '100%' }}>← Volver</button>
        </div>
      </div>
    </div>
  )

  /* ── Admin panel ────────────────────────────────────── */
  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: t.fB, position: 'relative', overflow: 'hidden' }}>
      <BgLayer style={cfg.style} />

      <div style={{ position: 'relative', zIndex: 10, padding: '20px 20px 110px', maxWidth: 500, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => nav('home')} style={{ ...btnStyle(t, true), padding: '8px 13px' }}>←</button>
          <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(10px,2.8vw,15px)', flex: 1 }}>🔧 PANEL ADMIN</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: t.card, border: `1px solid ${t.border}`, borderRadius: t.r, padding: 4 }}>
          {[['config', '⚙ Config'], ['style', '🎨 Estilo'], ['datos', '🗃 Datos']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '9px 4px', fontFamily: t.fH, fontSize: 'clamp(6px,1.8vw,9px)',
              background: tab === k ? `${t.a1}20` : 'transparent',
              border: `1px solid ${tab === k ? t.a1 : 'transparent'}`,
              borderRadius: t.r, color: tab === k ? t.a1 : t.fg2,
              cursor: 'pointer', letterSpacing: '1px',
            }}>{l}</button>
          ))}
        </div>

        {msg && (
          <div style={{
            padding: '10px 14px', background: `${t.a1}15`, border: `1px solid ${t.a1}44`,
            borderRadius: t.r, color: t.a1, fontFamily: t.fH,
            fontSize: 'clamp(8px,2vw,10px)', textAlign: 'center', marginBottom: 16,
          }}>{msg}</div>
        )}

        {/* ── Tab: Config ── */}
        {tab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><span style={lbl}>NOMBRE DEL CUMPLEAÑERO</span>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
            </div>
            <div><span style={lbl}>EDAD QUE CUMPLE</span>
              <input type="number" value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })} min={1} max={120} style={inp} />
            </div>
            <div><span style={lbl}>FECHA Y HORA DEL CUMPLEAÑOS</span>
              <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} />
            </div>
            <div><span style={lbl}>MENSAJE DE BIENVENIDA</span>
              <input value={form.welcomeMessage || ''} onChange={e => setForm({ ...form, welcomeMessage: e.target.value })} style={inp} />
            </div>
            <div><span style={lbl}>HORARIO DEL EVENTO</span>
              <input value={form.eventTime || ''} onChange={e => setForm({ ...form, eventTime: e.target.value })} style={inp} />
            </div>
            <div><span style={lbl}>LUGAR DEL EVENTO</span>
              <input value={form.eventPlace || ''} onChange={e => setForm({ ...form, eventPlace: e.target.value })} style={inp} />
            </div>
            <div><span style={lbl}>LINK DE UBICACION</span>
              <input type="url" value={form.eventMapUrl || ''} onChange={e => setForm({ ...form, eventMapUrl: e.target.value })} style={inp} />
            </div>
            <div><span style={lbl}>NUEVO PIN DE ADMIN</span>
              <input type="password" value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} maxLength={8} style={inp} />
            </div>
            <button onClick={saveAll} disabled={saving} style={{ ...btnStyle(t), marginTop: 6, width: '100%', opacity: saving ? 0.65 : 1 }}>
              {saving ? 'GUARDANDO...' : '💾 GUARDAR CAMBIOS'}
            </button>
          </div>
        )}

        {/* ── Tab: Style ── */}
        {tab === 'style' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={lbl}>SELECCIONA EL ESTILO VISUAL:</span>
            {Object.entries(T).map(([key, th]) => (
              <button key={key} onClick={() => setForm({ ...form, style: key })} style={{
                padding: '18px 16px',
                background: form.style === key ? `${th.a1}14` : t.card,
                border: `2px solid ${form.style === key ? th.a1 : t.border}`,
                borderRadius: t.r, cursor: 'pointer', textAlign: 'left',
                boxShadow: form.style === key ? `0 0 24px ${th.a1}33` : 'none',
                transition: 'all 0.2s',
              }}>
                <div style={{ fontFamily: th.fH, color: th.a1, fontSize: 'clamp(10px,3vw,14px)', marginBottom: 10 }}>
                  {th.name}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {[th.a1, th.a2, th.a3].map((c, i) => (
                    <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: c, boxShadow: `0 0 10px ${c}88` }} />
                  ))}
                  {form.style === key && (
                    <div style={{ marginLeft: 'auto', fontFamily: t.fH, color: th.a1, fontSize: 'clamp(7px,2vw,9px)' }}>✓ ACTIVO</div>
                  )}
                </div>
              </button>
            ))}
            <button onClick={saveAll} disabled={saving} style={{ ...btnStyle(t), marginTop: 6, width: '100%', opacity: saving ? 0.65 : 1 }}>
              {saving ? 'GUARDANDO...' : '💾 APLICAR ESTILO'}
            </button>
          </div>
        )}

        {/* ── Tab: Datos ── */}
        {tab === 'datos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { title: 'LEADERBOARD', desc: 'Borra todos los puntajes del mural.', action: resetLb, label: '🗑 BORRAR PUNTAJES' },
              { title: 'CONFIRMACIONES RSVP', desc: 'Borra todas las confirmaciones de asistencia.', action: resetRsvp, label: '🗑 BORRAR RSVP' },
            ].map(item => (
              <div key={item.title} style={{ ...cardStyle(t), padding: 18 }}>
                <div style={{ fontFamily: t.fH, color: t.fg, fontSize: 'clamp(8px,2.2vw,11px)', marginBottom: 8 }}>{item.title}</div>
                <div style={{ color: t.fg2, fontSize: 'clamp(11px,3vw,14px)', marginBottom: 14, lineHeight: 1.6 }}>{item.desc}</div>
                <button onClick={item.action} style={{ ...btnStyle(t, false, true), width: '100%' }}>{item.label}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
