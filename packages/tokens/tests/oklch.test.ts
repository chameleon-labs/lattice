import { describe, expect, it } from 'vitest'

import {
  fitToGamut,
  formatHex,
  inGamut,
  linearToSrgb,
  oklchToSrgb,
  parseHex,
  srgbToLinear,
  srgbToOklch
} from '../generate/oklch.js'

describe('parseHex', () => {
  it('reads a six-digit hex string as channels in 0..1', () => {
    expect(parseHex('#ffff00')).toEqual({ r: 1, g: 1, b: 0 })
  })

  it('accepts uppercase and a missing leading hash', () => {
    expect(parseHex('0000FF')).toEqual({ r: 0, g: 0, b: 1 })
  })

  it('rejects a string that is not six hex digits', () => {
    expect(() => parseHex('#fff')).toThrow()
  })
})

describe('formatHex', () => {
  it('writes channels back as a lowercase six-digit string', () => {
    expect(formatHex({ r: 1, g: 1, b: 0 })).toBe('#ffff00')
  })

  it('pads single-digit channels', () => {
    expect(formatHex({ r: 0, g: 0, b: 1 / 255 })).toBe('#000001')
  })

  it('clamps channels that fall outside 0..1', () => {
    expect(formatHex({ r: 1.4, g: -0.2, b: 0 })).toBe('#ff0000')
  })

  // Math.min/Math.max do not clamp NaN, so an unguarded implementation emits
  // '#NaNNaNNaN' into a stylesheet. Refusing is the only safe answer: a token
  // file that parses but is wrong is worse than a build that stops.
  it.each(['r', 'g', 'b'] as const)('refuses a non-finite %s channel', (channel) => {
    expect(() => formatHex({ r: 0, g: 0, b: 0, [channel]: Number.NaN })).toThrow(/finite/i)
  })

  it('refuses an infinite channel', () => {
    expect(() => formatHex({ r: Number.POSITIVE_INFINITY, g: 0, b: 0 })).toThrow(/finite/i)
  })
})

describe('sRGB transfer function', () => {
  it('decodes mid-grey to its linear value', () => {
    expect(srgbToLinear(0.5)).toBeCloseTo(0.2140411, 6)
  })

  it('uses the linear segment near black', () => {
    expect(srgbToLinear(0.02)).toBeCloseTo(0.02 / 12.92, 9)
  })

  it('round-trips across the whole range', () => {
    for (const value of [0, 0.0031308, 0.04045, 0.25, 0.5, 0.75, 1]) {
      expect(linearToSrgb(srgbToLinear(value))).toBeCloseTo(value, 6)
    }
  })

  // sRGB's two branch thresholds, 0.04045 and 0.0031308, are rounded versions
  // of each other rather than exact inverses: 0.04045 / 12.92 lands just above
  // 0.0031308, so decoding the boundary takes the linear branch and re-encoding
  // it takes the power branch. The gap is ~3e-8, roughly 130,000x finer than one
  // 8-bit step, and every implementation using the standard's published
  // constants has it. Pinned so it is a known quantity rather than a surprise.
  it('loses less than 1e-7 round-tripping the branch boundary', () => {
    const error = Math.abs(linearToSrgb(srgbToLinear(0.04045)) - 0.04045)

    expect(error).toBeGreaterThan(0)
    expect(error).toBeLessThan(1e-7)
  })
})

