<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import * as echarts from 'echarts'
import { useDataStore } from '../stores'
import service from '../utils/request'
import ThreeDMap from '../components/ThreeDMap.vue'
import ThreeDChart from '../components/ThreeDChart.vue'
import ChartSelector from '../components/ChartSelector.vue'
import DataSourceManager from '../components/DataSourceManager.vue'
import FileUploader from '../components/FileUploader.vue'
import { ElMessage } from 'element-plus'
import { Setting, Moon, Language, Upload, Refresh } from '@element-plus/icons-vue'

// 获取数据存储
const dataStore = useDataStore()

// 仪表盘容器引用
const pieChartRef = ref<HTMLElement | null>(null)
const gaugeChartRef = ref<HTMLElement | null>(null)
const barChartRef = ref<HTMLElement | null>(null)
const radarChartRef = ref<HTMLElement | null>(null)

// 图表实例
const pieChart = ref<echarts.ECharts | null>(null)
const gaugeChart = ref<echarts.ECharts | null>(null)
const barChart = ref<echarts.ECharts | null>(null)
const radarChart = ref<echarts.ECharts | null>(null)

// 仪表盘数据
const dashboardData = ref<any>({
  pieData: [],
  gaugeValue: 0,
  barData: [],
  radarData: [],
  mapData: []
})

// 加载状态
const loading = ref<boolean>(false)

// 当前主题
const currentTheme = ref<string>('blue')

// 当前语言
const currentLanguage = ref<string>('zh')

// 3D数据
const threeDData = ref<any[]>([])

// 数据源管理器可见性
const dataSourceManagerVisible = ref<boolean>(false)

// 当前选中的图表类型
const currentChartType = ref<string>('pie')

// 文件上传对话框可见性
const fileUploadVisible = ref<boolean>(false)

// 已上传的数据
const uploadedData = ref<any[]>([])

// 切换数据源管理器显示状态
const toggleDataSourceManager = () => {
  dataSourceManagerVisible.value = !dataSourceManagerVisible.value
}

// 处理图表类型变更
const handleChartTypeChange = (type: string) => {
  currentChartType.value = type
  // 根据选中的图表类型更新显示
  refreshData()
}

// 初始化仪表盘
const initDashboard = () => {
  // 初始化各个图表
  initPieChart()
  initGaugeChart()
  initBarChart()
  initRadarChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 加载仪表盘数据
  loadDashboardData()
}

// 处理窗口大小变化
const handleResize = () => {
  pieChart.value?.resize()
  gaugeChart.value?.resize()
  barChart.value?.resize()
  radarChart.value?.resize()
}

