import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service = axios.create({
  timeout: 30000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在请求被发送之前，可以对config做一些处理
    // 例如添加通用header等
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 如果响应直接就是数据，返回响应对象
    return response
  },
  error => {
    console.error('响应错误:', error)
    
    // 根据HTTP状态码处理不同错误
    if (error.response) {
      const status = error.response.status
      let message = '未知错误'
      
      switch (status) {
        case 400:
          message = '请求错误'
          break
        case 401:
          message = '未授权，请重新登录'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求失败(${status})`
      }
      
      // 显示错误提示
      ElMessage.error(message)
    } else if (error.request) {
      // 请求已经发出，但没有收到响应
      ElMessage.error('服务器无响应')
    } else {
      // 请求配置发生错误
      ElMessage.error(`请求错误: ${error.message}`)
    }
    
    return Promise.reject(error)
  }
)

/**
 * 通用GET请求
 * @param url 请求地址
 * @param params 请求参数
 * @param config 请求配置
 */
export const get = (url: string, params?: any, config?: any) => {
  return service({
    url,
    method: 'get',
    params,
    ...config
  })
}

/**
 * 通用POST请求
 * @param url 请求地址
 * @param data 请求数据
 * @param config 请求配置
 */
export const post = (url: string, data?: any, config?: any) => {
  return service({
    url,
    method: 'post',
    data,
    ...config
  })
}

/**
 * 通用PUT请求
 * @param url 请求地址
 * @param data 请求数据
 * @param config 请求配置
 */
export const put = (url: string, data?: any, config?: any) => {
  return service({
    url,
    method: 'put',
    data,
    ...config
  })
}

/**
 * 通用DELETE请求
 * @param url 请求地址
 * @param params 请求参数
 * @param config 请求配置
 */
export const del = (url: string, params?: any, config?: any) => {
  return service({
    url,
    method: 'delete',
    params,
    ...config
  })
}

/**
 * 下载文件
 * @param url 请求地址
 * @param params 请求参数
 * @param filename 文件名
 */
export const download = async (url: string, params?: any, filename?: string) => {
  try {
    const response = await service({
      url,
      method: 'get',
      params,
      responseType: 'blob'
    })
    
    // 创建Blob对象
    const blob = new Blob([response.data])
    
    // 创建下载链接
    const downloadLink = document.createElement('a')
    downloadLink.href = URL.createObjectURL(blob)
    
    // 设置文件名
    if (filename) {
      downloadLink.download = filename
    } else {
      // 尝试从响应头中获取文件名
      const contentDisposition = response.headers['content-disposition']
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]*)"?/)
        if (filenameMatch && filenameMatch[1]) {
          downloadLink.download = filenameMatch[1]
        }
      }
    }
    
    // 触发下载
    document.body.appendChild(downloadLink)
    downloadLink.click()
    
    // 清理
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(downloadLink.href)
    
    return true
  } catch (error) {
    console.error('下载文件失败:', error)
    ElMessage.error('下载文件失败')
    return false
  }
}

/**
 * 上传文件
 * @param url 上传地址
 * @param file 文件对象
 * @param params 额外参数
 * @param onProgress 进度回调函数
 */
export const upload = (url: string, file: File, params?: any, onProgress?: (percent: number) => void) => {
  const formData = new FormData()
  formData.append('file', file)
  
  // 添加额外参数
  if (params) {
    for (const key in params) {
      formData.append(key, params[key])
    }
  }
  
  return service({
    url,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    }
  })
}

// 导出axios实例
export default service