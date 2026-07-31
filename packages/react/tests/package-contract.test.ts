/**
 * @vitest-environment node
 *
 * This file asserts on package manifests, not on the DOM. It must not run under
 * jsdom: there, the global URL resolves `new URL(relative, import.meta.url)`
 * against the document's base — http://localhost:3000 — rather than the passed
 * file: base, and readFileSync then rejects the result.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

interface PackageJson {
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
  readonly peerDependencies?: Record<string, string>
  readonly optionalDependencies?: Record<string, string>
}

const load = (relative: string): PackageJson =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8')) as PackageJson

const react = load('../package.json')
const tokens = load('../../tokens/package.json')

describe('lattice-react package boundary', () => {
  it('declares React, Ariakit and the token package as peers', () => {
    expect(Object.keys(react.peerDependencies ?? {}).sort()).toEqual([
      '@ariakit/react',
      '@chameleon-labs/lattice-tokens',
      'react',
      'react-dom'
    ])
  })

  it('ships no runtime dependencies', () => {
    expect(react.dependencies ?? {}).toEqual({})
  })
})

describe('lattice-tokens stays installable without React', () => {
  it('names no React or Ariakit package in any dependency field', () => {
    // All four map-shaped fields npm installs from. bundledDependencies is
    // deliberately absent: it is an array of names that must already appear in
    // dependencies, so it cannot introduce a package this map does not see.
    const combined = {
      ...tokens.dependencies,
      ...tokens.devDependencies,
      ...tokens.peerDependencies,
      ...tokens.optionalDependencies
    }

    const offenders = Object.keys(combined).filter(
      (name) => name === 'react' || name === 'react-dom' || name.startsWith('@ariakit/')
    )

    expect(offenders).toEqual([])
  })
})
