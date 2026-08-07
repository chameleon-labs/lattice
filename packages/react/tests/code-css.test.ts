/**
 * @vitest-environment node
 *
 * Assembled from source rather than read from dist/ — see stylesheet.test.ts.
 *
 * `overflow-wrap` is the entire reason this component exists rather than a bare
 * `<code>`. Nothing in code.test.tsx can see it — jsdom applies no stylesheet —
 * so without this assertion a later edit dropping the declaration as
 * "unnecessary" would pass every other check in the suite, and the regression
 * would surface only as a horizontal scrollbar, only at the viewport widths
 * where some selector happened not to fit.
 */
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {assembleCss} from '../scripts/assemble-css.js';

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)));

// Scoped to the exact block, and required to be unique: a duplicated
// `.lat-code` rule could silently shadow a broken one.
function codeBlock(source: string): string {
  const matches = [...source.matchAll(/\.lat-code\s*\{([^}]*)\}/g)];
  expect(matches).toHaveLength(1);
  return matches[0]?.[1] ?? '';
}

describe("Code's stylesheet", () => {
  it('lets an unbreakable token break, so a long selector cannot widen the page', () => {
    expect(codeBlock(css)).toContain('overflow-wrap: anywhere;');
  });

  it('pads inline only — block padding on an inline element overlaps its neighbours', () => {
    const rule = codeBlock(css);

    expect(rule).toContain('padding-inline:');
    expect(rule).not.toContain('padding-block:');
  });
});
