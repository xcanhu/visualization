<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

// 容器引用
const container = ref<HTMLElement | null>(null)

// 场景相关变量
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let animationFrameId: number | null = null
let clock: THREE.Clock | null = null
let waveGeometry: THREE.PlaneGeometry | null = null
let waveMaterial: THREE.ShaderMaterial | null = null
let waveMesh: THREE.Mesh | null = null

// 配置参数
const props = defineProps({
  // 波浪颜色
  color: {
    type: String,
    default: '#1890ff'
  },
  // 波浪速度
  speed: {
    type: Number,
    default: 1.0
  },
  // 波浪数量
  waves: {
    type: Number,
    default: 3
  },
  // 波浪振幅
  amplitude: {
    type: Number,
    default: 0.2
  },
  // 是否使用渐变色
  useGradient: {
    type: Boolean,
    default: true
  }
})

// 初始化场景
const initScene = () => {
  if (!container.value) return

  // 创建场景
  scene = new THREE.Scene()

  // 创建相机
  const aspect = window.innerWidth / window.innerHeight
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)

  // 创建时钟
  clock = new THREE.Clock()

  // 创建波浪
  createWave()

  // 开始动画循环
  animate()
}

// 创建波浪
const createWave = () => {
  if (!scene) return

  // 波浪几何体
  waveGeometry = new THREE.PlaneGeometry(20, 20, 128, 128)

  // 波浪着色器材质
  const vertexShader = `
    uniform float uTime;
    uniform float uAmplitude;
    uniform int uWaves;
    
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      
      float elevation = 0.0;
      
      // 创建多层波浪
      for(int i = 0; i < 10; i++) {
        if(i >= uWaves) break;
        
        float frequency = 0.5 * float(i + 1);
        float amplitude = uAmplitude / float(i + 1);
        
        elevation += sin(position.x * frequency + uTime) * amplitude;
        elevation += sin(position.y * frequency * 0.8 + uTime) * amplitude;
      }
      
      vElevation = elevation;
      
      vec3 newPosition = position;
      newPosition.z += elevation;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uTime;
    uniform bool uUseGradient;
    
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vec3 color;
      
      if(uUseGradient) {
        // 创建动态渐变色
        float hue = vUv.x * 0.1 + vUv.y * 0.1 + uTime * 0.05;
        color = 0.5 + 0.5 * cos(6.28318 * (hue + vec3(0.0, 0.33, 0.67)));
        
        // 混合基础颜色
        color = mix(color, uColor, 0.5);
      } else {
        // 使用单一颜色
        color = uColor;
      }
      
      // 根据高度调整亮度
      color += vElevation * 0.2;
      
      // 添加边缘发光效果
      float edge = smoothstep(0.0, 0.05, vUv.x) * smoothstep(0.0, 0.05, vUv.y) * 
                  smoothstep(0.0, 0.05, 1.0 - vUv.x) * smoothstep(0.0, 0.05, 1.0 - vUv.y);
      color *= edge * 1.5 + 0.5;
      
      gl_FragColor = vec4(color, 0.8);
    }
  `

  // 创建材质
  waveMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(props.color) },
      uAmplitude: { value: props.amplitude },
      uWaves: { value: props.waves },
      uUseGradient: { value: props.useGradient }
    },
    transparent: true,
    side: THREE.DoubleSide
  })

  // 创建网格
  waveMesh = new THREE.Mesh(waveGeometry, waveMaterial)
  waveMesh.rotation.x = -Math.PI / 4
  waveMesh.position.y = -2
  scene.add(waveMesh)

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  // 添加点光源
  const pointLight = new THREE.PointLight(0xffffff, 1)
  pointLight.position.set(5, 5, 5)
  scene.add(pointLight)
}

// 动画循环
const animate = () => {
  if (!renderer || !scene || !camera || !clock || !waveMaterial) return

  animationFrameId = requestAnimationFrame(animate)
  
  // 更新时间uniform
  waveMaterial.uniforms.uTime.value = clock.getElapsedTime() * props.speed
  
  // 旋转波浪
  if (waveMesh) {
    waveMesh.rotation.z += 0.001
  }
  
  renderer.render(scene, camera)
}

// 处理窗口大小变化
const handleResize = () => {
  if (!camera || !renderer) return

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

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
  clock = null
  waveGeometry = null
  waveMaterial = null
  waveMesh = null
  
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div ref="container" class="wave-background"></div>
</template>

<style scoped>
.wave-background {
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