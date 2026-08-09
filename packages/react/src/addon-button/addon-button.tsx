import {Button as AriakitButton, type ButtonProps as AriakitButtonProps} from '@ariakit/react';
import type {ReactNode} from 'react';

export type AddonButtonSize = 'sm' | 'md' | 'lg';

export interface AddonButtonOptions {
  /** The accessible name. Required: an icon-only control announces nothing without one. */
  label: string;
  /** Input's scale. Sets the icon size; the pressable box has its own floor. */
  size?: AddonButtonSize;
  /** The icon. An `<svg>` here is sized by the component and inherits `currentColor`. */
  children: ReactNode;
}

export type AddonButtonProps = Omit<AriakitButtonProps<'button'>, 'aria-label' | 'children' | 'type'> &
  AddonButtonOptions;

/**
 * An icon-only control for the inside of a field — a password reveal, a clear
 * search. See ./README.md.
 */
export function AddonButton({
  label,
  size = 'md',
  className,
  accessibleWhenDisabled = true,
  children,
  ...props
}: AddonButtonProps): React.JSX.Element {
  return (
    <AriakitButton
      {...props}
      type="button"
      accessibleWhenDisabled={accessibleWhenDisabled}
      className={className === undefined ? 'lat-addon-button' : `lat-addon-button ${className}`}
      data-size={size}
      aria-label={label}
    >
      {children}
    </AriakitButton>
  );
}
