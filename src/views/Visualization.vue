<template>
  <div class="visualization-container" :class="{'dark-theme': isDarkTheme}">
    <!-- 欢迎页面 - 首次访问或无图表时显示 -->
    <div v-if="showWelcomePage" class="welcome-page">
      <div class="welcome-header">
        <div class="welcome-title">
          <el-icon class="logo-icon"><Monitor /></el-icon>
          <h1>大数据可视化监控平台</h1>
        </div>
        <el-button type="primary" @click="startExplore">
          <el-icon><ArrowRight /></el-icon> 开始探索
        </el-button>
      </div>
      
      <div class="platform-intro">
        <h2>专业的数据可视化解决方案</h2>
        <p>基于Vue3 + TypeScript + ECharts构建的现代化数据可视化平台，轻松实现数据分析与展示</p>
        
        <div class="feature-cards">
          <div class="feature-card">
            <el-icon class="feature-icon"><PieChart /></el-icon>
            <h3>多样化图表</h3>
            <p>支持饼图、柱状图、折线图、散点图等多种图表类型，满足不同数据展示需求</p>
          </div>
          
          <div class="feature-card">
            <el-icon class="feature-icon"><Connection /></el-icon>
            <h3>灵活数据源</h3>
            <p>支持API、WebSocket、随机数据等多种数据源，轻松对接现有系统</p>
          </div>
          
          <div class="feature-card">
            <el-icon class="feature-icon"><Grid /></el-icon>
            <h3>自定义布局</h3>
            <p>多种布局方式自由组合，打造专属数据仪表盘</p>
          </div>
          
          <div class="feature-card">
            <el-icon class="feature-icon"><Refresh /></el-icon>
            <h3>实时监控</h3>
            <p>支持数据实时刷新，及时掌握业务动态</p>
          </div>
        </div>
        
        <div class="quick-start">
          <h2>快速开始</h2>
          <el-steps :active="1" simple>
            <el-step title="步骤 1" description="添加数据源"></el-step>
            <el-step title="步骤 2" description="创建图表"></el-step>
            <el-step title="步骤 3" description="自定义布局"></el-step>
          </el-steps>
          
          <div class="start-buttons">
            <el-button type="primary" @click="showDataSourceEditor">
              <el-icon><Plus /></el-icon> 添加第一个数据源
            </el-button>
            <el-button @click="addChart" :disabled="dataSources.length === 0">
              <el-icon><PieChart /></el-icon> 创建图表
            </el-button>
            <el-button @click="toggleTheme">
              <el-icon><Moon v-if="!isDarkTheme" /><Sunny v-else /></el-icon>
              切换主题
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 常规页面 - 有图表时显示 -->
    <div v-else class="dashboard-content">
      <!-- 页面头部 -->
      <header class="page-header">
        <div class="header-left">
          <el-icon class="small-logo-icon"><Monitor /></el-icon>
          <h1 class="page-title">数据可视化平台</h1>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="showDataSourceEditor">
            <el-icon><Plus /></el-icon> 添加数据源
          </el-button>
          <el-button @click="addChart">
            <el-icon><PieChart /></el-icon> 添加图表
          </el-button>
          <el-button @click="refreshAllData">
            <el-icon><Refresh /></el-icon> 刷新数据
          </el-button>
          <el-dropdown @command="handleCommand">
            <el-button>
              <el-icon><Menu /></el-icon> 布局 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="layout_1x2">1 x 2 布局</el-dropdown-item>
                <el-dropdown-item command="layout_2x1">2 x 1 布局</el-dropdown-item>
                <el-dropdown-item command="layout_2x2">2 x 2 布局</el-dropdown-item>
                <el-dropdown-item command="layout_3x3">3 x 3 布局</el-dropdown-item>
                <el-dropdown-item command="layout_auto">自动布局</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button circle @click="toggleTheme" class="theme-toggle-button">
            <el-icon><Moon v-if="!isDarkTheme" /><Sunny v-else /></el-icon>
          </el-button>
        </div>
      </header>
      
      <!-- 主体内容区域 -->
      <main class="main-content">
        <!-- 图表布局网格 -->
        <div class="chart-grid" :class="currentLayout">
          <ChartContainer
            v-for="chart in charts"
            :key="chart.id"
            :chart-type="chart.type"
            :data="chart.data"
            :title="chart.title"
            :theme="chart.theme"
            :show-legend="chart.showLegend"
            :loading="chart.loading"
            :config="chart.config"
            @refresh="refreshChart(chart.id)"
            @chart-click="handleChartClick"
            @update:config="updateChartConfig(chart.id, $event)"
            @delete="deleteChart(chart.id)"
            class="chart-item"
            :ref="el => registerChartRef(chart.id, el)"
          />
          
          <!-- 空状态提示 -->
          <div v-if="charts.length === 0" class="empty-state">
            <el-empty description="暂无图表">
              <el-button type="primary" @click="addChart">添加第一个图表</el-button>
              <el-button @click="showWelcomePage = true">返回首页</el-button>
            </el-empty>
          </div>
        </div>
      </main>
    </div>
    
    <!-- 数据源编辑器对话框 -->
    <el-dialog
      v-model="dataSourceDialogVisible"
      title="数据源配置"
      width="800px"
      destroy-on-close
    >
      <DataSourceEditor
        :data-source="currentDataSource"
        :is-edit="!!currentDataSource"
        @save="saveDataSource"
        @cancel="dataSourceDialogVisible = false"
        @test="testDataSource"
      />
    </el-dialog>
    
    <!-- 图表配置对话框 -->
    <el-dialog
      v-model="chartDialogVisible"
      title="图表配置"
      width="500px"
    >
      <el-form label-position="top" :model="chartForm">
        <el-form-item label="图表标题">
          <el-input v-model="chartForm.title" />
        </el-form-item>
        
        <el-form-item label="图表类型">
          <el-select v-model="chartForm.type" style="width: 100%">
            <el-option value="pie" label="饼图" />
            <el-option value="bar" label="柱状图" />
            <el-option value="line" label="折线图" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="数据源">
          <el-select 
            v-model="selectedDataSourceId"
            style="width: 100%" 
            filterable 
            placeholder="请选择数据源"
            class="chart-source-select"
            :key="`ds-select-${chartDialogVisible}`"
            @change="(val: string) => {
              chartForm.dataSourceId = val;
            }"
          >
            <el-option
              v-for="source in dataSources"
              :key="source.id || `option-${source.name}-${Math.random()}`"
              :label="source.name || '未命名数据源'"
              :value="source.id"
            />
            <template #empty>
              <div class="empty-select-tip">
                <p>暂无数据源，请先添加数据源</p>
                <el-button size="small" type="primary" @click="showDataSourceEditor">添加数据源</el-button>
              </div>
            </template>
          </el-select>
          <div class="selected-source-info" v-if="selectedDataSourceId">
            已选择: {{ getSelectedSourceName() }} (ID: {{ selectedDataSourceId }})
          </div>
        </el-form-item>
        
        <el-form-item label="主题">
          <el-select v-model="chartForm.theme" style="width: 100%">
            <el-option value="blue" label="蓝色主题" />
            <el-option value="dark" label="暗色主题" />
            <el-option value="light" label="亮色主题" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="刷新频率（秒）">
          <el-slider v-model="chartForm.refreshInterval" :min="0" :max="60" :step="1" />
          <div class="form-tip">设为0表示不自动刷新</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="chartDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveChart">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowDown, 
  Plus, 
  Refresh, 
  PieChart, 
  Menu, 
  ArrowRight, 
  Connection, 
  Grid, 
  Moon, 
  Sunny, 
  Monitor 
} from '@element-plus/icons-vue'
import { nanoid } from 'nanoid'
import ChartContainer from '../components/ChartContainer.vue'
import DataSourceEditor from '../components/DataSourceEditor.vue'
import dbService from '../utils/db'
import service from '../utils/request'
import { useRouter } from 'vue-router'

