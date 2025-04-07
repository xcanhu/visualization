<template>
  <div class="chart-container">
    <!-- 图表标题和工具栏 -->
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="chart-toolbar">
        <el-tooltip content="下载图表">
          <el-button size="small" circle @click="downloadChart">
            <el-icon><Download /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="刷新数据">
          <el-button size="small" circle @click="refreshData">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="配置图表">
          <el-button size="small" circle @click="configVisible = true">
            <el-icon><Setting /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="删除图表">
          <el-button size="small" circle type="danger" @click="confirmDelete">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
    
    <!-- 图表内容区域 -->
    <div class="chart-content" :style="{ height: height }">
      <!-- 饼图 -->
      <PieChart 
        v-if="chartType === 'pie'" 
        ref="chartRef"
        :data="processedData" 
        :title="title"
        :width="'100%'"
        :height="'100%'"
        :show-legend="showLegend"
        :is-doughnut="chartConfig.isDoughnut"
        :theme="theme"
        @rendered="onChartRendered"
        @click="onChartElementClick"
      />
      
      <!-- 柱状图 -->
      <BarChart 
        v-else-if="chartType === 'bar'" 
        ref="chartRef"
        :data="processedData" 
        :title="title"
        :width="'100%'"
        :height="'100%'"
        :show-legend="showLegend"
        :is-horizontal="chartConfig.isHorizontal"
        :theme="theme"
        @rendered="onChartRendered"
        @click="onChartElementClick"
      />
      
      <!-- 折线图 -->
      <LineChart 
        v-else-if="chartType === 'line'" 
        ref="chartRef"
        :data="processedData" 
        :title="title"
        :width="'100%'"
        :height="'100%'"
        :show-legend="showLegend"
        :smooth="chartConfig.smooth"
        :show-area="chartConfig.showArea"
        :theme="theme"
        @rendered="onChartRendered"
        @click="onChartElementClick"
      />
      
      <!-- 散点图 -->
      <ScatterChart 
        v-else-if="chartType === 'scatter'" 
        ref="chartRef"
        :data="processedData" 
        :title="title"
        :width="'100%'"
        :height="'100%'"
        :show-legend="showLegend"
        :show-trend-line="chartConfig.showTrendLine"
        :symbol-size-range="chartConfig.symbolSizeRange"
        :theme="theme"
        @rendered="onChartRendered"
        @click="onChartElementClick"
      />
      
      <!-- 其他图表类型 -->
      <div v-else class="no-chart">
        <p>暂不支持的图表类型: {{ chartType }}</p>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="chart-loading">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
    </div>
    
    <!-- 图表配置对话框 -->
    <el-dialog
      v-model="configVisible"
      title="图表配置"
      width="600px"
    >
      <el-form label-position="top" :model="chartConfig">
        <!-- 通用配置 -->
        <el-form-item label="图表标题">
          <el-input v-model="chartConfigTemp.title" />
        </el-form-item>
        
        <el-form-item label="图表类型">
          <el-select v-model="chartConfigTemp.chartType" style="width: 100%">
            <el-option value="pie" label="饼图" />
            <el-option value="bar" label="柱状图" />
            <el-option value="line" label="折线图" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="图表主题">
          <el-select v-model="chartConfigTemp.theme" style="width: 100%">
            <el-option value="blue" label="蓝色主题" />
            <el-option value="dark" label="暗色主题" />
            <el-option value="light" label="亮色主题" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="chartConfigTemp.showLegend">显示图例</el-checkbox>
        </el-form-item>
        
        <!-- 特定图表配置 -->
        <!-- 饼图配置 -->
        <template v-if="chartConfigTemp.chartType === 'pie'">
          <el-form-item>
            <el-checkbox v-model="chartConfigTemp.isDoughnut">环形图</el-checkbox>
          </el-form-item>
        </template>
        
        <!-- 柱状图配置 -->
        <template v-if="chartConfigTemp.chartType === 'bar'">
          <el-form-item>
            <el-checkbox v-model="chartConfigTemp.isHorizontal">横向柱状图</el-checkbox>
          </el-form-item>
        </template>
        
        <!-- 折线图配置 -->
        <template v-if="chartConfigTemp.chartType === 'line'">
          <el-form-item>
            <el-checkbox v-model="chartConfigTemp.smooth">平滑曲线</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="chartConfigTemp.showArea">显示面积</el-checkbox>
          </el-form-item>
        </template>
        
        <!-- 散点图配置 -->
        <template v-if="chartConfigTemp.chartType === 'scatter'">
          <el-form-item>
            <el-checkbox v-model="chartConfigTemp.showTrendLine">显示趋势线</el-checkbox>
          </el-form-item>
          <el-form-item label="气泡大小范围">
            <el-slider
              v-model="chartConfigTemp.symbolSizeRange"
              range
              :min="5"
              :max="100"
            />
          </el-form-item>
        </template>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="configVisible = false">取消</el-button>
          <el-button type="primary" @click="saveConfig">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 确认删除对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="300px"
    >
      <p>确定要删除此图表吗？</p>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleDelete">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import PieChart from './charts/PieChart.vue'
