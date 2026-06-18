<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  shopState,
  purchaseItem,
  refreshShop,
  getDiscountedPrice,
  getCurrentStock,
  getInventoryQuantity,
  canPurchaseItem,
  equipConsumable,
  unequipConsumable,
  getActiveDiscount,
  getDiscountTimeRemaining,
  getStockRefreshTimeRemaining,
  checkAndRefreshStock,
  getPermanentEffects
} from '../game/shopStore'
import {
  SHOP_ITEMS,
  getRarityColor,
  getRarityName,
  getCategoryName,
  REFRESH_COST,
  MAX_EQUIPPED_CONSUMABLES
} from '../game/shopData'
import { campState } from '../game/campStore'
import type { ShopItem, ShopTabType } from '../game/types'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'startGame'): void
}>()

const activeTab = ref<ShopTabType>('featured')
const refreshTimer = ref<number | null>(null)
const now = ref(Date.now())

const coinAmount = computed(() => campState.inventory.resources['coin'] || 0)

const featuredItems = computed(() => {
  const discounted = shopState.discounts
    .filter(d => now.value < d.endTime)
    .map(d => SHOP_ITEMS.find(item => item.id === d.itemId))
    .filter(Boolean) as ShopItem[]
  
  const popular = SHOP_ITEMS.filter(item => 
    item.category === 'consumable' && 
    !discounted.find(d => d.id === item.id)
  ).slice(0, 3)
  
  return [...discounted, ...popular].slice(0, 6)
})

const consumableItems = computed(() => 
  SHOP_ITEMS.filter(item => item.category === 'consumable')
    .sort((a, b) => a.sortOrder - b.sortOrder)
)

const permanentItems = computed(() => 
  SHOP_ITEMS.filter(item => item.category === 'permanent')
    .sort((a, b) => a.sortOrder - b.sortOrder)
)

const inventoryItems = computed(() => 
  shopState.inventory
    .map(inv => ({
      ...SHOP_ITEMS.find(item => item.id === inv.itemId)!,
      quantity: inv.quantity
    }))
    .filter(item => item.id)
)

const equippedConsumables = computed(() => 
  shopState.equippedConsumables
    .map(id => SHOP_ITEMS.find(item => item.id === id))
    .filter(Boolean) as ShopItem[]
)

const permanentEffects = computed(() => getPermanentEffects())

function formatTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}时${minutes}分`
}

function handlePurchase(itemId: string) {
  const success = purchaseItem(itemId)
  if (success) {
  }
}

function handleRefresh() {
  refreshShop()
  now.value = Date.now()
}

function handleEquip(itemId: string) {
  equipConsumable(itemId)
}

function handleUnequip(itemId: string) {
  unequipConsumable(itemId)
}

function canRefresh(): boolean {
  return coinAmount.value >= REFRESH_COST
}

function isEquipped(itemId: string): boolean {
  return shopState.equippedConsumables.includes(itemId)
}

function canEquip(itemId: string): boolean {
  const item = SHOP_ITEMS.find(i => i.id === itemId)
  if (!item || item.category !== 'consumable') return false
  if (getInventoryQuantity(itemId) <= 0) return false
  if (isEquipped(itemId)) return false
  if (shopState.equippedConsumables.length >= MAX_EQUIPPED_CONSUMABLES) return false
  return true
}

function isPermanentOwned(itemId: string): boolean {
  return getInventoryQuantity(itemId) > 0
}

onMounted(() => {
  checkAndRefreshStock()
  refreshTimer.value = window.setInterval(() => {
    now.value = Date.now()
    checkAndRefreshStock()
  }, 1000)
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<template>
  <div class="shop-screen">
    <div class="shop-header">
      <button class="btn-back" @click="emit('back')">
        <span>←</span> 返回
      </button>
      <h1 class="shop-title">
        <span class="title-icon">🏪</span>
        森林商店
      </h1>
      <div class="coin-display">
        <span class="coin-icon">💰</span>
        <span class="coin-amount">{{ coinAmount }}</span>
      </div>
    </div>

    <div v-if="equippedConsumables.length > 0" class="equipped-banner">
      <div class="equipped-content">
        <span class="equipped-label">已装备道具 ({{ equippedConsumables.length }}/{{ MAX_EQUIPPED_CONSUMABLES }}):</span>
        <div class="equipped-items">
          <span 
            v-for="item in equippedConsumables" 
            :key="item.id"
            class="equipped-chip"
            :style="{ borderColor: getRarityColor(item.rarity) }"
          >
            <span class="chip-icon">{{ item.icon }}</span>
            <span class="chip-name">{{ item.name }}</span>
            <button class="chip-remove" @click="handleUnequip(item.id)">×</button>
          </span>
        </div>
      </div>
    </div>

    <div class="tab-buttons">
      <button
        v-for="tab in [
          { id: 'featured', label: '精选', icon: '🌟' },
          { id: 'consumables', label: '消耗品', icon: '🧪' },
          { id: 'permanent', label: '永久', icon: '💎' },
          { id: 'inventory', label: '背包', icon: '🎒' }
        ]"
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id as ShopTabType"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <div class="shop-content">
      <div v-if="activeTab === 'featured'" class="tab-content">
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">🔥 限时折扣</h2>
            <div class="refresh-info">
              <span class="refresh-time">自动刷新: {{ formatTime(getStockRefreshTimeRemaining()) }}</span>
              <button 
                class="btn btn-refresh"
                :disabled="!canRefresh()"
                @click="handleRefresh"
              >
                <span class="btn-icon">🔄</span>
                刷新 ({{ REFRESH_COST }}💰)
              </button>
            </div>
          </div>
          
          <div class="items-grid">
            <div 
              v-for="item in featuredItems" 
              :key="item.id" 
              class="item-card"
              :style="{ borderColor: getRarityColor(item.rarity) }"
            >
              <div v-if="getActiveDiscount(item.id)" class="discount-badge">
                -{{ getActiveDiscount(item.id)?.discountPercent }}%
              </div>
              
              <div class="item-header">
                <span class="item-icon">{{ item.icon }}</span>
                <div class="item-info">
                  <h3 class="item-name">{{ item.name }}</h3>
                  <span 
                    class="item-rarity"
                    :style="{ color: getRarityColor(item.rarity), background: getRarityColor(item.rarity) + '20' }"
                  >
                    {{ getRarityName(item.rarity) }}
                  </span>
                </div>
              </div>

              <p class="item-desc">{{ item.description }}</p>

              <div class="item-effects">
                <span 
                  v-for="(effect, idx) in item.effects" 
                  :key="idx"
                  class="effect-tag"
                >
                  {{ effect.description }}
                </span>
              </div>

              <div class="item-footer">
                <div class="item-price">
                  <span 
                    v-if="getActiveDiscount(item.id)" 
                    class="original-price"
                  >
                    {{ item.basePrice }}💰
                  </span>
                  <span class="current-price" :class="{ discounted: getActiveDiscount(item.id) }">
                    {{ getDiscountedPrice(item) }}💰
                  </span>
                </div>
                <div class="item-stock">
                  库存: {{ getCurrentStock(item.id) }}/{{ item.maxStock }}
                </div>
              </div>

              <div v-if="getActiveDiscount(item.id)" class="discount-timer">
                剩余: {{ formatTime(getDiscountTimeRemaining(item.id)) }}
              </div>

              <button
                class="btn btn-buy"
                :disabled="!canPurchaseItem(item.id)"
                @click="handlePurchase(item.id)"
              >
                <span class="btn-icon">🛒</span>
                {{ isPermanentOwned(item.id) ? '已拥有' : '购买' }}
              </button>

              <button
                v-if="item.category === 'consumable' && !isPermanentOwned(item.id)"
                class="btn btn-equip"
                :disabled="!canEquip(item.id)"
                @click="isEquipped(item.id) ? handleUnequip(item.id) : handleEquip(item.id)"
              >
                <span class="btn-icon">{{ isEquipped(item.id) ? '✓' : '⚔️' }}</span>
                {{ isEquipped(item.id) ? '已装备' : '装备' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'consumables'" class="tab-content">
        <div class="section">
          <h2 class="section-title">🧪 消耗品</h2>
          <p class="section-desc">使用一次即消耗，可装备最多{{ MAX_EQUIPPED_CONSUMABLES }}个进入游戏</p>
          
          <div class="items-grid">
            <div 
              v-for="item in consumableItems" 
              :key="item.id" 
              class="item-card"
              :style="{ borderColor: getRarityColor(item.rarity) }"
            >
              <div v-if="getActiveDiscount(item.id)" class="discount-badge">
                -{{ getActiveDiscount(item.id)?.discountPercent }}%
              </div>
              
              <div class="item-header">
                <span class="item-icon">{{ item.icon }}</span>
                <div class="item-info">
                  <h3 class="item-name">{{ item.name }}</h3>
                  <span 
                    class="item-rarity"
                    :style="{ color: getRarityColor(item.rarity), background: getRarityColor(item.rarity) + '20' }"
                  >
                    {{ getRarityName(item.rarity) }}
                  </span>
                </div>
                <div class="item-owned">
                  拥有: {{ getInventoryQuantity(item.id) }}
                </div>
              </div>

              <p class="item-desc">{{ item.description }}</p>

              <div class="item-effects">
                <span 
                  v-for="(effect, idx) in item.effects" 
                  :key="idx"
                  class="effect-tag"
                >
                  {{ effect.description }}
                </span>
              </div>

              <div class="item-footer">
                <div class="item-price">
                  <span 
                    v-if="getActiveDiscount(item.id)" 
                    class="original-price"
                  >
                    {{ item.basePrice }}💰
                  </span>
                  <span class="current-price" :class="{ discounted: getActiveDiscount(item.id) }">
                    {{ getDiscountedPrice(item) }}💰
                  </span>
                </div>
                <div class="item-stock">
                  库存: {{ getCurrentStock(item.id) }}/{{ item.maxStock }}
                </div>
              </div>

              <div class="item-actions">
                <button
                  class="btn btn-buy btn-small"
                  :disabled="!canPurchaseItem(item.id)"
                  @click="handlePurchase(item.id)"
                >
                  🛒 购买
                </button>
                <button
                  class="btn btn-equip btn-small"
                  :disabled="!canEquip(item.id)"
                  @click="isEquipped(item.id) ? handleUnequip(item.id) : handleEquip(item.id)"
                >
                  {{ isEquipped(item.id) ? '✓ 已装备' : '⚔️ 装备' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'permanent'" class="tab-content">
        <div class="section">
          <h2 class="section-title">💎 永久道具</h2>
          <p class="section-desc">购买后永久生效，提升基础属性</p>
          
          <div class="items-grid">
            <div 
              v-for="item in permanentItems" 
              :key="item.id" 
              class="item-card"
              :class="{ owned: isPermanentOwned(item.id) }"
              :style="{ borderColor: getRarityColor(item.rarity) }"
            >
              <div v-if="isPermanentOwned(item.id)" class="owned-badge">
                ✓ 已拥有
              </div>
              
              <div class="item-header">
                <span class="item-icon">{{ item.icon }}</span>
                <div class="item-info">
                  <h3 class="item-name">{{ item.name }}</h3>
                  <span 
                    class="item-rarity"
                    :style="{ color: getRarityColor(item.rarity), background: getRarityColor(item.rarity) + '20' }"
                  >
                    {{ getRarityName(item.rarity) }}
                  </span>
                </div>
              </div>

              <p class="item-desc">{{ item.description }}</p>

              <div class="item-effects">
                <span 
                  v-for="(effect, idx) in item.effects" 
                  :key="idx"
                  class="effect-tag permanent"
                >
                  ♾️ {{ effect.description }}
                </span>
              </div>

              <div class="item-footer">
                <div class="item-price">
                  <span class="current-price" :class="{ owned: isPermanentOwned(item.id) }">
                    {{ isPermanentOwned(item.id) ? '已拥有' : item.basePrice + '💰' }}
                  </span>
                </div>
              </div>

              <button
                class="btn btn-buy"
                :disabled="!canPurchaseItem(item.id)"
                @click="handlePurchase(item.id)"
              >
                <span class="btn-icon">💎</span>
                {{ isPermanentOwned(item.id) ? '已拥有' : '永久购买' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="permanentEffects.length > 0" class="section">
          <h2 class="section-title">✨ 已激活永久效果</h2>
          <div class="permanent-effects">
            <div 
              v-for="(effect, idx) in permanentEffects" 
              :key="idx"
              class="permanent-effect-card"
            >
              <span class="effect-icon">✨</span>
              <span class="effect-text">{{ effect.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'inventory'" class="tab-content">
        <div class="section">
          <h2 class="section-title">🎒 我的背包</h2>
          
          <div v-if="inventoryItems.length > 0" class="items-grid">
            <div 
              v-for="item in inventoryItems" 
              :key="item.id" 
              class="item-card"
              :style="{ borderColor: getRarityColor(item.rarity) }"
            >
              <div class="item-header">
                <span class="item-icon">{{ item.icon }}</span>
                <div class="item-info">
                  <h3 class="item-name">{{ item.name }}</h3>
                  <span 
                    class="item-rarity"
                    :style="{ color: getRarityColor(item.rarity), background: getRarityColor(item.rarity) + '20' }"
                  >
                    {{ getCategoryName(item.category) }}
                  </span>
                </div>
                <div class="item-quantity">
                  ×{{ item.quantity }}
                </div>
              </div>

              <p class="item-desc">{{ item.description }}</p>

              <div class="item-effects">
                <span 
                  v-for="(effect, idx) in item.effects" 
                  :key="idx"
                  class="effect-tag"
                  :class="{ permanent: item.category === 'permanent' }"
                >
                  {{ item.category === 'permanent' ? '♾️' : '' }} {{ effect.description }}
                </span>
              </div>

              <button
                v-if="item.category === 'consumable'"
                class="btn btn-equip"
                :disabled="!canEquip(item.id)"
                @click="isEquipped(item.id) ? handleUnequip(item.id) : handleEquip(item.id)"
              >
                <span class="btn-icon">{{ isEquipped(item.id) ? '✓' : '⚔️' }}</span>
                {{ isEquipped(item.id) ? '已装备' : '装备使用' }}
              </button>

              <div v-else class="permanent-owned">
                <span class="owned-icon">💎</span>
                <span class="owned-text">永久效果已激活</span>
              </div>
            </div>
          </div>

          <div v-else class="no-items">
            <span class="no-items-icon">📦</span>
            <p class="no-items-text">背包空空如也</p>
            <p class="no-items-hint">去商店购买一些道具吧！</p>
          </div>
        </div>

        <div class="section">
          <div class="quick-actions">
            <button class="btn btn-start-game" @click="emit('startGame')">
              <span class="btn-icon">🎮</span>
              开始跑酷
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #FFE4B5 0%, #FFDAB9 50%, #DEB887 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.btn-back {
  background: linear-gradient(180deg, #D2691E, #8B4513);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.shop-title {
  margin: 0;
  font-size: 24px;
  color: #8B4513;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 28px;
}

.coin-display {
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(180deg, #FFD700, #FFA500);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  color: #8B4513;
}

.coin-icon {
  font-size: 18px;
}

.equipped-banner {
  background: linear-gradient(90deg, #E8F5E9, #C8E6C9);
  padding: 10px 20px;
  border-bottom: 2px solid #81C784;
}

.equipped-content {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.equipped-label {
  font-size: 14px;
  font-weight: bold;
  color: #2E7D32;
}

.equipped-items {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.equipped-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  padding: 4px 8px 4px 4px;
  border-radius: 15px;
  border: 2px solid;
  font-size: 13px;
  font-weight: 500;
}

.chip-icon {
  font-size: 16px;
}

.chip-remove {
  background: #FFCDD2;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C62828;
  font-weight: bold;
}

.tab-buttons {
  display: flex;
  background: rgba(255, 255, 255, 0.8);
  padding: 5px;
  gap: 5px;
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 5px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: #666;
}

.tab-btn.active {
  background: linear-gradient(180deg, #D2691E, #8B4513);
  color: white;
}

.tab-icon {
  font-size: 20px;
}

.shop-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.section-title {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #8B4513;
}

.section-header .section-title {
  margin: 0;
}

.section-desc {
  margin: -10px 0 15px 0;
  font-size: 13px;
  color: #888;
}

.refresh-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.refresh-time {
  font-size: 13px;
  color: #666;
  background: #FFF3E0;
  padding: 4px 10px;
  border-radius: 10px;
}

.btn-refresh {
  background: linear-gradient(180deg, #FF9800, #F57C00);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 3px 0 #E65100;
  transition: all 0.2s;
}

.btn-refresh:disabled {
  background: linear-gradient(180deg, #ccc, #aaa);
  box-shadow: 0 3px 0 #888;
  cursor: not-allowed;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.item-card {
  background: linear-gradient(180deg, #FFFEF9, #FFF8E7);
  border-radius: 15px;
  padding: 15px;
  border: 3px solid;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.item-card.owned {
  opacity: 0.85;
}

.discount-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(135deg, #FF5252, #FF1744);
  color: white;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(255, 23, 68, 0.4);
}

.owned-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  z-index: 1;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  font-size: 48px;
}

.item-info {
  flex: 1;
}

.item-name {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #5D4037;
  font-weight: bold;
}

.item-rarity {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: bold;
}

.item-owned,
.item-quantity {
  font-size: 14px;
  font-weight: bold;
  color: #8B4513;
  background: #FFECB3;
  padding: 4px 10px;
  border-radius: 12px;
}

.item-desc {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.item-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.effect-tag {
  font-size: 11px;
  padding: 4px 8px;
  background: #E3F2FD;
  color: #1565C0;
  border-radius: 8px;
  font-weight: 500;
}

.effect-tag.permanent {
  background: #F3E5F5;
  color: #7B1FA2;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.original-price {
  font-size: 13px;
  color: #999;
  text-decoration: line-through;
}

.current-price {
  font-size: 18px;
  font-weight: bold;
  color: #FF6F00;
}

.current-price.discounted {
  color: #D32F2F;
}

.current-price.owned {
  color: #388E3C;
}

.item-stock {
  font-size: 12px;
  color: #888;
}

.discount-timer {
  font-size: 12px;
  color: #D32F2F;
  background: #FFEBEE;
  padding: 4px 8px;
  border-radius: 8px;
  text-align: center;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.btn-buy,
.btn-equip {
  background: linear-gradient(180deg, #FF9800, #F57C00);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 0 #E65100;
  transition: all 0.2s;
  width: 100%;
}

.btn-buy:disabled,
.btn-equip:disabled {
  background: linear-gradient(180deg, #ccc, #aaa);
  box-shadow: 0 4px 0 #888;
  cursor: not-allowed;
}

.btn-equip {
  background: linear-gradient(180deg, #9C27B0, #7B1FA2);
  box-shadow: 0 4px 0 #6A1B9A;
}

.btn-small {
  padding: 10px 12px;
  font-size: 13px;
  flex: 1;
}

.permanent-effects {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.permanent-effect-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(90deg, #F3E5F5, #E1BEE7);
  padding: 12px 15px;
  border-radius: 12px;
  border-left: 4px solid #9C27B0;
}

.effect-icon {
  font-size: 24px;
}

.effect-text {
  font-size: 14px;
  color: #4A148C;
  font-weight: 500;
}

.permanent-owned {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(90deg, #E8F5E9, #C8E6C9);
  padding: 12px;
  border-radius: 10px;
}

.owned-icon {
  font-size: 20px;
}

.owned-text {
  font-size: 14px;
  color: #2E7D32;
  font-weight: bold;
}

.no-items {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #999;
}

.no-items-icon {
  font-size: 64px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.no-items-text {
  font-size: 18px;
  margin: 0 0 8px 0;
}

.no-items-hint {
  font-size: 14px;
  margin: 0;
}

.quick-actions {
  display: flex;
  justify-content: center;
}

.btn-start-game {
  background: linear-gradient(180deg, #FF6B6B, #EE5A5A);
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 30px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 0 #CC4444;
  transition: all 0.2s;
}

.btn-start-game:hover {
  transform: translateY(-2px);
}

.btn-start-game:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #CC4444;
}

@media (max-width: 480px) {
  .shop-header {
    padding: 10px 15px;
  }

  .shop-title {
    font-size: 20px;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }

  .tab-btn {
    padding: 8px 3px;
    font-size: 11px;
  }

  .equipped-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
