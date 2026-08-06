import type { CSSProperties, HTMLAttributes } from 'react'

export interface ProgressProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'aria-label' | 'aria-labelledby'> {
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
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100
  const safeValue = Number.isFinite(value) ? value : 0
  const clamped = Math.min(Math.max(safeValue, 0), safeMax)
  const ratio = clamped / safeMax

  return (
    <div
      {...props}
      className={className === undefined ? 'lat-progress' : `lat-progress ${className}`}
      role="progressbar"
      aria-label={label}
      // Not redundant: aria-labelledby outranks aria-label, and TypeScript does
      // not check hyphenated JSX attributes, so the props type cannot stop one.
      aria-labelledby={undefined}
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
