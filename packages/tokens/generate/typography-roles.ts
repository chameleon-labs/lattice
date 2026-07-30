/**
 * Semantic typography role emission.
 *
 * CSS receives five custom-property aliases per role because it has no
 * structured typography token. DTCG receives one complete composite per role.
 * Both are generated from the same typed matrix.
 */

import {
  NARROW_HEADING_SIZES,
  TYPOGRAPHY_BREAKPOINT_REM,
  TYPOGRAPHY_ROLES,
  type TypographyRole,
  type TypographyRoleName
} from '../config/typography-roles.js'

const PROPERTIES = [
  { key: 'fontFamily', css: 'font-family', group: 'font' },
  { key: 'fontSize', css: 'font-size', group: 'font-size' },
  { key: 'fontWeight', css: 'font-weight', group: 'font-weight' },
  { key: 'letterSpacing', css: 'letter-spacing', group: 'letter-spacing' },
  { key: 'lineHeight', css: 'line-height', group: 'line-height' }
] as const

export interface TypographyCompositeToken {
  readonly $type: 'typography'
  readonly $value: {
    readonly fontFamily: string
    readonly fontSize: string
    readonly fontWeight: string
    readonly letterSpacing: string
    readonly lineHeight: string
  }
}

export const TYPOGRAPHY_ROLE_COUNT = Object.keys(TYPOGRAPHY_ROLES).length
export const TYPOGRAPHY_ROLE_PROPERTY_COUNT = PROPERTIES.length
export const TYPOGRAPHY_RESPONSIVE_OVERRIDE_COUNT = Object.keys(NARROW_HEADING_SIZES).length

const roleEntries = Object.entries(TYPOGRAPHY_ROLES) as [
  TypographyRoleName,
  TypographyRole
][]

export function typographyRoleCss(): string {
  return roleEntries
    .flatMap(([roleName, role]) =>
      PROPERTIES.map(
        ({ key, css, group }) =>
          `  --lat-text-${roleName}-${css}: var(--lat-${group}-${role[key]});`
      )
    )
    .join('\n')
}

export function typographyRoleTokens(): Readonly<
  Record<TypographyRoleName, TypographyCompositeToken>
> {
  return Object.fromEntries(
    roleEntries.map(([roleName, role]) => [
      roleName,
      {
        $type: 'typography',
        $value: {
          fontFamily: `{global.font.${role.fontFamily}}`,
          fontSize: `{global.font-size.${role.fontSize}}`,
          fontWeight: `{global.font-weight.${role.fontWeight}}`,
          letterSpacing: `{global.letter-spacing.${role.letterSpacing}}`,
          lineHeight: `{global.line-height.${role.lineHeight}}`
        }
      } satisfies TypographyCompositeToken
    ])
  ) as Record<TypographyRoleName, TypographyCompositeToken>
}

export function typographyRoleResponsiveCss(): string {
  const overrides = Object.entries(NARROW_HEADING_SIZES)
    .map(
      ([roleName, fontSize]) =>
        `    --lat-text-${roleName}-font-size: var(--lat-font-size-${fontSize});`
    )
    .join('\n')

  return `@media (width < ${TYPOGRAPHY_BREAKPOINT_REM}rem) {
  :root {
${overrides}
  }
}`
}
