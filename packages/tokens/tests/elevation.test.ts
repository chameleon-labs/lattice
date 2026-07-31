import { describe, expect, it } from 'vitest'

import { ELEVATION_LEVELS, ELEVATION_SCALE, SHADOWS } from '../config/elevation.js'
import {
  SHADOW_PRIMITIVE_COUNT,
  shadowCss,
  shadowTokens
} from '../generate/elevation.js'

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

describe('shadow primitive generation', () => {
  it('derives the primitive count', () => {
    expect(SHADOW_PRIMITIVE_COUNT).toBe(3)
  })

  it('emits exactly one CSS value per shadow', () => {
    const css = shadowCss()

    expect(css.match(/--lat-/g)).toHaveLength(3)
    expect(css).toContain('--lat-shadow-small: 0px 1px 2px 0px oklch(0 0 0 / 0.1);')
    expect(css).toContain('--lat-shadow-medium: 0px 4px 8px -1px oklch(0 0 0 / 0.12);')
    expect(css).toContain('--lat-shadow-large: 0px 12px 24px -4px oklch(0 0 0 / 0.16);')
  })

  // Every dimension carries its unit, including zero, exactly as
  // --lat-radius-none: 0rem does. Bare 0 would be valid CSS and would break the
  // mechanical relationship with the DTCG value.
  it('gives every geometry value an explicit px unit', () => {
    for (const declaration of shadowCss().split('\n')) {
      const value = /: (.+);$/.exec(declaration)![1]!
      const [offsetX, offsetY, blur, spread] = value.split(' ')

      for (const part of [offsetX, offsetY, blur, spread]) {
        expect(part, declaration).toMatch(/^-?\d+px$/)
      }
    }
  })

  it('keeps the shadow colour neutral', () => {
    expect(shadowCss()).not.toMatch(/oklch\((?!0 0 0 \/)/)
    for (const token of Object.values(shadowTokens())) {
      const [lightness, chroma, hue] = token.$value.color.components

      expect(lightness).toBe(0)
      expect(chroma).toBe(0)
      expect(hue).toBe(0)
    }
  })

  it('emits DTCG shadow tokens with every required field', () => {
    const tokens = shadowTokens()

    expect(Object.keys(tokens)).toEqual(['small', 'medium', 'large'])
    expect(tokens.medium).toEqual({
      $type: 'shadow',
      $value: {
        color: { colorSpace: 'oklch', components: [0, 0, 0], alpha: 0.12 },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 4, unit: 'px' },
        blur: { value: 8, unit: 'px' },
        spread: { value: -1, unit: 'px' }
      }
    })
  })

  // hex cannot express alpha, and the format makes it optional. Carrying one
  // would publish an opaque black that contradicts the colour beside it.
  it('omits the hex fallback, which cannot carry alpha', () => {
    for (const token of Object.values(shadowTokens())) {
      expect(token.$value.color).not.toHaveProperty('hex')
    }
  })

  it('keeps CSS and DTCG shadows in parity', () => {
    const css = shadowCss()

    for (const [name, token] of Object.entries(shadowTokens())) {
      const { offsetX, offsetY, blur, spread, color } = token.$value

      expect(css, name).toContain(
        `--lat-shadow-${name}: ${offsetX.value}${offsetX.unit} ${offsetY.value}${offsetY.unit} ` +
          `${blur.value}${blur.unit} ${spread.value}${spread.unit} ` +
          `oklch(0 0 0 / ${color.alpha});`
      )
    }
  })

  it('is deterministic', () => {
    expect(shadowCss()).toBe(shadowCss())
    expect(JSON.stringify(shadowTokens())).toBe(JSON.stringify(shadowTokens()))
  })
})
