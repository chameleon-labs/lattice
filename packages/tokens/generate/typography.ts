/**
 * Typography primitive emission.
 *
 * Typography has no light/dark variants, so these values are emitted once in a
 * global CSS rule and a global DTCG group. Authored values stay in config; this
 * module only turns them into the two published representations.
 */

import {
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  LETTER_SPACINGS,
  LINE_HEIGHTS
} from '../config/typography.js'

export interface DimensionToken {
  readonly $type: 'dimension'
  readonly $value: { readonly value: number; readonly unit: 'rem' | 'em' }
}

export interface NumberToken {
  readonly $type: 'number'
  readonly $description?: string
  readonly $value: number
}

export interface FontWeightToken {
  readonly $type: 'fontWeight'
  readonly $value: number
}

export interface FontFamilyToken {
  readonly $type: 'fontFamily'
  readonly $value: readonly string[]
}

export interface TypographyTokenGroups {
  readonly font: Readonly<Record<string, FontFamilyToken>>
  readonly 'font-size': Readonly<Record<string, DimensionToken>>
  readonly 'line-height': Readonly<Record<string, NumberToken>>
  readonly 'letter-spacing': Readonly<Record<string, NumberToken>>
  readonly 'font-weight': Readonly<Record<string, FontWeightToken>>
}

export const TYPOGRAPHY_PRIMITIVE_COUNT =
  Object.keys(FONT_FAMILIES).length +
  Object.keys(FONT_SIZES).length +
  Object.keys(LINE_HEIGHTS).length +
  Object.keys(LETTER_SPACINGS).length +
  Object.keys(FONT_WEIGHTS).length

const cssFamily = (family: string): string => (family.includes(' ') ? `'${family}'` : family)

export function typographyCss(): string {
  const families = Object.entries(FONT_FAMILIES).map(
    ([name, stack]) => `  --lat-font-${name}: ${stack.map(cssFamily).join(', ')};`
  )
  const sizes = Object.entries(FONT_SIZES).map(
    ([name, value]) => `  --lat-font-size-${name}: ${value}rem;`
  )
  const lineHeights = Object.entries(LINE_HEIGHTS).map(
    ([name, value]) => `  --lat-line-height-${name}: ${value};`
  )
  const letterSpacings = Object.entries(LETTER_SPACINGS).map(
    ([name, value]) => `  --lat-letter-spacing-${name}: ${value}em;`
  )
  const weights = Object.entries(FONT_WEIGHTS).map(
    ([name, value]) => `  --lat-font-weight-${name}: ${value};`
  )

  return [...families, ...sizes, ...lineHeights, ...letterSpacings, ...weights].join('\n')
}

export function typographyTokens(): TypographyTokenGroups {
  const font = Object.fromEntries(
    Object.entries(FONT_FAMILIES).map(([name, value]) => [
      name,
      { $type: 'fontFamily', $value: [...value] } satisfies FontFamilyToken
    ])
  )
  const fontSize = Object.fromEntries(
    Object.entries(FONT_SIZES).map(([name, value]) => [
      name,
      { $type: 'dimension', $value: { value, unit: 'rem' } } satisfies DimensionToken
    ])
  )
  const lineHeight = Object.fromEntries(
    Object.entries(LINE_HEIGHTS).map(([name, value]) => [
      name,
      { $type: 'number', $value: value } satisfies NumberToken
    ])
  )
  // The published DTCG dimension schema's `unit` enum is `px` | `rem` only —
  // `em` is not a legal value, even though it is exactly right for CSS
  // letter-spacing and is what `typographyCss()` emits below. Recording it as
  // `rem` would keep the schema happy but silently change the value: 0.2 means
  // a different length depending on whether it scales with the root or with
  // the element's own font-size, and tracking must do the latter. So this
  // carries the bare number, with the unit stated in the description instead
  // of misreported in a field the format only lets mean px or rem.
  const letterSpacing = Object.fromEntries(
    Object.entries(LETTER_SPACINGS).map(([name, value]) => [
      name,
      {
        $type: 'number',
        $value: value,
        $description:
          'Tracking, in em. DTCG dimension permits only px and rem, and tracking ' +
          'must scale with the text it tracks — so the unit is carried here rather ' +
          'than misreported as rem, which would change the value.'
      } satisfies NumberToken
    ])
  )
  const fontWeight = Object.fromEntries(
    Object.entries(FONT_WEIGHTS).map(([name, value]) => [
      name,
      { $type: 'fontWeight', $value: value } satisfies FontWeightToken
    ])
  )

  return {
    font,
    'font-size': fontSize,
    'line-height': lineHeight,
    'letter-spacing': letterSpacing,
    'font-weight': fontWeight
  }
}
