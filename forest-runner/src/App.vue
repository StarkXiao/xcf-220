<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HomeScreen from './components/HomeScreen.vue'
import GameCanvas from './components/GameCanvas.vue'
import AchievementsScreen from './components/AchievementsScreen.vue'
import CampScreen from './components/CampScreen.vue'
import { loadAchievements } from './game/achievements'
import { addRunRewards } from './game/campStore'
import type { Achievement, ResourceType } from './game/types'

type GameScreen = 'home' | 'game' | 'achievements' | 'camp'

const currentScreen = ref<GameScreen>('home')
const highScore = ref(0)
const achievements = ref<Achievement[]>([])
const isPlaying = ref(false)

function loadHighScore() {
  try {
    const saved = localStorage.getItem('forest-runner-highscore')
    highScore.value = saved ? parseInt(saved, 10) : 0
  } catch {
    highScore.value = 0
  }
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

function goHome() {
  currentScreen.value = 'home'
  isPlaying.value = false
  loadHighScore()
}

function handleGameOver(
  score: number,
  coins: number,
  _distance: number,
  resources: Partial<Record<ResourceType, number>>
) {
  if (score > highScore.value) {
    highScore.value = score
  }
  addRunRewards(coins, resources)
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

onMounted(() => {
  loadHighScore()
  achievements.value = loadAchievements()
})
</script>

<template>
  <div class="app">
    <HomeScreen
      v-if="currentScreen === 'home'"
      :high-score="highScore"
      @start="startGame"
      @show-achievements="showAchievements"
      @show-camp="showCamp"
    />
    
    <GameCanvas
      v-else-if="currentScreen === 'game'"
      :is-playing="isPlaying"
      @game-over="handleGameOver"
      @achievement="handleAchievement"
      @go-home="goHome"
      @go-camp="handleGoCampFromGame"
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
