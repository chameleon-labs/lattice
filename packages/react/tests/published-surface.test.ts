/**
 * @vitest-environment node
 *
 * This file asserts on package.json, not on the DOM. It must not run under
 * jsdom: there, the global URL resolves `new URL(relative, import.meta.url)`
 * against the document's base — http://localhost:3000 — rather than the passed
 * file: base, and readFileSync then rejects the result.
 */
import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

interface PackageJson {
  readonly files?: readonly string[];
  readonly exports?: Record<string, string | Record<string, string>>;
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as PackageJson;

const targets = (entry: string | Record<string, string>): readonly string[] =>
  typeof entry === 'string' ? [entry] : Object.values(entry);

describe('published surface', () => {
  it('ships only dist', () => {
    expect(pkg.files).toEqual(['dist']);
  });

  it('exports the barrel, the stylesheet and package.json', () => {
    expect(Object.keys(pkg.exports ?? {}).toSorted()).toEqual(['.', './package.json', './styles.css']);
  });

  it('points every export at dist, except package.json itself', () => {
    const entries = Object.entries(pkg.exports ?? {}).filter(([key]) => key !== './package.json');
    const paths = entries.flatMap(([, entry]) => targets(entry));

    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(path.startsWith('./dist/')).toBe(true);
    }
  });
});
