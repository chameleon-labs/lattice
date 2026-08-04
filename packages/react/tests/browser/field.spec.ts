import { expect, test } from '@playwright/test'

test('the field value is set in mono', async ({ page }) => {
  await page.goto('/iframe.html?id=components-textfield--default&globals=theme:dark')
  const family = await page
    .locator('.lat-input')
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(family).toContain('JetBrains Mono')
})

test('the field label is an uppercase eyebrow', async ({ page }) => {
  await page.goto('/iframe.html?id=components-textfield--default&globals=theme:dark')
  const label = page.locator('.lat-text-field__label').first()
  expect(await label.evaluate((el) => getComputedStyle(el).textTransform)).toBe('uppercase')
  expect(await label.evaluate((el) => getComputedStyle(el).letterSpacing)).not.toBe('normal')
})
