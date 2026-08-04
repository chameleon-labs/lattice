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
 * `start` (the default) is every eyebrow but one: a section head or panel
 * label sits at the start of whatever it labels. `center` exists for the
 * landing page's CTA kicker, the source's one eyebrow inside a `text-align:
 * center` ancestor — `.lat-eyebrow` is `display: flex` for the `rule`
 * variant's icon-and-text layout, and a flex container establishes its own
 * alignment rather than inheriting `text-align` from an ancestor, so a plain
 * page-level override cannot reach it without knowing the component is a
 * flex container in the first place. A prop is the honest fix: a centred
 * eyebrow is a normal thing to want, not a one-off.
 */
export type EyebrowAlign = 'start' | 'center'

/**
 * The uppercase mono label at 0.2em tracking.
 *
 * It exists so that tracking value has exactly one home. It appears on every
 * section head, panel header and column in both demo pages, and a value
 * repeated in a dozen stylesheets is a value that drifts.
 *
 * `rule` draws the short leading hairline the landing page's section labels
 * use.
 */
export interface EyebrowProps extends HTMLAttributes<HTMLDivElement> {
  rule?: boolean
  tone?: EyebrowTone
  align?: EyebrowAlign
}

export function Eyebrow({
  rule = false,
  tone = 'subtle',
  align = 'start',
  className,
  children,
  ...props
}: EyebrowProps) {
  return (
    <div
      {...props}
      className={className === undefined ? 'lat-eyebrow' : `lat-eyebrow ${className}`}
      data-tone={tone}
      data-align={align}
    >
      {rule ? <span className="lat-eyebrow__rule" aria-hidden="true" /> : null}
      <span className="lat-eyebrow__text">{children}</span>
    </div>
  )
}
