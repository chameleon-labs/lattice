import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './input.js'

/**
 * A bare input, with no label of its own.
 *
 * Every story here passes `aria-label`, because an input without an accessible
 * name is an axe violation and the sweep would fail on it — correctly. Reach for
 * `TextField` instead whenever a visible label belongs with the control, which
 * is nearly always.
 */
const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Page URL',
    placeholder: 'https://example.com/checkout'
  }
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** `invalid` sets `aria-invalid`; the red border is the confirmation, never the message. */
export const Invalid: Story = {
  args: { invalid: true, 'aria-label': 'Page URL, invalid' }
}

export const Disabled: Story = {
  args: { disabled: true, 'aria-label': 'Page URL, unavailable' }
}
