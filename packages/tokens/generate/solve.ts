/**
 * Solving a lightness against a contrast target.
 *
 * The correction half of the rule: the shared curve is the default, and this runs
 * only where a contract would otherwise fail.
 */

import { SOLVE_RESOLUTION } from '../config/contracts.js'
import { contrastRatio } from './contrast.js'
import { fitToGamut, formatHex, oklchToSrgb, parseHex, type Oklch } from './oklch.js'

/** A requested colour, resolved to what sRGB can actually show. */
export interface Shipped {
  readonly oklch: Oklch
  readonly hex: string
}

/**
 * Fits a requested colour into sRGB and reports it alongside the hex it emits.
 *
 * Every measurement in the pipeline goes through here, so a contract is always
 * checked against the colour that ships rather than the one that was asked for.
 * The two differ by up to 0.09 of a ratio point, which is enough to decide a
 * boundary case.
 */
export function ship(request: Oklch): Shipped {
  const fitted = fitToGamut(request)

  return { oklch: fitted, hex: formatHex(oklchToSrgb(fitted)) }
}

export interface SolveRequest {
  /** Requested chroma, before gamut fitting. */
  readonly chroma: number
  readonly hue: number
  /** The colour the contract measures against. */
  readonly reference: string
  readonly minimum: number
  /** The curve's lightness, where the search starts. */
  readonly from: number
  /**
   * The lightness the search may run to: 0 in light mode, 1 in dark. Contrast
   * against the reference rises as lightness travels this way.
   */
  readonly limit: number
}

/**
 * Finds the lightness closest to the curve that meets the minimum, or
 * `undefined` if even the limit cannot reach it.
 *
 * Returns the curve's own value untouched when it already passes, which is what
 * makes a correction the exception rather than the rule.
 *
 * Binary search assumes contrast rises monotonically from `from` toward `limit`.
 * It does, with one wrinkle: gamut fitting reduces chroma as lightness moves,
 * which nudges the ratio too. The nudge is far smaller than the lightness effect
 * driving it, so the ordering holds.
 */
export function solveLightness(request: SolveRequest): number | undefined {
  const { chroma, hue, reference, minimum, from, limit } = request
  const against = parseHex(reference)
  const meets = (l: number): boolean =>
    contrastRatio(parseHex(ship({ l, c: chroma, h: hue }).hex), against) >= minimum

  if (meets(from)) {
    return from
  }
  if (!meets(limit)) {
    return undefined
  }

  let fails = from
  let passes = limit

  while (Math.abs(passes - fails) > SOLVE_RESOLUTION) {
    const midpoint = (fails + passes) / 2

    if (meets(midpoint)) {
      passes = midpoint
    } else {
      fails = midpoint
    }
  }

  return passes
}
