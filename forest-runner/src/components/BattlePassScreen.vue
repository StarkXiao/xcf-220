<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  battlePassState,
  checkAndResetDailyTasks,
  claimDailyTask,
  claimAllCompletedDailyTasks,
  claimReward,
  claimAllAvailableRewards,
  canClaimReward,
  purchasePremium,
  equipSkin,
  getSeasonProgress,
  getUnclaimedDailyTasksCount,
  getUnclaimedRewardsCount,
  getEquippedSkinColors,
  getAllSkinsWithUnlockStatus
} from '../game/battlePassStore'
import {
  getCurrentSeason,
  getRewardsForLevel,
  getRarityColor,
  getRarityLabel
} from '../game/battlePassData'
import type { BattlePassReward, Skin } from '../game/types'

defineEmits<{
  (e: 'back'): void
}>()

type TabType = 'overview' | 'tasks' | 'rewards' | 'skins'
const activeTab = ref<TabType>('overview')

const claimAnimation = ref(false)
const claimedItems = ref<BattlePassReward[]>([])
const showPremiumModal = ref(false)
const showPurchaseSuccess = ref(false)
const selectedSkin = ref<Skin | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)

const season = computed(() => getCurrentSeason())
const progress = computed(() => getSeasonProgress())

const allSkins = computed(() => getAllSkinsWithUnlockStatus())
const unlockedSkins = computed(() => allSkins.value.filter((s: Skin) => s.unlocked))
const lockedSkins = computed(() => allSkins.value.filter((s: Skin) => !s.unlocked))

const unclaimedDaily = computed(() => getUnclaimedDailyTasksCount())
const unclaimedRewards = computed(() => getUnclaimedRewardsCount())

const allLevels = computed(() => {
  const levels: Array<{
    level: number
    freeReward: BattlePassReward | null
    premiumReward: BattlePassReward | null
    freeClaimed: boolean
    premiumClaimed: boolean
    unlocked: boolean
  }> = []
  
  for (let l = 1; l <= season.value.maxLevel; l++) {
    const rewards = getRewardsForLevel(l)
    levels.push({
      level: l,
      freeReward: rewards.find(r => !r.isPremium) || null,
      premiumReward: rewards.find(r => r.isPremium) || null,
      freeClaimed: !rewards.find(r => !r.isPremium) || battlePassState.claimedFreeRewards.includes(rewards.find(r => !r.isPremium)!.id),
      premiumClaimed: !rewards.find(r => r.isPremium) || battlePassState.claimedPremiumRewards.includes(rewards.find(r => r.isPremium)!.id),
      unlocked: l <= battlePassState.level
    })
  }
  return levels
})

function handleClaimTask(taskId: string) {
  if (claimDailyTask(taskId)) {
    claimAnimation.value = true
    setTimeout(() => claimAnimation.value = false, 600)
  }
}

function handleClaimAllTasks() {
  const count = claimAllCompletedDailyTasks()
  if (count > 0) {
    claimAnimation.value = true
    setTimeout(() => claimAnimation.value = false, 600)
  }
}

function handleClaimReward(rewardId: string) {
  const result = claimReward(rewardId)
  if (result) {
    claimedItems.value.push(result)
    claimAnimation.value = true
    setTimeout(() => {
      claimAnimation.value = false
      claimedItems.value = []
    }, 1500)
  }
}

function handleClaimAllRewards() {
  const claimed = claimAllAvailableRewards()
  if (claimed.length > 0) {
    claimedItems.value = claimed
    claimAnimation.value = true
    setTimeout(() => {
      claimAnimation.value = false
      claimedItems.value = []
    }, 2000)
  }
}

function handlePurchasePremium() {
  if (purchasePremium()) {
    showPremiumModal.value = false
    showPurchaseSuccess.value = true
    setTimeout(() => showPurchaseSuccess.value = false, 2000)
  }
}

function handleEquipSkin(skinId: string) {
  equipSkin(skinId)
  selectedSkin.value = null
}

function scrollToCurrentLevel() {
  setTimeout(() => {
    if (scrollContainer.value) {
      const targetIndex = Math.max(0, battlePassState.level - 2)
      const cardWidth = 140
      scrollContainer.value.scrollLeft = targetIndex * cardWidth
    }
  }, 100)
}

function getTaskProgressPercent(progress: number, target: number): number {
  return Math.min(100, Math.floor((progress / target) * 100))
}

onMounted(() => {
  checkAndResetDailyTasks()
  scrollToCurrentLevel()
})
</script>

