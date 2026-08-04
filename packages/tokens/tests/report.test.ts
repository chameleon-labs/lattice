import { describe, expect, it } from 'vitest'
import { buildLedger } from '../generate/report.js'

describe('contrast ledger', () => {
  it('records exactly the nine known failures, in emission order', () => {
    // Five of these are the tinted triple, added when forMode() started
    // measuring each scale's solid as text on its own tint (§9 of the design).
    // Meridian's values did not change; measuring more of them did.
    const failing = buildLedger().filter((e) => !e.passes).map((e) => e.name)
    expect(failing).toEqual([
      'light on-solid on solid',
      'light solid as text on bg',
      'light focus ring on bg-raised',
      'light accent text on its tint',
      'light danger text on its tint',
      'light warning text on its tint',
      'light success text on its tint',
      'light info text on its tint',
      'dark text-subtle on bg-raised'
    ])
  })

  it('passes the dark focus ring, which the light one fails', () => {
    // Meridian declares --ring at 0.35 but focuses components at primary/40,
    // and 0.40 is what this package emits. At 0.40 the dark ring reaches 3.20
    // and clears SC 1.4.11; the light ring reaches 1.55 and does not. The
    // asymmetry is the point — do not "fix" it by averaging the two.
    const dark = buildLedger().find((e) => e.name === 'dark focus ring on bg-raised')!
    expect(dark.passes).toBe(true)
    expect(dark.ratio).toBeGreaterThanOrEqual(3)
  })

  it('measures the light primary button label at 3.33:1', () => {
    const entry = buildLedger().find((e) => e.name === 'light on-solid on solid')!
    expect(entry.ratio).toBeCloseTo(3.33, 1)
    expect(entry.minimum).toBe(4.5)
  })

  it('measures the light focus ring below the 3:1 SC 1.4.11 floor', () => {
    const entry = buildLedger().find((e) => e.name === 'light focus ring on bg-raised')!
    expect(entry.ratio).toBeLessThan(3)
    expect(entry.minimum).toBe(3)
  })

  it('reports APCA alongside every WCAG figure', () => {
    for (const entry of buildLedger()) expect(Number.isFinite(entry.apca)).toBe(true)
  })

  it('measures the light danger tint missing its minimum by a hundredth', () => {
    const entry = buildLedger().find((e) => e.name === 'light danger text on its tint')!
    expect(entry.ratio).toBeCloseTo(4.49, 2)
    expect(entry.minimum).toBe(4.5)
    expect(entry.passes).toBe(false)
  })

  it('passes the light decorative tint, unlike its five tinted-triple siblings', () => {
    // Every other light-mode scale misses 4.5:1 on its own tint; decorative
    // alone clears it. Not rounded away — this is the real measured value.
    const entry = buildLedger().find((e) => e.name === 'light decorative text on its tint')!
    expect(entry.passes).toBe(true)
    expect(entry.ratio).toBeGreaterThanOrEqual(4.5)
  })
})
