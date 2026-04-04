import { test, expect } from '@playwright/test'

test.describe('Eligibility - EIS only full pass', () => {
  test('should pass EIS eligibility', async ({ page }) => {
    await page.goto('/eligibility')
    await page.getByRole('button', { name: /^EIS only/ }).click()

    // Shared: UK incorporated, unquoted, independent, qualifying trade
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()

    // EIS: age < 7 years, employees < 250, assets < £15m, raising < £5m
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()

    // Money use
    await page.getByRole('button', { name: 'Yes' }).click()

    // Data + complexity: previous VCS no, KIC no, non-UK ops no
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'No' }).click()

    await expect(page.getByText('You look eligible')).toBeVisible()
    await expect(page.getByText('for EIS.')).toBeVisible()
  })
})

test.describe('Eligibility - Non-UK with permanent establishment', () => {
  test('should continue when company has permanent establishment', async ({ page }) => {
    await page.goto('/eligibility')
    await page.getByText('SEIS only').click()

    // Not UK incorporated
    await page.getByRole('button', { name: 'No' }).click()

    // Has permanent establishment -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Should continue to next question (unquoted)
    await expect(page.getByText('unquoted')).toBeVisible()
  })

  test('should hard fail when no permanent establishment', async ({ page }) => {
    await page.goto('/eligibility')
    await page.getByText('SEIS only').click()

    await page.getByRole('button', { name: 'No' }).click() // Not UK incorporated
    await page.getByRole('button', { name: 'No' }).click() // No permanent establishment

    await expect(page.getByText('You may not qualify')).toBeVisible()
    await expect(page.getByText('permanent establishment')).toBeVisible()
  })
})

test.describe('Eligibility - Group/subsidiary', () => {
  test('should continue when qualifying subsidiary', async ({ page }) => {
    await page.goto('/eligibility')
    await page.getByText('SEIS only').click()

    await page.getByRole('button', { name: 'Yes' }).click() // UK incorporated
    await page.getByRole('button', { name: 'Yes' }).click() // Unquoted

    // Not independent (controlled)
    await page.getByRole('button', { name: 'No' }).click()

    // Qualifying subsidiary -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Should continue to qualifying trade
    await expect(page.getByText('qualifying trade')).toBeVisible()
  })

  test('should hard fail when not qualifying subsidiary', async ({ page }) => {
    await page.goto('/eligibility')
    await page.getByText('SEIS only').click()

    await page.getByRole('button', { name: 'Yes' }).click() // UK incorporated
    await page.getByRole('button', { name: 'Yes' }).click() // Unquoted
    await page.getByRole('button', { name: 'No' }).click()  // Not independent
    await page.getByRole('button', { name: 'No' }).click()  // Not qualifying subsidiary

    await expect(page.getByText('You may not qualify')).toBeVisible()
    await expect(page.getByText('non-qualifying company')).toBeVisible()
  })
})

test.describe('Eligibility - SEIS amount interstitial', () => {
  test('should show interstitial when raising more than £250k on SEIS-only', async ({ page }) => {
    await page.goto('/eligibility')
    await page.getByText('SEIS only').click()

    // Pass through to seis_amount
    for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Yes' }).click()

    // Raising > £250k -> No
    await page.getByRole('button', { name: 'No' }).click()

    // Verify interstitial
    await expect(page.getByText('Only the first £250,000')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with SEIS and EIS' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Go back' })).toBeVisible()
  })
})

test.describe('Eligibility - Soft disqualifiers on combined track', () => {
  const sharedSetup = async (page: import('@playwright/test').Page) => {
    await page.goto('/eligibility')
    await page.getByText('SEIS and EIS').click()
    // Pass shared: UK inc, unquoted, independent, qualifying trade
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
  }

  test('seis_age soft fail triggers EIS transition', async ({ page }) => {
    await sharedSetup(page)
    // Trading > 3 years -> No
    await page.getByRole('button', { name: 'No' }).click()
    await expect(page.getByText('you may still qualify for EIS')).toBeVisible()
  })

  test('seis_employees soft fail triggers EIS transition', async ({ page }) => {
    await sharedSetup(page)
    await page.getByRole('button', { name: 'Yes' }).click() // seis_age pass
    // 25+ employees -> No
    await page.getByRole('button', { name: 'No' }).click()
    await expect(page.getByText('you may still qualify for EIS')).toBeVisible()
  })

  test('seis_assets soft fail triggers EIS transition', async ({ page }) => {
    await sharedSetup(page)
    await page.getByRole('button', { name: 'Yes' }).click() // seis_age pass
    await page.getByRole('button', { name: 'Yes' }).click() // seis_employees pass
    // Assets > £350k -> No
    await page.getByRole('button', { name: 'No' }).click()
    await expect(page.getByText('you may still qualify for EIS')).toBeVisible()
  })

  test('seis_amount soft fail triggers EIS transition', async ({ page }) => {
    await sharedSetup(page)
    await page.getByRole('button', { name: 'Yes' }).click() // seis_age
    await page.getByRole('button', { name: 'Yes' }).click() // seis_employees
    await page.getByRole('button', { name: 'Yes' }).click() // seis_assets
    // Raising > £250k -> No
    await page.getByRole('button', { name: 'No' }).click()
    await expect(page.getByText('you may still qualify for EIS')).toBeVisible()
  })
})
