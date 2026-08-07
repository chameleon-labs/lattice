/**
 * @vitest-environment node
 *
 * Assembled from source rather than read from dist/ — see stylesheet.test.ts.
 *
 * This file exists because the first version of this restyle assumed a
 * selected tab's border-bottom would survive forced-colors on its own — true
 * for the *rest* state (forced-colors leaves literal `transparent` alone),
 * false for the *selected* one. `.lat-tab-list`'s own hairline is an ordinary
 * author colour sitting at the exact same pixel row as every tab's
 * border-bottom (that's what the -1px margin in tabs.css is for), so
 * forced-colors paints a line under every tab, not only the selected one,
 * and the selected tab's own forced border-colour is liable to resolve to
 * that same system value — the same failure mode segmented-control-
 * forced-colors-css.test.ts exists to catch, arriving by a different route.
 * No unit test in tabs.test.tsx evaluates CSS, and tabs-css.test.ts only
 * covers the non-forced-colors rule, so neither would catch the
 * `@media (forced-colors: active)` block going missing.
 */
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {assembleCss} from '../scripts/assemble-css.js';

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)));

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extracts a `{ ... }` body with balanced-brace matching, unlike a `[^}]*`
 * regex, which breaks the moment the body contains a nested block — as
 * `@media` blocks always do. */
function balancedBlock(source: string, openBraceIndex: number): string {
  let depth = 0;
  for (let i = openBraceIndex; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(openBraceIndex + 1, i);
    }
  }
  throw new Error('unbalanced braces: no matching closing brace found');
}

// More than one component in this package declares its own
// `@media (forced-colors: active)` block in its own file, so the assembled
// stylesheet contains more than one match for this query. Concatenating every
// match rather than returning only the first keeps this test correct
// regardless of import order or how many other components gain a block —
// a regex anchored to the first occurrence would silently start reading a
// sibling component's block once a second (or third) one existed.
function mediaBlock(query: string): string {
  const pattern = new RegExp(`${escapeRegExp(query)}\\s*\\{`, 'g');
  const blocks: string[] = [];

  for (const match of css.matchAll(pattern)) {
    blocks.push(balancedBlock(css, (match.index ?? 0) + match[0].length - 1));
  }

  if (blocks.length === 0) {
    throw new Error(`no ${query} block found in the assembled stylesheet`);
  }

  return blocks.join('\n');
}

function block(source: string, selector: string): string {
  const pattern = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`);
  const match = pattern.exec(source);
  if (match === null) {
    throw new Error(`no ${selector} block found`);
  }
  return match[1] ?? '';
}

describe("Tabs' forced-colors fallback", () => {
  it('declares a forced-colors block', () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{/);
  });

  it('gives the selected tab a forced border-colour, adjusted so the UA keeps it', () => {
    const media = mediaBlock('@media (forced-colors: active)');
    const rule = block(media, ".lat-tab[aria-selected='true']");

    expect(rule).toContain('border-bottom-color: Highlight;');
    // forced-color-adjust: none is what stops the UA overriding Highlight
    // straight back to whatever it would otherwise force border-color to —
    // without it the block above is a no-op.
    expect(rule).toContain('forced-color-adjust: none;');
  });
});
