/**
 * Four roles, because four is all the Figma bundle uses. The values are the
 * Tailwind v4 shadows it emits, stored as layers rather than CSS strings so the
 * stylesheet and the DTCG output render one source — and because `sm` and `lg`
 * are each two stacked layers, which one string cannot represent legibly.
 *
 * These shadows are pure black at 10–25% alpha, so over the `#0c0c14` page they
 * are close to invisible: the identity reads as flat in dark mode and leans on
 * the hairline instead, with `floating` the only one that carries. That ships as
 * delivered; it is recorded so a future change is a decision, not a discovery.
 *
 * Depth is never conveyed by shadow alone — every raised surface also carries a
 * hairline border, which is what survives forced-colors.
 */

/** One layer of a (possibly multi-layer) shadow, in pixels. */
export interface ShadowLayer {
  readonly offsetX: number
  readonly offsetY: number
  readonly blur: number
  readonly spread: number
  /** Alpha of the (always black) shadow colour, 0..1. */
  readonly alpha: number
}

export const SHADOWS = {
  sm: [
    { offsetX: 0, offsetY: 1, blur: 3, spread: 0, alpha: 0.1 },
    { offsetX: 0, offsetY: 1, blur: 2, spread: -1, alpha: 0.1 }
  ],
  lg: [
    { offsetX: 0, offsetY: 10, blur: 15, spread: -3, alpha: 0.1 },
    { offsetX: 0, offsetY: 4, blur: 6, spread: -4, alpha: 0.1 }
  ],
  '2xl': [{ offsetX: 0, offsetY: 25, blur: 50, spread: -12, alpha: 0.25 }]
} as const satisfies Record<string, readonly ShadowLayer[]>

export type ShadowName = keyof typeof SHADOWS

/**
 * `flat` is not an absence of styling but the positive statement that a surface
 * is distinguished by its hairline and fill, which is Lattice's default. It maps
 * to `'none'` because it has no shadow to point at.
 */
export const ELEVATION_ROLES = {
  /** Cards, panels, inputs, buttons. Hairline only. */
  flat: 'none',
  /** The segmented-control thumb. */
  raised: 'sm',
  /** Tooltip, popover, menu. */
  overlay: 'lg',
  /** The hero audit card. The only shadow that reads in dark mode. */
  floating: '2xl'
} as const satisfies Record<string, ShadowName | 'none'>
