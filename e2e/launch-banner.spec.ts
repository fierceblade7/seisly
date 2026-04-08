import { test, expect } from '@playwright/test'

// Tests for the launch banner after the LAUNCH50 code was removed and
// replaced with a LinkedIn-gated CTA (commits ab95c89, 8726af4, ea5f0d0).
test.describe('Launch banner', () => {
  // Clean storage state so the banner is not pre-dismissed by an earlier test.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('renders with launch offer copy on the home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Launch offer:')).toBeVisible()
    await expect(page.getByText(/£50 off any application/)).toBeVisible()
    await expect(page.getByText('Offer ends Monday 14 April.')).toBeVisible()
  })

  test('does not leak the LAUNCH50 code anywhere in the banner', async ({ page }) => {
    await page.goto('/')
    // The literal code must not be visible. We removed it from the banner;
    // the customer is directed to LinkedIn instead.
    await expect(page.getByText('LAUNCH50')).not.toBeVisible()
  })

  test('contains a clickable link to the LinkedIn post', async ({ page }) => {
    await page.goto('/')
    // The link text is "here" (per the 8726af4 update).
    const linkedinLink = page.getByRole('link', { name: 'here' })
    await expect(linkedinLink).toBeVisible()
    const href = await linkedinLink.getAttribute('href')
    expect(href).toMatch(/^https:\/\/www\.linkedin\.com\/posts\//)
    expect(await linkedinLink.getAttribute('target')).toBe('_blank')
    expect(await linkedinLink.getAttribute('rel')).toContain('noopener')
  })

  test('can be dismissed with the close button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Launch offer:')).toBeVisible()

    // Click the dismiss button (× character, aria-labelled).
    await page.getByRole('button', { name: 'Dismiss banner' }).click()

    // Banner should disappear immediately.
    await expect(page.getByText('Launch offer:')).not.toBeVisible()
  })

  test('stays dismissed after page reload via localStorage', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Dismiss banner' }).click()
    await expect(page.getByText('Launch offer:')).not.toBeVisible()

    // Reload — dismissal should persist via localStorage.
    await page.reload()
    await expect(page.getByText('Launch offer:')).not.toBeVisible()
  })

  test('uses the v2 dismissal key (existing v1 dismissals do not apply)', async ({ page }) => {
    // Pre-set the OLD v1 key as if the user dismissed the previous banner.
    // After commit ea5f0d0, the banner reads from "_v2" so the old key
    // should NOT prevent the new banner from showing.
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('seisly_launch_banner_dismissed', 'true')
    })
    await page.reload()
    // Banner should still appear because the v2 key has not been set.
    await expect(page.getByText('Launch offer:')).toBeVisible()
  })
})
