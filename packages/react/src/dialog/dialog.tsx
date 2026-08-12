import {
  Dialog as AriakitDialog,
  DialogDisclosure as AriakitDialogDisclosure,
  DialogDismiss as AriakitDialogDismiss,
  DialogHeading as AriakitDialogHeading,
  type DialogDisclosureProps as AriakitDialogDisclosureProps,
  type DialogDismissProps as AriakitDialogDismissProps,
  type DialogHeadingProps as AriakitDialogHeadingProps,
  type DialogProps as AriakitDialogProps,
} from '@ariakit/react';
import type {ElementType} from 'react';

// Re-exported untouched: the provider renders nothing.
export {DialogProvider} from '@ariakit/react';
export type {DialogProviderProps} from '@ariakit/react';

export type DialogProps<T extends ElementType = 'div'> = AriakitDialogProps<T>;
export type DialogHeadingProps<T extends ElementType = 'h1'> = AriakitDialogHeadingProps<T>;
export type DialogDismissProps<T extends ElementType = 'button'> = AriakitDialogDismissProps<T>;
export interface DialogDisclosureOptions {
  /**
   * Renders no button chrome, for a trigger that brings its own geometry.
   * Without it both class names land on one element and the button's padding
   * collapses whatever it wrapped. Same prop, same reason, as `MenuButton`.
   */
  bare?: boolean;
}

export type DialogDisclosureProps<T extends ElementType = 'button'> = AriakitDialogDisclosureProps<T> &
  DialogDisclosureOptions;

/**
 * A modal dialog: focus trapped, focus returned, scroll locked, labelled.
 *
 * #20 states its confirmation must not be `window.confirm`, and this is what
 * makes that practical rather than aspirational. Ariakit owns every one of
 * those four behaviours; this supplies the surface, which shares
 * `--lat-elevation-overlay` with Menu — surface, border and shadow together,
 * because on a dark surface a shadow is not subtle but absent.
 */
export function Dialog<T extends ElementType = 'div'>({className, ...props}: DialogProps<T>): React.JSX.Element {
  return (
    <AriakitDialog
      backdrop={<div className="lat-dialog__backdrop" />}
      {...props}
      className={className === undefined ? 'lat-dialog' : `lat-dialog ${className}`}
    />
  );
}

export function DialogHeading<T extends ElementType = 'h1'>({
  className,
  ...props
}: DialogHeadingProps<T>): React.JSX.Element {
  return (
    <AriakitDialogHeading
      {...props}
      className={className === undefined ? 'lat-dialog__heading' : `lat-dialog__heading ${className}`}
    />
  );
}

export function DialogDismiss<T extends ElementType = 'button'>({
  className,
  ...props
}: DialogDismissProps<T>): React.JSX.Element {
  return (
    <AriakitDialogDismiss
      {...props}
      className={className === undefined ? 'lat-dialog__dismiss' : `lat-dialog__dismiss ${className}`}
    />
  );
}

export function DialogDisclosure<T extends ElementType = 'button'>({
  className,
  bare = false,
  ...props
}: DialogDisclosureProps<T>): React.JSX.Element {
  if (bare) {
    return <AriakitDialogDisclosure {...props} className={className} />;
  }

  return (
    <AriakitDialogDisclosure
      {...props}
      className={className === undefined ? 'lat-button' : `lat-button ${className}`}
      data-variant="secondary"
      data-size="md"
    />
  );
}
