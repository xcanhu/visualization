<template>
  <div class="data-source-editor">
    <!-- 数据源基本信息表单 -->
    <el-form label-position="top" :model="dataSourceForm" :rules="formRules" ref="formRef">
      <el-form-item label="数据源名称" prop="name">
        <el-input v-model="dataSourceForm.name" placeholder="请输入数据源名称" />
      </el-form-item>
      
      <el-form-item label="数据源类型" prop="type">
        <el-select v-model="dataSourceForm.type" placeholder="请选择数据源类型" style="width: 100%">
          <el-option-group label="API数据源">
            <el-option value="api" label="RESTful API" />
            <el-option value="graphql" label="GraphQL API" />
            <el-option value="websocket" label="WebSocket" />
          </el-option-group>
          <el-option-group label="文件数据源">
            <el-option value="json" label="JSON文件" />
            <el-option value="csv" label="CSV文件" />
            <el-option value="excel" label="Excel文件" />
          </el-option-group>
          <el-option-group label="数据库数据源">
            <el-option value="mysql" label="MySQL" />
            <el-option value="postgresql" label="PostgreSQL" />
            <el-option value="mongodb" label="MongoDB" />
            <el-option value="elasticsearch" label="Elasticsearch" />
          </el-option-group>
          <el-option-group label="实时数据源">
            <el-option value="mqtt" label="MQTT" />
            <el-option value="kafka" label="Kafka" />
            <el-option value="random" label="随机数据(测试用)" />
          </el-option-group>
        </el-select>
      </el-form-item>
      
      <!-- API类型数据源配置 -->
      <template v-if="dataSourceForm.type === 'api'">
        <el-form-item label="API地址" prop="url">
          <el-input v-model="dataSourceForm.url" placeholder="例如: https://api.example.com/data" />
        </el-form-item>
        
        <el-form-item label="请求方法" prop="method">
          <el-select v-model="dataSourceForm.method" style="width: 100%">
            <el-option value="GET" label="GET" />
            <el-option value="POST" label="POST" />
            <el-option value="PUT" label="PUT" />
            <el-option value="DELETE" label="DELETE" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="请求头">
          <el-collapse accordion>
            <el-collapse-item title="添加请求头" name="headers">
              <div v-for="(_, index) in headersArray" :key="index" class="param-item">
                <el-input v-model="headersArray[index].key" placeholder="键" />
                <el-input v-model="headersArray[index].value" placeholder="值" />
                <el-button type="danger" circle @click="removeHeader(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <div class="add-button">
                <el-button type="primary" @click="addHeader">添加请求头</el-button>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
        
        <el-form-item label="请求参数">
          <el-collapse accordion>
            <el-collapse-item title="添加请求参数" name="params">
              <div v-for="(_, index) in paramsArray" :key="index" class="param-item">
                <el-input v-model="paramsArray[index].key" placeholder="键" />
                <el-input v-model="paramsArray[index].value" placeholder="值" />
                <el-button type="danger" circle @click="removeParam(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <div class="add-button">
                <el-button type="primary" @click="addParam">添加参数</el-button>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
        
        <el-form-item label="数据路径">
          <el-input v-model="dataSourceForm.dataPath" placeholder="例如: data.items 或 result.list" />
          <div class="form-tip">从API响应中提取数据的路径，用点号分隔。留空则使用整个响应。</div>
        </el-form-item>
      </template>
      
      <!-- GraphQL类型数据源配置 -->
      <template v-if="dataSourceForm.type === 'graphql'">
        <el-form-item label="GraphQL端点" prop="url">
          <el-input v-model="dataSourceForm.url" placeholder="例如: https://api.example.com/graphql" />
        </el-form-item>
        
        <el-form-item label="查询语句" prop="query">
          <el-input v-model="dataSourceForm.query" type="textarea" rows="4" placeholder="例如: query { users { id name email } }" />
        </el-form-item>
        
        <el-form-item label="查询变量">
          <el-input v-model="dataSourceForm.variables" type="textarea" rows="2" placeholder="JSON格式，例如: { &quot;limit&quot;: 10 }" />
        </el-form-item>
      </template>
      
      <!-- WebSocket类型数据源配置 -->
      <template v-if="dataSourceForm.type === 'websocket'">
        <el-form-item label="WebSocket URL" prop="url">
          <el-input v-model="dataSourceForm.url" placeholder="例如: ws://example.com/socket" />
        </el-form-item>
        
        <el-form-item label="订阅主题">
          <el-input v-model="dataSourceForm.topic" placeholder="例如: data.realtime" />
        </el-form-item>
      </template>
      
      <!-- 文件类型数据源配置 -->
      <template v-if="['json', 'csv', 'excel'].includes(dataSourceForm.type)">
        <el-form-item label="文件上传">
          <el-upload
            drag
            :action="uploadAction"
            :before-upload="beforeFileUpload"
            :http-request="customUpload"
            :limit="1"
            :on-exceed="handleExceed"
            :file-list="fileList"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 {{ dataSourceForm.type.toUpperCase() }} 文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <template v-if="dataSourceForm.type === 'csv'">
          <el-form-item label="分隔符">
            <el-select v-model="dataSourceForm.delimiter" style="width: 100%">
              <el-option value="," label="逗号 (,)" />
              <el-option value=";" label="分号 (;)" />
              <el-option value="\t" label="制表符 (Tab)" />
              <el-option value="|" label="竖线 (|)" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="是否包含表头">
            <el-switch v-model="dataSourceForm.hasHeader" />
          </el-form-item>
        </template>
      </template>
      
      <!-- 随机数据选项 -->
      <template v-if="dataSourceForm.type === 'random'">
        <el-form-item label="数据类型">
          <el-select v-model="dataSourceForm.randomDataType" style="width: 100%">
            <el-option value="pie" label="饼图数据" />
            <el-option value="bar" label="柱状图数据" />
            <el-option value="line" label="折线图数据" />
            <el-option value="map" label="地图数据" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="数据点数量">
          <el-slider v-model="dataSourceForm.randomDataCount" :min="5" :max="50" />
        </el-form-item>
        
        <el-form-item label="更新频率(秒)">
          <el-slider v-model="dataSourceForm.refreshInterval" :min="0" :max="60" />
          <div class="form-tip">设置为0表示不自动更新</div>
        </el-form-item>
      </template>
      
      <!-- 通用配置 -->
      <el-form-item label="首选图表类型">
        <el-select v-model="dataSourceForm.chartType" style="width: 100%">
          <el-option value="pie" label="饼图" />
          <el-option value="bar" label="柱状图" />
          <el-option value="line" label="折线图" />
          <el-option value="map" label="地图" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="描述">
        <el-input v-model="dataSourceForm.description" type="textarea" rows="2" placeholder="请输入数据源描述信息" />
      </el-form-item>
      
      <el-form-item>
        <div class="form-actions">
          <el-button @click="resetForm">重置</el-button>
          <el-button type="primary" @click="testDataSource">测试连接</el-button>
          <el-button type="success" @click="saveDataSource">保存</el-button>
        </div>
      </el-form-item>
    </el-form>
    
    <!-- 测试结果展示 -->
    <el-collapse v-if="testResult" accordion>
      <el-collapse-item title="测试结果" name="test-result">
        <div class="test-result">
          <div class="test-status" :class="{ 'success': testSuccess, 'error': !testSuccess }">
            {{ testSuccess ? '连接成功' : '连接失败' }}
          </div>
          <div v-if="testSuccess" class="data-preview">
            <h4>数据预览</h4>
            <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
          </div>
          <div v-else class="error-message">
            <h4>错误信息</h4>
            <pre>{{ testResult }}</pre>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Delete, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, UploadProps, UploadUserFile } from 'element-plus'
