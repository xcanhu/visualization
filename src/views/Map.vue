<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import { useDataStore } from '../stores'
import service from '../utils/request'
import chinaGeoJson from '../assets/china.json'
import ThreeDMap from '../components/ThreeDMap.vue'
import Map from '../components/Map.vue'
import FileUploader from '../components/FileUploader.vue'
import { ElMessage } from 'element-plus'

// 获取数据存储
const dataStore = useDataStore()

// 地图容器引用
const mapContainer = ref<HTMLElement | null>(null)
// 地图实例
let mapChart: echarts.ECharts | null = null

// 地图数据
const mapData = ref<any[]>([])
// 选中的省份
const selectedProvince = ref<string>('')
// 地图加载状态
const loading = ref<boolean>(false)

// 地图模式：2D或3D
const mapMode = ref<'2D' | '3D'>('2D')
// 是否显示热力图
const showHeatmap = ref<boolean>(true)
// 颜色主题
const colorTheme = ref<string>('blue')
// 是否自动旋转（仅3D模式有效）
const autoRotate = ref<boolean>(false)
// 地图类型：中国地图或世界地图
const mapType = ref<'china' | '3D'>('china')

// 3D地图引用
const threeDMapRef = ref<InstanceType<typeof ThreeDMap> | null>(null)

// 数据点显示
const showDataPoints = ref(true)

// 连接线显示
const showConnectionLines = ref(true)

// 分布点数据
const distributionData = ref([
  { name: '北京', lat: 39.9042, lng: 116.4074, value: 85, connections: ['纽约', '伦敦', '东京'] },
  { name: '纽约', lat: 40.7128, lng: -74.0060, value: 92, connections: ['伦敦', '巴黎'] },
  { name: '伦敦', lat: 51.5074, lng: -0.1278, value: 78, connections: ['巴黎'] },
  { name: '东京', lat: 35.6762, lng: 139.6503, value: 89, connections: [] },
  { name: '巴黎', lat: 48.8566, lng: 2.3522, value: 65, connections: [] },
  { name: '悉尼', lat: -33.8688, lng: 151.2093, value: 72, connections: ['东京'] },
  { name: '开普敦', lat: -33.9249, lng: 18.4241, value: 45, connections: ['伦敦'] },
  { name: '里约热内卢', lat: -22.9068, lng: -43.1729, value: 53, connections: ['纽约'] },
  { name: '莫斯科', lat: 55.7558, lng: 37.6173, value: 67, connections: ['北京', '伦敦'] },
  { name: '新德里', lat: 28.6139, lng: 77.2090, value: 62, connections: ['北京', '悉尼'] },
  { name: '曼谷', lat: 13.7563, lng: 100.5018, value: 58, connections: ['东京', '新德里'] },
  { name: '开罗', lat: 30.0444, lng: 31.2357, value: 49, connections: ['开普敦', '巴黎', '莫斯科'] },
  { name: '洛杉矶', lat: 34.0522, lng: -118.2437, value: 76, connections: ['纽约', '东京', '悉尼'] },
  { name: '多伦多', lat: 43.6532, lng: -79.3832, value: 70, connections: ['纽约', '伦敦'] },
  { name: '圣保罗', lat: -23.5505, lng: -46.6333, value: 59, connections: ['里约热内卢', '纽约'] }
])

// 文件上传对话框
const uploadDialogVisible = ref(false)

// 导入的数据
const importedData = ref<any[]>([])

// 处理数据导入
const handleDataImported = (data: any) => {
  // 检查数据格式
  if (Array.isArray(data.data)) {
    importedData.value = data.data
    
    // 更新地图数据
    mapData.value = transformImportedData(importedData.value)
    
    // 如果在3D模式下
    if (mapType.value === '3D' && threeDMapRef.value) {
      // 更新3D地图数据
      distributeDataOnGlobe()
    } else {
      // 更新2D地图
      renderMap(mapData.value, mapType.value === 'china' ? 'china' : 'world')
    }
    
    // 关闭对话框
    uploadDialogVisible.value = false
    
    // 显示成功消息
    ElMessage.success('数据导入成功')
  } else {
    ElMessage.error('导入的数据格式不正确，请确保是数组格式')
  }
}

