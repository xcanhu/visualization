import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义数据状态存储
export const useDataStore = defineStore('data', () => {
  // 地图数据
  const mapData = ref([])
  // 图表数据
  const chartData = ref([])
  // 仪表盘数据
  const dashboardData = ref({})
  // 加载状态
  const loading = ref(false)
  
  // 设置地图数据
  function setMapData(data: any[]) {
    mapData.value = data
  }
  
  // 设置图表数据
  function setChartData(data: any[]) {
    chartData.value = data
  }
  
  // 设置仪表盘数据
  function setDashboardData(data: any) {
    dashboardData.value = data
  }
  
  // 设置加载状态
  function setLoading(status: boolean) {
    loading.value = status
  }
  
  return {
    mapData,
    chartData,
    dashboardData,
    loading,
    setMapData,
    setChartData,
    setDashboardData,
    setLoading
  }
})