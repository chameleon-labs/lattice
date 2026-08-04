/**
 * Theme-independent motion primitives.
 *
 * Durations are stored as the numeric part of a `ms` duration and easings as the
 * four-number tuple a `cubic-bezier()` takes, so the CSS and DTCG emitters format
 * the same source without parsing strings.
 *
 * What this file does **not** carry is reduced-motion behavior. Honouring
 * `prefers-reduced-motion` means removing transform and positional movement while
 * keeping opacity and colour feedback, and that is a decision about which
 * property a component transitions — something a value cannot know. It belongs to
 * the component layer, tracked on #11.
 */

/** The four control-point components a `cubic-bezier()` takes. */
export type EasingCurve = readonly [number, number, number, number]

/**
 * Motion.
 *
 * Meridian's five presets, from its documentation site's motion section.
 *
 * `expressive` is a duration and nothing else. Its listed easing is "spring",
 * which no CSS timing function reproduces, and Lattice does not take a
 * JavaScript animation dependency to provide one. The token records the 500ms
 * intent; a caller wanting true spring behaviour brings its own library. No
 * component in this system uses it.
 */
export const DURATIONS = {
  instant: 0,
  swift: 100,
  default: 200,
  deliberate: 350,
  expressive: 500
} as const satisfies Readonly<Record<string, number>>

/**
 * Two curves, because Meridian names two: `ease-out` for entrances and state
 * changes, `ease-in-out` for the deliberate tier.
 */
export const EASINGS = {
  out: [0, 0, 0.2, 1],
  'in-out': [0.4, 0, 0.2, 1]
} as const satisfies Readonly<Record<string, EasingCurve>>

export type DurationName = keyof typeof DURATIONS
export type EasingName = keyof typeof EASINGS