// 是否显示欢迎页面
const showWelcomePage = ref(true)

// 暗色主题
const isDarkTheme = ref(false)

// 数据源列表
const dataSources = ref<any[]>([])

// 图表列表
const charts = ref<any[]>([])

// 当前布局
const currentLayout = ref('layout_auto')

// 数据源对话框可见性
const dataSourceDialogVisible = ref(false)

// 图表对话框可见性
const chartDialogVisible = ref(false)

// 当前编辑的数据源
const currentDataSource = ref<Record<string, any> | null>(null)

// 图表表单数据
const chartForm = reactive({
  id: '',
  title: '',
  type: 'pie',
  dataSourceId: '',
  theme: 'blue',
  refreshInterval: 0,
  config: {}
})

// 定时刷新器列表
const refreshTimers = reactive<Record<string, NodeJS.Timeout>>({})

// 解决方案：创建一个单独的数据源选择状态，解耦UI
const selectedDataSourceId = ref('')

// 图表引用集合
interface ChartRef {
  resizeChart?: () => boolean;
  [key: string]: any;
}

const chartRefs = ref<Record<string, ChartRef>>({})

// 开始探索 - 关闭欢迎页面
const startExplore = () => {
  showWelcomePage.value = false
}

// 切换主题
const toggleTheme = () => {
  // 更新主题状态
  isDarkTheme.value = !isDarkTheme.value
  
  // 保存主题设置到本地存储
  localStorage.setItem('visualization_theme', isDarkTheme.value ? 'dark' : 'light')
  
  // 更新所有图表引用的实例强制应用新主题
  nextTick(() => {
    // 遍历所有图表组件的引用，调用其刷新方法
    Object.values(chartRefs.value).forEach(chartRef => {
      if (chartRef) {
        // 如果组件有刷新方法，调用它
        if (typeof chartRef.renderWithNewTheme === 'function') {
          chartRef.renderWithNewTheme()
        } else if (typeof chartRef.resizeChart === 'function') {
          chartRef.resizeChart()
        }
      }
    })
  })
}

