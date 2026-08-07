import {describe, expect, it} from 'vitest';

import {apcaLc, contrastRatio, relativeLuminance} from '../generate/contrast.js';
import {fitToGamut, formatHex, oklchToSrgb, parseHex} from '../generate/oklch.js';

// Reference values come from published implementations rather than from this
// file's own arithmetic:
//   WCAG  — `wcag-contrast`, which agrees bit-for-bit with the formula as
//           published in WCAG 2.x and as axe-core implements it.
//   APCA  — `apca-w3` (Myndex), the canonical implementation.
// Both were run against these exact inputs while writing these tests.

describe('relativeLuminance', () => {
  it('gives black 0 and white 1', () => {
    expect(relativeLuminance(parseHex('#000000'))).toBe(0);
    expect(relativeLuminance(parseHex('#ffffff'))).toBeCloseTo(1, 12);
  });

  it('matches the reference for mid grey', () => {
    expect(relativeLuminance(parseHex('#7f7f7f'))).toBeCloseTo(0.212230757414, 10);
  });

  // The discriminating assertion. WCAG 2.x publishes 0.2126 / 0.7152 / 0.0722,
  // and axe-core uses those. Deriving luminance from the sRGB->XYZ matrix instead
  // gives 0.212639 for red — a different number, and the one colorjs.io reports.
  // Since a primary channel decodes to linear 1, each coefficient is readable
  // directly off a pure primary, so this pins which formula is in use.
  it('uses the coefficients WCAG publishes, not the matrix-derived ones', () => {
    expect(relativeLuminance(parseHex('#ff0000'))).toBeCloseTo(0.2126, 12);
    expect(relativeLuminance(parseHex('#00ff00'))).toBeCloseTo(0.7152, 12);
    expect(relativeLuminance(parseHex('#0000ff'))).toBeCloseTo(0.0722, 12);
  });

  it('weights green far above blue', () => {
    expect(relativeLuminance(parseHex('#00ff00'))).toBeGreaterThan(relativeLuminance(parseHex('#0000ff')) * 9);
  });

  it.each(['r', 'g', 'b'] as const)('refuses a non-finite %s channel', (channel) => {
    expect(() => relativeLuminance({r: 0, g: 0, b: 0, [channel]: Number.NaN})).toThrow(/finite/i);
  });
});

describe('contrastRatio', () => {
  it('gives black on white the maximum 21', () => {
    expect(contrastRatio(parseHex('#000000'), parseHex('#ffffff'))).toBeCloseTo(21, 10);
  });

  it('gives a colour against itself the minimum 1', () => {
    expect(contrastRatio(parseHex('#9a54da'), parseHex('#9a54da'))).toBeCloseTo(1, 12);
  });

  // Greys, where every WCAG variant agrees because the published coefficients
  // sum to exactly 1. These are the widely cited AA boundary colours.
  it.each([
    ['#777777', 4.4780894536],
    ['#767676', 4.5422249596],
    ['#949494', 3.0334698257],
    ['#595959', 7.004729208],
  ])('matches the reference for %s on white', (hex, expected) => {
    expect(contrastRatio(parseHex(hex), parseHex('#ffffff'))).toBeCloseTo(expected, 9);
  });

  // Saturated pairs, where the choice of coefficients actually shows. Asserted
  // to 9 decimals: the matrix-derived variant differs by ~1e-4 here, so a switch
  // of formula fails this even though it passes the grey cases above.
  it.each([
    ['#9a54da', '#fdfdfd', 4.4354705385],
    ['#ffffff', '#9a54da', 4.5117380309],
    ['#000000', '#9a54da', 4.6545255633],
    ['#8449bb', '#ffffff', 5.7507535388],
    ['#eee1ff', '#111112', 15.1422528619],
    ['#fdfdfd', '#111112', 18.5531746663],
  ])('matches the reference for %s on %s', (a, b, expected) => {
    expect(contrastRatio(parseHex(a), parseHex(b))).toBeCloseTo(expected, 9);
  });

  // WCAG defines the ratio with the lighter colour on top, so it cannot be got
  // backwards. APCA deliberately can — see below.
  it('is the same in either order', () => {
    const light = parseHex('#fdfdfd');
    const dark = parseHex('#111112');

    expect(contrastRatio(light, dark)).toBe(contrastRatio(dark, light));
  });

  it('never falls below 1 or rises above 21', () => {
    for (const hex of ['#000000', '#ffffff', '#7f7f7f', '#9a54da', '#00ff00']) {
      for (const other of ['#000000', '#ffffff', '#111112', '#eee1ff']) {
        const ratio = contrastRatio(parseHex(hex), parseHex(other));

        expect(ratio).toBeGreaterThanOrEqual(1);
        expect(ratio).toBeLessThanOrEqual(21);
      }
    }
  });

  // A channel outside 0..1 is what a display shows it as, so clamping reports
  // what a user actually sees rather than inventing a ratio above 21. Callers
  // measuring an OKLCH colour should fit it first; this only absorbs the float
  // noise that a fitted colour still carries.
  it('clamps out-of-range channels instead of reporting an impossible ratio', () => {
    const overdriven = {r: 1.4, g: 1.2, b: 1.05};

    expect(contrastRatio(overdriven, parseHex('#000000'))).toBeCloseTo(21, 10);
  });

  it('refuses a non-finite channel', () => {
    expect(() => contrastRatio({r: Number.NaN, g: 0, b: 0}, parseHex('#ffffff'))).toThrow(/finite/i);
  });
});