<template>
  <div class="battle-pass-screen">
    <div class="bp-header">
      <button class="back-btn" @click="$emit('back')">
        <span class="back-icon">←</span>
        返回
      </button>
      <div class="season-info">
        <span class="season-icon">{{ season.icon }}</span>
        <span class="season-name">{{ season.name }}</span>
      </div>
      <div class="days-left" :class="{ urgent: progress.daysLeft <= 7 }">
        ⏱️ {{ progress.daysLeft }}天
      </div>
    </div>

    <div class="bp-progress-section">
      <div class="level-display">
        <div class="level-badge">
          <span class="level-num">Lv.{{ progress.currentLevel }}</span>
          <span class="level-max">/ {{ progress.maxLevel }}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progress.percent + '%' }"
              :class="{ premium: battlePassState.premiumUnlocked }"
            ></div>
            <div 
              v-if="claimAnimation" 
              class="progress-sparkle"
            ></div>
          </div>
          <div class="progress-text">
            <span>{{ battlePassState.points - progress.pointsForCurrentLevel }} XP</span>
            <span v-if="progress.currentLevel < progress.maxLevel">
              / {{ progress.pointsForNextLevel - progress.pointsForCurrentLevel }} XP
            </span>
            <span v-else>已满级</span>
          </div>
        </div>
      </div>
      
      <div class="premium-status" v-if="!battlePassState.premiumUnlocked">
        <div class="premium-hint">
          <span class="premium-icon">💎</span>
          <span>解锁高级通行证获取更多珍稀奖励！</span>
        </div>
        <button class="premium-btn" @click="showPremiumModal = true">
          <span class="price">💰 {{ season.premiumPrice }}</span>
          <span>立即解锁</span>
        </button>
      </div>
      <div class="premium-status active" v-else>
        <span class="premium-icon">✨</span>
        <span>高级通行证已激活</span>
        <span class="premium-badge">VIP</span>
      </div>
    </div>

    <div class="bp-tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'overview' }"
        @click="activeTab = 'overview'"
      >
        <span class="tab-icon">📋</span>
        总览
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'tasks' }"
        @click="activeTab = 'tasks'"
      >
        <span class="tab-icon">📝</span>
        每日任务
        <span v-if="unclaimedDaily > 0" class="badge-dot">{{ unclaimedDaily }}</span>
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'rewards' }"
        @click="activeTab = 'rewards'; scrollToCurrentLevel()"
      >
        <span class="tab-icon">🎁</span>
        奖励
        <span v-if="unclaimedRewards > 0" class="badge-dot">{{ unclaimedRewards }}</span>
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'skins' }"
        @click="activeTab = 'skins'"
      >
        <span class="tab-icon">👕</span>
        皮肤
      </button>
    </div>

    <div class="bp-content">
      <div v-if="activeTab === 'overview'" class="overview-tab">
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon">🎮</div>
            <div class="stat-info">
              <div class="stat-value">{{ battlePassState.gamesPlayed }}</div>
              <div class="stat-label">游戏局数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏃</div>
            <div class="stat-info">
              <div class="stat-value">{{ Math.floor(battlePassState.totalDistance) }}</div>
              <div class="stat-label">总距离(米)</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <div class="stat-value">{{ battlePassState.totalCoins }}</div>
              <div class="stat-label">总金币</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-info">
              <div class="stat-value">{{ battlePassState.totalStars }}</div>
              <div class="stat-label">总星星</div>
            </div>
          </div>
        </div>

        <div class="quick-tasks">
          <div class="section-header">
            <h3>今日任务</h3>
            <button class="claim-all-btn" v-if="unclaimedDaily > 0" @click="handleClaimAllTasks">
              一键领取
            </button>
          </div>
          <div class="task-list">
            <div 
              v-for="task in battlePassState.dailyTasks.slice(0, 3)" 
              :key="task.id"
              class="task-item"
              :class="{ completed: task.completed, claimed: task.claimed }"
            >
              <div class="task-icon">{{ task.icon }}</div>
              <div class="task-info">
                <div class="task-name">{{ task.name }}</div>
                <div class="task-progress">
                  <div class="mini-progress">
                    <div 
                      class="mini-progress-fill" 
                      :style="{ width: getTaskProgressPercent(task.progress, task.target) + '%' }"
                    ></div>
                  </div>
                  <span class="progress-num">{{ Math.min(task.progress, task.target) }}/{{ task.target }}</span>
                </div>
              </div>
              <div class="task-reward">
                <span class="reward-points">+{{ task.rewardPoints }} XP</span>
                <button 
                  v-if="task.completed && !task.claimed"
                  class="claim-btn small"
                  @click="handleClaimTask(task.id)"
                >
                  领取
                </button>
                <span v-else-if="task.claimed" class="claimed-check">✓</span>
              </div>
            </div>
          </div>
        </div>

        <div class="quick-rewards">
          <div class="section-header">
            <h3>快速领取奖励</h3>
            <button class="claim-all-btn" v-if="unclaimedRewards > 0" @click="handleClaimAllRewards">
              领取全部
            </button>
          </div>
          <div class="rewards-scroll" ref="scrollContainer">
            <div 
              v-for="lvl in allLevels.slice(Math.max(0, battlePassState.level - 2), Math.min(battlePassState.level + 5, season.maxLevel))" 
              :key="lvl.level"
              class="reward-card"
              :class="{ 
                unlocked: lvl.unlocked, 
                current: lvl.level === battlePassState.level + 1,
                premium: battlePassState.premiumUnlocked 
              }"
            >
              <div class="reward-level-badge" :class="{ reached: lvl.unlocked }">
                {{ lvl.level }}
              </div>
              <div class="reward-slots">
                <div class="reward-slot free" :class="{ claimed: lvl.freeClaimed, 'can-claim': lvl.unlocked && !lvl.freeClaimed }">
                  <template v-if="lvl.freeReward">
                    <span class="reward-icon">{{ lvl.freeReward.icon }}</span>
                    <span class="reward-name">{{ lvl.freeReward.name }}</span>
                    <button 
                      v-if="canClaimReward(lvl.freeReward.id)"
                      class="claim-reward-btn"
                      @click="handleClaimReward(lvl.freeReward.id)"
                    >
                      领取
                    </button>
                  </template>
                  <span v-else class="empty-slot">—</span>
                </div>
                <div class="reward-slot premium" :class="{ 
                  claimed: lvl.premiumClaimed, 
                  'can-claim': lvl.unlocked && !lvl.premiumClaimed && battlePassState.premiumUnlocked,
                  locked: !battlePassState.premiumUnlocked
                }">
                  <template v-if="lvl.premiumReward">
                    <span class="lock-icon" v-if="!battlePassState.premiumUnlocked">🔒</span>
                    <span class="reward-icon">{{ lvl.premiumReward.icon }}</span>
                    <span class="reward-name">{{ lvl.premiumReward.name }}</span>
                    <button 
                      v-if="canClaimReward(lvl.premiumReward.id)"
                      class="claim-reward-btn premium"
                      @click="handleClaimReward(lvl.premiumReward.id)"
                    >
                      领取
                    </button>
                  </template>
                  <span v-else class="empty-slot">—</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'tasks'" class="tasks-tab">
        <div class="tasks-header">
          <h3>每日任务</h3>
          <span class="reset-hint">每日0点重置</span>
          <button class="claim-all-btn" v-if="unclaimedDaily > 0" @click="handleClaimAllTasks">
            一键领取
          </button>
        </div>
        <div class="full-task-list">
          <div 
            v-for="task in battlePassState.dailyTasks" 
            :key="task.id"
            class="full-task-item"
            :class="{ completed: task.completed, claimed: task.claimed }"
          >
            <div class="task-icon-large">{{ task.icon }}</div>
            <div class="task-main-info">
              <div class="task-title">{{ task.name }}</div>
              <div class="task-desc">{{ task.description }}</div>
              <div class="task-progress-large">
                <div class="progress-bar-small">
                  <div 
                    class="progress-fill-small"
                    :style="{ width: getTaskProgressPercent(task.progress, task.target) + '%' }"
                  ></div>
                </div>
                <div class="progress-label">
                  进度: {{ Math.min(task.progress, task.target).toLocaleString() }} / {{ task.target.toLocaleString() }}
                </div>
              </div>
            </div>
            <div class="task-reward-section">
              <div class="reward-display">
                <span class="xp-icon">✨</span>
                <span class="xp-value">+{{ task.rewardPoints }}</span>
                <span class="xp-label">经验</span>
              </div>
              <button 
                v-if="task.completed && !task.claimed"
                class="claim-btn large pulse"
                @click="handleClaimTask(task.id)"
              >
                领取奖励
              </button>
              <div v-else-if="task.claimed" class="claimed-status">
                <span class="check-icon">✓</span>
                已领取
              </div>
              <div v-else class="incomplete-status">
                进行中
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'rewards'" class="rewards-tab">
        <div class="rewards-header">
          <h3>赛季奖励</h3>
          <button class="claim-all-btn" v-if="unclaimedRewards > 0" @click="handleClaimAllRewards">
            一键领取全部
          </button>
        </div>
        
        <div class="rewards-legend">
          <div class="legend-item"><span class="legend-dot free"></span>免费奖励</div>
          <div class="legend-item"><span class="legend-dot premium"></span>高级奖励</div>
        </div>

        <div class="all-rewards-grid">
          <div 
            v-for="lvl in allLevels" 
            :key="lvl.level"
            class="level-reward-row"
            :class="{ unlocked: lvl.unlocked, current: lvl.level === battlePassState.level + 1 }"
          >
            <div class="level-marker">
              <div class="level-number" :class="{ reached: lvl.unlocked }">
                {{ lvl.level }}
              </div>
              <div v-if="lvl.level === battlePassState.level + 1" class="current-marker">
                下一级
              </div>
            </div>
            
            <div class="rewards-row">
              <div 
                class="reward-cell free"
                :class="{ 
                  claimed: lvl.freeClaimed, 
                  'can-claim': lvl.unlocked && lvl.freeReward && !lvl.freeClaimed 
                }"
                @click="lvl.freeReward && canClaimReward(lvl.freeReward.id) && handleClaimReward(lvl.freeReward.id)"
              >
                <template v-if="lvl.freeReward">
                  <div class="cell-icon">{{ lvl.freeReward.icon }}</div>
                  <div class="cell-info">
                    <div class="cell-name">{{ lvl.freeReward.name }}</div>
                    <div class="cell-amount" v-if="lvl.freeReward.amount">
                      x{{ lvl.freeReward.amount }}
                    </div>
                  </div>
                  <div class="cell-status">
                    <span v-if="!lvl.unlocked" class="status-locked">🔒</span>
                    <span v-else-if="lvl.freeClaimed" class="status-claimed">✓</span>
                    <button v-else class="status-claim" @click.stop="handleClaimReward(lvl.freeReward!.id)">
                      领取
                    </button>
                  </div>
                </template>
                <span v-else class="cell-empty">无奖励</span>
              </div>
              
              <div 
                class="reward-cell premium"
                :class="{ 
                  claimed: lvl.premiumClaimed, 
                  'can-claim': lvl.unlocked && lvl.premiumReward && !lvl.premiumClaimed && battlePassState.premiumUnlocked,
                  locked: !battlePassState.premiumUnlocked
                }"
                @click="lvl.premiumReward && canClaimReward(lvl.premiumReward.id) && handleClaimReward(lvl.premiumReward.id)"
              >
                <template v-if="lvl.premiumReward">
                  <div class="cell-icon">{{ lvl.premiumReward.icon }}</div>
                  <div class="cell-info">
                    <div class="cell-name">{{ lvl.premiumReward.name }}</div>
                    <div class="cell-amount" v-if="lvl.premiumReward.amount">
                      x{{ lvl.premiumReward.amount }}
                    </div>
                  </div>
                  <div class="cell-status">
                    <span v-if="!battlePassState.premiumUnlocked" class="status-locked">🔒</span>
                    <span v-else-if="!lvl.unlocked" class="status-locked">🔒</span>
                    <span v-else-if="lvl.premiumClaimed" class="status-claimed">✓</span>
                    <button v-else class="status-claim premium" @click.stop="handleClaimReward(lvl.premiumReward!.id)">
                      领取
                    </button>
                  </div>
                </template>
                <span v-else class="cell-empty">无奖励</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'skins'" class="skins-tab">
        <div class="skins-header">
          <h3>皮肤收藏</h3>
          <span class="skin-count">已拥有 {{ unlockedSkins.length }} / {{ allSkins.length }}</span>
        </div>

        <div class="current-equipped">
          <h4>当前装备</h4>
          <div class="equipped-display" v-if="battlePassState.equippedSkinId">
            <div 
              class="skin-preview-large"
              :style="{
                '--body-color': getEquippedSkinColors().body,
                '--head-color': getEquippedSkinColors().head,
                '--hat-color': getEquippedSkinColors().hat,
                '--accent-color': getEquippedSkinColors().accent
              }"
            >
              <div class="character-bounce">
                <div class="character-body"></div>
                <div class="character-head"></div>
                <div class="character-hat"></div>
              </div>
            </div>
            <div class="equipped-info">
              <div 
                class="skin-rarity-badge"
                :style="{ background: getRarityColor(allSkins.find((s: Skin) => s.id === battlePassState.equippedSkinId)?.rarity || 'common') }"
              >
                {{ getRarityLabel(allSkins.find((s: Skin) => s.id === battlePassState.equippedSkinId)?.rarity || 'common') }}
              </div>
              <div class="equipped-name">
                {{ allSkins.find((s: Skin) => s.id === battlePassState.equippedSkinId)?.name }}
              </div>
            </div>
          </div>
        </div>

        <div class="skins-section">
          <h4>已解锁皮肤</h4>
          <div class="skins-grid">
            <div 
              v-for="skin in unlockedSkins" 
              :key="skin.id"
              class="skin-card"
              :class="{ equipped: skin.isEquipped }"
              @click="selectedSkin = skin"
            >
              <div 
                class="skin-preview"
                :style="{
                  '--body-color': skin.colors.body,
                  '--head-color': skin.colors.head,
                  '--hat-color': skin.colors.hat,
                  '--accent-color': skin.colors.accent
                }"
              >
                <div class="mini-character">
                  <div class="mini-body"></div>
                  <div class="mini-head"></div>
                  <div class="mini-hat"></div>
                </div>
              </div>
              <div 
                class="skin-rarity"
                :style="{ background: getRarityColor(skin.rarity) }"
              >
                {{ getRarityLabel(skin.rarity) }}
              </div>
              <div class="skin-name">{{ skin.name }}</div>
              <div v-if="skin.isEquipped" class="equipped-tag">
                使用中
              </div>
            </div>
          </div>
        </div>

        <div class="skins-section">
          <h4>未解锁皮肤</h4>
          <div class="skins-grid locked">
            <div 
              v-for="skin in lockedSkins" 
              :key="skin.id"
              class="skin-card locked"
              @click="selectedSkin = skin"
            >
              <div class="skin-preview locked">
                <span class="lock-overlay">🔒</span>
              </div>
              <div 
                class="skin-rarity"
                :style="{ background: getRarityColor(skin.rarity) }"
              >
                {{ getRarityLabel(skin.rarity) }}
              </div>
              <div class="skin-name">{{ skin.name }}</div>
              <div class="unlock-condition">{{ skin.unlockCondition }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="claimAnimation && claimedItems.length > 0" class="claim-toast">
      <div class="toast-content">
        <span class="toast-icon">🎉</span>
        <span>获得 {{ claimedItems.length }} 项奖励！</span>
      </div>
    </div>

    <div v-if="showPurchaseSuccess" class="claim-toast success">
      <div class="toast-content">
        <span class="toast-icon">✨</span>
        <span>高级通行证解锁成功！</span>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showPremiumModal" class="modal-overlay" @click.self="showPremiumModal = false">
        <div class="premium-modal">
          <div class="modal-header">
            <span class="modal-close" @click="showPremiumModal = false">×</span>
            <h2>💎 解锁高级通行证</h2>
          </div>
          <div class="modal-body">
            <div class="premium-showcase">
              <div class="showcase-icon">👑</div>
              <p class="showcase-desc">解锁全部高级奖励，包括稀有皮肤、史诗称号、传说宠物蛋！</p>
            </div>
            <div class="premium-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">🎁</span>
                <span>50级全部高级奖励</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">👕</span>
                <span>7款专属珍稀皮肤</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🏆</span>
                <span>2个专属称号</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🥚</span>
                <span>稀有/史诗/传说宠物蛋</span>
              </div>
            </div>
            <div class="purchase-section">
              <div class="original-price">
                <span class="price-label">原价</span>
                <span class="price-value struck">¥128</span>
              </div>
              <div class="current-price">
                <span class="price-label">现价</span>
                <span class="coin-icon">💰</span>
                <span class="price-value">{{ season.premiumPrice }} 金币</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showPremiumModal = false">取消</button>
            <button class="btn-confirm" @click="handlePurchasePremium">
              立即解锁
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedSkin" class="modal-overlay" @click.self="selectedSkin = null">
        <div class="skin-modal">
          <div class="modal-header">
            <span class="modal-close" @click="selectedSkin = null">×</span>
            <div 
              class="skin-rarity-badge large"
              :style="{ background: getRarityColor(selectedSkin.rarity) }"
            >
              {{ getRarityLabel(selectedSkin.rarity) }}
            </div>
          </div>
          <div class="skin-modal-body">
            <div 
              class="skin-modal-preview"
              :style="{
                '--body-color': selectedSkin.colors.body,
                '--head-color': selectedSkin.colors.head,
                '--hat-color': selectedSkin.colors.hat,
                '--accent-color': selectedSkin.colors.accent
              }"
              :class="{ locked: !selectedSkin.unlocked }"
            >
              <div class="character-bounce">
                <div class="character-body"></div>
                <div class="character-head"></div>
                <div class="character-hat"></div>
              </div>
              <div v-if="!selectedSkin.unlocked" class="skin-lock-overlay">
                <span class="big-lock">🔒</span>
                <span class="unlock-text">{{ selectedSkin.unlockCondition }}</span>
              </div>
            </div>
            <h2 class="skin-modal-name">{{ selectedSkin.name }}</h2>
            <p class="skin-modal-desc">{{ selectedSkin.description }}</p>
            
            <div class="skin-colors">
              <div class="color-swatch" :style="{ background: selectedSkin.colors.body }" title="身体"></div>
              <div class="color-swatch" :style="{ background: selectedSkin.colors.head }" title="头部"></div>
              <div class="color-swatch" :style="{ background: selectedSkin.colors.hat }" title="帽子"></div>
              <div class="color-swatch" :style="{ background: selectedSkin.colors.accent }" title="配色"></div>
            </div>
          </div>
          <div class="modal-footer">
            <template v-if="selectedSkin.unlocked">
              <button 
                class="btn-confirm" 
                :disabled="selectedSkin.isEquipped"
                @click="handleEquipSkin(selectedSkin.id)"
              >
                {{ selectedSkin.isEquipped ? '已装备' : '装备' }}
              </button>
            </template>
            <template v-else>
              <div class="unlock-hint">
                <span>解锁条件: {{ selectedSkin.unlockCondition }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.battle-pass-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a237e 0%, #283593 30%, #3949ab 60%, #5c6bc0 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: white;
  position: relative;
}