// 加载数据源列表
const loadDataSources = async () => {
  try {
    const sources = await dbService.getDataSources()
    dataSources.value = sources || []
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败')
  }
}

// 加载图表列表
const loadCharts = async () => {
  try {
    const chartList = await dbService.getCharts()
    
    charts.value = chartList || []
    
    if (dataSources.value.length === 0) {
      await loadDataSources()
    }
    
    for (const chart of charts.value) {
      await loadChartData(chart)
    }
  } catch (error) {
    console.error('加载图表失败详情:', error)
    ElMessage.error('加载图表失败')
  }
}

// 设置图表定时刷新
const setChartRefreshTimer = (chartId: string, interval: number) => {
  // 清除已有的定时器
  if (refreshTimers[chartId]) {
    clearInterval(refreshTimers[chartId])
  }
  
  // 设置新的定时器
  if (interval > 0) {
    refreshTimers[chartId] = setInterval(() => {
      loadChartData(chartId)
    }, interval)
  }
}

// 加载图表数据
const loadChartData = async (chart: any) => {
  const chartId = typeof chart === 'string' ? chart : chart.id;
  const chartObj = typeof chart === 'string' ? charts.value.find(c => c.id === chart) : chart;
  
  if (!chartObj) {
    console.warn('未找到图表:', chartId);
    return;
  }
  
  console.log(`加载图表 [${chartObj.id}] ${chartObj.title} 数据，主题: ${chartObj.theme}`);
  
  // 如果没有指定数据源ID，则不加载数据
  if (!chartObj.dataSourceId) {
    console.warn('图表没有指定数据源ID:', chartId, chartObj.title)
    chartObj.data = []
    return
  }
  
  // 查找对应的数据源
  const dataSource = dataSources.value.find(s => String(s.id) === String(chartObj.dataSourceId))
  if (!dataSource) {
    console.warn(`未找到数据源 ID: ${chartObj.dataSourceId}，检查ID类型:`, {
      chartDataSourceIdType: typeof chartObj.dataSourceId,
      chartDataSourceId: chartObj.dataSourceId,
      availableDataSources: dataSources.value.map(s => ({id: s.id, type: typeof s.id, name: s.name}))
    })
    // 生成一些随机数据，避免图表空白
    chartObj.data = generateRandomData(chartObj.type, 8)
    return
  }
  
  console.log(`为图表 [${chartObj.id}] ${chartObj.title} 加载数据，数据源:`, {
    id: dataSource.id,
    name: dataSource.name,
    type: dataSource.type
  })
  
  // 设置加载状态
  chartObj.loading = true
  
  try {
    let data
    
    // 根据数据源类型获取数据
    switch (dataSource.type) {
      case 'api':
        // 从API获取数据
        try {
          const response = await service({
            url: dataSource.url,
            method: dataSource.method || 'GET',
            params: dataSource.method === 'GET' ? dataSource.params : undefined,
            data: dataSource.method !== 'GET' ? dataSource.params : undefined,
            headers: dataSource.headers || {}
          })
          
          // 处理响应
          data = response.data
          
          // 如果指定了数据路径，提取数据
          if (dataSource.dataPath) {
            const paths = dataSource.dataPath.split('.')
            for (const path of paths) {
              if (data && data[path] !== undefined) {
                data = data[path]
              } else {
                console.warn(`数据路径 ${dataSource.dataPath} 无效，使用空数据`)
                data = []
                break
              }
            }
          }
        } catch (apiError) {
          console.error('API数据获取失败:', apiError)
          // 如果API请求失败，生成随机数据
          data = generateRandomData(chartObj.type, 8)
        }
        break
        
      case 'random':
        // 生成随机数据
        data = generateRandomData(
          dataSource.randomDataType || chartObj.type || 'pie', 
          dataSource.randomDataCount || 8
        )
        break
        
      case 'websocket':
        // WebSocket数据通过事件更新，暂不处理
        console.log('WebSocket数据源暂不支持，使用随机数据')
        data = generateRandomData(chartObj.type, 8)
        break
        
      case 'csv':
      case 'json':
      case 'excel':
        // 文件数据暂不支持，使用随机数据
        console.log(`${dataSource.type}数据源暂不支持，使用随机数据`)
        data = generateRandomData(chartObj.type, 8)
        break
        
      default:
        console.warn('未知数据源类型:', dataSource.type)
        data = generateRandomData(chartObj.type, 8)
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('数据为空或无效，使用随机数据')
      data = generateRandomData(chartObj.type, 8)
    }
    
    // 更新图表数据
    chartObj.data = data
    console.log(`图表 [${chartObj.id}] ${chartObj.title} 数据已更新，共 ${data.length} 项，使用主题: ${chartObj.theme}`)
  } catch (error) {
    console.error(`加载图表 ${chartObj.title} 数据失败:`, error)
    // 出错时使用随机数据
    chartObj.data = generateRandomData(chartObj.type, 8)
  } finally {
    chartObj.loading = false
  }
}

