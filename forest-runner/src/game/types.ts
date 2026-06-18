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

export type GameScreen = 'home' | 'game' | 'gameover' | 'achievements' | 'camp' | 'map' | 'chapterSettlement'

export type ChapterTheme = 'forest' | 'desert' | 'snow' | 'volcano' | 'ocean' | 'sky'

export interface ObstaclePoolConfig {
  types: Obstacle['type'][]
  weights: number[]
  sizeRange: {
    width: [number, number]
    height: [number, number]
  }
  spawnRateMultiplier: number
}

export interface ThemeConfig {
  name: string
  icon: string
  skyGradient: [string, string]
  groundColor: [string, string]
  mountainColor: string
  treeColor: string
  trunkColor: string
  sunColor: string
  cloudColor: string
  obstaclePool: ObstaclePoolConfig
  resourceWeights: Partial<Record<ResourceType, number>>
  baseSpeed: number
  maxSpeed: number
}

export interface AreaNode {
  id: string
  name: string
  icon: string
  description: string
  position: { x: number; y: number }
  unlocked: boolean
  completed: boolean
  stars: number
  maxStars: number
  requiredScore: number
  requiredDistance: number
  rewards: {
    coins: number
    resources: Partial<Record<AllResourceType, number>>
    achievements?: string[]
  }
  theme: ChapterTheme
  difficulty: 1 | 2 | 3 | 4 | 5
  obstacleDensity: number
  collectibleDensity: number
  targetDistance: number
}

export interface Chapter {
  id: string
  name: string
  description: string
  icon: string
  order: number
  unlocked: boolean
  completed: boolean
  areas: AreaNode[]
  backgroundTheme: ChapterTheme
  unlockedCondition?: {
    previousChapterId?: string
    previousAreaId?: string
    requiredStars?: number
    requiredAchievements?: string[]
  }
  bonusRewards: {
    coins: number
    resources: Partial<Record<AllResourceType, number>>
  }
}

export interface ChapterRunResult {
  chapterId: string
  areaId: string
  score: number
  coins: number
  distance: number
  resources: Partial<Record<ResourceType, number>>
  starsEarned: number
  newAchievements: string[]
  isNewRecord: boolean
}

export interface ChapterState {
  currentChapterId: string | null
  currentAreaId: string | null
  chapters: Chapter[]
  totalStars: number
  lastRunResult: ChapterRunResult | null
  bonusClaimed: Record<string, boolean>
}

export interface ExtendedGameState extends GameState {
  chapterId?: string
  areaId?: string
  theme?: ChapterTheme
  targetDistance?: number
}

export type PetRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type PetSkillType = 'coin_bonus' | 'resource_bonus' | 'magnet' | 'shield' | 'speed_aura' | 'score_multiplier'

export interface PetSkill {
  type: PetSkillType
  value: number
  description: string
}

export interface Pet {
  id: string
  name: string
  icon: string
  description: string
  rarity: PetRarity
  skills: PetSkill[]
  color: string
  secondaryColor: string
  unlockCondition: string
}

export interface PetInstance {
  petId: string
  level: number
  exp: number
  equipped: boolean
  unlockedAt: number
}

export interface PetEgg {
  id: string
  name: string
  icon: string
  rarity: PetRarity
  possiblePets: string[]
  hatchTime: number
  cost: Partial<Record<AllResourceType, number>>
}

export interface HatchingEgg {
  eggId: string
  startTime: number
  duration: number
  completed: boolean
  claimed: boolean
}

export interface PetCollectionEntry {
  petId: string
  unlocked: boolean
  firstUnlockedAt?: number
  totalExp: number
}

export interface PetState {
  pets: PetInstance[]
  eggs: PetEgg[]
  hatchingEggs: HatchingEgg[]
  collection: Record<string, PetCollectionEntry>
  equippedPetId: string | null
  lastHatchedPetId: string | null
}

export interface FollowPet extends Position, Size {
  petId: string
  animFrame: number
  animTimer: number
  floatOffset: number
  targetX: number
  targetY: number
}

export interface PetRunContribution {
  petId: string
  petName: string
  petIcon: string
  bonusCoins: number
  bonusResources: Partial<Record<ResourceType, number>>
  bonusScore: number
  skillsActivated: string[]
}

export type DailyTaskType = 'run_distance' | 'collect_coins' | 'collect_stars' | 'complete_chapter' | 'play_games' | 'jump_count'

export interface DailyTask {
  id: string
  type: DailyTaskType
  name: string
  description: string
  icon: string
  target: number
  rewardPoints: number
  progress: number
  completed: boolean
  claimed: boolean
}

export type RewardType = 'coin' | 'resource' | 'skin' | 'pet_egg' | 'title' | 'emote'

export interface BattlePassReward {
  id: string
  level: number
  isPremium: boolean
  type: RewardType
  name: string
  icon: string
  amount?: number
  resourceType?: AllResourceType
  skinId?: string
  petEggId?: string
  title?: string
}

export interface SkinColorConfig {
  body: string
  head: string
  hat: string
  accent: string
  skin: string
  shoes: string
}

export interface Skin {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  colors: SkinColorConfig
  unlocked: boolean
  unlockCondition: string
  isEquipped: boolean
}

export interface BattlePassSeason {
  id: string
  name: string
  description: string
  icon: string
  theme: string
  startDate: number
  endDate: number
  maxLevel: number
  pointsPerLevel: number
  premiumPrice: number
}

export interface BattlePassState {
  currentSeasonId: string
  points: number
  level: number
  premiumUnlocked: boolean
  claimedFreeRewards: string[]
  claimedPremiumRewards: string[]
  dailyTasks: DailyTask[]
  lastDailyReset: number
  totalPointsEarned: number
  gamesPlayed: number
  totalDistance: number
  totalCoins: number
  totalStars: number
  totalJumps: number
  unlockedSkins: string[]
  equippedSkinId: string | null
  unlockedTitles: string[]
  equippedTitle: string | null
}

export interface SkinRunStats {
  skinId: string
  runs: number
  totalScore: number
  bestScore: number
  totalDistance: number
}

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type ItemCategory = 'consumable' | 'permanent' | 'limited'
export type ItemEffectType = 
  | 'invincible_start' 
  | 'double_coins' 
  | 'magnet' 
  | 'extra_life' 
  | 'speed_boost_start'
  | 'score_multiplier'
  | 'slow_obstacles'
  | 'coin_magnet_range'
  | 'jump_boost_perm'
  | 'base_speed_perm'
  | 'extra_life_perm'

export interface ShopItemEffect {
  type: ItemEffectType
  value: number
  duration?: number
  description: string
}

export interface ShopItem {
  id: string
  name: string
  icon: string
  description: string
  category: ItemCategory
  rarity: ItemRarity
  basePrice: number
  effects: ShopItemEffect[]
  maxStock: number
  isRefreshable: boolean
  sortOrder: number
}

export interface ShopDiscount {
  itemId: string
  discountPercent: number
  startTime: number
  endTime: number
}

export interface ShopInventoryItem {
  itemId: string
  quantity: number
}

export interface ShopStockItem {
  itemId: string
  currentStock: number
  lastRefreshed: number
}

export interface ShopState {
  inventory: ShopInventoryItem[]
  stock: ShopStockItem[]
  discounts: ShopDiscount[]
  lastShopRefresh: number
  totalSpent: number
  totalPurchased: number
  equippedConsumables: string[]
  activeRunEffects: ShopItemEffect[]
}

export type ShopTabType = 'featured' | 'consumables' | 'permanent' | 'inventory'