.battle-pass-screen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255,215,0,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(147,51,234,0.15) 0%, transparent 50%);
  pointer-events: none;
}

.bp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(0,0,0,0.2);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  position: relative;
  z-index: 10;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 25px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255,255,255,0.25);
  transform: translateX(-2px);
}

.back-icon { font-size: 18px; }

.season-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
}

.season-icon {
  font-size: 28px;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.1); filter: brightness(1.2); }
}

.days-left {
  padding: 8px 14px;
  background: rgba(255,255,255,0.15);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.days-left.urgent {
  background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.bp-progress-section {
  padding: 20px;
  background: linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,107,107,0.08) 100%);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.level-display {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.level-badge {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(255,215,0,0.4);
  min-width: 100px;
  text-align: center;
}

.level-num {
  font-size: 26px;
  font-weight: 900;
  color: #5d4037;
}

.level-max {
  font-size: 14px;
  font-weight: 600;
  color: #795548;
}

.progress-bar-container { flex: 1; }

.progress-bar {
  height: 20px;
  background: rgba(0,0,0,0.3);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  border: 2px solid rgba(255,255,255,0.15);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%);
  border-radius: 8px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-fill.premium {
  background: linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6B6B 100%);
  box-shadow: 0 0 15px rgba(255,215,0,0.5);
}

.progress-sparkle {
  position: absolute;
  right: 0;
  top: 0;
  width: 30px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  animation: sparkle-sweep 0.6s ease-out;
}

@keyframes sparkle-sweep {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

.progress-text {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  font-weight: 500;
}

.premium-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(156,39,176,0.25) 0%, rgba(103,58,183,0.25) 100%);
  border: 2px solid rgba(186,104,200,0.4);
  border-radius: 14px;
}

