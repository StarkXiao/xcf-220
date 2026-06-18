<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { GameEngine } from '../game/GameEngine'
import type { Achievement, ResourceType } from '../game/types'
import GameOverScreen from './GameOverScreen.vue'
import { getCurrentArea } from '../game/chapterStore'

const props = defineProps<{
  isPlaying: boolean
}>()

const emit = defineEmits<{
  (e: 'gameOver', score: number, coins: number, distance: number, resources: Partial<Record<ResourceType, number>>): void
  (e: 'achievement', achievement: Achievement): void
  (e: 'goHome'): void
  (e: 'goCamp'): void
  (e: 'goMap'): void
  (e: 'playerJump'): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameEngine = ref<GameEngine | null>(null)
const isGameOver = ref(false)
const finalScore = ref(0)
const finalCoins = ref(0)
const finalDistance = ref(0)
const collectedResources = ref<Partial<Record<ResourceType, number>>>({})
const highScore = ref(0)
const isNewRecord = ref(false)
const achievementToast = ref<Achievement | null>(null)
const inChapterMode = ref(false)

function handleGameOver(score: number, coins: number, distance: number, resources: Partial<Record<ResourceType, number>>) {
  if (inChapterMode.value) {
    emit('gameOver', score, coins, distance, resources)
    return
  }
  isGameOver.value = true
  finalScore.value = score
  finalCoins.value = coins
  finalDistance.value = distance
  collectedResources.value = resources
  isNewRecord.value = score > highScore.value
  highScore.value = gameEngine.value?.getHighScore() || 0
  emit('gameOver', score, coins, distance, resources)
}

function handleAchievement(achievement: Achievement) {
  achievementToast.value = achievement
  emit('achievement', achievement)
  
  setTimeout(() => {
    achievementToast.value = null
  }, 3000)
}

function handlePlayerJump() {
  emit('playerJump')
}

function restartGame() {
  isGameOver.value = false
  isNewRecord.value = false
  gameEngine.value?.start()
}

function goHome() {
  isGameOver.value = false
  isNewRecord.value = false
  gameEngine.value?.stop()
  emit('goHome')
}

function goCamp() {
  isGameOver.value = false
  isNewRecord.value = false
  gameEngine.value?.stop()
  emit('goCamp')
}

function goMap() {
  isGameOver.value = false
  isNewRecord.value = false
  gameEngine.value?.stop()
  emit('goMap')
}

watch(() => props.isPlaying, (playing) => {
  if (playing && gameEngine.value) {
    isGameOver.value = false
    inChapterMode.value = !!getCurrentArea()
    gameEngine.value.start()
  }
})

onMounted(() => {
  if (canvasRef.value) {
    gameEngine.value = new GameEngine(canvasRef.value)
    gameEngine.value.onGameOver(handleGameOver)
    gameEngine.value.onAchievement(handleAchievement)
    gameEngine.value.onPlayerJump(handlePlayerJump)
    highScore.value = gameEngine.value.getHighScore()
  }
})

onUnmounted(() => {
  gameEngine.value?.stop()
})
</script>

<template>
  <div class="game-container">
    <canvas ref="canvasRef" class="game-canvas"></canvas>
    
    <div v-if="achievementToast" class="achievement-toast">
      <span class="toast-icon">{{ achievementToast.icon }}</span>
      <div class="toast-content">
        <span class="toast-title">成就解锁！</span>
        <span class="toast-name">{{ achievementToast.name }}</span>
      </div>
    </div>

    <GameOverScreen
      v-if="isGameOver && !inChapterMode"
      :score="finalScore"
      :coins="finalCoins"
      :distance="finalDistance"
      :high-score="highScore"
      :is-new-record="isNewRecord"
      :collected-resources="collectedResources"
      @restart="restartGame"
      @home="goHome"
      @go-camp="goCamp"
      @go-map="goMap"
    />
  </div>
</template>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
  cursor: pointer;
}

.achievement-toast {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #8B4513;
  padding: 12px 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(255, 165, 0, 0.5);
  animation: slideDown 0.5s ease, fadeOut 0.5s ease 2.5s forwards;
  z-index: 200;
  border: 3px solid #fff;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.toast-icon {
  font-size: 32px;
}

.toast-content {
  display: flex;
  flex-direction: column;
}

.toast-title {
  font-size: 12px;
  font-weight: bold;
  opacity: 0.9;
}

.toast-name {
  font-size: 16px;
  font-weight: 900;
}
</style>
