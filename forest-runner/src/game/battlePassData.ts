import type { BattlePassSeason, DailyTask, BattlePassReward, Skin, DailyTaskType } from './types'

export const CURRENT_SEASON_ID = 'season-1-forest'

export const SEASONS: BattlePassSeason[] = [
  {
    id: 'season-1-forest',
    name: '森林奇遇赛季',
    description: '踏入神秘森林，开启全新冒险旅程！完成每日任务，解锁珍稀皮肤与丰厚奖励。',
    icon: '🌲',
    theme: 'forest',
    startDate: Date.now() - 86400000 * 7,
    endDate: Date.now() + 86400000 * 60,
    maxLevel: 50,
    pointsPerLevel: 100,
    premiumPrice: 680
  }
]

export function getCurrentSeason(): BattlePassSeason {
  return SEASONS.find(s => s.id === CURRENT_SEASON_ID) || SEASONS[0]
}

const DAILY_TASK_TEMPLATES: Array<Omit<DailyTask, 'progress' | 'completed' | 'claimed'>> = [
  {
    id: 'daily_run_1000',
    type: 'run_distance',
    name: '森林漫步',
    description: '累计奔跑1000米',
    icon: '🏃',
    target: 1000,
    rewardPoints: 30
  },
  {
    id: 'daily_run_3000',
    type: 'run_distance',
    name: '远足达人',
    description: '累计奔跑3000米',
    icon: '🥾',
    target: 3000,
    rewardPoints: 60
  },
  {
    id: 'daily_coins_50',
    type: 'collect_coins',
    name: '淘金者',
    description: '单局收集50枚金币',
    icon: '💰',
    target: 50,
    rewardPoints: 25
  },
  {
    id: 'daily_coins_100',
    type: 'collect_coins',
    name: '金币大师',
    description: '累计收集100枚金币',
    icon: '👑',
    target: 100,
    rewardPoints: 50
  },
  {
    id: 'daily_stars_3',
    type: 'collect_stars',
    name: '星光璀璨',
    description: '累计收集3颗星星',
    icon: '⭐',
    target: 3,
    rewardPoints: 40
  },
  {
    id: 'daily_play_3',
    type: 'play_games',
    name: '每日打卡',
    description: '完成3局游戏',
    icon: '🎮',
    target: 3,
    rewardPoints: 35
  },
  {
    id: 'daily_play_5',
    type: 'play_games',
    name: '游戏狂人',
    description: '完成5局游戏',
    icon: '🔥',
    target: 5,
    rewardPoints: 55
  },
  {
    id: 'daily_jump_50',
    type: 'jump_count',
    name: '跳跃高手',
    description: '累计跳跃50次',
    icon: '🦘',
    target: 50,
    rewardPoints: 30
  },
  {
    id: 'daily_chapter_1',
    type: 'complete_chapter',
    name: '章节探索',
    description: '完成1次章节冒险',
    icon: '🗺️',
    target: 1,
    rewardPoints: 45
  }
]

export function generateDailyTasks(): DailyTask[] {
  const shuffled = [...DAILY_TASK_TEMPLATES].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, 4)
  return selected.map(t => ({
    ...t,
    id: `${t.id}_${Date.now()}`,
    progress: 0,
    completed: false,
    claimed: false
  }))
}

export function getPointsForLevel(level: number): number {
  const season = getCurrentSeason()
  return level * season.pointsPerLevel
}

export function getLevelFromPoints(points: number): number {
  const season = getCurrentSeason()
  const level = Math.floor(points / season.pointsPerLevel)
  return Math.min(level, season.maxLevel)
}

export function getProgressToNextLevel(points: number): { current: number; needed: number; percent: number } {
  const season = getCurrentSeason()
  const currentLevel = getLevelFromPoints(points)
  if (currentLevel >= season.maxLevel) {
    return { current: season.pointsPerLevel, needed: season.pointsPerLevel, percent: 100 }
  }
  const current = points - currentLevel * season.pointsPerLevel
  const needed = season.pointsPerLevel
  return { current, needed, percent: Math.floor((current / needed) * 100) }
}

