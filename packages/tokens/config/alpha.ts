/**
 * Edges and washes are white or black at a low alpha rather than scale steps, so
 * an edge composites over whatever surface it lies on: two nested cards draw two
 * visibly different greys from one token, which an opaque step cannot do.
 *
 * Every fraction here appears literally in the Figma bundle. They are not tuned.
 */
import type { Mode } from './modes.js'

/** The channel each mode's alpha layers are drawn from. */
export const ALPHA_CHANNEL: Record<Mode, string> = {
  dark: '255 255 255',
  light: '0 0 0'
}

/** Resting edge. `border-white/[0.07]` and `border-black/[0.08]` in the bundle. */
export const HAIRLINE: Record<Mode, number> = { dark: 0.07, light: 0.08 }

/** Hover edge. `hover:border-white/15`. */
export const HAIRLINE_STRONG = 0.15

/** Hover fill. `hover:bg-foreground/5`. */
export const WASH = 0.05

/**
 * The accent runs richer than the status scales — `bg-primary/15 border-primary/25`
 * against `bg-[#38bdf8]/10 border-[#38bdf8]/20` — because chartreuse at 10% over
 * a near-black surface is close to invisible.
 */
export const TINT_FRACTIONS = {
  accent: { fill: 0.15, border: 0.25 },
  default: { fill: 0.1, border: 0.2 }
} as const

/**
 * Anchored per mode rather than derived from `--lat-solid`, which was being
 * asked to be a legible fill, legible text, a tint base and a 3:1 focus
 * indicator at once — constraints with no common solution. At `ring-primary/40`,
 * what the reference design does, light measured **1.55:1** against a card
 * where SC 1.4.11 needs 3:1. See #47.
 *
 * **Light is opaque** because at 40% over a near-white surface the surface is
 * most of what gets measured: no green reaches 3:1 at that alpha, `#4f7300`
 * only lifting it to 1.80. Opaque it measures 4.89 on the page, 5.55 on a card,
 * 4.56 on a field.
 *
 * **Dark keeps its alpha** deliberately. A translucent ring composites with what
 * it is drawn on and so tracks the surface, holding 3.17–3.20 across all three;
 * anchoring dark opaque at the same rendered colour loses that and drops the
 * field case to 2.93.
 *
 * Dark's hex equals the dark accent solid today by coincidence, not dependency —
 * written out so a future change to the accent does not drag focus with it.
 */
export const FOCUS_RING = {
  light: { hex: '#4f7300', alpha: 1 },
  dark: { hex: '#cff23a', alpha: 0.4 }
} as const satisfies Readonly<Record<'light' | 'dark', { hex: string; alpha: number }>>
