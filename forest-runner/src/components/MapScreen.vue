<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Chapter, AreaNode } from '../game/types'
import {
  chapterState,
  selectChapter,
  selectArea,
  getChapterById,
  getChapterStars,
  getChapterMaxStars,
  getTotalStars,
  claimChapterBonus,
  isChapterBonusClaimed
} from '../game/chapterStore'
import { THEMES } from '../game/chapterData'
import { RESOURCES } from '../game/campData'
import type { AllResourceType } from '../game/types'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'startGame'): void
  (e: 'showAchievements'): void
}>()

const selectedChapterId = ref<string | null>(null)
const selectedAreaId = ref<string | null>(null)
const showAreaDetail = ref(false)
const showBonusToast = ref(false)
const bonusToastMessage = ref('')

const chapters = computed(() => chapterState.chapters)
const totalStars = computed(() => getTotalStars())
const maxPossibleStars = computed(() => {
  return chapters.value.reduce((sum, ch) => {
    return sum + ch.areas.reduce((s, a) => s + a.maxStars, 0)
  }, 0)
})

const selectedChapter = computed<Chapter | null>(() => {
  if (!selectedChapterId.value) return null
  return getChapterById(selectedChapterId.value)
})

const selectedArea = computed<AreaNode | null>(() => {
  if (!selectedChapterId.value || !selectedAreaId.value) return null
  const ch = getChapterById(selectedChapterId.value)
  return ch?.areas.find(a => a.id === selectedAreaId.value) || null
})

const chapterStars = computed(() => {
  if (!selectedChapterId.value) return { earned: 0, max: 0 }
  return {
    earned: getChapterStars(selectedChapterId.value),
    max: getChapterMaxStars(selectedChapterId.value)
  }
})

const chapterBgStyle = computed(() => {
  if (!selectedChapter.value) return {}
  const theme = THEMES[selectedChapter.value.backgroundTheme]
  return {
    background: `linear-gradient(180deg, ${theme.skyGradient[0]} 0%, ${theme.skyGradient[1]} 50%, ${theme.groundColor[0]} 85%, ${theme.groundColor[1]} 100%)`
  }
})

const difficultyStars = computed(() => {
  if (!selectedArea.value) return []
  return Array.from({ length: 5 }, (_, i) => i < selectedArea.value!.difficulty)
})

function handleSelectChapter(chapterId: string) {
  const chapter = chapters.value.find(c => c.id === chapterId)
  if (!chapter?.unlocked) return
  selectedChapterId.value = chapterId
  selectedAreaId.value = null
  showAreaDetail.value = false
  selectChapter(chapterId)
}

function handleSelectArea(areaId: string) {
  const area = selectedChapter.value?.areas.find(a => a.id === areaId)
  if (!area?.unlocked) return
  selectedAreaId.value = areaId
  showAreaDetail.value = true
  selectArea(areaId)
}

function handleStartGame() {
  if (selectedArea.value?.unlocked) {
    emit('startGame')
  }
}

function handleBackToChapters() {
  selectedChapterId.value = null
  selectedAreaId.value = null
  showAreaDetail.value = false
}

function handleClaimBonus(chapterId: string) {
  const chapter = getChapterById(chapterId)
  if (!chapter?.completed) return
  if (isChapterBonusClaimed(chapterId)) return

  const success = claimChapterBonus(chapterId)
  if (success) {
    bonusToastMessage.value = `🎁 领取完成：${chapter.bonusRewards.coins} 金币`
    showBonusToast.value = true
    setTimeout(() => {
      showBonusToast.value = false
    }, 2500)
  }
}

function getResourceInfo(type: string) {
  return RESOURCES[type as AllResourceType]
}

function getAreaRewardResources(rewards: AreaNode['rewards']) {
  return Object.entries(rewards.resources || {})
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => ({ type: k, amount: v, info: getResourceInfo(k) }))
}

function getUnlockConditionText(chapter: Chapter): string {
  const cond = chapter.unlockedCondition
  if (!cond) return '默认解锁'
  const parts: string[] = []
  if (cond.previousChapterId) {
    const prev = getChapterById(cond.previousChapterId)
    if (prev) parts.push(`完成「${prev.name}」`)
  }
  if (cond.requiredStars) {
    parts.push(`累计获得 ${cond.requiredStars} 颗星星`)
  }
  return parts.join(' + ')
}

