<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { CosmeticColorConfig, CosmeticPreviewConfig } from '../game/types'
import { getPreviewConfig } from '../game/cosmeticStore'

interface Props {
  previewConfig?: CosmeticPreviewConfig
  width?: number
  height?: number
  showBackground?: boolean
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 200,
  height: 280,
  showBackground: true,
  animated: true
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const animationId = ref<number>(0)
const animFrame = ref(0)
const animTimer = ref(0)

const effectiveConfig = computed(() => {
  return props.previewConfig || getPreviewConfig()
})

function drawCharacter(ctx: CanvasRenderingContext2D, width: number, height: number, colors: CosmeticColorConfig, frame: number) {
  const cx = width / 2
  const cy = height / 2 + 20
  const playerWidth = 60
  const playerHeight = 85

  ctx.clearRect(0, 0, width, height)

  if (props.showBackground) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#E0F6FF')
    gradient.addColorStop(1, '#90EE90')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    drawCloud(ctx, 40, 50, 25)
    drawCloud(ctx, 150, 35, 20)

    ctx.fillStyle = '#3CB371'
    ctx.fillRect(0, height - 40, width, 40)

    ctx.fillStyle = '#2E8B57'
    for (let i = 0; i < 8; i++) {
      const gx = i * 30 + 10
      const gy = height - 40
      ctx.beginPath()
      ctx.moveTo(gx, gy)
      ctx.lineTo(gx + 3, gy - 8)
      ctx.lineTo(gx + 6, gy)
      ctx.fill()
    }
  }

  if (effectiveConfig.value.showTrail && effectiveConfig.value.trailColor) {
    drawTrail(ctx, cx - 30, cy + 10, effectiveConfig.value.trailColor, effectiveConfig.value.particleColor)
  }

  const legOffset = Math.sin(frame * 0.5) * 10
  const bodyBob = Math.abs(Math.sin(frame * 0.25)) * 3

  const bodyColor = colors.body
  const skinTone = colors.skin
  const shoeColor = colors.shoes

  ctx.fillStyle = bodyColor
  ctx.beginPath()
  ctx.ellipse(cx, cy + 5 - bodyBob, playerWidth / 2 - 5, playerHeight / 2 - 10, 0, 0, Math.PI * 2)
  ctx.fill()

  if (effectiveConfig.value.showAccessory) {
    drawAccessory(ctx, cx, cy - bodyBob, colors)
  }

  ctx.fillStyle = skinTone
  ctx.beginPath()
  ctx.arc(cx, cy - playerHeight / 4 - bodyBob, playerWidth / 3, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(cx - 6, cy - playerHeight / 4 - 2 - bodyBob, 3.5, 0, Math.PI * 2)
  ctx.arc(cx + 6, cy - playerHeight / 4 - 2 - bodyBob, 3.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFF'
  ctx.beginPath()
  ctx.arc(cx - 5, cy - playerHeight / 4 - 3 - bodyBob, 1.5, 0, Math.PI * 2)
  ctx.arc(cx + 7, cy - playerHeight / 4 - 3 - bodyBob, 1.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy - playerHeight / 4 + 5 - bodyBob, 10, 0.1 * Math.PI, 0.9 * Math.PI)
  ctx.stroke()

  if (effectiveConfig.value.showHat) {
    drawHat(ctx, cx, cy - playerHeight / 4 - bodyBob, colors)
  }

  ctx.fillStyle = bodyColor
  ctx.fillRect(cx - 14, cy + playerHeight / 2 - 20 - bodyBob, 10, 20 + legOffset)
  ctx.fillRect(cx + 4, cy + playerHeight / 2 - 20 - bodyBob, 10, 20 - legOffset)

  ctx.fillStyle = shoeColor
  ctx.fillRect(cx - 16, cy + playerHeight / 2 - 5 - bodyBob + legOffset, 14, 6)
  ctx.fillRect(cx + 2, cy + playerHeight / 2 - 5 - bodyBob - legOffset, 14, 6)
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2)
  ctx.arc(x + size * 1.4, y, size * 0.8, 0, Math.PI * 2)
  ctx.fill()
}

function drawHat(ctx: CanvasRenderingContext2D, cx: number, cy: number, colors: CosmeticColorConfig) {
  const hatColor = colors.hat
  const accentColor = colors.accent

  ctx.fillStyle = hatColor
  ctx.beginPath()
  ctx.ellipse(cx, cy - 30, 35, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(cx - 12, cy - 50, 24, 20)

  ctx.fillStyle = accentColor
  ctx.fillRect(cx - 12, cy - 32, 24, 4)
}

function drawAccessory(ctx: CanvasRenderingContext2D, cx: number, cy: number, colors: CosmeticColorConfig) {
  ctx.fillStyle = colors.accent
  ctx.beginPath()
  ctx.moveTo(cx - 25, cy - 5)
  ctx.quadraticCurveTo(cx - 35, cy + 15, cx - 20, cy + 30)
  ctx.quadraticCurveTo(cx - 10, cy + 20, cx - 5, cy + 10)
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(cx + 25, cy - 5)
  ctx.quadraticCurveTo(cx + 35, cy + 15, cx + 20, cy + 30)
  ctx.quadraticCurveTo(cx + 10, cy + 20, cx + 5, cy + 10)
  ctx.fill()
}

function drawTrail(ctx: CanvasRenderingContext2D, startX: number, startY: number, trailColor: string, particleColor?: string) {
  const time = Date.now() / 1000

  for (let i = 0; i < 8; i++) {
    const offset = (time * 50 + i * 30) % 80
    const alpha = 1 - offset / 80
    const size = 12 - i * 0.8

    ctx.globalAlpha = alpha * 0.6
    ctx.fillStyle = trailColor
    ctx.beginPath()
    ctx.arc(startX - offset, startY + Math.sin(time * 3 + i) * 8, size, 0, Math.PI * 2)
    ctx.fill()

    if (particleColor && i % 2 === 0) {
      ctx.fillStyle = particleColor
      ctx.beginPath()
      ctx.arc(startX - offset - 5, startY + Math.sin(time * 3 + i) * 8 - 5, size * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.globalAlpha = 1
}

function animate() {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  animTimer.value++
  if (animTimer.value > 5) {
    animFrame.value++
    animTimer.value = 0
  }

  drawCharacter(ctx, props.width, props.height, effectiveConfig.value.colors, animFrame.value)
  animationId.value = requestAnimationFrame(animate)
}

function drawStatic() {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  drawCharacter(ctx, props.width, props.height, effectiveConfig.value.colors, animFrame.value)
}

watch(() => effectiveConfig.value, () => {
  if (!props.animated) {
    drawStatic()
  }
}, { deep: true })

onMounted(() => {
  if (props.animated) {
    animate()
  } else {
    drawStatic()
  }
})

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
})
</script>

<template>
  <div class="cosmetic-preview">
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      :style="{ width: width + 'px', height: height + 'px' }"
    />
  </div>
</template>

<style scoped>
.cosmetic-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  overflow: hidden;
}

canvas {
  display: block;
}
</style>
