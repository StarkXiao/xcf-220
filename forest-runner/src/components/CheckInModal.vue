<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { CheckInCalendarDay, CheckInReward } from '../game/types'
import {
  checkInState,
  getCalendarData,
  getCurrentMonthInfo,
  checkIn,
  supplementCheckIn,
  canSupplementDate,
  hasCheckedInToday,
  getCheckInStats,
  getArchive,
  checkInState as state
} from '../game/checkInStore'
import { STREAK_REWARDS, EXTRA_STREAK_BONUSES } from '../game/checkInData'
import { hasResources, consumeResources } from '../game/campStore'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'checkInSuccess', rewards: CheckInReward[]): void
}>()

type TabType = 'calendar' | 'rewards' | 'archive'

const activeTab = ref<TabType>('calendar')
const showRewardAnimation = ref(false)
const lastCheckInRewards = ref<CheckInReward[]>([])
const showSupplementConfirm = ref(false)
const supplementTargetDate = ref<string | null>(null)

const currentViewYear = ref(new Date().getFullYear())
const currentViewMonth = ref(new Date().getMonth())

const calendarDays = ref<CheckInCalendarDay[]>([])
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const monthInfo = computed(() => {
  const info = getCurrentMonthInfo()
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return {
    ...info,
    displayMonth: monthNames[currentViewMonth.value],
    displayYear: currentViewYear.value
  }
})

const stats = computed(() => getCheckInStats())
const archive = computed(() => getArchive())
const canCheckIn = computed(() => !hasCheckedInToday())

function refreshCalendar() {
  calendarDays.value = getCalendarData(currentViewYear.value, currentViewMonth.value)
}

function prevMonth() {
  if (currentViewMonth.value === 0) {
    currentViewMonth.value = 11
    currentViewYear.value--
  } else {
    currentViewMonth.value--
  }
  refreshCalendar()
}

function nextMonth() {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  if (currentViewYear.value === currentYear && currentViewMonth.value === currentMonth) {
    return
  }

  if (currentViewMonth.value === 11) {
    currentViewMonth.value = 0
    currentViewYear.value++
  } else {
    currentViewMonth.value++
  }
  refreshCalendar()
}

function goToToday() {
  const now = new Date()
  currentViewYear.value = now.getFullYear()
  currentViewMonth.value = now.getMonth()
  refreshCalendar()
}

function handleDayClick(day: CheckInCalendarDay) {
  if (!day.isCurrentMonth) return

  if (day.canCheckIn) {
    handleCheckIn()
  } else if (day.canSupplement) {
    openSupplementConfirm(day.date)
  }
}

function handleCheckIn() {
  const result = checkIn()
  if (result.success) {
    lastCheckInRewards.value = result.rewards
    showRewardAnimation.value = true
    emit('checkInSuccess', result.rewards)
    refreshCalendar()

    setTimeout(() => {
      showRewardAnimation.value = false
    }, 2500)
  }
}

function openSupplementConfirm(dateKey: string) {
  if (!canSupplementDate(dateKey)) return
  supplementTargetDate.value = dateKey
  showSupplementConfirm.value = true
}

function closeSupplementConfirm() {
  showSupplementConfirm.value = false
  supplementTargetDate.value = null
}

function confirmSupplement() {
  if (!supplementTargetDate.value) return

  const cost = { coin: checkInState.supplementaryCost }
  if (!hasResources(cost)) {
    closeSupplementConfirm()
    return
  }

  if (!consumeResources(cost)) {
    closeSupplementConfirm()
    return
  }

  const result = supplementCheckIn(supplementTargetDate.value)
  if (result.success) {
    lastCheckInRewards.value = result.rewards
    if (result.rewards.length > 0) {
      showRewardAnimation.value = true
      setTimeout(() => {
        showRewardAnimation.value = false
      }, 2500)
    }
    refreshCalendar()
  }

  closeSupplementConfirm()
}

const supplementCost = computed(() => checkInState.supplementaryCost)
const supplementRemaining = computed(() => {
  return checkInState.maxSupplementaryPerMonth - checkInState.usedSupplementaryThisMonth
})

const canAffordSupplement = computed(() => {
  const cost = { coin: supplementCost.value }
  return hasResources(cost)
})

