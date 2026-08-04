import type { Meta, StoryObj } from '@storybook/react-vite'
import { LandingPage } from './landing-page.js'

/**
 * The tabstop landing page, rebuilt from Lattice components alone.
 *
 * This is an acceptance test rather than a demo. Anything this page needs that
 * the library cannot express is a gap in the library — see the gap list in
 * docs/superpowers/plans/2026-08-03-meridian-proof.md Task 4.
 *
 * Two deliberate omissions from the source bundle, both approved decisions
 * rather than gaps:
 *
 * - **`ScoreArc`**, the hand-drawn SVG gauge behind the hero score. It is
 *   tabstop product surface, not system surface — one consumer, one
 *   arrangement, no guarantee a caller would otherwise have to remember (the
 *   same admission test the design spec's §7.3 applies to keep it out of the
 *   library). Rendered here as a `Stat` instead.
 * - **The Recharts score-history line chart.** Charting is a product concern,
 *   not a design-system one. Rendered here as a `Table` — see `ScoreHistory`
 *   in `landing-page.tsx` for what that trade costs.
 */
const meta = {
  title: 'Pages/Landing',
  component: LandingPage,
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof LandingPage>

export default meta

export const Dark: StoryObj<typeof meta> = { globals: { theme: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { theme: 'light' } }