import BarChart from './charts/BarChart.vue'
import LineChart from './charts/LineChart.vue'
import ScatterChart from './charts/ScatterChart.vue'
import { 
  Loading, 
  Download, 
  Refresh, 
  Setting,
  Delete
} from '@element-plus/icons-vue'

// 组件属性
const props = defineProps({
  // 图表类型
  chartType: {
    type: String,
    default: 'pie',
    validator: (value) => ['pie', 'bar', 'line', 'scatter'].includes(value)
  },
  // 图表数据
  data: {
    type: Array,
    default: () => []
  },
  // 图表标题
  title: {
    type: String,
    default: '数据可视化'
  },
  // 图表高度
  height: {
    type: String,
    default: '400px'
  },
  // 图表主题
  theme: {
    type: String,
    default: 'blue'
  },
  // 是否显示图例
  showLegend: {
    type: Boolean,
    default: true
  },
  // 是否正在加载
  loading: {
    type: Boolean,
    default: false
  },
  // 额外配置
  config: {
    type: Object,
    default: () => ({})
  }
})

// 事件
const emit = defineEmits([
  'update:config', 
  'refresh', 
  'chart-click', 
  'chart-rendered',
  'delete'
])

// 图表引用
const chartRef = ref(null)

// 配置对话框可见性
const configVisible = ref(false)

// 是否已初始化
const isInitialized = ref(false)

// 合并图表配置
const chartConfig = reactive({
  // 饼图配置
  isDoughnut: props.config.isDoughnut || false,
  
  // 柱状图配置
  isHorizontal: props.config.isHorizontal || false,
  
  // 折线图配置
  smooth: props.config.smooth !== undefined ? props.config.smooth : true,
  showArea: props.config.showArea || false,
  
  // 散点图配置
  showTrendLine: props.config.showTrendLine || false,
  symbolSizeRange: props.config.symbolSizeRange || [10, 50]
})

// 配置临时变量
const chartConfigTemp = reactive({
  title: props.title,
  chartType: props.chartType,
  theme: props.theme,
  showLegend: props.showLegend,
  ...JSON.parse(JSON.stringify(chartConfig))
})

// 处理后的数据
const processedData = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return []
  return props.data
})

// 保存配置
const saveConfig = () => {
  // 检查主题是否发生变化
  const themeChanged = props.theme !== chartConfigTemp.theme;
  console.log('主题是否变更:', themeChanged, props.theme, '->', chartConfigTemp.theme);
  
  // 构建完整的配置对象
  const completeConfig = {
    // 通用配置
    title: chartConfigTemp.title,
    chartType: chartConfigTemp.chartType,
    theme: chartConfigTemp.theme,
    showLegend: chartConfigTemp.showLegend,
    
    // 图表特定配置
    isDoughnut: chartConfigTemp.isDoughnut,
    isHorizontal: chartConfigTemp.isHorizontal,
    smooth: chartConfigTemp.smooth,
    showArea: chartConfigTemp.showArea,
    showTrendLine: chartConfigTemp.showTrendLine,
    symbolSizeRange: chartConfigTemp.symbolSizeRange
  };
  
  // 关闭配置对话框
  configVisible.value = false;
  
  // 触发配置更新事件给父组件
  emit('update:config', completeConfig);
  
  ElMessage.success('图表配置已更新');
  
  // 强制重绘图表，先应用本地更新再刷新
  if (themeChanged || props.chartType !== chartConfigTemp.chartType) {
    console.log('触发图表完全刷新');
    
    // 设置短暂延迟确保父组件先更新配置
    setTimeout(() => {
      emit('refresh');
    }, 100);
  }
}

// 刷新数据
const refreshData = () => {
  emit('refresh')
}

