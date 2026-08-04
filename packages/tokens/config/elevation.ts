/**
 * Elevation.
 *
 * Four roles, replacing the calibrated multi-level model, because four is all
 * Meridian uses. Values are the Tailwind v4 shadows the bundle emits, verbatim.
 *
 * ## Recorded, not fixed
 *
 * These shadows are pure black at 10-25% alpha. Over Meridian's `#0c0c14` page
 * they are close to invisible, which is why the identity reads as flat in dark
 * mode and leans on the hairline instead; `floating` is the only one that
 * carries. That is the design as delivered and it ships as delivered. The
 * observation is written down so a future change is a decision rather than a
 * discovery.
 *
 * Depth is not conveyed by shadow alone anywhere in this system: every raised
 * surface also carries a hairline border, which is what survives forced-colors.
 */
export const SHADOWS = {
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
} as const

export type ShadowName = keyof typeof SHADOWS

/**
 * What each role is for. `flat` is not an absence of styling — it is the
 * positive statement that a surface is distinguished by its hairline and its
 * fill, which is Meridian's default.
 */
export const ELEVATION_ROLES = {
  /** Cards, panels, inputs, buttons. Hairline only. */
  flat: 'none',
  /** The segmented-control thumb. */
  raised: SHADOWS.sm,
  /** Tooltip, popover, menu. */
  overlay: SHADOWS.lg,
  /** The hero audit card. The only shadow that reads in dark mode. */
  floating: SHADOWS['2xl']
} as const satisfies Record<string, string>
