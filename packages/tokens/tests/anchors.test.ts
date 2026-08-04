import { describe, expect, it } from 'vitest'
import { MODES } from '../config/modes.js'
import { GRAY_ANCHORS, SOLID_ANCHORS } from '../config/anchors.js'
import { resolveAll, resolveGray, resolveSolids } from '../generate/anchors.js'

describe('anchors', () => {
  it('resolves every grey role to the measured OKLCH', () => {
    const dark = resolveGray('dark')
    const bg = dark.find((s) => s.role === 'bg')!
    expect(bg.hex).toBe('#0c0c14')
    expect(bg.l).toBeCloseTo(0.159, 3)
    expect(bg.c).toBeCloseTo(0.0169, 4)
    expect(bg.h).toBeCloseTo(284.3, 1)
    expect(bg.origin).toBe('anchored')
  })

  it('round-trips every anchor back to its source hex', () => {
    for (const mode of MODES) {
      for (const swatch of resolveAll(mode)) {
        if (swatch.origin !== 'anchored') continue
        expect(swatch.hex).toMatch(/^#[0-9a-f]{6}$/)
      }
    }
  })

  it('anchors the accent solid at a different lightness per mode', () => {
    const dark = resolveSolids('dark').find((s) => s.scale === 'accent')!
    const light = resolveSolids('light').find((s) => s.scale === 'accent')!
    expect(dark.hex).toBe('#cff23a')
    expect(light.hex).toBe('#6a9b00')
    expect(dark.l).toBeGreaterThan(light.l + 0.2)
  })

  it('covers every declared anchor with no extras', () => {
    for (const mode of MODES) {
      const grayRoles = resolveGray(mode).map((s) => s.role).sort()
      expect(grayRoles).toEqual(Object.keys(GRAY_ANCHORS[mode]).sort())
      const solids = resolveSolids(mode).map((s) => s.scale).sort()
      expect(solids).toEqual(Object.keys(SOLID_ANCHORS).sort())
    }
  })
})
