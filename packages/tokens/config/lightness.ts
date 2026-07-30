/**
 * The shared lightness curve, one per mode.
 *
 * This is the premise of the whole system: step N carries the same perceived
 * weight in every scale, because every scale reads its lightness from here. Hue
 * and chroma differ; lightness does not.
 *
 * Light descends from near-white to near-black; dark ascends. Step 9 is L 0.660
 * in **both**, which is deliberate — the solid fill is the brand's most
 * recognisable colour and holding it steady across modes keeps a primary button
 * the same colour in both. A consequence worth knowing: constraining step 9
 * constrains it in both modes at once.
 */
export const LIGHTNESS = {
  light: [0.993, 0.981, 0.958, 0.936, 0.913, 0.885, 0.848, 0.795, 0.66, 0.615, 0.545, 0.32],
  dark: [0.178, 0.205, 0.252, 0.288, 0.325, 0.372, 0.435, 0.53, 0.66, 0.71, 0.8, 0.925]
} as const

/** Which direction lightness travels as the step number rises. */
export const DIRECTION = { light: -1, dark: 1 } as const

export type Mode = keyof typeof LIGHTNESS

export const MODES: readonly Mode[] = ['light', 'dark']

export const STEPS = 12
