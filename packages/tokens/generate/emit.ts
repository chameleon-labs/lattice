/**
 * Turning anchors and derived values into the two shippable artefacts.
 *
 * `lattice.css` is what a consumer imports; `tokens.json` is the machine-readable
 * form, in the Design Tokens Community Group format.
 *
 * Emits the **primitive tier** (the Figma bundle's anchored roles), the **chart
 * palettes**, the **severity ramp** and the **semantic tier** — alpha and role
 * aliases — in both artefacts. The stylesheet expresses aliases as `var()`
 * references and the JSON as DTCG `{group.token}` references, so a consumer
 * reading only the JSON sees the same tiers rather than primitives with no
 * meaning attached.
 */

import { CHROMATIC_SCALES, GRAY_ROLES } from '../config/anchors.js'
import { MODES, type Mode } from '../config/modes.js'
import { ROLE_ALIASES } from '../config/semantic.js'
import { buildCategorical, buildSequential } from './charts.js'
import { CHECKS, ORDINAL_CLAMP } from '../config/charts.js'
import { deltaE } from './cvd.js'
import { parseHex, srgbToOklch } from './oklch.js'
import {
  ELEVATION_ROLE_COUNT,
  SHADOW_PRIMITIVE_COUNT,
  elevationCss,
  elevationTokens
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
import { resolveAlpha, resolveAll, resolveTints } from './anchors.js'
import type { AlphaToken, Swatch } from './anchors.js'
import { formatOklch } from './format.js'
import { fontFaceCss } from './fonts.js'
import { semanticBlock } from './semantic.js'
import { buildSeverity, resolveSeverityTints } from './severity.js'
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

export { formatOklch }

/**
 * The semantic block for one theme, plus the chart palettes and severity ramp
 * that are also theme-dependent. `semanticBlock` itself already covers
 * primitives, the alpha tier and the role aliases.
 */
function themedBlock(mode: Mode): string {
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

  const severity = [
    ...buildSeverity(mode).map((swatch) => `  --lat-severity-${swatch.role}: ${formatOklch(swatch)};`),
    // `minor` has no colour of its own — it borrows the subdued text role.
    '  --lat-severity-minor: var(--lat-text-subtle);',
    ...resolveSeverityTints(mode).map((t) => `  --lat-${t.role}: ${t.value};`),
    // `minor`'s tint pair borrows the neutral pair rather than computing one,
    // the same way its solid borrows --lat-text-subtle above.
    '  --lat-severity-minor-tint: var(--lat-wash);',
    '  --lat-severity-minor-tint-border: var(--lat-border);'
  ].join('\n')

  // The semantic tier goes in every block rather than once on :root. An alias
  // holding a var() reference resolves on the element that declares it, so a
  // single root declaration would freeze to the root theme and keep that value
  // inside a nested scope that redefines the primitive underneath.
  return [categorical, sequential, severity, semanticBlock(mode)].join('\n\n')
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
export function emitCss(): string {
  const [light, dark] = MODES

  return `/* Lattice tokens — generated by generate/emit.ts. Do not edit by hand. */
/* Colour: ${GRAY_ROLES.length} grey roles + ${CHROMATIC_SCALES.length} chromatic solids, both modes. */
/* Typography: ${TYPOGRAPHY_PRIMITIVE_COUNT} primitives; ${TYPOGRAPHY_ROLE_COUNT} semantic roles x ${TYPOGRAPHY_ROLE_PROPERTY_COUNT} properties. */
/* Layout primitives: ${LAYOUT_PRIMITIVE_COUNTS.space} spacing; ${LAYOUT_PRIMITIVE_COUNTS.breakpoint} breakpoints; ${LAYOUT_PRIMITIVE_COUNTS.container} containers; ${LAYOUT_PRIMITIVE_COUNTS.radius} radii. */
/* Motion primitives: ${MOTION_PRIMITIVE_COUNTS.duration} durations; ${MOTION_PRIMITIVE_COUNTS.easing} easings. */
/* Elevation: ${SHADOW_PRIMITIVE_COUNT} shadows; ${ELEVATION_ROLE_COUNT} role tokens, emitted once for both modes. */

${fontFaceCss()}

:root {
${typographyCss()}
${layoutCss()}
${motionCss()}
${typographyRoleCss()}
${elevationCss()}
}

:root,
[data-lat-theme='${light}'] {
${themedBlock(light!)}
}

[data-lat-theme='${dark}'] {
${themedBlock(dark!)}
}

/* The OS preference supplies the default and an explicit stamp overrides it in
   both directions, so this comes after the attribute rules and excludes an
   element that has asked for light. */
@media (prefers-color-scheme: dark) {
  :root:not([data-lat-theme='${light}']) {
${themedBlock(dark!)
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n')}
  }
}

${typographyRoleResponsiveCss()}
`
}

/**
 * How an emitted colour token knows whether it came from the Figma bundle directly or
 * was computed here. Namespaced under the org so a reader parsing `tokens.json`
 * with a generic DTCG tool does not mistake it for a spec-defined field.
 */
export interface OriginExtension {
  readonly 'com.chameleon-labs.lattice': {
    readonly origin: Swatch['origin']
  }
}

/** A DTCG colour token. */
export interface ColorToken {
  readonly $type: 'color'
  readonly $description?: string
  readonly $extensions?: OriginExtension
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
 * expressed with it so `tokens.json` carries the same reference structure the
 * stylesheet does — a consumer reading only the JSON would otherwise see
 * primitives and no meaning.
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

/**
 * Decimal places kept in an emitted colour. Six round-trips every anchor
 * exactly, so the colour a browser computes is the colour whose contrast was
 * measured. Mirrors the private constant in `./format.ts`.
 */
const PLACES = 6

function colorValue(
  l: number,
  c: number,
  h: number,
  hex: string,
  alpha: number = 1
): ColorToken['$value'] {
  return {
    colorSpace: 'oklch',
    components: [
      Number(l.toFixed(PLACES)),
      Number(c.toFixed(PLACES)),
      Number(h.toFixed(PLACES))
    ],
    alpha,
    hex
  }
}

function extensionsFor(origin: Swatch['origin']): OriginExtension {
  return { 'com.chameleon-labs.lattice': { origin } }
}

function token(swatch: Swatch): ColorToken {
  return {
    $type: 'color',
    $value: colorValue(swatch.l, swatch.c, swatch.h, swatch.hex),
    $extensions: extensionsFor(swatch.origin)
  }
}

/**
 * Human-readable text for one alpha-tier token, by role name.
 *
 * `resolveAlpha`/`resolveTints` name a token by its full CSS suffix
 * (`border`, `accent-tint`, `danger-tint-border`, …), so the scale — if any —
 * is recovered from the name rather than passed separately.
 */
function alphaDescription(role: string): string {
  switch (role) {
    case 'border':
      return 'Resting hairline edge. Decorative — composites over whatever surface it sits on.'
    case 'border-strong':
      return 'Hover hairline edge.'
    case 'wash':
      return 'Hover fill wash.'
    case 'focus-ring':
      return 'The focus ring, composited from the accent solid at its declared alpha.'
    default: {
      const scale = role.replace(/-tint(-border)?$/, '')
      return role.endsWith('-border')
        ? `Tint border for the ${scale} scale — the wider fraction of the tinted triple.`
        : `Tint fill for the ${scale} scale — the first layer of the tinted triple.`
    }
  }
}

/**
 * A DTCG colour token for one alpha-tier primitive: a hairline, wash, the
 * focus ring, or a scale's tinted-triple fill/border.
 *
 * These are not opaque swatches — the alpha channel carries the fraction, and
 * `hex` is the *base* colour (white, black, or a scale's solid) before it is
 * applied. The CSS pairs with these one-to-one: `--lat-${role}` is
 * `rgb(<channels of hex> / <alpha>)`, exactly what {@link resolveAlpha} and
 * {@link resolveTints} already compute for the stylesheet.
 */
function alphaColorToken(t: AlphaToken): ColorToken {
  const { l, c, h } = srgbToOklch(parseHex(t.hex))
  return {
    $type: 'color',
    $description: alphaDescription(t.role),
    // The fraction is copied verbatim from the Figma bundle, same as every
    // other alpha value in config/alpha.ts — see its module comment.
    $extensions: extensionsFor('anchored'),
    $value: colorValue(l, c, c === 0 ? 0 : h, t.hex, t.alpha)
  }
}

/**
 * Human-readable group labels. Purely descriptive — nothing downstream parses
 * these — so a scale with no entry here just falls back to its own name.
 */
const SCALE_DESCRIPTIONS: Partial<Record<string, string>> = {
  gray: 'Grey. Background, surface and text roles.',
  accent: 'The accent scale: solid fill, the text that sits on it, and the brand vivid.',
  danger: 'The danger scale: solid fill, plus the tinted triple built from it — the destructive button and error states.',
  warning: 'The warning scale: solid fill, plus the tinted triple built from it — caution states.',
  success: 'The success scale: solid fill, plus the tinted triple built from it — confirmation states.',
  info: 'The info scale: solid fill, plus the tinted triple built from it — informational states.',
  decorative: 'The decorative scale: solid fill, plus the tinted triple built from it — colour with no semantic meaning.'
}

/**
 * Splits a `RoleAlias.source` such as `gray-bg-raised` into the scale it names
 * (`gray`) and the role within that scale (`bg-raised`). Scale names never
 * contain a hyphen, so the first segment is always the scale.
 */
function splitSource(source: string): { readonly scale: string; readonly role: string } {
  const [scale, ...rest] = source.split('-')
  return { scale: scale!, role: rest.join('-') }
}

/**
 * Worst adjacent deuteranopia separation in a severity ramp, so the emitted
 * description states a measured number rather than an assertion. `minor`
 * carries no colour of its own and is excluded by {@link buildSeverity}
 * already returning only the coloured levels.
 */
function worstAdjacentDeutan(ramp: readonly Swatch[]): number {
  let worst = Number.POSITIVE_INFINITY
  for (let i = 1; i < ramp.length; i++) {
    worst = Math.min(worst, deltaE(parseHex(ramp[i - 1]!.hex), parseHex(ramp[i]!.hex), 'deutan'))
  }
  return worst
}

/**
 * The machine-readable artefact.
 *
 * Modes are top-level groups because DTCG defines no mechanism for themes — that
 * gap is acknowledged in the format module itself, so any shape here is a local
 * convention. Groups keep the same names the CSS uses, so a token's path and its
 * custom property are mechanically related: `light.accent.solid` is
 * `--lat-accent-solid` under the light theme.
 */
export function emitTokens(): DesignTokens {
  const modes: Record<string, unknown> = {}

  for (const mode of MODES) {
    const group: Record<string, unknown> = {
      $description: `Primitive colours and semantic roles, ${mode} mode. Generated — never hand-edited.`
    }

    // Primitives: the Figma bundle's anchored roles, grouped by scale. Each carries
    // whether it was anchored directly or derived here.
    const byScale = new Map<string, Record<string, ColorToken>>()
    for (const swatch of resolveAll(mode)) {
      const roles = byScale.get(swatch.scale) ?? {}
      roles[swatch.role] = token(swatch)
      byScale.set(swatch.scale, roles)
    }
    for (const [scaleName, roles] of byScale) {
      group[scaleName] = {
        $description: SCALE_DESCRIPTIONS[scaleName] ?? scaleName,
        ...roles
      }
    }

    // Roles: what a component reaches for first.
    const roles: Record<string, AliasToken> = {}
    for (const alias of ROLE_ALIASES) {
      const { scale, role } = splitSource(alias.source)
      roles[alias.role] = {
        $type: 'color',
        $value: `{${mode}.${scale}.${role}}`
      }
    }

    group['role'] = {
      $description: 'The semantic roles a component reaches for first.',
      ...roles
    }

    // The alpha tier: hairlines, wash, the focus ring, the tinted triple per
    // chromatic scale, and the severity ramp's own tint/tint-border pair.
    // Emitted here so it reaches tokens.json as well as the stylesheet —
    // previously it only reached the CSS, which the module docstring claimed
    // was not the case.
    const alphaGroup: Record<string, ColorToken> = {}
    for (const t of [...resolveAlpha(mode), ...resolveTints(mode), ...resolveSeverityTints(mode)]) {
      alphaGroup[t.role] = alphaColorToken(t)
    }

    group['alpha'] = {
      $description:
        "Alpha-tier primitives. `hex` is the base colour before its alpha is applied; " +
        'the composited result is what a viewer sees, and is what generate/report.ts measures.',
      ...alphaGroup
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
    ramp.forEach((swatch, index) => {
      severity[swatch.role] = {
        $type: 'color',
        $description:
          `Impact level ${index + 1} of ${ramp.length} — ${swatch.role}. ` +
          'Must ship with an icon and a text label: colour never carries severity alone.',
        $value: colorValue(swatch.l, swatch.c, swatch.h, swatch.hex),
        $extensions: extensionsFor(swatch.origin)
      }
    })

    const worstDeutan = worstAdjacentDeutan(ramp)
    group['severity'] = {
      $description:
        'Ordered impact levels, least to most severe. Colour never carries severity ' +
        'alone — every mark needs an icon and a label. Worst adjacent ' +
        `${mode}-mode deuteranopia separation is ${worstDeutan.toFixed(1)}, ` +
        `${worstDeutan >= CHECKS.cvdFloor ? 'above' : 'below'} the package's floor of ` +
        `${CHECKS.cvdFloor} — the icon-and-label rule is mandatory regardless.`,
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

    modes[mode] = group
  }

  const elevation = elevationTokens()

  return {
    $schema: DTCG_SCHEMA,
    $description:
      'Lattice design tokens. Generated from reviewed config. Colour contrast is ' +
      'measured and reported at build time, not gated — see the contrast ledger ' +
      'in generate/report.ts and the design spec, section 9. Do not edit by hand.',
    global: {
      $description:
        'Theme-independent typography, layout, motion and shadow primitives, plus ' +
        'semantic typography and elevation roles. Emitted once.',
      ...typographyTokens(),
      ...layoutTokens(),
      ...motionTokens(),
      text: typographyRoleTokens(),
      shadow: elevation.shadow,
      elevation: {
        $description:
          'Elevation roles. `flat` has no shadow — see generate/elevation.ts for why ' +
          "it isn't a token here — and is the CSS-only `--lat-elevation-flat: none;`.",
        ...elevation.elevation
      }
    },
    ...modes
  }
}
