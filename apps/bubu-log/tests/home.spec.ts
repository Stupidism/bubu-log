import { test, expect, login } from './fixtures'

test.describe('Homepage Features', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.describe('Feature 2: Baby Avatar Upload', () => {
    test('should display avatar upload button in header', async ({ page }) => {
      const avatarArea = page.locator('header').locator('button, [class*="rounded-full"]').first()
      await expect(avatarArea).toBeVisible()
    })

    test('should have file input for avatar upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"][accept="image/*"]')
      await expect(fileInput).toBeAttached()
    })
  })

  test.describe('Feature 3: Sleep End Modal', () => {
    test('should open sleep end modal and allow submit', async ({ page }) => {
      await page.goto('/?modal=sleep_end')

      const bottomSheet = page.getByTestId('bottom-sheet')
      await expect(bottomSheet).toBeVisible({ timeout: 5000 })

      await expect(bottomSheet.getByRole('heading', { level: 2, name: '睡醒' })).toBeVisible()
      await expect(bottomSheet.getByText('入睡时间')).toBeVisible()
      await expect(bottomSheet.getByText('睡醒时间')).toBeVisible()

      const submitButton = page.getByRole('button', { name: '确认记录' })
      await expect(submitButton).toBeEnabled()
    })
  })
})
