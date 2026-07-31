/// <reference lib="dom" />

import { expect, test } from '@playwright/test'

import { emitCss } from '../../generate/emit.js'
import { buildAllScales } from '../../generate/scale.js'

const emittedCss = emitCss(buildAllScales())

const documentWith = (level: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
${emittedCss}
      #subject {
        background: var(--lat-elevation-${level}-surface);
        border: 1px solid var(--lat-elevation-${level}-border);
        box-shadow: var(--lat-elevation-${level}-shadow);
        padding: 1rem;
      }
    </style>
  </head>
  <body><div id="subject">Elevated</div></body>
</html>`

const readSubject = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const style = getComputedStyle(document.getElementById('subject')!)

    return {
      forced: matchMedia('(forced-colors: active)').matches,
      shadow: style.boxShadow,
      borderStyle: style.borderTopStyle,
      borderWidth: style.borderTopWidth,
      borderColor: style.borderTopColor,
      background: style.backgroundColor
    }
  })

// The whole reason elevation ships three signals. The user agent strips the
// shadow and flattens the surface to the system canvas; if the border did not
// survive, an elevated surface would be indistinguishable from the page.
test('the border survives forced-colors after the shadow is stripped', async ({ page }) => {
  await page.setContent(documentWith('overlay'))

  const before = await readSubject(page)

  expect(before.forced).toBe(false)
  expect(before.shadow).not.toBe('none')

  await page.emulateMedia({ forcedColors: 'active' })
  const after = await readSubject(page)

  expect(after.forced).toBe(true)
  expect(after.shadow).toBe('none')
  expect(after.borderStyle).toBe('solid')
  expect(after.borderWidth).toBe('1px')
  expect(after.borderColor).not.toBe(before.borderColor)
  // The third signal: forced-colors flattens the surface to the system canvas,
  // so the composited background changes too, not just the border and shadow.
  expect(after.background).not.toBe(before.background)
})

// Elevation must never be carried by the shadow alone, in either direction.
test('every level above flat still declares a border and a shadow', async ({ page }) => {
  for (const level of ['raised', 'overlay', 'modal']) {
    await page.setContent(documentWith(level))
    const seen = await readSubject(page)

    expect(seen.shadow, level).not.toBe('none')
    expect(seen.borderWidth, level).toBe('1px')
    expect(seen.borderStyle, level).toBe('solid')
    // The surface signal: a level with a shadow and a border still needs an
    // actual background, not the initial transparent value.
    expect(seen.background, level).not.toBe('rgba(0, 0, 0, 0)')
  }
})
