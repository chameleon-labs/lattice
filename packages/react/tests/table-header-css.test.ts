/**
 * @vitest-environment node
 *
 * Assembled from source rather than read from dist/ — see stylesheet.test.ts.
 *
 * This file exists because nothing else would catch `.lat-table__header`
 * losing its normal font-weight to a later "improvement". The Figma bundle's header
 * cells are 10px uppercase mono at *normal* weight — the casing and tracking
 * already carry the emphasis, and bolding on top of both reads as shouting.
 * `table.test.tsx` only asserts the DOM structure (a real `<th>` with a
 * `scope`); it never evaluates the CSS a header cell resolves through, so a
 * `font-weight: var(--lat-font-weight-semibold)` reintroduced here would pass
 * every other test in the suite.
 */
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {assembleCss} from '../scripts/assemble-css.js';

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)));

function block(selector: string): string {
  const pattern = new RegExp(`${selector.replace(/[.[\]']/g, '\\$&')}\\s*\\{([^}]*)\\}`);
  const match = pattern.exec(css);
  if (match === null) {
    throw new Error(`no ${selector} block found in the assembled stylesheet`);
  }
  return match[1] ?? '';
}

describe("Table's header cell", () => {
  it('reads the eyebrow role — casing and tracking carry the emphasis', () => {
    const rule = block('.lat-table__header');

    expect(rule).toContain('font-family: var(--lat-text-eyebrow-font-family);');
    expect(rule).toContain('font-size: var(--lat-text-eyebrow-font-size);');
    expect(rule).toContain('letter-spacing: var(--lat-text-eyebrow-letter-spacing);');
    expect(rule).toContain('text-transform: var(--lat-text-eyebrow-text-transform);');
  });

  it('stays at normal weight — never bold or semibold on top of the casing and tracking', () => {
    const rule = block('.lat-table__header');

    // The role token, not the primitive it happens to alias to today — reading
    // the primitive directly is a tier bypass (see M1 of the phase review),
    // and `--lat-text-eyebrow-font-weight` itself resolves to
    // `--lat-font-weight-regular` in the emitted tokens.
    expect(rule).toContain('font-weight: var(--lat-text-eyebrow-font-weight);');
    expect(rule).not.toMatch(/font-weight:\s*var\(--lat-font-weight-(medium|semibold|bold)\)/);
  });
});