// 加载仪表盘数据
const loadDashboardData = async () => {
  loading.value = true
  try {
    // 获取当前选中的数据源
    const currentSource = dataStore.currentDataSource
    
    // 如果没有选择数据源，使用模拟数据
    if (!currentSource) {
      const { sharedWorkerService } = await import('../utils/workerService')
      
      // 模拟数据
      const mockData = {  // 修复对象结构缩进
        pieData: [
          { value: 1048, name: '搜索引擎' },
          { value: 735, name: '直接访问' },
          { value: 580, name: '邮件营销' },
          { value: 484, name: '联盟广告' },
          { value: 300, name: '视频广告' }
        ],
        gaugeValue: Math.round(Math.random() * 100),
        barData: [
          { name: '1月', value: Math.round(Math.random() * 1000) },
          { name: '2月', value: Math.round(Math.random() * 1000) },
          { name: '3月', value: Math.round(Math.random() * 1000) },
          { name: '4月', value: Math.round(Math.random() * 1000) },
          { name: '5月', value: Math.round(Math.random() * 1000) },
          { name: '6月', value: Math.round(Math.random() * 1000) }
        ],
        radarData: [
          {
            value: [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100],
            name: '预算分配'
          },
          {
            value: [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100],
            name: '实际开销'
          }
        ],
        mapData: [
          { name: '北京', value: Math.round(Math.random() * 1000) },
          { name: '上海', value: Math.round(Math.random() * 1000) },
          { name: '广东', value: Math.round(Math.random() * 1000) },
          { name: '江苏', value: Math.round(Math.random() * 1000) },
          { name: '浙江', value: Math.round(Math.random() * 1000) },
          { name: '山东', value: Math.round(Math.random() * 1000) }
        ]
      }  // 添加对象闭合括号
      
      // 生成3D数据
      const rawData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: Math.random() * 1000,
        category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      }))
      
      // 使用Web Worker处理大数据集
      const processedData = await sharedWorkerService.processTimeSeriesData(rawData, {
        groupBy: 'category',
        aggregation: 'sum'
      })
      
      // 转换为3D数据格式
      threeDData.value = processedData.map((item: any, index: number) => ({
        name: item.category,
        value: item.value,
        x: index * 10,
        y: item.value / 10,
        z: index * 5
      }))
      }  // 添加if语句闭合括号
      
      // 统一处理数据源（原if(currentSource)逻辑）
      if (currentSource) {
        // 从数据源获取数据
        const response = await service({
          url: currentSource.url,
          method: currentSource.method,
          params: currentSource.params,
          headers: currentSource.headers
        })
        
        // 处理数据路径
        let data = response.data
        if (currentSource.dataPath) {
          const paths = currentSource.dataPath.split('.')
          for (const path of paths) {
            data = data[path]
          }
        }
        
        // 根据图表类型格式化数据
        const formattedData = formatDataForChartType(data, currentChartType.value)
        dashboardData.value = formattedData
        dataStore.setDashboardData(formattedData)
        
        // 更新当前图表
        updateCurrentChart(formattedData)
      } else {
        // 使用模拟数据
        dashboardData.value = mockData
        dataStore.setDashboardData(mockData)
        
        // 更新各个图表
        updatePieChart(mockData.pieData)
        updateGaugeChart(mockData.gaugeValue)
        updateBarChart(mockData.barData)
        updateRadarChart(mockData.radarData)
      }
  } catch (error) {  // 修复括号位置
    console.error('加载仪表盘数据失败:', error)
  } finally {
    loading.value = false
  }
}  // 添加缺失的函数闭合括号

// 更新仪表盘数据
const updateGaugeChart = (value: number) => {
  if (!gaugeChart.value) return  // 添加.value检查
  
  const option: echarts.EChartsOption = {
    title: {
      text: '系统负载',
      left: 'center'
    },
    tooltip: {
      formatter: '{b}: {c}%'
    },
    series: [
      {
        name: '系统负载',
        type: 'gauge',
        detail: {
          formatter: '{value}%',
          fontSize: 16
        },
        data: [{ value: value, name: '负载率' }],
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
  
  gaugeChart.setOption(option)
}

// 更新柱状图数据
const updateBarChart = (data: any[]) => {
  if (!barChart.value) return  // 添加.value检查
  
  const option: echarts.EChartsOption = {
    title: {
      text: '月度数据统计',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: data.map(item => item.name),
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '数值',
        type: 'bar',
        barWidth: '60%',
        data: data.map(item => item.value),
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
  
  barChart.setOption(option)
}

// 更新雷达图数据
const updateRadarChart = (data: any[]) => {
  if (!radarChart.value) return  // 添加.value检查
  
  const option: echarts.EChartsOption = {
    title: {
      text: '预算与开销',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: ['预算分配', '实际开销']
    },
    radar: {
      indicator: [
        { name: '销售', max: 100 },
        { name: '管理', max: 100 },
        { name: '信息技术', max: 100 },
        { name: '客服', max: 100 },
        { name: '研发', max: 100 }
      ]
    },
    series: [
      {
        name: '预算 vs 开销',
        type: 'radar',
        data: data
      }
    ]
  }
  
  radarChart.setOption(option)
}

// 刷新仪表盘数据
const refreshData = () => {
  loadDashboardData()
}

// 生命周期钩子
onMounted(() => {
  initDashboard()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 销毁图表实例
  pieChart.value?.dispose()
  gaugeChart.value?.dispose()
  barChart.value?.dispose()
  radarChart.value?.dispose()
})

// 组件挂载时初始化
onMounted(() => {
  initDashboard()
  
  // 定时刷新数据（实际项目中可能不需要）
  const timer = setInterval(() => {
    refreshData()
  }, 10000)
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(timer)
  })
})

// 组件卸载时清理资源
onUnmounted(() => {
  if (pieChart) pieChart.dispose()
  if (gaugeChart) gaugeChart.dispose()
  if (barChart) barChart.dispose()
  if (radarChart) radarChart.dispose()
  
  window.removeEventListener('resize', handleResize)
})

// 初始化饼图
const initPieChart = () => {
  if (pieChartRef.value) {
    pieChart.value = echarts.init(pieChartRef.value)
    pieChart.value.setOption({
      title: {
        text: '数据分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: []
      },
      series: [
        {
          name: '数据分布',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '20',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: []
        }
      ]
    })
  }
}

// 更新饼图数据
const updatePieChart = (data: any[]) => {
  if (!pieChart.value) return
  
  const option: echarts.EChartsOption = {
    legend: {
      data: data.map(item => item.name)
    },
    series: [
      {
        data: data.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            // 为每个扇区设置渐变色
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colorGradients[Math.floor(Math.random() * colorGradients.length)][0] },
              { offset: 1, color: colorGradients[Math.floor(Math.random() * colorGradients.length)][1] }
            ])
          }
        }))
      }
    ]
  }
  
  pieChart.value.setOption(option)
  
  // 添加点击事件
  pieChart.value.off('click')
  pieChart.value.on('click', (params) => {
    // 点击饼图扇区时展示详细数据
    showDetailModal(`${params.name}的详细数据`, {
      name: params.name,
      value: params.value,
      percentage: params.percent,
      // 模拟详细数据
      details: {
        trends: Array.from({ length: 12 }, () => Math.round(Math.random() * 100)),
        growth: (Math.random() * 30 - 15).toFixed(2) + '%',
        forecast: Math.round(params.value * (1 + Math.random() * 0.5))
      }
    })
  })
}

