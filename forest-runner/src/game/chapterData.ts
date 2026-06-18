import type { Chapter, ThemeConfig, ChapterTheme, Obstacle } from './types'

export const THEMES: Record<ChapterTheme, ThemeConfig> = {
  forest: {
    name: '翡翠森林',
    icon: '🌲',
    skyGradient: ['#87CEEB', '#E0F6FF'],
    groundColor: ['#90EE90', '#3CB371'],
    mountainColor: '#98D8AA',
    treeColor: '#228B22',
    trunkColor: '#8B4513',
    sunColor: '#FFD700',
    cloudColor: '#FFFFFF',
    obstaclePool: {
      types: ['tree', 'rock', 'mushroom', 'log'],
      weights: [35, 25, 20, 20],
      sizeRange: {
        width: [35, 80],
        height: [25, 100]
      },
      spawnRateMultiplier: 1.0
    },
    resourceWeights: {
      wood: 35,
      stone: 25,
      herb: 20,
      berry: 15,
      crystal: 5
    },
    baseSpeed: 6,
    maxSpeed: 14
  },
  desert: {
    name: '烈日沙漠',
    icon: '🏜️',
    skyGradient: ['#FFB347', '#FFE4B5'],
    groundColor: ['#F4A460', '#DEB887'],
    mountainColor: '#CD853F',
    treeColor: '#228B22',
    trunkColor: '#8B4513',
    sunColor: '#FF6347',
    cloudColor: '#FFFACD',
    obstaclePool: {
      types: ['rock', 'log', 'mushroom', 'tree'],
      weights: [40, 25, 20, 15],
      sizeRange: {
        width: [40, 85],
        height: [20, 90]
      },
      spawnRateMultiplier: 1.1
    },
    resourceWeights: {
      stone: 35,
      wood: 25,
      crystal: 20,
      herb: 12,
      berry: 8
    },
    baseSpeed: 6.5,
    maxSpeed: 15
  },
  snow: {
    name: '冰雪世界',
    icon: '❄️',
    skyGradient: ['#B0E0E6', '#E6E6FA'],
    groundColor: ['#F0FFFF', '#B0C4DE'],
    mountainColor: '#ADD8E6',
    treeColor: '#228B22',
    trunkColor: '#8B4513',
    sunColor: '#FFFACD',
    cloudColor: '#FFFFFF',
    obstaclePool: {
      types: ['rock', 'tree', 'mushroom', 'log'],
      weights: [35, 30, 20, 15],
      sizeRange: {
        width: [35, 75],
        height: [30, 110]
      },
      spawnRateMultiplier: 1.05
    },
    resourceWeights: {
      crystal: 35,
      stone: 25,
      herb: 20,
      wood: 12,
      berry: 8
    },
    baseSpeed: 5.5,
    maxSpeed: 13
  },
  volcano: {
    name: '熔岩火山',
    icon: '🌋',
    skyGradient: ['#8B0000', '#FF6347'],
    groundColor: ['#CD5C5C', '#8B0000'],
    mountainColor: '#A52A2A',
    treeColor: '#2F4F4F',
    trunkColor: '#1C1C1C',
    sunColor: '#FF4500',
    cloudColor: '#D3D3D3',
    obstaclePool: {
      types: ['rock', 'log', 'mushroom', 'tree'],
      weights: [45, 25, 20, 10],
      sizeRange: {
        width: [45, 90],
        height: [25, 95]
      },
      spawnRateMultiplier: 1.25
    },
    resourceWeights: {
      crystal: 40,
      stone: 30,
      herb: 10,
      wood: 10,
      berry: 10
    },
    baseSpeed: 7,
    maxSpeed: 16
  },
  ocean: {
    name: '深海秘境',
    icon: '🌊',
    skyGradient: ['#006994', '#40E0D0'],
    groundColor: ['#20B2AA', '#008B8B'],
    mountainColor: '#5F9EA0',
    treeColor: '#3CB371',
    trunkColor: '#8B4513',
    sunColor: '#FFD700',
    cloudColor: '#E0FFFF',
    obstaclePool: {
      types: ['log', 'rock', 'mushroom', 'tree'],
      weights: [35, 30, 20, 15],
      sizeRange: {
        width: [30, 70],
        height: [25, 85]
      },
      spawnRateMultiplier: 0.95
    },
    resourceWeights: {
      berry: 35,
      herb: 25,
      crystal: 20,
      wood: 12,
      stone: 8
    },
    baseSpeed: 5,
    maxSpeed: 12
  },
  sky: {
    name: '云端天堂',
    icon: '☁️',
    skyGradient: ['#E6E6FA', '#FFB6C1'],
    groundColor: ['#DDA0DD', '#BA55D3'],
    mountainColor: '#DDA0DD',
    treeColor: '#9370DB',
    trunkColor: '#8B4513',
    sunColor: '#FFD700',
    cloudColor: '#FFFFFF',
    obstaclePool: {
      types: ['mushroom', 'log', 'rock', 'tree'],
      weights: [35, 30, 20, 15],
      sizeRange: {
        width: [30, 65],
        height: [20, 80]
      },
      spawnRateMultiplier: 0.85
    },
    resourceWeights: {
      crystal: 45,
      herb: 25,
      berry: 15,
      wood: 10,
      stone: 5
    },
    baseSpeed: 7.5,
    maxSpeed: 17
  }
}

