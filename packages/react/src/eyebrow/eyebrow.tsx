import type { HTMLAttributes } from 'react'

/**
 * `subtle` is the docs page's `SectionLabel` colour (`text-muted-foreground`)
 * and the default, since panel-label usage — Card headers, Table columns,
 * the docs page's section heads — is the more common of the two. `accent`
 * is the landing page's `SectionEyebrow` colour (`text-primary`, lime): the
 * source uses it for every section label on that page plus both "Early
 * access" kickers, never for a panel label.
 */
export type EyebrowTone = 'subtle' | 'accent'

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
  tone?: EyebrowTone
}

export function Eyebrow({ rule = false, tone = 'subtle', className, children, ...props }: EyebrowProps) {
  return (
    <div
      {...props}
      className={className === undefined ? 'lat-eyebrow' : `lat-eyebrow ${className}`}
      data-tone={tone}
    >
      {rule ? <span className="lat-eyebrow__rule" aria-hidden="true" /> : null}
      <span className="lat-eyebrow__text">{children}</span>
    </div>
  )
}
