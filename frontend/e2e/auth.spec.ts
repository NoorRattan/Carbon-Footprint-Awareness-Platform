import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('login page renders sign-in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('login page has email and password inputs', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('login page has Google sign-in button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('unauthenticated user is redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user is redirected from /profile to /login', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
  })
})