import { nanoid } from 'nanoid'
import { PropType } from 'vue'

const props = defineProps({
  // 如果是编辑模式，传入现有的数据源信息
  dataSource: {
    type: Object as PropType<Record<string, any> | null>,
    default: null
  },
  // 是否是编辑模式
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'cancel', 'test'])

// 表单引用
const formRef = ref<FormInstance>()

// 文件列表
const fileList = ref<UploadUserFile[]>([])

// 测试结果
const testResult = ref(null)
const testSuccess = ref(false)

// 请求头数组
const headersArray = ref<{ key: string, value: string }[]>([
  { key: '', value: '' }
])

// 请求参数数组
const paramsArray = ref<{ key: string, value: string }[]>([
  { key: '', value: '' }
])

// 上传操作
const uploadAction = ''
const beforeFileUpload: UploadProps['beforeUpload'] = (file) => {
  // 根据数据源类型验证文件类型
  const { type } = dataSourceForm
  if (type === 'json' && file.type !== 'application/json') {
    ElMessage.error('只能上传JSON文件!')
    return false
  }
  
  if (type === 'csv' && file.type !== 'text/csv') {
    ElMessage.error('只能上传CSV文件!')
    return false
  }
  
  if (type === 'excel' && !['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
    ElMessage.error('只能上传Excel文件!')
    return false
  }
  
  return true
}

// 自定义上传处理
const customUpload = async (options) => {
  const file = options.file
  
  // 保存文件引用
  dataSourceForm.file = file
  
  // 更新文件列表显示
  fileList.value = [{ name: file.name, url: '', raw: file }]
  
  // 简单读取文件预览(JSON和CSV)
  if (['json', 'csv'].includes(dataSourceForm.type)) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        if (dataSourceForm.type === 'json') {
          const data = JSON.parse(e.target.result as string)
          testResult.value = data
          testSuccess.value = true
        } else if (dataSourceForm.type === 'csv') {
          const data = (e.target.result as string).split('\n').slice(0, 5)
          testResult.value = data
          testSuccess.value = true
        }
      } catch (error) {
        testResult.value = error.message
        testSuccess.value = false
      }
    }
    reader.readAsText(file)
  }
  
  options.onSuccess()
}

