import { test, expect, login, TEST_ACTIVITY_ID, TEST_ACTIVITY_ID_BABY2, TEST_BABY_ID, TEST_BABY_ID_2 } from './fixtures'

test.describe('Multi Baby URL Scope', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('deep link should open target baby context', async ({ page }) => {
    await page.goto(`/b/${TEST_BABY_ID_2}`)
    await expect(page).toHaveURL(new RegExp(`/b/${TEST_BABY_ID_2}$`))
    await expect(page.getByTestId('baby-switcher-trigger')).toBeVisible()
    await expect(page.getByTestId(`timeline-activity-${TEST_ACTIVITY_ID_BABY2}`)).toBeVisible()
    await expect(page.getByTestId(`timeline-activity-${TEST_ACTIVITY_ID}`)).toHaveCount(0)
  })

  test('switching baby should update URL and timeline data', async ({ page }) => {
    await page.goto(`/b/${TEST_BABY_ID}`)
    await expect(page.getByTestId(`timeline-activity-${TEST_ACTIVITY_ID}`)).toBeVisible()

    await page.getByTestId('baby-switcher-trigger').click()
    const secondBabyMenuItem = page.getByTestId(`baby-switcher-item-${TEST_BABY_ID_2}`)
    await secondBabyMenuItem.evaluate((element) => {
      ;(element as HTMLElement).click()
    })

    await expect(page).toHaveURL(new RegExp(`/b/${TEST_BABY_ID_2}$`))
    await expect(page.getByTestId(`timeline-activity-${TEST_ACTIVITY_ID_BABY2}`)).toBeVisible()
    await expect(page.getByTestId(`timeline-activity-${TEST_ACTIVITY_ID}`)).toHaveCount(0)
  })

  test('drawer navigation should keep babyId', async ({ page }) => {
    await page.goto(`/b/${TEST_BABY_ID_2}`)
    await page.getByTestId('drawer-trigger').click()

    await expect(page.getByTestId('drawer-link-home')).toBeVisible()
    await expect(page.getByTestId('drawer-link-records')).toBeVisible()
    await expect(page.getByTestId('drawer-link-trends')).toBeVisible()
    await expect(page.getByTestId('drawer-link-audits')).toBeVisible()
    await expect(page.getByTestId('drawer-link-babies')).toBeVisible()
    await expect(page.getByTestId('drawer-link-settings')).toBeVisible()

    const trendsLink = page.getByTestId('drawer-link-trends')
    await trendsLink.evaluate((element) => {
      ;(element as HTMLAnchorElement).click()
    })
    await expect(page).toHaveURL(new RegExp(`/b/${TEST_BABY_ID_2}/stats/trends$`))
  })

  test('baby management page should support create edit and default switch', async ({ page }) => {
    await page.goto(`/b/${TEST_BABY_ID}/babies`)
    await expect(page).toHaveURL(new RegExp(`/b/${TEST_BABY_ID}/babies`))

    const timestamp = Date.now().toString().slice(-6)
    const createdName = `E2E宝宝${timestamp}`
    const createdFullName = `${createdName}全名`
    const editedName = `${createdName}改`
    const editedFullName = `${createdName}大名改`

    await page.getByTestId('babies-add-trigger').click()
    await page.getByTestId('babies-create-name').fill(createdName)
    await page.getByTestId('babies-create-full-name').fill(createdFullName)
    await page.getByTestId('babies-create-submit').click()
    const createdCard = page
      .locator('[data-testid^="baby-item-"]')
      .filter({ hasText: `大名：${createdFullName}` })
      .first()
    await expect(createdCard).toContainText(createdName)
    await expect(createdCard).toContainText(`大名：${createdFullName}`)

    await createdCard.getByRole('button', { name: '编辑' }).click()
    await createdCard.locator('[data-testid^="baby-edit-name-"]').fill(editedName)
    await createdCard.locator('[data-testid^="baby-edit-full-name-"]').fill(editedFullName)
    await createdCard.getByRole('button', { name: '保存' }).click()
    const editedCard = page
      .locator('[data-testid^="baby-item-"]')
      .filter({ hasText: `大名：${editedFullName}` })
      .first()
    await expect(editedCard).toContainText(editedName)
    await expect(editedCard).toContainText(`大名：${editedFullName}`)

    const secondBabyCard = page.locator('[data-testid^="baby-item-"]').filter({ hasText: '测试宝宝二号' }).first()
    await secondBabyCard.getByRole('button', { name: '设为默认' }).click()
    await expect(page).toHaveURL(new RegExp(`/b/${TEST_BABY_ID_2}/babies`))
    await expect(secondBabyCard.getByText('默认')).toBeVisible()
  })
})
