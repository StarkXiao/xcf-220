<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ChapterRunResult, AreaNode, Chapter, PetRunContribution } from '../game/types'
import {
  getChapterById,
  getAreaById,
  chapterState,
  claimChapterBonus,
  isChapterBonusClaimed
} from '../game/chapterStore'
import { RESOURCES } from '../game/campData'
import type { AllResourceType, ResourceType, Achievement } from '../game/types'
import { checkChapterAchievements, loadAchievements } from '../game/achievements'
import {
  calculatePetRunContribution
} from '../game/petStore'

const emit = defineEmits<{
  (e: 'continue'): void
  (e: 'restart'): void
  (e: 'backToMap'): void
  (e: 'newAchievement', achievement: Achievement): void
}>()

const props = defineProps<{
  result: ChapterRunResult | null
}>()

const showNewAchievements = ref<Achievement[]>([])
const bonusClaimed = ref(false)
const showBonusClaim = ref(false)

const result = computed(() => props.result || chapterState.lastRunResult)

const chapter = computed<Chapter | null>(() => {
  if (!result.value) return null
  return getChapterById(result.value.chapterId)
})

const area = computed<AreaNode | null>(() => {
  if (!result.value) return null
  return getAreaById(result.value.chapterId, result.value.areaId)
})

const displayScore = computed(() => Math.floor(result.value?.score || 0))
const displayDistance = computed(() => Math.floor(result.value?.distance || 0))

const resourceList = computed(() => {
  if (!result.value?.resources) return []
  return Object.entries(result.value.resources)
    .filter(([, amount]) => amount && amount > 0)
    .map(([type, amount]) => ({
      type: type as ResourceType,
      amount,
      info: RESOURCES[type as ResourceType]
    }))
})

const hasStars = computed(() => (result.value?.starsEarned || 0) > 0)

const earnedStarsArray = computed(() => {
  const currentArea = area.value
  if (!currentArea) return []
  return Array.from({ length: currentArea.maxStars }, (_, i) => ({
    earned: i < (result.value?.starsEarned || 0),
    isMax: i === currentArea.maxStars - 1
  }))
})

const areaRewardResources = computed(() => {
  if (!area.value) return []
  return Object.entries(area.value.rewards.resources || {})
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => ({
      type: k as AllResourceType,
      amount: v,
      info: RESOURCES[k as AllResourceType]
    }))
})

const chapterBonusResources = computed(() => {
  if (!chapter.value) return []
  return Object.entries(chapter.value.bonusRewards.resources || {})
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => ({
      type: k as AllResourceType,
      amount: v,
      info: RESOURCES[k as AllResourceType]
    }))
})

const canClaimChapterBonus = computed(() => {
  if (!chapter.value?.completed) return false
  return !isChapterBonusClaimed(chapter.value.id)
})

const petContribution = computed<PetRunContribution | null>(() => {
  if (!result.value) return null
  return calculatePetRunContribution(
    result.value.coins,
    result.value.score,
    result.value.resources
  )
})

function handleContinue() {
  emit('continue')
}

function handleRestart() {
  emit('restart')
}

function handleBackToMap() {
  emit('backToMap')
}

function handleClaimBonus() {
  if (!chapter.value || !canClaimChapterBonus.value) return
  const success = claimChapterBonus(chapter.value.id)
  if (success) {
    bonusClaimed.value = true
    showBonusClaim.value = true
    setTimeout(() => {
      showBonusClaim.value = false
    }, 2000)
  }
}

onMounted(() => {
  const before = loadAchievements()
  const after = checkChapterAchievements([...before])
  const newlyUnlocked = after.filter(a => a.unlocked && !before.find(b => b.id === a.id)?.unlocked)

  if (newlyUnlocked.length > 0) {
    showNewAchievements.value = newlyUnlocked
    newlyUnlocked.forEach(ach => {
      emit('newAchievement', ach)
    })
  }
})
</script>

