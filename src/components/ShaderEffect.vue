<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

// 容器引用
const container = ref<HTMLElement | null>(null)

// 场景相关变量
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let animationFrameId: number | null = null
let uniforms: Record<string, THREE.IUniform> = {}
let clock: THREE.Clock | null = null

// 着色器配置
const props = defineProps({
  // 着色器类型
  shaderType: {
    type: String,
    default: 'wave', // wave, noise, plasma, gradient
    validator: (value: string) => ['wave', 'noise', 'plasma', 'gradient'].includes(value)
  },
  // 着色器颜色
  colorScheme: {
    type: String,
    default: 'blue', // blue, red, green, rainbow
    validator: (value: string) => ['blue', 'red', 'green', 'rainbow'].includes(value)
  },
  // 动画速度
  speed: {
    type: Number,
    default: 1.0
  },
  // 高度
  height: {
    type: Number,
    default: 300
  },
  // 宽度
  width: {
    type: Number,
    default: 600
  }
})

// 初始化着色器场景
const initShaderScene = () => {
  if (!container.value) return

  // 创建场景
  scene = new THREE.Scene()

  // 创建相机
  const aspect = props.width / props.height
  camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10)
  camera.position.z = 1

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(props.width, props.height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)

  // 创建时钟
  clock = new THREE.Clock()

  // 创建着色器材质
  createShaderMaterial()

  // 开始动画循环
  animate()
}

// 创建着色器材质
const createShaderMaterial = () => {
  if (!scene) return

  // 清除现有场景
  while(scene.children.length > 0) { 
    scene.remove(scene.children[0]); 
  }

  // 初始化Uniforms
  uniforms = {
    u_time: { value: 0.0 },
    u_resolution: { value: new THREE.Vector2(props.width, props.height) },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_colorScheme: { value: getColorValue(props.colorScheme) }
  }

  // 获取着色器代码
  const { vertexShader, fragmentShader } = getShaderCode(props.shaderType)

  // 创建着色器材质
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  })

  // 创建平面几何体
  const geometry = new THREE.PlaneGeometry(2, 2)

  // 创建网格
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
}

// 获取颜色值
const getColorValue = (colorScheme: string): THREE.Vector3 => {
  switch (colorScheme) {
    case 'blue':
      return new THREE.Vector3(0.0, 0.5, 1.0)
    case 'red':
      return new THREE.Vector3(1.0, 0.2, 0.2)
    case 'green':
      return new THREE.Vector3(0.2, 0.8, 0.2)
    case 'rainbow':
      return new THREE.Vector3(1.0, 1.0, 1.0) // 彩虹模式在着色器中处理
    default:
      return new THREE.Vector3(0.0, 0.5, 1.0)
  }
}

