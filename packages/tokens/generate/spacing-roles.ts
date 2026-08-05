/**
 * Semantic spacing roles, in both representations.
 *
 * The vocabulary itself lives in `config/spacing-roles.ts`; this module only
 * turns it into a stylesheet block and a DTCG group. Every emitted value is a
 * reference to a layout primitive rather than a restated number, so a change to
 * `SPACES` reaches the roles without touching this file.
 *
 * ## Why the two representations do not have matching names
 *
 * A label's inset is one idea with two measures — `2` down the block axis and
 * `4` across the inline one — and the two artefacts disagree about whether that
 * can be a single value.
 *
 * CSS can hold it as one, because `padding` takes a two-value shorthand, so the
 * role emits as one custom property a call site can use directly:
 *
 * ```css
 * padding: var(--lat-inset-label-md);
 * ```
 *
 * DTCG cannot. Its `dimension` type is a single `{value, unit}` pair and the
 * format defines no two-dimension type, so the honest encoding is a **group of
 * two dimensions**, `block` and `inline`:
 *
 * ```json
 * "label-md": {
 *   "block":  { "$type": "dimension", "$value": "{global.space.2}" },
 *   "inline": { "$type": "dimension", "$value": "{global.space.4}" }
 * }
 * ```
 *
 * The rejected alternative was a `dimension` holding the string `"0.5rem 1rem"`,
 * which validates against nothing, cannot be scaled or converted by a consuming
 * tool, and would make the JSON artefact a transcription of the CSS rather than
 * a description of the system.
 *
 * The consequence is that parity between the two is **structural, not
 * name-for-name**: every CSS role has a DTCG counterpart resolving to the same
 * primitives, and `tests/spacing-roles.test.ts` asserts that rather than a 1:1
 * name map. Symmetric roles — the whole `surface` family, and every gap — have
 * one measure and so emit as a single token in both.
 *
 * ## Why the values are references rather than resolved numbers
 *
 * Both artefacts point at the primitive: `var(--lat-space-2)` in CSS,
 * `{global.space.2}` in JSON. Resolving to `0.5rem` in the JSON would have been
 * simpler to assert, and would have quietly flattened the tier — a consumer
 * reading only `tokens.json` would see nine unrelated measurements where the
 * system has three families built on one scale. It also inherits the package's
 * existing guarantee that every alias resolves to a token that exists, which a
 * literal value gets no benefit from.
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
 * The shorthand, block axis first. That is the order `padding` and `margin`
 * already define for two values; reversing it still parses, so nothing would
 * report the mistake except every padded element in the library coming out
 * shape.
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
