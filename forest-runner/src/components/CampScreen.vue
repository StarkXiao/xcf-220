<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  campState,
  upgradeBuilding,
  getBuildingLevel,
  startProcessing,
  updateProcessingTasks,
  claimProcessingTask,
  getProcessingProgress,
  getAvailableRecipes,
  hasResources,
  getActiveBuffs,
  clearLastRunRewards
} from '../game/campStore'
import { RESOURCES, RECIPES } from '../game/campData'
import type {
  BuildingType,
  AllResourceType,
  ResourceType,
  ProcessedResourceType
} from '../game/types'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'startGame'): void
  (e: 'showPets'): void
}>()

type TabType = 'overview' | 'buildings' | 'processing' | 'buffs'
const activeTab = ref<TabType>('overview')

const processingTimer = ref<number | null>(null)

const rawResources = computed(() => {
  const types: ResourceType[] = ['wood', 'stone', 'herb', 'crystal', 'berry']
  return types.map(type => ({
    type,
    amount: campState.inventory.resources[type] || 0,
    info: RESOURCES[type]
  }))
})

const processedResources = computed(() => {
  const types: ProcessedResourceType[] = ['plank', 'brick', 'potion_herb', 'magic_dust', 'jam']
  return types.map(type => ({
    type,
    amount: campState.inventory.resources[type] || 0,
    info: RESOURCES[type]
  }))
})

const coinAmount = computed(() => campState.inventory.resources['coin'] || 0)

const buildings = computed(() => campState.buildings)

const availableRecipes = computed(() => getAvailableRecipes())

const processingTasks = computed(() => campState.processingTasks)

const activeBuffs = computed(() => {
  const buffs = getActiveBuffs()
  const grouped: Record<string, { value: number; sources: string[] }> = {}
  for (const buff of buffs) {
    if (!grouped[buff.type]) {
      grouped[buff.type] = { value: 0, sources: [] }
    }
    grouped[buff.type].value += buff.value
    grouped[buff.type].sources.push(buff.source)
  }
  return Object.entries(grouped).map(([type, data]) => ({
    type,
    ...data
  }))
})

const lastRunRewards = computed(() => campState.lastRunRewards)

function getBuffDescription(type: string, value: number): string {
  switch (type) {
    case 'jump_boost':
      return `跳跃力 +${Math.round(value * 100)}%`
    case 'speed_boost':
      return `基础速度 +${Math.round(value * 100)}%`
    case 'coin_multiplier':
      return `金币倍率 +${Math.round(value * 100)}%`
    case 'extra_life':
      return `额外生命 +${Math.floor(value)}`
    case 'invincible_duration':
      return `无敌时间 +${Math.floor(value)}帧`
    case 'magnet_range':
      return `吸引范围 +${Math.floor(value)}`
    case 'resource_boost':
      return `资源掉落 +${Math.round(value * 100)}%`
    default:
      return `${type}: +${value}`
  }
}

function getBuffIcon(type: string): string {
  switch (type) {
    case 'jump_boost': return '🦘'
    case 'speed_boost': return '⚡'
    case 'coin_multiplier': return '💰'
    case 'extra_life': return '❤️'
    case 'invincible_duration': return '🛡️'
    case 'magnet_range': return '🧲'
    case 'resource_boost': return '📦'
    default: return '✨'
  }
}

function handleUpgradeBuilding(buildingId: BuildingType) {
  const success = upgradeBuilding(buildingId)
  if (success) {
    // 添加升级动画或提示
  }
}

function canUpgradeBuilding(buildingId: BuildingType): boolean {
  const building = campState.buildings.find(b => b.id === buildingId)
  if (!building || building.currentLevel >= building.maxLevel) return false
  const nextLevel = building.levels[building.currentLevel]
  return hasResources(nextLevel.cost)
}

function getUpgradeCost(buildingId: BuildingType) {
  const building = campState.buildings.find(b => b.id === buildingId)
  if (!building || building.currentLevel >= building.maxLevel) return {}
  return building.levels[building.currentLevel].cost
}

