/**
 * entities.js — Lógica pura del juego (sin React, sin side-effects).
 * Incluye: jugador, boss con 3 fases, power-ups, combo, partículas, shake.
 */
import {
  PLAYER, BOSS, BULLET, LEVELS, BOSS_PHASES, BOSS_PATTERNS,
  GAME_W, GAME_H, SCORE, SHAKE,
  POWERUP, COMBO,
  HIT_FLASH_FRAMES, EFFECT_TTL_HIT, EFFECT_TTL_EXPLODE, PARTICLE_COUNT,
} from './constants.js'

// ── Contador de IDs únicos ────────────────────────────────────
let _uid = 0
export function resetUID() { _uid = 0 }
export function uid() { return ++_uid }

// ── Helpers ───────────────────────────────────────────────────
function getBossPhase(boss) {
  const pct = boss.health / boss.maxHealth
  for (let i = BOSS_PHASES.length - 1; i >= 0; i--) {
    if (pct <= BOSS_PHASES[i].hpPct) return BOSS_PHASES[i].phase
  }
  return 1
}

function getBossPhaseConfig(phase) {
  return BOSS_PHASES.find(p => p.phase === phase) || BOSS_PHASES[0]
}

// ── Constructores ─────────────────────────────────────────────

export function createPlayer(W, H) {
  const startX = W / 2 - PLAYER.width / 2
  const startY = H - PLAYER.height - 24
  return {
    x: startX,
    y: startY,
    w: PLAYER.width,
    h: PLAYER.height,
    health: PLAYER.health,
    maxHealth: PLAYER.health,
    invincible: 0,
    shootCooldown: 0,
    targetX: startX,
    targetY: startY,   // ← nuevo: objetivo vertical
    // Power-up activo
    shield: 0,
    rapidFire: 0,
  }
}

export function createBoss(level, W) {
  const lvl = LEVELS[Math.min(level - 1, LEVELS.length - 1)]
  return {
    x: W / 2 - BOSS.width / 2,
    y: 80,
    w: BOSS.width,
    h: BOSS.height,
    health: lvl.bossHealth,
    maxHealth: lvl.bossHealth,
    baseSpeed: lvl.bossSpeed,
    baseShootInterval: lvl.bossShootInterval,
    // Velocidad y cooldown actuales (modificados por fase)
    speed: lvl.bossSpeed,
    shootInterval: lvl.bossShootInterval,
    shootCooldown: lvl.bossShootInterval,
    dir: 1,
    emoji: lvl.bossEmoji,
    villainName: lvl.villainName,
    // Fases
    phase: 1,
    // Power-up drops
    droppedPhase2: false,
    droppedPhase3: false,
    // Visuales
    hitFlash: 0,
    entryDone: false,
    entryFrame: 0,
    // Patrón de disparo
    patternIdx: 0,
  }
}

export function createPlayerBullet(player) {
  const intervalOverride = player.rapidFire > 0
    ? Math.floor(PLAYER.shootInterval / 2.5)
    : PLAYER.shootInterval
  return {
    id: uid(),
    type: 'player',
    // La punta de la nave SVG está en el centro horizontal, tope del hitbox
    x: player.x + player.w / 2 - BULLET.player.width / 2,
    y: player.y,        // desde la punta (top del hitbox = nariz de la nave)
    w: BULLET.player.width,
    h: BULLET.player.height,
    vy: -PLAYER.bulletSpeed,
    _interval: intervalOverride,
  }
}

export function createPowerUp(x, y, type) {
  return {
    id: uid(),
    type,
    x: x - POWERUP.width / 2,
    y,
    w: POWERUP.width,
    h: POWERUP.height,
    vy: POWERUP.fallSpeed,
  }
}

/**
 * Crea proyectiles del boss según patrón y fase.
 * El spread5 es un patrón exclusivo de la fase 3.
 */
export function createBossBullets(boss, pattern, playerX, playerY) {
  const cx = boss.x + boss.w / 2
  const cy = boss.y + boss.h

  const makeBullet = (angle) => {
    const rad = (angle * Math.PI) / 180
    return {
      id: uid(),
      type: 'boss',
      x: cx - BULLET.boss.width / 2,
      y: cy,
      w: BULLET.boss.width,
      h: BULLET.boss.height,
      vx: Math.sin(rad) * BOSS.bulletSpeed,
      vy: Math.cos(rad) * BOSS.bulletSpeed,
    }
  }

  switch (pattern) {
    case 'single':
      return [makeBullet(0)]
    case 'spread3':
      return [makeBullet(-22), makeBullet(0), makeBullet(22)]
    case 'spread5':
      return [makeBullet(-40), makeBullet(-20), makeBullet(0), makeBullet(20), makeBullet(40)]
    case 'circle6': {
      return [0, 60, 120, 180, 240, 300].map(a => makeBullet(a))
    }
    case 'aimed': {
      const dx = (playerX + PLAYER.width / 2) - cx
      const dy = (playerY + PLAYER.height / 2) - cy
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      return [{
        id: uid(), type: 'boss',
        x: cx - BULLET.boss.width / 2, y: cy,
        w: BULLET.boss.width, h: BULLET.boss.height,
        vx: (dx / dist) * BOSS.bulletSpeed,
        vy: (dy / dist) * BOSS.bulletSpeed,
      }]
    }
    default: return [makeBullet(0)]
  }
}

