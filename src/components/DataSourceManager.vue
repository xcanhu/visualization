<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import service from '../utils/request'
import { useDataStore } from '../stores'
import dbService from '../utils/db'

// 获取数据存储
const dataStore = useDataStore()

// 数据源列表
const dataSources = ref<any[]>([])

// 当前选中的数据源
const currentSource = ref<string>('')

// 新数据源表单
const newSourceForm = reactive({
  name: '',
  type: 'api',
  url: '',
  method: 'GET',
  headers: {},
  params: {},
  dataPath: '',
  refreshInterval: 0,
  chartType: 'pie',
  description: ''
})

// 表单可见性
const formVisible = ref<boolean>(false)

// 测试结果
const testResult = ref<any>(null)

// 测试状态
const testing = ref<boolean>(false)

// 测试结果对话框可见性
const testResultVisible = ref<boolean>(false)

// 加载状态
const loading = ref<boolean>(false)

// 图表类型选项
const chartTypeOptions = [
  { label: '饼图', value: 'pie' },
  { label: '仪表盘', value: 'gauge' },
  { label: '柱状图', value: 'bar' },
  { label: '折线图', value: 'line' },
  { label: '雷达图', value: 'radar' },
  { label: '3D柱状图', value: 'bar3d' },
  { label: '3D地图', value: 'map3d' },
  { label: '热力图', value: 'heatmap' }
]

// 请求方法选项
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
]

// 数据源类型选项
const sourceTypeOptions = [
  { label: 'API接口', value: 'api' },
  { label: 'WebSocket', value: 'websocket' },
  { label: '静态JSON', value: 'static' },
  { label: 'CSV文件', value: 'csv' },
  { label: '数据库', value: 'database' },
  { label: 'Prometheus', value: 'prometheus' },
  { label: 'GraphQL', value: 'graphql' },
  { label: 'Excel文件', value: 'excel' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'MongoDB', value: 'mongodb' },
  { label: 'Redis', value: 'redis' },
  { label: 'InfluxDB', value: 'influxdb' },
  { label: 'Elasticsearch', value: 'elasticsearch' },
  { label: 'Kafka', value: 'kafka' }
]

// 初始化数据源列表
const initDataSources = async () => {
  loading.value = true
  try {
    // 从IndexedDB加载数据源配置
    const sources = await dbService.getDataSources()
    dataSources.value = sources || []
    
    // 如果没有数据源，添加示例数据源
    if (dataSources.value.length === 0) {
      dataSources.value = [
        {
          id: 'example-api',
          name: '示例API',
          type: 'api',
          url: 'https://api.example.com/data',
          method: 'GET',
          chartType: 'pie',
          description: '这是一个示例API数据源'
        }
      ]
      // 保存到数据库
      await dbService.saveDataSources(dataSources.value)
    }
    
    // 设置当前选中的数据源
    if (dataSources.value.length > 0 && !currentSource.value) {
      currentSource.value = dataSources.value[0].id
    }
  } catch (error) {
    console.error('加载数据源失败:', error)
    ElMessage.error('加载数据源失败')
  } finally {
    loading.value = false
  }
}

// 添加新数据源
const addDataSource = async () => {
  // 表单验证
  if (!newSourceForm.name || !newSourceForm.url) {
    ElMessage.warning('请填写数据源名称和URL')
    return
  }
  
  try {
    // 创建新数据源对象
    const newSource = {
      id: `source-${Date.now()}`,
      ...newSourceForm
    }
    
    // 添加到数据源列表
    dataSources.value.push(newSource)
    
    // 保存到数据库
    await dbService.saveDataSources(dataSources.value)
    
    // 重置表单
    Object.keys(newSourceForm).forEach(key => {
      if (key !== 'type' && key !== 'method' && key !== 'chartType') {
        newSourceForm[key] = ''
      }
    })
    newSourceForm.refreshInterval = 0
    
    // 关闭表单
    formVisible.value = false
    
    // 设置为当前选中的数据源
    currentSource.value = newSource.id
    
    ElMessage.success('添加数据源成功')
  } catch (error) {
    console.error('添加数据源失败:', error)
    ElMessage.error('添加数据源失败')
  }
}

