import {describe, expect, it} from 'vitest';

import {ALL_PAIRS_CAP, CATEGORICAL, CHART_SURFACES, CHECKS, ORDINAL_CLAMP, SEQUENTIAL} from '../config/charts.js';
import {MODES} from '../config/modes.js';
import {
  allPairsCap,
  buildCategorical,
  buildSequential,
  ordinalRange,
  validateCategorical,
  validateSequential,
} from '../generate/charts.js';
import {contrastRatio} from '../generate/contrast.js';
import {deltaE} from '../generate/cvd.js';
import {parseHex} from '../generate/oklch.js';

const ratio = (a: string, b: string): number => contrastRatio(parseHex(a), parseHex(b));

describe('the categorical palette', () => {
  // The published palette. These are the acceptance values, generated from the
  // OKLCH config rather than pasted into it.
  const published: [number, string, string, string][] = [
    [1, 'violet', '#a169da', '#a169da'],
    [2, 'orange', '#b64a00', '#bf4e00'],
    [3, 'aqua', '#009d9d', '#009d9d'],
    [4, 'yellow', '#856e00', '#8b7400'],
    [5, 'magenta', '#cd57a0', '#cd57a0'],
    [6, 'green', '#008652', '#008c57'],
    [7, 'blue', '#188ceb', '#188ceb'],
    [8, 'red', '#bd3855', '#c43e5b'],
  ];

  it.each(published)('generates slot %i, %s, as %s and %s', (slot, name, light, dark) => {
    expect(buildCategorical('light')[slot - 1]).toMatchObject({slot, name, hex: light});
    expect(buildCategorical('dark')[slot - 1]).toMatchObject({slot, name, hex: dark});
  });

  it('has eight slots in a fixed order', () => {
    expect(buildCategorical('light').map((swatch) => swatch.name)).toEqual(CATEGORICAL.map((entry) => entry.name));
  });

  // Half the palette is literally the same colour in both themes, because the
  // high tier is mode-invariant. That is a property of the tier design, not a
  // coincidence, so it is pinned.
  it('keeps the high-tier slots identical across modes', () => {
    const light = buildCategorical('light');
    const dark = buildCategorical('dark');

    const entries = [...CATEGORICAL.entries()];

    for (const [index] of entries.filter(([, entry]) => entry.tier === 'hi')) {
      expect(light[index]?.hex).toBe(dark[index]?.hex);
    }

    for (const [index] of entries.filter(([, entry]) => entry.tier !== 'hi')) {
      expect(light[index]?.hex).not.toBe(dark[index]?.hex);
    }
  });

  it('alternates lightness tier between adjacent slots', () => {
    const tiers = CATEGORICAL.map((entry) => entry.tier);

    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i]).not.toBe(tiers[i - 1]);
    }
  });
});

