import type { Meta, StoryObj } from '@storybook/react-vite'
import { Eyebrow } from './eyebrow.js'

/**
 * The uppercase 10px mono label at 0.2em tracking. It appears on every
 * section head, panel header and column in both Meridian demos, and exists so
 * that tracking value has exactly one home — a value repeated across a dozen
 * stylesheets is a value that drifts.
 */
const meta = {
  title: 'Components/Eyebrow',
  component: Eyebrow,
  tags: ['autodocs'],
  args: {
    children: 'Coverage'
  }
} satisfies Meta<typeof Eyebrow>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * The landing page's section labels — a short hairline drawn before the text,
 * not a border on the component itself, so it never fights a header row's
 * own bottom border.
 */
export const WithRule: Story = {
  args: {
    rule: true,
    children: 'Section'
  }
}
