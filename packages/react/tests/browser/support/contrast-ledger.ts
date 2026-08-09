import {readFileSync} from 'node:fs';

/**
 * Turns the tokens package's contrast ledger into the set of `color-contrast`
 * axe violations the a11y sweep is allowed to let through, and classifies axe
 * violations against it.
 *
 * The set is read from `dist/contrast-ledger.json`, which the tokens build
 * already writes, rather than hand-copied here — a second list would drift the
 * first time a token changed and only one place was updated. Adding or removing
 * a ledger row changes the accepted set with no edit to this file. `dist/` is
 * gitignored, so the tokens package must be built first; CI's "Build tokens"
 * step already covers that for `lattice.css`.
 *
 * ## Why a floor rather than an exact pair match
 *
 * The ledger measures token *pairs*, one named background per foreground. axe
 * measures rendered *composites*, which are not always the same pair:
 * `--lat-text-subtle` is recorded against `bg-raised` (3.67:1), but components
 * also place it on `--lat-bg` (3.83:1) and on `--lat-wash` over `bg-raised`
 * (3.27:1). Those are one deficient foreground in different contexts rather than
 * new defects, and matching foreground *and* background would reject the
 * contexts the ledger did not happen to name.
 *
 * So acceptance keys on **foreground plus a floor**: the foreground hex must
 * match one the ledger already records as failing, and the measured ratio must
 * not be worse than the *worst* ratio recorded for it. Worst rather than best,
 * so every context the design is known to use is covered without covering one
 * no reviewer has seen.
 *
 * This is not "accept every color-contrast violation". A foreground with no
 * failing row has no floor and is never accepted, so a genuinely new bad pair
 * still fails. Wired in at tests/browser/a11y.spec.ts.
 */

/** Mirrors `LedgerEntry` from `packages/tokens/generate/report.ts`. */
interface LedgerEntry {
  readonly name: string;
  readonly text: string;
  readonly background: string;
  readonly ratio: number;
  readonly apca: number;
  readonly minimum: number;
  readonly passes: boolean;
}

function loadLedger(): LedgerEntry[] {
  const url = new URL('../../../../tokens/dist/contrast-ledger.json', import.meta.url);

  let raw: string;
  try {
    raw = readFileSync(url, 'utf8');
  } catch (cause) {
    throw new Error(
      'contrast-ledger.json is missing. Run `pnpm --filter @chameleon-labs/lattice-tokens ' +
        'build` before the react a11y sweep — it emits dist/contrast-ledger.json alongside ' +
        'dist/lattice.css, which Storybook already needs to render at all.',
      {cause},
    );
  }

  return JSON.parse(raw) as LedgerEntry[];
}

/**
 * Foreground hex (lowercased) → the worst ratio the ledger records for it,
 * among the entries the ledger itself marks as failing.
 *
 * Passing entries are excluded on purpose: a foreground the ledger only ever
 * measures as passing is not a "documented accepted deficiency", so a new
 * axe violation naming that colour has nothing to be forgiven by and must
 * fail like any other undocumented pair.
 *
 * Truncated to two decimal places by **flooring**, not rounding, to match
 * axe's own `contrastRatio` field: it is computed as
 * `Math.floor(contrast2 * 100) / 100` (axe-core's `color-contrast` check).
 * The ledger keeps full float precision (e.g. `3.332607474133339`); without
 * matching axe's truncation, measuring the exact documented pair the ledger
 * already accepted comes back as axe's `3.33` against a floor of
 * `3.332607…`, and `3.33 >= 3.332607…` is false — rejecting the very pair
 * this mechanism exists to accept, not because it is worse, but because the
 * two sides were rounded differently. Flooring the ledger's value the same
 * way axe floors its measurement makes the same real-world pair compare
 * equal, and still fails anything that is genuinely worse: a true ratio has
 * to drop by more than the width of one truncation step (up to 0.01) before
 * its floored value changes.
 */
export interface AcceptedFloor {
  /** The worst ratio the ledger records for this foreground. */
  readonly floor: number;
  /** Every background it was measured against, lowercased. */
  readonly backgrounds: ReadonlySet<string>;
}

export function acceptedContrastFloors(): ReadonlyMap<string, AcceptedFloor> {
  const floors = new Map<string, {floor: number; backgrounds: Set<string>}>();

  for (const entry of loadLedger()) {
    if (entry.passes) {
      continue;
    }

    const key = entry.text.toLowerCase();
    const flooredRatio = Math.floor(entry.ratio * 100) / 100;
    const existing = floors.get(key);

    if (existing === undefined) {
      floors.set(key, {floor: flooredRatio, backgrounds: new Set([entry.background.toLowerCase()])});
      continue;
    }

    existing.backgrounds.add(entry.background.toLowerCase());
    existing.floor = Math.min(existing.floor, flooredRatio);
  }

  return floors;
}

/*
 * The ledger composites a translucent tint in floating point and rounds each
 * channel once; the browser rounds the same value independently. At an exact
 * .5 tie the two land one 8-bit unit apart — the accent tint over `bg` is
 * 0.15 x 58 + 0.85 x 248 = 219.5 — which moves the ratio by up to 0.02. That
 * is quantisation, not a colour that changed, so the floor absorbs one unit.
 */
