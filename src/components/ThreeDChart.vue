<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useDataStore } from '../stores'

// 获取数据存储
const dataStore = useDataStore()

// 容器引用
const container = ref<HTMLElement | null>(null)

// 场景相关变量
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let animationFrameId: number | null = null

// 图表数据
const chartData = ref<any[]>([])

// 图表类型
const chartType = ref<string>('bar3d')

// 图表配置
const props = defineProps({
  // 数据源
  data: {
    type: Array,
    default: () => []
  },
  // 图表高度
  height: {
    type: Number,
    default: 400
  },
  // 图表宽度
  width: {
    type: Number,
    default: 600
  },
  // 是否自动旋转
  autoRotate: {
    type: Boolean,
    default: true
  },
  // 颜色主题
  colorTheme: {
    type: String,
    default: 'blue' // blue, red, green, rainbow
  }
})

// 初始化3D场景
const initScene = () => {
  if (!container.value) return

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  // 创建相机
  const aspect = props.width / props.height
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
  camera.position.set(0, 0, 100)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(props.width, props.height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)

  // 添加轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = props.autoRotate

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)

  // 添加坐标轴辅助
  const axesHelper = new THREE.AxesHelper(50)
  scene.add(axesHelper)

  // 渲染图表
  renderChart()

  // 开始动画循环
  animate()
}

// 渲染3D图表
const renderChart = () => {
  if (!scene) return

  // 清除现有图表
  clearChart()

  // 根据图表类型渲染不同的3D图表
  switch (chartType.value) {
    case 'bar3d':
      renderBar3D()
      break
    case 'scatter3d':
      renderScatter3D()
      break
    case 'surface3d':
      renderSurface3D()
      break
    default:
      renderBar3D()
  }
}

// 清除图表
const clearChart = () => {
  if (!scene) return

  // 移除所有非基础元素
  const objectsToRemove = []
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && !(object instanceof THREE.AxesHelper)) {
      objectsToRemove.push(object)
    }
  })

  objectsToRemove.forEach((object) => {
    scene?.remove(object)
  })
}

// 渲染3D柱状图
const renderBar3D = () => {
  if (!scene) return

  const data = props.data.length > 0 ? props.data : generateMockData()
  const maxValue = Math.max(...data.map((item: any) => item.value))
  const spacing = 10
  const barWidth = 5

  // 创建柱状图
  data.forEach((item: any, index: number) => {
    const height = (item.value / maxValue) * 50
    const geometry = new THREE.BoxGeometry(barWidth, height, barWidth)

    // 根据主题设置颜色
    let color
    switch (props.colorTheme) {
      case 'blue':
        color = new THREE.Color(0x1890ff).lerp(new THREE.Color(0x0050b3), item.value / maxValue)
        break
      case 'red':
        color = new THREE.Color(0xff4d4f).lerp(new THREE.Color(0xa8071a), item.value / maxValue)
        break
      case 'green':
        color = new THREE.Color(0x52c41a).lerp(new THREE.Color(0x135200), item.value / maxValue)
        break
      case 'rainbow':
        color = new THREE.Color().setHSL(index / data.length, 0.7, 0.5)
        break
      default:
        color = new THREE.Color(0x1890ff)
    }

    const material = new THREE.MeshPhongMaterial({ color })
    const bar = new THREE.Mesh(geometry, material)

    // 计算位置
    const xPos = index * spacing - (data.length * spacing) / 2 + spacing / 2
    bar.position.set(xPos, height / 2, 0)

    // 添加标签
    addLabel(item.name, xPos, height + 5, 0)

    scene?.add(bar)
  })
}

// 渲染3D散点图
const renderScatter3D = () => {
  if (!scene) return

  const data = props.data.length > 0 ? props.data : generateMockData3D()
  const maxX = Math.max(...data.map((item: any) => item.x))
  const maxY = Math.max(...data.map((item: any) => item.y))
  const maxZ = Math.max(...data.map((item: any) => item.z))

  // 创建散点
  data.forEach((item: any, index: number) => {
    const normalizedSize = (item.value / Math.max(...data.map((d: any) => d.value))) * 3 + 1
    const geometry = new THREE.SphereGeometry(normalizedSize, 32, 32)

    // 根据主题设置颜色
    let color
    switch (props.colorTheme) {
      case 'rainbow':
        color = new THREE.Color().setHSL(index / data.length, 0.7, 0.5)
        break
      default:
        color = new THREE.Color(0x1890ff)
    }

    const material = new THREE.MeshPhongMaterial({ color })
    const point = new THREE.Mesh(geometry, material)

    // 计算位置
    const xPos = (item.x / maxX) * 50 - 25
    const yPos = (item.y / maxY) * 50 - 25
    const zPos = (item.z / maxZ) * 50 - 25
    point.position.set(xPos, yPos, zPos)

    scene?.add(point)
  })
}

