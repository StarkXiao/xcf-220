import type { FriendProfile, RankingEntry, ChallengeReward } from './types'

export const MY_PLAYER_ID = 'player-self'

export const CHALLENGE_EXPIRE_MS = 24 * 60 * 60 * 1000

export const CHALLENGE_COOLDOWN_MS = 60 * 60 * 1000

export function getChallengeReward(ratingDiff: number, won: boolean): ChallengeReward {
  if (won) {
    const baseCoins = 100
    const bonusCoins = Math.max(0, Math.floor(ratingDiff * 0.5))
    const bpPoints = 50 + Math.max(0, Math.floor(ratingDiff * 0.2))
    return {
      coins: baseCoins + bonusCoins,
      battlePassPoints: bpPoints,
      title: ratingDiff >= 200 ? '挑战王者' : undefined
    }
  }
  return {
    coins: 20,
    battlePassPoints: 10
  }
}

export const MOCK_FRIENDS: FriendProfile[] = [
  { id: 'friend-1', name: '小狐狸', avatar: '🦊', level: 12, highScore: 8500, lastActive: Date.now() - 300000 },
  { id: 'friend-2', name: '森林精灵', avatar: '🧝', level: 18, highScore: 12300, lastActive: Date.now() - 600000 },
  { id: 'friend-3', name: '蘑菇勇士', avatar: '🍄', level: 8, highScore: 4200, lastActive: Date.now() - 1800000 },
  { id: 'friend-4', name: '星光鹿', avatar: '🦌', level: 22, highScore: 15800, lastActive: Date.now() - 3600000 },
  { id: 'friend-5', name: '花仙子', avatar: '🌸', level: 15, highScore: 9800, lastActive: Date.now() - 7200000 },
  { id: 'friend-6', name: '月影猫', avatar: '🐱', level: 10, highScore: 6700, lastActive: Date.now() - 14400000 },
  { id: 'friend-7', name: '彩虹兔', avatar: '🐰', level: 20, highScore: 13500, lastActive: Date.now() - 28800000 },
  { id: 'friend-8', name: '霜雪熊', avatar: '🐻', level: 16, highScore: 11200, lastActive: Date.now() - 43200000 }
]

export const MOCK_GLOBAL_PLAYERS: RankingEntry[] = [
  { rank: 1, playerId: 'global-1', name: '传说猎人', avatar: '🏹', score: 28500, level: 35, isSelf: false },
  { rank: 2, playerId: 'global-2', name: '暗影行者', avatar: '🌑', score: 25200, level: 32, isSelf: false },
  { rank: 3, playerId: 'global-3', name: '雷霆战士', avatar: '⚡', score: 22800, level: 30, isSelf: false },
  { rank: 4, playerId: 'global-4', name: '翡翠法师', avatar: '💎', score: 20100, level: 28, isSelf: false },
  { rank: 5, playerId: 'global-5', name: '风暴骑士', avatar: '🌪️', score: 18500, level: 27, isSelf: false },
  { rank: 6, playerId: 'global-6', name: '冰霜射手', avatar: '❄️', score: 16200, level: 25, isSelf: false },
  { rank: 7, playerId: 'global-7', name: '烈焰斗士', avatar: '🔥', score: 14800, level: 24, isSelf: false },
  { rank: 8, playerId: 'global-8', name: '大地守卫', avatar: '🏔️', score: 13000, level: 22, isSelf: false },
  { rank: 9, playerId: 'global-9', name: '海洋探险', avatar: '🌊', score: 11500, level: 20, isSelf: false },
  { rank: 10, playerId: 'global-10', name: '天空飞鹰', avatar: '🦅', score: 9900, level: 18, isSelf: false }
]

export function generateFriendRanking(
  friends: FriendProfile[],
  myScore: number,
  myLevel: number
): RankingEntry[] {
  const entries: RankingEntry[] = friends.map((f, idx) => ({
    rank: idx + 1,
    playerId: f.id,
    name: f.name,
    avatar: f.avatar,
    score: f.highScore,
    level: f.level,
    isSelf: false
  }))

  entries.push({
    rank: entries.length + 1,
    playerId: MY_PLAYER_ID,
    name: '我',
    avatar: '🧑',
    score: myScore,
    level: myLevel,
    isSelf: true
  })

  entries.sort((a, b) => b.score - a.score)
  entries.forEach((e, i) => {
    e.rank = i + 1
  })

  return entries
}

export function generateGlobalRanking(
  baseEntries: RankingEntry[],
  myScore: number,
  myLevel: number
): RankingEntry[] {
  const entries = baseEntries.map(e => ({ ...e }))

  entries.push({
    rank: entries.length + 1,
    playerId: MY_PLAYER_ID,
    name: '我',
    avatar: '🧑',
    score: myScore,
    level: myLevel,
    isSelf: true
  })

  entries.sort((a, b) => b.score - a.score)
  entries.forEach((e, i) => {
    e.rank = i + 1
  })

  return entries
}

export function getRankTitle(rank: number): string {
  if (rank === 1) return '👑 冠军'
  if (rank === 2) return '🥈 亚军'
  if (rank === 3) return '🥉 季军'
  if (rank <= 10) return '🏅 精英'
  if (rank <= 50) return '⚔️ 勇士'
  return '🌱 新秀'
}

export function getRatingTier(rating: number): { name: string; color: string; icon: string } {
  if (rating >= 3000) return { name: '传说', color: '#FF6B00', icon: '🏆' }
  if (rating >= 2000) return { name: '大师', color: '#9C27B0', icon: '💎' }
  if (rating >= 1200) return { name: '精英', color: '#2196F3', icon: '⚔️' }
  if (rating >= 600) return { name: '勇者', color: '#4CAF50', icon: '🛡️' }
  return { name: '新秀', color: '#8BC34A', icon: '🌱' }
}

export function canChallengeFriend(
  lastChallengeTime: number | null,
  friendId: string,
  outgoingChallenges: { targetId: string; status: string }[]
): { canChallenge: boolean; reason?: string } {
  const existing = outgoingChallenges.find(
    c => c.targetId === friendId && (c.status === 'pending' || c.status === 'accepted' || c.status === 'in_progress')
  )
  if (existing) {
    return { canChallenge: false, reason: '已有进行中的挑战' }
  }

  if (lastChallengeTime && Date.now() - lastChallengeTime < CHALLENGE_COOLDOWN_MS) {
    const remaining = Math.ceil((CHALLENGE_COOLDOWN_MS - (Date.now() - lastChallengeTime)) / 60000)
    return { canChallenge: false, reason: `冷却中，还需${remaining}分钟` }
  }

  return { canChallenge: true }
}
