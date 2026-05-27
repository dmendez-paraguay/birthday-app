/**
 * db.js — Capa de datos sobre Firestore.
 * Toda llamada a la base de datos pasa por aquí.
 */
import { db } from './firebase.js'
import {
  doc, getDoc, setDoc,
  collection, getDocs, addDoc, deleteDoc,
  query, orderBy, limit, where, onSnapshot,
} from 'firebase/firestore'

// ── Colecciones ────────────────────────────────────────────────
const CFG_REF   = () => doc(db, 'config', 'app')
const LB_COL    = () => collection(db, 'leaderboard')
const RSVP_COL  = () => collection(db, 'rsvp')

// ── Estado de conexión (exportado para que la UI lo muestre) ───
export const dbStatus = { ok: null, error: null, source: null }

// ── Config ─────────────────────────────────────────────────────
export async function loadConfig(defaults) {
  try {
    console.log('[DB] Conectando a Firestore...')
    const snap = await getDoc(CFG_REF())
    if (snap.exists()) {
      dbStatus.ok = true
      dbStatus.source = 'firestore'
      dbStatus.error = null
      console.log('[DB] ✅ Config cargada desde Firestore:', Object.keys(snap.data()))
      return { ...defaults, ...snap.data() }
    } else {
      dbStatus.ok = false
      dbStatus.source = 'defaults'
      dbStatus.error = 'no-document'
      console.warn(
        '[DB] ⚠️ El documento config/app NO existe en Firestore.\n' +
        '→ Solución: abrí el panel Admin (⚙️) y guardá la configuración.'
      )
      return defaults
    }
  } catch (err) {
    dbStatus.ok = false
    dbStatus.source = 'defaults'
    dbStatus.error = err.code ?? err.message ?? 'unknown'
    console.error('[DB] ❌ Error Firestore:', dbStatus.error, '\n', err)
    return defaults
  }
}

export async function saveConfig(cfg) {
  await setDoc(CFG_REF(), cfg)
}

// ── Leaderboard ────────────────────────────────────────────────
export async function loadLeaderboard() {
  const q = query(LB_COL(), orderBy('score', 'desc'), limit(20))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addScore(entry) {
  await addDoc(LB_COL(), entry)
}

export async function clearLeaderboard() {
  const snap = await getDocs(LB_COL())
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
}

// ── RSVP ───────────────────────────────────────────────────────
export async function loadRsvp() {
  const snap = await getDocs(RSVP_COL())
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addRsvp(entry) {
  const q = query(RSVP_COL(), where('nameLower', '==', entry.nameLower))
  const snap = await getDocs(q)
  if (!snap.empty) {
    await setDoc(snap.docs[0].ref, entry)
  } else {
    await addDoc(RSVP_COL(), entry)
  }
}

export async function clearRsvp() {
  const snap = await getDocs(RSVP_COL())
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
}

/** Suscripción en tiempo real al leaderboard de Balloon Game */
export function subscribeLeaderboard(callback) {
  const q = query(LB_COL(), orderBy('score', 'desc'), limit(20))
  return onSnapshot(q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    () => callback([])
  )
}
