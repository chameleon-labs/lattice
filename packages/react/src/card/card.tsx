import type { ComponentPropsWithRef } from 'react'

export type CardProps = ComponentPropsWithRef<'div'>

/**
 * The `raised` elevation role as a component: surface, border and shadow
 * together.
 *
 * All three ship because each covers a case the others cannot. A shadow reads
 * on light and is effectively absent on dark; the surface step reads on dark;
 * the border is the only one that survives `forced-colors`, where the user
 * agent strips shadows and flattens surfaces.
 *
 * A card never takes `role="button"`. An interactive card exposes its action
 * through a real control inside it — a link whose hit area is stretched in CSS
 * — which keeps one accessible name and one tab stop instead of two.
 */
export function Card({ className, ...props }: CardProps) {
  return (
    <div {...props} className={className === undefined ? 'lat-card' : `lat-card ${className}`} />
  )
}
