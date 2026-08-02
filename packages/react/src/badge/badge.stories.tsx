import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge, type BadgeTone } from './badge.js'

const SEMANTIC: readonly BadgeTone[] = ['neutral', 'accent', 'success', 'warning', 'danger']
const SEVERITY: readonly BadgeTone[] = ['critical', 'serious', 'moderate', 'minor']

/**
 * `children` is required rather than optional, which is the whole guarantee: a
 * badge that signalled by colour alone cannot be written. Every story here
 * carries text for that reason, not as a convenience.
 */
const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    children: 'Passing'
  },
  argTypes: {
    tone: { control: 'select', options: [...SEMANTIC, ...SEVERITY] }
  }
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SemanticTones: Story = {
  render: (args) => (
    <div className="lat-story__row">
      {SEMANTIC.map((tone) => (
        <Badge {...args} key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  )
}

/**
 * The severity names exist so an axe impact string can be passed straight
 * through — `<Badge tone={violation.impact}>` — rather than maintaining a
 * mapping that could drift from the ramp the token system already publishes.
 *
 * Severity is a 3:1 *mark* contract rather than a text contract, which is why it
 * reads as a border rather than as a fill.
 */
export const SeverityTones: Story = {
  render: (args) => (
    <div className="lat-story__row">
      {SEVERITY.map((tone) => (
        <Badge {...args} key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  )
}
