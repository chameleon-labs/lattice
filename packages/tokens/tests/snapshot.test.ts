import {describe, expect, it} from 'vitest';

import {emitCss, emitTokens} from '../generate/emit.js';

/**
 * Every token path in the emitted JSON, sorted, without values.
 *
 * Values are already covered by the stylesheet snapshot — the same colours,
 * written as `oklch()`. What this adds is *shape*: a renamed group, a dropped
 * alias or an accidentally added token changes this file while leaving every
 * colour untouched.
 */
function tokenPaths(node: unknown, path = ''): string[] {
  if (node === null || typeof node !== 'object') {
    return [];
  }

  const record = node as Record<string, unknown>;
  if ('$value' in record) {
    return [path];
  }

  return Object.entries(record)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, child]) => tokenPaths(child, path ? `${path}.${key}` : key));
}

describe('the emitted artefacts', () => {
  // The point of a snapshot here is review, not correctness — the contract tests
  // already prove the values meet their minimums. This makes an *unintended*
  // change visible as a diff on a pull request instead of as a surprise in a
  // consuming product. `dist/` is gitignored, so this file is the only committed
  // record of what the build actually produces.
  it('matches the committed stylesheet', async () => {
    await expect(emitCss()).toMatchFileSnapshot('__snapshots__/lattice.css');
  });

  it('matches the committed token shape', async () => {
    const paths = tokenPaths(emitTokens()).sort();

    await expect(`${paths.join('\n')}\n`).toMatchFileSnapshot('__snapshots__/tokens.paths.txt');
  });

  // Guards the snapshot itself: a shape file that silently emptied would match
  // nothing and still pass on the next accepted run.
  //
  // Deliberately no count assertion here. The exact total is already pinned in
  // tests/emit.test.ts as `PER_BLOCK * MODES.length`, derived from the config, so
  // it moves correctly when the config moves. A threshold repeated here would be
  // a weaker hardcoded duplicate that fails on any legitimate reduction.
  it('covers every mode, scale, palette and alias in the shape file', () => {
    const paths = tokenPaths(emitTokens());

    for (const fragment of [
      'light.gray.bg',
      'dark.accent.solid',
      'global.space.0-5',
      'global.breakpoint.sm',
      'global.container.prose',
      'global.radius.full',
      'global.duration.default',
      'global.easing.out',
      'light.role.text',
      'dark.role.on-solid',
      'light.chart.categorical.1',
      'dark.chart.sequential.700',
      'light.severity.critical',
    ]) {
      expect(paths, fragment).toContain(fragment);
    }
  });
});
