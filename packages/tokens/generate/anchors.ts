/**
 * Anchors to swatches.
 *
 * Conversion only. Nothing here chooses a colour; it turns declared hex into the
 * OKLCH the stylesheet emits, and records where each value came from.
 */
import {
  ACCENT_TEXT_ANCHORS,
  ACCENT_VIVID,
  CHROMATIC_SCALES,
  GRAY_ANCHORS,
  GRAY_ROLES,
  ON_SOLID_ANCHORS,
  SOLID_ANCHORS,
} from '../config/anchors.js';
import type {Mode} from '../config/modes.js';
import {parseHex, srgbToOklch} from './oklch.js';
import {ALPHA_CHANNEL, FOCUS_RING, HAIRLINE, HAIRLINE_STRONG, TINT_FRACTIONS, WASH} from '../config/alpha.js';

export interface Swatch {
  readonly scale: string;
  readonly role: string;
  readonly mode: Mode;
  readonly hex: string;
  readonly l: number;
  readonly c: number;
  readonly h: number;
  /** `anchored` came from the Figma bundle; `derived` was computed here. */
  readonly origin: 'anchored' | 'derived';
}

function swatch(
  scale: string,
  role: string,
  mode: Mode,
  hex: string,
  origin: 'anchored' | 'derived' = 'anchored',
): Swatch {
  const {l, c, h} = srgbToOklch(parseHex(hex));
  // Pure white and pure black have no meaningful hue; normalising to 0 keeps the
  // emitted value stable rather than carrying whatever the conversion happened
  // to produce for an achromatic colour.
  return {scale, role, mode, hex, l, c, h: c === 0 ? 0 : h, origin};
}

export function resolveGray(mode: Mode): Swatch[] {
  return GRAY_ROLES.map((role) => swatch('gray', role, mode, GRAY_ANCHORS[mode][role]));
}

export function resolveSolids(mode: Mode): Swatch[] {
  return CHROMATIC_SCALES.map((scale) => swatch(scale, 'solid', mode, SOLID_ANCHORS[scale][mode]));
}

export function resolveOnSolids(mode: Mode): Swatch[] {
  return CHROMATIC_SCALES.filter((scale) => ON_SOLID_ANCHORS[scale] !== undefined).map((scale) =>
    swatch(scale, 'on-solid', mode, ON_SOLID_ANCHORS[scale]![mode]),
  );
}

export function resolveAll(mode: Mode): Swatch[] {
  return [
    ...resolveGray(mode),
    ...resolveSolids(mode),
    ...resolveOnSolids(mode),
    swatch('accent', 'text', mode, ACCENT_TEXT_ANCHORS[mode]),
    swatch('accent', 'vivid', mode, ACCENT_VIVID),
  ];
}

export interface AlphaToken {
  readonly role: string;
  readonly value: string;
  /** The base colour before its alpha is applied — white, black, or a scale's solid. */
  readonly hex: string;
  /** The fraction composited over `hex`, 0..1. */
  readonly alpha: number;
}

// Exported so generate/severity.ts can build the severity ramp's tint pair
// with the exact same rgb(R G B / A) mechanics, rather than a second
// implementation of the same formatting.
export const rgbChannels = (hex: string): string => {
  const {r, g, b} = parseHex(hex);
  return `${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}`;
};

export const alpha = (channels: string, fraction: number): string => `rgb(${channels} / ${String(fraction)})`;

/** `ALPHA_CHANNEL` holds "255 255 255" / "0 0 0" — the only two values it ever takes. */
const hexFromChannels = (channels: string): string => (channels === ALPHA_CHANNEL.dark ? '#ffffff' : '#000000');

export function resolveAlpha(mode: Mode): AlphaToken[] {
  const channels = ALPHA_CHANNEL[mode];
  const base = hexFromChannels(channels);
  return [
    {role: 'border', value: alpha(channels, HAIRLINE[mode]), hex: base, alpha: HAIRLINE[mode]},
    {
      role: 'border-strong',
      value: alpha(channels, HAIRLINE_STRONG),
      hex: base,
      alpha: HAIRLINE_STRONG,
    },
    {role: 'wash', value: alpha(channels, WASH), hex: base, alpha: WASH},
    {
      // Anchored per mode, not derived from the accent solid — see
      // config/alpha.ts for why light is opaque and dark is not.
      role: 'focus-ring',
      value: alpha(rgbChannels(FOCUS_RING[mode].hex), FOCUS_RING[mode].alpha),
      hex: FOCUS_RING[mode].hex,
      alpha: FOCUS_RING[mode].alpha,
    },
  ];
}

export function resolveTints(mode: Mode): AlphaToken[] {
  return CHROMATIC_SCALES.flatMap((scale) => {
    const hex = SOLID_ANCHORS[scale][mode];
    const channels = rgbChannels(hex);
    const {fill, border} = scale === 'accent' ? TINT_FRACTIONS.accent : TINT_FRACTIONS.default;
    return [
      {role: `${scale}-tint`, value: alpha(channels, fill), hex, alpha: fill},
      {role: `${scale}-tint-border`, value: alpha(channels, border), hex, alpha: border},
    ];
  });
}
