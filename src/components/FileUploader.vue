<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useDataStore } from '../stores'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

const emit = defineEmits(['file-uploaded', 'data-loaded'])

const props = defineProps({
  allowedTypes: {
    type: Array as () => string[],
    default: () => ['json', 'csv', 'xlsx', 'xls']
  },
  maxSize: {
    type: Number,
    default: 10 // MB
  }
})

// 获取数据存储
const dataStore = useDataStore()

// 当前文件
const currentFile = ref<File | null>(null)

// 上传状态
const uploading = ref<boolean>(false)

// 预览数据
const previewData = ref<any>(null)

// 配置选项
const parseOptions = reactive({
  sheet: 0, // Excel工作表索引
  header: true, // CSV/Excel是否有表头
  delimiter: ',', // CSV分隔符
  dataPath: '', // JSON数据路径
  skipRows: 0, // 跳过的行数
  chartType: 'pie' // 默认图表类型
})

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

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  const file = input.files[0]
  
  // 检查文件大小
  if (file.size > props.maxSize * 1024 * 1024) {
    ElMessage.error(`文件大小不能超过${props.maxSize}MB`)
    input.value = ''
    return
  }
  
  // 检查文件类型
  const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
  if (!props.allowedTypes.includes(fileExt)) {
    ElMessage.error(`不支持的文件类型: ${fileExt}，支持: ${props.allowedTypes.join(', ')}`)
    input.value = ''
    return
  }
  
  // 设置当前文件
  currentFile.value = file
  
  // 预览文件
  previewFile(file)
}

// 预览文件内容
const previewFile = async (file: File) => {
  try {
    uploading.value = true
    
    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    
    if (fileExt === 'json') {
      // 解析JSON文件
      const text = await file.text()
      const data = JSON.parse(text)
      previewData.value = data
    } else if (fileExt === 'csv') {
      // 解析CSV文件
      const text = await file.text()
      const result = Papa.parse(text, {
        header: parseOptions.header,
        skipEmptyLines: true
      })
      previewData.value = result.data
    } else if (['xlsx', 'xls'].includes(fileExt)) {
      // 解析Excel文件
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      
      // 获取工作表名称列表
      const sheetNames = workbook.SheetNames
      
      // 使用第一个工作表
      const worksheet = workbook.Sheets[sheetNames[parseOptions.sheet]]
      
      // 转换为JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: parseOptions.header ? 1 : 0 })
      previewData.value = data
    }
    
    ElMessage.success('文件预览成功')
    emit('file-uploaded', file)
  } catch (error) {
    console.error('预览文件失败:', error)
    ElMessage.error(`预览文件失败: ${error.message || '未知错误'}`)
    previewData.value = null
  } finally {
    uploading.value = false
  }
}

// 处理数据加载并发送给父组件
const loadData = () => {
  if (!previewData.value) {
    ElMessage.warning('没有可用的数据')
    return
  }
  
  try {
    let finalData = previewData.value
    
    // 处理数据路径
    if (parseOptions.dataPath && typeof finalData === 'object') {
      const paths = parseOptions.dataPath.split('.')
      for (const path of paths) {
        if (finalData && finalData[path] !== undefined) {
          finalData = finalData[path]
        } else {
          throw new Error(`数据路径 ${parseOptions.dataPath} 无效`)
        }
      }
    }
    
    // 跳过行
    if (parseOptions.skipRows > 0 && Array.isArray(finalData)) {
      finalData = finalData.slice(parseOptions.skipRows)
    }
    
    // 将数据保存到数据存储
    dataStore.setUploadedData({
      data: finalData,
      chartType: parseOptions.chartType,
      fileName: currentFile.value?.name || 'unknown.file',
      timestamp: Date.now()
    })
    
    // 发出数据加载事件
    emit('data-loaded', {
      data: finalData,
      chartType: parseOptions.chartType
    })
    
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error(`加载数据失败: ${error.message || '未知错误'}`)
  }
}

// 清除文件
const clearFile = () => {
  currentFile.value = null
  previewData.value = null
  
  // 重置文件输入
  const fileInput = document.querySelector('#file-upload') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}
</script>

