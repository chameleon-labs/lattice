import { describe, expect, it } from 'vitest'

import { MODES, STEPS } from '../config/lightness.js'
import { SCALE_NAMES } from '../config/scales.js'
import { ON_SOLID_ROLE, ROLE_ALIASES, ROLE_NAMES, STEP_SLUGS } from '../config/semantic.js'
import { emitCss } from '../generate/emit.js'
import { buildAllScales, buildScale } from '../generate/scale.js'
import { accentOnSolid, ALIAS_COUNT, roleAliases, stepAliases } from '../generate/semantic.js'

const scales = buildAllScales()
const css = emitCss(scales)

/**
 * The light rule, the explicit-dark rule, and the preference-driven dark rule.
 *
 * Throws rather than slicing on a missing delimiter. `indexOf` returns -1 when a
 * selector changes, and `slice(-1, …)` then yields a one-character string, so
 * every assertion downstream fails on content when the real problem is that the
 * split found nothing to split.
 */
function blocks(stylesheet: string): [string, string, string] {
  const lightAt = stylesheet.indexOf("\n:root,\n[data-lat-theme='light'] {")
  const darkAt = stylesheet.indexOf("\n[data-lat-theme='dark'] {")
  const mediaAt = stylesheet.indexOf('@media (prefers-color-scheme: dark)')
  const responsiveAt = stylesheet.indexOf('@media (width < 40rem)')

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
    stylesheet.slice(lightAt, darkAt),
    stylesheet.slice(darkAt, mediaAt),
    stylesheet.slice(mediaAt, responsiveAt)
  ]
}

describe('the block splitter itself', () => {
  // Every assertion below is only as trustworthy as this split. Unguarded,
  // indexOf returns -1 when a selector changes and slice(-1, …) yields a
  // one-character string, so the real failure — "the stylesheet no longer has
  // the block I expected" — surfaces as a dozen confusing content mismatches.
  it('refuses to split a stylesheet that lacks the expected rules', () => {
    expect(() => blocks(':root { --lat-gray-1: oklch(0.5 0 0); }')).toThrow(/block/i)
  })

  it('splits the real stylesheet into three non-empty blocks', () => {
    const parts = blocks(css)

    expect(parts).toHaveLength(3)
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(100)
    }
  })
})

describe('step aliases', () => {
  it('names every step of every scale by its job', () => {
    expect(stepAliases()).toHaveLength(SCALE_NAMES.length * STEPS)
  })

  it.each(SCALE_NAMES)('maps %s slugs onto the right step numbers', (scale) => {
    const aliases = stepAliases().filter((alias) => alias.name.startsWith(`--lat-${scale}-`))

    STEP_SLUGS.forEach((slug, index) => {
      expect(aliases).toContainEqual({
        name: `--lat-${scale}-${slug}`,
        value: `var(--lat-${scale}-${index + 1})`
      })
    })
  })

  // The step contract is the reason the scale is numbered at all, so the slugs
  // have to say the same thing the numbers mean.
  it('puts solid at step 9 and the two text steps at 11 and 12', () => {
    expect(STEP_SLUGS[8]).toBe('solid')
    expect(STEP_SLUGS[9]).toBe('solid-hover')
    expect(STEP_SLUGS[10]).toBe('text-subtle')
    expect(STEP_SLUGS[11]).toBe('text')
  })
})

