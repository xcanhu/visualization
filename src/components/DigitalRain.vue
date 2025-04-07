<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 容器引用
const container = ref<HTMLElement | null>(null)

// 画布和上下文
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

// 动画帧ID
let animationFrameId: number | null = null

// 数字雨配置
const props = defineProps({
  // 字符颜色
  color: {
    type: String,
    default: '#0f0' // 经典绿色
  },
  // 字符大小
  fontSize: {
    type: Number,
    default: 14
  },
  // 下落速度
  speed: {
    type: Number,
    default: 1.5
  },
  // 密度（列数调整系数）
  density: {
    type: Number,
    default: 1.0
  },
  // 是否使用渐变效果
  useGradient: {
    type: Boolean,
    default: true
  }
})

// 数字雨列数组
let columns: number[] = []

// 字符集
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,./<>?'

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

  // 初始化列
  initColumns()

  // 开始动画
  animate()
}

// 调整画布大小
const resizeCanvas = () => {
  if (!canvas || !container.value) return

  canvas.width = container.value.clientWidth
  canvas.height = container.value.clientHeight

  // 重新初始化列
  initColumns()
}

// 初始化列
const initColumns = () => {
  if (!canvas) return

  // 计算列数
  const columnCount = Math.floor(canvas.width / props.fontSize * props.density)
  
  // 初始化每列的Y位置
  columns = []
  for (let i = 0; i < columnCount; i++) {
    // 随机初始位置，使其错落有致
    columns[i] = Math.random() * -canvas.height
  }
}

// 绘制数字雨
const drawDigitalRain = () => {
  if (!ctx || !canvas) return

  // 设置半透明黑色背景，形成拖尾效果
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 设置字体
  ctx.font = `${props.fontSize}px monospace`
  
  // 遍历所有列
  for (let i = 0; i < columns.length; i++) {
    // 随机选择一个字符
    const char = characters.charAt(Math.floor(Math.random() * characters.length))
    
    // 计算x坐标
    const x = i * props.fontSize
    
    // 计算y坐标
    const y = columns[i]
    
    // 设置渐变色
    if (props.useGradient) {
      // 创建头部亮色到尾部暗色的渐变
      const gradient = ctx.createLinearGradient(x, y - props.fontSize * 5, x, y)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
      gradient.addColorStop(0.2, props.color)
      gradient.addColorStop(1, 'rgba(0, 255, 0, 0.1)')
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = props.color
    }
    
    // 绘制字符
    ctx.fillText(char, x, y)
    
    // 更新列位置
    columns[i] += props.fontSize * props.speed * (0.5 + Math.random() * 0.5)
    
    // 如果列超出屏幕底部，重置到顶部
    if (columns[i] > canvas.height && Math.random() > 0.975) {
      columns[i] = 0
    }
  }
}

// 动画循环
const animate = () => {
  drawDigitalRain()
  animationFrameId = requestAnimationFrame(animate)
}

// 处理窗口大小变化
const handleResize = () => {
  resizeCanvas()
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
})
</script>

<template>
  <div ref="container" class="digital-rain-container"></div>
</template>

<style scoped>
.digital-rain-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
</style>