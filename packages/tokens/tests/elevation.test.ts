import { describe, expect, it } from 'vitest'

import { ELEVATION_LEVELS, ELEVATION_SCALE, SHADOWS } from '../config/elevation.js'

describe('shadow primitive contracts', () => {
  it('carries the exact three-shadow scale', () => {
    expect(SHADOWS).toEqual({
      small: { offsetX: 0, offsetY: 1, blur: 2, spread: 0, alpha: 0.1 },
      medium: { offsetX: 0, offsetY: 4, blur: 8, spread: -1, alpha: 0.12 },
      large: { offsetX: 0, offsetY: 12, blur: 24, spread: -4, alpha: 0.16 }
    })
  })

  it('keeps every geometry value finite and every alpha inside the unit range', () => {
    const recipes = Object.values(SHADOWS)

    expect(recipes).toHaveLength(3)
    for (const recipe of recipes) {
      for (const value of [recipe.offsetX, recipe.offsetY, recipe.blur, recipe.spread]) {
        expect(Number.isFinite(value)).toBe(true)
      }
      expect(recipe.blur).toBeGreaterThanOrEqual(0)
      expect(recipe.alpha).toBeGreaterThan(0)
      expect(recipe.alpha).toBeLessThanOrEqual(1)
    }
  })

  // The measured basis: a shadow is worth 1.315:1 on light and 1.016:1 on dark,
  // so it grows monotonically and stays well under an opaque overlay.
  it('orders the scale so a heavier level is never lighter', () => {
    expect(SHADOWS.small.alpha).toBeLessThan(SHADOWS.medium.alpha)
    expect(SHADOWS.medium.alpha).toBeLessThan(SHADOWS.large.alpha)
    expect(SHADOWS.small.blur).toBeLessThan(SHADOWS.medium.blur)
    expect(SHADOWS.medium.blur).toBeLessThan(SHADOWS.large.blur)
    expect(Math.max(...Object.values(SHADOWS).map((s) => s.alpha))).toBeLessThanOrEqual(0.16)
  })
})

describe('elevation level contracts', () => {
  it('carries the exact four levels in order', () => {
    expect(ELEVATION_LEVELS.map((level) => level.level)).toEqual([
      'flat',
      'raised',
      'overlay',
      'modal'
    ])
  })

  it('assigns the approved signals to each level', () => {
    expect(ELEVATION_LEVELS).toEqual([
      { level: 'flat', surface: 'bg' },
      { level: 'raised', surface: 'bg-subtle', border: 'border-subtle', shadow: 'small' },
      { level: 'overlay', surface: 'bg-subtle', border: 'border', shadow: 'medium' },
      { level: 'modal', surface: 'component', border: 'border', shadow: 'large' }
    ])
  })

  // The assertion the whole specification exists to protect. A level with a
  // shadow and no border fails in dark mode and in forced-colors.
  it('gives every level above flat all three signals', () => {
    for (const level of ELEVATION_LEVELS) {
      if (level.level === 'flat') {
        continue
      }
      expect(level.surface, level.level).toBeTruthy()
      expect(level.border, level.level).toBeTruthy()
      expect(level.shadow, level.level).toBeTruthy()
    }
  })

  it('keeps flat as an absence rather than a keyword', () => {
    const flat = ELEVATION_LEVELS.find((level) => level.level === 'flat')!

    expect(flat.surface).toBe('bg')
    expect(flat.border).toBeUndefined()
    expect(flat.shadow).toBeUndefined()
  })

  it('draws every surface and border from one scale', () => {
    expect(ELEVATION_SCALE).toBe('gray')
  })
})
