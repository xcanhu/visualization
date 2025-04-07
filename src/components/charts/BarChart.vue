<template>
  <div ref="chartRef" :style="{ width, height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
    default: '柱状图'
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
  // 是否为横向柱状图
  isHorizontal: {
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

// 格式化柱状图数据
const formatBarData = (data: any[]) => {
  if (!data || !Array.isArray(data)) return { categories: [], series: [] }
  
  // 支持多系列数据
  if (data[0] && data[0].series) {
    const categories = data.map(item => item.name || '未命名')
    const seriesMap = {}
    
    // 收集所有系列名称
    data.forEach(item => {
      if (item.series && Array.isArray(item.series)) {
        item.series.forEach(s => {
          if (!seriesMap[s.name]) {
            seriesMap[s.name] = Array(categories.length).fill(0)
          }
        })
      }
    })
    
    // 填充数据
    data.forEach((item, index) => {
      if (item.series && Array.isArray(item.series)) {
        item.series.forEach(s => {
          seriesMap[s.name][index] = s.value
        })
      }
    })
    
    // 转换为echarts系列数据
    const series = Object.keys(seriesMap).map(name => ({
      name,
      type: 'bar',
      data: seriesMap[name]
    }))
    
    return { categories, series }
  }
  
  // 单系列数据
  const categories = data.map(item => item.name || item.category || '未命名')
  const values = data.map(item => item.value || 0)
  
  return {
    categories,
    series: [{
      type: 'bar',
      data: values
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
  
  const { categories, series } = formatBarData(props.data)
  
  // 获取容器尺寸信息
  const containerWidth = chartRef.value ? chartRef.value.clientWidth : 400
  const containerHeight = chartRef.value ? chartRef.value.clientHeight : 300
  const isSmallContainer = containerWidth < 300 || containerHeight < 250
  
  // 根据主题获取颜色
  const getThemeColors = () => {
    // 保持数据系列颜色一致，不随主题变化
    return ['#1890ff', '#36cbcb', '#4ecb73', '#6eb5ff', '#975fe4', '#74caff'];
  };
  
  const themeColors = getThemeColors();
  
  // 是否为暗色主题
  const isDarkTheme = props.theme === 'dark';
  
  // 根据容器大小调整配置
  const fontSize = isSmallContainer ? 10 : 12
  const rotateLabels = categories.length > 6 || isSmallContainer
  const labelRotation = rotateLabels ? 45 : 0
  const showLabel = containerWidth > 250 && containerHeight > 180
  const gridBottom = props.showLegend && series.length > 1 ? (isSmallContainer ? '20%' : '15%') : '5%'
  const labelFormatter = isSmallContainer ? undefined : '{c}'
  
  const option: echarts.EChartsOption = {
    title: {
      text: props.title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: isSmallContainer ? 14 : 16,
        color: isDarkTheme ? '#fff' : '#333'
      }
    },
    backgroundColor: isDarkTheme ? '#1e1e1e' : 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    color: themeColors,
    legend: {
      show: props.showLegend && series.length > 1,
      orient: 'horizontal',
      bottom: '5%',
      type: 'scroll',
      pageIconSize: 12,
      textStyle: {
        fontSize: fontSize,
        color: isDarkTheme ? '#ddd' : '#333'
      },
      itemWidth: isSmallContainer ? 15 : 25,
      itemHeight: isSmallContainer ? 10 : 14
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: gridBottom,
      top: isSmallContainer ? '20%' : '15%',
      containLabel: true
    },
    [props.isHorizontal ? 'yAxis' : 'xAxis']: {
      type: 'category',
      data: categories,
      axisLabel: {
        interval: 0,
        rotate: props.isHorizontal ? 0 : labelRotation,
        fontSize: fontSize,
        color: isDarkTheme ? '#ddd' : '#333',
        formatter: function(value) {
          if (isSmallContainer && value.length > 6) {
            return value.substring(0, 6) + '...';
          }
          return value;
        }
      },
      axisLine: {
        lineStyle: {
          color: isDarkTheme ? '#444' : '#ccc'
        }
      }
    },
    [props.isHorizontal ? 'xAxis' : 'yAxis']: {
      type: 'value',
      axisLabel: {
        fontSize: fontSize,
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
      label: {
        show: showLabel,
        position: 'top',
        fontSize: fontSize,
        formatter: labelFormatter,
        color: isDarkTheme ? '#fff' : '#333'
      },
      itemStyle: {
        borderRadius: 5,
        color: themeColors[index % themeColors.length]
      },
      barWidth: isSmallContainer ? '50%' : '60%',
      barMaxWidth: isSmallContainer ? 20 : 40
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

// 监听方向属性变化
watch(() => props.isHorizontal, () => {
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