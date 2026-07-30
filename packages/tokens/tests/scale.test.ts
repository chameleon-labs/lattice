import { describe, expect, it } from 'vitest'

import { CHROMA_FRACTION } from '../config/chroma.js'
import { CONTRACTS, SEPARATION } from '../config/contracts.js'
import { LIGHTNESS, MODES, STEPS } from '../config/lightness.js'
import { SCALES, SCALE_NAMES, type ScaleConfig } from '../config/scales.js'
import { contrastRatio } from '../generate/contrast.js'
import { parseHex } from '../generate/oklch.js'
import { buildAllScales, buildScale } from '../generate/scale.js'
import { ship } from '../generate/solve.js'

const ratio = (a: string, b: string): number => contrastRatio(parseHex(a), parseHex(b))

describe('the accent scale, light mode', () => {
  // The spec's published scale. Every value here is the acceptance criterion for
  // this issue rather than a snapshot of whatever the code happens to produce.
  const expected = [
    { step: 1, l: 0.993, hex: '#fdfcff' },
    { step: 2, l: 0.981, hex: '#faf7ff' },
    { step: 3, l: 0.958, hex: '#f5edff' },
    { step: 4, l: 0.936, hex: '#f0e4ff' },
    { step: 5, l: 0.913, hex: '#eadaff' },
    { step: 6, l: 0.885, hex: '#e4ceff' },
    { step: 7, l: 0.848, hex: '#dbbeff' },
    { step: 8, l: 0.795, hex: '#d0a6ff' },
    { step: 9, l: 0.591, hex: '#9a54da' },
    { step: 10, l: 0.561, hex: '#904dce' },
    { step: 11, l: 0.521, hex: '#804ab3' },
    { step: 12, l: 0.32, hex: '#3d2655' }
  ]

  it.each(expected)('emits step $step as $hex at L $l', ({ step, l, hex }) => {
    const swatch = buildScale('accent', 'light').steps[step - 1]

    expect(swatch?.hex).toBe(hex)
    expect(swatch?.l).toBeCloseTo(l, 3)
  })

  it('holds the brand hue at every step', () => {
    for (const swatch of buildScale('accent', 'light').steps) {
      expect(swatch.h).toBe(305)
    }
  })

  // The four numbers the spec quotes after the constraint and the cascade.
  it('meets its contracts at the published ratios', () => {
    const { steps } = buildScale('accent', 'light')
    const hex = (step: number): string => steps[step - 1]!.hex

    expect(ratio(hex(9), hex(1))).toBeCloseTo(4.41, 2)
    expect(ratio(hex(11), hex(2))).toBeCloseTo(5.58, 2)
    expect(ratio(hex(12), hex(2))).toBeCloseTo(12.33, 2)
    expect(ratio(hex(9), '#ffffff')).toBeCloseTo(4.51, 2)
  })

  // The rule: the curve is the default. Steps the constraint did not touch must
  // sit exactly on it, not near it.
  it('leaves steps 1 to 8 exactly on the shared curve', () => {
    const { steps } = buildScale('accent', 'light')

    for (let step = 1; step <= 8; step++) {
      expect(steps[step - 1]?.l).toBe(LIGHTNESS.light[step - 1])
    }
  })
})

