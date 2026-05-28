/**
 * PhotoGallery.jsx — Galería de fotos con upload, grid en tiempo real, lightbox y likes.
 *
 * Novedades:
 * - Sistema de likes por foto (contador en tiempo real, anti-spam por localStorage)
 * - Sección "Foto Estrella" fijada arriba del grid cuando hay votos
 * - Badge 👑 en la card más votada del grid
 * - Botón de like en el lightbox
 * - Label de fotógrafo en el upload ("¿Quién sacó la foto?")
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { T, btnStyle, cardStyle } from '../themes.js'
import BgLayer from '../components/BgLayer.jsx'
import BackButton from '../components/BackButton.jsx'
import { subscribePhotos, uploadPhoto, likePhoto } from '../lib/storage.js'

const EMOJIS_PICKER = ['😎','🥳','🤩','😄','🦄','🚀','🎉','🌟']

// ── Helpers de localStorage para likes ──────────────────────────────────────
const LIKED_KEY = 'bday_liked_photos'
function getLiked() {
  try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')) }
  catch { return new Set() }
}
function addLiked(photoId) {
  const s = getLiked()
  s.add(photoId)
  localStorage.setItem(LIKED_KEY, JSON.stringify([...s]))
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 10,
      overflow: 'hidden',
      animation: 'pulse 1.4s ease-in-out infinite',
    }}>
      <div style={{ width: '100%', paddingBottom: '75%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ padding: '8px 10px' }}>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 6, width: '60%' }} />
        <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '40%' }} />
      </div>
    </div>
  )
}

// ── Upload modal ──────────────────────────────────────────────────────────────
function UploadModal({ t, onClose, onUpload }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('😎')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
    if (!file || !name.trim()) return
    setLoading(true)
    setError('')
    try {
      await onUpload({ file, name: name.trim(), emoji, caption })
      onClose()
    } catch (e) {
      setError(e.message || 'Error al subir. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'appear 0.25s ease-out',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        ...cardStyle(t),
        width: '100%', maxWidth: 380,
        padding: 24,
        maxHeight: '92vh', overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontFamily: t.fH, fontSize: 'clamp(9px,2.5vw,13px)', color: t.a1 }}>
            📷 Agregar Foto
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: t.fg2, fontSize: 18, cursor: 'pointer', lineHeight: 1,
          }}>✕</button>
        </div>

        {/* File picker */}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: '100%', padding: '12px',
            background: preview ? 'transparent' : `${t.a1}10`,
            border: `2px dashed ${preview ? t.a1 : t.border}`,
            borderRadius: t.rL, cursor: 'pointer',
            marginBottom: 14, overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {preview ? (
            <img src={preview} alt="preview"
              style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 6 }} />
          ) : (
            <div style={{ fontFamily: t.fH, fontSize: 10, color: t.fg2, padding: '16px 0', textAlign: 'center' }}>
              📁 Seleccionar imagen
            </div>
          )}
        </button>

        {/* Photographer name */}
        <div style={{ fontSize: 10, color: t.fg2, fontFamily: t.fB, marginBottom: 5 }}>
          📸 ¿Quién sacó la foto?
        </div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tu nombre"
          maxLength={24}
          style={{
            width: '100%', padding: '9px 12px', marginBottom: 10,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${t.border}`,
            borderRadius: t.r, color: t.fg,
            fontFamily: t.fB, fontSize: 14,
            boxSizing: 'border-box',
          }}
        />

        {/* Emoji picker */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          {EMOJIS_PICKER.map(e => (
            <button key={e} onClick={() => setEmoji(e)} style={{
              fontSize: 20,
              background: emoji === e ? `${t.a1}25` : 'transparent',
              border: emoji === e ? `1.5px solid ${t.a1}` : `1px solid ${t.border}`,
              borderRadius: 8, padding: '3px 6px', cursor: 'pointer',
            }}>{e}</button>
          ))}
        </div>

        {/* Caption */}
        <input
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Descripción (opcional)"
          maxLength={80}
          style={{
            width: '100%', padding: '9px 12px', marginBottom: 14,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${t.border}`,
            borderRadius: t.r, color: t.fg,
            fontFamily: t.fB, fontSize: 13,
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{ fontSize: 11, color: t.a2, marginBottom: 10, fontFamily: t.fB, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || !name.trim() || loading}
          style={{
            ...btnStyle(t),
            width: '100%', textAlign: 'center',
            opacity: (!file || !name.trim()) ? 0.4 : 1,
            cursor: (!file || !name.trim() || loading) ? 'default' : 'pointer',
            boxSizing: 'border-box',
          }}
        >
          {loading ? '⏳ Subiendo...' : '📤 Subir Foto'}
        </button>
      </div>
    </div>
  )
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photos, startIndex, onClose, likedIds, onLike }) {
  const [index, setIndex] = useState(startIndex)
  const touchStartX = useRef(null)

  const photo = photos[index]
  const hasPrev = index > 0
  const hasNext = index < photos.length - 1

  const goPrev = useCallback(() => { if (hasPrev) setIndex(i => i - 1) }, [hasPrev])
  const goNext = useCallback(() => { if (hasNext) setIndex(i => i + 1) }, [hasNext])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goPrev, goNext])

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > 50) goPrev()
    else if (delta < -50) goNext()
    touchStartX.current = null
  }

  if (!photo) return null

  const isLiked = likedIds.has(photo.id)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        animation: 'appear 0.2s ease-out',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16,
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', fontSize: 20, width: 40, height: 40, borderRadius: '50%',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
      }}>✕</button>

      {/* Arrows */}
      {hasPrev && (
        <button onClick={goPrev} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', fontSize: 22, width: 44, height: 44, borderRadius: '50%',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>‹</button>
      )}
      {hasNext && (
        <button onClick={goNext} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', fontSize: 22, width: 44, height: 44, borderRadius: '50%',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>›</button>
      )}

      {/* Image */}
      <img
        src={photo.url}
        alt={photo.name}
        style={{
          maxWidth: '95vw', maxHeight: '68vh',
          objectFit: 'contain',
          borderRadius: 8,
          boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
        }}
      />

      {/* Info panel */}
      <div style={{
        marginTop: 14, textAlign: 'center',
        maxWidth: '90vw',
        padding: '12px 20px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: 22, marginBottom: 4 }}>{photo.emoji}</div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
          📸 {photo.name}
        </div>
        {photo.caption && (
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>
            "{photo.caption}"
          </div>
        )}
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 12 }}>
          {new Date(photo.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        {/* Like button */}
        <button
          onClick={() => !isLiked && onLike(photo.id)}
          style={{
            background: isLiked ? 'rgba(255,60,100,0.18)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${isLiked ? 'rgba(255,60,100,0.45)' : 'rgba(255,255,255,0.18)'}`,
            color: isLiked ? '#ff6b8a' : 'rgba(255,255,255,0.75)',
            borderRadius: 22, padding: '7px 22px',
            cursor: isLiked ? 'default' : 'pointer',
            fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 7,
            fontFamily: "'Share Tech Mono',monospace",
            transition: 'all 0.18s',
          }}
        >
          {isLiked ? '❤️' : '🤍'}&nbsp;{photo.likes || 0}&nbsp;
          {isLiked ? 'likes' : 'Me gusta'}
        </button>
      </div>

      {/* Counter */}
      <div style={{
        position: 'absolute', bottom: 16,
        color: 'rgba(255,255,255,0.4)', fontSize: 11,
        fontFamily: "'Share Tech Mono',monospace",
      }}>
        {index + 1} / {photos.length}
      </div>
    </div>
  )
}

