import type { Meta, StoryObj } from '@storybook/react-vite'
import { CodeBlock } from './code-block.js'

/**
 * A mono block with a copy control. Meridian's own bundled version swaps a
 * clipboard icon for a tick and says nothing — a change invisible to a screen
 * reader. This one announces the result in a live region as well as changing
 * the icon.
 *
 * The copy control is visible on hover *and* on keyboard focus: it never
 * relies on hover alone, which does not exist for a keyboard user.
 */
const meta = {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  args: {
    code: '--lat-solid'
  }
} satisfies Meta<typeof CodeBlock>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const MultilineCode: Story = {
  args: {
    code: '.lat-badge {\n  background: var(--lat-wash);\n  border: 1px solid var(--lat-border);\n}'
  }
}

export const CustomCopyLabel: Story = {
  args: {
    code: '@chameleon-labs/lattice-react',
    copyLabel: 'Copy package name'
  }
}
