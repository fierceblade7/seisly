import { test, expect } from '@playwright/test'

// SKIPPED: /apply is now gated by Supabase auth middleware (commit 7c719c5).
// These tests visit /apply without a session and get redirected to /login.
// Re-enable once authenticated test fixtures exist.
test.describe('Application form navigation', () => {
  test.beforeEach(() => {
    test.skip(true, 'Requires Supabase session — auth fixtures pending')
  })

  test('should load step 1, allow filling fields, navigate forward and back', async ({ page }) => {
    await page.goto('/apply')

    // Verify step 1 loads (use heading role to avoid matching step indicator)
    await expect(page.getByRole('heading', { name: 'Company details' })).toBeVisible()

    // Fill in email
    const emailInput = page.getByPlaceholder('you@yourcompany.com')
    await emailInput.fill('test@example.com')

    // Select a scheme
    await page.getByText('SEIS only').click()

    // Fill in company number (use exact match to avoid matching UTR placeholder)
    const companyNumberInput = page.getByPlaceholder('12345678', { exact: true })
    await companyNumberInput.fill('12345678')

    // Fill in UTR
    const utrInput = page.getByPlaceholder('1234567890', { exact: true })
    await utrInput.fill('1234567890')

    // Click continue (should show validation errors for missing fields)
    await page.getByRole('button', { name: /Continue/ }).click()

    // Verify validation appears for missing company name (from Companies House search)
    await expect(page.getByText('Please select your company from Companies House')).toBeVisible()
  })

  test('should navigate back from step 2 to step 1', async ({ page }) => {
    await page.goto('/apply')

    // Verify step 1 loaded (use heading role to avoid matching step indicator)
    await expect(page.getByRole('heading', { name: 'Company details' })).toBeVisible()
  })
})
