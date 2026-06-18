import type { Pet, PetEgg, PetRarity, PetSkillType } from './types'

export const PETS: Pet[] = [
  {
    id: 'forest_squirrel',
    name: '森林松鼠',
    icon: '🐿️',
    description: '活泼的小松鼠，擅长收集坚果和金币',
    rarity: 'common',
    skills: [
      { type: 'coin_bonus', value: 0.1, description: '金币加成 +10%' },
      { type: 'resource_bonus', value: 0.05, description: '资源加成 +5%' }
    ],
    color: '#8B4513',
    secondaryColor: '#DEB887',
    unlockCondition: '从普通蛋中孵化'
  },
  {
    id: 'bunny_hopper',
    name: '跳跳兔',
    icon: '🐰',
    description: '敏捷的小兔子，跳跃时有额外分数',
    rarity: 'common',
    skills: [
      { type: 'score_multiplier', value: 0.05, description: '得分加成 +5%' },
      { type: 'coin_bonus', value: 0.05, description: '金币加成 +5%' }
    ],
    color: '#F5F5F5',
    secondaryColor: '#FFB6C1',
    unlockCondition: '从普通蛋中孵化'
  },
  {
    id: 'hedgehog_roller',
    name: '刺猬球球',
    icon: '🦔',
    description: '浑身是刺的小刺猬，提供护盾保护',
    rarity: 'common',
    skills: [
      { type: 'shield', value: 1, description: '额外护盾 +1' },
      { type: 'resource_bonus', value: 0.03, description: '资源加成 +3%' }
    ],
    color: '#696969',
    secondaryColor: '#D2B48C',
    unlockCondition: '从普通蛋中孵化'
  },
  {
    id: 'fox_fire',
    name: '火焰狐',
    icon: '🦊',
    description: '神秘的火焰之狐，加速收集一切',
    rarity: 'rare',
    skills: [
      { type: 'coin_bonus', value: 0.15, description: '金币加成 +15%' },
      { type: 'magnet', value: 30, description: '吸引范围 +30' },
      { type: 'speed_aura', value: 0.05, description: '速度加成 +5%' }
    ],
    color: '#FF6B35',
    secondaryColor: '#FFD93D',
    unlockCondition: '从稀有蛋中孵化'
  },
  {
    id: 'owl_wisdom',
    name: '智慧猫头鹰',
    icon: '🦉',
    description: '充满智慧的猫头鹰，大幅提升分数',
    rarity: 'rare',
    skills: [
      { type: 'score_multiplier', value: 0.15, description: '得分加成 +15%' },
      { type: 'resource_bonus', value: 0.1, description: '资源加成 +10%' }
    ],
    color: '#8B7355',
    secondaryColor: '#F4A460',
    unlockCondition: '从稀有蛋中孵化'
  },
  {
    id: 'deer_spirit',
    name: '精灵鹿',
    icon: '🦌',
    description: '优雅的森林精灵鹿，带来好运',
    rarity: 'rare',
    skills: [
      { type: 'resource_bonus', value: 0.2, description: '资源加成 +20%' },
      { type: 'shield', value: 1, description: '额外护盾 +1' }
    ],
    color: '#DAA520',
    secondaryColor: '#FFF8DC',
    unlockCondition: '从稀有蛋中孵化'
  },
  {
    id: 'dragon_baby',
    name: '幼龙宝宝',
    icon: '🐲',
    description: '传说中的幼龙，拥有强大的力量',
    rarity: 'epic',
    skills: [
      { type: 'coin_bonus', value: 0.25, description: '金币加成 +25%' },
      { type: 'score_multiplier', value: 0.2, description: '得分加成 +20%' },
      { type: 'shield', value: 2, description: '额外护盾 +2' }
    ],
    color: '#32CD32',
    secondaryColor: '#7CFC00',
    unlockCondition: '从史诗蛋中孵化'
  },
  {
    id: 'phoenix_chick',
    name: '凤凰雏鸟',
    icon: '🐦‍🔥',
    description: '浴火重生的凤凰幼鸟，带来奇迹',
    rarity: 'epic',
    skills: [
      { type: 'speed_aura', value: 0.1, description: '速度加成 +10%' },
      { type: 'coin_bonus', value: 0.2, description: '金币加成 +20%' },
      { type: 'magnet', value: 50, description: '吸引范围 +50' }
    ],
    color: '#FF4500',
    secondaryColor: '#FFD700',
    unlockCondition: '从史诗蛋中孵化'
  },
  {
    id: 'unicorn_foal',
    name: '独角兽幼驹',
    icon: '🦄',
    description: '梦幻的独角兽，全方面提升能力',
    rarity: 'legendary',
    skills: [
      { type: 'coin_bonus', value: 0.35, description: '金币加成 +35%' },
      { type: 'score_multiplier', value: 0.3, description: '得分加成 +30%' },
      { type: 'resource_bonus', value: 0.25, description: '资源加成 +25%' },
      { type: 'shield', value: 3, description: '额外护盾 +3' }
    ],
    color: '#FF69B4',
    secondaryColor: '#E6E6FA',
    unlockCondition: '从传说蛋中孵化'
  },
  {
    id: 'ancient_turtle',
    name: '远古神龟',
    icon: '🐢',
    description: '活了千年的神龟，坚不可摧',
    rarity: 'legendary',
    skills: [
      { type: 'shield', value: 5, description: '额外护盾 +5' },
      { type: 'resource_bonus', value: 0.3, description: '资源加成 +30%' },
      { type: 'magnet', value: 80, description: '吸引范围 +80' }
    ],
    color: '#2E8B57',
    secondaryColor: '#90EE90',
    unlockCondition: '从传说蛋中孵化'
  }
]

