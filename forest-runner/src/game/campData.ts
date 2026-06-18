import type {
  ResourceInfo,
  Building,
  ProcessingRecipe,
  ResourceType,
  ProcessedResourceType,
  AllResourceType,
  BuffType
} from './types'

export const RESOURCES: Record<AllResourceType, ResourceInfo> = {
  wood: {
    id: 'wood',
    name: '木材',
    icon: '🪵',
    description: '从森林中收集的木材，基础建筑材料'
  },
  stone: {
    id: 'stone',
    name: '石头',
    icon: '🪨',
    description: '坚硬的石块，用于建造坚固建筑'
  },
  herb: {
    id: 'herb',
    name: '草药',
    icon: '🌿',
    description: '神奇的草药，可以制作药水'
  },
  crystal: {
    id: 'crystal',
    name: '魔法水晶',
    icon: '💎',
    description: '蕴含魔力的水晶，稀有资源'
  },
  berry: {
    id: 'berry',
    name: '浆果',
    icon: '🫐',
    description: '美味的森林浆果，可制作果酱'
  },
  plank: {
    id: 'plank',
    name: '木板',
    icon: '🪓',
    description: '加工后的木板，高级建筑材料'
  },
  brick: {
    id: 'brick',
    name: '石砖',
    icon: '🧱',
    description: '精心打磨的石砖，坚固耐用'
  },
  potion_herb: {
    id: 'potion_herb',
    name: '精炼草药',
    icon: '🍵',
    description: '精炼后的草药精华，药效更强'
  },
  magic_dust: {
    id: 'magic_dust',
    name: '魔法粉末',
    icon: '✨',
    description: '水晶研磨的粉末，蕴含强大魔力'
  },
  jam: {
    id: 'jam',
    name: '浆果果酱',
    icon: '🍯',
    description: '美味的果酱，提供额外能量'
  },
  coin: {
    id: 'coin',
    name: '金币',
    icon: '💰',
    description: '通用货币'
  }
}

export const RESOURCE_DROP_CONFIG: Record<ResourceType, {
  weight: number
  value: number
  color: string
}> = {
  wood: { weight: 30, value: 1, color: '#8B4513' },
  stone: { weight: 25, value: 1, color: '#708090' },
  herb: { weight: 20, value: 1, color: '#32CD32' },
  berry: { weight: 15, value: 1, color: '#8B008B' },
  crystal: { weight: 5, value: 1, color: '#00CED1' }
}

function createBuildingLevels(
  baseCost: Partial<Record<AllResourceType, number>>,
  costMultiplier: number,
  bonusType: BuffType,
  baseBonus: number,
  bonusIncrement: number
) {
  const levels = []
  for (let i = 1; i <= 5; i++) {
    const cost: Partial<Record<AllResourceType, number>> = {}
    for (const [key, value] of Object.entries(baseCost)) {
      cost[key as AllResourceType] = Math.floor(value * Math.pow(costMultiplier, i - 1))
    }
    levels.push({
      level: i,
      cost,
      bonus: {
        type: bonusType,
        value: baseBonus + (i - 1) * bonusIncrement,
        description: ''
      }
    })
  }
  return levels
}

