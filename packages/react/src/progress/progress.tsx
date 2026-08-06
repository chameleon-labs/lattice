import type { CSSProperties, HTMLAttributes } from 'react'

/**
 * A determinate progress bar.
 *
 * Two things a caller would otherwise have to remember, and usually does not:
 *
 * **It cannot render unlabelled.** `label` is required. A bare
 * `role="progressbar"` announces a percentage with no indication of what is
 * progressing, which is worse than silence — the user hears "43 percent" and
 * has no way to find out of what.
 *
 * **The percentage is computed once, here.** A fill whose width is set from
 * one calculation while `aria-valuenow` is set from another is a bar that
 * eventually disagrees with itself. Both read the same clamped number.
 *
 * ### There is no indeterminate variant
 *
 * Deliberately. An indeterminate bar is, in every implementation, an animation
 * that runs until the work finishes — and `tests/css-contract.test.ts` forbids
 * exactly that: no `infinite`, nothing over five seconds. The reduced-motion
 * contract is not suspended because the thing moving happens to be a progress
 * bar; that contract is why `Skeleton` and `Toast` are still unbuilt.
 *
 * Work whose extent is genuinely unknown wants a component that names the step
 * it is on rather than implying a proportion it cannot compute — an
 * application-level pattern, not a system one, and not shipped here.
 */
export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Current progress, clamped into `0…max`. */
  value: number
  /** Defaults to 100, so `value` reads as a percentage unless stated otherwise. */
  max?: number
  /** What is progressing. Becomes the accessible name; required for that reason. */
  label: string
  /**
   * Spoken instead of the bare percentage — "step 3 of 6" rather than "50%".
   * Worth setting whenever the underlying unit is more meaningful than the
   * proportion, which for a step-based job it usually is.
   */
  valueText?: string
}

export function Progress({
  value,
  max = 100,
  label,
  valueText,
  className,
  style,
  ...props
}: ProgressProps) {
  // A negative `max` would make the ratio below meaningless and the ARIA range
  // invalid, so the floor is the smallest max that can express anything.
  const safeMax = max > 0 ? max : 100
  const clamped = Math.min(Math.max(value, 0), safeMax)
  const ratio = clamped / safeMax

  return (
    <div
      {...props}
      className={className === undefined ? 'lat-progress' : `lat-progress ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      {...(valueText === undefined ? {} : { 'aria-valuetext': valueText })}
      // A private custom property rather than an inline width: the stylesheet
      // keeps ownership of how the fill is drawn, and `--_`-prefixed names are
      // excluded from the token contract by design.
      style={{ ...style, '--_lat-progress': ratio } as CSSProperties}
    >
      <div className="lat-progress__fill" />
    </div>
  )
}
