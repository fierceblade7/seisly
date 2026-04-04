import { test, expect } from '@playwright/test'

test.describe('Eligibility checker - SEIS soft fail to EIS', () => {
  test('should show soft disqualification and allow EIS continuation', async ({ page }) => {
    await page.goto('/eligibility')

    // Select SEIS and EIS combined
    await page.getByText('SEIS and EIS').click()

    // Answer shared questions to pass
    // Q1: UK incorporated? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q2: Unquoted? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q3: Independent? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q4: Qualifying trade? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q5: Trading less than 3 years? -> No (fails SEIS, triggers soft disqualification)
    await page.getByRole('button', { name: 'No' }).click()

    // Verify the inline transition banner appears
    await expect(page.getByText('you may still qualify for EIS')).toBeVisible()

    // Verify the checker continues with the next EIS question
    // Should now be on an EIS-specific question (e.g. EIS age: 7 years)
    await expect(page.getByText('Question')).toBeVisible()
  })
})
