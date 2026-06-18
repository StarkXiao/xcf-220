<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChallengeResult } from '../game/types'
import {
  rankingState,
  claimChallengeReward,
  clearLastChallengeResult,
  getUnclaimedChallengeCount
} from '../game/rankingStore'
import { getRatingTier } from '../game/rankingData'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'backToRanking'): void
  (e: 'startGame'): void
}>()

const result = computed<ChallengeResult | null>(() => rankingState.lastChallengeResult)
const previousTier = computed(() => {
  if (!result.value) return null
  return getRatingTier(result.value.newRating - (result.value.won ? 30 : -10))
})
const currentTier = computed(() => getRatingTier(rankingState.myRating))
const rewardClaimed = ref(false)
const remainingUnclaimed = computed(() => getUnclaimedChallengeCount())

function handleClaimReward() {
  if (!result.value || rewardClaimed.value) return
  const rewards = claimChallengeReward(result.value.challengeId)
  if (rewards) {
    rewardClaimed.value = true
  }
}

function handleBack() {
  clearLastChallengeResult()
  emit('back')
}

function handleBackToRanking() {
  clearLastChallengeResult()
  emit('backToRanking')
}
</script>

<template>
  <div class="settlement-screen">
    <div class="settlement-overlay"></div>

    <div class="settlement-content">
      <div v-if="result" class="settlement-card">
        <div class="result-banner" :class="result.won ? 'win' : 'lose'">
          <div class="banner-icon">{{ result.won ? '🏆' : '💪' }}</div>
          <h2 class="banner-title">{{ result.won ? '挑战胜利！' : '惜败了...' }}</h2>
          <p class="banner-subtitle">
            {{ result.won ? '你的实力更胜一筹！' : '再接再厉，下次一定赢！' }}
          </p>
        </div>

        <div class="versus-section">
          <div class="versus-side me">
            <div class="versus-avatar">🧑</div>
            <div class="versus-label">我</div>
            <div class="versus-score">{{ result.myScore.toLocaleString() }}</div>
          </div>
          <div class="versus-divider">
            <span class="vs-text">VS</span>
          </div>
          <div class="versus-side opponent">
            <div class="versus-avatar">{{ result.opponentAvatar }}</div>
            <div class="versus-label">{{ result.opponentName }}</div>
            <div class="versus-score">{{ result.opponentScore.toLocaleString() }}</div>
          </div>
        </div>

        <div class="score-diff" :class="result.won ? 'positive' : 'negative'">
          <span v-if="result.won">领先 {{ result.myScore - result.opponentScore }} 分</span>
          <span v-else>落后 {{ result.opponentScore - result.myScore }} 分</span>
        </div>

        <div class="rating-section">
          <div class="rating-label">竞技评分</div>
          <div class="rating-change">
            <span class="rating-value" :style="{ color: currentTier.color }">
              {{ result.newRating }}
            </span>
            <span class="rating-diff" :class="result.won ? 'up' : 'down'">
              {{ result.won ? '↑' : '↓' }}
              {{ Math.abs(result.newRating - (result.won ? result.newRating - 30 - Math.floor(Math.abs(result.myScore - result.opponentScore) * 0.1) : result.newRating + 10 + Math.floor(Math.abs(result.myScore - result.opponentScore) * 0.05))) }}
            </span>
          </div>
          <div class="tier-display">
            <span class="tier-icon">{{ currentTier.icon }}</span>
            <span class="tier-name" :style="{ color: currentTier.color }">{{ currentTier.name }}</span>
          </div>
        </div>

        <div class="rewards-section">
          <h3 class="section-title">🎁 挑战奖励</h3>
          <div class="rewards-grid">
            <div class="reward-item">
              <span class="reward-icon">💰</span>
              <span class="reward-name">金币</span>
              <span class="reward-amount">+{{ result.rewards.coins }}</span>
            </div>
            <div class="reward-item">
              <span class="reward-icon">🎫</span>
              <span class="reward-name">通行证点数</span>
              <span class="reward-amount">+{{ result.rewards.battlePassPoints }}</span>
            </div>
            <div v-if="result.rewards.title" class="reward-item title-reward">
              <span class="reward-icon">🏅</span>
              <span class="reward-name">称号</span>
              <span class="reward-amount">{{ result.rewards.title }}</span>
            </div>
          </div>

          <button
            class="claim-reward-btn"
            :class="{ claimed: rewardClaimed }"
            :disabled="rewardClaimed"
            @click="handleClaimReward"
          >
            <span v-if="!rewardClaimed">🎁 领取奖励</span>
            <span v-else>✅ 已领取</span>
          </button>
        </div>

        <div v-if="remainingUnclaimed > 0 && rewardClaimed" class="more-rewards">
          还有 {{ remainingUnclaimed }} 个挑战奖励待领取
        </div>

        <div class="actions">
          <button class="action-btn primary" @click="$emit('startGame')">
            <span class="btn-icon">▶</span>
            再来一局
          </button>
          <button class="action-btn secondary" @click="handleBackToRanking">
            <span class="btn-icon">🏆</span>
            返回排行
          </button>
          <button class="action-btn ghost" @click="handleBack">
            <span class="btn-icon">🏠</span>
            返回首页
          </button>
        </div>
      </div>

      <div v-else class="no-result">
        <div class="no-result-icon">🤔</div>
        <div class="no-result-text">暂无挑战结算数据</div>
        <button class="action-btn secondary" @click="handleBackToRanking">
          返回排行
        </button>
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
  background: rgba(0, 0, 0, 0.7);
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

