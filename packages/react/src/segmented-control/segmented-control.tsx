import {
  Radio,
  RadioGroup,
  RadioProvider,
  type RadioGroupProps,
  type RadioProps
} from '@ariakit/react'
import type { ReactNode } from 'react'

/**
 * Lattice's segmented control.
 *
 * Built on Ariakit's radio store rather than its tabs: the control selects a
 * value, it does not reveal a panel. That distinction is what a screen reader
 * announces, so it is not a styling choice.
 */
export interface SegmentedControlProps extends Omit<RadioGroupProps, 'defaultValue'> {
  defaultValue?: string
  value?: string
  setValue?: (value: string) => void
  children: ReactNode
}

export function SegmentedControl({
  defaultValue,
  value,
  setValue,
  className,
  children,
  ...props
}: SegmentedControlProps) {
  return (
    // Every prop below is spread conditionally: exactOptionalPropertyTypes
    // distinguishes an absent key from one explicitly set to undefined, and
    // RadioProvider's optional props do not accept the latter. Ariakit's radio
    // store is also generic over `string | number | null` — wider than this
    // component's value, which is always a string because every
    // SegmentedControlItem requires one, so setValue's adapter narrows back
    // down rather than widening SegmentedControlProps to match the store.
    <RadioProvider
      {...(defaultValue === undefined ? {} : { defaultValue })}
      {...(value === undefined ? {} : { value })}
      {...(setValue === undefined
        ? {}
        : { setValue: (next: string | number | null) => setValue(next === null ? '' : String(next)) })}
    >
      <RadioGroup
        {...props}
        className={
          className === undefined
            ? 'lat-segmented-control'
            : `lat-segmented-control ${className}`
        }
      >
        {children}
      </RadioGroup>
    </RadioProvider>
  )
}

export interface SegmentedControlItemProps extends Omit<RadioProps, 'value'> {
  value: string
  children: ReactNode
}

export function SegmentedControlItem({
  value,
  className,
  children,
  ...props
}: SegmentedControlItemProps) {
  return (
    <label
      className={
        className === undefined
          ? 'lat-segmented-control__item'
          : `lat-segmented-control__item ${className}`
      }
    >
      <Radio {...props} value={value} className="lat-segmented-control__input" />
      <span className="lat-segmented-control__label">{children}</span>
    </label>
  )
}
