/**
 * Colour-vision-deficiency simulation and perceptual distance.
 *
 * Used to check that a categorical palette stays separable for readers with
 * protanopia or deuteranopia, which is the constraint that forces separation
 * onto lightness rather than hue.
 */

import { srgbToLinear, type Rgb } from './oklch.js'

export type Deficiency = 'protan' | 'deutan' | 'tritan'

/**
 * Machado, Oliveira & Fernandes (2009) transforms at severity 1.0, in linear RGB.
 *
 * The model is part of the thresholds rather than an implementation detail: the
 * ΔE floors in {@link ../config/charts.ts} are calibrated against these matrices,
 * and swapping in another simulation (Viénot 1999, say) moves borderline pairs
 * and would require recalibrating them.
 */
const MACHADO: Record<Deficiency, readonly (readonly number[])[]> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998]
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881]
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039]
  ]
}

interface LinearRgb {
  readonly r: number
  readonly g: number
  readonly b: number
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value))

function toLinear({ r, g, b }: Rgb): LinearRgb {
  return { r: srgbToLinear(r), g: srgbToLinear(g), b: srgbToLinear(b) }
}

/** Applies a deficiency transform in linear RGB. */
function simulate(linear: LinearRgb, kind: Deficiency): LinearRgb {
  const [row0, row1, row2] = MACHADO[kind] as [readonly number[], readonly number[], readonly number[]]
  const apply = (row: readonly number[]): number =>
    clamp(row[0]! * linear.r + row[1]! * linear.g + row[2]! * linear.b)

  return { r: apply(row0), g: apply(row1), b: apply(row2) }
}

// Ottosson's matrices again, but entered from linear RGB rather than from
// gamma-encoded sRGB, because a simulated colour is produced in linear light.
function oklabFromLinear({ r, g, b }: LinearRgb): readonly [number, number, number] {
  const long = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const medium = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const short = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  return [
    0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short
  ]
}

/**
 * Perceptual distance between two colours, as Euclidean distance in OKLab times
 * 100. Pass a deficiency to measure it as that reader would see it; omit it for
 * unsimulated vision.
 */
export function deltaE(first: Rgb, second: Rgb, kind?: Deficiency): number {
  const one = kind ? simulate(toLinear(first), kind) : toLinear(first)
  const two = kind ? simulate(toLinear(second), kind) : toLinear(second)
  const [l1, a1, b1] = oklabFromLinear(one)
  const [l2, a2, b2] = oklabFromLinear(two)

  return 100 * Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}