.premium-status.active {
  background: linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,152,0,0.2) 100%);
  border: 2px solid rgba(255,215,0,0.5);
}

.premium-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  font-size: 14px;
}

.premium-icon { font-size: 22px; }

.premium-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border: none;
  border-radius: 25px;
  color: #5d4037;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255,215,0,0.4);
  transition: all 0.2s;
}

.premium-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(255,215,0,0.5);
}

.premium-badge {
  padding: 4px 10px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  color: #5d4037;
}

.bp-tabs {
  display: flex;
  padding: 0 20px;
  gap: 8px;
  background: rgba(0,0,0,0.15);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 18px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.6);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover { color: rgba(255,255,255,0.9); }
.tab-btn.active { color: #FFD700; }

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 3px;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  border-radius: 2px;
}

.tab-icon { font-size: 16px; }

.badge-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ff4444;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: badge-pulse 1.5s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.bp-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  position: relative;
  z-index: 5;
}

.overview-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
}

.stat-icon { font-size: 28px; }
.stat-info { flex: 1; }

.stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #FFD700;
}

.stat-label {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  margin-top: 2px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.claim-all-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border: none;
  border-radius: 20px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(76,175,80,0.3);
}

.claim-all-btn:hover { transform: scale(1.05); }

.quick-tasks, .quick-rewards {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 16px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.2s;
}

