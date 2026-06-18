import { reactive, watch } from 'vue'
import type {
  RankingState,
  RankingEntry,
  ChallengeRecord,
  ChallengeResult,
  ChallengeReward,
  FriendProfile
} from './types'
import {
  MY_PLAYER_ID,
  CHALLENGE_EXPIRE_MS,
  MOCK_FRIENDS,
  MOCK_GLOBAL_PLAYERS,
  generateFriendRanking,
  generateGlobalRanking,
  getChallengeReward,
  canChallengeFriend
} from './rankingData'
import { addResource } from './campStore'
import { addPoints } from './battlePassStore'

const STORAGE_KEY = 'forest-runner-ranking'

function createInitialState(): RankingState {
  return {
    myRating: 0,
    myRank: 0,
    friends: [...MOCK_FRIENDS],
    friendRanking: [],
    globalRanking: [],
    outgoingChallenges: [],
    incomingChallenges: [],
    challengeHistory: [],
    lastChallengeResult: null,
    lastScoreUpload: 0,
    pendingRewardChallengeIds: []
  }
}

function loadState(): RankingState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<RankingState>
      const initial = createInitialState()
      return {
        myRating: parsed.myRating ?? initial.myRating,
        myRank: parsed.myRank ?? initial.myRank,
        friends: parsed.friends && parsed.friends.length > 0 ? parsed.friends : initial.friends,
        friendRanking: [],
        globalRanking: [],
        outgoingChallenges: parsed.outgoingChallenges ?? initial.outgoingChallenges,
        incomingChallenges: parsed.incomingChallenges ?? initial.incomingChallenges,
        challengeHistory: parsed.challengeHistory ?? initial.challengeHistory,
        lastChallengeResult: parsed.lastChallengeResult ?? initial.lastChallengeResult,
        lastScoreUpload: parsed.lastScoreUpload ?? initial.lastScoreUpload,
        pendingRewardChallengeIds: parsed.pendingRewardChallengeIds ?? initial.pendingRewardChallengeIds
      }
    }
  } catch {}
  return createInitialState()
}

export const rankingState = reactive<RankingState>(loadState())