// 下载图表
const downloadChart = () => {
  if (!chartRef.value) {
    console.warn('图表引用不存在，无法下载')
    return
  }
  
  try {
    // 获取图表组件实例
    const chart = chartRef.value
    
    // 直接使用子组件暴露的downloadChart方法
    const url = chart.downloadChart({
      pixelRatio: 2,
      backgroundColor: '#fff',
      type: 'png'
    })
    
    if (!url) {
      console.error('获取图表数据URL失败')
      ElMessage.error('下载图表失败')
      return
    }
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.title || '图表'}_${new Date().getTime()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('图表已下载')
  } catch (error) {
    console.error('下载图表时发生错误:', error)
    ElMessage.error('下载图表失败')
  }
}

// 图表元素点击事件
const onChartElementClick = (params) => {
  emit('chart-click', params)
}

// 图表渲染完成事件
const onChartRendered = (instance) => {
  emit('chart-rendered', instance)
  isInitialized.value = true
  
  // 延迟执行resize，确保图表完全渲染后能自适应容器
  setTimeout(() => {
    if (chartRef.value && chartRef.value.resize) {
      chartRef.value.resize()
    }
  }, 100)
}

// 手动触发图表重新渲染
const forceResize = () => {
  if (chartRef.value && chartRef.value.resize) {
    chartRef.value.resize()
    return true
  }
  return false
}

// 设置尺寸监听器
const setupResizeObserver = () => {
  if (!chartRef.value || typeof ResizeObserver === 'undefined') return
  
  // 确保初始渲染后才设置监听器
  nextTick(() => {
    const chartContainer = document.querySelector('.chart-container')
    if (!chartContainer) return
    
    // 创建ResizeObserver实例
    const resizeObserver = new ResizeObserver(entries => {
      // 当容器大小变化时，延迟执行resize操作
      if (entries.length > 0 && isInitialized.value) {
        // 防抖处理，避免频繁触发
        clearTimeout(resizeDebounceTimer.value)
        resizeDebounceTimer.value = setTimeout(() => {
          forceResize()
        }, 200)
      }
    })
    
    // 观察容器元素
    resizeObserver.observe(chartContainer)
    
    // 保存引用以便卸载时清理
    containerResizeObserver.value = resizeObserver
  })
}

// 防抖定时器
const resizeDebounceTimer = ref(null)

// 监听属性变化
watch(() => props.config, (newVal) => {
  // 更新图表配置
  Object.keys(newVal).forEach(key => {
    if (chartConfig.hasOwnProperty(key)) {
      chartConfig[key] = newVal[key]
    }
  })
}, { deep: true })

// 组件挂载时
onMounted(() => {
  // 初始化配置
  setupResizeObserver();
})

// ResizeObserver实例引用
const containerResizeObserver = ref(null);

// 监听高度变化
watch(() => props.height, () => {
  nextTick(() => {
    if (chartRef.value && chartRef.value.resize) {
      chartRef.value.resize();
    }
  });
});

// 组件卸载时
onUnmounted(() => {
  // 清理ResizeObserver
  if (containerResizeObserver.value) {
    containerResizeObserver.value.disconnect();
    containerResizeObserver.value = null;
  }
})

// 暴露组件方法给父组件
defineExpose({
  resizeChart: () => {
    if (chartRef.value && typeof chartRef.value.resize === 'function') {
      console.log('ChartContainer: 调整图表大小')
      nextTick(() => {
        chartRef.value.resize()
      })
      return true
    }
    return false
  },
  renderWithNewTheme: () => {
    console.log('ChartContainer: 应用新主题')
    if (chartRef.value && typeof chartRef.value.renderWithNewTheme === 'function') {
      // 如果图表组件提供了主题更新方法，调用它
      nextTick(() => {
        chartRef.value.renderWithNewTheme()
        return true
      })
    } else {
      // 否则尝试通过刷新来应用主题
      emit('refresh')
      return true
    }
    return false
  }
})

// 确认删除对话框
const deleteDialogVisible = ref(false)

// 确认删除
const confirmDelete = () => {
  deleteDialogVisible.value = true
}

// 执行删除
const handleDelete = () => {
  deleteDialogVisible.value = false
  emit('delete')
}
</script>

<style scoped>
.chart-container {
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-title {
  font-size: 16px;
  margin: 0;
  font-weight: 500;
}

.chart-toolbar {
  display: flex;
  gap: 8px;
}

.chart-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.loading-icon {
  font-size: 32px;
  animation: rotate 1.5s linear infinite;
}

.no-chart {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style> 