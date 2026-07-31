import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark'] as const) {
  test(`no axe violations in ${theme}`, async ({ page }) => {
    await page.goto('/')

    const results = await new AxeBuilder({ page }).include(`#theme-${theme}`).analyze()

    expect(results.violations).toEqual([])
  })
}

test('keyboard focus produces a visible ring', async ({ page }) => {
  await page.goto('/')

  // Drive focus purely by keyboard. A programmatic .focus() does not set the
  // heuristic Firefox uses for :focus-visible, so a test that used one would be
  // measuring the wrong thing — and would keep passing if the ring were removed.
  await page.keyboard.press('Tab')

  const focused = await page.evaluate(() => {
    const el = document.activeElement
    if (el === null) return null
    const style = getComputedStyle(el)
    return {
      className: el.className,
      matchesFocusVisible: el.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth
    }
  })

  expect(focused).not.toBeNull()
  expect(focused?.className).toContain('lat-button')
  expect(focused?.matchesFocusVisible).toBe(true)
  expect(focused?.outlineStyle).not.toBe('none')
  expect(parseFloat(focused?.outlineWidth ?? '0')).toBeGreaterThan(0)
})

// The counterpart — that a pointer press leaves no ring behind — is asserted
// statically, in tests/stylesheet.test.ts, rather than here. Whether a click
// matches :focus-visible is the browser's heuristic; what this system controls
// is that the ring hangs off :focus-visible and never off bare :focus.

test('animates no transform under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const offenders = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((el) => getComputedStyle(el).transitionProperty.includes('transform'))
      .map((el) => el.className)
  )

  expect(offenders).toEqual([])
})

test('borders survive forced-colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto('/')

  const width = await page
    .locator('#theme-light .lat-button')
    .first()
    .evaluate((el) => getComputedStyle(el).borderTopWidth)

  expect(parseFloat(width)).toBeGreaterThan(0)
})
