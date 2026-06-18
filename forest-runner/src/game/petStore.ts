import { reactive, watch } from 'vue'
import type {
  Pet,
  PetState,
  PetInstance,
  HatchingEgg,
  PetRunContribution,
  PetSkillType,
  ResourceType,
  AllResourceType
} from './types'
import {
  PETS,
  PET_EGGS,
  getPetById,
  getEggById,
  selectRandomPetFromEgg,
  getExpForLevel,
  getPetSkillValue
} from './petData'
import { hasResources, consumeResources } from './campStore'

const STORAGE_KEY = 'forest-runner-pet-state'

function createInitialState(): PetState {
  const collection: Record<string, PetState['collection'][string]> = {}
  PETS.forEach(pet => {
    collection[pet.id] = {
      petId: pet.id,
      unlocked: false,
      totalExp: 0
    }
  })

  return {
    pets: [],
    eggs: JSON.parse(JSON.stringify(PET_EGGS)),
    hatchingEggs: [],
    collection,
    equippedPetId: null,
    lastHatchedPetId: null
  }
}

function loadState(): PetState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as PetState
      const initial = createInitialState()
      
      if (!parsed.collection) {
        parsed.collection = initial.collection
      } else {
        PETS.forEach(pet => {
          if (!parsed.collection[pet.id]) {
            parsed.collection[pet.id] = {
              petId: pet.id,
              unlocked: false,
              totalExp: 0
            }
          }
        })
      }
      
      if (!parsed.pets) parsed.pets = []
      if (!parsed.hatchingEggs) parsed.hatchingEggs = []
      if (!parsed.eggs) parsed.eggs = JSON.parse(JSON.stringify(PET_EGGS))
      if (!parsed.equippedPetId) parsed.equippedPetId = null
      if (!parsed.lastHatchedPetId) parsed.lastHatchedPetId = null
      
      return parsed
    }
  } catch (e) {
    console.error('Failed to load pet state:', e)
  }
  return createInitialState()
}

