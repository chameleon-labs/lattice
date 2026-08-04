export interface SpaceValue {
  readonly multiplier: number
  readonly rem: number
}

/**
 * Lattice uses 4, 8, 12, 16, 24, 32, 48, 64, 96 and 128 — `1`, `2`, `3`, `4`,
 * `6`, `8`, `12`, `16`, `24` and `32` below. The half-steps and the odd
 * multiples remain available but appear nowhere in the identity.
 */
export const SPACES = {
  '0': { multiplier: 0, rem: 0 },
  '0-5': { multiplier: 0.5, rem: 0.125 },
  '1': { multiplier: 1, rem: 0.25 },
  '1-5': { multiplier: 1.5, rem: 0.375 },
  '2': { multiplier: 2, rem: 0.5 },
  '3': { multiplier: 3, rem: 0.75 },
  '4': { multiplier: 4, rem: 1 },
  '5': { multiplier: 5, rem: 1.25 },
  '6': { multiplier: 6, rem: 1.5 },
  '8': { multiplier: 8, rem: 2 },
  '10': { multiplier: 10, rem: 2.5 },
  '12': { multiplier: 12, rem: 3 },
  '16': { multiplier: 16, rem: 4 },
  '20': { multiplier: 20, rem: 5 },
  '24': { multiplier: 24, rem: 6 },
  '32': { multiplier: 32, rem: 8 }
} as const satisfies Readonly<Record<string, SpaceValue>>

export const BREAKPOINTS = {
  sm: 30,
  md: 48,
  lg: 64,
  xl: 80
} as const

export const CONTAINERS = {
  prose: 42,
  content: 64,
  wide: 80
} as const

/**
 * Radii.
 *
 * Three values, because the Figma bundle renders as a square system. Its `--radius` is
 * 3px, but the `--radius-sm` its components actually use is
 * `calc(var(--radius) - 4px)` — negative, so it computes to zero. Across both
 * demo pages the only radii that appear are that zero and `rounded-full`.
 *
 * The intermediate steps this scale used to carry (0.25rem, 0.5rem, 0.75rem)
 * have nothing to express here and are removed rather than left as tokens
 * nobody should reach for.
 */
export const RADII = {
  none: 0,
  /** The declared `--radius`. Available for large surfaces; nothing uses it yet. */
  sm: 0.1875,
  full: 9999
} as const

export type SpaceName = keyof typeof SPACES
export type BreakpointName = keyof typeof BREAKPOINTS
export type ContainerName = keyof typeof CONTAINERS
export type RadiusName = keyof typeof RADII
