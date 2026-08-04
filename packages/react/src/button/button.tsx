import { Button as AriakitButton, type ButtonProps as AriakitButtonProps } from '@ariakit/react'
import type { ElementType } from 'react'

/**
 * Meridian's five variants.
 *
 * This replaces the previous `variant × tone` matrix. A neutral button is
 * `secondary`; a dangerous one is `destructive`. Meridian names five buttons and
 * this component offers five, because a system that follows a design strictly
 * cannot also offer combinations the design never drew.
 *
 * `destructive` is a *tinted* button — danger at 10% with a 20% border and
 * full-strength danger text — not a solid red fill. That is what the design
 * shows, and it is what keeps a destructive action from outweighing the primary
 * one on the same row.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonOptions {
  variant?: ButtonVariant
  size?: ButtonSize
}

export type ButtonProps<T extends ElementType = 'button'> = AriakitButtonProps<T> & ButtonOptions

export function Button<T extends ElementType = 'button'>({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonProps<T>) {
  return (
    <AriakitButton
      {...props}
      className={className === undefined ? 'lat-button' : `lat-button ${className}`}
      data-variant={variant}
      data-size={size}
    />
  )
}
