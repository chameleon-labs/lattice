/**
 * Taken from the impact badges on the Figma bundle's tabstop landing page.
 * `minor` carries no colour of its own — it uses `--lat-text-subtle`, as the
 * bundle does — so it is not anchored here.
 *
 * Colour never carries severity alone: every severity indicator ships an icon
 * **and** a text label, as a hard rule. The lightness ordering is only the
 * safety net for when hue fails — `serious` at hue 56 and `moderate` at 84 are
 * 28 degrees apart, which protanopia and deuteranopia do not preserve.
 */
import type {Mode} from './modes.js';

export const SEVERITY_LEVELS = ['critical', 'serious', 'moderate', 'minor'] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

/**
 * `undefined` means the Figma bundle did not declare it and the generator must derive
 * it. Only light `moderate` is in that position.
 */
export const SEVERITY_ANCHORS: Record<Mode, Record<SeverityLevel, string | undefined>> = {
  dark: {
    critical: '#ff4d6a',
    serious: '#fb923c',
    moderate: '#fbbf24',
    minor: undefined,
  },
  light: {
    critical: '#d41240',
    serious: '#ea580c',
    moderate: undefined,
    minor: undefined,
  },
};

/**
 * How far light sits below dark for the same level.
 *
 * The Figma bundle declares two levels in both modes, so this is a choice rather than
 * the only available measurement:
 *
 * | level | dark L | light L | delta |
 * | --- | --- | --- | --- |
 * | critical | 0.678 | 0.556 | −0.122 |
 * | serious | 0.758 | 0.646 | **−0.112** |
 *
 * `serious` is the basis because it neighbours `moderate` in both the ramp and
 * the colour wheel — 56 and 84, both warm, where critical is red at 16 — and how
 * far a hue can drop between modes depends on its gamut headroom, so the nearest
 * hue is the smaller leap. Critical's −0.122 would put the derived value at
 * L ≈ 0.715 instead.
 */
export const LIGHT_LIGHTNESS_DELTA = -0.112;
