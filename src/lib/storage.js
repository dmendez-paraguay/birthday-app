/**
 * storage.js — Galería de fotos con Cloudinary (upload) + Firestore (metadatos).
 * Cloudinary reemplaza Firebase Storage: tier gratuito sin tarjeta de crédito.
 */
import { db } from './firebase.js'
import {
  collection, addDoc, query, orderBy, onSnapshot, deleteDoc,
  doc, updateDoc, increment, limit,
} from 'firebase/firestore'

const PHOTOS_COL = () => collection(db, 'photos')

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/** Suscripción en tiempo real a la galería de fotos, ordenadas por fecha desc */
export function subscribePhotos(callback) {
  const q = query(PHOTOS_COL(), orderBy('date', 'desc'))
  return onSnapshot(q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    () => callback([])
  )
}

/**
 * Suscripción en tiempo real a la foto con más likes.
 * Devuelve null si no hay fotos o ninguna tiene likes todavía.
 */
export function subscribeTopPhoto(callback) {
  try {
    const q = query(PHOTOS_COL(), orderBy('likes', 'desc'), limit(1))
    return onSnapshot(q,
      snap => {
        const top = snap.docs[0]
        callback(top && (top.data().likes || 0) > 0
          ? { id: top.id, ...top.data() }
          : null
        )
      },
      () => callback(null)
    )
  } catch {
    callback(null)
    return () => {}
  }
}

/** Redimensiona una imagen a máx maxDim px (canvas API) → Blob JPEG */
async function resizeImage(file, maxDim = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round(height * maxDim / width); width = maxDim }
        else                 { width  = Math.round(width  * maxDim / height); height = maxDim }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('resize')), 'image/jpeg', 0.82)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load')) }
    img.src = url
  })
}

/**
 * Sube una foto a Cloudinary y guarda los metadatos en Firestore.
 * Los errores son específicos para facilitar el diagnóstico.
 * @param {{ file: File, name: string, emoji: string, caption?: string }} opts
 */
export async function uploadPhoto({ file, name, emoji, caption = '' }) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      '❌ Variables de entorno faltantes: VITE_CLOUDINARY_CLOUD_NAME o VITE_CLOUDINARY_UPLOAD_PRESET.\n' +
      'Verificá la configuración de Vercel.'
    )
  }

  // 1. Redimensionar en el browser
  let blob
  try {
    blob = await resizeImage(file)
  } catch (e) {
    throw new Error(`❌ Error al procesar la imagen: ${e.message}`)
  }

  // 2. Subir a Cloudinary
  const form = new FormData()
  form.append('file', blob, 'photo.jpg')
  form.append('upload_preset', UPLOAD_PRESET)
  form.append('folder', 'birthday-app')

  let res
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: form }
    )
  } catch (e) {
    throw new Error(`❌ Sin conexión a Cloudinary: ${e.message}`)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      `❌ Cloudinary (${res.status}): ${err.error?.message ?? 'Error desconocido'}.\n` +
      'Verificá que el Upload Preset sea "Unsigned" en cloudinary.com'
    )
  }

  const { secure_url, public_id } = await res.json()

  // 3. Guardar metadatos en Firestore
  try {
    await addDoc(PHOTOS_COL(), {
      name:         name.trim(),
      emoji,
      caption:      caption.trim(),
      url:          secure_url,
      cloudinaryId: public_id,
      date:         new Date().toISOString(),
      likes:        0,
    })
  } catch (e) {
    // La imagen ya subió a Cloudinary pero no se pudo guardar en Firestore
    throw new Error(
      `❌ Firestore: ${e.message}.\n` +
      'La imagen se subió a Cloudinary pero no se guardó. Revisá las reglas de Firestore.'
    )
  }
}

/**
 * Incrementa el contador de likes de una foto en +1.
 * La regla Firestore solo permite modificar el campo 'likes' en +1.
 */
export async function likePhoto(photoId) {
  await updateDoc(doc(db, 'photos', photoId), {
    likes: increment(1),
  })
}

/** Elimina la entrada de Firestore (imagen en Cloudinary queda; borrar manualmente si hace falta) */
export async function deletePhotoDoc(photoId) {
  await deleteDoc(doc(db, 'photos', photoId))
}
