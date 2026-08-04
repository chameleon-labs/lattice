import { describe, expect, it } from 'vitest'
import { TYPOGRAPHY_ROLES } from '../config/typography-roles.js'

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
})
