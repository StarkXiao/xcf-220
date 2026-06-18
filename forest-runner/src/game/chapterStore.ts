import { reactive, watch } from 'vue'
import type {
  ChapterState,
  ChapterRunResult,
  Chapter,
  AreaNode,
  ResourceType,
  ChapterTheme
} from './types'
import { CHAPTERS, calculateStars } from './chapterData'
import {
  addResources,
  addResource
} from './campStore'
import type { AllResourceType } from './types'
import { loadAchievements, achievementsList } from './achievements'

const STORAGE_KEY = 'forest-runner-chapter-state'

function createInitialState(): ChapterState {
  return {
    currentChapterId: null,
    currentAreaId: null,
    chapters: JSON.parse(JSON.stringify(CHAPTERS)),
    totalStars: 0,
    lastRunResult: null,
    bonusClaimed: {}
  }
}

function deepCloneChapters(): Chapter[] {
  return JSON.parse(JSON.stringify(CHAPTERS))
}

function loadState(): ChapterState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<ChapterState>
      const baseChapters = deepCloneChapters()

      parsed.chapters = baseChapters.map(savedChapter => {
        const existing = baseChapters.find(c => c.id === savedChapter.id)
        if (!existing) return savedChapter
        return {
          ...existing,
          unlocked: savedChapter.unlocked,
          completed: savedChapter.completed,
          areas: existing.areas.map(area => {
            const savedArea = savedChapter.areas?.find(a => a.id === area.id)
            if (!savedArea) return area
            return {
              ...area,
              unlocked: savedArea.unlocked,
              completed: savedArea.completed,
              stars: savedArea.stars,
            }
          })
        }
      })

      const state: ChapterState = {
        currentChapterId: null,
        currentAreaId: null,
        chapters: parsed.chapters || baseChapters,
        totalStars: parsed.totalStars || calculateTotalStars(parsed.chapters || baseChapters),
        lastRunResult: null,
        bonusClaimed: parsed.bonusClaimed || {}
      }

      checkChapterUnlocks(state)
      return state
    }
  } catch (e) {
    console.error('Failed to load chapter state:', e)
  }
  return createInitialState()
}

function calculateTotalStars(chapters: Chapter[]): number {
  let total = 0
  for (const chapter of chapters) {
    for (const area of chapter.areas) {
      total += area.stars || 0
    }
  }
  return total
}

