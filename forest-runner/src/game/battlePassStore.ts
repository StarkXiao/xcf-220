import { reactive, watch } from 'vue'
import type {
  BattlePassState,
  BattlePassReward,
  Skin,
  DailyTaskType,
  AllResourceType
} from './types'
import {
  CURRENT_SEASON_ID,
  generateDailyTasks,
  getLevelFromPoints,
  BATTLE_PASS_REWARDS,
  SKINS,
  getSkinById,
  getCurrentSeason,
  getRewardsForLevel
} from './battlePassData'
import { addResource, hasResources, consumeResources } from './campStore'
import { checkCosmeticUnlocks } from './cosmeticStore'

const STORAGE_KEY = 'forest-runner-battle-pass'

const DAY_MS = 24 * 60 * 60 * 1000

function createInitialState(): BattlePassState {
  return {
    currentSeasonId: CURRENT_SEASON_ID,
    points: 0,
    level: 0,
    premiumUnlocked: false,
    claimedFreeRewards: [],
    claimedPremiumRewards: [],
    dailyTasks: generateDailyTasks(),
    lastDailyReset: Date.now(),
    totalPointsEarned: 0,
    gamesPlayed: 0,
    totalDistance: 0,
    totalCoins: 0,
    totalStars: 0,
    totalJumps: 0,
    unlockedSkins: ['skin-default'],
    equippedSkinId: 'skin-default',
    unlockedTitles: [],
    equippedTitle: null
  }
}

function loadState(): BattlePassState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<BattlePassState>
      const initial = createInitialState()
      
      const state: BattlePassState = {
        currentSeasonId: parsed.currentSeasonId || initial.currentSeasonId,
        points: parsed.points || 0,
        level: parsed.level || 0,
        premiumUnlocked: parsed.premiumUnlocked || false,
        claimedFreeRewards: parsed.claimedFreeRewards || [],
        claimedPremiumRewards: parsed.claimedPremiumRewards || [],
        dailyTasks: parsed.dailyTasks && parsed.dailyTasks.length > 0 ? parsed.dailyTasks : initial.dailyTasks,
        lastDailyReset: parsed.lastDailyReset || Date.now(),
        totalPointsEarned: parsed.totalPointsEarned || 0,
        gamesPlayed: parsed.gamesPlayed || 0,
        totalDistance: parsed.totalDistance || 0,
        totalCoins: parsed.totalCoins || 0,
        totalStars: parsed.totalStars || 0,
        totalJumps: parsed.totalJumps || 0,
        unlockedSkins: parsed.unlockedSkins || ['skin-default'],
        equippedSkinId: parsed.equippedSkinId || 'skin-default',
        unlockedTitles: parsed.unlockedTitles || [],
        equippedTitle: parsed.equippedTitle || null
      }
      
      state.level = getLevelFromPoints(state.points)
      
      if (shouldResetDaily(state.lastDailyReset)) {
        state.dailyTasks = generateDailyTasks()
        state.lastDailyReset = Date.now()
      }
      
      return state
    }
  } catch (e) {
    console.error('Failed to load battle pass state:', e)
  }
  return createInitialState()
}

function shouldResetDaily(lastReset: number): boolean {
  const now = Date.now()
  const lastResetDate = new Date(lastReset)
  const nowDate = new Date(now)
  
  lastResetDate.setHours(0, 0, 0, 0)
  nowDate.setHours(0, 0, 0, 0)
  
  return nowDate.getTime() - lastResetDate.getTime() >= DAY_MS
}

function saveState(state: BattlePassState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentSeasonId: state.currentSeasonId,
      points: state.points,
      level: state.level,
      premiumUnlocked: state.premiumUnlocked,
      claimedFreeRewards: state.claimedFreeRewards,
      claimedPremiumRewards: state.claimedPremiumRewards,
      dailyTasks: state.dailyTasks,
      lastDailyReset: state.lastDailyReset,
      totalPointsEarned: state.totalPointsEarned,
      gamesPlayed: state.gamesPlayed,
      totalDistance: state.totalDistance,
      totalCoins: state.totalCoins,
      totalStars: state.totalStars,
      totalJumps: state.totalJumps,
      unlockedSkins: state.unlockedSkins,
      equippedSkinId: state.equippedSkinId,
      unlockedTitles: state.unlockedTitles,
      equippedTitle: state.equippedTitle
    }))
  } catch (e) {
    console.error('Failed to save battle pass state:', e)
  }
}

