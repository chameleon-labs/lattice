import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '../badge/badge.js'
import { Button } from '../button/button.js'
import { Card } from './card.js'

/**
 * The `raised` elevation role as a component: surface, border and shadow
 * together. All three ship because each covers a case the others cannot — the
 * shadow reads on light and is effectively absent on dark, the surface step
 * reads on dark, and the border is the only one that survives `forced-colors`.
 */
const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs']
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <h3>example.com/checkout</h3>
      <p>Score 72 — 3 critical, 5 serious.</p>
    </Card>
  )
}

/**
 * A card never takes `role="button"`. An interactive card exposes its action
 * through a real control inside it, which keeps one accessible name and one tab
 * stop instead of two.
 *
 * That control is a `Button` rendered as an anchor rather than a bare `<a>`.
 * Lattice styles no element it does not own — the CSS contract forbids the
 * global selectors that would take — so an unstyled link inherits the browser's
 * default blue, which the sweep measured at below 4.5:1 against the dark
 * surface. The system has no link primitive yet; until it does, this is the
 * styled control it actually offers.
 */
export const WithAction: Story = {
  render: (args) => (
    <Card {...args}>
      <h3>example.com/pricing</h3>
      <p>
        Score 84 <Badge tone="success">up 3</Badge>
      </p>
      <Button render={<a href="#story" />}>Open the report</Button>
    </Card>
  )
}
