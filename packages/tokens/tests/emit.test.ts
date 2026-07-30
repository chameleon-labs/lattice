import { describe, expect, it } from 'vitest'

import { MODES, STEPS } from '../config/lightness.js'
import { SCALE_NAMES } from '../config/scales.js'
import { SEVERITY_LEVELS } from '../config/severity.js'
import { ALIAS_COUNT } from '../generate/semantic.js'
import { STEP_JOBS } from '../config/steps.js'
import {
  DTCG_SCHEMA,
  emitCss,
  emitTokens,
  formatOklch,
  type ColorToken
} from '../generate/emit.js'
import { formatHex, oklchToSrgb } from '../generate/oklch.js'
import { buildAllScales } from '../generate/scale.js'

const scales = buildAllScales()
const css = emitCss(scales)
const tokens = emitTokens(scales)

const PRIMITIVES = SCALE_NAMES.length * STEPS
const CHART_SLOTS = 8
const SEQUENTIAL_STEPS = 7
const SEVERITY_STEPS = SEVERITY_LEVELS.length
// Per mode block: the primitive tier, both chart palettes, the severity ramp,
// and the whole semantic tier — see tests/semantic.test.ts for why the aliases
// are repeated per block rather than declared once on :root.
const PER_BLOCK = PRIMITIVES + CHART_SLOTS + SEQUENTIAL_STEPS + SEVERITY_STEPS + ALIAS_COUNT
// Light once, dark twice - see the block test below.
const BLOCKS = 3

describe('formatOklch', () => {
  // The precision that matters. Rounding to the three decimals the spec's tables
  // print changes 21 of the 120 generated colours by at least one byte, and five
  // decimals still changes two of them — both the solved success steps, whose
  // lightness comes off a binary search and carries more significant digits. Six
  // round-trips every one exactly.
  it('keeps enough precision that every token re-emits its verified hex', () => {
    for (const scale of scales) {
      for (const swatch of scale.steps) {
        const [, l, c, h] = /^oklch\((\S+) (\S+) (\S+)\)$/.exec(formatOklch(swatch))!

        expect(formatHex(oklchToSrgb({ l: Number(l), c: Number(c), h: Number(h) }))).toBe(swatch.hex)
      }
    }
  })

  it('trims trailing zeros rather than padding to a fixed width', () => {
    expect(formatOklch({ l: 0.5, c: 0.2, h: 305 })).toBe('oklch(0.5 0.2 305)')
  })

  it('emits a hue in the range CSS and DTCG both require', () => {
    for (const scale of scales) {
      for (const swatch of scale.steps) {
        expect(swatch.h).toBeGreaterThanOrEqual(0)
        expect(swatch.h).toBeLessThan(360)
      }
    }
  })
})

