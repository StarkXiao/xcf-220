<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  petState,
  startHatching,
  updateHatchingEggs,
  claimHatchedPet,
  getHatchingProgress,
  equipPet,
  unequipPet,
  getEquippedPet,
  getPetCollectionStats,
  canAffordEgg,
  getPetLevelMultiplier
} from '../game/petStore'
import {
  PETS,
  PET_EGGS,
  getPetById,
  getEggById,
  getRarityName,
  getRarityColor,
  getRarityBgColor,
  getExpForLevel
} from '../game/petData'
import { RESOURCES } from '../game/campData'
import type { Pet, PetInstance, AllResourceType } from '../game/types'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'startGame'): void
}>()

type TabType = 'myPets' | 'hatch' | 'collection'
const activeTab = ref<TabType>('myPets')

const hatchingTimer = ref<number | null>(null)
const showHatchResult = ref(false)
const hatchedPet = ref<Pet | null>(null)
const selectedPet = ref<Pet | null>(null)
const showPetDetail = ref(false)

const myPets = computed(() => {
  return petState.pets.map(petInstance => {
    const petInfo = getPetById(petInstance.petId)
    return {
      instance: petInstance,
      info: petInfo,
      expNeeded: getExpForLevel(petInstance.level),
      levelMultiplier: getPetLevelMultiplier(petInstance.level)
    }
  }).filter(p => p.info)
})

const eggs = computed(() => PET_EGGS)

const hatchingEggs = computed(() => {
  return petState.hatchingEggs.map((egg, index) => {
    const eggInfo = getEggById(egg.eggId)
    return {
      egg,
      index,
      info: eggInfo,
      progress: getHatchingProgress(egg)
    }
  })
})

const collectionStats = computed(() => getPetCollectionStats())

const collection = computed(() => {
  return PETS.map(pet => {
    const entry = petState.collection[pet.id]
    const petInstance = petState.pets.find(p => p.petId === pet.id)
    return {
      pet,
      unlocked: entry?.unlocked || false,
      level: petInstance?.level || 0,
      totalExp: entry?.totalExp || 0
    }
  })
})

const equippedPet = computed(() => {
  const equipped = getEquippedPet()
  if (!equipped) return null
  const info = getPetById(equipped.petId)
  return { instance: equipped, info }
})

function getSkillDescription(skillType: string, value: number, levelMultiplier: number = 1): string {
  const actualValue = value * levelMultiplier
  switch (skillType) {
    case 'coin_bonus':
      return `金币加成 +${Math.round(actualValue * 100)}%`
    case 'resource_bonus':
      return `资源加成 +${Math.round(actualValue * 100)}%`
    case 'magnet':
      return `吸引范围 +${Math.floor(actualValue)}`
    case 'shield':
      return `额外护盾 +${Math.floor(actualValue)}`
    case 'speed_aura':
      return `速度加成 +${Math.round(actualValue * 100)}%`
    case 'score_multiplier':
      return `得分加成 +${Math.round(actualValue * 100)}%`
    default:
      return `${skillType}: +${actualValue}`
  }
}

function getSkillIcon(skillType: string): string {
  switch (skillType) {
    case 'coin_bonus': return '💰'
    case 'resource_bonus': return '📦'
    case 'magnet': return '🧲'
    case 'shield': return '🛡️'
    case 'speed_aura': return '⚡'
    case 'score_multiplier': return '⭐'
    default: return '✨'
  }
}

function handleStartHatching(eggId: string) {
  const success = startHatching(eggId)
  if (success) {
    // 可以添加成功动画
  }
}

function handleClaimHatched(index: number) {
  const result = claimHatchedPet(index)
  if (result) {
    const petInfo = getPetById(result.petId)
    if (petInfo) {
      hatchedPet.value = petInfo
      showHatchResult.value = true
    }
  }
}

function closeHatchResult() {
  showHatchResult.value = false
  hatchedPet.value = null
}

function handleEquipPet(petId: string) {
  equipPet(petId)
}

function handleUnequipPet() {
  unequipPet()
}

function handleViewPetDetail(pet: Pet) {
  selectedPet.value = pet
  showPetDetail.value = true
}

