<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { RankingTabType, ChallengeRecord } from '../game/types'
import {
  rankingState,
  refreshRankings,
  sendChallenge,
  acceptChallenge,
  declineChallenge,
  getUnclaimedChallengeCount,
  getPendingIncomingCount,
  getActiveChallengeForFriend,
  claimChallengeReward,
  checkCanChallenge,
  addMockIncomingChallenge
} from '../game/rankingStore'
import { getRankTitle, getRatingTier } from '../game/rankingData'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'showSettlement'): void
  (e: 'startGame'): void
}>()

const activeTab = ref<RankingTabType>('friends')
const challengeTargetId = ref<string | null>(null)
const showChallengeConfirm = ref(false)
const showIncomingDetail = ref<ChallengeRecord | null>(null)
const toastMessage = ref('')
const toastVisible = ref(false)

const ratingTier = computed(() => getRatingTier(rankingState.myRating))
const unclaimedCount = computed(() => getUnclaimedChallengeCount())
const pendingIncomingCount = computed(() => getPendingIncomingCount())

const friendRanking = computed(() => rankingState.friendRanking)
const globalRanking = computed(() => rankingState.globalRanking)
const incomingChallenges = computed(() =>
  rankingState.incomingChallenges.filter(c => c.status === 'pending')
)
const outgoingChallenges = computed(() => rankingState.outgoingChallenges)
const challengeHistory = computed(() =>
  rankingState.challengeHistory.filter(c => c.status === 'completed').slice(0, 10)
)

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2500)
}

function handleChallengeFriend(friendId: string, friendName: string) {
  const check = checkCanChallenge(friendId)
  if (!check.canChallenge) {
    showToast(check.reason || '无法挑战')
    return
  }
  challengeTargetId.value = friendId
  showChallengeConfirm.value = true
}

function confirmChallenge() {
  if (!challengeTargetId.value) return
  const result = sendChallenge(challengeTargetId.value)
  showChallengeConfirm.value = false
  if (result) {
    showToast('挑战已发送！')
  }
  challengeTargetId.value = null
}

function cancelChallengeConfirm() {
  showChallengeConfirm.value = false
  challengeTargetId.value = null
}

function handleAcceptChallenge(challengeId: string) {
  const success = acceptChallenge(challengeId)
  if (success) {
    showToast('已接受挑战！')
    showIncomingDetail.value = null
  }
}

function handleDeclineChallenge(challengeId: string) {
  const success = declineChallenge(challengeId)
  if (success) {
    showToast('已拒绝挑战')
    showIncomingDetail.value = null
  }
}

function handleClaimReward(challengeId: string) {
  const rewards = claimChallengeReward(challengeId)
  if (rewards) {
    showToast(`领取成功！💰+${rewards.coins} 🎫+${rewards.battlePassPoints}`)
  }
}

function getChallengeStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '等待回应',
    accepted: '已接受',
    in_progress: '对决中',
    completed: '已完成',
    expired: '已过期',
    declined: '已拒绝'
  }
  return map[status] || status
}

function getChallengeStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: '#FF9800',
    accepted: '#4CAF50',
    in_progress: '#2196F3',
    completed: '#9E9E9E',
    expired: '#BDBDBD',
    declined: '#F44336'
  }
  return map[status] || '#999'
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${Math.floor(diff / 86400000)}天前`
}

function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return ''
}

onMounted(() => {
  refreshRankings()
  if (Math.random() > 0.5 && rankingState.incomingChallenges.length === 0) {
    addMockIncomingChallenge()
  }
})
</script>

<template>
  <div class="ranking-screen">
    <div v-if="toastVisible" class="toast">{{ toastMessage }}</div>

    <div class="ranking-header">
      <button class="back-btn" @click="$emit('back')">← 返回</button>
      <h2 class="screen-title">🏆 好友排行与挑战</h2>
      <div class="rating-badge" :style="{ borderColor: ratingTier.color }">
        <span class="tier-icon">{{ ratingTier.icon }}</span>
        <span class="tier-name" :style="{ color: ratingTier.color }">{{ ratingTier.name }}</span>
        <span class="tier-score">{{ rankingState.myRating }}</span>
      </div>
    </div>

    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'friends' }"
        @click="activeTab = 'friends'"
      >
        👥 好友排行
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'global' }"
        @click="activeTab = 'global'"
      >
        🌍 全球排行
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'challenge' }"
        @click="activeTab = 'challenge'"
      >
        ⚔️ 好友约战
        <span v-if="pendingIncomingCount > 0" class="tab-badge">{{ pendingIncomingCount }}</span>
      </button>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'friends'" class="ranking-list">
        <div
          v-for="entry in friendRanking"
          :key="entry.playerId"
          class="ranking-item"
          :class="{ 'is-self': entry.isSelf, [getRankBadgeClass(entry.rank)]: true }"
        >
          <div class="rank-number">
            <span v-if="entry.rank <= 3" class="rank-medal">
              {{ entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉' }}
            </span>
            <span v-else class="rank-plain">{{ entry.rank }}</span>
          </div>
          <div class="player-avatar">{{ entry.avatar }}</div>
          <div class="player-info">
            <div class="player-name">
              {{ entry.name }}
              <span v-if="entry.isSelf" class="self-tag">我</span>
            </div>
            <div class="player-level">Lv.{{ entry.level }}</div>
          </div>
          <div class="player-score">
            <div class="score-value">{{ entry.score.toLocaleString() }}</div>
            <div class="score-label">分数</div>
          </div>
          <button
            v-if="!entry.isSelf"
            class="challenge-btn"
            @click="handleChallengeFriend(entry.playerId, entry.name)"
          >
            ⚔️ 挑战
          </button>
          <div v-else class="challenge-btn my-rank-tag">
            {{ getRankTitle(entry.rank) }}
          </div>
        </div>

        <div v-if="friendRanking.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">暂无好友数据</div>
        </div>
      </div>

      <div v-if="activeTab === 'global'" class="ranking-list">
        <div
          v-for="entry in globalRanking"
          :key="entry.playerId"
          class="ranking-item"
          :class="{ 'is-self': entry.isSelf, [getRankBadgeClass(entry.rank)]: true }"
        >
          <div class="rank-number">
            <span v-if="entry.rank <= 3" class="rank-medal">
              {{ entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉' }}
            </span>
            <span v-else class="rank-plain">{{ entry.rank }}</span>
          </div>
          <div class="player-avatar">{{ entry.avatar }}</div>
          <div class="player-info">
            <div class="player-name">
              {{ entry.name }}
              <span v-if="entry.isSelf" class="self-tag">我</span>
            </div>
            <div class="player-level">Lv.{{ entry.level }}</div>
          </div>
          <div class="player-score">
            <div class="score-value">{{ entry.score.toLocaleString() }}</div>
            <div class="score-label">分数</div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'challenge'" class="challenge-section">
        <div v-if="unclaimedCount > 0" class="unclaimed-banner" @click="$emit('showSettlement')">
          <span class="banner-icon">🎁</span>
          <span>你有 {{ unclaimedCount }} 个挑战奖励待领取！</span>
          <span class="banner-arrow">›</span>
        </div>

        <div v-if="incomingChallenges.length > 0" class="challenge-group">
          <h3 class="group-title">📥 收到的挑战</h3>
          <div
            v-for="challenge in incomingChallenges"
            :key="challenge.id"
            class="challenge-card incoming"
          >
            <div class="challenge-avatar">{{ challenge.challengerAvatar }}</div>
            <div class="challenge-info">
              <div class="challenge-name">{{ challenge.challengerName }}</div>
              <div class="challenge-detail">
                分数 {{ challenge.challengerScore.toLocaleString() }} · {{ formatTime(challenge.createdAt) }}
              </div>
            </div>
            <div class="challenge-actions">
              <button class="accept-btn" @click="handleAcceptChallenge(challenge.id)">接受</button>
              <button class="decline-btn" @click="handleDeclineChallenge(challenge.id)">拒绝</button>
            </div>
          </div>
        </div>

        <div v-if="outgoingChallenges.length > 0" class="challenge-group">
          <h3 class="group-title">📤 发出的挑战</h3>
          <div
            v-for="challenge in outgoingChallenges"
            :key="challenge.id"
            class="challenge-card outgoing"
          >
            <div class="challenge-avatar">{{ challenge.targetAvatar }}</div>
            <div class="challenge-info">
              <div class="challenge-name">{{ challenge.targetName }}</div>
              <div class="challenge-detail">
                <span
                  class="status-tag"
                  :style="{ color: getChallengeStatusColor(challenge.status) }"
                >
                  {{ getChallengeStatusText(challenge.status) }}
                </span>
                · {{ formatTime(challenge.createdAt) }}
              </div>
            </div>
            <div class="challenge-score-compare">
              <span class="my-score">{{ challenge.challengerScore }}</span>
              <span class="vs">vs</span>
              <span class="opp-score">{{ challenge.targetScore }}</span>
            </div>
          </div>
        </div>

        <div class="challenge-group">
          <h3 class="group-title">📜 挑战记录</h3>
          <div
            v-for="challenge in challengeHistory"
            :key="challenge.id"
            class="challenge-card history"
          >
            <div class="challenge-avatar">{{ challenge.targetAvatar || challenge.challengerAvatar }}</div>
            <div class="challenge-info">
              <div class="challenge-name">
                {{ challenge.targetId === 'player-self' ? challenge.challengerName : challenge.targetName }}
                <span
                  class="result-tag"
                  :class="challenge.winnerId === 'player-self' ? 'won' : 'lost'"
                >
                  {{ challenge.winnerId === 'player-self' ? '胜利' : '失败' }}
                </span>
              </div>
              <div class="challenge-detail">
                {{ challenge.challengerScore }} vs {{ challenge.targetScore }} · {{ formatTime(challenge.completedAt || challenge.createdAt) }}
              </div>
            </div>
          </div>

          <div v-if="challengeHistory.length === 0" class="empty-state small">
            <div class="empty-icon">⚔️</div>
            <div class="empty-text">还没有挑战记录，快去约战好友吧！</div>
          </div>
        </div>

        <button class="simulate-btn" @click="addMockIncomingChallenge(); showToast('收到新挑战！')">
          📬 模拟收到挑战
        </button>
      </div>
    </div>

    <div v-if="showChallengeConfirm" class="modal-overlay" @click.self="cancelChallengeConfirm">
      <div class="modal-content">
        <div class="modal-icon">⚔️</div>
        <h3 class="modal-title">确认发起挑战？</h3>
        <p class="modal-desc">向好友发起约战，对方接受后将自动对决！</p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="cancelChallengeConfirm">取消</button>
          <button class="modal-btn confirm" @click="confirmChallenge">发起挑战</button>
        </div>
      </div>
    </div>

    <div v-if="showIncomingDetail" class="modal-overlay" @click.self="showIncomingDetail = null">
      <div class="modal-content">
        <div class="modal-icon">{{ showIncomingDetail.challengerAvatar }}</div>
        <h3 class="modal-title">{{ showIncomingDetail.challengerName }} 的挑战</h3>
        <div class="challenge-score-compare large">
          <div class="compare-side">
            <span class="compare-avatar">🧑</span>
            <span class="compare-score">{{ getHighScore() }}</span>
          </div>
          <span class="compare-vs">VS</span>
          <div class="compare-side">
            <span class="compare-avatar">{{ showIncomingDetail.challengerAvatar }}</span>
            <span class="compare-score">{{ showIncomingDetail.challengerScore }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="handleDeclineChallenge(showIncomingDetail.id)">拒绝</button>
          <button class="modal-btn confirm" @click="handleAcceptChallenge(showIncomingDetail.id)">接受挑战</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
function getHighScore(): number {
  try {
    return parseInt(localStorage.getItem('forest-runner-highscore') || '0', 10)
  } catch {
    return 0
  }
}
</script>

<style scoped>
.ranking-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #1a1a2e;
  padding: 10px 24px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(255, 165, 0, 0.4);
  animation: slideDown 0.4s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.ranking-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  gap: 12px;
  flex-shrink: 0;
}

.back-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e0e0e0;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.screen-title {
  flex: 1;
  font-size: 20px;
  font-weight: 900;
  color: white;
  margin: 0;
}

.rating-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.3);
  padding: 6px 14px;
  border-radius: 20px;
  border: 2px solid;
  flex-shrink: 0;
}

.tier-icon {
  font-size: 18px;
}

.tier-name {
  font-size: 13px;
  font-weight: 800;
}

.tier-score {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.tab-bar {
  display: flex;
  padding: 0 20px;
  gap: 8px;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 14px 14px 0 0;
  transition: all 0.3s;
  position: relative;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

.tab-badge {
  position: absolute;
  top: 6px;
  right: 10px;
  background: #FF4444;
  color: white;
  font-size: 11px;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 20px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 0 14px 0 0;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  transition: all 0.2s;
}

.ranking-item.is-self {
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.ranking-item.rank-gold {
  border-left: 3px solid #FFD700;
}

.ranking-item.rank-silver {
  border-left: 3px solid #C0C0C0;
}

.ranking-item.rank-bronze {
  border-left: 3px solid #CD7F32;
}

.rank-number {
  width: 36px;
  text-align: center;
  flex-shrink: 0;
}

.rank-medal {
  font-size: 24px;
}

.rank-plain {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
}

.player-avatar {
  font-size: 32px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  font-size: 15px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
}

.self-tag {
  background: #4CAF50;
  color: white;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 800;
}

.player-level {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.player-score {
  text-align: right;
  flex-shrink: 0;
}

.score-value {
  font-size: 18px;
  font-weight: 900;
  color: #FFD700;
}

.score-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.challenge-btn {
  background: linear-gradient(135deg, #FF6B35, #F7931E);
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.challenge-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 12px rgba(255, 107, 53, 0.4);
}

.challenge-btn:active {
  transform: scale(0.97);
}

.my-rank-tag {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  cursor: default;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 10px;
}

.my-rank-tag:hover {
  transform: none;
  box-shadow: none;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-state.small {
  padding: 24px 20px;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}

.challenge-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.unclaimed-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #FF6B35, #F7931E);
  padding: 12px 18px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  animation: bannerPulse 2s ease-in-out infinite;
}

@keyframes bannerPulse {
  0%, 100% { box-shadow: 0 2px 12px rgba(255, 107, 53, 0.3); }
  50% { box-shadow: 0 4px 20px rgba(255, 107, 53, 0.5); }
}

.unclaimed-banner:hover {
  transform: scale(1.02);
}

.banner-icon {
  font-size: 24px;
}

.unclaimed-banner span:nth-child(2) {
  flex: 1;
  font-weight: 700;
  color: white;
}

.banner-arrow {
  font-size: 22px;
  color: white;
  font-weight: 700;
}

.challenge-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title {
  font-size: 15px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.challenge-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  transition: all 0.2s;
}

.challenge-card.incoming {
  border-left: 3px solid #2196F3;
  animation: cardGlow 2s ease-in-out infinite;
}

@keyframes cardGlow {
  0%, 100% { box-shadow: 0 0 0 rgba(33, 150, 243, 0); }
  50% { box-shadow: 0 0 10px rgba(33, 150, 243, 0.2); }
}

.challenge-avatar {
  font-size: 32px;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  flex-shrink: 0;
}

.challenge-info {
  flex: 1;
  min-width: 0;
}

.challenge-name {
  font-size: 15px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.challenge-detail {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.status-tag {
  font-weight: 700;
}

.result-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 700;
}

.result-tag.won {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.result-tag.lost {
  background: rgba(244, 67, 54, 0.2);
  color: #F44336;
}

.challenge-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.accept-btn {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.accept-btn:hover {
  transform: scale(1.05);
}

.decline-btn {
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #F44336;
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.decline-btn:hover {
  background: rgba(244, 67, 54, 0.25);
}

.challenge-score-compare {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.challenge-score-compare.large {
  padding: 16px;
  gap: 20px;
  justify-content: center;
}

.compare-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.compare-avatar {
  font-size: 36px;
}

.compare-score {
  font-size: 24px;
  font-weight: 900;
  color: #FFD700;
}

.compare-vs {
  font-size: 18px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.4);
}

.my-score {
  font-size: 14px;
  font-weight: 700;
  color: #4CAF50;
}

.opp-score {
  font-size: 14px;
  font-weight: 700;
  color: #FF6B35;
}

.vs {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 700;
}

.simulate-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  padding: 12px;
  border-radius: 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.simulate-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: linear-gradient(180deg, #1e2a4a, #16213e);
  border-radius: 24px;
  padding: 30px 24px;
  width: 90%;
  max-width: 340px;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
  animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  0% { opacity: 0; transform: scale(0.9) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 20px;
  font-weight: 900;
  color: white;
  margin: 0 0 8px 0;
}

.modal-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 24px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.cancel {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.modal-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #FF6B35, #F7931E);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.modal-btn.confirm:hover {
  transform: scale(1.03);
}

@media (max-width: 400px) {
  .ranking-header {
    padding: 12px 14px;
    gap: 8px;
  }

  .screen-title {
    font-size: 16px;
  }

  .rating-badge {
    padding: 4px 10px;
  }

  .tier-name {
    display: none;
  }

  .tab-btn {
    font-size: 12px;
    padding: 10px 4px;
  }

  .ranking-item {
    padding: 10px 12px;
    gap: 8px;
  }

  .player-avatar {
    font-size: 26px;
    width: 36px;
    height: 36px;
  }

  .score-value {
    font-size: 15px;
  }
}
</style>