describe('the six categorical checks', () => {
  it('all pass in dark mode', () => {
    const report = validateCategorical(buildCategorical('dark'), 'dark');

    expect(report.checks).toHaveLength(6);
    expect(report.ok).toBe(true);
    for (const check of report.checks) {
      expect(check.state, `${check.name}: ${check.detail}`).toBe('pass');
    }
  });

  // Light mode passes ok — a WARN never sets it false — but one check is not a
  // clean pass, and this pins that explicitly rather than lumping it into the
  // dark-mode assertion above. CHART_SURFACES was corrected from a fake,
  // lighter gray-1 hex to Lattice's real background (#f0f0f8, darker), and
  // measured against the real surface aqua drops just below 3:1. Recorded,
  // accepted state: a future colour or threshold change that fixes or hides
  // this must edit this test too, in the open.
  it('passes ok in light mode, with an accepted relief warning on aqua', () => {
    const report = validateCategorical(buildCategorical('light'), 'light');

    expect(report.checks).toHaveLength(6);
    expect(report.ok).toBe(true);

    const contrast = report.checks.find((check) => check.name === 'Contrast vs surface');
    expect(contrast?.state).toBe('warn');
    expect(contrast?.detail).toContain('aqua 2.94:1');

    for (const check of report.checks) {
      if (check.name === 'Contrast vs surface') {
        continue;
      }
      expect(check.state, `${check.name}: ${check.detail}`).toBe('pass');
    }
  });

  // The headline numbers the design is justified by.
  it.each(MODES)('clears the CVD target in %s mode', (mode) => {
    const palette = buildCategorical(mode);
    let worst = Number.POSITIVE_INFINITY;

    for (const kind of ['protan', 'deutan'] as const) {
      for (let i = 1; i < palette.length; i++) {
        worst = Math.min(worst, deltaE(parseHex(palette[i - 1]!.hex), parseHex(palette[i]!.hex), kind));
      }
    }

    expect(worst).toBeGreaterThanOrEqual(CHECKS.cvdTarget);
  });

  it('reports the documented worst adjacent separations across both modes', () => {
    let worstCvd = Number.POSITIVE_INFINITY;
    let worstNormal = Number.POSITIVE_INFINITY;

    for (const mode of MODES) {
      const palette = buildCategorical(mode);

      for (let i = 1; i < palette.length; i++) {
        const first = parseHex(palette[i - 1]!.hex);
        const second = parseHex(palette[i]!.hex);

        worstNormal = Math.min(worstNormal, deltaE(first, second));
        for (const kind of ['protan', 'deutan'] as const) {
          worstCvd = Math.min(worstCvd, deltaE(first, second, kind));
        }
      }
    }

    // The spec quotes 9.9 and 18.3.
    expect(worstCvd).toBeCloseTo(9.9, 1);
    expect(worstNormal).toBeCloseTo(18.3, 1);
  });

  // "All 8 clear 3:1 in dark mode — no relief obligation." The alternative
  // ordering considered during design reached a better CVD number and left four
  // dark slots below 3:1, which would have obliged direct labels forever.
  it('needs no relief in dark mode, every slot clearing 3:1', () => {
    for (const swatch of buildCategorical('dark')) {
      expect(ratio(swatch.hex, CHART_SURFACES.dark), swatch.name).toBeGreaterThanOrEqual(CHECKS.contrastMin);
    }
  });

  // Light mode does not clear this cleanly once measured against the real
  // surface: aqua needs relief (a visible label, a gap, or a table view — see
  // the "Contrast vs surface" WARN above), and this pins its exact ratio as an
  // accepted, recorded state rather than leaving the shortfall unasserted.
  // Every other light slot still clears 3:1 outright.
  it('needs relief for aqua alone in light mode; every other slot clears 3:1', () => {
    const palette = buildCategorical('light');

    for (const swatch of palette.filter((entry) => entry.name === 'aqua')) {
      const measured = ratio(swatch.hex, CHART_SURFACES.light);
      expect(measured, swatch.name).toBeCloseTo(2.94, 2);
      expect(measured, swatch.name).toBeLessThan(CHECKS.contrastMin);
    }

    for (const swatch of palette.filter((entry) => entry.name !== 'aqua')) {
      expect(ratio(swatch.hex, CHART_SURFACES.light), swatch.name).toBeGreaterThanOrEqual(CHECKS.contrastMin);
    }
  });

  it.each(MODES)('keeps every slot above the chroma floor in %s mode', (mode) => {
    for (const swatch of buildCategorical(mode)) {
      expect(swatch.c, swatch.name).toBeGreaterThanOrEqual(CHECKS.chromaFloor);
    }
  });

  it('fails a palette whose order has been disturbed', () => {
    const shuffled = buildCategorical('light').toReversed();
    const report = validateCategorical(shuffled, 'light');

    expect(report.ok).toBe(false);
    expect(report.checks.find((check) => check.name === 'Fixed order')?.state).toBe('fail');
  });

  // The normal-vision floor never fires on the shipped palette, which clears it
  // at 18.3 against a floor of 15 — so without this it is unpinned, and removing
  // it from the fail condition changes nothing. These two colours are separated
  // only by lightness, which every CVD simulation preserves: both simulations
  // clear the target while normal vision still finds the pair too close.
  it('fails on the normal-vision floor even when the CVD target is met', () => {
    const first = parseHex('#0f74c5');
    const second = parseHex('#3e96ea');

    expect(Math.min(deltaE(first, second, 'protan'), deltaE(first, second, 'deutan'))).toBeGreaterThan(
      CHECKS.cvdTarget,
    );
    expect(deltaE(first, second)).toBeLessThan(CHECKS.normalFloor);

    const palette = [
      {slot: 1, name: 'violet', l: 0.55, c: 0.15, h: 250, hex: '#0f74c5'},
      {slot: 2, name: 'orange', l: 0.66, c: 0.15, h: 250, hex: '#3e96ea'},
    ];
    const separation = validateCategorical(palette, 'light').checks.find((check) => check.name === 'Separation');

    expect(separation?.state).toBe('fail');
  });

  it('fails a palette whose values have drifted from the generated ones', () => {
    const tampered = buildCategorical('light');
    tampered[3] = {...tampered[3]!, hex: '#123456'};

    expect(validateCategorical(tampered, 'light').ok).toBe(false);
  });
});

