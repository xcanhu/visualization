<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useRouter, useRoute } from 'vue-router'

// 路由
const router = useRouter()
const route = useRoute()

// 图表容器引用
const coverageChartRef = ref<HTMLElement | null>(null)
const testResultChartRef = ref<HTMLElement | null>(null)
const testHistoryChartRef = ref<HTMLElement | null>(null)
const performanceChartRef = ref<HTMLElement | null>(null)

// 图表实例
let coverageChart: echarts.ECharts | null = null
let testResultChart: echarts.ECharts | null = null
let testHistoryChart: echarts.ECharts | null = null
let performanceChart: echarts.ECharts | null = null

// 测试数据
const testData = ref({
  coverage: {
    statements: 75.8,
    branches: 68.2,
    functions: 82.5,
    lines: 76.3
  },
  results: {
    passed: 128,
    failed: 12,
    skipped: 5,
    total: 145
  },
  history: [
    { date: '2023-06-01', coverage: 65.2, passed: 110, failed: 25 },
    { date: '2023-06-15', coverage: 68.7, passed: 115, failed: 20 },
    { date: '2023-07-01', coverage: 72.1, passed: 120, failed: 18 },
    { date: '2023-07-15', coverage: 74.5, passed: 125, failed: 15 },
    { date: '2023-08-01', coverage: 76.3, passed: 128, failed: 12 }
  ],
  performance: {
    loadTime: 1250,
    renderTime: 850,
    testExecutionTime: 3200,
    memoryUsage: 128.5
  }
})

// 当前选择的测试套件
const selectedSuite = ref('all')

// 测试套件列表
const testSuites = ref([
  { id: 'all', name: '所有测试' },
  { id: 'unit', name: '单元测试' },
  { id: 'component', name: '组件测试' },
  { id: 'e2e', name: '端到端测试' },
  { id: 'performance', name: '性能测试' }
])

// 测试详情
const testDetail = ref({
  id: '',
  name: '主页面渲染测试',
  status: 'passed',
  duration: 1250,
  startTime: '2023-08-01 14:30:25',
  endTime: '2023-08-01 14:30:26',
  assertions: 12,
  errors: [],
  logs: [
    { level: 'info', message: '开始测试主页面渲染', timestamp: '2023-08-01 14:30:25' },
    { level: 'info', message: '验证导航菜单项数量', timestamp: '2023-08-01 14:30:25' },
    { level: 'info', message: '验证页面标题', timestamp: '2023-08-01 14:30:25' },
    { level: 'info', message: '验证背景动画效果', timestamp: '2023-08-01 14:30:26' },
    { level: 'info', message: '测试完成', timestamp: '2023-08-01 14:30:26' }
  ]
})

// 是否显示详情页
const showDetail = ref(false)

