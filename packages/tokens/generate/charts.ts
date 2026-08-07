/**
 * Building and checking the chart palettes.
 *
 * The categorical palette carries six checks. Two of them — that the order is
 * fixed and that the values are the documented ones — are structural rules a
 * hand-run validator can only assert on trust; here they are computable, because
 * the order comes from config and the hexes are generated rather than pasted.
 */

import {
  ALL_PAIRS_CAP,
  CATEGORICAL,
  CATEGORICAL_CHROMA,
  CHART_SURFACES,
  CHECKS,
  ORDINAL_CLAMP,
  SEQUENTIAL,
  SEQUENTIAL_HUE,
  TIERS,
} from '../config/charts.js';
import type {Mode} from '../config/modes.js';
import {apcaLc, contrastRatio} from './contrast.js';
import {deltaE} from './cvd.js';
import {parseHex, ship} from './oklch.js';

export interface ChartSwatch {
  readonly slot: number;
  readonly name: string;
  readonly l: number;
  readonly c: number;
  readonly h: number;
  readonly hex: string;
}

export interface SequentialSwatch {
  readonly step: number;
  readonly l: number;
  readonly c: number;
  readonly h: number;
  readonly hex: string;
}

/**
 * A check outcome.
 *
 * `warn` is not a soft failure but a documented conditional: it means the palette
 * is legal only with a secondary encoding, and the build reports it without
 * stopping. `fail` stops the build.
 */
export type CheckState = 'pass' | 'warn' | 'fail';

export interface CheckResult {
  readonly name: string;
  readonly state: CheckState;
  readonly detail: string;
}

export interface PaletteReport {
  readonly mode: Mode;
  readonly pairs: 'adjacent' | 'all';
  readonly checks: readonly CheckResult[];
  readonly ok: boolean;
}

/**
 * What both validators return for an empty palette.
 *
 * Neither can say anything useful about no colours, and each would otherwise get
 * it wrong in an opposite way: every categorical check passes vacuously — no slot
 * is off the band, no pair is too close — while the ordinal light-end check
 * indexes into an empty array and throws. A named failure says which it is.
 */
const EMPTY_CHECK: CheckResult = {
  name: 'Palette present',
  state: 'fail',
  detail: 'empty palette — nothing to validate',
};

export function buildCategorical(mode: Mode): ChartSwatch[] {
  return CATEGORICAL.map((entry) => {
    const {oklch, hex} = ship({
      l: TIERS[entry.tier][mode],
      c: CATEGORICAL_CHROMA,
      h: entry.hue,
    });

    return {slot: entry.slot, name: entry.name, l: oklch.l, c: oklch.c, h: oklch.h, hex};
  });
}

export function buildSequential(): SequentialSwatch[] {
  return SEQUENTIAL.map((entry) => {
    const {oklch, hex} = ship({l: entry.l, c: entry.c, h: SEQUENTIAL_HUE});

    return {step: entry.step, l: oklch.l, c: oklch.c, h: oklch.h, hex};
  });
}

function pairsOf(count: number, kind: 'adjacent' | 'all'): [number, number][] {
  const list: [number, number][] = [];

  for (let i = 0; i < count; i++) {
    if (kind === 'adjacent') {
      if (i + 1 < count) {
        list.push([i, i + 1]);
      }
      continue;
    }
    for (let j = i + 1; j < count; j++) {
      list.push([i, j]);
    }
  }

  return list;
}

/**
 * The six checks, in the order the design states them.
 *
 * `pairs: 'all'` is the scatter/bubble/small-multiples case, where any two slots
 * can end up side by side.
 */
