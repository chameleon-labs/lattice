/**
 * Instrument Sans and JetBrains Mono, self-hosted (see `assets/fonts/`). Each
 * stack names the family the `@font-face` rules define, then falls back to
 * system faces of the same class.
 *
 * The scale is the Figma bundle's type specimen plus the two micro sizes its
 * components use but the specimen omits — 10px and 11px, which carry every
 * eyebrow, badge and table header in both demo pages.
 */

const SYSTEM_SANS = ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] as const;

export const FONT_FAMILIES = {
  sans: ['Instrument Sans', ...SYSTEM_SANS],
  mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
} as const;

export const FONT_SIZES = {
  /**
   * 9px — the bundle's smallest literal (`text-[9px]`), one rung below the
   * signature 10px. Recurs across unrelated components: a trust-bar stat's label
   * and sub, an audit card's timestamp.
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
  '6xl': 3.75,
} as const;

export const FONT_WEIGHTS = {regular: 400, medium: 500, semibold: 600, bold: 700} as const;

/**
 * Tracking, in **em**, because it has to scale with the text it tracks. The
 * eyebrow's 0.2em at 10px is 2px; as rem it would be a fixed 3.2px at every
 * size, growing relative to the glyphs at every sub-1rem size the mono roles use.
 */
export const LETTER_SPACINGS = {
  /** Display and headings. The Figma bundle's `tracking-tight`. */
  tight: -0.025,
  normal: 0,
  /** Badges. `tracking-wider`. */
  wide: 0.05,
  /** Panel labels. `tracking-widest`. */
  wider: 0.1,
  /** Eyebrows. The literal `tracking-[0.2em]` the bundle writes out. */
  eyebrow: 0.2,
} as const;

export const LINE_HEIGHTS = {
  /** Display only. `leading-none`. */
  none: 1,
  /** Headings. `leading-[1.05]` on the hero. */
  tight: 1.05,
  snug: 1.25,
  /** The Figma bundle's base-layer default for every heading and label. */
  normal: 1.5,
  relaxed: 1.625,
  /**
   * Controls. Tailwind pairs `text-sm` with an absolute 20px line-height, a
   * ratio of 1.4286 at 14px, which is what every control in the bundle renders
   * at. Prose leading (1.5, 1.625) makes a single-line control 1–3px taller, and
   * control rows stretch to their tallest item, so it drags neighbours with it.
   *
   * **Do not tidy this into a decimal.** `20 / 14` multiplies back to exactly 20
   * at 14px; a hand-truncated `1.428571` gives 19.999994, which is the sub-pixel
   * miss this token exists to close.
   */
  control: 20 / 14,
  /**
   * Compact mono controls — `SegmentedControl`'s label is the bundle's one
   * `text-xs` mono control. Tailwind pairs `text-xs` with 16px, a *different*
   * ratio from `text-sm`'s: 1.3333 at 12px. `caption` is the nearest existing
   * step at 1.25 (15px), 1px short — close enough to look like a substitute,
   * which is how the `code`-for-`field` mistake happened once already.
   *
   * A decimal here has the same problem as in `control` above: `1.333333`
   * multiplies back to 15.999996.
   */
  compact: 16 / 12,
} as const;