.task-item.completed {
  background: rgba(76,175,80,0.15);
  border-color: rgba(76,175,80,0.3);
}

.task-item.claimed { opacity: 0.6; }

.task-icon {
  font-size: 28px;
  min-width: 40px;
  text-align: center;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-progress {
  flex: 1;
  height: 6px;
  background: rgba(0,0,0,0.3);
  border-radius: 3px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-num {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  white-space: nowrap;
}

.task-reward {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.reward-points {
  font-size: 12px;
  font-weight: 700;
  color: #8BC34A;
}

.claim-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border: none;
  border-radius: 16px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.claim-btn.small { padding: 4px 10px; font-size: 11px; }
.claim-btn.large { padding: 10px 20px; font-size: 14px; }
.claim-btn.pulse { animation: pulse 1.5s ease-in-out infinite; }
.claim-btn:hover { transform: scale(1.05); }

.claimed-check {
  color: #4CAF50;
  font-size: 18px;
  font-weight: 800;
}

.rewards-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px;
}

.reward-card {
  min-width: 130px;
  padding: 12px;
  background: rgba(0,0,0,0.2);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.reward-card.unlocked {
  border-color: rgba(76,175,80,0.5);
  background: rgba(76,175,80,0.1);
}

.reward-card.current {
  border-color: #FFD700;
  box-shadow: 0 0 20px rgba(255,215,0,0.3);
}

.reward-level-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  margin: 0 auto 10px;
  color: rgba(255,255,255,0.5);
}

.reward-level-badge.reached {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  box-shadow: 0 2px 8px rgba(76,175,80,0.4);
}

.reward-slots {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(0,0,0,0.2);
  position: relative;
}

.reward-slot.free { border: 1px solid rgba(76,175,80,0.3); }
.reward-slot.premium { border: 1px solid rgba(255,215,0,0.3); }

.reward-slot.can-claim { animation: reward-glow 1.5s ease-in-out infinite; }

@keyframes reward-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(76,175,80,0.3); }
  50% { box-shadow: 0 0 15px rgba(76,175,80,0.6); }
}