function saveState(state: PetState): void {
  try {
    const toSave = {
      pets: state.pets,
      hatchingEggs: state.hatchingEggs,
      collection: state.collection,
      equippedPetId: state.equippedPetId,
      lastHatchedPetId: state.lastHatchedPetId
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save pet state:', e)
  }
}

export const petState = reactive<PetState>(loadState())

watch(
  () => petState,
  (newState) => {
    saveState(newState)
  },
  { deep: true }
)

export function startHatching(eggId: string): boolean {
  const egg = getEggById(eggId)
  if (!egg) return false

  if (!hasResources(egg.cost as Partial<Record<AllResourceType, number>>)) {
    return false
  }

  if (!consumeResources(egg.cost as Partial<Record<AllResourceType, number>>)) {
    return false
  }

  const hatchingEgg: HatchingEgg = {
    eggId,
    startTime: Date.now(),
    duration: egg.hatchTime,
    completed: false,
    claimed: false
  }

  petState.hatchingEggs.push(hatchingEgg)
  return true
}

export function updateHatchingEggs(): void {
  const now = Date.now()
  for (const egg of petState.hatchingEggs) {
    if (!egg.completed && now >= egg.startTime + egg.duration) {
      egg.completed = true
    }
  }
}

export function claimHatchedPet(eggIndex: number): PetInstance | null {
  const hatchingEgg = petState.hatchingEggs[eggIndex]
  if (!hatchingEgg || !hatchingEgg.completed || hatchingEgg.claimed) {
    return null
  }

  const pet = selectRandomPetFromEgg(hatchingEgg.eggId)
  if (!pet) return null

  hatchingEgg.claimed = true
  petState.hatchingEggs.splice(eggIndex, 1)

  let petInstance = petState.pets.find(p => p.petId === pet.id)
  const isNew = !petInstance

  if (!petInstance) {
    petInstance = {
      petId: pet.id,
      level: 1,
      exp: 0,
      equipped: false,
      unlockedAt: Date.now()
    }
    petState.pets.push(petInstance)
  }

  const collectionEntry = petState.collection[pet.id]
  if (collectionEntry) {
    if (!collectionEntry.unlocked) {
      collectionEntry.unlocked = true
      collectionEntry.firstUnlockedAt = Date.now()
    }
  }

  const expGain = isNew ? 0 : getExpForLevel(1)
  if (expGain > 0) {
    addPetExp(pet.id, expGain)
  }

  petState.lastHatchedPetId = pet.id

  return petInstance
}

export function getHatchingProgress(hatchingEgg: HatchingEgg): number {
  if (hatchingEgg.completed) return 1
  const elapsed = Date.now() - hatchingEgg.startTime
  return Math.min(1, elapsed / hatchingEgg.duration)
}

export function equipPet(petId: string): boolean {
  const pet = petState.pets.find(p => p.petId === petId)
  if (!pet) return false

  petState.pets.forEach(p => {
    p.equipped = false
  })

  pet.equipped = true
  petState.equippedPetId = petId

  return true
}

export function unequipPet(): void {
  petState.pets.forEach(p => {
    p.equipped = false
  })
  petState.equippedPetId = null
}

export function getEquippedPet(): PetInstance | null {
  if (!petState.equippedPetId) return null
  return petState.pets.find(p => p.petId === petState.equippedPetId) || null
}

export function getEquippedPetInfo(): Pet | null {
  const equipped = getEquippedPet()
  if (!equipped) return null
  return getPetById(equipped.petId) || null
}

export function addPetExp(petId: string, exp: number): void {
  const pet = petState.pets.find(p => p.petId === petId)
  if (!pet) return

  const collectionEntry = petState.collection[petId]
  if (collectionEntry) {
    collectionEntry.totalExp += exp
  }

  pet.exp += exp

  while (true) {
    const expNeeded = getExpForLevel(pet.level)
    if (pet.exp >= expNeeded) {
      pet.exp -= expNeeded
      pet.level++
    } else {
      break
    }
  }
}

export function getPetLevelMultiplier(level: number): number {
  return 1 + (level - 1) * 0.1
}

export function getEquippedPetSkillValue(skillType: PetSkillType): number {
  const petInstance = getEquippedPet()
  const petInfo = getEquippedPetInfo()
  if (!petInstance || !petInfo) return 0

  const baseValue = getPetSkillValue(petInfo, skillType)
  const levelMultiplier = getPetLevelMultiplier(petInstance.level)
  return baseValue * levelMultiplier
}

export function getCombinedPetBuffs(): Record<string, number> {
  const buffs: Record<string, number> = {}
  
  const coinBonus = getEquippedPetSkillValue('coin_bonus')
  if (coinBonus > 0) buffs['coin_multiplier'] = (buffs['coin_multiplier'] || 0) + coinBonus

  const resourceBonus = getEquippedPetSkillValue('resource_bonus')
  if (resourceBonus > 0) buffs['resource_boost'] = (buffs['resource_boost'] || 0) + resourceBonus

  const magnetBonus = getEquippedPetSkillValue('magnet')
  if (magnetBonus > 0) buffs['magnet_range'] = (buffs['magnet_range'] || 0) + magnetBonus

  const speedBonus = getEquippedPetSkillValue('speed_aura')
  if (speedBonus > 0) buffs['speed_boost'] = (buffs['speed_boost'] || 0) + speedBonus

  const shieldBonus = getEquippedPetSkillValue('shield')
  if (shieldBonus > 0) buffs['extra_life'] = (buffs['extra_life'] || 0) + Math.floor(shieldBonus)

  const scoreBonus = getEquippedPetSkillValue('score_multiplier')
  if (scoreBonus > 0) buffs['score_multiplier'] = (buffs['score_multiplier'] || 0) + scoreBonus

  return buffs
}

export function getPetCollectionStats(): { total: number; unlocked: number } {
  const total = PETS.length
  const unlocked = Object.values(petState.collection).filter(c => c.unlocked).length
  return { total, unlocked }
}

export function calculatePetRunContribution(
  baseCoins: number,
  baseScore: number,
  baseResources: Partial<Record<ResourceType, number>>
): PetRunContribution | null {
  const petInfo = getEquippedPetInfo()
  const petInstance = getEquippedPet()
  
  if (!petInfo || !petInstance) return null

  const coinBonus = getEquippedPetSkillValue('coin_bonus')
  const scoreBonus = getEquippedPetSkillValue('score_multiplier')
  const resourceBonus = getEquippedPetSkillValue('resource_bonus')

  const bonusCoins = Math.floor(baseCoins * coinBonus)
  const bonusScore = Math.floor(baseScore * scoreBonus)
  
  const bonusResources: Partial<Record<ResourceType, number>> = {}
  for (const [type, amount] of Object.entries(baseResources)) {
    if (amount) {
      bonusResources[type as ResourceType] = Math.floor(amount * resourceBonus)
    }
  }

  const skillsActivated = petInfo.skills.map(s => s.description)

  return {
    petId: petInfo.id,
    petName: petInfo.name,
    petIcon: petInfo.icon,
    bonusCoins,
    bonusResources,
    bonusScore,
    skillsActivated
  }
}

export function addRunExpToPet(score: number): void {
  const equipped = getEquippedPet()
  if (!equipped) return

  const expGain = Math.floor(score / 100) + 1
  addPetExp(equipped.petId, expGain)
}

export function canAffordEgg(eggId: string): boolean {
  const egg = getEggById(eggId)
  if (!egg) return false
  return hasResources(egg.cost as Partial<Record<AllResourceType, number>>)
}

export function getActiveHatchingCount(): number {
  return petState.hatchingEggs.filter(e => !e.claimed).length
}

export function resetPetState(): void {
  Object.assign(petState, createInitialState())
  saveState(petState)
}
