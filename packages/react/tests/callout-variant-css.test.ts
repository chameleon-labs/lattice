/**
 * @vitest-environment node
 *
 * Assembled from source rather than read from dist/ — see stylesheet.test.ts.
 *
 * This mirrors badge-severity-css.test.ts, guarding against the exact shape
 * of regression a reviewer found in Badge: a variant block pointing at
 * another scale's tint tokens. `stylesheet.test.ts`'s "references only
 * tokens the token package declares" would not catch a `danger` block
 * pointing at `--lat-warning-tint` — that name is declared too, just by the
 * wrong scale — and no unit test in callout.test.tsx (or
 * card-badge-callout.test.tsx) evaluates the CSS a `data-variant` value
 * resolves through. So a variant block silently wired to the wrong scale
 * would pass every other test in the suite.
 */
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {assembleCss} from '../scripts/assemble-css.js';

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)));

// The full set of chromatic scales Callout's four variants are drawn from.
// For a given variant, every scale other than its own is a scale a variant
// block must never reference.
const CHROMATIC_SCALES = ['accent', 'danger', 'warning', 'success', 'info', 'decorative'] as const;

const VARIANTS = ['info', 'success', 'warning', 'danger'] as const;

function calloutVariantBlock(variant: string): string {
  const pattern = new RegExp(`\\.lat-callout\\[data-variant='${variant}'\\]\\s*\\{([^}]*)\\}`);
  const match = pattern.exec(css);
  if (match === null) {
    throw new Error(`no .lat-callout[data-variant='${variant}'] block found in the assembled stylesheet`);
  }
  return match[1] ?? '';
}

describe("Callout's variant blocks", () => {
  it.each(VARIANTS)("'%s' reads its own scale's tokens, and no other scale's", (variant) => {
    const block = calloutVariantBlock(variant);

    expect(block).toContain(`--_tint: var(--lat-${variant}-tint);`);
    expect(block).toContain(`--_tint-border: var(--lat-${variant}-tint-border);`);
    expect(block).toContain(`--_text: var(--lat-${variant}-solid);`);

    // The negative half is the important half — every token above being
    // individually declared somewhere in the token package was never in
    // question, only which scale a given block reaches for.
    for (const scale of CHROMATIC_SCALES) {
      if (scale === variant) {continue;}
      expect(block).not.toMatch(new RegExp(`--lat-${scale}-`));
    }
  });

  it('keeps body text in the body role at full-strength --lat-text, not the accent colour', () => {
    const pattern = /\.lat-callout__body\s*\{([^}]*)\}/;
    const match = pattern.exec(css);
    if (match === null) {
      throw new Error('no .lat-callout__body block found in the assembled stylesheet');
    }
    const block = match[1] ?? '';

    expect(block).toContain('color: var(--lat-text);');
    expect(block).not.toContain('var(--_text)');
  });
});
