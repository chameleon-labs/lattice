/**
 * @vitest-environment node
 *
 * Assembles the stylesheet from source, the same way stylesheet.test.ts does
 * and for the same reason: reading dist/ passes locally and fails from a
 * clean tree (CI runs `test` before `build`), and this must not run under
 * jsdom, where the global URL resolves relative imports against the
 * document's base instead of import.meta.url.
 *
 * This file exists because SegmentedControl's selected state — background
 * plus box-shadow, nothing positional — has nothing left once forced-colors
 * strips box-shadow and overrides background: unlike Switch (whose checked
 * state is a *transform*, which survives) or Tabs (whose selected state is a
 * real border that stays distinguishable because forced-colors preserves
 * `transparent` rather than overriding it), every segment would render
 * identically. No unit test in segmented-control.test.tsx evaluates CSS, and
 * segmented-control-css.test.ts only covers the non-forced-colors rules, so
 * neither would catch the `@media (forced-colors: active)` block going
 * missing, or its checked-label rule losing the `background`/`color` pair
 * that carries the entire signal in that mode.
 */
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { assembleCss } from '../scripts/assemble-css.js'

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)))

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Extracts a `{ ... }` body with balanced-brace matching, unlike a `[^}]*`
 * regex, which breaks the moment the body contains a nested block — as
 * `@media` blocks always do. */
function balancedBlock(source: string, openBraceIndex: number): string {
  let depth = 0
  for (let i = openBraceIndex; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(openBraceIndex + 1, i)
    }
  }
  throw new Error('unbalanced braces: no matching closing brace found')
}

function mediaBlock(query: string): string {
  const pattern = new RegExp(`${escapeRegExp(query)}\\s*\\{`)
  const match = pattern.exec(css)
  if (match === null) {
    throw new Error(`no ${query} block found in the assembled stylesheet`)
  }
  return balancedBlock(css, match.index + match[0].length - 1)
}

function block(source: string, selector: string): string {
  const pattern = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`)
  const match = pattern.exec(source)
  if (match === null) {
    throw new Error(`no ${selector} block found`)
  }
  return match[1] ?? ''
}

describe("SegmentedControl's forced-colors fallback", () => {
  it('declares a forced-colors block', () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{/)
  })

  it('gives the checked label both a background and a colour inside that block, from the system palette', () => {
    const media = mediaBlock('@media (forced-colors: active)')
    const rule = block(media, '.lat-segmented-control__input:checked + .lat-segmented-control__label')

    expect(rule).toContain('background: Highlight;')
    expect(rule).toContain('color: HighlightText;')
    // forced-color-adjust: none is what stops the UA overriding Highlight/
    // HighlightText straight back to its own defaults — without it the block
    // above is a no-op.
    expect(rule).toContain('forced-color-adjust: none;')
  })
})