// 转换导入的数据为地图所需格式
const transformImportedData = (data: any[]) => {
  // 尝试识别数据格式
  // 预期格式: [{name: "地区名", value: 数值}, ...]
  // 如果没有name或value字段，尝试用第一个字符串字段作为name，第一个数字字段作为value
  
  return data.map(item => {
    // 如果已经有正确格式
    if (item.name && (item.value !== undefined)) {
      return {
        name: item.name,
        value: Number(item.value)
      }
    }
    
    // 尝试识别字段
    const keys = Object.keys(item)
    let nameKey = keys.find(k => typeof item[k] === 'string' && item[k].length > 0)
    let valueKey = keys.find(k => !isNaN(Number(item[k])) && k !== nameKey)
    
    // 如果找到合适的字段
    if (nameKey && valueKey) {
      return {
        name: item[nameKey],
        value: Number(item[valueKey]),
        // 保存原始数据以便显示
        originalData: {...item}
      }
    }
    
    // 兜底方案：使用数组索引和随机值
    return {
      name: `地区${data.indexOf(item) + 1}`,
      value: Math.round(Math.random() * 1000),
      originalData: {...item}
    }
  })
}

// 在3D地球上分布导入的数据点
const distributeDataOnGlobe = () => {
  // 转换数据为3D地图需要的格式
  const globeData = mapData.value.map(item => {
    // 尝试查找是否有经纬度信息
    let lat, lng
    
    if (item.originalData) {
      // 查找可能的经纬度字段
      const latKeys = ['lat', 'latitude', '纬度', 'Latitude']
      const lngKeys = ['lng', 'lon', 'longitude', '经度', 'Longitude']
      
      // 查找经度
      for (const key of lngKeys) {
        if (item.originalData[key] !== undefined && !isNaN(Number(item.originalData[key]))) {
          lng = Number(item.originalData[key])
          break
        }
      }
      
      // 查找纬度
      for (const key of latKeys) {
        if (item.originalData[key] !== undefined && !isNaN(Number(item.originalData[key]))) {
          lat = Number(item.originalData[key])
          break
        }
      }
    }
    
    // 如果没有找到经纬度，随机生成一个位置
    if (lat === undefined || lng === undefined) {
      lat = (Math.random() * 180) - 90
      lng = (Math.random() * 360) - 180
    }
    
    return {
      name: item.name,
      lat,
      lng,
      value: item.value,
      connections: []
    }
  })
  
  // 更新分布点数据
  distributionData.value = globeData
}

// 初始化地图
const initMap = () => {
  if (mapContainer.value) {
    // 创建地图实例
    mapChart = echarts.init(mapContainer.value)
    
    // 监听窗口大小变化，调整地图大小
    window.addEventListener('resize', handleResize)
    
    // 根据地图类型加载地图
    if (mapType.value === 'china') {
      loadChinaMap()
    } else {
      loadWorldMap()
    }
  }
}

// 处理窗口大小变化
const handleResize = () => {
  mapChart?.resize()
}

// 加载中国地图
const loadChinaMap = async () => {
  loading.value = true
  try {
    // 注册中国地图数据
    echarts.registerMap('china', chinaGeoJson)
    
    // 模拟数据 - 实际项目中应该从后端获取
    const mockData = [
      { name: '北京', value: Math.round(Math.random() * 1000) },
      { name: '上海', value: Math.round(Math.random() * 1000) },
      { name: '广东', value: Math.round(Math.random() * 1000) },
      { name: '江苏', value: Math.round(Math.random() * 1000) },
      { name: '浙江', value: Math.round(Math.random() * 1000) },
      { name: '山东', value: Math.round(Math.random() * 1000) },
      { name: '河南', value: Math.round(Math.random() * 1000) },
      { name: '四川', value: Math.round(Math.random() * 1000) },
      { name: '湖北', value: Math.round(Math.random() * 1000) },
      { name: '福建', value: Math.round(Math.random() * 1000) },
    ]
    
    // 更新地图数据
    mapData.value = mockData
    dataStore.setMapData(mockData)
    
    // 渲染地图
    renderMap(mockData, 'china')
  } catch (error) {
    ElMessage.error('加载地图数据失败')
  } finally {
    loading.value = false
  }
}

