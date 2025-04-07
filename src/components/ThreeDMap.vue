<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useDataStore } from '../stores'
import chinaGeoJson from '../assets/china.json'
import worldGeoJson from '../assets/world.json'

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
let raycaster: THREE.Raycaster | null = null
let mouse: THREE.Vector2 | null = null

// 地图数据
const mapData = ref<any[]>([])

// 选中的区域
const selectedRegion = ref<string>('')

// 悬停的区域
const hoveredRegion = ref<string>('')

// 标签数组
const labels: any[] = []

// 国家名称和位置数据
const countryLabels = [
  { name: '中国', lat: 35, lon: 105 },
  { name: '俄罗斯', lat: 60, lon: 100 },
  { name: '美国', lat: 40, lon: -100 },
  { name: '加拿大', lat: 60, lon: -110 },
  { name: '巴西', lat: -15, lon: -55 },
  { name: '阿根廷', lat: -35, lon: -65 },
  { name: '澳大利亚', lat: -25, lon: 135 },
  { name: '印度', lat: 20, lon: 80 },
  { name: '埃及', lat: 25, lon: 30 },
  { name: '尼日利亚', lat: 10, lon: 8 },
  { name: '南非', lat: -30, lon: 25 },
  { name: '英国', lat: 55, lon: -2 },
  { name: '法国', lat: 46, lon: 2 },
  { name: '德国', lat: 51, lon: 10 },
  { name: '意大利', lat: 42, lon: 12 },
  { name: '西班牙', lat: 40, lon: -3 },
  { name: '日本', lat: 36, lon: 138 },
  { name: '韩国', lat: 37, lon: 127 },
  { name: '印度尼西亚', lat: -5, lon: 120 },
  { name: '沙特阿拉伯', lat: 25, lon: 45 },
  { name: '土耳其', lat: 39, lon: 35 },
  { name: '伊朗', lat: 32, lon: 53 },
  { name: '巴基斯坦', lat: 30, lon: 70 },
  { name: '马来西亚', lat: 2, lon: 112 },
  { name: '泰国', lat: 15, lon: 101 },
  { name: '越南', lat: 16, lon: 108 },
  { name: '菲律宾', lat: 13, lon: 122 },
  { name: '马达加斯加', lat: -20, lon: 47 },
  { name: '哥伦比亚', lat: 4, lon: -74 },
  { name: '新西兰', lat: -40, lon: 175 },
  { name: '肯尼亚', lat: 1, lon: 38 },
  { name: '埃塞俄比亚', lat: 9, lon: 40 }
]

// 地图配置
const props = defineProps({
  // 数据源
  data: {
    type: Array,
    default: () => []
  },
  // 地图高度
  height: {
    type: Number,
    default: 500
  },
  // 地图宽度
  width: {
    type: Number,
    default: 800
  },
  // 是否自动旋转
  autoRotate: {
    type: Boolean,
    default: false
  },
  // 颜色主题
  colorTheme: {
    type: String,
    default: 'blue' // blue, red, green, rainbow
  },
  // 地图类型
  mapType: {
    type: String,
    default: 'world' // china, world
  },
  // 是否显示热力图
  showHeatmap: {
    type: Boolean,
    default: true
  },
  // 是否显示数据点
  showDataPoints: {
    type: Boolean,
    default: true
  },
  // 是否显示连接线
  showConnectionLines: {
    type: Boolean,
    default: true
  },
  // 分布点数据
  distributionData: {
    type: Array,
    default: () => []
  }
})

// 发射事件
const emit = defineEmits(['region-click', 'region-hover'])

// 初始化3D场景
const initScene = () => {
  if (!container.value) return
  
  // 获取容器尺寸
  const width = container.value.clientWidth
  const height = container.value.clientHeight

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000d1a)

  // 创建相机
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  camera.position.set(0, 20, 170)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)

  // 添加轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = props.autoRotate
  controls.minDistance = 100
  controls.maxDistance = 300

  // 创建光照
  setupLights()

  // 创建射线投射器用于交互
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 创建地球
  createEarthWithTexture()

  // 开始动画循环
  animate()

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
}

