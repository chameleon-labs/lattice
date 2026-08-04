import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { Badge, type BadgeVariant } from './badge.js'

const VARIANTS: readonly BadgeVariant[] = ['default', 'primary', 'info', 'success', 'danger', 'warning']

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
    variant: { control: 'select', options: VARIANTS }
  }
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="lat-story__row">
      {VARIANTS.map((variant) => (
        <Badge {...args} key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  )
}

/**
 * Impact severity, as used by the landing page's `ImpactBadge` (an axe impact
 * string threaded straight into `variant`, plus an icon and a label — not a
 * separate component). `critical` / `serious` / `moderate` / `minor` are
 * their own variants, not a mapping onto the six chromatic ones above: the
 * severity ramp has its own tint tokens because there is no chromatic scale
 * at `moderate`'s hue (84, amber) to borrow — the nearest candidate, `info`,
 * is blue (hue 232), which would break both the ramp's hue ordering and the
 * lightness ordering the severity tokens are built on as the safety net for
 * when hue fails.
 *
 * Colour never carries severity alone: every entry below pairs its tint with
 * both an icon *and* a text label, so the ramp stays legible under
 * protanopia and deuteranopia, where these hues are hardest to tell apart.
 */
const SEVERITY: ReadonlyArray<{ level: BadgeVariant; icon: ReactElement }> = [
  {
    level: 'critical',
    icon: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
    )
  },
  {
    level: 'serious',
    icon: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    )
  },
  {
    level: 'moderate',
    icon: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
    )
  },
  {
    level: 'minor',
    icon: (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    )
  }
]

export const Impact: Story = {
  render: (args) => (
    <div className="lat-story__row">
      {SEVERITY.map(({ level, icon }) => (
        <Badge {...args} key={level} variant={level}>
          {icon}
          {level}
        </Badge>
      ))}
    </div>
  )
}
