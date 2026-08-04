/**
 * Elevation.
 *
 * Four roles, replacing the calibrated multi-level model, because four is all
 * the Figma bundle uses. Values are the Tailwind v4 shadows the bundle emits, stored
 * as data rather than as CSS strings.
 *
 * ## Why layers, not strings
 *
 * Stored structurally rather than as CSS strings so the stylesheet and the
 * DTCG output are two renderings of one source. A string would have forced
 * either a parser or a second hand-maintained copy — and `sm` and `lg` are
 * each two stacked layers, which a single CSS string cannot represent as
 * anything other than an opaque blob.
 *
 * ## Recorded, not fixed
 *
 * These shadows are pure black at 10-25% alpha. Over Lattice's `#0c0c14` page
 * they are close to invisible, which is why the identity reads as flat in dark
 * mode and leans on the hairline instead; `floating` is the only one that
 * carries. That is the design as delivered and it ships as delivered. The
 * observation is written down so a future change is a decision rather than a
 * discovery.
 *
 * Depth is not conveyed by shadow alone anywhere in this system: every raised
 * surface also carries a hairline border, which is what survives forced-colors.
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
 * What each role is for. `flat` is not an absence of styling — it is the
 * positive statement that a surface is distinguished by its hairline and its
 * fill, which is Lattice's default. It maps to `'none'` rather than a
 * `ShadowName` because it has no shadow to point at.
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