// 生成随机数据
const generateRandomData = (type: string, count: number = 8) => {
  console.log(`生成随机数据，类型: ${type}, 数量: ${count}`)
  
  // 确保数量合理
  const safeCount = Math.min(Math.max(3, count), 20)
  
  // 随机类别名称
  const categories = [
    '类别A', '类别B', '类别C', '类别D', '类别E', 
    '类别F', '类别G', '类别H', '类别I', '类别J',
    '数据1', '数据2', '数据3', '数据4', '数据5', 
    '数据6', '数据7', '数据8', '数据9', '数据10'
  ]
  
  // 根据图表类型生成合适的随机数据
  switch (type) {
    case 'pie':
      return Array.from({ length: safeCount }, (_, i) => ({
        name: categories[i % categories.length],
        value: Math.round(Math.random() * 1000)
      }))
      
    case 'bar':
      return Array.from({ length: safeCount }, (_, i) => ({
        name: categories[i % categories.length],
        value: Math.round(Math.random() * 1000)
      }))
      
    case 'line':
      return Array.from({ length: safeCount }, (_, i) => ({
        name: `${Math.floor(i / 4) + 1}月${(i % 4) * 7 + 1}日`,
        value: Math.round(Math.random() * 1000)
      }))
      
    case 'scatter': {
      // 为散点图生成多个类别的数据点
      const scatterCategories = ['类别A', '类别B', '类别C', '类别D'];
      const scatterData: Array<{
        name: string;
        category?: string;
        value: number[];
      }> = [];
      
      // 为每个类别生成随机点
      scatterCategories.forEach(category => {
        // 每个类别生成2-7个点
        const pointCount = Math.floor(Math.random() * 5) + 2;
        
        for (let i = 0; i < pointCount; i++) {
          // 生成随机坐标和大小
          const x = Math.round(Math.random() * 100);
          const y = Math.round(Math.random() * 100);
          const size = Math.round(Math.random() * 50);
          
          scatterData.push({
            name: `${category}点${i+1}`,
            category: category,
            value: [x, y, size]
          });
        }
      });
      
      // 添加一些固定测试点，确保能显示
      scatterData.push({
        name: '测试点1',
        category: '测试类别',
        value: [20, 30, 40]
      });
      
      scatterData.push({
        name: '测试点2',
        category: '测试类别',
        value: [60, 70, 30]
      });
      
      // 确保有足够的点
      console.log(`生成了 ${scatterData.length} 个散点数据，详细数据:`, JSON.stringify(scatterData));
      return scatterData;
    }
      
    default:
      console.warn('未知图表类型，使用默认饼图数据:', type)
      return Array.from({ length: safeCount }, (_, i) => ({
        name: categories[i % categories.length],
        value: Math.round(Math.random() * 1000)
      }))
  }
}

