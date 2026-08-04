/**
 * Anchors to swatches.
 *
 * Conversion only. Nothing here chooses a colour; it turns declared hex into the
 * OKLCH the stylesheet emits, and records where each value came from.
 */
import {
  ACCENT_VIVID,
  CHROMATIC_SCALES,
  GRAY_ANCHORS,
  GRAY_ROLES,
  ON_SOLID_ANCHORS,
  SOLID_ANCHORS
} from '../config/anchors.js'
import type { Mode } from '../config/modes.js'
import { parseHex, srgbToOklch } from './oklch.js'
import {
  ALPHA_CHANNEL,
  FOCUS_RING_ALPHA,
  HAIRLINE,
  HAIRLINE_STRONG,
  TINT_FRACTIONS,
  WASH
} from '../config/alpha.js'

export interface Swatch {
  readonly scale: string
  readonly role: string
  readonly mode: Mode
  readonly hex: string
  readonly l: number
  readonly c: number
  readonly h: number
  /** `anchored` came from Meridian; `derived` was computed here. */
  readonly origin: 'anchored' | 'derived'
}

function swatch(
  scale: string,
  role: string,
  mode: Mode,
  hex: string,
  origin: 'anchored' | 'derived' = 'anchored'
): Swatch {
  const { l, c, h } = srgbToOklch(parseHex(hex))
  // Pure white and pure black have no meaningful hue; normalising to 0 keeps the
  // emitted value stable rather than carrying whatever the conversion happened
  // to produce for an achromatic colour.
  return { scale, role, mode, hex, l, c, h: c === 0 ? 0 : h, origin }
}

export function resolveGray(mode: Mode): Swatch[] {
  return GRAY_ROLES.map((role) => swatch('gray', role, mode, GRAY_ANCHORS[mode][role]))
}

export function resolveSolids(mode: Mode): Swatch[] {
  return CHROMATIC_SCALES.map((scale) => swatch(scale, 'solid', mode, SOLID_ANCHORS[scale][mode]))
}

export function resolveOnSolids(mode: Mode): Swatch[] {
  return CHROMATIC_SCALES.filter((scale) => ON_SOLID_ANCHORS[scale] !== undefined).map((scale) =>
    swatch(scale, 'on-solid', mode, ON_SOLID_ANCHORS[scale]![mode])
  )
}

export function resolveAll(mode: Mode): Swatch[] {
  return [
    ...resolveGray(mode),
    ...resolveSolids(mode),
    ...resolveOnSolids(mode),
    swatch('accent', 'vivid', mode, ACCENT_VIVID)
  ]
}

export interface AlphaToken {
  readonly role: string
  readonly value: string
}

const rgbChannels = (hex: string): string => {
  const { r, g, b } = parseHex(hex)
  return `${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}`
}

const alpha = (channels: string, fraction: number): string =>
  `rgb(${channels} / ${String(fraction)})`

export function resolveAlpha(mode: Mode): AlphaToken[] {
  const channels = ALPHA_CHANNEL[mode]
  return [
    { role: 'border', value: alpha(channels, HAIRLINE[mode]) },
    { role: 'border-strong', value: alpha(channels, HAIRLINE_STRONG) },
    { role: 'wash', value: alpha(channels, WASH) },
    {
      role: 'focus-ring',
      value: alpha(rgbChannels(SOLID_ANCHORS.accent[mode]), FOCUS_RING_ALPHA)
    }
  ]
}

export function resolveTints(mode: Mode): AlphaToken[] {
  return CHROMATIC_SCALES.flatMap((scale) => {
    const channels = rgbChannels(SOLID_ANCHORS[scale][mode])
    const { fill, border } =
      scale === 'accent' ? TINT_FRACTIONS.accent : TINT_FRACTIONS.default
    return [
      { role: `${scale}-tint`, value: alpha(channels, fill) },
      { role: `${scale}-tint-border`, value: alpha(channels, border) }
    ]
  })
}
