import { describe, expect, it } from 'vitest'
import { TYPOGRAPHY_ROLES } from '../config/typography-roles.js'
import { typographyRoleCss } from '../generate/typography-roles.js'

describe('typography roles', () => {
  it('defines the five mono roles', () => {
    for (const role of ['eyebrow', 'meta', 'tag', 'numeric', 'code']) {
      expect(TYPOGRAPHY_ROLES[role]!.fontFamily).toBe('mono')
    }
  })

  it('gives the eyebrow uppercase at 0.2em', () => {
    const eyebrow = TYPOGRAPHY_ROLES.eyebrow!
    expect(eyebrow.fontSize).toBe('3xs')
    expect(eyebrow.letterSpacing).toBe('eyebrow')
    expect(eyebrow.textTransform).toBe('uppercase')
  })

  it('gives the numeric role tabular figures', () => {
    expect(TYPOGRAPHY_ROLES.numeric!.fontVariantNumeric).toBe('tabular-nums')
  })

  it("matches Meridian's specimen for the sans roles", () => {
    expect(TYPOGRAPHY_ROLES.display!.fontSize).toBe('5xl')
    expect(TYPOGRAPHY_ROLES.display!.fontWeight).toBe('bold')
    expect(TYPOGRAPHY_ROLES.h1!.fontSize).toBe('3xl')
    expect(TYPOGRAPHY_ROLES.h1!.fontWeight).toBe('semibold')
    expect(TYPOGRAPHY_ROLES.h2!.fontWeight).toBe('medium')
    expect(TYPOGRAPHY_ROLES.body!.fontSize).toBe('base')
  })

  // The three below assert the emitted CSS, not the config object. Everything
  // above would pass unchanged if Step 6's emission code were deleted outright —
  // the config fields were already true before it existed. These are what
  // actually cover the generator.

  it('emits the optional properties for the roles that declare them', () => {
    const css = typographyRoleCss()
    expect(css).toContain('--lat-text-eyebrow-text-transform: uppercase;')
    expect(css).toContain('--lat-text-tag-text-transform: uppercase;')
    expect(css).toContain('--lat-text-numeric-font-variant-numeric: tabular-nums;')
  })

  it('emits nothing extra for a role that declares neither', () => {
    // The failure this catches is a leaked `undefined` declaration, which is
    // silently invalid CSS rather than an error.
    const css = typographyRoleCss()
    expect(css).not.toContain('--lat-text-body-text-transform')
    expect(css).not.toContain('--lat-text-body-font-variant-numeric')
    expect(css).not.toContain('undefined')
  })

  it('carries the eyebrow tracking through to the emitted role', () => {
    // typographyRoleCss() aliases every one of the five base properties to its
    // primitive via var() — same as body-font-family -> var(--lat-font-sans)
    // above — rather than inlining the resolved value. The literal 0.2em lives
    // in config/typography.ts and is only ever inlined by typographyCss(), the
    // separate primitives generator. This assertion checks the alias is wired
    // to the right primitive name, which is what this generator can promise.
    expect(typographyRoleCss()).toContain(
      '--lat-text-eyebrow-letter-spacing: var(--lat-letter-spacing-eyebrow);'
    )
  })
})
