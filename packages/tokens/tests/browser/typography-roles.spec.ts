/// <reference lib="dom" />

import { expect, test } from '@playwright/test'

import { FONT_SIZES } from '../../config/typography.js'
import {
  NARROW_HEADING_SIZES,
  TYPOGRAPHY_BREAKPOINT_REM,
  TYPOGRAPHY_ROLES
} from '../../config/typography-roles.js'
import { emitCss } from '../../generate/emit.js'

const emittedCss = emitCss()
const applicationCss = Object.keys(TYPOGRAPHY_ROLES)
  .map(
    (role) => `[data-role="${role}"] {
  font-family: var(--lat-text-${role}-font-family);
  font-size: var(--lat-text-${role}-font-size);
  font-weight: var(--lat-text-${role}-font-weight);
  letter-spacing: var(--lat-text-${role}-letter-spacing);
  line-height: var(--lat-text-${role}-line-height);
}`
  )
  .join('\n')

const documentWith = (body: string, extraCss = ''): string => `<!doctype html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
${emittedCss}
${applicationCss}
${extraCss}
    </style>
  </head>
  <body>${body}</body>
</html>`

// The roles NARROW_HEADING_SIZES steps down — display, h1, h2, h3 as of
// Task 6's Meridian specimen. `display` is the one worth the closest look: it
// is the largest step (5xl -> 3xl) and the only role Meridian's own hero
// renders responsively (`text-5xl md:text-6xl`).
const RESPONSIVE_ROLES = Object.keys(NARROW_HEADING_SIZES) as (keyof typeof NARROW_HEADING_SIZES)[]

test('the breakpoint follows the user default font size', async ({ page }) => {
  await page.setContent(
    documentWith(
      RESPONSIVE_ROLES.map((role) => `<div data-role="${role}">${role}</div>`).join('')
    )
  )

  // The two Firefox projects carry a 16px and a 20px user default root font
  // size (playwright.config.ts). The breakpoint is expressed in rem, so which
  // side of it a fixed-pixel viewport (700px) lands on depends on the root
  // size, not on the viewport alone — this reads the actual root back rather
  // than assuming which project is which.
  const root = Number.parseFloat(
    await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)
  )
  const viewportWidth = page.viewportSize()?.width ?? 0
  const narrow = viewportWidth < TYPOGRAPHY_BREAKPOINT_REM * root

  expect(
    await page.evaluate(
      (breakpoint) => matchMedia(`(width < ${breakpoint}rem)`).matches,
      TYPOGRAPHY_BREAKPOINT_REM
    )
  ).toBe(narrow)

  for (const role of RESPONSIVE_ROLES) {
    // Below the breakpoint every role in NARROW_HEADING_SIZES steps down to
    // its narrow size; at or above it, the role renders at the full size its
    // own entry in TYPOGRAPHY_ROLES declares. Deriving both from the config
    // rather than hardcoding pixels means a future change to either scale
    // flows through instead of silently drifting out of sync with the test.
    const sizeKey = narrow ? NARROW_HEADING_SIZES[role] : TYPOGRAPHY_ROLES[role].fontSize
    const expectedPx = `${FONT_SIZES[sizeKey] * root}px`

    await expect(page.locator(`[data-role="${role}"]`)).toHaveCSS('font-size', expectedPx)
  }
})

test('all semantic roles reflow without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })

  const examples = Object.keys(TYPOGRAPHY_ROLES)
    .map(
      (role) =>
        `<div data-role="${role}">The Lattice typography system keeps readable content wrapping within a narrow viewport.</div>`
    )
    .join('')

  await page.setContent(
    documentWith(
      examples,
      `html { font-size: 24px; }
body { margin: 0; }
[data-role] { max-width: 100%; }`
    )
  )

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
})
