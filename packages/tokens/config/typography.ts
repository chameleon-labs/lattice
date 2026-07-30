/**
 * Theme-independent typography primitives.
 *
 * Values come from the approved typography spec. Font sizes are stored as the
 * numeric part of a `rem` dimension so the CSS and DTCG emitters can format the
 * same source without parsing strings.
 */

const SYSTEM_SANS = [
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'sans-serif'
] as const

export const FONT_FAMILIES = {
  sans: SYSTEM_SANS,
  inter: ['InterVariable', 'Inter Variable', 'Inter', ...SYSTEM_SANS],
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    'SF Mono',
    'Menlo',
    'Consolas',
    'Liberation Mono',
    'monospace'
  ]
} as const

export const FONT_SIZES = {
  '2xs': 0.625,
  xs: 0.75,
  sm: 0.875,
  base: 1,
  lg: 1.125,
  xl: 1.25,
  '2xl': 1.5,
  '3xl': 1.875,
  '4xl': 2.25
} as const

export const LINE_HEIGHTS = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 1.75
} as const

export const LETTER_SPACINGS = {
  normal: 0
} as const

export const FONT_WEIGHTS = {
  regular: 400,
  semibold: 600,
  bold: 700
} as const

export const FONT_SIZE_GRID_REM = 0.125
export const FONT_SIZE_RATIO_RANGE = { min: 1.111, max: 1.25 } as const