describe('apcaLc', () => {
  // The acceptance criterion for the sign convention.
  it('reports dark text on a light background as positive', () => {
    expect(apcaLc(parseHex('#000000'), parseHex('#ffffff'))).toBeCloseTo(106.0406732, 5);
  });

  it('reports light text on a dark background as negative', () => {
    expect(apcaLc(parseHex('#ffffff'), parseHex('#000000'))).toBeCloseTo(-107.8847332, 5);
  });

  // "Lighter" is established by construction rather than by measuring it with
  // another metric. On a grey ramp both transfer functions are strictly
  // increasing in the single shared channel, so a higher byte is unambiguously
  // lighter and the expected sign needs no oracle.
  //
  // Deliberately not written as `relativeLuminance(a) > relativeLuminance(b)`:
  // WCAG and APCA luminance disagree about which of two colours is lighter for
  // roughly 0.7% of random pairs (they weight and curve differently), so using
  // one to predict the other's polarity is unsound even where it happens to
  // agree. Measured: every such disagreement currently lands under LOW_CLIP and
  // reports 0, so the unsoundness is unreachable today — but only because of an
  // interaction between two constants that nothing states, and lowering LOW_CLIP
  // would expose it.
  it('is negative exactly when the text is the lighter of the two', () => {
    const grey = (byte: number) => ({r: byte / 255, g: byte / 255, b: byte / 255});
    // Every pair here clears LOW_CLIP. The clip is widest near black — byte 0
    // needs 61 bytes of separation before Lc becomes nonzero, against 17 at byte
    // 200 — which is the soft black clamp modelling display flare, so 17 is left
    // out rather than special-cased.
    const bytes = [0, 64, 127, 160, 200, 255];
    let compared = 0;

    for (const darker of bytes) {
      for (const lighter of bytes) {
        if (darker >= lighter) {
          continue;
        }

        // Light text on a dark background is negative; the reverse is positive.
        expect(apcaLc(grey(lighter), grey(darker))).toBeLessThan(0);
        expect(apcaLc(grey(darker), grey(lighter))).toBeGreaterThan(0);
        compared++;
      }
    }

    expect(compared).toBe(15);
  });

  // The polarity invariant, with no notion of "lighter" at all: swapping text and
  // background must flip the sign whenever there is a sign to flip. This holds
  // across the region where the two luminance metrics disagree, which the grey
  // ramp above cannot reach.
  it('flips sign when text and background are swapped', () => {
    let seed = 0x9e3779b9;
    const nextByte = (): number => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      seed >>>= 0;
      return seed & 0xff;
    };
    const randomColor = () => ({
      r: nextByte() / 255,
      g: nextByte() / 255,
      b: nextByte() / 255,
    });

    let compared = 0;

    for (let i = 0; i < 2000; i++) {
      const text = randomColor();
      const background = randomColor();
      const forward = apcaLc(text, background);
      const reverse = apcaLc(background, text);

      if (forward === 0 || reverse === 0) {
        continue;
      }
      expect(Math.sign(forward)).toBe(-Math.sign(reverse));
      compared++;
    }

    // Guards the loop itself: if the clip swallowed everything this would assert
    // nothing at all.
    expect(compared).toBeGreaterThan(1500);
  });

  it.each([
    ['#777777', '#ffffff', 71.11110333],
    ['#767676', '#ffffff', 71.57239122],
    ['#949494', '#ffffff', 57.14034556],
    ['#595959', '#ffffff', 84.29007765],
    ['#9a54da', '#fdfdfd', 69.60397618],
    ['#ffffff', '#9a54da', -76.27929763],
    ['#000000', '#9a54da', 33.27866194],
    ['#fdfdfd', '#111112', -106.0458248],
    ['#111112', '#fdfdfd', 104.1565512],
    ['#8449bb', '#ffffff', 78.30098925],
    ['#eee1ff', '#111112', -91.25229035],
  ])('matches the reference for %s on %s', (text, background, expected) => {
    expect(apcaLc(parseHex(text), parseHex(background))).toBeCloseTo(expected, 5);
  });

  // APCA reports nothing rather than something small: below its low-clip the
  // result is exactly 0, not a fraction of an Lc. Reporting 1.2 here would imply
  // a usable difference where there is none.
  it('clips a difference too small to matter to exactly 0', () => {
    expect(apcaLc(parseHex('#7f7f7f'), parseHex('#808080'))).toBe(0);
  });

  it('gives a colour against itself exactly 0', () => {
    expect(apcaLc(parseHex('#9a54da'), parseHex('#9a54da'))).toBe(0);
  });

  // Exercises the near-identical-luminance path across the range, including the
  // near-black region where APCA's soft clamp can push the two polarity terms the
  // "wrong" way round. Every one of these must report 0 rather than a small
  // signed number. This does not pin MIN_DELTA_Y — see the note on that constant.
  it('reports 0 for neighbouring bytes at every lightness', () => {
    for (const byte of [0, 1, 2, 8, 32, 96, 127, 128, 200, 254]) {
      const lower = {r: byte / 255, g: byte / 255, b: byte / 255};
      const upper = {r: (byte + 1) / 255, g: (byte + 1) / 255, b: (byte + 1) / 255};

      expect(apcaLc(lower, upper)).toBe(0);
      expect(apcaLc(upper, lower)).toBe(0);
    }
  });

  // Unlike the WCAG ratio, APCA is asymmetric by design: the polarity has its
  // own exponents, so white-on-black is further from zero than black-on-white.
  // Swapping the arguments is not a sign flip, which is why they are named.
  it('is not symmetric under swapping text and background', () => {
    const bow = apcaLc(parseHex('#000000'), parseHex('#ffffff'));
    const wob = apcaLc(parseHex('#ffffff'), parseHex('#000000'));

    expect(Math.abs(bow)).not.toBeCloseTo(Math.abs(wob), 1);
    expect(Math.abs(wob) - Math.abs(bow)).toBeCloseTo(1.84406, 4);
  });

  it('refuses a non-finite channel', () => {
    expect(() => apcaLc({r: Number.NaN, g: 0, b: 0}, parseHex('#ffffff'))).toThrow(/finite/i);
  });
});

