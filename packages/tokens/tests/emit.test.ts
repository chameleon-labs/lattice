import { describe, expect, it } from 'vitest'

import { MODES, STEPS } from '../config/lightness.js'
import { SCALE_NAMES } from '../config/scales.js'
import { SEVERITY_LEVELS } from '../config/severity.js'
import { TYPOGRAPHY_ROLES } from '../config/typography-roles.js'
import { ALIAS_COUNT } from '../generate/semantic.js'
import { STEP_JOBS } from '../config/steps.js'
import {
  DTCG_SCHEMA,
  emitCss,
  emitTokens,
  formatOklch,
  type ColorToken
} from '../generate/emit.js'
import {
  ELEVATION_ROLE_COUNT,
  SHADOW_PRIMITIVE_COUNT,
  elevationCss,
  elevationTokens,
  shadowCss,
  shadowTokens
} from '../generate/elevation.js'
import { formatHex, oklchToSrgb } from '../generate/oklch.js'
import { buildAllScales } from '../generate/scale.js'
import {
  LAYOUT_PRIMITIVE_COUNT,
  LAYOUT_PRIMITIVE_COUNTS,
  layoutCss,
  layoutTokens,
  type DimensionToken
} from '../generate/layout.js'
import {
  MOTION_PRIMITIVE_COUNT,
  MOTION_PRIMITIVE_COUNTS,
  motionCss,
  motionTokens
} from '../generate/motion.js'
import { TYPOGRAPHY_PRIMITIVE_COUNT } from '../generate/typography.js'
import {
  TYPOGRAPHY_RESPONSIVE_OVERRIDE_COUNT,
  TYPOGRAPHY_ROLE_COUNT,
  TYPOGRAPHY_ROLE_PROPERTY_COUNT,
  typographyRoleResponsiveCss
} from '../generate/typography-roles.js'

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
const PER_BLOCK =
  PRIMITIVES + CHART_SLOTS + SEQUENTIAL_STEPS + SEVERITY_STEPS + ALIAS_COUNT + ELEVATION_ROLE_COUNT