export function validateCategorical(
  palette: readonly ChartSwatch[],
  mode: Mode,
  options: {readonly pairs?: 'adjacent' | 'all'; readonly surface?: string} = {},
): PaletteReport {
  const pairs = options.pairs ?? 'adjacent';
  const surface = options.surface ?? CHART_SURFACES[mode];
  const checks: CheckResult[] = [];

  // An empty palette otherwise passes every check vacuously — no slot is off the
  // band, no pair is too close — and reports ok. That is the quietest possible
  // way to gate a build on nothing.
  if (palette.length === 0) {
    return {mode, pairs, checks: [EMPTY_CHECK], ok: false};
  }

  // 1. Fixed order, never cycled. Compared against the matching prefix, because
  //    a scatter chart legitimately validates only the leading slots.
  const expected = CATEGORICAL.slice(0, palette.length)
    .map((entry) => `${entry.slot}:${entry.name}`)
    .join(' ');
  const actual = palette.map((swatch) => `${swatch.slot}:${swatch.name}`).join(' ');
  checks.push({
    name: 'Fixed order',
    state: actual === expected ? 'pass' : 'fail',
    detail: actual === expected ? `${palette.length} slots in the documented order` : actual,
  });

  // 2. Lightness band.
  const [low, high] = CHECKS.band[mode];
  const offBand = palette.filter((swatch) => swatch.l < low || swatch.l > high);
  checks.push({
    name: 'Lightness band',
    state: offBand.length === 0 ? 'pass' : 'fail',
    detail:
      offBand.length === 0
        ? `all ${palette.length} inside L ${low}–${high}`
        : `outside the band: ${offBand.map((s) => `${s.name} ${s.l.toFixed(3)}`).join(', ')}`,
  });

  // 3. Chroma floor — below it a hue reads as grey.
  const dull = palette.filter((swatch) => swatch.c < CHECKS.chromaFloor);
  checks.push({
    name: 'Chroma floor',
    state: dull.length === 0 ? 'pass' : 'fail',
    detail:
      dull.length === 0
        ? `all ${palette.length} at or above ${CHECKS.chromaFloor}`
        : `reads grey: ${dull.map((s) => `${s.name} ${s.c.toFixed(3)}`).join(', ')}`,
  });

  // 4. CVD separation, worst of protanopia and deuteranopia; tritanopia reported.
  const list = pairsOf(palette.length, pairs);
  let worst = {distance: Number.POSITIVE_INFINITY, detail: 'n/a'};

  for (const kind of ['protan', 'deutan'] as const) {
    for (const [i, j] of list) {
      const distance = deltaE(parseHex(palette[i]!.hex), parseHex(palette[j]!.hex), kind);

      if (distance < worst.distance) {
        worst = {distance, detail: `${palette[i]!.name} vs ${palette[j]!.name} (${kind})`};
      }
    }
  }

  const tritan = list.length
    ? Math.min(...list.map(([i, j]) => deltaE(parseHex(palette[i]!.hex), parseHex(palette[j]!.hex), 'tritan')))
    : Number.POSITIVE_INFINITY;

  // 4b. Normal vision, folded into the same check because they are two floors on
  //     one property. The CVD floor protects dichromat readers; this one protects
  //     everyone else, and it is the harder gate — a secondary encoding excuses a
  //     CVD warning but never this.
  let worstNormal = {distance: Number.POSITIVE_INFINITY, detail: 'n/a'};

  for (const [i, j] of list) {
    const distance = deltaE(parseHex(palette[i]!.hex), parseHex(palette[j]!.hex));

    if (distance < worstNormal.distance) {
      worstNormal = {distance, detail: `${palette[i]!.name} vs ${palette[j]!.name}`};
    }
  }

  const separation: CheckState =
    worstNormal.distance < CHECKS.normalFloor || worst.distance < CHECKS.cvdFloor
      ? 'fail'
      : worst.distance < CHECKS.cvdTarget
        ? 'warn'
        : 'pass';

  checks.push({
    name: 'Separation',
    state: separation,
    detail:
      `worst ${pairs} CVD ΔE ${worst.distance.toFixed(1)} — ${worst.detail}; ` +
      `tritan ${tritan.toFixed(1)}; normal ΔE ${worstNormal.distance.toFixed(1)} — ${worstNormal.detail}`,
  });

  // 5. Contrast against the surface. Sub-3:1 is a documented relief case —
  //    legal with visible labels or a table view — so it warns.
  const faint = palette.filter((swatch) => contrastRatio(parseHex(swatch.hex), parseHex(surface)) < CHECKS.contrastMin);
  // APCA is reported beside the gate and never folded into it: the state above
  // is decided by the WCAG ratio alone. Reported as the worst Lc in the palette,
  // since a mark that disappears is the one worth knowing about.
  const worstLc = Math.min(...palette.map((swatch) => Math.abs(apcaLc(parseHex(swatch.hex), parseHex(surface)))));

  checks.push({
    name: 'Contrast vs surface',
    state: faint.length === 0 ? 'pass' : 'warn',
    detail: `worst APCA Lc ${worstLc.toFixed(1)} (advisory) · ${
      faint.length === 0
        ? `all ${palette.length} at or above ${CHECKS.contrastMin}:1 against ${surface}`
        : `relief required for: ${faint
            .map((s) => `${s.name} ${contrastRatio(parseHex(s.hex), parseHex(surface)).toFixed(2)}:1`)
            .join(', ')}`
    }`,
  });

  // 6. The values are the generated ones. In a hand-run validator this is a
  //    promise; here the palette is rebuilt and compared.
  const rebuilt = buildCategorical(mode).slice(0, palette.length);
  const drifted = palette.filter((swatch, index) => swatch.hex !== rebuilt[index]?.hex);
  checks.push({
    name: 'Documented values',
    state: drifted.length === 0 ? 'pass' : 'fail',
    detail:
      drifted.length === 0
        ? 'every slot matches the generated palette'
        : drifted.map((s) => `${s.name} ${s.hex}`).join(', '),
  });

  return {mode, pairs, checks, ok: checks.every((check) => check.state !== 'fail')};
}

