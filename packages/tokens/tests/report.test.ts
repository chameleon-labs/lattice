import { describe, expect, it } from 'vitest'
import { FOCUS_RING } from '../config/alpha.js'
import { GRAY_ANCHORS } from '../config/anchors.js'
import { contrastRatio } from '../generate/contrast.js'
import { parseHex } from '../generate/oklch.js'
import { buildLedger, over } from '../generate/report.js'

describe('contrast ledger', () => {
  it('records exactly the twenty-one known failures, in emission order', () => {
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
    //
    // Twenty-two became twenty-one on 2026-08-04 when issue #47 anchored the
    // focus ring and `light focus ring on bg-raised` started passing. It is the
    // first row to leave this list by being fixed rather than re-measured.
    const failing = buildLedger().filter((e) => !e.passes).map((e) => e.name)
    expect(failing).toEqual([
      'light on-solid on solid',
      'light solid as text on bg',
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

  it('leaves the dark ring exactly where it was', () => {
    // Issue #47 was a light-mode defect. Dark measured 3.20 before the change
    // and must measure 3.20 after it — this is the assertion that would catch a
    // fix applied to both modes when only one needed it.
    const dark = buildLedger().find((e) => e.name === 'dark focus ring on bg-raised')!
    expect(dark.passes).toBe(true)
    expect(dark.ratio).toBeCloseTo(3.2, 2)
  })

  it('measures the light primary button label at 3.33:1', () => {
    const entry = buildLedger().find((e) => e.name === 'light on-solid on solid')!
    expect(entry.ratio).toBeCloseTo(3.33, 1)
    expect(entry.minimum).toBe(4.5)
  })

  it('clears the 3:1 SC 1.4.11 floor on every surface the ring is drawn on', () => {
    // This test used to assert the opposite — that light measured *below* 3:1 —
    // because the ring was `--lat-solid` at 40% and could not reach it at any
    // hue. Issue #47 anchored the ring instead. All six rows are asserted here
    // rather than only the one that used to fail: `bg-raised` alone left the
    // narrowest pairing (dark on `field-bg`, 3.17 — passing, but the row with
    // least room) unmeasured.
    const ledger = buildLedger()
    const rings = ledger.filter((e) => e.name.includes('focus ring'))

    expect(rings).toHaveLength(6)
    for (const entry of rings) {
      expect(entry.minimum, entry.name).toBe(3)
      expect(entry.ratio, entry.name).toBeGreaterThanOrEqual(3)
      expect(entry.passes, entry.name).toBe(true)
    }
    for (const surface of ['bg', 'bg-raised', 'field-bg']) {
      for (const mode of ['light', 'dark']) {
        expect(
          rings.some((e) => e.name === `${mode} focus ring on ${surface}`),
          `${mode} focus ring on ${surface} is not measured`
        ).toBe(true)
      }
    }
  })

  it('keeps the dark ring translucent and the light ring opaque', () => {
    // The asymmetry is the finding, not an oversight: a translucent ring
    // composites with its surface and so tracks it, which holds dark above 3:1
    // everywhere. The same construction cannot reach 3:1 on light at any hue,
    // because 60% of what gets measured is a near-white surface.
    expect(FOCUS_RING.light.alpha).toBe(1)
    expect(FOCUS_RING.dark.alpha).toBeLessThan(1)

    // And the alternative — anchoring dark opaque the way light is — introduces
    // a failure rather than fixing one. The candidate colour for that is not the
    // raw anchor `#cff23a` (nobody ever sees that; it is never drawn at alpha 1)
    // but the colour the translucent ring *renders as* today. Freezing that one
    // rendered value is exactly what loses the per-surface adaptation.
    const field = parseHex(GRAY_ANCHORS.dark['field-bg'])
    const asRenderedOnRaised = over(
      parseHex(FOCUS_RING.dark.hex),
      FOCUS_RING.dark.alpha,
      parseHex(GRAY_ANCHORS.dark['bg-raised'])
    )
    expect(contrastRatio(asRenderedOnRaised, field)).toBeLessThan(3)

    // Translucent, the same ring clears the same surface, because it composites
    // with it instead of sitting on top of it.
    const darkComposited = buildLedger().find((e) => e.name === 'dark focus ring on field-bg')!
    expect(darkComposited.ratio).toBeGreaterThanOrEqual(3)
    expect(darkComposited.passes).toBe(true)
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
