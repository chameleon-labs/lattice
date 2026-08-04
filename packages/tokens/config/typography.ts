/**
 * Typography primitives.
 *
 * Instrument Sans and JetBrains Mono, self-hosted by this package (see
 * `assets/fonts/`). The stacks name the family the `@font-face` rules define,
 * then fall back to system faces of the same class.
 *
 * The scale is Meridian's own type specimen, plus the two micro sizes its
 * components use that the specimen does not list — 10px and 11px, which carry
 * every eyebrow, badge and table header in both demo pages.
 */

const SYSTEM_SANS = ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] as const

export const FONT_FAMILIES = {
  sans: ['Instrument Sans', ...SYSTEM_SANS],
  mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
} as const

export const FONT_SIZES = {
  /**
   * 9px — the source bundle's own smallest literal (`text-[9px]`), one rung
   * below the identity's signature 10px. It recurs across unrelated
   * components — a trust-bar stat's label and sub, an audit card's
   * timestamp — each of which previously absorbed it as a 1px-short stand-in
   * on `3xs` rather than carry its own primitive. Added once that stand-in
   * needed documenting a second time, rather than a third.
   */
  '4xs': 0.5625,
  /** 10px — eyebrows, badges, table headers. The identity's signature size. */
  '3xs': 0.625,
  /** 11px — metadata lines. */
  '2xs': 0.6875,
  xs: 0.75,
  sm: 0.875,
  base: 1,
  lg: 1.125,
  xl: 1.25,
  '2xl': 1.5,
  '3xl': 1.875,
  /** 36px — the CTA heading's `text-4xl`. */
  '4xl': 2.25,
  '5xl': 3,
  /** 60px — the hero `h1`'s `md:text-6xl`. */
  '6xl': 3.75
} as const

export const FONT_WEIGHTS = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const

/**
 * Tracking, in **em**.
 *
 * Previously rem, which was wrong for this property: tracking has to scale with
 * the text it tracks. The eyebrow's 0.2em at 10px is 2px; as rem it would be a
 * fixed 3.2px at every size, growing relative to the glyphs at each of the
 * sub-1rem sizes the mono roles use.
 */
export const LETTER_SPACINGS = {
  /** Display and headings. Meridian's `tracking-tight`. */
  tight: -0.025,
  normal: 0,
  /** Badges. `tracking-wider`. */
  wide: 0.05,
  /** Panel labels. `tracking-widest`. */
  wider: 0.1,
  /** Eyebrows. The literal `tracking-[0.2em]` the bundle writes out. */
  eyebrow: 0.2
} as const

export const LINE_HEIGHTS = {
  /** Display only. `leading-none`. */
  none: 1,
  /** Headings. `leading-[1.05]` on the hero. */
  tight: 1.05,
  snug: 1.25,
  /** Meridian's base-layer default for every heading and label. */
  normal: 1.5,
  relaxed: 1.625,
  /**
   * Controls. Meridian is Tailwind-based, and Tailwind pairs `text-sm` with an
   * absolute 20px line-height — a ratio of 1.4286 at 14px, which is what every
   * control in the bundle actually renders at. Prose leading (1.5, 1.625) makes
   * a single-line control 1–3px taller than the design and, because control rows
   * stretch to their tallest item, drags neighbouring controls with it.
   *
   * Written as the division, not a decimal literal: the pairing being
   * reproduced is "20px at 14px", and `20 / 14` says that directly, evaluates
   * to the closest double (1.4285714285714286), and multiplies back to
   * exactly 20 at 14px. A hand-truncated `1.428571` does not — it multiplies
   * back to 19.999994, which is precisely the kind of sub-pixel miss this
   * token exists to close. Do not "tidy" this into a decimal.
   */
  control: 20 / 14,
  /**
   * Compact mono controls. Tailwind pairs `text-xs` with its own absolute
   * 16px line-height — a *different* ratio from `text-sm`'s, 1.3333 at 12px,
   * because Tailwind pairs every size with its own leading rather than
   * sharing one across sizes. `caption` (`xs`/`snug`) is the nearest existing
   * step at 1.25 (15px) and is 1px short of this — close enough to read as a
   * plausible substitute, which is exactly how the `code`-for-`field`
   * mistake happened the first time. `SegmentedControl`'s label is the
   * bundle's one `text-xs` mono control; this is its dedicated pairing.
   *
   * Written as the division, not a decimal literal, for the same reason as
   * `control` above: `16 / 12` reproduces "16px at 12px" exactly; a
   * hand-truncated `1.333333` multiplies back to 15.999996. Do not "tidy"
   * this into a decimal.
   */
  compact: 16 / 12
} as const
