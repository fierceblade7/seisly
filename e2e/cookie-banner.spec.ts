import { test, expect } from '@playwright/test'

test.describe('Cookie banner', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should appear on first visit', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('We use essential cookies')).toBeVisible()
  })

  test('should have Essential only and Accept all buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /Essential only/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Accept all/i })).toBeVisible()
  })

  test('should dismiss on Essential only click', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Essential only/i }).click()
    await expect(page.getByText('We use essential cookies')).not.toBeVisible()
  })

  test('should not reappear after dismissal', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Essential only/i }).click()
    await page.reload()
    // Give it a moment to render
    await page.waitForTimeout(1000)
    await expect(page.getByText('We use essential cookies')).not.toBeVisible()
  })

  test('should dismiss on Accept all click', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Accept all/i }).click()
    await expect(page.getByText('We use essential cookies')).not.toBeVisible()
  })

  test('should have cookie policy link', async ({ page }) => {
    await page.goto('/')
    const cookieLink = page.getByRole('link', { name: /cookie/i }).first()
    await expect(cookieLink).toBeVisible()
  })
})