function saveState(state: ChapterState): void {
  try {
    const toSave = {
      chapters: state.chapters.map(c => ({
        id: c.id,
        unlocked: c.unlocked,
        completed: c.completed,
        areas: c.areas.map(a => ({
          id: a.id,
          unlocked: a.unlocked,
          completed: a.completed,
          stars: a.stars
        }))
      })),
      totalStars: state.totalStars,
      bonusClaimed: state.bonusClaimed
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save chapter state:', e)
  }
}

export const chapterState = reactive<ChapterState>(loadState())

watch(
  () => chapterState,
  (newState) => {
    saveState(newState)
  },
  { deep: true }
)

function checkChapterUnlocks(state: ChapterState): void {
  for (let i = 0; i < state.chapters.length; i++) {
    const chapter = state.chapters[i]
    if (chapter.unlocked) continue

    const condition = chapter.unlockedCondition
    if (!condition) {
      chapter.unlocked = true
      continue
    }

    let canUnlock = true

    if (condition.previousChapterId) {
      const prevChapter = state.chapters.find(c => c.id === condition.previousChapterId)
      if (!prevChapter || !prevChapter.completed) {
        canUnlock = false
      }
    }

    if (condition.requiredStars && state.totalStars < condition.requiredStars) {
      canUnlock = false
    }

    if (condition.requiredAchievements) {
      const unlockedAchievements = loadAchievements()
      for (const achId of condition.requiredAchievements) {
        const ach = unlockedAchievements.find(a => a.id === achId)
        if (!ach?.unlocked) {
          canUnlock = false
          break
        }
      }
    }

    if (canUnlock) {
      chapter.unlocked = true
    }
  }
}

export function selectChapter(chapterId: string): boolean {
  const chapter = chapterState.chapters.find(c => c.id === chapterId)
  if (!chapter || !chapter.unlocked) return false
  chapterState.currentChapterId = chapterId
  chapterState.currentAreaId = null
  return true
}

export function selectArea(areaId: string): boolean {
  if (!chapterState.currentChapterId) return false
  const chapter = chapterState.chapters.find(c => c.id === chapterState.currentChapterId)
  if (!chapter) return false

  const area = chapter.areas.find(a => a.id === areaId)
  if (!area || !area.unlocked) return false

  chapterState.currentAreaId = areaId
  return true
}

export function getCurrentChapter(): Chapter | null {
  if (!chapterState.currentChapterId) return null
  return chapterState.chapters.find(c => c.id === chapterState.currentChapterId) || null
}

export function getCurrentArea(): AreaNode | null {
  if (!chapterState.currentChapterId || !chapterState.currentAreaId) return null
  const chapter = getCurrentChapter()
  if (!chapter) return null
  return chapter.areas.find(a => a.id === chapterState.currentAreaId) || null
}

export function getChapterById(chapterId: string): Chapter | null {
  return chapterState.chapters.find(c => c.id === chapterId) || null
}

export function getAreaById(chapterId: string, areaId: string): AreaNode | null {
  const chapter = getChapterById(chapterId)
  if (!chapter) return null
  return chapter.areas.find(a => a.id === areaId) || null
}

export function getChapterAreas(chapterId: string): AreaNode[] {
  const chapter = getChapterById(chapterId)
  return chapter?.areas || []
}

export function getUnlockedChapters(): Chapter[] {
  return chapterState.chapters.filter(c => c.unlocked)
}

export function completeRun(
  score: number,
  coins: number,
  distance: number,
  resources: Partial<Record<ResourceType, number>>
): ChapterRunResult | null {
  const area = getCurrentArea()
  const chapter = getCurrentChapter()
  if (!area || !chapter) return null

  const starsEarned = calculateStars(score, distance, {
    requiredScore: area.requiredScore,
    requiredDistance: area.requiredDistance,
    maxStars: area.maxStars
  })

  const isNewRecord = starsEarned > (area.stars || 0)

  const achievements = loadAchievements()
  const previouslyUnlocked = achievements.filter(a => a.unlocked).map(a => a.id)

  const gameState = {
    score,
    coins,
    distance,
    highScore: 0,
    isRunning: false,
    isGameOver: false,
    isPaused: false,
    speed: 0,
    baseSpeed: 0,
    maxSpeed: 0
  }

  const newAchievements = achievementsList
    .filter(a => !previouslyUnlocked.includes(a.id) && a.condition(gameState))
    .map(a => a.id)

  if (starsEarned > 0) {
    if (starsEarned > area.stars) {
      area.stars = starsEarned
    }
    area.completed = true

    const areaIndex = chapter.areas.findIndex(a => a.id === area.id)
    if (areaIndex >= 0 && areaIndex < chapter.areas.length - 1) {
      chapter.areas[areaIndex + 1].unlocked = true
    }

    if (chapter.areas.every(a => a.completed)) {
      chapter.completed = true
    }

    chapterState.totalStars = calculateTotalStars(chapterState.chapters)

    checkChapterUnlocks(chapterState)

    if (area.rewards) {
      if (area.rewards.coins && area.rewards.coins > 0) {
        addResource('coin', area.rewards.coins)
      }
      if (area.rewards.resources) {
        addResources(area.rewards.resources as Partial<Record<AllResourceType, number>>)
      }
    }
  }

  const result: ChapterRunResult = {
    chapterId: chapter.id,
    areaId: area.id,
    score,
    coins,
    distance,
    resources,
    starsEarned,
    newAchievements,
    isNewRecord
  }

  chapterState.lastRunResult = result

  return result
}

export function claimChapterBonus(chapterId: string): boolean {
  const chapter = getChapterById(chapterId)
  if (!chapter || !chapter.completed) return false
  if (chapterState.bonusClaimed[chapterId]) return false

  if (chapter.bonusRewards?.coins && chapter.bonusRewards.coins > 0) {
    addResource('coin', chapter.bonusRewards.coins)
  }
  if (chapter.bonusRewards?.resources) {
    addResources(chapter.bonusRewards.resources as Partial<Record<AllResourceType, number>>)
  }

  chapterState.bonusClaimed[chapterId] = true
  return true
}

export function isChapterBonusClaimed(chapterId: string): boolean {
  return !!chapterState.bonusClaimed[chapterId]
}

export function getTotalStars(): number {
  return chapterState.totalStars
}

export function getChapterStars(chapterId: string): number {
  const chapter = getChapterById(chapterId)
  if (!chapter) return 0
  return chapter.areas.reduce((sum, area) => sum + (area.stars || 0), 0)
}

export function getChapterMaxStars(chapterId: string): number {
  const chapter = getChapterById(chapterId)
  if (!chapter) return 0
  return chapter.areas.reduce((sum, area) => sum + area.maxStars, 0)
}

export function resetChapterState(): void {
  Object.assign(chapterState, createInitialState())
  saveState(chapterState)
}

export function getCurrentTheme(): ChapterTheme | null {
  const area = getCurrentArea()
  return area?.theme || null
}

export function getThemeForArea(areaId: string, chapterId?: string): ChapterTheme | null {
  const chId = chapterId || chapterState.currentChapterId
  if (!chId) return null
  const area = getAreaById(chId, areaId)
  return area?.theme || null
}

export { calculateTotalStars }