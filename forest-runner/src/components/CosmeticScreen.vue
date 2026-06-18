<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import CosmeticPreview from './CosmeticPreview.vue'
import {
  cosmeticState,
  equipCosmetic,
  getCosmeticsWithStatusByCategory,
  getUnlockedCount,
  getTotalCount,
  getPreviewConfig,
  checkCosmeticUnlocks,
  hideUnlockAnimation,
  getEquippedCosmetic
} from '../game/cosmeticStore'
import {
  getCategoryLabel,
  getCategoryIcon,
  getRarityColor,
  getRarityLabel,
  getCosmeticById
} from '../game/cosmeticData'
import type { CosmeticCategory, CosmeticTabType, CosmeticItem, CosmeticPreviewConfig } from '../game/types'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'startGame'): void
}>()

const activeTab = ref<CosmeticTabType>('all')
const selectedItem = ref<(CosmeticItem & { unlocked: boolean; equipped: boolean }) | null>(null)
const showItemDetail = ref(false)
const tempPreviewConfig = ref<CosmeticPreviewConfig | null>(null)
const isTryOnMode = ref(false)

const tabs: Array<{ id: CosmeticTabType; label: string; icon: string }> = [
  { id: 'all', label: '全部', icon: '📦' },
  { id: 'skin', label: '皮肤', icon: getCategoryIcon('skin') },
  { id: 'hat', label: '帽子', icon: getCategoryIcon('hat') },
  { id: 'accessory', label: '配饰', icon: getCategoryIcon('accessory') },
  { id: 'trail', label: '拖尾', icon: getCategoryIcon('trail') },
  { id: 'emote', label: '表情', icon: getCategoryIcon('emote') },
  { id: 'title', label: '称号', icon: getCategoryIcon('title') }
]

const allItems = computed(() => {
  if (activeTab.value === 'all') {
    const categories: CosmeticCategory[] = ['skin', 'hat', 'accessory', 'trail', 'emote', 'title']
    return categories.map(cat => ({
      category: cat,
      items: getCosmeticsWithStatusByCategory(cat)
    }))
  }
  return [{
    category: activeTab.value as CosmeticCategory,
    items: getCosmeticsWithStatusByCategory(activeTab.value as CosmeticCategory)
  }]
})

const effectivePreviewConfig = computed(() => {
  if (tempPreviewConfig.value && isTryOnMode.value) {
    return tempPreviewConfig.value
  }
  return getPreviewConfig()
})

const collectionProgress = computed(() => {
  return {
    unlocked: getUnlockedCount(),
    total: getTotalCount(),
    percent: Math.floor((getUnlockedCount() / getTotalCount()) * 100)
  }
})

const newlyUnlockedCosmetic = computed(() => {
  if (!cosmeticState.lastNewCosmeticId) return null
  return getCosmeticById(cosmeticState.lastNewCosmeticId)
})

const equippedTitle = computed(() => {
  return getEquippedCosmetic('title')
})

function selectItem(item: CosmeticItem & { unlocked: boolean; equipped: boolean }) {
  selectedItem.value = item
  showItemDetail.value = true

  if (item.colors || item.trailColor || item.category === 'hat' || item.category === 'accessory') {
    updateTryOnPreview(item)
    isTryOnMode.value = true
  }
}

function updateTryOnPreview(item: CosmeticItem) {
  const currentConfig = getPreviewConfig()
  const newConfig: CosmeticPreviewConfig = { ...currentConfig }

  if (item.category === 'skin' && item.colors) {
    newConfig.colors = item.colors
  } else if (item.category === 'hat') {
    newConfig.showHat = item.id !== 'hat-none'
    if (item.colors) {
      newConfig.colors = { ...newConfig.colors, hat: item.colors.hat }
    }
  } else if (item.category === 'accessory') {
    newConfig.showAccessory = item.id !== 'acc-none'
  } else if (item.category === 'trail') {
    newConfig.showTrail = item.id !== 'trail-none'
    newConfig.trailColor = item.trailColor
    newConfig.particleColor = item.particleColor
  }

  tempPreviewConfig.value = newConfig
}

function closeDetail() {
  showItemDetail.value = false
  selectedItem.value = null
  isTryOnMode.value = false
  tempPreviewConfig.value = null
}

function handleEquip() {
  if (!selectedItem.value || !selectedItem.value.unlocked) return

  const success = equipCosmetic(selectedItem.value.id)
  if (success) {
    selectedItem.value = { ...selectedItem.value, equipped: true }
    isTryOnMode.value = false
    tempPreviewConfig.value = null
  }
}

function closeUnlockAnimation() {
  hideUnlockAnimation()
}

