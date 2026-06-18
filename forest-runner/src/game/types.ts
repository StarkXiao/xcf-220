export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface GameObject extends Position, Size {
  type: string
  speed: number
  active: boolean
}

export interface Obstacle extends GameObject {
  type: 'tree' | 'rock' | 'mushroom' | 'log'
}

export interface Collectible extends GameObject {
  type: 'coin' | 'star' | 'potion'
  value: number
  collected: boolean
}

export interface Player extends Position, Size {
  velocityY: number
  isJumping: boolean
  isDoubleJumping: boolean
  jumpCount: number
  animFrame: number
  animTimer: number
  isInvincible: boolean
  invincibleTimer: number
}

export interface Cloud extends Position {
  speed: number
  size: number
}

export interface Particle extends Position {
  velocityX: number
  velocityY: number
  size: number
  color: string
  life: number
  maxLife: number
}

export interface GameState {
  score: number
  coins: number
  distance: number
  highScore: number
  isRunning: boolean
  isGameOver: boolean
  isPaused: boolean
  speed: number
  baseSpeed: number
  maxSpeed: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  icon: string
  condition: (state: GameState) => boolean
}

export type GameScreen = 'home' | 'game' | 'gameover' | 'achievements'
