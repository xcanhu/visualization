import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// 定义数据库结构
interface VisualizationDB extends DBSchema {
  // 图表数据存储
  chartData: {
    key: string;
    value: {
      id: string;
      data: any[];
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
  // 地图数据存储
  mapData: {
    key: string;
    value: {
      id: string;
      data: any[];
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
  // 仪表盘数据存储
  dashboardData: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
  // 用户配置存储
  userSettings: {
    key: string;
    value: {
      id: string;
      theme: string;
      language: string;
      chartPreferences: any;
      timestamp: number;
    };
  };
  // 数据源配置存储
  dataSources: {
    key: string;
    value: {
      id: string;
      name: string;
      type: string;
      url: string;
      method: string;
      headers: Record<string, string>;
      params: Record<string, any>;
      dataPath: string;
      refreshInterval: number;
      chartType: string;
      description: string;
      timestamp: number;
    };
  };
}

// 数据库名称
const DB_NAME = 'visualization-platform'
// 数据库版本
const DB_VERSION = 2

// 存储名称
const STORES = {
  DATA_SOURCES: 'dataSources',
  CHARTS: 'charts',
  SETTINGS: 'settings'
}

// 本地存储键名
const LOCAL_STORAGE_KEYS = {
  DATA_SOURCES: 'visualization_data_sources',
  CHARTS: 'visualization_charts',
  SETTINGS: 'visualization_settings'
}

// 本地存储备用函数
const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`保存到本地存储失败: ${key}`, error)
  }
}

const getFromLocalStorage = (key: string): any => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error(`从本地存储获取失败: ${key}`, error)
    return null
  }
}

// 数据库实例
let dbInstance: IDBPDatabase<VisualizationDB> | null = null

/**
 * 初始化数据库
 */
const initDB = async (): Promise<IDBPDatabase<VisualizationDB>> => {
  if (dbInstance) return dbInstance
  
  try {
    const db = await openDB<VisualizationDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // 创建或更新数据库表
        if (oldVersion < 2) {
          // 检查并删除旧的数据源存储
          if (db.objectStoreNames.contains('dataSources')) {
            db.deleteObjectStore('dataSources');
          }
          
          // 检查并删除旧的图表和设置存储
          if (db.objectStoreNames.contains('charts')) {
            db.deleteObjectStore('charts');
          }
          
          if (db.objectStoreNames.contains('settings')) {
            db.deleteObjectStore('settings');
          }
          
          // 创建新的存储，不使用keyPath
          db.createObjectStore(STORES.DATA_SOURCES);
          db.createObjectStore(STORES.CHARTS);
          db.createObjectStore(STORES.SETTINGS);
        }

        // 创建或保留其他存储
        if (!db.objectStoreNames.contains('chartData')) {
          const chartStore = db.createObjectStore('chartData', { keyPath: 'id' })
          chartStore.createIndex('by-timestamp', 'timestamp')
        }

        if (!db.objectStoreNames.contains('mapData')) {
          const mapStore = db.createObjectStore('mapData', { keyPath: 'id' })
          mapStore.createIndex('by-timestamp', 'timestamp')
        }

        if (!db.objectStoreNames.contains('dashboardData')) {
          const dashboardStore = db.createObjectStore('dashboardData', { keyPath: 'id' })
          dashboardStore.createIndex('by-timestamp', 'timestamp')
        }

        if (!db.objectStoreNames.contains('userSettings')) {
          db.createObjectStore('userSettings', { keyPath: 'id' })
        }
      }
    })
    
    dbInstance = db
    return db
  } catch (error) {
    console.error('初始化数据库失败:', error)
    throw error
  }
}

/**
 * 获取数据源列表
 */
const getDataSources = async (): Promise<any[]> => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORES.DATA_SOURCES, 'readonly')
    const store = tx.objectStore(STORES.DATA_SOURCES)
    
    // 获取所有存储的数据源
    const sources = await store.get('sources')
    return sources || []
  } catch (error) {
    console.error('获取数据源列表失败，尝试从本地存储恢复:', error)
    // 从本地存储恢复
    return getFromLocalStorage(LOCAL_STORAGE_KEYS.DATA_SOURCES) || []
  }
}

/**
 * 保存数据源列表
 * @param sources 数据源列表
 */
