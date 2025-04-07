import { ref } from 'vue'

interface WebSocketOptions {
  url: string
  onMessage?: (data: any) => void
  onOpen?: () => void
  onError?: (event: Event) => void
  onClose?: () => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(options: WebSocketOptions) {
  const {
    url,
    onMessage,
    onOpen,
    onError,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options

  let ws: WebSocket | null = null
  let reconnectAttempts = 0
  let reconnectTimer: number | null = null

  const isConnected = ref(false)
  const lastMessage = ref<any>(null)

  // 创建WebSocket连接
  const connect = () => {
    ws = new WebSocket(url)

    ws.onopen = () => {
      isConnected.value = true
      reconnectAttempts = 0
      if (onOpen) onOpen()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        lastMessage.value = data
        if (onMessage) onMessage(data)
      } catch (error) {
        console.error('解析WebSocket消息失败:', error)
      }
    }

    ws.onerror = (event) => {
      console.error('WebSocket错误:', event)
      if (onError) onError(event)
    }

    ws.onclose = () => {
      isConnected.value = false
      if (onClose) onClose()
      tryReconnect()
    }
  }

  // 尝试重新连接
  const tryReconnect = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      return
    }

    reconnectAttempts++
    
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer)
    }

    reconnectTimer = window.setTimeout(() => {
      connect()
    }, reconnectInterval)
  }

  // 发送消息
  const send = (data: any) => {
    if (ws && isConnected.value) {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data))
      return true
    }
    return false
  }

  // 关闭连接
  const close = () => {
    if (ws) {
      ws.close()
      ws = null
    }

    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  // 初始化连接
  connect()

  return {
    isConnected,
    lastMessage,
    send,
    close,
    reconnect: connect
  }
}