function closePetDetail() {
  showPetDetail.value = false
  selectedPet.value = null
}

function getPetInstance(petId: string): PetInstance | undefined {
  return petState.pets.find(p => p.petId === petId)
}

function formatTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}分${secs}秒`
}

function getRemainingTime(duration: number, startTime: number): string {
  const elapsed = Date.now() - startTime
  const remaining = Math.max(0, duration - elapsed)
  return formatTime(remaining)
}

onMounted(() => {
  hatchingTimer.value = window.setInterval(() => {
    updateHatchingEggs()
  }, 100)
})

onUnmounted(() => {
  if (hatchingTimer.value) {
    clearInterval(hatchingTimer.value)
  }
})
</script>

<template>
  <div class="pet-screen">
    <div class="pet-header">
      <button class="btn-back" @click="$emit('back')">
        <span>←</span> 返回
      </button>
      <h1 class="pet-title">
        <span class="title-icon">🐾</span>
        宠物伙伴
      </h1>
      <div class="equipped-pet-mini" v-if="equippedPet">
        <span class="mini-pet-icon">{{ equippedPet.info?.icon }}</span>
        <span class="mini-pet-name">{{ equippedPet.info?.name }}</span>
      </div>
      <div v-else class="equipped-pet-mini empty">
        <span class="mini-pet-icon">❓</span>
        <span class="mini-pet-name">未装备</span>
      </div>
    </div>

    <div class="tab-buttons">
      <button
        v-for="tab in [
          { id: 'myPets', label: '我的宠物', icon: '🐾' },
          { id: 'hatch', label: '孵化', icon: '🥚' },
          { id: 'collection', label: '图鉴', icon: '📖' }
        ]"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id as TabType"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <div class="pet-content">
      <div v-if="activeTab === 'myPets'" class="tab-content">
        <div v-if="equippedPet" class="equipped-pet-section">
          <h2 class="section-title">⭐ 当前出战</h2>
          <div class="equipped-pet-card" :style="{ borderColor: getRarityColor(equippedPet.info?.rarity || 'common') }">
            <div class="pet-avatar" :style="{ background: getRarityBgColor(equippedPet.info?.rarity || 'common') }">
              <span class="pet-icon-large">{{ equippedPet.info?.icon }}</span>
            </div>
            <div class="pet-info">
              <div class="pet-name-row">
                <h3 class="pet-name" :style="{ color: getRarityColor(equippedPet.info?.rarity || 'common') }">
                  {{ equippedPet.info?.name }}
                </h3>
                <span class="rarity-badge" :style="{ background: getRarityColor(equippedPet.info?.rarity || 'common') }">
                  {{ getRarityName(equippedPet.info?.rarity || 'common') }}
                </span>
              </div>
              <div class="pet-level">
                <span class="level-text">Lv.{{ equippedPet.instance.level }}</span>
                <div class="exp-bar">
                  <div
                    class="exp-fill"
                    :style="{ width: `${(equippedPet.instance.exp / getExpForLevel(equippedPet.instance.level)) * 100}%` }"
                  ></div>
                </div>
                <span class="exp-text">{{ equippedPet.instance.exp }}/{{ getExpForLevel(equippedPet.instance.level) }}</span>
              </div>
              <div class="pet-skills">
                <div
                  v-for="skill in equippedPet.info?.skills"
                  :key="skill.type"
                  class="skill-tag"
                >
                  <span class="skill-icon">{{ getSkillIcon(skill.type) }}</span>
                  <span class="skill-text">{{ getSkillDescription(skill.type, skill.value, getPetLevelMultiplier(equippedPet.instance.level)) }}</span>
                </div>
              </div>
            </div>
            <button class="btn-unequip" @click="handleUnequipPet">卸下</button>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">🐾 我的宠物 ({{ myPets.length }})</h2>
          <div v-if="myPets.length > 0" class="pets-grid">
            <div
              v-for="pet in myPets"
              :key="pet.instance.petId"
              class="pet-card"
              :class="{ equipped: pet.instance.equipped }"
              :style="{ borderColor: getRarityColor(pet.info?.rarity || 'common') }"
              @click="handleViewPetDetail(pet.info!)"
            >
              <div class="pet-card-header" :style="{ background: getRarityBgColor(pet.info?.rarity || 'common') }">
                <span class="pet-card-icon">{{ pet.info?.icon }}</span>
                <span v-if="pet.instance.equipped" class="equipped-badge">出战中</span>
              </div>
              <div class="pet-card-body">
                <h4 class="pet-card-name" :style="{ color: getRarityColor(pet.info?.rarity || 'common') }">
                  {{ pet.info?.name }}
                </h4>
                <span class="pet-card-level">Lv.{{ pet.instance.level }}</span>
              </div>
              <button
                v-if="!pet.instance.equipped"
                class="btn-equip"
                @click.stop="handleEquipPet(pet.instance.petId)"
              >
                装备
              </button>
            </div>
          </div>
          <div v-else class="no-pets">
            <span class="no-pets-icon">🥚</span>
            <p class="no-pets-text">还没有宠物哦</p>
            <p class="no-pets-hint">去孵化一只属于你的宠物吧！</p>
            <button class="btn-go-hatch" @click="activeTab = 'hatch'">
              去孵化
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'hatch'" class="tab-content">
        <div v-if="hatchingEggs.length > 0" class="section">
          <h2 class="section-title">⏳ 正在孵化 ({{ hatchingEggs.length }})</h2>
          <div class="hatching-list">
            <div
              v-for="hatch in hatchingEggs"
              :key="hatch.index"
              class="hatching-card"
              :style="{ borderColor: getRarityColor(hatch.info?.rarity || 'common') }"
            >
              <div class="hatch-egg-icon" :style="{ background: getRarityBgColor(hatch.info?.rarity || 'common') }">
                <span class="egg-emoji">{{ hatch.info?.icon }}</span>
                <div v-if="hatch.egg.completed" class="hatch-ready-badge">🎉</div>
              </div>
              <div class="hatch-info">
                <h4 class="hatch-name" :style="{ color: getRarityColor(hatch.info?.rarity || 'common') }">
                  {{ hatch.info?.name }}
                </h4>
                <div class="hatch-progress-bar">
                  <div
                    class="hatch-progress-fill"
                    :style="{ width: `${hatch.progress * 100}%`, background: getRarityColor(hatch.info?.rarity || 'common') }"
                    :class="{ complete: hatch.egg.completed }"
                  ></div>
                </div>
                <span class="hatch-time">
                  {{ hatch.egg.completed ? '孵化完成！' : getRemainingTime(hatch.egg.duration, hatch.egg.startTime) }}
                </span>
              </div>
              <button
                v-if="hatch.egg.completed"
                class="btn-claim"
                @click="handleClaimHatched(hatch.index)"
              >
                领取
              </button>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">🥚 宠物蛋商店</h2>
          <div class="eggs-grid">
            <div
              v-for="egg in eggs"
              :key="egg.id"
              class="egg-card"
              :style="{ borderColor: getRarityColor(egg.rarity) }"
            >
              <div class="egg-header" :style="{ background: getRarityBgColor(egg.rarity) }">
                <span class="egg-icon-large">{{ egg.icon }}</span>
                <span class="egg-rarity" :style="{ color: getRarityColor(egg.rarity) }">
                  {{ getRarityName(egg.rarity) }}
                </span>
              </div>
              <div class="egg-body">
                <h4 class="egg-name">{{ egg.name }}</h4>
                <p class="egg-hatch-time">孵化时间: {{ formatTime(egg.hatchTime) }}</p>
                <div class="egg-cost">
                  <span
                    v-for="(amount, type) in egg.cost"
                    :key="type"
                    :class="['cost-item', { insufficient: (petState.collection as any).length < 0 ? false : false }]"
                  >
                    <span class="cost-icon">{{ RESOURCES[type as AllResourceType]?.icon }}</span>
                    {{ amount }}
                  </span>
                </div>
              </div>
              <button
                class="btn-hatch"
                :disabled="!canAffordEgg(egg.id)"
                :style="{ background: canAffordEgg(egg.id) ? getRarityColor(egg.rarity) : '#ccc' }"
                @click="handleStartHatching(egg.id)"
              >
                开始孵化
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'collection'" class="tab-content">
        <div class="collection-stats">
          <div class="stats-card">
            <span class="stats-icon">📖</span>
            <div class="stats-info">
              <span class="stats-label">收集进度</span>
              <span class="stats-value">{{ collectionStats.unlocked }} / {{ collectionStats.total }}</span>
            </div>
            <div class="stats-bar">
              <div
                class="stats-fill"
                :style="{ width: `${(collectionStats.unlocked / collectionStats.total) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">📚 宠物图鉴</h2>
          <div class="collection-grid">
            <div
              v-for="entry in collection"
              :key="entry.pet.id"
              class="collection-card"
              :class="{ unlocked: entry.unlocked, locked: !entry.unlocked }"
              :style="{ borderColor: entry.unlocked ? getRarityColor(entry.pet.rarity) : '#ddd' }"
              @click="entry.unlocked && handleViewPetDetail(entry.pet)"
            >
              <div
                class="collection-avatar"
                :style="{ background: entry.unlocked ? getRarityBgColor(entry.pet.rarity) : '#f0f0f0' }"
              >
                <span class="collection-icon">{{ entry.unlocked ? entry.pet.icon : '❓' }}</span>
              </div>
              <div class="collection-info">
                <h4
                  class="collection-name"
                  :style="{ color: entry.unlocked ? getRarityColor(entry.pet.rarity) : '#ccc' }"
                >
                  {{ entry.unlocked ? entry.pet.name : '???' }}
                </h4>
                <span class="collection-rarity" :style="{ color: entry.unlocked ? getRarityColor(entry.pet.rarity) : '#ddd' }">
                  {{ getRarityName(entry.pet.rarity) }}
                </span>
              </div>
              <div v-if="entry.unlocked && entry.level > 0" class="collection-level">
                Lv.{{ entry.level }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showHatchResult && hatchedPet" class="hatch-result-overlay" @click="closeHatchResult">
      <div class="hatch-result-modal" @click.stop>
        <div class="hatch-result-header">
          <span class="hatch-result-title">🎉 孵化成功！</span>
        </div>
        <div
          class="hatched-pet-display"
          :style="{ borderColor: getRarityColor(hatchedPet.rarity) }"
        >
          <div class="hatched-pet-avatar" :style="{ background: getRarityBgColor(hatchedPet.rarity) }">
            <span class="hatched-pet-icon">{{ hatchedPet.icon }}</span>
            <div class="sparkles">
              <span v-for="i in 8" :key="i" class="sparkle" :style="{ '--i': i }">✨</span>
            </div>
          </div>
          <h3 class="hatched-pet-name" :style="{ color: getRarityColor(hatchedPet.rarity) }">
            {{ hatchedPet.name }}
          </h3>
          <span class="hatched-pet-rarity" :style="{ background: getRarityColor(hatchedPet.rarity) }">
            {{ getRarityName(hatchedPet.rarity) }}
          </span>
          <p class="hatched-pet-desc">{{ hatchedPet.description }}</p>
          <div class="hatched-pet-skills">
            <div
              v-for="skill in hatchedPet.skills"
              :key="skill.type"
              class="skill-item"
            >
              <span class="skill-icon">{{ getSkillIcon(skill.type) }}</span>
              <span class="skill-text">{{ skill.description }}</span>
            </div>
          </div>
        </div>
        <button class="btn-confirm" @click="closeHatchResult">
          太棒了！
        </button>
      </div>
    </div>

    <div v-if="showPetDetail && selectedPet" class="pet-detail-overlay" @click="closePetDetail">
      <div class="pet-detail-modal" @click.stop>
        <button class="btn-close-detail" @click="closePetDetail">✕</button>
        <div
          class="detail-pet-header"
          :style="{ background: getRarityBgColor(selectedPet.rarity) }"
        >
          <span class="detail-pet-icon">{{ selectedPet.icon }}</span>
          <h2 class="detail-pet-name" :style="{ color: getRarityColor(selectedPet.rarity) }">
            {{ selectedPet.name }}
          </h2>
          <span class="detail-rarity-badge" :style="{ background: getRarityColor(selectedPet.rarity) }">
            {{ getRarityName(selectedPet.rarity) }}
          </span>
        </div>

        <div class="detail-pet-body">
          <p class="detail-pet-desc">{{ selectedPet.description }}</p>

          <div v-if="getPetInstance(selectedPet.id)" class="detail-pet-level">
            <span class="level-label">等级</span>
            <span class="level-value">Lv.{{ getPetInstance(selectedPet.id)?.level }}</span>
            <div class="detail-exp-bar">
              <div
                class="detail-exp-fill"
                :style="{
                  width: `${((getPetInstance(selectedPet.id)?.exp || 0) / getExpForLevel(getPetInstance(selectedPet.id)?.level || 1)) * 100}%`,
                  background: getRarityColor(selectedPet.rarity)
                }"
              ></div>
            </div>
            <span class="detail-exp-text">
              {{ getPetInstance(selectedPet.id)?.exp }}/{{ getExpForLevel(getPetInstance(selectedPet.id)?.level || 1) }} EXP
            </span>
          </div>

          <div class="detail-skills-section">
            <h3 class="detail-section-title">🎯 技能</h3>
            <div class="detail-skills-list">
              <div
                v-for="skill in selectedPet.skills"
                :key="skill.type"
                class="detail-skill-item"
              >
                <span class="detail-skill-icon">{{ getSkillIcon(skill.type) }}</span>
                <div class="detail-skill-info">
                  <span class="detail-skill-name">
                    {{ getSkillDescription(skill.type, skill.value, getPetInstance(selectedPet.id) ? getPetLevelMultiplier(getPetInstance(selectedPet.id)!.level) : 1) }}
                  </span>
                  <span class="detail-skill-desc">{{ skill.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-unlock-section">
            <h3 class="detail-section-title">🔓 获取方式</h3>
            <p class="detail-unlock-text">{{ selectedPet.unlockCondition }}</p>
          </div>
        </div>

        <div class="detail-actions">
          <button
            v-if="getPetInstance(selectedPet.id) && !getPetInstance(selectedPet.id)?.equipped"
            class="btn-detail-equip"
            :style="{ background: getRarityColor(selectedPet.rarity) }"
            @click="handleEquipPet(selectedPet.id); closePetDetail()"
          >
            装备出战
          </button>
          <button
            v-else-if="getPetInstance(selectedPet.id)?.equipped"
            class="btn-detail-unequip"
            @click="handleUnequipPet(); closePetDetail()"
          >
            卸下
          </button>
          <button v-else class="btn-detail-locked" disabled>
            未解锁
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pet-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #E6E6FA 0%, #DDA0DD 50%, #BA55D3 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.btn-back {
  background: linear-gradient(180deg, #9C27B0, #7B1FA2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.pet-title {
  margin: 0;
  font-size: 24px;
  color: #6A1B9A;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 28px;
}

.equipped-pet-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #F3E5F5, #E1BEE7);
  padding: 6px 12px;
  border-radius: 20px;
  border: 2px solid #CE93D8;
}

.equipped-pet-mini.empty {
  opacity: 0.6;
}

.mini-pet-icon {
  font-size: 20px;
}

.mini-pet-name {
  font-size: 13px;
  font-weight: 600;
  color: #6A1B9A;
}

.tab-buttons {
  display: flex;
  background: rgba(255, 255, 255, 0.8);
  padding: 5px;
  gap: 5px;
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 5px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: #666;
}

.tab-btn.active {
  background: linear-gradient(180deg, #9C27B0, #7B1FA2);
  color: white;
}

.tab-icon {
  font-size: 20px;
}

.pet-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #6A1B9A;
}

.equipped-pet-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 20px rgba(156, 39, 176, 0.2);
  border: 3px solid #E1BEE7;
}

.equipped-pet-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #fff, #faf5ff);
  border-radius: 12px;
  border: 2px solid;
}