// 渲染3D曲面图
const renderSurface3D = () => {
  if (!scene) return

  const segments = 20
  const size = 50
  const halfSize = size / 2

  // 创建曲面几何体
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
  const vertices = geometry.attributes.position.array

  // 修改顶点高度创建曲面
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i]
    const z = vertices[i + 2]
    
    // 创建波浪形曲面
    const amplitude = 10
    const frequency = 0.1
    vertices[i + 1] = amplitude * Math.sin(frequency * Math.sqrt(x * x + z * z))
  }

  // 更新几何体
  geometry.computeVertexNormals()

  // 创建材质
  const material = new THREE.MeshPhongMaterial({
    color: 0x1890ff,
    side: THREE.DoubleSide,
    flatShading: false,
    wireframe: false
  })

  // 创建网格
  const surface = new THREE.Mesh(geometry, material)
  surface.rotation.x = -Math.PI / 2
  scene?.add(surface)
}

// 添加文本标签（简化版，实际项目中可以使用CSS2DRenderer或TextGeometry）
const addLabel = (text: string, x: number, y: number, z: number) => {
  // 在实际项目中，这里可以使用CSS2DRenderer或TextGeometry来添加文本标签
  // 简化版本中，我们可以使用小立方体代表标签位置
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({ color: 0x000000 })
  const label = new THREE.Mesh(geometry, material)
  label.position.set(x, y, z)
  scene?.add(label)
}

// 生成模拟数据
const generateMockData = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    name: `项目${i + 1}`,
    value: Math.round(Math.random() * 1000)
  }))
}

// 生成3D模拟数据
const generateMockData3D = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    name: `点${i + 1}`,
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 100,
    value: Math.round(Math.random() * 100)
  }))
}

// 动画循环
const animate = () => {
  if (!renderer || !scene || !camera || !controls) return

  animationFrameId = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

// 处理窗口大小变化
const handleResize = () => {
  if (!camera || !renderer || !container.value) return

  const width = container.value.clientWidth || props.width
  const height = container.value.clientHeight || props.height

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 切换图表类型
const switchChartType = (type: string) => {
  chartType.value = type
  renderChart()
}

// 导出方法
defineExpose({
  switchChartType
})

// 监听数据变化
watch(() => props.data, () => {
  renderChart()
}, { deep: true })

// 监听主题变化
watch(() => props.colorTheme, () => {
  renderChart()
})

// 监听自动旋转设置
watch(() => props.autoRotate, (newValue) => {
  if (controls) {
    controls.autoRotate = newValue
  }
})

// 组件挂载时初始化
onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理资源
onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  
  if (renderer) {
    renderer.dispose()
    container.value?.removeChild(renderer.domElement)
  }
  
  scene = null
  camera = null
  renderer = null
  controls = null
  
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="three-chart-container">
    <div class="chart-header">
      <h3>{{ chartType === 'bar3d' ? '3D柱状图' : chartType === 'scatter3d' ? '3D散点图' : '3D曲面图' }}</h3>
      <div class="chart-controls">
        <button 
          @click="switchChartType('bar3d')"
          :class="{ active: chartType === 'bar3d' }"
        >
          3D柱状图
        </button>
        <button 
          @click="switchChartType('scatter3d')"
          :class="{ active: chartType === 'scatter3d' }"
        >
          3D散点图
        </button>
        <button 
          @click="switchChartType('surface3d')"
          :class="{ active: chartType === 'surface3d' }"
        >
          3D曲面图
        </button>
      </div>
    </div>
    <div ref="container" class="chart-container" :style="{ height: `${height}px`, width: `${width}px` }"></div>
    <div class="chart-footer">
      <p class="chart-tip">提示: 鼠标拖动可旋转视角，滚轮可缩放</p>
    </div>
  </div>
</template>

<style scoped>
.three-chart-container {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 15px;
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  color: #001529;
}

.chart-controls {
  display: flex;
  gap: 10px;
}

.chart-controls button {
  padding: 4px 8px;
  background-color: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s;
}

.chart-controls button.active {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
}

.chart-container {
  width: 100%;
  height: 400px;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.chart-footer {
  margin-top: 10px;
  text-align: center;
}

.chart-tip {
  font-size: 12px;
  color: #888;
  margin: 0;
}
</style>