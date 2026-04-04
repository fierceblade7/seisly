import { test, expect } from '@playwright/test'

test.describe('Error pages', () => {
  test('should show 404 page for non-existent URL', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByText('Page not found')).toBeVisible()
  })

  test('404 page should have a link back to homepage', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    const homeButton = page.getByRole('button', { name: 'Back to home' })
    await expect(homeButton).toBeVisible()
  })
})
