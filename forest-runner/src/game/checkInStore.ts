import { reactive, watch } from 'vue'
import type {
  CheckInState,
  CheckInMonthData,
  CheckInRecord,
  CheckInCalendarDay,
  CheckInReward,
  CheckInArchiveEntry
} from './types'
import {
  CHECK_IN_CONFIG,
  formatDateKey,
  parseDateKey,
  isSameDay,
  getDaysDiff,
  getRewardForStreakDay,
  getStreakBonus,
  getNextRewardPreview
} from './checkInData'
import { addResource } from './campStore'
import { addPoints } from './battlePassStore'

const STORAGE_KEY = 'forest-runner-check-in'

function createInitialState(): CheckInState {
  return {
    currentStreak: 0,
    maxStreak: 0,
    totalCheckedDays: 0,
    lastCheckInDate: null,
    monthlyData: [],
    claimedRewards: [],
    archive: [],
    supplementaryCost: CHECK_IN_CONFIG.supplementaryCost,
    maxSupplementaryPerMonth: CHECK_IN_CONFIG.maxSupplementaryPerMonth,
    usedSupplementaryThisMonth: 0,
    showFloatOnHome: true,
    lastFloatDismissDate: null
  }
}

function loadState(): CheckInState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<CheckInState>
      const initial = createInitialState()

      const state: CheckInState = {
        currentStreak: parsed.currentStreak ?? initial.currentStreak,
        maxStreak: parsed.maxStreak ?? initial.maxStreak,
        totalCheckedDays: parsed.totalCheckedDays ?? initial.totalCheckedDays,
        lastCheckInDate: parsed.lastCheckInDate ?? initial.lastCheckInDate,
        monthlyData: parsed.monthlyData ?? initial.monthlyData,
        claimedRewards: parsed.claimedRewards ?? initial.claimedRewards,
        archive: parsed.archive ?? initial.archive,
        supplementaryCost: parsed.supplementaryCost ?? initial.supplementaryCost,
        maxSupplementaryPerMonth: parsed.maxSupplementaryPerMonth ?? initial.maxSupplementaryPerMonth,
        usedSupplementaryThisMonth: parsed.usedSupplementaryThisMonth ?? initial.usedSupplementaryThisMonth,
        showFloatOnHome: parsed.showFloatOnHome ?? initial.showFloatOnHome,
        lastFloatDismissDate: parsed.lastFloatDismissDate ?? initial.lastFloatDismissDate
      }

      checkAndUpdateStreak(state)
      checkAndArchiveMonth(state)

      return state
    }
  } catch (e) {
    console.error('Failed to load check-in state:', e)
  }
  return createInitialState()
}

function saveState(state: CheckInState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentStreak: state.currentStreak,
        maxStreak: state.maxStreak,
        totalCheckedDays: state.totalCheckedDays,
        lastCheckInDate: state.lastCheckInDate,
        monthlyData: state.monthlyData,
        claimedRewards: state.claimedRewards,
        archive: state.archive,
        supplementaryCost: state.supplementaryCost,
        maxSupplementaryPerMonth: state.maxSupplementaryPerMonth,
        usedSupplementaryThisMonth: state.usedSupplementaryThisMonth,
        showFloatOnHome: state.showFloatOnHome,
        lastFloatDismissDate: state.lastFloatDismissDate
      })
    )
  } catch (e) {
    console.error('Failed to save check-in state:', e)
  }
}

function checkAndUpdateStreak(state: CheckInState): void {
  if (!state.lastCheckInDate) return

  const today = new Date()
  const lastCheckIn = parseDateKey(state.lastCheckInDate)
  const daysDiff = getDaysDiff(lastCheckIn, today)

  if (daysDiff > 1) {
    state.currentStreak = 0
  }
}

function checkAndArchiveMonth(state: CheckInState): void {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthsToArchive: number[] = []

  state.monthlyData.forEach((monthData, index) => {
    if (
      monthData.year < currentYear ||
      (monthData.year === currentYear && monthData.month < currentMonth)
    ) {
      monthsToArchive.push(index)
    }
  })

  for (let i = monthsToArchive.length - 1; i >= 0; i--) {
    const monthData = state.monthlyData[monthsToArchive[i]]
    const archiveEntry = createArchiveEntry(monthData, state)
    state.archive.unshift(archiveEntry)
    state.monthlyData.splice(monthsToArchive[i], 1)
  }

  if (monthsToArchive.length > 0) {
    state.usedSupplementaryThisMonth = 0
  }
}