.pet-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pet-icon-large {
  font-size: 48px;
}

.pet-info {
  flex: 1;
  min-width: 0;
}

.pet-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.pet-name {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
}

.rarity-badge {
  color: white;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.pet-level {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.level-text {
  font-weight: bold;
  color: #6A1B9A;
  font-size: 14px;
}

.exp-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #9C27B0, #E040FB);
  transition: width 0.3s;
}

.exp-text {
  font-size: 12px;
  color: #999;
  min-width: 50px;
  text-align: right;
}

.pet-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #F3E5F5, #E1BEE7);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #6A1B9A;
}

.skill-icon {
  font-size: 14px;
}

.btn-unequip {
  background: linear-gradient(180deg, #9E9E9E, #757575);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  flex-shrink: 0;
}

.pets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.pet-card {
  background: white;
  border-radius: 12px;
  border: 2px solid;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.pet-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.pet-card.equipped {
  box-shadow: 0 0 15px rgba(156, 39, 176, 0.4);
}

.pet-card-header {
  padding: 15px;
  text-align: center;
  position: relative;
}

.pet-card-icon {
  font-size: 48px;
}

.equipped-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #8B4513;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
}

.pet-card-body {
  padding: 10px;
  text-align: center;
}

.pet-card-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: bold;
}

