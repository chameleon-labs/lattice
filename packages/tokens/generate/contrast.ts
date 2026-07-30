/**
 * Contrast metrics for the token pipeline.
 *
 * Two standards with deliberately unequal authority:
 *
 * - **WCAG 2.x** relative luminance and ratio are the **gate**. A contract that
 *   misses its minimum fails the build.
 * - **APCA** `Lc` is computed and reported and **never** gated on. It is
 *   perceptually more accurate, particularly in dark mode, but it is not a
 *   conformance standard, and the audit engines a consuming product is measured
 *   by report WCAG 2. A palette justified by a different standard than the one
 *   it will be audited against would be indefensible. Reporting both keeps the
 *   gap between them visible rather than hidden.
 */

import { srgbToLinear, type Rgb } from './oklch.js'

/**
 * Validates and clamps one channel.
 *
 * Clamping rather than refusing is the honest answer for a contrast metric: a
 * channel above 1 is shown by a display as 255, so the clamped value is what a
 * user actually sees. Callers measuring an OKLCH colour should still fit it to
 * the gamut first — this exists to absorb the float noise a fitted colour
 * carries, not to excuse measuring a colour that cannot ship.
 *
 * Non-finite is a different matter: NaN passes through Math.min/Math.max
 * untouched and would surface as a contract "failing" with an unreadable number
 * instead of naming the bug that produced it.
 */
function channel(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`channel is not finite: ${value}`)
  }

  return Math.min(1, Math.max(0, value))
}

/**
 * WCAG 2.x luminance coefficients, exactly as the standard publishes them.
 *
 * Not the values derived from the sRGB primaries via the XYZ matrix, which give
 * red 0.212639 rather than 0.2126 and shift a ratio by as much as 6e-4. axe-core
 * uses the published constants, so these have to: a gate that disagreed with the
 * engine auditing the product would pass a palette the audit then failed.
 *
 * They also sum to exactly 1, which is why every implementation agrees on greys
 * and only diverges on saturated colour.
 */
const WCAG_RED = 0.2126
const WCAG_GREEN = 0.7152
const WCAG_BLUE = 0.0722

/** WCAG 2.x relative luminance, 0 for black and 1 for white. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return (
    WCAG_RED * srgbToLinear(channel(r)) +
    WCAG_GREEN * srgbToLinear(channel(g)) +
    WCAG_BLUE * srgbToLinear(channel(b))
  )
}

/**
 * WCAG 2.x contrast ratio, from 1 to 21.
 *
 * Symmetric by definition — the standard puts the lighter colour on top — so
 * unlike {@link apcaLc} the arguments cannot be got the wrong way round.
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const first = relativeLuminance(a)
  const second = relativeLuminance(b)

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

// APCA 0.1.9 constants, matching Myndex's apca-w3 reference implementation.
// https://github.com/Myndex/apca-w3
//
// APCA has its own transfer function: a plain 2.4 power with no linear segment
// near black and no 0.055 offset, over its own coefficients. It is not WCAG
// luminance and the two are not interchangeable — for #111112 they differ by
// almost 4x (0.00152 against 0.00564), which is precisely the near-black region
// where the standards disagree about dark mode.
const APCA_EXPONENT = 2.4
const APCA_RED = 0.2126729
const APCA_GREEN = 0.7151522
const APCA_BLUE = 0.072175

// Perceptual exponents, one pair per polarity. Their asymmetry is the reason
// white-on-black and black-on-white have different magnitudes.
const NORMAL_BACKGROUND = 0.56
const NORMAL_TEXT = 0.57
const REVERSE_TEXT = 0.62
const REVERSE_BACKGROUND = 0.65

// Below this luminance APCA soft-clamps rather than letting the exponent run
// away, modelling the flare that stops a display from reaching true black.
const BLACK_THRESHOLD = 0.022
const BLACK_CLAMP_EXPONENT = 1.414

const SCALE = 1.14
const LOW_OFFSET = 0.027

// LOW_CLIP discards a result too small to mean anything: APCA reports exactly 0
// rather than a fraction of an Lc, because a fraction would imply a usable
// difference where there is none.
const LOW_CLIP = 0.1

// An early exit for luminances too close to separate, kept for parity with
// apca-w3 so the two read the same side by side.
//
// It is redundant here, and provably so rather than merely untested: sweeping the
// whole luminance range, the largest |SAPC| reachable while |dY| is under this
// threshold is 0.0526, so LOW_CLIP already swallows every case with roughly a 2x
// margin. Removing this line changes no result, which means no test can kill it —
// noted so nobody spends an afternoon trying to write one. It earns its place only
// if LOW_CLIP is ever lowered, at which point it becomes load-bearing again.
const MIN_DELTA_Y = 0.0005

function apcaLuminance({ r, g, b }: Rgb): number {
  return (
    APCA_RED * channel(r) ** APCA_EXPONENT +
    APCA_GREEN * channel(g) ** APCA_EXPONENT +
    APCA_BLUE * channel(b) ** APCA_EXPONENT
  )
}

function softClampBlack(luminance: number): number {
  return luminance > BLACK_THRESHOLD
    ? luminance
    : luminance + (BLACK_THRESHOLD - luminance) ** BLACK_CLAMP_EXPONENT
}

/**
 * APCA lightness contrast `Lc`, roughly -108 to 106.
 *
 * **Advisory only — never gate a build on this.** See the module comment.
 *
 * The sign carries the polarity: **positive** for dark text on a light
 * background, **negative** for light text on a dark one. The magnitudes are not
 * mirror images, because each polarity has its own exponents, so the argument
 * order is part of the answer rather than a convention.
 */
export function apcaLc(text: Rgb, background: Rgb): number {
  const textLuminance = apcaLuminance(text)
  const backgroundLuminance = apcaLuminance(background)

  if (Math.abs(backgroundLuminance - textLuminance) < MIN_DELTA_Y) {
    return 0
  }

  if (backgroundLuminance > textLuminance) {
    const contrast =
      (backgroundLuminance ** NORMAL_BACKGROUND -
        softClampBlack(textLuminance) ** NORMAL_TEXT) *
      SCALE

    return contrast < LOW_CLIP ? 0 : (contrast - LOW_OFFSET) * 100
  }

  const contrast =
    (softClampBlack(backgroundLuminance) ** REVERSE_BACKGROUND -
      textLuminance ** REVERSE_TEXT) *
    SCALE

  return contrast > -LOW_CLIP ? 0 : (contrast + LOW_OFFSET) * 100
}
