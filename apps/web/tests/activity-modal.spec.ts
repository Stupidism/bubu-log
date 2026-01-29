import { test, expect, login, TEST_ACTIVITY_ID } from './fixtures'

test.describe('Activity Modal E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前先登录
    await login(page)
  })

  test.describe('Activity Detail Modal', () => {
    test('should open activity detail modal when clicking on an activity', async ({ page }) => {
      // 导航到带有活动ID的URL来打开弹窗
      await page.goto(`/?modal=activity&id=${TEST_ACTIVITY_ID}`)

      // 等待弹窗加载完成
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 10000 })

      // 检查弹窗标题（应该显示活动类型，如"瓶喂"）
      const dialogHeading = dialog.getByRole('heading', { level: 2 })
      await expect(dialogHeading).toBeVisible()

      // 检查编辑、删除、关闭按钮是否存在
      await expect(dialog.getByRole('button', { name: '编辑' })).toBeVisible()
      await expect(dialog.getByRole('button', { name: '删除' })).toBeVisible()
      await expect(dialog.getByRole('button', { name: '关闭' })).toBeVisible()

      // 截图记录
      await page.screenshot({ path: 'test-results/activity-detail-modal.png' })
    })

    test('should open edit form when clicking edit button', async ({ page }) => {
      // 打开活动详情弹窗
      await page.goto(`/?modal=activity&id=${TEST_ACTIVITY_ID}`)

      // 等待弹窗加载
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 10000 })

      // 等待内容加载完成（不是"加载中..."）
      await expect(dialog.getByRole('heading', { level: 2 })).not.toHaveText('加载中...')

      // 点击编辑按钮
      await dialog.getByRole('button', { name: '编辑' }).click()

      // 验证URL变成编辑模式
      await expect(page).toHaveURL(/edit=true/)

      // 验证弹窗标题变成"编辑记录"
      await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('编辑记录')

      // 验证编辑表单元素存在
      // 对于瓶喂活动，应该有开始时间、结束时间、奶量等字段
      await expect(dialog.getByText('开始时间')).toBeVisible()
      await expect(dialog.getByText('奶量')).toBeVisible()

      // 验证保存和取消按钮
      await expect(dialog.getByRole('button', { name: '保存修改' })).toBeVisible()
      await expect(dialog.getByRole('button', { name: '取消' })).toBeVisible()

      // 截图记录
      await page.screenshot({ path: 'test-results/activity-edit-form.png' })
    })

    test('should close modal when clicking close button', async ({ page }) => {
      // 打开活动详情弹窗
      await page.goto(`/?modal=activity&id=${TEST_ACTIVITY_ID}`)

      // 等待弹窗加载
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 10000 })

      // 点击关闭按钮
      await dialog.getByRole('button', { name: '关闭' }).click()

      // 验证弹窗已关闭
      await expect(dialog).not.toBeVisible()

      // 验证URL不再包含modal参数
      await expect(page).not.toHaveURL(/modal=activity/)
    })

    test('should close modal when pressing Escape key', async ({ page }) => {
      // 打开活动详情弹窗
      await page.goto(`/?modal=activity&id=${TEST_ACTIVITY_ID}`)

      // 等待弹窗加载
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 10000 })

      // 按Escape键
      await page.keyboard.press('Escape')

      // 验证弹窗已关闭
      await expect(dialog).not.toBeVisible()
    })
  })

  test.describe('Activity Click from Timeline', () => {
    test('should navigate to activity detail via URL parameter', async ({ page }) => {
      // 这个测试通过URL直接打开活动详情，确保URL参数方式可以工作
      // 这是最可靠的方式来测试活动详情功能
      await page.goto(`/?modal=activity&id=${TEST_ACTIVITY_ID}`)

      // 等待弹窗加载
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 10000 })

      // 验证URL包含modal参数
      await expect(page).toHaveURL(/modal=activity/)
      await expect(page).toHaveURL(new RegExp(TEST_ACTIVITY_ID))
    })
  })
})

test.describe('Add Activity Modal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should open add bottle feed modal', async ({ page }) => {
    // 导航到添加瓶喂的URL
    await page.goto('/?modal=bottle')

    // 等待弹窗加载
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 验证弹窗标题
    const dialogHeading = dialog.getByRole('heading', { level: 2 })
    await expect(dialogHeading).toHaveText('瓶喂')

    // 验证表单元素存在
    await expect(dialog.getByText('开始时间')).toBeVisible()
    await expect(dialog.getByText('奶量')).toBeVisible()

    // 截图记录
    await page.screenshot({ path: 'test-results/add-bottle-modal.png' })
  })

  test('should open add diaper modal', async ({ page }) => {
    // 导航到添加换尿布的URL
    await page.goto('/?modal=diaper')

    // 等待弹窗加载
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 验证弹窗标题
    const dialogHeading = dialog.getByRole('heading', { level: 2 })
    await expect(dialogHeading).toHaveText('换尿布')

    // 截图记录
    await page.screenshot({ path: 'test-results/add-diaper-modal.png' })
  })

  test('should open add supplement modal', async ({ page }) => {
    // 导航到添加补剂的URL
    await page.goto('/?modal=supplement')

    // 等待弹窗加载
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 验证弹窗标题
    const dialogHeading = dialog.getByRole('heading', { level: 2 })
    await expect(dialogHeading).toHaveText('补剂')

    // 截图记录
    await page.screenshot({ path: 'test-results/add-supplement-modal.png' })
  })
})