/**
 * The steps an **ordinal** encoding may use in a given mode.
 *
 * The full ramp is for sequential encoding, where the palest step may recede into
 * the surface without harm — a heat map's lightest cell reads as "least", and
 * fading into the background says exactly that. Ordinal marks are discrete, and
 * each one has to read as a mark, so the end that would vanish is dropped: light
 * starts no lighter than 300, dark goes no darker than 600.
 */
export function ordinalRange(mode: Mode): SequentialSwatch[] {
  const clamp = ORDINAL_CLAMP[mode];

  return buildSequential().filter((swatch) => (mode === 'light' ? swatch.step >= clamp : swatch.step <= clamp));
}

/**
 * The ordinal checks.
 *
 * A correct ramp fails the categorical checks by design — it spans the lightness
 * band, and its pale steps sit under the chroma floor — so it is measured against
 * whether it reads *as a ramp* instead.
 *
 * Give it {@link ordinalRange}, not the full ramp: the light-end floor here is
 * the check the clamp exists to satisfy, and running it against the unclamped
 * ramp fails by construction.
 */
export function validateSequential(
  palette: readonly SequentialSwatch[],
  mode: Mode,
  options: {readonly surface?: string} = {},
): PaletteReport {
  const surface = options.surface ?? CHART_SURFACES[mode];
  const checks: CheckResult[] = [];

  // Same reasoning as the categorical validator, plus this one would throw:
  // the light-end check indexes into a sorted empty array.
  if (palette.length === 0) {
    return {mode, pairs: 'adjacent', checks: [EMPTY_CHECK], ok: false};
  }

  const lightnesses = palette.map((swatch) => swatch.l);

  // Monotone lightness, in either direction — a ramp declared dark-to-light is
  // still a ramp. The detail names the direction found rather than assuming one.
  const ascending = lightnesses.every((l, i) => i === 0 || l > lightnesses[i - 1]!);
  const descending = lightnesses.every((l, i) => i === 0 || l < lightnesses[i - 1]!);
  checks.push({
    name: 'Lightness monotone',
    state: ascending || descending ? 'pass' : 'fail',
    detail: descending
      ? 'steps read light to dark'
      : ascending
        ? 'steps read dark to light'
        : `not monotone: ${lightnesses.map((l) => l.toFixed(3)).join(', ')}`,
  });

  // Adjacent gaps. Filtered on the raw gap rather than a rounded one, so a gap
  // that only reaches the floor after rounding still fails.
  const thin = palette
    .slice(1)
    .map((swatch, index) => ({swatch, gap: Math.abs(swatch.l - palette[index]!.l)}))
    .filter((entry) => entry.gap < CHECKS.ordinalMinDeltaL);
  const gaps = palette.slice(1).map((swatch, index) => Math.abs(swatch.l - palette[index]!.l));
  checks.push({
    name: 'Adjacent ΔL',
    state: thin.length === 0 ? 'pass' : 'fail',
    detail:
      thin.length === 0
        ? `all gaps at or above ${CHECKS.ordinalMinDeltaL} (smallest ${Math.min(...gaps).toFixed(3)})`
        : thin.map((entry) => `${entry.swatch.step} ${entry.gap.toFixed(3)}`).join(', '),
  });

  // The palest end still has to read as a mark against the surface.
  const byLightness = [...palette].sort((a, b) => a.l - b.l);
  const palest = mode === 'light' ? byLightness.at(-1)! : byLightness[0]!;
  const ratio = contrastRatio(parseHex(palest.hex), parseHex(surface));
  checks.push({
    name: 'Light-end contrast',
    state: ratio >= CHECKS.ordinalLightFloor ? 'pass' : 'fail',
    detail: `${palest.step} at ${ratio.toFixed(2)}:1 against ${surface}`,
  });

  // One hue: a jump would mean it is really a categorical palette.
  const hues = palette.map((swatch) => swatch.h);
  let spread = Math.max(...hues) - Math.min(...hues);
  if (spread > 180) {
    spread = 360 - spread;
  }
  checks.push({
    name: 'Single hue',
    state: spread <= 40 ? 'pass' : 'fail',
    detail: `hue spread ${spread.toFixed(1)}°`,
  });

  return {mode, pairs: 'adjacent', checks, ok: checks.every((check) => check.state !== 'fail')};
}

/**
 * The leading slots that stay separable when every pair is compared.
 *
 * Returns the largest prefix passing the all-pairs check in both modes, which is
 * the number a scatter or bubble chart may use before folding the tail into
 * "Other".
 */
export function allPairsCap(modes: readonly Mode[]): number {
  let cap = 0;

  for (let size = 2; size <= CATEGORICAL.length; size++) {
    const holds = modes.every((mode) => {
      const prefix = buildCategorical(mode).slice(0, size);

      return validateCategorical(prefix, mode, {pairs: 'all'}).ok;
    });

    if (!holds) {
      break;
    }
    cap = size;
  }

  return cap;
}

export {ALL_PAIRS_CAP, ORDINAL_CLAMP};
