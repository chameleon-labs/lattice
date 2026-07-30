/**
 * Semantic typography roles.
 *
 * The matrix is the single source for both CSS aliases and DTCG composites.
 * Primitive-key types make an invalid reference a compile-time error, while
 * classification remains internal metadata for accessibility contracts.
 */

import {
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  LETTER_SPACINGS,
  LINE_HEIGHTS
} from './typography.js'

export interface TypographyRole {
  readonly fontFamily: keyof typeof FONT_FAMILIES
  readonly fontSize: keyof typeof FONT_SIZES
  readonly fontWeight: keyof typeof FONT_WEIGHTS
  readonly letterSpacing: keyof typeof LETTER_SPACINGS
  readonly lineHeight: keyof typeof LINE_HEIGHTS
  readonly classification: 'prose' | 'ui' | 'supporting' | 'restricted' | 'code' | 'display'
}

export const TYPOGRAPHY_ROLES = {
  body: {
    fontFamily: 'sans',
    fontSize: 'base',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    classification: 'prose'
  },
  'body-strong': {
    fontFamily: 'sans',
    fontSize: 'base',
    fontWeight: 'semibold',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    classification: 'prose'
  },
  lead: {
    fontFamily: 'sans',
    fontSize: 'lg',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'relaxed',
    classification: 'prose'
  },
  ui: {
    fontFamily: 'sans',
    fontSize: 'sm',
    fontWeight: 'semibold',
    letterSpacing: 'normal',
    lineHeight: 'snug',
    classification: 'ui'
  },
  caption: {
    fontFamily: 'sans',
    fontSize: 'xs',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    classification: 'supporting'
  },
  micro: {
    fontFamily: 'sans',
    fontSize: '2xs',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    classification: 'restricted'
  },
  code: {
    fontFamily: 'mono',
    fontSize: 'sm',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    classification: 'code'
  },
  'heading-1': {
    fontFamily: 'sans',
    fontSize: '4xl',
    fontWeight: 'bold',
    letterSpacing: 'normal',
    lineHeight: 'tight',
    classification: 'display'
  },
  'heading-2': {
    fontFamily: 'sans',
    fontSize: '3xl',
    fontWeight: 'bold',
    letterSpacing: 'normal',
    lineHeight: 'tight',
    classification: 'display'
  },
  'heading-3': {
    fontFamily: 'sans',
    fontSize: '2xl',
    fontWeight: 'semibold',
    letterSpacing: 'normal',
    lineHeight: 'snug',
    classification: 'display'
  },
  'heading-4': {
    fontFamily: 'sans',
    fontSize: 'xl',
    fontWeight: 'semibold',
    letterSpacing: 'normal',
    lineHeight: 'snug',
    classification: 'display'
  }
} as const satisfies Readonly<Record<string, TypographyRole>>

export type TypographyRoleName = keyof typeof TYPOGRAPHY_ROLES

export const TYPOGRAPHY_BREAKPOINT_REM = 40

export const NARROW_HEADING_SIZES = {
  'heading-1': '3xl',
  'heading-2': '2xl',
  'heading-3': 'xl'
} as const satisfies Partial<Record<TypographyRoleName, keyof typeof FONT_SIZES>>
