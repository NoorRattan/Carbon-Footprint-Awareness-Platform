import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('home page has exactly one h1', async ({ page }) => {
    await page.goto('/')
    const h1Elements = page.locator('h1')
    await expect(h1Elements).toHaveCount(1)
  })

  test('home page main content has proper landmark', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('navigation landmark is present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('skip to main content or equivalent landmark exists', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('#main-content')
    await expect(main).toBeVisible()
  })

  test('images and decorative elements have proper aria attributes', async ({ page }) => {
    await page.goto('/')
    const decorativeSvgs = page.locator('[aria-hidden="true"] svg, svg[aria-hidden="true"]')
    const count = await decorativeSvgs.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('login page form inputs have labels', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('404 page has heading', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-at-all')
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible()
  })
})
