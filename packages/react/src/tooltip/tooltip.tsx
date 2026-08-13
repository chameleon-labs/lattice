import {
  Tooltip as AriakitTooltip,
  TooltipAnchor as AriakitTooltipAnchor,
  TooltipProvider as AriakitTooltipProvider,
  type TooltipAnchorProps as AriakitTooltipAnchorProps,
  type TooltipProps as AriakitTooltipProps,
  type TooltipProviderProps as AriakitTooltipProviderProps,
} from '@ariakit/react';
import type {ElementType} from 'react';

/**
 * `type` is omitted rather than defaulted. Ariakit's `label` type points the
 * trigger's `aria-labelledby` at the tooltip — the failure this component is
 * built to be incapable of, and deprecated upstream for the same reason.
 * `AddonButton` demands a `label` so an icon-only control names itself; a
 * tooltip able to supply that name would undo it from the other side.
 */
export type TooltipProviderProps = Omit<AriakitTooltipProviderProps, 'type'>;
export type TooltipAnchorProps<T extends ElementType = 'div'> = AriakitTooltipAnchorProps<T>;
export type TooltipProps<T extends ElementType = 'div'> = AriakitTooltipProps<T>;

export function TooltipProvider(props: TooltipProviderProps): React.JSX.Element {
  return <AriakitTooltipProvider {...props} type="description" />;
}

/** The trigger. Renders through the element it describes — it is never one itself. */
export function TooltipAnchor<T extends ElementType = 'div'>({
  className,
  ...props
}: TooltipAnchorProps<T>): React.JSX.Element {
  return (
    <AriakitTooltipAnchor
      {...props}
      className={className === undefined ? 'lat-tooltip-anchor' : `lat-tooltip-anchor ${className}`}
    />
  );
}

/**
 * The surface, on the `overlay` elevation role it shares with Menu and Dialog.
 *
 * Ariakit keeps it dismissable, hoverable and persistent — the three parts of
 * WCAG 1.4.13, and the reason this is wrapped rather than hand-rolled.
 */
export function Tooltip<T extends ElementType = 'div'>({className, ...props}: TooltipProps<T>): React.JSX.Element {
  return (
    <AriakitTooltip
      gutter={4}
      {...props}
      className={className === undefined ? 'lat-tooltip' : `lat-tooltip ${className}`}
    />
  );
}