// 刷新所有图表数据
const refreshAllData = () => {
  charts.value.forEach(chart => {
    loadChartData(chart)
  })
  ElMessage.success('已刷新所有图表数据')
}

// 刷新单个图表数据
const refreshChart = (chartId: string) => {
  loadChartData(charts.value.find(c => c.id === chartId))
}

// 图表点击事件处理
const handleChartClick = (params: any) => {
  console.log('Chart clicked:', params)
}

// 显示数据源编辑器
const showDataSourceEditor = (source = null) => {
  currentDataSource.value = source
  dataSourceDialogVisible.value = true
}

// 保存数据源
const saveDataSource = async (source: any) => {
  try {
    // 确保源数据有有效的ID
    if (!source.id || source.id.trim() === '') {
      source.id = `ds-${nanoid()}`;
      console.log('为数据源生成新ID:', source.id);
    }
    
    // 获取现有数据源
    const sources = await dbService.getDataSources()
    let dataSourceList = sources || []
    
    // 创建安全的数据副本，确保可序列化
    // 使用 JSON 序列化和反序列化来清除不可序列化对象
    let safeSource;
    try {
      // 确保ID是字符串类型且不为空
      const sourceWithValidId = {
        ...source,
        id: source.id ? String(source.id) : `ds-${nanoid()}`,
        // 明确移除文件对象
        file: null
      };
      
      // 深度复制，移除不可序列化的内容
      safeSource = JSON.parse(JSON.stringify(sourceWithValidId));
    } catch (serializeError) {
      console.error('数据源序列化失败:', serializeError);
      // 尝试更简单的方式
      safeSource = {
        id: source.id || nanoid(),
        name: source.name || '未命名数据源',
        type: source.type || 'random',
        description: source.description || '',
        chartType: source.chartType || 'pie',
        // 其他必要的基本属性，但移除复杂对象
        url: source.url || '',
        method: source.method || 'GET',
        dataPath: source.dataPath || '',
        refreshInterval: source.refreshInterval || 0,
        randomDataType: source.randomDataType || 'pie',
        randomDataCount: source.randomDataCount || 10
      };
    }
    
    // 检查是否为编辑
    const existingIndex = dataSourceList.findIndex(ds => ds.id === safeSource.id)
    if (existingIndex >= 0) {
      // 更新现有数据源
      dataSourceList[existingIndex] = safeSource
    } else {
      // 添加新数据源
      dataSourceList.push(safeSource)
    }
    
    console.log('尝试保存数据源:', dataSourceList) // 调试日志
    
    // 保存到数据库
    await dbService.saveDataSources(dataSourceList)
    
    // 重新加载数据源列表
    await loadDataSources()
    
    // 关闭对话框
    dataSourceDialogVisible.value = false
    
    ElMessage.success('数据源已保存')
  } catch (error: any) {
    console.error('保存数据源失败详情:', error)
    // 尝试再次保存，但使用更简单的方式
    try {
      ElMessage.warning('正在尝试另一种方式保存...')
      
      // 创建最小化版本的数据源
      const minimizedSource = {
        id: source.id || nanoid(),
        name: source.name || '未命名数据源',
        type: source.type || 'random',
        chartType: source.chartType || 'pie'
      };
      
      // 获取数据源列表
      const sources = await dbService.getDataSources();
      let dataSourceList = sources || [];
      
      // 更新或添加
      const existingIndex = dataSourceList.findIndex(ds => ds.id === minimizedSource.id);
      if (existingIndex >= 0) {
        dataSourceList[existingIndex] = minimizedSource;
      } else {
        dataSourceList.push(minimizedSource);
      }
      
      // 保存简化版本
      await dbService.saveDataSources(dataSourceList);
      
      // 重新加载
      await loadDataSources();
      
      // 关闭对话框
      dataSourceDialogVisible.value = false;
      
      ElMessage.success('数据源已简化保存');
    } catch (secondError) {
      console.error('二次尝试保存也失败:', secondError);
      ElMessage.error(`保存数据源失败: ${error?.message || '未知错误'}`);
    }
  }
}