.settlement-card {
  background: linear-gradient(180deg, #1e2a4a 0%, #16213e 100%);
  border-radius: 24px;
  padding: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  animation: cardEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardEnter {
  0% { opacity: 0; transform: translateY(40px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.result-banner {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px;
  border-radius: 18px;
}

.result-banner.win {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.1));
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.result-banner.lose {
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.1), rgba(144, 202, 249, 0.08));
  border: 2px solid rgba(100, 181, 246, 0.2);
}

.banner-icon {
  font-size: 56px;
  margin-bottom: 10px;
  animation: bannerPop 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes bannerPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.banner-title {
  font-size: 28px;
  font-weight: 900;
  color: white;
  margin: 0 0 6px 0;
}

.banner-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.versus-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  margin-bottom: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
}

.versus-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.versus-avatar {
  font-size: 44px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.versus-side.me .versus-avatar {
  border: 2px solid #4CAF50;
}

.versus-side.opponent .versus-avatar {
  border: 2px solid #FF6B35;
}

.versus-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.versus-score {
  font-size: 24px;
  font-weight: 900;
  color: #FFD700;
}

.versus-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}

.vs-text {
  font-size: 20px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.3);
}

.score-diff {
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 20px;
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
  width: 100%;
}

.score-diff.positive {
  background: rgba(76, 175, 80, 0.15);
  color: #4CAF50;
}

.score-diff.negative {
  background: rgba(244, 67, 54, 0.1);
  color: #F44336;
}

.rating-section {
  text-align: center;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
}

.rating-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
}

.rating-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rating-value {
  font-size: 32px;
  font-weight: 900;
}

.rating-diff {
  font-size: 16px;
  font-weight: 700;
}

.rating-diff.up {
  color: #4CAF50;
}

.rating-diff.down {
  color: #F44336;
}

.tier-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tier-icon {
  font-size: 20px;
}

.tier-name {
  font-size: 14px;
  font-weight: 700;
}

.rewards-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 12px 0;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.reward-item.title-reward {
  grid-column: span 2;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.08));
  border-color: rgba(255, 215, 0, 0.2);
}

.reward-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.reward-name {
  flex: 1;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.reward-amount {
  font-size: 14px;
  font-weight: 800;
  color: #FFD700;
}

.claim-reward-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  background: linear-gradient(135deg, #FF6B35, #F7931E);
  color: white;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.3);
}

.claim-reward-btn:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
}

.claim-reward-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.claim-reward-btn.claimed {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  box-shadow: none;
  cursor: default;
}

.more-rewards {
  text-align: center;
  font-size: 13px;
  color: #FF6B35;
  font-weight: 600;
  margin-bottom: 16px;
  padding: 8px;
  background: rgba(255, 107, 53, 0.1);
  border-radius: 10px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn.primary {
  background: linear-gradient(180deg, #4CAF50 0%, #388E3C 100%);
  color: white;
  box-shadow: 0 5px 0 #2E7D32, 0 6px 15px rgba(0, 0, 0, 0.15);
  font-size: 17px;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
}

.action-btn.primary:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 #2E7D32;
}

.action-btn.secondary {
  background: linear-gradient(180deg, #FF6B35 0%, #F7931E 100%);
  color: white;
  box-shadow: 0 4px 0 #E65100, 0 5px 12px rgba(0, 0, 0, 0.15);
}

.action-btn.secondary:hover {
  transform: translateY(-1px);
}

.action-btn.secondary:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #E65100;
}

.action-btn.ghost {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
}

.action-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-icon {
  font-size: 16px;
}

.no-result {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(180deg, #1e2a4a 0%, #16213e 100%);
  border-radius: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.no-result-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.no-result-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 24px;
}

@media (max-width: 400px) {
  .settlement-card {
    padding: 18px;
  }

  .banner-title {
    font-size: 24px;
  }

  .versus-avatar {
    font-size: 36px;
    width: 50px;
    height: 50px;
  }

  .versus-score {
    font-size: 20px;
  }

  .rating-value {
    font-size: 26px;
  }
}
</style>
