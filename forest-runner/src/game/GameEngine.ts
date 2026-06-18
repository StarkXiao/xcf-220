import type { Player, Obstacle, Collectible, Cloud, Particle, GameState } from './types'
import { GameRenderer } from './renderer'
import { checkCollision, randomRange, randomInt } from './utils'
import { checkAchievements, loadAchievements } from './achievements'
import type { Achievement } from './types'

const GRAVITY = 0.6
const JUMP_FORCE = -14
const DOUBLE_JUMP_FORCE = -12
const PLAYER_WIDTH = 50
const PLAYER_HEIGHT = 70
const BASE_SPEED = 6
const MAX_SPEED = 14
const SPEED_INCREMENT = 0.003
const HIGH_SCORE_KEY = 'forest-runner-highscore'

const OBSTACLE_MIN_INTERVAL = 45
const OBSTACLE_MAX_INTERVAL = 90
const COLLECTIBLE_INTERVAL = 35
const INITIAL_OBSTACLE_COUNT = 3
const INITIAL_COLLECTIBLE_COUNT = 8
const OBSTACLE_SPAWN_START_DISTANCE = 900
const INITIAL_CLEAR_DISTANCE = 200

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private renderer: GameRenderer
  private width: number = 0
  private height: number = 0

  private player: Player
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

  private onGameOverCallback?: (score: number, coins: number, distance: number) => void
  private onAchievementUnlock?: (achievement: Achievement) => void

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
    return {
      score: 0,
      coins: 0,
      distance: 0,
      highScore,
      isRunning: false,
      isGameOver: false,
      isPaused: false,
      speed: BASE_SPEED,
      baseSpeed: BASE_SPEED,
      maxSpeed: MAX_SPEED
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

    if (this.player.jumpCount === 0) {
      this.player.velocityY = JUMP_FORCE
      this.player.isJumping = true
      this.player.jumpCount = 1
      this.createJumpParticles()
    } else if (this.player.jumpCount === 1) {
      this.player.velocityY = DOUBLE_JUMP_FORCE
      this.player.isDoubleJumping = true
      this.player.jumpCount = 2
      this.createJumpParticles()
    }
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
    const types: Obstacle['type'][] = ['tree', 'rock', 'mushroom', 'log']
    const type = types[randomInt(0, types.length - 1)]
    
    let width: number
    let height: number

    switch (type) {
      case 'tree':
        width = randomRange(40, 60)
        height = randomRange(70, 100)
        break
      case 'rock':
        width = randomRange(50, 70)
        height = randomRange(35, 50)
        break
      case 'mushroom':
        width = randomRange(35, 50)
        height = randomRange(45, 60)
        break
      case 'log':
        width = randomRange(60, 80)
        height = randomRange(25, 40)
        break
      default:
        width = 50
        height = 50
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
    const types: Collectible['type'][] = ['coin', 'coin', 'coin', 'star', 'potion']
    const type = types[randomInt(0, types.length - 1)]
    
    let value: number
    let size: number

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

    this.gameState.distance += this.gameState.speed * 0.1 * dt
    this.gameState.score += this.gameState.speed * 0.2 * dt

    this.updatePlayer(dt)
    this.updateObstacles(dt)
    this.updateCollectibles(dt)
    this.updateClouds(dt)
    this.updateParticles(dt)

    this.groundOffset += this.gameState.speed * dt

    this.obstacleTimer += dt
    const speedFactor = BASE_SPEED / this.gameState.speed
    const minInterval = OBSTACLE_MIN_INTERVAL * speedFactor
    const maxInterval = OBSTACLE_MAX_INTERVAL * speedFactor
    const obstacleInterval = randomRange(minInterval, maxInterval)
    
    if (this.obstacleTimer > obstacleInterval) {
      this.spawnObstacle()
      this.obstacleTimer = 0
    }

    this.collectibleTimer += dt
    if (this.collectibleTimer > COLLECTIBLE_INTERVAL) {
      if (Math.random() < 0.85) {
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
    if (col.type === 'coin') {
      this.gameState.coins += col.value
      this.gameState.score += col.value * 10
      this.createCollectParticles(col.x + col.width / 2, col.y + col.height / 2, '#FFD700')
    } else if (col.type === 'star') {
      this.gameState.coins += col.value
      this.gameState.score += col.value * 20
      this.createCollectParticles(col.x + col.width / 2, col.y + col.height / 2, '#FFFF00')
    } else if (col.type === 'potion') {
      this.player.isInvincible = true
      this.player.invincibleTimer = 180
      this.createCollectParticles(col.x + col.width / 2, col.y + col.height / 2, '#9932CC')
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
    this.gameState.isGameOver = true
    this.gameState.isRunning = false

    if (this.gameState.score > this.gameState.highScore) {
      this.gameState.highScore = Math.floor(this.gameState.score)
      this.saveHighScore(this.gameState.highScore)
    }

    if (this.onGameOverCallback) {
      this.onGameOverCallback(
        Math.floor(this.gameState.score),
        this.gameState.coins,
        Math.floor(this.gameState.distance)
      )
    }
  }

  private render(): void {
    this.renderer.clear()
    this.renderer.drawSun()
    this.renderer.drawClouds(this.clouds)
    this.renderer.drawMountains(this.groundOffset)
    this.renderer.drawBackgroundTrees(this.groundOffset)
    this.renderer.drawGround(this.groundOffset)
    this.renderer.drawObstacles(this.obstacles)
    this.renderer.drawCollectibles(this.collectibles)
    this.renderer.drawPlayer(this.player)
    this.renderer.drawParticles(this.particles)
    this.renderer.drawUI(this.gameState.score, this.gameState.coins, this.gameState.distance)
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
    
    this.reset()
    this.gameState.isRunning = true
    this.gameState.isGameOver = false
    this.lastTime = 0
    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  reset(): void {
    this.player = this.createPlayer()
    this.obstacles = []
    this.collectibles = []
    this.particles = []
    this.groundOffset = 0
    this.obstacleTimer = OBSTACLE_MIN_INTERVAL * 0.5
    this.collectibleTimer = 15
    this.cloudTimer = 0
    this.gameState = this.createInitialState()
    this.achievements = loadAchievements()
    
    this.spawnInitialContent()
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
    const types: Obstacle['type'][] = ['tree', 'rock', 'mushroom', 'log']
    const type = types[randomInt(0, types.length - 1)]
    
    let width: number
    let height: number

    switch (type) {
      case 'tree':
        width = randomRange(40, 60)
        height = randomRange(70, 100)
        break
      case 'rock':
        width = randomRange(50, 70)
        height = randomRange(35, 50)
        break
      case 'mushroom':
        width = randomRange(35, 50)
        height = randomRange(45, 60)
        break
      case 'log':
        width = randomRange(60, 80)
        height = randomRange(25, 40)
        break
      default:
        width = 50
        height = 50
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

  onGameOver(callback: (score: number, coins: number, distance: number) => void): void {
    this.onGameOverCallback = callback
  }

  onAchievement(callback: (achievement: Achievement) => void): void {
    this.onAchievementUnlock = callback
  }

  getHighScore(): number {
    return this.gameState.highScore
  }
}
