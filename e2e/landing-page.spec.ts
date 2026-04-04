import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should load with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Seisly/)
  })

  test('should have CTA button linking to eligibility', async ({ page }) => {
    await page.goto('/')
    const ctaButton = page.getByRole('button', { name: /Start free/i })
    await expect(ctaButton).toBeVisible()
  })

  test('should show pricing section with correct prices', async ({ page }) => {
    await page.goto('/')
    // Check the three pricing cards exist
    await expect(page.getByText('SEIS only').first()).toBeVisible()
    await expect(page.getByText('SEIS and EIS').first()).toBeVisible()
    await expect(page.getByText('EIS only').first()).toBeVisible()
  })

  test('should not show + VAT next to Seisly prices in pricing cards', async ({ page }) => {
    await page.goto('/')
    // The pricing cards should say "One-time payment." not "+ VAT"
    const pricingCards = page.locator('text=One-time payment.')
    await expect(pricingCards.first()).toBeVisible()
  })

  test('should show comparison table', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('The honest comparison')).toBeVisible()
    await expect(page.getByText('Seisly vs everyone else')).toBeVisible()
  })

  test('should show FAQ section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Questions we get asked')).toBeVisible()
  })

  test('should show footer with legal links', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Terms' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Cookies' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Acceptable use' })).toBeVisible()
  })

  test('should show cookie banner on first visit', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('We use essential cookies')).toBeVisible()
  })

  test('should show Sign in link in nav', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })
})
