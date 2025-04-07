import { createI18n } from 'vue-i18n'

// 导入语言包
const messages = {
  zh: {
    common: {
      loading: '加载中...',
      noData: '暂无数据',
      confirm: '确认',
      cancel: '取消',
      save: '保存',
      edit: '编辑',
      delete: '删除',
      refresh: '刷新',
      back: '返回',
      search: '搜索'
    },
    nav: {
      home: '首页',
      map: '地图数据',
      chart: '实时图表'
    },
    map: {
      title: '地理数据可视化',
      backToChina: '返回全国地图',
      currentView: '当前查看',
      dataDistribution: '全国数据分布图'
    },
    chart: {
      title: '实时数据监控',
      realtime: '实时数据',
      connected: '已连接',
      disconnected: '已断开',
      paused: '已暂停',
      error: '连接错误',
      clearData: '清空数据',
      toggleRealtime: '切换实时状态',
      lastUpdate: '最后更新时间',
      chartTypes: {
        line: '折线图',
        bar: '柱状图',
        area: '面积图'
      }
    },
    threeDChart: {
      bar3d: '3D柱状图',
      scatter3d: '3D散点图',
      surface3d: '3D曲面图',
      tip: '提示: 鼠标拖动可旋转视角，滚轮可缩放'
    },
    threeDMap: {
      title: '3D地理数据',
      china: '中国地图',
      world: '世界地图',
      regionInfo: '区域信息',
      value: '数值',
      tip: '提示: 点击区域可查看详情'
    }
  },
  en: {
    common: {
      loading: 'Loading...',
      noData: 'No Data',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      refresh: 'Refresh',
      back: 'Back',
      search: 'Search'
    },
    nav: {
      home: 'Home',
      map: 'Map Data',
      chart: 'Real-time Chart'
    },
    map: {
      title: 'Geographic Data Visualization',
      backToChina: 'Back to China Map',
      currentView: 'Current View',
      dataDistribution: 'National Data Distribution'
    },
    chart: {
      title: 'Real-time Data Monitoring',
      realtime: 'Real-time Data',
      connected: 'Connected',
      disconnected: 'Disconnected',
      paused: 'Paused',
      error: 'Connection Error',
      clearData: 'Clear Data',
      toggleRealtime: 'Toggle Real-time',
      lastUpdate: 'Last Update',
      chartTypes: {
        line: 'Line Chart',
        bar: 'Bar Chart',
        area: 'Area Chart'
      }
    },
    threeDChart: {
      bar3d: '3D Bar Chart',
      scatter3d: '3D Scatter Plot',
      surface3d: '3D Surface Chart',
      tip: 'Tip: Drag to rotate, scroll to zoom'
    },
    threeDMap: {
      title: '3D Geographic Data',
      china: 'China Map',
      world: 'World Map',
      regionInfo: 'Region Info',
      value: 'Value',
      tip: 'Tip: Click region for details'
    }
  }
}

// 创建i18n实例
const i18n = createI18n({
  legacy: false, // 使用组合式API
  locale: 'zh', // 默认语言
  fallbackLocale: 'en', // 回退语言
  messages, // 语言包
  silentTranslationWarn: true, // 禁用翻译警告
  silentFallbackWarn: true // 禁用回退警告
})

export default i18n