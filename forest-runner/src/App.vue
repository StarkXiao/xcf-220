<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HomeScreen from './components/HomeScreen.vue'
import GameCanvas from './components/GameCanvas.vue'
import AchievementsScreen from './components/AchievementsScreen.vue'
import CampScreen from './components/CampScreen.vue'
import MapScreen from './components/MapScreen.vue'
import ChapterSettlement from './components/ChapterSettlement.vue'
import PetScreen from './components/PetScreen.vue'
import BattlePassScreen from './components/BattlePassScreen.vue'
import ShopScreen from './components/ShopScreen.vue'
import CosmeticScreen from './components/CosmeticScreen.vue'
import CheckInModal from './components/CheckInModal.vue'
import CheckInFloat from './components/CheckInFloat.vue'
import { loadAchievements } from './game/achievements'
import { addRunRewards } from './game/campStore'
import type { Achievement, ResourceType, ChapterRunResult, CheckInReward } from './game/types'
import { completeRun, getCurrentArea } from './game/chapterStore'
import { recordRunStats, checkAndResetDailyTasks, hasAnyUnclaimed } from './game/battlePassStore'
import { checkAndRefreshStock } from './game/shopStore'
import { checkCosmeticUnlocks } from './game/cosmeticStore'
import { hasUnclaimedRewards as hasCheckInUnclaimed } from './game/checkInStore'

type GameScreen = 'home' | 'game' | 'achievements' | 'camp' | 'map' | 'chapterSettlement' | 'pet' | 'battlePass' | 'shop' | 'cosmetic'

const currentScreen = ref<GameScreen>('home')
const highScore = ref(0)
const achievements = ref<Achievement[]>([])
const isPlaying = ref(false)
const chapterRunResult = ref<ChapterRunResult | null>(null)
const hasUnclaimedBadge = ref(false)
const showCheckInModal = ref(false)

function loadHighScore() {
  try {
    const saved = localStorage.getItem('forest-runner-highscore')
    highScore.value = saved ? parseInt(saved, 10) : 0
  } catch {
    highScore.value = 0
  }
}

function refreshUnclaimedBadge() {
  hasUnclaimedBadge.value = hasAnyUnclaimed() || hasCheckInUnclaimed()
}

function openCheckInModal() {
  showCheckInModal.value = true
}

function closeCheckInModal() {
  showCheckInModal.value = false
}

function handleCheckInSuccess(_rewards: CheckInReward[]) {
  refreshUnclaimedBadge()
}

function startGame() {
  isPlaying.value = false
  currentScreen.value = 'game'
  setTimeout(() => {
    isPlaying.value = true
  }, 50)
}

function showAchievements() {
  achievements.value = loadAchievements()
  currentScreen.value = 'achievements'
}

function showCamp() {
  currentScreen.value = 'camp'
}

function showMap() {
  currentScreen.value = 'map'
}

function showPets() {
  currentScreen.value = 'pet'
}

function showBattlePass() {
  checkAndResetDailyTasks()
  currentScreen.value = 'battlePass'
}

function showShop() {
  checkAndRefreshStock()
  currentScreen.value = 'shop'
}

function showCosmetic() {
  checkCosmeticUnlocks()
  currentScreen.value = 'cosmetic'
}

function goHome() {
  currentScreen.value = 'home'
  isPlaying.value = false
  loadHighScore()
  chapterRunResult.value = null
  refreshUnclaimedBadge()
}

function handleGameOver(
  score: number,
  coins: number,
  _distance: number,
  resources: Partial<Record<ResourceType, number>>,
  jumps: number
) {
  if (score > highScore.value) {
    highScore.value = score
  }
  addRunRewards(coins, resources)

  const area = getCurrentArea()
  if (area) {
    const result = completeRun(score, coins, _distance, resources)
    if (result) {
      recordRunStats(_distance, coins, result.starsEarned, jumps, true)
      chapterRunResult.value = result
      currentScreen.value = 'chapterSettlement'
      isPlaying.value = false
      refreshUnclaimedBadge()
      return
    }
  }

  recordRunStats(_distance, coins, 0, jumps, false)
  refreshUnclaimedBadge()
}

function handleAchievement(achievement: Achievement) {
  const idx = achievements.value.findIndex(a => a.id === achievement.id)
  if (idx >= 0) {
    achievements.value[idx] = { ...achievement, unlocked: true }
  }
}

function handleGoCampFromGame() {
  isPlaying.value = false
  currentScreen.value = 'camp'
}

function handleSettlementContinue() {
  currentScreen.value = 'map'
  chapterRunResult.value = null
}

function handleSettlementRestart() {
  chapterRunResult.value = null
  startGame()
}

function handleSettlementBackToMap() {
  chapterRunResult.value = null
  currentScreen.value = 'map'
}

onMounted(() => {
  loadHighScore()
  achievements.value = loadAchievements()
  checkAndResetDailyTasks()
  checkAndRefreshStock()
  refreshUnclaimedBadge()
})
</script>

<template>
  <div class="app">
    <HomeScreen
      v-if="currentScreen === 'home'"
      :high-score="highScore"
      :has-unclaimed="hasUnclaimedBadge"
      @start="startGame"
      @show-achievements="showAchievements"
      @show-camp="showCamp"
      @show-map="showMap"
      @show-battle-pass="showBattlePass"
      @show-shop="showShop"
      @show-cosmetic="showCosmetic"
      @show-check-in="openCheckInModal"
    />

    <CheckInFloat
      v-if="currentScreen === 'home'"
      @open-modal="openCheckInModal"
      @check-in-success="handleCheckInSuccess"
    />

    <CheckInModal
      v-if="showCheckInModal"
      @close="closeCheckInModal"
      @check-in-success="handleCheckInSuccess"
    />
    
    <GameCanvas
      v-else-if="currentScreen === 'game'"
      :is-playing="isPlaying"
      @game-over="handleGameOver"
      @achievement="handleAchievement"
      @go-home="goHome"
      @go-camp="handleGoCampFromGame"
      @go-map="showMap"
    />
    
    <AchievementsScreen
      v-else-if="currentScreen === 'achievements'"
      :achievements="achievements"
      @back="goHome"
    />
    
    <CampScreen
      v-else-if="currentScreen === 'camp'"
      @back="goHome"
      @start-game="startGame"
      @show-pets="showPets"
    />

    <MapScreen
      v-else-if="currentScreen === 'map'"
      @back="goHome"
      @start-game="startGame"
      @show-achievements="showAchievements"
    />

    <PetScreen
      v-else-if="currentScreen === 'pet'"
      @back="showCamp"
      @start-game="startGame"
    />

    <BattlePassScreen
      v-else-if="currentScreen === 'battlePass'"
      @back="goHome"
    />

    <ChapterSettlement
      v-else-if="currentScreen === 'chapterSettlement'"
      :result="chapterRunResult"
      @continue="handleSettlementContinue"
      @restart="handleSettlementRestart"
      @back-to-map="handleSettlementBackToMap"
      @new-achievement="handleAchievement"
    />

    <ShopScreen
      v-else-if="currentScreen === 'shop'"
      @back="goHome"
      @start-game="startGame"
    />

    <CosmeticScreen
      v-else-if="currentScreen === 'cosmetic'"
      @back="goHome"
      @start-game="startGame"
    />
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
</style>
