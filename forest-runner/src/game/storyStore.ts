import { reactive, watch } from 'vue'
import type {
  StoryState,
  StoryEvent,
  StoryDialogue,
  StoryEffect,
  StoryReward,
  ActiveStoryEvent,
  StoryEffectType,
  ChapterTheme
} from './types'
import { STORY_EVENTS } from './storyData'

const STORY_STORAGE_KEY = 'forest-runner-story-state'

function createInitialStoryState(): StoryState {
  return {
    triggeredEvents: {},
    activeEvent: null,
    eventHistory: [],
    activeEffects: []
  }
}

function loadStoryState(): StoryState {
  try {
    const saved = localStorage.getItem(STORY_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as StoryState
      return {
        triggeredEvents: parsed.triggeredEvents || {},
        activeEvent: null,
        eventHistory: parsed.eventHistory || [],
        activeEffects: []
      }
    }
  } catch (e) {
    console.error('Failed to load story state:', e)
  }
  return createInitialStoryState()
}

function saveStoryState(state: StoryState): void {
  try {
    const toSave = {
      triggeredEvents: state.triggeredEvents,
      eventHistory: state.eventHistory
    }
    localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save story state:', e)
  }
}

export const storyState = reactive<StoryState>(loadStoryState())

watch(
  () => [storyState.triggeredEvents, storyState.eventHistory],
  () => {
    saveStoryState(storyState)
  },
  { deep: true }
)

const pendingEffectsQueue: { effects: StoryEffect[]; source: string }[] = []
const pendingRewardsQueue: StoryReward[] = []

export function triggerStoryCheck(
  currentDistance: number,
  theme: ChapterTheme | null
): StoryEvent | null {
  if (storyState.activeEvent) return null

  const availableEvents = STORY_EVENTS.filter(event => {
    if (event.applicableThemes && theme && !event.applicableThemes.includes(theme)) {
      return false
    }

    const lastTriggered = storyState.triggeredEvents[event.id] || 0
    const cooldownDistance = event.triggerDistance * 2
    if (currentDistance - lastTriggered < cooldownDistance) {
      return false
    }

    if (currentDistance < event.triggerDistance) {
      return false
    }

    return Math.random() < event.triggerChance
  })

  if (availableEvents.length === 0) return null

  const sortedByDistance = availableEvents.sort(
    (a, b) => Math.abs(a.triggerDistance - currentDistance) - Math.abs(b.triggerDistance - currentDistance)
  )

  const selectedEvent = sortedByDistance[0]
  return selectedEvent
}

export function startStoryEvent(event: StoryEvent): ActiveStoryEvent {
  const activeEvent: ActiveStoryEvent = {
    eventId: event.id,
    currentDialogueId: event.startDialogueId,
    startTime: Date.now(),
    paused: true,
    history: []
  }

  storyState.activeEvent = activeEvent
  storyState.triggeredEvents[event.id] = Date.now()

  return activeEvent
}

export function getCurrentDialogue(event: StoryEvent, activeEvent: ActiveStoryEvent): StoryDialogue | null {
  return event.dialogues.find(d => d.id === activeEvent.currentDialogueId) || null
}

export function getStoryEventById(eventId: string): StoryEvent | null {
  return STORY_EVENTS.find(e => e.id === eventId) || null
}

export function advanceDialogue(nextDialogueId?: string): void {
  if (!storyState.activeEvent) return

  const event = getStoryEventById(storyState.activeEvent.eventId)
  if (!event) return

  const currentDialogue = getCurrentDialogue(event, storyState.activeEvent)
  if (!currentDialogue) return

  storyState.activeEvent.history.push({
    dialogueId: storyState.activeEvent.currentDialogueId
  })

  const targetId = nextDialogueId || currentDialogue.nextDialogueId

  if (currentDialogue.autoReward) {
    pendingRewardsQueue.push(currentDialogue.autoReward)
  }
  if (currentDialogue.autoEffects && currentDialogue.autoEffects.length > 0) {
    pendingEffectsQueue.push({
      effects: currentDialogue.autoEffects,
      source: event.id
    })
  }

  if (currentDialogue.isEnd || !targetId) {
    endStoryEvent()
    return
  }

  storyState.activeEvent.currentDialogueId = targetId
}