describe('the two standards disagree', () => {
  // The reason both are computed. Against a dark background APCA rates light
  // text lower than WCAG's ratio suggests, and that gap is the thing the spec
  // wants visible rather than hidden. Pinned so a change in either implementation
  // shows up as a change in the gap.
  it('rates the dark surface pair differently', () => {
    const light = parseHex('#fdfdfd');
    const dark = parseHex('#111112');

    expect(contrastRatio(light, dark)).toBeCloseTo(18.553, 3);
    expect(apcaLc(light, dark)).toBeCloseTo(-106.046, 3);
    expect(apcaLc(dark, light)).toBeCloseTo(104.157, 3);
  });

  // WCAG is symmetric, so it cannot express polarity at all; APCA gives the two
  // directions different magnitudes. A gate built on WCAG therefore cannot see
  // the asymmetry that APCA reports, which is the whole reason APCA is advisory
  // rather than absent.
  it('differ on whether polarity matters', () => {
    const light = parseHex('#fdfdfd');
    const dark = parseHex('#111112');

    expect(contrastRatio(light, dark) - contrastRatio(dark, light)).toBe(0);
    expect(Math.abs(apcaLc(light, dark)) - Math.abs(apcaLc(dark, light))).toBeGreaterThan(1.8);
  });
});

describe('measuring what ships', () => {
  // A measurement, not a requirement — and a number the solver in #4 needs.
  //
  // A fitted OKLCH colour carries more precision than a hex byte can hold, so
  // the ratio measured from the OKLCH value and the ratio a browser computes
  // from the emitted token are not the same number. Across this sweep the gap
  // reaches ~0.088 of a ratio point, worst around a dark green on white; a
  // wider sweep (every 5deg of hue, lightness 0.05..0.95, five chromas, four
  // surfaces) finds the same bound.
  //
  // The consequence: a contract satisfied at exactly 4.500 before quantisation
  // can ship at 4.41 and fail an axe-core audit. Either measure the round-tripped
  // colour or carry a margin wider than this gap. Asserted from both sides so
  // that if the pipeline later measures the emitted hex instead, this fails and
  // says so rather than passing quietly.
  it('differs from the emitted hex by up to a tenth of a ratio point', () => {
    let worst = 0;
    let measured = 0;

    for (const surfaceHex of ['#fdfdfd', '#111112', '#ffffff', '#000000']) {
      const surface = parseHex(surfaceHex);

      // Integer step counts, with the lightness derived rather than accumulated:
      // `l += 0.05` drifts, ends at 0.9000000000000002 and silently drops the
      // 0.95 row, so the sweep would cover less than this test claims it does.
      for (let h = 0; h < 360; h += 10) {
        for (let step = 1; step <= 19; step++) {
          const l = step * 0.05;

          for (const c of [0.05, 0.15, 0.3]) {
            const fitted = oklchToSrgb(fitToGamut({l, c, h}));
            const shipped = parseHex(formatHex(fitted));
            const gap = Math.abs(contrastRatio(fitted, surface) - contrastRatio(shipped, surface));

            worst = Math.max(worst, gap);
            measured++;
          }
        }
      }
    }

    // Pins the coverage the comment claims: 4 surfaces x 36 hues x 19 lightnesses
    // x 3 chromas. The accumulating loop this replaced silently measured 7776,
    // and nothing would have noticed.
    expect(measured).toBe(8208);
    expect(worst).toBeGreaterThan(0.05);
    expect(worst).toBeLessThan(0.1);
  });
});
