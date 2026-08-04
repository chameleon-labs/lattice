/**
 * @vitest-environment node
 *
 * Assembles the stylesheet from source, the same way stylesheet.test.ts does
 * and for the same reason: reading dist/ passes locally and fails from a
 * clean tree (CI runs `test` before `build`), and this must not run under
 * jsdom, where the global URL resolves relative imports against the
 * document's base instead of import.meta.url.
 *
 * Eyebrow's entire reason for existing is that the 0.2em tracking value has
 * exactly one home. `stylesheet.test.ts`'s "references only tokens the token
 * package declares" would pass just as well if `.lat-eyebrow__text` read a raw
 * `--lat-letter-spacing-*` primitive instead of `--lat-text-eyebrow-letter-
 * spacing` — both are declared tokens — so nothing else in the suite would
 * catch that substitution. It would still *look* right (the eyebrow role's
 * primitive and the value used elsewhere for tracking happen to agree today),
 * which is exactly the kind of drift a value repeated across stylesheets
 * invites.
 */
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { assembleCss } from '../scripts/assemble-css.js'

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)))

// Scoped to the exact selector — matched whole, not as a substring, so the
// `[data-tone='accent'] .lat-eyebrow__text` compound (which contains this
// string too) doesn't also match here. Comments are stripped first so a
// block comment sitting between the previous rule's `}` and this selector
// doesn't get swept into the "selector" capture. Requiring exactly one hit
// guards against a duplicated block silently shadowing a broken one.
function selectorBlock(source: string, selector: string): string {
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const matches = [...stripped.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(
    (match) => (match[1] ?? '').trim() === selector
  )
  expect(matches).toHaveLength(1)
  return matches[0]?.[2] ?? ''
}

function eyebrowTextBlock(source: string): string {
  return selectorBlock(source, '.lat-eyebrow__text')
}

describe("Eyebrow's stylesheet", () => {
  it('reads its tracking from the eyebrow role, not a raw letter-spacing primitive', () => {
    const rule = eyebrowTextBlock(css)

    expect(rule).toContain('letter-spacing: var(--lat-text-eyebrow-letter-spacing);')
    expect(rule).not.toMatch(/letter-spacing:\s*var\(--lat-letter-spacing-/)
  })

  // The landing page's `SectionEyebrow` (lime, `text-primary`) and the docs
  // page's `SectionLabel` (`text-muted-foreground`) are the same construction
  // in two colours in the source bundle. `tone` is what tells them apart, so
  // this pins which token each side reads — the default block covers the
  // untagged `.lat-eyebrow__text` rule above, and the accent block covers the
  // `[data-tone='accent']` override, so a future edit that pointed either one
  // at the wrong token, or collapsed them into a single colour, fails here.
  it("default tone reads --lat-text-subtle", () => {
    const rule = eyebrowTextBlock(css)

    expect(rule).toContain('color: var(--lat-text-subtle);')
  })

  it("tone='accent' reads --lat-solid", () => {
    const rule = selectorBlock(css, ".lat-eyebrow[data-tone='accent'] .lat-eyebrow__text")

    expect(rule).toContain('color: var(--lat-solid);')
    expect(rule).not.toContain('--lat-text-subtle')
  })
})
