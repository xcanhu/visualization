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
    default: '散点图'
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
  // 是否包含趋势线
  showTrendLine: {
    type: Boolean,
    default: false
  },
  // 气泡大小范围
  symbolSizeRange: {
    type: Array,
    default: () => [10, 50]
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

// 格式化散点图数据
const formatScatterData = (data: any[]) => {
  if (!data || !Array.isArray(data)) {
    console.warn('散点图数据格式错误：数据为空或不是数组');
    return { series: [] };
  }
  
  console.log('散点图原始数据:', JSON.stringify(data));
  
  // 检查是否有任何数据点带有分类信息
  const hasCategories = data.some(item => item.category || item.group || item.type);
  console.log('数据是否包含分类信息:', hasCategories);
  
  if (hasCategories) {
    // 按分类处理多系列数据
    const categories: Record<string, any[]> = {};
    
    // 遍历所有数据点
    data.forEach(item => {
      const category = item.category || item.group || item.type || '默认分组';
      
      // 如果该分类不存在，创建它
      if (!categories[category]) {
        categories[category] = [];
      }
      
      // 处理不同格式的数据点
      if (Array.isArray(item.value) && item.value.length >= 2) {
        // 标准格式：[x, y, size?]
        categories[category].push(item.value);
      } else if (typeof item.x === 'number' && typeof item.y === 'number') {
        // {x, y, z?} 格式
        const point = [item.x, item.y];
        if (typeof item.z === 'number') {
          point.push(item.z);
        }
        categories[category].push(point);
      } else {
        console.warn('跳过无效数据点:', item);
      }
    });
    
    console.log('散点图分类处理结果:', JSON.stringify(categories));
    
    // 检查是否有任何有效数据
    if (Object.keys(categories).length === 0) {
      console.warn('没有找到有效的分类数据');
      return { series: [] };
    }
    
    // 转换为ECharts系列数据
    const series = Object.keys(categories).map(category => {
      const seriesData = categories[category];
      console.log(`类别 ${category} 有 ${seriesData.length} 个数据点`);
      
      return {
        name: category,
        type: 'scatter',
        data: seriesData,
        symbolSize: function(data: any) {
          // 如果数据有第三个维度，用于表示点大小
          if (Array.isArray(data) && data.length > 2) {
            const minSize = 10;
            const maxSize = 30;
            return minSize + (data[2] / 100) * (maxSize - minSize);
          }
          return 15; // 默认大小
        }
      };
    });
    
    console.log('最终生成的散点图系列:', JSON.stringify(series));
    return { series };
  } else {
    // 单系列数据处理
    console.log('使用单系列模式处理散点图数据');
    
    const formattedData = data.map(item => {
      if (Array.isArray(item.value) && item.value.length >= 2) {
        return item.value;
      } else if (Array.isArray(item) && item.length >= 2) {
        return item;
      } else if (typeof item.x === 'number' && typeof item.y === 'number') {
        const point = [item.x, item.y];
        if (typeof item.z === 'number') {
          point.push(item.z);
        }
        return point;
      } else {
        console.warn('无法解析的数据点:', item);
        return [0, 0]; // 默认值
      }
    });
    
    console.log('单系列处理结果:', JSON.stringify(formattedData));
    
    return {
      series: [{
        type: 'scatter',
        data: formattedData,
        symbolSize: function(data: any) {
          if (Array.isArray(data) && data.length > 2) {
            const minSize = 10;
            const maxSize = 30;
            return minSize + (data[2] / 100) * (maxSize - minSize);
          }
          return 15;
        }
      }]
    };
  }
};

// 计算线性回归趋势线
const calculateTrendLine = (data: number[][]) => {
  if (!data || data.length < 2) return []
  
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  const n = data.length
  
  data.forEach(point => {
    sumX += point[0]
    sumY += point[1]
    sumXY += point[0] * point[1]
    sumX2 += point[0] * point[0]
  })
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // 找出x轴的最小和最大值
  const minX = Math.min(...data.map(point => point[0]))
  const maxX = Math.max(...data.map(point => point[0]))
  
  // 生成趋势线的两个点
  return [
    [minX, minX * slope + intercept],
    [maxX, maxX * slope + intercept]
  ]
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
  if (!chartInstance) return;
  
  // 首先获取数据
  const { series } = formatScatterData(props.data);
  console.log('散点图实际渲染的数据系列数量:', series.length);
  
  // 如果没有数据或系列为空，显示空状态
  if (!series || series.length === 0) {
    console.warn('散点图没有有效系列数据，显示空图表');
    
    chartInstance.setOption({
      title: {
        text: props.title,
        left: 'center'
      },
      graphic: {
        elements: [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无数据',
            fontSize: 16,
            fontWeight: 'bold',
            fill: '#999'
          }
        }]
      }
    });
    return;
  }
  
  // 添加趋势线
  if (props.showTrendLine && series.length > 0) {
    // 为每个系列添加趋势线
    series.forEach((s, index) => {
      if (s.data && s.data.length >= 2) {
        const trendLineData = calculateTrendLine(s.data)
        
        // 添加趋势线系列
        series.push({
          name: `${s.name || '系列' + (index + 1)}趋势线`,
          type: 'line',
          data: trendLineData,
          showSymbol: false,
          lineStyle: {
            color: '#F00',
            width: 2,
            type: 'dashed'
          },
          zlevel: -1
        })
      }
    })
  }
  
  // 准备配置选项
  const option: echarts.EChartsOption = {
    title: {
      text: props.title,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        const data = params.data
        if (params.seriesType === 'scatter') {
          if (Array.isArray(data) && data.length > 2) {
            return `${params.seriesName}<br/>
                    X: ${data[0]}<br/>
                    Y: ${data[1]}<br/>
                    大小: ${data[2]}`
          }
          return `${params.seriesName}<br/>
                  X: ${data[0]}<br/>
                  Y: ${data[1]}`
        }
        return params.seriesName
      }
    },
    legend: {
      show: props.showLegend && series.length > 1,
      orient: 'horizontal',
      bottom: '5%',
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: props.showLegend && series.length > 1 ? '15%' : '5%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      scale: true,
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: series.map(s => {
      // 只修改散点类型的系列
      if (s.type === 'scatter') {
        return {
          ...s,
          symbolSize: function(data) {
            // 如果有第三个维度，用它作为大小
            if (Array.isArray(data) && data.length > 2) {
              // 确保点的最小大小为10，避免过小而不可见
              const minSize = 10;
              const maxSize = 30;
              return minSize + (data[2] / 100) * (maxSize - minSize);
            }
            return 10; // 默认大小
          },
          // 增加视觉效果
          itemStyle: {
            borderWidth: 1,
            borderColor: '#fff',
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          },
          emphasis: {
            itemStyle: {
              borderWidth: 2,
              borderColor: '#fff',
              shadowBlur: 20,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            scale: true
          }
        };
      }
      return s;
    })
  };
  
  // 应用配置
  console.log('散点图最终配置:', JSON.stringify(option.series));
  chartInstance.clear();  // 清除旧的图表
  chartInstance.setOption(option, true);  // 强制重绘
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

// 监听趋势线属性变化
watch(() => props.showTrendLine, () => {
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
  resize: handleResize,
  renderWithNewTheme: renderChart
})
</script> 