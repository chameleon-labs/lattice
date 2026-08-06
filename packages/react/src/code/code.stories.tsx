import type { Meta, StoryObj } from '@storybook/react-vite'
import { Code } from './code.js'

/**
 * A code fragment inside running text. `CodeBlock` is the standalone,
 * copyable listing; this is the one that has to flow with the sentence.
 */
const meta = {
  title: 'Components/Code',
  component: Code,
  tags: ['autodocs'],
  args: {
    children: 'color-contrast'
  }
} satisfies Meta<typeof Code>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * The case the component exists for. A CSS selector is a single unbreakable
 * token, so inside a narrow column it would push the page wider than the
 * viewport — here it wraps instead.
 */
export const LongSelector: Story = {
  render: () => (
    <p style={{ maxWidth: '16rem' }}>
      The rule fired on{' '}
      <Code>div.iana-header &gt; a.more-link:not([aria-hidden]) span.label</Code> and four other
      elements.
    </p>
  )
}

/**
 * In a sentence, at the size the surrounding prose sets — the mono role is a
 * relative size, so a fragment never towers over the text it sits in.
 */
export const InProse: Story = {
  render: () => (
    <p>
      Set <Code>lang</Code> on the <Code>&lt;html&gt;</Code> element, then re-run the audit.
    </p>
  )
}
