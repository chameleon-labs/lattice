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
import type { OnSolid, Scale } from './scale.js'

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
export function roleAliases(scales: readonly Scale[], mode: Mode): Alias[] {
  const roles: Alias[] = ROLE_ALIASES.map((alias) => ({
    name: `--lat-${alias.role}`,
    value: `var(--lat-${alias.scale}-${alias.slug})`
  }))

  // on-solid is computed, never assumed: the generator measures white and black
  // against the accent's fill and reports the winner. Written as oklch so the
  // stylesheet holds no hex, which keeps the "oklch is the source of truth" rule
  // true for every declaration rather than most of them.
  roles.push({
    name: `--lat-${ON_SOLID_ROLE}`,
    value: accentOnSolid(scales, mode).text === 'white' ? 'oklch(1 0 0)' : 'oklch(0 0 0)'
  })

  return roles
}

/**
 * The accent's computed on-solid, read from the scales that were already built.
 *
 * Both artefacts resolve it through here rather than rebuilding the scale, so the
 * stylesheet and the JSON cannot disagree about which text colour sits on the
 * fill — they are reading one object, not two independent computations that
 * happen to agree today.
 */
export function accentOnSolid(scales: readonly Scale[], mode: Mode): OnSolid {
  const accent = scales.find((scale) => scale.name === 'accent' && scale.mode === mode)

  if (!accent) {
    throw new Error(`no accent scale for ${mode} mode among the ${scales.length} scales supplied`)
  }

  return accent.onSolid
}

/**
 * One on-solid per scale, measured against that scale's own fill.
 *
 * `--lat-on-solid` answers "what text sits on `--lat-solid`", and `--lat-solid`
 * is the accent. A component offering a solid fill in another family needs that
 * family's answer, and the answers differ: white clears 4.5:1 on the accent and
 * misses it on every other scale, where black clears it comfortably.
 *
 * Found by building a solid button with a tone axis — white on the grey fill
 * measures 3.12:1. Every scale already carried its own measured `onSolid`, so
 * the gap was in what got published rather than in what got measured.
 */
export function onSolidAliases(scales: readonly Scale[], mode: Mode): Alias[] {
  return SCALE_NAMES.map((name) => {
    const scale = scales.find((candidate) => candidate.name === name && candidate.mode === mode)

    if (!scale) {
      throw new Error(`no ${name} scale for ${mode} mode among the ${scales.length} scales supplied`)
    }

    return {
      name: `--lat-${name}-on-solid`,
      value: scale.onSolid.text === 'white' ? 'oklch(1 0 0)' : 'oklch(0 0 0)'
    }
  })
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
export function semanticBlock(scales: readonly Scale[], mode: Mode, indent = '  '): string {
  const steps = stepAliases()
  const onSolids = onSolidAliases(scales, mode)
  const roles = roleAliases(scales, mode)
  const declare = (alias: Alias): string => `${indent}${alias.name}: ${alias.value};`

  return [
    steps.map(declare).join('\n'),
    onSolids.map(declare).join('\n'),
    roles.map(declare).join('\n')
  ].join('\n\n')
}

/** How many aliases a single theme scope carries. */
export const ALIAS_COUNT =
  SCALE_NAMES.length * STEPS + SCALE_NAMES.length + ROLE_ALIASES.length + 1