function getUnlockIcon(type: string): string {
  const icons: Record<string, string> = {
    default: '🎁',
    achievement: '🏆',
    chapter_complete: '🗺️',
    chapter_unlock: '🔓',
    battle_pass: '📜',
    shop: '🛒',
    event: '🎉',
    stars: '⭐',
    distance: '🏃'
  }
  return icons[type] || '🔒'
}

onMounted(() => {
  checkCosmeticUnlocks()
})

watch(() => cosmeticState.showUnlockAnimation, (show) => {
  if (show) {
    setTimeout(() => {
      checkCosmeticUnlocks()
    }, 100)
  }
})
</script>

<template>
  <div class="cosmetic-screen">
    <div class="header">
      <button class="back-btn" @click="emit('back')">
        ← 返回
      </button>
      <h1 class="title">🎨 角色装扮</h1>
      <button class="start-btn" @click="emit('startGame')">
        开始游戏 🎮
      </button>
    </div>

    <div class="collection-info">
      <div class="collection-label">
        <span>📦 收藏进度</span>
        <span class="collection-count">{{ collectionProgress.unlocked }} / {{ collectionProgress.total }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: collectionProgress.percent + '%' }"></div>
      </div>
    </div>

    <div class="main-content">
      <div class="preview-section">
        <div class="preview-card">
          <div v-if="equippedTitle && equippedTitle.titleText" class="equipped-title">
            「{{ equippedTitle.titleText }}」
          </div>
          <CosmeticPreview
            :preview-config="effectivePreviewConfig"
            :width="240"
            :height="320"
            :animated="true"
          />
          <div class="preview-hint" v-if="isTryOnMode">
            👆 试穿中 - 点击装备确认
          </div>
        </div>

        <div class="quick-equipped" v-if="!isTryOnMode">
          <h3>当前装扮</h3>
          <div class="equipped-list">
            <div v-for="cat in ['skin', 'hat', 'accessory', 'trail']" :key="cat" class="equipped-item">
              <span class="cat-icon">{{ getCategoryIcon(cat as CosmeticCategory) }}</span>
              <span class="item-name">{{ getEquippedCosmetic(cat as CosmeticCategory)?.name || '无' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="items-section">
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </div>

        <div class="items-container">
          <div v-for="group in allItems" :key="group.category" class="category-group">
            <h2 class="category-title" v-if="activeTab === 'all'">
              {{ getCategoryIcon(group.category) }} {{ getCategoryLabel(group.category) }}
            </h2>
            <div class="items-grid">
              <div
                v-for="item in group.items"
                :key="item.id"
                :class="[
                  'item-card',
                  { locked: !item.unlocked, equipped: item.equipped, selected: selectedItem?.id === item.id }
                ]"
                @click="selectItem(item)"
              >
                <div class="item-icon">{{ item.icon }}</div>
                <div class="item-name">{{ item.name }}</div>
                <div class="item-rarity" :style="{ color: getRarityColor(item.rarity) }">
                  {{ getRarityLabel(item.rarity) }}
                </div>
                <div v-if="!item.unlocked" class="lock-overlay">
                  <span class="lock-icon">🔒</span>
                </div>
                <div v-if="item.equipped" class="equipped-badge">
                  已装备
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showItemDetail && selectedItem" class="modal-overlay" @click.self="closeDetail">
      <div class="detail-modal">
        <button class="close-btn" @click="closeDetail">✕</button>

        <div class="detail-header">
          <div class="detail-icon">{{ selectedItem.icon }}</div>
          <div class="detail-info">
            <h2 class="detail-name">{{ selectedItem.name }}</h2>
            <div class="detail-rarity" :style="{ color: getRarityColor(selectedItem.rarity) }">
              {{ getRarityLabel(selectedItem.rarity) }}
            </div>
          </div>
        </div>

        <p class="detail-description">{{ selectedItem.description }}</p>

        <div class="detail-category">
          <span class="cat-label">分类:</span>
          <span>{{ getCategoryIcon(selectedItem.category) }} {{ getCategoryLabel(selectedItem.category) }}</span>
        </div>

        <div class="unlock-condition" :class="{ unlocked: selectedItem.unlocked }">
          <div class="condition-header">
            <span class="condition-icon">{{ getUnlockIcon(selectedItem.unlockCondition.type) }}</span>
            <span class="condition-label">{{ selectedItem.unlocked ? '✅ 已解锁' : '🔒 解锁条件' }}</span>
          </div>
          <p class="condition-text">{{ selectedItem.unlockCondition.description }}</p>
        </div>

        <div class="detail-actions">
          <button class="action-btn secondary" @click="closeDetail">
            关闭
          </button>
          <button
            v-if="selectedItem.unlocked && !selectedItem.equipped"
            class="action-btn primary"
            @click="handleEquip"
          >
            装备
          </button>
          <button
            v-if="selectedItem.equipped"
            class="action-btn secondary"
            disabled
          >
            已装备 ✓
          </button>
        </div>
      </div>
    </div>

    <div v-if="cosmeticState.showUnlockAnimation && newlyUnlockedCosmetic" class="unlock-overlay">
      <div class="unlock-modal">
        <div class="unlock-glow"></div>
        <div class="unlock-content">
          <div class="unlock-badge">🎉 新装扮解锁！</div>
          <div class="unlock-icon">{{ newlyUnlockedCosmetic.icon }}</div>
          <h2 class="unlock-name">{{ newlyUnlockedCosmetic.name }}</h2>
          <div class="unlock-rarity" :style="{ color: getRarityColor(newlyUnlockedCosmetic.rarity) }">
            {{ getRarityLabel(newlyUnlockedCosmetic.rarity) }}
          </div>
          <p class="unlock-desc">{{ newlyUnlockedCosmetic.description }}</p>
          <button class="unlock-btn" @click="closeUnlockAnimation">
            太棒了！
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cosmetic-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.back-btn, .start-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.start-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.5);
}

