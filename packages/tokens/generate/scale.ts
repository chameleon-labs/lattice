/**
 * The scale generator.
 *
 * > The shared lightness curve is the default. Per-hue solving is a correction,
 * > applied only where a contract would otherwise fail.
 *
 * That rule exists because the two foundations of this system are in tension.
 * OKLCH lightness is perceptually uniform; WCAG 2's luminance is not — it weights
 * green at 0.7152 against blue at 0.0722. At identical OKLCH lightness a teal is
 * far brighter by WCAG's maths than a violet, so one shared curve *cannot*
 * satisfy AA across every hue. Solving every step per hue would fix that and
 * destroy the family resemblance; solving only on failure keeps both.
 *
 * The order of operations matters and is deliberate:
 *
 * 1. read lightness and chroma off the curve
 * 2. apply an explicit solid constraint, if the scale has one
 * 3. re-seat the steps beneath anything that moved, preserving separation
 * 4. solve any contract that still fails, re-seating beneath each solve
 *
 * Separation never wins over contrast: step 4 runs after step 3 and may move a
 * step the cascade had just placed.
 */

import { CHROMA_FRACTION } from '../config/chroma.js'
import { CONTRACTS, SEPARATION } from '../config/contracts.js'
import { DIRECTION, LIGHTNESS, MODES, STEPS, type Mode } from '../config/lightness.js'
import { SCALES, SCALE_NAMES, type ScaleConfig, type ScaleName } from '../config/scales.js'
import { apcaLc, contrastRatio } from './contrast.js'
import { parseHex } from './oklch.js'
import { ship } from './solve.js'
import { solveLightness } from './solve.js'

/** Why a step's lightness is not the curve's. */
export type Correction = 'constrained' | 'reseated' | 'solved'

export interface Swatch {
  /** 1-based, matching the step contract. */
  readonly step: number
  readonly l: number
  /** The chroma that fits sRGB, never the chroma requested. */
  readonly c: number
  readonly h: number
  readonly hex: string
  readonly correction?: Correction
}

export interface ContractResult {
  readonly step: number
  readonly reference: number
  readonly minimum: number
  readonly ratio: number
  /** Advisory. Never decides `passes`. */
  readonly apcaLc: number
  readonly passes: boolean
}

export interface OnSolid {
  readonly text: 'white' | 'black'
  readonly ratio: number
  readonly apcaLc: number
}

export interface Scale {
  readonly name: ScaleName
  readonly mode: Mode
  readonly steps: readonly Swatch[]
  readonly contracts: readonly ContractResult[]
  readonly onSolid: OnSolid
  /** Steps the solver moved, in step order. Empty for a scale that needed none. */
  readonly solved: readonly number[]
}

const WHITE = '#ffffff'
const BLACK = '#000000'

/** The separation floor below each step, keyed by the step above it. */
const FLOOR_BELOW: ReadonlyMap<number, number> = new Map([
  [9, SEPARATION.hover],
  [10, SEPARATION.text],
  [11, SEPARATION.strongText]
])

