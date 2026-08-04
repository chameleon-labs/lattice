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

const SYSTEM_SANS = ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']

export const FONT_FAMILIES = {
  sans: ['Instrument Sans', ...SYSTEM_SANS],
  mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
} as const

export const FONT_SIZES = {
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
  '5xl': 3
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
  /** Meridian's base-layer default for every heading, label and control. */
  normal: 1.5,
  relaxed: 1.625
} as const
