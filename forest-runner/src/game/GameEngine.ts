import type {
  Player,
  Obstacle,
  Collectible,
  Cloud,
  Particle,
  GameState,
  ResourceType,
  ChapterTheme,
  AreaNode,
  FollowPet
} from './types'
import { GameRenderer } from './renderer'
import { checkCollision, randomRange, randomInt } from './utils'
import { checkAchievements, loadAchievements } from './achievements'
import type { Achievement } from './types'
import { RESOURCE_DROP_CONFIG } from './campData'
import { getCombinedBuffs } from './campStore'
import { THEMES, selectThemedObstacleType, DEFAULT_OBSTACLE_SIZES } from './chapterData'
import { getCurrentArea } from './chapterStore'
import {
  getCombinedPetBuffs,
  getEquippedPetInfo,
  addRunExpToPet
} from './petStore'
import { getEquippedSkinColors } from './battlePassStore'
import type { SkinColorConfig } from './types'

const GRAVITY = 0.6
const BASE_JUMP_FORCE = -14
const BASE_DOUBLE_JUMP_FORCE = -12
const PLAYER_WIDTH = 50
const PLAYER_HEIGHT = 70
const DEFAULT_BASE_SPEED = 6
const DEFAULT_MAX_SPEED = 14
const SPEED_INCREMENT = 0.003
const HIGH_SCORE_KEY = 'forest-runner-highscore'
const BASE_INVINCIBLE_DURATION = 180

const OBSTACLE_MIN_INTERVAL = 45
const OBSTACLE_MAX_INTERVAL = 90
const COLLECTIBLE_INTERVAL = 35
const INITIAL_OBSTACLE_COUNT = 3
const INITIAL_COLLECTIBLE_COUNT = 8
const OBSTACLE_SPAWN_START_DISTANCE = 900
const INITIAL_CLEAR_DISTANCE = 200

