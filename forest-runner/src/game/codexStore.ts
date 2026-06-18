import { reactive, watch } from 'vue'
import type { StoryCodexState, CodexEntry } from './types'
import { CODEX_ENTRIES, CODEX_CATEGORIES } from './storyData'

const CODEX_STORAGE_KEY = 'forest-runner-codex-state'

function createInitialCodexState(): StoryCodexState {
  const entries: Record<string, CodexEntry> = {}
  const categories: Record<string, string[]> = {}

  for (const [id, entry] of Object.entries(CODEX_ENTRIES)) {
    entries[id] = { ...entry, unlocked: false }
    
    const category = entry.category
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(id)
  }

  return {
    entries,
    totalUnlocked: 0,
    categories
  }
}

function loadCodexState(): StoryCodexState {
  try {
    const saved = localStorage.getItem(CODEX_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const state = createInitialCodexState()
      
      if (parsed.unlockedEntries) {
        for (const id of parsed.unlockedEntries) {
          if (state.entries[id]) {
            state.entries[id].unlocked = true
            state.entries[id].unlockedAt = parsed.unlockedAt?.[id] || Date.now()
          }
        }
      }
      
      state.totalUnlocked = Object.values(state.entries).filter(e => e.unlocked).length
      return state
    }
  } catch (e) {
    console.error('Failed to load codex state:', e)
  }
  return createInitialCodexState()
}

function saveCodexState(state: StoryCodexState): void {
  try {
    const unlockedEntries: string[] = []
    const unlockedAt: Record<string, number> = {}
    
    for (const [id, entry] of Object.entries(state.entries)) {
      if (entry.unlocked) {
        unlockedEntries.push(id)
        if (entry.unlockedAt) {
          unlockedAt[id] = entry.unlockedAt
        }
      }
    }
    
    localStorage.setItem(CODEX_STORAGE_KEY, JSON.stringify({
      unlockedEntries,
      unlockedAt
    }))
  } catch (e) {
    console.error('Failed to save codex state:', e)
  }
}

export const codexState = reactive<StoryCodexState>(loadCodexState())

watch(
  () => codexState.entries,
  () => {
    codexState.totalUnlocked = Object.values(codexState.entries).filter(e => e.unlocked).length
    saveCodexState(codexState)
  },
  { deep: true }
)

export function unlockCodexEntry(entryId: string): CodexEntry | null {
  const entry = codexState.entries[entryId]
  if (!entry || entry.unlocked) {
    return entry || null
  }

  entry.unlocked = true
  entry.unlockedAt = Date.now()
  codexState.totalUnlocked = Object.values(codexState.entries).filter(e => e.unlocked).length

  return entry
}

export function isCodexUnlocked(entryId: string): boolean {
  return codexState.entries[entryId]?.unlocked || false
}

export function getCodexEntry(entryId: string): CodexEntry | null {
  return codexState.entries[entryId] || null
}

export function getEntriesByCategory(category: string): CodexEntry[] {
  const entryIds = codexState.categories[category] || []
  return entryIds.map(id => codexState.entries[id]).filter(Boolean)
}

export function getCategoryProgress(category: string): { unlocked: number; total: number } {
  const entries = getEntriesByCategory(category)
  return {
    unlocked: entries.filter(e => e.unlocked).length,
    total: entries.length
  }
}

export const RARITY_CONFIG: Record<string, { name: string; color: string; bgColor: string; borderColor: string }> = {
  common: {
    name: '普通',
    color: '#666666',
    bgColor: '#f5f5f5',
    borderColor: '#cccccc'
  },
  rare: {
    name: '稀有',
    color: '#1976d2',
    bgColor: '#e3f2fd',
    borderColor: '#64b5f6'
  },
  epic: {
    name: '史诗',
    color: '#7b1fa2',
    bgColor: '#f3e5f5',
    borderColor: '#ba68c8'
  },
  legendary: {
    name: '传说',
    color: '#ff6f00',
    bgColor: '#fff3e0',
    borderColor: '#ffb74d'
  }
}

export function getRarityConfig(rarity: string) {
  return RARITY_CONFIG[rarity] || RARITY_CONFIG.common
}

export function getCategoryInfo(category: string) {
  return CODEX_CATEGORIES[category] || { name: category, icon: '📁' }
}

export function getAllCategories() {
  return Object.keys(CODEX_CATEGORIES)
}

export function getTotalProgress() {
  const allEntries = Object.values(codexState.entries)
  return {
    unlocked: allEntries.filter(e => e.unlocked).length,
    total: allEntries.length
  }
}

export function resetCodexProgress(): void {
  Object.assign(codexState, createInitialCodexState())
}
