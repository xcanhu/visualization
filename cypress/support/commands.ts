// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// 登录命令
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-test=username]').type(username)
  cy.get('[data-test=password]').type(password)
  cy.get('[data-test=login-button]').click()
  cy.url().should('not.include', '/login')
})

// 等待图表加载完成
Cypress.Commands.add('waitForChart', () => {
  cy.get('.echarts-for-react canvas', { timeout: 10000 }).should('be.visible')
  // 等待图表动画完成
  cy.wait(1000)
})

// 检查图表是否存在
Cypress.Commands.add('checkChartExists', () => {
  cy.get('.echarts-for-react canvas').should('exist')
})

// 等待3D图表加载完成
Cypress.Commands.add('waitFor3DChart', () => {
  cy.get('canvas.three-js-canvas', { timeout: 10000 }).should('be.visible')
  // 等待3D渲染完成
  cy.wait(2000)
})

// 检查页面性能
Cypress.Commands.add('checkPerformance', () => {
  cy.window().then((win) => {
    const performance = win.performance
    const navigationStart = performance.timing.navigationStart
    const loadEventEnd = performance.timing.loadEventEnd
    const loadTime = loadEventEnd - navigationStart
    
    // 记录性能指标
    cy.log(`页面加载时间: ${loadTime}ms`)
    
    // 断言加载时间不超过特定阈值
    expect(loadTime).to.be.lessThan(5000) // 5秒
  })
})