// 加载世界地图
const loadWorldMap = async () => {
  loading.value = true
  try {
    // 动态加载世界地图数据
    if (!echarts.getMap('world')) {
      // 获取世界地图数据
      const response = await fetch('https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json')
      if (!response.ok) {
        throw new Error('无法加载世界地图数据')
      }
      
      const worldMapData = await response.json()
      
      // 注册世界地图
      echarts.registerMap('world', worldMapData)
    }
    
    // 模拟世界各国数据 - 实际项目中应该从后端获取
    const mockData = [
      { name: 'China', value: Math.round(Math.random() * 1000) },
      { name: 'United States', value: Math.round(Math.random() * 1000) },
      { name: 'Japan', value: Math.round(Math.random() * 1000) },
      { name: 'Germany', value: Math.round(Math.random() * 1000) },
      { name: 'United Kingdom', value: Math.round(Math.random() * 1000) },
      { name: 'France', value: Math.round(Math.random() * 1000) },
      { name: 'India', value: Math.round(Math.random() * 1000) },
      { name: 'Brazil', value: Math.round(Math.random() * 1000) },
      { name: 'Russia', value: Math.round(Math.random() * 1000) },
      { name: 'Canada', value: Math.round(Math.random() * 1000) },
      { name: 'Australia', value: Math.round(Math.random() * 1000) },
      { name: 'South Africa', value: Math.round(Math.random() * 1000) },
      { name: 'Argentina', value: Math.round(Math.random() * 1000) },
      { name: 'Egypt', value: Math.round(Math.random() * 1000) },
      { name: 'Italy', value: Math.round(Math.random() * 1000) }
    ]
    
    // 更新地图数据
    mapData.value = mockData
    dataStore.setMapData(mockData)
    
    // 渲染地图
    renderMap(mockData, 'world')
  } catch (error) {
    ElMessage.error('加载世界地图数据失败')
    // 如果加载失败，回退到中国地图
    mapType.value = 'china'
    loadChinaMap()
  } finally {
    loading.value = false
  }
}

// 渲染地图
const renderMap = (data: any[], mapName: string) => {
  if (!mapChart) return
  
  const title = mapName === 'china' ? '全国数据分布图' : '全球数据分布图'
  
  const option: echarts.EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}'
    },
    visualMap: {
      min: 0,
      max: 1000,
      left: 'left',
      top: 'top',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: colorTheme.value === 'red' ? ['#ffebee', '#f44336'] : 
               colorTheme.value === 'green' ? ['#e8f5e9', '#4caf50'] : 
               colorTheme.value === 'rainbow' ? ['#f8f9fa', '#1890ff', '#ffc53d', '#ff4d4f'] : 
               ['#e0f7fa', '#4fc3f7', '#0288d1']
      }
    },
    // 添加控制器组件配置
    toolbox: {
      show: true,
      orient: 'vertical',
      left: 'right',
      top: 'top',
      feature: {
        dataView: { readOnly: false },
        restore: {},
        saveAsImage: {}
      }
    },
    series: [
      {
        name: '数据量',
        type: 'map',
        map: mapName,
        roam: true, // 允许缩放和平移
        emphasis: {
          label: {
            show: true
          },
          itemStyle: {
            areaColor: '#1890ff'
          }
        },
        // 调整世界地图的视觉效果
        itemStyle: {
          areaColor: '#eee',
          borderColor: '#aaa',
          borderWidth: 0.5
        },
        data: data,
        // 为世界地图设置特定的标签样式
        label: {
          show: mapName === 'world',
          fontSize: 8,
          color: '#333'
        }
      }
    ]
  }
  
  // 对世界地图进行特殊处理
  if (mapName === 'world') {
    // 调整标签显示
    option.series[0].label = {
      show: true,
      fontSize: 8,
      color: '#333',
      formatter: (params) => {
        // 只显示主要国家的名称
        const majorCountries = ['China', 'United States', 'Russia', 'Brazil', 'India', 'Japan', 'Germany'];
        return majorCountries.includes(params.name) ? params.name : '';
      }
    }
    
    // 调整地图大小和位置
    option.series[0].zoom = 1.2;
    option.series[0].center = [10, 30]; // 调整中心位置以便更好地显示世界地图
  }
  
  // 设置地图配置
  mapChart.setOption(option)
  
  // 点击事件
  mapChart.on('click', (params) => {
    const regionName = params.name
    selectedProvince.value = regionName
    
    // 加载区域详细数据
    if (mapName === 'china') {
      loadProvinceData(regionName)
    } else {
      loadCountryData(regionName)
    }
  })
}