// 处理窗口大小变化
const handleResize = () => {
  if (!camera || !renderer || !container.value) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// 设置光照
const setupLights = () => {
  if (!scene) return

  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // 方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(100, 100, 50)
  scene.add(directionalLight)

  // 半球光 - 改善地球整体照明
  const hemisphereLight = new THREE.HemisphereLight(0xaaaaff, 0x806040, 0.2)
  scene.add(hemisphereLight)
}

// 创建带纹理的地球
const createEarthWithTexture = () => {
  // 创建地球几何体
  const globeRadius = 50
  const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64)
  
  // 加载纹理
  const textureLoader = new THREE.TextureLoader()
  
  // 创建地球材质
  const earthGroup = new THREE.Group()
  earthGroup.name = 'earthGroup'
  
  // 加载地球纹理
  textureLoader.load(
    // 使用在线地球纹理图片 (这是高分辨率地球表面的纹理)
    'https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg',
    (texture) => {
      // 纹理加载成功后
      const earthMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        bumpScale: 0.5,
        specular: 0x333333,
        shininess: 5
      })
      
      // 创建地球网格
      const earthMesh = new THREE.Mesh(globeGeometry, earthMaterial)
      earthMesh.name = 'earth'
      earthGroup.add(earthMesh)
      
      // 边界线直接在地球表面上
      createSurfaceBoundaries(earthGroup, globeRadius);
      
      // 在地球表面添加国家名称
      createSurfaceCountryLabels(earthGroup, globeRadius * 1.001);
      
      // 添加数据点
      if (props.showDataPoints) {
        addDataPoints()
      }
    },
    undefined,
    (err) => {
      // 加载失败时使用纯色
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0x2233aa),
        emissive: new THREE.Color(0x112244)
      })
      
      // 创建地球网格
      const earthMesh = new THREE.Mesh(globeGeometry, earthMaterial)
      earthMesh.name = 'earth'
      earthGroup.add(earthMesh)
      
      // 边界线直接在地球表面上
      createSurfaceBoundaries(earthGroup, globeRadius);
      
      // 在地球表面添加国家名称
      createSurfaceCountryLabels(earthGroup, globeRadius * 1.001);
    }
  )
  
  // 添加到场景
  scene.add(earthGroup)
}

// 在地球表面创建边界线
const createSurfaceBoundaries = (parentGroup, radius) => {
  if (!scene) return
  
  try {
    // 使用加载的世界地图数据
    const worldData = worldGeoJson || {}
    const features = worldData.features || []
    
    if (features.length === 0) {
      return
    }
    
    // 创建边界线材质 - 稍微抬高一点点，使其显示在地球表面上
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x1890ff,
      transparent: true,
      opacity: 0.6,
      linewidth: 1
    })
    
    // 地球半径
    const boundaryRadius = radius * 1.001  // 略微大于地球半径，以便显示在表面上
    
    // 创建线条组
    const linesGroup = new THREE.Group()
    linesGroup.name = 'boundaryLines'
    
    // 遍历所有国家/地区的边界
    features.forEach(feature => {
      try {
        const geometry = feature.geometry
        
        if (geometry.type === 'Polygon') {
          geometry.coordinates.forEach(coordinates => {
            const points: THREE.Vector3[] = []
            
            coordinates.forEach(coord => {
              if (Array.isArray(coord) && coord.length >= 2) {
                const [lon, lat] = coord
                const point = latLngToVector3(lat, lon, boundaryRadius)
                points.push(point)
              }
            })
            
            if (points.length > 1) {
              const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
              const line = new THREE.Line(lineGeometry, lineMaterial)
              linesGroup.add(line)
            }
          })
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach(polygon => {
            polygon.forEach(coordinates => {
              const points: THREE.Vector3[] = []
              
              coordinates.forEach(coord => {
                if (Array.isArray(coord) && coord.length >= 2) {
                  const [lon, lat] = coord
                  const point = latLngToVector3(lat, lon, boundaryRadius)
                  points.push(point)
                }
              })
              
              if (points.length > 1) {
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
                const line = new THREE.Line(lineGeometry, lineMaterial)
                linesGroup.add(line)
              }
            })
          })
        }
      } catch (err) {
        console.error('处理边界线特征时出错', err)
      }
    })
    
    // 添加到地球组
    parentGroup.add(linesGroup)
    
  } catch (error) {
    console.error('添加边界线失败:', error)
  }
}

// 在地球表面创建国家名称标签
const createSurfaceCountryLabels = (parentGroup, radius) => {
  if (!scene) return

  // 清除现有标签
  clearLabels()
  
  // 遍历国家标签数据
  countryLabels.forEach(country => {
    // 转换为3D坐标
    const position = latLngToVector3(country.lat, country.lon, radius)
    
    // 创建表面标签
    createSurfaceLabel(position, country.name, parentGroup)
  })
}

