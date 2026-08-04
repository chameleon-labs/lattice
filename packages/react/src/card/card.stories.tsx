import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '../badge/badge.js'
import { Button } from '../button/button.js'
import { Card, CardBody, CardHeader } from './card.js'

/**
 * A `--lat-bg-raised` surface with a hairline border. Every panel in both
 * demo pages is this construction: the surface, a `border-bottom` header
 * row carrying an uppercase mono eyebrow label, and a body. The hairline is
 * the edge that survives `forced-colors`, where the user agent strips shadows
 * and flattens surfaces — the shadow `Card` adds under `data-elevation`
 * is the enhancement, not the guarantee.
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
      <CardHeader label="Audit" />
      <CardBody>
        <h3>example.com/checkout</h3>
        <p>Score 72 — 3 critical, 5 serious.</p>
      </CardBody>
    </Card>
  )
}

/**
 * `data-elevation="floating"` is the escape hatch, not a default — the one
 * instance the Figma bundle's landing page uses it for is the hero audit card.
 */
export const Floating: Story = {
  render: (args) => (
    <Card {...args} data-elevation="floating">
      <CardHeader label="Audit" />
      <CardBody>
        <h3>example.com/checkout</h3>
        <p>Score 72 — 3 critical, 5 serious.</p>
      </CardBody>
    </Card>
  )
}

/**
 * `CardHeader`'s children render after the label, so a caller can put a count
 * or a control on the right of the header row.
 */
export const HeaderWithAside: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader label="Tokens">
        <Badge variant="info">12</Badge>
      </CardHeader>
      <CardBody>content</CardBody>
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
      <CardHeader label="Pricing" />
      <CardBody>
        <h3>example.com/pricing</h3>
        <p>
          Score 84 <Badge variant="success">up 3</Badge>
        </p>
        <Button render={<a href="#story" />}>Open the report</Button>
      </CardBody>
    </Card>
  )
}
