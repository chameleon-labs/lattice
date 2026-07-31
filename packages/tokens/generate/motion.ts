/**
 * Turning the reviewed motion values into the two artefacts.
 *
 * Motion is its own module rather than an extension of layout because DTCG gives
 * duration and cubic Bézier tokens different shapes — a duration carries a
 * `{ value, unit }` object, an easing a bare four-number array — and a generic
 * dimension emitter would have to erase that distinction to hold both.
 *
 * Nothing here emits a `prefers-reduced-motion` block or a transition reset. A
 * token package publishes values; which property a component transitions, and
 * therefore what reducing motion should strip, is only knowable at the component
 * layer.
 */

import {
  DURATIONS,
  EASINGS,
  type DurationName,
  type EasingCurve,
  type EasingName
} from '../config/motion.js'

/** A DTCG duration token. */
export interface DurationToken {
  readonly $type: 'duration'
  readonly $value: {
    readonly value: number
    readonly unit: 'ms'
  }
}

/** A DTCG cubic Bézier token: the four control-point components, unwrapped. */
export interface CubicBezierToken {
  readonly $type: 'cubicBezier'
  readonly $value: EasingCurve
}

export interface MotionTokenGroups {
  readonly duration: Readonly<Record<DurationName, DurationToken>>
  readonly easing: Readonly<Record<EasingName, CubicBezierToken>>
}

export const MOTION_PRIMITIVE_COUNTS = {
  duration: Object.keys(DURATIONS).length,
  easing: Object.keys(EASINGS).length
} as const

export const MOTION_PRIMITIVE_COUNT = Object.values(MOTION_PRIMITIVE_COUNTS).reduce(
  (total, count) => total + count,
  0
)

const durationToken = (value: number): DurationToken => ({
  $type: 'duration',
  $value: { value, unit: 'ms' }
})

const easingToken = (value: EasingCurve): CubicBezierToken => ({
  $type: 'cubicBezier',
  $value: value
})

const durationTokens = (): MotionTokenGroups['duration'] =>
  Object.fromEntries(
    Object.entries(DURATIONS).map(([name, value]) => [name, durationToken(value)])
  ) as MotionTokenGroups['duration']

const easingTokens = (): MotionTokenGroups['easing'] =>
  Object.fromEntries(
    Object.entries(EASINGS).map(([name, value]) => [name, easingToken(value)])
  ) as MotionTokenGroups['easing']

export function motionCss(): string {
  const durations = Object.entries(DURATIONS)
    .map(([name, value]) => `  --lat-duration-${name}: ${value}ms;`)
    .join('\n')
  const easings = Object.entries(EASINGS)
    .map(([name, value]) => `  --lat-easing-${name}: cubic-bezier(${value.join(', ')});`)
    .join('\n')

  return `${durations}\n${easings}`
}

export function motionTokens(): MotionTokenGroups {
  return {
    duration: durationTokens(),
    easing: easingTokens()
  }
}