// 初始化覆盖率图表
const initCoverageChart = () => {
  if (!coverageChartRef.value) return
  
  coverageChart = echarts.init(coverageChartRef.value)
  
  const option = {
    title: {
      text: '测试覆盖率',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    yAxis: {
      type: 'category',
      data: ['语句', '分支', '函数', '行']
    },
    series: [
      {
        name: '覆盖率',
        type: 'bar',
        data: [
          testData.value.coverage.statements,
          testData.value.coverage.branches,
          testData.value.coverage.functions,
          testData.value.coverage.lines
        ],
        itemStyle: {
          color: function(params: any) {
            const value = params.value
            if (value < 60) return '#F56C6C'
            if (value < 80) return '#E6A23C'
            return '#67C23A'
          }
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%'
        }
      }
    ]
  }
  
  coverageChart.setOption(option)
}

// 初始化测试结果图表
const initTestResultChart = () => {
  if (!testResultChartRef.value) return
  
  testResultChart = echarts.init(testResultChartRef.value)
  
  const option = {
    title: {
      text: '测试结果',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: ['通过', '失败', '跳过']
    },
    series: [
      {
        name: '测试结果',
        type: 'pie',
        radius: '60%',
        center: ['50%', '60%'],
        data: [
          { value: testData.value.results.passed, name: '通过', itemStyle: { color: '#67C23A' } },
          { value: testData.value.results.failed, name: '失败', itemStyle: { color: '#F56C6C' } },
          { value: testData.value.results.skipped, name: '跳过', itemStyle: { color: '#909399' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {c} ({d}%)'
        }
      }
    ]
  }
  
  testResultChart.setOption(option)
}

// 初始化测试历史图表
const initTestHistoryChart = () => {
  if (!testHistoryChartRef.value) return
  
  testHistoryChart = echarts.init(testHistoryChartRef.value)
  
  const dates = testData.value.history.map(item => item.date)
  const coverageData = testData.value.history.map(item => item.coverage)
  const passedData = testData.value.history.map(item => item.passed)
  const failedData = testData.value.history.map(item => item.failed)
  
  const option = {
    title: {
      text: '测试历史趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['覆盖率', '通过', '失败'],
      top: 30
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
        boundaryGap: false,
        data: dates
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '测试数量',
        position: 'right'
      },
      {
        type: 'value',
        name: '覆盖率(%)',
        position: 'left',
        axisLabel: {
          formatter: '{value}%'
        },
        max: 100
      }
    ],
    series: [
      {
        name: '覆盖率',
        type: 'line',
        yAxisIndex: 1,
        data: coverageData,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '通过',
        type: 'bar',
        stack: 'Total',
        data: passedData,
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '失败',
        type: 'bar',
        stack: 'Total',
        data: failedData,
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  }
  
  testHistoryChart.setOption(option)
}

// 初始化性能图表
const initPerformanceChart = () => {
  if (!performanceChartRef.value) return
  
  performanceChart = echarts.init(performanceChartRef.value)
  
  const option = {
    title: {
      text: '性能指标',
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
    xAxis: {
      type: 'category',
      data: ['页面加载时间', '渲染时间', '测试执行时间', '内存使用(MB)']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '性能指标',
        type: 'bar',
        data: [
          testData.value.performance.loadTime,
          testData.value.performance.renderTime,
          testData.value.performance.testExecutionTime,
          testData.value.performance.memoryUsage
        ],
        itemStyle: {
          color: function(params: any) {
            const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
            return colors[params.dataIndex]
          }
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }
  
  performanceChart.setOption(option)
}

// 初始化所有图表
const initCharts = () => {
  initCoverageChart()
  initTestResultChart()
  initTestHistoryChart()
  initPerformanceChart()
}

// 处理窗口大小变化
const handleResize = () => {
  coverageChart?.resize()
  testResultChart?.resize()
  testHistoryChart?.resize()
  performanceChart?.resize()
}

// 运行测试
const runTests = () => {
  const suite = testSuites.find(s => s.name === selectedSuite.value)
  if (!suite) return
  
  testRunning.value = true
}

// 查看测试详情
const viewTestDetail = (id: string) => {
  testDetail.value.id = id
  showDetail.value = true
}

// 返回测试列表
const backToList = () => {
  showDetail.value = false
}

// 查看详细报告
const viewDetailedReport = () => {
  window.open('/coverage/index.html', '_blank')
}

// 生命周期钩子
onMounted(() => {
  // 检查是否有测试ID参数
  if (route.params.id) {
    testDetail.value.id = route.params.id as string
    showDetail.value = true
  }
  
  initCharts()
  window.addEventListener('resize', handleResize)
})

// 监听测试套件变化
watch(selectedSuite, (newValue) => {
  // 重置当前测试结果
  // ... existing code ...
})

// 生命周期钩子
onMounted(() => {
  // 检查是否有测试ID参数
  if (route.params.id) {
    testDetail.value.id = route.params.id as string
    showDetail.value = true
  }
  
  initCharts()
  window.addEventListener('resize', handleResize)
})
</script>

<template>
  <div class="test-dashboard-container">
    <!-- 测试详情页 -->
    <div v-if="showDetail" class="test-detail">
      <div class="detail-header">
        <button class="back-button" @click="backToList">返回列表</button>
        <h1>测试详情 #{{ testDetail.id }}</h1>
      </div>
      
      <div class="detail-content">
        <div class="detail-summary">
          <div class="summary-row">
            <div class="summary-label">测试名称</div>
            <div class="summary-value">{{ testDetail.name }}</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">状态</div>
            <div class="summary-value" :class="testDetail.status">
              {{ testDetail.status === 'passed' ? '通过' : '失败' }}
            </div>
          </div>
          <div class="summary-row">
            <div class="summary-label">执行时间</div>
            <div class="summary-value">{{ testDetail.duration }}ms</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">开始时间</div>
            <div class="summary-value">{{ testDetail.startTime }}</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">结束时间</div>
            <div class="summary-value">{{ testDetail.endTime }}</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">断言数量</div>
            <div class="summary-value">{{ testDetail.assertions }}</div>
          </div>
        </div>
        
        <div class="detail-logs">
          <h2>测试日志</h2>
          <div class="log-list">
            <div v-for="(log, index) in testDetail.logs" :key="index" class="log-item" :class="log.level">
              <div class="log-time">{{ log.timestamp }}</div>
              <div class="log-message">{{ log.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 测试仪表盘 -->
    <div v-else class="dashboard-content">
      <div class="dashboard-header">
        <h1>测试自动化平台</h1>
        <div class="actions">
          <select v-model="selectedSuite" class="suite-select">
            <option v-for="suite in testSuites" :key="suite.id" :value="suite.id">
              {{ suite.name }}
            </option>
          </select>
          <button class="run-button" @click="runTests">运行测试</button>
          <button class="report-button" @click="viewDetailedReport">查看详细报告</button>
        </div>
      </div>
      
      <div class="dashboard-summary">
        <div class="summary-card">
          <div class="card-header">
            <span>测试总览</span>
          </div>
          <div class="summary-content">
            <div class="summary-item">
              <div class="item-label">总测试数</div>
              <div class="item-value">{{ testData.results.total }}</div>
            </div>
            <div class="summary-item">
              <div class="item-label">通过率</div>
              <div class="item-value success">
                {{ Math.round((testData.results.passed / testData.results.total) * 100) }}%
              </div>
            </div>
            <div class="summary-item">
              <div class="item-label">覆盖率</div>
              <div class="item-value warning">
                {{ Math.round(testData.coverage.lines) }}%
              </div>
            </div>
            <div class="summary-item">
              <div class="item-label">执行时间</div>
              <div class="item-value">{{ testData.performance.testExecutionTime }}ms</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="charts-container">
        <div class="chart-row">
          <div class="chart-card">
            <div ref="coverageChartRef" class="chart"></div>
          </div>
          <div class="chart-card">
            <div ref="testResultChartRef" class="chart"></div>
          </div>
        </div>
        <div class="chart-row">
          <div class="chart-card">
            <div ref="testHistoryChartRef" class="chart"></div>
          </div>
          <div class="chart-card">
            <div ref="performanceChartRef" class="chart"></div>
          </div>
        </div>
      </div>
      
      <div class="test-list-section">
        <h2>最近测试</h2>
        <table class="test-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>状态</th>
              <th>执行时间</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>001</td>
              <td>主页面渲染测试</td>
              <td class="status passed">通过</td>
              <td>1250ms</td>
              <td>2023-08-01 14:30</td>
              <td>
                <button class="detail-button" @click="viewTestDetail('001')">查看详情</button>
              </td>
            </tr>
            <tr>
              <td>002</td>
              <td>数据加载测试</td>
              <td class="status passed">通过</td>
              <td>850ms</td>
              <td>2023-08-01 14:35</td>
              <td>
                <button class="detail-button" @click="viewTestDetail('002')">查看详情</button>
              </td>
            </tr>
            <tr>
              <td>003</td>
              <td>图表交互测试</td>
              <td class="status failed">失败</td>
              <td>1450ms</td>
              <td>2023-08-01 14:40</td>
              <td>
                <button class="detail-button" @click="viewTestDetail('003')">查看详情</button>
              </td>
            </tr>
            <tr>
              <td>004</td>
              <td>响应式布局测试</td>
              <td class="status passed">通过</td>
              <td>920ms</td>
              <td>2023-08-01 14:45</td>
              <td>
                <button class="detail-button" @click="viewTestDetail('004')">查看详情</button>
              </td>
            </tr>
            <tr>
              <td>005</td>
              <td>导航菜单测试</td>
              <td class="status passed">通过</td>
              <td>780ms</td>
              <td>2023-08-01 14:50</td>
              <td>
                <button class="detail-button" @click="viewTestDetail('005')">查看详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  color: #333;
}

/* 仪表盘头部 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.actions {
  display: flex;
  gap: 10px;
}

.suite-select {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: white;
  color: #606266;
  font-size: 14px;
}

.run-button, .report-button, .detail-button, .back-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.run-button {
  background-color: #409EFF;
  color: white;
}

.run-button:hover {
  background-color: #66b1ff;
}

.report-button {
  background-color: #909399;
  color: white;
}

.report-button:hover {
  background-color: #a6a9ad;
}

/* 摘要卡片 */
.dashboard-summary {
  margin-bottom: 20px;
}

.summary-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background-color: #f5f7fa;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  font-weight: bold;
  color: #303133;
}

.summary-content {
  display: flex;
  padding: 20px;
  justify-content: space-around;
}

.summary-item {
  text-align: center;
}

.item-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.item-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.item-value.success {
  color: #67C23A;
}

.item-value.warning {
  color: #E6A23C;
}

.item-value.danger {
  color: #F56C6C;
}

/* 图表容器 */
.charts-container {
  margin-bottom: 20px;
}

.chart-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.chart {
  height: 300px;
}

/* 测试列表 */
.test-list-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.test-list-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
}

.test-table {
  width: 100%;
  border-collapse: collapse;
}

.test-table th, .test-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
}

.test-table th {
  font-weight: bold;
  color: #909399;
  background-color: #f5f7fa;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.passed {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}

.status.failed {
  background-color: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}

.detail-button {
  background-color: #409EFF;
  color: white;
}

.detail-button:hover {
  background-color: #66b1ff;
}

/* 测试详情页 */
.test-detail {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

.back-button {
  background-color: #909399;
  color: white;
  margin-right: 15px;
}

.back-button:hover {
  background-color: #a6a9ad;
}

.detail-header h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.detail-content {
  display: flex;
  gap: 20px;
}

.detail-summary {
  flex: 1;
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
}

.summary-row {
  display: flex;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-label {
  width: 100px;
  color: #909399;
  font-weight: bold;
}

.summary-value {
  flex: 1;
  color: #303133;
}

.summary-value.passed {
  color: #67C23A;
  font-weight: bold;
}

.summary-value.failed {
  color: #F56C6C;
  font-weight: bold;
}

.detail-logs {
  flex: 2;
}

.detail-logs h2 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #303133;
}

.log-list {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  width: 180px;
  color: #909399;
  font-size: 12px;
}

.log-message {
  flex: 1;
  color: #303133;
}

.log-item.info .log-message {
  color: #303133;
}

.log-item.warning .log-message {
  color: #E6A23C;
}

.log-item.error .log-message {
  color: #F56C6C;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chart-row {
    flex-direction: column;
  }
  
  .chart-card {
    margin-bottom: 20px;
  }
  
  .detail-content {
    flex-direction: column;
  }
  
  .detail-summary {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .summary-content {
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .summary-item {
    width: 45%;
  }
  
  .actions {
    flex-direction: column;
    gap: 10px;
  }
}

@media (max-width: 576px) {
  .summary-item {
    width: 100%;
  }
  
  .test-table th:nth-child(4),
  .test-table td:nth-child(4),
  .test-table th:nth-child(5),
  .test-table td:nth-child(5) {
    display: none;
  }
}
</style>