.reward-slot.premium.can-claim {
  animation: premium-glow 1.5s ease-in-out infinite;
}

@keyframes premium-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(255,215,0,0.3); }
  50% { box-shadow: 0 0 15px rgba(255,215,0,0.6); }
}

.reward-slot.claimed, .reward-slot.locked { opacity: 0.5; }

.reward-icon { font-size: 24px; }

.lock-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
}

.reward-name {
  font-size: 11px;
  text-align: center;
  font-weight: 500;
}

.empty-slot {
  color: rgba(255,255,255,0.3);
  font-size: 16px;
}

.claim-reward-btn {
  padding: 4px 8px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.claim-reward-btn.premium {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #5d4037;
}

.tasks-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tasks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tasks-header h3 {
  margin: 0;
  font-size: 18px;
}

.reset-hint {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin-left: auto;
}

.full-task-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.full-task-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  transition: all 0.2s;
}

.full-task-item.completed {
  background: rgba(76,175,80,0.12);
  border-color: rgba(76,175,80,0.35);
}

.full-task-item.claimed { opacity: 0.55; }

.task-icon-large {
  font-size: 40px;
  min-width: 56px;
  text-align: center;
}

.task-main-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.task-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 10px;
}

.task-progress-large {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar-small {
  height: 10px;
  background: rgba(0,0,0,0.3);
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill-small {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 5px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-label {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

.task-reward-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 100px;
}

.reward-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  background: rgba(139,195,74,0.15);
  border-radius: 10px;
  border: 1px solid rgba(139,195,74,0.3);
}

.xp-icon { font-size: 18px; }

.xp-value {
  font-size: 18px;
  font-weight: 800;
  color: #8BC34A;
}

.xp-label {
  font-size: 10px;
  color: rgba(255,255,255,0.5);
}

.claimed-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #4CAF50;
  font-size: 13px;
  font-weight: 600;
}

.check-icon { font-size: 16px; }

.incomplete-status {
  padding: 8px 14px;
  background: rgba(255,255,255,0.1);
  border-radius: 16px;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
}

.rewards-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rewards-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rewards-header h3 {
  margin: 0;
  font-size: 18px;
}

.rewards-legend {
  display: flex;
  gap: 20px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.free { background: linear-gradient(135deg, #4CAF50, #388E3C); }
.legend-dot.premium { background: linear-gradient(135deg, #FFD700, #FFA500); }

.all-rewards-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.level-reward-row {
  display: flex;
  gap: 14px;
  padding: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  transition: all 0.2s;
}

.level-reward-row.unlocked {
  background: rgba(76,175,80,0.06);
  border-color: rgba(76,175,80,0.2);
}

.level-reward-row.current {
  border-color: #FFD700;
  box-shadow: 0 0 15px rgba(255,215,0,0.2);
}

.level-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  gap: 4px;
}

.level-number {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: rgba(255,255,255,0.4);
}

.level-number.reached {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  box-shadow: 0 2px 10px rgba(76,175,80,0.4);
}

.current-marker {
  font-size: 10px;
  color: #FFD700;
  font-weight: 600;
  padding: 2px 6px;
  background: rgba(255,215,0,0.15);
  border-radius: 8px;
}

.rewards-row {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.reward-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 1px solid transparent;
}

.reward-cell.free { border-color: rgba(76,175,80,0.2); }
.reward-cell.premium { border-color: rgba(255,215,0,0.2); }

.reward-cell.can-claim { animation: reward-glow 1.5s ease-in-out infinite; }
.reward-cell.premium.can-claim { animation: premium-glow 1.5s ease-in-out infinite; }

.reward-cell.claimed, .reward-cell.locked { opacity: 0.5; }

.cell-icon {
  font-size: 32px;
  min-width: 40px;
  text-align: center;
}

.cell-info {
  flex: 1;
  min-width: 0;
}

.cell-name {
  font-weight: 600;
  font-size: 13px;
}

.cell-amount {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  margin-top: 2px;
}

.cell-status {
  min-width: 50px;
  text-align: center;
}

.status-locked { font-size: 18px; }

.status-claimed {
  color: #4CAF50;
  font-size: 20px;
  font-weight: 800;
}

.status-claim {
  padding: 6px 12px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.status-claim.premium {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #5d4037;
}

.cell-empty {
  flex: 1;
  text-align: center;
  color: rgba(255,255,255,0.3);
  font-size: 13px;
}

.skins-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skins-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.skins-header h3 {
  margin: 0;
  font-size: 18px;
}

.skin-count {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  padding: 6px 12px;
  background: rgba(255,255,255,0.08);
  border-radius: 16px;
}

.current-equipped h4, .skins-section h4 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
}

.equipped-display {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,152,0,0.1) 100%);
  border: 2px solid rgba(255,215,0,0.3);
  border-radius: 16px;
}

.skin-preview-large {
  width: 100px;
  height: 120px;
  background: rgba(0,0,0,0.2);
  border-radius: 16px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 15px;
}

.character-bounce {
  position: relative;
  width: 50px;
  height: 70px;
  animation: characterBounce 1s ease-in-out infinite;
}

@keyframes characterBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.character-body {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 45px;
  background: var(--body-color, #FF6B6B);
  border-radius: 20px 20px 15px 15px;
}

.character-head {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 35px;
  height: 35px;
  background: var(--head-color, #FFE4C4);
  border-radius: 50%;
}

.character-hat {
  position: absolute;
  bottom: 65px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 20px;
  background: var(--hat-color, #FFE66D);
  border-radius: 20px 20px 0 0;
}

.equipped-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skin-rarity-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  width: fit-content;
}

.skin-rarity-badge.large {
  padding: 6px 16px;
  font-size: 14px;
}

.equipped-name {
  font-size: 18px;
  font-weight: 700;
  color: #FFD700;
}

.skins-section {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 16px;
}

.skins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.skin-card {
  padding: 12px;
  background: rgba(0,0,0,0.2);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.skin-card:hover {
  transform: translateY(-3px);
  border-color: rgba(255,215,0,0.4);
}

.skin-card.equipped {
  border-color: #FFD700;
  box-shadow: 0 0 15px rgba(255,215,0,0.25);
}

.skin-card.locked { opacity: 0.7; }

.skin-preview {
  width: 80px;
  height: 90px;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 10px;
  position: relative;
}

.skin-preview.locked {
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.lock-overlay {
  font-size: 30px;
  opacity: 0.7;
}

.mini-character {
  position: relative;
  width: 40px;
  height: 55px;
}

.mini-body {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 36px;
  background: var(--body-color, #FF6B6B);
  border-radius: 16px 16px 12px 12px;
}

.mini-head {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  background: var(--head-color, #FFE4C4);
  border-radius: 50%;
}

.mini-hat {
  position: absolute;
  bottom: 52px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 16px;
  background: var(--hat-color, #FFE66D);
  border-radius: 16px 16px 0 0;
}

.skin-rarity {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  color: white;
}

.skin-name {
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.unlock-condition {
  font-size: 10px;
  color: rgba(255,255,255,0.45);
  text-align: center;
}

.equipped-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 8px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  color: #5d4037;
}

.claim-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  animation: toastIn 0.4s ease-out;
}

.claim-toast.success .toast-content {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #5d4037;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-radius: 25px;
  font-weight: 700;
  font-size: 15px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

.toast-icon { font-size: 22px; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.premium-modal, .skin-modal {
  background: linear-gradient(180deg, #1a237e 0%, #283593 100%);
  border: 2px solid rgba(255,215,0,0.3);
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  position: relative;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #FFD700;
}

.modal-close {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255,255,255,0.2);
}

.modal-body {
  padding: 20px;
  color: white;
}

.premium-showcase {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,107,107,0.1));
  border-radius: 16px;
  margin-bottom: 20px;
}

.showcase-icon {
  font-size: 60px;
  margin-bottom: 12px;
  animation: sparkle 2s ease-in-out infinite;
}

.showcase-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255,255,255,0.85);
}

.premium-benefits {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.06);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.benefit-icon { font-size: 20px; }

.purchase-section {
  padding: 16px;
  background: rgba(0,0,0,0.25);
  border-radius: 14px;
  margin-bottom: 8px;
}

.original-price, .current-price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.original-price {
  margin-bottom: 8px;
  opacity: 0.7;
}

.price-label {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
}

.price-value {
  font-size: 16px;
  font-weight: 700;
}

.price-value.struck {
  text-decoration: line-through;
  color: rgba(255,255,255,0.5);
}

.current-price {
  padding: 8px 0;
  background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,152,0,0.2));
  border-radius: 10px;
}

.current-price .price-value {
  color: #FFD700;
  font-size: 22px;
}

.coin-icon { font-size: 20px; }

.modal-footer {
  padding: 16px 20px 20px;
  display: flex;
  gap: 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: rgba(255,255,255,0.1);
  color: white;
}

.btn-cancel:hover { background: rgba(255,255,255,0.2); }

.btn-confirm {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #5d4037;
  box-shadow: 0 4px 12px rgba(255,215,0,0.35);
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(255,215,0,0.45);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.skin-modal-body {
  padding: 20px;
  text-align: center;
  color: white;
}

.skin-modal-preview {
  width: 140px;
  height: 160px;
  margin: 0 auto 20px;
  background: rgba(0,0,0,0.3);
  border-radius: 20px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.skin-modal-preview.locked .character-bounce {
  filter: grayscale(0.8) brightness(0.5);
}

.skin-lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.big-lock { font-size: 40px; }

.unlock-text {
  font-size: 12px;
  color: rgba(255,255,255,0.8);
  max-width: 120px;
  text-align: center;
  line-height: 1.4;
}

.skin-modal-name {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 800;
  color: #FFD700;
}

.skin-modal-desc {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255,255,255,0.75);
}

.skin-colors {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.unlock-hint {
  flex: 1;
  padding: 12px;
  background: rgba(255,255,255,0.08);
  border-radius: 12px;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  text-align: center;
}

@media (max-width: 640px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .full-task-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .level-reward-row {
    flex-direction: column;
  }
  
  .rewards-row {
    grid-template-columns: 1fr;
  }
  
  .reward-cell {
    flex-direction: column;
    text-align: center;
  }
  
  .skins-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
