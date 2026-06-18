import type { Achievement, GameState } from './types'

const STORAGE_KEY = 'forest-runner-achievements'

export const achievementsList: Achievement[] = [
  {
    id: 'first_run',
    name: '初次冒险',
    description: '完成第一次跑酷',
    unlocked: false,
    icon: '🌟',
    condition: (state: GameState) => state.distance >= 100
  },
  {
    id: 'coin_collector',
    name: '金币收集者',
    description: '单局收集50枚金币',
    unlocked: false,
    icon: '💰',
    condition: (state: GameState) => state.coins >= 50
  },
  {
    id: 'coin_master',
    name: '金币大师',
    description: '单局收集100枚金币',
    unlocked: false,
    icon: '👑',
    condition: (state: GameState) => state.coins >= 100
  },
  {
    id: 'speed_demon',
    name: '疾风之影',
    description: '达到最高速度',
    unlocked: false,
    icon: '💨',
    condition: (state: GameState) => state.speed >= state.maxSpeed
  },
  {
    id: 'distance_500',
    name: '森林探险家',
    description: '奔跑500米',
    unlocked: false,
    icon: '🌲',
    condition: (state: GameState) => state.distance >= 500
  },
  {
    id: 'distance_1000',
    name: '马拉松选手',
    description: '奔跑1000米',
    unlocked: false,
    icon: '🏃',
    condition: (state: GameState) => state.distance >= 1000
  },
  {
    id: 'score_500',
    name: '小有成就',
    description: '单局得分500分',
    unlocked: false,
    icon: '⭐',
    condition: (state: GameState) => state.score >= 500
  },
  {
    id: 'score_2000',
    name: '传奇跑者',
    description: '单局得分2000分',
    unlocked: false,
    icon: '🏆',
    condition: (state: GameState) => state.score >= 2000
  }
]

export function loadAchievements(): Achievement[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const unlockedIds = JSON.parse(saved) as string[]
      return achievementsList.map(a => ({
        ...a,
        unlocked: unlockedIds.includes(a.id)
      }))
    }
  } catch (e) {
    console.error('Failed to load achievements:', e)
  }
  return [...achievementsList]
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    const unlockedIds = achievements.filter(a => a.unlocked).map(a => a.id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedIds))
  } catch (e) {
    console.error('Failed to save achievements:', e)
  }
}

export function checkAchievements(state: GameState, achievements: Achievement[]): Achievement[] {
  let updated = false
  const newAchievements = achievements.map(a => {
    if (!a.unlocked && a.condition(state)) {
      updated = true
      return { ...a, unlocked: true }
    }
    return a
  })
  if (updated) {
    saveAchievements(newAchievements)
  }
  return newAchievements
}
