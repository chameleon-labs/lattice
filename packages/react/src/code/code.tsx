import type { HTMLAttributes } from 'react'

/**
 * A code fragment inside running text — a CSS selector, a rule name, an
 * attribute.
 *
 * `CodeBlock` already covers a standalone, copyable listing. This is the other
 * half, and they are not the same component wearing a prop: a block owns a
 * scroll container, a copy button and a live region; an inline fragment must
 * flow with the sentence around it and take part in its line breaking.
 *
 * The guarantee is that breaking. A selector like
 * `meta[name="viewport"]` or `div.iana-header > a.more-link` is a single
 * unbroken token as far as the line-breaking algorithm is concerned, and an
 * inline element that refuses to break pushes its container wider than the
 * page — silently, and only for the visitors whose viewport or font size makes
 * it overflow. The stylesheet lets it break anywhere rather than leaving each
 * caller to remember `overflow-wrap` for a value they cannot predict the
 * length of.
 *
 * No props of its own: an inline fragment has no variants, and every colour a
 * caller might reach for here would be a status this component is not entitled
 * to assert.
 */
export type CodeProps = HTMLAttributes<HTMLElement>

export function Code({ className, children, ...props }: CodeProps) {
  return (
    <code {...props} className={className === undefined ? 'lat-code' : `lat-code ${className}`}>
      {children}
    </code>
  )
}