describe('lattice.css', () => {
  it('declares every step of every scale', () => {
    for (const name of SCALE_NAMES) {
      for (let step = 1; step <= STEPS; step++) {
        expect(css).toContain(`--lat-${name}-${step}:`)
      }
    }
  })

  // Three blocks, not two: light once, and dark twice — once for the explicit
  // attribute and once for the OS preference. The repetition is inherent to the
  // cascade rather than a mistake, because a media query cannot reuse the
  // declarations of a rule outside it. It is the main cost of the mode strategy
  // and is asserted per block so a change to any one of them is visible.
  it('declares each mode in its own block, dark twice', () => {
    const [lightBlock, darkBlock, mediaBlock] = splitBlocks(css)

    expect(count(lightBlock)).toBe(PER_BLOCK)
    expect(count(darkBlock)).toBe(PER_BLOCK)
    expect(count(mediaBlock)).toBe(PER_BLOCK)
    expect(count(css)).toBe(PER_BLOCK * BLOCKS)
  })

  // Every declaration is either a generated colour or a reference to one. The
  // semantic tier introduced the second kind; nothing is ever a hex literal.
  it('emits every declaration as an oklch colour or a var reference', () => {
    const values = css.match(/--lat-[a-z0-9-]+: ([^;]+);/g) ?? []

    expect(values).toHaveLength(PER_BLOCK * BLOCKS)
    for (const declaration of values) {
      expect(declaration).toMatch(/(oklch\(|var\(--lat-)/)
    }
  })

  it('gives the two dark blocks identical values', () => {
    const [, darkBlock, mediaBlock] = splitBlocks(css)
    const declarations = (block: string): string[] =>
      (block.match(/--lat-[a-z0-9-]+: [^;]+;/g) ?? []).map((line) => line.trim())

    expect(declarations(mediaBlock)).toEqual(declarations(darkBlock))
  })

  // Custom properties are parsed as a raw token stream, so a browser that does not
  // understand oklch() still accepts the declaration and only fails at var() time.
  // A second hex declaration would therefore be dead weight rather than a
  // fallback — a real one needs @supports. Pinned so nobody adds the broken idiom.
  it('does not pretend a second declaration is a fallback', () => {
    const hexValues = css.match(/--lat-[a-z0-9-]+: #[0-9a-f]{6};/g) ?? []

    expect(hexValues).toHaveLength(0)
  })

  it('applies the modes exactly as the spec specifies', () => {
    expect(css).toContain(":root,\n[data-lat-theme='light'] {")
    expect(css).toContain("[data-lat-theme='dark'] {")
    expect(css).toContain('@media (prefers-color-scheme: dark) {')
    expect(css).toContain(":root:not([data-lat-theme='light']) {")
  })

  it('puts the OS default behind the explicit stamp, so an attribute wins', () => {
    const explicitDark = css.indexOf("\n[data-lat-theme='dark'] {")
    const mediaQuery = css.indexOf('@media (prefers-color-scheme: dark)')

    expect(explicitDark).toBeGreaterThan(-1)
    expect(mediaQuery).toBeGreaterThan(explicitDark)
  })

  it('balances its braces', () => {
    expect(css.split('{')).toHaveLength(css.split('}').length)
  })

  it('terminates every declaration', () => {
    for (const line of css.split('\n')) {
      if (line.trimStart().startsWith('--lat-')) {
        expect(line.trimEnd().endsWith(';')).toBe(true)
      }
    }
  })

  it('says it is generated, so nobody edits it by hand', () => {
    expect(css.split('\n')[0]).toMatch(/generated/i)
  })

  it('is deterministic', () => {
    expect(emitCss(buildAllScales())).toBe(css)
  })
})

describe('tokens.json', () => {
  const leaves = (): { path: string; token: ColorToken }[] => {
    const found: { path: string; token: ColorToken }[] = []
    const walk = (node: unknown, path: string): void => {
      if (node === null || typeof node !== 'object') {
        return
      }
      const record = node as Record<string, unknown>
      if ('$value' in record) {
        found.push({ path, token: record as unknown as ColorToken })
        return
      }
      for (const [key, child] of Object.entries(record)) {
        if (!key.startsWith('$')) {
          walk(child, path ? `${path}.${key}` : key)
        }
      }
    }
    walk(tokens, '')
    return found
  }

  it('points at the published DTCG schema', () => {
    expect(tokens.$schema).toBe(DTCG_SCHEMA)
    expect(DTCG_SCHEMA).toBe('https://www.designtokens.org/schemas/2025.10/format.json')
  })

  // Two kinds of leaf now: a colour, and a reference to one. The semantic tier
  // uses DTCG's own `{group.token}` alias syntax, so the JSON carries the same
  // two tiers the stylesheet does.
  const colorLeaves = (): { path: string; token: ColorToken }[] =>
    leaves().filter((leaf) => typeof leaf.token.$value === 'object') as {
      path: string
      token: ColorToken
    }[]
  const aliasLeaves = (): { path: string; value: string }[] =>
    leaves()
      .filter((leaf) => typeof leaf.token.$value === 'string')
      .map((leaf) => ({ path: leaf.path, value: leaf.token.$value as unknown as string }))

  it('carries one token per primitive step, chart slot, severity level and alias', () => {
    expect(leaves()).toHaveLength(PER_BLOCK * MODES.length)
  })

  it('declares every colour-valued token as a DTCG oklch colour', () => {
    for (const { path, token } of colorLeaves()) {
      expect(token.$type, path).toBe('color')
      expect(token.$value.colorSpace, path).toBe('oklch')
      expect(token.$value.components, path).toHaveLength(3)
      expect(token.$value.alpha, path).toBe(1)
    }
  })

  it('keeps every component inside the range the colour module defines', () => {
    for (const { path, token } of colorLeaves()) {
      const [l, c, h] = token.$value.components

      expect(l, path).toBeGreaterThanOrEqual(0)
      expect(l, path).toBeLessThanOrEqual(1)
      expect(c, path).toBeGreaterThanOrEqual(0)
      expect(c, path).toBeLessThanOrEqual(0.5)
      expect(h, path).toBeGreaterThanOrEqual(0)
      expect(h, path).toBeLessThan(360)
    }
  })

  // A reference that does not resolve is the JSON equivalent of a dangling
  // var(): the file parses, and a consumer resolving it gets nothing.
  it('resolves every alias reference to a token that exists', () => {
    const paths = new Set(leaves().map((leaf) => leaf.path))
    const aliases = aliasLeaves()

    expect(aliases.length).toBeGreaterThan(0)
    for (const { path, value } of aliases) {
      expect(value, path).toMatch(/^\{[a-z0-9.-]+\}$/)
      expect(paths, `${path} -> ${value}`).toContain(value.slice(1, -1))
    }
  })

  it('keeps every alias inside its own mode, so a theme never leaks', () => {
    for (const { path, value } of aliasLeaves()) {
      expect(value.startsWith(`{${path.split('.')[0]}.`), `${path} -> ${value}`).toBe(true)
    }
  })

  // DTCG defines `hex` as a fallback value of the colour. Carrying the generated
  // hex here is what keeps the contract-verified value in the artefact, since the
  // CSS deliberately ships oklch() alone.
  it('carries the verified hex as the DTCG fallback', () => {
    const byPath = new Map(leaves().map((leaf) => [leaf.path, leaf.token]))

    for (const scale of scales) {
      for (const swatch of scale.steps) {
        const token = byPath.get(`${scale.mode}.${scale.name}.${swatch.step}`)

        expect(token?.$value.hex).toBe(swatch.hex)
      }
    }
  })

  it('agrees with the CSS on every colour value', () => {
    for (const { token } of colorLeaves()) {
      const [l, c, h] = token.$value.components

      expect(css).toContain(`oklch(${trim(l)} ${trim(c)} ${trim(h)})`)
    }
  })

  // Names must not begin with $, which is reserved for format properties, and
  // must not contain { } or . which the reference syntax uses.
  it('uses names the format permits', () => {
    const walk = (node: unknown): void => {
      if (node === null || typeof node !== 'object') {
        return
      }
      for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
        if (key.startsWith('$')) {
          continue
        }
        expect(key.startsWith('$')).toBe(false)
        expect(key).not.toMatch(/[{}.]/)
        walk(child)
      }
    }
    walk(tokens)
  })

  it('describes each step by the job the contract gives it', () => {
    const byPath = new Map(leaves().map((leaf) => [leaf.path, leaf.token]))

    expect(byPath.get('light.accent.9')?.$description).toBe(STEP_JOBS[8])
    expect(byPath.get('dark.gray.12')?.$description).toBe(STEP_JOBS[11])
  })

  // The rank and the total are both read off the generated ramp, so neither can
  // drift from what is actually emitted if the level list changes.
  it('ranks each severity level against the real size of the ramp', () => {
    const byPath = new Map(leaves().map((leaf) => [leaf.path, leaf.token]))

    for (const mode of MODES) {
      SEVERITY_LEVELS.forEach((level, index) => {
        expect(byPath.get(`${mode}.severity.${level}`)?.$description).toContain(
          `Impact level ${index + 1} of ${SEVERITY_LEVELS.length} — ${level}`
        )
      })
    }
  })

  // The usage rule is only useful if it travels with the tokens.
  it('carries the icon-and-label rule on every severity token', () => {
    for (const { path, token } of leaves()) {
      if (path.includes('.severity.')) {
        expect(token.$description, path).toMatch(/icon and a text label/)
      }
    }
  })

  it('serialises to JSON and back unchanged', () => {
    expect(JSON.parse(JSON.stringify(tokens))).toEqual(tokens)
  })
})

function trim(value: number): string {
  return String(Number(value.toFixed(6)))
}

function count(block: string): number {
  return (block.match(/--lat-[a-z0-9-]+:/g) ?? []).length
}

/** The light rule, the explicit-dark rule, and the preference-driven dark rule. */
function splitBlocks(stylesheet: string): [string, string, string] {
  const darkAt = stylesheet.indexOf("\n[data-lat-theme='dark'] {")
  const mediaAt = stylesheet.indexOf('@media (prefers-color-scheme: dark)')

  // Same guard as tests/semantic.test.ts: a missing delimiter makes indexOf
  // return -1, and the resulting slice fails every later assertion on content
  // rather than saying the split itself found nothing.
  if (darkAt < 0 || mediaAt < 0 || mediaAt < darkAt) {
    throw new Error(
      `cannot split the stylesheet into blocks: dark rule at ${darkAt}, media query at ${mediaAt}`
    )
  }

  return [
    stylesheet.slice(0, darkAt),
    stylesheet.slice(darkAt, mediaAt),
    stylesheet.slice(mediaAt)
  ]
}
