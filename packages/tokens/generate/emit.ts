/**
 * Turning generated scales into the two shippable artefacts.
 *
 * `lattice.css` is what a consumer imports; `tokens.json` is the machine-readable
 * form, in the Design Tokens Community Group format.
 *
 * Emits the **primitive tier**, the **chart palettes**, the **severity ramp** and
 * the **semantic tier** — step aliases and role aliases — in both artefacts. The
 * stylesheet expresses aliases as `var()` references and the JSON as DTCG
 * `{group.token}` references, so a consumer reading only the JSON sees the same
 * two tiers rather than primitives with no meaning attached.
 */

import { ORDINAL_CLAMP } from '../config/charts.js'
import { MODES, STEPS, type Mode } from '../config/modes.js'
import { ON_SOLID_ROLE, ROLE_ALIASES, STEP_SLUGS } from '../config/semantic.js'
import { SCALE_JOBS, STEP_JOBS } from '../config/steps.js'
import { buildCategorical, buildSequential } from './charts.js'
import {
  ELEVATION_ROLE_COUNT,
  SHADOW_PRIMITIVE_COUNT,
  elevationCss,
  elevationTokens,
  shadowCss,
  shadowTokens
} from './elevation.js'
import {
  LAYOUT_PRIMITIVE_COUNTS,
  layoutCss,
  layoutTokens
} from './layout.js'
import {
  MOTION_PRIMITIVE_COUNTS,
  motionCss,
  motionTokens
} from './motion.js'
import type { Scale, Swatch } from './scale.js'
import { accentOnSolid, semanticBlock } from './semantic.js'
import { buildSeverity } from './severity.js'
import {
  TYPOGRAPHY_PRIMITIVE_COUNT,
  typographyCss,
  typographyTokens
} from './typography.js'
import {
  TYPOGRAPHY_ROLE_COUNT,
  TYPOGRAPHY_ROLE_PROPERTY_COUNT,
  typographyRoleCss,
  typographyRoleResponsiveCss,
  typographyRoleTokens
} from './typography-roles.js'

/**
 * The published DTCG schema. The format module notes that a schema is still being
 * explored, but this one is live and versioned, so the artefact points at it.
 */
export const DTCG_SCHEMA = 'https://www.designtokens.org/schemas/2025.10/format.json'

/**
 * Decimal places kept in an emitted colour.
 *
 * Not cosmetic. At three places — the precision the spec's own tables print — 21
 * of the 120 generated colours re-emit as a different byte, and at five places two
 * still do: the solved success steps, whose lightness comes off a binary search
 * rather than the curve. Six round-trips all 120 exactly, so the colour a browser
 * computes is the colour whose contrast was verified.
 */
const PLACES = 6

function trim(value: number): string {
  // toFixed then back through Number drops trailing zeros, so a hue stays `305`
  // rather than becoming `305.000000`.
  return String(Number(value.toFixed(PLACES)))
}

/** A swatch as a CSS `oklch()` value. */
export function formatOklch(swatch: Pick<Swatch, 'l' | 'c' | 'h'>): string {
  return `oklch(${trim(swatch.l)} ${trim(swatch.c)} ${trim(swatch.h)})`
}

const customProperty = (scale: Scale, swatch: Swatch): string =>
  `  --lat-${scale.name}-${swatch.step}: ${formatOklch(swatch)};`

