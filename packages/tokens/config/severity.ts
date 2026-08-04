/**
 * The severity ramp.
 *
 * Taken from the impact badges on the Figma bundle's tabstop landing page. `minor`
 * carries no colour of its own — it uses `--lat-text-subtle`, which is what the
 * bundle does — so it is not anchored here.
 *
 * ## The rule that makes this safe
 *
 * Colour never carries severity alone. Every severity indicator ships an icon
 * **and** a text label. That is a hard rule, not a recommendation. The lightness
 * ordering below is a safety net for when hue fails — `serious` at hue 56 and
 * `moderate` at hue 84 are 28 degrees apart, which protanopia and deuteranopia
 * do not preserve — and the net is not the defence.
 */
import type { Mode } from './modes.js'

export const SEVERITY_LEVELS = ['critical', 'serious', 'moderate', 'minor'] as const

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number]

/**
 * `undefined` means the Figma bundle did not declare it and the generator must derive
 * it. Only light `moderate` is in that position.
 */
export const SEVERITY_ANCHORS: Record<Mode, Record<SeverityLevel, string | undefined>> = {
  dark: {
    critical: '#ff4d6a',
    serious: '#fb923c',
    moderate: '#fbbf24',
    minor: undefined
  },
  light: {
    critical: '#d41240',
    serious: '#ea580c',
    moderate: undefined,
    minor: undefined
  }
}

/**
 * How far light sits below dark for the same level.
 *
 * The Figma bundle declares two levels in both modes, so this is a choice rather than
 * the only available measurement:
 *
 * | level | dark L | light L | delta |
 * | --- | --- | --- | --- |
 * | critical | 0.678 | 0.556 | −0.122 |
 * | serious | 0.758 | 0.646 | **−0.112** |
 *
 * `serious` is the basis because it is `moderate`'s neighbour in both the ramp
 * and the colour wheel — serious sits at hue 56 and moderate at 84, both warm,
 * while critical is red at 16. How far a colour can drop in lightness between
 * modes depends on how much gamut headroom its hue has, so extrapolating from
 * the nearest hue is the smaller leap. Using critical's −0.122 instead would
 * put the derived value at L ≈ 0.715.
 *
 * Applied to dark `moderate` to place its light counterpart, so the derived
 * value sits where the palette's own arithmetic puts it rather than where it
 * looked right.
 */
export const LIGHT_LIGHTNESS_DELTA = -0.112
