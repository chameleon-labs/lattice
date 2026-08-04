import { describe, expect, it } from 'vitest'

import { CHROMATIC_SCALES, GRAY_ROLES } from '../config/anchors.js'
import { ELEVATION_ROLES, SHADOWS } from '../config/elevation.js'
import { MODES } from '../config/modes.js'
import { ROLE_ALIASES } from '../config/semantic.js'
import { SEVERITY_LEVELS } from '../config/severity.js'
import { TYPOGRAPHY_ROLES } from '../config/typography-roles.js'
import { resolveAlpha, resolveAll, resolveTints } from '../generate/anchors.js'
import { buildCategorical, buildSequential } from '../generate/charts.js'
import {
  DTCG_SCHEMA,
  emitCss,
  emitTokens,
  formatOklch,
  type ColorToken
} from '../generate/emit.js'
import { ELEVATION_ROLE_COUNT, SHADOW_PRIMITIVE_COUNT, elevationCss } from '../generate/elevation.js'
import {
  LAYOUT_PRIMITIVE_COUNT,
  LAYOUT_PRIMITIVE_COUNTS,
  layoutCss
} from '../generate/layout.js'
import { formatHex, oklchToSrgb } from '../generate/oklch.js'
import { MOTION_PRIMITIVE_COUNT, MOTION_PRIMITIVE_COUNTS, motionCss } from '../generate/motion.js'
import { buildSeverity } from '../generate/severity.js'
import { TYPOGRAPHY_PRIMITIVE_COUNT, typographyCss } from '../generate/typography.js'
import {
  TYPOGRAPHY_RESPONSIVE_OVERRIDE_COUNT,
  TYPOGRAPHY_ROLE_COUNT,
  TYPOGRAPHY_ROLE_PROPERTY_COUNT,
  typographyRoleCss,
  typographyRoleResponsiveCss
} from '../generate/typography-roles.js'

const css = emitCss()
const tokens = emitTokens()

// Declarations inside one themed block: the resolved primitives, the alpha
// tier and the tints, the role aliases, both chart palettes, the severity
// ramp and the `minor` alias that borrows text-subtle. Derived from the same
// generators the emitter calls, so this moves correctly when config moves
// rather than hardcoding a count that would silently go stale.
const PER_BLOCK =
  resolveAll('light').length +
  resolveAlpha('light').length +
  resolveTints('light').length +
  ROLE_ALIASES.length +
  buildCategorical('light').length +
  buildSequential().length +
  buildSeverity('light').length +
  1
// Light once, dark twice — see the block test below.
const BLOCKS = 3
// Counted from the actual generated CSS rather than
// `TYPOGRAPHY_ROLE_COUNT * TYPOGRAPHY_ROLE_PROPERTY_COUNT`: several roles carry
// an extra declaration beyond the five shared properties — `eyebrow` and `tag`
// add `text-transform`, `numeric` adds `font-variant-numeric` — so that product
// undercounts by three. Counting the emitted CSS directly stays correct however
// many roles pick up an extra property.
const GLOBAL_DECLARATIONS =
  count(typographyCss()) +
  count(typographyRoleCss()) +
  count(layoutCss()) +
  count(motionCss()) +
  count(elevationCss())

describe('formatOklch', () => {
  it('keeps enough precision that every anchored swatch re-emits its verified hex', () => {
    for (const mode of MODES) {
      for (const swatch of resolveAll(mode)) {
        const [, l, c, h] = /^oklch\((\S+) (\S+) (\S+)\)$/.exec(formatOklch(swatch))!

        expect(formatHex(oklchToSrgb({ l: Number(l), c: Number(c), h: Number(h) }))).toBe(
          swatch.hex
        )
      }
    }
  })

  it('trims trailing zeros rather than padding to a fixed width', () => {
    expect(formatOklch({ l: 0.5, c: 0.2, h: 305 })).toBe('oklch(0.5 0.2 305)')
  })

  it('emits a hue in the range CSS and DTCG both require', () => {
    for (const mode of MODES) {
      for (const swatch of resolveAll(mode)) {
        expect(swatch.h).toBeGreaterThanOrEqual(0)
        expect(swatch.h).toBeLessThan(360)
      }
    }
  })
})

