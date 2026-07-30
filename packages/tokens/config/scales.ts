/**
 * Hue and peak chroma per scale.
 *
 * Five UI scales. `gray` shares the accent's hue at a peak low enough to read as
 * neutral — a faintly accent-tinted grey rather than a dead one, which is what
 * keeps a page feeling like one system.
 *
 * The status hues sit far enough from the accent's 305 that a solid fill never
 * reads as a status by accident: danger 27, warning 75, success 145.
 */
export interface ScaleConfig {
  /** OKLCH hue in degrees. */
  readonly hue: number
  /** Chroma at step 9, the peak the envelope is a fraction of. */
  readonly peak: number
  /**
   * An override for step 9's lightness, with the text colour it exists to serve.
   *
   * Only the accent has one. At the curve's L 0.660 every scale's solid fill
   * picks black text, which for a brand's primary button is wrong however
   * correct the arithmetic — so the accent's solid is pinned to the exact
   * lightness where white reaches its minimum. Non-accent scales keep the
   * computed answer.
   */
  readonly solid?: {
    readonly lightness: number
    readonly text: 'white' | 'black'
    readonly minimum: number
  }
}

export const SCALES = {
  accent: {
    hue: 305,
    peak: 0.2,
    // L 0.591 is where white text reaches 4.50:1 against the fill. Applies in
    // both modes, because step 9's lightness is mode-invariant in the curve.
    solid: { lightness: 0.591, text: 'white', minimum: 4.5 }
  },
  gray: { hue: 305, peak: 0.012 },
  danger: { hue: 27, peak: 0.19 },
  warning: { hue: 75, peak: 0.17 },
  success: { hue: 145, peak: 0.16 }
} as const satisfies Record<string, ScaleConfig>

export type ScaleName = keyof typeof SCALES

export const SCALE_NAMES = Object.keys(SCALES) as readonly ScaleName[]