// 获取着色器代码
const getShaderCode = (shaderType: string) => {
  // 顶点着色器 - 所有效果共用
  const vertexShader = `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  // 片段着色器 - 根据类型选择
  let fragmentShader = ''

  switch (shaderType) {
    case 'wave':
      fragmentShader = `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_colorScheme;
        varying vec2 vUv;
        
        void main() {
          vec2 st = vUv;
          float ratio = u_resolution.x / u_resolution.y;
          st.x *= ratio;
          
          // 创建波浪效果
          float frequency = 10.0;
          float amplitude = 0.1;
          float speed = u_time * 2.0;
          
          float y1 = sin(st.x * frequency + speed) * amplitude;
          float y2 = sin(st.x * frequency * 1.5 + speed * 1.1) * amplitude * 0.5;
          
          float wave = smoothstep(y1 + y2, y1 + y2 + 0.02, st.y);
          
          // 颜色处理
          vec3 color;
          if (u_colorScheme.x == 1.0 && u_colorScheme.y == 1.0 && u_colorScheme.z == 1.0) {
            // 彩虹模式
            float hue = st.x + u_time * 0.1;
            color = 0.5 + 0.5 * cos(6.28318 * (hue * vec3(1.0, 0.7, 0.4) + vec3(0.0, 0.15, 0.2)));
          } else {
            // 单色模式
            color = mix(u_colorScheme, vec3(1.0), wave);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
      break
    case 'noise':
      fragmentShader = `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_colorScheme;
        varying vec2 vUv;
        
        // 2D 随机函数
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        // 2D 噪声函数
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          
          vec2 u = f * f * (3.0 - 2.0 * f);
          
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        void main() {
          vec2 st = vUv;
          float ratio = u_resolution.x / u_resolution.y;
          st.x *= ratio;
          
          // 创建分形噪声
          float scale = 4.0;
          float n = 0.0;
          float amplitude = 1.0;
          float frequency = 1.0;
          float lacunarity = 2.0;
          float gain = 0.5;
          
          for (int i = 0; i < 5; i++) {
            n += amplitude * noise(st * frequency + u_time * 0.2);
            frequency *= lacunarity;
            amplitude *= gain;
          }
          
          // 颜色处理
          vec3 color;
          if (u_colorScheme.x == 1.0 && u_colorScheme.y == 1.0 && u_colorScheme.z == 1.0) {
            // 彩虹模式
            float hue = n + u_time * 0.1;
            color = 0.5 + 0.5 * cos(6.28318 * (hue * vec3(1.0, 0.7, 0.4) + vec3(0.0, 0.15, 0.2)));
          } else {
            // 单色模式
            color = mix(vec3(0.1), u_colorScheme, n);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
      break
    case 'plasma':
      fragmentShader = `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_colorScheme;
        varying vec2 vUv;
        
        void main() {
          vec2 st = vUv;
          float ratio = u_resolution.x / u_resolution.y;
          st.x *= ratio;
          
          // 创建等离子效果
          float v1 = sin((st.x * 10.0) + u_time);
          float v2 = sin((st.y * 10.0) + u_time);
          float v3 = sin((st.x * 10.0) + (st.y * 10.0) + u_time);
          float v4 = sin(sqrt(pow(st.x - 0.5, 2.0) + pow(st.y - 0.5, 2.0)) * 20.0);
          
          float plasma = (v1 + v2 + v3 + v4) * 0.25;
          plasma = 0.5 + 0.5 * plasma; // 归一化到 0-1 范围
          
          // 颜色处理
          vec3 color;
          if (u_colorScheme.x == 1.0 && u_colorScheme.y == 1.0 && u_colorScheme.z == 1.0) {
            // 彩虹模式
            float hue = plasma + u_time * 0.1;
            color = 0.5 + 0.5 * cos(6.28318 * (hue * vec3(1.0, 0.7, 0.4) + vec3(0.0, 0.15, 0.2)));
          } else {
            // 单色模式
            color = mix(vec3(0.1), u_colorScheme, plasma);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
      break
    case 'gradient':
      fragmentShader = `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_colorScheme;
        varying vec2 vUv;
        
        void main() {
          vec2 st = vUv;
          float ratio = u_resolution.x / u_resolution.y;
          st.x *= ratio;
          
          // 创建动态渐变
          vec2 center = vec2(0.5 * ratio, 0.5);
          float dist = distance(st, center);
          
          float angle = atan(st.y - 0.5, st.x - 0.5 * ratio);
          float offset = sin(angle * 5.0 + u_time) * 0.1;
          
          float gradient = smoothstep(0.0, 1.0, dist + offset);
          
          // 颜色处理
          vec3 color;
          if (u_colorScheme.x == 1.0 && u_colorScheme.y == 1.0 && u_colorScheme.z == 1.0) {
            // 彩虹模式
            float hue = gradient + u_time * 0.1;
            color = 0.5 + 0.5 * cos(6.28318 * (hue * vec3(1.0, 0.7, 0.4) + vec3(0.0, 0.15, 0.2)));
          } else {
            // 单色模式
            color = mix(u_colorScheme, vec3(1.0), gradient);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
      break
    default:
      fragmentShader = `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec3 u_colorScheme;
        varying vec2 vUv;
        
        void main() {
          gl_FragColor = vec4(u_colorScheme, 1.0);
        }
      `
  }

  return { vertexShader, fragmentShader }
}

// 动画循环
const animate = () => {
  if (!renderer || !scene || !camera || !clock) return

  animationFrameId = requestAnimationFrame(animate)
  
  // 更新时间uniform
  uniforms.u_time.value = clock.getElapsedTime() * props.speed
  
  renderer.render(scene, camera)
}

// 处理鼠标移动
const handleMouseMove = (event: MouseEvent) => {
  if (!container.value || !uniforms.u_mouse) return
  
  const rect = container.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) / props.width
  const y = 1.0 - (event.clientY - rect.top) / props.height
  
  uniforms.u_mouse.value.set(x, y)
}

// 处理窗口大小变化
const handleResize = () => {
  if (!camera || !renderer || !container.value || !uniforms.u_resolution) return

  const width = container.value.clientWidth || props.width
  const height = container.value.clientHeight || props.height

  uniforms.u_resolution.value.set(width, height)
  renderer.setSize(width, height)
}

// 监听着色器类型变化
watch(() => props.shaderType, () => {
  createShaderMaterial()
})

// 监听颜色方案变化
watch(() => props.colorScheme, (newValue) => {
  if (uniforms.u_colorScheme) {
    uniforms.u_colorScheme.value = getColorValue(newValue)
  }
})

// 监听速度变化
watch(() => props.speed, () => {
  // 速度直接在animate中应用
})

// 组件挂载时初始化
onMounted(() => {
  initShaderScene()
  window.addEventListener('resize', handleResize)
  container.value?.addEventListener('mousemove', handleMouseMove)
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
  clock = null
  
  window.removeEventListener('resize', handleResize)
  container.value?.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <div class="shader-effect-container">
    <div class="effect-header">
      <h3>{{ $t('shaderEffect.' + shaderType) }}</h3>
    </div>
    <div ref="container" class="effect-container" :style="{ height: `${height}px`, width: `${width}px` }"></div>
    <div class="effect-footer">
      <p class="effect-tip">{{ $t('shaderEffect.tip') }}</p>
    </div>
  </div>
</template>

<style scoped>
.shader-effect-container {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 15px;
  margin-bottom: 20px;
}

.effect-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.effect-header h3 {
  margin: 0;
  color: #001529;
}

.effect-container {
  width: 100%;
  height: 300px;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.effect-footer {
  margin-top: 10px;
  text-align: center;
}

.effect-tip {
  font-size: 12px;
  color: #888;
  margin: 0;
}
</style>