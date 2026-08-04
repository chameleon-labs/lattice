import { describe, expect, it } from 'vitest'
import { CHROMATIC_SCALES, SOLID_ANCHORS } from '../config/anchors.js'
import { MODES } from '../config/modes.js'
import { SEVERITY_LEVELS } from '../config/severity.js'
import { emitCss } from '../generate/emit.js'
import { buildSeverity, resolveSeverityTints } from '../generate/severity.js'
import { parseHex, srgbToOklch } from '../generate/oklch.js'

describe('severity ramp', () => {
  it('takes every dark level from the Figma bundle', () => {
    const dark = Object.fromEntries(buildSeverity('dark').map((s) => [s.role, s.hex]))
    expect(dark.critical).toBe('#ff4d6a')
    expect(dark.serious).toBe('#fb923c')
    expect(dark.moderate).toBe('#fbbf24')
  })

  it('takes the declared light levels and derives only moderate', () => {
    const light = buildSeverity('light')
    const byRole = Object.fromEntries(light.map((s) => [s.role, s]))
    expect(byRole.critical!.hex).toBe('#d41240')
    expect(byRole.critical!.origin).toBe('anchored')
    expect(byRole.serious!.hex).toBe('#ea580c')
    expect(byRole.serious!.origin).toBe('anchored')
    expect(byRole.moderate!.origin).toBe('derived')
    expect(byRole.moderate!.l).toBeCloseTo(0.725, 2)
  })

  it('orders the ramp by lightness in both modes so it survives colour blindness', () => {
    // Hue alone does not separate serious from moderate under deuteranopia;
    // lightness ordering is the safety net. The mandatory icon and label are
    // the actual defence.
    //
    // Both modes, not just dark: the safety net is claimed for both themes, and
    // light's `moderate` is the one derived value in the ramp — the level most
    // able to drift out of order without anyone noticing.
    for (const mode of MODES) {
      const ramp = buildSeverity(mode)
      const l = (role: string) => ramp.find((s) => s.role === role)!.l
      expect(l('critical')).toBeLessThan(l('serious'))
      expect(l('serious')).toBeLessThan(l('moderate'))
    }
  })
})

describe('severity tints', () => {
  it('resolves a tint and a tint-border for every coloured level, in both modes', () => {
    for (const mode of MODES) {
      const roles = resolveSeverityTints(mode)
        .map((t) => t.role)
        .sort()
      expect(roles).toEqual(
        ['critical', 'serious', 'moderate']
          .flatMap((level) => [`severity-${level}-tint`, `severity-${level}-tint-border`])
          .sort()
      )
      for (const t of resolveSeverityTints(mode)) {
        expect(t.value).toMatch(/^rgb\(\d+ \d+ \d+ \/ 0\.(1|2)\)$/)
      }
    }
  })

  it('gives all four levels — including minor — a tint and a tint-border in the emitted stylesheet', () => {
    const css = emitCss()
    for (const level of SEVERITY_LEVELS) {
      expect(css).toContain(`--lat-severity-${level}-tint:`)
      expect(css).toContain(`--lat-severity-${level}-tint-border:`)
    }

    // `minor` carries no colour of its own, so its pair is a straight alias to
    // the neutral wash/border pair rather than a computed rgb() value — the
    // same pattern its solid already uses for --lat-text-subtle.
    expect(css).toContain('--lat-severity-minor-tint: var(--lat-wash);')
    expect(css).toContain('--lat-severity-minor-tint-border: var(--lat-border);')
    expect(resolveSeverityTints('dark').some((t) => t.role.startsWith('severity-minor'))).toBe(
      false
    )
  })

  it("derives moderate's tint from the amber severity anchor, not another chromatic scale", () => {
    for (const mode of MODES) {
      const moderateHex = buildSeverity(mode).find((s) => s.role === 'moderate')!.hex
      const tint = resolveSeverityTints(mode).find((t) => t.role === 'severity-moderate-tint')!

      // The tint is built from the ramp's own moderate swatch...
      expect(tint.hex).toBe(moderateHex)

      // ...at amber's hue, nowhere near warning (orange, ~41-56) or any other
      // chromatic scale Badge could have been mistakenly pointed at instead
      // (e.g. info, which is blue). This is the regression the coordinator
      // caught: `moderate -> info` swapped in a hue 232 blue for what should
      // stay in the red/orange/amber family.
      const { h } = srgbToOklch(parseHex(moderateHex))
      expect(h).toBeGreaterThan(60)
      expect(h).toBeLessThan(110)

      for (const scale of CHROMATIC_SCALES) {
        expect(tint.hex).not.toBe(SOLID_ANCHORS[scale][mode])
      }
    }
  })
})
