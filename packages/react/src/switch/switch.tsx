import { Checkbox as AriakitCheckbox, type CheckboxProps } from '@ariakit/react'

export type SwitchProps = CheckboxProps

/**
 * A binary control whose state is not a colour.
 *
 * Rendered as a native checkbox carrying `role="switch"`, rather than as a
 * button with an explicit `aria-checked`. The native element keeps label
 * association through `htmlFor`, form participation, and the browser's own
 * mapping of `checked` into the accessibility tree — all of which a button
 * would have to re-implement, each an opportunity to get it wrong.
 *
 * The visible state signal is the thumb's **position**, set with a static
 * transform so it survives `prefers-reduced-motion: reduce`. Only the movement
 * between positions is gated. A switch whose state read as a colour change
 * alone would fail this system's own premise.
 */
export function Switch({ className, ...props }: SwitchProps) {
  return (
    <AriakitCheckbox
      {...props}
      role="switch"
      className={className === undefined ? 'lat-switch' : `lat-switch ${className}`}
    />
  )
}
