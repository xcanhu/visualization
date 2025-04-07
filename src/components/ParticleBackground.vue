<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 容器引用
const container = ref<HTMLElement | null>(null)

// 画布和上下文
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

// 动画帧ID
let animationFrameId: number | null = null

// 粒子数组
let particles: Particle[] = []

// 鼠标位置
let mousePosition = { x: 0, y: 0 }

// 配置参数
const props = defineProps({
  // 粒子数量
  particleCount: {
    type: Number,
    default: 100
  },
  // 粒子颜色
  particleColor: {
    type: String,
    default: '#1890ff'
  },
  // 连线颜色
  lineColor: {
    type: String,
    default: 'rgba(24, 144, 255, 0.2)'
  },
  // 连线最大距离
  lineMaxDistance: {
    type: Number,
    default: 150
  },
  // 粒子最大尺寸
  maxSize: {
    type: Number,
    default: 3
  },
  // 粒子最小尺寸
  minSize: {
    type: Number,
    default: 1
  },
  // 粒子最大速度
  maxSpeed: {
    type: Number,
    default: 1
  },
  // 是否响应鼠标
  interactive: {
    type: Boolean,
    default: true
  },
  // 是否使用渐变色
  useGradient: {
    type: Boolean,
    default: true
  }
})

// 粒子类
class Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string

  constructor(x: number, y: number, size: number, speedX: number, speedY: number, color: string) {
    this.x = x
    this.y = y
    this.size = size
    this.speedX = speedX
    this.speedY = speedY
    this.color = color
  }

  // 更新粒子位置
  update(width: number, height: number) {
    // 边界检测
    if (this.x < 0 || this.x > width) {
      this.speedX = -this.speedX
    }
    if (this.y < 0 || this.y > height) {
      this.speedY = -this.speedY
    }

    // 更新位置
    this.x += this.speedX
    this.y += this.speedY
  }

  // 绘制粒子
  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.fill()
  }
}

// 初始化画布
const initCanvas = () => {
  if (!container.value) return

  // 创建画布
  canvas = document.createElement('canvas')
  container.value.appendChild(canvas)

  // 获取上下文
  ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置画布尺寸
  resizeCanvas()

  // 创建粒子
  createParticles()

  // 开始动画
  animate()

  // 添加事件监听
  if (props.interactive) {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
  }
}

// 调整画布大小
const resizeCanvas = () => {
  if (!canvas || !container.value) return

  canvas.width = container.value.clientWidth
  canvas.height = container.value.clientHeight
}

// 创建粒子
const createParticles = () => {
  if (!canvas) return

  particles = []

  // 创建渐变色数组
  const gradientColors = props.useGradient ? [
    '#1890ff', // 蓝色
    '#52c41a', // 绿色
    '#faad14', // 黄色
    '#f5222d', // 红色
    '#722ed1'  // 紫色
  ] : [props.particleColor]

  // 创建指定数量的粒子
  for (let i = 0; i < props.particleCount; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const size = Math.random() * (props.maxSize - props.minSize) + props.minSize
    const speedX = (Math.random() - 0.5) * props.maxSpeed * 2
    const speedY = (Math.random() - 0.5) * props.maxSpeed * 2
    const color = gradientColors[Math.floor(Math.random() * gradientColors.length)]

    particles.push(new Particle(x, y, size, speedX, speedY, color))
  }
}

// 处理鼠标移动
const handleMouseMove = (event: MouseEvent) => {
  if (!container.value) return

  const rect = container.value.getBoundingClientRect()
  mousePosition.x = event.clientX - rect.left
  mousePosition.y = event.clientY - rect.top
}

// 处理触摸移动
const handleTouchMove = (event: TouchEvent) => {
  if (!container.value || !event.touches[0]) return

  const rect = container.value.getBoundingClientRect()
  mousePosition.x = event.touches[0].clientX - rect.left
  mousePosition.y = event.touches[0].clientY - rect.top
}

// 绘制粒子之间的连线
const drawLines = () => {
  if (!ctx || !canvas) return

  // 遍历所有粒子对
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 如果距离小于最大连线距离，则绘制连线
      if (distance < props.lineMaxDistance) {
        // 根据距离计算透明度
        const opacity = 1 - (distance / props.lineMaxDistance)
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.strokeStyle = props.lineColor.replace('rgba(', '').replace(')', `,${opacity})`)
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }

    // 如果开启了交互，绘制粒子与鼠标之间的连线
    if (props.interactive) {
      const dx = particles[i].x - mousePosition.x
      const dy = particles[i].y - mousePosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < props.lineMaxDistance * 1.5) {
        const opacity = 1 - (distance / (props.lineMaxDistance * 1.5))
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(mousePosition.x, mousePosition.y)
        ctx.strokeStyle = props.lineColor.replace('rgba(', '').replace(')', `,${opacity})`)
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
    }
  }
}

// 动画循环
const animate = () => {
  if (!ctx || !canvas) return

  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 更新并绘制所有粒子
  particles.forEach(particle => {
    particle.update(canvas!.width, canvas!.height)
    particle.draw(ctx!)
  })

  // 绘制连线
  drawLines()

  // 继续下一帧
  animationFrameId = requestAnimationFrame(animate)
}

// 处理窗口大小变化
const handleResize = () => {
  resizeCanvas()
  createParticles()
}

// 组件挂载时初始化
onMounted(() => {
  initCanvas()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理资源
onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }

  if (canvas && container.value) {
    container.value.removeChild(canvas)
  }

  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('touchmove', handleTouchMove)
})
</script>

<template>
  <div ref="container" class="particle-container"></div>
</template>

<style scoped>
.particle-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style>