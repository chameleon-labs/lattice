import { describe, expect, it } from 'vitest'

import {
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  LETTER_SPACINGS,
  LINE_HEIGHTS
} from '../config/typography.js'
import {
  NARROW_HEADING_SIZES,
  TYPOGRAPHY_BREAKPOINT_REM,
  TYPOGRAPHY_ROLES
} from '../config/typography-roles.js'
import {
  typographyRoleCss,
  typographyRoleResponsiveCss,
  typographyRoleTokens
} from '../generate/typography-roles.js'

describe('typography semantic roles', () => {
  it('carries the approved eleven-role matrix', () => {
    expect(TYPOGRAPHY_ROLES).toEqual({
      body: {
        fontFamily: 'sans',
        fontSize: 'base',
        fontWeight: 'regular',
        letterSpacing: 'normal',
        lineHeight: 'normal',
        classification: 'prose'
      },
      'body-strong': {
        fontFamily: 'sans',
        fontSize: 'base',
        fontWeight: 'semibold',
        letterSpacing: 'normal',
        lineHeight: 'normal',
        classification: 'prose'
      },
      lead: {
        fontFamily: 'sans',
        fontSize: 'lg',
        fontWeight: 'regular',
        letterSpacing: 'normal',
        lineHeight: 'relaxed',
        classification: 'prose'
      },
      ui: {
        fontFamily: 'sans',
        fontSize: 'sm',
        fontWeight: 'semibold',
        letterSpacing: 'normal',
        lineHeight: 'snug',
        classification: 'ui'
      },
      caption: {
        fontFamily: 'sans',
        fontSize: 'xs',
        fontWeight: 'regular',
        letterSpacing: 'normal',
        lineHeight: 'normal',
        classification: 'supporting'
      },
      micro: {
        fontFamily: 'sans',
        fontSize: '2xs',
        fontWeight: 'regular',
        letterSpacing: 'normal',
        lineHeight: 'normal',
        classification: 'restricted'
      },
      code: {
        fontFamily: 'mono',
        fontSize: 'sm',
        fontWeight: 'regular',
        letterSpacing: 'normal',
        lineHeight: 'normal',
        classification: 'code'
      },
      'heading-1': {
        fontFamily: 'sans',
        fontSize: '4xl',
        fontWeight: 'bold',
        letterSpacing: 'normal',
        lineHeight: 'tight',
        classification: 'display'
      },
      'heading-2': {
        fontFamily: 'sans',
        fontSize: '3xl',
        fontWeight: 'bold',
        letterSpacing: 'normal',
        lineHeight: 'tight',
        classification: 'display'
      },
      'heading-3': {
        fontFamily: 'sans',
        fontSize: '2xl',
        fontWeight: 'semibold',
        letterSpacing: 'normal',
        lineHeight: 'snug',
        classification: 'display'
      },
      'heading-4': {
        fontFamily: 'sans',
        fontSize: 'xl',
        fontWeight: 'semibold',
        letterSpacing: 'normal',
        lineHeight: 'snug',
        classification: 'display'
      }
    })
  })

  it('references an existing primitive for every emitted property', () => {
    for (const role of Object.values(TYPOGRAPHY_ROLES)) {
      expect(FONT_FAMILIES).toHaveProperty(role.fontFamily)
      expect(FONT_SIZES).toHaveProperty(role.fontSize)
      expect(FONT_WEIGHTS).toHaveProperty(role.fontWeight)
      expect(LETTER_SPACINGS).toHaveProperty(role.letterSpacing)
      expect(LINE_HEIGHTS).toHaveProperty(role.lineHeight)
    }
  })

  it('keeps prose roles at the approved size and leading floors', () => {
    const proseRoles = Object.values(TYPOGRAPHY_ROLES).filter(
      (role) => role.classification === 'prose'
    )

    expect(proseRoles).toHaveLength(3)
    for (const role of proseRoles) {
      expect(FONT_SIZES[role.fontSize]).toBeGreaterThanOrEqual(FONT_SIZES.base)
      expect(LINE_HEIGHTS[role.lineHeight]).toBeGreaterThanOrEqual(LINE_HEIGHTS.normal)
    }
  })

  it('reserves 2xs for the restricted micro role', () => {
    const smallest = Object.entries(TYPOGRAPHY_ROLES).filter(
      ([, role]) => role.fontSize === '2xs'
    )

    expect(smallest).toEqual([['micro', expect.objectContaining({ classification: 'restricted' })]])
  })

  it('keeps Inter opt-in and the public hierarchy at four headings', () => {
    const usedFamilies: readonly string[] = Object.values(TYPOGRAPHY_ROLES).map(
      (role) => role.fontFamily
    )

    expect(usedFamilies).not.toContain('inter')
    expect(Object.keys(TYPOGRAPHY_ROLES).filter((name) => name.startsWith('heading-'))).toEqual([
      'heading-1',
      'heading-2',
      'heading-3',
      'heading-4'
    ])
  })

  it('steps exactly the first three headings below 40rem', () => {
    expect(TYPOGRAPHY_BREAKPOINT_REM).toBe(40)
    expect(NARROW_HEADING_SIZES).toEqual({
      'heading-1': '3xl',
      'heading-2': '2xl',
      'heading-3': 'xl'
    })
  })

  it('emits five mechanically named CSS aliases per role', () => {
    const css = typographyRoleCss()

    expect(css).toContain(
      '  --lat-text-body-font-family: var(--lat-font-sans);\n' +
        '  --lat-text-body-font-size: var(--lat-font-size-base);\n' +
        '  --lat-text-body-font-weight: var(--lat-font-weight-regular);\n' +
        '  --lat-text-body-letter-spacing: var(--lat-letter-spacing-normal);\n' +
        '  --lat-text-body-line-height: var(--lat-line-height-normal);'
    )
    expect(css.match(/--lat-text-/g)).toHaveLength(11 * 5)
    expect(css).not.toContain('classification')
  })

  it('emits default roles as complete DTCG typography composites', () => {
    const tokens = typographyRoleTokens()

    expect(tokens.body).toEqual({
      $type: 'typography',
      $value: {
        fontFamily: '{global.font.sans}',
        fontSize: '{global.font-size.base}',
        fontWeight: '{global.font-weight.regular}',
        letterSpacing: '{global.letter-spacing.normal}',
        lineHeight: '{global.line-height.normal}'
      }
    })
    expect(Object.keys(tokens)).toHaveLength(11)
    expect(JSON.stringify(tokens)).not.toContain('classification')
  })

  it('emits only the approved responsive heading overrides', () => {
    expect(typographyRoleResponsiveCss()).toBe(`@media (width < 40rem) {
  :root {
    --lat-text-heading-1-font-size: var(--lat-font-size-3xl);
    --lat-text-heading-2-font-size: var(--lat-font-size-2xl);
    --lat-text-heading-3-font-size: var(--lat-font-size-xl);
  }
}`)
  })
})