// 测试数据源
const testDataSource = async (source: any) => {
  // 暂不实现实际测试逻辑，由数据源编辑器处理
  console.log('Test data source:', source)
}

// 添加图表
const addChart = async () => {
  // 先获取最新的数据源
  await loadDataSources()
  
  if (dataSources.value.length === 0) {
    ElMessage.warning('请先添加数据源')
    showDataSourceEditor()
    return
  }
  
  // 如果数据源没有有效ID，修复它们
  const dataSourcesWithInvalidId = dataSources.value.filter(ds => !ds.id)
  if (dataSourcesWithInvalidId.length > 0) {
    dataSourcesWithInvalidId.forEach(ds => {
      ds.id = generateDataSourceId(ds)
    })
    
    // 保存修复后的数据源
    saveDataSources([...dataSources.value])
  }
  
  // 设置默认数据源ID（如果有的话）
  if (!chartForm.dataSourceId && dataSources.value.length > 0) {
    selectedDataSourceId.value = dataSources.value[0].id
    chartForm.dataSourceId = dataSources.value[0].id
  }
  
  // 显示图表对话框
  chartDialogVisible.value = true
}

// 保存图表
const saveChart = async () => {
  // 检查有效数据源ID
  const finalDataSourceId = chartForm.dataSourceId || 
    (dataSources.value.length > 0 ? dataSources.value[0].id : null)
  
  if (!finalDataSourceId) {
    ElMessage.error('请选择有效的数据源')
    return
  }
  
  // 准备图表数据对象，使用当前页面主题
  const chart = {
    id: chartForm.id || `chart_${Date.now()}`,
    title: chartForm.title || '未命名图表',
    type: chartForm.type || 'bar',
    dataSourceId: finalDataSourceId,
    data: [],
    config: chartForm.config || {},
    theme: isDarkTheme.value ? 'dark' : 'light', // 使用当前页面主题
    showLegend: true,
    createTime: Date.now()
  }
  
  // 如果是编辑现有图表
  if (chartForm.id) {
    // 更新现有图表
    const index = charts.value.findIndex(c => c.id === chart.id)
    if (index !== -1) {
      charts.value[index] = { ...charts.value[index], ...chart }
    }
  } else {
    // 添加新图表
    charts.value.push(chart)
  }
  
  // 保存到数据库
  dbService.saveCharts(charts.value)
  
  // 加载图表数据
  loadChartData(chart)
  
  // 关闭对话框
  chartDialogVisible.value = false
  
  // 重置表单
  chartForm.id = ''
  chartForm.title = ''
  chartForm.type = 'bar'
  chartForm.dataSourceId = ''
  chartForm.config = {}
}