// 删除数据源
const deleteDataSource = async (id: string) => {
  try {
    // 从列表中删除
    dataSources.value = dataSources.value.filter(source => source.id !== id)
    
    // 保存到数据库
    await dbService.saveDataSources(dataSources.value)
    
    // 如果删除的是当前选中的数据源，重置选中项
    if (currentSource.value === id) {
      currentSource.value = dataSources.value.length > 0 ? dataSources.value[0].id : ''
    }
    
    ElMessage.success('删除数据源成功')
  } catch (error) {
    console.error('删除数据源失败:', error)
    ElMessage.error('删除数据源失败')
  }
}

// 测试数据源连接
const testDataSource = async (source: any) => {
  testing.value = true
  testResult.value = null
  testResultVisible.value = true
  
  try {
    let result
    
    // 根据数据源类型进行不同的测试
    if (source.type === 'api') {
      // 测试API接口
      const response = await service({
        url: source.url,
        method: source.method,
        params: source.method === 'GET' ? source.params : undefined,
        data: source.method !== 'GET' ? source.params : undefined,
        headers: source.headers
      })
      
      result = response
      
      // 如果指定了数据路径，尝试获取指定路径的数据
      if (source.dataPath) {
        const paths = source.dataPath.split('.')
        let data = response
        
        for (const path of paths) {
          if (data && data[path] !== undefined) {
            data = data[path]
          } else {
            throw new Error(`数据路径 ${source.dataPath} 无效`)
          }
        }
        
        result = data
      }
    } else if (source.type === 'prometheus') {
      // 测试Prometheus数据源
      const response = await service({
        url: `${source.url}/api/v1/query?query=${encodeURIComponent(source.query)}`,
        method: 'GET'
      })
      result = response.data
    } else if (source.type === 'graphql') {
      // 测试GraphQL数据源
      const response = await service({
        url: source.url,
        method: 'POST',
        data: {
          query: source.query
        }
      })
      result = response.data
    } else if (source.type === 'database') {
      // 测试数据库连接
      const { testDatabaseConnection } = await import('../utils/db')
      result = await testDatabaseConnection(source.connectionString)
    } else if (source.type === 'websocket') {
      // WebSocket测试逻辑
      ElMessage.info('WebSocket测试功能开发中')
      return
    } else if (source.type === 'static') {
      // 静态JSON测试
      try {
        result = JSON.parse(source.url)
      } catch (e) {
        throw new Error('静态JSON格式无效')
      }
    }
    
    // 显示测试结果
    testResult.value = result
    ElMessage.success('测试成功')
  } catch (error) {
    console.error('测试数据源失败:', error)
    ElMessage.error(`测试失败: ${error.message || '未知错误'}`)
  } finally {
    testing.value = false
  }
}

// 应用数据源
const applyDataSource = async (id: string) => {
  // 查找选中的数据源
  const source = dataSources.value.find(s => s.id === id)
  if (!source) return
  
  try {
    // 根据数据源类型获取数据
    let data
    
    if (source.type === 'api') {
      // 从API获取数据
      const response = await service({
        url: source.url,
        method: source.method,
        params: source.method === 'GET' ? source.params : undefined,
        data: source.method !== 'GET' ? source.params : undefined,
        headers: source.headers
      })
      
      data = response
      
      // 如果指定了数据路径，获取指定路径的数据
      if (source.dataPath) {
        const paths = source.dataPath.split('.')
        let pathData = response
        
        for (const path of paths) {
          if (pathData && pathData[path] !== undefined) {
            pathData = pathData[path]
          } else {
            throw new Error(`数据路径 ${source.dataPath} 无效`)
          }
        }
        
        data = pathData
      }
    } else if (source.type === 'static') {
      // 解析静态JSON
      try {
        data = JSON.parse(source.url)
      } catch (e) {
        throw new Error('静态JSON格式无效')
      }
    }
    
    // 转换数据格式，适配不同图表类型
    const formattedData = formatDataForChart(data, source.chartType)
    
    // 发出事件，通知父组件数据已更新
    emit('data-updated', {
      sourceId: source.id,
      chartType: source.chartType,
      data: formattedData
    })
    
    ElMessage.success('应用数据源成功')
  } catch (error) {
    console.error('应用数据源失败:', error)
    ElMessage.error(`应用失败: ${error.message || '未知错误'}`)
  }
}