export function makeChoice(choiceId: string): { consequenceText?: string; unlockedCodex?: string } | null {
  if (!storyState.activeEvent) return null

  const event = getStoryEventById(storyState.activeEvent.eventId)
  if (!event) return null

  const currentDialogue = getCurrentDialogue(event, storyState.activeEvent)
  if (!currentDialogue || !currentDialogue.choices) return null

  const choice = currentDialogue.choices.find(c => c.id === choiceId)
  if (!choice) return null

  storyState.activeEvent.history.push({
    dialogueId: storyState.activeEvent.currentDialogueId,
    choiceId
  })

  if (choice.effects && choice.effects.length > 0) {
    pendingEffectsQueue.push({
      effects: choice.effects,
      source: `${event.id}:${choiceId}`
    })
  }

  if (choice.rewards) {
    pendingRewardsQueue.push(choice.rewards)
  }

  advanceDialogue(choice.nextDialogueId)

  return {
    consequenceText: choice.consequenceText,
    unlockedCodex: choice.unlocksCodex
  }
}

export function endStoryEvent(): void {
  if (!storyState.activeEvent) return

  const choicesMade = storyState.activeEvent.history
    .filter(h => h.choiceId)
    .map(h => h.choiceId!)

  const totalRewards: StoryReward = {}
  for (const reward of pendingRewardsQueue) {
    if (reward.coins) totalRewards.coins = (totalRewards.coins || 0) + reward.coins
    if (reward.score) totalRewards.score = (totalRewards.score || 0) + reward.score
    if (reward.resources) {
      if (!totalRewards.resources) totalRewards.resources = {}
      for (const [type, amount] of Object.entries(reward.resources)) {
        totalRewards.resources[type as keyof typeof totalRewards.resources] = 
          (totalRewards.resources[type as keyof typeof totalRewards.resources] || 0) + (amount || 0)
      }
    }
  }

  storyState.eventHistory.push({
    eventId: storyState.activeEvent.eventId,
    completedAt: Date.now(),
    choicesMade,
    rewardsClaimed: totalRewards
  })

  storyState.activeEvent = null
}

export function processPendingEffects(): { effects: StoryEffect[]; source: string }[] {
  const result = [...pendingEffectsQueue]
  pendingEffectsQueue.length = 0
  return result
}

export function processPendingRewards(): StoryReward[] {
  const result = [...pendingRewardsQueue]
  pendingRewardsQueue.length = 0
  return result
}

export function addActiveEffect(
  type: StoryEffectType,
  value: number,
  duration: number | undefined,
  source: string
): void {
  if (duration && duration > 0) {
    const existing = storyState.activeEffects.find(
      e => e.type === type && e.source === source
    )
    if (existing) {
      existing.remainingFrames = Math.max(existing.remainingFrames, duration)
      existing.value = Math.max(existing.value, value)
    } else {
      storyState.activeEffects.push({
        type,
        value,
        remainingFrames: duration,
        source
      })
    }
  } else {
    const existing = storyState.activeEffects.find(
      e => e.type === type && !e.remainingFrames && e.source === source
    )
    if (!existing) {
      storyState.activeEffects.push({
        type,
        value,
        remainingFrames: 0,
        source
      })
    }
  }
}

export function updateActiveEffects(dt: number): void {
  storyState.activeEffects = storyState.activeEffects.filter(effect => {
    if (effect.remainingFrames > 0) {
      effect.remainingFrames -= dt
      return effect.remainingFrames > 0
    }
    return true
  })
}

export function getActiveEffectValue(type: StoryEffectType): number {
  let totalValue = 0
  for (const effect of storyState.activeEffects) {
    if (effect.type === type) {
      if (type === 'score_boost' || type === 'coin_bonus' || type === 'resource_bonus' || 
          type === 'speed_boost' || type === 'jump_boost' || type === 'buff_speed' || 
          type === 'buff_jump' || type === 'buff_magnet') {
        totalValue = Math.max(totalValue, effect.value)
      } else if (type === 'slow_down' || type === 'coin_penalty' || type === 'score_penalty') {
        totalValue = Math.max(totalValue, effect.value)
      } else {
        totalValue = Math.max(totalValue, effect.value)
      }
    }
  }
  return totalValue
}

export function hasActiveEffect(type: StoryEffectType): boolean {
  return storyState.activeEffects.some(e => e.type === type)
}

export function isStoryActive(): boolean {
  return storyState.activeEvent !== null
}

export function isStoryPaused(): boolean {
  return storyState.activeEvent?.paused || false
}

export function clearActiveEffectsForNewRun(): void {
  storyState.activeEffects = []
  pendingEffectsQueue.length = 0
  pendingRewardsQueue.length = 0
  storyState.activeEvent = null
}

export function resetStoryProgress(): void {
  Object.assign(storyState, createInitialStoryState())
}