// 更新图表配置
const updateChartConfig = (chartId: string, newConfig: any) => {
  // 找到并更新图表配置
  const chart = charts.value.find(c => c.id === chartId)
  if (chart) {
    let needImmediateRefresh = false;
    
    // 更新图表类型(如果配置中有)
    if (newConfig.chartType && newConfig.chartType !== chart.type) {
      chart.type = newConfig.chartType;
      needImmediateRefresh = true;
    }
    
    // 更新图表标题(如果配置中有)
    if (newConfig.title && newConfig.title !== chart.title) {
      chart.title = newConfig.title;
    }
    
    // 更新图表主题(如果配置中有)
    if (newConfig.theme && newConfig.theme !== chart.theme) {
      chart.theme = newConfig.theme;
      needImmediateRefresh = true;
    }
    
    // 更新是否显示图例
    if (newConfig.showLegend !== undefined) {
      chart.showLegend = newConfig.showLegend;
    }
    
    // 更新或创建图表配置对象
    if (!chart.config) {
      chart.config = {};
    }
    
    // 合并新配置到现有配置
    chart.config = {
      ...chart.config,
      ...newConfig
    };
    
    // 保存更新后的图表
    dbService.saveCharts(charts.value)
      .then(() => {
        ElMessage.success('图表配置已更新并保存');
        
        // 如果是主题或图表类型变更，立即重新加载图表数据
        if (needImmediateRefresh) {
          loadChartData(chart);
        }
      })
      .catch((error) => {
        console.error('保存图表配置失败:', error);
        ElMessage.error('保存图表配置失败');
      });
  } else {
    ElMessage.warning('未找到要更新的图表');
  }
}

// 处理布局命令
const handleCommand = (command: string) => {
  currentLayout.value = command
  
  // 布局变更后，延迟执行所有图表的resize
  setTimeout(() => {
    // 通知所有图表重新渲染
    Object.values(chartRefs.value).forEach(chartRef => {
      if (chartRef && typeof chartRef.resizeChart === 'function') {
        chartRef.resizeChart()
      }
    })
    
    // 确保滚动重置和容器高度重新计算
    const container = document.querySelector('.visualization-container');
    if (container) {
      // 触发重排和重新计算
      container.scrollTop = 0;
      
      // 触发布局刷新
      window.dispatchEvent(new Event('resize'));
    }
  }, 200)
}

// 注册图表引用
const registerChartRef = (id: string, ref: any) => {
  if (id && ref) {
    chartRefs.value[id] = ref
  }
}

// 获取选中的数据源名称
const getSelectedSourceName = (): string => {
  if (!selectedDataSourceId.value) return '未选择';
  
  const source = dataSources.value.find(s => s.id === selectedDataSourceId.value);
  return source ? (source.name || '未命名') : '未找到对应数据源';
}

// 删除图表
const deleteChart = async (chartId: string) => {
  try {
    // 确认删除对话框
    await ElMessageBox.confirm(
      '确定要删除这个图表吗？此操作不可恢复。',
      '删除确认',
      { type: 'warning' }
    )
    
    // 从数组中移除图表
    charts.value = charts.value.filter(chart => chart.id !== chartId)
    
    // 从数据库中删除
    await dbService.saveCharts(charts.value)
    
    ElMessage.success('图表已删除')
  } catch (error) {
    // 用户取消删除或发生错误
    if (error !== 'cancel') {
      ElMessage.error('删除图表时出错')
    }
  }
}

// 组件挂载
onMounted(async () => {
  // 加载主题设置
  const savedTheme = localStorage.getItem('visualization_theme')
  if (savedTheme) {
    isDarkTheme.value = savedTheme === 'dark'
  }
  
  // 先加载数据源
  await loadDataSources()
  
  await loadCharts()
  
  // 自动判断是否显示欢迎页面 (有图表时不显示)
  showWelcomePage.value = charts.value.length === 0
})

// 监听主题变化，更新所有图表
watch(isDarkTheme, (newValue) => {
  console.log('页面主题已变更:', newValue ? '深色' : '浅色');
  
  // 更新所有图表的主题
  charts.value.forEach(chart => {
    const oldTheme = chart.theme;
    chart.theme = newValue ? 'dark' : 'light';
    
    console.log(`更新图表 [${chart.id}] ${chart.title} 主题: ${oldTheme} -> ${chart.theme}`);
  });
  
  // 保存更新后的图表配置
  dbService.saveCharts(charts.value)
    .then(() => {
      // 刷新所有图表
      setTimeout(() => {
        refreshAllData();
        ElMessage.success('已更新所有图表主题');
      }, 100);
    })
    .catch(error => {
      console.error('保存图表主题失败:', error);
      ElMessage.error('更新图表主题失败');
    });
});

// 组件卸载
onUnmounted(() => {
  // 清除所有定时器
  Object.values(refreshTimers).forEach(timerId => {
    clearInterval(timerId)
  })
})

