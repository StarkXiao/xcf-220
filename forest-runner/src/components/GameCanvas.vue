<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { GameEngine } from '../game/GameEngine'
import type { Achievement, ResourceType, StoryEvent, ActiveStoryEvent, CodexEntry, StoryReward } from '../game/types'
import GameOverScreen from './GameOverScreen.vue'
import StoryDialog from './StoryDialog.vue'
import { getCurrentArea } from '../game/chapterStore'
import { storyState } from '../game/storyStore'

const props = defineProps<{
  isPlaying: boolean
}>()

const emit = defineEmits<{
  (e: 'gameOver', score: number, coins: number, distance: number, resources: Partial<Record<ResourceType, number>>, jumps: number): void
  (e: 'achievement', achievement: Achievement): void
  (e: 'goHome'): void
  (e: 'goCamp'): void
  (e: 'goMap'): void
  (e: 'codexUnlock', entry: CodexEntry): void
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
const jumpCount = ref(0)
const codexToast = ref<CodexEntry | null>(null)
const rewardToast = ref<{ reward: StoryReward; key: number } | null>(null)
let rewardKeyCounter = 0

function handleGameOver(score: number, coins: number, distance: number, resources: Partial<Record<ResourceType, number>>) {
  if (inChapterMode.value) {
    emit('gameOver', score, coins, distance, resources, jumpCount.value)
    return
  }
  isGameOver.value = true
  finalScore.value = score
  finalCoins.value = coins
  finalDistance.value = distance
  collectedResources.value = resources
  isNewRecord.value = score > highScore.value
  highScore.value = gameEngine.value?.getHighScore() || 0
  emit('gameOver', score, coins, distance, resources, jumpCount.value)
}

function handleAchievement(achievement: Achievement) {
  achievementToast.value = achievement
  emit('achievement', achievement)
  
  setTimeout(() => {
    achievementToast.value = null
  }, 3000)
}

function handlePlayerJump() {
  jumpCount.value++
}

function handleStoryEvent(_event: StoryEvent, _activeEvent: ActiveStoryEvent) {
}

function handleCodexUnlock(entry: CodexEntry) {
  codexToast.value = entry
  emit('codexUnlock', entry)
  
  setTimeout(() => {
    if (codexToast.value?.id === entry.id) {
      codexToast.value = null
    }
  }, 4000)
}

function handleStoryReward(reward: StoryReward) {
  rewardKeyCounter++
  rewardToast.value = { reward, key: rewardKeyCounter }
  
  setTimeout(() => {
    if (rewardToast.value?.key === rewardKeyCounter) {
      rewardToast.value = null
    }
  }, 2500)
}

function handleDialogCodexUnlock(entry: CodexEntry) {
  handleCodexUnlock(entry)
}

function handleDialogReward(reward: StoryReward) {
  handleStoryReward(reward)
}

function restartGame() {
  isGameOver.value = false
  isNewRecord.value = false
  jumpCount.value = 0
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
    jumpCount.value = 0
    gameEngine.value.start()
  }
})

onMounted(() => {
  if (canvasRef.value) {
    gameEngine.value = new GameEngine(canvasRef.value)
    gameEngine.value.onGameOver(handleGameOver)
    gameEngine.value.onAchievement(handleAchievement)
    gameEngine.value.onPlayerJump(handlePlayerJump)
    gameEngine.value.onStoryEvent(handleStoryEvent)
    gameEngine.value.onCodex(handleCodexUnlock)
    gameEngine.value.onStoryReward(handleStoryReward)
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

    <Transition name="codex-toast">
      <div v-if="codexToast" class="codex-toast">
        <div class="codex-toast-icon">📖</div>
        <div class="codex-toast-content">
          <span class="codex-toast-title">图鉴解锁！</span>
          <div class="codex-toast-entry">
            <span class="codex-entry-icon">{{ codexToast.icon }}</span>
            <span class="codex-entry-name">{{ codexToast.name }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="reward-toast">
      <div v-if="rewardToast" :key="rewardToast.key" class="reward-toast">
        <span class="reward-toast-icon">🎁</span>
        <div class="reward-toast-content">
          <span v-if="rewardToast.reward.coins" class="reward-item">💰 +{{ rewardToast.reward.coins }}</span>
          <span v-if="rewardToast.reward.score" class="reward-item">⭐ +{{ rewardToast.reward.score }}</span>
          <template v-if="rewardToast.reward.resources">
            <span v-for="(amount, type) in rewardToast.reward.resources" :key="type" class="reward-item">
              {{ type === 'wood' ? '🪵' : type === 'stone' ? '🪨' : type === 'herb' ? '🌿' : type === 'crystal' ? '💎' : '🫐' }} +{{ amount }}
            </span>
          </template>
        </div>
      </div>
    </Transition>

    <StoryDialog
      :active-event="storyState.activeEvent"
      @close="() => {}"
      @codex-unlock="handleDialogCodexUnlock"
      @reward="handleDialogReward"
    />

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

.codex-toast {
  position: absolute;
  top: 180px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #01579b;
  padding: 12px 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(79, 172, 254, 0.5);
  z-index: 200;
  border: 3px solid #fff;
}

.codex-toast-icon {
  font-size: 28px;
}

.codex-toast-content {
  display: flex;
  flex-direction: column;
}

.codex-toast-title {
  font-size: 12px;
  font-weight: bold;
  opacity: 0.9;
}

.codex-toast-entry {
  display: flex;
  align-items: center;
  gap: 6px;
}

.codex-entry-icon {
  font-size: 20px;
}

.codex-entry-name {
  font-size: 16px;
  font-weight: 900;
}

.codex-toast-enter-active,
.codex-toast-leave-active {
  transition: all 0.5s ease;
}

.codex-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.codex-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

.reward-toast {
  position: absolute;
  top: 240px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  padding: 10px 18px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(17, 153, 142, 0.5);
  z-index: 199;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.reward-toast-icon {
  font-size: 22px;
}

.reward-toast-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reward-item {
  background: rgba(255, 255, 255, 0.2);
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 14px;
}

.reward-toast-enter-active,
.reward-toast-leave-active {
  transition: all 0.4s ease;
}

.reward-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) scale(0.8);
}

.reward-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(0.9);
}
</style>
