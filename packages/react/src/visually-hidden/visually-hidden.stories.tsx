import type { Meta, StoryObj } from '@storybook/react-vite'
import { VisuallyHidden } from './visually-hidden.js'

/**
 * Re-exported from Ariakit unchanged, and deliberately so: its implementation
 * already applies the clip-rect correctly, keeping the element in the
 * accessibility tree and out of view without the `display: none` or zero-size
 * mistakes that silently remove it from both.
 *
 * There is nothing here for Lattice to decide, because the component has no
 * appearance. The stories exist so the sweep can confirm the text stays
 * *readable to axe* while being invisible — the failure mode is a hiding
 * technique that hides it from everything.
 */
const meta = {
  title: 'Components/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs']
} satisfies Meta<typeof VisuallyHidden>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <p>
      Score 72
      <VisuallyHidden> out of 100, audited on 30 July at 09:14 UTC</VisuallyHidden>
    </p>
  )
}

/**
 * The case it earns its place on: a control whose visible label is an icon or a
 * number still needs a name a screen reader can read.
 */
export const AsAnAccessibleName: Story = {
  render: () => (
    <button className="lat-button" data-variant="soft" data-size="md" data-tone="accent">
      <span aria-hidden="true">×</span>
      <VisuallyHidden>Dismiss this notification</VisuallyHidden>
    </button>
  )
}