describe('role aliases', () => {
  it.each(MODES)('covers the documented roles in %s mode', (mode) => {
    expect(roleAliases(scales, mode).map((alias) => alias.name)).toEqual(
      ROLE_NAMES.map((role) => `--lat-${role}`)
    )
  })

  it('names the roles the design calls out', () => {
    for (const role of [
      'text',
      'text-subtle',
      'border',
      'border-interactive',
      'focus-ring',
      'solid',
      'solid-hover',
      'on-solid'
    ]) {
      expect(ROLE_NAMES).toContain(role)
    }
  })

  it('points every role at a step alias that exists', () => {
    const defined = new Set(stepAliases().map((alias) => alias.name))

    for (const alias of ROLE_ALIASES) {
      expect(defined, `${alias.role}`).toContain(`--lat-${alias.scale}-${alias.slug}`)
    }
  })

  // on-solid is measured against the fill rather than assumed. Hard-coding white
  // is a recurring bug in hand-built systems, so the emitted value has to track
  // whatever the generator computed.
  it.each(MODES)('takes on-solid from the computed answer in %s mode', (mode) => {
    const expected = buildScale('accent', mode).onSolid.text === 'white' ? 'oklch(1 0 0)' : 'oklch(0 0 0)'
    const onSolid = roleAliases(scales, mode).find((alias) => alias.name === `--lat-${ON_SOLID_ROLE}`)

    expect(onSolid?.value).toBe(expected)
  })

  // Both artefacts read on-solid from the scales already built, so they cannot
  // disagree about what sits on the fill. If the accent is not among them that is
  // a caller error worth naming, not a reason to silently rebuild it.
  it('refuses to resolve on-solid from scales that lack the accent', () => {
    const withoutAccent = scales.filter((scale) => scale.name !== 'accent')

    expect(() => accentOnSolid(withoutAccent, 'light')).toThrow(/accent/i)
  })

  // The discriminating test: a doctored accent proves the value is read from the
  // array that was passed in. Rebuilding the scale internally would ignore this
  // and return white, which is the divergence the plumbing exists to prevent.
  it('reads on-solid from the supplied scales rather than rebuilding them', () => {
    const doctored = scales.map((scale) =>
      scale.name === 'accent' && scale.mode === 'light'
        ? { ...scale, onSolid: { text: 'black' as const, ratio: 9.9, apcaLc: 0 } }
        : scale
    )

    expect(accentOnSolid(doctored, 'light').text).toBe('black')
    expect(
      roleAliases(doctored, 'light').find((alias) => alias.name === '--lat-on-solid')?.value
    ).toBe('oklch(0 0 0)')
  })

  it('keeps the focus ring distinct from a resting border', () => {
    const focus = ROLE_ALIASES.find((alias) => alias.role === 'focus-ring')
    const border = ROLE_ALIASES.find((alias) => alias.role === 'border')

    expect(focus?.scale).not.toBe(border?.scale)
  })
})

describe('the tier is emitted into every theme scope', () => {
  // The finding this design rests on, verified in a browser: a custom property
  // holding a var() reference is substituted on the element that declares it, so
  // an alias declared once on :root freezes to the root theme and keeps that
  // value inside a nested scope that redefines the primitive underneath.
  //
  // Declaring the aliases in each block is what makes [data-lat-theme] work on
  // any element. If this ever regresses to a single declaration, nested themes
  // break silently — the CSS stays valid and the colours stop changing.
  it('declares every alias in all three blocks', () => {
    const [light, dark, media] = blocks(css)

    for (const alias of [...stepAliases(), ...roleAliases(scales, 'light')]) {
      expect(light, alias.name).toContain(`${alias.name}:`)
      expect(dark, alias.name).toContain(`${alias.name}:`)
      expect(media, alias.name).toContain(`${alias.name}:`)
    }
  })

  it('carries the same alias count in each block', () => {
    for (const block of blocks(css)) {
      const declared = block.match(/--lat-[a-z0-9-]+: var\(/g) ?? []

      // Every alias but on-solid is a var() reference; on-solid is a colour.
      expect(declared).toHaveLength(ALIAS_COUNT - 1)
    }
  })

  it('agrees with the count the generator reports', () => {
    expect(ALIAS_COUNT).toBe(stepAliases().length + roleAliases(scales, 'light').length)
  })
})

describe('referential integrity', () => {
  // Every var() reference has to resolve to something declared in the same
  // block. A typo here produces CSS that parses, loads, and renders nothing —
  // the property simply resolves to its guaranteed-invalid initial value.
  it.each([0, 1, 2])('leaves no dangling reference in block %i', (index) => {
    const block = blocks(css)[index]!
    const declared = new Set((block.match(/(--lat-[a-z0-9-]+):/g) ?? []).map((m) => m.slice(0, -1)))
    const referenced = (block.match(/var\((--lat-[a-z0-9-]+)\)/g) ?? []).map((m) =>
      m.slice(4, -1)
    )

    expect(referenced.length).toBeGreaterThan(0)
    for (const reference of referenced) {
      expect(declared, reference).toContain(reference)
    }
  })

  it('resolves every role through a step alias to a primitive', () => {
    const [light] = blocks(css)
    const valueOf = (name: string): string | undefined =>
      new RegExp(`${name}: ([^;]+);`).exec(light)?.[1]

    // --lat-text -> var(--lat-gray-text) -> var(--lat-gray-12) -> a colour.
    expect(valueOf('--lat-text')).toBe('var(--lat-gray-text)')
    expect(valueOf('--lat-gray-text')).toBe('var(--lat-gray-12)')
    expect(valueOf('--lat-gray-12')).toMatch(/^oklch\(/)
  })
})

describe('the stylesheet still holds no hex', () => {
  // The semantic tier introduced the first non-generated value, on-solid. It is
  // written as oklch so the rule that every declaration is either a var() or an
  // oklch() colour stays true for all of them.
  it('writes on-solid as oklch rather than a hex literal', () => {
    expect(css).toContain('--lat-on-solid: oklch(')
    expect(css.match(/--lat-[a-z0-9-]+: #[0-9a-f]{6};/g) ?? []).toHaveLength(0)
  })
})
