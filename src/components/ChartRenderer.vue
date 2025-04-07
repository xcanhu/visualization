<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useDataStore } from '../stores'
import * as echarts from 'echarts'
import 'echarts-gl'
import { ElMessage } from 'element-plus'
import ThreeDChart from './ThreeDChart.vue'
import ThreeDMap from './ThreeDMap.vue'

const emit = defineEmits(['refresh', 'chart-rendered'])

const props = defineProps({
  // 图表数据
  data: {
    type: Array,
    default: () => []
  },
  // 图表类型
  chartType: {
    type: String,
    default: 'pie'
  },
  // 图表标题
  title: {
    type: String,
    default: '数据可视化'
  },
  // 图表宽度
  width: {
    type: String,
    default: '100%'
  },
  // 图表高度
  height: {
    type: String,
    default: '400px'
  },
  // 图表主题
  theme: {
    type: String,
    default: 'blue' // blue, dark, light
  },
  // 是否显示图例
  showLegend: {
    type: Boolean,
    default: true
  },
  // 刷新间隔（毫秒），0表示不自动刷新
  refreshInterval: {
    type: Number,
    default: 0
  },
  // 是否支持3D图表
  enable3D: {
    type: Boolean,
    default: true
  }
})

// 获取数据存储
const dataStore = useDataStore()

// 图表容器引用
const chartRef = ref<HTMLElement | null>(null)

// 图表实例
const chartInstance = ref<echarts.ECharts | null>(null)

// 加载状态
const loading = ref<boolean>(false)

// 定时器ID
let refreshTimer: number | null = null

// 是否为3D图表
const is3DChart = computed(() => {
  return ['bar3d', 'map3d', 'scatter3d', 'surface3d', 'line3d'].includes(props.chartType)
})

// 初始化图表
const initChart = () => {
  // 如果是3D图表，跳过常规图表初始化
  if (is3DChart.value) return
  
  // 如果已有图表实例，先销毁
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  
  // 确保DOM元素已挂载
  if (!chartRef.value) return
  
  // 创建图表实例
  chartInstance.value = echarts.init(chartRef.value)
  
  // 渲染图表
  renderChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  emit('chart-rendered', chartInstance.value)
}

// 响应窗口大小变化
const handleResize = () => {
  chartInstance.value?.resize()
}

