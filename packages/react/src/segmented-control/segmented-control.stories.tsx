import type { Meta, StoryObj } from '@storybook/react-vite'
import { SegmentedControl, SegmentedControlItem } from './segmented-control.js'

/**
 * Built on Ariakit's radio store rather than its tabs: the control selects a
 * value, it does not reveal a panel. That distinction is what a screen reader
 * announces, so it is not a styling choice.
 */
const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs']
} satisfies Meta<typeof SegmentedControl>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: null },
  render: () => (
    <SegmentedControl defaultValue="system" aria-label="Theme">
      <SegmentedControlItem value="system">System</SegmentedControlItem>
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
    </SegmentedControl>
  )
}

/** A disabled item stays in the roving-focus order; it just cannot be selected. */
export const WithDisabledItem: Story = {
  args: { children: null },
  render: () => (
    <SegmentedControl defaultValue="page" aria-label="Audit scope">
      <SegmentedControlItem value="page">This page</SegmentedControlItem>
      <SegmentedControlItem value="site">Whole site</SegmentedControlItem>
      <SegmentedControlItem value="flow" disabled>
        User flow
      </SegmentedControlItem>
    </SegmentedControl>
  )
}
