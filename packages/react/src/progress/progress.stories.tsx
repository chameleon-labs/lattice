import type { Meta, StoryObj } from '@storybook/react-vite'
import { Progress } from './progress.js'

/**
 * A determinate progress bar that cannot be rendered without a name, and whose
 * fill and `aria-valuenow` are computed from the same clamped number.
 *
 * There is no indeterminate variant — see the component's doc comment for why
 * the reduced-motion contract rules one out.
 */
const meta = {
  title: 'Components/Progress',
  component: Progress,
  tags: ['autodocs'],
  args: {
    label: 'Audit progress',
    value: 50
  }
} satisfies Meta<typeof Progress>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = { args: { value: 0 } }

export const Complete: Story = { args: { value: 100 } }

/**
 * `max` with `valueText`: the bar is four steps of six, and that is what gets
 * announced — "step 4 of 6" is more use to someone listening than "67%".
 */
export const Steps: Story = {
  args: {
    value: 4,
    max: 6,
    valueText: 'Step 4 of 6'
  }
}

/**
 * Out-of-range values are clamped rather than trusted, so a caller's off-by-one
 * cannot produce a bar wider than its track or a negative `aria-valuenow`.
 */
export const Clamped: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Progress label="Below the floor" value={-40} />
      <Progress label="Above the ceiling" value={180} />
    </div>
  )
}