function handleStartProcessing(recipeId: string) {
  startProcessing(recipeId)
}

function canStartProcessing(recipeId: string): boolean {
  const recipe = RECIPES.find(r => r.id === recipeId)
  if (!recipe) return false
  if (recipe.requiredBuilding) {
    const level = getBuildingLevel(recipe.requiredBuilding)
    if (level < (recipe.requiredLevel || 1)) return false
  }
  return hasResources(recipe.inputs as Partial<Record<AllResourceType, number>>)
}

function handleClaimTask(index: number) {
  claimProcessingTask(index)
}

function formatTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}分${secs}秒`
}

function getRemainingTime(task: typeof campState.processingTasks[0]): string {
  if (task.completed) return '已完成'
  const elapsed = Date.now() - task.startTime
  const remaining = Math.max(0, task.duration - elapsed)
  return formatTime(remaining)
}

function dismissRewards() {
  clearLastRunRewards()
}

onMounted(() => {
  processingTimer.value = window.setInterval(() => {
    updateProcessingTasks()
  }, 100)
})

onUnmounted(() => {
  if (processingTimer.value) {
    clearInterval(processingTimer.value)
  }
})
</script>

<template>
  <div class="camp-screen">
    <div class="camp-header">
      <button class="btn-back" @click="$emit('back')">
        <span>←</span> 返回
      </button>
      <h1 class="camp-title">
        <span class="title-icon">🏕️</span>
        森林营地
      </h1>
      <div class="coin-display">
        <span class="coin-icon">💰</span>
        <span class="coin-amount">{{ coinAmount }}</span>
      </div>
    </div>

    <div v-if="lastRunRewards" class="rewards-banner">
      <div class="rewards-content">
        <h3 class="rewards-title">🎉 上次跑酷收获</h3>
        <div class="rewards-items">
          <span class="reward-item">
            <span class="reward-icon">💰</span>
            +{{ lastRunRewards.coins }} 金币
          </span>
          <template v-for="(amount, type) in lastRunRewards.resources" :key="type">
            <span v-if="amount && amount > 0" class="reward-item">
              <span class="reward-icon">{{ RESOURCES[type as ResourceType]?.icon }}</span>
              +{{ amount }} {{ RESOURCES[type as ResourceType]?.name }}
            </span>
          </template>
        </div>
        <button class="btn-dismiss" @click="dismissRewards">✕</button>
      </div>
    </div>

    <div class="tab-buttons">
      <button
        v-for="tab in [{ id: 'overview', label: '总览', icon: '🏠' }, { id: 'buildings', label: '建筑', icon: '🏗️' }, { id: 'processing', label: '加工', icon: '⚗️' }, { id: 'buffs', label: '增益', icon: '✨' }]"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id as TabType"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <div class="camp-content">
      <div v-if="activeTab === 'overview'" class="tab-content">
        <div class="section">
          <h2 class="section-title">📦 原材料库存</h2>
          <div class="resource-grid">
            <div v-for="resource in rawResources" :key="resource.type" class="resource-card">
              <span class="resource-icon-large">{{ resource.info?.icon }}</span>
              <span class="resource-name">{{ resource.info?.name }}</span>
              <span class="resource-count">{{ resource.amount }}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">🛠️ 加工材料库存</h2>
          <div class="resource-grid">
            <div v-for="resource in processedResources" :key="resource.type" class="resource-card">
              <span class="resource-icon-large">{{ resource.info?.icon }}</span>
              <span class="resource-name">{{ resource.info?.name }}</span>
              <span class="resource-count">{{ resource.amount }}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="quick-actions">
            <button class="btn btn-start-game" @click="$emit('startGame')">
              <span class="btn-icon">🎮</span>
              开始跑酷收集资源
            </button>
            <button class="btn btn-pet" @click="$emit('showPets')">
              <span class="btn-icon">🐾</span>
              宠物伙伴
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'buildings'" class="tab-content">
        <div class="buildings-list">
          <div v-for="building in buildings" :key="building.id" class="building-card">
            <div class="building-header">
              <span class="building-icon">{{ building.icon }}</span>
              <div class="building-info">
                <h3 class="building-name">{{ building.name }}</h3>
                <p class="building-desc">{{ building.description }}</p>
              </div>
              <div class="building-level">
                <span class="level-badge">Lv.{{ building.currentLevel }}</span>
                <span class="max-level">/{{ building.maxLevel }}</span>
              </div>
            </div>

            <div v-if="building.currentLevel > 0" class="building-bonus">
              <span class="bonus-icon">{{ getBuffIcon(building.levels[0].bonus.type) }}</span>
              <span class="bonus-text">
                当前效果: {{ getBuffDescription(building.levels[building.currentLevel - 1].bonus.type, building.levels[building.currentLevel - 1].bonus.value) }}
              </span>
            </div>

            <div v-if="building.currentLevel < building.maxLevel" class="building-upgrade">
              <div class="upgrade-cost">
                <span class="cost-label">升级需要:</span>
                <div class="cost-items">
                  <span
                    v-for="(amount, type) in getUpgradeCost(building.id)"
                    :key="type"
                    :class="['cost-item', { insufficient: (campState.inventory.resources[type as AllResourceType] || 0) < (amount || 0) }]"
                  >
                    <span class="cost-icon">{{ RESOURCES[type as AllResourceType]?.icon }}</span>
                    {{ campState.inventory.resources[type as AllResourceType] || 0 }}/{{ amount }}
                  </span>
                </div>
              </div>
              <div class="next-bonus">
                <span class="next-label">下一级:</span>
                <span class="next-text">
                  {{ getBuffDescription(building.levels[building.currentLevel].bonus.type, building.levels[building.currentLevel].bonus.value) }}
                </span>
              </div>
              <button
                class="btn btn-upgrade"
                :disabled="!canUpgradeBuilding(building.id)"
                @click="handleUpgradeBuilding(building.id)"
              >
                <span class="btn-icon">⬆️</span>
                升级
              </button>
            </div>
            <div v-else class="building-maxed">
              <span class="maxed-icon">🏆</span>
              <span class="maxed-text">已达最高等级</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'processing'" class="tab-content">
        <div v-if="processingTasks.length > 0" class="section">
          <h2 class="section-title">⏳ 正在加工</h2>
          <div class="processing-tasks">
            <div
              v-for="(task, index) in processingTasks"
              :key="index"
              class="task-card"
            >
              <div class="task-info">
                <span class="task-icon">{{ RESOURCES[RECIPES.find(r => r.id === task.recipeId)?.output || 'plank']?.icon }}</span>
                <div class="task-details">
                  <span class="task-name">{{ RECIPES.find(r => r.id === task.recipeId)?.name }}</span>
                  <span class="task-time">{{ getRemainingTime(task) }}</span>
                </div>
              </div>
              <div class="task-progress">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: `${getProcessingProgress(task) * 100}%` }"
                    :class="{ complete: task.completed }"
                  ></div>
                </div>
                <button
                  v-if="task.completed"
                  class="btn btn-claim"
                  @click="handleClaimTask(index)"
                >
                  领取
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">📋 可加工配方</h2>
          <div class="recipes-list">
            <div
              v-for="recipe in availableRecipes"
              :key="recipe.id"
              class="recipe-card"
            >
              <div class="recipe-header">
                <span class="recipe-icon">{{ RESOURCES[recipe.output]?.icon }}</span>
                <div class="recipe-info">
                  <h3 class="recipe-name">{{ recipe.name }}</h3>
                  <span class="recipe-output">产出: {{ recipe.outputAmount }} × {{ RESOURCES[recipe.output]?.name }}</span>
                </div>
                <span class="recipe-time">⏱️ {{ formatTime(recipe.time) }}</span>
              </div>
              <div class="recipe-cost">
                <span class="cost-label">需要:</span>
                <div class="cost-items">
                  <span
                    v-for="(amount, type) in recipe.inputs"
                    :key="type"
                    :class="['cost-item', { insufficient: (campState.inventory.resources[type as ResourceType] || 0) < (amount || 0) }]"
                  >
                    <span class="cost-icon">{{ RESOURCES[type as ResourceType]?.icon }}</span>
                    {{ campState.inventory.resources[type as ResourceType] || 0 }}/{{ amount }}
                  </span>
                </div>
              </div>
              <button
                class="btn btn-craft"
                :disabled="!canStartProcessing(recipe.id)"
                @click="handleStartProcessing(recipe.id)"
              >
                <span class="btn-icon">⚒️</span>
                开始加工
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'buffs'" class="tab-content">
        <div v-if="activeBuffs.length > 0" class="buffs-list">
          <div v-for="buff in activeBuffs" :key="buff.type" class="buff-card">
            <span class="buff-icon">{{ getBuffIcon(buff.type) }}</span>
            <div class="buff-info">
              <h3 class="buff-name">{{ getBuffDescription(buff.type, buff.value) }}</h3>
              <p class="buff-sources">来源: {{ buff.sources.join(', ') }}</p>
            </div>
            <span class="buff-value">+{{ buff.type === 'extra_life' || buff.type === 'invincible_duration' || buff.type === 'magnet_range' ? Math.floor(buff.value) : `${Math.round(buff.value * 100)}%` }}</span>
          </div>
        </div>
        <div v-else class="no-buffs">
          <span class="no-buffs-icon">🔮</span>
          <p class="no-buffs-text">暂无增益效果</p>
          <p class="no-buffs-hint">升级建筑来获得各种增益吧！</p>
        </div>

        <div class="section">
          <div class="quick-actions">
            <button class="btn btn-start-game" @click="$emit('startGame')">
              <span class="btn-icon">🎮</span>
              带着增益开始跑酷
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.camp-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #87CEEB 0%, #90EE90 50%, #228B22 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.camp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.btn-back {
  background: linear-gradient(180deg, #4CAF50, #388E3C);
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

.camp-title {
  margin: 0;
  font-size: 24px;
  color: #2d5a27;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 28px;
}

.coin-display {
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(180deg, #FFD700, #FFA500);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  color: #8B4513;
}

.coin-icon {
  font-size: 18px;
}

.rewards-banner {
  background: linear-gradient(90deg, #FFE4B5, #FFDAB9);
  padding: 10px 20px;
  position: relative;
}

.rewards-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.rewards-title {
  margin: 0;
  font-size: 16px;
  color: #8B4513;
}

.rewards-items {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: bold;
  color: #2d5a27;
}

.btn-dismiss {
  position: absolute;
  top: 5px;
  right: 10px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #888;
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
  background: linear-gradient(180deg, #4CAF50, #388E3C);
  color: white;
}

.tab-icon {
  font-size: 20px;
}

.camp-content {
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
  color: #2d5a27;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.resource-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: linear-gradient(180deg, #f8fff8, #e8ffe8);
  border-radius: 12px;
  border: 2px solid #90EE90;
}

.resource-icon-large {
  font-size: 36px;
  margin-bottom: 5px;
}

.resource-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 3px;
}

.resource-count {
  font-size: 20px;
  font-weight: bold;
  color: #2d5a27;
}

.quick-actions {
  display: flex;
  justify-content: center;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.btn-start-game {
  background: linear-gradient(180deg, #FF6B6B, #EE5A5A);
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 30px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 0 #CC4444;
  transition: all 0.2s;
}

.btn-start-game:hover {
  transform: translateY(-2px);
}

.btn-start-game:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #CC4444;
}

.btn-pet {
  background: linear-gradient(180deg, #9C27B0, #7B1FA2);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 0 #6A1B9A;
  transition: all 0.2s;
}

.btn-pet:hover {
  transform: translateY(-2px);
}

.btn-pet:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #6A1B9A;
}

.buildings-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.building-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 2px solid #90EE90;
}

.building-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.building-icon {
  font-size: 48px;
}

.building-info {
  flex: 1;
}

.building-name {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #2d5a27;
}

.building-desc {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.building-level {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.level-badge {
  background: linear-gradient(180deg, #FFD700, #FFA500);
  color: #8B4513;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 16px;
}

.max-level {
  color: #999;
  font-size: 14px;
}

.building-bonus {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(90deg, #E8F5E9, #C8E6C9);
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 12px;
}

.bonus-icon {
  font-size: 24px;
}

.bonus-text {
  font-size: 14px;
  color: #2d5a27;
  font-weight: 500;
}

.building-upgrade {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upgrade-cost,
.recipe-cost {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cost-label,
.next-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.cost-items {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.cost-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
}

.cost-item.insufficient {
  background: #FFEBEE;
  color: #C62828;
}

.cost-icon {
  font-size: 16px;
}

.next-bonus {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(90deg, #FFF3E0, #FFE0B2);
  padding: 8px;
  border-radius: 8px;
}

.next-text {
  font-size: 13px;
  color: #E65100;
  font-weight: 500;
}

.btn-upgrade,
.btn-craft,
.btn-claim {
  background: linear-gradient(180deg, #4CAF50, #388E3C);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 0 #2E7D32;
  transition: all 0.2s;
}

.btn-upgrade:disabled,
.btn-craft:disabled {
  background: linear-gradient(180deg, #ccc, #aaa);
  box-shadow: 0 4px 0 #888;
  cursor: not-allowed;
}

.btn-claim {
  background: linear-gradient(180deg, #FFD700, #FFA500);
  box-shadow: 0 4px 0 #CD853F;
  padding: 8px 16px;
  font-size: 14px;
}

.building-maxed {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(90deg, #FFF8E1, #FFECB3);
  padding: 15px;
  border-radius: 10px;
}

.maxed-icon {
  font-size: 28px;
}

.maxed-text {
  font-size: 16px;
  color: #FF8F00;
  font-weight: bold;
}

.processing-tasks {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.task-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, #F3E5F5, #E1BEE7);
  padding: 12px;
  border-radius: 12px;
  border: 2px solid #CE93D8;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-icon {
  font-size: 36px;
}

.task-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-name {
  font-weight: bold;
  color: #4A148C;
}

.task-time {
  font-size: 13px;
  color: #7B1FA2;
}

.task-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 150px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #9C27B0, #E040FB);
  transition: width 0.3s;
}

.progress-fill.complete {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.recipes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recipe-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 2px solid #81D4FA;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recipe-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recipe-icon {
  font-size: 40px;
}

.recipe-info {
  flex: 1;
}

.recipe-name {
  margin: 0 0 3px 0;
  font-size: 16px;
  color: #01579B;
}

.recipe-output {
  font-size: 13px;
  color: #0277BD;
}

.recipe-time {
  font-size: 13px;
  color: #666;
  background: #E1F5FE;
  padding: 4px 10px;
  border-radius: 12px;
}

.buffs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.buff-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(90deg, #FFF8E1, #FFECB3);
  padding: 15px;
  border-radius: 12px;
  border: 2px solid #FFD54F;
}

.buff-icon {
  font-size: 40px;
}

.buff-info {
  flex: 1;
}

.buff-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #E65100;
  font-weight: bold;
}

.buff-sources {
  margin: 0;
  font-size: 12px;
  color: #FF8F00;
}

.buff-value {
  font-size: 20px;
  font-weight: bold;
  color: #E65100;
  background: white;
  padding: 6px 14px;
  border-radius: 15px;
}

.no-buffs {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #999;
}

.no-buffs-icon {
  font-size: 64px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.no-buffs-text {
  font-size: 18px;
  margin: 0 0 8px 0;
}

.no-buffs-hint {
  font-size: 14px;
  margin: 0;
}

@media (max-width: 480px) {
  .camp-header {
    padding: 10px 15px;
  }

  .camp-title {
    font-size: 20px;
  }

  .resource-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .building-header {
    flex-wrap: wrap;
  }

  .tab-btn {
    padding: 8px 3px;
    font-size: 11px;
  }
}
</style>