export const BATTLE_PASS_REWARDS: BattlePassReward[] = [
  { id: 'free-l1-coin', level: 1, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 100 },
  { id: 'prem-l1-coin', level: 1, isPremium: true, type: 'coin', name: '金币', icon: '💰', amount: 200 },
  { id: 'free-l2-wood', level: 2, isPremium: false, type: 'resource', name: '木材', icon: '🪵', amount: 20, resourceType: 'wood' },
  { id: 'prem-l2-stone', level: 2, isPremium: true, type: 'resource', name: '石材', icon: '🪨', amount: 15, resourceType: 'stone' },
  { id: 'free-l3-coin', level: 3, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 150 },
  { id: 'prem-l3-skin-green', level: 3, isPremium: true, type: 'skin', name: '翠林精灵皮肤', icon: '🧝', skinId: 'skin-forest-elf' },
  { id: 'free-l4-herb', level: 4, isPremium: false, type: 'resource', name: '草药', icon: '🌿', amount: 10, resourceType: 'herb' },
  { id: 'prem-l4-herb', level: 4, isPremium: true, type: 'resource', name: '草药', icon: '🌿', amount: 25, resourceType: 'herb' },
  { id: 'free-l5-coin', level: 5, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 200 },
  { id: 'prem-l5-title', level: 5, isPremium: true, type: 'title', name: '森林守护者称号', icon: '🛡️', title: '森林守护者' },
  { id: 'free-l6-berry', level: 6, isPremium: false, type: 'resource', name: '浆果', icon: '🫐', amount: 15, resourceType: 'berry' },
  { id: 'prem-l6-crystal', level: 6, isPremium: true, type: 'resource', name: '水晶', icon: '💎', amount: 5, resourceType: 'crystal' },
  { id: 'free-l7-coin', level: 7, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 250 },
  { id: 'prem-l7-coin', level: 7, isPremium: true, type: 'coin', name: '金币', icon: '💰', amount: 500 },
  { id: 'free-l8-skin', level: 8, isPremium: false, type: 'skin', name: '松果旅人皮肤', icon: '🌰', skinId: 'skin-pine-traveler' },
  { id: 'prem-l8-egg', level: 8, isPremium: true, type: 'pet_egg', name: '稀有宠物蛋', icon: '🥚', petEggId: 'egg-rare' },
  { id: 'free-l9-stone', level: 9, isPremium: false, type: 'resource', name: '石材', icon: '🪨', amount: 25, resourceType: 'stone' },
  { id: 'prem-l9-wood', level: 9, isPremium: true, type: 'resource', name: '木材', icon: '🪵', amount: 50, resourceType: 'wood' },
  { id: 'free-l10-coin', level: 10, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 300 },
  { id: 'prem-l10-skin', level: 10, isPremium: true, type: 'skin', name: '极光狐狸皮肤', icon: '🦊', skinId: 'skin-aurora-fox' },
  { id: 'free-l12-coin', level: 12, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 350 },
  { id: 'prem-l12-crystal', level: 12, isPremium: true, type: 'resource', name: '水晶', icon: '💎', amount: 10, resourceType: 'crystal' },
  { id: 'free-l15-coin', level: 15, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 500 },
  { id: 'prem-l15-skin', level: 15, isPremium: true, type: 'skin', name: '熔岩勇士皮肤', icon: '🔥', skinId: 'skin-lava-warrior' },
  { id: 'free-l18-resource', level: 18, isPremium: false, type: 'resource', name: '魔法粉尘', icon: '✨', amount: 10, resourceType: 'magic_dust' },
  { id: 'prem-l18-egg', level: 18, isPremium: true, type: 'pet_egg', name: '史诗宠物蛋', icon: '🥚', petEggId: 'egg-epic' },
  { id: 'free-l20-coin', level: 20, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 800 },
  { id: 'prem-l20-skin', level: 20, isPremium: true, type: 'skin', name: '深海王子皮肤', icon: '🧜', skinId: 'skin-ocean-prince' },
  { id: 'free-l25-coin', level: 25, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 1000 },
  { id: 'prem-l25-title', level: 25, isPremium: true, type: 'title', name: '传奇冒险家称号', icon: '🏆', title: '传奇冒险家' },
  { id: 'free-l30-skin', level: 30, isPremium: false, type: 'skin', name: '星空游侠皮肤', icon: '🌌', skinId: 'skin-star-ranger' },
  { id: 'prem-l30-skin', level: 30, isPremium: true, type: 'skin', name: '雷霆之翼皮肤', icon: '⚡', skinId: 'skin-thunder-wings' },
  { id: 'free-l35-coin', level: 35, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 1500 },
  { id: 'prem-l35-egg', level: 35, isPremium: true, type: 'pet_egg', name: '传说宠物蛋', icon: '🥚', petEggId: 'egg-legendary' },
  { id: 'free-l40-coin', level: 40, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 2000 },
  { id: 'prem-l40-skin', level: 40, isPremium: true, type: 'skin', name: '冰霜女王皮肤', icon: '❄️', skinId: 'skin-frost-queen' },
  { id: 'free-l45-resource', level: 45, isPremium: false, type: 'resource', name: '全资源大礼包', icon: '🎁', amount: 50, resourceType: 'crystal' },
  { id: 'prem-l45-coin', level: 45, isPremium: true, type: 'coin', name: '金币', icon: '💰', amount: 5000 },
  { id: 'free-l50-coin', level: 50, isPremium: false, type: 'coin', name: '金币', icon: '💰', amount: 3000 },
  { id: 'prem-l50-skin', level: 50, isPremium: true, type: 'skin', name: '森林之王皮肤', icon: '👑', skinId: 'skin-forest-king' }
]

