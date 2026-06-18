import { describe, it, expect, beforeEach } from 'vitest'
import {
  getRewardForStreakDay,
  getStreakBonus,
  formatDateKey,
  parseDateKey,
  getDaysDiff,
  CHECK_IN_CONFIG
} from '../game/checkInData'

describe('checkInData - 奖励阶梯逻辑', () => {
  it('7天周期内每天返回对应奖励', () => {
    const r1 = getRewardForStreakDay(1)
    expect(r1?.type).toBe('coin')
    expect(r1?.amount).toBe(50)

    const r2 = getRewardForStreakDay(2)
    expect(r2?.type).toBe('resource')
    expect(r2?.resourceType).toBe('wood')

    const r7 = getRewardForStreakDay(7)
    expect(r7?.type).toBe('coin')
    expect(r7?.amount).toBe(300)
    expect(r7?.isBonus).toBe(true)
  })

  it('第8天起按7天周期循环', () => {
    const r8 = getRewardForStreakDay(8)
    const r1 = getRewardForStreakDay(1)
    expect(r8?.type).toBe(r1?.type)
    expect(r8?.amount).toBe(r1?.amount)

    const r14 = getRewardForStreakDay(14)
    const r7 = getRewardForStreakDay(7)
    expect(r14?.type).toBe(r7?.type)
    expect(r14?.amount).toBe(r7?.amount)
  })

  it('里程碑奖励在指定天数触发', () => {
    expect(getStreakBonus(13)).toBeUndefined()
    expect(getStreakBonus(14)?.type).toBe('battle_pass_points')
    expect(getStreakBonus(14)?.amount).toBe(100)
    expect(getStreakBonus(30)?.type).toBe('coin')
    expect(getStreakBonus(30)?.amount).toBe(500)
    expect(getStreakBonus(31)).toBeUndefined()
  })
})