function themedBlock(scales: readonly Scale[], mode: Mode): string {
  const primitives = scales
    .filter((scale) => scale.mode === mode)
    .map((scale) => scale.steps.map((swatch) => customProperty(scale, swatch)).join('\n'))
    .join('\n\n')

  const categorical = buildCategorical(mode)
    .map((swatch) => `  --lat-chart-${swatch.slot}: ${formatOklch(swatch)};`)
    .join('\n')

  // The sequential ramp is identical in both modes — only the ordinal clamp
  // differs, and that is guidance about which steps to use rather than a
  // different colour. It is repeated per block so every token resolves from one
  // place regardless of which rule won.
  const sequential = buildSequential()
    .map((swatch) => `  --lat-chart-sequential-${swatch.step}: ${formatOklch(swatch)};`)
    .join('\n')

  const severity = buildSeverity(mode)
    .map((swatch) => `  --lat-severity-${swatch.level}: ${formatOklch(swatch)};`)
    .join('\n')

  // The semantic tier goes in every block rather than once on :root. An alias
  // holding a var() reference resolves on the element that declares it, so a
  // single root declaration would freeze to the root theme and keep that value
  // inside a nested scope that redefines the primitive underneath.
  return [
    primitives,
    categorical,
    sequential,
    severity,
    semanticBlock(scales, mode),
    elevationCss()
  ].join('\n\n')
}

/**
 * The stylesheet.
 *
 * Values ship as `oklch()` alone, with no hex companion. A second declaration
 * would not be a fallback: custom property values are parsed as a raw token
 * stream, so a browser that cannot resolve `oklch()` still accepts the
 * declaration and only fails later, at `var()` time. Whichever declaration comes
 * last simply wins. A genuine fallback would need an `@supports` block
 * duplicating every value, and the verified hex is carried in `tokens.json`
 * instead, where DTCG defines a field for exactly that.
 *
 * What `oklch()` actually buys in v1 is **bit depth, not gamut**. Every colour
 * here has already been fitted into sRGB, so nothing outside that gamut can be
 * expressed however it is written; wide-gamut output is a stated non-goal. What
 * it avoids is the 8-bit quantisation a hex value imposes, so a display with more
 * than 8 bits per channel renders the colour that was computed rather than the
 * nearest 1/255 step.
 *
 * One consequence to be aware of: contracts are verified against the quantised
 * hex, which is the conservative side of that difference — the ratio proven is
 * the one an 8-bit display produces, and the unquantised colour differs from it
 * by less than a single step.
 */
export function emitCss(scales: readonly Scale[]): string {
  const [light, dark] = MODES

  return `/* Lattice tokens — generated by generate/emit.ts. Do not edit by hand. */
/* Colour primitives: ${scales.length / MODES.length} scales x ${STEPS} steps, both modes. */
/* Typography: ${TYPOGRAPHY_PRIMITIVE_COUNT} primitives; ${TYPOGRAPHY_ROLE_COUNT} semantic roles x ${TYPOGRAPHY_ROLE_PROPERTY_COUNT} properties. */
/* Layout primitives: ${LAYOUT_PRIMITIVE_COUNTS.space} spacing; ${LAYOUT_PRIMITIVE_COUNTS.breakpoint} breakpoints; ${LAYOUT_PRIMITIVE_COUNTS.container} containers; ${LAYOUT_PRIMITIVE_COUNTS.radius} radii. */
/* Motion primitives: ${MOTION_PRIMITIVE_COUNTS.duration} durations; ${MOTION_PRIMITIVE_COUNTS.easing} easings. */
/* Elevation: ${SHADOW_PRIMITIVE_COUNT} shadows; ${ELEVATION_ROLE_COUNT} role tokens per theme. */

:root {
${typographyCss()}
${layoutCss()}
${motionCss()}
${shadowCss()}
${typographyRoleCss()}
}

:root,
[data-lat-theme='${light}'] {
${themedBlock(scales, light!)}
}

[data-lat-theme='${dark}'] {
${themedBlock(scales, dark!)}
}

/* The OS preference supplies the default and an explicit stamp overrides it in
   both directions, so this comes after the attribute rules and excludes an
   element that has asked for light. */
@media (prefers-color-scheme: dark) {
  :root:not([data-lat-theme='${light}']) {
${themedBlock(scales, dark!)
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n')}
  }
}

${typographyRoleResponsiveCss()}
`
}

/** A DTCG colour token. */
export interface ColorToken {
  readonly $type: 'color'
  readonly $description?: string
  readonly $value: {
    readonly colorSpace: 'oklch'
    /** `[lightness, chroma, hue]`. */
    readonly components: readonly [number, number, number]
    readonly alpha: number
    /** The sRGB fallback, which DTCG defines for this purpose. */
    readonly hex: string
  }
}