describe('the all-pairs cap', () => {
  // Adjacent separation is enough for bars, lines and stacks. Scatter and bubble
  // put any two slots side by side, and the palette holds only three that way.
  it('is three, in both modes', () => {
    expect(allPairsCap(MODES)).toBe(ALL_PAIRS_CAP);
    expect(ALL_PAIRS_CAP).toBe(3);
  });

  it.each(MODES)('passes all-pairs for the first three slots in %s mode', (mode) => {
    const report = validateCategorical(buildCategorical(mode).slice(0, 3), mode, {pairs: 'all'});

    expect(report.ok).toBe(true);
  });

  it.each(MODES)('does not hold all-pairs at four slots in %s mode', (mode) => {
    const report = validateCategorical(buildCategorical(mode).slice(0, 4), mode, {pairs: 'all'});

    expect(report.ok).toBe(false);
  });
});

describe('the sequential ramp', () => {
  const published = [
    [100, '#eee1ff'],
    [200, '#dcc5f9'],
    [300, '#c6a7eb'],
    [400, '#b189dd'],
    [500, '#9b6bce'],
    [600, '#8449bb'],
    [700, '#6816a1'],
  ] as const;

  it.each(published)('generates step %i as %s', (step, hex) => {
    expect(buildSequential().find((swatch) => swatch.step === step)?.hex).toBe(hex);
  });

  // The acceptance criterion.
  it('is lightness-monotone with every adjacent gap at or above 0.06', () => {
    const ramp = buildSequential();

    for (let i = 1; i < ramp.length; i++) {
      const gap = ramp[i - 1]!.l - ramp[i]!.l;

      expect(gap).toBeGreaterThan(0);
      expect(gap).toBeGreaterThanOrEqual(CHECKS.ordinalMinDeltaL);
    }
  });

  // Ordinal encoding measures the clamped range, not the full ramp. The full
  // ramp fails the light-end floor by construction — which is precisely the
  // failure the clamp exists to prevent — so the two are asserted separately.
  it('passes every ordinal check over its clamped range in dark mode', () => {
    const report = validateSequential(ordinalRange('dark'), 'dark');

    expect(report.checks).toHaveLength(4);
    for (const check of report.checks) {
      expect(check.state, `${check.name}: ${check.detail}`).toBe('pass');
    }
  });

  // Light mode does not clear its own clamp once measured against the real
  // surface (#f0f0f8, corrected from a fake, lighter gray-1 hex): step 300 —
  // the clamp's own light boundary — measures 1.83:1 against the 2:1 floor.
  // This is the headline chart finding from validating against the real
  // background; recorded here as an accepted failure rather than left
  // unasserted, same as the contrast ledger's accepted failures in
  // tests/report.test.ts. It must not be "fixed" by moving ORDINAL_CLAMP or
  // any chart colour — see docs/superpowers/specs/2026-08-03-lattice-identity-design.md §9.
  it('fails its own light-end clamp floor in light mode, recorded and accepted', () => {
    const report = validateSequential(ordinalRange('light'), 'light');

    expect(report.checks).toHaveLength(4);
    const lightEnd = report.checks.find((check) => check.name === 'Light-end contrast');
    expect(lightEnd?.state).toBe('fail');
    expect(lightEnd?.detail).toBe('300 at 1.83:1 against #f0f0f8');
    expect(report.ok).toBe(false);

    for (const check of report.checks) {
      if (check.name === 'Light-end contrast') {
        continue;
      }
      expect(check.state, `${check.name}: ${check.detail}`).toBe('pass');
    }
  });

  it('fails the ordinal light-end floor unclamped in light mode', () => {
    const report = validateSequential(buildSequential(), 'light');
    const lightEnd = report.checks.find((check) => check.name === 'Light-end contrast');

    expect(lightEnd?.state).toBe('fail');
  });

  // Unclamped dark now *passes* the light-end floor: the real dark background
  // (#0c0c14) is slightly darker than the fake gray-1 hex this used to be
  // measured against, and the ramp's palest step (100) is not what's tested
  // here — it's the darkest unclamped end, step 700, at 2.06:1, just above the
  // 2:1 floor. Recorded explicitly rather than silently dropped from the
  // it.each above, so a future surface or ramp change that pushes this back
  // under the floor is forced into the open rather than passing quietly.
  it('passes the ordinal light-end floor unclamped in dark mode', () => {
    const report = validateSequential(buildSequential(), 'dark');
    const lightEnd = report.checks.find((check) => check.name === 'Light-end contrast');

    expect(lightEnd?.state).toBe('pass');
    expect(lightEnd?.detail).toBe('700 at 2.06:1 against #0c0c14');
  });

  it('drops the end that would vanish into the surface', () => {
    expect(ordinalRange('light').map((swatch) => swatch.step)).toEqual([300, 400, 500, 600, 700]);
    expect(ordinalRange('dark').map((swatch) => swatch.step)).toEqual([100, 200, 300, 400, 500, 600]);
  });

  it('is a single hue', () => {
    for (const swatch of buildSequential()) {
      expect(swatch.h).toBeCloseTo(305, 0);
    }
  });

  it('rises in chroma as it darkens', () => {
    const ramp = buildSequential();

    for (let i = 1; i < ramp.length; i++) {
      expect(ramp[i]!.c).toBeGreaterThan(ramp[i - 1]!.c);
    }
  });

  // A correct ramp fails the categorical checks by design, which is why the two
  // palettes are never interchangeable. Pinned so the distinction is deliberate
  // rather than assumed.
  it('would fail the categorical checks, which is why it is a separate palette', () => {
    const asCategorical = buildSequential().map((swatch, index) => ({
      slot: index + 1,
      name: `seq-${swatch.step}`,
      l: swatch.l,
      c: swatch.c,
      h: swatch.h,
      hex: swatch.hex,
    }));

    expect(validateCategorical(asCategorical, 'light').ok).toBe(false);
  });

  it('fails an ordinal check when a step is moved too close to its neighbour', () => {
    const ramp = buildSequential();
    const crowded = [...ramp];
    crowded[2] = {...crowded[2]!, l: ramp[1]!.l - 0.01};

    expect(validateSequential(crowded, 'light').ok).toBe(false);
  });
});

