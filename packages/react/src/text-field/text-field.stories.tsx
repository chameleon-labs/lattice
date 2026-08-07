import type {Meta, StoryObj} from '@storybook/react-vite';
import {TextField} from './text-field.js';

/**
 * The wiring between a label, its description and its error is not hard — it is
 * *invisible*. A missing `aria-describedby` looks identical in review to a
 * present one, so these stories exist mostly to give the sweep something to
 * check that wiring against.
 */
const meta = {
  title: 'Components/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: {
    label: 'Page URL',
    placeholder: 'https://example.com/checkout',
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {description: 'We audit the page at this address.'},
};

/** `error` sets `aria-invalid` on the input and points `aria-describedby` at the message. */
export const WithError: Story = {
  args: {error: "That address can't be audited."},
};

/**
 * Both at once, which is the case worth rendering: `aria-describedby` has to
 * name two ids in order, and an empty one would be worse than none at all.
 */
export const WithDescriptionAndError: Story = {
  args: {
    description: 'We audit the page at this address.',
    error: "That address can't be audited.",
  },
};

export const Disabled: Story = {
  args: {disabled: true},
};
