import { test, expect } from '@playwright/test'

// SKIPPED: /apply/upload is now gated by Supabase auth middleware
// (commit 7c719c5). These tests visit the page without a session and
// get redirected to /login. Additionally, the upload page no longer
// reads the user's email from sessionStorage — it derives it from the
// Supabase session — so the existing beforeEach setup pattern is no
// longer sufficient. Re-enable once authenticated test fixtures exist.
test.describe('Document upload page UI', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(true, 'Requires Supabase session — auth fixtures pending')
    // Original setup preserved below for when tests are re-enabled.
    await page.goto('/apply/upload')
    await page.evaluate(() => {
      sessionStorage.setItem('seisly_email', 'test@example.com')
      sessionStorage.setItem('seisly_scheme', 'seis')
    })
    await page.goto('/apply/upload')
  })

  test('should show all 6 document upload slots', async ({ page }) => {
    await expect(page.getByText('Business plan and financial forecasts')).toBeVisible()
    await expect(page.getByText('Latest accounts or management accounts')).toBeVisible()
    await expect(page.getByText('Memorandum and Articles of Association')).toBeVisible()
    await expect(page.getByText('Current shareholder list')).toBeVisible()
    await expect(page.getByText('Draft investor documents or information memorandum')).toBeVisible()
    await expect(page.getByText('Subscription agreement or side agreements')).toBeVisible()
  })

  test('should show optional tag on subscription agreement', async ({ page }) => {
    await expect(page.getByText('Optional')).toBeVisible()
  })

  test('should show submit button as disabled initially', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: 'Submit documents for review' })
    await expect(submitButton).toBeDisabled()
  })

  test('should show required documents count', async ({ page }) => {
    await expect(page.getByText('5 required documents still needed')).toBeVisible()
  })

  test('should show upload format hint', async ({ page }) => {
    await expect(page.getByText('For best review results')).toBeVisible()
  })
})