function getProgressToUnlock(chapter: Chapter): number {
  const cond = chapter.unlockedCondition
  if (!cond) return 100
  let progress = 100
  if (cond.requiredStars) {
    progress = Math.min(progress, (totalStars.value / cond.requiredStars) * 100)
  }
  if (cond.previousChapterId) {
    const prev = getChapterById(cond.previousChapterId)
    if (prev && !prev.completed) {
      const prevStars = getChapterStars(cond.previousChapterId)
      const prevMax = getChapterMaxStars(cond.previousChapterId)
      progress = Math.min(progress, prevMax > 0 ? (prevStars / prevMax) * 100 : 0)
    }
  }
  return progress
}

watch(() => chapterState.chapters, () => {}, { deep: true })

onMounted(() => {
  if (chapters.value.length > 0 && chapters.value[0].unlocked) {
    selectedChapterId.value = chapters.value[0].id
  }
})
</script>

<template>
  <div class="map-screen">
    <div v-if="showBonusToast" class="bonus-toast">
      {{ bonusToastMessage }}
    </div>

    <div class="map-container">
      <div class="header">
        <button class="back-btn" @click="$emit('back')">
          <span class="back-icon">←</span>
          返回
        </button>
        <h2 class="title">
          <span class="title-icon">🗺️</span>
          章节冒险
        </h2>
        <div class="stars-total">
          <span class="star-icon">⭐</span>
          <span>{{ totalStars }} / {{ maxPossibleStars }}</span>
        </div>
      </div>

      <div v-if="!selectedChapter" class="chapters-overview">
        <h3 class="section-title">选择章节</h3>
        <div class="chapters-grid">
          <div
            v-for="chapter in chapters"
            :key="chapter.id"
            class="chapter-card"
            :class="{
              unlocked: chapter.unlocked,
              locked: !chapter.unlocked,
              completed: chapter.completed
            }"
            @click="handleSelectChapter(chapter.id)"
          >
            <div class="chapter-header">
              <span class="chapter-icon">{{ chapter.icon }}</span>
              <div class="chapter-title-area">
                <h4 class="chapter-name">{{ chapter.name }}</h4>
                <div class="chapter-stars-mini">
                  <span class="mini-star">⭐</span>
                  <span>{{ getChapterStars(chapter.id) }} / {{ getChapterMaxStars(chapter.id) }}</span>
                </div>
              </div>
              <div v-if="chapter.completed" class="completed-badge">✓</div>
              <div v-else-if="!chapter.unlocked" class="locked-badge">🔒</div>
            </div>

            <p class="chapter-desc">{{ chapter.description }}</p>

            <div class="chapter-meta">
              <span class="area-count">{{ chapter.areas.length }} 个区域</span>
              <span class="theme-tag" :style="{ background: THEMES[chapter.backgroundTheme].groundColor[0] + '40' }">
                {{ THEMES[chapter.backgroundTheme].icon }} {{ THEMES[chapter.backgroundTheme].name }}
              </span>
            </div>

            <div v-if="!chapter.unlocked" class="unlock-hint">
              <div class="unlock-progress-bar">
                <div
                  class="unlock-progress"
                  :style="{ width: `${getProgressToUnlock(chapter)}%` }"
                ></div>
              </div>
              <span class="unlock-text">解锁条件：{{ getUnlockConditionText(chapter) }}</span>
            </div>

            <div v-if="chapter.completed && !isChapterBonusClaimed(chapter.id)" class="bonus-prompt" @click.stop="handleClaimBonus(chapter.id)">
              <span class="bonus-icon">🎁</span>
              <span>领取章节奖励</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="areas-view" :style="chapterBgStyle">
        <div class="chapter-nav">
          <button class="nav-btn" @click="handleBackToChapters">
            ← 返回章节列表
          </button>
          <div class="chapter-progress">
            <h3 class="current-chapter-name">
              {{ selectedChapter.icon }} {{ selectedChapter.name }}
            </h3>
            <div class="progress-info">
              <span class="stars-display">
                <span v-for="i in chapterStars.max" :key="i" class="progress-star">
                  {{ i <= chapterStars.earned ? '⭐' : '☆' }}
                </span>
              </span>
              <span class="progress-text">{{ chapterStars.earned }} / {{ chapterStars.max }}</span>
            </div>
          </div>
          <div v-if="selectedChapter.completed && !isChapterBonusClaimed(selectedChapter.id)" class="claim-bonus-btn" @click="handleClaimBonus(selectedChapter.id)">
            🎁 领取奖励
          </div>
        </div>

        <div class="map-area">
          <svg class="paths-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#FFD700;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#FFA500;stop-opacity:0.8" />
              </linearGradient>
            </defs>
            <polyline
              v-if="selectedChapter"
              :points="selectedChapter.areas.map(a => `${a.position.x},${a.position.y}`).join(' ')"
              fill="none"
              stroke="url(#pathGradient)"
              stroke-width="0.8"
              stroke-dasharray="2,1"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <div
            v-for="(area, idx) in selectedChapter.areas"
            :key="area.id"
            class="area-node"
            :class="{
              unlocked: area.unlocked,
              locked: !area.unlocked,
              completed: area.completed,
              selected: selectedAreaId === area.id
            }"
            :style="{
              left: `${area.position.x}%`,
              top: `${area.position.y}%`
            }"
            @click="handleSelectArea(area.id)"
          >
            <div class="node-icon-wrapper">
              <div class="node-glow" v-if="area.unlocked"></div>
              <span class="node-icon">{{ area.unlocked ? area.icon : '🔒' }}</span>
              <div v-if="area.completed" class="node-stars">
                <span v-for="i in area.maxStars" :key="i" class="node-star">
                  {{ i <= area.stars ? '⭐' : '☆' }}
                </span>
              </div>
              <div class="node-index">{{ idx + 1 }}</div>
            </div>
            <div v-if="area.unlocked" class="node-label">{{ area.name }}</div>
          </div>
        </div>

        <div class="themes-legend">
          <span class="legend-item">
            <span class="legend-theme">{{ THEMES[selectedChapter.backgroundTheme].icon }}</span>
            当前主题：{{ THEMES[selectedChapter.backgroundTheme].name }}
          </span>
        </div>
      </div>

      <transition name="slide-up">
        <div v-if="showAreaDetail && selectedArea" class="area-detail-panel">
          <div class="detail-header">
            <div class="detail-title">
              <span class="detail-icon">{{ selectedArea.icon }}</span>
              <h3>{{ selectedArea.name }}</h3>
            </div>
            <button class="close-btn" @click="showAreaDetail = false">×</button>
          </div>

          <div class="detail-content">
            <p class="area-desc">{{ selectedArea.description }}</p>

            <div class="detail-section">
              <div class="detail-row">
                <span class="label">难度</span>
                <span class="difficulty-display">
                  <span v-for="(filled, i) in difficultyStars" :key="i" class="diff-star">
                    {{ filled ? '★' : '☆' }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="label">主题</span>
                <span class="value">{{ THEMES[selectedArea.theme].icon }} {{ THEMES[selectedArea.theme].name }}</span>
              </div>
              <div class="detail-row">
                <span class="label">目标距离</span>
                <span class="value">{{ selectedArea.targetDistance }}m</span>
              </div>
              <div class="detail-row">
                <span class="label">通关要求</span>
                <span class="value">{{ selectedArea.requiredScore }} 分 / {{ selectedArea.requiredDistance }}m</span>
              </div>
            </div>

            <div class="detail-section">
              <h4 class="section-title-small">🎯 奖励</h4>
              <div class="rewards-grid">
                <div class="reward-item coin-reward">
                  <span class="reward-icon">💰</span>
                  <span class="reward-amount">{{ selectedArea.rewards.coins }}</span>
                  <span class="reward-label">金币</span>
                </div>
                <div v-for="res in getAreaRewardResources(selectedArea.rewards)" :key="res.type" class="reward-item">
                  <span class="reward-icon">{{ res.info?.icon }}</span>
                  <span class="reward-amount">{{ res.amount }}</span>
                  <span class="reward-label">{{ res.info?.name }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section stars-section">
              <h4 class="section-title-small">⭐ 星级评价</h4>
              <div class="stars-explanation">
                <div class="star-level">
                  <span class="stars">⭐</span>
                  <span>达到最低要求</span>
                </div>
                <div class="star-level">
                  <span class="stars">⭐⭐</span>
                  <span>超过要求 1.5 倍</span>
                </div>
                <div class="star-level">
                  <span class="stars">⭐⭐⭐</span>
                  <span>超过要求 2 倍</span>
                </div>
              </div>
              <div v-if="selectedArea.completed" class="current-stars">
                本次最高：
                <span v-for="i in selectedArea.maxStars" :key="i" class="current-star">
                  {{ i <= selectedArea.stars ? '⭐' : '☆' }}
                </span>
              </div>
            </div>
          </div>

          <div class="detail-actions">
            <button
              class="btn btn-start"
              :disabled="!selectedArea.unlocked"
              @click="handleStartGame"
            >
              <span class="btn-icon">▶</span>
              开始冒险
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.map-screen {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #87CEEB 0%, #E0F6FF 50%, #90EE90 85%, #3CB371 100%);
  overflow: hidden;
}

.bonus-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 14px 28px;
  border-radius: 30px;
  font-weight: bold;
  font-size: 16px;
  z-index: 1000;
  box-shadow: 0 6px 20px rgba(255, 165, 0, 0.4);
  animation: slideDown 0.4s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-30px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.map-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 3px solid #90EE90;
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  color: #4CAF50;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 20px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.back-btn:hover {
  background: rgba(76, 175, 80, 0.1);
}

.back-icon {
  font-size: 18px;
}

.title {
  font-size: 22px;
  font-weight: 900;
  color: #2d5a27;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 26px;
}

.stars-total {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(255, 165, 0, 0.3);
}

.star-icon {
  font-size: 16px;
}

.chapters-overview {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.section-title {
  text-align: center;
  color: #2d5a27;
  font-size: 20px;
  margin: 10px 0 20px 0;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  max-width: 900px;
  margin: 0 auto;
}

.chapter-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid #90EE90;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.chapter-card.unlocked:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #4CAF50;
}

.chapter-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
  border-color: #ccc;
  background: rgba(245, 245, 245, 0.95);
}