<template>
  <div class="settlement-screen">
    <div class="settlement-overlay"></div>

    <div class="settlement-content">
      <div v-if="showBonusClaim" class="bonus-claim-toast">
        🎁 章节奖励领取成功！
      </div>

      <div v-if="showNewAchievements.length > 0" class="new-achievements">
        <div
          v-for="(ach, idx) in showNewAchievements"
          :key="ach.id"
          class="achievement-popup"
          :style="{ animationDelay: `${idx * 0.3}s` }"
        >
          <span class="ach-icon">{{ ach.icon }}</span>
          <div class="ach-info">
            <span class="ach-label">成就解锁！</span>
            <span class="ach-name">{{ ach.name }}</span>
          </div>
        </div>
      </div>

      <div class="result-card">
        <div class="result-header">
          <div v-if="result?.isNewRecord" class="new-record-badge">
            🎉 新纪录！
          </div>
          <h2 class="result-title">
            {{ hasStars ? '任务完成！' : '继续努力！' }}
          </h2>
          <p class="result-subtitle">
            {{ area?.icon }} {{ area?.name }}
          </p>
        </div>

        <div v-if="area" class="stars-display-section">
          <div class="stars-container">
            <div
              v-for="(star, idx) in earnedStarsArray"
              :key="idx"
              class="star-wrapper"
              :class="{
                earned: star.earned,
                'star-pop': star.earned
              }"
              :style="{ animationDelay: `${idx * 0.2}s` }"
            >
              <span class="star-emoji">
                {{ star.earned ? '⭐' : '☆' }}
              </span>
              <div v-if="star.earned" class="star-particles">
                <span v-for="i in 6" :key="i" class="particle" :style="{ '--i': i }">✨</span>
              </div>
            </div>
          </div>
          <div class="stars-summary">
            获得 <strong>{{ result?.starsEarned || 0 }}</strong> / {{ area.maxStars }} 星
          </div>
        </div>

        <div class="stats-section">
          <div class="main-stat">
            <div class="stat-label">得分</div>
            <div class="stat-value score">{{ displayScore }}</div>
          </div>

          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-icon">🏃</span>
              <span class="stat-label-mini">距离</span>
              <span class="stat-value-mini">{{ displayDistance }}m</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">💰</span>
              <span class="stat-label-mini">金币</span>
              <span class="stat-value-mini">{{ result?.coins || 0 }}</span>
            </div>
          </div>

          <div class="targets-comparison" v-if="area">
            <div class="target-row">
              <span class="target-label">最低得分</span>
              <div class="target-bar-wrapper">
                <div
                  class="target-bar score-bar"
                  :style="{ width: `${Math.min(100, (displayScore / area.requiredScore) * 100)}%` }"
                ></div>
                <span class="target-text">{{ displayScore }} / {{ area.requiredScore }}</span>
              </div>
              <span class="target-status" :class="displayScore >= area.requiredScore ? 'passed' : 'failed'">
                {{ displayScore >= area.requiredScore ? '✓' : '✗' }}
              </span>
            </div>
            <div class="target-row">
              <span class="target-label">最低距离</span>
              <div class="target-bar-wrapper">
                <div
                  class="target-bar distance-bar"
                  :style="{ width: `${Math.min(100, (displayDistance / area.requiredDistance) * 100)}%` }"
                ></div>
                <span class="target-text">{{ displayDistance }}m / {{ area.requiredDistance }}m</span>
              </div>
              <span class="target-status" :class="displayDistance >= area.requiredDistance ? 'passed' : 'failed'">
                {{ displayDistance >= area.requiredDistance ? '✓' : '✗' }}
              </span>
            </div>
          </div>
        </div>

        <div class="rewards-section">
          <h3 class="section-title">🎁 本局收集</h3>
          <div class="collected-resources">
            <div class="resource-item coin-item">
              <span class="res-icon">💰</span>
              <span class="res-name">金币</span>
              <span class="res-amount">+{{ result?.coins || 0 }}</span>
            </div>
            <div
              v-for="res in resourceList"
              :key="res.type"
              class="resource-item"
            >
              <span class="res-icon">{{ res.info?.icon }}</span>
              <span class="res-name">{{ res.info?.name }}</span>
              <span class="res-amount">+{{ res.amount }}</span>
            </div>
          </div>

          <div v-if="petContribution" class="pet-contribution">
            <div class="pet-contribution-header">
              <span class="pet-contribution-icon">{{ petContribution.petIcon }}</span>
              <div class="pet-contribution-info">
                <span class="pet-contribution-name">{{ petContribution.petName }}</span>
                <span class="pet-contribution-label">宠物加成</span>
              </div>
            </div>
            <div class="pet-bonus-list">
              <div v-if="petContribution.bonusCoins > 0" class="pet-bonus-item">
                <span class="bonus-icon">💰</span>
                <span class="bonus-text">金币</span>
                <span class="bonus-value">+{{ petContribution.bonusCoins }}</span>
              </div>
              <div v-if="petContribution.bonusScore > 0" class="pet-bonus-item">
                <span class="bonus-icon">⭐</span>
                <span class="bonus-text">得分</span>
                <span class="bonus-value">+{{ petContribution.bonusScore }}</span>
              </div>
              <div
                v-for="(amount, type) in petContribution.bonusResources"
                :key="type"
                v-show="amount && amount > 0"
                class="pet-bonus-item"
              >
                <span class="bonus-icon">{{ RESOURCES[type as ResourceType]?.icon }}</span>
                <span class="bonus-text">{{ RESOURCES[type as ResourceType]?.name }}</span>
                <span class="bonus-value">+{{ amount }}</span>
              </div>
            </div>
          </div>

          <div v-if="hasStars && area && areaRewardResources.length > 0" class="bonus-rewards">
            <div class="bonus-title">⭐ 通关奖励</div>
            <div class="bonus-rewards-grid">
              <div class="resource-item bonus-item">
                <span class="res-icon">💰</span>
                <span class="res-name">金币</span>
                <span class="res-amount">+{{ area.rewards.coins }}</span>
              </div>
              <div
                v-for="res in areaRewardResources"
                :key="res.type"
                class="resource-item bonus-item"
              >
                <span class="res-icon">{{ res.info?.icon }}</span>
                <span class="res-name">{{ res.info?.name }}</span>
                <span class="res-amount">+{{ res.amount }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="chapter?.completed && canClaimChapterBonus"
          class="chapter-bonus-section"
        >
          <div class="bonus-card" @click="handleClaimBonus">
            <div class="bonus-card-icon">🎁</div>
            <div class="bonus-card-content">
              <h4 class="bonus-card-title">章节完成奖励</h4>
              <div class="bonus-card-rewards">
                <span class="mini-reward">💰 +{{ chapter.bonusRewards.coins }}</span>
                <span
                  v-for="res in chapterBonusResources.slice(0, 3)"
                  :key="res.type"
                  class="mini-reward"
                >
                  {{ res.info?.icon }} +{{ res.amount }}
                </span>
              </div>
            </div>
            <button class="claim-btn">领取</button>
          </div>
        </div>

        <div v-if="chapter?.areas.every(a => a.stars >= 3)" class="perfect-chapter">
          <div class="perfect-icon">🎖️</div>
          <div class="perfect-text">完美通关！本章节全三星达成！</div>
        </div>

        <div class="actions-section">
          <button class="action-btn btn-primary" @click="handleContinue">
            <span class="btn-ic">▶</span>
            继续
          </button>
          <div class="secondary-actions">
            <button class="action-btn btn-secondary" @click="handleRestart">
              <span class="btn-ic">🔄</span>
              再来一次
            </button>
            <button class="action-btn btn-secondary" @click="handleBackToMap">
              <span class="btn-ic">🗺️</span>
              返回地图
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settlement-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.settlement-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(5px);
}

