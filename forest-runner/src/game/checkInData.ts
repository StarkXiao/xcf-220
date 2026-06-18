import type { CheckInReward } from './types'

export const STREAK_REWARDS: CheckInReward[] = [
  {
    id: 'streak-day-1',
    day: 1,
    type: 'coin',
    amount: 50,
    icon: '💰',
    name: '金币'
  },
  {
    id: 'streak-day-2',
    day: 2,
    type: 'resource',
    amount: 5,
    resourceType: 'wood',
    icon: '🪵',
    name: '木材'
  },
  {
    id: 'streak-day-3',
    day: 3,
    type: 'resource',
    amount: 3,
    resourceType: 'stone',
    icon: '🪨',
    name: '石头'
  },
  {
    id: 'streak-day-4',
    day: 4,
    type: 'coin',
    amount: 100,
    icon: '💰',
    name: '金币'
  },
  {
    id: 'streak-day-5',
    day: 5,
    type: 'battle_pass_points',
    amount: 50,
    icon: '⭐',
    name: '赛季积分'
  },
  {
    id: 'streak-day-6',
    day: 6,
    type: 'resource',
    amount: 3,
    resourceType: 'crystal',
    icon: '💎',
    name: '水晶'
  },
  {
    id: 'streak-day-7',
    day: 7,
    type: 'coin',
    amount: 300,
    icon: '🎁',
    name: '周奖励宝箱',
    isBonus: true
  }
]

export const EXTRA_STREAK_BONUSES: { streak: number; reward: CheckInReward }[] = [
  {
    streak: 14,
    reward: {
      id: 'streak-bonus-14',
      day: 14,
      type: 'battle_pass_points',
      amount: 100,
      icon: '🏆',
      name: '连续签到14天奖励',
      isBonus: true
    }
  },
  {
    streak: 30,
    reward: {
      id: 'streak-bonus-30',
      day: 30,
      type: 'coin',
      amount: 500,
      icon: '👑',
      name: '连续签到30天奖励',
      isBonus: true
    }
  }
]

export const CHECK_IN_CONFIG = {
  supplementaryCost: 200,
  maxSupplementaryPerMonth: 5,
  floatShowIntervalDays: 1,
  cycleDays: 7
}

export function getRewardForStreakDay(streakDay: number): CheckInReward | undefined {
  const cycleDay = ((streakDay - 1) % CHECK_IN_CONFIG.cycleDays) + 1
  return STREAK_REWARDS.find(r => r.day === cycleDay)
}

export function getStreakBonus(streak: number): CheckInReward | undefined {
  const bonus = EXTRA_STREAK_BONUSES.find(b => b.streak === streak)
  return bonus?.reward
}

export function getAllAvailableRewards(currentStreak: number): CheckInReward[] {
  const rewards: CheckInReward[] = []
  for (let i = 1; i <= currentStreak; i++) {
    const reward = getRewardForStreakDay(i)
    if (reward) {
      rewards.push({
        ...reward,
        id: `reward-${i}`,
        day: i
      })
    }
    const bonus = getStreakBonus(i)
    if (bonus) {
      rewards.push({
        ...bonus,
        id: `bonus-${i}`,
        day: i
      })
    }
  }
  return rewards
}

export function getNextRewardPreview(currentStreak: number): { reward: CheckInReward; daysLeft: number } | null {
  const nextDay = currentStreak + 1
  const nextReward = getRewardForStreakDay(nextDay)
  if (!nextReward) return null
  return {
    reward: { ...nextReward, day: nextDay },
    daysLeft: 1
  }
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function getDaysDiff(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}
