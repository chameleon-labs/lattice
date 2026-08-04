/**
 * @vitest-environment node
 *
 * Assembles the stylesheet from source, the same way stylesheet.test.ts does
 * and for the same reason: reading dist/ passes locally and fails from a
 * clean tree (CI runs `test` before `build`), and this must not run under
 * jsdom, where the global URL resolves relative imports against the
 * document's base instead of import.meta.url.
 *
 * This file exists because plausible-but-wrong token references would be
 * invisible to everything else in the suite. `stylesheet.test.ts`'s
 * "references only tokens the token package declares" only checks that a
 * referenced var() name is declared *somewhere* — `--lat-bg` and
 * `--lat-bg-raised` both are, so a `.lat-input` rule that read either of
 * those instead of `--lat-field-bg` would still pass it, the same class of
 * regression `card-css.test.ts` guards against for Card. No unit test in
 * text-field.test.tsx evaluates CSS at all, so it would not catch a
 * `.lat-input` whose font-family still pointed at the `ui` role's tokens
 * instead of `code`'s — an easy slip, since both roles exist side by side in
 * the token package and a `ui`-role reference is exactly as "declared
 * somewhere" as a `code`-role one.
 *
 * The `aria-invalid` block guards a real regression: an earlier version of
 * this file dropped invalid-state styling entirely, so a field could carry
 * `aria-invalid="true"` and look identical to a valid one — the error was
 * announced to assistive technology but invisible to a sighted user filling
 * the form. Nothing DOM-level catches that, since `aria-invalid` was still
 * set correctly; only reading the CSS shows the border never changed colour.
 * The focus-visible half matters separately: without it, focusing an invalid
 * field would replace the danger border with the ordinary accent focus ring,
 * and the cue would vanish at exactly the moment someone is correcting it.
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

describe("Input's stylesheet", () => {
  it('fills from the field surface, not the page background or a raised one', () => {
    const rule = block('.lat-input')

    expect(rule).toContain('background: var(--lat-field-bg);')
    expect(rule).not.toMatch(/background:\s*var\(--lat-bg\);/)
    expect(rule).not.toMatch(/background:\s*var\(--lat-bg-raised\);/)
  })

  it('sets its value in the mono code role, not the sans ui role', () => {
    const rule = block('.lat-input')

    expect(rule).toContain('font-family: var(--lat-text-code-font-family);')
    expect(rule).not.toContain('font-family: var(--lat-text-ui-font-family);')
  })

  it('turns an invalid field visibly invalid, in --lat-danger-solid, not the ordinary border', () => {
    const rule = block(`.lat-input[aria-invalid='true']`)

    expect(rule).toContain('border-color: var(--lat-danger-solid);')
    expect(rule).not.toMatch(/border-color:\s*var\(--lat-border\);/)
  })

  it('keeps the danger cue through focus, rather than losing it to the accent focus ring', () => {
    const rule = block(`.lat-input[aria-invalid='true']:focus-visible`)

    expect(rule).toContain('border-color: var(--lat-danger-solid);')
    expect(rule).toContain('box-shadow: 0 0 0 1px var(--lat-danger-solid);')
    expect(rule).not.toMatch(/var\(--lat-focus-ring\)/)
  })
})
