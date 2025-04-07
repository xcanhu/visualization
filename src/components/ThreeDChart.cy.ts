import ThreeDChart from './ThreeDChart.vue'

describe('ThreeDChart Component', () => {
  it('renders with default props', () => {
    // 挂载组件
    cy.mount(ThreeDChart, {
      props: {
        data: [],
        height: 400,
        width: 600,
        autoRotate: true,
        colorTheme: 'blue'
      }
    })
    
    // 验证容器渲染
    cy.get('.three-chart-container').should('exist')
    cy.get('canvas').should('exist')
  })
  
  it('renders with data', () => {
    // 模拟数据
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      id: `data-${i}`,
      value: Math.floor(Math.random() * 1000),
      name: `Series ${i}`,
      position: [i * 10, 0, 0]
    }))
    
    // 挂载组件
    cy.mount(ThreeDChart, {
      props: {
        data: mockData,
        height: 400,
        width: 600,
        autoRotate: true,
        colorTheme: 'blue'
      }
    })
    
    // 验证容器渲染
    cy.get('.three-chart-container').should('exist')
    cy.get('canvas').should('exist')
    
    // 等待渲染完成
    cy.wait(1000)
    
    // 验证控制器存在
    cy.get('.controls-container').should('exist')
  })
  
  it('responds to user interactions', () => {
    // 模拟数据
    const mockData = Array.from({ length: 5 }, (_, i) => ({
      id: `data-${i}`,
      value: Math.floor(Math.random() * 1000),
      name: `Series ${i}`,
      position: [i * 10, 0, 0]
    }))
    
    // 挂载组件
    cy.mount(ThreeDChart, {
      props: {
        data: mockData,
        height: 400,
        width: 600,
        autoRotate: false,
        colorTheme: 'blue'
      }
    })
    
    // 等待渲染完成
    cy.wait(1000)
    
    // 模拟鼠标交互
    cy.get('canvas')
      .trigger('mousedown', { button: 0 })
      .trigger('mousemove', { clientX: 350, clientY: 200 })
      .trigger('mouseup')
    
    // 验证控制器响应
    cy.get('.controls-container').should('exist')
  })
})