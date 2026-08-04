/**
 * The Meridian palette, verbatim.
 *
 * Every value here is copied from the Figma bundle's `src/styles/theme.css`
 * without adjustment. This file is the whole of the colour system's input: there
 * is no curve, no envelope and no solver behind it.
 *
 * That is a deliberate reversal. Until 2026-08-03 this package generated its
 * palette from a lightness curve and a chroma envelope, and the generation was
 * the authority. Meridian's values do not lie on any single curve — its accent
 * is L 0.905 H 120 in dark and L 0.630 H 129 in light — so keeping the curve
 * would have meant approximating the identity rather than applying it.
 */
import type { Mode } from './modes.js'

/** The grey roles Meridian names. Each is anchored in both modes. */
export const GRAY_ROLES = [
  'bg',
  'bg-raised',
  'bg-subtle',
  'component',
  'field-bg',
  'switch-track',
  'text-subtle',
  'text'
] as const

export type GrayRole = (typeof GRAY_ROLES)[number]

/** Scales carrying a single anchored solid fill. */
export const CHROMATIC_SCALES = [
  'accent',
  'danger',
  'warning',
  'success',
  'info',
  'decorative'
] as const

export type ChromaticScale = (typeof CHROMATIC_SCALES)[number]

/**
 * Grey.
 *
 * `bg-raised` is lighter than `bg` in both modes — Meridian lifts a surface by
 * raising its lightness regardless of theme, rather than inverting the
 * relationship in dark.
 *
 * `field-bg` equals `component` in dark and differs in light; both are recorded
 * rather than aliased, because the equality is a coincidence of this palette and
 * not a rule the next one has to keep.
 */
export const GRAY_ANCHORS: Record<Mode, Record<GrayRole, string>> = {
  dark: {
    bg: '#0c0c14',
    'bg-raised': '#111120',
    'bg-subtle': '#16162a',
    component: '#1a1a2e',
    'field-bg': '#1a1a2e',
    'switch-track': '#2a2a48',
    'text-subtle': '#6b6b90',
    text: '#e2e2ee'
  },
  light: {
    bg: '#f0f0f8',
    'bg-raised': '#ffffff',
    'bg-subtle': '#eaeaf4',
    component: '#e4e4f0',
    'field-bg': '#e8e8f2',
    'switch-track': '#c8c8dc',
    'text-subtle': '#58588a',
    text: '#0c0c14'
  }
}

/**
 * The solid fill of each chromatic scale.
 *
 * `info`, `success`, `warning` and `decorative` come from Meridian's chart
 * slots. That is not an interpretation: the bundle's own documentation site
 * labels `chart-2` "Info", `chart-5` "Success" and `chart-3` "Accent" in its
 * token table while binding them to those slots.
 */
export const SOLID_ANCHORS: Record<ChromaticScale, Record<Mode, string>> = {
  accent: { dark: '#cff23a', light: '#6a9b00' },
  danger: { dark: '#ff4d6a', light: '#d41240' },
  warning: { dark: '#fb923c', light: '#ea580c' },
  success: { dark: '#34d399', light: '#059669' },
  info: { dark: '#38bdf8', light: '#0284c7' },
  decorative: { dark: '#a78bfa', light: '#7c3aed' }
}

/**
 * Text on a solid fill.
 *
 * Only the accent has one, because only the accent gets a solid button. Every
 * other scale appears as a tint with full-strength text on it, so it needs no
 * on-solid answer.
 */
export const ON_SOLID_ANCHORS: Partial<Record<ChromaticScale, Record<Mode, string>>> = {
  accent: { dark: '#0c0c14', light: '#ffffff' }
}

/**
 * The vivid accent.
 *
 * Meridian keeps `--accent: #cff23a` in *both* modes while `--primary` drops to
 * olive in light. The chartreuse is the identity; the olive exists only so a
 * white label can sit on it. Emitted separately so a caller can reach the brand
 * colour without going through the primary fill.
 */
export const ACCENT_VIVID = '#cff23a'