// 加载省份详细数据
const loadProvinceData = async (provinceName: string) => {
  loading.value = true
  try {
    // 实际项目中应该从后端获取省份详细数据
    
    // 获取选中省份的数据
    const provinceData = mapData.value.find(item => item.name === provinceName)
    
    // 模拟省份城市数据
    const cityCount = Math.floor(Math.random() * 10) + 5 // 5-15个城市
    const mockCityData = Array.from({ length: cityCount }, (_, index) => {
      const cityValue = Math.round(Math.random() * 500)
      return {
        name: `${provinceName}城市${index + 1}`,
        value: cityValue,
        extraData: {
          人口: `${Math.round(cityValue * 0.5)}万`,
          GDP: `${(cityValue * 0.01).toFixed(2)}万亿`,
          面积: `${Math.round(cityValue * 10)}平方公里`,
          经济增长率: `${(Math.random() * 10).toFixed(1)}%`,
          失业率: `${(Math.random() * 5).toFixed(1)}%`,
          城镇化率: `${50 + Math.round(Math.random() * 30)}%`
        },
        // 添加经纬度坐标，用于地图展示
        coordinates: [100 + Math.random() * 20, 30 + Math.random() * 10]
      }
    })
    
    // 添加城市间连线数据
    const cityLinks = [];
    for (let i = 0; i < mockCityData.length - 1; i++) {
      cityLinks.push({
        source: mockCityData[i].name,
        target: mockCityData[i + 1].name,
        value: Math.round(Math.random() * 100)
      });
    }
    
    // 更新数据
    mapData.value = mockCityData;
    
    // 如果在3D模式下，传递更详细的数据到ThreeDMap组件
    if (mapMode.value === '3D' && threeDMapRef.value) {
      threeDMapRef.value.updateCityData(mockCityData, cityLinks);
    } else {
      // 更新2D地图视图，显示选中省份的城市数据
      renderProvinceCityMap(mockCityData, cityLinks);
    }
    
  } catch (error) {
    ElMessage.error(`加载${provinceName}详细数据失败`)
  } finally {
    loading.value = false
  }
}

