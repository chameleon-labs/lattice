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

import { SHADOWS, type ShadowName, type ShadowRecipe } from '../config/elevation.js'

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
