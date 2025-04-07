// Web Worker用于处理复杂数据计算，避免阻塞主线程

// 定义消息类型
type WorkerMessage = {
  type: string;
  data: any;
  id?: string;
};

// 处理数据聚合计算
function aggregateData(data: any[], options: any) {
  // 根据不同的聚合方式处理数据
  const { method, field, groupBy } = options;
  
  // 如果没有数据，返回空数组
  if (!data || data.length === 0) return [];
  
  // 按照groupBy字段分组
  const groups: Record<string, any[]> = {};
  
  data.forEach(item => {
    const key = item[groupBy] || 'undefined';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });
  
  // 对每个分组应用聚合方法
  const result = Object.keys(groups).map(key => {
    const groupData = groups[key];
    let value;
    
    switch (method) {
      case 'sum':
        value = groupData.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
        break;
      case 'avg':
        value = groupData.reduce((sum, item) => sum + (Number(item[field]) || 0), 0) / groupData.length;
        break;
      case 'max':
        value = Math.max(...groupData.map(item => Number(item[field]) || 0));
        break;
      case 'min':
        value = Math.min(...groupData.map(item => Number(item[field]) || 0));
        break;
      case 'count':
        value = groupData.length;
        break;
      default:
        value = groupData.length;
    }
    
    return {
      [groupBy]: key,
      value,
      count: groupData.length
    };
  });
  
  return result;
}

// 处理数据过滤
function filterData(data: any[], filters: any[]) {
  if (!data || data.length === 0 || !filters || filters.length === 0) {
    return data;
  }
  
  return data.filter(item => {
    return filters.every(filter => {
      const { field, operator, value } = filter;
      const itemValue = item[field];
      
      switch (operator) {
        case 'eq':
          return itemValue === value;
        case 'neq':
          return itemValue !== value;
        case 'gt':
          return Number(itemValue) > Number(value);
        case 'gte':
          return Number(itemValue) >= Number(value);
        case 'lt':
          return Number(itemValue) < Number(value);
        case 'lte':
          return Number(itemValue) <= Number(value);
        case 'contains':
          return String(itemValue).includes(String(value));
        case 'startsWith':
          return String(itemValue).startsWith(String(value));
        case 'endsWith':
          return String(itemValue).endsWith(String(value));
        default:
          return true;
      }
    });
  });
}

// 处理数据排序
function sortData(data: any[], sortOptions: { field: string; order: 'asc' | 'desc' }) {
  if (!data || data.length === 0 || !sortOptions) {
    return data;
  }
  
  const { field, order } = sortOptions;
  
  return [...data].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    // 处理数字排序
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // 处理字符串排序
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();
    
    if (order === 'asc') {
      return aString.localeCompare(bString);
    } else {
      return bString.localeCompare(aString);
    }
  });
}

// 计算统计指标
function calculateStatistics(data: any[], field: string) {
  if (!data || data.length === 0) {
    return {
      count: 0,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
      median: 0,
      variance: 0,
      stdDev: 0
    };
  }
  
  // 提取数值
  const values = data.map(item => Number(item[field]) || 0);
  
  // 计算基本统计量
  const count = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / count;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // 计算中位数
  const sortedValues = [...values].sort((a, b) => a - b);
  const middle = Math.floor(count / 2);
  const median = count % 2 === 0
    ? (sortedValues[middle - 1] + sortedValues[middle]) / 2
    : sortedValues[middle];
  
  // 计算方差和标准差
  const squaredDiffs = values.map(value => Math.pow(value - avg, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / count;
  const stdDev = Math.sqrt(variance);
  
  return {
    count,
    sum,
    avg,
    min,
    max,
    median,
    variance,
    stdDev
  };
}

// 处理时间序列数据
function processTimeSeriesData(data: any[], options: any) {
  if (!data || data.length === 0) {
    return [];
  }
  
  const { timeField, valueField, interval, aggregation } = options;
  
  // 按时间间隔分组
  const groups: Record<string, any[]> = {};
  
  data.forEach(item => {
    const timestamp = new Date(item[timeField]).getTime();
    let intervalKey;
    
    // 根据不同的时间间隔生成分组键
    switch (interval) {
      case 'hour':
        const hourDate = new Date(timestamp);
        intervalKey = `${hourDate.getFullYear()}-${hourDate.getMonth() + 1}-${hourDate.getDate()} ${hourDate.getHours()}:00`;
        break;
      case 'day':
        const dayDate = new Date(timestamp);
        intervalKey = `${dayDate.getFullYear()}-${dayDate.getMonth() + 1}-${dayDate.getDate()}`;
        break;
      case 'week':
        const weekDate = new Date(timestamp);
        const dayOfWeek = weekDate.getDay();
        const diff = weekDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 调整为周一开始
        const startOfWeek = new Date(weekDate.setDate(diff));
        intervalKey = `${startOfWeek.getFullYear()}-${startOfWeek.getMonth() + 1}-${startOfWeek.getDate()}`;
        break;
      case 'month':
        const monthDate = new Date(timestamp);
        intervalKey = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
        break;
      default:
        intervalKey = timestamp.toString();
    }
    
    if (!groups[intervalKey]) {
      groups[intervalKey] = [];
    }
    groups[intervalKey].push(item);
  });
  
  // 对每个时间间隔应用聚合方法
  return Object.keys(groups).map(key => {
    const groupData = groups[key];
    let value;
    
    switch (aggregation) {
      case 'sum':
        value = groupData.reduce((sum, item) => sum + (Number(item[valueField]) || 0), 0);
        break;
      case 'avg':
        value = groupData.reduce((sum, item) => sum + (Number(item[valueField]) || 0), 0) / groupData.length;
        break;
      case 'max':
        value = Math.max(...groupData.map(item => Number(item[valueField]) || 0));
        break;
      case 'min':
        value = Math.min(...groupData.map(item => Number(item[valueField]) || 0));
        break;
      case 'count':
        value = groupData.length;
        break;
      default:
        value = groupData.reduce((sum, item) => sum + (Number(item[valueField]) || 0), 0);
    }
    
    return {
      time: key,
      value,
      count: groupData.length
    };
  }).sort((a, b) => {
    // 按时间排序
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });
}

// 监听消息
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data, id } = event.data;
  let result;
  
  try {
    switch (type) {
      case 'aggregate':
        result = aggregateData(data.items, data.options);
        break;
      case 'filter':
        result = filterData(data.items, data.filters);
        break;
      case 'sort':
        result = sortData(data.items, data.sortOptions);
        break;
      case 'statistics':
        result = calculateStatistics(data.items, data.field);
        break;
      case 'timeSeries':
        result = processTimeSeriesData(data.items, data.options);
        break;
      default:
        throw new Error(`未知的操作类型: ${type}`);
    }
    
    // 发送处理结果
    self.postMessage({
      type: `${type}_result`,
      data: result,
      id
    });
  } catch (error) {
    // 发送错误信息
    self.postMessage({
      type: 'error',
      data: {
        message: error instanceof Error ? error.message : '未知错误',
        originalType: type
      },
      id
    });
  }
});