export const battlePassState = reactive<BattlePassState>(loadState())

watch(
  () => battlePassState,
  (newState) => {
    saveState(newState)
  },
  { deep: true }
)

function updateLevel(): void {
  battlePassState.level = getLevelFromPoints(battlePassState.points)
}

export function addPoints(amount: number): void {
  if (amount <= 0) return
  const season = getCurrentSeason()
  const maxPoints = season.maxLevel * season.pointsPerLevel
  const oldLevel = battlePassState.level
  
  battlePassState.points = Math.min(battlePassState.points + amount, maxPoints)
  battlePassState.totalPointsEarned += amount
  updateLevel()
  
  if (battlePassState.level > oldLevel) {
    checkCosmeticUnlocks()
  }
}

export function checkAndResetDailyTasks(): void {
  if (shouldResetDaily(battlePassState.lastDailyReset)) {
    battlePassState.dailyTasks = generateDailyTasks()
    battlePassState.lastDailyReset = Date.now()
  }
}

export function updateDailyTaskProgress(taskType: DailyTaskType, amount: number): void {
  checkAndResetDailyTasks()
  
  for (const task of battlePassState.dailyTasks) {
    if (task.type !== taskType) continue
    if (task.completed) continue
    
    task.progress = Math.min(task.progress + amount, task.target)
    if (task.progress >= task.target) {
      task.completed = true
    }
  }
}

export function recordRunStats(
  distance: number,
  coins: number,
  stars: number,
  jumps: number,
  isChapterRun: boolean
): void {
  battlePassState.gamesPlayed++
  battlePassState.totalDistance += distance
  battlePassState.totalCoins += coins
  battlePassState.totalStars += stars
  battlePassState.totalJumps += jumps
  
  updateDailyTaskProgress('run_distance', distance)
  updateDailyTaskProgress('collect_coins', coins)
  updateDailyTaskProgress('collect_stars', stars)
  updateDailyTaskProgress('play_games', 1)
  updateDailyTaskProgress('jump_count', jumps)
  
  if (isChapterRun) {
    updateDailyTaskProgress('complete_chapter', 1)
  }
  
  const basePoints = Math.floor(distance / 50) + Math.floor(coins / 5) + stars * 10
  if (basePoints > 0) {
    addPoints(basePoints)
  }
}

export function claimDailyTask(taskId: string): boolean {
  const task = battlePassState.dailyTasks.find(t => t.id === taskId)
  if (!task || !task.completed || task.claimed) return false
  
  task.claimed = true
  addPoints(task.rewardPoints)
  return true
}

export function claimAllCompletedDailyTasks(): number {
  let count = 0
  for (const task of battlePassState.dailyTasks) {
    if (task.completed && !task.claimed) {
      if (claimDailyTask(task.id)) {
        count++
      }
    }
  }
  return count
}

export function canClaimReward(rewardId: string): boolean {
  const reward = BATTLE_PASS_REWARDS.find(r => r.id === rewardId)
  if (!reward) return false
  if (battlePassState.level < reward.level) return false
  
  if (reward.isPremium) {
    if (!battlePassState.premiumUnlocked) return false
    return !battlePassState.claimedPremiumRewards.includes(rewardId)
  } else {
    return !battlePassState.claimedFreeRewards.includes(rewardId)
  }
}

export function claimReward(rewardId: string): BattlePassReward | null {
  if (!canClaimReward(rewardId)) return null
  
  const reward = BATTLE_PASS_REWARDS.find(r => r.id === rewardId)
  if (!reward) return null
  
  switch (reward.type) {
    case 'coin':
      if (reward.amount) {
        addResource('coin', reward.amount)
      }
      break
    case 'resource':
      if (reward.amount && reward.resourceType) {
        addResource(reward.resourceType, reward.amount)
      }
      break
    case 'skin':
      if (reward.skinId && !battlePassState.unlockedSkins.includes(reward.skinId)) {
        battlePassState.unlockedSkins.push(reward.skinId)
      }
      break
    case 'pet_egg':
      break
    case 'title':
      if (reward.title && !battlePassState.unlockedTitles.includes(reward.title)) {
        battlePassState.unlockedTitles.push(reward.title)
      }
      break
  }
  
  if (reward.isPremium) {
    battlePassState.claimedPremiumRewards.push(rewardId)
  } else {
    battlePassState.claimedFreeRewards.push(rewardId)
  }
  
  return reward
}

