/**
 * @vitest-environment node
 *
 * Assembled from source rather than read from dist/ — see stylesheet.test.ts.
 *
 * This file exists because Menu's active-item marker — `[data-active-item]`
 * with a `--lat-wash` background and no border — has nothing left once
 * forced-colors strips box-shadow (moot here, there is none) and overrides
 * background: the same shape SegmentedControl's checked state took, which
 * segmented-control-forced-colors-css.test.ts guards for the same reason.
 * No unit test in menu.test.tsx evaluates CSS, and no other test in this
 * suite would catch the `@media (forced-colors: active)` block going
 * missing, or its rule losing the `background`/`color` pair that carries the
 * entire signal in that mode — leaving every menu item, active or not,
 * rendered identically to a forced-colors user.
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
    if (source[i] === '{') {depth++;}
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) {return source.slice(openBraceIndex + 1, i);}
    }
  }
  throw new Error('unbalanced braces: no matching closing brace found');
}

// Each of the two components with a forced-colors fallback declares its own
// `@media (forced-colors: active)` block in its own file, so the assembled
// stylesheet contains more than one — Menu's and SegmentedControl's.
// Concatenating every match rather than returning only the first is what
// keeps this test correct regardless of import order — a regex anchored to
// the first occurrence would silently start reading a sibling component's
// block once a second one existed, which is exactly what broke
// segmented-control-forced-colors-css.test.ts when this one was added.
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

describe("Menu's forced-colors fallback", () => {
  it('declares a forced-colors block', () => {
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{/);
  });

  it('gives the active item both a background and a colour inside that block, from the system palette', () => {
    const media = mediaBlock('@media (forced-colors: active)');
    const rule = block(media, '.lat-menu__item[data-active-item]');

    expect(rule).toContain('background: Highlight;');
    expect(rule).toContain('color: HighlightText;');
    // forced-color-adjust: none is what stops the UA overriding Highlight/
    // HighlightText straight back to its own defaults — without it the block
    // above is a no-op.
    expect(rule).toContain('forced-color-adjust: none;');
  });
});
