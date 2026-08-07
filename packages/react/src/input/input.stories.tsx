import type {Meta, StoryObj} from '@storybook/react-vite';
import {Input} from './input.js';

/**
 * A bare input, with no label of its own.
 *
 * Every story here passes `aria-label`, because an input without an accessible
 * name is an axe violation and the sweep would fail on it — correctly. Reach for
 * `TextField` instead whenever a visible label belongs with the control, which
 * is nearly always.
 */
const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Page URL',
    placeholder: 'https://example.com/checkout',
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** `invalid` sets `aria-invalid`; the red border is the confirmation, never the message. */
export const Invalid: Story = {
  args: {invalid: true, 'aria-label': 'Page URL, invalid'},
};

export const Disabled: Story = {
  args: {disabled: true, 'aria-label': 'Page URL, unavailable'},
};

/**
 * `addonStart` renders inside the same wrapper that carries the border and
 * the focus ring, so the icon sits inside the field rather than glued
 * beside it — focus the control and the highlight encloses the icon too.
 *
 * The icon carries `aria-hidden`: it is decorative, and the accessible name
 * still comes from `aria-label` alone.
 */
export const WithLeadingIcon: Story = {
  args: {
    'aria-label': 'Page URL',
    addonStart: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" x2="22" y1="12" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
};
