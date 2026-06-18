<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  coins: number
  distance: number
  highScore: number
  isNewRecord: boolean
}>()

defineEmits<{
  (e: 'restart'): void
  (e: 'home'): void
}>()

const displayScore = computed(() => Math.floor(props.score))
const displayDistance = computed(() => Math.floor(props.distance))
</script>

<template>
  <div class="gameover-screen">
    <div class="gameover-content">
      <div class="result-header">
        <h2 class="gameover-title">游戏结束</h2>
        <div class="gameover-emoji">😢</div>
      </div>

      <div v-if="isNewRecord" class="new-record">
        <span class="record-icon">🎉</span>
        <span>新纪录！</span>
        <span class="record-icon">🎉</span>
      </div>

      <div class="stats-card">
        <div class="stat-item main-stat">
          <span class="stat-label">得分</span>
          <span class="stat-value score-value">{{ displayScore }}</span>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-icon">💰</span>
            <span class="stat-label">金币</span>
            <span class="stat-value">{{ coins }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🏃</span>
            <span class="stat-label">距离</span>
            <span class="stat-value">{{ displayDistance }}m</span>
          </div>
        </div>
      </div>

      <div class="high-score-info">
        <span class="trophy">🏆</span>
        <span>最高分: {{ highScore }}</span>
      </div>

      <div class="buttons">
        <button class="btn btn-restart" @click="$emit('restart')">
          <span class="btn-icon">🔄</span>
          再来一次
        </button>
        <button class="btn btn-home" @click="$emit('home')">
          <span class="btn-icon">🏠</span>
          返回首页
        </button>
      </div>

      <div class="tips">
        <p>💡 提示：收集魔法药水可以获得短暂无敌！</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gameover-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.gameover-content {
  background: linear-gradient(180deg, #f0fff0 0%, #e0ffe0 100%);
  border-radius: 25px;
  padding: 30px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  border: 4px solid #90EE90;
  animation: slideUp 0.4s ease;
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

.result-header {
  margin-bottom: 15px;
}

.gameover-title {
  font-size: 32px;
  font-weight: 900;
  color: #2d5a27;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 0 #fff;
}

.gameover-emoji {
  font-size: 50px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.new-record {
  background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700);
  background-size: 200% 100%;
  color: #8B4513;
  padding: 12px 20px;
  border-radius: 30px;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: shimmer 2s linear infinite, pulse 0.5s ease;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.record-icon {
  font-size: 24px;
}

.stats-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-item.main-stat {
  margin-bottom: 15px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-value.score-value {
  font-size: 42px;
  color: #4CAF50;
  text-shadow: 2px 2px 0 #e8f5e9;
}

.stat-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, #90EE90, transparent);
  margin: 15px 0;
}

.stat-row {
  display: flex;
  justify-content: space-around;
}

.stat-row .stat-item {
  flex: 1;
}

.stat-icon {
  font-size: 28px;
}

.high-score-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 215, 0, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: bold;
  color: #b8860b;
  margin-bottom: 25px;
  border: 2px solid #FFD700;
}

.trophy {
  font-size: 20px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.btn {
  padding: 14px 30px;
  font-size: 18px;
  font-weight: bold;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.btn:hover {
  transform: scale(1.03);
}

.btn:active {
  transform: scale(0.97);
}

.btn-restart {
  background: linear-gradient(180deg, #4CAF50 0%, #388E3C 100%);
  color: white;
  box-shadow: 0 4px 0 #2E7D32;
}

.btn-restart:active {
  box-shadow: 0 2px 0 #2E7D32;
  transform: translateY(2px) scale(0.97);
}

.btn-home {
  background: linear-gradient(180deg, #87CEEB 0%, #4682B4 100%);
  color: white;
  box-shadow: 0 4px 0 #2F6F9F;
}

.btn-home:active {
  box-shadow: 0 2px 0 #2F6F9F;
  transform: translateY(2px) scale(0.97);
}

.btn-icon {
  font-size: 18px;
}

.tips {
  font-size: 13px;
  color: #666;
  font-style: italic;
}

.tips p {
  margin: 0;
}

@media (max-width: 400px) {
  .gameover-content {
    padding: 20px;
  }
  
  .gameover-title {
    font-size: 26px;
  }
  
  .stat-value.score-value {
    font-size: 36px;
  }
}
</style>
