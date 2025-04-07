<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  // 当前图表类型
  chartType: {
    type: String,
    required: true
  },
  // 图表配置数据
  config: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:config', 'apply'])

// 内部配置状态
const currentConfig = ref(structuredClone(props.config || {}))

// 当配置或图表类型改变时更新内部状态
watch(
  () => [props.config, props.chartType], 
  ([newConfig, newChartType]) => {
    currentConfig.value = structuredClone(newConfig || {})
    // 确保配置包含该图表类型所需的所有字段
    ensureDefaultConfig(newChartType)
  },
  { immediate: true, deep: true }
)

// 确保配置中包含默认字段
const ensureDefaultConfig = (chartType: string) => {
  const defaults = getDefaultConfig(chartType)
  for (const key in defaults) {
    if (currentConfig.value[key] === undefined) {
      currentConfig.value[key] = defaults[key]
    }
  }
}

// 获取每种图表类型的默认配置
const getDefaultConfig = (chartType: string) => {
  const configs = {
    'pie': {
      title: '饼图',
      showLegend: true,
      showLabel: true,
      roseType: false,
      radius: '50%',
      labelPosition: 'outside'
    },
    'bar': {
      title: '柱状图',
      showLegend: true,
      showLabel: true,
      horizontal: false,
      stack: false,
      showBackground: false,
      barWidth: 'auto',
      barGap: '30%'
    },
    'line': {
      title: '折线图',
      showLegend: true,
      showSymbol: true,
      smooth: false,
      areaStyle: false,
      step: false,
      connectNulls: true
    },
    'gauge': {
      title: '仪表盘',
      min: 0,
      max: 100,
      splitNumber: 10,
      showPointer: true,
      showProgress: false,
      showTitle: true,
      axisLineWidth: 30
    },
    'radar': {
      title: '雷达图',
      shape: 'polygon',
      showLegend: true,
      showSplitLine: true,
      showAxisLine: true,
      showArea: true,
      indicator: []
    },
    'map': {
      title: '地图',
      mapType: 'china',
      showLegend: true,
      showLabel: true,
      roam: true,
      showVisualMap: true,
      visualMapMin: 0,
      visualMapMax: 1000
    },
    'heatmap': {
      title: '热力图',
      showLegend: true,
      showLabel: false,
      blurSize: 30,
      showVisualMap: true,
      visualMapMin: 0,
      visualMapMax: 1000
    },
    'scatter': {
      title: '散点图',
      showLegend: true,
      symbolSize: 10,
      showRegression: false,
      symbol: 'circle'
    },
    'bar3d': {
      title: '3D柱状图',
      showLegend: true,
      viewControl: {
        autoRotate: false,
        autoRotateSpeed: 10,
        distance: 120
      },
      shading: 'realistic',
      itemStyle: {
        opacity: 0.8
      }
    },
    'map3d': {
      title: '3D地图',
      showLegend: true,
      viewControl: {
        autoRotate: false,
        autoRotateSpeed: 10,
        distance: 120
      },
      environment: 'auto',
      light: {
        main: {
          intensity: 1
        },
        ambient: {
          intensity: 0.2
        }
      }
    }
  }
  
  return configs[chartType] || { title: '未知图表' }
}

// 按图表类型组织的配置面板
const configPanels = computed(() => {
  return {
    'pie': [
      { label: '标题', type: 'input', key: 'title' },
      { label: '显示图例', type: 'switch', key: 'showLegend' },
      { label: '显示标签', type: 'switch', key: 'showLabel' },
      { label: '玫瑰图表', type: 'switch', key: 'roseType' },
      { label: '半径', type: 'slider', key: 'radius', min: 10, max: 100, formatter: (val) => `${val}%` },
      { 
        label: '标签位置', 
        type: 'select', 
        key: 'labelPosition', 
        options: [
          { label: '外部', value: 'outside' },
          { label: '内部', value: 'inside' },
          { label: '中心', value: 'center' }
        ]
      }
    ],
    'bar': [
      { label: '标题', type: 'input', key: 'title' },
      { label: '显示图例', type: 'switch', key: 'showLegend' },
      { label: '显示标签', type: 'switch', key: 'showLabel' },
      { label: '水平方向', type: 'switch', key: 'horizontal' },
      { label: '堆叠模式', type: 'switch', key: 'stack' },
      { label: '显示背景', type: 'switch', key: 'showBackground' },
      { 
        label: '柱子宽度', 
        type: 'select', 
        key: 'barWidth', 
        options: [
          { label: '自动', value: 'auto' },
          { label: '较细', value: '20%' },
          { label: '适中', value: '40%' },
          { label: '较粗', value: '60%' }
        ]
      }
    ],
    'gauge': [
      { label: '标题', type: 'input', key: 'title' },
      { label: '最小值', type: 'number', key: 'min' },
      { label: '最大值', type: 'number', key: 'max' },
      { label: '刻度数量', type: 'number', key: 'splitNumber', min: 1, max: 20 },
      { label: '显示指针', type: 'switch', key: 'showPointer' },
      { label: '显示进度条', type: 'switch', key: 'showProgress' },
      { label: '轴线宽度', type: 'slider', key: 'axisLineWidth', min: 10, max: 50 }
    ],
    'scatter': [
      { label: '标题', type: 'input', key: 'title' },
      { label: '显示图例', type: 'switch', key: 'showLegend' },
      { label: '点大小', type: 'slider', key: 'symbolSize', min: 1, max: 50 },
      { label: '显示趋势线', type: 'switch', key: 'showRegression' },
      { 
        label: '点形状', 
        type: 'select', 
        key: 'symbol', 
        options: [
          { label: '圆形', value: 'circle' },
          { label: '矩形', value: 'rect' },
          { label: '三角形', value: 'triangle' },
          { label: '菱形', value: 'diamond' },
          { label: '箭头', value: 'arrow' }
        ] 
      }
    ],
    'bar3d': [
      { label: '标题', type: 'input', key: 'title' },
      { label: '显示图例', type: 'switch', key: 'showLegend' },
      { label: '自动旋转', type: 'switch', key: 'viewControl.autoRotate' },
      { label: '旋转速度', type: 'slider', key: 'viewControl.autoRotateSpeed', min: 1, max: 50 },
      { label: '视距', type: 'slider', key: 'viewControl.distance', min: 50, max: 400 },
      { 
        label: '着色效果', 
        type: 'select', 
        key: 'shading', 
        options: [
          { label: '写实', value: 'realistic' },
          { label: '兰伯特', value: 'lambert' },
          { label: '卡通', value: 'cartoon' }
        ] 
      },
      { label: '透明度', type: 'slider', key: 'itemStyle.opacity', min: 0, max: 1, step: 0.01 }
    ]
  }
})