// 创建表面标签
const createSurfaceLabel = (position: THREE.Vector3, text: string, parentGroup) => {
  // 创建Canvas
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  
  const context = canvas.getContext('2d')
  if (!context) return
  
  // 绘制文本 - 透明背景
  context.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制文本，使用描边使文字在不同背景上都清晰可见
  context.font = 'bold 24px Arial'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  
  // 绘制文字描边
  context.strokeStyle = '#000'
  context.lineWidth = 3
  context.strokeText(text, canvas.width / 2, canvas.height / 2)
  
  // 绘制文字
  context.fillStyle = '#fff'
  context.fillText(text, canvas.width / 2, canvas.height / 2)
  
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas)
  
  // 创建标签几何体 - 使用小平面
  const labelGeometry = new THREE.PlaneGeometry(5, 2.5)
  
  // 创建标签材质
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: texture,
      transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  
  // 创建标签网格
  const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial)
  
  // 设置位置
  labelMesh.position.copy(position)
  
  // 计算从地球中心指向标签的方向
  const direction = position.clone().normalize()
  
  // 使标签朝向相机
  labelMesh.lookAt(new THREE.Vector3(0, 0, 0))
  labelMesh.up.copy(direction)
  
  // 稍微旋转标签使其面向外
  labelMesh.rotateY(Math.PI)
  
  // 添加到地球组
  parentGroup.add(labelMesh)
  
  // 记录标签便于管理
  labels.push({
    object: labelMesh,
    position: position.clone(),
    text: text
  })
}

// 清除标签
const clearLabels = () => {
  // 从场景中移除所有标签
  labels.forEach(label => {
    if (scene && label.object) {
      scene.remove(label.object)
    }
  })
  
  // 清空数组
  labels.length = 0
}

// 更新标签可见性
const updateLabels = () => {
  if (!camera || !scene) return
  
  // 获取地球组
  const earthGroup = scene.getObjectByName('earthGroup')
  if (!earthGroup) return
  
  // 获取地球的旋转角度
  const rotation = earthGroup.rotation.y
  
  labels.forEach(label => {
    if (!label.object) return
    
    // 根据地球旋转更新标签位置
    const originalPosition = label.position.clone()
    
    // 应用相同的旋转到标签位置
    const rotatedPosition = originalPosition.clone()
    
    // 创建旋转矩阵
    const rotationMatrix = new THREE.Matrix4().makeRotationY(rotation)
    rotatedPosition.applyMatrix4(rotationMatrix)
    
    // 更新标签位置
    label.object.position.copy(rotatedPosition)
    
    // 获取相机方向和标签方向
    const cameraPosition = camera.position.clone().normalize()
    const labelPosition = rotatedPosition.clone().normalize()
    
    // 计算点积来判断是否在可见面
    const dotProduct = labelPosition.dot(cameraPosition)
    
    // 设置标签可见性
    label.object.visible = dotProduct > 0
  })
}

