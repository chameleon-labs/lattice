import { describe, expect, it } from 'vitest'

import { DURATIONS, EASINGS } from '../config/motion.js'
import {
  MOTION_PRIMITIVE_COUNT,
  MOTION_PRIMITIVE_COUNTS,
  motionCss,
  motionTokens
} from '../generate/motion.js'

describe('motion primitive contracts', () => {
  it('carries the exact five-duration scale', () => {
    expect(DURATIONS).toEqual({
      instant: 0,
      fast: 100,
      base: 150,
      slow: 250,
      slower: 400
    })
  })

  it('keeps every duration finite, non-negative and within the ceiling', () => {
    const values = Object.values(DURATIONS)

    expect(values).toHaveLength(5)
    expect(values.every(Number.isFinite)).toBe(true)
    expect(values.every((value) => value >= 0)).toBe(true)
    expect(Math.max(...values)).toBe(400)
  })

  it('carries the exact three easing curves', () => {
    expect(EASINGS).toEqual({
      standard: [0.2, 0, 0, 1],
      entrance: [0, 0, 0, 1],
      exit: [0.3, 0, 1, 1]
    })
  })

  it('keeps every easing finite, four-component and inside the approved range', () => {
    for (const [name, curve] of Object.entries(EASINGS)) {
      expect(curve, name).toHaveLength(4)
      expect(curve.every(Number.isFinite), name).toBe(true)
      expect(curve.every((component) => component >= 0 && component <= 1), name).toBe(true)
    }
  })
})

describe('motion primitive generation', () => {
  it('derives the exact family and total counts', () => {
    expect(MOTION_PRIMITIVE_COUNTS).toEqual({ duration: 5, easing: 3 })
    expect(MOTION_PRIMITIVE_COUNT).toBe(8)
  })

  it('emits exactly one CSS value per primitive', () => {
    const css = motionCss()

    expect(css.match(/--lat-/g)).toHaveLength(8)
    expect(css).toContain('--lat-duration-instant: 0ms;')
    expect(css).toContain('--lat-duration-base: 150ms;')
    expect(css).toContain('--lat-duration-slower: 400ms;')
    expect(css).toContain('--lat-easing-standard: cubic-bezier(0.2, 0, 0, 1);')
    expect(css).toContain('--lat-easing-entrance: cubic-bezier(0, 0, 0, 1);')
    expect(css).toContain('--lat-easing-exit: cubic-bezier(0.3, 0, 1, 1);')
    expect(css).not.toContain('prefers-reduced-motion')
    expect(css).not.toContain('transition')
  })

  it('emits duration and cubicBezier DTCG groups', () => {
    const tokens = motionTokens()

    expect(Object.keys(tokens)).toEqual(['duration', 'easing'])
    expect(tokens.duration.base).toEqual({
      $type: 'duration',
      $value: { value: 150, unit: 'ms' }
    })
    expect(tokens.easing.standard).toEqual({
      $type: 'cubicBezier',
      $value: [0.2, 0, 0, 1]
    })
  })

  it('keeps CSS and DTCG names and values in parity', () => {
    const css = motionCss()
    const tokens = motionTokens()

    for (const [name, token] of Object.entries(tokens.duration)) {
      expect(css, `duration.${name}`).toContain(
        `--lat-duration-${name}: ${token.$value.value}${token.$value.unit};`
      )
    }
    for (const [name, token] of Object.entries(tokens.easing)) {
      expect(css, `easing.${name}`).toContain(
        `--lat-easing-${name}: cubic-bezier(${token.$value.join(', ')});`
      )
    }
  })

  it('is deterministic', () => {
    expect(motionCss()).toBe(motionCss())
    expect(JSON.stringify(motionTokens())).toBe(JSON.stringify(motionTokens()))
  })
})