export function claimAllAvailableRewards(): BattlePassReward[] {
  const claimed: BattlePassReward[] = []
  
  for (let level = 1; level <= battlePassState.level; level++) {
    const rewards = getRewardsForLevel(level)
    for (const reward of rewards) {
      if (canClaimReward(reward.id)) {
        const result = claimReward(reward.id)
        if (result) claimed.push(result)
      }
    }
  }
  
  return claimed
}

export function purchasePremium(): boolean {
  const season = getCurrentSeason()
  if (battlePassState.premiumUnlocked) return false
  
  const cost = { coin: season.premiumPrice } as Partial<Record<AllResourceType, number>>
  if (!hasResources(cost)) return false
  if (!consumeResources(cost)) return false
  
  battlePassState.premiumUnlocked = true
  checkCosmeticUnlocks()
  return true
}

export function equipSkin(skinId: string): boolean {
  if (!battlePassState.unlockedSkins.includes(skinId)) return false
  
  battlePassState.equippedSkinId = skinId
  return true
}

export function getEquippedSkin(): Skin | null {
  const equippedId = battlePassState.equippedSkinId
  if (!equippedId) return null
  return getSkinById(equippedId)
}

export function getEquippedSkinColors(): { body: string; head: string; hat: string; accent: string; skin: string; shoes: string } {
  const skin = getEquippedSkin()
  return skin?.colors || { body: '#FF6B6B', head: '#FFE4C4', hat: '#FFE66D', accent: '#FFFFFF', skin: '#FFE4C4', shoes: '#8B4513' }
}

export function getAllSkinsWithUnlockStatus(): Skin[] {
  return SKINS.map(skin => ({
    ...skin,
    unlocked: battlePassState.unlockedSkins.includes(skin.id),
    isEquipped: battlePassState.equippedSkinId === skin.id
  }))
}

export function equipTitle(title: string): boolean {
  if (!battlePassState.unlockedTitles.includes(title)) return false
  battlePassState.equippedTitle = title
  return true
}

export function unequipTitle(): void {
  battlePassState.equippedTitle = null
}

export function getCompletedDailyTasksCount(): number {
  checkAndResetDailyTasks()
  return battlePassState.dailyTasks.filter(t => t.completed).length
}

export function getUnclaimedDailyTasksCount(): number {
  checkAndResetDailyTasks()
  return battlePassState.dailyTasks.filter(t => t.completed && !t.claimed).length
}

export function getUnclaimedRewardsCount(): number {
  let count = 0
  for (let level = 1; level <= battlePassState.level; level++) {
    const rewards = getRewardsForLevel(level)
    for (const reward of rewards) {
      if (canClaimReward(reward.id)) {
        count++
      }
    }
  }
  return count
}

export function hasAnyUnclaimed(): boolean {
  return getUnclaimedDailyTasksCount() > 0 || getUnclaimedRewardsCount() > 0
}

export function getSeasonProgress(): {
  currentLevel: number
  maxLevel: number
  currentPoints: number
  pointsForCurrentLevel: number
  pointsForNextLevel: number
  percent: number
  daysLeft: number
} {
  const season = getCurrentSeason()
  const currentLevel = battlePassState.level
  const pointsPerLevel = season.pointsPerLevel
  const currentPoints = battlePassState.points
  const pointsForCurrentLevel = currentLevel * pointsPerLevel
  const pointsForNextLevel = Math.min((currentLevel + 1) * pointsPerLevel, season.maxLevel * pointsPerLevel)
  
  const pointsInLevel = currentPoints - pointsForCurrentLevel
  const neededForNext = pointsForNextLevel - pointsForCurrentLevel
  const percent = neededForNext > 0 ? Math.floor((pointsInLevel / neededForNext) * 100) : 100
  
  const daysLeft = Math.max(0, Math.ceil((season.endDate - Date.now()) / DAY_MS))
  
  return {
    currentLevel,
    maxLevel: season.maxLevel,
    currentPoints,
    pointsForCurrentLevel,
    pointsForNextLevel,
    percent,
    daysLeft
  }
}

export function resetBattlePassState(): void {
  Object.assign(battlePassState, createInitialState())
  saveState(battlePassState)
}