describe('srgbToOklch', () => {
  // The issue quotes these rounded to three decimals; asserted here at full
  // precision so a drift smaller than the rounding still fails.
  it('converts pure yellow', () => {
    const { l, c, h } = srgbToOklch(parseHex('#ffff00'))
    expect(l).toBeCloseTo(0.96798, 4)
    expect(c).toBeCloseTo(0.21101, 4)
    expect(h).toBeCloseTo(109.769, 2)
  })

  it('converts pure blue', () => {
    const { l, c, h } = srgbToOklch(parseHex('#0000ff'))
    expect(l).toBeCloseTo(0.45201, 4)
    expect(c).toBeCloseTo(0.31321, 4)
    expect(h).toBeCloseTo(264.052, 2)
  })

  it('gives white lightness 1 and no chroma', () => {
    const { l, c } = srgbToOklch({ r: 1, g: 1, b: 1 })
    expect(l).toBeCloseTo(1, 6)
    expect(c).toBeCloseTo(0, 6)
  })

  it('gives black lightness 0', () => {
    expect(srgbToOklch({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 6)
  })

  it('reports hue in 0..360', () => {
    const { h } = srgbToOklch(parseHex('#ff0000'))
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(360)
  })
})

describe('oklchToSrgb', () => {
  it('round-trips every channel of a set of known colours', () => {
    for (const hex of ['#ffff00', '#0000ff', '#9a54da', '#ad003a', '#188ceb', '#7f7f7f']) {
      expect(formatHex(oklchToSrgb(srgbToOklch(parseHex(hex))))).toBe(hex)
    }
  })

  it('returns channels outside 0..1 when the colour is not representable', () => {
    const { r, g, b } = oklchToSrgb({ l: 0.7, c: 0.35, h: 150 })
    expect(Math.max(r, g, b) > 1 || Math.min(r, g, b) < 0).toBe(true)
  })
})

describe('inGamut', () => {
  it('accepts a colour sRGB can represent', () => {
    expect(inGamut(srgbToOklch(parseHex('#9a54da')))).toBe(true)
  })

  it('rejects a chroma sRGB cannot reach', () => {
    expect(inGamut({ l: 0.7, c: 0.35, h: 150 })).toBe(false)
  })

  it('accepts every greyscale lightness', () => {
    for (const l of [0, 0.25, 0.5, 0.75, 1]) {
      expect(inGamut({ l, c: 0, h: 0 })).toBe(true)
    }
  })
})

describe('fitToGamut', () => {
  it('leaves a colour that already fits completely untouched', () => {
    const requested = { l: 0.591, c: 0.2, h: 305 }

    expect(fitToGamut(requested)).toEqual(requested)
  })

  it('brings an unreachable chroma back inside sRGB', () => {
    expect(inGamut(fitToGamut({ l: 0.7, c: 0.35, h: 150 }))).toBe(true)
  })

  it('holds lightness and hue while reducing chroma', () => {
    const fitted = fitToGamut({ l: 0.7, c: 0.35, h: 150 })

    expect(fitted.l).toBe(0.7)
    expect(fitted.h).toBe(150)
    expect(fitted.c).toBeLessThan(0.35)
  })

  // The point of the binary search: a stub returning chroma 0 would satisfy
  // every assertion above. This one fails unless the fit is genuinely near the
  // gamut boundary.
  it('finds the boundary rather than retreating to grey', () => {
    const fitted = fitToGamut({ l: 0.7, c: 0.35, h: 150 })

    expect(fitted.c).toBeGreaterThan(0.15)
    expect(inGamut({ ...fitted, c: fitted.c + 5e-5 })).toBe(false)
  })

  // c: Infinity leaves the midpoint at Infinity forever, so the search never
  // terminates; c: NaN fails the loop condition on the first check and quietly
  // returns chroma 0. A hang and a silent wrong answer both have to be refused.
  //
  // No test timeout guards this: the loop is synchronous, so it blocks the event
  // loop and vitest's timer can never fire. Without the guard in fitToGamut the
  // whole suite hangs rather than failing, which is why the guard throws instead
  // of clamping.
  it.each([Number.POSITIVE_INFINITY, Number.NaN])(
    'refuses chroma %p instead of hanging or silently returning grey',
    (c) => {
      expect(() => fitToGamut({ l: 0.5, c, h: 150 })).toThrow(/finite/i)
    }
  )

  it('refuses a non-finite lightness', () => {
    expect(() => fitToGamut({ l: Number.NaN, c: 0.2, h: 150 })).toThrow(/finite/i)
  })

  // Pins CHROMA_RESOLUTION. A single hue does not discriminate: whether the
  // bisection happens to land near the boundary is luck, and a 1e-4 search
  // passed a 5e-5 margin at hue 150 by chance. Swept across hues so a coarser
  // resolution fails somewhere.
  it('fits chroma to within 2e-5 of the boundary at every hue', () => {
    for (const h of [0, 60, 120, 150, 210, 270, 305]) {
      const fitted = fitToGamut({ l: 0.7, c: 0.4, h })

      expect(inGamut(fitted)).toBe(true)
      expect(inGamut({ ...fitted, c: fitted.c + 2e-5 })).toBe(false)
    }
  })

  it('is idempotent', () => {
    const once = fitToGamut({ l: 0.7, c: 0.35, h: 150 })

    expect(fitToGamut(once)).toEqual(once)
  })

  it('drives chroma to nothing at the ends of the lightness range', () => {
    expect(fitToGamut({ l: 0, c: 0.3, h: 305 }).c).toBeCloseTo(0, 3)
    expect(fitToGamut({ l: 1, c: 0.3, h: 305 }).c).toBeCloseTo(0, 3)
  })

  it('reports the chroma that shipped, so a round-trip through hex agrees', () => {
    const fitted = fitToGamut({ l: 0.7, c: 0.35, h: 150 })
    const shipped = srgbToOklch(parseHex(formatHex(oklchToSrgb(fitted))))

    expect(shipped.c).toBeCloseTo(fitted.c, 2)
  })
})