export const DEFAULT_OBSTACLE_SIZES: Record<Obstacle['type'], { width: [number, number]; height: [number, number] }> = {
  tree: { width: [40, 60], height: [70, 100] },
  rock: { width: [50, 70], height: [35, 50] },
  mushroom: { width: [35, 50], height: [45, 60] },
  log: { width: [60, 80], height: [25, 40] }
}

function createForestChapterAreas() {
  return [
    {
      id: 'forest-1',
      name: '森林入口',
      icon: '🌱',
      description: '冒险的起点，熟悉森林的气息',
      position: { x: 15, y: 70 },
      unlocked: true,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 200,
      requiredDistance: 300,
      rewards: { coins: 50, resources: { wood: 5, herb: 2 } },
      theme: 'forest' as ChapterTheme,
      difficulty: 1 as const,
      obstacleDensity: 0.8,
      collectibleDensity: 1.2,
      targetDistance: 500
    },
    {
      id: 'forest-2',
      name: '绿荫小径',
      icon: '🌿',
      description: '茂密的树林中隐藏着宝藏',
      position: { x: 30, y: 55 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 400,
      requiredDistance: 600,
      rewards: { coins: 80, resources: { wood: 8, stone: 4, berry: 3 } },
      theme: 'forest' as ChapterTheme,
      difficulty: 1 as const,
      obstacleDensity: 0.9,
      collectibleDensity: 1.1,
      targetDistance: 800
    },
    {
      id: 'forest-3',
      name: '古树神坛',
      icon: '🌳',
      description: '古老的大树守护着神秘力量',
      position: { x: 50, y: 40 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 800,
      requiredDistance: 1000,
      rewards: { coins: 150, resources: { wood: 15, crystal: 2, herb: 5 } },
      theme: 'forest' as ChapterTheme,
      difficulty: 2 as const,
      obstacleDensity: 1.0,
      collectibleDensity: 1.0,
      targetDistance: 1200
    },
    {
      id: 'forest-4',
      name: '迷雾深处',
      icon: '🌫️',
      description: '浓雾中的森林充满未知挑战',
      position: { x: 70, y: 55 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 1200,
      requiredDistance: 1500,
      rewards: { coins: 200, resources: { crystal: 5, herb: 8, stone: 10 } },
      theme: 'forest' as ChapterTheme,
      difficulty: 2 as const,
      obstacleDensity: 1.1,
      collectibleDensity: 1.0,
      targetDistance: 1800
    },
    {
      id: 'forest-5',
      name: '森林之心',
      icon: '💚',
      description: '森林最深处的核心区域',
      position: { x: 85, y: 35 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 2000,
      requiredDistance: 2500,
      rewards: { coins: 400, resources: { crystal: 10, wood: 20, herb: 12, berry: 10 } },
      theme: 'forest' as ChapterTheme,
      difficulty: 3 as const,
      obstacleDensity: 1.2,
      collectibleDensity: 0.9,
      targetDistance: 3000
    }
  ]
}

function createDesertChapterAreas() {
  return [
    {
      id: 'desert-1',
      name: '沙海边缘',
      icon: '🏜️',
      description: '踏入沙漠的第一步',
      position: { x: 20, y: 75 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 500,
      requiredDistance: 800,
      rewards: { coins: 100, resources: { stone: 8, wood: 4 } },
      theme: 'desert' as ChapterTheme,
      difficulty: 2 as const,
      obstacleDensity: 0.95,
      collectibleDensity: 1.0,
      targetDistance: 1000
    },
    {
      id: 'desert-2',
      name: '仙人掌谷',
      icon: '🌵',
      description: '小心尖锐的仙人掌',
      position: { x: 40, y: 60 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 900,
      requiredDistance: 1200,
      rewards: { coins: 150, resources: { stone: 12, crystal: 3 } },
      theme: 'desert' as ChapterTheme,
      difficulty: 2 as const,
      obstacleDensity: 1.05,
      collectibleDensity: 0.95,
      targetDistance: 1500
    },
    {
      id: 'desert-3',
      name: '绿洲秘境',
      icon: '🌴',
      description: '沙漠中的生命之源',
      position: { x: 60, y: 45 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 1500,
      requiredDistance: 2000,
      rewards: { coins: 250, resources: { crystal: 6, berry: 8, herb: 6 } },
      theme: 'desert' as ChapterTheme,
      difficulty: 3 as const,
      obstacleDensity: 1.15,
      collectibleDensity: 1.05,
      targetDistance: 2500
    },
    {
      id: 'desert-4',
      name: '金字塔遗迹',
      icon: '🔺',
      description: '古老文明的神秘遗迹',
      position: { x: 80, y: 55 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 2500,
      requiredDistance: 3000,
      rewards: { coins: 400, resources: { crystal: 12, stone: 20, plank: 3 } },
      theme: 'desert' as ChapterTheme,
      difficulty: 4 as const,
      obstacleDensity: 1.3,
      collectibleDensity: 0.9,
      targetDistance: 3500
    }
  ]
}

function createSnowChapterAreas() {
  return [
    {
      id: 'snow-1',
      name: '雪国边境',
      icon: '⛄',
      description: '雪花飘飘的冰雪世界入口',
      position: { x: 15, y: 70 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 700,
      requiredDistance: 1000,
      rewards: { coins: 120, resources: { crystal: 5, herb: 4 } },
      theme: 'snow' as ChapterTheme,
      difficulty: 2 as const,
      obstacleDensity: 0.9,
      collectibleDensity: 1.1,
      targetDistance: 1200
    },
    {
      id: 'snow-2',
      name: '冰封湖面',
      icon: '🧊',
      description: '光滑的冰面让挑战更加困难',
      position: { x: 35, y: 50 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 1200,
      requiredDistance: 1600,
      rewards: { coins: 180, resources: { crystal: 8, stone: 10 } },
      theme: 'snow' as ChapterTheme,
      difficulty: 3 as const,
      obstacleDensity: 1.0,
      collectibleDensity: 1.0,
      targetDistance: 2000
    },
    {
      id: 'snow-3',
      name: '雪山之巅',
      icon: '🏔️',
      description: '登上最高的雪山之巅',
      position: { x: 60, y: 35 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 2000,
      requiredDistance: 2500,
      rewards: { coins: 300, resources: { crystal: 15, magic_dust: 2, herb: 8 } },
      theme: 'snow' as ChapterTheme,
      difficulty: 4 as const,
      obstacleDensity: 1.1,
      collectibleDensity: 0.95,
      targetDistance: 3000
    },
    {
      id: 'snow-4',
      name: '极光圣地',
      icon: '🌈',
      description: '传说中能看到极光的神秘之地',
      position: { x: 85, y: 45 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 3500,
      requiredDistance: 4000,
      rewards: { coins: 500, resources: { crystal: 25, magic_dust: 5, plank: 5 } },
      theme: 'snow' as ChapterTheme,
      difficulty: 5 as const,
      obstacleDensity: 1.2,
      collectibleDensity: 0.9,
      targetDistance: 4500
    }
  ]
}

function createVolcanoChapterAreas() {
  return [
    {
      id: 'volcano-1',
      name: '火山山脚',
      icon: '🔥',
      description: '炽热的火山气息扑面而来',
      position: { x: 18, y: 72 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 1000,
      requiredDistance: 1500,
      rewards: { coins: 150, resources: { stone: 12, crystal: 4 } },
      theme: 'volcano' as ChapterTheme,
      difficulty: 3 as const,
      obstacleDensity: 1.05,
      collectibleDensity: 1.0,
      targetDistance: 1800
    },
    {
      id: 'volcano-2',
      name: '熔岩洞穴',
      icon: '🕳️',
      description: '危险的熔岩洞穴中隐藏着稀有矿石',
      position: { x: 42, y: 55 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 1800,
      requiredDistance: 2200,
      rewards: { coins: 250, resources: { crystal: 12, stone: 18, magic_dust: 2 } },
      theme: 'volcano' as ChapterTheme,
      difficulty: 4 as const,
      obstacleDensity: 1.2,
      collectibleDensity: 0.95,
      targetDistance: 2800
    },
    {
      id: 'volcano-3',
      name: '火山口',
      icon: '🌋',
      description: '直接面对喷发的火山！',
      position: { x: 70, y: 40 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 3000,
      requiredDistance: 3500,
      rewards: { coins: 400, resources: { crystal: 20, magic_dust: 5, brick: 5 } },
      theme: 'volcano' as ChapterTheme,
      difficulty: 5 as const,
      obstacleDensity: 1.35,
      collectibleDensity: 0.85,
      targetDistance: 4200
    }
  ]
}

function createOceanChapterAreas() {
  return [
    {
      id: 'ocean-1',
      name: '浅海珊瑚礁',
      icon: '🐚',
      description: '美丽的珊瑚礁，充满生机',
      position: { x: 20, y: 70 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 900,
      requiredDistance: 1200,
      rewards: { coins: 130, resources: { berry: 8, herb: 6 } },
      theme: 'ocean' as ChapterTheme,
      difficulty: 2 as const,
      obstacleDensity: 0.85,
      collectibleDensity: 1.15,
      targetDistance: 1500
    },
    {
      id: 'ocean-2',
      name: '深海沉船',
      icon: '⚓',
      description: '古老沉船中的宝藏',
      position: { x: 45, y: 50 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 1600,
      requiredDistance: 2000,
      rewards: { coins: 220, resources: { crystal: 10, berry: 12, wood: 10 } },
      theme: 'ocean' as ChapterTheme,
      difficulty: 3 as const,
      obstacleDensity: 0.95,
      collectibleDensity: 1.1,
      targetDistance: 2500
    },
    {
      id: 'ocean-3',
      name: '海底宫殿',
      icon: '🏛️',
      description: '传说中的海底文明遗迹',
      position: { x: 75, y: 40 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 2800,
      requiredDistance: 3200,
      rewards: { coins: 380, resources: { crystal: 18, magic_dust: 4, jam: 5 } },
      theme: 'ocean' as ChapterTheme,
      difficulty: 4 as const,
      obstacleDensity: 1.05,
      collectibleDensity: 1.0,
      targetDistance: 3800
    }
  ]
}

function createSkyChapterAreas() {
  return [
    {
      id: 'sky-1',
      name: '云海浮岛',
      icon: '🏝️',
      description: '漂浮在云端的神秘岛屿',
      position: { x: 22, y: 68 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 1500,
      requiredDistance: 2000,
      rewards: { coins: 200, resources: { crystal: 10, herb: 8 } },
      theme: 'sky' as ChapterTheme,
      difficulty: 3 as const,
      obstacleDensity: 0.8,
      collectibleDensity: 1.2,
      targetDistance: 2500
    },
    {
      id: 'sky-2',
      name: '彩虹天桥',
      icon: '🌈',
      description: '绚丽彩虹搭建的天桥',
      position: { x: 50, y: 45 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 2500,
      requiredDistance: 3000,
      rewards: { coins: 350, resources: { crystal: 18, magic_dust: 6, potion_herb: 3 } },
      theme: 'sky' as ChapterTheme,
      difficulty: 4 as const,
      obstacleDensity: 0.9,
      collectibleDensity: 1.1,
      targetDistance: 3800
    },
    {
      id: 'sky-3',
      name: '天界之门',
      icon: '🚪',
      description: '传说中的天界入口，终极挑战',
      position: { x: 80, y: 30 },
      unlocked: false,
      completed: false,
      stars: 0,
      maxStars: 3,
      requiredScore: 4500,
      requiredDistance: 5000,
      rewards: { coins: 800, resources: { crystal: 40, magic_dust: 15, plank: 10, brick: 10, potion_herb: 10, jam: 10 } },
      theme: 'sky' as ChapterTheme,
      difficulty: 5 as const,
      obstacleDensity: 1.0,
      collectibleDensity: 1.05,
      targetDistance: 6000
    }
  ]
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'chapter-forest',
    name: '第一章：翡翠森林',
    description: '冒险的起点，探索神秘的森林世界',
    icon: '🌲',
    order: 1,
    unlocked: true,
    completed: false,
    areas: createForestChapterAreas(),
    backgroundTheme: 'forest',
    bonusRewards: {
      coins: 500,
      resources: { plank: 10, brick: 10, potion_herb: 5 }
    }
  },
  {
    id: 'chapter-desert',
    name: '第二章：烈日沙漠',
    description: '穿越危险的沙漠，寻找绿洲',
    icon: '🏜️',
    order: 2,
    unlocked: false,
    completed: false,
    areas: createDesertChapterAreas(),
    backgroundTheme: 'desert',
    unlockedCondition: {
      previousChapterId: 'chapter-forest',
      requiredStars: 8
    },
    bonusRewards: {
      coins: 800,
      resources: { magic_dust: 8, brick: 15, jam: 8 }
    }
  },
  {
    id: 'chapter-snow',
    name: '第三章：冰雪世界',
    description: '探索寒冷的冰雪王国',
    icon: '❄️',
    order: 3,
    unlocked: false,
    completed: false,
    areas: createSnowChapterAreas(),
    backgroundTheme: 'snow',
    unlockedCondition: {
      previousChapterId: 'chapter-desert',
      requiredStars: 10
    },
    bonusRewards: {
      coins: 1000,
      resources: { magic_dust: 15, plank: 20, potion_herb: 12 }
    }
  },
  {
    id: 'chapter-volcano',
    name: '第四章：熔岩火山',
    description: '挑战炽热的火山，寻找稀有矿石',
    icon: '🌋',
    order: 4,
    unlocked: false,
    completed: false,
    areas: createVolcanoChapterAreas(),
    backgroundTheme: 'volcano',
    unlockedCondition: {
      previousChapterId: 'chapter-snow',
      requiredStars: 12
    },
    bonusRewards: {
      coins: 1500,
      resources: { magic_dust: 25, brick: 25, plank: 20 }
    }
  },
  {
    id: 'chapter-ocean',
    name: '第五章：深海秘境',
    description: '潜入神秘的深海，探索海底世界',
    icon: '🌊',
    order: 5,
    unlocked: false,
    completed: false,
    areas: createOceanChapterAreas(),
    backgroundTheme: 'ocean',
    unlockedCondition: {
      previousChapterId: 'chapter-volcano',
      requiredStars: 9
    },
    bonusRewards: {
      coins: 1800,
      resources: { magic_dust: 20, potion_herb: 20, jam: 15 }
    }
  },
  {
    id: 'chapter-sky',
    name: '终章：云端天堂',
    description: '前往云端之上，迎接最终挑战',
    icon: '☁️',
    order: 6,
    unlocked: false,
    completed: false,
    areas: createSkyChapterAreas(),
    backgroundTheme: 'sky',
    unlockedCondition: {
      previousChapterId: 'chapter-ocean',
      requiredStars: 8
    },
    bonusRewards: {
      coins: 3000,
      resources: { magic_dust: 50, plank: 30, brick: 30, potion_herb: 25, jam: 25 }
    }
  }
]

export function calculateStars(
  score: number,
  distance: number,
  area: { requiredScore: number; requiredDistance: number; maxStars: number }
): number {
  const scoreRatio = score / area.requiredScore
  const distanceRatio = distance / area.requiredDistance
  const ratio = Math.min(scoreRatio, distanceRatio)

  if (ratio >= 2.0) return area.maxStars
  if (ratio >= 1.5) return Math.max(2, area.maxStars - 1)
  if (ratio >= 1.0) return Math.max(1, area.maxStars - 2)
  return 0
}

export function selectThemedObstacleType(
  theme: ChapterTheme
): Obstacle['type'] {
  const pool = THEMES[theme].obstaclePool
  const totalWeight = pool.weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < pool.types.length; i++) {
    random -= pool.weights[i]
    if (random <= 0) return pool.types[i]
  }

  return pool.types[0]
}