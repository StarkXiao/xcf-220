import type { ShopItem, ShopItemEffect } from './types'

function createEffect(
  type: ShopItemEffect['type'],
  value: number,
  description: string,
  duration?: number
): ShopItemEffect {
  return { type, value, description, duration }
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'invincible_potion',
    name: '无敌药水',
    icon: '🧪',
    description: '开局获得5秒无敌时间，无视所有障碍物',
    category: 'consumable',
    rarity: 'common',
    basePrice: 50,
    effects: [createEffect('invincible_start', 5, '开局5秒无敌', 300)],
    maxStock: 10,
    isRefreshable: true,
    sortOrder: 1
  },
  {
    id: 'double_coin_charm',
    name: '双倍金币符',
    icon: '💰',
    description: '整局游戏金币获取量翻倍',
    category: 'consumable',
    rarity: 'rare',
    basePrice: 100,
    effects: [createEffect('double_coins', 1, '金币获取 x2')],
    maxStock: 5,
    isRefreshable: true,
    sortOrder: 2
  },
  {
    id: 'magnet_stone',
    name: '磁力石',
    icon: '🧲',
    description: '自动吸附附近的金币和道具',
    category: 'consumable',
    rarity: 'rare',
    basePrice: 80,
    effects: [createEffect('magnet', 150, '吸附范围 150px')],
    maxStock: 8,
    isRefreshable: true,
    sortOrder: 3
  },
  {
    id: 'extra_heart',
    name: '额外之心',
    icon: '💖',
    description: '额外获得1条生命',
    category: 'consumable',
    rarity: 'epic',
    basePrice: 150,
    effects: [createEffect('extra_life', 1, '额外生命 +1')],
    maxStock: 3,
    isRefreshable: true,
    sortOrder: 4
  },
  {
    id: 'speed_boots',
    name: '疾风之靴',
    icon: '👟',
    description: '开局获得10秒加速效果',
    category: 'consumable',
    rarity: 'common',
    basePrice: 60,
    effects: [createEffect('speed_boost_start', 0.3, '开局速度 +30%', 600)],
    maxStock: 10,
    isRefreshable: true,
    sortOrder: 5
  },
  {
    id: 'lucky_clover',
    name: '幸运四叶草',
    icon: '🍀',
    description: '整局游戏得分增加50%',
    category: 'consumable',
    rarity: 'epic',
    basePrice: 200,
    effects: [createEffect('score_multiplier', 0.5, '得分 +50%')],
    maxStock: 3,
    isRefreshable: true,
    sortOrder: 6
  },
  {
    id: 'time_slowdown',
    name: '时间沙漏',
    icon: '⏳',
    description: '障碍物移动速度降低20%',
    category: 'consumable',
    rarity: 'rare',
    basePrice: 120,
    effects: [createEffect('slow_obstacles', 0.2, '障碍物速度 -20%')],
    maxStock: 5,
    isRefreshable: true,
    sortOrder: 7
  },
  {
    id: 'coin_magnet',
    name: '金币磁铁',
    icon: '🪙',
    description: '增加金币吸引范围',
    category: 'permanent',
    rarity: 'rare',
    basePrice: 500,
    effects: [createEffect('coin_magnet_range', 50, '金币吸引范围 +50px')],
    maxStock: 1,
    isRefreshable: false,
    sortOrder: 8
  },
  {
    id: 'jump_enhancer',
    name: '弹跳强化器',
    icon: '🦘',
    description: '永久提升跳跃力15%',
    category: 'permanent',
    rarity: 'epic',
    basePrice: 800,
    effects: [createEffect('jump_boost_perm', 0.15, '跳跃力 +15%')],
    maxStock: 1,
    isRefreshable: false,
    sortOrder: 9
  },
  {
    id: 'speed_upgrade',
    name: '速度升级',
    icon: '⚡',
    description: '永久提升基础速度10%',
    category: 'permanent',
    rarity: 'epic',
    basePrice: 800,
    effects: [createEffect('base_speed_perm', 0.1, '基础速度 +10%')],
    maxStock: 1,
    isRefreshable: false,
    sortOrder: 10
  },
  {
    id: 'heart_container',
    name: '生命容器',
    icon: '❤️‍🔥',
    description: '永久增加1条初始生命',
    category: 'permanent',
    rarity: 'legendary',
    basePrice: 1500,
    effects: [createEffect('extra_life_perm', 1, '初始生命 +1')],
    maxStock: 1,
    isRefreshable: false,
    sortOrder: 11
  },
  {
    id: 'legendary_luck',
    name: '传说护符',
    icon: '🌟',
    description: '整局游戏金币和得分都增加100%',
    category: 'consumable',
    rarity: 'legendary',
    basePrice: 500,
    effects: [
      createEffect('double_coins', 1, '金币获取 x2'),
      createEffect('score_multiplier', 1, '得分 +100%')
    ],
    maxStock: 1,
    isRefreshable: true,
    sortOrder: 12
  }
]

export function getShopItemById(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find(item => item.id === itemId)
}

export function getShopItemsByCategory(category: string): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.category === category)
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return '#9CA3AF'
    case 'rare': return '#3B82F6'
    case 'epic': return '#8B5CF6'
    case 'legendary': return '#F59E0B'
    default: return '#9CA3AF'
  }
}

export function getRarityName(rarity: string): string {
  switch (rarity) {
    case 'common': return '普通'
    case 'rare': return '稀有'
    case 'epic': return '史诗'
    case 'legendary': return '传说'
    default: return '普通'
  }
}

export function getCategoryName(category: string): string {
  switch (category) {
    case 'consumable': return '消耗品'
    case 'permanent': return '永久道具'
    case 'limited': return '限时道具'
    default: return '其他'
  }
}

export function generateRandomDiscounts(): { itemId: string; discountPercent: number }[] {
  const consumables = SHOP_ITEMS.filter(item => item.category === 'consumable')
  const shuffled = [...consumables].sort(() => Math.random() - 0.5)
  const discounted = shuffled.slice(0, 3)
  
  return discounted.map(item => ({
    itemId: item.id,
    discountPercent: [20, 30, 50][Math.floor(Math.random() * 3)]
  }))
}

export const REFRESH_COST = 20
export const MAX_EQUIPPED_CONSUMABLES = 3
