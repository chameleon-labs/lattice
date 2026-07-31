import { describe, expect, it } from 'vitest'

import { DURATIONS, EASINGS } from '../config/motion.js'

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