// 处理超出文件数量限制
const handleExceed = () => {
  ElMessage.warning('只能上传一个文件，请先删除当前文件再上传')
}

// 数据源表单数据
const dataSourceForm = reactive({
  id: '',
  name: '',
  type: 'api',
  url: '',
  method: 'GET',
  headers: {},
  params: {},
  dataPath: '',
  query: '',
  variables: '',
  topic: '',
  file: null,
  delimiter: ',',
  hasHeader: true,
  randomDataType: 'pie',
  randomDataCount: 10,
  refreshInterval: 0,
  chartType: 'pie',
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入数据源名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应为2到50个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择数据源类型', trigger: 'change' }
  ],
  url: [
    { required: true, message: '请输入URL地址', trigger: 'blur' }
  ],
  method: [
    { required: true, message: '请选择请求方法', trigger: 'change' }
  ],
  query: [
    { required: true, message: '请输入GraphQL查询语句', trigger: 'blur' }
  ]
}

// 初始化表单数据
const initForm = () => {
  if (props.isEdit && props.dataSource) {
    // 编辑模式，填充已有数据
    Object.keys(props.dataSource).forEach(key => {
      if (dataSourceForm.hasOwnProperty(key)) {
        dataSourceForm[key] = props.dataSource[key]
      }
    })
    
    // 处理headers和params
    if (props.dataSource.headers) {
      headersArray.value = Object.entries(props.dataSource.headers).map(([key, value]) => ({ key, value: value as string }))
      if (headersArray.value.length === 0) {
        headersArray.value.push({ key: '', value: '' })
      }
    }
    
    if (props.dataSource.params) {
      paramsArray.value = Object.entries(props.dataSource.params).map(([key, value]) => ({ key, value: value as string }))
      if (paramsArray.value.length === 0) {
        paramsArray.value.push({ key: '', value: '' })
      }
    }
  } else {
    // 新建模式，使用默认值
    dataSourceForm.id = nanoid()
  }
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  headersArray.value = [{ key: '', value: '' }]
  paramsArray.value = [{ key: '', value: '' }]
  fileList.value = []
  testResult.value = null
  initForm()
}

// 添加请求头
const addHeader = () => {
  headersArray.value.push({ key: '', value: '' })
}

// 移除请求头
const removeHeader = (index: number) => {
  headersArray.value.splice(index, 1)
  if (headersArray.value.length === 0) {
    headersArray.value.push({ key: '', value: '' })
  }
}

// 添加请求参数
const addParam = () => {
  paramsArray.value.push({ key: '', value: '' })
}