<template>
  <div class="file-uploader">
    <div class="upload-area">
      <div class="upload-header">
        <h3>数据文件上传</h3>
        <p class="upload-desc">
          支持的文件类型: {{ props.allowedTypes.join(', ') }}
          <br>
          最大文件大小: {{ props.maxSize }}MB
        </p>
      </div>
      
      <div 
        class="drop-zone"
        :class="{ 'has-file': currentFile }"
        @dragover.prevent
        @drop.prevent="handleFileSelect"
      >
        <el-icon v-if="!currentFile" class="upload-icon"><upload-filled /></el-icon>
        <div v-if="!currentFile" class="upload-text">
          <p>拖拽文件到此处或</p>
          <div class="file-select-container">
            <el-button type="primary" size="small" @click.stop.prevent>
              选择文件
            </el-button>
            <input 
              type="file" 
              id="file-upload"
              class="file-input"
              @change="handleFileSelect"
              @click.stop.prevent
              :accept="props.allowedTypes.map(type => `.${type}`).join(',')"
            >
          </div>
        </div>
        
        <div v-else class="file-info">
          <el-icon class="file-icon"><document /></el-icon>
          <div class="file-details">
            <p class="file-name">{{ currentFile.name }}</p>
            <p class="file-size">{{ (currentFile.size / 1024).toFixed(1) }} KB</p>
          </div>
          <el-button 
            type="danger" 
            icon="delete" 
            circle 
            size="small"
            @click.stop="clearFile"
          ></el-button>
        </div>
      </div>
    </div>
    
    <div v-if="currentFile" class="parse-options">
      <h4>解析选项</h4>
      
      <el-form :model="parseOptions" label-width="100px" size="small">
        <!-- JSON数据路径 -->
        <el-form-item 
          label="数据路径" 
          v-if="currentFile?.name.toLowerCase().endsWith('.json')"
        >
          <el-input 
            v-model="parseOptions.dataPath" 
            placeholder="例如: data.items (可选)"
          ></el-input>
        </el-form-item>
        
        <!-- CSV选项 -->
        <el-form-item 
          label="CSV分隔符" 
          v-if="currentFile?.name.toLowerCase().endsWith('.csv')"
        >
          <el-select v-model="parseOptions.delimiter">
            <el-option label="逗号 (,)" value=","></el-option>
            <el-option label="分号 (;)" value=";"></el-option>
            <el-option label="制表符 (Tab)" value="\t"></el-option>
          </el-select>
        </el-form-item>
        
        <!-- Excel工作表选择 -->
        <el-form-item 
          label="工作表索引" 
          v-if="currentFile?.name.toLowerCase().endsWith('.xlsx') || 
                currentFile?.name.toLowerCase().endsWith('.xls')"
        >
          <el-input-number v-model="parseOptions.sheet" :min="0" :step="1"></el-input-number>
        </el-form-item>
        
        <!-- 通用选项 -->
        <el-form-item label="包含表头" v-if="!currentFile?.name.toLowerCase().endsWith('.json')">
          <el-switch v-model="parseOptions.header"></el-switch>
        </el-form-item>
        
        <el-form-item label="跳过行数">
          <el-input-number v-model="parseOptions.skipRows" :min="0" :step="1"></el-input-number>
        </el-form-item>
        
        <el-form-item label="图表类型">
          <el-select v-model="parseOptions.chartType">
            <el-option
              v-for="option in chartTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 数据预览 -->
    <div v-if="previewData" class="data-preview">
      <div class="preview-header">
        <h4>数据预览</h4>
        <el-button type="primary" @click.stop="loadData" :loading="uploading">
          加载数据
        </el-button>
      </div>
      
      <div class="preview-content">
        <el-table
          v-if="Array.isArray(previewData) && previewData.length > 0"
          :data="previewData.slice(0, 5)"
          border
          size="small"
          height="200px"
        >
          <el-table-column
            v-for="(value, key) in previewData[0]"
            :key="key"
            :prop="String(key)"
            :label="String(key)"
            min-width="120"
          ></el-table-column>
        </el-table>
        
        <pre v-else class="preview-json">{{ typeof previewData === 'object' ? JSON.stringify(previewData, null, 2) : previewData }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-uploader {
  width: 100%;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.upload-header {
  margin-bottom: 15px;
  text-align: center;
}

.upload-header h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.upload-desc {
  color: #909399;
  font-size: 12px;
  margin: 0;
}

.drop-zone {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 25px;
  text-align: center;
  background-color: #f5f7fa;
  transition: all 0.3s;
  cursor: pointer;
  margin-bottom: 20px;
}

.drop-zone:hover {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.06);
}

.drop-zone.has-file {
  border-color: #67c23a;
  background-color: rgba(103, 194, 58, 0.06);
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 10px;
}

.upload-text p {
  margin: 0 0 10px 0;
  color: #606266;
}

.file-select-container {
  position: relative;
  display: inline-block;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.file-icon {
  font-size: 32px;
  color: #409eff;
  margin-right: 15px;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  margin: 0;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 12px;
}

.parse-options {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.parse-options h4,
.data-preview h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.data-preview {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.preview-content {
  max-height: 300px;
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.preview-json {
  padding: 10px;
  margin: 0;
  font-family: monospace;
  white-space: pre-wrap;
  font-size: 12px;
  color: #606266;
  overflow: auto;
  max-height: 200px;
}
</style> 