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

// ── Config ─────────────────────────────────────────────────────
export async function loadConfig(defaults) {
  try {
    const snap = await getDoc(CFG_REF())
    return snap.exists() ? { ...defaults, ...snap.data() } : defaults
  } catch {
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
  // entry: { name, emoji, score, date }
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
  // Si ya existe un RSVP con el mismo nombre, lo sobreescribe
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
