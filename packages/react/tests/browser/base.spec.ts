import { expect, test } from '@playwright/test'
import { channelsOf } from './support/colour.js'

test('unclassed prose inside a surface inherits the sans stack', async ({ page }) => {
  await page.goto('/iframe.html?id=components-dialog--open&globals=theme:dark')
  const family = await page
    .locator('.lat-dialog p')
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(family).toContain('Instrument Sans')
  expect(family).not.toContain('Times')
})

test('an unclassed label takes the base size, not its ancestor’s', async ({ page }) => {
  await page.goto('/iframe.html?id=components-button--variants&globals=theme:dark')
  await page.locator('.lat-surface').first().waitFor()

  const sizes = await page.evaluate(() => {
    const surface = document.querySelector('.lat-surface')!
    // A wrapper deliberately sized away from the root. Without the base
    // layer's label rule, the label would inherit this 32px and the
    // assertion below would fail — which is the point: inheritance and the
    // rule disagree here, so only the rule can produce the root size.
    const wrapper = document.createElement('div')
    wrapper.style.fontSize = '32px'
    const label = document.createElement('label')
    label.textContent = 'Token name'
    wrapper.append(label)
    surface.append(wrapper)

    const result = {
      label: getComputedStyle(label).fontSize,
      wrapper: getComputedStyle(wrapper).fontSize,
      root: getComputedStyle(document.documentElement).fontSize
    }
    wrapper.remove()
    return result
  })

  expect(sizes.wrapper).toBe('32px')
  expect(sizes.label).not.toBe('32px')
  // --lat-font-size-base is 1rem, not a literal 16px — this suite runs both a
  // 16px and a 20px root (playwright.config.ts, so every component is checked
  // at a non-default user font size for free), and a hardcoded '16px' would be
  // false on the second project.
  expect(sizes.label).toBe(sizes.root)
})

test('a surface paints the Meridian page colour', async ({ page }) => {
  await page.goto('/iframe.html?id=components-button--variants&globals=theme:dark')
  const { r, g, b } = await channelsOf(page, '.lat-surface')
  // #0c0c14 -> rgb(12, 12, 20). Tolerance absorbs oklch -> sRGB rounding.
  expect(Math.abs(r - 12)).toBeLessThanOrEqual(2)
  expect(Math.abs(g - 12)).toBeLessThanOrEqual(2)
  expect(Math.abs(b - 20)).toBeLessThanOrEqual(2)
})
