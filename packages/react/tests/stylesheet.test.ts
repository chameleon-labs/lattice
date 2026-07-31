/**
 * @vitest-environment node
 *
 * Reads the built stylesheet and the token package's emitted CSS, so both
 * builds must have run. CI builds tokens before it tests and builds this
 * package's dist in the same fan-out; locally, run `pnpm build` in both first.
 *
 * It must not run under jsdom: there the global URL resolves
 * `new URL(relative, import.meta.url)` against the document's base.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  findAnimatedTransformsOutsideNoPreference,
  findBareFocusOutlines,
  findBlockSelectors,
  findColourLiterals,
  findGlobalSelectors,
  findTokenReferences,
  findUnpausableAnimations
} from './support/css-contract.js'

const read = (relative: string): string => {
  try {
    return readFileSync(new URL(relative, import.meta.url), 'utf8')
  } catch {
    throw new Error(`${relative} is missing — run \`pnpm build\` in both packages first`)
  }
}

const css = read('../dist/styles.css')
const tokensCss = read('../../tokens/dist/lattice.css')

const declared = new Set(
  [...tokensCss.matchAll(/(--lat-[a-z0-9-]+)\s*:/g)].map((match) => match[1])
)

describe('the shipped stylesheet', () => {
  it('contains no colour literal', () => {
    expect(findColourLiterals(css)).toEqual([])
  })

  it('references only tokens the token package declares', () => {
    const unknown = findTokenReferences(css).filter((name) => !declared.has(name))
    expect(unknown).toEqual([])
  })

  it('contains no universal selector and no global transition reset', () => {
    expect(findGlobalSelectors(css)).toEqual([])
    expect(css).not.toMatch(/transition:\s*none/)
  })

  it('ships no unpausable motion', () => {
    expect(findUnpausableAnimations(css)).toEqual([])
  })

  it('animates no transform outside prefers-reduced-motion: no-preference', () => {
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual([])
  })

  it('hangs every focus ring off :focus-visible, never bare :focus', () => {
    expect(findBareFocusOutlines(css)).toEqual([])
  })

  it('declares each block selector exactly once', () => {
    const blocks = findBlockSelectors(css)
    const duplicated = blocks.filter((name, index) => blocks.indexOf(name) !== index)
    expect(duplicated).toEqual([])
  })

  it('inlines every @import, so the published file has no request waterfall', () => {
    // Anchored to statement position: the entry stylesheet's own comment
    // mentions @import, and a comment is not a request.
    expect(css).not.toMatch(/^\s*@import/m)
  })
})
