import { test, expect } from '@playwright/test'

test.describe('Eligibility checker - SEIS pass', () => {
  test('should pass SEIS eligibility with all correct answers', async ({ page }) => {
    await page.goto('/eligibility')

    // Step 1: Select SEIS
    await page.getByText('SEIS only').click()

    // Answer all questions with the passing answer
    // The passing answer is always the one that does NOT trigger disqualifyOn
    // For most questions, "Yes" is the passing answer

    // Q1: UK incorporated? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q2: Unquoted? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q3: Independent/not controlled? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q4: Qualifying trade? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q5: Trading less than 3 years? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q6: Fewer than 25 employees? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q7: Gross assets less than £350k? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q8: Raising £250k or less? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q9: Prior EIS/VCT before trade? -> No (passing answer, since disqualifyOn is "yes")
    await page.getByRole('button', { name: 'No' }).click()

    // Q10: Money used for qualifying activity? -> Yes
    await page.getByRole('button', { name: 'Yes' }).click()

    // Q11: Previous VCS investment? -> No (data question, no disqualification)
    await page.getByRole('button', { name: 'No' }).click()

    // Q12: KIC? -> No (complexity question)
    await page.getByRole('button', { name: 'No' }).click()

    // Q13: Non-UK operations? -> No (complexity question)
    await page.getByRole('button', { name: 'No' }).click()

    // Verify the success screen
    await expect(page.getByText('You look eligible')).toBeVisible()
    await expect(page.getByText('SEIS')).toBeVisible()
  })
})
