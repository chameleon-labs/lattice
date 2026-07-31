import { describe, expect, it } from 'vitest'
import type { DimensionToken } from '../generate/layout.js'

import {
  BREAKPOINTS,
  CONTAINERS,
  NESTED_RADIUS_PAIRINGS,
  RADII,
  SPACES
} from '../config/layout.js'
import {
  LAYOUT_PRIMITIVE_COUNT,
  LAYOUT_PRIMITIVE_COUNTS,
  layoutCss,
  layoutTokens
} from '../generate/layout.js'

describe('layout primitive contracts', () => {
  it('carries the exact sixteen-step spacing scale', () => {
    expect(SPACES).toEqual({
      '0': { multiplier: 0, rem: 0 },
      '0-5': { multiplier: 0.5, rem: 0.125 },
      '1': { multiplier: 1, rem: 0.25 },
      '1-5': { multiplier: 1.5, rem: 0.375 },
      '2': { multiplier: 2, rem: 0.5 },
      '3': { multiplier: 3, rem: 0.75 },
      '4': { multiplier: 4, rem: 1 },
      '5': { multiplier: 5, rem: 1.25 },
      '6': { multiplier: 6, rem: 1.5 },
      '8': { multiplier: 8, rem: 2 },
      '10': { multiplier: 10, rem: 2.5 },
      '12': { multiplier: 12, rem: 3 },
      '16': { multiplier: 16, rem: 4 },
      '20': { multiplier: 20, rem: 5 },
      '24': { multiplier: 24, rem: 6 },
      '32': { multiplier: 32, rem: 8 }
    })
  })

  it('carries the exact breakpoints, containers and radii', () => {
    expect(BREAKPOINTS).toEqual({ sm: 30, md: 48, lg: 64, xl: 80 })
    expect(CONTAINERS).toEqual({ prose: 42, content: 64, wide: 80 })
    expect(RADII).toEqual({ none: 0, sm: 0.25, md: 0.5, lg: 0.75, full: 9999 })
  })

  it('keeps every spacing value equal to its multiplier times one quarter rem', () => {
    for (const [name, space] of Object.entries(SPACES)) {
      expect(space.rem, name).toBe(space.multiplier * 0.25)
    }
  })

  it('keeps breakpoints unique and ascending', () => {
    const values: readonly number[] = Object.values(BREAKPOINTS)

    expect(new Set(values).size).toBe(values.length)
    expect(values).toEqual([...values].sort((left, right) => left - right))
  })

  it('keeps containers finite and omits a full token', () => {
    expect(Object.keys(CONTAINERS)).toEqual(['prose', 'content', 'wide'])
    expect(Object.values(CONTAINERS).every(Number.isFinite)).toBe(true)
    expect(CONTAINERS).not.toHaveProperty('full')
  })

  it('derives every documented finite inner radius from outer minus gap', () => {
    expect(NESTED_RADIUS_PAIRINGS).toEqual([{ outer: 'lg', gap: '2', inner: 'sm' }])

    for (const pairing of NESTED_RADIUS_PAIRINGS) {
      expect(RADII[pairing.inner]).toBe(RADII[pairing.outer] - SPACES[pairing.gap].rem)
      expect(pairing.outer).not.toBe('full')
      expect(pairing.inner).not.toBe('full')
    }
    expect(RADII.full).toBe(9999)
  })

  it('uses DTCG-safe public slugs for every spacing step', () => {
    expect(Object.keys(SPACES)).toContain('0-5')
    expect(Object.keys(SPACES)).toContain('1-5')
    expect(Object.keys(SPACES).some((name) => name.includes('.'))).toBe(false)
  })
})

describe('layout primitive generation', () => {
  it('derives the exact family and total counts', () => {
    expect(LAYOUT_PRIMITIVE_COUNTS).toEqual({
      space: 16,
      breakpoint: 4,
      container: 3,
      radius: 5
    })
    expect(LAYOUT_PRIMITIVE_COUNT).toBe(28)
  })

  it('emits exactly one CSS dimension per primitive', () => {
    const css = layoutCss()

    expect(css.match(/--lat-/g)).toHaveLength(28)
    expect(css).toContain('--lat-space-0: 0rem;')
    expect(css).toContain('--lat-space-0-5: 0.125rem;')
    expect(css).toContain('--lat-space-1-5: 0.375rem;')
    expect(css).toContain('--lat-breakpoint-sm: 30rem;')
    expect(css).toContain('--lat-container-prose: 42rem;')
    expect(css).toContain('--lat-radius-full: 9999rem;')
  })

  it('emits four DTCG dimension groups with no keyword value', () => {
    const tokens = layoutTokens()

    expect(Object.keys(tokens)).toEqual(['space', 'breakpoint', 'container', 'radius'])
    expect(tokens.space['0-5']).toEqual({
      $type: 'dimension',
      $value: { value: 0.125, unit: 'rem' }
    })
    expect(tokens.radius.full).toEqual({
      $type: 'dimension',
      $value: { value: 9999, unit: 'rem' }
    })
    expect(JSON.stringify(tokens)).not.toMatch(/"value":"[^"]+"/)
  })
  it('keeps CSS and DTCG names and values in parity', () => {
    const css = layoutCss()

    for (const [groupName, group] of Object.entries(layoutTokens()) as Array<
      [string, Readonly<Record<string, DimensionToken>>]
    >) {
      for (const [tokenName, token] of Object.entries(group)) {
        expect(token.$type, `${groupName}.${tokenName}`).toBe('dimension')
        expect(token.$value.unit, `${groupName}.${tokenName}`).toBe('rem')
        expect(css).toContain(
          `--lat-${groupName}-${tokenName}: ${token.$value.value}${token.$value.unit};`
        )
      }
    }
  })
})