// 转换经纬度到3D坐标
const latLngToVector3 = (lat: number, lng: number, radius: number = 50): THREE.Vector3 => {
  // 转换为弧度
  const phi = (90 - lat) * Math.PI / 180
  const theta = (lng + 180) * Math.PI / 180
  
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// 更新动画
const animate = () => {
  if (!scene || !camera || !renderer || !controls) {
    return
  }
  
  animationFrameId = requestAnimationFrame(animate)
  
  // 更新控制器
  controls.update()
  
  // 旋转地球组
  const earthGroup = scene.getObjectByName('earthGroup')
  if (earthGroup && props.autoRotate) {
    earthGroup.rotation.y += 0.001
  }
  
  // 渲染场景
  renderer.render(scene, camera)
}

// 组件挂载时初始化
onMounted(() => {
  // 初始化场景
  initScene()
})

// 组件卸载时清理资源
onUnmounted(() => {
  // 取消动画循环
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  
  // 移除事件监听器
  window.removeEventListener('resize', handleResize)
  
  // 释放渲染器资源
  if (renderer && container.value) {
    container.value.removeChild(renderer.domElement)
    renderer.dispose()
  }
  
  // 清理标签
  clearLabels()
  
  // 清理场景
  scene = null
  camera = null
  renderer = null
  controls = null
})

// 监听autoRotate属性变化
watch(() => props.autoRotate, (newValue) => {
  if (controls) {
    controls.autoRotate = newValue
  }
})

// 更新城市数据
const updateCityData = (cityData: any[], links: any[]) => {
  // 实现可在此添加
}

// 添加数据点
const addDataPoints = () => {
  if (!scene) return
  
  // 使用props中的数据或distributionData
  const dataPoints = props.data.length > 0 ? props.data : props.distributionData
  
  // 获取地球组
  const earthGroup = scene.getObjectByName('earthGroup')
  const pointsGroup = new THREE.Group()
  pointsGroup.name = 'dataPoints'
  
  // 如果没有数据，使用模拟数据
  if (!dataPoints || dataPoints.length === 0) {
    // 使用国家标签作为数据点
    
    countryLabels.forEach(country => {
      // 随机生成数据值
      const value = Math.random() * 100
      
      // 根据值大小决定点的大小和颜色
      const size = 0.5 + (value / 100) * 2
      
      // 创建点几何体
      const pointGeometry = new THREE.SphereGeometry(size, 16, 16)
      
      // 根据颜色主题和值大小设置颜色
    let color
    switch (props.colorTheme) {
      case 'red':
          color = new THREE.Color(0xff4d4f).lerp(new THREE.Color(0xff9c9c), 1 - value / 100)
        break
      case 'green':
          color = new THREE.Color(0x52c41a).lerp(new THREE.Color(0xb5ec8a), 1 - value / 100)
        break
      default:
          color = new THREE.Color(0x1890ff).lerp(new THREE.Color(0x91d5ff), 1 - value / 100)
    }
    
      // 创建点材质
      const pointMaterial = new THREE.MeshBasicMaterial({
      color: color,
        transparent: true,
        opacity: 0.9
      })
      
      // 创建点网格
      const point = new THREE.Mesh(pointGeometry, pointMaterial)
      
      // 设置点位置
      const position = latLngToVector3(country.lat, country.lon, 51)
      point.position.copy(position)
      
      // 添加数据信息
      point.userData = {
        name: country.name,
        value: value.toFixed(1),
        position: position.clone()
      }
      
      // 添加到组
      pointsGroup.add(point)
      
      // 添加发光效果
      addGlowEffect(position, size * 2, color)
    })
    
    // 添加到地球组
    if (earthGroup) {
      earthGroup.add(pointsGroup)
    } else {
      scene.add(pointsGroup)
    }
  } else {
    // 使用提供的数据点
    
    dataPoints.forEach((point: any) => {
      // 如果没有经纬度，跳过
      if (!point.lat && !point.lng && !point.lon) return
      
      // 获取数据值
      const value = point.value || 50
      
      // 根据值大小决定点的大小
      const size = 0.5 + (value / 100) * 2
      
      // 创建点几何体
      const pointGeometry = new THREE.SphereGeometry(size, 16, 16)
      
      // 根据颜色主题和值大小设置颜色
      let color
      switch (props.colorTheme) {
        case 'red':
          color = new THREE.Color(0xff4d4f).lerp(new THREE.Color(0xff9c9c), 1 - value / 100)
          break
        case 'green':
          color = new THREE.Color(0x52c41a).lerp(new THREE.Color(0xb5ec8a), 1 - value / 100)
          break
        default:
          color = new THREE.Color(0x1890ff).lerp(new THREE.Color(0x91d5ff), 1 - value / 100)
      }
      
      // 创建点材质
  const pointMaterial = new THREE.MeshBasicMaterial({
        color: color,
    transparent: true,
        opacity: 0.9
  })
  
      // 创建点网格
  const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial)
      
      // 设置点位置
      const lon = point.lon || point.lng
      const position = latLngToVector3(point.lat, lon, 51)
  pointMesh.position.copy(position)
  
      // 添加数据信息
      pointMesh.userData = {
        name: point.name,
        value: value,
        position: position.clone()
      }
      
      // 添加到组
      pointsGroup.add(pointMesh)
      
      // 添加发光效果
      addGlowEffect(position, size * 2, color)
    })
    
    // 添加到地球组
    if (earthGroup) {
      earthGroup.add(pointsGroup)
    } else {
      scene.add(pointsGroup)
    }
  }
}

// 添加发光效果
const addGlowEffect = (position: THREE.Vector3, size: number, color: THREE.Color) => {
  if (!scene) return
  
  // 创建发光几何体
  const glowGeometry = new THREE.SphereGeometry(size, 16, 16)
  
  // 创建发光材质
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
    side: THREE.BackSide
  })
  
  // 创建发光网格
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  glow.position.copy(position)
  
  // 添加到场景
  scene.add(glow)
  
  // 添加脉冲动画
  const animate = () => {
    if (!glow || !scene) return
    
    const time = Date.now() * 0.001
    const scale = 1 + Math.sin(time * 2) * 0.2
    
    glow.scale.set(scale, scale, scale)
    
    requestAnimationFrame(animate)
  }
  
  // 启动动画
  animate()
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData && newData.length > 0 && scene) {
    // 移除现有数据点
    const existingPoints = scene.getObjectByName('dataPoints')
    if (existingPoints) {
      scene.remove(existingPoints)
    }
    
    // 添加新数据点
    addDataPoints()
  }
}, { deep: true })

// 监听是否显示数据点
watch(() => props.showDataPoints, (newValue) => {
  if (scene) {
    // 获取数据点组
    const dataPoints = scene.getObjectByName('dataPoints')
    
    if (dataPoints) {
      // 设置可见性
      dataPoints.visible = newValue
    } else if (newValue) {
      // 如果没有数据点但需要显示，添加数据点
      addDataPoints()
    }
  }
})
</script>

<template>
  <div ref="container" class="three-d-map-container"></div>
</template>

<style scoped>
.three-d-map-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
  position: relative;
  background-color: #f0f2f5;
}
</style>