// ── Movimiento ────────────────────────────────────────────────

export function movePlayer(player, dt, W, H) {
  const speed = PLAYER.speed * dt

  // Eje X
  const diffX = player.targetX - player.x
  const stepX = Math.sign(diffX) * Math.min(Math.abs(diffX), speed)
  const newX  = Math.max(0, Math.min(W - player.w, player.x + stepX))

  // Eje Y — la nave puede moverse en el 80% inferior de la pantalla
  const minY  = H * 0.18           // no sube más que ~18% desde arriba
  const maxY  = H - player.h - 10
  const diffY = player.targetY - player.y
  const stepY = Math.sign(diffY) * Math.min(Math.abs(diffY), speed)
  const newY  = Math.max(minY, Math.min(maxY, player.y + stepY))

  return { ...player, x: newX, y: newY }
}

export function moveBoss(boss, dt, W) {
  let { x, dir, speed, entryFrame, entryDone } = boss

  // Animación de entrada
  if (!entryDone) {
    const frame = entryFrame + 1
    const progress = Math.min(frame / 45, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    const y = -BOSS.height + (80 + BOSS.height) * eased
    return { ...boss, y: Math.max(-BOSS.height, y), entryFrame: frame, entryDone: progress >= 1 }
  }

  x += dir * speed * dt
  if (x + boss.w >= W - 10) { x = W - boss.w - 10; dir = -1 }
  if (x <= 10)              { x = 10;              dir = 1  }

  return { ...boss, x, dir, hitFlash: Math.max(0, boss.hitFlash - 1) }
}

export function moveBullets(bullets, dt, W, H) {
  return bullets
    .map(b => ({ ...b, x: b.x + (b.vx || 0) * dt, y: b.y + b.vy * dt }))
    .filter(b => b.y > -60 && b.y < H + 60 && b.x > -60 && b.x < W + 60)
}

export function movePowerUps(powerUps, dt, H) {
  return powerUps
    .map(p => ({ ...p, y: p.y + p.vy * dt }))
    .filter(p => p.y < H + 40)
}

/** Mueve partículas: física simple con gravedad leve */
export function moveParticles(effects, dt) {
  return effects.map(e => {
    if (e.type !== 'particle') return e
    return {
      ...e,
      x: e.x + (e.vx || 0) * dt,
      y: e.y + (e.vy || 0) * dt,
      vy: (e.vy || 0) + 0.15 * dt,  // gravedad suave
    }
  })
}

// ── Disparo automático ────────────────────────────────────────

export function tickShooting(player, boss, bullets, dt) {
  const effectiveInterval = player.rapidFire > 0
    ? Math.floor(PLAYER.shootInterval / 2.5)
    : PLAYER.shootInterval

  let newPlayer = { ...player, shootCooldown: Math.max(0, player.shootCooldown - dt) }
  let newBoss   = { ...boss,   shootCooldown: Math.max(0, boss.shootCooldown - dt) }
  const newBullets = [...bullets]
  let shotFired = false

  // Disparo del jugador
  if (newPlayer.shootCooldown <= 0) {
    newBullets.push(createPlayerBullet(newPlayer))
    newPlayer = { ...newPlayer, shootCooldown: effectiveInterval }
    shotFired = true
  }

  // Disparo del boss (sólo tras entrada)
  const newBossBullets = []
  if (boss.entryDone && newBoss.shootCooldown <= 0) {
    const patterns = BOSS_PATTERNS[boss.phase] || BOSS_PATTERNS[1]
    const pattern  = patterns[boss.patternIdx % patterns.length]
    newBossBullets.push(...createBossBullets(newBoss, pattern, player.x, player.y))
    newBoss = {
      ...newBoss,
      shootCooldown: boss.shootInterval,
      patternIdx: boss.patternIdx + 1,
    }
  }

  return {
    player: newPlayer,
    boss: newBoss,
    bullets: [...newBullets, ...newBossBullets],
    shotFired,
  }
}

// ── Colisiones AABB ───────────────────────────────────────────

function intersects(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y
  )
}