// 定义渐变色系列
const colorGradients = [
  ['#36D1DC', '#5B86E5'],
  ['#FF9966', '#FF5E62'],
  ['#56CCF2', '#2F80ED'],
  ['#F2994A', '#F2C94C'],
  ['#00F260', '#0575E6'],
  ['#fc00ff', '#00dbde'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140']
]

// 详细数据弹窗
const detailModalVisible = ref(false)
const detailModalTitle = ref('')
const detailModalData = ref(null)

// 显示详细数据弹窗
const showDetailModal = (title: string, data: any) => {
  detailModalTitle.value = title
  detailModalData.value = data
  detailModalVisible.value = true
}

// 关闭详细数据弹窗
const closeDetailModal = () => {
  detailModalVisible.value = false
}

// 添加数据比较功能
const comparisonData = ref({
  category1: null,
  category2: null,
  showComparison: false
})

// 选择比较数据
const selectComparisonData = (category: string, index: number) => {
  if (index === 1) {
    comparisonData.value.category1 = category
  } else {
    comparisonData.value.category2 = category
  }
  
  if (comparisonData.value.category1 && comparisonData.value.category2) {
    comparisonData.value.showComparison = true
    renderComparisonChart()
  }
}

// 取消比较
const cancelComparison = () => {
  comparisonData.value.showComparison = false
  comparisonData.value.category1 = null
  comparisonData.value.category2 = null
}

// 渲染比较图表
const renderComparisonChart = () => {
  // 在此处实现比较图表逻辑
  // 实际项目中应从数据中获取相应类别的详细数据进行比较
}

// 趋势数据
const trendData = ref([])
const trendChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null

// 初始化趋势图表
const initTrendChart = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    
    // 生成模拟趋势数据
    generateTrendData()
    
    const option: echarts.EChartsOption = {
      title: {
        text: '数据趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['实际值', '预测值'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 24 }, (_, i) => `${i}:00`)
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '实际值',
          type: 'line',
          data: trendData.value.slice(0, 18),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 3,
            color: '#1890ff'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(24, 144, 255, 0.4)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
            ])
          }
        },
        {
          name: '预测值',
          type: 'line',
          data: Array(18).fill(null).concat(trendData.value.slice(18)),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 3,
            type: 'dashed',
            color: '#52c41a'
          }
        }
      ]
    }
    
    trendChart.setOption(option)
  }
}