const CHANNEL_ROUNDING = 0.02;

/** True when two 8-bit hex colours differ by at most one unit in each channel. */
function withinOneUnit(a: string, b: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) {
    return false;
  }

  for (let index = 1; index < 7; index += 2) {
    const left = Number.parseInt(a.slice(index, index + 2), 16);
    const right = Number.parseInt(b.slice(index, index + 2), 16);

    if (Math.abs(left - right) > 1) {
      return false;
    }
  }

  return true;
}

/** The subset of an axe `CheckResult["data"]` this module reads. */
interface ContrastCheckData {
  readonly fgColor?: string;
  readonly bgColor?: string;
  readonly contrastRatio?: number;
  readonly expectedContrastRatio?: string;
  readonly fontSize?: string;
  readonly fontWeight?: string;
}

// Structural, minimal shapes for the slice of `axe-core`'s `Result` type this
// module reads. Declared locally rather than imported from `axe-core` — that
// package is a transitive dependency here (of `@axe-core/playwright`, not a
// direct one) and is not resolvable as a bare specifier from this package.
// `AxeResults['violations']` from `@axe-core/playwright` structurally
// satisfies this at every call site.
interface AxeCheckResult {
  readonly data?: unknown;
}

interface AxeNodeResult {
  readonly target: readonly unknown[];
  readonly any: readonly AxeCheckResult[];
}

export interface AxeViolation {
  readonly id: string;
  readonly impact?: string | null;
  readonly help: string;
  readonly nodes: readonly AxeNodeResult[];
}

export interface ViolationSummaryEntry {
  readonly rule: string;
  readonly impact: string | null | undefined;
  readonly help: string;
  readonly targets: readonly string[];
}

/** The first check on a node whose data looks like a contrast measurement. */
function contrastData(node: AxeNodeResult): ContrastCheckData | undefined {
  for (const check of node.any) {
    const data = check.data as ContrastCheckData | null | undefined;
    if (
      data !== null &&
      data !== undefined &&
      typeof data.fgColor === 'string' &&
      typeof data.contrastRatio === 'number'
    ) {
      return data;
    }
  }
  return undefined;
}

/**
 * Reduces axe's violations to the summary the sweep asserts is empty.
 *
 * Every rule other than `color-contrast` passes through unchanged — any
 * violation of those fails the suite, exactly as before this change, because
 * that is the guarantee that has already caught real defects (a
 * keyboard-unreachable scrollable region, a missing landmark, a duplicated
 * region label) and it must not weaken.
 *
 * `color-contrast` violations are filtered node by node against `floors`
 * (see {@link acceptedContrastFloors}): a node whose foreground/ratio is
 * covered by the ledger is dropped, a node that is not is kept, with its
 * colours and ratios spelled out so a CI reader can tell instantly whether
 * it is a new defect or a ledger that needs updating. A violation with every
 * node dropped disappears from the summary entirely; a violation with any
 * node surviving still fails.
 */
export function summarizeViolations(
  violations: readonly AxeViolation[],
  floors: ReadonlyMap<string, AcceptedFloor>,
): ViolationSummaryEntry[] {
  const summary: ViolationSummaryEntry[] = [];

  for (const violation of violations) {
    if (violation.id !== 'color-contrast') {
      summary.push({
        rule: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.map((node) => node.target.join(' ')),
      });
      continue;
    }

    const unaccepted: string[] = [];

    for (const node of violation.nodes) {
      const data = contrastData(node);
      const target = node.target.join(' ');

      if (data === undefined) {
        // No parseable fg/bg/ratio data to check against the ledger — cannot
        // prove this is an accepted deficiency, so it is not treated as one.
        unaccepted.push(`${target} — color-contrast violation with no measurable fg/bg data`);
        continue;
      }

      const documented = floors.get(data.fgColor!.toLowerCase());
      const floor = documented?.floor;
      // The allowance applies only where the browser's composite is the
      // ledger's own, one channel unit apart. A pair the ledger measured
      // against some other surface gets the exact floor.
      const quantised =
        documented !== undefined &&
        [...documented.backgrounds].some((background) => withinOneUnit(background, data.bgColor!.toLowerCase()));
      const accepted =
        documented !== undefined && data.contrastRatio! >= documented.floor - (quantised ? CHANNEL_ROUNDING : 0);

      if (!accepted) {
        const reason =
          floor === undefined
            ? 'foreground is not a documented deficiency in the contrast ledger'
            : `below the ${floor}:1 floor the ledger records for this foreground`;

        unaccepted.push(
          `${target} — fg ${data.fgColor} on bg ${data.bgColor}, measured ${data.contrastRatio}:1, ` +
            `expected ${data.expectedContrastRatio}, font ${data.fontSize} ${data.fontWeight} (${reason})`,
        );
      }
    }

    if (unaccepted.length > 0) {
      summary.push({
        rule: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: unaccepted,
      });
    }
  }

  return summary;
}
