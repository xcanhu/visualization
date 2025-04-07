<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive } from 'vue'
import * as echarts from 'echarts'
import { useDataStore } from '../stores'
import { useWebSocket } from '../utils/websocket'
import { ElMessage, ElUpload, ElDialog } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'

// 获取数据存储
const dataStore = useDataStore()

// 图表容器引用
const chartContainer = ref<HTMLElement | null>(null)
// 图表实例
let lineChart: echarts.ECharts | null = null

// 图表数据
const chartData = ref<any[]>([])
// 图表类型
const chartType = ref<string>('line')
// 添加新的图表类型选项
const chartTheme = ref<string>('default')
// 是否显示实时数据
const realtime = ref<boolean>(true)
// 最大数据点数量
const maxDataPoints = ref<number>(20)
// 数据刷新速度(ms)
const refreshRate = ref<number>(2000)
// 是否显示标记点和标记线
const showMarkers = ref<boolean>(true)
// 是否显示多数据系列
const showMultipleSeries = ref<boolean>(false)
// 数据系列数量
const seriesCount = ref<number>(3)
// 是否显示数据标签
const showDataLabels = ref<boolean>(false)
// 是否显示堆叠效果
const enableStacking = ref<boolean>(false)
// 是否显示平滑曲线
const smoothLine = ref<boolean>(true)
// 添加动画持续时间
const animationDuration = ref<number>(1000)

// 多系列数据
const seriesData = ref<any[]>([])

// WebSocket连接状态
const wsStatus = ref<string>('未连接')
// 最后更新时间
const lastUpdateTime = ref<string>('')

// 文件上传相关
const fileUploadVisible = ref(false)
const uploadRef = ref()
const importSettings = reactive({
  headers: true,
  delimiter: ',',
  dataColumn: '',
  timeColumn: '',
  availableColumns: []
})

// 初始化图表
const initChart = () => {
  if (chartContainer.value) {
    // 创建图表实例
    lineChart = echarts.init(chartContainer.value)
    
    // 监听窗口大小变化，调整图表大小
    window.addEventListener('resize', handleResize)
    
    // 渲染初始图表
    renderChart()
  }
}

// 处理窗口大小变化
const handleResize = () => {
  lineChart?.resize()
}

// 初始化多系列数据
const initSeriesData = () => {
  seriesData.value = [];
  const seriesNames = ['系列A', '系列B', '系列C', '系列D', '系列E'];
  const seriesColors = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1'];
  
  for (let i = 0; i < seriesCount.value; i++) {
    seriesData.value.push({
      name: seriesNames[i],
      color: seriesColors[i],
      data: []
    });
  }
}