// 格式化数据，适配不同图表类型
const formatDataForChart = (data: any, chartType: string) => {
  // 如果数据是数组
  if (Array.isArray(data)) {
    switch (chartType) {
      case 'pie':
        // 确保数据有name和value字段
        return data.map(item => ({
          name: item.name || item.label || item.category || '未命名',
          value: Number(item.value || item.count || 0)
        }))
      
      case 'gauge':
        // 仪表盘只需要一个数值
        if (typeof data[0] === 'number') {
          return data[0]
        } else if (typeof data[0] === 'object') {
          return Number(data[0].value || data[0].count || 0)
        }
        return 0
      
      case 'bar':
      case 'line':
        // 确保数据有name和value字段
        return data.map(item => ({
          name: item.name || item.label || item.category || item.date || '未命名',
          value: Number(item.value || item.count || 0)
        }))
      
      case 'radar':
        // 雷达图需要特定格式
        if (data[0] && Array.isArray(data[0].value)) {
          return data
        } else {
          // 尝试转换为雷达图格式
          const indicators = Object.keys(data[0]).filter(key => key !== 'name' && key !== 'category')
          return data.map(item => ({
            name: item.name || item.category || '未命名',
            value: indicators.map(key => Number(item[key] || 0))
          }))
        }
      
      case 'bar3d':
      case 'map3d':
        // 3D图表需要x,y,z坐标
        return data.map((item, index) => ({
          name: item.name || item.label || item.category || '未命名',
          value: Number(item.value || item.count || 0),
          x: item.x || index * 10,
          y: item.y || Number(item.value || item.count || 0) / 10,
          z: item.z || index * 5
        }))
      
      default:
        return data
    }
  } else if (typeof data === 'object') {
    // 如果数据是对象，转换为数组
    const result = Object.keys(data).map(key => ({
      name: key,
      value: Number(data[key] || 0)
    }))
    return formatDataForChart(result, chartType)
  } else if (typeof data === 'number') {
    // 如果数据是单个数值，适用于仪表盘
    if (chartType === 'gauge') {
      return data
    } else {
      return [{ name: '值', value: data }]
    }
  }
  
  // 默认返回原始数据
  return data
}

// 导入数据源配置文件
const importDataSource = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  const file = input.files[0]
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const importedSources = JSON.parse(content)
        
        if (Array.isArray(importedSources)) {
          // 验证导入的数据源格式
          const validSources = importedSources.filter(source => 
            source.id && source.name && source.type
          )
          
          if (validSources.length === 0) {
            ElMessage.error('导入的数据源格式无效')
            return
          }
          
          // 添加导入的数据源
          dataSources.value = [...dataSources.value, ...validSources]
          await dbService.saveDataSources(dataSources.value)
          ElMessage.success(`成功导入${validSources.length}个数据源`)
        } else {
          ElMessage.error('导入的数据源格式无效')
        }
      } catch (error) {
        console.error('解析导入文件失败:', error)
        ElMessage.error('解析导入文件失败')
      }
    }
    reader.readAsText(file)
  } catch (error) {
    console.error('导入数据源失败:', error)
    ElMessage.error('导入数据源失败')
  } finally {
    // 清空文件输入，以便于再次选择相同文件
    input.value = ''
  }
}