describe('lattice.css', () => {
  // Scoped to the retired colour-scale names rather than the brief's literal
  // `/--lat-\w+-\d+:/`: that broader pattern also matches legitimate numbered
  // primitives that were never part of the numbered-step model and are not
  // going away — `--lat-space-0:`, `--lat-chart-1:`, `--lat-chart-sequential-300:`.
  // What this guards against is a colour scale re-growing a `--lat-gray-9:`
  // style step.
  it('emits no numbered scale steps', () => {
    expect(emitCss()).not.toMatch(
      /--lat-(gray|accent|danger|warning|success|info|decorative)-\d+:/
    )
  })

  it('declares theme-independent primitives once before every themed block', () => {
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
  })

  it('emits every motion primitive once in the global rule', () => {
    const [globalBlock] = splitBlocks(css)

    expect(globalBlock).toContain(motionCss())
    expect(count(motionCss())).toBe(MOTION_PRIMITIVE_COUNT)
    expect(css.match(/--lat-duration-instant:/g)).toHaveLength(1)
    expect(css.match(/--lat-easing-out:/g)).toHaveLength(1)
  })

  it('emits shadow and elevation primitives once in the global rule, never per theme', () => {
    const [globalBlock, lightBlock, darkBlock, mediaBlock] = splitBlocks(css)

    expect(globalBlock).toMatch(/--lat-shadow-sm:/)
    expect(globalBlock).toMatch(/--lat-elevation-flat:/)
    for (const themed of [lightBlock, darkBlock, mediaBlock]) {
      expect(themed).not.toContain('--lat-shadow-')
      expect(themed).not.toContain('--lat-elevation-')
    }
  })

  it('appends only the approved responsive typography overrides', () => {
    expect(css).toContain(typographyRoleResponsiveCss())
    expect(count(typographyRoleResponsiveCss())).toBe(TYPOGRAPHY_RESPONSIVE_OVERRIDE_COUNT)
    expect(typographyRoleResponsiveCss()).not.toMatch(/--lat-text-(body|lead|ui|caption|micro|code)/)
  })

  it('describes the derived colour, typography, layout and motion counts in its generated header', () => {
    expect(css).toContain(
      `/* Colour: ${GRAY_ROLES.length} grey roles + ${CHROMATIC_SCALES.length} chromatic solids, both modes. */`
    )
    expect(css).toContain(
      `/* Typography: ${TYPOGRAPHY_PRIMITIVE_COUNT} primitives; ` +
        `${TYPOGRAPHY_ROLE_COUNT} semantic roles x ${TYPOGRAPHY_ROLE_PROPERTY_COUNT} properties. */`
    )
    expect(css).toContain(
      `/* Layout primitives: ${LAYOUT_PRIMITIVE_COUNTS.space} spacing; ` +
        `${LAYOUT_PRIMITIVE_COUNTS.breakpoint} breakpoints; ` +
        `${LAYOUT_PRIMITIVE_COUNTS.container} containers; ` +
        `${LAYOUT_PRIMITIVE_COUNTS.radius} radii. */`
    )
    expect(css).toContain(
      `/* Motion primitives: ${MOTION_PRIMITIVE_COUNTS.duration} durations; ` +
        `${MOTION_PRIMITIVE_COUNTS.easing} easings. */`
    )
    expect(css).toContain(
      `/* Elevation: ${SHADOW_PRIMITIVE_COUNT} shadows; ${ELEVATION_ROLE_COUNT} role tokens, emitted once for both modes. */`
    )
  })

  // The token package publishes values; it cannot know which property a
  // component transitions, so it cannot know what reducing motion should strip.
  it('does not emit component-level reduced-motion behavior', () => {
    expect(css).not.toContain('prefers-reduced-motion')
    expect(css).not.toMatch(/transition\s*:\s*none/)
  })

  // Three kinds of value in a themed block: an oklch() primitive, a var()
  // reference to one, or an rgb() alpha value — the alpha tier (hairlines,
  // wash, focus ring, tints) is expressed as rgb() with a fractional alpha
  // channel rather than oklch(), since it is built from the anchor's sRGB
  // channels directly.
  it('emits every themed declaration as an oklch colour, an rgb alpha value, or a var reference', () => {
    const [, lightBlock, darkBlock, mediaBlock] = splitBlocks(css)
    const values = [lightBlock, darkBlock, mediaBlock].flatMap(
      (themed) => themed.match(/--lat-[a-z0-9-]+: ([^;]+);/g) ?? []
    )

    expect(values).toHaveLength(PER_BLOCK * BLOCKS)
    for (const declaration of values) {
      expect(declaration).toMatch(/(oklch\(|rgb\(|var\(--lat-)/)
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
  // fallback — a real one needs @supports.
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

  it('puts the OS default behind the explicit stamp, so an attribute wins, and excludes an explicit light stamp', () => {
    const explicitDark = css.indexOf("\n[data-lat-theme='dark'] {")
    const mediaQuery = css.indexOf('@media (prefers-color-scheme: dark)')
    const notLight = css.indexOf(":root:not([data-lat-theme='light']) {")

    expect(explicitDark).toBeGreaterThan(-1)
    expect(mediaQuery).toBeGreaterThan(explicitDark)
    expect(notLight).toBeGreaterThan(mediaQuery)
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
    expect(emitCss()).toBe(css)
  })

  it('never emits a forced-colors rule from the token package', () => {
    expect(css).not.toContain('forced-colors')
  })

  it('points every alias in every scope at a primitive that is actually emitted', () => {
    for (const block of splitBlocks(css).slice(1)) {
      const declared = new Set([...block.matchAll(/^\s*(--lat-[\w-]+):/gm)].map((m) => m[1]!))
      for (const [, target] of block.matchAll(/var\((--lat-[\w-]+)\)/g)) {
        expect(declared).toContain(target)
      }
    }
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

  const colorLeaves = (): { path: string; token: ColorToken }[] =>
    leaves().filter(
      (leaf) => leaf.token.$type === 'color' && typeof leaf.token.$value === 'object'
    ) as unknown as { path: string; token: ColorToken }[]
  const aliasLeaves = (): { path: string; value: string }[] =>
    leaves()
      .filter((leaf) => typeof leaf.token.$value === 'string')
      .map((leaf) => ({ path: leaf.path, value: leaf.token.$value as unknown as string }))

  it('points at the published DTCG schema', () => {
    expect(tokens.$schema).toBe(DTCG_SCHEMA)
    expect(DTCG_SCHEMA).toBe('https://www.designtokens.org/schemas/2025.10/format.json')
  })

  it('labels every colour token as anchored or derived', () => {
    // Indented to match what `generate/build.ts` actually writes to
    // dist/tokens.json (`JSON.stringify(emitTokens(), null, 2)`) — a compact
    // stringify has no space after the colon and the substring below would
    // never match it.
    const colours = JSON.stringify(tokens, null, 2)
    expect(colours).toContain('"origin": "anchored"')
    expect(colours).toContain('"origin": "derived"')
  })

  it('carries global typography separately from the colour modes', () => {
    const global = tokens['global'] as Record<string, Record<string, TokenLeaf>>

    expect(global['font-size']?.['base']?.$value).toEqual({ value: 1, unit: 'rem' })
    expect(global['line-height']?.['normal']?.$value).toBe(1.5)
    expect(global['letter-spacing']?.['normal']?.$value).toBe(0)
    expect(global['font-weight']?.['bold']?.$value).toBe(700)
    expect(tokens['light']).toBeDefined()
    expect(tokens['dark']).toBeDefined()
  })

  it('keeps layout primitives global and out of colour modes', () => {
    const global = tokens['global'] as Record<string, unknown>

    expect(Object.keys(global['space'] as object)).toHaveLength(16)
    expect(tokens['light']).not.toHaveProperty('space')
    expect(tokens['dark']).not.toHaveProperty('space')
  })

  // Elevation is theme-independent — elevationCss() emits it once on :root,
  // not per mode block — so its DTCG home is global, alongside shadow, not
  // repeated under light/dark.
  it('keeps shadow and elevation global, not per colour mode', () => {
    const global = tokens['global'] as Record<string, Record<string, unknown>>

    expect(global['shadow']).toHaveProperty('sm')
    expect(global['shadow']).toHaveProperty('lg')
    expect(global['shadow']).toHaveProperty('2xl')
    expect(global['elevation']).toHaveProperty('raised')
    expect(global['elevation']).toHaveProperty('overlay')
    expect(global['elevation']).toHaveProperty('floating')
    // flat has no shadow — DTCG's shadow value requires at least one layer,
    // so there is no legal value for "none" to alias.
    expect(global['elevation']).not.toHaveProperty('flat')

    for (const mode of MODES) {
      const group = tokens[mode] as Record<string, unknown>
      expect(group).not.toHaveProperty('shadow')
      expect(group).not.toHaveProperty('elevation')
    }
  })

  it('emits every shadow as a DTCG shadow token whose layers match the CSS', () => {
    const global = tokens['global'] as Record<
      string,
      Record<string, { $type: string; $value: unknown }>
    >

    for (const [name, layers] of Object.entries(SHADOWS)) {
      const token = global['shadow']?.[name]!
      expect(token.$type, name).toBe('shadow')
      const value = token.$value as readonly {
        readonly color: { readonly alpha: number }
        readonly offsetX: { readonly value: number }
        readonly offsetY: { readonly value: number }
        readonly blur: { readonly value: number }
        readonly spread: { readonly value: number }
      }[]

      expect(value, name).toHaveLength(layers.length)
      layers.forEach((layer, index) => {
        expect(value[index]!.offsetX.value, `${name}[${index}].offsetX`).toBe(layer.offsetX)
        expect(value[index]!.offsetY.value, `${name}[${index}].offsetY`).toBe(layer.offsetY)
        expect(value[index]!.blur.value, `${name}[${index}].blur`).toBe(layer.blur)
        expect(value[index]!.spread.value, `${name}[${index}].spread`).toBe(layer.spread)
        expect(value[index]!.color.alpha, `${name}[${index}].alpha`).toBe(layer.alpha)
      })
    }

    for (const [role, key] of Object.entries(ELEVATION_ROLES)) {
      if (key === 'none') {
        continue
      }
      expect(global['elevation']?.[role]?.$value, role).toBe(`{global.shadow.${key}}`)
    }
  })

  it('gives every grey role and chromatic solid an anchored or derived primitive', () => {
    for (const mode of MODES) {
      const group = tokens[mode] as Record<string, Record<string, unknown>>
      for (const role of GRAY_ROLES) {
        expect(group['gray']).toHaveProperty(role)
      }
      for (const scale of CHROMATIC_SCALES) {
        expect(group[scale]).toHaveProperty('solid')
      }
      expect(group['accent']).toHaveProperty('on-solid')
      expect(group['accent']).toHaveProperty('vivid')
    }
  })

  it('points every semantic role alias at a primitive that exists', () => {
    for (const mode of MODES) {
      const group = tokens[mode] as Record<string, Record<string, { $value: string }>>
      for (const alias of ROLE_ALIASES) {
        expect(group['role']).toHaveProperty(alias.role)
      }
    }
  })

  it('declares every colour-valued token as a DTCG oklch colour', () => {
    for (const { path, token } of colorLeaves()) {
      expect(token.$type, path).toBe('color')
      expect(token.$value.colorSpace, path).toBe('oklch')
      expect(token.$value.components, path).toHaveLength(3)
      // Every primitive, chart, and severity swatch is opaque. Only the alpha
      // tier — hairlines, wash, the focus ring, the tinted triple — carries a
      // fraction less than 1, because that fraction is the whole point of the
      // token; see the dedicated alpha-tier test below for the exact values.
      if (path.includes('.alpha.')) {
        expect(token.$value.alpha, path).toBeGreaterThan(0)
        expect(token.$value.alpha, path).toBeLessThan(1)
      } else {
        expect(token.$value.alpha, path).toBe(1)
      }
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

  it('keeps every alias inside its own mode', () => {
    for (const { path, value } of aliasLeaves()) {
      expect(value.startsWith(`{${path.split('.')[0]}.`), `${path} -> ${value}`).toBe(true)
    }
  })

  // DTCG defines `hex` as a fallback value of the colour. Carrying the generated
  // hex here is what keeps the contract-verified value in the artefact, since the
  // CSS deliberately ships oklch() alone.
  it('carries the verified hex as the DTCG fallback', () => {
    const byPath = new Map(colorLeaves().map((leaf) => [leaf.path, leaf.token]))

    for (const mode of MODES) {
      for (const swatch of resolveAll(mode)) {
        const token = byPath.get(`${mode}.${swatch.scale}.${swatch.role}`)
        expect(token?.$value.hex, `${mode}.${swatch.scale}.${swatch.role}`).toBe(swatch.hex)
        expect(token?.$extensions?.['com.chameleon-labs.lattice'].origin).toBe(swatch.origin)
      }
    }
  })

  it('agrees with the CSS on every colour value', () => {
    for (const { path, token } of colorLeaves()) {
      // The alpha tier ships as rgb() with a fractional alpha, never oklch() —
      // see the dedicated alpha-tier parity test below.
      if (path.includes('.alpha.')) {
        continue
      }
      const [l, c, h] = token.$value.components

      expect(css).toContain(`oklch(${trim(l)} ${trim(c)} ${trim(h)})`)
    }
  })

  // JSON -> CSS for the alpha tier specifically: `resolveAlpha`/`resolveTints`
  // already compute the exact `rgb(... / fraction)` string the stylesheet
  // emits, so re-deriving it here (rather than re-parsing the JSON's oklch
  // components) is what proves the two artefacts agree on the same fraction.
  it('agrees with the CSS on every alpha-tier colour value', () => {
    const byPath = new Map(colorLeaves().map((leaf) => [leaf.path, leaf.token]))

    for (const mode of MODES) {
      for (const t of [...resolveAlpha(mode), ...resolveTints(mode)]) {
        const path = `${mode}.alpha.${t.role}`
        const token = byPath.get(path)

        expect(token, path).toBeDefined()
        expect(token?.$value.alpha, path).toBeCloseTo(t.alpha, 6)
        expect(token?.$value.hex, path).toBe(t.hex)
        expect(css, path).toContain(`--lat-${t.role}: ${t.value};`)
      }
    }
  })

  // The reverse direction: walk the emitted CSS and confirm every literal
  // (non-var()) `--lat-*` colour declaration has a tokens.json counterpart.
  // The forward-direction tests above (and `carries the verified hex`) only
  // ever start from the JSON and check the CSS contains a match, which is why
  // a primitive emitted to CSS but never wired into `emitTokens()` — as the
  // alpha tier was — could survive unnoticed. This starts from the CSS text
  // instead.
  it('walks the CSS and finds a tokens.json counterpart for every literal colour property', () => {
    const byPath = new Map(leaves().map((leaf) => [leaf.path, leaf.token]))

    // cssName -> jsonPath, built from the same generators the emitter calls,
    // for every group whose CSS custom property carries a literal value
    // (oklch() or rgb()) rather than a var() alias.
    const expected = new Map<string, string>()
    for (const mode of MODES) {
      for (const swatch of resolveAll(mode)) {
        expected.set(`${mode}:${swatch.scale}-${swatch.role}`, `${mode}.${swatch.scale}.${swatch.role}`)
      }
      for (const t of [...resolveAlpha(mode), ...resolveTints(mode)]) {
        expected.set(`${mode}:${t.role}`, `${mode}.alpha.${t.role}`)
      }
      for (const swatch of buildCategorical(mode)) {
        expected.set(`${mode}:chart-${swatch.slot}`, `${mode}.chart.categorical.${swatch.slot}`)
      }
      for (const swatch of buildSequential()) {
        expected.set(`${mode}:chart-sequential-${swatch.step}`, `${mode}.chart.sequential.${swatch.step}`)
      }
      for (const swatch of buildSeverity(mode)) {
        expected.set(`${mode}:severity-${swatch.role}`, `${mode}.severity.${swatch.role}`)
      }
    }

    const [, lightBlock, darkBlock] = splitBlocks(css)
    const blocksByMode: readonly [string, string][] = [
      ['light', lightBlock],
      ['dark', darkBlock]
    ]

    let checked = 0
    for (const [mode, block] of blocksByMode) {
      for (const match of block.matchAll(/^\s*--lat-([a-z0-9-]+): ([^;]+);/gm)) {
        const [, name, value] = match
        if (value!.startsWith('var(')) {
          // An alias, not a literal — already covered by `resolves every
          // alias reference to a token that exists`.
          continue
        }

        const jsonPath = expected.get(`${mode}:${name}`)
        expect(jsonPath, `${mode} --lat-${name} has no tokens.json counterpart`).toBeDefined()
        expect(byPath.has(jsonPath!), `${jsonPath} missing from tokens.json`).toBe(true)
        checked++
      }
    }

    expect(checked).toBeGreaterThan(0)
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

  it('ranks each severity level against the real size of the ramp', () => {
    const byPath = new Map(leaves().map((leaf) => [leaf.path, leaf.token]))

    for (const mode of MODES) {
      SEVERITY_LEVELS.filter((level) => level !== 'minor').forEach((level) => {
        const ramp = buildSeverity(mode)
        const index = ramp.findIndex((s) => s.role === level)
        expect(byPath.get(`${mode}.severity.${level}`)?.$description).toContain(
          `Impact level ${index + 1} of ${ramp.length} — ${level}`
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

  // CSS/DTCG parity for layout dimensions is covered by tests/layout.test.ts
  // rather than duplicated here — that file asserts each layout primitive's
  // DTCG `$value.value`/`$value.unit` against the matching `--lat-` custom
  // property directly off `layoutTokens()`/`layoutCss()`, which is a tighter
  // check than repeating it against the full emitted artefact would be.
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

  if (lightAt < 0 || darkAt < lightAt || mediaAt < darkAt || responsiveAt < mediaAt) {
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