// 根据数据和类型渲染图表
const renderChart = () => {
  if (!chartInstance.value) return
  
  loading.value = true
  
  try {
    // 根据图表类型生成配置
    const option = generateChartOption(props.chartType, props.data, props.title)
    
    // 应用配置
    chartInstance.value.setOption(option)
    
    // 应用主题
    applyTheme(props.theme)
  } catch (error) {
    console.error('渲染图表失败:', error)
    ElMessage.error(`渲染图表失败: ${error.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 根据图表类型生成配置
const generateChartOption = (type: string, data: any[], title: string): echarts.EChartsOption => {
  // 基础配置
  const baseOption: echarts.EChartsOption = {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      show: props.showLegend,
      orient: 'horizontal',
      bottom: '5%'
    },
    animation: true
  }
  
  // 根据图表类型生成特定配置
  switch (type) {
    case 'pie':
      return {
        ...baseOption,
        series: [
          {
            name: title,
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}: {c} ({d}%)'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: true
            },
            data: formatPieData(data)
          }
        ]
      }
    
    case 'bar':
      return {
        ...baseOption,
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.name || item.category || '未命名'),
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: title,
            type: 'bar',
            barWidth: '60%',
            data: data.map(item => ({
              name: item.name || item.category || '未命名',
              value: Number(item.value || item.count || 0)
            })),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            }
          }
        ]
      }
    
    case 'line':
      return {
        ...baseOption,
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.name || item.x || item.category || '未命名'),
          boundaryGap: false
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: title,
            type: 'line',
            stack: '总量',
            smooth: true,
            lineStyle: {
              width: 3,
              shadowColor: 'rgba(0,0,0,0.2)',
              shadowBlur: 10,
              shadowOffsetY: 10
            },
            itemStyle: {
              color: '#1890ff'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(24,144,255,0.3)' },
                { offset: 1, color: 'rgba(24,144,255,0.1)' }
              ])
            },
            data: data.map(item => Number(item.value || item.y || item.count || 0))
          }
        ]
      }
    
    case 'radar':
      // 雷达图需要特殊处理指标
      const indicators = data[0]?.value && Array.isArray(data[0].value)
        ? Array.from({ length: data[0].value.length }, (_, i) => ({ name: `指标${i + 1}`, max: 100 }))
        : Object.keys(data[0] || {})
            .filter(key => key !== 'name' && key !== 'category')
            .map(key => ({ name: key, max: 100 }))
      
      return {
        ...baseOption,
        radar: {
          indicator: indicators
        },
        series: [
          {
            name: title,
            type: 'radar',
            data: formatRadarData(data)
          }
        ]
      }
    
    case 'gauge':
      // 仪表盘通常接收单个数值
      const gaugeValue = typeof data === 'number' 
        ? data 
        : (data[0]?.value || 0)
      
      return {
        ...baseOption,
        series: [
          {
            name: title,
            type: 'gauge',
            detail: {
              formatter: '{value}%',
              fontSize: 16
            },
            data: [{ value: Number(gaugeValue), name: title }],
            axisLine: {
              lineStyle: {
                width: 30,
                color: [
                  [0.3, '#67e0e3'],
                  [0.7, '#37a2da'],
                  [1, '#fd666d']
                ]
              }
            }
          }
        ]
      }
      
    case 'heatmap':
      // 热力图需要x, y, value数据
      const heatmapData = data.map((item, index) => {
        const x = item.x || Math.floor(index / 10)
        const y = item.y || index % 10
        return [x, y, Number(item.value || item.count || 0)]
      })
      
      return {
        ...baseOption,
        grid: {
          left: '3%',
          right: '7%',
          bottom: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: Array.from(new Set(heatmapData.map(item => item[0])))
        },
        yAxis: {
          type: 'category',
          data: Array.from(new Set(heatmapData.map(item => item[1])))
        },
        visualMap: {
          min: 0,
          max: Math.max(...heatmapData.map(item => Number(item[2]))),
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%'
        },
        series: [
          {
            name: title,
            type: 'heatmap',
            data: heatmapData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
    
    // 其他图表类型可以根据需要继续扩展
    default:
      ElMessage.warning(`未支持的图表类型: ${type}，使用饼图代替`)
      return generateChartOption('pie', data, title)
  }
}

// 格式化饼图数据
const formatPieData = (data: any[]) => {
  if (!Array.isArray(data)) return []
  
  return data.map(item => {
    if (typeof item === 'object') {
      return {
        name: item.name || item.category || '未命名',
        value: Number(item.value || item.count || 0)
      }
    } else {
      return {
        name: '数据' + (data.indexOf(item) + 1),
        value: Number(item)
      }
    }
  })
}

// 格式化雷达图数据
const formatRadarData = (data: any[]) => {
  if (!Array.isArray(data)) return []
  
  // 如果数据已经是雷达图格式
  if (data[0] && Array.isArray(data[0].value)) {
    return data.map(item => ({
      name: item.name || '未命名',
      value: item.value
    }))
  }
  
  // 否则尝试转换
  const indicators = Object.keys(data[0] || {}).filter(key => 
    key !== 'name' && key !== 'category'
  )
  
  return data.map(item => ({
    name: item.name || item.category || '未命名',
    value: indicators.map(key => Number(item[key] || 0))
  }))
}

// 应用主题
const applyTheme = (theme: string) => {
  if (!chartInstance.value) return
  
  const themeColors = {
    blue: {
      backgroundColor: 'rgba(0, 21, 41, 0.2)',
      textColor: '#fff',
      legendTextColor: 'rgba(255, 255, 255, 0.8)'
    },
    dark: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      textColor: '#fff',
      legendTextColor: 'rgba(255, 255, 255, 0.8)'
    },
    light: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      textColor: '#333',
      legendTextColor: '#666'
    }
  }
  
  const currentTheme = themeColors[theme as keyof typeof themeColors] || themeColors.blue
  
  chartInstance.value.setOption({
    backgroundColor: currentTheme.backgroundColor,
    textStyle: {
      color: currentTheme.textColor
    },
    legend: {
      textStyle: {
        color: currentTheme.legendTextColor
      }
    }
  })
}

// 刷新图表数据
const refreshData = () => {
  emit('refresh')
  if (!is3DChart.value) {
    renderChart()
  }
}

// 手动刷新
const refresh = () => {
  refreshData()
}

// 导出图表为图片
const exportChart = () => {
  if (!chartInstance.value) return
  
  const dataURL = chartInstance.value.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  })
  
  const link = document.createElement('a')
  link.download = `${props.title || '图表'}_${new Date().getTime()}.png`
  link.href = dataURL
  link.click()
}

// 设置自动刷新
const setupRefreshTimer = () => {
  // 清除现有定时器
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  // 如果刷新间隔大于0，设置新的定时器
  if (props.refreshInterval > 0) {
    refreshTimer = window.setInterval(() => {
      refreshData()
    }, props.refreshInterval)
  }
}

// 监听属性变化
watch(() => props.data, () => {
  if (!is3DChart.value) {
    renderChart()
  }
}, { deep: true })

watch(() => props.chartType, () => {
  if (is3DChart.value) {
    // 如果切换为3D图表，销毁现有2D图表
    if (chartInstance.value) {
      chartInstance.value.dispose()
      chartInstance.value = null
    }
  } else {
    // 如果切换为2D图表，重新初始化
    initChart()
  }
}, { immediate: true })

watch(() => props.theme, () => {
  if (!is3DChart.value) {
    applyTheme(props.theme)
  }
})

watch(() => props.refreshInterval, () => {
  setupRefreshTimer()
})

// 生命周期钩子
onMounted(() => {
  // 非3D图表初始化
  if (!is3DChart.value) {
    initChart()
  }
  
  // 设置自动刷新
  setupRefreshTimer()
})

onUnmounted(() => {
  // 清除事件监听
  window.removeEventListener('resize', handleResize)
  
  // 清除定时器
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  // 销毁图表实例
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})

// 暴露方法
defineExpose({
  refresh,
  exportChart,
  getChartInstance: () => chartInstance.value
})
</script>

<template>
  <div class="chart-renderer" :style="{ width: width, height: height }">
    <!-- 加载状态 -->
    <div v-if="loading" class="chart-loading">
      <el-icon class="loading-icon"><loading /></el-icon>
      <span>加载中...</span>
    </div>
    
    <!-- 无数据提示 -->
    <div v-else-if="!data || (Array.isArray(data) && data.length === 0)" class="no-data">
      <el-icon><data-line /></el-icon>
      <span>暂无数据</span>
    </div>
    
    <!-- 3D图表 -->
    <template v-else-if="is3DChart && enable3D">
      <ThreeDChart 
        v-if="chartType === 'bar3d' || chartType === 'scatter3d' || chartType === 'line3d'"
        :data="data"
        :chart-type="chartType"
        :title="title"
        :theme="theme"
      />
      <ThreeDMap 
        v-else-if="chartType === 'map3d'"
        :data="data"
        :title="title"
        :theme="theme"
      />
    </template>
    
    <!-- 2D图表 -->
    <div 
      v-else 
      ref="chartRef"
      class="chart-container"
      :class="{ 'no-3d': is3DChart && !enable3D }"
    ></div>
    
    <!-- 图表控制按钮 -->
    <div class="chart-controls">
      <el-button 
        size="small" 
        circle 
        @click="refresh" 
        title="刷新"
      >
        <el-icon><refresh /></el-icon>
      </el-button>
      
      <el-button 
        size="small" 
        circle 
        @click="exportChart" 
        title="导出"
        :disabled="is3DChart"
      >
        <el-icon><download /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.chart-renderer {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.chart-renderer:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.chart-container {
  width: 100%;
  height: 100%;
}

.chart-container.no-3d {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.chart-container.no-3d::after {
  content: '3D图表功能未启用';
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-top: 10px;
}

.chart-loading,
.no-data {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
}

.loading-icon {
  font-size: 24px;
  animation: spin 1.5s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-data {
  color: rgba(255, 255, 255, 0.5);
}

.no-data .el-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.chart-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.chart-renderer:hover .chart-controls {
  opacity: 1;
}

:deep(.el-button--small) {
  padding: 5px;
  font-size: 12px;
}
</style> 