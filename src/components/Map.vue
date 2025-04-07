<template>
  <div class="map-container" ref="mapContainer">
    <div v-if="loading" class="loading-overlay">
      <el-icon class="loading-icon"><loading /></el-icon>
      加载中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import chinaGeoJson from '../assets/china.json'
import { useDataStore } from '../stores'

// 获取数据存储
const dataStore = useDataStore()

// 地图容器引用
const mapContainer = ref<HTMLElement | null>(null)

// 地图实例
let mapChart: echarts.ECharts | null = null

// 加载状态
const loading = ref<boolean>(false)

// 组件属性
const props = defineProps({
  // 数据源
  data: {
    type: Array,
    default: () => []
  },
  // 颜色主题
  colorTheme: {
    type: String,
    default: 'blue' // blue, red, green, rainbow
  },
  // 是否显示热力图
  showHeatmap: {
    type: Boolean,
    default: true
  },
  // 地图类型
  mapType: {
    type: String,
    default: 'china' // china, world
  }
})

// 初始化地图
const initMap = async () => {
  if (!mapContainer.value) return
  
  // 创建图表实例
  mapChart = echarts.init(mapContainer.value)
  
  try {
    // 直接使用导入的地图数据
    const geoJson = chinaGeoJson
    
    // 注册地图
    echarts.registerMap('china', geoJson)
    
    // 设置颜色
    let areaColor, borderColor, emphasisColor
    switch (props.colorTheme) {
      case 'blue':
        areaColor = '#e6f7ff'
        borderColor = '#1890ff'
        emphasisColor = '#1890ff'
        break
      case 'red':
        areaColor = '#fff1f0'
        borderColor = '#ff4d4f'
        emphasisColor = '#ff4d4f'
        break
      case 'green':
        areaColor = '#f6ffed'
        borderColor = '#52c41a'
        emphasisColor = '#52c41a'
        break
      default:
        areaColor = '#e6f7ff'
        borderColor = '#1890ff'
        emphasisColor = '#1890ff'
    }
    
    // 设置地图选项
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: borderColor,
        textStyle: {
          color: '#333'
        }
      },
      visualMap: {
        show: props.showHeatmap,
        min: 0,
        max: 1000,
        left: 'left',
        top: 'top',
        text: ['高', '低'],
        realtime: false,
        calculable: true,
        inRange: {
          color: props.colorTheme === 'blue' 
            ? ['#e6f7ff', '#1890ff'] 
            : props.colorTheme === 'red'
              ? ['#fff1f0', '#ff4d4f']
              : ['#f6ffed', '#52c41a']
        },
        textStyle: {
          color: '#333'
        }
      },
      toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'top',
        feature: {
          restore: {},
          saveAsImage: {}
        }
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        layoutCenter: ['50%', '50%'],
        layoutSize: '100%',
        scaleLimit: {
          min: 1,
          max: 5
        },
        itemStyle: {
          areaColor: areaColor,
          borderColor: borderColor,
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            areaColor: emphasisColor,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 10
          },
          label: {
            show: true,
            color: '#333'
          }
        },
        label: {
          show: true,
          color: '#333',
          fontSize: 10
        }
      },
      series: [
        {
          name: '数据',
          type: 'map',
          geoIndex: 0,
          data: props.data.map((item: any) => {
            return {
              name: item.name,
              value: item.value
            }
          }),
          label: {
            show: true,
            color: '#333',
            fontSize: 10
          }
        }
      ]
    }
    
    // 设置选项
    mapChart.setOption(option)
    
    // 监听点击事件
    mapChart.on('click', (params) => {
      // 发射点击事件
      emit('region-click', {
        name: params.name,
        value: params.value
      })
    })
    
    // 处理窗口大小变化
    window.addEventListener('resize', handleResize)
  } catch (error) {
    console.error('Failed to initialize map:', error)
  }
}

// 处理窗口大小变化
const handleResize = () => {
  if (mapChart) {
    mapChart.resize()
  }
}

// 定义发射事件
const emit = defineEmits(['region-click', 'region-hover'])

// 更新地图数据
const updateMapData = () => {
  if (!mapChart) return
  
  mapChart.setOption({
    series: [
      {
        name: '数据',
        type: 'map',
        geoIndex: 0,
        data: props.data.map((item: any) => {
          return {
            name: item.name,
            value: item.value
          }
        })
      }
    ]
  })
}

// 组件挂载时初始化地图
onMounted(() => {
  // 等待DOM更新后初始化地图
  setTimeout(() => {
    initMap()
  }, 0)

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
})

// 清理资源
onUnmounted(() => {
  if (mapChart) {
    mapChart.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

// 监听数据变化
watch(() => props.data, () => {
  updateMapData()
}, { deep: true })

// 监听主题变化
watch(() => props.colorTheme, () => {
  if (mapChart) {
    mapChart.dispose()
  }
  initMap()
})

// 监听热力图显示设置
watch(() => props.showHeatmap, () => {
  if (mapChart) {
    mapChart.setOption({
      visualMap: {
        show: props.showHeatmap
      }
    })
  }
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  color: #333;
}

.loading-icon {
  font-size: 24px;
  margin-bottom: 10px;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 