const streakRewardList = computed(() => {
  return STREAK_REWARDS.map((reward, index) => ({
    ...reward,
    day: index + 1,
    unlocked: stats.value.currentStreak >= index + 1,
    isCurrent: stats.value.currentStreak === index + 1,
    isNext: stats.value.currentStreak === index
  }))
})

const bonusRewardList = computed(() => {
  return EXTRA_STREAK_BONUSES.map(bonus => ({
    ...bonus.reward,
    streak: bonus.streak,
    unlocked: stats.value.currentStreak >= bonus.streak,
    isCurrent: stats.value.currentStreak === bonus.streak
  }))
})

watch(
  () => state.currentStreak,
  () => {
    refreshCalendar()
  }
)

onMounted(() => {
  goToToday()
})
</script>

<template>
  <div class="check-in-modal-overlay" @click.self="$emit('close')">
    <div class="check-in-modal">
      <div class="modal-header">
        <h2 class="modal-title">每日签到</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-icon">🔥</span>
          <div class="stat-info">
            <span class="stat-value">{{ stats.currentStreak }}</span>
            <span class="stat-label">连续签到</span>
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-icon">👑</span>
          <div class="stat-info">
            <span class="stat-value">{{ stats.maxStreak }}</span>
            <span class="stat-label">最长连续</span>
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📅</span>
          <div class="stat-info">
            <span class="stat-value">{{ stats.thisMonthChecked }}</span>
            <span class="stat-label">本月签到</span>
          </div>
        </div>
      </div>

      <div class="tab-bar">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'calendar' }"
          @click="activeTab = 'calendar'"
        >
          <span class="tab-icon">📆</span>
          日历视图
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'rewards' }"
          @click="activeTab = 'rewards'"
        >
          <span class="tab-icon">🎁</span>
          奖励阶梯
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'archive' }"
          @click="activeTab = 'archive'"
        >
          <span class="tab-icon">📚</span>
          存档记录
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'calendar'" class="calendar-view">
          <div class="calendar-header">
            <button class="nav-btn" @click="prevMonth">‹</button>
            <div class="month-display" @click="goToToday">
              {{ monthInfo.displayYear }}年 {{ monthInfo.displayMonth }}
            </div>
            <button
              class="nav-btn"
              :class="{ disabled: currentViewYear === monthInfo.year && currentViewMonth === monthInfo.month }"
              @click="nextMonth"
            >
              ›
            </button>
          </div>

          <div class="weekday-row">
            <div v-for="day in weekDays" :key="day" class="weekday-cell">{{ day }}</div>
          </div>

          <div class="calendar-grid">
            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              class="calendar-cell"
              :class="{
                'other-month': !day.isCurrentMonth,
                'checked-in': day.checkedIn,
                'today': day.isToday,
                'can-check-in': day.canCheckIn,
                'can-supplement': day.canSupplement,
                'supplementary': day.isSupplementary,
                'future': day.isFuture
              }"
              @click="handleDayClick(day)"
            >
              <span class="cell-day">{{ day.day }}</span>
              <span v-if="day.checkedIn" class="check-mark">✓</span>
              <span v-else-if="day.canCheckIn" class="today-dot"></span>
              <span v-else-if="day.canSupplement" class="supplement-icon">🔄</span>
              <span v-if="day.isSupplementary" class="supplement-tag">补</span>
              <span v-if="day.reward && day.checkedIn && day.streakDay" class="reward-badge">
                {{ day.reward.icon }}
              </span>
            </div>
          </div>

          <div class="check-in-action">
            <button
              v-if="canCheckIn"
              class="check-in-btn primary"
              @click="handleCheckIn"
            >
              <span class="btn-icon">✋</span>
              立即签到
            </button>
            <div v-else class="already-checked">
              <span class="check-icon">✅</span>
              今日已签到，明天继续哦~
            </div>
          </div>

          <div class="supplement-info">
            <span>补签次数: {{ supplementRemaining }}/{{ checkInState.maxSupplementaryPerMonth }}</span>
            <span class="supplement-cost">补签消耗: 💰 {{ supplementCost }}</span>
          </div>
        </div>

        <div v-else-if="activeTab === 'rewards'" class="rewards-view">
          <div class="current-streak-banner">
            <span class="streak-fire">🔥</span>
            <span class="streak-text">已连续签到 <strong>{{ stats.currentStreak }}</strong> 天</span>
            <span class="streak-fire">🔥</span>
          </div>

          <div class="streak-rewards-section">
            <h3 class="section-title">周签到奖励</h3>
            <div class="streak-rewards-grid">
              <div
                v-for="reward in streakRewardList"
                :key="reward.day"
                class="reward-card"
                :class="{ unlocked: reward.unlocked, current: reward.isCurrent, next: reward.isNext }"
              >
                <div class="reward-day">第{{ reward.day }}天</div>
                <div class="reward-icon">{{ reward.icon }}</div>
                <div class="reward-name">{{ reward.name }}</div>
                <div class="reward-amount">
                  {{ reward.amount }}
                  <span v-if="reward.resourceType">{{ reward.resourceType }}</span>
                </div>
                <div v-if="reward.unlocked" class="unlocked-badge">已领取</div>
                <div v-else-if="reward.isNext" class="next-badge">明天可得</div>
              </div>
            </div>
          </div>

          <div v-if="bonusRewardList.length > 0" class="bonus-rewards-section">
            <h3 class="section-title">里程碑奖励</h3>
            <div class="bonus-rewards-list">
              <div
                v-for="bonus in bonusRewardList"
                :key="bonus.id"
                class="bonus-card"
                :class="{ unlocked: bonus.unlocked, current: bonus.isCurrent }"
              >
                <div class="bonus-icon">{{ bonus.icon }}</div>
                <div class="bonus-info">
                  <div class="bonus-name">{{ bonus.name }}</div>
                  <div class="bonus-desc">连续签到 {{ bonus.streak }} 天</div>
                </div>
                <div class="bonus-amount">{{ bonus.amount }}</div>
                <div v-if="bonus.unlocked" class="unlocked-tag">已达成</div>
              </div>
            </div>
          </div>

          <div v-if="stats.nextReward" class="next-reward-preview">
            <span class="preview-label">下一个奖励:</span>
            <span class="preview-icon">{{ stats.nextReward.reward.icon }}</span>
            <span class="preview-name">{{ stats.nextReward.reward.name }}</span>
            <span class="preview-amount">×{{ stats.nextReward.reward.amount }}</span>
          </div>
        </div>

        <div v-else-if="activeTab === 'archive'" class="archive-view">
          <h3 class="section-title">历史签到记录</h3>

          <div v-if="archive.length === 0" class="empty-archive">
            <span class="empty-icon">📭</span>
            <p>暂无历史记录</p>
            <p class="empty-sub">每月签到记录会在次月自动归档</p>
          </div>

          <div v-else class="archive-list">
            <div v-for="entry in archive" :key="entry.month" class="archive-item">
              <div class="archive-month">{{ entry.month }}</div>
              <div class="archive-stats">
                <div class="archive-stat">
                  <span class="archive-stat-value">{{ entry.checkedDays }}/{{ entry.totalDays }}</span>
                  <span class="archive-stat-label">签到天数</span>
                </div>
                <div class="archive-stat">
                  <span class="archive-stat-value">{{ entry.maxStreak }}</span>
                  <span class="archive-stat-label">最长连续</span>
                </div>
                <div class="archive-stat">
                  <span class="archive-stat-value">{{ entry.rewardsClaimed.length }}</span>
                  <span class="archive-stat-label">奖励领取</span>
                </div>
              </div>
            </div>
          </div>

          <div class="total-stats">
            <div class="total-stat">
              <span class="total-icon">📊</span>
              <span class="total-label">累计签到</span>
              <span class="total-value">{{ stats.totalCheckedDays }} 天</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showSupplementConfirm" class="confirm-overlay" @click.self="closeSupplementConfirm">
        <div class="confirm-dialog">
          <h3 class="confirm-title">确认补签</h3>
          <p class="confirm-message">
            消耗 <span class="cost-highlight">💰 {{ supplementCost }}</span> 金币补签该日期
          </p>
          <p class="confirm-note">
            本月剩余补签次数: {{ supplementRemaining }}
          </p>
          <div v-if="!canAffordSupplement" class="not-enough">
            金币不足，无法补签
          </div>
          <div class="confirm-actions">
            <button class="cancel-btn" @click="closeSupplementConfirm">取消</button>
            <button
              class="confirm-btn"
              :class="{ disabled: !canAffordSupplement }"
              :disabled="!canAffordSupplement"
              @click="confirmSupplement"
            >
              确认补签
            </button>
          </div>
        </div>
      </div>

      <div v-if="showRewardAnimation" class="reward-animation-overlay">
        <div class="reward-animation-content">
          <div class="reward-celebration">🎉</div>
          <h3 class="reward-title">签到成功！</h3>
          <div class="reward-list-popup">
            <div v-for="reward in lastCheckInRewards" :key="reward.id" class="reward-popup-item">
              <span class="reward-popup-icon">{{ reward.icon }}</span>
              <span class="reward-popup-name">{{ reward.name }}</span>
              <span class="reward-popup-amount">+{{ reward.amount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.check-in-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.check-in-modal {
  background: linear-gradient(180deg, #fff8e7 0%, #fff 100%);
  border-radius: 24px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
  position: relative;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='20' cy='20' r='2' fill='rgba(255,255,255,0.1)'/%3E%3Ccircle cx='80' cy='30' r='3' fill='rgba(255,255,255,0.1)'/%3E%3Ccircle cx='40' cy='80' r='2.5' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E");
  pointer-events: none;
}

.modal-title {
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  color: white;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: rotate(90deg);
}

.stats-bar {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 154, 86, 0.1);
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 12px;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  font-size: 28px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #ff6b35;
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: #888;
  font-weight: 500;
}

.tab-bar {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.tab-btn {
  flex: 1;
  padding: 10px 8px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tab-btn:hover {
  background: #f0f0f0;
}

.tab-btn.active {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.tab-icon {
  font-size: 14px;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.calendar-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 10px;
  font-size: 22px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.nav-btn:hover:not(.disabled) {
  background: #e0e0e0;
}

.nav-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.month-display {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;
}

.month-display:hover {
  color: #ff6b35;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.weekday-cell {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  padding: 8px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  background: #fafafa;
}

.calendar-cell:hover {
  transform: scale(1.05);
}

.calendar-cell.other-month {
  opacity: 0.25;
  background: transparent;
  cursor: default;
}

.calendar-cell.future {
  cursor: default;
  background: #fafafa;
}

.calendar-cell.today {
  background: #fff5ee;
  border: 2px solid #ff9a56;
}

.calendar-cell.checked-in {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
}

.calendar-cell.checked-in.today {
  border-color: #22c55e;
}

.calendar-cell.can-check-in {
  background: #fff7ed;
  border: 2px dashed #ff9a56;
  animation: pulse-border 1.5s ease-in-out infinite;
}

.calendar-cell.can-supplement {
  background: #fef3c7;
  border: 2px dashed #f59e0b;
}

.calendar-cell.supplementary.checked-in {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
}

@keyframes pulse-border {
  0%, 100% { border-color: #ff9a56; }
  50% { border-color: #ff6b35; }
}

.cell-day {
  font-size: 14px;
  font-weight: 600;
}

.check-mark {
  font-size: 14px;
  font-weight: bold;
}

.today-dot {
  width: 6px;
  height: 6px;
  background: #ff6b35;
  border-radius: 50%;
  margin-top: 2px;
}

.supplement-icon {
  font-size: 12px;
  margin-top: 2px;
}

.supplement-tag {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 9px;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: 600;
}

.reward-badge {
  position: absolute;
  bottom: 1px;
  right: 1px;
  font-size: 10px;
}

.check-in-action {
  margin-top: 8px;
}

.check-in-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.check-in-btn.primary {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.check-in-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.5);
}

.check-in-btn.primary:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 22px;
}

.already-checked {
  text-align: center;
  padding: 16px;
  background: #f0fdf4;
  border-radius: 14px;
  color: #166534;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.check-icon {
  font-size: 20px;
}

.supplement-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 10px;
}

.supplement-cost {
  color: #d97706;
  font-weight: 600;
}

.rewards-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.current-streak-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 14px;
  font-size: 16px;
  color: #92400e;
}

.current-streak-banner strong {
  color: #ea580c;
  font-size: 24px;
}

.streak-fire {
  font-size: 28px;
  animation: fire-bounce 0.6s ease-in-out infinite alternate;
}

@keyframes fire-bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-4px); }
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin: 0 0 12px 0;
}

.streak-rewards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.reward-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  position: relative;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.reward-card.unlocked {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #22c55e;
}

.reward-card.current {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
}

.reward-card.next {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.reward-day {
  font-size: 10px;
  color: #888;
  font-weight: 600;
  margin-bottom: 4px;
}

.reward-card.unlocked .reward-day {
  color: #166534;
}

.reward-card.next .reward-day {
  color: #92400e;
}

.reward-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.reward-name {
  font-size: 11px;
  color: #333;
  font-weight: 600;
  margin-bottom: 2px;
}

.reward-amount {
  font-size: 12px;
  color: #ff6b35;
  font-weight: 700;
}

.unlocked-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #22c55e;
  color: white;
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.next-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #f59e0b;
  color: white;
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.bonus-rewards-section {
  margin-top: 4px;
}

.bonus-rewards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bonus-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.bonus-card.unlocked {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
}

.bonus-icon {
  font-size: 32px;
}

.bonus-info {
  flex: 1;
}

.bonus-name {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.bonus-desc {
  font-size: 12px;
  color: #888;
}

.bonus-amount {
  font-size: 18px;
  font-weight: 800;
  color: #ff6b35;
}

.unlocked-tag {
  background: #f59e0b;
  color: white;
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.next-reward-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 12px;
  font-size: 13px;
  color: #0369a1;
}

.preview-label {
  font-weight: 600;
}

.preview-icon {
  font-size: 20px;
}

.preview-name {
  font-weight: 600;
}

.preview-amount {
  color: #ea580c;
  font-weight: 700;
}

.archive-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-archive {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-archive p {
  margin: 4px 0;
}

.empty-sub {
  font-size: 12px;
  color: #aaa;
}

.archive-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.archive-item {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
}

.archive-month {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
}

.archive-stats {
  display: flex;
  gap: 16px;
}

.archive-stat {
  flex: 1;
  text-align: center;
}

.archive-stat-value {
  display: block;
  font-size: 20px;
  font-weight: 800;
  color: #ff6b35;
}

.archive-stat-label {
  font-size: 11px;
  color: #888;
}

.total-stats {
  margin-top: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
  border-radius: 12px;
}

.total-stat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
}

.total-icon {
  font-size: 24px;
}

.total-label {
  font-size: 14px;
  opacity: 0.9;
}

.total-value {
  font-size: 20px;
  font-weight: 800;
}

.confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.confirm-dialog {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 85%;
  max-width: 320px;
  text-align: center;
}

.confirm-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.confirm-message {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.cost-highlight {
  color: #d97706;
  font-weight: 700;
  font-size: 16px;
}

.confirm-note {
  margin: 0 0 16px 0;
  font-size: 12px;
  color: #888;
}

.not-enough {
  color: #dc2626;
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px;
  background: #fee2e2;
  border-radius: 8px;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e5e5e5;
}

.confirm-btn {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
  color: white;
}

.confirm-btn:hover:not(.disabled) {
  transform: translateY(-1px);
}

.confirm-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reward-animation-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.reward-animation-content {
  text-align: center;
  animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.reward-celebration {
  font-size: 64px;
  margin-bottom: 16px;
  animation: bounce 0.6s ease infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-20px); }
}

.reward-title {
  color: white;
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 20px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.reward-list-popup {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reward-popup-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 14px 24px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.reward-popup-icon {
  font-size: 32px;
}

.reward-popup-name {
  color: white;
  font-size: 16px;
  font-weight: 600;
  min-width: 80px;
  text-align: left;
}

.reward-popup-amount {
  color: #4ade80;
  font-size: 22px;
  font-weight: 800;
}

@media (max-width: 480px) {
  .check-in-modal-overlay {
    padding: 10px;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-title {
    font-size: 20px;
  }

  .stats-bar {
    padding: 12px 20px;
    gap: 8px;
  }

  .stat-item {
    padding: 10px 8px;
  }

  .stat-icon {
    font-size: 22px;
  }

  .stat-value {
    font-size: 16px;
  }

  .tab-bar {
    padding: 10px 20px;
  }

  .tab-btn {
    font-size: 12px;
    padding: 8px 6px;
  }

  .tab-content {
    padding: 16px 20px;
  }

  .streak-rewards-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .check-in-btn {
    padding: 14px;
    font-size: 16px;
  }
}
</style>
