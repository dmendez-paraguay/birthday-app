/**
 * firebase.js — Operaciones Firestore para el Space Shooter.
 * Colección separada 'shooter_scores' para no mezclar con el BalloonGame.
 */
import { db } from '../lib/firebase.js'
import {
  collection, addDoc, getDocs,
  query, orderBy, limit, onSnapshot,
} from 'firebase/firestore'

const COLLECTION = import.meta.env.VITE_SHOOTER_COLLECTION || 'shooter_scores'
const COL = () => collection(db, COLLECTION)

/**
 * Guarda el score final del jugador.
 * @param {{ name: string, emoji: string, score: number, level: number }} entry
 */
export async function saveShooterScore(entry) {
  await addDoc(COL(), {
    ...entry,
    date: new Date().toISOString(),
  })
}

/**
 * Carga el ranking de mejores scores.
 * @param {number} n - cantidad de registros
 * @returns {Promise<Array>}
 */
export async function loadShooterLeaderboard(n = 10) {
  try {
    const q = query(COL(), orderBy('score', 'desc'), limit(n))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    return []
  }
}

/** Suscripción en tiempo real al ranking del Space Blaster */
export function subscribeShooterLeaderboard(callback, n = 20) {
  const q = query(COL(), orderBy('score', 'desc'), limit(n))
  return onSnapshot(q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    () => callback([])
  )
}
