import { describe, expect, it } from 'vitest'
import { buildLedger } from '../generate/report.js'

describe('contrast ledger', () => {
  it('records exactly the twenty-two known failures, in emission order', () => {
    // Thirteen of these are the design's original documented set (§9). Nine
    // more join here, added 2026-08-04 alongside `tintsOnBg` /
    // `severityColouredOnBg`: every tinted triple is translucent (see
    // `resolveTints`/`resolveSeverityTints`), so it composites over whatever
    // surface it is placed on, and `.lat-surface` paints every story's root —
    // plus several real pages — at `--lat-bg`, not `--lat-bg-raised`. That
    // second composite was real and unmeasured; `packages/react`'s a11y sweep
    // surfaced it once its `color-contrast` assertion started checking axe's
    // measured ratios against this ledger instead of asserting zero
    // violations outright. Eight of the nine are already-accepted foregrounds
    // measured in a context the ledger had not tried; the ninth,
    // `light decorative text on its tint over bg` at 4.36:1, is a genuinely
    // new failure — decorative clears 4.5:1 over bg-raised but not over bg,
    // which is exactly the kind of gap this second pass exists to catch.
    // Lattice's values did not change; measuring more of their real contexts
    // did.
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
      'light accent text on its tint over bg',
      'light danger text on its tint over bg',
      'light warning text on its tint over bg',
      'light success text on its tint over bg',
      'light info text on its tint over bg',
      'light decorative text on its tint over bg',
      'light severity critical text on its tint',
      'light severity serious text on its tint',
      'light severity moderate text on its tint',
      'light severity critical text on its tint over bg',
      'light severity serious text on its tint over bg',
      'light severity moderate text on its tint over bg',
      'dark text-subtle on bg-raised',
      'dark severity minor text on its tint'
    ])
  })

  it('fails the light decorative tint over bg, unlike its bg-raised row', () => {
    // The one genuinely new failure the bg composite surfaces (see above):
    // decorative clears 4.5:1 over bg-raised (4.91:1) but not over bg
    // (4.36:1) — the same colours, a different real surface.
    const raised = buildLedger().find((e) => e.name === 'light decorative text on its tint')!
    const onBg = buildLedger().find((e) => e.name === 'light decorative text on its tint over bg')!
    expect(raised.passes).toBe(true)
    expect(onBg.passes).toBe(false)
    expect(onBg.ratio).toBeLessThan(raised.ratio)
  })

  it('passes the dark focus ring, which the light one fails', () => {
    // The Figma bundle declares --ring at 0.35 but focuses components at primary/40,
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
