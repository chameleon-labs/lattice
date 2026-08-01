import { Button as AriakitButton, type ButtonProps as AriakitButtonProps } from '@ariakit/react'
import type { ElementType } from 'react'

export type ButtonVariant = 'solid' | 'soft' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonTone = 'accent' | 'neutral' | 'danger'

export interface ButtonOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  tone?: ButtonTone
}

export type ButtonProps<T extends ElementType = 'button'> = AriakitButtonProps<T> & ButtonOptions

export function Button<T extends ElementType = 'button'>({
  variant = 'soft',
  size = 'md',
  tone = 'accent',
  className,
  ...props
}: ButtonProps<T>) {
  return (
    <AriakitButton
      {...props}
      className={className === undefined ? 'lat-button' : `lat-button ${className}`}
      data-variant={variant}
      data-size={size}
      data-tone={tone}
    />
  )
}
