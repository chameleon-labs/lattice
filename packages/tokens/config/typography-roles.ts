/**
 * Semantic typography roles.
 *
 * The matrix is the single source for both CSS aliases and DTCG composites.
 * Primitive-key types make an invalid reference a compile-time error, while
 * classification remains internal metadata for accessibility contracts.
 */

import {
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  LETTER_SPACINGS,
  LINE_HEIGHTS
} from './typography.js'

export interface TypographyRole {
  readonly fontFamily: keyof typeof FONT_FAMILIES
  readonly fontSize: keyof typeof FONT_SIZES
  readonly fontWeight: keyof typeof FONT_WEIGHTS
  readonly letterSpacing: keyof typeof LETTER_SPACINGS
  readonly lineHeight: keyof typeof LINE_HEIGHTS
  /** Emitted only when present. Carries the eyebrow and tag casing. */
  readonly textTransform?: 'uppercase'
  /** Emitted only when present. Keeps a column of figures from jittering. */
  readonly fontVariantNumeric?: 'tabular-nums'
  readonly classification: 'prose' | 'ui' | 'supporting' | 'restricted' | 'code' | 'display'
}

export const TYPOGRAPHY_ROLES = {
  display: { fontFamily: 'sans', fontSize: '5xl', fontWeight: 'bold', letterSpacing: 'tight', lineHeight: 'none', classification: 'display' },
  h1: { fontFamily: 'sans', fontSize: '3xl', fontWeight: 'semibold', letterSpacing: 'tight', lineHeight: 'tight', classification: 'display' },
  h2: { fontFamily: 'sans', fontSize: '2xl', fontWeight: 'medium', letterSpacing: 'tight', lineHeight: 'normal', classification: 'display' },
  h3: { fontFamily: 'sans', fontSize: 'xl', fontWeight: 'medium', letterSpacing: 'normal', lineHeight: 'normal', classification: 'display' },
  h4: { fontFamily: 'sans', fontSize: 'base', fontWeight: 'medium', letterSpacing: 'normal', lineHeight: 'normal', classification: 'display' },
  body: { fontFamily: 'sans', fontSize: 'base', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'normal', classification: 'prose' },
  'body-strong': { fontFamily: 'sans', fontSize: 'base', fontWeight: 'semibold', letterSpacing: 'normal', lineHeight: 'normal', classification: 'prose' },
  lead: { fontFamily: 'sans', fontSize: 'lg', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'relaxed', classification: 'prose' },
  small: { fontFamily: 'sans', fontSize: 'sm', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'relaxed', classification: 'prose' },
  ui: { fontFamily: 'sans', fontSize: 'sm', fontWeight: 'medium', letterSpacing: 'normal', lineHeight: 'control', classification: 'ui' },
  'ui-strong': { fontFamily: 'sans', fontSize: 'sm', fontWeight: 'semibold', letterSpacing: 'normal', lineHeight: 'control', classification: 'ui' },
  caption: { fontFamily: 'sans', fontSize: 'xs', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'snug', classification: 'supporting' },

  // The mono roles. These carry the identity — see the spec's §2.
  eyebrow: { fontFamily: 'mono', fontSize: '3xs', fontWeight: 'regular', letterSpacing: 'eyebrow', lineHeight: 'normal', textTransform: 'uppercase', classification: 'restricted' },
  tag: { fontFamily: 'mono', fontSize: '3xs', fontWeight: 'regular', letterSpacing: 'wide', lineHeight: 'normal', textTransform: 'uppercase', classification: 'restricted' },
  meta: { fontFamily: 'mono', fontSize: '2xs', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'normal', classification: 'supporting' },
  numeric: { fontFamily: 'mono', fontSize: 'base', fontWeight: 'bold', letterSpacing: 'normal', lineHeight: 'none', fontVariantNumeric: 'tabular-nums', classification: 'ui' },
  // `code` is prose-leaded (`relaxed`, 1.625) for multi-line blocks — CodeBlock
  // depends on that and must keep it. A field is a single-line mono control,
  // not a block, so it needs the `ui`/`ui-strong` pairing's `control` leading
  // rather than `code`'s. There was no mono control role before this, so a
  // field reached for `code` — the nearest mono role — and inherited prose
  // leading with it, making every field 1-3px taller than the source design.
  code: { fontFamily: 'mono', fontSize: 'sm', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'relaxed', classification: 'code' },
  field: { fontFamily: 'mono', fontSize: 'sm', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'control', classification: 'ui' },
  // The same category error as `field`, in a control `field`'s fix didn't
  // reach: SegmentedControl's label is a single-line mono control that also
  // borrowed `code` wholesale, but at `text-xs` (12px) rather than `field`'s
  // `text-sm` (14px) — Tailwind pairs every size with its own leading, so
  // `control`'s 1.4286 is the wrong ratio here too. `compact` is that size's
  // own pairing.
  segment: { fontFamily: 'mono', fontSize: 'xs', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'compact', classification: 'ui' }
} as const satisfies Record<string, TypographyRole>

export type TypographyRoleName = keyof typeof TYPOGRAPHY_ROLES

export const TYPOGRAPHY_BREAKPOINT_REM = 40

/**
 * Heading sizes below {@link TYPOGRAPHY_BREAKPOINT_REM}.
 *
 * Meridian's own hero is `text-5xl md:text-6xl`, so responsive display sizing
 * is part of the identity rather than an addition to it. Each role steps down
 * one rung; `h4` and the mono roles are already small enough to leave alone.
 */
export const NARROW_HEADING_SIZES = {
  display: '3xl',
  h1: '2xl',
  h2: 'xl',
  h3: 'lg'
} as const satisfies Partial<Record<TypographyRoleName, keyof typeof FONT_SIZES>>