// 渲染图表
const renderChart = () => {
  if (!lineChart) return
  
  // 准备数据
  const xAxisData = chartData.value.map((item, index) => item.time || `点${index + 1}`)
  
  // 获取当前主题的颜色
  let themeColor = '#1890ff'
  if (chartTheme.value === 'dark') {
    themeColor = '#36cfc9'
  } else if (chartTheme.value === 'green') {
    themeColor = '#52c41a'
  } else if (chartTheme.value === 'red') {
    themeColor = '#f5222d'
  }
  
  // 图表配置
  const option: echarts.EChartsOption = {
    title: {
      text: '实时数据监控',
      left: 'center',
      textStyle: {
        color: chartTheme.value === 'dark' ? '#fff' : '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: themeColor
        }
      }
    },
    legend: {
      data: showMultipleSeries.value ? seriesData.value.map(series => series.name) : ['实时数据'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none'
        },
        saveAsImage: {},
        magicType: { type: ['line', 'bar', 'stack'] },
        restore: {}
      }
    },
    backgroundColor: chartTheme.value === 'dark' ? '#001529' : null,
    xAxis: {
      type: 'category',
      boundaryGap: chartType.value === 'bar',
      data: xAxisData,
      axisLine: {
        lineStyle: {
          color: chartTheme.value === 'dark' ? 'rgba(255,255,255,0.5)' : '#333'
        }
      },
      axisLabel: {
        color: chartTheme.value === 'dark' ? '#fff' : '#333'
      }
    },
    yAxis: {
      type: 'value',
      name: '数值',
      nameLocation: 'end',
      axisLine: {
        lineStyle: {
          color: chartTheme.value === 'dark' ? 'rgba(255,255,255,0.5)' : '#333'
        }
      },
      axisLabel: {
        color: chartTheme.value === 'dark' ? '#fff' : '#333'
      },
      splitLine: {
        lineStyle: {
          color: chartTheme.value === 'dark' ? 'rgba(255,255,255,0.1)' : '#eee'
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100
      }
    ],
    series: showMultipleSeries.value 
      ? seriesData.value.map((series, index) => ({
          name: series.name,
          type: chartType.value,
          stack: enableStacking.value ? '总量' : undefined,
          areaStyle: chartType.value === 'line' ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: `${series.color}cc`
              },
              {
                offset: 1,
                color: `${series.color}11`
              }
            ])
          } : null,
          emphasis: {
            focus: 'series'
          },
          data: series.data,
          markPoint: showMarkers ? {
            data: [
              { type: 'max', name: '最大值' },
              { type: 'min', name: '最小值' }
            ]
          } : undefined,
          markLine: showMarkers ? {
            data: [
              { type: 'average', name: '平均值' }
            ]
          } : undefined,
          smooth: smoothLine.value && chartType.value === 'line',
          lineStyle: {
            width: 3,
            color: series.color
          },
          itemStyle: {
            color: series.color
          },
          label: {
            show: showDataLabels.value,
            position: 'top',
            formatter: '{c}'
          },
          // 添加动画效果
          animationDuration: animationDuration.value,
          animationEasing: 'elasticOut'
        }))
      : [
          {
            name: '实时数据',
            type: chartType.value,
            stack: enableStacking.value ? '总量' : undefined,
            areaStyle: chartType.value === 'line' ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: `${themeColor}cc`
                },
                {
                  offset: 1,
                  color: `${themeColor}11`
                }
              ])
            } : null,
            emphasis: {
              focus: 'series'
            },
            data: chartData.value.map(item => item.value),
            markPoint: showMarkers ? {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            } : undefined,
            markLine: showMarkers ? {
              data: [
                { type: 'average', name: '平均值' }
              ]
            } : undefined,
            smooth: smoothLine.value && chartType.value === 'line',
            lineStyle: {
              width: 3,
              color: themeColor
            },
            itemStyle: {
              color: themeColor
            },
            label: {
              show: showDataLabels.value,
              position: 'top',
              formatter: '{c}'
            },
            // 添加动画效果
            animationDuration: animationDuration.value,
            animationEasing: 'elasticOut'
          }
        ]
  }
  
  // 根据图表类型添加特定配置
  if (chartType.value === 'scatter') {
    option.series.forEach(series => {
      series.symbolSize = 10;
    });
  } else if (chartType.value === 'pie') {
    option.series.forEach((series, index) => {
      series.radius = '60%';
      series.center = ['50%', '50%'];
      if (index === 0) {
        const pieData = showMultipleSeries.value 
          ? seriesData.value.map(s => ({ name: s.name, value: s.data.reduce((sum, val) => sum + val, 0) }))
          : xAxisData.map((time, i) => ({ name: time, value: chartData.value[i].value }));
        series.data = pieData;
      } else {
        series.show = false;
      }
    });
    delete option.xAxis;
    delete option.yAxis;
  }
  
  // 设置图表配置
  lineChart.setOption(option, true);
}

// 切换图表类型
const switchChartType = (type: string) => {
  chartType.value = type
  renderChart()
}

// 切换实时数据状态
const toggleRealtime = () => {
  realtime.value = !realtime.value
  if (realtime.value) {
    wsStatus.value = '已连接'
  } else {
    wsStatus.value = '已暂停'
  }
}

// 切换多数据系列
const toggleMultipleSeries = () => {
  showMultipleSeries.value = !showMultipleSeries.value;
  if (showMultipleSeries.value && seriesData.value.length === 0) {
    initSeriesData();
  }
  renderChart();
}

// 切换数据标签
const toggleDataLabels = () => {
  showDataLabels.value = !showDataLabels.value;
  renderChart();
}

