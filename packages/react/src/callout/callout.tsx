import type { ComponentPropsWithRef, ReactNode } from 'react'

export type CalloutTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

export interface CalloutOptions {
  tone?: CalloutTone
  title?: string
  /**
   * Opt in to announcing. Absent by default, and that is the point: a callout
   * rendered on page load with `role="alert"` is announced immediately and out
   * of context, which is worse than silence. Pass this only when the callout
   * appears in response to something the user did.
   */
  live?: 'polite' | 'assertive'
}

export type CalloutProps = Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> &
  CalloutOptions & { children: ReactNode }

export function Callout({
  tone = 'neutral',
  title,
  live,
  className,
  children,
  ...props
}: CalloutProps) {
  return (
    <div
      {...props}
      className={className === undefined ? 'lat-callout' : `lat-callout ${className}`}
      data-tone={tone}
      {...(live === undefined ? {} : { role: live === 'assertive' ? 'alert' : 'status' })}
    >
      {title === undefined ? null : <p className="lat-callout__title">{title}</p>}
      <div className="lat-callout__body">{children}</div>
    </div>
  )
}
