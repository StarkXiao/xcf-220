import { reactive, watch } from 'vue'
import type {
  CampState,
  AllResourceType,
  BuildingType,
  ProcessingTask,
  ActiveBuff,
  ResourceType as ResourceTypeAlias
} from './types'
import { BUILDINGS, RECIPES } from './campData'

const STORAGE_KEY = 'forest-runner-camp-state'

function createInitialInventory(): CampState['inventory'] {
  const resources: Record<AllResourceType, number> = {
    wood: 0,
    stone: 0,
    herb: 0,
    crystal: 0,
    berry: 0,
    plank: 0,
    brick: 0,
    potion_herb: 0,
    magic_dust: 0,
    jam: 0,
    coin: 0
  }
  return { resources }
}

function createInitialState(): CampState {
  return {
    inventory: createInitialInventory(),
    buildings: JSON.parse(JSON.stringify(BUILDINGS)),
    processingTasks: [],
    unlockedRecipes: RECIPES.filter(r => r.unlocked).map(r => r.id),
    lastRunRewards: null
  }
}

function loadState(): CampState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as CampState
      parsed.buildings = parsed.buildings.map((b, i) => ({
        ...BUILDINGS[i],
        currentLevel: b.currentLevel
      }))
      if (!parsed.inventory) {
        parsed.inventory = createInitialInventory()
      }
      if (!parsed.processingTasks) {
        parsed.processingTasks = []
      }
      if (!parsed.unlockedRecipes) {
        parsed.unlockedRecipes = RECIPES.filter(r => r.unlocked).map(r => r.id)
      }
      return parsed
    }
  } catch (e) {
    console.error('Failed to load camp state:', e)
  }
  return createInitialState()
}

function saveState(state: CampState): void {
  try {
    const toSave = {
      inventory: state.inventory,
      buildings: state.buildings.map(b => ({
        id: b.id,
        currentLevel: b.currentLevel
      })),
      processingTasks: state.processingTasks,
      unlockedRecipes: state.unlockedRecipes,
      lastRunRewards: state.lastRunRewards
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save camp state:', e)
  }
}

export const campState = reactive<CampState>(loadState())

watch(
  () => campState,
  (newState) => {
    saveState(newState)
  },
  { deep: true }
)

export function addResource(type: AllResourceType, amount: number): void {
  campState.inventory.resources[type] = (campState.inventory.resources[type] || 0) + amount
}

export function addResources(resources: Partial<Record<AllResourceType, number>>): void {
  for (const [type, amount] of Object.entries(resources)) {
    if (amount && amount > 0) {
      addResource(type as AllResourceType, amount)
    }
  }
}

export function removeResource(type: AllResourceType, amount: number): boolean {
  if (campState.inventory.resources[type] >= amount) {
    campState.inventory.resources[type] -= amount
    return true
  }
  return false
}

export function hasResources(cost: Partial<Record<AllResourceType, number>>): boolean {
  for (const [type, amount] of Object.entries(cost)) {
    if (amount && (campState.inventory.resources[type as AllResourceType] || 0) < amount) {
      return false
    }
  }
  return true
}

export function consumeResources(cost: Partial<Record<AllResourceType, number>>): boolean {
  if (!hasResources(cost)) {
    return false
  }
  for (const [type, amount] of Object.entries(cost)) {
    if (amount) {
      removeResource(type as AllResourceType, amount)
    }
  }
  return true
}

export function getResourceAmount(type: AllResourceType): number {
  return campState.inventory.resources[type] || 0
}

export function upgradeBuilding(buildingId: BuildingType): boolean {
  const building = campState.buildings.find(b => b.id === buildingId)
  if (!building) return false
  if (building.currentLevel >= building.maxLevel) return false

  const nextLevel = building.levels[building.currentLevel]
  if (!consumeResources(nextLevel.cost)) return false

  building.currentLevel++
  checkRecipeUnlocks()
  return true
}

export function getBuildingLevel(buildingId: BuildingType): number {
  const building = campState.buildings.find(b => b.id === buildingId)
  return building?.currentLevel || 0
}

export function getActiveBuffs(): ActiveBuff[] {
  const buffs: ActiveBuff[] = []
  for (const building of campState.buildings) {
    if (building.currentLevel > 0) {
      for (let i = 0; i < building.currentLevel; i++) {
        const level = building.levels[i]
        buffs.push({
          type: level.bonus.type,
          value: level.bonus.value,
          source: building.name
        })
      }
    }
  }
  return buffs
}

export function getBuffValue(buffType: string): number {
  return getActiveBuffs()
    .filter(b => b.type === buffType)
    .reduce((sum, b) => sum + b.value, 0)
}

export function getCombinedBuffs(): Record<string, number> {
  const buffs = getActiveBuffs()
  const combined: Record<string, number> = {}
  for (const buff of buffs) {
    combined[buff.type] = (combined[buff.type] || 0) + buff.value
  }
  return combined
}

export function startProcessing(recipeId: string): boolean {
  const recipe = RECIPES.find(r => r.id === recipeId)
  if (!recipe) return false
  if (!campState.unlockedRecipes.includes(recipeId)) return false

  if (recipe.requiredBuilding) {
    const buildingLevel = getBuildingLevel(recipe.requiredBuilding)
    if (buildingLevel < (recipe.requiredLevel || 1)) {
      return false
    }
  }

  if (!consumeResources(recipe.inputs as Partial<Record<AllResourceType, number>>)) {
    return false
  }

  const task: ProcessingTask = {
    recipeId,
    startTime: Date.now(),
    duration: recipe.time,
    completed: false,
    claimed: false
  }

  campState.processingTasks.push(task)
  return true
}

export function updateProcessingTasks(): void {
  const now = Date.now()
  for (const task of campState.processingTasks) {
    if (!task.completed && now >= task.startTime + task.duration) {
      task.completed = true
    }
  }
}

export function claimProcessingTask(taskIndex: number): boolean {
  const task = campState.processingTasks[taskIndex]
  if (!task || !task.completed || task.claimed) return false

  const recipe = RECIPES.find(r => r.id === task.recipeId)
  if (!recipe) return false

  addResource(recipe.output, recipe.outputAmount)
  task.claimed = true
  campState.processingTasks.splice(taskIndex, 1)
  return true
}

export function getProcessingProgress(task: ProcessingTask): number {
  if (task.completed) return 1
  const elapsed = Date.now() - task.startTime
  return Math.min(1, elapsed / task.duration)
}

export function checkRecipeUnlocks(): void {
  for (const recipe of RECIPES) {
    if (campState.unlockedRecipes.includes(recipe.id)) continue
    if (recipe.requiredBuilding) {
      const level = getBuildingLevel(recipe.requiredBuilding)
      if (level >= (recipe.requiredLevel || 1)) {
        campState.unlockedRecipes.push(recipe.id)
      }
    }
  }
}

export function getAvailableRecipes() {
  return RECIPES.filter(r => campState.unlockedRecipes.includes(r.id))
}

export function addRunRewards(
  coins: number,
  resources: Partial<Record<ResourceTypeAlias, number>>
): void {
  campState.lastRunRewards = { coins, resources }
  if (coins > 0) {
    addResource('coin', coins)
  }
  addResources(resources as Partial<Record<AllResourceType, number>>)
}

export function clearLastRunRewards(): void {
  campState.lastRunRewards = null
}

export function resetCampState(): void {
  Object.assign(campState, createInitialState())
  saveState(campState)
}
