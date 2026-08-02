import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input, type InputSize } from './input.js'

const SIZES: readonly InputSize[] = ['sm', 'md', 'lg']

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
  },
  argTypes: {
    size: { control: 'inline-radio', options: SIZES }
  }
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Sizes: Story = {
  render: (args) => (
    <div className="lat-story__stack">
      {SIZES.map((size) => (
        <Input {...args} key={size} size={size} aria-label={`Page URL ${size}`} />
      ))}
    </div>
  )
}

/** `invalid` sets `aria-invalid`; the red is the confirmation, never the message. */
export const Invalid: Story = {
  args: { invalid: true, 'aria-label': 'Page URL, invalid' }
}

export const Disabled: Story = {
  args: { disabled: true, 'aria-label': 'Page URL, unavailable' }
}
