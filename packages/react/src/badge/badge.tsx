import type { ComponentPropsWithRef, ReactNode } from 'react'

/**
 * The six chromatic scales plus a neutral default. Every variant is the same
 * tinted triple — a 10-15% fill, a 20-25% border, full-strength text — so a
 * new variant is three custom-property declarations in badge.css, never a new
 * shape.
 */
export type BadgeVariant = 'default' | 'primary' | 'info' | 'success' | 'danger' | 'warning'

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
