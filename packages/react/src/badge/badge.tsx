import type { ComponentPropsWithRef, ReactNode } from 'react'

/**
 * Four semantic tones plus the four severity levels.
 *
 * The severity names are here so tabstop can pass an axe impact string straight
 * through — `<Badge tone={violation.impact}>` — rather than maintaining a
 * mapping that could drift from the ramp the token system already publishes.
 */
export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'critical'
  | 'serious'
  | 'moderate'
  | 'minor'

export interface BadgeOptions {
  tone?: BadgeTone
}

// `children` is required rather than optional, which is the whole guarantee:
// a badge that signalled by colour alone cannot be written.
export type BadgeProps = Omit<ComponentPropsWithRef<'span'>, 'children'> &
  BadgeOptions & { children: ReactNode }

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={className === undefined ? 'lat-badge' : `lat-badge ${className}`}
      data-tone={tone}
    />
  )
}
