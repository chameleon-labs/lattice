/**
 * The contrast ledger.
 *
 * Until 2026-08-03 a missed contract stopped the build. Meridian's values are
 * the identity and four of its documented pairs miss WCAG, so the check became a
 * report: measured, printed, and shipped anyway.
 *
 * The ledger exists so those four stay visible. A number nobody prints becomes
 * folklore within a release, and the light-mode focus ring in particular — a
 * focus indicator a keyboard user cannot see — is not something to rediscover.
 *
 * Alpha values are composited over their surface before measuring, because that
 * is what a viewer sees.
 */
import { ALPHA_CHANNEL, FOCUS_RING_ALPHA } from '../config/alpha.js'
import { GRAY_ANCHORS, ON_SOLID_ANCHORS, SOLID_ANCHORS } from '../config/anchors.js'
import { MODES, type Mode } from '../config/modes.js'
import { apcaLc, contrastRatio } from './contrast.js'
import { formatHex, parseHex, type Rgb } from './oklch.js'

export interface LedgerEntry {
  readonly name: string
  readonly text: string
  readonly background: string
  readonly ratio: number
  readonly apca: number
  readonly minimum: number
  readonly passes: boolean
}

/**
 * Composite a translucent colour over an opaque one.
 *
 * `parseHex` returns channels in **0..1**, not 0..255, and `contrastRatio`
 * expects the same. Do not round here — rounding a 0..1 channel collapses it to
 * 0 or 1 and every ratio below becomes fiction.
 */
function over(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return {
    r: alpha * fg.r + (1 - alpha) * bg.r,
    g: alpha * fg.g + (1 - alpha) * bg.g,
    b: alpha * fg.b + (1 - alpha) * bg.b
  }
}

function entry(name: string, text: Rgb, background: Rgb, minimum: number): LedgerEntry {
  const ratio = contrastRatio(text, background)
  return {
    name,
    // formatHex, not a manual rgb() string: the channels are 0..1 floats and
    // would otherwise print as `rgb(0.811764 0.949019 0.227450)`.
    text: formatHex(text),
    background: formatHex(background),
    ratio,
    apca: apcaLc(text, background),
    minimum,
    // Rounded to two places first: a pair measuring 4.499 prints as 4.50 and
    // must not be reported as passing something it prints as meeting.
    passes: Number(ratio.toFixed(2)) >= minimum
  }
}

function forMode(mode: Mode): LedgerEntry[] {
  const gray = GRAY_ANCHORS[mode]
  const bg = parseHex(gray.bg)
  const raised = parseHex(gray['bg-raised'])
  const solid = parseHex(SOLID_ANCHORS.accent[mode])
  const onSolid = parseHex(ON_SOLID_ANCHORS.accent![mode])
  const ring = over(solid, FOCUS_RING_ALPHA, raised)
  // ALPHA_CHANNEL holds 0..255 strings for CSS output; normalise to the 0..1
  // the colour maths uses.
  const channel = ALPHA_CHANNEL[mode].split(' ').map((v) => Number(v) / 255)
  const hairline = { r: channel[0]!, g: channel[1]!, b: channel[2]! }

  return [
    entry(`${mode} text on bg`, parseHex(gray.text), bg, 4.5),
    entry(`${mode} text-subtle on bg-raised`, parseHex(gray['text-subtle']), raised, 4.5),
    entry(`${mode} on-solid on solid`, onSolid, solid, 4.5),
    entry(`${mode} solid as text on bg`, solid, bg, 4.5),
    // SC 1.4.11: a focus indicator needs 3:1 against what surrounds it.
    entry(`${mode} focus ring on bg-raised`, ring, raised, 3),
    entry(`${mode} hairline on bg-raised`, over(hairline, 0.08, raised), raised, 1)
  ]
}

export function buildLedger(): LedgerEntry[] {
  return MODES.flatMap(forMode)
}

export function formatLedger(entries: readonly LedgerEntry[]): string {
  return entries
    .map((e) => {
      const marker = e.passes ? '    ' : 'FAIL'
      return `  ${marker} ${e.name.padEnd(34)} ${e.ratio.toFixed(2).padStart(6)}:1  ` +
        `min ${e.minimum.toFixed(1)}  Lc ${e.apca.toFixed(1)}`
    })
    .join('\n')
}
