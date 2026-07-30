/**
 * Emitting the semantic tier.
 *
 * Produces the alias declarations for one theme scope. Everything here is a
 * `var()` reference rather than a colour, which is the point: the semantic tier
 * carries meaning, and the primitives carry the values.
 */

import { STEPS, type Mode } from '../config/lightness.js'
import { SCALE_NAMES } from '../config/scales.js'
import { ON_SOLID_ROLE, ROLE_ALIASES, STEP_SLUGS } from '../config/semantic.js'
import { buildScale } from './scale.js'

export interface Alias {
  /** Full custom property name, including the `--lat-` prefix. */
  readonly name: string
  /** The declaration's value, a `var()` reference or a colour. */
  readonly value: string
}

/**
 * One alias per step per scale, named by the job that step does.
 *
 * `--lat-gray-2` and `--lat-gray-bg-subtle` are the same colour; only the second
 * says why you would reach for it.
 */
export function stepAliases(): Alias[] {
  return SCALE_NAMES.flatMap((scale) =>
    STEP_SLUGS.map((slug, index) => ({
      name: `--lat-${scale}-${slug}`,
      value: `var(--lat-${scale}-${index + 1})`
    }))
  )
}

/**
 * The roles a component reaches for first.
 *
 * Each points at a step alias rather than a raw step, so the indirection reads as
 * a sentence: `--lat-text` is the grey scale's text step.
 */
export function roleAliases(mode: Mode): Alias[] {
  const roles: Alias[] = ROLE_ALIASES.map((alias) => ({
    name: `--lat-${alias.role}`,
    value: `var(--lat-${alias.scale}-${alias.slug})`
  }))

  // on-solid is computed, never assumed: the generator measures white and black
  // against the accent's fill and reports the winner. Written as oklch so the
  // stylesheet holds no hex, which keeps the "oklch is the source of truth" rule
  // true for every declaration rather than most of them.
  const onSolid = buildScale('accent', mode).onSolid.text
  roles.push({
    name: `--lat-${ON_SOLID_ROLE}`,
    value: onSolid === 'white' ? 'oklch(1 0 0)' : 'oklch(0 0 0)'
  })

  return roles
}

/**
 * Every alias for one theme scope, as CSS declarations.
 *
 * These are emitted **inside each mode block**, not once on `:root`. A custom
 * property containing `var()` is substituted at computed-value time on the
 * element that declares it, so an alias declared only at the root freezes to the
 * root theme's colour and keeps it inside a nested scope that redefines the
 * primitive underneath. Re-declaring per scope is what makes `[data-lat-theme]`
 * work anywhere.
 */
export function semanticBlock(mode: Mode, indent = '  '): string {
  const steps = stepAliases()
  const roles = roleAliases(mode)
  const declare = (alias: Alias): string => `${indent}${alias.name}: ${alias.value};`

  return [steps.map(declare).join('\n'), roles.map(declare).join('\n')].join('\n\n')
}

/** How many aliases a single theme scope carries. */
export const ALIAS_COUNT = SCALE_NAMES.length * STEPS + ROLE_ALIASES.length + 1
