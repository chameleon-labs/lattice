import type { ComponentPropsWithRef } from 'react'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputOptions {
  size?: InputSize
  /** Sets `aria-invalid`. `TextField` passes this for you when it renders an error. */
  invalid?: boolean
}

// `size` is omitted from the native props because HTML's size attribute means
// "visible character width", which is a different idea from this system's size
// scale and would silently win at the DOM level.
export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> & InputOptions

export function Input({ size = 'md', invalid = false, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={className === undefined ? 'lat-input' : `lat-input ${className}`}
      aria-invalid={invalid ? true : undefined}
      data-size={size}
    />
  )
}
