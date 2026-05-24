/**
 * entities.js — Lógica pura del juego (sin React).
 * Todas las funciones son puras o reciben/retornan estado.
 * El game loop las llama en cada frame.
 */
import {
  PLAYER, BOSS, BULLET, LEVELS, BOSS_PATTERNS,
  GAME_W, GAME_H, SCORE,
  EFFECT_TTL_HIT, EFFECT_TTL_EXPLODE, HIT_FLASH_FRAMES,
} from './constants.js'

// ── Contador de IDs únicos ────────────────────────────────────
let _uid = 0
export function resetUID() { _uid = 0 }
export function uid() { return ++_uid }

// ── Constructores ─────────────────────────────────────────────

export function createPlayer(W, H) {
  return {
    x: W / 2 - PLAYER.width / 2,
    y: H - PLAYER.height - 24,
    w: PLAYER.width,
    h: PLAYER.height,
    health: PLAYER.health,
    maxHealth: PLAYER.health,
    invincible: 0,        // frames restantes de invencibilidad
    shootCooldown: 0,     // frames hasta próximo disparo
    targetX: W / 2 - PLAYER.width / 2,
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
    speed: lvl.bossSpeed,
    shootInterval: lvl.bossShootInterval,
    shootCooldown: lvl.bossShootInterval,
    dir: 1,               // 1 = derecha, -1 = izquierda
    patternIdx: 0,
    hitFlash: 0,          // frames de hit flash restantes
    entryDone: false,
    entryFrame: 0,        // frames desde spawn para animación entrada
  }
}

export function createPlayerBullet(player) {
  return {
    id: uid(),
    type: 'player',
    x: player.x + player.w / 2 - BULLET.player.width / 2,
    y: player.y - BULLET.player.height,
    w: BULLET.player.width,
    h: BULLET.player.height,
    vy: -PLAYER.bulletSpeed,
  }
}

/**
 * Crea uno o más proyectiles del boss según el patrón.
 * @returns Array de bullets
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

    case 'circle6': {
      const angles = [0, 60, 120, 180, 240, 300]
      return angles.map(a => makeBullet(a))
    }

    case 'aimed': {
      const dx = (playerX + PLAYER.width / 2) - cx
      const dy = (playerY + PLAYER.height / 2) - cy
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      return [{
        id: uid(),
        type: 'boss',
        x: cx - BULLET.boss.width / 2,
        y: cy,
        w: BULLET.boss.width,
        h: BULLET.boss.height,
        vx: (dx / dist) * BOSS.bulletSpeed,
        vy: (dy / dist) * BOSS.bulletSpeed,
      }]
    }

    default:
      return [makeBullet(0)]
  }
}

// ── Movimiento ────────────────────────────────────────────────

/** Mueve el jugador interpolando hacia targetX con velocidad máxima. */
export function movePlayer(player, dt, W) {
  const speed = PLAYER.speed * dt
  const diff = player.targetX - player.x
  const step = Math.sign(diff) * Math.min(Math.abs(diff), speed)
  const newX = Math.max(0, Math.min(W - player.w, player.x + step))
  return { ...player, x: newX }
}

