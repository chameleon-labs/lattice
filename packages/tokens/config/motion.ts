/**
 * Values are stored unformatted — a bare number of milliseconds, a bare
 * `cubic-bezier()` tuple — so the CSS and DTCG emitters format one source rather
 * than parse strings.
 *
 * Reduced-motion behaviour is deliberately not here. Honouring
 * `prefers-reduced-motion` means dropping transform and positional movement
 * while keeping opacity and colour, which is a decision about *which property*
 * a component transitions and cannot be expressed as a value. See #11.
 */

/** The four control-point components a `cubic-bezier()` takes. */
export type EasingCurve = readonly [number, number, number, number]

/**
 * The Figma bundle's five presets, from its documentation site's motion section.
 *
 * `expressive` is a duration with no easing: the bundle lists "spring", which no
 * CSS timing function reproduces and which is not worth a JavaScript animation
 * dependency. The token records the 500ms intent and nothing here uses it.
 *
 * `instant` exists so "must not animate" can be said with a token rather than by
 * omitting one.
 */
export const DURATIONS = {
  instant: 0,
  swift: 100,
  default: 200,
  deliberate: 350,
  expressive: 500
} as const satisfies Readonly<Record<string, number>>

/**
 * Two curves, because Lattice names two: `ease-out` for entrances and state
 * changes, `ease-in-out` for the deliberate tier.
 */
export const EASINGS = {
  out: [0, 0, 0.2, 1],
  'in-out': [0.4, 0, 0.2, 1]
} as const satisfies Readonly<Record<string, EasingCurve>>

export type DurationName = keyof typeof DURATIONS
export type EasingName = keyof typeof EASINGS
