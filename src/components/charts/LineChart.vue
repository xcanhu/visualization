<template>
  <div ref="chartRef" :style="{ width, height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  // 图表数据
  data: {
    type: Array,
    default: () => []
  },
  // 图表标题
  title: {
    type: String,
    default: '折线图'
  },
  // 图表宽度
  width: {
    type: String,
    default: '100%'
  },
  // 图表高度
  height: {
    type: String,
    default: '300px'
  },
  // 是否显示图例
  showLegend: {
    type: Boolean,
    default: true
  },
  // 是否为平滑曲线
  smooth: {
    type: Boolean,
    default: true
  },
  // 是否显示面积
  showArea: {
    type: Boolean,
    default: false
  },
  // 图表主题
  theme: {
    type: String,
    default: 'blue'
  }
})

const emit = defineEmits(['rendered', 'click'])

// 图表DOM引用
const chartRef = ref<HTMLElement | null>(null)
// 图表实例
let chartInstance: echarts.ECharts | null = null

// 格式化折线图数据
const formatLineData = (data: any[]) => {
  if (!data || !Array.isArray(data)) return { xAxis: [], series: [] }
  
  // 时间序列数据
  if (data[0] && (data[0].time || data[0].date)) {
    const timeField = data[0].time ? 'time' : 'date'
    const xAxis = data.map(item => item[timeField])
    
    // 多系列数据
    if (data[0] && data[0].series) {
      const seriesMap = {}
      
      // 收集所有系列
      data.forEach(item => {
        if (item.series && Array.isArray(item.series)) {
          item.series.forEach(s => {
            if (!seriesMap[s.name]) {
              seriesMap[s.name] = []
            }
          })
        }
      })
      
      // 填充数据
      data.forEach(item => {
        if (item.series && Array.isArray(item.series)) {
          item.series.forEach(s => {
            seriesMap[s.name].push(s.value)
          })
        }
      })
      
      // 转换为echarts系列数据
      const series = Object.keys(seriesMap).map(name => ({
        name,
        type: 'line',
        data: seriesMap[name],
        smooth: props.smooth,
        areaStyle: props.showArea ? {} : null
      }))
      
      return { xAxis, series }
    }
    
    // 单系列数据
    const values = data.map(item => item.value || 0)
    
    return {
      xAxis,
      series: [{
        type: 'line',
        data: values,
        smooth: props.smooth,
        areaStyle: props.showArea ? {} : null
      }]
    }
  }
  
  // 常规类别数据
  const xAxis = data.map(item => item.name || item.category || '未命名')
  const values = data.map(item => item.value || 0)
  
  return {
    xAxis,
    series: [{
      type: 'line',
      data: values,
      smooth: props.smooth,
      areaStyle: props.showArea ? {} : null
    }]
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  // 初始化图表实例
  chartInstance = echarts.init(chartRef.value)
  
  // 监听点击事件
  chartInstance.on('click', (params) => {
    emit('click', params)
  })
  
  // 渲染图表
  renderChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 通知图表已渲染
  emit('rendered', chartInstance)
}

// 处理窗口大小变化
const handleResize = () => {
  chartInstance?.resize()
}

// 渲染图表
const renderChart = () => {
  if (!chartInstance) return
  
  const { xAxis, series } = formatLineData(props.data)
  
  // 根据主题获取颜色
  const getThemeColors = () => {
    // 保持数据系列颜色一致，不随主题变化
    return ['#1890ff', '#36cbcb', '#4ecb73', '#6eb5ff', '#975fe4', '#74caff'];
  };
  
  const themeColors = getThemeColors();
  
  // 是否为暗色主题
  const isDarkTheme = props.theme === 'dark';
  
  const option: echarts.EChartsOption = {
    title: {
      text: props.title,
      left: 'center',
      textStyle: {
        color: isDarkTheme ? '#fff' : '#333'
      }
    },
    backgroundColor: isDarkTheme ? '#1e1e1e' : 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    color: themeColors,
    legend: {
      show: props.showLegend && series.length > 1,
      orient: 'horizontal',
      bottom: '5%',
      type: 'scroll',
      textStyle: {
        color: isDarkTheme ? '#ddd' : '#333'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: props.showLegend && series.length > 1 ? '15%' : '5%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxis,
      axisLabel: {
        interval: xAxis.length > 10 ? 'auto' : 0,
        rotate: xAxis.length > 10 ? 30 : 0,
        color: isDarkTheme ? '#ddd' : '#333'
      },
      axisLine: {
        lineStyle: {
          color: isDarkTheme ? '#444' : '#ccc'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: isDarkTheme ? '#ddd' : '#333'
      },
      splitLine: {
        lineStyle: {
          color: isDarkTheme ? '#333' : '#eee'
        }
      }
    },
    series: series.map((s, index) => ({
      ...s,
      name: s.name || `系列${index + 1}`,
      symbol: 'emptyCircle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: themeColors[index % themeColors.length]
      },
      itemStyle: {
        color: themeColors[index % themeColors.length]
      },
      emphasis: {
        focus: 'series'
      },
      markPoint: {
        data: [
          { type: 'max', name: '最大值' },
          { type: 'min', name: '最小值' }
        ],
        label: {
          color: isDarkTheme ? '#fff' : '#333'
        }
      },
      markLine: {
        data: [
          { type: 'average', name: '平均值' }
        ],
        label: {
          color: isDarkTheme ? '#fff' : '#333'
        }
      },
      areaStyle: props.showArea ? {
        opacity: 0.3,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: themeColors[index % themeColors.length]
          },
          {
            offset: 1,
            color: isDarkTheme ? 'rgba(30, 30, 30, 0.2)' : 'rgba(255, 255, 255, 0.2)'
          }
        ])
      } : null
    }))
  }
  
  // 设置图表配置
  chartInstance.setOption(option)
}

// 监听数据变化
watch(() => props.data, () => {
  renderChart()
}, { deep: true })

// 监听主题变化
watch(() => props.theme, () => {
  renderChart()
})

// 监听标题变化
watch(() => props.title, () => {
  renderChart()
})

// 监听曲线属性变化
watch(() => props.smooth, () => {
  renderChart()
})

// 监听面积属性变化
watch(() => props.showArea, () => {
  renderChart()
})

// 组件挂载时初始化图表
onMounted(() => {
  initChart()
})

// 组件卸载时销毁图表实例
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})

// 导出图表为图片
const downloadChart = (options = {}) => {
  if (!chartInstance) return ''
  
  return chartInstance.getDataURL({
    pixelRatio: 2,
    backgroundColor: '#fff',
    ...options
  })
}

// 暴露方法和属性给父组件
defineExpose({
  chartInstance: () => chartInstance,
  downloadChart,
  resize: handleResize
})
</script> 