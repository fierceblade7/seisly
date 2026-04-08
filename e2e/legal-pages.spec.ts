import { test, expect } from '@playwright/test'

test.describe('Legal pages', () => {
  test('/privacy loads with correct title', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page).toHaveTitle(/Privacy Policy/)
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  })

  test('/terms loads with correct title', async ({ page }) => {
    await page.goto('/terms')
    await expect(page).toHaveTitle(/Terms of Service/)
    await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible()
  })

  test('/cookies loads with correct title', async ({ page }) => {
    await page.goto('/cookies')
    await expect(page).toHaveTitle(/Cookie Policy/)
    await expect(page.getByRole('heading', { name: 'Cookie Policy' })).toBeVisible()
  })

  test('/acceptable-use loads with correct title', async ({ page }) => {
    await page.goto('/acceptable-use')
    await expect(page).toHaveTitle(/Acceptable Use/)
    await expect(page.getByRole('heading', { name: 'Acceptable Use Policy' })).toBeVisible()
  })

  test('each legal page has a link back to homepage', async ({ page }) => {
    for (const path of ['/privacy', '/terms', '/cookies', '/acceptable-use']) {
      await page.goto(path)
      // The first link inside the nav is the Logo wrapped in <Link href="/">.
      // We scope to <nav> so the LaunchBanner's LinkedIn link (which renders
      // above the nav from app/layout.tsx) doesn't shadow the home link.
      const homeLink = page.getByRole('navigation').getByRole('link').first()
      await expect(homeLink).toHaveAttribute('href', '/')
    }
  })
})
