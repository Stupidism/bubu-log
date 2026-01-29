import { test as base, Page, expect } from '@playwright/test'

// 测试账户信息（与 seed-test-data.ts 保持一致）
export const TEST_USER = {
  username: 'e2e-test-user',
  password: 'test123456',
  email: 'e2e-test@example.com',
}

export const TEST_ACTIVITY_ID = 'e2e-test-activity-id'

/**
 * 登录到应用
 * @param page Playwright Page 对象
 * @param username 用户名（默认使用测试账户）
 * @param password 密码（默认使用测试账户密码）
 */
export async function login(
  page: Page,
  username = TEST_USER.username,
  password = TEST_USER.password
) {
  // 导航到登录页
  await page.goto('/login')

  // 填写登录表单
  await page.getByRole('textbox', { name: '用户名或邮箱' }).fill(username)
  await page.getByRole('textbox', { name: '密码' }).fill(password)

  // 点击登录按钮
  await page.getByRole('button', { name: '登录', exact: true }).click()

  // 等待登录完成并跳转到首页
  await page.waitForURL('/', { timeout: 10000 })
  
  // 确认已登录（检查页面上是否有数据链接）
  await expect(page.getByRole('link', { name: /数据/ })).toBeVisible({ timeout: 5000 })
}

/**
 * 确保已登录状态
 * 如果未登录则执行登录
 */
export async function ensureLoggedIn(page: Page) {
  // 检查当前是否在登录页
  if (page.url().includes('/login')) {
    await login(page)
    return
  }

  // 尝试访问首页
  await page.goto('/')
  
  // 如果被重定向到登录页，则执行登录
  if (page.url().includes('/login')) {
    await login(page)
  }
}

/**
 * 扩展的测试 fixture，自动处理登录
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await login(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
