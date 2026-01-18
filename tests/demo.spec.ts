import { test, expect } from '@playwright/test'

test.describe('Visual Demo of All Features', () => {
  test('Demo: Feature 1 - Lucide Icons', async ({ page }) => {
    await page.goto('/')
    
    // Add highlight styles
    await page.addStyleTag({
      content: `
        .demo-highlight {
          outline: 4px solid #ff6b6b !important;
          outline-offset: 4px !important;
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { outline-color: #ff6b6b; }
          50% { outline-color: #4ecdc4; }
        }
      `
    })

    // Screenshot 1: Full homepage with icons
    await page.screenshot({ path: 'demo-screenshots/01-homepage-icons.png', fullPage: true })

    // Highlight all SVG icons in buttons
    await page.evaluate(() => {
      document.querySelectorAll('.big-button svg').forEach(el => {
        (el as HTMLElement).style.outline = '3px solid #feca57'
        ;(el as HTMLElement).style.borderRadius = '50%'
      })
    })
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'demo-screenshots/02-highlighted-icons.png', fullPage: true })
  })

  test('Demo: Feature 2 - Avatar Upload', async ({ page }) => {
    await page.goto('/')
    
    // Highlight avatar area
    const avatarButton = page.locator('header button').first()
    await avatarButton.evaluate((el) => {
      el.style.outline = '4px solid #ff6b6b'
      el.style.outlineOffset = '4px'
      el.style.boxShadow = '0 0 20px rgba(255, 107, 107, 0.5)'
    })
    
    await page.screenshot({ path: 'demo-screenshots/03-avatar-upload-area.png' })
  })

  test('Demo: Feature 3 - Sleep End Form', async ({ page }) => {
    await page.goto('/')
    
    // Screenshot the sleep buttons
    const sleepSection = page.locator('section').filter({ hasText: '睡眠' })
    
    // Highlight wake button
    const wakeButton = sleepSection.locator('button').filter({ hasText: '睡醒' })
    await wakeButton.evaluate((el) => {
      el.style.outline = '4px solid #feca57'
      el.style.outlineOffset = '4px'
      el.style.boxShadow = '0 0 20px rgba(254, 202, 87, 0.5)'
    })
    await page.screenshot({ path: 'demo-screenshots/04-wake-button-highlighted.png' })
    
    // Click wake button
    await wakeButton.click()
    await page.waitForTimeout(500)
    
    // Screenshot the form with duration options
    await page.screenshot({ path: 'demo-screenshots/05-sleep-end-form.png', fullPage: true })
    
    // Highlight duration options
    const durationButtons = page.locator('button').filter({ hasText: /小时|分钟/ })
    const count = await durationButtons.count()
    for (let i = 0; i < count; i++) {
      await durationButtons.nth(i).evaluate((el, idx) => {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#96c93d', '#a29bfe']
        el.style.outline = `3px solid ${colors[idx % colors.length]}`
        el.style.outlineOffset = '2px'
      }, i)
    }
    await page.screenshot({ path: 'demo-screenshots/06-duration-options-highlighted.png', fullPage: true })
    
    // Select 1 hour duration
    await page.locator('button').filter({ hasText: '1小时' }).click()
    await page.waitForTimeout(300)
    
    // Highlight the enabled submit button
    const submitButton = page.locator('button').filter({ hasText: '确认记录' })
    await submitButton.evaluate((el) => {
      el.style.outline = '4px solid #10ac84'
      el.style.outlineOffset = '4px'
      el.style.boxShadow = '0 0 20px rgba(16, 172, 132, 0.5)'
    })
    await page.screenshot({ path: 'demo-screenshots/07-submit-enabled.png', fullPage: true })
  })

  test('Demo: Stats Page Icons', async ({ page }) => {
    await page.goto('/stats')
    await page.waitForTimeout(500)
    
    // Screenshot stats page
    await page.screenshot({ path: 'demo-screenshots/08-stats-page.png', fullPage: true })
    
    // Highlight summary cards
    const cards = page.locator('[class*="rounded-2xl"][class*="shadow"]')
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      await cards.nth(i).evaluate((el, idx) => {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57']
        el.style.outline = `3px solid ${colors[idx % colors.length]}`
        el.style.outlineOffset = '2px'
      }, i)
    }
    await page.screenshot({ path: 'demo-screenshots/09-stats-cards-highlighted.png', fullPage: true })
  })
})