// 切换堆叠效果
const toggleStacking = () => {
  enableStacking.value = !enableStacking.value;
  renderChart();
}

// 切换平滑曲线
const toggleSmoothLine = () => {
  smoothLine.value = !smoothLine.value;
  renderChart();
}

// 修改动画持续时间
const changeAnimationDuration = (duration: number) => {
  animationDuration.value = duration;
  renderChart();
}

// 修改数据系列数量
const changeSeriesCount = (count: number) => {
  seriesCount.value = count;
  initSeriesData();
  renderChart();
}

// 清空数据
const clearData = () => {
  chartData.value = []
  dataStore.setChartData([])
  renderChart()
}

// 更新图表数据
const updateChartData = (data: any) => {
  if (!realtime.value) return
  
  // 添加时间戳
  const now = new Date()
  const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
  
  // 创建新数据点
  const newDataPoint = {
    time: timeString,
    value: data.value || Math.round(Math.random() * 100)
  }
  
  // 更新数据数组
  chartData.value.push(newDataPoint)
  
  // 限制数据点数量
  if (chartData.value.length > maxDataPoints.value) {
    chartData.value.shift()
  }
  
  // 如果启用多系列
  if (showMultipleSeries.value) {
    // 为每个系列生成数据
    seriesData.value.forEach(series => {
      series.data.push(Math.round(Math.random() * 100));
      if (series.data.length > maxDataPoints.value) {
        series.data.shift();
      }
    });
  }
  
  // 更新状态存储
  dataStore.setChartData([...chartData.value])
  
  // 更新最后更新时间
  lastUpdateTime.value = timeString
  
  // 重新渲染图表
  renderChart()
}

// 初始化WebSocket连接
const { isConnected, lastMessage } = useWebSocket({
  // 实际项目中应该使用真实的WebSocket服务器地址
  url: 'ws://localhost:8080',
  onMessage: (data) => {
    updateChartData(data)
  },
  onOpen: () => {
    wsStatus.value = '已连接'
  },
  onClose: () => {
    wsStatus.value = '已断开'
  },
  onError: () => {
    wsStatus.value = '连接错误'
  }
})

// 监听WebSocket连接状态
watch(isConnected, (newValue) => {
  wsStatus.value = newValue ? '已连接' : '已断开'
})

// 监听最后收到的消息
watch(lastMessage, (newValue) => {
  if (newValue && realtime.value) {
    updateChartData(newValue)
  }
})

// 模拟数据更新（实际项目中应该通过WebSocket接收数据）
const startDataSimulation = () => {
  // 初始数据
  for (let i = 0; i < 5; i++) {
    updateChartData({ value: Math.round(Math.random() * 100) })
  }
  
  // 定时更新数据（模拟WebSocket数据）
  const timer = setInterval(() => {
    if (realtime.value) {
      updateChartData({ value: Math.round(Math.random() * 100) })
    }
  }, 2000)
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(timer)
  })
}

// 组件挂载时初始化
onMounted(() => {
  initChart()
  initSeriesData()
  startDataSimulation()
  
  // 显示新功能通知
  setTimeout(() => {
    ElMessage({
      message: '新功能：现在您可以导入自己的数据进行可视化！点击绿色的"导入数据"按钮试试吧。',
      type: 'success',
      duration: 8000,
      showClose: true
    })
  }, 2000)
})

// 组件卸载时清理资源
onUnmounted(() => {
  if (lineChart) {
    lineChart.dispose()
    lineChart = null
  }
  window.removeEventListener('resize', handleResize)
})

// 处理文件选择
const handleFileSelect = (file) => {
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const fileExt = file.name.split('.').pop().toLowerCase()
      
      if (fileExt === 'json') {
        // 处理JSON文件
        const jsonData = JSON.parse(e.target.result)
        processImportedData(jsonData)
      } else if (fileExt === 'csv') {
        // 处理CSV文件
        const csvData = parseCSV(e.target.result)
        processImportedData(csvData)
      } else {
        ElMessage.error('不支持的文件格式，请使用JSON或CSV文件')
      }
    } catch (error) {
      console.error('导入数据时出错:', error)
      ElMessage.error('导入数据时出错：' + error.message)
    }
  }
  
  reader.readAsText(file)
  return false // 阻止默认上传行为
}

