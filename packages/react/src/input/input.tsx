import type { ComponentPropsWithRef, ReactNode } from 'react'

export interface InputOptions {
  /** Sets `aria-invalid`. `TextField` passes this for you when it renders an error. */
  invalid?: boolean
  /** Rendered inside the field, before the control. A decorative icon here must carry `aria-hidden`. */
  addonStart?: ReactNode
  /** Rendered inside the field, after the control. */
  addonEnd?: ReactNode
  /**
   * Applied to the `<input>` itself, not the wrapper. `className` reaches
   * the wrapper — the box a caller positions or sizes — so this is the
   * escape hatch for the rare case a caller needs to reach the control.
   */
  inputClassName?: string
}

// Fields are one size everywhere in the bundle — no variant of
// Input renders at more than one size, unlike Button's sm/md/lg. Offering a
// size knob the design never turns is worse than not offering it, so there is
// no custom `size` prop here; the native `size` attribute (visible character
// width) passes through untouched.
export type InputProps = ComponentPropsWithRef<'input'> & InputOptions

/**
 * The wrapper (`.lat-input-field`) always renders, addons or not: it owns the
 * border, background and focus ring, so an icon placed beside the control
 * sits inside the same box the focus highlight encloses rather than outside
 * it. The `<input>` itself is chromeless — transparent background, no
 * border, `outline: none` — see input.css.
 *
 * `invalid` and `disabled` are mirrored onto the wrapper as `data-invalid`
 * and `data-disabled` so its CSS can react to them without `:has()`; the
 * `<input>` keeps the real `aria-invalid` and `disabled` for assistive tech
 * and native behaviour.
 */
export function Input({
  invalid = false,
  addonStart,
  addonEnd,
  className,
  inputClassName,
  disabled = false,
  ref,
  ...props
}: InputProps) {
  return (
    <div
      className={className === undefined ? 'lat-input-field' : `lat-input-field ${className}`}
      data-invalid={invalid ? true : undefined}
      data-disabled={disabled ? true : undefined}
    >
      {addonStart}
      <input
        {...props}
        ref={ref}
        disabled={disabled}
        className={inputClassName === undefined ? 'lat-input' : `lat-input ${inputClassName}`}
        aria-invalid={invalid ? true : undefined}
      />
      {addonEnd}
    </div>
  )
}
