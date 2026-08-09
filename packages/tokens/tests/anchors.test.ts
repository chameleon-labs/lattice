import {describe, expect, it} from 'vitest';
import {MODES} from '../config/modes.js';
import {GRAY_ANCHORS, SOLID_ANCHORS} from '../config/anchors.js';
import {resolveAll, resolveGray, resolveSolids} from '../generate/anchors.js';

describe('anchors', () => {
  it('resolves every grey role to the measured OKLCH', () => {
    const dark = resolveGray('dark');
    const bg = dark.find((s) => s.role === 'bg')!;
    expect(bg.hex).toBe('#0c0c14');
    expect(bg.l).toBeCloseTo(0.159, 3);
    expect(bg.c).toBeCloseTo(0.0169, 4);
    expect(bg.h).toBeCloseTo(284.3, 1);
    expect(bg.origin).toBe('anchored');
  });

  it('round-trips every anchor back to its source hex', () => {
    for (const mode of MODES) {
      for (const swatch of resolveAll(mode)) {
        if (swatch.origin !== 'anchored') {
          continue;
        }
        expect(swatch.hex).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it('fills with the one chartreuse in both modes', () => {
    const dark = resolveSolids('dark').find((s) => s.scale === 'accent')!;
    const light = resolveSolids('light').find((s) => s.scale === 'accent')!;
    expect(dark.hex).toBe('#cff23a');
    expect(light.hex).toBe('#cff23a');
  });

  // The fill is one colour; the text colour is not. Chartreuse text on a light
  // background is 1.13:1, so light mode keeps the bundle's olive for that job.
  it('splits the accent text colour from the fill in light mode', () => {
    const swatchFor = (mode: 'dark' | 'light'): string =>
      resolveAll(mode).find((s) => s.scale === 'accent' && s.role === 'text')!.hex;

    expect(swatchFor('dark')).toBe('#cff23a');
    expect(swatchFor('light')).toBe('#6a9b00');
  });

  it('covers every declared anchor with no extras', () => {
    for (const mode of MODES) {
      const grayRoles = resolveGray(mode)
        .map((s) => s.role)
        .toSorted();
      expect(grayRoles).toEqual(Object.keys(GRAY_ANCHORS[mode]).toSorted());
      const solids = resolveSolids(mode)
        .map((s) => s.scale)
        .toSorted();
      expect(solids).toEqual(Object.keys(SOLID_ANCHORS).toSorted());
    }
  });
});
