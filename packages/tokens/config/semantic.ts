/**
 * The semantic tier: the layer that makes a second theme cheap.
 *
 * The Figma bundle names its colours by job already — `--background`, `--card`,
 * `--muted-foreground` — so this tier is a rename rather than an interpretation.
 * The mapping is one-to-one and recorded in the spec's §1.1 table.
 *
 * The step-alias sub-layer is gone with the numbered scale. `--lat-gray-9` named
 * a step so a component could avoid knowing that 9 meant solid; with roles
 * anchored directly there is no number to hide.
 *
 * ## Why these are emitted into every theme scope
 *
 * A custom property whose value contains `var()` is substituted at
 * computed-value time on the element carrying the declaration, and the result is
 * what inherits. So `--lat-text: var(--lat-gray-text)` declared once on `:root`
 * freezes to the root theme's grey and keeps that value inside a nested scope
 * that redefines it. Every alias is therefore emitted alongside the primitives in
 * each mode block, which is what makes `[data-lat-theme]` work on any element.
 */

export interface RoleAlias {
  /** The custom property name, without the `--lat-` prefix. */
  readonly role: string
  /** The primitive it points at, without the `--lat-` prefix. */
  readonly source: string
}

export const ROLE_ALIASES: readonly RoleAlias[] = [
  { role: 'bg', source: 'gray-bg' },
  { role: 'bg-raised', source: 'gray-bg-raised' },
  { role: 'bg-subtle', source: 'gray-bg-subtle' },
  { role: 'component', source: 'gray-component' },
  { role: 'field-bg', source: 'gray-field-bg' },
  { role: 'switch-track', source: 'gray-switch-track' },
  { role: 'text', source: 'gray-text' },
  { role: 'text-subtle', source: 'gray-text-subtle' },
  { role: 'solid', source: 'accent-solid' },
  { role: 'on-solid', source: 'accent-on-solid' }
]
