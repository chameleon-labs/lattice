/**
 * @vitest-environment node
 *
 * Assembled from source rather than read from dist/ — see stylesheet.test.ts.
 *
 * This file exists because the superseded Quiet Surface spec found the old
 * backdrop rendering as 80% of near-white over near-white: `.lat-dialog__
 * backdrop` read `background-color: var(--lat-gray-1); opacity: 0.8;`, both
 * tokens the token package declares, so `stylesheet.test.ts`'s "references
 * only tokens the token package declares" passed regardless. The scrim was
 * present in the markup and absent in the render: the page behind an open
 * modal stayed fully legible. No unit test in dialog.test.tsx evaluates CSS
 * at all — it only asserts the dialog's own accessible behaviour — so
 * nothing else in the suite would catch this rule quietly drifting back to a
 * light-on-light background, or to any other token whose role is not "a
 * fixed, mode-independent dim of the page behind the modal".
 *
 * `tests/browser/overlay.spec.ts` proves the rendered colour is actually
 * dark; this proves the source of that colour is the literal scrim and not a
 * token that could vary by theme, by future redefinition, or by the exact
 * substitution this test guards against.
 */
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { assembleCss } from '../scripts/assemble-css.js'

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)))

// Comments stripped before matching: the rule below documents the old bug
// with its own literal text ("--lat-gray-1", "opacity: 0.8"), and an
// assertion that scanned comments along with declarations would match its
// own explanation rather than the CSS it explains.
const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')

function block(selector: string): string {
  const pattern = new RegExp(`${selector.replace(/[.[\]']/g, '\\$&')}\\s*\\{([^}]*)\\}`)
  const match = pattern.exec(withoutComments)
  if (match === null) {
    throw new Error(`no ${selector} block found in the assembled stylesheet`)
  }
  return match[1] ?? ''
}

describe("Dialog's backdrop", () => {
  it('sets a dark scrim as a literal, not a token', () => {
    const rule = block('.lat-dialog__backdrop')

    expect(rule).toContain('background: rgb(0 0 0 / 0.6);')
  })

  it('does not reference --lat-bg or --lat-gray-1 — the exact shape the old bug took', () => {
    const rule = block('.lat-dialog__backdrop')

    // The old rule read `background-color: var(--lat-gray-1); opacity: 0.8;`
    // — near-white over near-white in light mode. Guarding against
    // `--lat-gray-1` by name is not enough on its own, since a future token
    // package could rename it; `--lat-bg` is the page background itself, and
    // a backdrop that reads it is a scrim painted the same colour as the page
    // it sits on regardless of what that token is called.
    expect(rule).not.toMatch(/var\(--lat-bg\)/)
    expect(rule).not.toMatch(/var\(--lat-gray-1\)/)
    expect(rule).not.toMatch(/opacity:\s*0\.8/)
  })
})
