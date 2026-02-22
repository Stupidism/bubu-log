import { test, expect, login } from './fixtures'

test.describe('Homepage Features', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.describe('Feature 2: Baby Switcher + Drawer', () => {
    test('should display baby switcher and drawer trigger in header', async ({ page }) => {
      await expect(page.getByTestId('baby-switcher-trigger')).toBeVisible()
      await expect(page.getByTestId('drawer-trigger')).toBeVisible()
    })

    test('should open baby switcher dropdown list', async ({ page }) => {
      await page.getByTestId('baby-switcher-trigger').click()
      await expect(page.getByTestId('baby-switcher-item-e2e-test-baby-id')).toBeVisible()
      await expect(page.getByTestId('baby-switcher-item-e2e-test-baby-id-2')).toBeVisible()
    })

    test('should open settings from drawer and show avatar upload input', async ({ page }) => {
      await page.getByTestId('drawer-trigger').click()
      const settingsLink = page.getByTestId('drawer-link-settings')
      await settingsLink.evaluate((element) => {
        ;(element as HTMLAnchorElement).click()
      })

      await expect(page).toHaveURL(/\/b\/[^/?#]+\/settings$/)

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