/**
 * A DTCG token whose value is a reference to another token.
 *
 * The format's own alias mechanism, `{group.token}`. The semantic tier is
 * expressed with it so `tokens.json` carries the same two tiers the stylesheet
 * does — a consumer reading only the JSON would otherwise see primitives and no
 * meaning.
 */
export interface AliasToken {
  readonly $type: 'color'
  readonly $description?: string
  readonly $value: string
}

export interface DesignTokens {
  readonly $schema: string
  readonly $description: string
  readonly [mode: string]: unknown
}

function colorValue(l: number, c: number, h: number, hex: string): ColorToken['$value'] {
  return {
    colorSpace: 'oklch',
    components: [
      Number(l.toFixed(PLACES)),
      Number(c.toFixed(PLACES)),
      Number(h.toFixed(PLACES))
    ],
    alpha: 1,
    hex
  }
}

function token(swatch: Swatch): ColorToken {
  return {
    $type: 'color',
    $description: STEP_JOBS[swatch.step - 1] ?? `step ${swatch.step}`,
    $value: colorValue(swatch.l, swatch.c, swatch.h, swatch.hex)
  }
}

/**
 * The machine-readable artefact.
 *
 * Modes are top-level groups because DTCG defines no mechanism for themes — that
 * gap is acknowledged in the format module itself, so any shape here is a local
 * convention. Groups keep the same names the CSS uses, so a token's path and its
 * custom property are mechanically related: `light.accent.9` is
 * `--lat-accent-9` under the light theme.
 */