// 渲染省份城市地图
const renderProvinceCityMap = (cityData, cityLinks) => {
  if (!mapChart) return;
  
  const option = {
    title: {
      text: `${selectedProvince.value}城市数据分布`,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.dataType === 'edge') {
          return `${params.data.source} -> ${params.data.target}: ${params.data.value}`;
        }
        const city = params.data;
        let html = `${city.name}: ${city.value}<br/>`;
        
        // 添加额外数据到提示框
        if (city.extraData) {
          for (const [key, value] of Object.entries(city.extraData)) {
            html += `${key}: ${value}<br/>`;
          }
        }
        return html;
      }
    },
    // 添加图例
    legend: {
      data: ['城市', '城市连接'],
      orient: 'vertical',
      right: 10,
      top: 20
    },
    // 添加工具箱
    toolbox: {
      show: true,
      orient: 'vertical',
      left: 'right',
      top: 'top',
      feature: {
        restore: {},
        saveAsImage: {}
      }
    },
    // 添加地理坐标系
    geo: {
      map: 'china',
      zoom: 1.2,
      layoutCenter: ['50%', '50%'],  // 布局中心
      layoutSize: '100%',            // 布局大小
      selectedMode: 'single',
      itemStyle: {
        areaColor: '#eee',
        borderColor: '#999'
      },
      emphasis: {
        itemStyle: {
          areaColor: '#1890ff'
        }
      }
    },
    series: [
      {
        name: '城市',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: cityData.map(city => ({
          name: city.name,
          value: [...(city.coordinates || []), city.value],
          extraData: city.extraData
        })),
        symbolSize: (val) => {
          return Math.min(val[2] / 10 + 5, 30);
        },
        itemStyle: {
          color: colorTheme.value === 'red' ? '#f5222d' : 
                 colorTheme.value === 'green' ? '#52c41a' : 
                 colorTheme.value === 'rainbow' ? 'rgba(250, 100, 30, 0.8)' : '#1890ff'
        },
        emphasis: {
          scale: true
        },
        // 添加标签
        label: {
          show: true,
          formatter: '{b}',
          position: 'right'
        }
      },
      // 添加城市间连线
      {
        name: '城市连接',
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 2,
        lineStyle: {
          color: '#1890ff',
          width: 2,
          opacity: 0.6,
          curveness: 0.2
        },
        effect: {
          show: true,
          period: 6,
          trailLength: 0.7,
          color: '#fff',
          symbolSize: 3
        },
        data: cityLinks.map(link => {
          const sourceCity = cityData.find(city => city.name === link.source);
          const targetCity = cityData.find(city => city.name === link.target);
          
          return {
            source: sourceCity.coordinates,
            target: targetCity.coordinates,
            value: link.value,
            // 原始数据，用于提示框
            name: `${link.source} -> ${link.target}`,
            source: link.source,
            target: link.target
          };
        })
      }
    ]
  };
  
  // 如果选择热力图模式
  if (showHeatmap.value) {
    option.visualMap = {
      min: 0,
      max: 500,
      left: 'left',
      top: 'top',
      calculable: true,
      inRange: {
        color: colorTheme.value === 'red' ? ['#ffe4e1', '#ff4d4f'] : 
               colorTheme.value === 'green' ? ['#e6ffec', '#52c41a'] : 
               colorTheme.value === 'rainbow' ? ['#f8f9fa', '#1890ff', '#ffc53d', '#ff4d4f'] : 
               ['#e0f7fa', '#4fc3f7', '#0288d1']
      },
      textStyle: {
        color: '#333'
      }
    };
  }
  
  mapChart.setOption(option);
}

// 重置地图视图
const resetMapView = () => {
  selectedProvince.value = ''
  loadChinaMap()
}

// 当前活动的数据面板标签
const activeTab = ref<'list' | 'chart'>('list')

// 图表容器引用
const chartContainer = ref<HTMLElement | null>(null)
// 图表实例
let dataChart: echarts.ECharts | null = null

// 处理3D地图区域点击
const handleRegionClick = (region: any) => {
  selectedProvince.value = region.name
  loadProvinceData(region.name)
}

// 处理3D地图区域悬停
const handleRegionHover = (region: any) => {
  // 可以添加悬停效果或显示提示信息
}

// 渲染数据图表
const renderDataChart = () => {
  if (!chartContainer.value) return
  
  // 如果已存在图表实例，先销毁
  if (dataChart) {
    dataChart.dispose()
  }
  
  // 创建图表实例
  dataChart = echarts.init(chartContainer.value)
  
  // 准备图表数据
  const chartData = mapData.value.map(item => ({
    name: item.name,
    value: item.value
  }))
  
  // 设置图表配置
  const option: echarts.EChartsOption = {
    title: {
      text: `${selectedProvince.value || '全国'}数据分布`,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '数据量',
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'],
        data: chartData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}: {c}'
        }
      }
    ]
  }
  
  // 设置图表配置
  dataChart.setOption(option)
}

// 监听活动标签变化
const watchActiveTab = computed(() => {
  if (activeTab.value === 'chart' && chartContainer.value) {
    // 在下一个事件循环渲染图表，确保DOM已更新
    setTimeout(() => {
      renderDataChart()
    }, 0)
  }
  return activeTab.value
})

// 监听地图模式变化
const watchMapMode = computed(() => {
  if (mapMode.value === '2D' && !mapChart && mapContainer.value) {
    // 在下一个事件循环初始化2D地图，确保DOM已更新
    setTimeout(() => {
      initMap()
    }, 0)
  }
  return mapMode.value
})