describe('the constraint and the cascade', () => {
  it('pins the accent solid where white reaches its minimum', () => {
    const scale = buildScale('accent', 'light')

    expect(scale.steps[8]?.l).toBeCloseTo(0.591, 3)
    expect(scale.steps[8]?.correction).toBe('constrained')
    expect(scale.onSolid.text).toBe('white')
    expect(scale.onSolid.ratio).toBeGreaterThanOrEqual(4.5)
  })

  // Without the cascade, pinning step 9 to 0.591 leaves step 10 at L 0.546
  // against step 11 at L 0.545 — solid-hover and low-contrast text as the same
  // colour. This is the regression test for that defect.
  it('re-seats the steps beneath a corrected solid instead of colliding', () => {
    const { steps } = buildScale('accent', 'light')
    const l = (step: number): number => steps[step - 1]!.l

    expect(l(9) - l(10)).toBeGreaterThanOrEqual(SEPARATION.hover - 1e-9)
    expect(l(10) - l(11)).toBeGreaterThanOrEqual(SEPARATION.text - 1e-9)
    expect(l(11) - l(12)).toBeGreaterThanOrEqual(SEPARATION.strongText - 1e-9)

    expect(steps[9]?.correction).toBe('reseated')
    expect(steps[10]?.correction).toBe('reseated')
  })

  it('marks a step the cascade did not need to move as uncorrected', () => {
    // gray has no solid constraint, so nothing beneath step 9 is re-seated.
    for (const swatch of buildScale('gray', 'light').steps) {
      expect(swatch.correction).toBeUndefined()
    }
  })

  // The separation floors are a ceiling on the curve, never a nudge upward: a
  // step already far enough away keeps its curve value untouched.
  it('does not pull a step closer to satisfy a floor', () => {
    const { steps } = buildScale('accent', 'light')

    expect(steps[11]?.l).toBe(LIGHTNESS.light[11])
  })
})

describe('solving on failure', () => {
  // The spec's correction table: one correction across ten scale-modes.
  it('corrects exactly one scale-mode out of ten', () => {
    const corrected = buildAllScales().filter((scale) => scale.solved.length > 0)

    expect(buildAllScales()).toHaveLength(10)
    expect(corrected).toHaveLength(1)
    expect(corrected[0]?.name).toBe('success')
    expect(corrected[0]?.mode).toBe('light')
  })

  it('corrects success light at steps 9 and 11', () => {
    expect(buildScale('success', 'light').solved).toEqual([9, 11])
  })

  // Both steps fail on the bare curve, which is why they are the two the solver
  // touches: 9-vs-1 reaches only 2.87 against a 3.0 minimum, and 11-on-2 only
  // 4.47 against 4.5. Asserted so the reason for the correction is pinned, not
  // just its existence.
  it('corrects them because the bare curve misses, and only just', () => {
    const scale = buildScale('success', 'light')
    const bare = (step: number): number => LIGHTNESS.light[step - 1]!

    expect(scale.steps[8]?.l).toBeLessThan(bare(9))
    expect(scale.steps[10]?.l).toBeLessThan(bare(11))
    // A correction that moved L far would mean the curve was wrong, not that a
    // hue needed a nudge.
    expect(bare(9) - scale.steps[8]!.l).toBeLessThan(0.02)
    expect(bare(11) - scale.steps[10]!.l).toBeLessThan(0.01)
  })

  // The spec reports solved L11 as 0.541 against the curve's 0.545. This
  // implementation lands on 0.542, because it fits chroma to a far tighter gamut
  // tolerance than the prototype that produced the spec's table (1e-12 against
  // 1e-4), which shifts the fitted chroma slightly and so the lightness needed to
  // clear 4.5. The ratio is what the contract is about, and it agrees exactly.
  it('lands on the ratio the spec reports', () => {
    const scale = buildScale('success', 'light')

    expect(scale.steps[10]?.l).toBeCloseTo(0.542, 3)
    expect(ratio(scale.steps[10]!.hex, scale.steps[1]!.hex)).toBeCloseTo(4.53, 2)
  })

  it('solves no further than it must', () => {
    const scale = buildScale('success', 'light')
    const contract = CONTRACTS.find((entry) => entry.step === 11)!
    const measured = ratio(scale.steps[10]!.hex, scale.steps[1]!.hex)

    expect(measured).toBeGreaterThanOrEqual(contract.minimum)
    // Overshooting would mean the search was not finding the boundary.
    expect(measured).toBeLessThan(contract.minimum + 0.1)
  })
})

