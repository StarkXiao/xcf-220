<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CodexEntry } from '../game/types'
import {
  codexState,
  getEntriesByCategory,
  getCategoryProgress,
  getRarityConfig,
  getCategoryInfo,
  getAllCategories,
  getTotalProgress
} from '../game/codexStore'

const emit = defineEmits<{
  (e: 'back'): void
}>()

const selectedCategory = ref<string>('all')
const selectedEntry = ref<CodexEntry | null>(null)
const showDetail = ref(false)

const categories = computed(() => {
  const cats = getAllCategories()
  return cats.map(cat => ({
    id: cat,
    ...getCategoryInfo(cat),
    ...getCategoryProgress(cat)
  }))
})

const totalProgress = computed(() => getTotalProgress())

const displayEntries = computed(() => {
  if (selectedCategory.value === 'all') {
    return Object.values(codexState.entries)
  }
  return getEntriesByCategory(selectedCategory.value)
})

const sortedEntries = computed(() => {
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
  return [...displayEntries.value].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    const rarityDiff = (rarityOrder[a.rarity] || 4) - (rarityOrder[b.rarity] || 4)
    if (rarityDiff !== 0) return rarityDiff
    return a.name.localeCompare(b.name)
  })
})

const progressPercent = computed(() => {
  if (totalProgress.value.total === 0) return 0
  return Math.round((totalProgress.value.unlocked / totalProgress.value.total) * 100)
})

function selectCategory(cat: string) {
  selectedCategory.value = cat
}

function openEntry(entry: CodexEntry) {
  if (!entry.unlocked) return
  selectedEntry.value = entry
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedEntry.value = null
}

function getEntryStyle(entry: CodexEntry) {
  if (!entry.unlocked) {
    return {
      background: 'linear-gradient(145deg, #424242 0%, #212121 100%)',
      borderColor: '#616161',
      color: '#9e9e9e'
    }
  }
  const config = getRarityConfig(entry.rarity)
  return {
    background: `linear-gradient(145deg, ${config.bgColor} 0%, white 100%)`,
    borderColor: config.borderColor,
    color: config.color
  }
}

function formatDate(timestamp?: number) {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<template>
  <div class="codex-screen">
    <div class="codex-header">
      <button class="back-button" @click="emit('back')">
        ← 返回
      </button>
      <div class="header-title">
        <span class="title-icon">📖</span>
        <h1>冒险图鉴</h1>
      </div>
      <div class="progress-section">
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="progress-text">{{ totalProgress.unlocked }} / {{ totalProgress.total }} ({{ progressPercent }}%)</span>
      </div>
    </div>

    <div class="codex-content">
      <div class="category-tabs">
        <button
          class="tab-button"
          :class="{ active: selectedCategory === 'all' }"
          @click="selectCategory('all')"
        >
          <span class="tab-icon">📚</span>
          <span class="tab-name">全部</span>
          <span class="tab-count">{{ Object.values(codexState.entries).filter(e => e.unlocked).length }}/{{ Object.values(codexState.entries).length }}</span>
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="tab-button"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectCategory(cat.id)"
        >
          <span class="tab-icon">{{ cat.icon }}</span>
          <span class="tab-name">{{ cat.name }}</span>
          <span class="tab-count">{{ cat.unlocked }}/{{ cat.total }}</span>
        </button>
      </div>

      <div class="entries-grid">
        <div
          v-for="entry in sortedEntries"
          :key="entry.id"
          class="entry-card"
          :class="{ locked: !entry.unlocked, clickable: entry.unlocked }"
          :style="getEntryStyle(entry)"
          @click="openEntry(entry)"
        >
          <div class="entry-icon-wrapper">
            <span class="entry-icon">{{ entry.unlocked ? entry.icon : '❓' }}</span>
            <div
              v-if="entry.unlocked"
              class="rarity-badge"
              :style="{ background: getRarityConfig(entry.rarity).color }"
            >
              {{ getRarityConfig(entry.rarity).name }}
            </div>
          </div>
          <div class="entry-info">
            <h3 class="entry-name">{{ entry.unlocked ? entry.name : '???' }}</h3>
            <p class="entry-desc">
              {{ entry.unlocked ? entry.description : '尚未解锁此条目，继续探索以发现更多秘密...' }}
            </p>
          </div>
          <div v-if="entry.unlocked" class="unlock-date">
            📅 {{ formatDate(entry.unlockedAt) }}
          </div>
        </div>
      </div>
    </div>

    <Transition name="modal-fade">
      <div v-if="showDetail && selectedEntry" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-content" :class="selectedEntry.rarity">
          <button class="close-modal" @click="closeDetail">×</button>
          
          <div class="modal-header" :style="{ background: `linear-gradient(135deg, ${getRarityConfig(selectedEntry.rarity).color}33, ${getRarityConfig(selectedEntry.rarity).bgColor})` }">
            <div class="modal-icon-wrapper">
              <span class="modal-icon">{{ selectedEntry.icon }}</span>
            </div>
            <div class="modal-title-section">
              <div class="modal-rarity" :style="{ color: getRarityConfig(selectedEntry.rarity).color, borderColor: getRarityConfig(selectedEntry.rarity).borderColor }">
                {{ getRarityConfig(selectedEntry.rarity).name }}
              </div>
              <h2 class="modal-name">{{ selectedEntry.name }}</h2>
              <p class="modal-category">
                {{ getCategoryInfo(selectedEntry.category).icon }} {{ getCategoryInfo(selectedEntry.category).name }}
              </p>
            </div>
          </div>

          <div class="modal-body">
            <div class="section">
              <h4 class="section-title">📝 简介</h4>
              <p class="section-content">{{ selectedEntry.description }}</p>
            </div>

            <div class="section">
              <h4 class="section-title">📜 背景故事</h4>
              <div class="story-content">
                <p class="section-content">{{ selectedEntry.backgroundStory }}</p>
              </div>
            </div>

            <div class="meta-section">
              <div class="meta-item">
                <span class="meta-label">解锁时间</span>
                <span class="meta-value">{{ formatDate(selectedEntry.unlockedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.codex-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.codex-header {
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%);
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-button {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(231, 76, 60, 0.4);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.title-icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 8px rgba(255, 215, 0, 0.5));
}

.header-title h1 {
  margin: 0;
  font-size: 28px;
  color: #FFD700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.progress-section {
  min-width: 200px;
  text-align: right;
}

.progress-bar-container {
  width: 200px;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #FFD700 0%, #FFA500 100%);
  border-radius: 6px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.progress-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.codex-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  gap: 20px;
}

.category-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.7);
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
}

.tab-button.active {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 140, 0, 0.2) 100%);
  border-color: #FFD700;
  color: #FFD700;
}

