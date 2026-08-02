/**
 * @vitest-environment node
 *
 * The Iridescent direction's gradient, held to the same contract as a flat fill.
 *
 * A gradient cannot be validated the way a swatch is, so the direction is built
 * to make validation tractable: both endpoints sit at the same lightness and
 * differ only in hue.
 *
 * What that does *not* buy is flat contrast. Measured against this pipeline,
 * contrast at fixed lightness falls as hue moves toward blue: at L 0.591 — the
 * lightness `scales.ts` pins the accent's solid to — hue 305 reaches 4.500:1
 * against white while hue 275 reaches only 4.338:1. Reducing chroma makes it
 * worse rather than better, sliding toward a mid-grey with less contrast against
 * white than the saturated colour had. Lightness is the lever; chroma is not.
 *
 * So both ends are pinned to the darker lightness the *worse* hue needs, with
 * margin. L 0.5823 is the exact solved boundary and measures 4.49997:1 — the
 * kind of value that satisfies a solver and fails a build.
 */
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../generate/contrast.js'
import { fitToGamut, formatHex, oklchToSrgb, parseHex } from '../generate/oklch.js'

const WHITE = parseHex('#ffffff')

/**
 * Both endpoints. Lightness and chroma are shared; only hue moves.
 *
 * 275 is not arbitrary — far enough from the accent's 305 to read as a shift,
 * and short of the 265 the tabstop system uses for its own brand, so the two
 * stay distinguishable.
 */
const LIGHTNESS = 0.575
const CHROMA = 0.2
const MAGENTA = { l: LIGHTNESS, c: CHROMA, h: 305 }
const VIOLET = { l: LIGHTNESS, c: CHROMA, h: 275 }

/** Samples across the interpolation, endpoints included. */
const SAMPLES = 61

const at = (step: number) => ({
  l: LIGHTNESS,
  c: CHROMA,
  h: MAGENTA.h + (VIOLET.h - MAGENTA.h) * (step / (SAMPLES - 1))
})

const hexOf = (color: { l: number; c: number; h: number }): string =>
  formatHex(oklchToSrgb(fitToGamut(color)))

const ratioOf = (color: { l: number; c: number; h: number }): number =>
  contrastRatio(oklchToSrgb(fitToGamut(color)), WHITE)

describe('the iridescent gradient', () => {
  it('holds white text clear of 4.5:1 on both endpoints', () => {
    expect(ratioOf(MAGENTA)).toBeGreaterThanOrEqual(4.5)
    expect(ratioOf(VIOLET)).toBeGreaterThanOrEqual(4.5)
  })

  it('holds it across the whole sweep, not only at the ends', () => {
    const failures = Array.from({ length: SAMPLES }, (_, step) => at(step))
      .map((color) => ({ hue: color.h, ratio: ratioOf(color) }))
      .filter((sample) => sample.ratio < 4.5)
      .map((sample) => `h ${sample.hue.toFixed(1)} → ${sample.ratio.toFixed(3)}:1`)

    expect(failures).toEqual([])
  })

  it('puts the worst point at the violet end rather than in the middle', () => {
    // Measured, not assumed. This is what makes endpoint validation meaningful
    // for this hue range — and the reason the sweep above is kept anyway is that
    // it was only ever established for this range.
    const ratios = Array.from({ length: SAMPLES }, (_, step) => ratioOf(at(step)))

    expect(Math.min(...ratios)).toBe(ratios[SAMPLES - 1])
  })

  it('pins the exact hexes the stylesheet uses', () => {
    // Not a tautology: `.storybook/directions/iridescent.css` hardcodes these
    // two strings, and this is what stops the stylesheet drifting from the
    // pipeline that justified it.
    expect({ magenta: hexOf(MAGENTA), violet: hexOf(VIOLET) }).toEqual({
      magenta: '#954fd5',
      violet: '#5b65ec'
    })
  })
})
