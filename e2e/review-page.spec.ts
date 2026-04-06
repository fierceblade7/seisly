import { test, expect } from '@playwright/test'

test.describe('Review page states', () => {
  test('should show holding page with correct heading', async ({ page }) => {
    await page.goto('/apply/review?email=test-holding@example.com&scheme=seis')

    await expect(page.getByText('Thank you')).toBeVisible()
    await expect(page.getByText('your application is with us')).toBeVisible()
  })

  test('should not show review results on holding page', async ({ page }) => {
    await page.goto('/apply/review?email=test-holding@example.com&scheme=seis')

    // Wait for page to settle
    await page.waitForTimeout(2000)

    // These should NOT be visible
    await expect(page.getByText('Document review')).not.toBeVisible()
    await expect(page.getByText('Application answers')).not.toBeVisible()
    await expect(page.getByText('Consistency check')).not.toBeVisible()
    await expect(page.getByText('Approve and proceed')).not.toBeVisible()
  })

  test('should display email and scheme on review page', async ({ page }) => {
    await page.goto('/apply/review?email=test@example.com&scheme=eis')

    await expect(page.getByText('test@example.com · EIS')).toBeVisible()
  })

  test('should show application review heading', async ({ page }) => {
    await page.goto('/apply/review?email=test@example.com&scheme=seis')
    await expect(page.getByText('Your application review')).toBeVisible()
  })

  test('should show email notification text on holding page', async ({ page }) => {
    await page.goto('/apply/review?email=test@example.com&scheme=seis')
    await expect(page.getByText('when there is an update')).toBeVisible()
  })
})
