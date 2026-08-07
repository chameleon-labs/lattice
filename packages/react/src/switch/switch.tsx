/* oxlint-disable jsx-a11y/role-has-required-aria-props -- native checkbox: the browser maps its `checked` to `aria-checked`. */
import {Checkbox as AriakitCheckbox, type CheckboxProps} from '@ariakit/react';

export type SwitchProps = CheckboxProps;

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
 * alone would fail this system's own premise — and conversely, a position that
 * moves but cannot be seen is no signal either: under forced-colors the thumb
 * and both track states rendered identically until switch.css added an
 * explicit repaint, because a moving-but-invisible thumb is not a visible cue.
 */
export function Switch({className, ...props}: SwitchProps): React.JSX.Element {
  return (
    // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props -- native
    // checkbox: the browser maps its `checked` to `aria-checked`.
    <AriakitCheckbox
      {...props}
      role="switch"
      className={className === undefined ? 'lat-switch' : `lat-switch ${className}`}
    />
  );
}
