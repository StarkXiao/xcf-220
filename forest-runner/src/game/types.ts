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

export type ResourceType = 'wood' | 'stone' | 'herb' | 'crystal' | 'berry'
export type ProcessedResourceType = 'plank' | 'brick' | 'potion_herb' | 'magic_dust' | 'jam'

export type AllResourceType = ResourceType | ProcessedResourceType | 'coin'

export interface Collectible extends GameObject {
  type: 'coin' | 'star' | 'potion' | ResourceType
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

export interface ResourceInfo {
  id: AllResourceType
  name: string
  icon: string
  description: string
}

export interface Inventory {
  resources: Record<AllResourceType, number>
}

export type BuildingType = 'lumber_mill' | 'quarry' | 'herb_garden' | 'magic_tower' | 'warehouse' | 'kitchen' | 'workshop'

export interface BuildingLevel {
  level: number
  cost: Partial<Record<AllResourceType, number>>
  bonus: BuffEffect
}

export interface Building {
  id: BuildingType
  name: string
  icon: string
  description: string
  maxLevel: number
  currentLevel: number
  levels: BuildingLevel[]
}

export interface ProcessingRecipe {
  id: string
  name: string
  inputs: Partial<Record<ResourceType, number>>
  output: ProcessedResourceType
  outputAmount: number
  time: number
  unlocked: boolean
  requiredBuilding?: BuildingType
  requiredLevel?: number
}

export interface ProcessingTask {
  recipeId: string
  startTime: number
  duration: number
  completed: boolean
  claimed: boolean
}

export type BuffType = 'jump_boost' | 'speed_boost' | 'coin_multiplier' | 'extra_life' | 'invincible_duration' | 'magnet_range' | 'resource_boost'

export interface BuffEffect {
  type: BuffType
  value: number
  description: string
}

export interface ActiveBuff {
  type: BuffType
  value: number
  source: string
}

export interface CampState {
  inventory: Inventory
  buildings: Building[]
  processingTasks: ProcessingTask[]
  unlockedRecipes: string[]
  lastRunRewards: {
    coins: number
    resources: Partial<Record<ResourceType, number>>
  } | null
}

export type GameScreen = 'home' | 'game' | 'gameover' | 'achievements' | 'camp'
