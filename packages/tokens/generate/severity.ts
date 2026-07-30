/**
 * Building and checking the severity ramp.
 *
 * The checks encode what the ramp promises: light reads as ordered without
 * colour, every level clears its surface, and the ordering cue dark gives up is
 * measured rather than assumed.
 */

import { CHART_SURFACES } from '../config/charts.js'
import type { Mode } from '../config/lightness.js'
import {
  SEVERITY,
  SEVERITY_CONTRAST_MIN,
  SEVERITY_DARK,
  SEVERITY_LEVELS,
  SEVERITY_MIN_LUMINANCE_GAP,
  type SeverityLevel
} from '../config/severity.js'
import type { CheckResult, PaletteReport } from './charts.js'
import { apcaLc, contrastRatio, relativeLuminance } from './contrast.js'
import { parseHex } from './oklch.js'
import { ship } from './solve.js'

export interface SeveritySwatch {
  readonly level: SeverityLevel
  /** 1-based rank, least severe first. */
  readonly rank: number
  readonly l: number
  readonly c: number
  readonly h: number
  readonly hex: string
  /** WCAG relative luminance — what the ramp reads as with colour removed. */
  readonly luminance: number
}

export function buildSeverity(mode: Mode): SeveritySwatch[] {
  return SEVERITY.map((entry, index) => {
    const request =
      mode === 'light'
        ? { l: entry.light.l, c: entry.light.c, h: entry.hue }
        : { l: SEVERITY_DARK.lightness, c: SEVERITY_DARK.chroma, h: entry.hue }
    const { oklch, hex } = ship(request)

    return {
      level: entry.level,
      rank: index + 1,
      l: oklch.l,
      c: oklch.c,
      h: oklch.h,
      hex,
      luminance: relativeLuminance(parseHex(hex))
    }
  })
}

export function validateSeverity(
  ramp: readonly SeveritySwatch[],
  mode: Mode,
  options: { readonly surface?: string } = {}
): PaletteReport {
  const surface = options.surface ?? CHART_SURFACES[mode]
  const checks: CheckResult[] = []

  if (ramp.length === 0) {
    return {
      mode,
      pairs: 'adjacent',
      checks: [{ name: 'Ramp present', state: 'fail', detail: 'empty ramp — nothing to validate' }],
      ok: false
    }
  }

  // The order is the whole point, so it is checked before anything measured —
  // and all four levels must be present, not merely a prefix of them.
  //
  // The categorical validator deliberately compares against a prefix, because a
  // scatter chart validates only the leading slots it actually uses. Severity has
  // no equivalent: the levels are a fixed vocabulary, and a ramp without
  // `critical` is not a shorter ramp but a broken one. Comparing against a prefix
  // here passed a three-level ramp, and a one-level ramp too.
  const order = ramp.map((swatch) => swatch.level).join(' ')
  const expected = SEVERITY_LEVELS.join(' ')
  checks.push({
    name: 'Ordered levels',
    state: order === expected ? 'pass' : 'fail',
    detail:
      order === expected
        ? `all ${SEVERITY_LEVELS.length} levels, least severe first`
        : `expected ${expected}, got ${order || '(none)'}`
  })

  // Greyscale ordering: does the ramp still read as ordered with colour removed?
  const gaps = ramp.slice(1).map((swatch, index) => swatch.luminance - ramp[index]!.luminance)
  const monotone = gaps.every((gap) => gap < 0)
  const smallest = Math.min(...gaps.map(Math.abs))
  const required = SEVERITY_MIN_LUMINANCE_GAP[mode]

  checks.push({
    name: 'Greyscale order',
    // Dark gives this up deliberately, so it is reported there rather than gated.
    state: mode === 'light' ? (monotone && smallest >= required ? 'pass' : 'fail') : 'warn',
    detail:
      `luminance ${ramp.map((swatch) => swatch.luminance.toFixed(3)).join(' > ')}` +
      `; smallest gap ${smallest.toFixed(4)}` +
      (mode === 'light'
        ? ` (needs ${required})`
        : ' — incidental, far too small to convey order; icon and label carry it')
  })

  // Every mark has to be visible on its own surface.
  const faint = ramp.filter(
    (swatch) => contrastRatio(parseHex(swatch.hex), parseHex(surface)) < SEVERITY_CONTRAST_MIN
  )
  // APCA reported beside the gate, never folded into it: the state is decided by
  // the WCAG ratio alone. The worst Lc is the one worth surfacing, since it is
  // the level closest to disappearing against its surface.
  const worstLc = Math.min(
    ...ramp.map((swatch) => Math.abs(apcaLc(parseHex(swatch.hex), parseHex(surface))))
  )

  checks.push({
    name: 'Contrast vs surface',
    state: faint.length === 0 ? 'pass' : 'fail',
    detail:
      `worst APCA Lc ${worstLc.toFixed(1)} (advisory) · ` +
      (faint.length === 0
        ? `all ${ramp.length} at or above ${SEVERITY_CONTRAST_MIN}:1 against ${surface}`
        : faint
            .map(
              (swatch) =>
                `${swatch.level} ${contrastRatio(parseHex(swatch.hex), parseHex(surface)).toFixed(2)}:1`
            )
            .join(', '))
  })

  // Light claims monotone chroma as well as lightness; that is what makes the
  // ordering survive a greyscale or forced-colors rendering.
  if (mode === 'light') {
    const rising = ramp.every((swatch, index) => index === 0 || swatch.c > ramp[index - 1]!.c)
    const falling = ramp.every((swatch, index) => index === 0 || swatch.l < ramp[index - 1]!.l)

    checks.push({
      name: 'Lightness and chroma',
      state: rising && falling ? 'pass' : 'fail',
      detail:
        rising && falling
          ? 'lightness falls and chroma rises with severity'
          : `L ${ramp.map((s) => s.l.toFixed(3)).join(' ')} C ${ramp.map((s) => s.c.toFixed(3)).join(' ')}`
    })
  } else {
    const flat = ramp.every((swatch) => Math.abs(swatch.l - SEVERITY_DARK.lightness) < 0.005)

    checks.push({
      name: 'Flat lightness',
      state: flat ? 'pass' : 'fail',
      detail: flat
        ? `held at L ${SEVERITY_DARK.lightness} so no level outranks another by brightness`
        : ramp.map((s) => s.l.toFixed(3)).join(' ')
    })
  }

  return { mode, pairs: 'adjacent', checks, ok: checks.every((check) => check.state !== 'fail') }
}
