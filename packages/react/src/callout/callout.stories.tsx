import type { Meta, StoryObj } from '@storybook/react-vite'
import { Callout, type CalloutTone } from './callout.js'

const TONES: readonly CalloutTone[] = ['neutral', 'accent', 'success', 'warning', 'danger']

const meta = {
  title: 'Components/Callout',
  component: Callout,
  tags: ['autodocs'],
  args: {
    title: 'That page took too long to respond',
    children: 'Try again in a minute. Nothing about the monitored page has changed.'
  },
  argTypes: {
    tone: { control: 'inline-radio', options: TONES },
    live: { control: 'inline-radio', options: [undefined, 'polite', 'assertive'] }
  }
} satisfies Meta<typeof Callout>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Tones: Story = {
  render: (args) => (
    <div className="lat-story__stack">
      {TONES.map((tone) => (
        <Callout {...args} key={tone} tone={tone} title={`${tone} callout`}>
          Try again in a minute. Nothing about the monitored page has changed.
        </Callout>
      ))}
    </div>
  )
}

/**
 * The title is optional; the body is not.
 *
 * Written as a `render` rather than as `args: { title: undefined }`, because
 * `exactOptionalPropertyTypes` is on: an optional property may be absent, but it
 * may not be explicitly `undefined`.
 */
export const WithoutTitle: Story = {
  render: ({ children }) => <Callout tone="accent">{children}</Callout>
}

/**
 * `live` is absent by default, and that is the point: a callout rendered on page
 * load with `role="alert"` is announced immediately and out of context, which is
 * worse than silence. Pass it only when the callout appears in response to
 * something the user did — as it would here.
 */
export const Announcing: Story = {
  args: {
    tone: 'success',
    live: 'polite',
    title: 'Audit complete',
    children: 'Score 84, up 3 since yesterday.'
  }
}
