import { describe, expect, it } from 'vitest'

import {
  FONT_FAMILIES,
  FONT_SIZE_GRID_REM,
  FONT_SIZE_RATIO_RANGE,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS
} from '../config/typography.js'
import {
  TYPOGRAPHY_PRIMITIVE_COUNT,
  typographyCss,
  typographyTokens
} from '../generate/typography.js'

describe('typography primitives', () => {
  it('carries the approved family stacks in fallback order', () => {
    expect(FONT_FAMILIES.sans).toEqual([
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ])
    expect(FONT_FAMILIES.inter).toEqual([
      'InterVariable',
      'Inter Variable',
      'Inter',
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ])
    expect(FONT_FAMILIES.mono).toEqual([
      'ui-monospace',
      'SFMono-Regular',
      'SF Mono',
      'Menlo',
      'Consolas',
      'Liberation Mono',
      'monospace'
    ])
  })

  it('keeps every size on the 0.125rem grid and inside the ratio band', () => {
    const sizes = Object.values(FONT_SIZES)

    for (const size of sizes) {
      expect(Number.isInteger(size / FONT_SIZE_GRID_REM), String(size)).toBe(true)
    }
    for (let index = 1; index < sizes.length; index++) {
      const ratio = sizes[index]! / sizes[index - 1]!
      expect(ratio).toBeGreaterThanOrEqual(FONT_SIZE_RATIO_RANGE.min)
      expect(ratio).toBeLessThanOrEqual(FONT_SIZE_RATIO_RANGE.max)
    }
  })

  it('keeps all nine approved sizes', () => {
    expect(FONT_SIZES).toEqual({
      '2xs': 0.625,
      xs: 0.75,
      sm: 0.875,
      base: 1,
      lg: 1.125,
      xl: 1.25,
      '2xl': 1.5,
      '3xl': 1.875,
      '4xl': 2.25
    })
  })

  it('uses only unitless line heights and the approved weights', () => {
    expect(LINE_HEIGHTS).toEqual({
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 1.75
    })
    expect(Object.values(LINE_HEIGHTS).every(Number.isFinite)).toBe(true)
    expect(FONT_WEIGHTS).toEqual({ regular: 400, semibold: 600, bold: 700 })
  })

  it('formats the exact CSS primitive names and values', () => {
    const css = typographyCss()

    expect(css).toContain(
      "--lat-font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, " +
        "'Helvetica Neue', Arial, sans-serif;"
    )
    expect(css).toContain(
      "--lat-font-inter: InterVariable, 'Inter Variable', Inter, ui-sans-serif, system-ui, " +
        "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"
    )
    expect(css).toContain('--lat-font-size-2xs: 0.625rem;')
    expect(css).toContain('--lat-font-size-base: 1rem;')
    expect(css).toContain('--lat-line-height-normal: 1.5;')
    expect(css).toContain('--lat-font-weight-semibold: 600;')
    expect(css.match(/--lat-/g)).toHaveLength(TYPOGRAPHY_PRIMITIVE_COUNT)
  })

  it('does not make the token package responsible for loading fonts', () => {
    expect(typographyCss()).not.toContain('@font-face')
  })

  it('builds mechanically named DTCG groups', () => {
    const tokens = typographyTokens()

    expect(tokens['font-size'].base).toEqual({
      $type: 'dimension',
      $value: { value: 1, unit: 'rem' }
    })
    expect(tokens['line-height'].normal).toEqual({ $type: 'number', $value: 1.5 })
    expect(tokens['font-weight'].semibold).toEqual({ $type: 'fontWeight', $value: 600 })
    expect(tokens.font.sans).toEqual({
      $type: 'fontFamily',
      $value: [...FONT_FAMILIES.sans]
    })
    expect(tokens.font.inter).toEqual({
      $type: 'fontFamily',
      $value: [
        'InterVariable',
        'Inter Variable',
        'Inter',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'sans-serif'
      ]
    })
  })
})
