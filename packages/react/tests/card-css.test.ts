/**
 * @vitest-environment node
 *
 * Assembled from source rather than read from dist/ — see stylesheet.test.ts.
 *
 * This file exists because nothing else would catch `.lat-card` reading
 * `--lat-bg` (the page background) instead of `--lat-bg-raised` (a raised
 * surface) — both are tokens the token package declares, so
 * `stylesheet.test.ts`'s "references only tokens the token package declares"
 * passes either way, and no unit test in card.test.tsx evaluates CSS at all.
 * The two tokens are close enough in name and role that the swap would look
 * plausible in review and be wrong: a card would sit at the same elevation as
 * the page behind it. Likewise for `.lat-card__header`'s `border-bottom` —
 * the hairline that survives forced-colors — which no DOM-level test can see.
 */
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { assembleCss } from '../scripts/assemble-css.js'

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)))

function block(selector: string): string {
  const pattern = new RegExp(`${selector.replace(/[.[\]']/g, '\\$&')}\\s*\\{([^}]*)\\}`)
  const match = pattern.exec(css)
  if (match === null) {
    throw new Error(`no ${selector} block found in the assembled stylesheet`)
  }
  return match[1] ?? ''
}

describe("Card's stylesheet", () => {
  it('reads a raised surface, not the page background', () => {
    const rule = block('.lat-card')

    expect(rule).toContain('background: var(--lat-bg-raised);')
    expect(rule).not.toContain('var(--lat-bg)')
  })

  it('gives the header a real border-bottom, the edge that survives forced-colors', () => {
    const rule = block('.lat-card__header')

    expect(rule).toMatch(/border-bottom:\s*1px solid var\(--lat-border\);/)
  })
})
