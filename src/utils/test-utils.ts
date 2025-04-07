import { mount, VueWrapper } from '@vue/test-utils'
import { Component } from 'vue'

// 测试工具函数集合
export const waitForDomUpdate = async () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// 等待组件渲染完成
export const waitForRender = async (wrapper: VueWrapper<any>) => {
  await waitForDomUpdate()
  await wrapper.vm.$nextTick()
}

// 模拟数据生成器
export const generateMockData = (type: string, count: number = 10) => {
  switch (type) {
    case 'chart':
      return Array.from({ length: count }, (_, i) => ({
        id: `data-${i}`,
        value: Math.floor(Math.random() * 1000),
        name: `Series ${i}`,
        category: `Category ${i % 5}`
      }))
    case 'map':
      return Array.from({ length: count }, (_, i) => ({
        id: `region-${i}`,
        name: `Region ${i}`,
        value: Math.floor(Math.random() * 1000),
        coordinates: [100 + Math.random() * 40, 30 + Math.random() * 20]
      }))
    default:
      return []
  }
}

// 创建测试组件挂载器
export const createComponentMounter = (component: Component) => {
  return (props = {}, options = {}) => {
    return mount(component, {
      props,
      ...options
    })
  }
}