const saveDataSources = async (sources: any[]): Promise<void> => {
  try {
    // 先保存到本地存储作为备份
    saveToLocalStorage(LOCAL_STORAGE_KEYS.DATA_SOURCES, sources)
    
    // 然后尝试保存到 IndexedDB
    const db = await initDB()
    const tx = db.transaction(STORES.DATA_SOURCES, 'readwrite')
    const store = tx.objectStore(STORES.DATA_SOURCES)
    
    // 使用 put 方法，并将整个列表作为值存储，键名为 'sources'
    await store.put(sources, 'sources') 
    
    await tx.done
  } catch (error) {
    console.error('保存数据源到 IndexedDB 失败，但已保存到本地存储:', error)
    // 仅记录错误，不抛出异常，因为已经保存到本地存储
  }
}

/**
 * 获取图表列表
 */
const getCharts = async (): Promise<any[]> => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORES.CHARTS, 'readonly')
    const store = tx.objectStore(STORES.CHARTS)
    
    // 获取所有存储的图表
    const charts = await store.get('charts')
    return charts || []
  } catch (error) {
    console.error('获取图表列表失败，尝试从本地存储恢复:', error)
    // 从本地存储恢复
    return getFromLocalStorage(LOCAL_STORAGE_KEYS.CHARTS) || []
  }
}

/**
 * 保存图表列表
 * @param charts 图表列表
 */
const saveCharts = async (charts: any[]): Promise<void> => {
  try {
    // 先保存到本地存储作为备份
    saveToLocalStorage(LOCAL_STORAGE_KEYS.CHARTS, charts)
    
    // 处理图表对象，确保可克隆
    // 使用JSON序列化和反序列化来移除不可克隆的内容
    const serializableCharts = JSON.parse(JSON.stringify(charts))
    
    // 然后尝试保存到 IndexedDB
    const db = await initDB()
    const tx = db.transaction(STORES.CHARTS, 'readwrite')
    const store = tx.objectStore(STORES.CHARTS)
    
    // 保存所有图表
    await store.put(serializableCharts, 'charts')
    await tx.done
  } catch (error) {
    console.error('保存图表到 IndexedDB 失败，但已保存到本地存储:', error)
    // 仅记录错误，不抛出异常，因为已经保存到本地存储
  }
}

/**
 * 获取设置项
 * @param key 设置键
 * @param defaultValue 默认值
 */
const getSetting = async (key: string, defaultValue: any = null): Promise<any> => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORES.SETTINGS, 'readonly')
    const store = tx.objectStore(STORES.SETTINGS)
    
    // 获取设置项
    const value = await store.get(key)
    return value !== undefined ? value : defaultValue
  } catch (error) {
    console.error(`获取设置项 ${key} 失败:`, error)
    return defaultValue
  }
}

/**
 * 保存设置项
 * @param key 设置键
 * @param value 设置值
 */
const saveSetting = async (key: string, value: any): Promise<void> => {
  try {
    const db = await initDB()
    const tx = db.transaction(STORES.SETTINGS, 'readwrite')
    const store = tx.objectStore(STORES.SETTINGS)
    
    // 保存设置项
    await store.put(value, key)
    await tx.done
  } catch (error) {
    console.error(`保存设置项 ${key} 失败:`, error)
    throw error
  }
}

/**
 * 清空所有数据
 */
const clearAllData = async (): Promise<void> => {
  try {
    const db = await initDB()
    
    // 清空数据源
    const txSources = db.transaction(STORES.DATA_SOURCES, 'readwrite')
    await txSources.objectStore(STORES.DATA_SOURCES).clear()
    await txSources.done
    
    // 清空图表
    const txCharts = db.transaction(STORES.CHARTS, 'readwrite')
    await txCharts.objectStore(STORES.CHARTS).clear()
    await txCharts.done
    
    // 清空设置
    const txSettings = db.transaction(STORES.SETTINGS, 'readwrite')
    await txSettings.objectStore(STORES.SETTINGS).clear()
    await txSettings.done
  } catch (error) {
    console.error('清空所有数据失败:', error)
    throw error
  }
}

// 导出数据库服务
const dbService = {
  getDataSources,
  saveDataSources,
  getCharts,
  saveCharts,
  getSetting,
  saveSetting,
  clearAllData
}

export default dbService