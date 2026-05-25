/**
 * storage.js — Galería de fotos con Firebase Storage + Firestore.
 */
import { storage, db } from './firebase.js'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'

const PHOTOS_COL = () => collection(db, 'photos')

/** Suscripción en tiempo real a la galería de fotos */
export function subscribePhotos(callback) {
  const q = query(PHOTOS_COL(), orderBy('date', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, () => callback([]))
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
        else { width = Math.round(width * maxDim / height); height = maxDim }
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
 * Sube una foto a Storage y guarda metadatos en Firestore.
 * @param {{ file: File, name: string, emoji: string, caption?: string }} opts
 */
export async function uploadPhoto({ file, name, emoji, caption = '' }) {
  const blob = await resizeImage(file)
  const path = `photos/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  const url = await getDownloadURL(storageRef)
  await addDoc(PHOTOS_COL(), {
    name: name.trim(), emoji,
    caption: caption.trim(),
    url, path,
    date: new Date().toISOString(),
  })
}

/** Elimina la entrada de Firestore (la imagen en Storage queda; limpieza vía Cloud Functions) */
export async function deletePhotoDoc(photoId) {
  await deleteDoc(doc(db, 'photos', photoId))
}
