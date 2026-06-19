import { test, expect } from '@playwright/test'

test.describe('Dashboard (unauthenticated)', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page has accessible form elements', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('navigation contains dashboard link', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
  })
})
