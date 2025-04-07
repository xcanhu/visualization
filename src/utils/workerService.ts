// Web Worker服务包装器
import { ref } from 'vue'

// 导入Worker
// 注意：需要在vite.config.ts中配置worker-loader
const DataProcessorWorker = () => new Worker(new URL('../workers/dataProcessor.worker.ts', import.meta.url), { type: 'module' })

// 生成唯一ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 创建Worker服务
export function useWorkerService() {
  // 创建Worker实例
  const worker = DataProcessorWorker()
  
  // 存储回调函数
  const callbacks = new Map()
  
  // 处理Worker消息
  worker.onmessage = (event) => {
    const { type, data, id } = event.data
    
    if (id && callbacks.has(id)) {
      const { resolve, reject } = callbacks.get(id)
      
      if (type === 'error') {
        reject(new Error(data.message))
      } else {
        resolve(data)
      }
      
      // 清理回调
      callbacks.delete(id)
    }
  }
  
  // 处理Worker错误
  worker.onerror = (error) => {
    console.error('Worker error:', error)
  }
  
  // 发送消息到Worker并返回Promise
  const sendMessage = (type: string, data: any) => {
    return new Promise((resolve, reject) => {
      const id = generateId()
      
      // 存储回调
      callbacks.set(id, { resolve, reject })
      
      // 发送消息
      worker.postMessage({ type, data, id })
    })
  }
  
  // 聚合数据
  const aggregateData = (items: any[], options: any) => {
    return sendMessage('aggregate', { items, options })
  }
  
  // 过滤数据
  const filterData = (items: any[], filters: any[]) => {
    return sendMessage('filter', { items, filters })
  }
  
  // 排序数据
  const sortData = (items: any[], sortOptions: { field: string; order: 'asc' | 'desc' }) => {
    return sendMessage('sort', { items, sortOptions })
  }
  
  // 计算统计指标
  const calculateStatistics = (items: any[], field: string) => {
    return sendMessage('statistics', { items, field })
  }
  
  // 处理时间序列数据
  const processTimeSeriesData = (items: any[], options: any) => {
    return sendMessage('timeSeries', { items, options })
  }
  
  // 终止Worker
  const terminate = () => {
    worker.terminate()
  }
  
  return {
    aggregateData,
    filterData,
    sortData,
    calculateStatistics,
    processTimeSeriesData,
    terminate
  }
}

// 创建共享Worker服务
export function createSharedWorkerService() {
  // 单例Worker实例
  let workerInstance: ReturnType<typeof useWorkerService> | null = null
  
  // 引用计数
  const refCount = ref(0)
  
  // 获取Worker实例
  const getWorker = () => {
    if (!workerInstance) {
      workerInstance = useWorkerService()
    }
    refCount.value++
    return workerInstance
  }
  
  // 释放Worker实例
  const releaseWorker = () => {
    refCount.value--
    
    // 当没有组件使用Worker时，终止Worker
    if (refCount.value <= 0 && workerInstance) {
      workerInstance.terminate()
      workerInstance = null
      refCount.value = 0
    }
  }
  
  return {
    getWorker,
    releaseWorker,
    refCount
  }
}

// 创建全局共享Worker服务
export const sharedWorkerService = createSharedWorkerService()