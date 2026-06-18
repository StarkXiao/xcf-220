<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HomeScreen from './components/HomeScreen.vue'
import GameCanvas from './components/GameCanvas.vue'
import AchievementsScreen from './components/AchievementsScreen.vue'
import { loadAchievements } from './game/achievements'
import type { Achievement } from './game/types'

type GameScreen = 'home' | 'game' | 'achievements'

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

function goHome() {
  currentScreen.value = 'home'
  isPlaying.value = false
  loadHighScore()
}

function handleGameOver(score: number) {
  if (score > highScore.value) {
    highScore.value = score
  }
}

function handleAchievement(achievement: Achievement) {
  const idx = achievements.value.findIndex(a => a.id === achievement.id)
  if (idx >= 0) {
    achievements.value[idx] = { ...achievement, unlocked: true }
  }
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
    />
    
    <GameCanvas
      v-else-if="currentScreen === 'game'"
      :is-playing="isPlaying"
      @game-over="handleGameOver"
      @achievement="handleAchievement"
      @go-home="goHome"
    />
    
    <AchievementsScreen
      v-else-if="currentScreen === 'achievements'"
      :achievements="achievements"
      @back="goHome"
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
