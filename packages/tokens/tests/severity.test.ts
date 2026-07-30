import { describe, expect, it } from 'vitest'

import { CHART_SURFACES } from '../config/charts.js'
import { MODES } from '../config/lightness.js'
import {
  SEVERITY_CONTRAST_MIN,
  SEVERITY_DARK,
  SEVERITY_LEVELS,
  SEVERITY_MIN_LUMINANCE_GAP
} from '../config/severity.js'
import { contrastRatio } from '../generate/contrast.js'
import { deltaE } from '../generate/cvd.js'
import { parseHex } from '../generate/oklch.js'
import { buildSeverity, validateSeverity } from '../generate/severity.js'

const ratio = (a: string, b: string): number => contrastRatio(parseHex(a), parseHex(b))

describe('the severity ramp', () => {
  // The published ramp, with the contrast each level reaches on its own surface.
  const published = [
    ['minor', '#ad8604', 3.34, '#c39800', 7.02],
    ['moderate', '#b36600', 4.29, '#e38300', 6.75],
    ['serious', '#b93a13', 5.61, '#f5714e', 6.61],
    ['critical', '#ad003a', 7.27, '#f56a7e', 6.51]
  ] as const

  it.each(published)(
    'generates %s as %s on light and %s on dark',
    (level, light, lightRatio, dark, darkRatio) => {
      const inLight = buildSeverity('light').find((swatch) => swatch.level === level)
      const inDark = buildSeverity('dark').find((swatch) => swatch.level === level)

      expect(inLight?.hex).toBe(light)
      expect(inDark?.hex).toBe(dark)
      expect(ratio(light, CHART_SURFACES.light)).toBeCloseTo(lightRatio, 2)
      expect(ratio(dark, CHART_SURFACES.dark)).toBeCloseTo(darkRatio, 2)
    }
  )

  it('runs least severe to most severe', () => {
    for (const mode of MODES) {
      expect(buildSeverity(mode).map((swatch) => swatch.level)).toEqual([...SEVERITY_LEVELS])
      expect(buildSeverity(mode).map((swatch) => swatch.rank)).toEqual([1, 2, 3, 4])
    }
  })

  // The acceptance criterion, asserted on relative luminance rather than on OKLCH
  // lightness: greyscale rendering and forced-colors use the former, and the two
  // disagree — WCAG weights green at 0.7152 against blue at 0.0722.
  it('is greyscale-monotone in light mode', () => {
    const ramp = buildSeverity('light')

    for (let i = 1; i < ramp.length; i++) {
      expect(ramp[i]!.luminance).toBeLessThan(ramp[i - 1]!.luminance)
    }
  })

  it('keeps a usable greyscale gap between adjacent light levels', () => {
    const ramp = buildSeverity('light')
    const gaps = ramp.slice(1).map((swatch, i) => ramp[i]!.luminance - swatch.luminance)

    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(SEVERITY_MIN_LUMINANCE_GAP.light)
    // Measured: 0.069, 0.057, 0.042.
    expect(Math.min(...gaps)).toBeCloseTo(0.042, 3)
  })

  // The other half of the acceptance criterion.
  it.each(MODES)('clears 3:1 on its own surface in %s mode', (mode) => {
    for (const swatch of buildSeverity(mode)) {
      expect(ratio(swatch.hex, CHART_SURFACES[mode]), swatch.level).toBeGreaterThanOrEqual(
        SEVERITY_CONTRAST_MIN
      )
    }
  })

  it('moves lightness and chroma together in light mode', () => {
    const ramp = buildSeverity('light')

    for (let i = 1; i < ramp.length; i++) {
      expect(ramp[i]!.l).toBeLessThan(ramp[i - 1]!.l)
      expect(ramp[i]!.c).toBeGreaterThan(ramp[i - 1]!.c)
    }
  })

  it('holds lightness flat in dark mode', () => {
    for (const swatch of buildSeverity('dark')) {
      expect(swatch.l).toBeCloseTo(SEVERITY_DARK.lightness, 2)
    }
  })

  it('rotates hue from yellow to red as severity rises', () => {
    for (const mode of MODES) {
      const hues = buildSeverity(mode).map((swatch) => swatch.h)

      for (let i = 1; i < hues.length; i++) {
        expect(hues[i]).toBeLessThan(hues[i - 1]!)
      }
    }
  })
})