export const PET_EGGS: PetEgg[] = [
  {
    id: 'common_egg',
    name: '普通宠物蛋',
    icon: '🥚',
    rarity: 'common',
    possiblePets: ['forest_squirrel', 'bunny_hopper', 'hedgehog_roller'],
    hatchTime: 30000,
    cost: { coin: 100, wood: 20 }
  },
  {
    id: 'rare_egg',
    name: '稀有宠物蛋',
    icon: '🪺',
    rarity: 'rare',
    possiblePets: ['fox_fire', 'owl_wisdom', 'deer_spirit', 'forest_squirrel', 'bunny_hopper'],
    hatchTime: 60000,
    cost: { coin: 300, plank: 10, magic_dust: 2 }
  },
  {
    id: 'epic_egg',
    name: '史诗宠物蛋',
    icon: '🥚✨',
    rarity: 'epic',
    possiblePets: ['dragon_baby', 'phoenix_chick', 'fox_fire', 'owl_wisdom'],
    hatchTime: 120000,
    cost: { coin: 800, brick: 20, magic_dust: 5, potion_herb: 3 }
  },
  {
    id: 'legendary_egg',
    name: '传说宠物蛋',
    icon: '🌟🥚',
    rarity: 'legendary',
    possiblePets: ['unicorn_foal', 'ancient_turtle'],
    hatchTime: 300000,
    cost: { coin: 2000, magic_dust: 15, potion_herb: 10, jam: 10 }
  }
]

export function getPetById(petId: string): Pet | undefined {
  return PETS.find(p => p.id === petId)
}

export function getEggById(eggId: string): PetEgg | undefined {
  return PET_EGGS.find(e => e.id === eggId)
}

export function getRarityName(rarity: PetRarity): string {
  const names: Record<PetRarity, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return names[rarity]
}

export function getRarityColor(rarity: PetRarity): string {
  const colors: Record<PetRarity, string> = {
    common: '#9E9E9E',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FF9800'
  }
  return colors[rarity]
}

export function getRarityBgColor(rarity: PetRarity): string {
  const colors: Record<PetRarity, string> = {
    common: '#F5F5F5',
    rare: '#E3F2FD',
    epic: '#F3E5F5',
    legendary: '#FFF3E0'
  }
  return colors[rarity]
}

export function getPetSkillValue(pet: Pet, skillType: PetSkillType): number {
  const skill = pet.skills.find(s => s.type === skillType)
  return skill?.value || 0
}

export function getExpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.5, level - 1))
}

export function selectRandomPetFromEgg(eggId: string): Pet | null {
  const egg = getEggById(eggId)
  if (!egg || egg.possiblePets.length === 0) return null

  const weights: Record<string, number> = {
    forest_squirrel: 35,
    bunny_hopper: 35,
    hedgehog_roller: 30,
    fox_fire: 30,
    owl_wisdom: 30,
    deer_spirit: 25,
    dragon_baby: 40,
    phoenix_chick: 35,
    unicorn_foal: 50,
    ancient_turtle: 50
  }

  const possiblePets = egg.possiblePets
  const totalWeight = possiblePets.reduce((sum, id) => sum + (weights[id] || 10), 0)
  let random = Math.random() * totalWeight

  for (const petId of possiblePets) {
    random -= weights[petId] || 10
    if (random <= 0) {
      return getPetById(petId) || null
    }
  }

  return getPetById(possiblePets[0]) || null
}