describe('an empty palette', () => {
  // The two validators failed in opposite directions. The categorical checks all
  // passed vacuously and reported ok — no slot off the band, no pair too close —
  // which is the quietest possible way to gate a build on nothing. The ordinal
  // light-end check indexed into an empty array and threw. Both now say so.
  it('fails the categorical checks instead of passing vacuously', () => {
    const report = validateCategorical([], 'light');

    expect(report.ok).toBe(false);
    expect(report.checks).toHaveLength(1);
    expect(report.checks[0]?.name).toBe('Palette present');
  });

  it('fails the ordinal checks instead of throwing', () => {
    expect(() => validateSequential([], 'light')).not.toThrow();
    expect(validateSequential([], 'light').ok).toBe(false);
  });
});

describe('a ramp declared the other way round', () => {
  // Monotone in either direction is still a ramp, but the reported direction has
  // to be the one actually found — the detail is what a build log shows.
  it('passes, and is described as ascending', () => {
    const ascending = buildSequential().toReversed();
    const monotone = validateSequential(ascending, 'light').checks.find((check) => check.name === 'Lightness monotone');

    expect(monotone?.state).toBe('pass');
    expect(monotone?.detail).toBe('steps read dark to light');
  });

  it('describes the shipped ramp as descending', () => {
    const monotone = validateSequential(buildSequential(), 'light').checks.find(
      (check) => check.name === 'Lightness monotone',
    );

    expect(monotone?.detail).toBe('steps read light to dark');
  });

  it('names the values when a ramp is not monotone at all', () => {
    const ramp = buildSequential();
    const jumbled = [ramp[0]!, ramp[3]!, ramp[1]!, ramp[5]!];
    const monotone = validateSequential(jumbled, 'light').checks.find((check) => check.name === 'Lightness monotone');

    expect(monotone?.state).toBe('fail');
    expect(monotone?.detail).toMatch(/not monotone/);
  });
});