describe("the spec's correction table", () => {
  // The table measures the bare curve, before any constraint or solve — the spec
  // says so explicitly, which is why the accent's published scale further down
  // disagrees with its row here. Reproduced from the config directly rather than
  // through buildScale, so no test-only switch has to exist on the generator.
  const bare = (name: keyof typeof SCALES, mode: 'light' | 'dark', step: number): string =>
    ship({
      l: LIGHTNESS[mode][step - 1]!,
      c: SCALES[name].peak * CHROMA_FRACTION[mode][step - 1]!,
      h: SCALES[name].hue
    }).hex

  // Ratios differ from the spec's by up to 0.03. The prototype that produced the
  // table fitted chroma to a 1e-4 gamut tolerance; this package uses 1e-12,
  // because 1e-6 was already loose enough to keep a chroma of 0.006 on a colour
  // that ships as #000000. The tolerance below is that difference, not slack.
  const DRIFT = 0.04

  it.each([
    ['accent', 'light', 5.05, 3.32],
    ['accent', 'dark', 9.27, 5.58],
    ['gray', 'light', 4.71, 3.06],
    ['gray', 'dark', 9.57, 6.04],
    ['danger', 'light', 5.05, 3.32],
    ['danger', 'dark', 9.25, 5.58],
    ['warning', 'light', 4.78, 3.12],
    ['warning', 'dark', 9.49, 5.93],
    ['success', 'dark', 9.87, 6.44]
  ] as const)('%s %s reads %f on 11-on-2 and %f on 9-vs-1', (name, mode, on2, vs1) => {
    expect(ratio(bare(name, mode, 11), bare(name, mode, 2))).toBeCloseTo(on2, 1)
    expect(Math.abs(ratio(bare(name, mode, 11), bare(name, mode, 2)) - on2)).toBeLessThan(DRIFT)
    expect(Math.abs(ratio(bare(name, mode, 9), bare(name, mode, 1)) - vs1)).toBeLessThan(DRIFT)
  })

  // The tenth row, and the only one that needed the solver. Its published numbers
  // are the corrected ones, so the claim to check is that the bare curve misses
  // both minimums — narrowly, which is what makes a 0.004 nudge the right answer
  // rather than a new curve.
  it('is the one row where the bare curve misses, and only just', () => {
    const on2 = ratio(bare('success', 'light', 11), bare('success', 'light', 2))
    const vs1 = ratio(bare('success', 'light', 9), bare('success', 'light', 1))

    expect(on2).toBeLessThan(4.5)
    expect(on2).toBeGreaterThan(4.4)
    expect(vs1).toBeLessThan(3.0)
    expect(vs1).toBeGreaterThan(2.8)

    // And the corrected scale clears both.
    const corrected = buildScale('success', 'light')
    expect(corrected.contracts.every((entry) => entry.passes)).toBe(true)
  })

  it('needs no correction anywhere else', () => {
    for (const scale of buildAllScales()) {
      if (scale.name === 'success' && scale.mode === 'light') {
        continue
      }
      expect(scale.solved).toEqual([])
    }
  })
})

describe('the surfaces the spec names', () => {
  // Independent confirmation of the whole config: the spec names the validation
  // surfaces as light #fdfdfd and dark #111112, "gray-1 in each mode". Nothing in
  // the curve or the envelope was set to make these come out — they fall out of
  // the shared curve at gray's peak chroma of 0.012.
  it('generates gray-1 as the light and dark app backgrounds', () => {
    expect(buildScale('gray', 'light').steps[0]?.hex).toBe('#fdfdfd')
    expect(buildScale('gray', 'dark').steps[0]?.hex).toBe('#111112')
  })
})

