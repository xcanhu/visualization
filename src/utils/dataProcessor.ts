import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

/**
 * 数据处理工具类
 * 用于解析、转换和处理不同来源的数据
 */
export class DataProcessor {
  /**
   * 解析CSV数据
   * @param content CSV内容
   * @param config 解析配置
   * @returns 解析后的数据
   */
  static parseCSV(content: string, config: any = {}) {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data)
        },
        error: (error) => {
          reject(error)
        },
        ...config
      })
    })
  }

  /**
   * 解析Excel文件
   * @param file Excel文件对象
   * @returns 解析后的数据
   */
  static parseExcel(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const result = XLSX.utils.sheet_to_json(worksheet)
          
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = (error) => {
        reject(error)
      }
      
      reader.readAsBinaryString(file)
    })
  }

  /**
   * 转换为图表数据格式
   * @param data 原始数据
   * @param config 转换配置
   * @returns 图表格式数据
   */
  static convertToChartData(data: any[], config: any = {}) {
    const { chartType, nameField, valueField, categoryField, xField, yField, zField } = config
    
    switch (chartType) {
      case 'pie':
      case 'funnel':
        return this.convertToPieData(data, nameField, valueField)
      
      case 'bar':
      case 'line':
        return this.convertToBarLineData(data, nameField, valueField, categoryField)
      
      case 'scatter':
        return this.convertToScatterData(data, xField, yField, nameField)
      
      case 'bar3d':
        return this.convertToBar3DData(data, xField, yField, zField)
      
      case 'heatmap':
        return this.convertToHeatmapData(data, xField, yField, valueField)
      
      case 'map':
        return this.convertToMapData(data, nameField, valueField)
      
      default:
        return data
    }
  }

  /**
   * 转换为饼图数据格式
   * @param data 原始数据
   * @param nameField 名称字段
   * @param valueField 值字段
   * @returns 饼图格式数据
   */
  static convertToPieData(data: any[], nameField: string, valueField: string) {
    return data.map(item => ({
      name: item[nameField],
      value: parseFloat(item[valueField]) || 0
    }))
  }

  /**
   * 转换为柱状图/折线图数据格式
   * @param data 原始数据
   * @param nameField 名称字段
   * @param valueField 值字段
   * @param categoryField 分类字段
   * @returns 柱状图/折线图格式数据
   */
  static convertToBarLineData(data: any[], nameField: string, valueField: string, categoryField?: string) {
    if (!categoryField) {
      // 单系列数据
      return data.map(item => ({
        name: item[nameField],
        value: parseFloat(item[valueField]) || 0
      }))
    } else {
      // 多系列数据
      const categories = [...new Set(data.map(item => item[nameField]))]
      const seriesNames = [...new Set(data.map(item => item[categoryField]))]
      
      const seriesData = seriesNames.map(seriesName => {
        return {
          name: seriesName,
          data: categories.map(category => {
            const matchItem = data.find(item => 
              item[nameField] === category && 
              item[categoryField] === seriesName
            )
            return matchItem ? parseFloat(matchItem[valueField]) || 0 : 0
          })
        }
      })
      
      return [{
        categories,
        series: seriesData
      }]
    }
  }

  /**
   * 转换为散点图数据格式
   * @param data 原始数据
   * @param xField X轴字段
   * @param yField Y轴字段
   * @param nameField 名称字段
   * @returns 散点图格式数据
   */
  static convertToScatterData(data: any[], xField: string, yField: string, nameField?: string) {
    return data.map(item => ({
      name: nameField ? item[nameField] : '',
      x: parseFloat(item[xField]) || 0,
      y: parseFloat(item[yField]) || 0
    }))
  }

  /**
   * 转换为3D柱状图数据格式
   * @param data 原始数据
   * @param xField X轴字段
   * @param yField Y轴字段
   * @param zField Z轴字段
   * @returns 3D柱状图格式数据
   */
  static convertToBar3DData(data: any[], xField: string, yField: string, zField: string) {
    return data.map(item => ({
      x: item[xField],
      y: item[yField],
      value: parseFloat(item[zField]) || 0
    }))
  }

  /**
   * 转换为热力图数据格式
   * @param data 原始数据
   * @param xField X轴字段
   * @param yField Y轴字段
   * @param valueField 值字段
   * @returns 热力图格式数据
   */
  static convertToHeatmapData(data: any[], xField: string, yField: string, valueField: string) {
    return data.map(item => ({
      x: item[xField],
      y: item[yField],
      value: parseFloat(item[valueField]) || 0
    }))
  }

  /**
   * 转换为地图数据格式
   * @param data 原始数据
   * @param nameField 名称字段
   * @param valueField 值字段
   * @returns 地图格式数据
   */
  static convertToMapData(data: any[], nameField: string, valueField: string) {
    return data.map(item => ({
      name: item[nameField],
      value: parseFloat(item[valueField]) || 0
    }))
  }

  /**
   * 聚合数据
   * @param data 原始数据
   * @param config 聚合配置
   * @returns 聚合后的数据
   */
  static aggregateData(data: any[], config: any = {}) {
    const { groupBy, valueField, aggregation } = config
    
    // 如果没有配置，返回原始数据
    if (!groupBy || !valueField || !aggregation) {
      return data
    }
    
    // 按分组字段分组
    const groups = {}
    
    data.forEach(item => {
      const key = item[groupBy]
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
    })
    
    // 对每个分组进行聚合计算
    return Object.keys(groups).map(key => {
      const groupData = groups[key]
      const values = groupData.map(item => parseFloat(item[valueField]) || 0)
      
      let value = 0
      
      switch (aggregation) {
        case 'sum':
          value = values.reduce((sum, val) => sum + val, 0)
          break
        case 'avg':
          value = values.reduce((sum, val) => sum + val, 0) / values.length
          break
        case 'max':
          value = Math.max(...values)
          break
        case 'min':
          value = Math.min(...values)
          break
        case 'count':
          value = values.length
          break
      }
      
      return {
        [groupBy]: key,
        [valueField]: value,
        count: values.length
      }
    })
  }

  /**
   * 时间序列数据处理
   * @param data 原始数据
   * @param config 处理配置
   * @returns 处理后的数据
   */
  static processTimeSeriesData(data: any[], config: any = {}) {
    const { timeField, valueField, interval, aggregation } = config
    
    // 如果没有时间字段或值字段，返回原始数据
    if (!timeField || !valueField) {
      return data
    }
    
    // 按照时间间隔分组
    const timeGroups = {}
    
    data.forEach(item => {
      let timeKey = item[timeField]
      
      // 如果时间字段是Date对象或字符串，格式化为指定间隔的时间字符串
      if (timeKey instanceof Date || typeof timeKey === 'string') {
        const time = dayjs(timeKey)
        
        switch (interval) {
          case 'hour':
            timeKey = time.format('YYYY-MM-DD HH:00')
            break
          case 'day':
            timeKey = time.format('YYYY-MM-DD')
            break
          case 'week':
            timeKey = time.format('YYYY-[W]WW')
            break
          case 'month':
            timeKey = time.format('YYYY-MM')
            break
          case 'quarter':
            timeKey = `${time.format('YYYY')}-Q${Math.ceil((time.month() + 1) / 3)}`
            break
          case 'year':
            timeKey = time.format('YYYY')
            break
          default:
            timeKey = time.format('YYYY-MM-DD HH:mm:ss')
        }
      }
      
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = []
      }
      
      timeGroups[timeKey].push(item)
    })
    
    // 对每个时间分组进行聚合计算
    return Object.keys(timeGroups).sort().map(timeKey => {
      const groupData = timeGroups[timeKey]
      const values = groupData.map(item => parseFloat(item[valueField]) || 0)
      
      let value = 0
      
      switch (aggregation) {
        case 'sum':
          value = values.reduce((sum, val) => sum + val, 0)
          break
        case 'avg':
          value = values.reduce((sum, val) => sum + val, 0) / values.length
          break
        case 'max':
          value = Math.max(...values)
          break
        case 'min':
          value = Math.min(...values)
          break
        case 'count':
          value = values.length
          break
        default:
          value = values.reduce((sum, val) => sum + val, 0)
      }
      
      return {
        [timeField]: timeKey,
        [valueField]: value,
        count: values.length
      }
    })
  }

  /**
   * 对数据进行排序
   * @param data 原始数据
   * @param config 排序配置
   * @returns 排序后的数据
   */
  static sortData(data: any[], config: any = {}) {
    const { sortBy, order } = config
    
    if (!sortBy) {
      return data
    }
    
    return [...data].sort((a, b) => {
      const valueA = a[sortBy]
      const valueB = b[sortBy]
      
      // 比较值
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return order === 'desc' ? valueB - valueA : valueA - valueB
      } else {
        const strA = String(valueA)
        const strB = String(valueB)
        return order === 'desc' ? strB.localeCompare(strA) : strA.localeCompare(strB)
      }
    })
  }

  /**
   * 对数据进行过滤
   * @param data 原始数据
   * @param filters 过滤条件
   * @returns 过滤后的数据
   */
  static filterData(data: any[], filters: any[] = []) {
    if (!filters || filters.length === 0) {
      return data
    }
    
    return data.filter(item => {
      // 所有过滤条件都要满足
      return filters.every(filter => {
        const { field, operator, value } = filter
        
        if (!field || !operator) {
          return true
        }
        
        const fieldValue = item[field]
        
        switch (operator) {
          case '=':
            return fieldValue === value
          case '!=':
            return fieldValue !== value
          case '>':
            return fieldValue > value
          case '>=':
            return fieldValue >= value
          case '<':
            return fieldValue < value
          case '<=':
            return fieldValue <= value
          case 'contains':
            return String(fieldValue).includes(String(value))
          case 'startsWith':
            return String(fieldValue).startsWith(String(value))
          case 'endsWith':
            return String(fieldValue).endsWith(String(value))
          case 'in':
            return Array.isArray(value) && value.includes(fieldValue)
          case 'notIn':
            return Array.isArray(value) && !value.includes(fieldValue)
          case 'between':
            return Array.isArray(value) && value.length === 2 && 
                   fieldValue >= value[0] && fieldValue <= value[1]
          default:
            return true
        }
      })
    })
  }

  /**
   * 从API响应中提取数据
   * @param response API响应
   * @param dataPath 数据路径
   * @returns 提取的数据
   */
  static extractDataFromResponse(response: any, dataPath: string) {
    if (!dataPath) {
      return response
    }
    
    const paths = dataPath.split('.')
    let result = response
    
    for (const path of paths) {
      if (result && typeof result === 'object' && path in result) {
        result = result[path]
      } else {
        console.warn(`数据路径 ${dataPath} 在响应中不存在`)
        return []
      }
    }
    
    return Array.isArray(result) ? result : [result]
  }
}

export default DataProcessor 