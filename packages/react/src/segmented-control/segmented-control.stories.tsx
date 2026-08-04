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

/**
 * A disabled item is skipped entirely by arrow-key navigation, not merely
 * unselectable within it. Ariakit's radio store, unlike its `Tab`, does not
 * default `accessibleWhenDisabled` to true — verified directly: from "This
 * page", ArrowRight skips the disabled "User flow" and wraps to "Whole
 * site". That is also how a native `<input type="radio" disabled>` behaves
 * in a browser's own arrow-key handling for a radio group, so this is the
 * correct default here, not a gap to paper over.
 */
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