// Light once, dark twice - see the block test below.
const BLOCKS = 3
const GLOBAL_DECLARATIONS =
  TYPOGRAPHY_PRIMITIVE_COUNT +
  TYPOGRAPHY_ROLE_COUNT * TYPOGRAPHY_ROLE_PROPERTY_COUNT +
  LAYOUT_PRIMITIVE_COUNT +
  MOTION_PRIMITIVE_COUNT +
  SHADOW_PRIMITIVE_COUNT

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
  it('declares theme-independent typography once before every themed block', () => {
    const [globalBlock, lightBlock, darkBlock, mediaBlock] = splitBlocks(css)

    expect(count(globalBlock)).toBe(GLOBAL_DECLARATIONS)
    expect(count(lightBlock)).toBe(PER_BLOCK)
    expect(count(darkBlock)).toBe(PER_BLOCK)
    expect(count(mediaBlock)).toBe(PER_BLOCK)
    expect(count(css)).toBe(
      GLOBAL_DECLARATIONS + PER_BLOCK * BLOCKS + TYPOGRAPHY_RESPONSIVE_OVERRIDE_COUNT
    )
    expect(css.match(/--lat-font-size-base:/g)).toHaveLength(1)
  })

  it('emits every layout primitive once in the global rule', () => {
    const [globalBlock] = splitBlocks(css)

    expect(globalBlock).toContain(layoutCss())
    expect(count(layoutCss())).toBe(LAYOUT_PRIMITIVE_COUNT)
    expect(css.match(/--lat-space-0-5:/g)).toHaveLength(1)
    expect(css.match(/--lat-breakpoint-sm:/g)).toHaveLength(1)
    expect(css.match(/--lat-container-prose:/g)).toHaveLength(1)
    expect(css.match(/--lat-radius-full:/g)).toHaveLength(1)
  })

  it('emits every motion primitive once in the global rule', () => {
    const [globalBlock] = splitBlocks(css)

    expect(globalBlock).toContain(motionCss())
    expect(count(motionCss())).toBe(MOTION_PRIMITIVE_COUNT)
    expect(css.match(/--lat-duration-instant:/g)).toHaveLength(1)
    expect(css.match(/--lat-duration-slower:/g)).toHaveLength(1)
    expect(css.match(/--lat-easing-standard:/g)).toHaveLength(1)
    expect(css.match(/--lat-easing-exit:/g)).toHaveLength(1)
  })

  it('appends only the approved responsive typography overrides', () => {
    expect(css).toContain(typographyRoleResponsiveCss())
    expect(count(typographyRoleResponsiveCss())).toBe(TYPOGRAPHY_RESPONSIVE_OVERRIDE_COUNT)
    expect(typographyRoleResponsiveCss()).not.toMatch(/--lat-text-(body|lead|ui|caption|micro|code)/)
  })

  it('describes the derived typography counts in its generated header', () => {
    expect(css).toContain(
      `/* Typography: ${TYPOGRAPHY_PRIMITIVE_COUNT} primitives; ` +
        `${TYPOGRAPHY_ROLE_COUNT} semantic roles x ${TYPOGRAPHY_ROLE_PROPERTY_COUNT} properties. */`
    )
  })

  it('reports derived layout counts in the generated header', () => {
    expect(css).toContain(
      `/* Layout primitives: ${LAYOUT_PRIMITIVE_COUNTS.space} spacing; ` +
        `${LAYOUT_PRIMITIVE_COUNTS.breakpoint} breakpoints; ` +
        `${LAYOUT_PRIMITIVE_COUNTS.container} containers; ` +
        `${LAYOUT_PRIMITIVE_COUNTS.radius} radii. */`
    )
  })

  it('reports derived motion counts in the generated header', () => {
    expect(css).toContain(
      `/* Motion primitives: ${MOTION_PRIMITIVE_COUNTS.duration} durations; ` +
        `${MOTION_PRIMITIVE_COUNTS.easing} easings. */`
    )
  })

  // The token package publishes values; it cannot know which property a
  // component transitions, so it cannot know what reducing motion should strip.
  // A blanket reset here would disable the opacity and colour feedback that
  // reduced motion is supposed to keep. The contract lives on #11 instead.
  it('does not emit component-level reduced-motion behavior', () => {
    expect(css).not.toContain('prefers-reduced-motion')
    expect(css).not.toMatch(/transition\s*:\s*none/)
  })

  // Every declaration is either a generated colour or a reference to one. The
  // semantic tier introduced the second kind; nothing is ever a hex literal.
  it('emits every themed declaration as an oklch colour or a var reference', () => {
    const [, lightBlock, darkBlock, mediaBlock] = splitBlocks(css)
    const values = [lightBlock, darkBlock, mediaBlock].flatMap(
      (themed) => themed.match(/--lat-[a-z0-9-]+: ([^;]+);/g) ?? []
    )

    expect(values).toHaveLength(PER_BLOCK * BLOCKS)
    for (const declaration of values) {
      expect(declaration).toMatch(/(oklch\(|var\(--lat-)/)
    }
  })

  it('gives the two dark blocks identical values', () => {
    const [, , darkBlock, mediaBlock] = splitBlocks(css)
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

  it('emits every shadow primitive once in the global rule', () => {
    const [globalBlock] = splitBlocks(css)

    expect(globalBlock).toContain(shadowCss())
    expect(count(shadowCss())).toBe(SHADOW_PRIMITIVE_COUNT)
    expect(css.match(/--lat-shadow-small:/g)).toHaveLength(1)
    expect(css.match(/--lat-shadow-large:/g)).toHaveLength(1)
  })

  it('repeats every elevation role in all three themed blocks', () => {
    const [globalBlock, lightBlock, darkBlock, mediaBlock] = splitBlocks(css)

    for (const block of [lightBlock, darkBlock]) {
      expect(block).toContain(elevationCss())
    }
    // The preference block is nested one level deeper inside @media, so every
    // declaration in it carries two more spaces. That is what the indent
    // parameter exists for.
    expect(mediaBlock).toContain(elevationCss('    '))
    expect(globalBlock).not.toContain('--lat-elevation-')
    expect(css.match(/--lat-elevation-modal-shadow:/g)).toHaveLength(3)
  })

  it('reports derived elevation counts in the generated header', () => {
    expect(css).toContain(
      `/* Elevation: ${SHADOW_PRIMITIVE_COUNT} shadows; ` +
        `${ELEVATION_ROLE_COUNT} role tokens per theme. */`
    )
  })

  it('never emits a forced-colors rule from the token package', () => {
    expect(css).not.toContain('forced-colors')
  })
})

describe('tokens.json', () => {
  interface TokenLeaf {
    readonly $type: string
    readonly $description?: string
    readonly $value: unknown
  }

  const leaves = (): { path: string; token: TokenLeaf }[] => {
    const found: { path: string; token: TokenLeaf }[] = []
    const walk = (node: unknown, path: string): void => {
      if (node === null || typeof node !== 'object') {
        return
      }
      const record = node as Record<string, unknown>
      if ('$value' in record) {
        found.push({ path, token: record as unknown as TokenLeaf })
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
    leaves().filter(
      (leaf) => leaf.token.$type === 'color' && typeof leaf.token.$value === 'object'
    ) as unknown as {
      path: string
      token: ColorToken
    }[]
  const aliasLeaves = (): { path: string; value: string }[] =>
    leaves()
      .filter((leaf) => typeof leaf.token.$value === 'string')
      .map((leaf) => ({ path: leaf.path, value: leaf.token.$value as unknown as string }))

  it('carries one token per primitive step, chart slot, severity level and alias', () => {
    expect(leaves()).toHaveLength(
      TYPOGRAPHY_PRIMITIVE_COUNT +
        TYPOGRAPHY_ROLE_COUNT +
        LAYOUT_PRIMITIVE_COUNT +
        MOTION_PRIMITIVE_COUNT +
        SHADOW_PRIMITIVE_COUNT +
        PER_BLOCK * MODES.length
    )
  })

  it('carries global typography separately from the colour modes', () => {
    const global = tokens['global'] as Record<string, Record<string, TokenLeaf>>

    expect(global['font-size']?.['base']?.$value).toEqual({ value: 1, unit: 'rem' })
    expect(global['line-height']?.['normal']?.$value).toBe(1.5)
    expect(global['letter-spacing']?.['normal']?.$value).toEqual({ value: 0, unit: 'rem' })
    expect(global['font-weight']?.['bold']?.$value).toBe(700)
    expect(tokens['light']).toBeDefined()
    expect(tokens['dark']).toBeDefined()
  })

  it('keeps layout primitives global and out of colour modes', () => {
    const global = tokens['global'] as Record<string, unknown>

    expect(Object.keys(global['space'] as object)).toHaveLength(16)
    expect(Object.keys(global['breakpoint'] as object)).toHaveLength(4)
    expect(Object.keys(global['container'] as object)).toEqual(['prose', 'content', 'wide'])
    expect(Object.keys(global['radius'] as object)).toHaveLength(5)
    expect(tokens['light']).not.toHaveProperty('space')
    expect(tokens['dark']).not.toHaveProperty('space')
  })

  it('keeps motion primitives global and out of colour modes', () => {
    const global = tokens['global'] as Record<string, unknown>
    const motion = motionTokens()

    expect(global['duration']).toEqual(motion.duration)
    expect(global['easing']).toEqual(motion.easing)
    expect(Object.keys(global['duration'] as object)).toHaveLength(5)
    expect(Object.keys(global['easing'] as object)).toHaveLength(3)
    expect(tokens['light']).not.toHaveProperty('duration')
    expect(tokens['light']).not.toHaveProperty('easing')
    expect(tokens['dark']).not.toHaveProperty('duration')
    expect(tokens['dark']).not.toHaveProperty('easing')
  })

  it('keeps CSS and DTCG layout dimensions in parity', () => {
    for (const [groupName, group] of Object.entries(layoutTokens()) as Array<
      [string, Readonly<Record<string, DimensionToken>>]
    >) {
      for (const [tokenName, token] of Object.entries(group)) {
        expect(css, `${groupName}.${tokenName}`).toContain(
          `--lat-${groupName}-${tokenName}: ${token.$value.value}${token.$value.unit};`
        )
      }
    }
  })

  it('keeps CSS and DTCG aliases in parity for every typography role', () => {
    const global = tokens['global'] as Record<string, unknown>
    expect(global['text']).toBeDefined()
    const text = (global['text'] ?? {}) as Record<
      string,
      {
        $type: string
        $value: Record<string, string>
      }
    >
    const properties = {
      fontFamily: 'font-family',
      fontSize: 'font-size',
      fontWeight: 'font-weight',
      letterSpacing: 'letter-spacing',
      lineHeight: 'line-height'
    } as const

    expect(Object.keys(text)).toEqual(Object.keys(TYPOGRAPHY_ROLES))
    expect(global['text-narrow']).toBeUndefined()

    for (const [roleName, token] of Object.entries(text)) {
      expect(token.$type, roleName).toBe('typography')
      expect(Object.keys(token.$value), roleName).toEqual(Object.keys(properties))
      for (const [property, cssProperty] of Object.entries(properties)) {
        const reference = token.$value[property]!
        const primitive = reference.slice('{global.'.length, -1).replaceAll('.', '-')

        expect(reference, `${roleName}.${property}`).toMatch(/^\{global\.[a-z0-9.-]+\}$/)
        expect(css).toContain(
          `--lat-text-${roleName}-${cssProperty}: var(--lat-${primitive});`
        )
      }
    }
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
      // Shadow primitives are theme-independent and live in the global tier, so
      // an elevation role's shadow signal may point there. Nothing else may
      // point into another mode.
      if (value.startsWith('{global.shadow.') && path.endsWith('.shadow')) {
        continue
      }
      expect(value.startsWith(`{${path.split('.')[0]}.`), `${path} -> ${value}`).toBe(true)
    }
  })

  // DTCG defines `hex` as a fallback value of the colour. Carrying the generated
  // hex here is what keeps the contract-verified value in the artefact, since the
  // CSS deliberately ships oklch() alone.
  it('carries the verified hex as the DTCG fallback', () => {
    const byPath = new Map(colorLeaves().map((leaf) => [leaf.path, leaf.token]))

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

  it('keeps shadow primitives global and elevation roles per mode', () => {
    const global = tokens['global'] as Record<string, unknown>

    expect(global['shadow']).toEqual(shadowTokens())
    expect(global).not.toHaveProperty('elevation')

    for (const mode of MODES) {
      const group = tokens[mode] as Record<string, unknown>
      // elevation carries a $description alongside its roles, the same
      // convention severity and chart use, so compare the roles beneath it
      // rather than the group verbatim.
      const { $description: _description, ...elevation } = group['elevation'] as Record<
        string,
        unknown
      >

      expect(elevation).toEqual(elevationTokens(mode))
      expect(group).not.toHaveProperty('shadow')
    }
  })
})

function trim(value: number): string {
  return String(Number(value.toFixed(6)))
}

function count(block: string): number {
  return (block.match(/--lat-[a-z0-9-]+:/g) ?? []).length
}

/** The global, light, explicit-dark, and preference-driven dark rules. */
function splitBlocks(stylesheet: string): [string, string, string, string] {
  const lightAt = stylesheet.indexOf("\n:root,\n[data-lat-theme='light'] {")
  const darkAt = stylesheet.indexOf("\n[data-lat-theme='dark'] {")
  const mediaAt = stylesheet.indexOf('@media (prefers-color-scheme: dark)')
  const responsiveAt = stylesheet.indexOf('@media (width < 40rem)')

  // Same guard as tests/semantic.test.ts: a missing delimiter makes indexOf
  // return -1, and the resulting slice fails every later assertion on content
  // rather than saying the split itself found nothing.
  if (
    lightAt < 0 ||
    darkAt < lightAt ||
    mediaAt < darkAt ||
    responsiveAt < mediaAt
  ) {
    throw new Error(
      `cannot split the stylesheet into blocks: light rule at ${lightAt}, ` +
        `dark rule at ${darkAt}, media query at ${mediaAt}, ` +
        `responsive query at ${responsiveAt}`
    )
  }

  return [
    stylesheet.slice(0, lightAt),
    stylesheet.slice(lightAt, darkAt),
    stylesheet.slice(darkAt, mediaAt),
    stylesheet.slice(mediaAt, responsiveAt)
  ]
}
