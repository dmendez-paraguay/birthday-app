/**
 * minigames.js — Firestore para los leaderboards de Piñata Bash y Memoria.
 * Cada juego usa su propia colección: pinata_scores, memory_scores.
 */
import { db } from './firebase.js'
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore'

const col = (game) => collection(db, `${game}_scores`)

export function subscribeMinigameLeaderboard(game, callback, n = 20) {
  const q = query(col(game), orderBy('score', 'desc'), limit(n))
  return onSnapshot(q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    () => callback([])
  )
}

export async function saveMinigameScore(game, entry) {
  await addDoc(col(game), {
    ...entry,
    date: new Date().toISOString(),
  })
}
