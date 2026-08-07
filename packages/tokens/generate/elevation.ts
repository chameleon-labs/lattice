import {ELEVATION_ROLES, SHADOWS, type ShadowLayer, type ShadowName} from '../config/elevation.js';

export const SHADOW_PRIMITIVE_COUNT = Object.keys(SHADOWS).length;
export const ELEVATION_ROLE_COUNT = Object.keys(ELEVATION_ROLES).length;

/**
 * Formats one shadow length for the `box-shadow` shorthand: a literal zero
 * carries no unit, matching how a browser round-trips the value, and every
 * non-zero length is `px` — Lattice's shadows are unitless design values,
 * not rem-relative ones.
 */
function px(value: number): string {
  return value === 0 ? '0' : `${value}px`;
}

/** One shadow layer as a `box-shadow` value fragment. */
function layerCss(layer: ShadowLayer): string {
  return `${px(layer.offsetX)} ${px(layer.offsetY)} ${px(layer.blur)} ${px(layer.spread)} rgb(0 0 0 / ${layer.alpha})`;
}

/** A full, possibly multi-layer, shadow as CSS — layers joined by `, `. */
function shadowToCss(layers: readonly ShadowLayer[]): string {
  return layers.map(layerCss).join(', ');
}

const SHADOW_CSS = Object.fromEntries(
  Object.entries(SHADOWS).map(([name, layers]) => [name, shadowToCss(layers)]),
) as Record<ShadowName, string>;

/**
 * Elevation tokens.
 *
 * Emitted once on `:root` rather than per theme. The prior system varied shadow
 * by mode; Lattice declares one set and uses it in both.
 */
export function elevationCss(): string {
  return [
    ...Object.entries(SHADOW_CSS).map(([name, css]) => `  --lat-shadow-${name}: ${css};`),
    ...Object.entries(ELEVATION_ROLES).map(
      ([role, key]) => `  --lat-elevation-${role}: ${key === 'none' ? 'none' : SHADOW_CSS[key]};`,
    ),
  ].join('\n');
}

/** A DTCG dimension value in pixels — every shadow measurement here is one. */
const pxValue = (value: number): {readonly value: number; readonly unit: 'px'} => ({
  value,
  unit: 'px',
});

/**
 * A DTCG colour value for a shadow layer. Every shadow in this package is
 * black at some alpha, so this stays a one-argument helper rather than a
 * general colour builder.
 */
function blackAt(alpha: number): {
  readonly colorSpace: 'srgb';
  readonly components: readonly [number, number, number];
  readonly alpha: number;
  readonly hex: string;
} {
  return {colorSpace: 'srgb', components: [0, 0, 0], alpha, hex: '#000000'};
}

/** One layer of a DTCG `shadow` token's `$value` array. */
export interface ShadowLayerValue {
  readonly color: ReturnType<typeof blackAt>;
  readonly offsetX: ReturnType<typeof pxValue>;
  readonly offsetY: ReturnType<typeof pxValue>;
  readonly blur: ReturnType<typeof pxValue>;
  readonly spread: ReturnType<typeof pxValue>;
}

/** A DTCG shadow token: always an array, even for `2xl`'s single layer — the
 * format accepts a bare object or an array, and using the array form
 * uniformly means a consumer never has to branch on which one it got. */
export interface ShadowToken {
  readonly $type: 'shadow';
  readonly $description?: string;
  readonly $value: readonly ShadowLayerValue[];
}

/** A DTCG token whose `$value` is a reference to a shadow token. */
export interface ShadowAliasToken {
  readonly $type: 'shadow';
  readonly $description?: string;
  readonly $value: string;
}

function shadowToken(layers: readonly ShadowLayer[]): ShadowToken {
  return {
    $type: 'shadow',
    $value: layers.map((layer) => ({
      color: blackAt(layer.alpha),
      offsetX: pxValue(layer.offsetX),
      offsetY: pxValue(layer.offsetY),
      blur: pxValue(layer.blur),
      spread: pxValue(layer.spread),
    })),
  };
}

/**
 * The DTCG shape: raw shadows keyed by name, and elevation roles that alias
 * one of them.
 *
 * `flat` is omitted from `elevation` — DTCG's shadow value schema requires at
 * least one layer (`oneOf` a single shadow object or a non-empty array), so
 * there is no legal value for "no shadow" to alias. The CSS
 * `--lat-elevation-flat: none;` is the artefact of record for that role;
 * `ELEVATION_ROLES.flat` in config is the source of truth that it has none.
 */
export function elevationTokens(): {
  readonly shadow: Readonly<Record<ShadowName, ShadowToken>>;
  readonly elevation: Readonly<Record<string, ShadowAliasToken>>;
} {
  const shadow = Object.fromEntries(
    Object.entries(SHADOWS).map(([name, layers]) => [name, shadowToken(layers)]),
  ) as Record<ShadowName, ShadowToken>;

  const elevation: Record<string, ShadowAliasToken> = {};
  for (const [role, key] of Object.entries(ELEVATION_ROLES)) {
    if (key === 'none') {
      continue;
    }
    elevation[role] = {$type: 'shadow', $value: `{global.shadow.${key}}`};
  }

  return {shadow, elevation};
}
