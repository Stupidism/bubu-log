import { test, expect } from '@playwright/test'

test.describe('Homepage Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Feature 1: Lucide Icons (No Emojis)', () => {
    test('should display header with Lucide icons instead of emojis', async ({ page }) => {
      // Check that header exists
      const header = page.locator('header')
      await expect(header).toBeVisible()

      // Check for data link with BarChart icon (not emoji)
      const dataLink = page.getByRole('link', { name: /数据/i })
      await expect(dataLink).toBeVisible()
      
      // Verify SVG icon is present (Lucide icons are SVG)
      const svgInDataLink = dataLink.locator('svg')
      await expect(svgInDataLink).toBeVisible()

      // Highlight the header for visual demo
      await header.evaluate((el) => {
        el.style.outline = '3px solid #ff6b6b'
        el.style.outlineOffset = '2px'
      })
      await page.waitForTimeout(1000)
    })

    test('should display activity buttons with SVG icons', async ({ page }) => {
      // Check sleep buttons have SVG icons
      const sleepSection = page.locator('section').filter({ hasText: '睡眠' })
      await expect(sleepSection).toBeVisible()

      const sleepButtons = sleepSection.locator('button')
      const firstButton = sleepButtons.first()
      
      // Check for SVG icon in button
      const svgIcon = firstButton.locator('svg')
      await expect(svgIcon).toBeVisible()

      // Highlight all activity buttons
      const allButtons = page.locator('.big-button')
      const count = await allButtons.count()
      for (let i = 0; i < count; i++) {
        await allButtons.nth(i).evaluate((el) => {
          el.style.outline = '3px solid #4ecdc4'
          el.style.outlineOffset = '2px'
        })
      }
      await page.waitForTimeout(1500)
    })

    test('should use icons in section headers', async ({ page }) => {
      // Check section headers have SVG icons
      const sections = ['睡眠', '喂奶', '换尿布', '其他活动']
      
      for (const sectionName of sections) {
        const sectionHeader = page.locator('h2').filter({ hasText: sectionName })
        await expect(sectionHeader).toBeVisible()
        
        const svgIcon = sectionHeader.locator('svg')
        await expect(svgIcon).toBeVisible()

        // Highlight each section header
        await sectionHeader.evaluate((el) => {
          el.style.background = 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
          el.style.padding = '8px 12px'
          el.style.borderRadius = '8px'
          el.style.color = 'white'
        })
      }
      await page.waitForTimeout(1500)
    })
  })

  test.describe('Feature 2: Baby Avatar Upload', () => {
    test('should display avatar upload button in header', async ({ page }) => {
      // Look for the avatar upload area
      const avatarArea = page.locator('header').locator('button, [class*="rounded-full"]').first()
      await expect(avatarArea).toBeVisible()

      // Highlight the avatar area
      await avatarArea.evaluate((el) => {
        el.style.outline = '4px solid #ff6b6b'
        el.style.outlineOffset = '4px'
        el.style.animation = 'pulse 1s infinite'
      })
      
      // Add pulse animation
      await page.addStyleTag({
        content: `
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `
      })
      await page.waitForTimeout(2000)
    })

    test('should have file input for avatar upload', async ({ page }) => {
      // Check for hidden file input
      const fileInput = page.locator('input[type="file"][accept="image/*"]')
      await expect(fileInput).toBeAttached()
    })
  })

  test.describe('Feature 3: Sleep End Without Sleep Start', () => {
    test('should have both sleep buttons visible', async ({ page }) => {
      const sleepSection = page.locator('section').filter({ hasText: '睡眠' })
      const buttons = sleepSection.locator('.big-button')
      
      // Should have 2 buttons
      await expect(buttons).toHaveCount(2)

      // Find the wake up button (睡醒)
      const wakeButton = sleepSection.locator('button').filter({ hasText: '睡醒' })
      await expect(wakeButton).toBeVisible()
      
      // Wake button should NOT be disabled
      await expect(wakeButton).not.toBeDisabled()

      // Highlight the wake button
      await wakeButton.evaluate((el) => {
        el.style.outline = '4px solid #feca57'
        el.style.outlineOffset = '4px'
        el.style.boxShadow = '0 0 20px rgba(254, 202, 87, 0.5)'
      })
      await page.waitForTimeout(1500)
    })

    test('should open sleep end form with duration options when clicked without prior sleep start', async ({ page }) => {
      // Click the wake button
      const wakeButton = page.locator('button').filter({ hasText: '睡醒' })
      await wakeButton.click()

      // Wait for bottom sheet to appear - use more specific selector
      const bottomSheet = page.locator('[class*="animate-slide-up"]')
      await expect(bottomSheet).toBeVisible({ timeout: 5000 })

      // Should show duration preset buttons since no prior sleep start
      const durationSection = page.getByText('请选择宝宝睡了多久')
      await expect(durationSection).toBeVisible()

      // Check for duration presets
      const presets = ['30分钟', '1小时', '1.5小时', '2小时', '3小时', '4小时']
      for (const preset of presets) {
        const presetButton = page.locator('button').filter({ hasText: preset })
        await expect(presetButton).toBeVisible()
      }

      // Highlight the duration options
      const durationButtons = page.locator('button').filter({ hasText: /小时|分钟/ })
      const count = await durationButtons.count()
      for (let i = 0; i < count; i++) {
        await durationButtons.nth(i).evaluate((el) => {
          el.style.outline = '2px solid #54a0ff'
          el.style.outlineOffset = '2px'
        })
      }
      await page.waitForTimeout(2000)
    })

    test('should require duration selection before submitting', async ({ page }) => {
      // Click the wake button
      const wakeButton = page.locator('button').filter({ hasText: '睡醒' })
      await wakeButton.click()

      // Wait for form
      await page.waitForTimeout(500)

      // Submit button should be disabled initially
      const submitButton = page.locator('button').filter({ hasText: '确认记录' })
      await expect(submitButton).toBeDisabled()

      // Highlight the disabled submit button
      await submitButton.evaluate((el) => {
        el.style.outline = '3px solid #ee5253'
        el.style.outlineOffset = '2px'
      })
      await page.waitForTimeout(1000)

      // Select a duration
      const duration1h = page.locator('button').filter({ hasText: '1小时' })
      await duration1h.click()

      // Now submit should be enabled
      await expect(submitButton).not.toBeDisabled()

      // Highlight the enabled submit button
      await submitButton.evaluate((el) => {
        el.style.outline = '3px solid #10ac84'
        el.style.outlineOffset = '2px'
        el.style.boxShadow = '0 0 15px rgba(16, 172, 132, 0.5)'
      })
      await page.waitForTimeout(1500)
    })
  })
})

test.describe('Stats Page Features', () => {
  test('should display stats page with Lucide icons', async ({ page }) => {
    await page.goto('/stats')

    // Check header has icons
    const backLink = page.getByRole('link', { name: /返回/i })
    await expect(backLink).toBeVisible()
    
    const svgInBackLink = backLink.locator('svg')
    await expect(svgInBackLink).toBeVisible()

    // Check summary cards have icons
    const summarySection = page.locator('section').first()
    const svgIcons = summarySection.locator('svg')
    expect(await svgIcons.count()).toBeGreaterThan(0)

    // Highlight the summary cards
    const cards = page.locator('[class*="rounded-2xl"][class*="shadow"]')
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      await cards.nth(i).evaluate((el, index) => {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57']
        el.style.outline = `3px solid ${colors[index % colors.length]}`
        el.style.outlineOffset = '2px'
      }, i)
    }
    await page.waitForTimeout(2000)
  })
})

