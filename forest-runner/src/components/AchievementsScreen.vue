<script setup lang="ts">
import { computed } from 'vue'
import type { Achievement } from '../game/types'

const props = defineProps<{
  achievements: Achievement[]
}>()

defineEmits<{
  (e: 'back'): void
}>()

const unlockedCount = computed(() => 
  props.achievements.filter(a => a.unlocked).length
)

const totalCount = computed(() => props.achievements.length)
</script>

<template>
  <div class="achievements-screen">
    <div class="achievements-container">
      <div class="header">
        <button class="back-btn" @click="$emit('back')">
          <span class="back-icon">←</span>
          返回
        </button>
        <h2 class="title">
          <span class="title-icon">🏅</span>
          成就
        </h2>
        <div class="progress">
          {{ unlockedCount }} / {{ totalCount }}
        </div>
      </div>

      <div class="progress-bar-container">
        <div 
          class="progress-bar" 
          :style="{ width: `${(unlockedCount / totalCount) * 100}%` }"
        ></div>
      </div>

      <div class="achievements-list">
        <div 
          v-for="achievement in achievements" 
          :key="achievement.id"
          class="achievement-card"
          :class="{ unlocked: achievement.unlocked, locked: !achievement.unlocked }"
        >
          <div class="achievement-icon">
            <span class="icon">{{ achievement.icon }}</span>
          </div>
          <div class="achievement-info">
            <h3 class="achievement-name">{{ achievement.name }}</h3>
            <p class="achievement-desc">{{ achievement.description }}</p>
          </div>
          <div class="achievement-status">
            <span v-if="achievement.unlocked" class="status-unlocked">✓</span>
            <span v-else class="status-locked">🔒</span>
          </div>
        </div>
      </div>

      <div class="footer-tip">
        <p>💪 继续挑战，解锁更多成就！</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievements-screen {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #87CEEB 0%, #E0F6FF 50%, #90EE90 85%, #3CB371 100%);
  overflow-y: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.achievements-container {
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 3px solid #90EE90;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.back-btn {
  background: none;
  border: none;
  color: #4CAF50;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  padding: 8px 12px;
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
  font-size: 24px;
  font-weight: 900;
  color: #2d5a27;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 28px;
}

.progress {
  font-size: 16px;
  font-weight: bold;
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  padding: 6px 12px;
  border-radius: 15px;
}

.progress-bar-container {
  width: 100%;
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.achievement-card.unlocked {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 2px solid #4CAF50;
  box-shadow: 0 2px 10px rgba(76, 175, 80, 0.2);
}

.achievement-card.locked {
  background: #f5f5f5;
  border: 2px solid #ddd;
  opacity: 0.7;
}

.achievement-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  font-size: 28px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.achievement-card.locked .icon {
  filter: grayscale(100%);
  opacity: 0.5;
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 4px 0;
}

.achievement-card.locked .achievement-name {
  color: #999;
}

.achievement-desc {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.achievement-card.locked .achievement-desc {
  color: #aaa;
}

.achievement-status {
  flex-shrink: 0;
}

.status-unlocked {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 16px;
}

.status-locked {
  font-size: 22px;
  opacity: 0.5;
}

.footer-tip {
  text-align: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed #ddd;
}

.footer-tip p {
  margin: 0;
  font-size: 14px;
  color: #666;
  font-style: italic;
}

@media (max-width: 480px) {
  .achievements-screen {
    padding: 10px;
  }
  
  .achievements-container {
    padding: 15px;
  }
  
  .title {
    font-size: 20px;
  }
  
  .achievement-card {
    padding: 12px;
    gap: 10px;
  }
  
  .achievement-icon {
    width: 40px;
    height: 40px;
    font-size: 22px;
  }
  
  .achievement-name {
    font-size: 14px;
  }
  
  .achievement-desc {
    font-size: 12px;
  }
}
</style>