// 导出数据源配置
const exportDataSources = () => {
  try {
    const dataStr = JSON.stringify(dataSources.value, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileName = `visualization-datasources-${new Date().toISOString().slice(0, 10)}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileName)
    linkElement.click()
    
    ElMessage.success('数据源配置导出成功')
  } catch (error) {
    console.error('导出数据源失败:', error)
    ElMessage.error('导出数据源失败')
  }
}

// 定义事件
const emit = defineEmits(['data-updated'])

// 关闭测试结果对话框
const closeTestResult = () => {
  testResultVisible.value = false;
};

// 组件挂载时初始化
onMounted(() => {
  initDataSources()
})
</script>

<template>
  <div class="data-source-manager">
    <div class="manager-header">
      <h3>数据源管理</h3>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="formVisible = true">
          <el-icon><Plus /></el-icon> 添加数据源
        </el-button>
        <el-button type="success" size="small" @click="exportDataSources">
          <el-icon><Download /></el-icon> 导出配置
        </el-button>
        <el-button type="warning" size="small" @click="$refs.importInput.click()">
          <el-icon><Upload /></el-icon> 导入配置
        </el-button>
        <input
          ref="importInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="importDataSource"
        />
      </div>
    </div>
    
    <div class="data-source-list" v-loading="loading">
      <el-empty v-if="dataSources.length === 0" description="暂无数据源"></el-empty>
      
      <el-card v-for="source in dataSources" :key="source.id" class="source-card" :class="{ active: currentSource === source.id }">
        <div class="source-header">
          <div class="source-title">
            <el-tag :type="source.type === 'api' ? 'primary' : source.type === 'websocket' ? 'success' : 'warning'">
              {{ source.type === 'api' ? 'API' : source.type === 'websocket' ? 'WebSocket' : source.type === 'static' ? 'JSON' : 'CSV' }}
            </el-tag>
            <span>{{ source.name }}</span>
          </div>
          <div class="source-actions">
            <el-button-group>
              <el-button size="small" type="primary" @click="applyDataSource(source.id)">
                应用
              </el-button>
              <el-button size="small" type="info" @click="testDataSource(source)">
                测试
              </el-button>
              <el-button size="small" type="danger" @click="deleteDataSource(source.id)">
                删除
              </el-button>
            </el-button-group>
          </div>
        </div>
        
        <div class="source-content">
          <div class="source-info">
            <p><strong>URL:</strong> {{ source.url }}</p>
            <p><strong>图表类型:</strong> {{ chartTypeOptions.find(opt => opt.value === source.chartType)?.label || source.chartType }}</p>
            <p v-if="source.description"><strong>描述:</strong> {{ source.description }}</p>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 测试结果 -->
    <el-dialog v-model="testResultVisible" title="测试结果" width="60%">
      <div v-loading="testing">
        <pre class="test-result">{{ JSON.stringify(testResult, null, 2) }}</pre>
      </div>
      <template #footer>
        <el-button @click="closeTestResult">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 添加数据源表单 -->
    <el-dialog v-model="formVisible" title="添加数据源" width="50%">
      <el-form :model="newSourceForm" label-width="100px">
        <el-form-item label="数据源名称" required>
          <el-input v-model="newSourceForm.name" placeholder="请输入数据源名称"></el-input>
        </el-form-item>
        
        <el-form-item label="数据源类型">
          <el-select v-model="newSourceForm.type" placeholder="请选择数据源类型">
            <el-option
              v-for="option in sourceTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="URL/内容" required>
          <el-input
            v-if="newSourceForm.type === 'static'"
            v-model="newSourceForm.url"
            type="textarea"
            :rows="5"
            placeholder="请输入JSON数据"
          ></el-input>
          <el-input
            v-else
            v-model="newSourceForm.url"
            placeholder="请输入URL地址"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="请求方法" v-if="newSourceForm.type === 'api'">
          <el-select v-model="newSourceForm.method" placeholder="请选择请求方法">
            <el-option
              v-for="option in methodOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="数据路径" v-if="newSourceForm.type === 'api'">
          <el-input
            v-model="newSourceForm.dataPath"
            placeholder="例如: data.items (可选)"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="图表类型">
          <el-select v-model="newSourceForm.chartType" placeholder="请选择图表类型">
            <el-option
              v-for="option in chartTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="刷新间隔" v-if="newSourceForm.type === 'api'">
          <el-input-number
            v-model="newSourceForm.refreshInterval"
            :min="0"
            :step="1000"
            placeholder="刷新间隔(毫秒)"
          ></el-input-number>
          <span class="form-tip">0表示不自动刷新</span>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="newSourceForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入数据源描述(可选)"
          ></el-input>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="addDataSource">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.data-source-manager {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.manager-header h3 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.data-source-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.source-card {
  transition: all 0.3s;
}

.source-card.active {
  border-left: 4px solid #1890ff;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.source-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
}

.source-content {
  margin-top: 10px;
}

.source-info p {
  margin: 5px 0;
  color: #666;
}

.test-result {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
  font-family: monospace;
}

.form-tip {
  margin-left: 10px;
  color: #999;
  font-size: 12px;
}
</style>