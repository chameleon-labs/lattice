import { expect, test } from '@playwright/test'

test('unclassed prose inside a surface inherits the sans stack', async ({ page }) => {
  await page.goto('/iframe.html?id=components-dialog--open&globals=theme:dark')
  const family = await page
    .locator('.lat-dialog p')
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(family).toContain('Instrument Sans')
  expect(family).not.toContain('Times')
})

test('a surface paints the Meridian page colour', async ({ page }) => {
  await page.goto('/iframe.html?id=components-button--variants&globals=theme:dark')
  const bg = await page
    .locator('.lat-surface')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor)
  // oklch(0.159 0.0169 284.3) -> #0c0c14
  expect(bg).toBe('rgb(12, 12, 20)')
})