export function emitTokens(scales: readonly Scale[]): DesignTokens {
  const modes: Record<string, unknown> = {}

  for (const mode of MODES) {
    const group: Record<string, unknown> = {
      $description: `Primitive colour scales, ${mode} mode. Generated — never hand-edited.`
    }

    for (const scale of scales.filter((entry) => entry.mode === mode)) {
      const steps: Record<string, ColorToken> = {}

      for (const swatch of scale.steps) {
        steps[String(swatch.step)] = token(swatch)
      }

      // Step aliases sit in the same group as the numbers they name, so
      // `light.gray.2` and `light.gray.bg-subtle` are neighbours and the second
      // explains the first.
      const named: Record<string, AliasToken> = {}
      for (const [index, slug] of STEP_SLUGS.entries()) {
        named[slug] = {
          $type: 'color',
          $description: `${STEP_JOBS[index] ?? `step ${index + 1}`} — step ${index + 1}.`,
          $value: `{${mode}.${scale.name}.${index + 1}}`
        }
      }

      // Each scale carries the text colour measured against its own fill. The
      // answers differ — white clears 4.5:1 on the accent and misses it on every
      // other scale — so a component offering a solid fill in any tone needs
      // that tone's answer rather than the accent's.
      const scaleOnSolid: ColorToken = {
        $type: 'color',
        $description:
          `Text on --lat-${scale.name}-solid. Computed rather than assumed: ` +
          `${scale.onSolid.text} wins at ${scale.onSolid.ratio.toFixed(2)}:1 against this fill.`,
        $value:
          scale.onSolid.text === 'white'
            ? { colorSpace: 'oklch', components: [1, 0, 0], alpha: 1, hex: '#ffffff' }
            : { colorSpace: 'oklch', components: [0, 0, 0], alpha: 1, hex: '#000000' }
      }

      group[scale.name] = {
        $description: SCALE_JOBS[scale.name] ?? scale.name,
        ...steps,
        ...named,
        'on-solid': scaleOnSolid
      }
    }

    // Roles: what a component reaches for first.
    const roles: Record<string, ColorToken | AliasToken> = {}
    for (const alias of ROLE_ALIASES) {
      roles[alias.role] = {
        $type: 'color',
        $value: `{${mode}.${alias.scale}.${alias.slug}}`
      }
    }
    // Read from the scales already built rather than rebuilding the accent, so
    // the JSON and the stylesheet cannot disagree about what sits on the fill.
    const onSolid = accentOnSolid(scales, mode)
    roles[ON_SOLID_ROLE] = {
      $type: 'color',
      $description:
        `Text on --lat-solid. Computed rather than assumed: ${onSolid.text} wins at ` +
        `${onSolid.ratio.toFixed(2)}:1 against the accent fill.`,
      $value:
        onSolid.text === 'white'
          ? { colorSpace: 'oklch', components: [1, 0, 0], alpha: 1, hex: '#ffffff' }
          : { colorSpace: 'oklch', components: [0, 0, 0], alpha: 1, hex: '#000000' }
    }

    group['role'] = {
      $description:
        'The semantic roles a component reaches for first. Step aliases inside each ' +
        'scale cover the cases these do not.',
      ...roles
    }

    const categorical: Record<string, ColorToken> = {}
    for (const swatch of buildCategorical(mode)) {
      categorical[String(swatch.slot)] = {
        $type: 'color',
        $description: `Categorical slot ${swatch.slot} — ${swatch.name}. Fixed order, never cycled.`,
        $value: colorValue(swatch.l, swatch.c, swatch.h, swatch.hex)
      }
    }

    const sequential: Record<string, ColorToken> = {}
    for (const swatch of buildSequential()) {
      const clamp = ORDINAL_CLAMP[mode]
      const usableForOrdinal = mode === 'light' ? swatch.step >= clamp : swatch.step <= clamp
      sequential[String(swatch.step)] = {
        $type: 'color',
        $description:
          `Sequential step ${swatch.step}.` +
          (usableForOrdinal ? '' : ` Sequential encoding only — outside the ordinal clamp at ${clamp}.`),
        $value: colorValue(swatch.l, swatch.c, swatch.h, swatch.hex)
      }
    }

    const severity: Record<string, ColorToken> = {}
    const ramp = buildSeverity(mode)
    for (const swatch of ramp) {
      severity[swatch.level] = {
        $type: 'color',
        // The total is read off the ramp rather than written in, so this cannot
        // outlive a change to the level list.
        $description:
          `Impact level ${swatch.rank} of ${ramp.length} — ${swatch.level}. ` +
          'Must ship with an icon and a text label: colour never carries severity alone.',
        $value: colorValue(swatch.l, swatch.c, swatch.h, swatch.hex)
      }
    }

    group['severity'] = {
      $description:
        'Ordered impact levels, least to most severe. Colour never carries severity ' +
        'alone — every mark needs an icon and a label. In dark mode adjacent levels ' +
        'are indistinguishable under deuteranopia, so this is a rule, not advice.',
      ...severity
    }

    group['chart'] = {
      $description:
        'Chart palettes. The categorical set distinguishes unordered series; the ' +
        'sequential ramp encodes magnitude along one hue. They are not interchangeable.',
      categorical: { $description: 'Eight slots, fixed order, never cycled.', ...categorical },
      sequential: {
        $description: `One hue, pale to deep. Ordinal encoding clamps at step ${ORDINAL_CLAMP[mode]} in ${mode} mode.`,
        ...sequential
      }
    }

    group['elevation'] = {
      $description:
        'Elevation levels. Every level above flat bundles a surface, a border and a ' +
        'shadow: the shadow reads on light, the surface step reads on dark, and the ' +
        'border is the only one that survives forced-colors.',
      ...elevationTokens(mode)
    }

    modes[mode] = group
  }

  return {
    $schema: DTCG_SCHEMA,
    $description:
      'Lattice design tokens. Generated from reviewed config and guarded by ' +
      'build-time contracts. Do not edit by hand.',
    global: {
      $description:
        'Theme-independent typography, layout, motion and shadow primitives, plus semantic typography. Emitted once.',
      ...typographyTokens(),
      ...layoutTokens(),
      ...motionTokens(),
      shadow: shadowTokens(),
      text: typographyRoleTokens()
    },
    ...modes
  }
}