describe('every scale in every mode', () => {
  const scales = buildAllScales()

  it.each(scales.map((scale) => [scale.name, scale.mode, scale] as const))(
    '%s %s meets every contract',
    (_name, _mode, scale) => {
      expect(scale.contracts).toHaveLength(CONTRACTS.length)

      for (const result of scale.contracts) {
        expect(result.ratio).toBeGreaterThanOrEqual(result.minimum)
        expect(result.passes).toBe(true)
      }
    }
  )

  it.each(scales.map((scale) => [scale.name, scale.mode, scale] as const))(
    '%s %s moves lightness monotonically',
    (_name, mode, scale) => {
      for (let i = 1; i < STEPS; i++) {
        const previous = scale.steps[i - 1]!.l
        const current = scale.steps[i]!.l

        if (mode === 'light') {
          expect(current).toBeLessThan(previous)
        } else {
          expect(current).toBeGreaterThan(previous)
        }
      }
    }
  )

  it.each(scales.map((scale) => [scale.name, scale.mode, scale] as const))(
    '%s %s records the chroma that fits, never the chroma requested',
    (_name, mode, scale) => {
      const config = SCALES[scale.name]

      for (const [index, swatch] of scale.steps.entries()) {
        const requested = config.peak * CHROMA_FRACTION[mode][index]!

        expect(swatch.c).toBeLessThanOrEqual(requested + 1e-12)
        expect(swatch.c).toBeGreaterThan(0)
      }
    }
  )

  it('reports APCA alongside every contract without gating on it', () => {
    for (const scale of scales) {
      for (const result of scale.contracts) {
        expect(Number.isFinite(result.apcaLc)).toBe(true)
        // Advisory only: a contract passes on its WCAG ratio regardless of Lc.
        expect(result.passes).toBe(result.ratio >= result.minimum)
      }
    }
  })

  it('covers every scale and mode exactly once', () => {
    const keys = scales.map((scale) => `${scale.name}/${scale.mode}`)

    expect(new Set(keys).size).toBe(SCALE_NAMES.length * MODES.length)
  })
})

describe('gamut fitting at the pale end', () => {
  // Step 1 requests chroma 0.006 at L 0.993, which sRGB cannot hold; the fitted
  // value is 0.004. Recording the request instead would put a colour in the
  // config that never shipped.
  it('records the fitted chroma for a step sRGB cannot hold', () => {
    const swatch = buildScale('accent', 'light').steps[0]!

    expect(swatch.c).toBeCloseTo(0.004, 3)
    expect(swatch.c).toBeLessThan(0.2 * CHROMA_FRACTION.light[0]!)
  })
})

describe('on-solid', () => {
  // Hard-coding white here is a recurring bug in hand-built systems, so it is
  // computed per scale. At the curve's L 0.660 black wins on every scale, which
  // is exactly why the accent carries a constraint instead of an assumption.
  it('computes the winner for scales without a constraint', () => {
    for (const name of SCALE_NAMES) {
      const config: ScaleConfig = SCALES[name]
      if (config.solid) {
        continue
      }
      const scale = buildScale(name, 'light')
      const white = ratio(scale.steps[8]!.hex, '#ffffff')
      const black = ratio(scale.steps[8]!.hex, '#000000')

      expect(scale.onSolid.text).toBe(white >= black ? 'white' : 'black')
      expect(scale.onSolid.ratio).toBeCloseTo(Math.max(white, black), 6)
    }
  })

  it('takes white on the accent, which the constraint exists to allow', () => {
    expect(buildScale('accent', 'light').onSolid.text).toBe('white')
    expect(buildScale('accent', 'dark').onSolid.text).toBe('white')
  })
})

describe('the solid fill across modes', () => {
  // Step 9 is L 0.660 in both curves, so a primary button is the same colour in
  // light and dark. The accent's constraint has to preserve that rather than
  // apply to one mode only.
  it('gives the accent the same solid in both modes', () => {
    expect(buildScale('accent', 'dark').steps[8]?.hex).toBe(
      buildScale('accent', 'light').steps[8]?.hex
    )
  })

  it('keeps the dark scale ascending through the constrained solid', () => {
    const { steps } = buildScale('accent', 'dark')

    expect(steps[8]!.l).toBeGreaterThan(steps[7]!.l)
    expect(steps[9]!.l).toBeGreaterThan(steps[8]!.l)
  })
})
