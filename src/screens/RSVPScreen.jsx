import { useState, useEffect } from 'react'
import { T, EMOJIS, btnStyle, cardStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import BackButton from '../components/BackButton.jsx'
import { loadRsvp, addRsvp } from '../lib/db.js'
import { Audio } from '../lib/audio.js'

export default function RSVPScreen({ cfg, nav }) {
  const t = T[cfg.style]
  const [rsvps, setRsvps] = useState(null)
  const [step, setStep] = useState('list')   // list | form | confirmed
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadRsvp().then(setRsvps) }, [])

  const confirm = async () => {
    if (!name.trim() || loading) return
    setLoading(true)
    try {
      const entry = {
        name: name.trim(),
        nameLower: name.trim().toLowerCase(),
        emoji,
        msg: msg.trim() || '¡Voy al cumple! 🎉',
        date: new Date().toLocaleDateString('es'),
      }
      await addRsvp(entry)
      const updated = await loadRsvp()
      setRsvps(updated)
      setStep('confirmed')
      Audio.playChime()
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    background: 'transparent', border: `1px solid ${t.border}`,
    borderRadius: t.r, padding: '10px 14px',
    color: t.fg, fontFamily: t.fB, fontSize: 15, width: '100%',
  }

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: t.fB, position: 'relative', overflow: 'hidden' }}>
      <BgLayer style={cfg.style} />

      <div style={{ position: 'relative', zIndex: 10, padding: '20px 20px 110px', maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <BackButton t={t} onClick={() => nav('home')} />
          <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(10px,2.8vw,15px)', flex: 1 }}>
            {cfg.style === 'kawaii' ? '📋 Asistencia' : '📋 ASISTENCIA'}
          </div>
          {rsvps && (
            <div style={{ fontFamily: t.fB, color: t.fg2, fontSize: 'clamp(11px,3vw,14px)' }}>
              {rsvps.length} 🎉
            </div>
          )}
        </div>

        {/* Confirmed banner */}
        {step === 'confirmed' && (
          <div style={{ ...cardStyle(t, true), padding: 24, marginBottom: 18, textAlign: 'center', animation: 'appear 0.3s ease-out' }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
            <div style={{ fontFamily: t.fH, color: t.a1, fontSize: 'clamp(10px,2.8vw,14px)', marginBottom: 8 }}>
              {cfg.style === 'kawaii' ? '¡Confirmado! 🌸' : '¡CONFIRMADO!'}
            </div>
            <div style={{ color: t.fg2, fontSize: 'clamp(12px,3vw,15px)' }}>¡Nos vemos en el cumple!</div>
          </div>
        )}

        {/* Confirm button */}
        {step === 'list' && (
          <button onClick={() => setStep('form')} style={{ ...btnStyle(t), width: '100%', marginBottom: 16, fontSize: 'clamp(9px,2.5vw,12px)' }}>
            ✅ {cfg.style === 'kawaii' ? '¡Confirmar que voy!' : 'CONFIRMAR ASISTENCIA'}
          </button>
        )}

        {/* Form */}
        {step === 'form' && (
          <div style={{ ...cardStyle(t), padding: 20, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: t.fH, color: t.fg, fontSize: 'clamp(8px,2.2vw,11px)', textAlign: 'center' }}>
              ¿QUIÉN ERES?
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre..." maxLength={20} style={inp} />
            <div style={{ color: t.fg2, fontSize: 'clamp(10px,2.5vw,13px)' }}>Tu emoji:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {EMOJIS.slice(0, 12).map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  background: emoji === e ? `${t.a1}22` : 'transparent',
                  border: `1px solid ${emoji === e ? t.a1 : t.border}`,
                  borderRadius: t.r, padding: '6px 8px', fontSize: 20, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>{e}</button>
              ))}
            </div>
            <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Mensaje (opcional)..." maxLength={60} style={inp} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('list')} style={{ ...btnStyle(t, true), flex: 1 }}>Cancelar</button>
              <button onClick={confirm} disabled={!name.trim() || loading} style={{ ...btnStyle(t), flex: 1, opacity: name.trim() && !loading ? 1 : 0.45 }}>
                {loading ? '...' : cfg.style === 'kawaii' ? '🎊 ¡Confirmar!' : 'CONFIRMAR'}
              </button>
            </div>
          </div>
        )}

        {/* RSVP list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rsvps === null && <div style={{ color: t.fg2, textAlign: 'center', padding: 20 }}>Cargando...</div>}
          {rsvps?.length === 0 && (
            <div style={{ color: t.fg2, textAlign: 'center', padding: 30, fontSize: 'clamp(13px,3vw,16px)' }}>
              Sé el primero en confirmar 🎈
            </div>
          )}
          {rsvps?.map((r, i) => (
            <div key={r.id || i} style={{
              ...cardStyle(t), padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              animation: 'appear 0.3s ease-out forwards', animationDelay: `${i * 0.04}s`, opacity: 0,
            }}>
              <div style={{ fontSize: 30 }}>{r.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: t.fH, color: t.fg, fontSize: 'clamp(9px,2.4vw,13px)' }}>{r.name}</div>
                <div style={{ color: t.fg2, fontSize: 'clamp(10px,2.5vw,13px)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  "{r.msg}"
                </div>
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: t.r, fontSize: 'clamp(8px,2vw,11px)',
                background: `${t.a3}15`, color: t.a3, border: `1px solid ${t.a3}30`,
                whiteSpace: 'nowrap', fontFamily: t.fB,
              }}>✓ Va</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
