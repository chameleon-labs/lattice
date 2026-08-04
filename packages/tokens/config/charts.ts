/**
 * Chart palettes: one categorical, one sequential.
 *
 * Two different jobs. The categorical palette distinguishes unordered series
 * from one another; the sequential ramp encodes magnitude along a single hue.
 * Using either for the other's job is the most common data-visualisation error,
 * so they are separate palettes with separate checks.
 *
 * Like every other colour here these are declared in OKLCH and generated, not
 * pasted. The hues are the outcome of enumerating all 5,040 orderings with violet
 * fixed in slot 1 and validating each in both modes; that search is history, and
 * what it produced is config.
 */

import type { Mode } from './modes.js'

export type Tier = 'hi' | 'lo'

/**
 * The two lightness tiers adjacent slots alternate between.
 *
 * Separation is carried by **lightness, not hue**, which is what survives
 * protanopia and deuteranopia — a palette separated by hue alone collapses under
 * either. The high tier is mode-invariant, so half the palette is literally the
 * same colour in both themes.
 */
export const TIERS: Record<Tier, Record<Mode, number>> = {
  hi: { light: 0.63, dark: 0.63 },
  lo: { light: 0.545, dark: 0.565 }
}

/**
 * Requested chroma, uniform across the palette. Hues sRGB cannot hold this
 * saturated are fitted down — aqua lands at 0.108 and yellow at 0.112 — which is
 * why the chroma floor is a check rather than an assumption.
 */
export const CATEGORICAL_CHROMA = 0.17

export interface CategoricalSlot {
  /** 1-based. The order is fixed and never cycled. */
  readonly slot: number
  readonly name: string
  readonly hue: number
  readonly tier: Tier
}

export const CATEGORICAL: readonly CategoricalSlot[] = [
  { slot: 1, name: 'violet', hue: 305, tier: 'hi' },
  { slot: 2, name: 'orange', hue: 45, tier: 'lo' },
  { slot: 3, name: 'aqua', hue: 195, tier: 'hi' },
  { slot: 4, name: 'yellow', hue: 95, tier: 'lo' },
  { slot: 5, name: 'magenta', hue: 345, tier: 'hi' },
  { slot: 6, name: 'green', hue: 158, tier: 'lo' },
  { slot: 7, name: 'blue', hue: 250, tier: 'hi' },
  { slot: 8, name: 'red', hue: 12, tier: 'lo' }
]

/**
 * How many leading slots stay separable when every pair is compared, not just
 * neighbours.
 *
 * Bars, lines and stacks only need adjacent separation. Scatter, bubble and
 * small-multiples put any two slots side by side, and past three the palette
 * cannot hold that — fold the tail into "Other" or facet instead.
 */
export const ALL_PAIRS_CAP = 3

/** The sequential ramp: one hue, the brand's, from pale to deep. */
export const SEQUENTIAL_HUE = 305

export interface SequentialStep {
  /** Named on the 100..700 convention rather than the 1..12 step contract. */
  readonly step: number
  readonly l: number
  readonly c: number
}

export const SEQUENTIAL: readonly SequentialStep[] = [
  { step: 100, l: 0.93, c: 0.05 },
  { step: 200, l: 0.86, c: 0.075 },
  { step: 300, l: 0.78, c: 0.1 },
  { step: 400, l: 0.7, c: 0.125 },
  { step: 500, l: 0.62, c: 0.15 },
  { step: 600, l: 0.53, c: 0.175 },
  { step: 700, l: 0.42, c: 0.2 }
]

/**
 * Where an **ordinal** encoding clamps the ramp.
 *
 * The full range is for sequential encoding, where the palest step may recede
 * into the surface without harm. Ordinal marks each have to read as a mark, so
 * light starts no lighter than 300 and dark goes no darker than 600.
 */
export const ORDINAL_CLAMP: Record<Mode, number> = { light: 300, dark: 600 }

/**
 * The surfaces the palettes are validated against: gray-1 in each mode.
 *
 * Charts are drawn on the app background, so this is the real comparison rather
 * than a convenient white.
 */
export const CHART_SURFACES: Record<Mode, string> = { light: '#fdfdfd', dark: '#111112' }

/**
 * Thresholds for the palette checks.
 *
 * ΔE is Euclidean distance in OKLab times 100, measured against the
 * Machado-Oliveira-Fernandes simulation at severity 1.0. The simulation model is
 * part of the threshold, not an implementation detail: swapping in a different
 * one moves borderline pairs and would need these recalibrated.
 */
export const CHECKS = {
  /** OKLCH lightness must stay inside the mode's band. */
  band: { light: [0.43, 0.77], dark: [0.48, 0.67] } as Record<Mode, readonly [number, number]>,
  /** Below this chroma a hue reads as grey. */
  chromaFloor: 0.1,
  /** Target separation under protanopia and deuteranopia. */
  cvdTarget: 8,
  /**
   * Below the target but at or above this is legal *only* with a secondary
   * encoding — direct labels, gaps or texture — so it warns rather than fails.
   */
  cvdFloor: 6,
  /**
   * Normal vision is a hard gate. The CVD checks protect dichromat readers; this
   * protects everyone else, and a secondary encoding does not excuse it.
   */
  normalFloor: 15,
  /** WCAG ratio against the chart surface. */
  contrastMin: 3,
  /** Minimum lightness gap between adjacent sequential steps. */
  ordinalMinDeltaL: 0.06,
  /** The palest ordinal step still has to read against the surface. */
  ordinalLightFloor: 2
} as const