// ── Sección destacada ─────────────────────────────────────────────────────────
function FotoEstrella({ t, topPhoto, photos, onOpenLightbox }) {
  const idx = photos.findIndex(p => p.id === topPhoto.id)

  return (
    <div
      onClick={() => idx !== -1 && onOpenLightbox(idx)}
      style={{
        marginBottom: 20,
        borderRadius: t.rL,
        overflow: 'hidden',
        border: '1.5px solid rgba(255,215,0,0.45)',
        background: 'linear-gradient(135deg,rgba(255,215,0,0.07),rgba(255,215,0,0.02))',
        cursor: 'pointer',
        animation: 'appear 0.4s ease-out',
        boxShadow: '0 0 28px rgba(255,215,0,0.1)',
      }}
    >
      {/* Header strip */}
      <div style={{
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,215,0,0.08)',
        borderBottom: '1px solid rgba(255,215,0,0.15)',
      }}>
        <div style={{ fontFamily: t.fH, fontSize: 8, color: '#ffd700', letterSpacing: 1 }}>
          👑 FOTO ESTRELLA
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ffd700' }}>
          <span style={{ fontSize: 14 }}>❤️</span>
          <span style={{ fontFamily: t.fH, fontSize: 10 }}>{topPhoto.likes}</span>
        </div>
      </div>

      {/* Image — 16:9 */}
      <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
        <img
          src={topPhoto.url}
          alt={topPhoto.name}
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{topPhoto.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📸 {topPhoto.name}</div>
          {topPhoto.caption && (
            <div style={{
              color: 'rgba(255,255,255,0.5)', fontSize: 11,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>"{topPhoto.caption}"</div>
          )}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, flexShrink: 0 }}>›</div>
      </div>
    </div>
  )
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function PhotoGallery({ cfg, nav }) {
  const t = T[cfg.style]
  const [photos, setPhotos] = useState(null)   // null = loading
  const [showUpload, setShowUpload] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const knownIds = useRef(new Set())
  const [newIds, setNewIds] = useState(new Set())
  const [likedIds, setLikedIds] = useState(() => getLiked())

  // ── Suscripción en tiempo real ───────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribePhotos(data => {
      const isFirst = knownIds.current.size === 0 && data.length > 0

      if (isFirst) {
        data.forEach(p => knownIds.current.add(p.id))
        setPhotos(data)
        return
      }

      const brandNew = data.filter(p => !knownIds.current.has(p.id)).map(p => p.id)
      if (brandNew.length > 0) {
        brandNew.forEach(id => knownIds.current.add(id))
        setNewIds(prev => new Set([...prev, ...brandNew]))
        setTimeout(() => {
          setNewIds(prev => {
            const next = new Set(prev)
            brandNew.forEach(id => next.delete(id))
            return next
          })
        }, 3000)
      }

      setPhotos(data)
    })
    return unsub
  }, [])

  // Timeout fallback para galería vacía
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhotos(prev => prev === null ? [] : prev)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // ── Like handler ─────────────────────────────────────────────────────────
  const handleLike = useCallback(async (photoId) => {
    if (likedIds.has(photoId)) return
    // Optimistic update
    setLikedIds(prev => new Set([...prev, photoId]))
    addLiked(photoId)
    try { await likePhoto(photoId) } catch {}
  }, [likedIds])

  const handleUpload = async (opts) => { await uploadPhoto(opts) }

  const isLoading = photos === null

  // ── Foto estrella ─────────────────────────────────────────────────────────
  const topPhoto = photos && photos.length > 0
    ? [...photos].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0]
    : null
  const hasLikes = topPhoto && (topPhoto.likes || 0) > 0

  return (
    <div style={{
      background: t.bg, minHeight: '100vh',
      fontFamily: t.fB, position: 'relative', overflow: 'hidden',
    }}>
      <BgLayer style={cfg.style} />

      <div style={{ position: 'relative', zIndex: 10, padding: '20px 16px 100px', maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          {/* Fila 1: botón volver + badge EN VIVO */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <BackButton t={t} onClick={() => nav('home')} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(0,255,120,0.1)',
              border: '1px solid rgba(0,255,120,0.3)',
              borderRadius: 20, padding: '4px 10px',
              flexShrink: 0,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#00ff78', boxShadow: '0 0 6px #00ff78',
                animation: 'pulse 1.2s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: t.fH, fontSize: 'clamp(7px,1.8vw,9px)',
                color: '#00ff78', letterSpacing: '0.5px',
              }}>EN VIVO</span>
            </div>
          </div>
          {/* Fila 2: título */}
          <div>
            <div style={{
              fontFamily: t.fH, color: t.a1,
              fontSize: 'clamp(13px,3.5vw,18px)',
              textShadow: cfg.style === 'arcade' ? `0 0 12px ${t.a1}` : undefined,
            }}>
              📷 Galería
            </div>
            {photos !== null && photos.length > 0 && (
              <div style={{ color: t.fg2, fontSize: 'clamp(9px,2.2vw,11px)', fontFamily: t.fB, marginTop: 2 }}>
                {photos.length} foto{photos.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && photos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: t.fg2 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📷</div>
            <div style={{ fontFamily: t.fH, fontSize: 'clamp(9px,2.5vw,12px)', lineHeight: 1.8, color: t.fg2 }}>
              ¡Sé el primero en subir una foto! 📷
            </div>
          </div>
        )}

        {/* Foto Estrella — aparece cuando hay al menos 1 like */}
        {!isLoading && hasLikes && (
          <FotoEstrella
            t={t}
            topPhoto={topPhoto}
            photos={photos}
            onOpenLightbox={setLightboxIndex}
          />
        )}

        {/* Photo grid */}
        {!isLoading && photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {photos.map((photo, i) => {
              const isNew = newIds.has(photo.id)
              const isTop = hasLikes && photo.id === topPhoto.id
              const isLiked = likedIds.has(photo.id)

              return (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(i)}
                  style={{
                    background: t.card,
                    border: `1px solid ${
                      isNew ? '#00ff78'
                      : isTop ? 'rgba(255,215,0,0.5)'
                      : t.border
                    }`,
                    borderRadius: t.rL,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    animation: isNew ? 'appear 0.4s ease-out' : `appear 0.3s ease-out ${i * 0.04}s both`,
                    boxShadow: isNew ? '0 0 16px rgba(0,255,120,0.25)'
                             : isTop ? '0 0 16px rgba(255,215,0,0.15)'
                             : undefined,
                    position: 'relative',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* NEW badge */}
                  {isNew && (
                    <div style={{
                      position: 'absolute', top: 6, left: 6, zIndex: 5,
                      background: '#00ff78', color: '#000',
                      fontFamily: t.fH, fontSize: 7,
                      padding: '2px 6px', borderRadius: 4, letterSpacing: 1,
                    }}>NEW</div>
                  )}

                  {/* Crown badge — top photo (not shown if also NEW) */}
                  {isTop && !isNew && (
                    <div style={{
                      position: 'absolute', top: 6, left: 6, zIndex: 5,
                      background: 'rgba(255,215,0,0.2)',
                      border: '1px solid rgba(255,215,0,0.55)',
                      borderRadius: 4, padding: '2px 6px',
                      fontSize: 11,
                    }}>👑</div>
                  )}

                  {/* Image */}
                  <div style={{ width: '100%', paddingBottom: '75%', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={photo.url}
                      alt={photo.name}
                      loading="lazy"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Card info */}
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                      <span style={{ fontSize: 14 }}>{photo.emoji}</span>
                      <span style={{
                        fontFamily: t.fH, fontSize: 'clamp(7px,2vw,10px)',
                        color: t.fg,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        flex: 1,
                      }}>{photo.name}</span>
                    </div>

                    {/* Date + Like button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ color: t.fg2, fontSize: 'clamp(7px,1.8vw,9px)', fontFamily: t.fB }}>
                        {new Date(photo.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleLike(photo.id) }}
                        style={{
                          background: isLiked ? 'rgba(255,60,100,0.15)' : 'transparent',
                          border: `1px solid ${isLiked ? 'rgba(255,60,100,0.4)' : t.border}`,
                          borderRadius: 12, padding: '2px 8px',
                          cursor: isLiked ? 'default' : 'pointer',
                          color: isLiked ? '#ff6b8a' : t.fg2,
                          fontSize: 10,
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          lineHeight: 1.5,
                          transition: 'all 0.15s',
                        }}
                      >
                        {isLiked ? '❤️' : '🤍'} {photo.likes || 0}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB upload */}
      <button
        onClick={() => setShowUpload(true)}
        style={{
          position: 'fixed', bottom: 100, right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: `linear-gradient(135deg,${t.a1},${t.a2})`,
          border: 'none', color: '#fff', fontSize: 24,
          cursor: 'pointer',
          boxShadow: `0 4px 20px ${t.a1}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        📷
      </button>

      {showUpload && (
        <UploadModal t={t} onClose={() => setShowUpload(false)} onUpload={handleUpload} />
      )}

      {lightboxIndex !== null && photos && (
        <Lightbox
          photos={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          likedIds={likedIds}
          onLike={handleLike}
        />
      )}
    </div>
  )
}
