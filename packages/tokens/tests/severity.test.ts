import { describe, expect, it } from 'vitest'
import { buildSeverity } from '../generate/severity.js'

describe('severity ramp', () => {
  it('takes every dark level from Meridian', () => {
    const dark = Object.fromEntries(buildSeverity('dark').map((s) => [s.role, s.hex]))
    expect(dark.critical).toBe('#ff4d6a')
    expect(dark.serious).toBe('#fb923c')
    expect(dark.moderate).toBe('#fbbf24')
  })

  it('takes the declared light levels and derives only moderate', () => {
    const light = buildSeverity('light')
    const byRole = Object.fromEntries(light.map((s) => [s.role, s]))
    expect(byRole.critical!.hex).toBe('#d41240')
    expect(byRole.critical!.origin).toBe('anchored')
    expect(byRole.serious!.hex).toBe('#ea580c')
    expect(byRole.serious!.origin).toBe('anchored')
    expect(byRole.moderate!.origin).toBe('derived')
    expect(byRole.moderate!.l).toBeCloseTo(0.725, 2)
  })

  it('orders the ramp by lightness so it survives colour blindness', () => {
    // Hue alone does not separate serious from moderate under deuteranopia;
    // lightness ordering is the safety net. The mandatory icon and label are
    // the actual defence.
    const dark = buildSeverity('dark')
    const l = (role: string) => dark.find((s) => s.role === role)!.l
    expect(l('critical')).toBeLessThan(l('serious'))
    expect(l('serious')).toBeLessThan(l('moderate'))
  })
})
