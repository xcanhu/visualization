import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useWorkerService } from './workerService'

// 模拟Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  
  constructor() {
    // 构造函数实现
  }
  
  postMessage(data: any) {
    // 模拟Worker处理消息并返回结果
    if (this.onmessage) {
      setTimeout(() => {
        const messageEvent = {
          data: {
            type: 'success',
            data: { result: 'processed data' },
            id: data.id
          }
        } as MessageEvent
        
        this.onmessage(messageEvent)
      }, 10)
    }
  }
  
  terminate() {
    // 模拟终止Worker
  }
}

// 模拟Worker构造函数
vi.mock('../workers/dataProcessor.worker.ts', () => {
  return {
    default: () => new MockWorker()
  }
})

describe('workerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should send message to worker and receive response', async () => {
    const { sendMessage } = useWorkerService()
    
    const result = await sendMessage('process', { data: 'test data' })
    
    expect(result).toEqual({ result: 'processed data' })
  })
})