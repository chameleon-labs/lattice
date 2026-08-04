import type { ComponentPropsWithRef } from 'react'

export interface InputOptions {
  /** Sets `aria-invalid`. `TextField` passes this for you when it renders an error. */
  invalid?: boolean
}

// Meridian's fields are one size everywhere in the bundle — no variant of
// Input renders at more than one size, unlike Button's sm/md/lg. Offering a
// size knob the design never turns is worse than not offering it, so there is
// no custom `size` prop here; the native `size` attribute (visible character
// width) passes through untouched.
export type InputProps = ComponentPropsWithRef<'input'> & InputOptions

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={className === undefined ? 'lat-input' : `lat-input ${className}`}
      aria-invalid={invalid ? true : undefined}
    />
  )
}