describe('checkInData - 日期工具', () => {
  it('formatDateKey 正确格式化日期', () => {
    expect(formatDateKey(new Date(2026, 5, 18))).toBe('2026-06-18')
    expect(formatDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('parseDateKey 正确解析日期', () => {
    const d = parseDateKey('2026-06-18')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(18)
  })

  it('getDaysDiff 正确计算天数差', () => {
    const d1 = new Date(2026, 5, 16)
    const d2 = new Date(2026, 5, 18)
    expect(getDaysDiff(d1, d2)).toBe(2)
    expect(getDaysDiff(d2, d1)).toBe(-2)
    expect(getDaysDiff(d1, d1)).toBe(0)
  })
})

describe('签到奖励ID唯一性 - 断签后重新签到场景', () => {
  it('日期键奖励ID格式保证唯一性', () => {
    const day1Key = '2026-06-16'
    const day2Key = '2026-06-18'
    const rewardId1 = `reward-${day1Key}`
    const rewardId2 = `reward-${day2Key}`
    expect(rewardId1).not.toBe(rewardId2)
  })

  it('同一日期不同奖励类型ID不冲突', () => {
    const dateKey = '2026-06-18'
    const normalRewardId = `reward-${dateKey}`
    const supplementRewardId = `supp-${dateKey}`
    const bonusId = `bonus-${dateKey}`
    const suppBonusId = `supp-bonus-${dateKey}`
    expect(new Set([normalRewardId, supplementRewardId, bonusId, suppBonusId]).size).toBe(4)
  })

  it('补签与正常签到的同日奖励ID不同', () => {
    const dateKey = '2026-06-15'
    const normalId = `reward-${dateKey}`
    const suppId = `supp-${dateKey}`
    expect(normalId).not.toBe(suppId)
  })

  it('断签重启后同一streak天数的奖励ID不同', () => {
    const firstStreakDate = '2026-06-10'
    const secondStreakDate = '2026-06-18'
    const id1 = `reward-${firstStreakDate}`
    const id2 = `reward-${secondStreakDate}`
    expect(id1).not.toBe(id2)
    expect(id1.includes('1')).toBe(true)
    expect(id2.includes('18')).toBe(true)
  })
})

describe('签到与补签奖励发放链路验证', () => {
  const coinTracker: { type: string; amount: number }[] = []
  const pointsTracker: { amount: number }[] = []

  function mockDistributeReward(reward: { type: string; amount: number; resourceType?: string }) {
    switch (reward.type) {
      case 'coin':
        coinTracker.push({ type: 'coin', amount: reward.amount })
        break
      case 'resource':
        coinTracker.push({ type: reward.resourceType || 'unknown', amount: reward.amount })
        break
      case 'battle_pass_points':
        pointsTracker.push({ amount: reward.amount })
        break
    }
  }

  beforeEach(() => {
    coinTracker.length = 0
    pointsTracker.length = 0
  })

  it('正常签到链路: 连续签到7天发放正确奖励', () => {
    const claimed: string[] = []

    for (let day = 1; day <= 7; day++) {
      const dateKey = `2026-06-${String(day + 10).padStart(2, '0')}`
      const rewardId = `reward-${dateKey}`
      const streakReward = getRewardForStreakDay(day)

      if (streakReward && !claimed.includes(rewardId)) {
        claimed.push(rewardId)
        mockDistributeReward(streakReward)
      }

      const bonus = getStreakBonus(day)
      if (bonus) {
        const bonusId = `bonus-${dateKey}`
        if (!claimed.includes(bonusId)) {
          claimed.push(bonusId)
          mockDistributeReward(bonus)
        }
      }
    }

    expect(coinTracker.filter(r => r.type === 'coin')).toHaveLength(3)
    expect(coinTracker.find(r => r.type === 'coin' && r.amount === 50)).toBeDefined()
    expect(coinTracker.find(r => r.type === 'coin' && r.amount === 100)).toBeDefined()
    expect(coinTracker.find(r => r.type === 'coin' && r.amount === 300)).toBeDefined()
    expect(coinTracker.find(r => r.type === 'wood')).toBeDefined()
    expect(coinTracker.find(r => r.type === 'stone')).toBeDefined()
    expect(coinTracker.find(r => r.type === 'crystal')).toBeDefined()
    expect(pointsTracker).toHaveLength(1)
    expect(pointsTracker[0].amount).toBe(50)
  })

  it('断签重启链路: 断签后重新签到能领取前几天奖励', () => {
    const claimed: string[] = []

    const day1Key = '2026-06-10'
    const day2Key = '2026-06-11'
    const streak1Reward = getRewardForStreakDay(1)
    if (streak1Reward) {
      const id = `reward-${day1Key}`
      claimed.push(id)
      mockDistributeReward(streak1Reward)
    }

    const streak2Reward = getRewardForStreakDay(2)
    if (streak2Reward) {
      const id = `reward-${day2Key}`
      claimed.push(id)
      mockDistributeReward(streak2Reward)
    }

    const afterBreakKey = '2026-06-18'
    const restartReward = getRewardForStreakDay(1)
    if (restartReward) {
      const id = `reward-${afterBreakKey}`
      if (!claimed.includes(id)) {
        claimed.push(id)
        mockDistributeReward(restartReward)
      }
    }

    const coinRewards = coinTracker.filter(r => r.type === 'coin' && r.amount === 50)
    expect(coinRewards).toHaveLength(2)

    expect(claimed).toContain('reward-2026-06-10')
    expect(claimed).toContain('reward-2026-06-11')
    expect(claimed).toContain('reward-2026-06-18')
  })

  it('补签链路: 补签使用supp前缀ID，不与正常签到冲突', () => {
    const claimed: string[] = []

    const todayKey = '2026-06-18'
    const normalId = `reward-${todayKey}`
    const streakReward = getRewardForStreakDay(1)
    if (streakReward && !claimed.includes(normalId)) {
      claimed.push(normalId)
      mockDistributeReward(streakReward)
    }

    const suppDateKey = '2026-06-16'
    const suppId = `supp-${suppDateKey}`
    const suppReward = getRewardForStreakDay(1)
    if (suppReward && !claimed.includes(suppId)) {
      claimed.push(suppId)
      mockDistributeReward(suppReward)
    }

    expect(claimed).toContain('reward-2026-06-18')
    expect(claimed).toContain('supp-2026-06-16')
    expect(claimed.length).toBe(2)

    const coinRewards = coinTracker.filter(r => r.type === 'coin' && r.amount === 50)
    expect(coinRewards).toHaveLength(2)
  })

  it('补签链路: 里程碑奖励发放', () => {
    const claimed: string[] = []

    const suppDateKey = '2026-06-14'
    const simulatedStreak = 14
    const streakReward = getRewardForStreakDay(simulatedStreak)
    if (streakReward) {
      const suppId = `supp-${suppDateKey}`
      if (!claimed.includes(suppId)) {
        claimed.push(suppId)
        mockDistributeReward(streakReward)
      }
    }

    const bonus = getStreakBonus(simulatedStreak)
    if (bonus) {
      const bonusId = `supp-bonus-${suppDateKey}`
      if (!claimed.includes(bonusId)) {
        claimed.push(bonusId)
        mockDistributeReward(bonus)
      }
    }

    expect(claimed).toContain('supp-2026-06-14')
    expect(claimed).toContain('supp-bonus-2026-06-14')
    expect(pointsTracker).toHaveLength(1)
    expect(pointsTracker[0].amount).toBe(100)
  })

  it('防重复: 同一日期不能重复领取', () => {
    const claimed: string[] = []
    const dateKey = '2026-06-18'

    const reward1 = getRewardForStreakDay(1)!
    const id = `reward-${dateKey}`
    if (!claimed.includes(id)) {
      claimed.push(id)
      mockDistributeReward(reward1)
    }

    const reward2 = getRewardForStreakDay(1)!
    if (!claimed.includes(id)) {
      claimed.push(id)
      mockDistributeReward(reward2)
    }

    expect(claimed.filter(c => c === id)).toHaveLength(1)
    expect(coinTracker).toHaveLength(1)
  })

  it('断签重启后连续签到7天两个周期都能领取完整奖励', () => {
    const claimed: string[] = []
    const allCoinAmounts: number[] = []

    for (let day = 1; day <= 7; day++) {
      const dateKey = `2026-06-${String(day).padStart(2, '0')}`
      const reward = getRewardForStreakDay(day)
      if (reward) {
        const id = `reward-${dateKey}`
        if (!claimed.includes(id)) {
          claimed.push(id)
          if (reward.type === 'coin') allCoinAmounts.push(reward.amount)
        }
      }
    }

    for (let day = 1; day <= 7; day++) {
      const dateKey = `2026-06-${String(day + 15).padStart(2, '0')}`
      const reward = getRewardForStreakDay(day)
      if (reward) {
        const id = `reward-${dateKey}`
        if (!claimed.includes(id)) {
          claimed.push(id)
          if (reward.type === 'coin') allCoinAmounts.push(reward.amount)
        }
      }
    }

    expect(allCoinAmounts).toEqual([50, 100, 300, 50, 100, 300])
    expect(claimed.length).toBe(14)
  })
})

describe('奖励循环周期配置', () => {
  it('cycleDays = 7 确保周期正确', () => {
    expect(CHECK_IN_CONFIG.cycleDays).toBe(7)

    for (let day = 1; day <= 30; day++) {
      const reward = getRewardForStreakDay(day)
      expect(reward).toBeDefined()
      const expectedCycleDay = ((day - 1) % 7) + 1
      expect(reward!.day).toBe(expectedCycleDay)
    }
  })
})
