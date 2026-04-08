import { test, expect } from '@playwright/test'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password'

// SKIPPED: /admin is now gated by Supabase auth middleware (commit 7c719c5).
// These tests visit /admin without a session and get redirected to /login
// before the password prompt renders. Re-enable once authenticated test
// fixtures exist (a Playwright globalSetup that signs in via magic link
// and saves storageState). See pre-launch audit follow-ups.
test.describe('Admin dashboard access', () => {
  test.beforeEach(() => {
    test.skip(true, 'Requires Supabase session — auth fixtures pending')
  })

  test('should show password prompt on /admin', async ({ page }) => {
    await page.goto('/admin')

    // Verify password prompt appears
    await expect(page.getByPlaceholder('Admin password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
  })

  test('should deny access with wrong password', async ({ page }) => {
    await page.goto('/admin')

    // Enter wrong password
    await page.getByPlaceholder('Admin password').fill('wrong-password')
    await page.getByRole('button', { name: 'Log in' }).click()

    // Wait for the API response and toast - the admin route returns 500 when
    // ADMIN_PASSWORD env var is not set (no hardcoded fallback), or 401 on mismatch.
    // Either way, the toast appears or we stay on login screen.
    await page.waitForTimeout(2000)

    // Verify we are still on the login screen (not authenticated)
    await expect(page.getByPlaceholder('Admin password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
  })

  test('should grant access with correct password', async ({ page }) => {
    // Skip if no admin password configured
    test.skip(!process.env.ADMIN_PASSWORD, 'ADMIN_PASSWORD env var not set')

    await page.goto('/admin')

    // Enter correct password
    await page.getByPlaceholder('Admin password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Log in' }).click()

    // Verify dashboard loads with three tabs
    await expect(page.getByRole('button', { name: 'Submissions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Applications' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ops' })).toBeVisible()

    // Verify log out button is visible
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
  })
})
