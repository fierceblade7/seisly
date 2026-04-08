import { test, expect } from '@playwright/test'

// SKIPPED: /apply/review is now gated by Supabase auth middleware
// (commit 7c719c5). Additionally, the review page now ignores the
// URL ?email= param entirely (commit 1578ef2 — email always comes
// from the session), so URL-driven tests no longer drive any
// particular user's review. Re-enable once authenticated test
// fixtures exist. Note: the "should not show review results"
// test in this file currently passes but is a false positive —
// it asserts text is NOT visible, which is trivially true on the
// /login page that the test actually lands on after the redirect.
test.describe('Review page states', () => {
  test.beforeEach(() => {
    test.skip(true, 'Requires Supabase session — auth fixtures pending')
  })

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