.tab-icon {
  font-size: 18px;
}

.tab-name {
  font-weight: 600;
  font-size: 14px;
}

.tab-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.entries-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding-right: 10px;
  align-content: start;
}

.entries-grid::-webkit-scrollbar {
  width: 8px;
}

.entries-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.entries-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 4px;
}

.entry-card {
  border-radius: 16px;
  padding: 16px;
  border: 2px solid;
  transition: all 0.3s;
  position: relative;
}

.entry-card.clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.entry-card.locked {
  opacity: 0.7;
  cursor: not-allowed;
}

.entry-icon-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.entry-icon {
  font-size: 48px;
  display: block;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.rarity-badge {
  position: absolute;
  top: 0;
  right: 0;
  color: white;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

.entry-info {
  margin-bottom: 10px;
}

.entry-name {
  margin: 0 0 6px 0;
  font-size: 17px;
  font-weight: bold;
}

.entry-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.85;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.unlock-date {
  font-size: 12px;
  opacity: 0.7;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.modal-content {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: linear-gradient(145deg, #2a1810 0%, #1a0f0a 100%);
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow-y: auto;
}

.modal-content.legendary {
  border: 3px solid #FFA500;
  box-shadow: 0 0 40px rgba(255, 165, 0, 0.3);
}

.modal-content.epic {
  border: 3px solid #9C27B0;
  box-shadow: 0 0 40px rgba(156, 39, 176, 0.3);
}

.modal-content.rare {
  border: 3px solid #2196F3;
  box-shadow: 0 0 40px rgba(33, 150, 243, 0.3);
}

.close-modal {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-modal:hover {
  background: rgba(231, 76, 60, 0.8);
  transform: rotate(90deg);
}

.modal-header {
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.modal-icon-wrapper {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.modal-icon {
  font-size: 48px;
}

.modal-title-section {
  flex: 1;
}

.modal-rarity {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
  border: 2px solid;
  background: rgba(255, 255, 255, 0.1);
}

.modal-name {
  margin: 0 0 6px 0;
  font-size: 26px;
  color: white;
}

.modal-category {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.modal-body {
  padding: 0 30px 30px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #FFD700;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.section-content {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.8;
  font-size: 15px;
}

.story-content {
  background: rgba(255, 248, 220, 0.05);
  border-left: 4px solid #FFD700;
  padding: 16px;
  border-radius: 0 8px 8px 0;
}

.meta-section {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.meta-value {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@media (max-width: 640px) {
  .codex-header {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .header-title h1 {
    font-size: 22px;
  }
  
  .progress-section {
    width: 100%;
    text-align: left;
  }
  
  .progress-bar-container {
    width: 100%;
  }
  
  .modal-header {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }
  
  .modal-body {
    padding: 0 20px 20px;
  }
  
  .entries-grid {
    grid-template-columns: 1fr;
  }
}
</style>
