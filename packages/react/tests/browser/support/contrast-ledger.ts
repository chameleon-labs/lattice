import { readFileSync } from 'node:fs'

/**
 * Turns the tokens package's contrast ledger into the set of `color-contrast`
 * axe violations the a11y sweep is allowed to let through, and classifies axe
 * violations against it.
 *
 * ## Why a generated set, not a hand-copied one
 *
 * `docs/superpowers/specs/2026-08-03-lattice-identity-design.md` §9 documents
 * twenty-one contrast pairs that fail WCAG and ship anyway — a knowing,
 * approved decision, not an oversight. `packages/tokens/generate/report.ts`
 * already computes that ledger and prints it on every build; hand-copying it
 * into a second list here would let the two drift the first time a token
 * value changed and nobody remembered to update both places. Instead,
 * `packages/tokens/generate/build.ts` writes the ledger it already computed
 * to `dist/contrast-ledger.json`, and this module reads that file. Adding or
 * removing a ledger row changes this file's accepted set with no edit here.
 *
 * The read is a plain relative path across the package boundary — the same
 * pattern `tests/package-contract.test.ts` already uses to read the tokens
 * package's `package.json` — rather than a package-specifier import, so
 * this file has no runtime dependency on the tokens package's module graph,
 * only on the artifact it publishes to `dist/`. (It is also published as
 * `@chameleon-labs/lattice-tokens/contrast-ledger.json` in that package's
 * `exports` map, for anyone who does want to reach it that way.)
 *
 * `dist/` is gitignored, so the tokens package has to be built before this
 * file exists — already true of `dist/lattice.css`, which Storybook's preview
 * imports, so the a11y sweep could not run at all without it either. CI's
 * "Build tokens" step covers both.
 *
 * ## Why a floor, not an exact pair match
 *
 * The ledger measures token *pairs*: one named background per foreground.
 * axe measures rendered *composites*, and those are not always the same
 * pair. `--lat-text-subtle`, for instance, is measured in the ledger against
 * `bg-raised` (3.67:1) but components also place it directly on `--lat-bg`
 * (3.83:1) and on `--lat-wash` over `bg-raised` (3.27:1, captured separately
 * in the ledger as the severity-`minor` row, since that is the one other
 * context the design actually composites it in). Those are the same
 * deficient foreground in a different context, not a new defect — a strict
 * pair match (foreground *and* background hex) would reject the two contexts
 * the ledger did not happen to name, which is exactly the CSS-selector-style
 * churn this design is meant to avoid.
 *
 * So acceptance keys on **foreground colour plus a floor**: a `color-contrast`
 * violation is accepted only if (a) its foreground hex matches a foreground
 * the ledger already records as failing, and (b) its measured ratio is not
 * *worse* than the worst ratio the ledger records for that foreground. That
 * floor is deliberately the worst, not the best, of the ratios the ledger
 * already has on record for the colour — every context the design is already
 * known to place that foreground in is covered, without covering a ratio
 * worse than any the ledger has already put in front of a human reviewer.
 *
 * This is not "accept every color-contrast violation": a foreground that
 * never appears in a failing ledger row has no floor and is never accepted,
 * so a genuinely new bad pair — a colour the ledger has not flagged at all,
 * or the same deficient foreground measured *below* its worst recorded
 * ratio — still fails the suite. See tests/browser/a11y.spec.ts for where
 * this is wired in, and the three discrimination checks recorded in the
 * commit that introduced this file for proof it can still fail.
 */

/** Mirrors `LedgerEntry` from `packages/tokens/generate/report.ts`. */
interface LedgerEntry {
  readonly name: string
  readonly text: string
  readonly background: string
  readonly ratio: number
  readonly apca: number
  readonly minimum: number
  readonly passes: boolean
}

