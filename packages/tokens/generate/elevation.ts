/**
 * Turning the calibrated recipes into the two artefacts.
 *
 * Two families with different scopes. Shadow primitives are theme-independent —
 * the same neutral black in both modes — so they emit once in the global tier.
 * Elevation roles reference per-scope step aliases, so they are repeated inside
 * every theme block for the reason the semantic colour tier already establishes:
 * a custom property holding a `var()` reference resolves on the element that
 * declares it, so one root declaration would freeze to the root theme.
 */

import {
  ELEVATION_LEVELS,
  ELEVATION_SCALE,
  SHADOWS,
  type ShadowName,
  type ShadowRecipe
} from '../config/elevation.js'
import type { Mode } from '../config/modes.js'

/**
 * The shadow's colour.
 *
 * Neutral by decision, and written in OKLCH so the stylesheet holds no hex and
 * no second colour syntax. `hex` is deliberately absent: DTCG makes it optional
 * and it cannot express alpha, so carrying one would publish an opaque black
 * next to a translucent one.
 */
export interface ShadowColor {
  readonly colorSpace: 'oklch'
  readonly components: readonly [number, number, number]
  readonly alpha: number
}

export interface ShadowDimension {
  readonly value: number
  readonly unit: 'px'
}

export interface ShadowToken {
  readonly $type: 'shadow'
  readonly $value: {
    readonly color: ShadowColor
    readonly offsetX: ShadowDimension
    readonly offsetY: ShadowDimension
    readonly blur: ShadowDimension
    readonly spread: ShadowDimension
  }
}

export const SHADOW_PRIMITIVE_COUNT = Object.keys(SHADOWS).length

const px = (value: number): ShadowDimension => ({ value, unit: 'px' })

const shadowToken = (recipe: ShadowRecipe): ShadowToken => ({
  $type: 'shadow',
  $value: {
    color: { colorSpace: 'oklch', components: [0, 0, 0], alpha: recipe.alpha },
    offsetX: px(recipe.offsetX),
    offsetY: px(recipe.offsetY),
    blur: px(recipe.blur),
    spread: px(recipe.spread)
  }
})

export function shadowCss(): string {
  return Object.entries(SHADOWS)
    .map(
      ([name, recipe]) =>
        `  --lat-shadow-${name}: ${recipe.offsetX}px ${recipe.offsetY}px ` +
        `${recipe.blur}px ${recipe.spread}px oklch(0 0 0 / ${recipe.alpha});`
    )
    .join('\n')
}

export function shadowTokens(): Readonly<Record<ShadowName, ShadowToken>> {
  return Object.fromEntries(
    Object.entries(SHADOWS).map(([name, recipe]) => [name, shadowToken(recipe)])
  ) as Readonly<Record<ShadowName, ShadowToken>>
}

/** A DTCG role: always a reference, never a value. */
export interface ElevationReference {
  readonly $type: 'color' | 'shadow'
  readonly $value: string
}

export type ElevationRoleTokens = Readonly<
  Record<string, Readonly<Record<string, ElevationReference>>>
>

export const ELEVATION_ROLE_COUNT = ELEVATION_LEVELS.reduce(
  (total, level) => total + 1 + (level.border ? 1 : 0) + (level.shadow ? 1 : 0),
  0
)

/**
 * The role declarations for one theme scope.
 *
 * Takes no mode: every value is a reference to a step alias that is itself
 * redeclared per scope, so the text is identical in the light block, the dark
 * block and the preference-driven block, and resolves differently in each.
 */
export function elevationCss(indent = '  '): string {
  const lines: string[] = []

  for (const level of ELEVATION_LEVELS) {
    lines.push(
      `${indent}--lat-elevation-${level.level}-surface: var(--lat-${ELEVATION_SCALE}-${level.surface});`
    )
    if (level.border) {
      lines.push(
        `${indent}--lat-elevation-${level.level}-border: var(--lat-${ELEVATION_SCALE}-${level.border});`
      )
    }
    if (level.shadow) {
      lines.push(`${indent}--lat-elevation-${level.level}-shadow: var(--lat-shadow-${level.shadow});`)
    }
  }

  return lines.join('\n')
}

export function elevationTokens(mode: Mode): ElevationRoleTokens {
  const groups: Record<string, Record<string, ElevationReference>> = {}

  for (const level of ELEVATION_LEVELS) {
    const signals: Record<string, ElevationReference> = {
      surface: { $type: 'color', $value: `{${mode}.${ELEVATION_SCALE}.${level.surface}}` }
    }
    if (level.border) {
      signals['border'] = {
        $type: 'color',
        $value: `{${mode}.${ELEVATION_SCALE}.${level.border}}`
      }
    }
    if (level.shadow) {
      // Theme-independent by design, so this is the one role that points out of
      // its own mode and into the global tier.
      signals['shadow'] = { $type: 'shadow', $value: `{global.shadow.${level.shadow}}` }
    }
    groups[level.level] = signals
  }

  return groups as ElevationRoleTokens
}
