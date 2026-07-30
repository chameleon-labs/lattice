/**
 * The contrast contracts, and the separations that keep a corrected scale legible.
 *
 * These are the reason the build can fail. Each contract names a step, the step
 * it is measured against, and the WCAG 2.x ratio it must reach.
 */
export interface Contract {
  readonly step: number
  readonly reference: number
  readonly minimum: number
}

export const CONTRACTS: readonly Contract[] = [
  // Solid fill has to be distinguishable from the app background.
  { step: 9, reference: 1, minimum: 3.0 },
  // Both text steps are measured against the subtle background they sit on,
  // which is the worst case: step 2 is lighter than step 1 in dark mode and
  // darker in light mode.
  { step: 11, reference: 2, minimum: 4.5 },
  { step: 12, reference: 2, minimum: 4.5 }
]

/**
 * Minimum lightness separation between consecutive steps once a correction has
 * moved one of them.
 *
 * A correction to one step can collide with the next. Pinning the accent's solid
 * downward put step 10 at L 0.546 against step 11 at L 0.545 — solid-hover and
 * low-contrast text rendering as the same colour. These floors re-seat the steps
 * beneath a corrected one instead of reading them off the curve.
 *
 * Step 10 gets a narrower floor than the rest because it is *supposed* to sit
 * close to step 9 — it is the hover state of that fill, and coupling it tightly
 * is the point. Step 12 gets a wider one because it is the high-contrast text
 * step and must stay clearly clear of step 11.
 *
 * Applied as a ceiling rather than an assignment: a step keeps its curve value
 * unless the floor forces it further, so an uncorrected scale is untouched.
 */
export const SEPARATION = {
  /** Between step 9 and step 10. */
  hover: 0.03,
  /** Between step 10 and step 11. */
  text: 0.04,
  /** Between step 11 and step 12. */
  strongText: 0.08
} as const

/**
 * Resolution of the lightness solver. Finer than the third decimal the spec
 * reports, so a solved value is exact at the precision anyone reads it at.
 */
export const SOLVE_RESOLUTION = 1e-5