// 获取当前图表类型的配置面板
const currentPanel = computed(() => {
  return configPanels.value[props.chartType] || []
})

// 处理配置项变更
const handleConfigChange = (key: string, value: any) => {
  // 处理嵌套属性路径 (例如 viewControl.autoRotate)
  if (key.includes('.')) {
    const path = key.split('.')
    let current = currentConfig.value
    
    // 遍历到最后一个属性的父对象
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {}
      }
      current = current[path[i]]
    }
    
    // 设置最后一个属性的值
    current[path[path.length - 1]] = value
  } else {
    currentConfig.value[key] = value
  }
  
  // 发送更新事件
  emit('update:config', structuredClone(currentConfig.value))
}

// 应用配置
const applyConfig = () => {
  emit('apply', structuredClone(currentConfig.value))
  ElMessage.success('图表配置已应用')
}

// 重置配置
const resetConfig = () => {
  currentConfig.value = getDefaultConfig(props.chartType)
  emit('update:config', structuredClone(currentConfig.value))
  ElMessage.info('已重置为默认配置')
}

// 获取嵌套对象属性的值
const getNestedValue = (obj: any, path: string) => {
  if (!path.includes('.')) {
    return obj[path]
  }
  
  const pathArr = path.split('.')
  let current = obj
  
  for (const key of pathArr) {
    if (current === undefined || current === null) {
      return undefined
    }
    current = current[key]
  }
  
  return current
}
</script>

<template>
  <div class="chart-config-panel">
    <div class="panel-header">
      <h3>{{ getDefaultConfig(chartType).title }}配置</h3>
      <div class="panel-actions">
        <el-button type="primary" size="small" @click="applyConfig">
          应用配置
        </el-button>
        <el-button size="small" @click="resetConfig">
          重置
        </el-button>
      </div>
    </div>
    
    <div class="panel-body">
      <el-form label-position="top" :model="currentConfig">
        <el-form-item 
          v-for="item in currentPanel" 
          :key="item.key" 
          :label="item.label"
        >
          <!-- 输入框 -->
          <el-input 
            v-if="item.type === 'input'" 
            v-model="currentConfig[item.key]"
            @change="handleConfigChange(item.key, $event)"
          />
          
          <!-- 开关 -->
          <el-switch 
            v-else-if="item.type === 'switch'" 
            v-model="currentConfig[item.key]"
            @change="handleConfigChange(item.key, $event)"
          />
          
          <!-- 数字输入 -->
          <el-input-number 
            v-else-if="item.type === 'number'" 
            v-model="currentConfig[item.key]"
            :min="item.min || -Infinity"
            :max="item.max || Infinity"
            @change="handleConfigChange(item.key, $event)"
          />
          
          <!-- 滑块 -->
          <el-slider 
            v-else-if="item.type === 'slider'" 
            v-model="getNestedValue(currentConfig, item.key)"
            :min="item.min || 0"
            :max="item.max || 100"
            :step="item.step || 1"
            :format-tooltip="item.formatter"
            @change="handleConfigChange(item.key, $event)"
          />
          
          <!-- 选择器 -->
          <el-select 
            v-else-if="item.type === 'select'" 
            v-model="getNestedValue(currentConfig, item.key)"
            @change="handleConfigChange(item.key, $event)"
            style="width: 100%"
          >
            <el-option 
              v-for="option in item.options" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value"
            />
          </el-select>
          
          <!-- 颜色选择器 -->
          <el-color-picker 
            v-else-if="item.type === 'color'" 
            v-model="getNestedValue(currentConfig, item.key)"
            @change="handleConfigChange(item.key, $event)"
          />
        </el-form-item>
      </el-form>
    </div>
    
    <div class="panel-footer">
      <span class="config-info">{{ Object.keys(currentConfig).length }} 项配置</span>
    </div>
  </div>
</template>

<style scoped>
.chart-config-panel {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.panel-body {
  padding: 16px;
  flex-grow: 1;
  overflow-y: auto;
}

.panel-footer {
  padding: 8px 16px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;
  color: #909399;
  font-size: 12px;
}

.config-info {
  opacity: 0.8;
}

:deep(.el-form-item__label) {
  padding-bottom: 4px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style> 