// 解析CSV数据
const parseCSV = (csvText) => {
  const lines = csvText.split('\n')
  const result = []
  
  // 获取标题行
  const headers = lines[0].split(importSettings.delimiter).map(h => h.trim())
  importSettings.availableColumns = [...headers]
  
  // 如果没有选择列，默认使用第一列作为时间，第二列作为数据
  if (!importSettings.timeColumn && headers.length >= 1) {
    importSettings.timeColumn = headers[0]
  }
  if (!importSettings.dataColumn && headers.length >= 2) {
    importSettings.dataColumn = headers[1]
  }
  
  // 解析数据行
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue
    
    const values = lines[i].split(importSettings.delimiter).map(v => v.trim())
    const row = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    
    result.push(row)
  }
  
  return result
}

// 处理导入的数据
const processImportedData = (data) => {
  if (!Array.isArray(data)) {
    ElMessage.error('导入的数据必须是数组格式')
    return
  }
  
  try {
    // 清空现有数据
    chartData.value = []
    
    // 转换导入的数据为图表格式
    data.forEach(item => {
      const time = item[importSettings.timeColumn] || new Date().toLocaleTimeString()
      const value = parseFloat(item[importSettings.dataColumn]) || 0
      
      chartData.value.push({
        time: time,
        value: value
      })
    })
    
    // 更新数据存储
    dataStore.setChartData([...chartData.value])
    
    // 重新渲染图表
    renderChart()
    
    // 关闭对话框
    fileUploadVisible.value = false
    
    // 显示成功消息
    ElMessage.success(`成功导入 ${chartData.value.length} 条数据`)
    
  } catch (error) {
    console.error('处理导入数据时出错:', error)
    ElMessage.error('处理导入数据时出错：' + error.message)
  }
}
</script>

