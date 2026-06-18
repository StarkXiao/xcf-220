<script setup lang="ts">
import { computed } from 'vue'
import {
  getCheckInStats,
  dismissHomeFloat,
  checkIn,
  shouldShowHomeFloat
} from '../game/checkInStore'
import type { CheckInReward } from '../game/types'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'openModal'): void
  (e: 'checkInSuccess', rewards: CheckInReward[]): void
}>()

const showCheckAnimation = ref(false)
const lastRewards = ref<CheckInReward[]>([])

const stats = computed(() => getCheckInStats())
const visible = computed(() => shouldShowHomeFloat())
const nextReward = computed(() => stats.value.nextReward)

function handleQuickCheckIn() {
  const result = checkIn()
  if (result.success) {
    lastRewards.value = result.rewards
    showCheckAnimation.value = true
    emit('checkInSuccess', result.rewards)

    setTimeout(() => {
      showCheckAnimation.value = false
    }, 2000)
  }
}

function handleDismiss() {
  dismissHomeFloat()
}

function handleOpenModal() {
  dismissHomeFloat()
  emit('openModal')
}
</script>

<template>
  <Transition name="float">
    <div v-if="visible" class="check-in-float">
      <div class="float-content">
        <div class="float-icon">
          <span class="gift-icon">🎁</span>
          <span class="pulse-ring"></span>
        </div>

        <div class="float-info">
          <div class="float-title">每日签到</div>
          <div class="float-subtitle">
            <span v-if="stats.currentStreak > 0">
              已连续签到 <strong>{{ stats.currentStreak }}</strong> 天
            </span>
            <span v-else>今天还没签到哦~</span>
          </div>
          <div v-if="nextReward" class="float-next-reward">
            <span class="reward-icon">{{ nextReward.reward.icon }}</span>
            <span class="reward-text">{{ nextReward.reward.name }} ×{{ nextReward.reward.amount }}</span>
          </div>
        </div>

        <div class="float-actions">
          <button class="quick-check-btn" @click="handleQuickCheckIn">
            <span>✋</span>
            立即签到
          </button>
          <button class="detail-btn" @click="handleOpenModal">
            详情
          </button>
        </div>

        <button class="close-float" @click="handleDismiss" title="今日不再提醒">
          ×
        </button>
      </div>

      <div v-if="showCheckAnimation" class="check-animation-overlay">
        <div class="check-animation-content">
          <div class="success-icon">✨</div>
          <div class="success-text">签到成功！</div>
          <div class="rewards-show">
            <div v-for="reward in lastRewards" :key="reward.id" class="reward-item">
              <span class="reward-emoji">{{ reward.icon }}</span>
              <span class="reward-name">{{ reward.name }}</span>
              <span class="reward-amount">+{{ reward.amount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.check-in-float {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: calc(100% - 40px);
  max-width: 480px;
}

.float-content {
  position: relative;
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
  border-radius: 20px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 12px 32px rgba(255, 107, 53, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.float-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.float-icon {
  position: relative;
  flex-shrink: 0;
}

.gift-icon {
  font-size: 44px;
  display: block;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-6px) rotate(5deg); }
}

.pulse-ring {
  position: absolute;
  inset: -8px;
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: pulse-ring 1.5s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.float-info {
  flex: 1;
  min-width: 0;
  color: white;
}

.float-title {
  font-size: 18px;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 2px;
}

.float-subtitle {
  font-size: 13px;
  opacity: 0.95;
  margin-bottom: 4px;
}

.float-subtitle strong {
  color: #fef08a;
  font-size: 15px;
}

.float-next-reward {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 12px;
  width: fit-content;
}

.reward-icon {
  font-size: 14px;
}

.reward-text {
  font-weight: 600;
}

.float-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.quick-check-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  white-space: nowrap;
}

.quick-check-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.5);
}

.quick-check-btn:active {
  transform: translateY(0);
}

.quick-check-btn span {
  font-size: 16px;
}

.detail-btn {
  padding: 6px 12px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-float {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  color: white;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-float:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: rotate(90deg);
}

.check-animation-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.check-animation-content {
  text-align: center;
  color: white;
  animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.success-icon {
  font-size: 48px;
  margin-bottom: 8px;
  animation: sparkle 0.6s ease infinite alternate;
}

@keyframes sparkle {
  from { transform: scale(1) rotate(0deg); }
  to { transform: scale(1.1) rotate(10deg); }
}

.success-text {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.rewards-show {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reward-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 12px;
}

.reward-emoji {
  font-size: 24px;
}

.reward-name {
  font-size: 14px;
  font-weight: 600;
  min-width: 60px;
  text-align: left;
}

.reward-amount {
  font-size: 18px;
  font-weight: 800;
  color: #4ade80;
}

.float-enter-active,
.float-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.float-enter-from,
.float-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(100px);
}

@media (max-width: 480px) {
  .check-in-float {
    bottom: 16px;
    width: calc(100% - 24px);
  }

  .float-content {
    padding: 14px 16px;
    gap: 12px;
  }

  .gift-icon {
    font-size: 36px;
  }

  .float-title {
    font-size: 16px;
  }

  .float-subtitle {
    font-size: 12px;
  }

  .quick-check-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
}
</style>
