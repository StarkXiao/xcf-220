import { reactive, watch } from 'vue'
import type {
  ShopState,
  ShopItem,
  ShopItemEffect,
  ShopStockItem,
  ShopDiscount,
  ItemEffectType
} from './types'
import {
  SHOP_ITEMS,
  getShopItemById,
  generateRandomDiscounts,
  REFRESH_COST,
  MAX_EQUIPPED_CONSUMABLES
} from './shopData'
import { removeResource, getResourceAmount, addResource } from './campStore'

const STORAGE_KEY = 'forest-runner-shop-state'
const STOCK_REFRESH_INTERVAL = 24 * 60 * 60 * 1000
const DISCOUNT_REFRESH_INTERVAL = 6 * 60 * 60 * 1000

function createInitialStock(): ShopStockItem[] {
  return SHOP_ITEMS.map(item => ({
    itemId: item.id,
    currentStock: item.maxStock,
    lastRefreshed: Date.now()
  }))
}

function createInitialDiscounts(): ShopDiscount[] {
  const now = Date.now()
  const randomDiscounts = generateRandomDiscounts()
  return randomDiscounts.map(d => ({
    itemId: d.itemId,
    discountPercent: d.discountPercent,
    startTime: now,
    endTime: now + DISCOUNT_REFRESH_INTERVAL
  }))
}

function createInitialState(): ShopState {
  return {
    inventory: [],
    stock: createInitialStock(),
    discounts: createInitialDiscounts(),
    lastShopRefresh: Date.now(),
    totalSpent: 0,
    totalPurchased: 0,
    equippedConsumables: [],
    activeRunEffects: []
  }
}

function loadState(): ShopState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as ShopState
      const initial = createInitialState()
      
      if (!parsed.inventory) parsed.inventory = []
      if (!parsed.stock) parsed.stock = initial.stock
      if (!parsed.discounts) parsed.discounts = initial.discounts
      if (!parsed.lastShopRefresh) parsed.lastShopRefresh = Date.now()
      if (!parsed.totalSpent) parsed.totalSpent = 0
      if (!parsed.totalPurchased) parsed.totalPurchased = 0
      if (!parsed.equippedConsumables) parsed.equippedConsumables = []
      if (!parsed.activeRunEffects) parsed.activeRunEffects = []
      
      return parsed
    }
  } catch (e) {
    console.error('Failed to load shop state:', e)
  }
  return createInitialState()
}