/** Genera partículas de explosión en torno a un punto */
function spawnParticles(cx, cy, count) {
  const colors = ['#ff6600', '#ff0000', '#ffaa00', '#ffffff', '#ff006e', '#ffd700']
  return Array.from({ length: count }, () => {
    const angle  = Math.random() * Math.PI * 2
    const speed  = 1.5 + Math.random() * 3.5
    const life   = 28 + Math.floor(Math.random() * 22)
    return {
      id: uid(), type: 'particle',
      x: cx - 4, y: cy - 4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
      ttl: life, maxTtl: life,
    }
  })
}

/**
 * Procesa colisiones y devuelve { state, events }.
 * Maneja:
 *  - Balas jugador → boss
 *  - Balas boss → jugador
 *  - Jugador → power-ups
 *  - Fases del boss y drops
 *  - Combo y multiplicador
 *  - Camera shake
 */
export function tickCollisions(state) {
  let { player, boss, bullets, effects, powerUps, score,
        combo, comboTimer, multiplier, shakeX, shakeY } = state
  const events = []
  const remainingBullets = []
  const newEffects = [...effects]
  let newPowerUps = [...powerUps]

  // ── Decrementar timers del jugador ──────────────────────
  if (player.invincible > 0) player = { ...player, invincible: player.invincible - 1 }
  if (player.shield    > 0) player = { ...player, shield:    player.shield - 1 }
  if (player.rapidFire > 0) player = { ...player, rapidFire: player.rapidFire - 1 }

  // ── Combo decay ─────────────────────────────────────────
  let newCombo = combo
  let newComboTimer = Math.max(0, comboTimer - 1)
  let newMultiplier = multiplier
  if (newComboTimer === 0 && combo > 0) {
    newCombo = 0
    newMultiplier = 1
    events.push('combo-reset')
  }

  // ── Shake decay ─────────────────────────────────────────
  let newShakeX = shakeX * 0.75
  let newShakeY = shakeY * 0.75
  if (Math.abs(newShakeX) < 0.3) newShakeX = 0
  if (Math.abs(newShakeY) < 0.3) newShakeY = 0

  // ── Balas del jugador → boss ─────────────────────────────
  for (const b of bullets) {
    let consumed = false

    if (b.type === 'player' && intersects(b, boss)) {
      // Boss recibe daño (incluso durante entrada para fase early)
      if (boss.entryDone) {
        const hitScore = SCORE.hitBoss * newMultiplier
        boss = { ...boss, health: boss.health - 1, hitFlash: HIT_FLASH_FRAMES }
        score += hitScore

        // Combo
        newCombo++
        newComboTimer = COMBO.resetFrames
        newMultiplier = Math.min(COMBO.maxMultiplier, Math.floor(newCombo / COMBO.hitsPerLevel) + 1)

        events.push('boss-hit')
        if (newMultiplier > multiplier) events.push('combo-up')

        // Efecto hit + score popup
        newEffects.push({
          id: uid(), type: 'hit',
          x: b.x - 8, y: b.y,
          ttl: EFFECT_TTL_HIT, maxTtl: EFFECT_TTL_HIT,
          scoreVal: newMultiplier > 1 ? `+${hitScore} x${newMultiplier}` : `+${hitScore}`,
        })

        // Shake leve
        newShakeX += (Math.random() - 0.5) * SHAKE.bossHit * 2
        newShakeY += (Math.random() - 0.5) * SHAKE.bossHit

        // ── Transición de fase del boss ──────────────────
        const newPhase = getBossPhase(boss)
        if (newPhase !== boss.phase) {
          const phaseConf = getBossPhaseConfig(newPhase)
          boss = {
            ...boss,
            phase: newPhase,
            speed: boss.baseSpeed + phaseConf.speedBonus,
            shootInterval: Math.floor(boss.baseShootInterval * phaseConf.shootMult),
          }
          events.push(`boss-phase-${newPhase}`)

          // Shake de cambio de fase
          newShakeX += (Math.random() - 0.5) * SHAKE.bossPhase * 2
          newShakeY += (Math.random() - 0.5) * SHAKE.bossPhase

          // Drop de power-up
          if (newPhase === 2 && !boss.droppedPhase2) {
            newPowerUps.push(createPowerUp(boss.x + boss.w / 2, boss.y + boss.h, 'rapidFire'))
            boss = { ...boss, droppedPhase2: true }
          }
          if (newPhase === 3 && !boss.droppedPhase3) {
            newPowerUps.push(createPowerUp(boss.x + boss.w / 2, boss.y + boss.h, 'shield'))
            boss = { ...boss, droppedPhase3: true }
          }
        }

        // ── Boss muerto ──────────────────────────────────
        if (boss.health <= 0) {
          events.push('boss-dead')
          score += SCORE.killBoss
          const bx = boss.x + boss.w / 2
          const by = boss.y + boss.h / 2
          // Explosión grande
          newEffects.push({
            id: uid(), type: 'explosion',
            x: bx - 40, y: by - 40,
            ttl: EFFECT_TTL_EXPLODE, maxTtl: EFFECT_TTL_EXPLODE,
          })
          // Partículas
          newEffects.push(...spawnParticles(bx, by, PARTICLE_COUNT))
          newEffects.push(...spawnParticles(bx - 20, by - 20, Math.floor(PARTICLE_COUNT / 2)))
          // Shake masivo
          newShakeX = SHAKE.bossDead * (Math.random() > 0.5 ? 1 : -1)
          newShakeY = SHAKE.bossDead * (Math.random() > 0.5 ? 1 : -1)
        }
      }
      consumed = true
    }

    // ── Balas del boss → jugador ──────────────────────────
    if (!consumed && b.type === 'boss' && player.invincible === 0 && intersects(b, player)) {
      // Escudo absorbe el golpe
      if (player.shield > 0) {
        events.push('shield-block')
        newEffects.push({
          id: uid(), type: 'hit',
          x: player.x, y: player.y - 10,
          ttl: EFFECT_TTL_HIT, maxTtl: EFFECT_TTL_HIT,
          scoreVal: '🛡️',
        })
      } else {
        player = { ...player, health: player.health - 1, invincible: PLAYER.invincibleFrames }
        events.push('player-hit')
        newShakeX += (Math.random() - 0.5) * SHAKE.playerHit * 2
        newShakeY += (Math.random() - 0.5) * SHAKE.playerHit
        // Reset combo al recibir daño
        newCombo = 0; newComboTimer = 0; newMultiplier = 1
        if (player.health <= 0) events.push('player-dead')
      }
      consumed = true
    }

    if (!consumed) remainingBullets.push(b)
  }

  // ── Jugador → power-ups ───────────────────────────────────
  const collectedPowerUps = []
  newPowerUps = newPowerUps.filter(p => {
    if (intersects(p, player)) {
      collectedPowerUps.push(p)
      return false
    }
    return true
  })
  for (const p of collectedPowerUps) {
    const cfg = POWERUP.types[p.type]
    if (p.type === 'shield')    player = { ...player, shield: cfg.frames }
    if (p.type === 'rapidFire') player = { ...player, rapidFire: cfg.frames }
    if (p.type === 'bomb') {
      // Bomba: daño masivo al boss
      const bombDmg = Math.floor(boss.maxHealth * 0.25)
      boss = { ...boss, health: Math.max(1, boss.health - bombDmg), hitFlash: 20 }
      score += SCORE.hitBoss * bombDmg
      newEffects.push(...spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, PARTICLE_COUNT))
      newShakeX = SHAKE.bossDead * 0.7
      newShakeY = SHAKE.bossDead * 0.7
    }
    events.push(`powerup-${p.type}`)
    newEffects.push({
      id: uid(), type: 'hit',
      x: player.x, y: player.y - 16,
      ttl: EFFECT_TTL_HIT + 10, maxTtl: EFFECT_TTL_HIT + 10,
      scoreVal: cfg.label,
    })
  }

  // ── Limpiar efectos ──────────────────────────────────────
  const liveEffects = newEffects
    .map(e => ({ ...e, ttl: e.ttl - 1 }))
    .filter(e => e.ttl > 0)

  return {
    state: {
      ...state,
      player, boss,
      bullets: remainingBullets,
      effects: liveEffects,
      powerUps: newPowerUps,
      score,
      combo: newCombo,
      comboTimer: newComboTimer,
      multiplier: newMultiplier,
      shakeX: newShakeX,
      shakeY: newShakeY,
    },
    events,
  }
}

// ── Estado inicial completo ───────────────────────────────────

export function buildInitialState(level, W, H) {
  resetUID()
  return {
    player:  createPlayer(W, H),
    boss:    createBoss(level, W),
    bullets: [],
    effects: [],
    powerUps: [],
    score:   0,
    frame:   0,
    // Combo
    combo:       0,
    comboTimer:  0,
    multiplier:  1,
    // Camera shake
    shakeX: 0,
    shakeY: 0,
  }
}
