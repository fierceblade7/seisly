import { test, expect } from '@playwright/test'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password'

test.describe('Admin dashboard access', () => {
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

    // Verify the toast error appears
    await expect(page.getByText('Invalid password')).toBeVisible()

    // Verify we are still on the login screen
    await expect(page.getByPlaceholder('Admin password')).toBeVisible()
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
