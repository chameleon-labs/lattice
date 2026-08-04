/**
 * @vitest-environment node
 *
 * Assembles the stylesheet from source, the same way stylesheet.test.ts does
 * and for the same reason: reading dist/ passes locally and fails from a
 * clean tree (CI runs `test` before `build`), and this must not run under
 * jsdom, where the global URL resolves relative imports against the
 * document's base instead of import.meta.url.
 *
 * This file exists because nothing else would have caught the regression a
 * reviewer found in Badge's severity variants: `.lat-badge[data-variant=
 * 'moderate']` briefly pointed at `--lat-info-tint` / `--lat-info-tint-border`
 * / `--lat-info-solid` instead of the severity ramp's own
 * `--lat-severity-moderate-*` tokens — a blue at hue 232 standing in for an
 * amber at hue 84. `stylesheet.test.ts`'s "references only tokens the token
 * package declares" only checks that a referenced var() name is *declared
 * somewhere in the token package*, which `--lat-info-tint` is — it does not
 * check *which* token a given variant reaches for. `badge.test.tsx` only
 * asserts `data-variant` reflects the `variant` prop; it never evaluates the
 * CSS a `data-variant` value resolves through. So a variant block silently
 * wired to the wrong scale would have passed every other test in the suite.
 *
 * That substitution is not a cosmetic near-miss: it drops the badge out of
 * both halves of the severity ramp's safety net simultaneously — the hue
 * ordering (there is no chromatic scale anywhere near amber's hue 84; the
 * nearest, warning, sits at 41/56) and the lightness ordering Phase 1 pinned
 * specifically for when hue fails under protanopia and deuteranopia
 * (critical 0.678 < serious 0.758 < moderate 0.837 in dark). This test reads
 * the actual CSS text and asserts each severity variant block references its
 * own three severity tokens and no chromatic-scale token at all, so a future
 * copy-paste of a chromatic block's tokens into a severity block fails here
 * instead of shipping silently.
 */
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { assembleCss } from '../scripts/assemble-css.js'

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)))

// The six chromatic scales severity must never reach for — there is no
// chromatic scale at any severity level's hue, so a variant block that
// references one of these is necessarily borrowing from the wrong ramp.
const CHROMATIC_SCALES = ['accent', 'danger', 'warning', 'success', 'info', 'decorative'] as const

const SEVERITY_LEVELS = ['critical', 'serious', 'moderate', 'minor'] as const

function badgeVariantBlock(level: string): string {
  const pattern = new RegExp(`\\.lat-badge\\[data-variant='${level}'\\]\\s*\\{([^}]*)\\}`)
  const match = pattern.exec(css)
  if (match === null) {
    throw new Error(`no .lat-badge[data-variant='${level}'] block found in the assembled stylesheet`)
  }
  return match[1] ?? ''
}

describe("Badge's severity variant blocks", () => {
  it.each(SEVERITY_LEVELS)(
    "'%s' reads its own severity tokens, and no chromatic scale's",
    (level) => {
      const block = badgeVariantBlock(level)

      expect(block).toContain(`--_tint: var(--lat-severity-${level}-tint);`)
      expect(block).toContain(`--_tint-border: var(--lat-severity-${level}-tint-border);`)
      expect(block).toContain(`--_text: var(--lat-severity-${level});`)

      // The negative half is the important half — this is the exact shape
      // the regression took: every token above being individually declared
      // somewhere in the token package was never in question, only which
      // scale a given block reaches for.
      for (const scale of CHROMATIC_SCALES) {
        expect(block).not.toMatch(new RegExp(`--lat-${scale}-`))
      }
    }
  )
})