// 切换地图类型
const handleMapTypeChange = (type: 'china' | '3D') => {
  mapType.value = type
  // 确保使用正确的地图类型
  if (type === 'china') {
    initChinaMapData()
  } else {
    // 加载世界地图数据
    // 此处可以实现世界地图的加载逻辑
  }
}

// 切换地图模式
const switchMapMode = (mode: '2D' | '3D') => {
  if (mapMode.value !== mode) {
    mapMode.value = mode
    
    // 根据模式自动切换地图类型
    if (mode === '2D') {
      mapType.value = 'china'
      // 切换到2D模式，加载中国地图
      setTimeout(() => {
        loadChinaMap()
      }, 0)
    } else {
      mapType.value = '3D'
      // 3D模式世界地图由ThreeDMap组件自动加载
    }
  }
}

// 监听地图类型变化
const watchMapType = computed(() => {
  return mapType.value
})

// 加载国家详细数据（针对世界地图）
const loadCountryData = async (countryName: string) => {
  loading.value = true
  try {
    // 获取选中国家的数据
    const countryData = mapData.value.find(item => item.name === countryName)
    
    // 模拟国家城市数据
    const cityCount = Math.floor(Math.random() * 8) + 5 // 5-12个城市
    const mockCityData = Array.from({ length: cityCount }, (_, index) => {
      const cityValue = Math.round(Math.random() * 500)
      return {
        name: `${countryName} City ${index + 1}`,
        value: cityValue,
        extraData: {
          Population: `${Math.round(cityValue * 0.5)} Million`,
          GDP: `$${(cityValue * 0.1).toFixed(2)} Trillion`,
          Area: `${Math.round(cityValue * 10)} km²`,
          'Growth Rate': `${(Math.random() * 10).toFixed(1)}%`,
          'Unemployment': `${(Math.random() * 5).toFixed(1)}%`,
          'Urbanization': `${50 + Math.round(Math.random() * 30)}%`
        },
        // 添加经纬度坐标，用于地图展示
        coordinates: [
          -180 + Math.random() * 360, 
          -90 + Math.random() * 180
        ]
      }
    })
    
    // 添加城市间连线数据
    const cityLinks = [];
    for (let i = 0; i < mockCityData.length - 1; i++) {
      cityLinks.push({
        source: mockCityData[i].name,
        target: mockCityData[i + 1].name,
        value: Math.round(Math.random() * 100)
      });
    }
    
    // 更新数据
    mapData.value = mockCityData;
    
    // 如果在3D模式下，传递更详细的数据到ThreeDMap组件
    if (mapMode.value === '3D' && threeDMapRef.value) {
      threeDMapRef.value.updateCityData(mockCityData, cityLinks);
    } else {
      // 更新2D地图视图，显示选中国家的城市数据
      renderCountryCityMap(mockCityData, cityLinks, countryName);
    }
    
  } catch (error) {
    ElMessage.error(`加载${countryName}详细数据失败`)
  } finally {
    loading.value = false
  }
}

