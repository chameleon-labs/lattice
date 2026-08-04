/**
 * The alpha tier.
 *
 * Meridian's edges and washes are not scale steps — they are white or black at a
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
 * The focus ring.
 *
 * Meridian declares `--ring` at 0.35/0.30 but its components focus with
 * `ring-primary/40`. The value components actually use is the one emitted, since
 * a token nobody reaches for guarantees nothing.
 *
 * Recorded consequence: in light mode this lands at 1.55:1 against the card,
 * below the 3:1 that SC 1.4.11 requires of a focus indicator. It ships as
 * delivered — see the spec's §9 ledger.
 */
export const FOCUS_RING_ALPHA = 0.4
