import type {ComponentPropsWithRef, ReactNode} from 'react';

/**
 * Badge's vocabulary, minus the neutral tones Badge still carries. A callout
 * is rendered because something needs attention, so every instance is one of
 * these four semantic variants — there is no neutral case left to default to,
 * which is why `variant` is required below rather than optional.
 */
export type CalloutVariant = 'info' | 'success' | 'warning' | 'danger';

export interface CalloutOptions {
  variant: CalloutVariant;
  /**
   * Required, not optional. Colour never carries meaning alone — the same
   * rule Badge's severity ramp follows — so a callout that signalled its
   * variant by colour alone cannot be written.
   */
  icon: ReactNode;
  title?: string;
  /**
   * Opt in to announcing. Absent by default, and that is the point: a callout
   * rendered on page load with `role="alert"` is announced immediately and out
   * of context, which is worse than silence. Pass this only when the callout
   * appears in response to something the user did.
   */
  live?: 'polite' | 'assertive';
}

export type CalloutProps = Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> &
  CalloutOptions & {children: ReactNode};

export function Callout({variant, icon, title, live, className, children, ...props}: CalloutProps) {
  return (
    <div
      {...props}
      className={className === undefined ? 'lat-callout' : `lat-callout ${className}`}
      data-variant={variant}
      {...(live === undefined ? {} : {role: live === 'assertive' ? 'alert' : 'status'})}
    >
      {/* Decorative: the icon carries the variant's shape for colour-blind
          legibility, but adds nothing screen readers need beyond the title
          and body text that already follow it. */}
      <div className="lat-callout__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="lat-callout__content">
        {title === undefined ? null : <p className="lat-callout__title">{title}</p>}
        <div className="lat-callout__body">{children}</div>
      </div>
    </div>
  );
}
