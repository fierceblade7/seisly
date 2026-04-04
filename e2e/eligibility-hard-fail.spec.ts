import { test, expect } from '@playwright/test'

test.describe('Eligibility checker - hard fail', () => {
  test('should show hard disqualification for non-UK company without permanent establishment', async ({ page }) => {
    await page.goto('/eligibility')

    // Select SEIS
    await page.getByText('SEIS only').click()

    // Q1: UK incorporated? -> No (triggers follow-up)
    await page.getByRole('button', { name: 'No' }).click()

    // Follow-up: Permanent establishment in UK? -> No (hard disqualification)
    await page.getByRole('button', { name: 'No' }).click()

    // Verify the hard disqualification screen
    await expect(page.getByText('You may not qualify')).toBeVisible()
    await expect(page.getByText('permanent establishment')).toBeVisible()
  })
})
