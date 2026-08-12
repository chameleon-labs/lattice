import {
  Disclosure as AriakitDisclosure,
  DisclosureContent as AriakitDisclosureContent,
  type DisclosureContentProps as AriakitDisclosureContentProps,
  type DisclosureProps as AriakitDisclosureProps,
} from '@ariakit/react';
import type {ElementType} from 'react';

// Re-exported untouched: the provider renders nothing, so there is nothing to
// style and a wrapper would only add a name to keep in step.
export {DisclosureProvider} from '@ariakit/react';
export type {DisclosureProviderProps} from '@ariakit/react';

export interface DisclosureOptions {
  /**
   * Renders no chrome, for a trigger that brings its own geometry — a whole
   * row that expands, rather than a button above one. Same prop, same reason,
   * as `MenuButton` and `DialogDisclosure`.
   */
  bare?: boolean;
}

export type DisclosureProps<T extends ElementType = 'button'> = AriakitDisclosureProps<T> & DisclosureOptions;
export type DisclosureContentProps<T extends ElementType = 'div'> = AriakitDisclosureContentProps<T>;

/**
 * A real `<button>` carrying `aria-expanded`, paired with its content.
 *
 * #19 calls this out directly: the violation rows must be buttons rather than
 * clickable divs. Ariakit supplies the expanded state and the association; this
 * adds the appearance.
 */
export function Disclosure<T extends ElementType = 'button'>({
  className,
  bare = false,
  ...props
}: DisclosureProps<T>): React.JSX.Element {
  if (bare) {
    return <AriakitDisclosure {...props} className={className} />;
  }

  return (
    <AriakitDisclosure
      {...props}
      className={className === undefined ? 'lat-disclosure' : `lat-disclosure ${className}`}
    />
  );
}

export function DisclosureContent<T extends ElementType = 'div'>({
  className,
  ...props
}: DisclosureContentProps<T>): React.JSX.Element {
  return (
    <AriakitDisclosureContent
      {...props}
      className={className === undefined ? 'lat-disclosure__content' : `lat-disclosure__content ${className}`}
    />
  );
}
