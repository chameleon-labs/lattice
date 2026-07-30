/**
 * Colour maths for the token pipeline: OKLCH to sRGB and back, hex encoding,
 * and fitting a requested chroma into the sRGB gamut.
 */

/** sRGB channels, gamma-encoded, nominally 0..1. */
export interface Rgb {
  readonly r: number
  readonly g: number
  readonly b: number
}

/** Perceptual lightness 0..1, chroma, and hue in degrees 0..360. */
export interface Oklch {
  readonly l: number
  readonly c: number
  readonly h: number
}

interface Oklab {
  readonly l: number
  readonly a: number
  readonly b: number
}

const SIX_HEX_DIGITS = /^[0-9a-f]{6}$/i

/** Reads `#rrggbb` (hash optional, any case) as channels in 0..1. */
export function parseHex(hex: string): Rgb {
  const digits = hex.trim().replace(/^#/, '')
  if (!SIX_HEX_DIGITS.test(digits)) {
    throw new Error(`not a six-digit hex colour: ${hex}`)
  }

  const packed = Number.parseInt(digits, 16)
  return {
    r: ((packed >> 16) & 0xff) / 255,
    g: ((packed >> 8) & 0xff) / 255,
    b: (packed & 0xff) / 255
  }
}

function channelToByte(value: number): string {
  // Math.min/Math.max pass NaN straight through, so without this an emitted
  // stylesheet would contain '#NaNNaNNaN' and still parse as valid CSS. A build
  // that stops is strictly better than a token file that is quietly wrong.
  if (!Number.isFinite(value)) {
    throw new Error(`channel is not finite: ${value}`)
  }

  const clamped = Math.min(1, Math.max(0, value))
  return Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
}

/** Writes channels as `#rrggbb`, clamping anything outside 0..1. */
export function formatHex({ r, g, b }: Rgb): string {
  return `#${channelToByte(r)}${channelToByte(g)}${channelToByte(b)}`
}

/**
 * sRGB transfer function, gamma-encoded to linear-light.
 *
 * Exported as a scalar rather than as a colour type on purpose: WCAG relative
 * luminance is a weighted sum of these, and keeping the linear form unnamed
 * makes it awkward to pass a linear value where an encoded one belongs.
 */
export function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

/** Inverse of {@link srgbToLinear}. Values outside 0..1 stay outside it. */
export function linearToSrgb(value: number): number {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055
}

// Ottosson's OKLab matrices. Linear sRGB to a cone-response space, cube-rooted,
// then to Lab. https://bottosson.github.io/posts/oklab/
function srgbToOklab({ r, g, b }: Rgb): Oklab {
  const red = srgbToLinear(r)
  const green = srgbToLinear(g)
  const blue = srgbToLinear(b)

  const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
  const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
  const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)

  return {
    l: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    a: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    b: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short
  }
}

function oklabToSrgb({ l, a, b }: Oklab): Rgb {
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3

  return {
    r: linearToSrgb(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short),
    g: linearToSrgb(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short),
    b: linearToSrgb(-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short)
  }
}

/** Converts an sRGB colour to OKLCH. Hue is normalised to 0..360. */
export function srgbToOklch(rgb: Rgb): Oklch {
  const { l, a, b } = srgbToOklab(rgb)
  const degrees = (Math.atan2(b, a) * 180) / Math.PI

  return { l, c: Math.hypot(a, b), h: ((degrees % 360) + 360) % 360 }
}

/**
 * Converts OKLCH to sRGB. Channels fall outside 0..1 when the colour is not
 * representable in sRGB — the caller decides whether to fit or reject, so this
 * never silently clamps.
 */
export function oklchToSrgb({ l, c, h }: Oklch): Rgb {
  const radians = (h * Math.PI) / 180

  return oklabToSrgb({ l, a: c * Math.cos(radians), b: c * Math.sin(radians) })
}

/**
 * How far outside 0..1 a channel may drift and still count as representable.
 *
 * Sized to absorb float error in the matrices (~1e-15 through a dozen
 * multiply-adds, a cube root and a power) and nothing more.
 *
 * A looser tolerance is not harmless. Near lightness 0 the transform is cubic
 * in chroma, so a tolerance of e raises the accepted chroma to roughly the cube
 * root of e: at 1e-6 the search kept chroma 0.006 on a colour that ships as
 * #000000, which is exactly the config claiming a value that never shipped.
 * 1e-12 holds that error near 1e-4 while still leaving a thousandfold margin
 * over the float noise it exists to absorb.
 */
const GAMUT_TOLERANCE = 1e-12

function representable(channel: number): boolean {
  return channel >= -GAMUT_TOLERANCE && channel <= 1 + GAMUT_TOLERANCE
}

/** Whether sRGB can represent this colour without clipping a channel. */
export function inGamut(color: Oklch): boolean {
  const { r, g, b } = oklchToSrgb(color)

  return representable(r) && representable(g) && representable(b)
}

/**
 * Chroma precision of the gamut search: about 400x finer than one 8-bit step
 * (1/255 ≈ 3.9e-3), so the recorded chroma is well inside the quantisation that
 * emitting a hex value imposes anyway.
 */
const CHROMA_RESOLUTION = 1e-5

/**
 * Fits a requested chroma into sRGB by binary search, holding lightness and hue.
 *
 * Returns the chroma that actually fits, never the requested one, so a config
 * can record what shipped rather than what was asked for. Reducing chroma keeps
 * the hue and the perceived lightness, which is why this is preferred over
 * clipping the RGB channels — clipping moves all three.
 */
export function fitToGamut(color: Oklch): Oklch {
  // Both non-finite cases are unacceptable, and neither is caught by the loop.
  // Infinite chroma keeps the midpoint at Infinity so `clips` never decreases
  // and the search spins forever — and because the loop is synchronous it blocks
  // the event loop, so no test timeout or async watchdog can interrupt it. NaN
  // chroma is the opposite failure: it fails the loop condition immediately and
  // returns chroma 0, silently reporting grey as the fitted colour.
  if (!Number.isFinite(color.l) || !Number.isFinite(color.c) || !Number.isFinite(color.h)) {
    throw new Error(`cannot fit a non-finite colour: oklch(${color.l} ${color.c} ${color.h})`)
  }

  if (inGamut(color)) {
    return color
  }

  let fits = 0
  let clips = color.c

  while (clips - fits > CHROMA_RESOLUTION) {
    const midpoint = (fits + clips) / 2

    if (inGamut({ ...color, c: midpoint })) {
      fits = midpoint
    } else {
      clips = midpoint
    }
  }

  return { ...color, c: fits }
}
