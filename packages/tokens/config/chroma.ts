/**
 * The chroma envelope, as a fraction of each scale's peak chroma.
 *
 * Low at both ends and peaking at step 9, the solid fill. Expressed as a
 * fraction rather than an absolute so one envelope shapes every scale: sRGB
 * simply holds less saturated teal than violet at the same lightness, and a
 * scale's `peak` in {@link ../config/scales.ts} carries that difference.
 *
 * Dark runs richer than light at the same step because a saturated colour on a
 * dark surface reads as less intense than the same colour on a light one.
 *
 * These are *requested* values. Anything sRGB cannot hold is fitted down by
 * {@link ../generate/oklch.ts}'s gamut search, and the fitted value is what gets
 * recorded — the config never claims a chroma that did not ship.
 */
export const CHROMA_FRACTION = {
  light: [0.03, 0.07, 0.15, 0.24, 0.32, 0.42, 0.52, 0.68, 1.0, 0.97, 0.82, 0.42],
  dark: [0.1, 0.18, 0.32, 0.44, 0.53, 0.62, 0.72, 0.85, 1.0, 1.0, 0.62, 0.3]
} as const