.chapter-card.completed {
  border-color: #FFD700;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.2);
}

.chapter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  position: relative;
}

.chapter-icon {
  font-size: 42px;
  flex-shrink: 0;
}

.chapter-title-area {
  flex: 1;
  min-width: 0;
}

.chapter-name {
  font-size: 17px;
  font-weight: 900;
  color: #2d5a27;
  margin: 0 0 4px 0;
}

.chapter-stars-mini {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #b8860b;
  font-weight: 600;
}

.mini-star {
  font-size: 14px;
}

.completed-badge {
  width: 32px;
  height: 32px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.locked-badge {
  font-size: 28px;
}

.chapter-desc {
  color: #666;
  font-size: 14px;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.chapter-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.area-count {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.theme-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.unlock-hint {
  border-top: 1px dashed #ddd;
  padding-top: 10px;
}

.unlock-progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.unlock-progress {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.unlock-text {
  font-size: 12px;
  color: #999;
}

.bonus-prompt {
  margin-top: 12px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.bonus-icon {
  font-size: 18px;
}

.areas-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.chapter-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  gap: 15px;
  flex-wrap: wrap;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #4CAF50;
  color: #4CAF50;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #4CAF50;
  color: white;
}

.chapter-progress {
  flex: 1;
  text-align: center;
}

.current-chapter-name {
  font-size: 18px;
  font-weight: 900;
  color: #2d5a27;
  margin: 0 0 4px 0;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.8);
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.stars-display {
  display: flex;
  gap: 2px;
}

.progress-star {
  font-size: 18px;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #b8860b;
}

.claim-bonus-btn {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 8px 18px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  font-size: 14px;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 3px 12px rgba(255, 165, 0, 0.3);
}

.map-area {
  flex: 1;
  position: relative;
  margin: 15px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.paths-svg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.area-node {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 2;
}

.area-node:hover {
  transform: translate(-50%, -50%) scale(1.1);
  z-index: 5;
}

.area-node.selected {
  transform: translate(-50%, -50%) scale(1.15);
  z-index: 10;
}

.area-node.locked {
  cursor: not-allowed;
  opacity: 0.5;
}

.area-node.locked:hover {
  transform: translate(-50%, -50%);
}

.node-icon-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-glow {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.area-node.completed .node-glow {
  background: radial-gradient(circle, rgba(76, 175, 80, 0.5) 0%, transparent 70%);
}

.area-node.selected .node-icon-wrapper {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 8px;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
}

.node-icon {
  font-size: 36px;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.node-stars {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1px;
  background: rgba(255, 255, 255, 0.95);
  padding: 2px 6px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
}

.node-star {
  font-size: 12px;
}

.node-index {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.node-label {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.95);
  padding: 5px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.themes-legend {
  padding: 10px 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.legend-theme {
  font-size: 20px;
}

.area-detail-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 25px 25px 0 0;
  padding: 20px 24px 28px 24px;
  box-shadow: 0 -6px 30px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-height: 70%;
  overflow-y: auto;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-icon {
  font-size: 42px;
}

.detail-title h3 {
  font-size: 22px;
  font-weight: 900;
  color: #2d5a27;
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #666;
}

.area-desc {
  color: #666;
  font-size: 15px;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.detail-section {
  margin-bottom: 16px;
}

.section-title-small {
  font-size: 15px;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px 0;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  font-size: 14px;
  color: #888;
  font-weight: 500;
}

.value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.difficulty-display {
  display: flex;
  gap: 3px;
}

.diff-star {
  color: #FFD700;
  font-size: 16px;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.reward-item {
  background: linear-gradient(135deg, #f8fff8, #e8f5e9);
  border: 2px solid #90EE90;
  border-radius: 14px;
  padding: 12px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.coin-reward {
  background: linear-gradient(135deg, #fffbe6, #fff3cd);
  border-color: #FFD700;
}

.reward-icon {
  font-size: 28px;
}

.reward-amount {
  font-size: 18px;
  font-weight: 900;
  color: #2d5a27;
}

.coin-reward .reward-amount {
  color: #b8860b;
}

.reward-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.stars-section {
  background: linear-gradient(135deg, #fffbe6, #fff8e1);
  border-radius: 14px;
  padding: 14px;
  border: 2px solid #FFE082;
}

.stars-explanation {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.star-level {
  text-align: center;
  font-size: 12px;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.star-level .stars {
  font-size: 18px;
}

.current-stars {
  text-align: center;
  padding-top: 8px;
  border-top: 1px dashed #FFD700;
  font-size: 14px;
  color: #b8860b;
  font-weight: 600;
}

.current-star {
  font-size: 16px;
}

.detail-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 2px solid #f0f0f0;
}

.btn {
  width: 100%;
  padding: 16px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-start {
  background: linear-gradient(180deg, #4CAF50 0%, #388E3C 100%);
  color: white;
  box-shadow: 0 6px 0 #2E7D32, 0 8px 15px rgba(0, 0, 0, 0.15);
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 #2E7D32, 0 10px 20px rgba(0, 0, 0, 0.2);
}

.btn-start:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #2E7D32, 0 4px 10px rgba(0, 0, 0, 0.15);
}

.btn-icon {
  font-size: 18px;
}

@media (max-width: 480px) {
  .title {
    font-size: 18px;
  }
  .title-icon {
    font-size: 22px;
  }
  .stars-total {
    font-size: 12px;
    padding: 6px 12px;
  }
  .chapter-name {
    font-size: 15px;
  }
  .current-chapter-name {
    font-size: 16px;
  }
  .node-icon-wrapper {
    width: 50px;
    height: 50px;
  }
  .node-icon {
    font-size: 30px;
  }
  .stars-explanation {
    grid-template-columns: 1fr;
  }
}
</style>