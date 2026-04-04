import { test, expect } from '@playwright/test'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

test.describe('Admin dashboard - full coverage', () => {
  test.skip(!ADMIN_PASSWORD, 'ADMIN_PASSWORD env var not set')

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.getByPlaceholder('Admin password').fill(ADMIN_PASSWORD!)
    await page.getByRole('button', { name: 'Log in' }).click()
    // Wait for dashboard to load
    await expect(page.getByRole('button', { name: 'Submissions' })).toBeVisible()
  })

  test('should show three tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Submissions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Applications' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ops' })).toBeVisible()
  })

  test('Applications tab should load with table headers', async ({ page }) => {
    await page.getByRole('button', { name: 'Applications' }).click()
    await expect(page.getByText('All Applications')).toBeVisible()
    await expect(page.getByText('Company', { exact: false })).toBeVisible()
  })

  test('Ops tab should show system status cards', async ({ page }) => {
    await page.getByRole('button', { name: 'Ops' }).click()
    await expect(page.getByText('Supabase')).toBeVisible()
    await expect(page.getByText('Anthropic')).toBeVisible()
    await expect(page.getByText('Stripe')).toBeVisible()
    await expect(page.getByText('Resend')).toBeVisible()
    await expect(page.getByText('Voyage AI')).toBeVisible()
  })

  test('Ops tab should show metrics', async ({ page }) => {
    await page.getByRole('button', { name: 'Ops' }).click()
    await expect(page.getByText('Total applications')).toBeVisible()
    await expect(page.getByText('Last 7 days')).toBeVisible()
    await expect(page.getByText('Last 30 days')).toBeVisible()
    await expect(page.getByText('Waitlist signups')).toBeVisible()
  })

  test('Ops tab should show knowledge base section', async ({ page }) => {
    await page.getByRole('button', { name: 'Ops' }).click()
    await expect(page.getByText('Knowledge base')).toBeVisible()
    await expect(page.getByText('Total chunks')).toBeVisible()
    await expect(page.getByText('Sources')).toBeVisible()
  })

  test('Submissions tab should show count', async ({ page }) => {
    await expect(page.getByText('awaiting HMRC submission')).toBeVisible()
  })
})