function createArchiveEntry(
  monthData: CheckInMonthData,
  _state: CheckInState
): CheckInArchiveEntry {
  const checkedDays = monthData.records.filter(r => r.checkedIn).length
  const maxStreak = calculateMaxStreakForMonth(monthData)
  const monthPrefix = `${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}`
  const rewardsClaimed = _state.claimedRewards.filter(id => id.includes(monthPrefix))

  return {
    month: monthPrefix,
    totalDays: monthData.records.length,
    checkedDays,
    maxStreak,
    rewardsClaimed
  }
}

function calculateMaxStreakForMonth(monthData: CheckInMonthData): number {
  let maxStreak = 0
  let currentStreak = 0

  const sortedRecords = [...monthData.records].sort((a, b) => a.date.localeCompare(b.date))

  for (let i = 0; i < sortedRecords.length; i++) {
    if (sortedRecords[i].checkedIn) {
      currentStreak++
      if (i > 0) {
        const prevDate = parseDateKey(sortedRecords[i - 1].date)
        const currDate = parseDateKey(sortedRecords[i].date)
        const daysDiff = getDaysDiff(prevDate, currDate)
        if (daysDiff > 1) {
          currentStreak = 1
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return maxStreak
}

function getOrCreateMonthData(state: CheckInState, year: number, month: number): CheckInMonthData {
  let monthData = state.monthlyData.find(m => m.year === year && m.month === month)
  if (!monthData) {
    monthData = {
      year,
      month,
      records: generateMonthRecords(year, month)
    }
    state.monthlyData.push(monthData)
  }
  return monthData
}

function generateMonthRecords(year: number, month: number): CheckInRecord[] {
  const records: CheckInRecord[] = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    records.push({
      date: formatDateKey(date),
      checkedIn: false
    })
  }

  return records
}

export const checkInState = reactive<CheckInState>(loadState())

watch(
  () => checkInState,
  newState => {
    saveState(newState)
  },
  { deep: true }
)

export function hasCheckedInToday(): boolean {
  if (!checkInState.lastCheckInDate) return false
  const today = formatDateKey(new Date())
  return checkInState.lastCheckInDate === today
}

export function canCheckInToday(): boolean {
  return !hasCheckedInToday()
}

export function canSupplementDate(dateKey: string): boolean {
  const targetDate = parseDateKey(dateKey)
  const today = new Date()

  if (isSameDay(targetDate, today)) return false
  if (targetDate > today) return false

  const record = findRecord(dateKey)
  if (record?.checkedIn) return false

  const month = targetDate.getMonth()
  const year = targetDate.getFullYear()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  if (year !== currentYear || month !== currentMonth) return false

  if (checkInState.usedSupplementaryThisMonth >= checkInState.maxSupplementaryPerMonth) {
    return false
  }

  const daysDiff = getDaysDiff(targetDate, today)
  return daysDiff <= 30
}

function findRecord(dateKey: string): CheckInRecord | undefined {
  const date = parseDateKey(dateKey)
  const monthData = getOrCreateMonthData(checkInState, date.getFullYear(), date.getMonth())
  return monthData.records.find(r => r.date === dateKey)
}

export function checkIn(): { success: boolean; rewards: CheckInReward[]; streakBonus?: CheckInReward } {
  if (hasCheckedInToday()) {
    return { success: false, rewards: [] }
  }

  const today = new Date()
  const todayKey = formatDateKey(today)
  const monthData = getOrCreateMonthData(checkInState, today.getFullYear(), today.getMonth())
  const record = monthData.records.find(r => r.date === todayKey)

  if (record) {
    record.checkedIn = true
  }

  if (checkInState.lastCheckInDate) {
    const lastDate = parseDateKey(checkInState.lastCheckInDate)
    const daysDiff = getDaysDiff(lastDate, today)
    if (daysDiff === 1) {
      checkInState.currentStreak++
    } else if (daysDiff > 1) {
      checkInState.currentStreak = 1
    }
  } else {
    checkInState.currentStreak = 1
  }

  checkInState.lastCheckInDate = todayKey
  checkInState.totalCheckedDays++
  checkInState.maxStreak = Math.max(checkInState.maxStreak, checkInState.currentStreak)

  const rewards: CheckInReward[] = []
  const streakReward = getRewardForStreakDay(checkInState.currentStreak)
  if (streakReward) {
    const rewardId = `reward-${todayKey}`
    if (!checkInState.claimedRewards.includes(rewardId)) {
      checkInState.claimedRewards.push(rewardId)
      rewards.push({ ...streakReward, id: rewardId, day: checkInState.currentStreak })
      distributeReward(streakReward)
    }
  }

  let streakBonus: CheckInReward | undefined
  const bonus = getStreakBonus(checkInState.currentStreak)
  if (bonus) {
    const bonusId = `bonus-${todayKey}`
    if (!checkInState.claimedRewards.includes(bonusId)) {
      checkInState.claimedRewards.push(bonusId)
      streakBonus = { ...bonus, id: bonusId, day: checkInState.currentStreak }
      rewards.push(streakBonus)
      distributeReward(bonus)
    }
  }

  checkInState.showFloatOnHome = false
  checkInState.lastFloatDismissDate = todayKey

  return { success: true, rewards, streakBonus }
}

export function supplementCheckIn(dateKey: string): { success: boolean; rewards: CheckInReward[]; message?: string } {
  if (!canSupplementDate(dateKey)) {
    return { success: false, rewards: [], message: '无法补签该日期' }
  }

  const date = parseDateKey(dateKey)
  const monthData = getOrCreateMonthData(checkInState, date.getFullYear(), date.getMonth())
  const record = monthData.records.find(r => r.date === dateKey)

  if (!record || record.checkedIn) {
    return { success: false, rewards: [], message: '该日期已签到' }
  }

  record.checkedIn = true
  record.isSupplementary = true

  checkInState.totalCheckedDays++
  checkInState.usedSupplementaryThisMonth++

  const rewards: CheckInReward[] = []
  const simulatedStreak = calculateSimulatedStreak(dateKey)
  const streakReward = getRewardForStreakDay(simulatedStreak)
  if (streakReward) {
    const rewardId = `supp-${dateKey}`
    if (!checkInState.claimedRewards.includes(rewardId)) {
      checkInState.claimedRewards.push(rewardId)
      rewards.push({ ...streakReward, id: rewardId, day: simulatedStreak })
      distributeReward(streakReward)
    }
  }

  const bonus = getStreakBonus(simulatedStreak)
  if (bonus) {
    const bonusId = `supp-bonus-${dateKey}`
    if (!checkInState.claimedRewards.includes(bonusId)) {
      checkInState.claimedRewards.push(bonusId)
      rewards.push({ ...bonus, id: bonusId, day: simulatedStreak })
      distributeReward(bonus)
    }
  }

  return { success: true, rewards }
}

function calculateSimulatedStreak(dateKey: string): number {
  const targetDate = parseDateKey(dateKey)
  let streak = 1

  for (let i = 1; i <= 30; i++) {
    const prevDate = new Date(targetDate)
    prevDate.setDate(prevDate.getDate() - i)
    const prevDateKey = formatDateKey(prevDate)
    const prevRecord = findRecord(prevDateKey)

    if (prevRecord?.checkedIn) {
      streak++
    } else {
      break
    }
  }

  return streak
}

function distributeReward(reward: CheckInReward): void {
  switch (reward.type) {
    case 'coin':
      addResource('coin', reward.amount)
      break
    case 'resource':
      if (reward.resourceType) {
        addResource(reward.resourceType, reward.amount)
      }
      break
    case 'battle_pass_points':
      addPoints(reward.amount)
      break
  }
}

export function getCalendarData(year: number, month: number): CheckInCalendarDay[] {
  const monthData = getOrCreateMonthData(checkInState, year, month)
  const today = new Date()
  const todayKey = formatDateKey(today)
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const calendarDays: CheckInCalendarDay[] = []

  for (let i = 0; i < firstDay; i++) {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate()
    const day = prevMonthDays - firstDay + i + 1
    const date = new Date(prevYear, prevMonth, day)
    const dateKey = formatDateKey(date)
    const record = findRecord(dateKey)

    calendarDays.push({
      date: dateKey,
      day,
      isToday: false,
      isPast: true,
      isFuture: false,
      isCurrentMonth: false,
      checkedIn: record?.checkedIn || false,
      isSupplementary: record?.isSupplementary,
      canCheckIn: false,
      canSupplement: false
    })
  }

  let runningStreak = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateKey = formatDateKey(date)
    const record = monthData.records.find(r => r.date === dateKey)
    const isToday = dateKey === todayKey
    const isPast = date < today && !isToday
    const isFuture = date > today

    if (record?.checkedIn) {
      runningStreak++
    } else if (!isFuture) {
      runningStreak = 0
    }

    const streakDayForReward = runningStreak > 0 ? runningStreak : undefined
    const reward = streakDayForReward ? getRewardForStreakDay(streakDayForReward) : undefined

    calendarDays.push({
      date: dateKey,
      day,
      isToday,
      isPast,
      isFuture,
      isCurrentMonth: true,
      checkedIn: record?.checkedIn || false,
      isSupplementary: record?.isSupplementary,
      canCheckIn: isToday && canCheckInToday(),
      canSupplement: canSupplementDate(dateKey),
      reward,
      streakDay: streakDayForReward
    })
  }

  const remainingDays = 42 - calendarDays.length
  for (let i = 1; i <= remainingDays; i++) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    const date = new Date(nextYear, nextMonth, i)
    const dateKey = formatDateKey(date)
    const record = findRecord(dateKey)

    calendarDays.push({
      date: dateKey,
      day: i,
      isToday: false,
      isPast: false,
      isFuture: true,
      isCurrentMonth: false,
      checkedIn: record?.checkedIn || false,
      isSupplementary: record?.isSupplementary,
      canCheckIn: false,
      canSupplement: false
    })
  }

  return calendarDays
}

export function shouldShowHomeFloat(): boolean {
  if (!checkInState.showFloatOnHome) {
    if (checkInState.lastFloatDismissDate) {
      const lastDismiss = parseDateKey(checkInState.lastFloatDismissDate)
      const today = new Date()
      const daysDiff = getDaysDiff(lastDismiss, today)
      if (daysDiff >= CHECK_IN_CONFIG.floatShowIntervalDays && canCheckInToday()) {
        checkInState.showFloatOnHome = true
      }
    }
  }
  return checkInState.showFloatOnHome && canCheckInToday()
}

export function dismissHomeFloat(): void {
  checkInState.showFloatOnHome = false
  checkInState.lastFloatDismissDate = formatDateKey(new Date())
}

export function hasUnclaimedRewards(): boolean {
  return canCheckInToday()
}

export function getCheckInStats(): {
  currentStreak: number
  maxStreak: number
  totalCheckedDays: number
  thisMonthChecked: number
  supplementaryRemaining: number
  nextReward: ReturnType<typeof getNextRewardPreview>
} {
  const today = new Date()
  const monthData = getOrCreateMonthData(checkInState, today.getFullYear(), today.getMonth())
  const thisMonthChecked = monthData.records.filter(r => r.checkedIn).length

  return {
    currentStreak: checkInState.currentStreak,
    maxStreak: checkInState.maxStreak,
    totalCheckedDays: checkInState.totalCheckedDays,
    thisMonthChecked,
    supplementaryRemaining: checkInState.maxSupplementaryPerMonth - checkInState.usedSupplementaryThisMonth,
    nextReward: getNextRewardPreview(checkInState.currentStreak)
  }
}

export function getArchive(): CheckInArchiveEntry[] {
  return checkInState.archive
}

export function getCurrentMonthInfo(): { year: number; month: number; monthName: string } {
  const now = new Date()
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    monthName: monthNames[now.getMonth()]
  }
}

export function resetCheckInState(): void {
  Object.assign(checkInState, createInitialState())
  saveState(checkInState)
}
