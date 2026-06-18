import type { Achievement, GameState } from './types'
import { getTotalStars, getChapterById, chapterState } from './chapterStore'

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
  },
  {
    id: 'first_star',
    name: '初露锋芒',
    description: '获得第一颗章节星星',
    unlocked: false,
    icon: '⭐',
    condition: () => getTotalStars() >= 1
  },
  {
    id: 'star_collector_10',
    name: '星星收藏家',
    description: '累计获得10颗章节星星',
    unlocked: false,
    icon: '✨',
    condition: () => getTotalStars() >= 10
  },
  {
    id: 'star_collector_30',
    name: '星星大师',
    description: '累计获得30颗章节星星',
    unlocked: false,
    icon: '🌟',
    condition: () => getTotalStars() >= 30
  },
  {
    id: 'star_collector_60',
    name: '星星传奇',
    description: '累计获得60颗章节星星',
    unlocked: false,
    icon: '💫',
    condition: () => getTotalStars() >= 60
  },
  {
    id: 'chapter_forest_complete',
    name: '森林征服者',
    description: '完成翡翠森林章节',
    unlocked: false,
    icon: '🌲',
    condition: () => {
      const chapter = getChapterById('chapter-forest')
      return chapter?.completed || false
    }
  },
  {
    id: 'chapter_desert_complete',
    name: '沙漠行者',
    description: '完成烈日沙漠章节',
    unlocked: false,
    icon: '🏜️',
    condition: () => {
      const chapter = getChapterById('chapter-desert')
      return chapter?.completed || false
    }
  },
  {
    id: 'chapter_snow_complete',
    name: '冰雪勇士',
    description: '完成冰雪世界章节',
    unlocked: false,
    icon: '❄️',
    condition: () => {
      const chapter = getChapterById('chapter-snow')
      return chapter?.completed || false
    }
  },
  {
    id: 'chapter_volcano_complete',
    name: '火焰斗士',
    description: '完成熔岩火山章节',
    unlocked: false,
    icon: '🌋',
    condition: () => {
      const chapter = getChapterById('chapter-volcano')
      return chapter?.completed || false
    }
  },
  {
    id: 'chapter_ocean_complete',
    name: '深海探险家',
    description: '完成深海秘境章节',
    unlocked: false,
    icon: '🌊',
    condition: () => {
      const chapter = getChapterById('chapter-ocean')
      return chapter?.completed || false
    }
  },
  {
    id: 'chapter_sky_complete',
    name: '天界使者',
    description: '完成云端天堂终章',
    unlocked: false,
    icon: '☁️',
    condition: () => {
      const chapter = getChapterById('chapter-sky')
      return chapter?.completed || false
    }
  },
  {
    id: 'all_chapters_complete',
    name: '世界主宰',
    description: '完成所有章节',
    unlocked: false,
    icon: '👑',
    condition: () => {
      return chapterState.chapters.every(c => c.completed)
    }
  },
  {
    id: 'forest_3stars',
    name: '森林三星大师',
    description: '翡翠森林任意区域获得3星评价',
    unlocked: false,
    icon: '💚',
    condition: () => {
      const chapter = getChapterById('chapter-forest')
      return chapter?.areas.some(a => a.stars >= 3) || false
    }
  },
  {
    id: 'perfect_chapter',
    name: '完美章节约',
    description: '任意章节所有区域获得3星评价',
    unlocked: false,
    icon: '🎖️',
    condition: () => {
      return chapterState.chapters.some(chapter =>
        chapter.areas.every(area => area.stars >= area.maxStars)
      )
    }
  },
  {
    id: 'first_area_unlock',
    name: '探索先锋',
    description: '解锁第一个章节区域',
    unlocked: false,
    icon: '🗺️',
    condition: () => {
      return chapterState.chapters.some(chapter =>
        chapter.areas.some((area, idx) => idx > 0 && area.unlocked)
      )
    }
  },
  {
    id: 'chapter_bonus_first',
    name: '奖励收割者',
    description: '领取第一个章节完成奖励',
    unlocked: false,
    icon: '🎁',
    condition: () => {
      return Object.values(chapterState.bonusClaimed).some(v => v)
    }
  },
  {
    id: 'distance_5000',
    name: '超长跑者',
    description: '奔跑5000米',
    unlocked: false,
    icon: '🏅',
    condition: (state: GameState) => state.distance >= 5000
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

export function checkChapterAchievements(achievements: Achievement[]): Achievement[] {
  let updated = false
  const dummyState: GameState = {
    score: 0, coins: 0, distance: 0, highScore: 0,
    isRunning: false, isGameOver: false, isPaused: false,
    speed: 0, baseSpeed: 0, maxSpeed: 0
  }
  const newAchievements = achievements.map(a => {
    if (!a.unlocked && a.condition(dummyState)) {
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

export function getNewlyUnlockedAchievements(
  before: Achievement[],
  after: Achievement[]
): Achievement[] {
  const beforeUnlocked = new Set(before.filter(a => a.unlocked).map(a => a.id))
  return after.filter(a => a.unlocked && !beforeUnlocked.has(a.id))
}