/** Mueve el boss de lado a lado con rebote en los bordes. */
export function moveBoss(boss, dt, W) {
  let { x, dir, speed } = boss

  // Animación de entrada: el boss baja desde arriba
  if (!boss.entryDone) {
    const entryFrame = boss.entryFrame + 1
    const targetY = 80
    const startY = -BOSS.height - 20
    const progress = Math.min(entryFrame / 45, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
    const y = startY + (targetY - startY) * eased
    return { ...boss, y, entryFrame, entryDone: progress >= 1 }
  }

  x += dir * speed * dt
  if (x + boss.w >= W - 10) { x = W - boss.w - 10; dir = -1 }
  if (x <= 10)               { x = 10;              dir = 1  }

  const hitFlash = Math.max(0, boss.hitFlash - 1)
  return { ...boss, x, dir, hitFlash }
}

/** Mueve todos los proyectiles y filtra los que salen de pantalla. */
export function moveBullets(bullets, dt, W, H) {
  return bullets
    .map(b => ({
      ...b,
      x: b.x + (b.vx || 0) * dt,
      y: b.y + b.vy * dt,
    }))
    .filter(b => b.y > -50 && b.y < H + 50 && b.x > -50 && b.x < W + 50)
}

// ── Disparo automático ────────────────────────────────────────

export function tickShooting(player, boss, bullets, dt) {
  const newBullets = [...bullets]
  let newPlayer = { ...player, shootCooldown: Math.max(0, player.shootCooldown - dt) }
  let newBoss = { ...boss, shootCooldown: Math.max(0, boss.shootCooldown - dt) }
  const newBossBullets = []

  // Disparo del jugador
  if (newPlayer.shootCooldown <= 0) {
    newBullets.push(createPlayerBullet(newPlayer))
    newPlayer = { ...newPlayer, shootCooldown: PLAYER.shootInterval }
  }

  // Disparo del boss (sólo si ya completó entrada)
  if (boss.entryDone && newBoss.shootCooldown <= 0) {
    const pattern = BOSS_PATTERNS[boss.patternIdx % BOSS_PATTERNS.length]
    const bossShots = createBossBullets(newBoss, pattern, player.x, player.y)
    newBossBullets.push(...bossShots)
    newBoss = {
      ...newBoss,
      shootCooldown: boss.shootInterval,
      patternIdx: boss.patternIdx + 1,
    }
  }

  return { player: newPlayer, boss: newBoss, bullets: [...newBullets, ...newBossBullets] }
}

// ── Colisiones AABB ───────────────────────────────────────────

function intersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

/**
 * Procesa todas las colisiones y devuelve el nuevo estado + eventos.
 * Eventos posibles: 'boss-hit', 'player-hit', 'boss-dead', 'player-dead'
 */
export function tickCollisions(state) {
  let { player, boss, bullets, score, effects } = state
  const events = []
  const newEffects = [...effects]

  const remainingBullets = []

  for (const b of bullets) {
    let consumed = false

    // Bala del jugador impacta al boss
    if (b.type === 'player' && boss.entryDone && intersects(b, boss)) {
      boss = {
        ...boss,
        health: boss.health - 1,
        hitFlash: HIT_FLASH_FRAMES,
      }
      score += SCORE.hitBoss
      events.push('boss-hit')

      // Efecto visual de impacto en el boss
      newEffects.push({
        id: uid(), type: 'hit',
        x: b.x - 8, y: b.y,
        ttl: EFFECT_TTL_HIT, maxTtl: EFFECT_TTL_HIT,
        scoreVal: `+${SCORE.hitBoss}`,
      })

      if (boss.health <= 0) {
        events.push('boss-dead')
        score += SCORE.killBoss
        newEffects.push({
          id: uid(), type: 'explosion',
          x: boss.x + boss.w / 2 - 40,
          y: boss.y + boss.h / 2 - 40,
          ttl: EFFECT_TTL_EXPLODE, maxTtl: EFFECT_TTL_EXPLODE,
        })
      }
      consumed = true
    }

    // Bala del boss impacta al jugador
    if (!consumed && b.type === 'boss' && player.invincible === 0 && intersects(b, player)) {
      player = {
        ...player,
        health: player.health - 1,
        invincible: PLAYER.invincibleFrames,
      }
      events.push('player-hit')
      if (player.health <= 0) events.push('player-dead')
      consumed = true
    }

    if (!consumed) remainingBullets.push(b)
  }

  // Decrementar invencibilidad del jugador
  if (player.invincible > 0) {
    player = { ...player, invincible: player.invincible - 1 }
  }

  // Decrementar TTL de efectos
  const liveEffects = newEffects
    .map(e => ({ ...e, ttl: e.ttl - 1 }))
    .filter(e => e.ttl > 0)

  return {
    state: { ...state, player, boss, bullets: remainingBullets, score, effects: liveEffects },
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
    score:   0,
    frame:   0,
  }
}