export function getRewardsForLevel(level: number): BattlePassReward[] {
  return BATTLE_PASS_REWARDS.filter(r => r.level === level)
}

export function getRewardsUpToLevel(maxLevel: number): BattlePassReward[] {
  return BATTLE_PASS_REWARDS.filter(r => r.level <= maxLevel)
}

export const SKINS: Skin[] = [
  {
    id: 'skin-default',
    name: '经典小红帽',
    description: '初始的小红帽皮肤，经典冒险造型。',
    icon: '👧',
    rarity: 'common',
    colors: { body: '#FF6B6B', head: '#FFE4C4', hat: '#FFE66D', accent: '#FFFFFF', skin: '#FFE4C4', shoes: '#8B4513' },
    unlocked: true,
    unlockCondition: '初始拥有',
    isEquipped: true
  },
  {
    id: 'skin-forest-elf',
    name: '翠林精灵',
    description: '来自翡翠森林的神秘精灵，与自然融为一体。',
    icon: '🧝',
    rarity: 'rare',
    colors: { body: '#4CAF50', head: '#C8E6C9', hat: '#2E7D32', accent: '#81C784', skin: '#FFECB3', shoes: '#1B5E20' },
    unlocked: false,
    unlockCondition: '赛季通行证3级（高级）',
    isEquipped: false
  },
  {
    id: 'skin-pine-traveler',
    name: '松果旅人',
    description: '身穿松果色外衣的勇敢旅人，不畏艰险。',
    icon: '🌰',
    rarity: 'common',
    colors: { body: '#8D6E63', head: '#BCAAA4', hat: '#5D4037', accent: '#A1887F', skin: '#FFE0B2', shoes: '#3E2723' },
    unlocked: false,
    unlockCondition: '赛季通行证8级（免费）',
    isEquipped: false
  },
  {
    id: 'skin-aurora-fox',
    name: '极光狐狸',
    description: '身披极光般绚烂毛发的神秘狐狸造型。',
    icon: '🦊',
    rarity: 'epic',
    colors: { body: '#7B1FA2', head: '#CE93D8', hat: '#4A148C', accent: '#E1BEE7', skin: '#F8BBD0', shoes: '#6A1B9A' },
    unlocked: false,
    unlockCondition: '赛季通行证10级（高级）',
    isEquipped: false
  },
  {
    id: 'skin-lava-warrior',
    name: '熔岩勇士',
    description: '来自火山深处的勇士，浑身燃烧着斗志。',
    icon: '🔥',
    rarity: 'epic',
    colors: { body: '#E64A19', head: '#FFAB91', hat: '#BF360C', accent: '#FF7043', skin: '#FFCCBC', shoes: '#BF360C' },
    unlocked: false,
    unlockCondition: '赛季通行证15级（高级）',
    isEquipped: false
  },
  {
    id: 'skin-ocean-prince',
    name: '深海王子',
    description: '深海王国的王子，带着海洋的神秘力量。',
    icon: '🧜',
    rarity: 'epic',
    colors: { body: '#0288D1', head: '#B3E5FC', hat: '#01579B', accent: '#4FC3F7', skin: '#B2EBF2', shoes: '#01579B' },
    unlocked: false,
    unlockCondition: '赛季通行证20级（高级）',
    isEquipped: false
  },
  {
    id: 'skin-star-ranger',
    name: '星空游侠',
    description: '穿越星空的神秘游侠，披风闪烁着星光。',
    icon: '🌌',
    rarity: 'rare',
    colors: { body: '#283593', head: '#C5CAE9', hat: '#1A237E', accent: '#7986CB', skin: '#E8EAF6', shoes: '#303F9F' },
    unlocked: false,
    unlockCondition: '赛季通行证30级（免费）',
    isEquipped: false
  },
  {
    id: 'skin-thunder-wings',
    name: '雷霆之翼',
    description: '身披雷电之力的传奇战士，速度惊人。',
    icon: '⚡',
    rarity: 'legendary',
    colors: { body: '#FBC02D', head: '#FFF9C4', hat: '#F57F17', accent: '#FFEB3B', skin: '#FFF59D', shoes: '#F57F17' },
    unlocked: false,
    unlockCondition: '赛季通行证30级（高级）',
    isEquipped: false
  },
  {
    id: 'skin-frost-queen',
    name: '冰霜女王',
    description: '冰雪王国的统治者，优雅而强大。',
    icon: '❄️',
    rarity: 'legendary',
    colors: { body: '#00ACC1', head: '#B2EBF2', hat: '#006064', accent: '#80DEEA', skin: '#E0F7FA', shoes: '#00838F' },
    unlocked: false,
    unlockCondition: '赛季通行证40级（高级）',
    isEquipped: false
  },
  {
    id: 'skin-forest-king',
    name: '森林之王',
    description: '森林的传奇主宰，拥有大自然的全部力量。',
    icon: '👑',
    rarity: 'legendary',
    colors: { body: '#FFD700', head: '#FFF8DC', hat: '#B8860B', accent: '#FFA500', skin: '#FFECB3', shoes: '#8B4513' },
    unlocked: false,
    unlockCondition: '赛季通行证50级（高级）',
    isEquipped: false
  }
]

export function getSkinById(skinId: string): Skin | null {
  return SKINS.find(s => s.id === skinId) || null
}

export function getSkinsByRarity(rarity: Skin['rarity']): Skin[] {
  return SKINS.filter(s => s.rarity === rarity)
}

export function getDailyTaskTypeLabel(type: DailyTaskType): string {
  const labels: Record<DailyTaskType, string> = {
    run_distance: '奔跑距离',
    collect_coins: '收集金币',
    collect_stars: '收集星星',
    complete_chapter: '完成章节',
    play_games: '游戏局数',
    jump_count: '跳跃次数'
  }
  return labels[type]
}

export function getRarityColor(rarity: Skin['rarity']): string {
  const colors: Record<Skin['rarity'], string> = {
    common: '#9E9E9E',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FF9800'
  }
  return colors[rarity]
}

export function getRarityLabel(rarity: Skin['rarity']): string {
  const labels: Record<Skin['rarity'], string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return labels[rarity]
}
