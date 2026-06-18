import type { CosmeticItem, CosmeticRarity, CosmeticCategory } from './types'

export const COSMETIC_ITEMS: CosmeticItem[] = [
  // ========== 皮肤类 ==========
  {
    id: 'skin-default',
    name: '经典小红帽',
    description: '初始的小红帽皮肤，经典冒险造型。',
    icon: '👧',
    category: 'skin',
    rarity: 'common',
    colors: { body: '#FF6B6B', head: '#FFE4C4', hat: '#FFE66D', accent: '#FFFFFF', skin: '#FFE4C4', shoes: '#8B4513' },
    unlockCondition: { type: 'default', description: '初始拥有' },
    sortOrder: 1
  },
  {
    id: 'skin-forest-elf',
    name: '翠林精灵',
    description: '来自翡翠森林的神秘精灵，与自然融为一体。',
    icon: '🧝',
    category: 'skin',
    rarity: 'rare',
    colors: { body: '#4CAF50', head: '#C8E6C9', hat: '#2E7D32', accent: '#81C784', skin: '#FFECB3', shoes: '#1B5E20' },
    unlockCondition: { type: 'battle_pass', value: 'premium-3', description: '赛季通行证3级（高级）' },
    sortOrder: 2
  },
  {
    id: 'skin-pine-traveler',
    name: '松果旅人',
    description: '身穿松果色外衣的勇敢旅人，不畏艰险。',
    icon: '🌰',
    category: 'skin',
    rarity: 'common',
    colors: { body: '#8D6E63', head: '#BCAAA4', hat: '#5D4037', accent: '#A1887F', skin: '#FFE0B2', shoes: '#3E2723' },
    unlockCondition: { type: 'battle_pass', value: 'free-8', description: '赛季通行证8级（免费）' },
    sortOrder: 3
  },
  {
    id: 'skin-aurora-fox',
    name: '极光狐狸',
    description: '身披极光般绚烂毛发的神秘狐狸造型。',
    icon: '🦊',
    category: 'skin',
    rarity: 'epic',
    colors: { body: '#7B1FA2', head: '#CE93D8', hat: '#4A148C', accent: '#E1BEE7', skin: '#F8BBD0', shoes: '#6A1B9A' },
    unlockCondition: { type: 'battle_pass', value: 'premium-10', description: '赛季通行证10级（高级）' },
    sortOrder: 4
  },
  {
    id: 'skin-lava-warrior',
    name: '熔岩勇士',
    description: '来自火山深处的勇士，浑身燃烧着斗志。',
    icon: '🔥',
    category: 'skin',
    rarity: 'epic',
    colors: { body: '#E64A19', head: '#FFAB91', hat: '#BF360C', accent: '#FF7043', skin: '#FFCCBC', shoes: '#BF360C' },
    unlockCondition: { type: 'achievement', value: 'chapter_volcano_complete', description: '完成"火焰斗士"成就' },
    sortOrder: 5
  },
  {
    id: 'skin-ocean-prince',
    name: '深海王子',
    description: '深海王国的王子，带着海洋的神秘力量。',
    icon: '🧜',
    category: 'skin',
    rarity: 'epic',
    colors: { body: '#0288D1', head: '#B3E5FC', hat: '#01579B', accent: '#4FC3F7', skin: '#B2EBF2', shoes: '#01579B' },
    unlockCondition: { type: 'achievement', value: 'chapter_ocean_complete', description: '完成"深海探险家"成就' },
    sortOrder: 6
  },
  {
    id: 'skin-star-ranger',
    name: '星空游侠',
    description: '穿越星空的神秘游侠，披风闪烁着星光。',
    icon: '🌌',
    category: 'skin',
    rarity: 'rare',
    colors: { body: '#283593', head: '#C5CAE9', hat: '#1A237E', accent: '#7986CB', skin: '#E8EAF6', shoes: '#303F9F' },
    unlockCondition: { type: 'stars', value: 30, description: '累计获得30颗章节星星' },
    sortOrder: 7
  },
  {
    id: 'skin-thunder-wings',
    name: '雷霆之翼',
    description: '身披雷电之力的传奇战士，速度惊人。',
    icon: '⚡',
    category: 'skin',
    rarity: 'legendary',
    colors: { body: '#FBC02D', head: '#FFF9C4', hat: '#F57F17', accent: '#FFEB3B', skin: '#FFF59D', shoes: '#F57F17' },
    unlockCondition: { type: 'battle_pass', value: 'premium-30', description: '赛季通行证30级（高级）' },
    sortOrder: 8
  },
  {
    id: 'skin-frost-queen',
    name: '冰霜女王',
    description: '冰雪王国的统治者，优雅而强大。',
    icon: '❄️',
    category: 'skin',
    rarity: 'legendary',
    colors: { body: '#00ACC1', head: '#B2EBF2', hat: '#006064', accent: '#80DEEA', skin: '#E0F7FA', shoes: '#00838F' },
    unlockCondition: { type: 'achievement', value: 'chapter_snow_complete', description: '完成"冰雪勇士"成就' },
    sortOrder: 9
  },
  {
    id: 'skin-forest-king',
    name: '森林之王',
    description: '森林的传奇主宰，拥有大自然的全部力量。',
    icon: '👑',
    category: 'skin',
    rarity: 'legendary',
    colors: { body: '#FFD700', head: '#FFF8DC', hat: '#B8860B', accent: '#FFA500', skin: '#FFECB3', shoes: '#8B4513' },
    unlockCondition: { type: 'achievement', value: 'all_chapters_complete', description: '完成"世界主宰"成就' },
    sortOrder: 10
  },
  {
    id: 'skin-speed-demon',
    name: '疾风之影',
    description: '追求极致速度的影子刺客，来去如风。',
    icon: '💨',
    category: 'skin',
    rarity: 'rare',
    colors: { body: '#37474F', head: '#CFD8DC', hat: '#263238', accent: '#00BCD4', skin: '#ECEFF1', shoes: '#212121' },
    unlockCondition: { type: 'achievement', value: 'speed_demon', description: '完成"疾风之影"成就' },
    sortOrder: 11
  },
  {
    id: 'skin-marathon',
    name: '马拉松选手',
    description: '专为长跑设计的专业运动装备。',
    icon: '🏃',
    category: 'skin',
    rarity: 'common',
    colors: { body: '#FF5722', head: '#FFE0B2', hat: '#E64A19', accent: '#FF9800', skin: '#FFE0B2', shoes: '#212121' },
    unlockCondition: { type: 'distance', value: 10000, description: '累计奔跑10000米' },
    sortOrder: 12
  },

  // ========== 帽子类 ==========
  {
    id: 'hat-none',
    name: '无',
    description: '不佩戴帽子',
    icon: '🚫',
    category: 'hat',
    rarity: 'common',
    unlockCondition: { type: 'default', description: '初始拥有' },
    sortOrder: 1
  },
  {
    id: 'hat-red-bow',
    name: '红色蝴蝶结',
    description: '可爱的红色蝴蝶结，经典小红帽的标志。',
    icon: '🎀',
    category: 'hat',
    rarity: 'common',
    colors: { body: '#FF6B6B', head: '#FFE4C4', hat: '#FF6B6B', accent: '#FFFFFF', skin: '#FFE4C4', shoes: '#8B4513' },
    unlockCondition: { type: 'default', description: '初始拥有' },
    sortOrder: 2
  },
  {
    id: 'hat-flower-crown',
    name: '花环',
    description: '用森林鲜花编织的美丽花环。',
    icon: '🌸',
    category: 'hat',
    rarity: 'rare',
    colors: { body: '#FF6B6B', head: '#FFE4C4', hat: '#E91E63', accent: '#FFFFFF', skin: '#FFE4C4', shoes: '#8B4513' },
    unlockCondition: { type: 'achievement', value: 'first_run', description: '完成"初次冒险"成就' },
    sortOrder: 3
  },
  {
    id: 'hat-crown',
    name: '皇冠',
    description: '闪闪发光的金色皇冠，彰显王者气质。',
    icon: '👑',
    category: 'hat',
    rarity: 'legendary',
    colors: { body: '#FF6B6B', head: '#FFE4C4', hat: '#FFD700', accent: '#FFA500', skin: '#FFE4C4', shoes: '#8B4513' },
    unlockCondition: { type: 'achievement', value: 'score_2000', description: '完成"传奇跑者"成就' },
    sortOrder: 4
  },
  {
    id: 'hat-santa-hat',
    name: '圣诞帽',
    description: '节日限定的红色圣诞帽。',
    icon: '🎅',
    category: 'hat',
    rarity: 'epic',
    colors: { body: '#FF6B6B', head: '#FFE4C4', hat: '#D32F2F', accent: '#FFFFFF', skin: '#FFE4C4', shoes: '#8B4513' },
    unlockCondition: { type: 'event', value: 'christmas', description: '圣诞节活动限定' },
    sortOrder: 5
  },
  {
    id: 'hat-helmet',
    name: '勇士头盔',
    description: '坚固的战士头盔，提供额外防护感。',
    icon: '⛑️',
    category: 'hat',
    rarity: 'epic',
    colors: { body: '#FF6B6B', head: '#FFE4C4', hat: '#78909C', accent: '#FFC107', skin: '#FFE4C4', shoes: '#8B4513' },
    unlockCondition: { type: 'chapter', value: 'chapter-volcano', description: '解锁火山章节' },
    sortOrder: 6
  },
  {
    id: 'hat-wizard-hat',
    name: '魔法帽',
    description: '神秘的魔法师尖帽，蕴含魔力。',
    icon: '🧙',
    category: 'hat',
    rarity: 'rare',
    colors: { body: '#FF6B6B', head: '#FFE4C4', hat: '#4A148C', accent: '#FFD700', skin: '#FFE4C4', shoes: '#8B4513' },
    unlockCondition: { type: 'stars', value: 10, description: '累计获得10颗章节星星' },
    sortOrder: 7
  },

  // ========== 配饰类 ==========
  {
    id: 'acc-none',
    name: '无',
    description: '不佩戴配饰',
    icon: '🚫',
    category: 'accessory',
    rarity: 'common',
    unlockCondition: { type: 'default', description: '初始拥有' },
    sortOrder: 1
  },
  {
    id: 'acc-scarf-red',
    name: '红色围巾',
    description: '温暖的红色围巾，适合寒冷天气。',
    icon: '🧣',
    category: 'accessory',
    rarity: 'common',
    unlockCondition: { type: 'default', description: '初始拥有' },
    sortOrder: 2
  },
  {
    id: 'acc-backpack',
    name: '探险背包',
    description: '装满探险物资的背包，准备出发！',
    icon: '🎒',
    category: 'accessory',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', value: 'first_area_unlock', description: '完成"探索先锋"成就' },
    sortOrder: 3
  },
  {
    id: 'acc-necklace',
    name: '水晶项链',
    description: '镶嵌魔法水晶的项链，散发神秘光芒。',
    icon: '📿',
    category: 'accessory',
    rarity: 'epic',
    unlockCondition: { type: 'chapter', value: 'chapter-ocean', description: '解锁海洋章节' },
    sortOrder: 4
  },
  {
    id: 'acc-wings',
    name: '天使翅膀',
    description: '洁白的天使翅膀，轻盈飘逸。',
    icon: '🪽',
    category: 'accessory',
    rarity: 'legendary',
    unlockCondition: { type: 'achievement', value: 'all_chapters_complete', description: '完成"世界主宰"成就' },
    sortOrder: 5
  },
  {
    id: 'acc-cape',
    name: '英雄披风',
    description: '飘逸的英雄披风，英姿飒爽。',
    icon: '🧥',
    category: 'accessory',
    rarity: 'rare',
    unlockCondition: { type: 'battle_pass', value: 'free-15', description: '赛季通行证15级（免费）' },
    sortOrder: 6
  },

  // ========== 拖尾类 ==========
  {
    id: 'trail-none',
    name: '无',
    description: '无特殊拖尾效果',
    icon: '🚫',
    category: 'trail',
    rarity: 'common',
    unlockCondition: { type: 'default', description: '初始拥有' },
    sortOrder: 1
  },
  {
    id: 'trail-sparkle',
    name: '星光拖尾',
    description: '奔跑时身后闪烁着星光。',
    icon: '✨',
    category: 'trail',
    rarity: 'rare',
    trailColor: '#FFD700',
    particleColor: '#FFFF00',
    unlockCondition: { type: 'achievement', value: 'star_collector_10', description: '完成"星星收藏家"成就' },
    sortOrder: 2
  },
  {
    id: 'trail-fire',
    name: '烈焰拖尾',
    description: '燃烧的火焰跟随你的脚步。',
    icon: '🔥',
    category: 'trail',
    rarity: 'epic',
    trailColor: '#FF5722',
    particleColor: '#FF9800',
    unlockCondition: { type: 'achievement', value: 'chapter_volcano_complete', description: '完成"火焰斗士"成就' },
    sortOrder: 3
  },
  {
    id: 'trail-ice',
    name: '冰霜拖尾',
    description: '所到之处留下冰霜结晶。',
    icon: '❄️',
    category: 'trail',
    rarity: 'epic',
    trailColor: '#00BCD4',
    particleColor: '#B2EBF2',
    unlockCondition: { type: 'achievement', value: 'chapter_snow_complete', description: '完成"冰雪勇士"成就' },
    sortOrder: 4
  },
  {
    id: 'trail-rainbow',
    name: '彩虹拖尾',
    description: '绚丽的彩虹在身后绽放。',
    icon: '🌈',
    category: 'trail',
    rarity: 'legendary',
    trailColor: '#9C27B0',
    particleColor: '#E91E63',
    unlockCondition: { type: 'battle_pass', value: 'premium-50', description: '赛季通行证50级（高级）' },
    sortOrder: 5
  },
  {
    id: 'trail-nature',
    name: '自然拖尾',
    description: '脚步所及，鲜花盛开。',
    icon: '🌱',
    category: 'trail',
    rarity: 'rare',
    trailColor: '#4CAF50',
    particleColor: '#8BC34A',
    unlockCondition: { type: 'chapter', value: 'chapter-forest', description: '完成森林章节' },
    sortOrder: 6
  },

  // ========== 表情类 ==========
  {
    id: 'emote-wave',
    name: '挥手',
    description: '友好地挥手打招呼。',
    icon: '👋',
    category: 'emote',
    rarity: 'common',
    emoteIcon: '👋',
    unlockCondition: { type: 'default', description: '初始拥有' },
    sortOrder: 1
  },
  {
    id: 'emote-thumbs-up',
    name: '点赞',
    description: '竖起大拇指表示赞赏。',
    icon: '👍',
    category: 'emote',
    rarity: 'common',
    emoteIcon: '👍',
    unlockCondition: { type: 'default', description: '初始拥有' },
    sortOrder: 2
  },
  {
    id: 'emote-heart',
    name: '比心',
    description: '用手比出爱心形状。',
    icon: '❤️',
    category: 'emote',
    rarity: 'rare',
    emoteIcon: '❤️',
    unlockCondition: { type: 'achievement', value: 'coin_collector', description: '完成"金币收集者"成就' },
    sortOrder: 3
  },
  {
    id: 'emote-trophy',
    name: '庆祝',
    description: '举起奖杯庆祝胜利！',
    icon: '🏆',
    category: 'emote',
    rarity: 'epic',
    emoteIcon: '🏆',
    unlockCondition: { type: 'achievement', value: 'score_2000', description: '完成"传奇跑者"成就' },
    sortOrder: 4
  },
  {
    id: 'emote-fire',
    name: '火焰',
    description: '燃烧的斗志！',
    icon: '🔥',
    category: 'emote',
    rarity: 'rare',
    emoteIcon: '🔥',
    unlockCondition: { type: 'distance', value: 5000, description: '累计奔跑5000米' },
    sortOrder: 5
  },
  {
    id: 'emote-star',
    name: '星光',
    description: '闪耀的星星！',
    icon: '⭐',
    category: 'emote',
    rarity: 'rare',
    emoteIcon: '⭐',
    unlockCondition: { type: 'stars', value: 20, description: '累计获得20颗章节星星' },
    sortOrder: 6
  },

  // ========== 称号类 ==========
  {
    id: 'title-none',
    name: '无',
    description: '不显示称号',
    icon: '🚫',
    category: 'title',
    rarity: 'common',
    titleText: '',
    unlockCondition: { type: 'default', description: '初始拥有' },
    sortOrder: 1
  },
  {
    id: 'title-forest-guardian',
    name: '森林守护者',
    description: '保护森林的勇敢卫士。',
    icon: '🛡️',
    category: 'title',
    rarity: 'rare',
    titleText: '森林守护者',
    unlockCondition: { type: 'battle_pass', value: 'premium-5', description: '赛季通行证5级（高级）' },
    sortOrder: 2
  },
  {
    id: 'title-legend-adventurer',
    name: '传奇冒险家',
    description: '传奇般的冒险生涯。',
    icon: '🏆',
    category: 'title',
    rarity: 'epic',
    titleText: '传奇冒险家',
    unlockCondition: { type: 'battle_pass', value: 'premium-25', description: '赛季通行证25级（高级）' },
    sortOrder: 3
  },
  {
    id: 'title-speed-demon',
    name: '疾风之影',
    description: '速度的代名词。',
    icon: '💨',
    category: 'title',
    rarity: 'epic',
    titleText: '疾风之影',
    unlockCondition: { type: 'achievement', value: 'speed_demon', description: '完成"疾风之影"成就' },
    sortOrder: 4
  },
  {
    id: 'title-coin-master',
    name: '金币大师',
    description: '财富的象征。',
    icon: '💰',
    category: 'title',
    rarity: 'rare',
    titleText: '金币大师',
    unlockCondition: { type: 'achievement', value: 'coin_master', description: '完成"金币大师"成就' },
    sortOrder: 5
  },
  {
    id: 'title-world-ruler',
    name: '世界主宰',
    description: '征服所有章节的传奇！',
    icon: '👑',
    category: 'title',
    rarity: 'legendary',
    titleText: '世界主宰',
    unlockCondition: { type: 'achievement', value: 'all_chapters_complete', description: '完成"世界主宰"成就' },
    sortOrder: 6
  },
  {
    id: 'title-star-collector',
    name: '星星收藏家',
    description: '收集了大量星星的探险家。',
    icon: '⭐',
    category: 'title',
    rarity: 'rare',
    titleText: '星星收藏家',
    unlockCondition: { type: 'achievement', value: 'star_collector_10', description: '完成"星星收藏家"成就' },
    sortOrder: 7
  }
]

