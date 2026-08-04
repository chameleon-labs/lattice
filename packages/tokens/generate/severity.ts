import type { Mode } from '../config/modes.js'
import {
  LIGHT_LIGHTNESS_DELTA,
  SEVERITY_ANCHORS,
  SEVERITY_LEVELS,
  type SeverityLevel
} from '../config/severity.js'
import type { Swatch } from './anchors.js'
import { fitToGamut, formatHex, oklchToSrgb, parseHex, srgbToOklch } from './oklch.js'

/**
 * `minor` has no colour of its own. It is emitted as an alias to
 * `--lat-text-subtle` by the emitter rather than as a swatch here.
 */
const COLOURED = SEVERITY_LEVELS.filter((l) => l !== 'minor')

function derive(mode: Mode, level: SeverityLevel): Swatch {
  // The only derivation the ramp needs: light `moderate`, placed by the same
  // lightness delta that separates the declared light and dark `serious`.
  const darkHex = SEVERITY_ANCHORS.dark[level]
  if (darkHex === undefined) throw new Error(`severity: no dark anchor for ${level}`)

  const dark = srgbToOklch(parseHex(darkHex))
  const fitted = fitToGamut({ l: dark.l + LIGHT_LIGHTNESS_DELTA, c: dark.c, h: dark.h })
  const hex = formatHex(oklchToSrgb(fitted))

  return {
    scale: 'severity',
    role: level,
    mode,
    hex,
    l: fitted.l,
    c: fitted.c,
    h: fitted.h,
    origin: 'derived'
  }
}

export function buildSeverity(mode: Mode): Swatch[] {
  return COLOURED.map((level) => {
    const hex = SEVERITY_ANCHORS[mode][level]
    if (hex === undefined) return derive(mode, level)

    const { l, c, h } = srgbToOklch(parseHex(hex))
    return { scale: 'severity', role: level, mode, hex, l, c, h, origin: 'anchored' as const }
  })
}
