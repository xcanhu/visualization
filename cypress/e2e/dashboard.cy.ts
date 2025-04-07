describe('Dashboard Tests', () => {
  beforeEach(() => {
    cy.visit('/dashboard')
    // 等待页面加载完成
    cy.get('h1', { timeout: 10000 }).should('be.visible')
  })

  it('should load the dashboard page correctly', () => {
    // 验证页面标题
    cy.title().should('include', '数据仪表盘')
    
    // 验证页面内容
    cy.get('h1').should('contain', '仪表盘')
    
    // 检查性能
    cy.checkPerformance()
  })

  it('should display charts correctly', () => {
    // 等待图表加载
    cy.waitForChart()
    
    // 验证图表容器存在
    cy.get('[data-test=pie-chart]').should('exist')
    cy.get('[data-test=gauge-chart]').should('exist')
    cy.get('[data-test=bar-chart]').should('exist')
    
    // 验证图表内容
    cy.get('[data-test=pie-chart] canvas').should('be.visible')
    cy.get('[data-test=gauge-chart] canvas').should('be.visible')
    cy.get('[data-test=bar-chart] canvas').should('be.visible')
  })

  it('should handle data filtering correctly', () => {
    // 选择日期范围
    cy.get('[data-test=date-picker]').click()
    cy.get('.el-date-table__row td.available').first().click()
    cy.get('.el-date-table__row td.available').last().click()
    cy.get('[data-test=apply-filter]').click()
    
    // 等待图表重新加载
    cy.waitForChart()
    
    // 验证图表已更新
    cy.get('[data-test=data-update-time]').should('be.visible')
  })

  it('should handle theme switching correctly', () => {
    // 切换主题
    cy.get('[data-test=theme-switch]').click()
    cy.get('[data-test=dark-theme]').click()
    
    // 验证主题已切换
    cy.get('body').should('have.class', 'dark-theme')
    
    // 验证图表样式已更新
    cy.waitForChart()
  })
})