/**
 * A missed contract does not stop the build. Lattice's values are the identity
 * and several of its documented pairs miss WCAG, so the check reports rather
 * than gates: measured, printed, shipped anyway.
 *
 * The ledger is what keeps those misses visible. A number nobody prints becomes
 * folklore within a release, and the light-mode focus ring — a focus indicator a
 * keyboard user cannot see — is not something to rediscover.
 *
 * `forMode` measures the grey and accent pairs, plus the tinted triple for every
 * chromatic scale and for the severity ramp: a scale's solid as text on its own
 * tint, which is what every Badge, the destructive Button and every Callout are
 * built from.
 *
 * Each tinted triple is measured **twice**, over `bg-raised` and over `bg`. The
 * tint tokens are translucent, so they composite over whichever surface they are
 * placed on, and `.lat-surface` paints several real pages at `--lat-bg`
 * directly. Light danger, warning, success, info, accent and severity moderate
 * all measure worse over `bg` than over `bg-raised`; same accepted colours,
 * measured in a context the shipped CSS already produces.
 *
 * Alpha is composited over its surface before measuring, because that is what a
 * viewer sees.
 */
import {ALPHA_CHANNEL, FOCUS_RING, HAIRLINE, TINT_FRACTIONS, WASH} from '../config/alpha.js';
import {
  ACCENT_TEXT_ANCHORS,
  type ChromaticScale,
  CHROMATIC_SCALES,
  GRAY_ANCHORS,
  ON_SOLID_ANCHORS,
  SOLID_ANCHORS,
} from '../config/anchors.js';
import {MODES, type Mode} from '../config/modes.js';
import {apcaLc, contrastRatio} from './contrast.js';
import {formatHex, parseHex, type Rgb} from './oklch.js';
import {buildSeverity} from './severity.js';

export interface LedgerEntry {
  readonly name: string;
  readonly text: string;
  readonly background: string;
  readonly ratio: number;
  readonly apca: number;
  readonly minimum: number;
  readonly passes: boolean;
}

/**
 * Composite a translucent colour over an opaque one.
 *
 * `parseHex` returns channels in **0..1**, not 0..255, and `contrastRatio`
 * expects the same. Do not round here — rounding a 0..1 channel collapses it to
 * 0 or 1 and every ratio below becomes fiction.
 */
/**
 * Source-over compositing. Exported so tests measure with the same function the
 * ledger does — a second implementation is how the 0..1-vs-0..255 channel bug
 * got in last time.
 */
export function over(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return {
    r: alpha * fg.r + (1 - alpha) * bg.r,
    g: alpha * fg.g + (1 - alpha) * bg.g,
    b: alpha * fg.b + (1 - alpha) * bg.b,
  };
}

function entry(name: string, text: Rgb, background: Rgb, minimum: number): LedgerEntry {
  const ratio = contrastRatio(text, background);
  return {
    name,
    // formatHex, not a manual rgb() string: the channels are 0..1 floats and
    // would otherwise print as `rgb(0.811764 0.949019 0.227450)`.
    text: formatHex(text),
    background: formatHex(background),
    ratio,
    apca: apcaLc(text, background),
    minimum,
    // Rounded to two places first: a pair measuring 4.499 prints as 4.50 and
    // must not be reported as passing something it prints as meeting.
    passes: Number(ratio.toFixed(2)) >= minimum,
  };
}