// 移除请求参数
const removeParam = (index: number) => {
  paramsArray.value.splice(index, 1)
  if (paramsArray.value.length === 0) {
    paramsArray.value.push({ key: '', value: '' })
  }
}

// 转换请求头和参数数组为对象
const transformArraysToObjects = () => {
  // 转换headers
  dataSourceForm.headers = {}
  headersArray.value.forEach(item => {
    if (item.key.trim()) {
      dataSourceForm.headers[item.key.trim()] = item.value
    }
  })
  
  // 转换params
  dataSourceForm.params = {}
  paramsArray.value.forEach(item => {
    if (item.key.trim()) {
      dataSourceForm.params[item.key.trim()] = item.value
    }
  })
}

// 测试数据源连接
const testDataSource = async () => {
  // 表单验证
  if (!formRef.value) return
  
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请先完善表单信息')
    return
  }
  
  // 准备测试数据
  transformArraysToObjects()
  
  // 如果是随机数据源，直接生成测试数据
  if (dataSourceForm.type === 'random') {
    generateRandomData()
    return
  }
  
  // 触发测试事件
  emit('test', { ...dataSourceForm })
}

// 生成随机测试数据
const generateRandomData = () => {
  const count = dataSourceForm.randomDataCount
  let data = []
  
  switch (dataSourceForm.randomDataType) {
    case 'pie':
      data = Array.from({ length: count }, (_, i) => ({
        name: `类别${i + 1}`,
        value: Math.round(Math.random() * 1000)
      }))
      break
      
    case 'bar':
      data = Array.from({ length: count }, (_, i) => ({
        name: `类别${i + 1}`,
        value: Math.round(Math.random() * 1000)
      }))
      break
      
    case 'line':
      data = Array.from({ length: count }, (_, i) => ({
        time: `2023-${Math.floor(i / 4) + 1}-${(i % 4) * 7 + 1}`,
        value: Math.round(Math.random() * 1000)
      }))
      break
      
    case 'map':
      data = [
        { name: '北京', value: Math.round(Math.random() * 1000) },
        { name: '上海', value: Math.round(Math.random() * 1000) },
        { name: '广州', value: Math.round(Math.random() * 1000) },
        { name: '深圳', value: Math.round(Math.random() * 1000) },
        { name: '杭州', value: Math.round(Math.random() * 1000) }
      ]
      break
  }
  
  testResult.value = data
  testSuccess.value = true
}

// 保存数据源
const saveDataSource = async () => {
  // 表单验证
  if (!formRef.value) return
  
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请先完善表单信息')
    return
  }
  
  // 转换数组为对象
  transformArraysToObjects()
  
  // 触发保存事件
  emit('save', { ...dataSourceForm })
}

// 监听数据源类型变化，重置相关字段
watch(() => dataSourceForm.type, (newType) => {
  // 重置部分字段
  testResult.value = null
  fileList.value = []
  
  // 根据类型设置默认图表类型
  switch (newType) {
    case 'api':
    case 'graphql':
      // API类型默认保持用户选择的图表类型
      break
    case 'random':
      dataSourceForm.chartType = dataSourceForm.randomDataType
      break
    case 'json':
    case 'csv':
    case 'excel':
      // 文件类型默认为表格
      dataSourceForm.chartType = 'bar'
      break
    case 'websocket':
      // 实时数据默认为折线图
      dataSourceForm.chartType = 'line'
      break
  }
})

// 随机数据类型变化时，同步图表类型
watch(() => dataSourceForm.randomDataType, (newType) => {
  if (dataSourceForm.type === 'random') {
    dataSourceForm.chartType = newType
  }
})

// 初始化
initForm()
</script>

<style scoped>
.data-source-editor {
  padding: 20px;
}

.param-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.add-button {
  margin-top: 10px;
  text-align: center;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.test-result {
  padding: 10px;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.test-status {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.test-status.success {
  color: #67c23a;
  background-color: #f0f9eb;
}

.test-status.error {
  color: #f56c6c;
  background-color: #fef0f0;
}

.data-preview, .error-message {
  margin-top: 20px;
}

.data-preview h4, .error-message h4 {
  margin-bottom: 10px;
}

pre {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 10px;
  max-height: 300px;
  overflow: auto;
  font-family: monospace;
  font-size: 12px;
}
</style> 