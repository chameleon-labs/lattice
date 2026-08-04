import { describe, expect, it } from 'vitest'
import { FONT_FAMILIES, FONT_SIZES, FONT_WEIGHTS, LETTER_SPACINGS } from '../config/typography.js'

describe('typography primitives', () => {
  it('leads the sans stack with Instrument Sans', () => {
    expect(FONT_FAMILIES.sans).toContain("'Instrument Sans'")
  })

  it('leads the mono stack with JetBrains Mono', () => {
    expect(FONT_FAMILIES.mono).toContain("'JetBrains Mono'")
  })

  it("carries Meridian's scale including the 10px micro size", () => {
    expect(FONT_SIZES['3xs'].rem).toBe(0.625)
    expect(FONT_SIZES.base.rem).toBe(1)
    expect(FONT_SIZES['5xl'].rem).toBe(3)
  })

  it('carries the 0.2em eyebrow tracking', () => {
    expect(LETTER_SPACINGS.eyebrow.em).toBe(0.2)
  })

  it('carries the four weights Meridian uses', () => {
    expect(Object.values(FONT_WEIGHTS).map((w) => w.value).sort()).toEqual([400, 500, 600, 700])
  })
})
