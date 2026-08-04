import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stat } from './stat.js'

/**
 * A value, a label and an optional sub-label, with the numeric role's tabular
 * figures applied to the value so a row of stats does not jitter sideways as
 * the numbers change.
 */
const meta = {
  title: 'Components/Stat',
  component: Stat,
  tags: ['autodocs'],
  args: {
    value: '84',
    label: 'Components'
  }
} satisfies Meta<typeof Stat>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithSub: Story = {
  args: {
    value: '84',
    label: 'Components',
    sub: 'production-ready'
  }
}

/**
 * The guarantee made visible: three stats of different widths, laid out in a
 * row. Tabular figures keep the baseline aligned even though the digit counts
 * differ.
 */
export const Row: Story = {
  render: () => (
    <div className="lat-story__row">
      <Stat value="84" label="Components" sub="production-ready" />
      <Stat value="14" label="Families" sub="phase 2" />
      <Stat value="1,204" label="Audits run" />
    </div>
  )
}
