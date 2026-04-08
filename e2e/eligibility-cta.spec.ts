import { test, expect } from '@playwright/test'

// Tests for the eligibility → apply CTA introduced in commits 00f114d
// (CTA replaced waitlist email capture) and 1812acd (scheme passthrough
// via /apply?scheme=...).
test.describe('Eligibility → apply CTA', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('SEIS pass shows "Start your application" CTA linking to /apply?scheme=seis', async ({ page }) => {
    await page.goto('/eligibility')

    // Walk through the SEIS path with passing answers (mirrors eligibility-seis-pass.spec.ts).
    await page.getByText('SEIS only').click()
    // 13 binary answers in sequence — see eligibility-seis-pass for full breakdown.
    await page.getByRole('button', { name: 'Yes' }).click()  // UK incorporated
    await page.getByRole('button', { name: 'Yes' }).click()  // Unquoted
    await page.getByRole('button', { name: 'Yes' }).click()  // Independent
    await page.getByRole('button', { name: 'Yes' }).click()  // Qualifying trade
    await page.getByRole('button', { name: 'Yes' }).click()  // <3 yrs trading
    await page.getByRole('button', { name: 'Yes' }).click()  // <25 employees
    await page.getByRole('button', { name: 'Yes' }).click()  // <£350k assets
    await page.getByRole('button', { name: 'Yes' }).click()  // <£250k raise
    await page.getByRole('button', { name: 'No' }).click()   // No prior EIS before trade
    await page.getByRole('button', { name: 'Yes' }).click()  // Money for qualifying activity
    await page.getByRole('button', { name: 'No' }).click()   // No previous VCS
    await page.getByRole('button', { name: 'No' }).click()   // Not KIC
    await page.getByRole('button', { name: 'No' }).click()   // No non-UK ops

    // Qualified screen.
    await expect(page.getByText('You look eligible')).toBeVisible()

    // The CTA button should be a link to /apply with the scheme query param.
    const cta = page.getByRole('link', { name: /Start your application/ })
    await expect(cta).toBeVisible()
    const href = await cta.getAttribute('href')
    expect(href).toBe('/apply?scheme=seis')
  })

  test('clicking the CTA navigates and the scheme param survives the auth redirect', async ({ page }) => {
    // Same path as above, then click the CTA.
    await page.goto('/eligibility')
    await page.getByText('SEIS only').click()
    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: 'Yes' }).click()
    }
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'No' }).click()

    await expect(page.getByText('You look eligible')).toBeVisible()
    await page.getByRole('link', { name: /Start your application/ }).click()

    // No session → middleware redirects /apply?scheme=seis to /login,
    // and the redirect preserves the search params (request.nextUrl.clone()).
    // So the final URL should be /login?scheme=seis.
    await page.waitForURL(/\/login/)
    const finalUrl = new URL(page.url())
    expect(finalUrl.pathname).toBe('/login')
    expect(finalUrl.searchParams.get('scheme')).toBe('seis')
  })

  test('the qualified screen no longer shows the waitlist email capture', async ({ page }) => {
    // After commit 00f114d the EmailCapture / "Get early access" block was
    // removed from the qualified screen. Verify it's gone — we shouldn't
    // see "Get early access" or "Notify me" anywhere on this screen.
    await page.goto('/eligibility')
    await page.getByText('SEIS only').click()
    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: 'Yes' }).click()
    }
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'No' }).click()

    await expect(page.getByText('You look eligible')).toBeVisible()
    await expect(page.getByText('Get early access')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Notify me' })).not.toBeVisible()
  })
})
