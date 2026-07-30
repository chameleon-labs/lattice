/// <reference lib="dom" />

import { expect, test } from '@playwright/test'

import { TYPOGRAPHY_ROLES } from '../../config/typography-roles.js'
import { emitCss } from '../../generate/emit.js'
import { buildAllScales } from '../../generate/scale.js'

const emittedCss = emitCss(buildAllScales())
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

test('the breakpoint follows the user default font size', async ({ page }, testInfo) => {
  await page.setContent(documentWith('<h1 data-role="heading-1">Heading one</h1>'))

  const expected =
    testInfo.project.name === 'firefox-default-20'
      ? { root: '20px', narrow: true, heading: '37.5px' }
      : { root: '16px', narrow: false, heading: '36px' }

  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize))
    .toBe(expected.root)
  expect(await page.evaluate(() => matchMedia('(width < 40rem)').matches)).toBe(expected.narrow)
  await expect(page.locator('[data-role="heading-1"]')).toHaveCSS('font-size', expected.heading)
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
