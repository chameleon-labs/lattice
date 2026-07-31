import { expect, test } from '@playwright/test'

test('serves the demo with both stylesheets applied', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Lattice components' })).toBeVisible()

  // Proves the token stylesheet is actually loaded rather than merely imported:
  // an unresolved custom property computes to the empty string.
  const surface = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--lat-bg').trim()
  )

  expect(surface).not.toBe('')
})
