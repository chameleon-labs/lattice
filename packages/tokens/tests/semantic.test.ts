import { describe, expect, it } from 'vitest'
import { MODES } from '../config/modes.js'
import { resolveGray } from '../generate/anchors.js'
import { semanticBlock } from '../generate/semantic.js'

describe('semantic tier', () => {
  it('emits every role in both modes', () => {
    for (const mode of MODES) {
      const css = semanticBlock(mode)
      for (const role of [
        '--lat-bg',
        '--lat-bg-raised',
        '--lat-bg-subtle',
        '--lat-component',
        '--lat-field-bg',
        '--lat-switch-track',
        '--lat-text',
        '--lat-text-subtle',
        '--lat-solid',
        '--lat-on-solid',
        '--lat-border',
        '--lat-border-strong',
        '--lat-wash',
        '--lat-focus-ring',
        '--lat-accent-vivid',
        '--lat-danger-tint',
        '--lat-danger-tint-border'
      ]) {
        expect(css).toContain(`${role}:`)
      }
    }
  })

  it('keeps the accent vivid identical across modes', () => {
    const find = (mode: 'light' | 'dark') =>
      semanticBlock(mode).split('\n').find((l) => l.includes('--lat-accent-vivid:'))
    expect(find('light')).toBe(find('dark'))
  })

  it('raises a surface above the page in both modes', () => {
    // bg-raised is lighter than bg in dark AND light — Lattice lifts by
    // lightness regardless of theme. Asserted against the resolved lightness,
    // not against the presence of a property name: a substring check would
    // still pass if the two anchors were swapped, which is the regression this
    // test exists to catch.
    for (const mode of MODES) {
      const gray = Object.fromEntries(resolveGray(mode).map((s) => [s.role, s]))
      expect(gray['bg-raised']!.l).toBeGreaterThan(gray.bg!.l)
    }
  })

  it('points every role alias at a primitive that is actually emitted', () => {
    // A dangling alias — var(--lat-something-nothing-emits) — resolves to
    // nothing at all in the browser and is invisible in a substring check.
    for (const mode of MODES) {
      const css = semanticBlock(mode)
      const declared = new Set(
        [...css.matchAll(/^\s*(--lat-[\w-]+):/gm)].map((m) => m[1]!)
      )
      for (const [, target] of css.matchAll(/var\((--lat-[\w-]+)\)/g)) {
        expect(declared).toContain(target)
      }
    }
  })
})