// 为数据源生成唯一ID
const generateDataSourceId = (source: any): string => {
  const id = `ds_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  return id
}

// 保存数据源列表
const saveDataSources = async (dataSourceList: any[]): Promise<boolean> => {
  try {
    await dbService.saveDataSources(dataSourceList)
    return true
  } catch (error) {
    ElMessage.error('保存数据源失败')
    return false
  }
}
</script>

<style scoped>
.visualization-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
  transition: all 0.3s ease;
  overflow-y: auto;
  max-height: 100vh;
}

.dark-theme {
  background-color: #1a1a2e;
  color: #e7e7e7;
}

.dark-theme .page-header,
.dark-theme .welcome-page {
  border-color: #2d3142;
}

.dark-theme .feature-card {
  background-color: #2d3142;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark-theme .page-title {
  color: #e7e7e7;
}

/* 欢迎页面样式 */
.welcome-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 10px;
  background-color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.dark-theme .welcome-page {
  background-color: #2d3142;
}

.welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
}

.welcome-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  font-size: 64px;
  color: #409EFF;
}

.small-logo-icon {
  font-size: 32px;
  color: #409EFF;
}

.logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.small-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.platform-intro {
  margin-top: 30px;
}

.platform-intro h2 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #303133;
}

.dark-theme .platform-intro h2 {
  color: #e7e7e7;
}

.platform-intro p {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
  line-height: 1.6;
}

.dark-theme .platform-intro p {
  color: #b9b9c3;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.feature-card {
  padding: 20px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 16px;
  color: #409EFF;
}

.feature-card h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #303133;
}

.dark-theme .feature-card h3 {
  color: #e7e7e7;
}

.feature-card p {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.dark-theme .feature-card p {
  color: #b9b9c3;
}

.quick-start {
  margin-top: 40px;
  padding: 30px;
  border-radius: 8px;
  background-color: #f2f6fc;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.dark-theme .quick-start {
  background-color: #242535;
}

.start-buttons {
  display: flex;
  gap: 16px;
  margin-top: 30px;
  flex-wrap: wrap;
}

/* 常规页面样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e6e6e6;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 图标和文字间的间距 */
.header-actions .el-icon {
  margin-right: 6px;
}

.main-content {
  margin-top: 20px;
  overflow-y: visible;
}

.chart-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  grid-auto-rows: minmax(350px, auto);
  width: 100%;
  overflow: visible; /* 确保内容可见并允许滚动 */
}

.chart-grid.layout_1x2 {
  grid-template-columns: 1fr;
  grid-auto-rows: minmax(450px, auto);
}

.chart-grid.layout_2x1 {
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: minmax(400px, auto);
}

.chart-grid.layout_2x2 {
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: minmax(350px, auto);
}

.chart-grid.layout_3x3 {
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(300px, auto);
}

.chart-grid.layout_1x2,
.chart-grid.layout_2x1,
.chart-grid.layout_2x2,
.chart-grid.layout_3x3 {
  min-height: min-content;
  height: auto;
}

.chart-item {
  width: 100%;
  height: 100%;
  min-height: 280px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.empty-select-tip {
  text-align: center;
  padding: 20px;
}

.el-select {
  width: 100%;
}

.el-select-dropdown__item {
  padding: 0 20px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .welcome-header,
  .header-left,
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    margin-top: 16px;
    width: 100%;
  }
  
  .feature-cards {
    grid-template-columns: 1fr;
  }
  
  .start-buttons {
    flex-direction: column;
  }
  
  .chart-grid {
    grid-template-columns: 1fr;
  }
}

/* 添加主题切换按钮的居中样式 */
.theme-toggle-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle-button .el-icon {
  margin: 0 !important; /* 使用!important覆盖全局样式 */
}

/* 覆盖header-actions中的图标样式 */
.header-actions .theme-toggle-button .el-icon {
  margin-right: 0 !important; /* 移除右边距，确保图标居中 */
}

/* 确保整体布局可滚动 */
html, body {
  height: 100%;
  overflow-y: auto;
  margin: 0;
  padding: 0;
}

/* 添加响应式处理，确保小屏幕也能滚动 */
@media (max-height: 900px) {
  .chart-item {
    min-height: 250px;
  }
  
  .visualization-container {
    padding: 10px;
  }
}
</style> 