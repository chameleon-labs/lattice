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
export const FONT_FAMILIES = {
  sans: "'Instrument Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
} as const

export const FONT_SIZES = {
  /** 10px — eyebrows, badges, table headers. The identity's signature size. */
  '3xs': { rem: 0.625 },
  /** 11px — metadata lines. */
  '2xs': { rem: 0.6875 },
  xs: { rem: 0.75 },
  sm: { rem: 0.875 },
  base: { rem: 1 },
  lg: { rem: 1.125 },
  xl: { rem: 1.25 },
  '2xl': { rem: 1.5 },
  '3xl': { rem: 1.875 },
  '5xl': { rem: 3 }
} as const

export const FONT_WEIGHTS = {
  regular: { value: 400 },
  medium: { value: 500 },
  semibold: { value: 600 },
  bold: { value: 700 }
} as const

export const LETTER_SPACINGS = {
  /** Display and headings. Meridian's `tracking-tight`. */
  tight: { em: -0.025 },
  normal: { em: 0 },
  /** Badges. `tracking-wider`. */
  wide: { em: 0.05 },
  /** Panel labels. `tracking-widest`. */
  wider: { em: 0.1 },
  /** Eyebrows. The literal `tracking-[0.2em]` the bundle writes out. */
  eyebrow: { em: 0.2 }
} as const

export const LINE_HEIGHTS = {
  /** Display only. `leading-none`. */
  none: { value: 1 },
  /** Headings. `leading-[1.05]` on the hero. */
  tight: { value: 1.05 },
  snug: { value: 1.25 },
  /** Meridian's base-layer default for every heading, label and control. */
  normal: { value: 1.5 },
  relaxed: { value: 1.625 }
} as const