describe('what dark mode gives up', () => {
  // The issue says dark "does not preserve greyscale ordering". Measured, dark's
  // luminance is still technically descending — but by so little that treating it
  // as a cue would be wrong. Pinned as a ratio so the claim is a number rather
  // than a characterisation.
  it('keeps a greyscale gap far too small to read as order', () => {
    const light = buildSeverity('light')
    const dark = buildSeverity('dark')
    const smallest = (ramp: typeof light): number =>
      Math.min(...ramp.slice(1).map((swatch, i) => Math.abs(ramp[i]!.luminance - swatch.luminance)))

    expect(smallest(dark)).toBeLessThan(0.01)
    expect(smallest(light) / smallest(dark)).toBeGreaterThan(5)
  })

  // The measurement that makes the icon-and-label rule mandatory rather than
  // advisory: under deuteranopia two adjacent dark levels are indistinguishable.
  it('leaves adjacent levels indistinguishable under deuteranopia', () => {
    const dark = buildSeverity('dark')
    const worst = Math.min(
      ...dark.slice(1).map((swatch, i) => deltaE(parseHex(dark[i]!.hex), parseHex(swatch.hex), 'deutan'))
    )

    expect(worst).toBeLessThan(1)
  })

  it('separates the light ramp better under every simulation', () => {
    const light = buildSeverity('light')
    const dark = buildSeverity('dark')
    const worst = (ramp: typeof light, kind: 'protan' | 'deutan' | 'tritan'): number =>
      Math.min(
        ...ramp.slice(1).map((swatch, i) => deltaE(parseHex(ramp[i]!.hex), parseHex(swatch.hex), kind))
      )

    for (const kind of ['protan', 'deutan', 'tritan'] as const) {
      expect(worst(light, kind), kind).toBeGreaterThan(worst(dark, kind))
    }
  })
})

describe('the severity checks', () => {
  it.each(MODES)('pass in %s mode', (mode) => {
    const report = validateSeverity(buildSeverity(mode), mode)

    expect(report.ok).toBe(true)
    expect(report.checks).toHaveLength(4)
  })

  // Light gates on greyscale order; dark reports it as a warning, because dark
  // deliberately trades it away. A warning that silently became a pass would hide
  // the trade.
  it('gates greyscale order on light and reports it on dark', () => {
    const greyscale = (mode: 'light' | 'dark'): string | undefined =>
      validateSeverity(buildSeverity(mode), mode).checks.find(
        (check) => check.name === 'Greyscale order'
      )?.state

    expect(greyscale('light')).toBe('pass')
    expect(greyscale('dark')).toBe('warn')
  })

  it('fails a light ramp whose greyscale order has been flattened', () => {
    const ramp = buildSeverity('light')
    const flattened = ramp.map((swatch, index) =>
      index === 2 ? { ...swatch, luminance: ramp[1]!.luminance - 0.001 } : swatch
    )

    expect(validateSeverity(flattened, 'light').ok).toBe(false)
  })

  it('fails a ramp whose levels are out of order', () => {
    const report = validateSeverity(buildSeverity('light').slice().reverse(), 'light')

    expect(report.ok).toBe(false)
    expect(report.checks.find((check) => check.name === 'Ordered levels')?.state).toBe('fail')
  })

  // A ramp missing a level is broken, not shorter. The categorical validator
  // compares against a prefix on purpose — a scatter chart validates only the
  // slots it uses — and carrying that over let a three-level ramp with no
  // `critical` pass, and a one-level ramp too.
  it.each([1, 2, 3])('fails a ramp truncated to %i level(s)', (kept) => {
    const report = validateSeverity(buildSeverity('light').slice(0, kept), 'light')

    expect(report.ok).toBe(false)
    expect(report.checks.find((check) => check.name === 'Ordered levels')?.state).toBe('fail')
  })

  it('names the level that went missing', () => {
    const detail = validateSeverity(buildSeverity('light').slice(0, 3), 'light').checks.find(
      (check) => check.name === 'Ordered levels'
    )?.detail

    expect(detail).toContain('critical')
  })

  it('fails an empty ramp rather than passing vacuously', () => {
    const report = validateSeverity([], 'light')

    expect(report.ok).toBe(false)
    expect(report.checks).toHaveLength(1)
  })

  it('fails a level that cannot be seen on its surface', () => {
    const ramp = buildSeverity('light')
    const invisible = ramp.map((swatch, index) =>
      index === 0 ? { ...swatch, hex: '#fcfcfc' } : swatch
    )

    expect(validateSeverity(invisible, 'light').ok).toBe(false)
  })
})
