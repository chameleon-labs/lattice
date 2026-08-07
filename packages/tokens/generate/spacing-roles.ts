/**
 * The vocabulary lives in `config/spacing-roles.ts`; this only renders it as a
 * stylesheet block and a DTCG group.
 *
 * The two do not have matching names, because they disagree about whether a
 * label's inset — `2` down the block axis, `4` across the inline one — can be a
 * single value. CSS can hold it as one, `padding` taking a two-value shorthand.
 * DTCG cannot: its `dimension` is a single `{value, unit}` and the format
 * defines no two-dimension type, so a pair emits as a group of two dimensions,
 * `block` and `inline`. The rejected alternative, a `dimension` holding
 * `"0.5rem 1rem"`, validates against nothing and cannot be scaled or converted
 * by a consuming tool.
 *
 * So parity is **structural, not name-for-name**: every CSS role has a DTCG
 * counterpart resolving to the same primitives, which is what
 * `tests/spacing-roles.test.ts` asserts. Symmetric roles emit as one token in
 * both.
 *
 * Both point at the primitive rather than a resolved number —
 * `var(--lat-space-2)`, `{global.space.2}`. Resolving to `0.5rem` in the JSON
 * would flatten the tier, leaving a consumer reading only `tokens.json` with
 * nine unrelated measurements where the system has three families on one scale,
 * and would forfeit the existing guarantee that every alias resolves to a token
 * that exists.
 */
import { GAP_ROLES, INSET_ROLES, type InsetValue, type SpaceName } from '../config/spacing-roles.js'

/**
 * A DTCG dimension expressed as a reference to a layout primitive. The colour
 * tier's `AliasToken` is the same idea for `$type: 'color'`.
 */
export interface DimensionAlias {
  readonly $type: 'dimension'
  readonly $value: string
}

/** A pair, as DTCG must express it: two dimensions under one group. */
export interface InsetPairGroup {
  readonly block: DimensionAlias
  readonly inline: DimensionAlias
}

export interface SpacingRoleTokenGroups {
  readonly inset: Readonly<Record<string, DimensionAlias | InsetPairGroup>>
  readonly gap: Readonly<Record<string, DimensionAlias>>
}

/** Custom properties emitted, which is one per role in either family. */
export const SPACING_ROLE_COUNT =
  Object.keys(INSET_ROLES).length + Object.keys(GAP_ROLES).length

const reference = (name: SpaceName): string => `var(--lat-space-${name})`

/**
 * Block axis first — the order `padding` and `margin` already define for two
 * values. Reversing it still parses, so nothing would report the mistake except
 * every padded element in the library coming out the wrong shape.
 */
const insetValue = (value: InsetValue): string =>
  Array.isArray(value)
    ? `${reference(value[0])} ${reference(value[1])}`
    : reference(value as SpaceName)

const dimensionAlias = (name: SpaceName): DimensionAlias => ({
  $type: 'dimension',
  $value: `{global.space.${name}}`
})

export function spacingRoleCss(): string {
  return [
    ...Object.entries(INSET_ROLES).map(
      ([role, value]) => `  --lat-inset-${role}: ${insetValue(value)};`
    ),
    ...Object.entries(GAP_ROLES).map(([role, name]) => `  --lat-gap-${role}: ${reference(name)};`)
  ].join('\n')
}

export function spacingRoleTokens(): SpacingRoleTokenGroups {
  return {
    inset: Object.fromEntries(
      Object.entries(INSET_ROLES).map(([role, value]) => [
        role,
        Array.isArray(value)
          ? { block: dimensionAlias(value[0]), inline: dimensionAlias(value[1]) }
          : dimensionAlias(value as SpaceName)
      ])
    ),
    gap: Object.fromEntries(
      Object.entries(GAP_ROLES).map(([role, name]) => [role, dimensionAlias(name)])
    )
  }
}
