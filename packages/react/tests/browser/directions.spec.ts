import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, storyUrl } from './support/stories.js'

/**
 * The direction axis, asserted at its seam.
 *
 * A direction is registered because its stylesheet exists — `directionNames()`
 * reads the directory, and the preview discovers the same files through
 * `import.meta.glob`. Both derive from one directory, so they cannot disagree
 * about which directions exist; this file proves the attribute actually reaches
 * the DOM, which is the part a glob cannot guarantee.
 */
test('every registered direction reaches the story wrapper', async ({ page }) => {
  for (const direction of DIRECTIONS) {
    await page.goto(storyUrl('components-button--default', 'light', direction))
    await page.locator('.lat-story').waitFor()

    const applied = await page
      .locator('.lat-story')
      .evaluate((el) => el.getAttribute('data-lat-direction'))

    expect(applied, direction).toBe(direction)
  }
})

test('the theme axis still works alongside the direction axis', async ({ page }) => {
  for (const theme of THEMES) {
    await page.goto(storyUrl('components-button--default', theme, 'none'))
    await page.locator('.lat-story').waitFor()

    const applied = await page
      .locator('.lat-story')
      .evaluate((el) => el.getAttribute('data-lat-theme'))

    expect(applied, theme).toBe(theme)
  }
})

test('`none` is always registered, so the shipped system stays the control', () => {
  expect(DIRECTIONS[0]).toBe('none')
})
