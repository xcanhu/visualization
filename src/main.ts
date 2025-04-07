import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import * as echarts from 'echarts'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import i18n from './i18n'
import dbService from './utils/db'
import { sharedWorkerService } from './utils/workerService'

// 创建Vue应用实例
const app = createApp(App)

// 注册全局属性
app.config.globalProperties.$echarts = echarts
app.config.globalProperties.$db = dbService
app.config.globalProperties.$worker = sharedWorkerService

// 使用插件
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus, {
  locale: zhCn
})

// 挂载应用
app.mount('#app')

// 性能优化：预加载数据（应用挂载后执行，避免阻塞渲染）
dbService.getUserSettings().then(settings => {
  if (settings?.language) {
    i18n.global.locale.value = settings.language
  }
})
