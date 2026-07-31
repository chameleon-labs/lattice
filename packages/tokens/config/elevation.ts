/**
 * Theme-independent shadow recipes and the elevation signal table.
 *
 * The values are the outcome of a calibration recorded on issue #30, not taste.
 * Composited over each mode's page surface and measured with this system's own
 * contrast module, a shadow is worth 1.315:1 on light and 1.016:1 on dark at the
 * same alpha — and at 50% black the dark figure still only reaches 1.058:1.
 * There is no alpha at which a shadow becomes load-bearing on a dark surface,
 * which is why every level above `flat` also carries a surface step and a
 * border.
 *
 * The colour is neutral rather than tinted to the scale's hue 305. Measured, the
 * two differ by a contrast ratio of at most 1.019 — under 2%, on an edge that is
 * blurred by design.
 */

import type { ScaleName } from './scales.js'

export interface ShadowRecipe {
  /** Offsets, blur and spread in px. */
  readonly offsetX: number
  readonly offsetY: number
  readonly blur: number
  readonly spread: number
  /** Opacity of the neutral shadow colour, 0 to 1. */
  readonly alpha: number
}

export const SHADOWS = {
  small: { offsetX: 0, offsetY: 1, blur: 2, spread: 0, alpha: 0.1 },
  medium: { offsetX: 0, offsetY: 4, blur: 8, spread: -1, alpha: 0.12 },
  large: { offsetX: 0, offsetY: 12, blur: 24, spread: -4, alpha: 0.16 }
} as const satisfies Readonly<Record<string, ShadowRecipe>>

export type ShadowName = keyof typeof SHADOWS

/**
 * One elevation level.
 *
 * `surface` and `border` are step slugs from the semantic tier, so a role reads
 * as a sentence — `--lat-elevation-modal-border` is the grey scale's border
 * step — and resolves through the same per-scope indirection every other role
 * uses.
 *
 * `border` and `shadow` are optional because `flat` is the absence of both. A
 * `none`-valued token would invite a consumer to treat the absence as a value it
 * could interpolate or override, and there is nothing for it to name.
 */
export interface ElevationLevel {
  readonly level: string
  readonly surface: string
  readonly border?: string
  readonly shadow?: ShadowName
}

/**
 * Annotated rather than `as const`, matching `ROLE_ALIASES`. A const assertion
 * would give the array a union element type whose `flat` member has no `border`
 * or `shadow` property at all, and every `level.shadow` read in the generator
 * would then fail to compile.
 */
export const ELEVATION_LEVELS: readonly ElevationLevel[] = [
  { level: 'flat', surface: 'bg' },
  { level: 'raised', surface: 'bg-subtle', border: 'border-subtle', shadow: 'small' },
  { level: 'overlay', surface: 'bg-subtle', border: 'border', shadow: 'medium' },
  { level: 'modal', surface: 'component', border: 'border', shadow: 'large' }
]

/** Elevation surfaces and borders are grey; nothing here is accented. */
export const ELEVATION_SCALE: ScaleName = 'gray'
