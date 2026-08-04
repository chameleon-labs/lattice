import { expect, test } from '@playwright/test'

/**
 * Computed colours come back in the space they were authored — our tokens are
 * oklch(), so a browser returns oklch(...), not rgb(...). Asserting either
 * serialization is brittle. Painting the value onto a throwaway element and
 * reading it back through a canvas gives channels, which are what we actually
 * mean.
 */
async function channelsOf(page: import('@playwright/test').Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const colour = getComputedStyle(el).backgroundColor
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = colour
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return { r, g, b }
  })
}

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
  const { r, g, b } = await channelsOf(page, '.lat-surface')
  // #0c0c14 -> rgb(12, 12, 20). Tolerance absorbs oklch -> sRGB rounding.
  expect(Math.abs(r - 12)).toBeLessThanOrEqual(2)
  expect(Math.abs(g - 12)).toBeLessThanOrEqual(2)
  expect(Math.abs(b - 20)).toBeLessThanOrEqual(2)
})
