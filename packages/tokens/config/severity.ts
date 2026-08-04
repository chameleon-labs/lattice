/**
 * The severity ramp: four ordered levels for accessibility impact.
 *
 * Accessibility audit engines report impact on a four-level scale, and those
 * levels are **ordered**. Semantic `danger` and `warning` cannot express an
 * order — they are two categories, not four rungs — so severity gets its own
 * ramp.
 *
 * ## The usage rule
 *
 * **Colour never carries severity alone. Every severity mark ships with an icon
 * and a text label.** This is a rule, not a suggestion, and it is load-bearing
 * rather than defensive: in dark mode two adjacent levels differ by roughly
 * 0.5 ΔE under deuteranopia, which is indistinguishable. A reader who cannot
 * separate the hues has only the icon and the label.
 *
 * ## Why the two modes differ
 *
 * Light moves lightness *and* chroma monotonically, so the ramp reads as ordered
 * in greyscale, under CVD simulation, and in forced-colors mode.
 *
 * Dark holds lightness flat at 0.70 and lets hue and chroma carry the ramp.
 * Forcing lightness to climb with severity there produced a pale pink for
 * `critical` — making the most urgent level the least urgent-looking, which is
 * worse than losing the greyscale cue. The residual greyscale ordering dark
 * still has is incidental and about eight times weaker than light's; it is not
 * something to rely on, which is what the usage rule above exists for.
 */

import type { Mode } from './modes.js'

/** Ordered from least to most severe. The order is the point. */
export const SEVERITY_LEVELS = ['minor', 'moderate', 'serious', 'critical'] as const

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number]

export interface SeverityConfig {
  readonly level: SeverityLevel
  /**
   * Hue rotates yellow to red as severity rises. This is a *secondary* cue:
   * hue alone is what CVD takes away.
   */
  readonly hue: number
  /** Light mode moves both of these, which is what keeps the ramp ordered. */
  readonly light: { readonly l: number; readonly c: number }
}

export const SEVERITY: readonly SeverityConfig[] = [
  { level: 'minor', hue: 88, light: { l: 0.64, c: 0.13 } },
  { level: 'moderate', hue: 62, light: { l: 0.585, c: 0.15 } },
  { level: 'serious', hue: 36, light: { l: 0.53, c: 0.17 } },
  { level: 'critical', hue: 14, light: { l: 0.475, c: 0.19 } }
]

/**
 * Dark mode is flat in lightness and uniform in chroma, so only hue separates
 * the levels. See the module comment for why, and for what that costs.
 */
export const SEVERITY_DARK = { lightness: 0.7, chroma: 0.17 } as const

/** Every severity mark must clear this against its surface. */
export const SEVERITY_CONTRAST_MIN = 3

/**
 * The smallest greyscale gap the light ramp must keep between adjacent levels.
 *
 * Set from the measured ramp, whose tightest gap is 0.042. It exists so a change
 * that flattens the ramp toward dark mode's incidental 0.0055 fails rather than
 * quietly removing the one cue that survives without colour.
 */
export const SEVERITY_MIN_LUMINANCE_GAP: Record<Mode, number> = { light: 0.04, dark: 0 }
