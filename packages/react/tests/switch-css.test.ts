/**
 * @vitest-environment node
 *
 * Assembles the stylesheet from source, the same way stylesheet.test.ts does
 * and for the same reason: reading dist/ passes locally and fails from a
 * clean tree (CI runs `test` before `build`), and this must not run under
 * jsdom, where the global URL resolves relative imports against the
 * document's base instead of import.meta.url.
 *
 * `--lat-switch-track` and `--lat-component` (or `--lat-solid` and
 * `--lat-accent-solid`, and so on) are all tokens the token package declares,
 * so `stylesheet.test.ts`'s "references only tokens the token package
 * declares" would pass either way a `.lat-switch` block picked between them —
 * exactly the class of regression `card-css.test.ts` and `input-css.test.ts`
 * guard against for Card and Input. No unit test in switch.test.tsx evaluates
 * CSS at all, so nothing else in the suite would catch the track quietly
 * reading a generic component-fill token instead of the one the Figma bundle declares
 * specifically for it, or the checked state losing its --lat-solid fill.
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

describe("Switch's stylesheet", () => {
  it('fills its track from the token the Figma bundle declares for it, not a generic component fill', () => {
    const rule = block('.lat-switch')

    expect(rule).toContain('background-color: var(--lat-switch-track);')
    expect(rule).not.toMatch(/background-color:\s*var\(--lat-component\);/)
  })

  it('fills the checked track with the solid, not left unchanged', () => {
    const rule = block(`.lat-switch[aria-checked='true']`)

    expect(rule).toContain('background-color: var(--lat-solid);')
  })
})
