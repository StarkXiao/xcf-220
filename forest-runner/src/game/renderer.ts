import type { Player, Obstacle, Collectible, Cloud, Particle, ResourceType, ThemeConfig, FollowPet, Pet } from './types'

const COLORS = {
  skyTop: '#87CEEB',
  skyBottom: '#E0F6FF',
  ground: '#90EE90',
  groundDark: '#3CB371',
  sun: '#FFD700',
  player: '#FF6B6B',
  playerAccent: '#FFE66D',
  tree: '#228B22',
  treeTrunk: '#8B4513',
  rock: '#808080',
  rockLight: '#A0A0A0',
  mushroom: '#FF4444',
  mushroomSpots: '#FFFFFF',
  log: '#DEB887',
  coin: '#FFD700',
  star: '#FFFF00',
  potion: '#9932CC',
  cloud: '#FFFFFF',
  wood: '#8B4513',
  stone: '#708090',
  herb: '#32CD32',
  crystal: '#00CED1',
  berry: '#8B008B'
}

export class GameRenderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private groundY: number

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.groundY = height * 0.75
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.groundY = height * 0.75
  }

  clear(theme?: ThemeConfig | null): void {
    const skyTop = theme?.skyGradient[0] || COLORS.skyTop
    const skyBottom = theme?.skyGradient[1] || COLORS.skyBottom
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, skyTop)
    gradient.addColorStop(1, skyBottom)
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawSun(color?: string | null): void {
    const sunX = this.width * 0.85
    const sunY = this.height * 0.15
    const sunRadius = 40
    const sunColor = color || COLORS.sun

    const glow = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2)
    glow.addColorStop(0, sunColor + 'CC')
    glow.addColorStop(1, sunColor + '00')
    this.ctx.fillStyle = glow
    this.ctx.beginPath()
    this.ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = sunColor
    this.ctx.beginPath()
    this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2)
    this.ctx.fill()
  }

  drawClouds(clouds: Cloud[], color?: string | null): void {
    this.ctx.fillStyle = color || COLORS.cloud
    clouds.forEach(cloud => {
      this.drawCloud(cloud.x, cloud.y, cloud.size)
    })
  }

  private drawCloud(x: number, y: number, size: number): void {
    this.ctx.beginPath()
    this.ctx.arc(x, y, size, 0, Math.PI * 2)
    this.ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2)
    this.ctx.arc(x + size * 1.4, y, size * 0.8, 0, Math.PI * 2)
    this.ctx.arc(x + size * 0.6, y + size * 0.3, size * 0.6, 0, Math.PI * 2)
    this.ctx.fill()
  }

  drawMountains(offset: number, color?: string | null): void {
    this.ctx.fillStyle = color || '#98D8AA'
    this.ctx.beginPath()
    this.ctx.moveTo(0, this.groundY)
    
    const mountainWidth = 300
    const numMountains = Math.ceil(this.width / mountainWidth) + 2
    
    for (let i = 0; i < numMountains; i++) {
      const x = (i * mountainWidth - offset * 0.3) % (this.width + mountainWidth) - mountainWidth
      const peakHeight = 80 + Math.sin(i * 1.5) * 30
      
      this.ctx.lineTo(x + mountainWidth / 2, this.groundY - peakHeight)
      this.ctx.lineTo(x + mountainWidth, this.groundY)
    }
    
    this.ctx.lineTo(this.width, this.groundY)
    this.ctx.closePath()
    this.ctx.fill()
  }

  drawBackgroundTrees(
    offset: number,
    themeColors?: { treeColor: string; trunkColor: string } | null
  ): void {
    const treeSpacing = 150
    const numTrees = Math.ceil(this.width / treeSpacing) + 2

    for (let i = 0; i < numTrees; i++) {
      const x = (i * treeSpacing - offset * 0.5) % (this.width + treeSpacing) - treeSpacing
      const height = 60 + Math.sin(i * 2.3) * 20
      this.drawBackgroundTree(x, this.groundY - 20, height, themeColors)
    }
  }

  private drawBackgroundTree(
    x: number,
    y: number,
    height: number,
    themeColors?: { treeColor: string; trunkColor: string } | null
  ): void {
    const width = height * 0.4
    const treeColor = themeColors?.treeColor || '#6B8E23'
    const trunkColor = themeColors?.trunkColor || '#8B7355'
    
    this.ctx.fillStyle = treeColor
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(x + width / 2, y - height)
    this.ctx.lineTo(x + width, y)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.fillStyle = trunkColor
    const trunkWidth = width * 0.15
    const trunkHeight = height * 0.2
    this.ctx.fillRect(x + width / 2 - trunkWidth / 2, y - trunkHeight, trunkWidth, trunkHeight)
  }

  drawGround(
    offset: number,
    themeColors?: { groundLight: string; groundDark: string } | null
  ): void {
    const groundLight = themeColors?.groundLight || COLORS.ground
    const groundDark = themeColors?.groundDark || COLORS.groundDark
    const gradient = this.ctx.createLinearGradient(0, this.groundY, 0, this.height)
    gradient.addColorStop(0, groundLight)
    gradient.addColorStop(1, groundDark)
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY)

    this.ctx.fillStyle = groundDark
    const grassSpacing = 30
    for (let i = 0; i < Math.ceil(this.width / grassSpacing) + 2; i++) {
      const x = (i * grassSpacing - offset) % (this.width + grassSpacing) - grassSpacing
      this.drawGrass(x, this.groundY)
    }
  }

  private drawGrass(x: number, y: number): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(x + 3, y - 8)
    this.ctx.lineTo(x + 6, y)
    this.ctx.fill()
  }

  drawPlayer(player: Player): void {
    const { x, y, width, height, animFrame, isInvincible } = player

    if (isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      this.ctx.globalAlpha = 0.5
    }

    const bodyColor = COLORS.player
    const accentColor = COLORS.playerAccent

    const cx = x + width / 2
    const cy = y + height / 2

    this.ctx.fillStyle = bodyColor
    this.ctx.beginPath()
    this.ctx.ellipse(cx, cy + 5, width / 2 - 5, height / 2 - 10, 0, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#FFE4C4'
    this.ctx.beginPath()
    this.ctx.arc(cx, cy - height / 4, width / 3, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#333'
    this.ctx.beginPath()
    this.ctx.arc(cx - 6, cy - height / 4 - 2, 3, 0, Math.PI * 2)
    this.ctx.arc(cx + 6, cy - height / 4 - 2, 3, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#FFF'
    this.ctx.beginPath()
    this.ctx.arc(cx - 5, cy - height / 4 - 3, 1.5, 0, Math.PI * 2)
    this.ctx.arc(cx + 7, cy - height / 4 - 3, 1.5, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.strokeStyle = '#333'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(cx, cy - height / 4 + 5, 8, 0.1 * Math.PI, 0.9 * Math.PI)
    this.ctx.stroke()

    this.ctx.fillStyle = accentColor
    this.ctx.beginPath()
    this.ctx.ellipse(cx, cy - height / 2 - 5, width / 3, 10, 0, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.fillRect(cx - 8, cy - height / 2 - 20, 16, 15)

    const legOffset = Math.sin(animFrame * 0.5) * 8
    this.ctx.fillStyle = bodyColor
    this.ctx.fillRect(cx - 12, y + height - 15, 8, 15 + (player.isJumping ? -5 : legOffset))
    this.ctx.fillRect(cx + 4, y + height - 15, 8, 15 + (player.isJumping ? -5 : -legOffset))

    this.ctx.fillStyle = '#8B4513'
    this.ctx.fillRect(cx - 14, y + height - 5 + (player.isJumping ? -5 : legOffset), 12, 5)
    this.ctx.fillRect(cx + 2, y + height - 5 + (player.isJumping ? -5 : -legOffset), 12, 5)

    this.ctx.globalAlpha = 1
  }

  drawObstacles(
    obstacles: Obstacle[],
    themeColors?: { treeColor: string; trunkColor: string } | null
  ): void {
    obstacles.forEach(obs => {
      if (!obs.active) return
      switch (obs.type) {
        case 'tree':
          this.drawTree(obs, themeColors)
          break
        case 'rock':
          this.drawRock(obs)
          break
        case 'mushroom':
          this.drawMushroom(obs)
          break
        case 'log':
          this.drawLog(obs)
          break
      }
    })
  }

  private drawTree(
    obs: Obstacle,
    themeColors?: { treeColor: string; trunkColor: string } | null
  ): void {
    const { x, y, width, height } = obs
    const treeColor = themeColors?.treeColor || COLORS.tree
    const trunkColor = themeColors?.trunkColor || COLORS.treeTrunk

    this.ctx.fillStyle = trunkColor
    const trunkWidth = width * 0.25
    this.ctx.fillRect(x + width / 2 - trunkWidth / 2, y + height * 0.5, trunkWidth, height * 0.5)

    this.ctx.fillStyle = treeColor
    this.ctx.beginPath()
    this.ctx.moveTo(x + width / 2, y)
    this.ctx.lineTo(x + width, y + height * 0.6)
    this.ctx.lineTo(x, y + height * 0.6)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.fillStyle = this.adjustColor(treeColor, -15)
    this.ctx.beginPath()
    this.ctx.moveTo(x + width / 2, y + height * 0.15)
    this.ctx.lineTo(x + width * 0.85, y + height * 0.5)
    this.ctx.lineTo(x + width * 0.15, y + height * 0.5)
    this.ctx.closePath()
    this.ctx.fill()
  }

  private adjustColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) + amt))
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  }

  private drawRock(obs: Obstacle): void {
    const { x, y, width, height } = obs
    const cx = x + width / 2
    const cy = y + height / 2

    this.ctx.fillStyle = COLORS.rock
    this.ctx.beginPath()
    this.ctx.moveTo(x, y + height)
    this.ctx.quadraticCurveTo(x, y + height * 0.2, cx, y + height * 0.1)
    this.ctx.quadraticCurveTo(x + width, y + height * 0.2, x + width, y + height)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.fillStyle = COLORS.rockLight
    this.ctx.beginPath()
    this.ctx.ellipse(cx - width * 0.15, cy - height * 0.1, width * 0.2, height * 0.15, -0.3, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private drawMushroom(obs: Obstacle): void {
    const { x, y, width, height } = obs
    const cx = x + width / 2

    this.ctx.fillStyle = '#FFF8DC'
    const stemWidth = width * 0.3
    const stemHeight = height * 0.5
    this.ctx.fillRect(cx - stemWidth / 2, y + height - stemHeight, stemWidth, stemHeight)

    this.ctx.fillStyle = COLORS.mushroom
    this.ctx.beginPath()
    this.ctx.ellipse(cx, y + height * 0.4, width / 2, height * 0.4, 0, Math.PI, 0)
    this.ctx.fill()

    this.ctx.fillStyle = COLORS.mushroomSpots
    this.ctx.beginPath()
    this.ctx.arc(cx - width * 0.2, y + height * 0.25, 4, 0, Math.PI * 2)
    this.ctx.arc(cx + width * 0.15, y + height * 0.2, 5, 0, Math.PI * 2)
    this.ctx.arc(cx + width * 0.1, y + height * 0.35, 3, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private drawLog(obs: Obstacle): void {
    const { x, y, width, height } = obs

    this.ctx.fillStyle = COLORS.log
    this.ctx.beginPath()
    this.ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#D2691E'
    this.ctx.beginPath()
    this.ctx.ellipse(x + 5, y + height / 2, 8, height / 2 - 3, 0, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath()
      this.ctx.ellipse(x + 5, y + height / 2, 3 + i * 2, (height / 2 - 3) * (0.3 + i * 0.25), 0, 0, Math.PI * 2)
      this.ctx.stroke()
    }
  }

  drawCollectibles(collectibles: Collectible[]): void {
    collectibles.forEach(col => {
      if (!col.active || col.collected) return
      switch (col.type) {
        case 'coin':
          this.drawCoin(col)
          break
        case 'star':
          this.drawStar(col)
          break
        case 'potion':
          this.drawPotion(col)
          break
        case 'wood':
        case 'stone':
        case 'herb':
        case 'crystal':
        case 'berry':
          this.drawResource(col)
          break
      }
    })
  }

  private drawCoin(col: Collectible): void {
    const { x, y, width, height } = col
    const cx = x + width / 2
    const cy = y + height / 2
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.1

    const glow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.8)
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.4)')
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)')
    this.ctx.fillStyle = glow
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, width * 0.8 * pulse, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = COLORS.coin
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, width / 2 * pulse, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#FFA500'
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, width / 3 * pulse, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = `bold ${width * 0.4}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('$', cx, cy)
  }

  private drawStar(col: Collectible): void {
    const { x, y, width, height } = col
    const cx = x + width / 2
    const cy = y + height / 2
    const rotation = Date.now() * 0.002
    const spikes = 5
    const outerRadius = width / 2
    const innerRadius = width / 4

    const glow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.8)
    glow.addColorStop(0, 'rgba(255, 255, 0, 0.5)')
    glow.addColorStop(1, 'rgba(255, 255, 0, 0)')
    this.ctx.fillStyle = glow
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, width * 0.8, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = COLORS.star
    this.ctx.beginPath()
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (i * Math.PI) / spikes - Math.PI / 2 + rotation
      const px = cx + Math.cos(angle) * radius
      const py = cy + Math.sin(angle) * radius
      if (i === 0) {
        this.ctx.moveTo(px, py)
      } else {
        this.ctx.lineTo(px, py)
      }
    }
    this.ctx.closePath()
    this.ctx.fill()
  }

  private drawPotion(col: Collectible): void {
    const { x, y, width, height } = col
    const cx = x + width / 2
    const bubbleOffset = Math.sin(Date.now() * 0.003) * 3

    this.ctx.fillStyle = '#8B4513'
    this.ctx.fillRect(cx - width * 0.15, y, width * 0.3, height * 0.15)

    this.ctx.fillStyle = '#DEB887'
    this.ctx.fillRect(cx - width * 0.2, y + height * 0.12, width * 0.4, height * 0.08)

    this.ctx.fillStyle = 'rgba(153, 50, 204, 0.8)'
    this.ctx.beginPath()
    this.ctx.moveTo(cx - width * 0.25, y + height * 0.2)
    this.ctx.quadraticCurveTo(cx - width * 0.4, y + height * 0.5, cx - width * 0.3, y + height * 0.85)
    this.ctx.quadraticCurveTo(cx, y + height, cx + width * 0.3, y + height * 0.85)
    this.ctx.quadraticCurveTo(cx + width * 0.4, y + height * 0.5, cx + width * 0.25, y + height * 0.2)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    this.ctx.beginPath()
    this.ctx.arc(cx - width * 0.1, y + height * 0.4 + bubbleOffset, 4, 0, Math.PI * 2)
    this.ctx.arc(cx + width * 0.1, y + height * 0.6 + bubbleOffset, 3, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private drawResource(col: Collectible): void {
    const { x, y, width, height, type } = col
    const cx = x + width / 2
    const cy = y + height / 2
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.08
    const resourceType = type as ResourceType
    const color = COLORS[resourceType] || '#888'

    const glow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.8)
    glow.addColorStop(0, color + '66')
    glow.addColorStop(1, color + '00')
    this.ctx.fillStyle = glow
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, width * 0.7 * pulse, 0, Math.PI * 2)
    this.ctx.fill()

    switch (resourceType) {
      case 'wood':
        this.ctx.fillStyle = color
        this.ctx.fillRect(cx - width * 0.4, cy - height * 0.15, width * 0.8, height * 0.3)
        this.ctx.fillStyle = '#D2691E'
        this.ctx.beginPath()
        this.ctx.ellipse(cx - width * 0.4, cy, width * 0.1, height * 0.15, 0, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.beginPath()
        this.ctx.ellipse(cx + width * 0.4, cy, width * 0.1, height * 0.15, 0, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.strokeStyle = '#654321'
        this.ctx.lineWidth = 1
        for (let i = 0; i < 3; i++) {
          this.ctx.beginPath()
          this.ctx.ellipse(cx - width * 0.4, cy, 3 + i * 3, (height * 0.15 - 3) * (0.3 + i * 0.25), 0, 0, Math.PI * 2)
          this.ctx.stroke()
        }
        break

      case 'stone':
        this.ctx.fillStyle = color
        this.ctx.beginPath()
        this.ctx.moveTo(cx - width * 0.4, cy + height * 0.35)
        this.ctx.quadraticCurveTo(cx - width * 0.45, cy - height * 0.2, cx, cy - height * 0.4)
        this.ctx.quadraticCurveTo(cx + width * 0.45, cy - height * 0.25, cx + width * 0.4, cy + height * 0.35)
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.fillStyle = '#A9A9A9'
        this.ctx.beginPath()
        this.ctx.ellipse(cx - width * 0.1, cy - height * 0.05, width * 0.15, height * 0.1, -0.3, 0, Math.PI * 2)
        this.ctx.fill()
        break

      case 'herb':
        this.ctx.fillStyle = color
        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2) / 3 - Math.PI / 2
          const lx = cx + Math.cos(angle) * width * 0.25
          const ly = cy + Math.sin(angle) * height * 0.25
          this.ctx.beginPath()
          this.ctx.ellipse(lx, ly, width * 0.15, height * 0.25, angle, 0, Math.PI * 2)
          this.ctx.fill()
        }
        this.ctx.fillStyle = '#228B22'
        this.ctx.beginPath()
        this.ctx.arc(cx, cy, width * 0.1, 0, Math.PI * 2)
        this.ctx.fill()
        break

      case 'crystal':
        this.ctx.fillStyle = color
        this.ctx.beginPath()
        this.ctx.moveTo(cx, cy - height * 0.4)
        this.ctx.lineTo(cx + width * 0.3, cy - height * 0.1)
        this.ctx.lineTo(cx + width * 0.2, cy + height * 0.4)
        this.ctx.lineTo(cx - width * 0.2, cy + height * 0.4)
        this.ctx.lineTo(cx - width * 0.3, cy - height * 0.1)
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        this.ctx.beginPath()
        this.ctx.moveTo(cx - width * 0.1, cy - height * 0.25)
        this.ctx.lineTo(cx, cy - height * 0.3)
        this.ctx.lineTo(cx + width * 0.05, cy - height * 0.1)
        this.ctx.lineTo(cx - width * 0.15, cy - height * 0.05)
        this.ctx.closePath()
        this.ctx.fill()
        break

      case 'berry':
        for (let i = 0; i < 3; i++) {
          const bx = cx + (i - 1) * width * 0.25
          const by = cy + (i === 1 ? -height * 0.1 : height * 0.05)
          this.ctx.fillStyle = color
          this.ctx.beginPath()
          this.ctx.arc(bx, by, width * 0.18, 0, Math.PI * 2)
          this.ctx.fill()
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
          this.ctx.beginPath()
          this.ctx.arc(bx - width * 0.05, by - width * 0.05, width * 0.06, 0, Math.PI * 2)
          this.ctx.fill()
        }
        this.ctx.fillStyle = '#228B22'
        this.ctx.beginPath()
        this.ctx.ellipse(cx, cy - height * 0.28, width * 0.15, height * 0.08, 0, 0, Math.PI * 2)
        this.ctx.fill()
        break
    }
  }

  drawFollowPet(pet: FollowPet, petInfo: Pet | null): void {
    if (!petInfo) return

    const { x, y, width, height, floatOffset, animFrame } = pet
    const cx = x + width / 2
    const cy = y + height / 2 + floatOffset
    const bounce = Math.sin(animFrame * 0.5) * 2

    const glow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 1.2)
    glow.addColorStop(0, petInfo.color + '44')
    glow.addColorStop(1, petInfo.color + '00')
    this.ctx.fillStyle = glow
    this.ctx.beginPath()
    this.ctx.arc(cx, cy, width * 1.2, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = petInfo.color
    this.ctx.beginPath()
    this.ctx.ellipse(cx, cy + 5 + bounce, width / 2 - 3, height / 2 - 5, 0, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = petInfo.color
    this.ctx.beginPath()
    this.ctx.arc(cx, cy - height / 4 + bounce, width / 2.5, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = petInfo.secondaryColor
    this.ctx.beginPath()
    this.ctx.ellipse(cx, cy + 8 + bounce, width / 3, height / 4, 0, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#333'
    this.ctx.beginPath()
    this.ctx.arc(cx - 6, cy - height / 4 - 2 + bounce, 3, 0, Math.PI * 2)
    this.ctx.arc(cx + 6, cy - height / 4 - 2 + bounce, 3, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#FFF'
    this.ctx.beginPath()
    this.ctx.arc(cx - 5, cy - height / 4 - 3 + bounce, 1.5, 0, Math.PI * 2)
    this.ctx.arc(cx + 7, cy - height / 4 - 3 + bounce, 1.5, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#333'
    this.ctx.beginPath()
    this.ctx.ellipse(cx, cy - height / 4 + 4 + bounce, 3, 2, 0, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = petInfo.color
    this.ctx.beginPath()
    this.ctx.moveTo(cx - width / 3, cy - height / 3 + bounce)
    this.ctx.lineTo(cx - width / 4, cy - height / 2 - 5 + bounce)
    this.ctx.lineTo(cx - width / 6, cy - height / 3 + bounce)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.beginPath()
    this.ctx.moveTo(cx + width / 3, cy - height / 3 + bounce)
    this.ctx.lineTo(cx + width / 4, cy - height / 2 - 5 + bounce)
    this.ctx.lineTo(cx + width / 6, cy - height / 3 + bounce)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.fillStyle = petInfo.secondaryColor
    this.ctx.beginPath()
    this.ctx.moveTo(cx - width / 4, cy - height / 3 + bounce)
    this.ctx.lineTo(cx - width / 5, cy - height / 2.5 + bounce)
    this.ctx.lineTo(cx - width / 7, cy - height / 3 + bounce)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.beginPath()
    this.ctx.moveTo(cx + width / 4, cy - height / 3 + bounce)
    this.ctx.lineTo(cx + width / 5, cy - height / 2.5 + bounce)
    this.ctx.lineTo(cx + width / 7, cy - height / 3 + bounce)
    this.ctx.closePath()
    this.ctx.fill()
  }

  drawParticles(particles: Particle[]): void {
    particles.forEach(p => {
      this.ctx.globalAlpha = p.life / p.maxLife
      this.ctx.fillStyle = p.color
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      this.ctx.fill()
    })
    this.ctx.globalAlpha = 1
  }

  drawUI(score: number, coins: number, distance: number, targetDistance?: number): void {
    const hasTarget = targetDistance && targetDistance > 0
    const boxHeight = hasTarget ? 115 : 90

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    this.ctx.fillRect(10, 10, 150, boxHeight)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(10, 10, 150, boxHeight)

    this.ctx.fillStyle = '#FFF'
    this.ctx.font = 'bold 18px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(`分数: ${Math.floor(score)}`, 20, 20)
    this.ctx.fillText(`金币: ${coins} 💰`, 20, 48)
    this.ctx.fillText(`距离: ${Math.floor(distance)}m`, 20, 76)

    if (hasTarget) {
      const progress = Math.min(1, distance / targetDistance!)
      const barX = 20
      const barY = 104
      const barWidth = 130
      const barHeight = 10

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      this.ctx.fillRect(barX, barY, barWidth, barHeight)

      this.ctx.fillStyle = progress >= 1 ? '#4CAF50' : '#FFD700'
      this.ctx.fillRect(barX, barY, barWidth * progress, barHeight)

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(barX, barY, barWidth, barHeight)
    }
  }

  getGroundY(): number {
    return this.groundY
  }
}