function loadLedger(): LedgerEntry[] {
  const url = new URL('../../../../tokens/dist/contrast-ledger.json', import.meta.url)

  let raw: string
  try {
    raw = readFileSync(url, 'utf8')
  } catch (cause) {
    throw new Error(
      'contrast-ledger.json is missing. Run `pnpm --filter @chameleon-labs/lattice-tokens ' +
        'build` before the react a11y sweep — it emits dist/contrast-ledger.json alongside ' +
        'dist/lattice.css, which Storybook already needs to render at all.',
      { cause }
    )
  }

  return JSON.parse(raw) as LedgerEntry[]
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
export function acceptedContrastFloors(): ReadonlyMap<string, number> {
  const floors = new Map<string, number>()

  for (const entry of loadLedger()) {
    if (entry.passes) continue

    const key = entry.text.toLowerCase()
    const flooredRatio = Math.floor(entry.ratio * 100) / 100
    const worst = floors.get(key)
    if (worst === undefined || flooredRatio < worst) {
      floors.set(key, flooredRatio)
    }
  }

  return floors
}

/** The subset of an axe `CheckResult["data"]` this module reads. */
interface ContrastCheckData {
  readonly fgColor?: string
  readonly bgColor?: string
  readonly contrastRatio?: number
  readonly expectedContrastRatio?: string
  readonly fontSize?: string
  readonly fontWeight?: string
}

// Structural, minimal shapes for the slice of `axe-core`'s `Result` type this
// module reads. Declared locally rather than imported from `axe-core` — that
// package is a transitive dependency here (of `@axe-core/playwright`, not a
// direct one) and is not resolvable as a bare specifier from this package.
// `AxeResults['violations']` from `@axe-core/playwright` structurally
// satisfies this at every call site.
interface AxeCheckResult {
  readonly data?: unknown
}

interface AxeNodeResult {
  readonly target: readonly unknown[]
  readonly any: readonly AxeCheckResult[]
}

export interface AxeViolation {
  readonly id: string
  readonly impact?: string | null
  readonly help: string
  readonly nodes: readonly AxeNodeResult[]
}

export interface ViolationSummaryEntry {
  readonly rule: string
  readonly impact: string | null | undefined
  readonly help: string
  readonly targets: readonly string[]
}

/** The first check on a node whose data looks like a contrast measurement. */
function contrastData(node: AxeNodeResult): ContrastCheckData | undefined {
  for (const check of node.any) {
    const data = check.data as ContrastCheckData | null | undefined
    if (data != null && typeof data.fgColor === 'string' && typeof data.contrastRatio === 'number') {
      return data
    }
  }
  return undefined
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
  floors: ReadonlyMap<string, number>
): ViolationSummaryEntry[] {
  const summary: ViolationSummaryEntry[] = []

  for (const violation of violations) {
    if (violation.id !== 'color-contrast') {
      summary.push({
        rule: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.map((node) => node.target.join(' '))
      })
      continue
    }

    const unaccepted: string[] = []

    for (const node of violation.nodes) {
      const data = contrastData(node)
      const target = node.target.join(' ')

      if (data === undefined) {
        // No parseable fg/bg/ratio data to check against the ledger — cannot
        // prove this is an accepted deficiency, so it is not treated as one.
        unaccepted.push(`${target} — color-contrast violation with no measurable fg/bg data`)
        continue
      }

      const floor = floors.get(data.fgColor!.toLowerCase())
      const accepted = floor !== undefined && data.contrastRatio! >= floor

      if (!accepted) {
        const reason =
          floor === undefined
            ? 'foreground is not a documented deficiency in the contrast ledger'
            : `below the ${floor}:1 floor the ledger records for this foreground`

        unaccepted.push(
          `${target} — fg ${data.fgColor} on bg ${data.bgColor}, measured ${data.contrastRatio}:1, ` +
            `expected ${data.expectedContrastRatio}, font ${data.fontSize} ${data.fontWeight} (${reason})`
        )
      }
    }

    if (unaccepted.length > 0) {
      summary.push({
        rule: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: unaccepted
      })
    }
  }

  return summary
}
