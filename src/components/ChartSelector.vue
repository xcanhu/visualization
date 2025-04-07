<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue'

// 图表类型分组
const chartGroups = [
  {
    id: 'basic',
    name: '基础图表',
    charts: [
      { value: 'pie', label: '饼图', icon: 'pie-chart' },
      { value: 'bar', label: '柱状图', icon: 'bar-chart' },
      { value: 'line', label: '折线图', icon: 'line-chart' },
      { value: 'scatter', label: '散点图', icon: 'scatter-chart' },
      { value: 'area', label: '面积图', icon: 'area-chart' },
    ]
  },
  {
    id: 'statistic',
    name: '统计图表',
    charts: [
      { value: 'gauge', label: '仪表盘', icon: 'gauge' },
      { value: 'radar', label: '雷达图', icon: 'radar-chart' },
      { value: 'funnel', label: '漏斗图', icon: 'funnel-chart' },
      { value: 'tree', label: '树图', icon: 'tree-chart' },
      { value: 'sunburst', label: '旭日图', icon: 'sunburst-chart' },
      { value: 'sankey', label: '桑基图', icon: 'sankey-chart' },
    ]
  },
  {
    id: '3d',
    name: '3D图表',
    charts: [
      { value: 'bar3d', label: '3D柱状图', icon: 'bar-chart-3d' },
      { value: 'scatter3d', label: '3D散点图', icon: 'scatter-chart-3d' },
      { value: 'surface3d', label: '3D曲面', icon: 'surface-chart' },
      { value: 'map3d', label: '3D地图', icon: 'map-3d' },
      { value: 'globe3d', label: '3D地球', icon: 'globe-3d' }
    ]
  },
  {
    id: 'map',
    name: '地图',
    charts: [
      { value: 'map', label: '区域地图', icon: 'map' },
      { value: 'heatmap', label: '热力图', icon: 'heatmap' },
      { value: 'flowmap', label: '流向图', icon: 'flow-map' },
      { value: 'geojson', label: 'GeoJSON', icon: 'geo-json' }
    ]
  },
  {
    id: 'special',
    name: '特殊图表',
    charts: [
      { value: 'wordcloud', label: '词云图', icon: 'cloud' },
      { value: 'timeline', label: '时间线', icon: 'timeline' },
      { value: 'calendar', label: '日历图', icon: 'calendar' },
      { value: 'treemap', label: '矩形树图', icon: 'tree-map' },
      { value: 'graph', label: '关系图', icon: 'relation' }
    ]
  }
]

// 平铺的图表类型列表（用于兼容性）
const chartTypes = computed(() => {
  return chartGroups.flatMap(group => group.charts)
})

// 组件属性
const props = defineProps({
  // 当前选中的图表类型
  modelValue: {
    type: String,
    default: 'pie'
  },
  // 是否显示标签
  showLabel: {
    type: Boolean,
    default: true
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否分组显示
  grouped: {
    type: Boolean,
    default: true
  },
  // 布局方式：grid或list
  layout: {
    type: String,
    default: 'grid'
  }
})

// 当前活跃的分组
const activeGroup = ref('basic')

// 定义事件
const emit = defineEmits(['update:modelValue', 'change'])

// 选择图表类型
const selectChartType = (type: string) => {
  if (props.disabled) return
  emit('update:modelValue', type)
  emit('change', type)
}

// 切换分组
const switchGroup = (groupId: string) => {
  activeGroup.value = groupId
}

// 获取当前图表的描述
const getChartDescription = (chartType: string) => {
  const descriptions = {
    'pie': '用于显示数据各项的占比情况',
    'bar': '用于比较不同类别的数据大小',
    'line': '用于显示数据随时间变化的趋势',
    'scatter': '用于显示数据的分布关系',
    'gauge': '用于显示某个指标的进度或实时数据',
    'radar': '用于显示多维度数据的对比',
    'bar3d': '立体柱状图，提供3D视觉效果',
    'map': '在地图上展示数据的地理分布',
    'heatmap': '用于显示数据的密度和分布热点'
    // 可以继续添加其他图表类型的描述
  }
  return descriptions[chartType] || '可视化数据的图表类型'
}
</script>

<template>
  <!-- 分组标签（仅当grouped为true时显示） -->
  <div v-if="grouped" class="chart-group-tabs">
    <div 
      v-for="group in chartGroups" 
      :key="group.id"
      class="chart-group-tab" 
      :class="{ active: activeGroup === group.id }"
      @click="switchGroup(group.id)"
    >
      {{ group.name }}
    </div>
  </div>
  
  <!-- 图表选择器容器 -->
  <div 
    class="chart-selector" 
    :class="{ 'list-layout': layout === 'list' }"
  >
    <template v-if="grouped">
      <!-- 分组显示模式 -->
      <div 
        v-for="group in chartGroups.filter(g => g.id === activeGroup)" 
        :key="group.id"
        class="chart-group"
      >
        <div 
          v-for="type in group.charts" 
          :key="type.value"
          class="chart-type-item"
          :class="{ active: modelValue === type.value, disabled: disabled }"
          @click="selectChartType(type.value)"
        >
          <div class="chart-icon">
            <el-icon>
              <component :is="type.icon"></component>
            </el-icon>
          </div>
          <div v-if="showLabel" class="chart-label">{{ type.label }}</div>
          <div v-if="modelValue === type.value" class="chart-description">
            {{ getChartDescription(type.value) }}
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <!-- 非分组模式，显示所有图表 -->
      <div 
        v-for="type in chartTypes" 
        :key="type.value"
        class="chart-type-item"
        :class="{ active: modelValue === type.value, disabled: disabled }"
        @click="selectChartType(type.value)"
      >
        <div class="chart-icon">
          <el-icon>
            <component :is="type.icon"></component>
          </el-icon>
        </div>
        <div v-if="showLabel" class="chart-label">{{ type.label }}</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chart-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 15px;
}

.chart-selector.list-layout {
  flex-direction: column;
  gap: 8px;
}

.chart-selector.list-layout .chart-type-item {
  flex-direction: row;
  justify-content: flex-start;
  width: 100%;
  height: auto;
  padding: 8px 12px;
}

.chart-selector.list-layout .chart-icon {
  margin-right: 12px;
  margin-bottom: 0;
}

.chart-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.chart-group-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.chart-group-tab {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.chart-group-tab:hover {
  color: #409EFF;
}

.chart-group-tab.active {
  color: #409EFF;
  border-bottom-color: #409EFF;
}

.chart-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 92px;
  height: 96px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.chart-type-item:hover {
  border-color: #409EFF;
  background-color: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-type-item.active {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.chart-type-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chart-icon {
  font-size: 28px;
  margin-bottom: 8px;
  color: #606266;
}

.chart-type-item.active .chart-icon {
  color: #409EFF;
}

.chart-label {
  font-size: 13px;
  color: #606266;
}

.chart-type-item.active .chart-label {
  color: #409EFF;
  font-weight: 500;
}

.chart-description {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px;
  font-size: 12px;
  color: #fff;
  background-color: rgba(64, 158, 255, 0.9);
  text-align: center;
  opacity: 0;
  transform: translateY(100%);
  transition: all 0.3s;
}

.chart-type-item.active:hover .chart-description {
  opacity: 1;
  transform: translateY(0);
}
</style>