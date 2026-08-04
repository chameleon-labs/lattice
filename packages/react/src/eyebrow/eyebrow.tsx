import type { HTMLAttributes } from 'react'

/**
 * The uppercase mono label at 0.2em tracking.
 *
 * It exists so that tracking value has exactly one home. It appears on every
 * section head, panel header and column in both Meridian demos, and a value
 * repeated in a dozen stylesheets is a value that drifts.
 *
 * `rule` draws the short leading hairline the landing page's section labels
 * use.
 */
export interface EyebrowProps extends HTMLAttributes<HTMLDivElement> {
  rule?: boolean
}

export function Eyebrow({ rule = false, className, children, ...props }: EyebrowProps) {
  return (
    <div
      {...props}
      className={className === undefined ? 'lat-eyebrow' : `lat-eyebrow ${className}`}
    >
      {rule ? <span className="lat-eyebrow__rule" aria-hidden="true" /> : null}
      <span className="lat-eyebrow__text">{children}</span>
    </div>
  )
}
