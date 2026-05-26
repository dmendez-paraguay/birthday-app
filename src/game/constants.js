/**
 * constants.js — Configuración centralizada del Space Blaster.
 * 5 sectores, fases del boss, power-ups, combo y shake de cámara.
 */

// ── Dimensiones virtuales ─────────────────────────────────────
export const GAME_W = 390
export const GAME_H = 844

// ── Jugador ───────────────────────────────────────────────────
export const PLAYER = {
  width: 44,
  height: 52,
  speed: 6,
  health: 5,
  shootInterval: 14,
  bulletSpeed: 10,
  invincibleFrames: 90,
}

// ── Boss ──────────────────────────────────────────────────────
export const BOSS = {
  width: 110,
  height: 90,
  bulletSpeed: 3.5,
}

// ── 5 Sectores con emoji de boss único ───────────────────────
export const LEVELS = [
  { bossHealth: 50,  bossSpeed: 0.9,  bossShootInterval: 72, label: 'Sector I',   bossEmoji: '👾', villainName: 'El Globo Malvado',     mission: '¡El Globo Malvado robó los globos de [NAME]! 🎈 ¡Recuperalos!' },
  { bossHealth: 75,  bossSpeed: 1.25, bossShootInterval: 56, label: 'Sector II',  bossEmoji: '👽', villainName: 'El Alien Aguafiestas',  mission: '¡El Alien Aguafiestas raptó a los invitados de [NAME]! 🎊' },
  { bossHealth: 100, bossSpeed: 1.55, bossShootInterval: 44, label: 'Sector III', bossEmoji: '🤖', villainName: 'El Robot Fastidioso',   mission: '¡El Robot apagó las velitas del pastel de [NAME]! 🎂 ¡Encendelas de nuevo!' },
  { bossHealth: 135, bossSpeed: 1.9,  bossShootInterval: 34, label: 'Sector IV',  bossEmoji: '💀', villainName: 'El Esqueleto Ladrón',   mission: '¡El Esqueleto Ladrón se robó todos los regalos de [NAME]! 🎁' },
  { bossHealth: 170, bossSpeed: 2.35, bossShootInterval: 26, label: 'Sector V',   bossEmoji: '☠️', villainName: 'El Pirata del Cosmos',  mission: '¡El Pirata del Cosmos quiere arruinar el gran festejo de [NAME]! 🏴‍☠️' },
]

// ── Estilos de balas del jugador ──────────────────────────────
export const BULLET_STYLES = [
  { id: 'default', emoji: null,  label: 'LÁSER'    },
  { id: 'gift',    emoji: '🎁',  label: 'REGALO'   },
  { id: 'balloon', emoji: '🎈',  label: 'GLOBO'    },
  { id: 'star',    emoji: '⭐',  label: 'ESTRELLA' },
]

// ── Fases del boss (por % de HP restante) ────────────────────
// Cada fase multiplica velocidad y reduce intervalo de disparo
export const BOSS_PHASES = [
  { phase: 1, hpPct: 1.00, speedBonus: 0.0,  shootMult: 1.00, glowColor: '#ff006e' },
  { phase: 2, hpPct: 0.65, speedBonus: 0.5,  shootMult: 0.68, glowColor: '#ff6600' }, // Agresivo
  { phase: 3, hpPct: 0.35, speedBonus: 1.0,  shootMult: 0.48, glowColor: '#ff0000' }, // Enojado
]

// ── Patrones de disparo del boss ──────────────────────────────
// Cada fase tiene su propio set de patrones
export const BOSS_PATTERNS = {
  1: ['single', 'spread3', 'aimed'],
  2: ['spread3', 'aimed', 'spread3', 'circle6'],
  3: ['circle6', 'aimed', 'spread5', 'aimed', 'circle6'],
}

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

// ── Power-ups ─────────────────────────────────────────────────
export const POWERUP = {
  width: 30, height: 30,
  fallSpeed: 2.2,
  // Caen del boss al llegar a estas fases
  dropAtPhase2: 'rapidFire',  // al 65% HP
  dropAtPhase3: 'shield',     // al 35% HP
  types: {
    shield:    { frames: 280, emoji: '🛡️', color: '#00d4ff',  label: 'ESCUDO'  },
    rapidFire: { frames: 220, emoji: '⚡', color: '#ffd700',  label: 'RÁPIDO'  },
    bomb:      { frames: 0,   emoji: '💣', color: '#ff006e',  label: '¡BOMBA!' },
  },
}

// ── Combo ─────────────────────────────────────────────────────
export const COMBO = {
  resetFrames: 160,       // Frames sin golpear antes de resetear
  maxMultiplier: 5,
  hitsPerLevel: 4,        // golpes para subir un nivel de multiplicador
}

// ── Camera shake (intensidad en px virtuales) ─────────────────
export const SHAKE = {
  bossHit:    1.5,
  playerHit:  7,
  bossPhase:  10,
  bossDead:   16,
}

// ── Efectos visuales ──────────────────────────────────────────
export const HIT_FLASH_FRAMES   = 6
export const EFFECT_TTL_HIT     = 24
export const EFFECT_TTL_EXPLODE = 50
export const PARTICLE_COUNT     = 14   // partículas por explosión

// ── Fondo ─────────────────────────────────────────────────────
export const STARS_COUNT  = 80
export const NEBULA_COUNT = 3