<template>
  <div class="chart-container">
    <div class="chart-header">
      <h2>实时数据监控</h2>
      <div class="chart-controls">
        <div class="control-group">
          <span class="control-label">图表类型:</span>
          <div class="control-buttons">
            <button 
              @click="switchChartType('line')" 
              :class="{ active: chartType === 'line' }"
            >
              折线图
            </button>
            <button 
              @click="switchChartType('bar')" 
              :class="{ active: chartType === 'bar' }"
            >
              柱状图
            </button>
          </div>
        </div>
        
        <div class="control-group">
          <button @click="fileUploadVisible = true" class="import-btn">
            <el-icon><Upload /></el-icon>
            导入数据
          </button>
        </div>
        
        <div class="control-group">
          <span class="control-label">实时数据:</span>
          <button 
            @click="toggleRealtime()" 
            :class="{ active: realtime }"
          >
            {{ realtime ? '暂停' : '开始' }}
          </button>
        </div>
        
        <div class="control-group">
          <span class="control-label">高级功能:</span>
          <div class="control-buttons">
            <button 
              @click="toggleMultipleSeries()" 
              :class="{ active: showMultipleSeries }"
            >
              {{ showMultipleSeries ? '单系列' : '多系列' }}
            </button>
            <button 
              @click="toggleDataLabels()" 
              :class="{ active: showDataLabels }"
            >
              {{ showDataLabels ? '隐藏标签' : '显示标签' }}
            </button>
            <button 
              @click="toggleStacking()" 
              :class="{ active: enableStacking }"
            >
              {{ enableStacking ? '取消堆叠' : '堆叠' }}
            </button>
            <button 
              @click="toggleSmoothLine()" 
              :class="{ active: smoothLine }"
            >
              {{ smoothLine ? '直线' : '平滑' }}
            </button>
          </div>
        </div>
        
        <div class="control-group" v-if="showMultipleSeries">
          <span class="control-label">系列数量:</span>
          <select @change="changeSeriesCount(Number($event.target.value))">
            <option v-for="n in 5" :key="n" :value="n" :selected="seriesCount === n">{{ n }}</option>
          </select>
        </div>
        
        <div class="control-group">
          <span class="control-label">动画:</span>
          <select @change="changeAnimationDuration(Number($event.target.value))">
            <option value="0">无动画</option>
            <option value="500">快速 (0.5秒)</option>
            <option value="1000" selected>中等 (1秒)</option>
            <option value="2000">慢速 (2秒)</option>
          </select>
        </div>
        
        <button @click="clearData()" class="clear-btn">
          清空数据
        </button>
      </div>
    </div>
    
    <div class="chart-body">
      <div class="loading-overlay" v-if="!chartData.length">
        <div class="loading-spinner"></div>
        <div>加载中...</div>
      </div>
      
      <div class="data-stats" v-if="chartData.length">
        <div class="stat-card">
          <div class="stat-label">最新数值</div>
          <div class="stat-value">{{ chartData.length ? chartData[chartData.length - 1].value : 0 }}</div>
          <div class="stat-time">{{ lastUpdateTime }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最大值</div>
          <div class="stat-value">{{ chartData.length ? Math.max(...chartData.map(d => d.value)) : 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最小值</div>
          <div class="stat-value">{{ chartData.length ? Math.min(...chartData.map(d => d.value)) : 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均值</div>
          <div class="stat-value">{{ chartData.length ? Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length) : 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">数据点</div>
          <div class="stat-value">{{ chartData.length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">实时状态</div>
          <div class="stat-value status" :class="{ active: realtime }">{{ wsStatus }}</div>
        </div>
      </div>
      
      <div ref="chartContainer" class="echarts-container"></div>
    </div>
    
    <!-- 添加文件上传对话框 -->
    <el-dialog
      v-model="fileUploadVisible"
      title="导入图表数据"
      width="500px"
    >
      <el-upload
        ref="uploadRef"
        action="#"
        :auto-upload="false"
        :on-change="handleFileSelect"
        :show-file-list="false"
        accept=".json,.csv,.xlsx"
        drag
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持JSON和CSV格式文件。<br>
            JSON数据应为包含时间和数值字段的数组。<br>
            CSV文件应包含标题行和数据行。<br>
            <div class="sample-links">
              示例文件下载: 
              <a href="/sample-data/sample-data.json" download>JSON示例</a> | 
              <a href="/sample-data/sample-data.csv" download>CSV示例</a> | 
              <a href="/sample-data/README.md" target="_blank">查看说明</a>
            </div>
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<style scoped>
.chart-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f2f5;
  color: #333;
}

.chart-header {
  background-color: white;
  padding: 15px 20px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.chart-header h2 {
  font-size: 1.5rem;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  color: #001529;
}

.chart-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 20px;
}

.control-label {
  font-weight: 500;
  color: #666;
  white-space: nowrap;
}

.control-buttons {
  display: flex;
  gap: 5px;
}

.control-buttons button {
  padding: 5px 10px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s;
  color: #666;
  font-size: 0.9rem;
}

.control-buttons button:hover {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.control-buttons button.active {
  background-color: #1890ff;
  border-color: #1890ff;
  color: white;
}

select {
  padding: 5px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  background-color: white;
}

.clear-btn {
  padding: 5px 15px;
  background-color: #ff4d4f;
  border: 1px solid #ff4d4f;
  border-radius: 2px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.clear-btn:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

.chart-body {
  flex: 1;
  position: relative;
  padding: 20px;
  overflow: hidden;
}

.echarts-container {
  width: 100%;
  height: calc(100% - 100px);
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.data-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  background-color: white;
  padding: 10px 15px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex: 1;
  min-width: 120px;
}

.stat-label {
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1890ff;
}

.stat-time {
  font-size: 0.8rem;
  color: #999;
  margin-top: 5px;
}

.stat-value.status {
  color: #ff4d4f;
}

.stat-value.status.active {
  color: #52c41a;
}

@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .control-group {
    margin-bottom: 10px;
  }
  
  .data-stats {
    flex-direction: column;
  }
  
  .stat-card {
    width: 100%;
  }
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 15px;
  background-color: #52c41a;
  border: 1px solid #52c41a;
  border-radius: 2px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.import-btn:hover {
  background-color: #73d13d;
  border-color: #73d13d;
}

.sample-links {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #1890ff;
}

.sample-links a {
  color: #1890ff;
  text-decoration: none;
}

.sample-links a:hover {
  text-decoration: underline;
}
</style>