.title {
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.collection-info {
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.1);
}

.collection-label {
  display: flex;
  justify-content: space-between;
  color: white;
  font-size: 14px;
  margin-bottom: 8px;
}

.collection-count {
  font-weight: 700;
  color: #FFD700;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  border-radius: 4px;
  transition: width 0.5s;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.preview-section {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-card {
  background: linear-gradient(180deg, #87CEEB 0%, #90EE90 100%);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.equipped-title {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: #FFD700;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  z-index: 10;
}

.preview-hint {
  margin-top: 12px;
  color: #4CAF50;
  font-size: 13px;
  font-weight: 600;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.quick-equipped {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.quick-equipped h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.equipped-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipped-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.cat-icon {
  font-size: 16px;
}

.item-name {
  color: #333;
  font-weight: 500;
}

.items-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tab-btn.active {
  background: white;
  color: #667eea;
}

.tab-icon {
  font-size: 16px;
}

.items-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.category-group {
  margin-bottom: 24px;
}

.category-title {
  color: white;
  font-size: 16px;
  margin: 0 0 12px 0;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.item-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  border: 3px solid transparent;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.item-card.selected {
  border-color: #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.item-card.locked {
  opacity: 0.6;
}

.item-card.equipped {
  border-color: #4CAF50;
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
}

.item-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.item-name {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-rarity {
  font-size: 10px;
  font-weight: 700;
}

.lock-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lock-icon {
  font-size: 12px;
}

.equipped-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  background: #4CAF50;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.detail-modal {
  background: white;
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  position: relative;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-icon {
  font-size: 64px;
}

.detail-name {
  font-size: 24px;
  margin: 0 0 4px 0;
  color: #333;
}

.detail-rarity {
  font-size: 14px;
  font-weight: 700;
}

.detail-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.detail-category {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 12px;
  margin-bottom: 16px;
}

.cat-label {
  color: #888;
}

.unlock-condition {
  padding: 16px;
  border-radius: 12px;
  background: #FFF3E0;
  border: 2px solid #FF9800;
  margin-bottom: 20px;
}

.unlock-condition.unlocked {
  background: #E8F5E9;
  border-color: #4CAF50;
}

.condition-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.condition-icon {
  font-size: 20px;
}

.condition-label {
  font-weight: 700;
  color: #E65100;
}

.unlock-condition.unlocked .condition-label {
  color: #2E7D32;
}

.condition-text {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.secondary {
  background: #f0f0f0;
  color: #666;
}

.action-btn.secondary:hover {
  background: #e0e0e0;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.unlock-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(8px);
}

.unlock-modal {
  text-align: center;
  position: relative;
  animation: unlockPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes unlockPop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.unlock-glow {
  position: absolute;
  inset: -50px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
}

.unlock-content {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  padding: 40px;
  border: 3px solid #FFD700;
}

.unlock-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 20px;
}

.unlock-icon {
  font-size: 80px;
  margin-bottom: 16px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.unlock-name {
  color: white;
  font-size: 28px;
  margin: 0 0 8px 0;
}

.unlock-rarity {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}

.unlock-desc {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 24px 0;
  font-size: 14px;
}

.unlock-btn {
  padding: 14px 40px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #1a1a2e;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.unlock-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
}
</style>
