import { test, expect } from '@playwright/test'

test.describe('Review page holding state', () => {
  test('should show holding page when review is not released', async ({ page }) => {
    // Visit review page with a test email that has no released review
    await page.goto('/apply/review?email=test-no-review@example.com&scheme=seis')

    // Verify the holding page appears
    await expect(page.getByText('Thank you')).toBeVisible()
    await expect(page.getByText('your application is with us')).toBeVisible()

    // Verify review results are NOT shown
    await expect(page.getByText('Document review')).not.toBeVisible()
    await expect(page.getByText('Application answers')).not.toBeVisible()
    await expect(page.getByText('Consistency check')).not.toBeVisible()
  })

  test('should show email notification message on holding page', async ({ page }) => {
    await page.goto('/apply/review?email=test@example.com&scheme=seis')

    // Verify the email notification text
    await expect(page.getByText('when there is an update')).toBeVisible()
  })
})
