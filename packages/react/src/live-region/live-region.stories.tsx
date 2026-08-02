import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../button/button.js'
import { LiveRegion } from './live-region.js'

/**
 * An announcement that does not repeat itself.
 *
 * A live region updated on every poll is unusable — itself the kind of bug this
 * system exists to prevent. The component holds the last announced string and
 * leaves the DOM untouched when the new one matches.
 *
 * The region renders empty from the first paint rather than being inserted when
 * the first message arrives: assistive technology has to be observing the
 * container *before* the content changes, or the announcement is not reliably
 * read.
 */
const meta = {
  title: 'Components/LiveRegion',
  component: LiveRegion,
  tags: ['autodocs'],
  args: {
    message: 'Running the accessibility engine — this usually takes about 30 seconds.'
  }
} satisfies Meta<typeof LiveRegion>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Renders as text so the story shows something. In production the region is
 * usually visually hidden — it has no appearance of its own.
 */
export const Default: Story = {}

/**
 * `assertive` interrupts whatever the user is currently hearing. It is a last
 * resort, which is why `polite` is the default.
 */
export const Assertive: Story = {
  args: {
    politeness: 'assertive',
    message: "We couldn't reach that page. The audit was not started."
  }
}

/**
 * The guarantee, made visible: press the button repeatedly and the region is
 * written once. Only a *changed* message reaches the DOM.
 */
export const RepeatedMessage: Story = {
  render: function RepeatedMessageStory(args) {
    const [count, setCount] = useState(0)

    return (
      <div className="lat-story__stack">
        <Button onClick={() => setCount((value) => value + 1)}>
          Re-send the same message ({count})
        </Button>
        <LiveRegion {...args} />
      </div>
    )
  }
}
