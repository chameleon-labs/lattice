/**
 * Theme-independent motion primitives.
 *
 * Values come from the approved motion spec. Durations are stored as the numeric
 * part of a `ms` duration and easings as the four-number tuple a `cubic-bezier()`
 * takes, so the CSS and DTCG emitters format the same source without parsing
 * strings.
 *
 * The ceiling is deliberate: nothing here exceeds `400ms`, which is the point at
 * which a transition stops reading as feedback and starts reading as a wait.
 * `instant` exists so a state change that must not animate can say so with a
 * token rather than by omitting one.
 *
 * What this file does **not** carry is reduced-motion behavior. Honouring
 * `prefers-reduced-motion` means removing transform and positional movement while
 * keeping opacity and colour feedback, and that is a decision about which
 * property a component transitions — something a value cannot know. It belongs to
 * the component layer, tracked on #11.
 */

/** The four control-point components a `cubic-bezier()` takes. */
export type EasingCurve = readonly [number, number, number, number]

export const DURATIONS = {
  instant: 0,
  fast: 100,
  base: 150,
  slow: 250,
  slower: 400
} as const satisfies Readonly<Record<string, number>>

export const EASINGS = {
  standard: [0.2, 0, 0, 1],
  entrance: [0, 0, 0, 1],
  exit: [0.3, 0, 1, 1]
} as const satisfies Readonly<Record<string, EasingCurve>>

export type DurationName = keyof typeof DURATIONS
export type EasingName = keyof typeof EASINGS
