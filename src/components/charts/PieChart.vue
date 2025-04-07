<template>
  <div ref="chartRef" :style="{ width, height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, defineExpose, computed } from 'vue'
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
    default: '饼图'
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
  // 是否环形图
  isDoughnut: {
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
// 存储上一次的主题
const lastTheme = ref<string | null>(null)

// 为图表应用主题色
const colorPalette = computed(() => {
  // 基于主题返回不同的颜色方案
  switch(props.theme) {
    case 'dark':
      return ['#37A2FF', '#FF0087', '#FFBF00', '#32C5E9', '#67E0E3', '#9FE6B8', '#FFDB5C', '#ff9f7f', '#fb7293', '#E062AE'];
    case 'light':
      return ['#73C0DE', '#91CC75', '#FAC858', '#EE6666', '#73C0DE', '#5470C6', '#9A60B4', '#FF8C00', '#48D1CC', '#7B68EE'];
    default: // 蓝色主题
      return ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#48D1CC'];
  }
});

// 获取背景颜色
const getBackgroundColor = computed(() => {
  return props.theme === 'dark' ? '#1a1a2e' : '#ffffff';
});

// 获取文本颜色
const getTextColor = computed(() => {
  return props.theme === 'dark' ? '#e7e7e7' : '#333333';
});

// 格式化饼图数据
const formatPieData = (data: any[]) => {
  if (!data || !Array.isArray(data)) return []
  
  return data.map(item => {
    if (typeof item === 'object') {
      return {
        name: item.name || '未命名',
        value: item.value || 0
      }
    }
    return { name: `项目${Math.random().toString(36).substring(2, 6)}`, value: item }
  })
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  // 初始化图表实例
  chartInstance = echarts.init(chartRef.value)
  
  // 设置初始主题
  lastTheme.value = props.theme
  
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
  
  // 主题发生变化时，先销毁原有图表实例，重新创建
  if (chartRef.value && lastTheme.value !== props.theme) {
    console.log('主题已变更，重新创建图表实例', lastTheme.value, '->', props.theme);
    chartInstance.dispose();
    chartInstance = echarts.init(chartRef.value);
    lastTheme.value = props.theme;
    
    // 重新绑定点击事件监听
    chartInstance.on('click', (params) => {
      emit('click', params)
    })
  }
  
  const formattedData = formatPieData(props.data)
  
  // 获取容器宽高，根据尺寸调整饼图参数
  const containerWidth = chartRef.value ? chartRef.value.clientWidth : 400
  const containerHeight = chartRef.value ? chartRef.value.clientHeight : 300
  const isSmallContainer = containerWidth < 300 || containerHeight < 250
  
  // 根据容器大小调整配置
  const radius = isSmallContainer
    ? (props.isDoughnut ? ['35%', '60%'] : '60%')
    : (props.isDoughnut ? ['40%', '65%'] : '65%')
    
  const labelShow = !isSmallContainer
  const center = isSmallContainer ? ['50%', '40%'] : ['50%', '45%']
  const legendShow = props.showLegend && containerHeight > 230
  const legendBottom = isSmallContainer ? '0%' : '5%'
  
  // 获取当前主题的颜色方案
  const currentColorPalette = colorPalette.value;
  const currentBgColor = getBackgroundColor.value;
  const currentTextColor = getTextColor.value;
  
  console.log('应用主题颜色:', props.theme, currentBgColor, currentColorPalette[0]);
  
  const option: echarts.EChartsOption = {
    backgroundColor: currentBgColor,
    color: currentColorPalette,
    title: {
      text: props.title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: isSmallContainer ? 14 : 16,
        color: currentTextColor
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      show: legendShow,
      orient: 'horizontal',
      bottom: legendBottom,
      type: 'scroll',
      pageIconSize: 12,
      pageTextStyle: {
        color: props.theme === 'dark' ? '#bbb' : '#999'
      },
      textStyle: {
        fontSize: isSmallContainer ? 10 : 12,
        color: currentTextColor
      },
      itemWidth: isSmallContainer ? 15 : 25,
      itemHeight: isSmallContainer ? 10 : 14
    },
    series: [
      {
        name: props.title,
        type: 'pie',
        radius: radius,
        center: center,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: props.theme === 'dark' ? '#2d3142' : '#fff',
          borderWidth: 2
        },
        label: {
          show: labelShow,
          position: 'outside',
          formatter: isSmallContainer ? '{d}%' : '{b}\n{d}%',
          lineHeight: 18,
          padding: [4, 4],
          backgroundColor: props.theme === 'dark' ? 'rgba(45,49,66,0.7)' : 'rgba(255,255,255,0.7)',
          color: currentTextColor,
          borderRadius: 4,
          align: 'center',
          bleedMargin: 5,
          distanceToLabelLine: 5,
          fontSize: isSmallContainer ? 10 : 12
        },
        labelLine: {
          show: labelShow,
          length: isSmallContainer ? 10 : 15,
          length2: isSmallContainer ? 5 : 10,
          smooth: true
        },
        emphasis: {
          label: {
            show: true,
            fontSize: isSmallContainer ? 12 : 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: formattedData
      }
    ]
  }
  
  // 设置图表配置
  chartInstance.setOption(option, true)
}

// 导出图表为图片
const downloadChart = (options = {}) => {
  if (!chartInstance) return ''
  
  return chartInstance.getDataURL({
    pixelRatio: 2,
    backgroundColor: '#fff',
    ...options
  })
}

// 监听所有可能影响图表渲染的属性变化
watch([
  () => props.data,
  () => props.title,
  () => props.theme,
  () => props.isDoughnut,
  () => props.showLegend,
  () => props.width,
  () => props.height
], () => {
  renderChart()
}, { deep: true })

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

// 暴露方法和属性给父组件
defineExpose({
  chartInstance: () => chartInstance,
  downloadChart,
  resize: handleResize,
  renderWithNewTheme: renderChart
})
</script> 