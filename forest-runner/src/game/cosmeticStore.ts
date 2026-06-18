import { reactive, watch } from 'vue'
import type {
  CosmeticState,
  CosmeticItem,
  CosmeticCategory,
  CosmeticColorConfig,
  CosmeticPreviewConfig
} from './types'
import {
  COSMETIC_ITEMS,
  getCosmeticById,
  getCosmeticsByCategory,
  DEFAULT_COLORS
} from './cosmeticData'
import { loadAchievements } from './achievements'
import { chapterState, getTotalStars } from './chapterStore'
import { battlePassState } from './battlePassStore'

const STORAGE_KEY = 'forest-runner-cosmetic'

function createInitialState(): CosmeticState {
  const cosmetics = COSMETIC_ITEMS.map(item => ({
    cosmeticId: item.id,
    unlocked: item.unlockCondition.type === 'default',
    equipped: false
  }))

  const equipped: Record<CosmeticCategory, string | null> = {
    skin: 'skin-default',
    hat: 'hat-red-bow',
    accessory: 'acc-scarf-red',
    trail: 'trail-none',
    emote: 'emote-wave',
    title: 'title-none'
  }

  cosmetics.forEach(c => {
    if (equipped[c.cosmeticId.split('-')[0] as CosmeticCategory] === c.cosmeticId) {
      c.equipped = true
    }
  })

  return {
    cosmetics,
    equipped,
    lastNewCosmeticId: null,
    showUnlockAnimation: false
  }
}

function loadState(): CosmeticState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<CosmeticState>
      const initial = createInitialState()

      const state: CosmeticState = {
        cosmetics: parsed.cosmetics || initial.cosmetics,
        equipped: parsed.equipped || initial.equipped,
        lastNewCosmeticId: null,
        showUnlockAnimation: false
      }

      state.cosmetics.forEach(c => {
        const item = getCosmeticById(c.cosmeticId)
        if (item && item.unlockCondition.type === 'default') {
          c.unlocked = true
        }
      })

      checkAllUnlocks(state)

      return state
    }
  } catch (e) {
    console.error('Failed to load cosmetic state:', e)
  }
  return createInitialState()
}

function saveState(state: CosmeticState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cosmetics: state.cosmetics,
      equipped: state.equipped
    }))
  } catch (e) {
    console.error('Failed to save cosmetic state:', e)
  }
}

export const cosmeticState = reactive<CosmeticState>(loadState())

watch(
  () => cosmeticState,
  (newState) => {
    saveState(newState)
  },
  { deep: true }
)

function checkUnlockCondition(item: CosmeticItem): boolean {
  const condition = item.unlockCondition

  switch (condition.type) {
    case 'default':
      return true

    case 'achievement': {
      const achievements = loadAchievements()
      const achievement = achievements.find(a => a.id === condition.value)
      return achievement?.unlocked || false
    }

    case 'chapter': {
      const chapterId = condition.value as string
      const chapter = chapterState.chapters.find(c => c.id === chapterId)
      return chapter?.completed || false
    }

    case 'battle_pass': {
      const value = condition.value as string
      const [tier, levelStr] = value.split('-')
      const level = parseInt(levelStr, 10)

      if (battlePassState.level < level) return false

      if (tier === 'premium' && !battlePassState.premiumUnlocked) return true
      if (tier === 'free') return true

      return false
    }

    case 'stars': {
      const requiredStars = condition.value as number
      return getTotalStars() >= requiredStars
    }

    case 'distance': {
      const requiredDistance = condition.value as number
      return battlePassState.totalDistance >= requiredDistance
    }

    case 'shop':
      return false

    case 'event':
      return false

    default:
      return false
  }
}

function checkAllUnlocks(state: CosmeticState): string[] {
  const newlyUnlocked: string[] = []

  state.cosmetics.forEach(c => {
    if (c.unlocked) return

    const item = getCosmeticById(c.cosmeticId)
    if (!item) return

    if (checkUnlockCondition(item)) {
      c.unlocked = true
      c.unlockedAt = Date.now()
      newlyUnlocked.push(c.cosmeticId)
    }
  })

  return newlyUnlocked
}

