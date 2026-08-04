import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { Callout, type CalloutVariant } from './callout.js'

const VARIANTS: readonly CalloutVariant[] = ['info', 'success', 'warning', 'danger']

/**
 * One shape per variant, not one colour. `icon` is required in the type for
 * the same reason `Badge`'s severity ramp pairs colour with a shape and a
 * label: colour alone does not survive protanopia, deuteranopia, or
 * forced-colors, where the tint backgrounds below all flatten to the same
 * system canvas.
 */
const ICONS: Record<CalloutVariant, ReactElement> = {
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="16" y2="12" />
      <line x1="12" x2="12.01" y1="8" y2="8" />
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  danger: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}

const meta = {
  title: 'Components/Callout',
  component: Callout,
  tags: ['autodocs'],
  args: {
    variant: 'info',
    icon: ICONS.info,
    title: 'That page took too long to respond',
    children: 'Try again in a minute. Nothing about the monitored page has changed.'
  },
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
    live: { control: 'inline-radio', options: [undefined, 'polite', 'assertive'] }
  }
} satisfies Meta<typeof Callout>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="lat-story__stack">
      {VARIANTS.map((variant) => (
        <Callout {...args} key={variant} variant={variant} icon={ICONS[variant]} title={`${variant} callout`}>
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
  render: ({ children }) => (
    <Callout variant="info" icon={ICONS.info}>
      {children}
    </Callout>
  )
}

/**
 * `live` is absent by default, and that is the point: a callout rendered on page
 * load with `role="alert"` is announced immediately and out of context, which is
 * worse than silence. Pass it only when the callout appears in response to
 * something the user did — as it would here.
 */
export const Announcing: Story = {
  args: {
    variant: 'success',
    icon: ICONS.success,
    live: 'polite',
    title: 'Audit complete',
    children: 'Score 84, up 3 since yesterday.'
  }
}