function saveState(state: ShopState): void {
  try {
    const toSave = {
      inventory: state.inventory,
      stock: state.stock,
      discounts: state.discounts,
      lastShopRefresh: state.lastShopRefresh,
      totalSpent: state.totalSpent,
      totalPurchased: state.totalPurchased,
      equippedConsumables: state.equippedConsumables,
      activeRunEffects: state.activeRunEffects
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save shop state:', e)
  }
}

export const shopState = reactive<ShopState>(loadState())

watch(
  () => shopState,
  (newState) => {
    saveState(newState)
  },
  { deep: true }
)

export function getDiscountedPrice(item: ShopItem): number {
  const discount = shopState.discounts.find(d => d.itemId === item.id && Date.now() < d.endTime)
  if (discount) {
    return Math.floor(item.basePrice * (1 - discount.discountPercent / 100))
  }
  return item.basePrice
}

export function getActiveDiscount(itemId: string): ShopDiscount | undefined {
  return shopState.discounts.find(d => d.itemId === itemId && Date.now() < d.endTime)
}

export function getCurrentStock(itemId: string): number {
  const stockItem = shopState.stock.find(s => s.itemId === itemId)
  return stockItem?.currentStock || 0
}

export function getInventoryQuantity(itemId: string): number {
  const invItem = shopState.inventory.find(i => i.itemId === itemId)
  return invItem?.quantity || 0
}

export function canAffordItem(item: ShopItem): boolean {
  const price = getDiscountedPrice(item)
  return getResourceAmount('coin') >= price
}

export function canPurchaseItem(itemId: string): boolean {
  const item = getShopItemById(itemId)
  if (!item) return false
  if (item.category === 'permanent' && getInventoryQuantity(itemId) > 0) return false
  if (getCurrentStock(itemId) <= 0) return false
  return canAffordItem(item)
}

export function purchaseItem(itemId: string): boolean {
  const item = getShopItemById(itemId)
  if (!item) return false
  if (!canPurchaseItem(itemId)) return false

  const price = getDiscountedPrice(item)
  if (!removeResource('coin', price)) return false

  const stockItem = shopState.stock.find(s => s.itemId === itemId)
  if (stockItem) {
    stockItem.currentStock--
  }

  const invItem = shopState.inventory.find(i => i.itemId === itemId)
  if (invItem) {
    invItem.quantity++
  } else {
    shopState.inventory.push({ itemId, quantity: 1 })
  }

  shopState.totalSpent += price
  shopState.totalPurchased++

  return true
}

export function refreshShop(): boolean {
  if (!removeResource('coin', REFRESH_COST)) return false

  shopState.stock.forEach(stockItem => {
    const item = getShopItemById(stockItem.itemId)
    if (item?.isRefreshable) {
      stockItem.currentStock = item.maxStock
      stockItem.lastRefreshed = Date.now()
    }
  })

  shopState.discounts = createInitialDiscounts()
  shopState.lastShopRefresh = Date.now()

  return true
}

export function checkAndRefreshStock(): void {
  const now = Date.now()
  if (now - shopState.lastShopRefresh >= STOCK_REFRESH_INTERVAL) {
    shopState.stock.forEach(stockItem => {
      const item = getShopItemById(stockItem.itemId)
      if (item?.isRefreshable) {
        stockItem.currentStock = item.maxStock
        stockItem.lastRefreshed = now
      }
    })
    shopState.discounts = createInitialDiscounts()
    shopState.lastShopRefresh = now
  }
}

export function equipConsumable(itemId: string): boolean {
  const item = getShopItemById(itemId)
  if (!item || item.category !== 'consumable') return false
  if (getInventoryQuantity(itemId) <= 0) return false
  if (shopState.equippedConsumables.includes(itemId)) return false
  if (shopState.equippedConsumables.length >= MAX_EQUIPPED_CONSUMABLES) return false

  shopState.equippedConsumables.push(itemId)
  return true
}

export function unequipConsumable(itemId: string): boolean {
  const index = shopState.equippedConsumables.indexOf(itemId)
  if (index === -1) return false

  shopState.equippedConsumables.splice(index, 1)
  return true
}

export function useConsumable(itemId: string): boolean {
  const invItem = shopState.inventory.find(i => i.itemId === itemId)
  if (!invItem || invItem.quantity <= 0) return false

  invItem.quantity--
  if (invItem.quantity <= 0) {
    const index = shopState.inventory.indexOf(invItem)
    shopState.inventory.splice(index, 1)
  }

  unequipConsumable(itemId)
  return true
}

export function prepareRunEffects(): void {
  shopState.activeRunEffects = []
  
  const permanentEffects = getPermanentEffects()
  shopState.activeRunEffects.push(...permanentEffects)

  for (const itemId of shopState.equippedConsumables) {
    const item = getShopItemById(itemId)
    if (item) {
      shopState.activeRunEffects.push(...item.effects)
      useConsumable(itemId)
    }
  }
}

export function getPermanentEffects(): ShopItemEffect[] {
  const effects: ShopItemEffect[] = []
  
  for (const invItem of shopState.inventory) {
    const item = getShopItemById(invItem.itemId)
    if (item?.category === 'permanent' && invItem.quantity > 0) {
      effects.push(...item.effects)
    }
  }
  
  return effects
}

export function getRunEffectValue(effectType: ItemEffectType): number {
  return shopState.activeRunEffects
    .filter(e => e.type === effectType)
    .reduce((sum, e) => sum + e.value, 0)
}

export function getCombinedShopBuffs(): Record<string, number> {
  const buffs: Record<string, number> = {}
  
  for (const effect of shopState.activeRunEffects) {
    switch (effect.type) {
      case 'double_coins':
        buffs['coin_multiplier'] = (buffs['coin_multiplier'] || 0) + effect.value
        break
      case 'score_multiplier':
        buffs['score_multiplier'] = (buffs['score_multiplier'] || 0) + effect.value
        break
      case 'magnet':
        buffs['magnet_range'] = (buffs['magnet_range'] || 0) + effect.value
        break
      case 'extra_life':
        buffs['extra_life'] = (buffs['extra_life'] || 0) + effect.value
        break
      case 'extra_life_perm':
        buffs['extra_life'] = (buffs['extra_life'] || 0) + effect.value
        break
      case 'jump_boost_perm':
        buffs['jump_boost'] = (buffs['jump_boost'] || 0) + effect.value
        break
      case 'base_speed_perm':
        buffs['speed_boost'] = (buffs['speed_boost'] || 0) + effect.value
        break
      case 'coin_magnet_range':
        buffs['magnet_range'] = (buffs['magnet_range'] || 0) + effect.value
        break
      case 'slow_obstacles':
        buffs['slow_obstacles'] = (buffs['slow_obstacles'] || 0) + effect.value
        break
      case 'invincible_start':
        buffs['invincible_start'] = (buffs['invincible_start'] || 0) + (effect.duration || 0)
        break
      case 'speed_boost_start':
        buffs['speed_boost_start'] = (buffs['speed_boost_start'] || 0) + effect.value
        buffs['speed_boost_start_duration'] = (buffs['speed_boost_start_duration'] || 0) + (effect.duration || 0)
        break
    }
  }
  
  return buffs
}

export function getStockRefreshTimeRemaining(): number {
  const nextRefresh = shopState.lastShopRefresh + STOCK_REFRESH_INTERVAL
  return Math.max(0, nextRefresh - Date.now())
}

export function getDiscountTimeRemaining(itemId: string): number {
  const discount = getActiveDiscount(itemId)
  if (!discount) return 0
  return Math.max(0, discount.endTime - Date.now())
}

export function getShopStats(): { totalSpent: number; totalPurchased: number } {
  return {
    totalSpent: shopState.totalSpent,
    totalPurchased: shopState.totalPurchased
  }
}

export function addCoins(amount: number): void {
  addResource('coin', amount)
}

export function resetShopState(): void {
  Object.assign(shopState, createInitialState())
  saveState(shopState)
}
