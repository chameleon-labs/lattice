/**
 * @vitest-environment node
 *
 * Assembled from source rather than read from dist/ — see stylesheet.test.ts.
 *
 * `font-variant-numeric` is the entire reason the `numeric` role exists —
 * without it, `.lat-stat__value` would still pass `stylesheet.test.ts`'s
 * "references only tokens the token package declares" (every other numeric-
 * role property is itself a declared token), and `stat.test.tsx` only checks
 * that the value carries the `.lat-stat__value` class, never that the class's
 * rule actually sets tabular figures. A later edit that dropped the
 * declaration as "redundant" — it does nothing for a value that happens to be
 * all the same width already — would ship silently past both.
 */
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {assembleCss} from '../scripts/assemble-css.js';

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)));

// Scoped to the exact selector, not a substring another component's rule
// could also satisfy — .lat-stat__value is unique to this component, and
// requiring exactly one match guards against a duplicated block silently
// shadowing a broken one.
function statValueBlock(source: string): string {
  const matches = [...source.matchAll(/\.lat-stat__value\s*\{([^}]*)\}/g)];
  expect(matches).toHaveLength(1);
  return matches[0]?.[1] ?? '';
}

describe("Stat's stylesheet", () => {
  it('gives the value tabular figures via the numeric role token', () => {
    const rule = statValueBlock(css);

    expect(rule).toContain('font-variant-numeric: var(--lat-text-numeric-font-variant-numeric);');
  });
});