export function getCosmeticById(id: string): CosmeticItem | null {
  return COSMETIC_ITEMS.find(c => c.id === id) || null
}

export function getCosmeticsByCategory(category: CosmeticCategory): CosmeticItem[] {
  return COSMETIC_ITEMS.filter(c => c.category === category).sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getCosmeticsByRarity(rarity: CosmeticRarity): CosmeticItem[] {
  return COSMETIC_ITEMS.filter(c => c.rarity === rarity)
}

export function getRarityColor(rarity: CosmeticRarity): string {
  const colors: Record<CosmeticRarity, string> = {
    common: '#9E9E9E',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FF9800'
  }
  return colors[rarity]
}

export function getRarityLabel(rarity: CosmeticRarity): string {
  const labels: Record<CosmeticRarity, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return labels[rarity]
}

export function getCategoryLabel(category: CosmeticCategory): string {
  const labels: Record<CosmeticCategory, string> = {
    skin: '皮肤',
    hat: '帽子',
    accessory: '配饰',
    trail: '拖尾',
    emote: '表情',
    title: '称号'
  }
  return labels[category]
}

export function getCategoryIcon(category: CosmeticCategory): string {
  const icons: Record<CosmeticCategory, string> = {
    skin: '👕',
    hat: '🎩',
    accessory: '💎',
    trail: '✨',
    emote: '😊',
    title: '🏅'
  }
  return icons[category]
}

export const DEFAULT_COLORS = {
  body: '#FF6B6B',
  head: '#FFE4C4',
  hat: '#FFE66D',
  accent: '#FFFFFF',
  skin: '#FFE4C4',
  shoes: '#8B4513'
}
