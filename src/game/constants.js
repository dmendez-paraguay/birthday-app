/**
 * constants.js — Configuración centralizada del Space Shooter.
 * Ajustar aquí para cambiar gameplay sin tocar lógica.
 */

// ── Dimensiones virtuales del área de juego ───────────────────
export const GAME_W = 390
export const GAME_H = 844

// ── Jugador ───────────────────────────────────────────────────
export const PLAYER = {
  width: 44,
  height: 52,
  speed: 6,              // px por "frame-equivalente" a 60fps
  health: 5,
  shootInterval: 14,     // frames entre disparos automáticos
  bulletSpeed: 10,
  invincibleFrames: 90,  // frames de invencibilidad tras recibir daño
}

// ── Boss ──────────────────────────────────────────────────────
export const BOSS = {
  width: 110,
  height: 90,
  speed: 1.2,            // px por frame base
  shootInterval: 55,     // frames base entre disparos del boss
  bulletSpeed: 3.5,
}

// ── Niveles ───────────────────────────────────────────────────
// Cada nivel incrementa salud, velocidad y cadencia del boss.
export const LEVELS = [
  { bossHealth: 60,  bossSpeed: 1.0, bossShootInterval: 65, label: 'Sector I'   },
  { bossHealth: 85,  bossSpeed: 1.4, bossShootInterval: 48, label: 'Sector II'  },
  { bossHealth: 115, bossSpeed: 1.8, bossShootInterval: 36, label: 'Sector III' },
]

// ── Patrones de disparo del boss ──────────────────────────────
// El boss alterna estos patrones de forma cíclica.
export const BOSS_PATTERNS = ['single', 'spread3', 'aimed', 'spread3', 'circle6']

// ── Proyectiles ───────────────────────────────────────────────
export const BULLET = {
  player: { width: 5, height: 18 },
  boss:   { width: 9, height: 9  },
}

// ── Score ─────────────────────────────────────────────────────
export const SCORE = {
  hitBoss:  10,
  killBoss: 500,
}

// ── Fondo ─────────────────────────────────────────────────────
export const STARS_COUNT  = 80
export const NEBULA_COUNT = 3

// ── Efectos visuales ──────────────────────────────────────────
export const HIT_FLASH_FRAMES   = 6   // frames que dura el flash del boss
export const EFFECT_TTL_HIT     = 25  // frames que duran los efectos de impacto
export const EFFECT_TTL_EXPLODE = 45  // frames de explosión
