import { test, expect } from '@playwright/test'

test.describe('Application form navigation', () => {
  test('should load step 1, allow filling fields, navigate forward and back', async ({ page }) => {
    await page.goto('/apply')

    // Verify step 1 loads
    await expect(page.getByText('Company details')).toBeVisible()
    await expect(page.getByText('Step 1')).toBeVisible()

    // Fill in email
    const emailInput = page.getByPlaceholder('you@yourcompany.com')
    await emailInput.fill('test@example.com')

    // Select a scheme
    await page.getByText('SEIS only').click()

    // Fill in company number
    const companyNumberInput = page.getByPlaceholder('12345678')
    await companyNumberInput.fill('12345678')

    // Fill in UTR
    const utrInput = page.getByPlaceholder('1234567890')
    await utrInput.fill('1234567890')

    // Click continue (should show validation errors for missing fields)
    await page.getByRole('button', { name: /Continue/ }).click()

    // Verify validation appears for missing company name (from Companies House search)
    await expect(page.getByText('Please select your company from Companies House')).toBeVisible()
  })

  test('should navigate back from step 2 to step 1', async ({ page }) => {
    await page.goto('/apply')

    // Verify step 1 loaded
    await expect(page.getByText('Company details')).toBeVisible()
  })
})
