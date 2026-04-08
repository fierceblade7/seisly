import { test, expect } from '@playwright/test'

// Tests for the edge auth middleware added in commit 7c719c5.
// All protected routes should redirect unauthenticated visitors to /login.
// These tests do NOT need a Supabase session — they verify the redirect
// behaviour itself, which is what protects the routes.
test.describe('Middleware auth gate', () => {
  // Start each test with a clean storage state so we know there's no session.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('unauthenticated visit to /apply redirects to /login', async ({ page }) => {
    await page.goto('/apply')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated visit to /apply/upload redirects to /login', async ({ page }) => {
    await page.goto('/apply/upload')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated visit to /apply/review redirects to /login', async ({ page }) => {
    await page.goto('/apply/review')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated visit to /apply/success redirects to /login', async ({ page }) => {
    await page.goto('/apply/success')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated visit to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated visit to /admin redirects to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated visit to /apply with scheme query param redirects to /login', async ({ page }) => {
    // Verifies the middleware doesn't 500 on URL params; the redirect should
    // still fire cleanly when the apply URL carries scheme/step query strings.
    await page.goto('/apply?scheme=seis')
    await expect(page).toHaveURL(/\/login/)
  })

  test('public routes remain accessible without auth', async ({ page }) => {
    // Sanity check that the middleware matcher isn't accidentally over-broad.
    // Each of these should return 200 and the URL pathname should still
    // match what we navigated to (no redirect happened).
    for (const path of ['/', '/eligibility', '/login', '/about', '/privacy']) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      const url = new URL(page.url())
      expect(url.pathname).toBe(path)
    }
  })
})
