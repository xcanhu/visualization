// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// 添加自定义命令
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * 登录到应用
       * @example cy.login('username', 'password')
       */
      login(username: string, password: string): Chainable<void>
      
      /**
       * 等待图表加载完成
       * @example cy.waitForChart()
       */
      waitForChart(): Chainable<void>
      
      /**
       * 检查图表是否存在
       * @example cy.checkChartExists()
       */
      checkChartExists(): Chainable<void>
    }
  }
}