export function buildScale(name: ScaleName, mode: Mode): Scale {
  // Widened from the literal type deliberately: `as const satisfies` keeps the
  // key names exact, which leaves each scale's own shape in the union and only one
  // of them carrying `solid`. The generator wants the common shape.
  const config: ScaleConfig = SCALES[name]
  const curve = LIGHTNESS[mode]
  const direction = DIRECTION[mode]

  const lightness = [...curve] as number[]
  const chroma = CHROMA_FRACTION[mode].map((fraction) => fraction * config.peak)
  const corrections = new Array<Correction | undefined>(STEPS).fill(undefined)

  const hexAt = (step: number): string =>
    ship({ l: lightness[step - 1]!, c: chroma[step - 1]!, h: config.hue }).hex

  // 2. The explicit constraint. Only the accent has one, and it exists because
  //    the computed answer at the curve's lightness is a black primary button.
  if (config.solid) {
    lightness[8] = config.solid.lightness
    corrections[8] = 'constrained'
  }

  // 3. Re-seat everything beneath a step that moved. Expressed as a ceiling in
  //    the curve's direction of travel, so a step already far enough away keeps
  //    its curve value and an untouched scale is left entirely alone.
  const reseatBelow = (from: number, reason: Correction): void => {
    for (let step = from + 1; step <= STEPS; step++) {
      const floor = FLOOR_BELOW.get(step - 1)
      if (floor === undefined) {
        break
      }

      const limit = lightness[step - 2]! + direction * floor
      const current = lightness[step - 1]!
      // `direction` is -1 in light mode, where a lower lightness is further
      // along, and +1 in dark. Comparing the two through it keeps one expression
      // correct for both.
      const beyond = direction < 0 ? current > limit : current < limit

      if (beyond) {
        lightness[step - 1] = limit
        corrections[step - 1] ??= reason
      }
    }
  }

  if (config.solid) {
    reseatBelow(9, 'reseated')
  }

  // 4. Solve what still fails, in step order, re-seating beneath each solve.
  const solved: number[] = []

  for (const contract of CONTRACTS) {
    const reference = hexAt(contract.reference)
    const measured = contrastRatio(parseHex(hexAt(contract.step)), parseHex(reference))

    if (measured >= contract.minimum) {
      continue
    }

    const answer = solveLightness({
      chroma: chroma[contract.step - 1]!,
      hue: config.hue,
      reference,
      minimum: contract.minimum,
      from: lightness[contract.step - 1]!,
      limit: direction < 0 ? 0 : 1
    })

    if (answer === undefined) {
      throw new Error(
        `${name} ${mode}: step ${contract.step} cannot reach ${contract.minimum}:1 against ` +
          `step ${contract.reference} at any lightness. The curve or the scale's peak chroma ` +
          `has to change; this is not something the solver can absorb.`
      )
    }

    lightness[contract.step - 1] = answer
    corrections[contract.step - 1] = 'solved'
    solved.push(contract.step)
    reseatBelow(contract.step, 'reseated')
  }

  const steps: Swatch[] = lightness.map((l, index) => {
    const { oklch, hex } = ship({ l, c: chroma[index]!, h: config.hue })
    const correction = corrections[index]

    return {
      step: index + 1,
      l: oklch.l,
      c: oklch.c,
      h: oklch.h,
      hex,
      ...(correction ? { correction } : {})
    }
  })

  const contracts: ContractResult[] = CONTRACTS.map((contract) => {
    const subject = parseHex(steps[contract.step - 1]!.hex)
    const reference = parseHex(steps[contract.reference - 1]!.hex)
    const ratio = contrastRatio(subject, reference)

    return {
      step: contract.step,
      reference: contract.reference,
      minimum: contract.minimum,
      ratio,
      apcaLc: apcaLc(subject, reference),
      passes: ratio >= contract.minimum
    }
  })

  return { name, mode, steps, contracts, onSolid: resolveOnSolid(config, steps[8]!), solved }
}

/**
 * Measures white and black against the solid fill and takes the winner.
 *
 * Hard-coding white here is a recurring bug in hand-built systems. A scale with
 * a constraint takes the text colour the constraint was chosen for, and the
 * constraint is verified rather than trusted — a config that claimed a ratio it
 * does not deliver is exactly the failure this package exists to prevent.
 */
function resolveOnSolid(config: ScaleConfig, solid: Swatch): OnSolid {
  const fill = parseHex(solid.hex)
  const against = (hex: string): OnSolid => ({
    text: hex === WHITE ? 'white' : 'black',
    ratio: contrastRatio(fill, parseHex(hex)),
    apcaLc: apcaLc(parseHex(hex), fill)
  })

  if (config.solid) {
    const chosen = against(config.solid.text === 'white' ? WHITE : BLACK)

    if (chosen.ratio < config.solid.minimum) {
      throw new Error(
        `solid constraint at L ${config.solid.lightness} gives ${config.solid.text} only ` +
          `${chosen.ratio.toFixed(2)}:1, below the ${config.solid.minimum}:1 it was chosen for`
      )
    }

    return chosen
  }

  const white = against(WHITE)
  const black = against(BLACK)

  return white.ratio >= black.ratio ? white : black
}

/** Every scale in every mode: five scales, two modes, ten scale-modes. */
export function buildAllScales(): Scale[] {
  return SCALE_NAMES.flatMap((name) => MODES.map((mode) => buildScale(name, mode)))
}