// 生成趋势数据
const generateTrendData = () => {
  trendData.value = Array.from({ length: 24 }, () => Math.round(Math.random() * 100 + 50))
}

// 更新趋势图表
const updateTrendChart = () => {
  if (!trendChart) return
  
  // 更新趋势数据
  generateTrendData()
  
  const option: echarts.EChartsOption = {
    series: [
      {
        data: trendData.value.slice(0, 18)
      },
      {
        data: Array(18).fill(null).concat(trendData.value.slice(18))
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 组件挂载时初始化
onMounted(() => {
  initDashboard()
  initTrendChart()
  
  if (autoRefresh.value) {
    startAutoRefresh()
  }
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(timer)
  })
})

// 处理数据上传
const handleDataUploaded = (data: any) => {
  // 显示成功提示
  ElMessage.success('数据上传成功')
  
  // 关闭对话框
  fileUploadVisible.value = false
  
  // 解析数据
  if (data && typeof data === 'object') {
    // 更新仪表盘数据
    dashboardData.value = {
      ...dashboardData.value,
      ...data
    }
    
    // 更新数据存储
    dataStore.setDashboardData(dashboardData.value)
  }
}

// 根据图表类型格式化数据
const formatDataForChartType = (data: any[], chartType: string) => {
  const result: any = {}
  
  try {
    switch (chartType) {
      case 'pie':
        // 处理饼图数据：需要有name和value字段
        result.pieData = data.map(item => {
          // 如果已经有正确的格式
          if (item.name && (item.value !== undefined)) {
            return {
              name: item.name,
              value: Number(item.value)
            }
          }
          
          // 尝试查找合适的字段
          const keys = Object.keys(item)
          let nameKey = keys.find(k => typeof item[k] === 'string' && item[k].length > 0)
          let valueKey = keys.find(k => !isNaN(Number(item[k])) && k !== nameKey)
          
          if (nameKey && valueKey) {
            return {
              name: item[nameKey],
              value: Number(item[valueKey])
            }
          }
          
          // 兜底方案
          return {
            name: `类别${data.indexOf(item) + 1}`,
            value: Math.round(Math.random() * 1000)
          }
        })
        break
        
      case 'bar':
        // 处理柱状图数据：需要有name和value字段
        result.barData = data.map(item => {
          // 如果已经有正确的格式
          if (item.name && (item.value !== undefined)) {
            return {
              name: item.name,
              value: Number(item.value)
            }
          }
          
          // 尝试查找合适的字段
          const keys = Object.keys(item)
          let nameKey = keys.find(k => typeof item[k] === 'string' && item[k].length > 0)
          let valueKey = keys.find(k => !isNaN(Number(item[k])) && k !== nameKey)
          
          if (nameKey && valueKey) {
            return {
              name: item[nameKey],
              value: Number(item[valueKey])
            }
          }
          
          // 兜底方案
          return {
            name: `类别${data.indexOf(item) + 1}`,
            value: Math.round(Math.random() * 1000)
          }
        })
        break
        
      case 'gauge':
        // 仪表盘只需要一个值，取平均值或第一个值
        if (data.length > 0) {
          if (data[0].value !== undefined) {
            result.gaugeValue = Number(data[0].value)
          } else {
            // 寻找数字类型的字段
            const keys = Object.keys(data[0])
            const valueKey = keys.find(k => !isNaN(Number(data[0][k])))
            
            if (valueKey) {
              result.gaugeValue = Number(data[0][valueKey])
            } else {
              // 兜底方案：随机值
              result.gaugeValue = Math.round(Math.random() * 100)
            }
          }
        }
        break
        
      case 'radar':
        // 处理雷达图数据：需要有value数组和name字段
        result.radarData = []
        
        // 提取所有维度
        const dimensions = new Set<string>()
        data.forEach(item => {
          Object.keys(item).forEach(key => {
            if (key !== 'name' && key !== 'value' && !isNaN(Number(item[key]))) {
              dimensions.add(key)
            }
          })
        })
        
        // 如果有分类字段
        const categoryField = Object.keys(data[0]).find(key => 
          typeof data[0][key] === 'string' && 
          key !== 'name' && 
          data.some(d => d[key] !== data[0][key])
        )
        
        if (categoryField) {
          // 按分类生成雷达图数据
          const categories = [...new Set(data.map(item => item[categoryField]))]
          
          categories.forEach(category => {
            const categoryData = {
              name: category,
              value: Array.from(dimensions).map(dim => {
                const items = data.filter(item => item[categoryField] === category)
                const values = items.map(item => Number(item[dim] || 0))
                return values.reduce((a, b) => a + b, 0) / values.length
              })
            }
            result.radarData.push(categoryData)
          })
        } else {
          // 无分类字段，生成一组数据
          result.radarData = [{
            name: '数据',
            value: Array.from(dimensions).map(dim => {
              const values = data.map(item => Number(item[dim] || 0))
              return values.reduce((a, b) => a + b, 0) / values.length
            })
          }]
        }
        break
        
      default:
        // 默认格式化为饼图数据
        result.pieData = data.map(item => ({
          name: item.name || `类别${data.indexOf(item) + 1}`,
          value: item.value || Math.round(Math.random() * 1000)
        }))
    }
  } catch (error) {
    console.error('格式化数据失败:', error)
    ElMessage.error('数据格式化失败，将使用默认值')
  }
  
  return result
}

// 更新当前图表
const updateCurrentChart = (data: any) => {
  switch (currentChartType.value) {
    case 'pie':
      if (data.pieData) updatePieChart(data.pieData)
      break
    case 'gauge':
      if (data.gaugeValue !== undefined) updateGaugeChart(data.gaugeValue)
      break
    case 'bar':
      if (data.barData) updateBarChart(data.barData)
      break
    case 'radar':
      if (data.radarData) updateRadarChart(data.radarData)
      break
  }
}
</script>

<template>
  <div class="dashboard" :class="currentTheme">
    <!-- 仪表盘头部 -->
    <div class="dashboard-header">
      <h1 class="dashboard-title">数据可视化仪表盘</h1>
      <div class="dashboard-controls">
        <el-button-group>
          <el-button 
            type="primary" 
            @click="toggleDataSourceManager"
          >
            {{ dataSourceManagerVisible ? '关闭数据源' : '数据源管理' }}
          </el-button>
          <el-button 
            type="success" 
            @click="fileUploadVisible = true"
          >
            导入图表数据
          </el-button>
          <el-button 
            type="primary" 
            @click="refreshData"
          >
            刷新数据
          </el-button>
        </el-button-group>
        
        <el-select v-model="currentTheme" placeholder="选择主题">
          <el-option label="蓝色主题" value="blue" />
          <el-option label="深色主题" value="dark" />
          <el-option label="浅色主题" value="light" />
        </el-select>
      </div>
    </div>
    
    <!-- 控制面板 -->
    <div class="control-panel">
      <el-button-group>
        <el-button @click="toggleDataSourceManager" type="primary" size="small">
          <el-icon><setting /></el-icon>
          数据源管理
        </el-button>
        <el-button @click="fileUploadVisible = true" type="success" size="small">
          <el-icon><upload /></el-icon>
          导入图表数据
        </el-button>
        <el-button @click="currentTheme = currentTheme === 'blue' ? 'dark' : 'blue'" type="primary" size="small">
          <el-icon><moon /></el-icon>
          切换主题
        </el-button>
        <el-button @click="currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh'" type="primary" size="small">
          <el-icon><language /></el-icon>
          切换语言
        </el-button>
      </el-button-group>
      
      <!-- 图表选择器 -->
      <div class="chart-selector-container">
        <ChartSelector
          v-model="currentChartType"
          @change="handleChartTypeChange"
        />
      </div>
    </div>
    
    <!-- 数据源管理器 -->
    <DataSourceManager
      v-if="dataSourceManagerVisible"
      @close="dataSourceManagerVisible = false"
    />
    
    <!-- 加载状态 -->
    <div class="loading-overlay" v-if="loading">
      <div class="loading-spinner"></div>
      <div>{{ $t('dashboard.loading') }}</div>
    </div>
    
    <div class="dashboard-content">
      <!-- 数据卡片 -->
      <div class="data-card">
        <div class="data-card-header">
          <h3>系统概览</h3>
          <div class="card-controls">
            <button @click="refreshData">刷新</button>
          </div>
        </div>
        <div class="data-card-body">
          <div class="stat-box">
            <div class="stat-value">{{ dashboardData.gaugeValue }}%</div>
            <div class="stat-label">系统负载</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">{{ dashboardData.barData?.length || 0 }}</div>
            <div class="stat-label">数据维度</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">{{ threeDData.length }}</div>
            <div class="stat-label">记录总数</div>
          </div>
        </div>
      </div>
      
      <!-- 趋势图 -->
      <div class="data-card">
        <div class="data-card-header">
          <h3>实时趋势</h3>
          <div class="card-controls">
            <button @click="updateTrendChart">刷新</button>
          </div>
        </div>
        <div class="data-card-body">
          <div ref="trendChartRef" class="chart-area"></div>
        </div>
      </div>
      
      <!-- 饼图 -->
      <div class="data-card">
        <div class="data-card-header">
          <h3>数据分布</h3>
          <div class="card-controls">
            <button @click="refreshData">刷新</button>
          </div>
        </div>
        <div class="data-card-body">
          <div ref="pieChartRef" class="chart-area"></div>
        </div>
      </div>
      
      <!-- 仪表盘 -->
      <div class="data-card">
        <div class="data-card-header">
          <h3>系统负载</h3>
        </div>
        <div class="data-card-body">
          <div ref="gaugeChartRef" class="chart-area"></div>
        </div>
      </div>
      
      <!-- 柱状图 -->
      <div class="data-card">
        <div class="data-card-header">
          <h3>月度统计</h3>
        </div>
        <div class="data-card-body">
          <div ref="barChartRef" class="chart-area"></div>
        </div>
      </div>
      
      <!-- 雷达图 -->
      <div class="data-card">
        <div class="data-card-header">
          <h3>多维分析</h3>
        </div>
        <div class="data-card-body">
          <div ref="radarChartRef" class="chart-area"></div>
        </div>
      </div>
    </div>
    
    <!-- 详细数据弹窗 -->
    <div v-if="detailModalVisible" class="detail-modal">
      <div class="detail-modal-content">
        <div class="detail-modal-header">
          <h3>{{ detailModalTitle }}</h3>
          <button class="close-btn" @click="closeDetailModal">×</button>
        </div>
        <div class="detail-modal-body" v-if="detailModalData">
          <div class="detail-info">
            <div class="detail-item">
              <div class="detail-label">名称</div>
              <div class="detail-value">{{ detailModalData.name }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">数值</div>
              <div class="detail-value">{{ detailModalData.value }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">占比</div>
              <div class="detail-value">{{ detailModalData.percentage }}%</div>
            </div>
          </div>
          
          <div class="detail-section" v-if="detailModalData.details">
            <h4>详细分析</h4>
            <div class="trend-chart">
              <div class="trend-bar" v-for="(value, index) in detailModalData.details.trends" :key="index"
                   :style="{ height: `${value}%` }" :title="`${index+1}月: ${value}`">
              </div>
            </div>
            <div class="detail-metrics">
              <div class="metric-item">
                <div class="metric-label">增长率</div>
                <div class="metric-value" :class="{'positive': parseFloat(detailModalData.details.growth) > 0, 'negative': parseFloat(detailModalData.details.growth) < 0}">
                  {{ detailModalData.details.growth }}
                </div>
              </div>
              <div class="metric-item">
                <div class="metric-label">预测值</div>
                <div class="metric-value">{{ detailModalData.details.forecast }}</div>
              </div>
            </div>
          </div>
          
          <div class="detail-actions">
            <button @click="selectComparisonData(detailModalData.name, 1)" 
                    :disabled="comparisonData.category1 === detailModalData.name">
              选为比较项1
            </button>
            <button @click="selectComparisonData(detailModalData.name, 2)"
                    :disabled="comparisonData.category2 === detailModalData.name">
              选为比较项2
            </button>
            <button v-if="comparisonData.showComparison" @click="cancelComparison">
              取消比较
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 文件导入对话框 -->
    <el-dialog
      v-model="fileUploadVisible"
      title="导入图表数据"
      width="600px"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      :show-close="true"
      @close="fileUploadVisible = false"
      modal-append-to-body
    >
      <div v-if="fileUploadVisible">
        <FileUploader
          :allowed-types="['json', 'csv', 'xlsx', 'xls']"
          @data-loaded="handleDataUploaded"
        />
        <div class="upload-tips">
          <p>提示:</p>
          <ul>
            <li>根据当前图表类型，导入的数据需要包含特定字段:</li>
            <li>饼图/柱状图: 需要包含name和value字段</li>
            <li>仪表盘: 需要包含一个数值字段</li>
            <li>雷达图: 需要包含多个数值字段和一个分类字段</li>
            <li>支持的格式: JSON, CSV, Excel</li>
            <li>示例格式: [{"name": "类别1", "value": 100}, {"name": "类别2", "value": 200}]</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click.stop="fileUploadVisible = false">取消</el-button>
          <el-button type="primary" @click.stop="fileUploadVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.dashboard {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background-color: #001529;
  color: white;
  overflow: hidden;
}

.dashboard.dark {
  background-color: #000;
}

.dashboard.blue {
  background-color: #001529;
}

/* 控制面板 */
.control-panel {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  max-width: 1200px;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 8px;
}

/* 内容区域 */
.dashboard-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px;
  height: 100%;
  padding-top: 80px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 数据卡片 */
.data-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  height: 400px;
  display: flex;
  flex-direction: column;
}

.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.data-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.data-card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.card-controls button {
  padding: 4px 12px;
  background: rgba(24, 144, 255, 0.2);
  border: 1px solid rgba(24, 144, 255, 0.5);
  border-radius: 4px;
  color: #1890ff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-controls button:hover {
  background: rgba(24, 144, 255, 0.3);
  border-color: #1890ff;
}

.data-card-body {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.chart-area {
  width: 100%;
  height: 100%;
  min-height: 220px;
}

/* 统计框 */
.stat-box {
  text-align: center;
  padding: 15px;
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

/* 详情弹窗 */
.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-modal-content {
  width: 80%;
  max-width: 800px;
  background: #001529;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.detail-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: white;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: white;
}

.detail-modal-body {
  padding: 20px;
}

.detail-info {
  display: flex;
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 15px;
}

.detail-item {
  flex: 1;
  text-align: center;
}

.detail-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.detail-value {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.trend-chart {
  display: flex;
  height: 150px;
  align-items: flex-end;
  gap: 5px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.trend-bar {
  flex: 1;
  background: linear-gradient(180deg, #1890ff, #0050b3);
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease;
  min-height: 2px;
}

.detail-metrics {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.metric-item {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.metric-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
}

.metric-value.positive {
  color: #52c41a;
}

.metric-value.negative {
  color: #f5222d;
}

.detail-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.detail-actions button {
  padding: 8px 16px;
  background: rgba(24, 144, 255, 0.2);
  border: 1px solid rgba(24, 144, 255, 0.5);
  border-radius: 4px;
  color: #1890ff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.detail-actions button:hover {
  background: rgba(24, 144, 255, 0.3);
  border-color: #1890ff;
}

.detail-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .control-panel {
    flex-direction: column;
    gap: 10px;
  }
  
  .data-card {
    height: 350px;
  }
}

.upload-tips {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
  color: #333;
}

.upload-tips ul {
  padding-left: 20px;
  margin: 5px 0;
}

.upload-tips li {
  margin-bottom: 5px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #e8eaec;
  margin-bottom: 20px;
  border-radius: 4px;
}

.dashboard-title {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.dashboard-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}
</style>