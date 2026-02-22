import { test, expect, login, TEST_ACTIVITY_ID } from './fixtures'

test.describe('Activity Modal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('clicking an activity opens the modal URL', async ({ page }) => {
    await page.goto('/')

    const activity = page.getByTestId(`timeline-activity-${TEST_ACTIVITY_ID}`)
    await expect(activity).toBeVisible({ timeout: 10000 })
    await activity.click()

    await expect(page).toHaveURL(/modal=activity/)
    await expect(page).toHaveURL(new RegExp(TEST_ACTIVITY_ID))
  })

  test('open by URL and perform basic actions', async ({ page }) => {
    await page.goto(`/?modal=activity&id=${TEST_ACTIVITY_ID}`)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })

    const editButton = dialog.getByRole('button', { name: '编辑' })
    await expect(editButton).toBeVisible({ timeout: 10000 })
    await editButton.click()

    await expect(page).toHaveURL(/edit=true/)
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('编辑记录')

    const cancelButton = dialog.getByRole('button', { name: '取消' })
    await expect(cancelButton).toBeVisible()
    await cancelButton.click()
    await expect(dialog).not.toBeVisible()
  })
})
