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

test.describe('instrument', () => {
  test('borders do the elevation work — a raised surface casts no shadow', async ({ page }) => {
    await page.goto(storyUrl('components-card--default', 'light', 'instrument'))
    await page.locator('.lat-card').waitFor()

    const shadow = await page.locator('.lat-card').evaluate((el) => getComputedStyle(el).boxShadow)

    // The #30 calibration measured a shadow at 1.016:1 on dark — nothing.
    // Instrument makes dark mode's measured truth the rule in both modes.
    expect(shadow).toBe('none')
  })

  test('corners are the tight radius', async ({ page }) => {
    await page.goto(storyUrl('components-button--default', 'light', 'instrument'))
    await page.locator('.lat-button').waitFor()

    const radius = await page
      .locator('.lat-button')
      .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)

    // The shipped button reads --lat-radius-md, which Instrument retunes to
    // 0.25rem — 4px at the 16px root, 5px at the 20px root this suite also runs.
    expect(parseFloat(radius)).toBeLessThanOrEqual(5)
  })

  test('numerals are tabular where numbers are compared down a column', async ({ page }) => {
    await page.goto(storyUrl('components-specimen--dashboard', 'light', 'instrument'))
    await page.locator('.lat-table').waitFor()

    const variant = await page
      .locator('.lat-table td')
      .first()
      .evaluate((el) => getComputedStyle(el).fontVariantNumeric)

    expect(variant).toContain('tabular-nums')
  })

  /**
   * Read out of the cascade rather than off the resting element.
   *
   * The shipped button only puts `transform` on its transition list inside
   * `:active`, so a resting button reports no transform whatever the direction
   * does — an assertion against `getComputedStyle` here passes identically with
   * and without the stylesheet, which is no assertion at all.
   *
   * So this walks the stylesheets for the rule that actually governs the press
   * and reads its declared value, the same way the static CSS contract does.
   */
  test('press feedback carries no transform', async ({ page }) => {
    await page.goto(storyUrl('components-button--default', 'light', 'instrument'))
    await page.locator('.lat-button').waitFor()

    const pressTransforms = await page.evaluate(() => {
      const found: string[] = []

      const walk = (rules: CSSRuleList) => {
        for (const rule of rules) {
          if (rule instanceof CSSMediaRule) walk(rule.cssRules)
          if (!(rule instanceof CSSStyleRule)) continue
          // Quote-agnostic: Firefox re-serialises attribute selectors with
          // double quotes, so matching the authored single-quoted form finds
          // nothing and the assertion below passes vacuously.
          if (!rule.selectorText.includes('data-lat-direction')) continue
          if (!rule.selectorText.includes('instrument')) continue
          if (!rule.selectorText.includes(':active')) continue
          found.push(rule.style.transform)
        }
      }

      for (const sheet of document.styleSheets) {
        try {
          walk(sheet.cssRules)
        } catch {
          // A cross-origin sheet cannot be read. None of ours are.
        }
      }

      return found
    })

    // The rule exists — otherwise this passes by finding nothing.
    expect(pressTransforms.length).toBeGreaterThan(0)
    expect(pressTransforms.every((value) => value === 'none')).toBe(true)
  })
})
