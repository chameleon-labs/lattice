import { VisuallyHidden } from '@ariakit/react'
import type { ComponentPropsWithRef } from 'react'

export interface TableOptions {
  /**
   * Required, and that is the point.
   *
   * A table without a caption is the commonest table defect there is, and it is
   * invisible in review. Making it a required prop turns the omission into a
   * compile error rather than an audit finding.
   */
  caption: string
  /** Keeps the caption in the accessibility tree while hiding it visually. */
  visuallyHiddenCaption?: boolean
}

export type TableProps = ComponentPropsWithRef<'table'> & TableOptions

export function Table({
  caption,
  visuallyHiddenCaption = false,
  className,
  children,
  ...props
}: TableProps) {
  return (
    <table {...props} className={className === undefined ? 'lat-table' : `lat-table ${className}`}>
      <caption className="lat-table__caption">
        {visuallyHiddenCaption ? <VisuallyHidden>{caption}</VisuallyHidden> : caption}
      </caption>
      {children}
    </table>
  )
}

export type THeadProps = ComponentPropsWithRef<'thead'>

export function THead({ className, ...props }: THeadProps) {
  return (
    <thead
      {...props}
      className={className === undefined ? 'lat-table__head' : `lat-table__head ${className}`}
    />
  )
}

export type TBodyProps = ComponentPropsWithRef<'tbody'>

export function TBody({ className, ...props }: TBodyProps) {
  return (
    <tbody
      {...props}
      className={className === undefined ? 'lat-table__body' : `lat-table__body ${className}`}
    />
  )
}

export type TrProps = ComponentPropsWithRef<'tr'>

export function Tr({ className, ...props }: TrProps) {
  return (
    <tr {...props} className={className === undefined ? 'lat-table__row' : `lat-table__row ${className}`} />
  )
}

// `scope` is required rather than optional — the second commonest table defect,
// and equally invisible. A header cell that does not say what it heads is not a
// header cell to a screen reader.
export type ThProps = Omit<ComponentPropsWithRef<'th'>, 'scope'> & {
  scope: 'col' | 'row'
}

export function Th({ className, ...props }: ThProps) {
  return (
    <th
      {...props}
      className={className === undefined ? 'lat-table__header' : `lat-table__header ${className}`}
    />
  )
}

export type TdProps = ComponentPropsWithRef<'td'>

export function Td({ className, ...props }: TdProps) {
  return (
    <td
      {...props}
      className={className === undefined ? 'lat-table__cell' : `lat-table__cell ${className}`}
    />
  )
}