watch(rankingState, (newState) => {
  try {
    const toSave = { ...newState }
    delete (toSave as any).friendRanking
    delete (toSave as any).globalRanking
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {}
}, { deep: true })

function getHighScore(): number {
  try {
    return parseInt(localStorage.getItem('forest-runner-highscore') || '0', 10)
  } catch {
    return 0
  }
}

function getMyLevel(): number {
  return Math.floor(rankingState.myRating / 100) + 1
}

export function refreshRankings(): void {
  const myScore = getHighScore()
  const myLevel = getMyLevel()
  rankingState.friendRanking = generateFriendRanking(rankingState.friends, myScore, myLevel)
  rankingState.globalRanking = generateGlobalRanking(MOCK_GLOBAL_PLAYERS, myScore, myLevel)

  const myEntry = rankingState.friendRanking.find(e => e.isSelf)
  if (myEntry) {
    rankingState.myRank = myEntry.rank
  }

  expireChallenges()
}

export function uploadScore(score: number): void {
  if (score > getHighScore()) {
    localStorage.setItem('forest-runner-highscore', String(score))
  }
  rankingState.myRating = Math.max(rankingState.myRating, Math.floor(score * 0.3))
  rankingState.lastScoreUpload = Date.now()
  refreshRankings()
}

export function sendChallenge(targetId: string): ChallengeRecord | null {
  const friend = rankingState.friends.find(f => f.id === targetId)
  if (!friend) return null

  const check = canChallengeFriend(
    rankingState.lastScoreUpload,
    targetId,
    rankingState.outgoingChallenges
  )
  if (!check.canChallenge) return null

  const challenge: ChallengeRecord = {
    id: `challenge-${Date.now()}-${targetId}`,
    challengerId: MY_PLAYER_ID,
    challengerName: '我',
    challengerAvatar: '🧑',
    challengerScore: getHighScore(),
    targetId,
    targetName: friend.name,
    targetAvatar: friend.avatar,
    targetScore: friend.highScore,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + CHALLENGE_EXPIRE_MS,
    completedAt: null,
    winnerId: null
  }

  rankingState.outgoingChallenges.push(challenge)
  simulateFriendResponse(challenge.id)
  return challenge
}

function simulateFriendResponse(challengeId: string): void {
  setTimeout(() => {
    const challenge = rankingState.outgoingChallenges.find(c => c.id === challengeId)
    if (!challenge || challenge.status !== 'pending') return

    const accepted = Math.random() > 0.25
    if (accepted) {
      challenge.status = 'accepted'
      rankingState.incomingChallenges = rankingState.incomingChallenges.filter(c => c.id !== challengeId)

      setTimeout(() => {
        resolveChallenge(challengeId)
      }, 2000)
    } else {
      challenge.status = 'declined'
      rankingState.challengeHistory.unshift({ ...challenge })
      rankingState.outgoingChallenges = rankingState.outgoingChallenges.filter(c => c.id !== challengeId)
    }
  }, 1500 + Math.random() * 2000)
}

function resolveChallenge(challengeId: string): void {
  const challenge = rankingState.outgoingChallenges.find(c => c.id === challengeId)
  if (!challenge || challenge.status !== 'accepted') return

  challenge.status = 'in_progress'

  setTimeout(() => {
    const myScore = getHighScore()
    const myRunScore = Math.floor(myScore * (0.7 + Math.random() * 0.6))
    const friendRunScore = Math.floor(challenge.targetScore * (0.7 + Math.random() * 0.6))

    const won = myRunScore >= friendRunScore
    const ratingDiff = Math.abs(challenge.challengerScore - challenge.targetScore)
    const rewards = getChallengeReward(ratingDiff, won)

    challenge.challengerScore = myRunScore
    challenge.targetScore = friendRunScore
    challenge.status = 'completed'
    challenge.completedAt = Date.now()
    challenge.winnerId = won ? MY_PLAYER_ID : challenge.targetId

    const ratingChange = won ? Math.floor(30 + ratingDiff * 0.1) : -Math.floor(10 + ratingDiff * 0.05)
    rankingState.myRating = Math.max(0, rankingState.myRating + ratingChange)

    const result: ChallengeResult = {
      challengeId: challenge.id,
      won,
      myScore: myRunScore,
      opponentScore: friendRunScore,
      opponentName: challenge.targetName,
      opponentAvatar: challenge.targetAvatar,
      rewards,
      newRating: rankingState.myRating
    }
    rankingState.lastChallengeResult = result
    rankingState.pendingRewardChallengeIds.push(challenge.id)

    rankingState.challengeHistory.unshift({ ...challenge })
    rankingState.outgoingChallenges = rankingState.outgoingChallenges.filter(c => c.id !== challengeId)

    refreshRankings()
  }, 3000 + Math.random() * 2000)
}

export function acceptChallenge(challengeId: string): boolean {
  const challenge = rankingState.incomingChallenges.find(c => c.id === challengeId)
  if (!challenge || challenge.status !== 'pending') return false

  challenge.status = 'accepted'
  const accepted = { ...challenge }
  rankingState.outgoingChallenges.push(accepted)
  rankingState.incomingChallenges = rankingState.incomingChallenges.filter(c => c.id !== challengeId)

  resolveChallenge(challengeId)
  return true
}

export function declineChallenge(challengeId: string): boolean {
  const challenge = rankingState.incomingChallenges.find(c => c.id === challengeId)
  if (!challenge || challenge.status !== 'pending') return false

  challenge.status = 'declined'
  rankingState.challengeHistory.unshift({ ...challenge })
  rankingState.incomingChallenges = rankingState.incomingChallenges.filter(c => c.id !== challengeId)
  return true
}

export function claimChallengeReward(challengeId: string): ChallengeReward | null {
  if (!rankingState.pendingRewardChallengeIds.includes(challengeId)) return null

  const result = rankingState.lastChallengeResult
  if (!result || result.challengeId !== challengeId) return null

  addResource(result.rewards.coins)
  addPoints(result.rewards.battlePassPoints)

  rankingState.pendingRewardChallengeIds = rankingState.pendingRewardChallengeIds.filter(
    id => id !== challengeId
  )

  return result.rewards
}

export function getUnclaimedChallengeCount(): number {
  return rankingState.pendingRewardChallengeIds.length
}

export function getPendingIncomingCount(): number {
  return rankingState.incomingChallenges.filter(c => c.status === 'pending').length
}

function expireChallenges(): void {
  const now = Date.now()
  rankingState.outgoingChallenges = rankingState.outgoingChallenges.filter(c => {
    if (c.status === 'pending' && c.expiresAt < now) {
      c.status = 'expired'
      rankingState.challengeHistory.unshift({ ...c })
      return false
    }
    return true
  })
  rankingState.incomingChallenges = rankingState.incomingChallenges.filter(c => {
    if (c.status === 'pending' && c.expiresAt < now) {
      c.status = 'expired'
      rankingState.challengeHistory.unshift({ ...c })
      return false
    }
    return true
  })
}

export function getActiveChallengeForFriend(friendId: string): ChallengeRecord | null {
  return rankingState.outgoingChallenges.find(
    c => c.targetId === friendId && ['pending', 'accepted', 'in_progress'].includes(c.status)
  ) || null
}

export function clearLastChallengeResult(): void {
  rankingState.lastChallengeResult = null
}

export function addMockIncomingChallenge(): void {
  const randomFriend = rankingState.friends[Math.floor(Math.random() * rankingState.friends.length)]
  if (!randomFriend) return

  const existing = rankingState.incomingChallenges.find(c => c.challengerId === randomFriend.id)
  if (existing) return

  const challenge: ChallengeRecord = {
    id: `incoming-${Date.now()}-${randomFriend.id}`,
    challengerId: randomFriend.id,
    challengerName: randomFriend.name,
    challengerAvatar: randomFriend.avatar,
    challengerScore: randomFriend.highScore,
    targetId: MY_PLAYER_ID,
    targetName: '我',
    targetAvatar: '🧑',
    targetScore: getHighScore(),
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + CHALLENGE_EXPIRE_MS,
    completedAt: null,
    winnerId: null
  }
  rankingState.incomingChallenges.push(challenge)
}

export function getFriendById(id: string): FriendProfile | undefined {
  return rankingState.friends.find(f => f.id === id)
}

export function checkCanChallenge(targetId: string): { canChallenge: boolean; reason?: string } {
  return canChallengeFriend(
    rankingState.lastScoreUpload,
    targetId,
    rankingState.outgoingChallenges
  )
}