// 渲染国家城市地图
const renderCountryCityMap = (cityData, cityLinks, countryName) => {
  if (!mapChart) return;
  
  const option = {
    title: {
      text: `${countryName} Cities Data Distribution`,
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.dataType === 'edge') {
          return `${params.data.source} -> ${params.data.target}: ${params.data.value}`;
        }
        const city = params.data;
        let html = `${city.name}: ${city.value}<br/>`;
        
        // 添加额外数据到提示框
        if (city.extraData) {
          for (const [key, value] of Object.entries(city.extraData)) {
            html += `${key}: ${value}<br/>`;
          }
        }
        return html;
      }
    },
    // 添加图例
    legend: {
      data: ['Cities', 'Connections'],
      orient: 'vertical',
      right: 10,
      top: 20
    },
    // 添加地理坐标系
    geo: {
      map: 'world',
      zoom: 4,  // 放大显示
      selectedMode: 'single',
      itemStyle: {
        areaColor: '#eee',
        borderColor: '#999'
      },
      emphasis: {
        itemStyle: {
          areaColor: '#1890ff'
        }
      }
    },
    series: [
      {
        name: 'Cities',
        type: 'effectScatter',  // 使用涟漪效果
        coordinateSystem: 'geo',
        data: cityData.map(city => ({
          name: city.name,
          value: [...(city.coordinates || []), city.value],
          extraData: city.extraData
        })),
        symbolSize: (val) => {
          return Math.min(val[2] / 10 + 5, 30);
        },
        itemStyle: {
          color: colorTheme.value === 'red' ? '#f5222d' : 
                 colorTheme.value === 'green' ? '#52c41a' : 
                 colorTheme.value === 'rainbow' ? 'rgba(250, 100, 30, 0.8)' : '#1890ff'
        },
        emphasis: {
          scale: true
        },
        // 添加标签
        label: {
          show: true,
          formatter: '{b}',
          position: 'right'
        },
        // 添加涟漪效果
        rippleEffect: {
          brushType: 'stroke',
          scale: 2.5,
          period: 4
        }
      },
      // 添加城市间连线
      {
        name: 'Connections',
        type: 'lines',
        coordinateSystem: 'geo',
        zlevel: 2,
        lineStyle: {
          color: '#1890ff',
          width: 2,
          opacity: 0.6,
          curveness: 0.2
        },
        effect: {
          show: true,
          period: 6,
          trailLength: 0.7,
          color: '#fff',
          symbolSize: 3
        },
        data: cityLinks.map(link => {
          const sourceCity = cityData.find(city => city.name === link.source);
          const targetCity = cityData.find(city => city.name === link.target);
          
          return {
            coords: [sourceCity.coordinates, targetCity.coordinates],
            value: link.value,
            // 原始数据，用于提示框
            name: `${link.source} -> ${link.target}`,
            source: link.source,
            target: link.target
          };
        })
      }
    ]
  };
  
  // 如果选择热力图模式
  if (showHeatmap.value) {
    option.visualMap = {
      min: 0,
      max: 500,
      left: 'left',
      top: 'top',
      calculable: true,
      inRange: {
        color: colorTheme.value === 'red' ? ['#ffe4e1', '#ff4d4f'] : 
               colorTheme.value === 'green' ? ['#e6ffec', '#52c41a'] : 
               colorTheme.value === 'rainbow' ? ['#f8f9fa', '#1890ff', '#ffc53d', '#ff4d4f'] : 
               ['#e0f7fa', '#4fc3f7', '#0288d1']
      },
      textStyle: {
        color: '#333'
      }
    };
  }
  
  mapChart.setOption(option);
}

// 初始化2D地图数据
const initChinaMapData = () => {
  loading.value = true
  try {
    // 模拟数据
    const mockData = [
      { name: '北京', value: Math.round(Math.random() * 1000) },
      { name: '上海', value: Math.round(Math.random() * 1000) },
      { name: '广东', value: Math.round(Math.random() * 1000) },
      { name: '江苏', value: Math.round(Math.random() * 1000) },
      { name: '浙江', value: Math.round(Math.random() * 1000) },
      { name: '山东', value: Math.round(Math.random() * 1000) },
      { name: '河南', value: Math.round(Math.random() * 1000) },
      { name: '四川', value: Math.round(Math.random() * 1000) },
      { name: '湖北', value: Math.round(Math.random() * 1000) },
      { name: '福建', value: Math.round(Math.random() * 1000) },
    ]
    
    // 更新地图数据
    mapData.value = mockData
    dataStore.setMapData(mockData)
  } catch (error) {
    ElMessage.error('加载地图数据失败')
  } finally {
    loading.value = false
  }
}