export function checkCosmeticUnlocks(): string[] {
  const newlyUnlocked = checkAllUnlocks(cosmeticState)

  if (newlyUnlocked.length > 0) {
    cosmeticState.lastNewCosmeticId = newlyUnlocked[newlyUnlocked.length - 1]
    cosmeticState.showUnlockAnimation = true
  }

  return newlyUnlocked
}

export function equipCosmetic(cosmeticId: string): boolean {
  const cosmetic = getCosmeticById(cosmeticId)
  if (!cosmetic) return false

  const instance = cosmeticState.cosmetics.find(c => c.cosmeticId === cosmeticId)
  if (!instance?.unlocked) return false

  const category = cosmetic.category
  const currentEquipped = cosmeticState.equipped[category]

  if (currentEquipped) {
    const currentInstance = cosmeticState.cosmetics.find(c => c.cosmeticId === currentEquipped)
    if (currentInstance) {
      currentInstance.equipped = false
    }
  }

  cosmeticState.equipped[category] = cosmeticId
  instance.equipped = true

  return true
}

export function unequipCosmetic(category: CosmeticCategory): boolean {
  const currentEquipped = cosmeticState.equipped[category]
  if (!currentEquipped) return false

  const instance = cosmeticState.cosmetics.find(c => c.cosmeticId === currentEquipped)
  if (instance) {
    instance.equipped = false
  }

  cosmeticState.equipped[category] = null
  return true
}

export function getEquippedCosmetic(category: CosmeticCategory): CosmeticItem | null {
  const equippedId = cosmeticState.equipped[category]
  if (!equippedId) return null
  return getCosmeticById(equippedId)
}

export function getEquippedColors(): CosmeticColorConfig {
  const skin = getEquippedCosmetic('skin')
  const hat = getEquippedCosmetic('hat')

  const baseColors = skin?.colors || DEFAULT_COLORS
  const hatColors = hat?.colors

  return {
    ...baseColors,
    hat: hatColors?.hat || baseColors.hat
  }
}

export function getEquippedTrailColors(): { trailColor?: string; particleColor?: string } {
  const trail = getEquippedCosmetic('trail')
  if (!trail || trail.id === 'trail-none') return {}
  return {
    trailColor: trail.trailColor,
    particleColor: trail.particleColor
  }
}

export function getEquippedTitle(): string | null {
  const title = getEquippedCosmetic('title')
  return title?.titleText || null
}

export function getPreviewConfig(): CosmeticPreviewConfig {
  const colors = getEquippedColors()
  const trail = getEquippedTrailColors()
  const hat = getEquippedCosmetic('hat')
  const accessory = getEquippedCosmetic('accessory')

  return {
    colors,
    trailColor: trail.trailColor,
    particleColor: trail.particleColor,
    showHat: hat?.id !== 'hat-none',
    showAccessory: accessory?.id !== 'acc-none',
    showTrail: !!trail.trailColor
  }
}

export function getAllCosmeticsWithStatus(): Array<CosmeticItem & { unlocked: boolean; equipped: boolean }> {
  return COSMETIC_ITEMS.map(item => {
    const instance = cosmeticState.cosmetics.find(c => c.cosmeticId === item.id)
    return {
      ...item,
      unlocked: instance?.unlocked || false,
      equipped: instance?.equipped || false
    }
  }).sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getCosmeticsWithStatusByCategory(category: CosmeticCategory): Array<CosmeticItem & { unlocked: boolean; equipped: boolean }> {
  return getCosmeticsByCategory(category).map(item => {
    const instance = cosmeticState.cosmetics.find(c => c.cosmeticId === item.id)
    return {
      ...item,
      unlocked: instance?.unlocked || false,
      equipped: instance?.equipped || false
    }
  })
}

export function getUnlockedCount(): number {
  return cosmeticState.cosmetics.filter(c => c.unlocked).length
}

export function getTotalCount(): number {
  return COSMETIC_ITEMS.length
}

export function hideUnlockAnimation(): void {
  cosmeticState.showUnlockAnimation = false
  cosmeticState.lastNewCosmeticId = null
}

export function resetCosmeticState(): void {
  Object.assign(cosmeticState, createInitialState())
  saveState(cosmeticState)
}