function selectThemedResource(theme: ChapterTheme | null, resourceBoost: number = 1): ResourceType {
  const weights = theme ? THEMES[theme].resourceWeights : {
    wood: 30, stone: 25, herb: 20, berry: 15, crystal: 5
  }

  const adjustedWeights = Object.entries(weights).map(([type, w]) => ({
    type: type as ResourceType,
    weight: (w || 10) * resourceBoost
  }))
  const totalWeight = adjustedWeights.reduce((sum, w) => sum + w.weight, 0)
  let random = Math.random() * totalWeight

  for (const w of adjustedWeights) {
    random -= w.weight
    if (random <= 0) return w.type
  }
  return 'wood'
}

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private renderer: GameRenderer
  private width: number = 0
  private height: number = 0

  private player: Player
  private followPet: FollowPet | null = null
  private obstacles: Obstacle[] = []
  private collectibles: Collectible[] = []
  private clouds: Cloud[] = []
  private particles: Particle[] = []
  private achievements: Achievement[] = []

  private gameState: GameState
  private animationId: number = 0
  private lastTime: number = 0
  private groundOffset: number = 0
  private obstacleTimer: number = 0
  private collectibleTimer: number = 0
  private cloudTimer: number = 0

  private collectedResources: Partial<Record<ResourceType, number>> = {}
  private buffs: Record<string, number> = {}
  private extraLives: number = 0

  private currentTheme: ChapterTheme | null = null
  private currentArea: AreaNode | null = null
  private obstacleDensity: number = 1.0
  private collectibleDensity: number = 1.0

  private onGameOverCallback?: (
    score: number,
    coins: number,
    distance: number,
    resources: Partial<Record<ResourceType, number>>
  ) => void
  private onAchievementUnlock?: (achievement: Achievement) => void
  private playerJumpCallback?: () => void
  private skinColors: SkinColorConfig | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get 2d context')
    this.ctx = ctx

    this.resize()
    this.renderer = new GameRenderer(this.ctx, this.width, this.height)

    this.player = this.createPlayer()
    this.gameState = this.createInitialState()
    this.achievements = loadAchievements()

    this.initClouds()
    this.bindEvents()
  }

  private applyBuffs(): void {
    const campBuffs = getCombinedBuffs()
    const petBuffs = getCombinedPetBuffs()
    
    this.buffs = { ...campBuffs }
    for (const [type, value] of Object.entries(petBuffs)) {
      this.buffs[type] = (this.buffs[type] || 0) + value
    }
    
    this.extraLives = Math.floor(this.buffs['extra_life'] || 0)
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect()
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = this.width * window.devicePixelRatio
    this.canvas.height = this.height * window.devicePixelRatio
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  }

  private createPlayer(): Player {
    const groundY = this.height * 0.75
    return {
      x: 80,
      y: groundY - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
      isDoubleJumping: false,
      jumpCount: 0,
      animFrame: 0,
      animTimer: 0,
      isInvincible: false,
      invincibleTimer: 0
    }
  }

  private createInitialState(): GameState {
    const highScore = this.loadHighScore()
    const speedBoost = 1 + (this.buffs['speed_boost'] || 0)
    const baseSpeed = this.currentTheme ? THEMES[this.currentTheme].baseSpeed : DEFAULT_BASE_SPEED
    const maxSpeed = this.currentTheme ? THEMES[this.currentTheme].maxSpeed : DEFAULT_MAX_SPEED
    return {
      score: 0,
      coins: 0,
      distance: 0,
      highScore,
      isRunning: false,
      isGameOver: false,
      isPaused: false,
      speed: baseSpeed * speedBoost,
      baseSpeed: baseSpeed * speedBoost,
      maxSpeed: maxSpeed * speedBoost
    }
  }

  private loadHighScore(): number {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY)
      return saved ? parseInt(saved, 10) : 0
    } catch {
      return 0
    }
  }

  private saveHighScore(score: number): void {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, score.toString())
    } catch (e) {
      console.error('Failed to save high score:', e)
    }
  }

  private initClouds(): void {
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: randomRange(0, this.width),
        y: randomRange(30, this.height * 0.3),
        speed: randomRange(0.3, 1),
        size: randomRange(25, 50)
      })
    }
  }

  private bindEvents(): void {
    const handleJump = (e: KeyboardEvent | TouchEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space' && e.code !== 'ArrowUp') return
      e.preventDefault()
      this.jump()
    }

    window.addEventListener('keydown', handleJump)
    this.canvas.addEventListener('touchstart', handleJump, { passive: false })
    this.canvas.addEventListener('mousedown', handleJump)

    window.addEventListener('resize', () => {
      this.resize()
      this.renderer.resize(this.width, this.height)
      const groundY = this.height * 0.75
      if (!this.player.isJumping) {
        this.player.y = groundY - this.player.height
      }
    })
  }

  jump(): void {
    if (!this.gameState.isRunning || this.gameState.isGameOver || this.gameState.isPaused) return

    const jumpBoost = 1 + (this.buffs['jump_boost'] || 0)
    if (this.player.jumpCount === 0) {
      this.player.velocityY = BASE_JUMP_FORCE * jumpBoost
      this.player.isJumping = true
      this.player.jumpCount = 1
      this.createJumpParticles()
      this.playerJumpCallback?.()
    } else if (this.player.jumpCount === 1) {
      this.player.velocityY = BASE_DOUBLE_JUMP_FORCE * jumpBoost
      this.player.isDoubleJumping = true
      this.player.jumpCount = 2
      this.createJumpParticles()
      this.playerJumpCallback?.()
    }
  }

  onPlayerJump(callback: () => void): void {
    this.playerJumpCallback = callback
  }

  private createJumpParticles(): void {
    const groundY = this.height * 0.75
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: groundY - 5,
        velocityX: randomRange(-3, 3),
        velocityY: randomRange(-2, -5),
        size: randomRange(2, 5),
        color: '#90EE90',
        life: 30,
        maxLife: 30
      })
    }
  }

  private createCollectParticles(x: number, y: number, color: string): void {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x,
        y,
        velocityX: randomRange(-4, 4),
        velocityY: randomRange(-4, 4),
        size: randomRange(3, 6),
        color,
        life: 40,
        maxLife: 40
      })
    }
  }

  private spawnObstacle(): void {
    const type = this.currentTheme
      ? selectThemedObstacleType(this.currentTheme)
      : (['tree', 'rock', 'mushroom', 'log'] as Obstacle['type'][])[randomInt(0, 3)]
    
    const sizeConfig = DEFAULT_OBSTACLE_SIZES[type]
    const themePool = this.currentTheme ? THEMES[this.currentTheme].obstaclePool : null
    
    let width: number
    let height: number

    if (themePool) {
      width = randomRange(themePool.sizeRange.width[0], themePool.sizeRange.width[1])
      height = randomRange(themePool.sizeRange.height[0], themePool.sizeRange.height[1])
    } else {
      width = randomRange(sizeConfig.width[0], sizeConfig.width[1])
      height = randomRange(sizeConfig.height[0], sizeConfig.height[1])
    }

    const groundY = this.height * 0.75
    this.obstacles.push({
      type,
      x: this.width + 50,
      y: groundY - height,
      width,
      height,
      speed: this.gameState.speed,
      active: true
    })
  }

  private spawnCollectible(): void {
    const resourceBoost = 1 + (this.buffs['resource_boost'] || 0)
    const resourceChance = 0.35 * resourceBoost
    const isResource = Math.random() < resourceChance

    let type: Collectible['type']
    if (isResource) {
      type = selectThemedResource(this.currentTheme, resourceBoost)
    } else {
      const types: Collectible['type'][] = ['coin', 'coin', 'coin', 'star', 'potion']
      type = types[randomInt(0, types.length - 1)]
    }
    
    let value: number
    let size: number

    if (type === 'coin' || type === 'star' || type === 'potion') {
      switch (type) {
        case 'coin':
          value = 1
          size = 30
          break
        case 'star':
          value = 10
          size = 35
          break
        case 'potion':
          value = 0
          size = 35
          break
        default:
          value = 1
          size = 30
      }
    } else {
      value = RESOURCE_DROP_CONFIG[type].value
      size = 32
    }

    const groundY = this.height * 0.75
    const minY = groundY - 200
    const maxY = groundY - 80

    this.collectibles.push({
      type,
      x: this.width + 50,
      y: randomRange(minY, maxY),
      width: size,
      height: size,
      speed: this.gameState.speed,
      active: true,
      value,
      collected: false
    })
  }

  private spawnCloud(): void {
    this.clouds.push({
      x: this.width + 50,
      y: randomRange(30, this.height * 0.3),
      speed: randomRange(0.3, 1),
      size: randomRange(25, 50)
    })
  }

  private update(deltaTime: number): void {
    if (!this.gameState.isRunning || this.gameState.isGameOver || this.gameState.isPaused) return

    const dt = deltaTime / 16.67

    if (this.gameState.speed < this.gameState.maxSpeed) {
      this.gameState.speed += SPEED_INCREMENT * dt
    }

    const scoreMultiplier = 1 + (this.buffs['score_multiplier'] || 0)
    this.gameState.distance += this.gameState.speed * 0.1 * dt
    this.gameState.score += this.gameState.speed * 0.2 * dt * scoreMultiplier

    this.updatePlayer(dt)
    this.updateFollowPet(dt)
    this.updateObstacles(dt)
    this.updateCollectibles(dt)
    this.updateClouds(dt)
    this.updateParticles(dt)

    this.groundOffset += this.gameState.speed * dt

    this.obstacleTimer += dt
    const speedFactor = (this.currentTheme ? THEMES[this.currentTheme].baseSpeed : DEFAULT_BASE_SPEED) / this.gameState.speed
    const densityFactor = 1 / this.obstacleDensity
    const themeMultiplier = this.currentTheme ? THEMES[this.currentTheme].obstaclePool.spawnRateMultiplier : 1.0
    const minInterval = OBSTACLE_MIN_INTERVAL * speedFactor * densityFactor / themeMultiplier
    const maxInterval = OBSTACLE_MAX_INTERVAL * speedFactor * densityFactor / themeMultiplier
    const obstacleInterval = randomRange(minInterval, maxInterval)
    
    if (this.obstacleTimer > obstacleInterval) {
      this.spawnObstacle()
      this.obstacleTimer = 0
    }

    this.collectibleTimer += dt
    const collectInterval = COLLECTIBLE_INTERVAL / this.collectibleDensity
    if (this.collectibleTimer > collectInterval) {
      const spawnChance = 0.7 + (this.collectibleDensity - 1) * 0.15
      if (Math.random() < spawnChance) {
        this.spawnCollectible()
      }
      this.collectibleTimer = 0
    }

    this.cloudTimer += dt
    if (this.cloudTimer > 200) {
      this.spawnCloud()
      this.cloudTimer = 0
    }

    this.checkCollisions()
    this.checkAchievementsProgress()
  }

  private updatePlayer(dt: number): void {
    const groundY = this.height * 0.75

    this.player.velocityY += GRAVITY * dt
    this.player.y += this.player.velocityY * dt

    if (this.player.y + this.player.height >= groundY) {
      this.player.y = groundY - this.player.height
      this.player.velocityY = 0
      this.player.isJumping = false
      this.player.isDoubleJumping = false
      this.player.jumpCount = 0
    }

    this.player.animTimer += dt
    if (this.player.animTimer > 5) {
      this.player.animFrame++
      this.player.animTimer = 0
    }

    if (this.player.isInvincible) {
      this.player.invincibleTimer -= dt
      if (this.player.invincibleTimer <= 0) {
        this.player.isInvincible = false
      }
    }
  }

  private updateObstacles(dt: number): void {
    this.obstacles = this.obstacles.filter(obs => {
      if (!obs.active) return false
      obs.x -= this.gameState.speed * dt
      return obs.x + obs.width > -50
    })
  }

  private updateCollectibles(dt: number): void {
    this.collectibles = this.collectibles.filter(col => {
      if (!col.active || col.collected) return false
      col.x -= this.gameState.speed * dt
      return col.x + col.width > -50
    })
  }

  private updateClouds(dt: number): void {
    this.clouds = this.clouds.filter(cloud => {
      cloud.x -= cloud.speed * dt
      return cloud.x + cloud.size * 2 > -50
    })
  }

  private updateParticles(dt: number): void {
    this.particles = this.particles.filter(p => {
      p.x += p.velocityX * dt
      p.y += p.velocityY * dt
      p.velocityY += 0.2 * dt
      p.life -= dt
      return p.life > 0
    })
  }

  private updateFollowPet(dt: number): void {
    if (!this.followPet) return

    const petInfo = getEquippedPetInfo()
    if (!petInfo) {
      this.followPet = null
      return
    }

    this.followPet.targetX = this.player.x - 55
    this.followPet.targetY = this.player.y + this.player.height - this.followPet.height - 5

    const followSpeed = 0.12
    this.followPet.x += (this.followPet.targetX - this.followPet.x) * followSpeed * dt
    this.followPet.y += (this.followPet.targetY - this.followPet.y) * followSpeed * dt

    this.followPet.floatOffset = Math.sin(Date.now() / 300) * 3

    this.followPet.animTimer += dt
    if (this.followPet.animTimer > 6) {
      this.followPet.animFrame++
      this.followPet.animTimer = 0
    }

    const magnetRange = this.buffs['magnet_range'] || 0
    if (magnetRange > 0) {
      for (const col of this.collectibles) {
        if (!col.active || col.collected) continue
        const dx = (this.followPet.x + this.followPet.width / 2) - (col.x + col.width / 2)
        const dy = (this.followPet.y + this.followPet.height / 2) - (col.y + col.height / 2)
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < magnetRange && dist > 0) {
          const force = (magnetRange - dist) / magnetRange * 2
          col.x += (dx / dist) * force * dt
          col.y += (dy / dist) * force * dt
        }
      }
    }
  }

  private checkCollisions(): void {
    if (!this.player.isInvincible) {
      for (const obs of this.obstacles) {
        if (!obs.active) continue
        if (checkCollision(this.player, obs)) {
          this.gameOver()
          return
        }
      }
    }

    for (const col of this.collectibles) {
      if (!col.active || col.collected) continue
      if (checkCollision(this.player, col)) {
        col.collected = true
        this.collectItem(col)
      }
    }
  }

  private collectItem(col: Collectible): void {
    const coinMultiplier = 1 + (this.buffs['coin_multiplier'] || 0)
    const invincibleBonus = this.buffs['invincible_duration'] || 0

    if (col.type === 'coin') {
      const coinValue = Math.floor(col.value * coinMultiplier)
      this.gameState.coins += coinValue
      this.gameState.score += col.value * 10
      this.createCollectParticles(col.x + col.width / 2, col.y + col.height / 2, '#FFD700')
    } else if (col.type === 'star') {
      const coinValue = Math.floor(col.value * coinMultiplier)
      this.gameState.coins += coinValue
      this.gameState.score += col.value * 20
      this.createCollectParticles(col.x + col.width / 2, col.y + col.height / 2, '#FFFF00')
    } else if (col.type === 'potion') {
      this.player.isInvincible = true
      this.player.invincibleTimer = BASE_INVINCIBLE_DURATION + invincibleBonus
      this.createCollectParticles(col.x + col.width / 2, col.y + col.height / 2, '#9932CC')
    } else {
      const resourceType = col.type as ResourceType
      this.collectedResources[resourceType] = (this.collectedResources[resourceType] || 0) + col.value
      const color = RESOURCE_DROP_CONFIG[resourceType]?.color || '#888'
      this.gameState.score += col.value * 5
      this.createCollectParticles(col.x + col.width / 2, col.y + col.height / 2, color)
    }
  }

  private checkAchievementsProgress(): void {
    const prevUnlocked = this.achievements.filter(a => a.unlocked).map(a => a.id)
    this.achievements = checkAchievements(this.gameState, this.achievements)
    const newUnlocked = this.achievements.filter(a => a.unlocked && !prevUnlocked.includes(a.id))
    
    newUnlocked.forEach(achievement => {
      if (this.onAchievementUnlock) {
        this.onAchievementUnlock(achievement)
      }
    })
  }

  private gameOver(): void {
    if (this.extraLives > 0) {
      this.extraLives--
      this.player.isInvincible = true
      this.player.invincibleTimer = BASE_INVINCIBLE_DURATION + (this.buffs['invincible_duration'] || 0)
      this.createCollectParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#FF69B4')
      return
    }

    this.gameState.isGameOver = true
    this.gameState.isRunning = false

    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = Math.floor(this.gameState.score)
      this.saveHighScore(this.gameState.highScore)
    }

    addRunExpToPet(Math.floor(this.gameState.score))

    if (this.onGameOverCallback) {
      this.onGameOverCallback(
        Math.floor(this.gameState.score),
        this.gameState.coins,
        Math.floor(this.gameState.distance),
        { ...this.collectedResources }
      )
    }
  }

  private render(): void {
    this.renderer.clear(this.currentTheme ? THEMES[this.currentTheme] : null)
    this.renderer.drawSun(this.currentTheme ? THEMES[this.currentTheme].sunColor : null)
    this.renderer.drawClouds(this.clouds, this.currentTheme ? THEMES[this.currentTheme].cloudColor : null)
    this.renderer.drawMountains(this.groundOffset, this.currentTheme ? THEMES[this.currentTheme].mountainColor : null)
    this.renderer.drawBackgroundTrees(this.groundOffset, this.currentTheme ? {
      treeColor: THEMES[this.currentTheme].treeColor,
      trunkColor: THEMES[this.currentTheme].trunkColor
    } : null)
    this.renderer.drawGround(this.groundOffset, this.currentTheme ? {
      groundLight: THEMES[this.currentTheme].groundColor[0],
      groundDark: THEMES[this.currentTheme].groundColor[1]
    } : null)
    this.renderer.drawObstacles(this.obstacles, this.currentTheme ? {
      treeColor: THEMES[this.currentTheme].treeColor,
      trunkColor: THEMES[this.currentTheme].trunkColor
    } : null)
    this.renderer.drawCollectibles(this.collectibles)
    this.renderer.drawPlayer(this.player)
    if (this.followPet) {
      const petInfo = getEquippedPetInfo()
      this.renderer.drawFollowPet(this.followPet, petInfo)
    }
    this.renderer.drawParticles(this.particles)
    this.renderer.drawUI(
      this.gameState.score,
      this.gameState.coins,
      this.gameState.distance,
      this.currentArea?.targetDistance
    )
  }

  private gameLoop = (timestamp: number): void => {
    const deltaTime = this.lastTime ? timestamp - this.lastTime : 16.67
    this.lastTime = timestamp

    this.update(deltaTime)
    this.render()

    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  start(): void {
    if (this.gameState.isRunning) return
    
    this.applyBuffs()
    this.setupChapterContext()
    this.reset()
    this.skinColors = getEquippedSkinColors()
    this.renderer.setSkinColors(this.skinColors)
    this.gameState.isRunning = true
    this.gameState.isGameOver = false
    this.lastTime = 0
    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  reset(): void {
    this.player = this.createPlayer()
    this.followPet = this.createFollowPet()
    this.obstacles = []
    this.collectibles = []
    this.particles = []
    this.groundOffset = 0
    this.obstacleTimer = OBSTACLE_MIN_INTERVAL * 0.5
    this.collectibleTimer = 15
    this.cloudTimer = 0
    this.collectedResources = {}
    this.gameState = this.createInitialState()
    this.achievements = loadAchievements()
    
    this.spawnInitialContent()
  }

  private createFollowPet(): FollowPet | null {
    const petInfo = getEquippedPetInfo()
    if (!petInfo) return null

    const groundY = this.height * 0.75
    return {
      petId: petInfo.id,
      x: this.player.x - 60,
      y: groundY - 45,
      width: 40,
      height: 40,
      animFrame: 0,
      animTimer: 0,
      floatOffset: 0,
      targetX: this.player.x - 60,
      targetY: groundY - 45
    }
  }

  private setupChapterContext(): void {
    const area = getCurrentArea()
    if (area) {
      this.currentArea = area
      this.currentTheme = area.theme
      this.obstacleDensity = area.obstacleDensity
      this.collectibleDensity = area.collectibleDensity
    } else {
      this.currentArea = null
      this.currentTheme = null
      this.obstacleDensity = 1.0
      this.collectibleDensity = 1.0
    }
  }

  setTheme(theme: ChapterTheme | null): void {
    this.currentTheme = theme
  }

  setAreaContext(area: AreaNode | null): void {
    this.currentArea = area
    this.currentTheme = area?.theme || null
    this.obstacleDensity = area?.obstacleDensity || 1.0
    this.collectibleDensity = area?.collectibleDensity || 1.0
  }

  private spawnInitialContent(): void {
    const groundY = this.height * 0.75
    
    for (let i = 0; i < INITIAL_COLLECTIBLE_COUNT; i++) {
      const x = this.width + INITIAL_CLEAR_DISTANCE + i * 120
      const y = randomRange(groundY - 140, groundY - 50)
      const types: Collectible['type'][] = ['coin', 'coin', 'coin', 'coin', 'coin', 'star', 'potion']
      const type = types[randomInt(0, types.length - 1)]
      
      this.collectibles.push({
        type,
        x,
        y,
        width: type === 'coin' ? 30 : 35,
        height: type === 'coin' ? 30 : 35,
        speed: this.gameState.speed,
        active: true,
        value: type === 'coin' ? 1 : type === 'star' ? 10 : 0,
        collected: false
      })
    }
    
    for (let i = 0; i < INITIAL_OBSTACLE_COUNT; i++) {
      const x = this.width + OBSTACLE_SPAWN_START_DISTANCE + i * randomRange(250, 400)
      this.spawnObstacleAt(x)
    }
  }

  private spawnObstacleAt(x: number): void {
    const type = this.currentTheme
      ? selectThemedObstacleType(this.currentTheme)
      : (['tree', 'rock', 'mushroom', 'log'] as Obstacle['type'][])[randomInt(0, 3)]
    
    const sizeConfig = DEFAULT_OBSTACLE_SIZES[type]
    const themePool = this.currentTheme ? THEMES[this.currentTheme].obstaclePool : null
    
    let width: number
    let height: number

    if (themePool) {
      width = randomRange(themePool.sizeRange.width[0], themePool.sizeRange.width[1])
      height = randomRange(themePool.sizeRange.height[0], themePool.sizeRange.height[1])
    } else {
      width = randomRange(sizeConfig.width[0], sizeConfig.width[1])
      height = randomRange(sizeConfig.height[0], sizeConfig.height[1])
    }

    const groundY = this.height * 0.75
    this.obstacles.push({
      type,
      x,
      y: groundY - height,
      width,
      height,
      speed: this.gameState.speed,
      active: true
    })
  }

  pause(): void {
    this.gameState.isPaused = true
  }

  resume(): void {
    this.gameState.isPaused = false
  }

  stop(): void {
    cancelAnimationFrame(this.animationId)
    this.gameState.isRunning = false
  }

  getState(): GameState {
    return { ...this.gameState }
  }

  getAchievements(): Achievement[] {
    return [...this.achievements]
  }

  onGameOver(callback: (
    score: number,
    coins: number,
    distance: number,
    resources: Partial<Record<ResourceType, number>>
  ) => void): void {
    this.onGameOverCallback = callback
  }

  onAchievement(callback: (achievement: Achievement) => void): void {
    this.onAchievementUnlock = callback
  }

  getHighScore(): number {
    return this.gameState.highScore
  }
}