// 组件挂载时初始化地图
onMounted(() => {
  // 初始化地图数据
  initChinaMapData()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理资源
onUnmounted(() => {
  // 清理2D地图
  if (mapChart) {
    mapChart.dispose()
    mapChart = null
  }
  
  // 清理数据图表
  if (dataChart) {
    dataChart.dispose()
    dataChart = null
  }
  
  // 移除事件监听器
  window.removeEventListener('resize', handleResize)
})

// 处理对话框关闭
const handleCloseDialog = () => {
  // 延迟设置状态，避免事件冲突
  setTimeout(() => {
    uploadDialogVisible.value = false
  }, 50)
}
</script>

<template>
  <div class="map-container">
    <h1 class="map-title">地理数据可视化</h1>
    <div class="map-controls">
      <el-button type="primary" @click="mapType = 'china'" :class="{ active: mapType === 'china' }">2D中国地图</el-button>
      <el-button type="primary" @click="mapType = '3D'" :class="{ active: mapType === '3D' }">3D世界地图</el-button>
      
      <el-checkbox v-model="showHeatmap" label="热力图" border />
      <el-checkbox v-model="autoRotate" label="自动旋转" border />
      <el-checkbox v-model="showDataPoints" label="数据点" border />
      <el-checkbox v-model="showConnectionLines" label="连接线" border />
      
      <el-button type="success" @click="uploadDialogVisible = true">
        导入数据
      </el-button>
    </div>
    
    <!-- 文件导入对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="导入地理数据"
      width="600px"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      :show-close="true"
      @close="handleCloseDialog"
      modal-append-to-body
    >
      <div v-if="uploadDialogVisible">
        <FileUploader
          :allowed-types="['json', 'csv', 'xlsx', 'xls']"
          @data-loaded="handleDataImported"
        />
        <div class="upload-tips">
          <p>提示:</p>
          <ul>
            <li>数据需要包含地区名称和对应的数值</li>
            <li>如需在地图上显示精确位置，请包含经纬度信息</li>
            <li>支持的格式: JSON, CSV, Excel</li>
            <li>示例格式: [{"name": "北京", "value": 100, "lat": 39.9042, "lng": 116.4074}]</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button 
            @click.stop="handleCloseDialog"
            :style="{marginRight: '10px'}"
          >
            取消
          </el-button>
          <el-button 
            type="primary" 
            @click.stop="handleCloseDialog"
          >
            关闭
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <div class="map-wrapper">
      <!-- 2D地图 -->
      <div v-if="mapType === 'china'" class="map-view-container">
        <Map
          :data="mapData"
          :color-theme="colorTheme"
          :show-heatmap="showHeatmap"
        />
      </div>
      
      <!-- 3D地图 -->
      <div v-else-if="mapType === '3D'" class="map-view-container">
        <ThreeDMap
          ref="threeDMapRef"
          :data="mapData"
          :color-theme="colorTheme"
          :show-heatmap="showHeatmap"
          :auto-rotate="autoRotate"
          :show-data-points="showDataPoints"
          :show-connection-lines="showConnectionLines"
          :distribution-data="distributionData"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  color: #333333;
  padding: 20px;
  box-sizing: border-box;
}

.map-title {
  font-size: 24px;
  margin: 0 0 20px;
  color: #1890ff;
  border-left: 4px solid #1890ff;
  padding-left: 15px;
}

.map-controls {
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.map-controls .el-button {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.map-controls .el-button.active {
  background-color: #1890ff;
  border-color: #1890ff;
  color: white;
}

.map-wrapper {
  flex: 1;
  background-color: #f0f2f5;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 600px;
}

.map-view-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
  display: flex;
}

:deep(.el-checkbox) {
  margin-right: 10px;
  --el-checkbox-checked-bg-color: #1890ff;
  --el-checkbox-checked-input-border-color: #1890ff;
  --el-checkbox-checked-icon-color: #fff;
  --el-checkbox-border-color: #1890ff;
  --el-checkbox-text-color: #333;
}

:deep(.el-checkbox.is-bordered) {
  background-color: rgba(24, 144, 255, 0.1);
  border-color: rgba(24, 144, 255, 0.3);
  border-radius: 4px;
  padding: 6px 10px;
  height: auto;
  margin-right: 10px;
  transition: all 0.3s;
}

:deep(.el-checkbox.is-bordered:hover) {
  background-color: rgba(24, 144, 255, 0.2);
  border-color: rgba(24, 144, 255, 0.5);
}

.upload-tips {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
  color: #333;
}

.upload-tips ul {
  padding-left: 20px;
  margin: 5px 0;
}

.upload-tips li {
  margin-bottom: 5px;
}
</style>