describe('the ordinal clamp', () => {
  // The full range is for sequential encoding, where the palest step may recede
  // into the surface. Ordinal marks each have to read, so the ends clamp — in
  // dark mode this still holds against the real surface.
  it('names a step that clears the ordinal floor in dark mode', () => {
    const clamp = ORDINAL_CLAMP.dark;
    const swatch = buildSequential().find((entry) => entry.step === clamp)!;

    expect(swatch).toBeDefined();
    expect(ratio(swatch.hex, CHART_SURFACES.dark)).toBeGreaterThanOrEqual(CHECKS.ordinalLightFloor);
  });

  // In light mode the clamp's own boundary step no longer clears the floor
  // once measured against Lattice's real background (#f0f0f8) instead of the
  // fake, lighter gray-1 hex this used to be checked against — this is the
  // same accepted failure as "fails its own light-end clamp floor in light
  // mode" above and in the chart-check output `build.ts` prints. Recorded
  // explicitly rather than silently no longer clearing an assertion that used
  // to hold for both modes.
  it('no longer clears the ordinal floor in light mode, recorded and accepted', () => {
    const clamp = ORDINAL_CLAMP.light;
    const swatch = buildSequential().find((entry) => entry.step === clamp)!;

    expect(swatch).toBeDefined();
    const measured = ratio(swatch.hex, CHART_SURFACES.light);
    expect(measured).toBeCloseTo(1.83, 2);
    expect(measured).toBeLessThan(CHECKS.ordinalLightFloor);
  });

  it('clamps the light end at 300 and the dark end at 600', () => {
    expect(ORDINAL_CLAMP.light).toBe(300);
    expect(ORDINAL_CLAMP.dark).toBe(600);
    expect(SEQUENTIAL.map((entry) => entry.step)).toContain(ORDINAL_CLAMP.light);
    expect(SEQUENTIAL.map((entry) => entry.step)).toContain(ORDINAL_CLAMP.dark);
  });

  it('reports the measured ratios at the clamped ends', () => {
    const ramp = buildSequential();
    const at = (step: number): string => ramp.find((entry) => entry.step === step)!.hex;

    // Both figures moved when CHART_SURFACES was corrected from the retired,
    // fake gray-1 hexes to Lattice's real backgrounds. The spec used to quote
    // 2.04:1 at step 300 on light and 3.28:1 at 600 on dark; measured against
    // the real surfaces those are now 1.83:1 (light — below the 2:1 floor, an
    // accepted failure, see above) and 3.39:1 (dark — still clears comfortably).
    expect(ratio(at(300), CHART_SURFACES.light)).toBeCloseTo(1.83, 1);
    expect(ratio(at(600), CHART_SURFACES.dark)).toBeCloseTo(3.39, 1);
  });
});

describe('CVD simulation', () => {
  it('leaves a grey unchanged under every deficiency', () => {
    const grey = parseHex('#808080');

    for (const kind of ['protan', 'deutan', 'tritan'] as const) {
      expect(deltaE(grey, grey, kind)).toBeCloseTo(0, 9);
    }
  });

  // The reason separation is carried by lightness rather than hue. A red/green
  // pair distinguished almost entirely by hue loses three quarters of its
  // separation under deuteranopia, while a pair that also differs in lightness
  // keeps nearly all of it.
  it('collapses a hue-only pair while sparing one separated by lightness', () => {
    const red = parseHex('#c00000');
    const green = parseHex('#00a000');
    const hueOnly = deltaE(red, green);

    expect(hueOnly).toBeGreaterThan(30);
    expect(deltaE(red, green, 'deutan') / hueOnly).toBeLessThan(0.3);

    const blue = parseHex('#188ceb');
    const orange = parseHex('#b64a00');
    const withLightness = deltaE(blue, orange);

    expect(deltaE(blue, orange, 'protan') / withLightness).toBeGreaterThan(0.9);
  });

  // Protanopia is never the worst case in the shipped palette — deuteranopia
  // always is — so without this the protan transform is unpinned and could be
  // corrupted without any test noticing. This pair is the other way round: protan
  // collapses it further than deutan does.
  it('models protanopia as its own transform, not a copy of deuteranopia', () => {
    const first = parseHex('#c5547c');
    const second = parseHex('#537bd9');

    expect(deltaE(first, second, 'protan')).toBeLessThan(deltaE(first, second, 'deutan'));
    expect(deltaE(first, second, 'protan')).toBeLessThan(deltaE(first, second) * 0.75);

    // And on the classic red/green pair the ordering reverses: protanopia keeps
    // far more separation than deuteranopia does.
    const red = parseHex('#c00000');
    const green = parseHex('#00a000');

    expect(deltaE(red, green, 'protan') / deltaE(red, green)).toBeCloseTo(0.73, 1);
    expect(deltaE(red, green, 'deutan')).toBeLessThan(deltaE(red, green, 'protan'));
  });

  it('is symmetric', () => {
    const a = parseHex('#a169da');
    const b = parseHex('#009d9d');

    expect(deltaE(a, b, 'deutan')).toBeCloseTo(deltaE(b, a, 'deutan'), 12);
  });
});