export const BUILDINGS: Building[] = [
  {
    id: 'lumber_mill',
    name: '伐木场',
    icon: '🪓',
    description: '提升木材收集效率和跳跃能力',
    maxLevel: 5,
    currentLevel: 0,
    levels: createBuildingLevels(
      { wood: 10, stone: 5 },
      1.8,
      'jump_boost',
      0.05,
      0.03
    )
  },
  {
    id: 'quarry',
    name: '采石场',
    icon: '⛏️',
    description: '提升石头收集效率和基础速度',
    maxLevel: 5,
    currentLevel: 0,
    levels: createBuildingLevels(
      { wood: 15, stone: 10 },
      1.8,
      'speed_boost',
      0.03,
      0.02
    )
  },
  {
    id: 'herb_garden',
    name: '草药园',
    icon: '🌱',
    description: '提升草药收集效率和无敌持续时间',
    maxLevel: 5,
    currentLevel: 0,
    levels: createBuildingLevels(
      { wood: 20, herb: 10 },
      1.8,
      'invincible_duration',
      30,
      15
    )
  },
  {
    id: 'magic_tower',
    name: '魔法塔',
    icon: '🗼',
    description: '提升水晶收集效率和金币倍率',
    maxLevel: 5,
    currentLevel: 0,
    levels: createBuildingLevels(
      { stone: 25, crystal: 5 },
      2.0,
      'coin_multiplier',
      0.1,
      0.1
    )
  },
  {
    id: 'warehouse',
    name: '仓库',
    icon: '🏠',
    description: '提升所有资源收集效率',
    maxLevel: 5,
    currentLevel: 0,
    levels: createBuildingLevels(
      { plank: 5, brick: 5 },
      2.0,
      'resource_boost',
      0.1,
      0.05
    )
  },
  {
    id: 'kitchen',
    name: '厨房',
    icon: '🍳',
    description: '解锁浆果加工，提供额外生命',
    maxLevel: 5,
    currentLevel: 0,
    levels: createBuildingLevels(
      { plank: 8, jam: 3 },
      2.0,
      'extra_life',
      0,
      1
    )
  },
  {
    id: 'workshop',
    name: '工坊',
    icon: '🔨',
    description: '解锁高级加工配方',
    maxLevel: 5,
    currentLevel: 0,
    levels: createBuildingLevels(
      { plank: 10, brick: 10 },
      2.2,
      'magnet_range',
      10,
      5
    )
  }
]

export const RECIPES: ProcessingRecipe[] = [
  {
    id: 'make_plank',
    name: '制作木板',
    inputs: { wood: 3 },
    output: 'plank' as ProcessedResourceType,
    outputAmount: 1,
    time: 5000,
    unlocked: true,
    requiredBuilding: 'lumber_mill',
    requiredLevel: 1
  },
  {
    id: 'make_brick',
    name: '制作石砖',
    inputs: { stone: 3 },
    output: 'brick' as ProcessedResourceType,
    outputAmount: 1,
    time: 5000,
    unlocked: true,
    requiredBuilding: 'quarry',
    requiredLevel: 1
  },
  {
    id: 'refine_herb',
    name: '精炼草药',
    inputs: { herb: 4 },
    output: 'potion_herb' as ProcessedResourceType,
    outputAmount: 1,
    time: 8000,
    unlocked: true,
    requiredBuilding: 'herb_garden',
    requiredLevel: 2
  },
  {
    id: 'make_jam',
    name: '制作果酱',
    inputs: { berry: 5 },
    output: 'jam' as ProcessedResourceType,
    outputAmount: 1,
    time: 6000,
    unlocked: true,
    requiredBuilding: 'kitchen',
    requiredLevel: 1
  },
  {
    id: 'grind_crystal',
    name: '研磨水晶',
    inputs: { crystal: 2 },
    output: 'magic_dust' as ProcessedResourceType,
    outputAmount: 1,
    time: 10000,
    unlocked: true,
    requiredBuilding: 'magic_tower',
    requiredLevel: 2
  },
  {
    id: 'make_plank_advanced',
    name: '批量制作木板',
    inputs: { wood: 10 },
    output: 'plank' as ProcessedResourceType,
    outputAmount: 4,
    time: 12000,
    unlocked: false,
    requiredBuilding: 'workshop',
    requiredLevel: 2
  },
  {
    id: 'make_brick_advanced',
    name: '批量制作石砖',
    inputs: { stone: 10 },
    output: 'brick' as ProcessedResourceType,
    outputAmount: 4,
    time: 12000,
    unlocked: false,
    requiredBuilding: 'workshop',
    requiredLevel: 3
  }
]

export function getResourceDropWeights(): { type: ResourceType; weight: number }[] {
  return Object.entries(RESOURCE_DROP_CONFIG).map(([type, config]) => ({
    type: type as ResourceType,
    weight: config.weight
  }))
}

export function selectRandomResource(resourceBoost: number = 1): ResourceType {
  const weights = getResourceDropWeights()
  const adjustedWeights = weights.map(w => ({
    ...w,
    weight: w.weight * resourceBoost
  }))
  const totalWeight = adjustedWeights.reduce((sum, w) => sum + w.weight, 0)
  let random = Math.random() * totalWeight

  for (const w of adjustedWeights) {
    random -= w.weight
    if (random <= 0) {
      return w.type
    }
  }
  return 'wood'
}
