import { test, expect } from '@playwright/test'

test.describe('Log Activity (unauthenticated)', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/log')
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders properly after redirect', async ({ page }) => {
    await page.goto('/log')
    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })
})
