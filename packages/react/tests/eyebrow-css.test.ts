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

// Scoped to the exact selector, not a substring another component's rule
// could also satisfy — .lat-eyebrow__text is unique to this component, and
// requiring exactly one match guards against a duplicated block silently
// shadowing a broken one.
function eyebrowTextBlock(source: string): string {
  const matches = [...source.matchAll(/\.lat-eyebrow__text\s*\{([^}]*)\}/g)]
  expect(matches).toHaveLength(1)
  return matches[0]?.[1] ?? ''
}

describe("Eyebrow's stylesheet", () => {
  it('reads its tracking from the eyebrow role, not a raw letter-spacing primitive', () => {
    const rule = eyebrowTextBlock(css)

    expect(rule).toContain('letter-spacing: var(--lat-text-eyebrow-letter-spacing);')
    expect(rule).not.toMatch(/letter-spacing:\s*var\(--lat-letter-spacing-/)
  })
})
