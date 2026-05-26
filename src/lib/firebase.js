import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// ── Diagnóstico de variables de entorno ────────────────────────
const missingVars = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => `VITE_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`)

if (missingVars.length > 0) {
  console.error(
    '[Firebase] ❌ Variables de entorno faltantes o undefined:\n' +
    missingVars.join('\n') +
    '\n\nSi estás en Vercel, asegurate de que:\n' +
    '  1. Los nombres tienen el prefijo VITE_\n' +
    '  2. Redeploy después de agregar las variables'
  )
} else {
  console.log('[Firebase] ✅ Config cargada — projectId:', firebaseConfig.projectId)
}

const app = initializeApp(firebaseConfig)
export const db      = getFirestore(app)
export const storage = getStorage(app)
export { app }