.settlement-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
}

.bonus-claim-toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: bold;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(255, 165, 0, 0.4);
  animation: slideDown 0.4s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.new-achievements {
  position: fixed;
  top: 110px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 999;
}

.achievement-popup {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 10px 18px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(255, 165, 0, 0.4);
  border: 2px solid white;
  animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes popIn {
  0% { opacity: 0; transform: scale(0.8) translateY(-10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.ach-icon {
  font-size: 26px;
}

.ach-info {
  display: flex;
  flex-direction: column;
}

.ach-label {
  font-size: 11px;
  opacity: 0.9;
}

.ach-name {
  font-size: 14px;
  font-weight: 900;
}

.result-card {
  background: linear-gradient(180deg, #ffffff 0%, #f0fff0 100%);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  border: 3px solid #90EE90;
  animation: cardEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardEnter {
  0% { opacity: 0; transform: translateY(40px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.result-header {
  text-align: center;
  margin-bottom: 18px;
  position: relative;
}

.new-record-badge {
  display: inline-block;
  background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700);
  background-size: 200% 100%;
  color: #8B4513;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.result-title {
  font-size: 28px;
  font-weight: 900;
  color: #2d5a27;
  margin: 0 0 6px 0;
  text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.8);
}

.result-subtitle {
  font-size: 16px;
  color: #555;
  margin: 0;
  font-weight: 500;
}

.stars-display-section {
  text-align: center;
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #fffbe6, #fff3cd);
  border-radius: 16px;
  border: 2px solid #FFE082;
}

.stars-container {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 10px;
}

.star-wrapper {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.star-emoji {
  font-size: 48px;
  filter: grayscale(100%) opacity(0.3);
  transition: all 0.5s ease;
}

.star-wrapper.earned .star-emoji {
  filter: none;
  animation: starBounce 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes starBounce {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  50% { transform: scale(1.3) rotate(10deg); }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

.star-wrapper.star-pop {
  animation-delay: 0s;
}

.star-particles {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 16px;
  opacity: 0;
  animation: particleExplode 1s ease-out forwards;
  animation-delay: 0.3s;
  --angle: calc(var(--i) * 60deg);
}

@keyframes particleExplode {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-40px);
  }
}

.stars-summary {
  font-size: 15px;
  color: #b8860b;
  font-weight: 600;
}

.stars-summary strong {
  color: #FF8C00;
  font-size: 18px;
}

.stats-section {
  margin-bottom: 18px;
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.main-stat {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.stat-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value.score {
  font-size: 42px;
  font-weight: 900;
  color: #4CAF50;
  text-shadow: 2px 2px 0 #e8f5e9;
  line-height: 1;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-icon {
  font-size: 24px;
}

.stat-label-mini {
  font-size: 12px;
  color: #888;
}

.stat-value-mini {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.targets-comparison {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.target-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.target-label {
  width: 70px;
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
}

.target-bar-wrapper {
  flex: 1;
  height: 18px;
  background: #f0f0f0;
  border-radius: 9px;
  position: relative;
  overflow: hidden;
}

.target-bar {
  height: 100%;
  border-radius: 9px;
  transition: width 1s ease;
}

.score-bar {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.distance-bar {
  background: linear-gradient(90deg, #2196F3, #03A9F4);
}

.target-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.target-status {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.target-status.passed {
  background: #4CAF50;
  color: white;
}

.target-status.failed {
  background: #f5f5f5;
  color: #ccc;
}

.rewards-section {
  margin-bottom: 18px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px 0;
}

.collected-resources {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fff8;
  border: 1px solid #c8e6c9;
  padding: 8px 10px;
  border-radius: 10px;
}

.resource-item.coin-item {
  background: #fffbe6;
  border-color: #FFE082;
}

.res-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.res-name {
  flex: 1;
  font-size: 13px;
  color: #555;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.res-amount {
  font-size: 14px;
  font-weight: bold;
  color: #2d5a27;
  flex-shrink: 0;
}

.coin-item .res-amount {
  color: #b8860b;
}

.pet-contribution {
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
  border-radius: 12px;
  border: 2px solid #ce93d8;
}

.pet-contribution-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.pet-contribution-icon {
  font-size: 36px;
}

.pet-contribution-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pet-contribution-name {
  font-size: 16px;
  font-weight: bold;
  color: #6a1b9a;
}

.pet-contribution-label {
  font-size: 12px;
  color: #9c27b0;
  font-weight: 500;
}

.pet-bonus-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.pet-bonus-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.7);
  padding: 6px 10px;
  border-radius: 8px;
}

.bonus-icon {
  font-size: 18px;
}

.bonus-text {
  flex: 1;
  font-size: 12px;
  color: #666;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bonus-value {
  font-size: 13px;
  font-weight: bold;
  color: #6a1b9a;
  flex-shrink: 0;
}

.bonus-rewards {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px dashed #90EE90;
}

.bonus-title {
  font-size: 13px;
  font-weight: 600;
  color: #FF8C00;
  margin-bottom: 8px;
}

.bonus-rewards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.resource-item.bonus-item {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border-color: #FFCC80;
  animation: bonusGlow 2s ease-in-out infinite;
}

@keyframes bonusGlow {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 140, 0, 0); }
  50% { box-shadow: 0 0 12px rgba(255, 140, 0, 0.3); }
}

.chapter-bonus-section {
  margin-bottom: 18px;
}

.bonus-card {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border: 2px solid #FFB74D;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: cardPulse 2s ease-in-out infinite;
}

@keyframes cardPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.bonus-card:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 16px rgba(255, 140, 0, 0.3);
}

.bonus-card-icon {
  font-size: 40px;
  flex-shrink: 0;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.bonus-card-content {
  flex: 1;
  min-width: 0;
}

.bonus-card-title {
  font-size: 15px;
  font-weight: 800;
  color: #E65100;
  margin: 0 0 6px 0;
}

.bonus-card-rewards {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-reward {
  background: rgba(255, 255, 255, 0.7);
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #E65100;
}

.claim-btn {
  background: linear-gradient(135deg, #FF8C00, #FF6600);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(255, 102, 0, 0.3);
  flex-shrink: 0;
  transition: all 0.2s;
}

.claim-btn:hover {
  transform: scale(1.05);
}

.claim-btn:active {
  transform: scale(0.95);
}

.perfect-chapter {
  margin-bottom: 18px;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border: 2px solid #81C784;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.perfect-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.perfect-text {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: #2E7D32;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(180deg, #4CAF50 0%, #388E3C 100%);
  color: white;
  box-shadow: 0 5px 0 #2E7D32, 0 6px 15px rgba(0, 0, 0, 0.15);
  font-size: 18px;
  padding: 16px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 0 #2E7D32, 0 8px 20px rgba(0, 0, 0, 0.2);
}

.btn-primary:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 #2E7D32, 0 4px 10px rgba(0, 0, 0, 0.15);
}

.secondary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-secondary {
  background: linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #555;
  box-shadow: 0 4px 0 #bdbdbd;
  font-size: 14px;
}

.btn-secondary:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 0 #bdbdbd, 0 6px 12px rgba(0, 0, 0, 0.1);
}

.btn-secondary:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #bdbdbd, 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-ic {
  font-size: 16px;
}

@media (max-width: 400px) {
  .settlement-content {
    padding: 10px;
  }
  .result-card {
    padding: 18px;
  }
  .result-title {
    font-size: 24px;
  }
  .star-wrapper {
    width: 48px;
    height: 48px;
  }
  .star-emoji {
    font-size: 40px;
  }
  .stat-value.score {
    font-size: 36px;
  }
}
</style>