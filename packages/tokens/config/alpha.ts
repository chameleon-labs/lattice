/**
 * The alpha tier.
 *
 * Lattice's edges and washes are not scale steps — they are white or black at a
 * low alpha, so an edge composites over whatever surface it lies on. Two cards
 * nested inside one another therefore draw two visibly different greys from one
 * token, which an opaque step cannot do.
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
 * The tinted triple.
 *
 * The accent runs richer than the status scales — `bg-primary/15 …
 * border-primary/25` against `bg-[#38bdf8]/10 … border-[#38bdf8]/20` — because
 * chartreuse at 10% over a near-black surface is close to invisible.
 */
export const TINT_FRACTIONS = {
  accent: { fill: 0.15, border: 0.25 },
  default: { fill: 0.1, border: 0.2 }
} as const

/**
 * The focus ring, anchored per mode rather than derived from the accent solid.
 *
 * It used to be `--lat-solid` at 40%, which is what the reference design does
 * (`ring-primary/40`). In light mode that measured **1.55:1** against a card
 * and 1.50 against the page, against the 3:1 SC 1.4.11 requires — and unlike
 * the other accepted contrast failures, a focus ring is a keyboard user's only
 * means of orientation, with no second cue carrying it. See issue #47.
 *
 * ## Why the modes are shaped differently
 *
 * **Light is opaque**, because at 40% over a near-white surface, 60% of what
 * gets measured *is* the surface. No green reaches 3:1 at that alpha — `#4f7300`
 * only lifts it to 1.80 — so the alpha, not the hue, is the binding constraint.
 * Opaque `#4f7300` measures 4.89 against the page, 5.55 against a card and 4.56
 * against a field.
 *
 * **Dark keeps its alpha**, and this is not an inconsistency left unfixed. A
 * translucent ring composites with whatever it is drawn on, so it tracks the
 * surface — on dark that holds it at 3.17–3.20 across all three surfaces.
 * Anchoring dark opaque at the same rendered colour *loses* that adaptation and
 * drops the field case to 2.93, introducing a failure while fixing nothing.
 *
 * ## Why it is anchored rather than derived
 *
 * `--lat-solid` was being asked to be a legible fill, legible text, a tint base
 * *and* a 3:1 focus indicator at once. Those constraints have no common
 * solution, which is why this defect resisted every attempt to fix it by
 * changing the accent. Anchoring the ring separates them: focus contrast can be
 * corrected without moving the brand colour, and the brand colour can move
 * without silently breaking focus.
 *
 * Dark's hex equals the dark accent solid today. That is a coincidence of value,
 * not a dependency — it is written here so a future change to the accent does
 * not drag the focus ring with it.
 */
export const FOCUS_RING = {
  light: { hex: '#4f7300', alpha: 1 },
  dark: { hex: '#cff23a', alpha: 0.4 }
} as const satisfies Readonly<Record<'light' | 'dark', { hex: string; alpha: number }>>
