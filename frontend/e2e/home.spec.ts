import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('displays hero heading and call-to-action', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Understand and Reduce Your Carbon Footprint'
    )
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible()
  })

  test('how it works section is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#how-it-works')).toBeVisible()
    await expect(page.getByText('Log Your Activities')).toBeVisible()
    await expect(page.getByText('Analyse Your Impact')).toBeVisible()
    await expect(page.getByText('Reduce Your Footprint')).toBeVisible()
  })

  test('navigation bar is rendered', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('footer is rendered', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('footer')).toBeVisible()
  })
})
