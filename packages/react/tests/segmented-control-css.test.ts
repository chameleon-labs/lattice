/**
 * @vitest-environment node
 *
 * Assembled from source rather than read from dist/ — see stylesheet.test.ts.
 *
 * This file exists for the reason badge-severity-css.test.ts and
 * card-css.test.ts do: `stylesheet.test.ts`'s "references only tokens the
 * token package declares" only checks that a referenced var() name is
 * declared *somewhere* in the token package, not that a given rule reaches
 * for the *right* one, and no unit test in segmented-control.test.tsx
 * evaluates CSS at all. `--lat-bg-raised` and `--lat-bg` (the page
 * background), or `--lat-bg-subtle` and `--lat-bg-raised`, are close enough
 * in name and role that a swap would look plausible in review and be wrong:
 * a checked thumb sitting at the same elevation as its own track, or the
 * track itself reading a surface a level too high, would both pass every
 * other test in the suite silently.
 */
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { assembleCss } from '../scripts/assemble-css.js'

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)))

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function block(selector: string): string {
  const pattern = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`)
  const match = pattern.exec(css)
  if (match === null) {
    throw new Error(`no ${selector} block found in the assembled stylesheet`)
  }
  return match[1] ?? ''
}

describe("SegmentedControl's stylesheet", () => {
  it('gives the track --lat-bg-subtle, not the raised surface its own thumb uses', () => {
    const rule = block('.lat-segmented-control')

    expect(rule).toContain('background: var(--lat-bg-subtle);')
    expect(rule).not.toContain('var(--lat-bg-raised)')
  })

  it('gives the checked thumb a raised surface and the raised elevation', () => {
    const rule = block('.lat-segmented-control__input:checked + .lat-segmented-control__label')

    expect(rule).toContain('background: var(--lat-bg-raised);')
    expect(rule).toContain('box-shadow: var(--lat-elevation-raised);')
    // Never the track's own token — a checked thumb must actually sit above
    // the track, not merely repaint it.
    expect(rule).not.toContain('var(--lat-bg-subtle)')
  })

  // The label is a single-line mono control (the Figma bundle's `font-mono text-xs`,
  // 12px/16px), not a code block, so it must read `segment` — a dedicated
  // control role — not `code`, whose prose leading (1.625) is right for a
  // multi-line block and made this label 1-3px taller than the source. This
  // is the same category error input-css.test.ts guards for Input's `field`
  // role, in the control that fix didn't reach. Verified to discriminate:
  // reverting to `--lat-text-code-*` by hand fails this, restoring it passes.
  it('sets its label in the mono segment role, not the code role', () => {
    const rule = block('.lat-segmented-control__label')

    expect(rule).toContain('font-family: var(--lat-text-segment-font-family);')
    expect(rule).toContain('font-size: var(--lat-text-segment-font-size);')
    expect(rule).toContain('line-height: var(--lat-text-segment-line-height);')
    expect(rule).not.toContain('var(--lat-text-code-font-family)')
    expect(rule).not.toContain('var(--lat-text-code-font-size)')
    expect(rule).not.toContain('var(--lat-text-code-line-height)')
  })
})
