/**
 * The semantic tier: the layer that makes a second theme cheap.
 *
 * A system with primitives and component tokens and nothing in between has to be
 * re-authored per theme, which is why a second theme in such a system tends never
 * to get built. This tier is the fix, in two sub-layers.
 *
 * **Step aliases** name each step of each scale by its job, so a component can
 * ask for `--lat-danger-solid` without knowing that solid means step 9.
 *
 * **Role aliases** cover the common jobs with no scale in the name —
 * `--lat-text`, `--lat-border`, `--lat-solid` — and are what a component should
 * reach for first. Step aliases exist for the cases the role layer does not
 * cover.
 *
 * ## Why these are emitted into every theme scope
 *
 * A custom property whose value contains `var()` is substituted at
 * computed-value time **on the element carrying the declaration**, and the result
 * is what inherits. So `--lat-text: var(--lat-gray-12)` declared once on `:root`
 * freezes to the root theme's grey and keeps that value inside a nested scope
 * that redefines `--lat-gray-12`. Verified in a browser: an alias declared only
 * at the root reports the root's colour inside a nested opposite-theme section,
 * while the same alias re-declared per scope reports the section's.
 *
 * Every alias is therefore emitted alongside the primitives in each mode block.
 * That is what makes `[data-lat-theme]` work on any element rather than only on
 * the root.
 */

import type { ScaleName } from './scales.js'

/**
 * The job each step does, as a name.
 *
 * These are the step contract from Radix, turned into something addressable:
 * `--lat-gray-2` and `--lat-gray-bg-subtle` are the same colour, but only the
 * second says why you would use it.
 */
export const STEP_SLUGS: readonly string[] = [
  'bg',
  'bg-subtle',
  'component',
  'component-hover',
  'component-active',
  'border-subtle',
  'border',
  'border-strong',
  'solid',
  'solid-hover',
  'text-subtle',
  'text'
]

export interface RoleAlias {
  /** The custom property name, without the `--lat-` prefix. */
  readonly role: string
  readonly scale: ScaleName
  /** A member of {@link STEP_SLUGS}. */
  readonly slug: string
}

/**
 * The roles a component reaches for first.
 *
 * Surfaces, borders and text default to grey; anything interactive defaults to
 * the accent. A component that needs a status colour uses the step aliases of
 * that scale instead — `--lat-danger-solid` — rather than a new role.
 */
export const ROLE_ALIASES: readonly RoleAlias[] = [
  { role: 'bg', scale: 'gray', slug: 'bg' },
  { role: 'bg-subtle', scale: 'gray', slug: 'bg-subtle' },
  { role: 'component', scale: 'gray', slug: 'component' },
  { role: 'component-hover', scale: 'gray', slug: 'component-hover' },
  { role: 'component-active', scale: 'gray', slug: 'component-active' },
  { role: 'border-subtle', scale: 'gray', slug: 'border-subtle' },
  { role: 'border', scale: 'gray', slug: 'border' },
  // Interactive borders and the focus ring come from the accent so that focus is
  // recognisably the brand, and never the same colour as a resting border.
  { role: 'border-interactive', scale: 'accent', slug: 'border-strong' },
  { role: 'focus-ring', scale: 'accent', slug: 'border-strong' },
  { role: 'solid', scale: 'accent', slug: 'solid' },
  { role: 'solid-hover', scale: 'accent', slug: 'solid-hover' },
  { role: 'text', scale: 'gray', slug: 'text' },
  { role: 'text-subtle', scale: 'gray', slug: 'text-subtle' },
  { role: 'link', scale: 'accent', slug: 'text-subtle' }
]

/**
 * The one role that is not an alias.
 *
 * `--lat-on-solid` is the text colour that sits on `--lat-solid`, and it is
 * computed per scale by measuring white and black against the fill rather than
 * assumed — hard-coding white here is a recurring bug in hand-built systems. Its
 * value comes from the generator, so it is named here and resolved there.
 */
export const ON_SOLID_ROLE = 'on-solid'

/** Every role name, including the computed one. */
export const ROLE_NAMES: readonly string[] = [
  ...ROLE_ALIASES.map((alias) => alias.role),
  ON_SOLID_ROLE
]