.pet-card-level {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.btn-equip {
  width: 100%;
  background: linear-gradient(180deg, #9C27B0, #7B1FA2);
  color: white;
  border: none;
  padding: 8px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
}

.no-pets {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-pets-icon {
  font-size: 64px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.no-pets-text {
  font-size: 18px;
  margin: 0 0 8px 0;
}

.no-pets-hint {
  font-size: 14px;
  margin: 0 0 20px 0;
}

.btn-go-hatch {
  background: linear-gradient(180deg, #9C27B0, #7B1FA2);
  color: white;
  border: none;
  padding: 10px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.hatching-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hatching-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 12px;
  border: 2px solid;
}

.hatch-egg-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.egg-emoji {
  font-size: 36px;
  animation: wobble 2s ease-in-out infinite;
}

@keyframes wobble {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.hatch-ready-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 24px;
  animation: bounce 0.6s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.hatch-info {
  flex: 1;
  min-width: 0;
}

.hatch-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
}

.hatch-progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.hatch-progress-fill {
  height: 100%;
  transition: width 0.3s;
}

.hatch-progress-fill.complete {
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.hatch-time {
  font-size: 13px;
  color: #666;
}

.btn-claim {
  background: linear-gradient(180deg, #FFD700, #FFA500);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.eggs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.egg-card {
  background: white;
  border-radius: 12px;
  border: 2px solid;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.egg-header {
  padding: 20px;
  text-align: center;
  position: relative;
}

.egg-icon-large {
  font-size: 56px;
  display: block;
  margin-bottom: 8px;
}

.egg-rarity {
  font-size: 12px;
  font-weight: bold;
}

.egg-body {
  padding: 12px;
  flex: 1;
}

.egg-name {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.egg-hatch-time {
  font-size: 12px;
  color: #888;
  margin-bottom: 10px;
}

.egg-cost {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cost-item {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #f5f5f5;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 12px;
}

.cost-icon {
  font-size: 14px;
}

.btn-hatch {
  width: 100%;
  color: white;
  border: none;
  padding: 10px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-hatch:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.collection-stats {
  margin-bottom: 10px;
}

.stats-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stats-icon {
  font-size: 36px;
}

.stats-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats-label {
  font-size: 13px;
  color: #888;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #6A1B9A;
}

.stats-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  flex: 1;
  max-width: 150px;
}

.stats-fill {
  height: 100%;
  background: linear-gradient(90deg, #9C27B0, #E040FB);
  transition: width 0.5s ease;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.collection-card {
  background: white;
  border-radius: 12px;
  border: 2px solid;
  overflow: hidden;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.collection-card.unlocked:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.collection-card.locked {
  opacity: 0.6;
  cursor: default;
}

.collection-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
}

.collection-icon {
  font-size: 36px;
}

.collection-info {
  margin-bottom: 6px;
}

.collection-name {
  margin: 0 0 4px 0;
  font-size: 13px;
  font-weight: bold;
}

.collection-rarity {
  font-size: 11px;
  font-weight: 500;
}

.collection-level {
  font-size: 12px;
  color: #6A1B9A;
  font-weight: bold;
  background: #F3E5F5;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.hatch-result-overlay,
.pet-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
}

.hatch-result-modal,
.pet-detail-modal {
  background: white;
  border-radius: 20px;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalIn {
  0% { opacity: 0; transform: scale(0.8) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.hatch-result-header {
  text-align: center;
  padding: 20px 20px 0;
}

.hatch-result-title {
  font-size: 28px;
  font-weight: bold;
  color: #6A1B9A;
}

.hatched-pet-display {
  text-align: center;
  padding: 30px 20px;
  border: 3px solid;
  margin: 20px;
  border-radius: 16px;
}

.hatched-pet-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  position: relative;
}

.hatched-pet-icon {
  font-size: 72px;
  animation: petPop 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes petPop {
  0% { transform: scale(0) rotate(-180deg); }
  50% { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1) rotate(0); }
}

.sparkles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  font-size: 20px;
  opacity: 0;
  animation: sparkleOut 1.5s ease-out infinite;
  animation-delay: calc(var(--i) * 0.15s);
}

@keyframes sparkleOut {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(
      calc(cos(var(--i) * 45deg) * 60px),
      calc(sin(var(--i) * 45deg) * 60px)
    ) scale(1.2);
  }
}

.hatched-pet-name {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 10px 0;
}

.hatched-pet-rarity {
  display: inline-block;
  color: white;
  padding: 5px 15px;
  border-radius: 15px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 15px;
}

.hatched-pet-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.hatched-pet-skills {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #faf5ff;
  padding: 10px 15px;
  border-radius: 10px;
}

.btn-confirm {
  width: calc(100% - 40px);
  margin: 0 20px 25px;
  background: linear-gradient(180deg, #9C27B0, #7B1FA2);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 0 #6A1B9A;
}

.btn-close-detail {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  z-index: 10;
  color: #666;
}

.detail-pet-header {
  text-align: center;
  padding: 30px 20px;
  border-radius: 20px 20px 0 0;
}

.detail-pet-icon {
  font-size: 80px;
  display: block;
  margin-bottom: 10px;
}

.detail-pet-name {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.detail-rarity-badge {
  display: inline-block;
  color: white;
  padding: 5px 15px;
  border-radius: 15px;
  font-size: 13px;
  font-weight: bold;
}

.detail-pet-body {
  padding: 20px;
}

.detail-pet-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.detail-pet-level {
  background: #faf5ff;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.level-label {
  font-size: 14px;
  color: #888;
}

.level-value {
  font-size: 20px;
  font-weight: bold;
  color: #6A1B9A;
}

.detail-exp-bar {
  flex: 1;
  min-width: 100px;
  height: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.detail-exp-fill {
  height: 100%;
  transition: width 0.3s;
}

.detail-exp-text {
  font-size: 12px;
  color: #888;
  min-width: 80px;
  text-align: right;
}

.detail-section-title {
  font-size: 16px;
  color: #333;
  margin: 0 0 12px 0;
}

.detail-skills-section,
.detail-unlock-section {
  margin-bottom: 20px;
}

.detail-skills-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-skill-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #faf5ff;
  padding: 12px 15px;
  border-radius: 12px;
}

.detail-skill-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.detail-skill-info {
  flex: 1;
  min-width: 0;
}

.detail-skill-name {
  display: block;
  font-size: 15px;
  font-weight: bold;
  color: #6A1B9A;
  margin-bottom: 2px;
}

.detail-skill-desc {
  font-size: 12px;
  color: #999;
}

.detail-unlock-text {
  font-size: 14px;
  color: #666;
  margin: 0;
  background: #f5f5f5;
  padding: 12px 15px;
  border-radius: 10px;
}

.detail-actions {
  padding: 0 20px 25px;
}

.btn-detail-equip,
.btn-detail-unequip,
.btn-detail-locked {
  width: 100%;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.btn-detail-unequip {
  background: linear-gradient(180deg, #9E9E9E, #757575);
}

.btn-detail-locked {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .pet-header {
    padding: 10px 15px;
  }

  .pet-title {
    font-size: 20px;
  }

  .equipped-pet-card {
    flex-wrap: wrap;
  }

  .pets-grid,
  .eggs-grid,
  .collection-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .tab-btn {
    padding: 8px 3px;
    font-size: 11px;
  }
}
</style>
