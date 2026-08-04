import type { ComponentPropsWithRef, ReactNode } from 'react'

/**
 * The six chromatic scales, a neutral default, and the four severity levels.
 * Every variant is the same tinted triple — a 10-15% fill, a 20-25% border,
 * full-strength text — so a new variant is three custom-property
 * declarations in badge.css, never a new shape.
 *
 * The severity levels are their own variants rather than a mapping onto the
 * six chromatic scales above: `moderate` is amber (hue 84), and there is no
 * chromatic scale at that hue to borrow — the nearest candidate, `info`, is
 * blue (hue 232), which would break both the ramp's hue ordering and the
 * lightness safety net the severity tokens are built on. `minor` carries no
 * colour of its own and reads identically to `default`, but keeps its own
 * name so a caller labelling an impact level never has to know that its
 * lowest level happens to be neutral.
 */
export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'info'
  | 'success'
  | 'danger'
  | 'warning'
  | 'critical'
  | 'serious'
  | 'moderate'
  | 'minor'

export interface BadgeOptions {
  variant?: BadgeVariant
}

// `children` is required rather than optional, which is the whole guarantee:
// a badge that signalled by colour alone cannot be written.
export type BadgeProps = Omit<ComponentPropsWithRef<'span'>, 'children'> &
  BadgeOptions & { children: ReactNode }

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={className === undefined ? 'lat-badge' : `lat-badge ${className}`}
      data-variant={variant}
    />
  )
}
