import type { Meta, StoryObj } from '@storybook/react-vite'
import { LandingPage } from './landing-page.js'

/**
 * The tabstop landing page, rebuilt from Lattice components alone.
 *
 * This is an acceptance test rather than a demo. Anything this page needs that
 * the library cannot express is a gap in the library — see the gap list in
 * docs/superpowers/plans/2026-08-03-meridian-proof.md Task 4.
 *
 * Two constructions are excluded from the component library — tabstop
 * product surface, not system surface: one consumer each, one arrangement
 * each, no guarantee a caller would otherwise have to remember (the same
 * admission test the design spec's §7.3 applies to keep them out). Neither
 * is down-rendered to a lesser library component; both are built as
 * page-local components that compose only tokens:
 *
 * - **The hero's `ScoreArc` gauge** (`./score-arc.tsx`) — nothing in the
 *   library reproduces a colour-coded arc gauge.
 * - **The score-history section's line chart** (`./score-chart.tsx`) —
 *   reproduced as inline SVG (monotone cubic interpolation, ported from
 *   d3-shape's `curveMonotoneX`) rather than by taking a charting
 *   dependency. Charting stays out of the component library itself:
 *   Lattice ships tokens and accessible primitives, not a charting
 *   library, so this component ships from `src/pages/` only, imported by
 *   `landing-page.tsx` alone, and is not exported from `../index.js`.
 */
const meta = {
  title: 'Pages/Landing',
  component: LandingPage,
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof LandingPage>

export default meta

export const Dark: StoryObj<typeof meta> = { globals: { theme: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { theme: 'light' } }