function forMode(mode: Mode): LedgerEntry[] {
  const gray = GRAY_ANCHORS[mode];
  const bg = parseHex(gray.bg);
  const raised = parseHex(gray['bg-raised']);
  const solid = parseHex(SOLID_ANCHORS.accent[mode]);
  const onSolid = parseHex(ON_SOLID_ANCHORS.accent![mode]);
  const accentText = parseHex(ACCENT_TEXT_ANCHORS[mode]);
  const textOf = (scale: ChromaticScale): Rgb =>
    scale === 'accent' ? accentText : parseHex(SOLID_ANCHORS[scale][mode]);
  const field = parseHex(gray['field-bg']);
  // The ring is anchored, not derived from `solid`. It is still composited over
  // each surface: light ships opaque, so the composite is the anchor itself,
  // while dark ships translucent and genuinely differs per surface — which is
  // why all three are measured rather than one standing in for the others.
  const ringOn = (surface: Rgb): Rgb => over(parseHex(FOCUS_RING[mode].hex), FOCUS_RING[mode].alpha, surface);
  // ALPHA_CHANNEL holds 0..255 strings for CSS output; normalise to the 0..1
  // the colour maths uses.
  const channel = ALPHA_CHANNEL[mode].split(' ').map((v) => Number(v) / 255);
  const hairline = {r: channel[0]!, g: channel[1]!, b: channel[2]!};

  // The tinted triple: a scale's solid as text on its own tint, composited over
  // bg-raised — what every Badge, the destructive Button and every Callout are
  // built from. Accent tints richer (15%) than the status scales (10%); see
  // TINT_FRACTIONS.
  const tints = CHROMATIC_SCALES.map((scale) => {
    const scaleSolid = parseHex(SOLID_ANCHORS[scale][mode]);
    const fraction = scale === 'accent' ? TINT_FRACTIONS.accent.fill : TINT_FRACTIONS.default.fill;
    const tint = over(scaleSolid, fraction, raised);
    return entry(`${mode} ${scale} text on its tint`, textOf(scale), tint, 4.5);
  });

  // The same tinted triple again, composited over `bg` instead of `bg-raised`.
  // `resolveTints` emits every `--lat-*-tint` token as a translucent colour
  // (see config/alpha.ts), not a colour baked against one named surface, so it
  // composites over *whatever it is placed on* — the same reason a hairline
  // border does. `.lat-surface` (src/base.css) paints every story's own root at
  // `--lat-bg`, so a lone Badge or the destructive Button in the component
  // gallery renders this composite, not the bg-raised one above; `SystemPage`'s
  // topbar (`background: var(--lat-bg)`, packages/react/src/pages/pages.css)
  // does the same in a real composed page. Measured independently against a
  // running axe scan of both: the values match exactly (e.g. light danger:
  // 4.49:1 over bg-raised, 3.98:1 over bg — axe reports the same 3.98). Without
  // this row the accepted-foreground floor in packages/react's a11y sweep would
  // reject a composite the shipped CSS produces by construction, on every
  // affected foreground, in light mode, wherever a tinted component sits
  // directly on the page background rather than inside a raised surface.
  const tintsOnBg = CHROMATIC_SCALES.map((scale) => {
    const scaleSolid = parseHex(SOLID_ANCHORS[scale][mode]);
    const fraction = scale === 'accent' ? TINT_FRACTIONS.accent.fill : TINT_FRACTIONS.default.fill;
    const tint = over(scaleSolid, fraction, bg);
    return entry(`${mode} ${scale} text on its tint over bg`, textOf(scale), tint, 4.5);
  });

  // The severity ramp's own tinted triple — Phase 2 gave severity its own
  // tint tokens rather than reusing a chromatic scale, so these four pairs
  // are not covered by `tints` above and were never measured until now.
  // `critical` and `serious` are anchored the same colours as `danger` and
  // `warning`, so they duplicate rows already in this ledger; `moderate` is
  // Lattice's one derived severity colour (see severity.ts), which is
  // exactly where an unmeasured pair is most likely to be wrong.
  const severityColoured = buildSeverity(mode).map((swatch) => {
    const swatchSolid = parseHex(swatch.hex);
    const tint = over(swatchSolid, TINT_FRACTIONS.default.fill, raised);
    return entry(`${mode} severity ${swatch.role} text on its tint`, swatchSolid, tint, 4.5);
  });

  // Severity's tinted triple over `bg`, for the same reason as `tintsOnBg`
  // above — a severity Badge (`critical`/`serious`/`moderate`) is exactly as
  // likely to sit directly on the page background as a chromatic-scale one,
  // and `moderate` in particular has no chromatic-scale sibling to borrow a
  // floor from, so without this row its bg composite is entirely unmeasured.
  const severityColouredOnBg = buildSeverity(mode).map((swatch) => {
    const swatchSolid = parseHex(swatch.hex);
    const tint = over(swatchSolid, TINT_FRACTIONS.default.fill, bg);
    return entry(`${mode} severity ${swatch.role} text on its tint over bg`, swatchSolid, tint, 4.5);
  });

  // `minor` carries no swatch of its own — it aliases to text-subtle on wash
  // (see resolveSeverityTints in severity.ts) — so it is measured the same
  // way the hairline row above composites an alpha layer over `bg-raised`,
  // rather than through buildSeverity.
  const severityMinor = entry(
    `${mode} severity minor text on its tint`,
    parseHex(gray['text-subtle']),
    over(hairline, WASH, raised),
    4.5,
  );

  return [
    entry(`${mode} text on bg`, parseHex(gray.text), bg, 4.5),
    entry(`${mode} text-subtle on bg-raised`, parseHex(gray['text-subtle']), raised, 4.5),
    entry(`${mode} text on component`, parseHex(gray.text), parseHex(gray.component), 4.5),
    entry(`${mode} on-solid on solid`, onSolid, solid, 4.5),
    entry(`${mode} accent as text on bg`, accentText, bg, 4.5),
    // SC 1.4.11: a focus indicator needs 3:1 against what surrounds it. Every
    // surface a component draws the ring on is measured, rather than one
    // standing in for the others. All six currently pass; `field-bg` is the
    // narrowest at 3.17 in dark, so it is the row that would move first if a
    // surface or the ring changed — which is the reason to measure it, not a
    // claim that it fails today.
    entry(`${mode} focus ring on bg`, ringOn(bg), bg, 3),
    entry(`${mode} focus ring on bg-raised`, ringOn(raised), raised, 3),
    entry(`${mode} focus ring on field-bg`, ringOn(field), field, 3),
    entry(`${mode} hairline on bg-raised`, over(hairline, HAIRLINE[mode], raised), raised, 1),
    ...tints,
    ...tintsOnBg,
    ...severityColoured,
    ...severityColouredOnBg,
    severityMinor,
  ];
}

export function buildLedger(): LedgerEntry[] {
  return MODES.flatMap(forMode);
}

export function formatLedger(entries: readonly LedgerEntry[]): string {
  return entries
    .map((e) => {
      const marker = e.passes ? '    ' : 'FAIL';
      return (
        `  ${marker} ${e.name.padEnd(34)} ${e.ratio.toFixed(2).padStart(6)}:1  ` +
        `min ${e.minimum.toFixed(1)}  Lc ${e.apca.toFixed(1)}`
      );
    })
    .join('\n');
}
