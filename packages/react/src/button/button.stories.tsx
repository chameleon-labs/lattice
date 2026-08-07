import type {Meta, StoryObj} from '@storybook/react-vite';
import {Button, type ButtonSize, type ButtonVariant} from './button.js';

// Declared as the union rather than as a literal array, so a variant added to
// the type without a story here becomes a type error instead of a silent gap in
// the accessibility sweep.
const VARIANTS: readonly ButtonVariant[] = ['primary', 'secondary', 'ghost', 'destructive', 'link'];
const SIZES: readonly ButtonSize[] = ['sm', 'md', 'lg'];

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Run audit',
  },
  argTypes: {
    variant: {control: 'inline-radio', options: VARIANTS},
    size: {control: 'inline-radio', options: SIZES},
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A single control, alone in its frame.
 *
 * `tests/browser/a11y.spec.ts` tabs into this story to prove the focus ring is
 * visible, and reads its border under forced-colors. Both assertions used to run
 * against whatever happened to come first on the shared demo page.
 */
export const Default: Story = {};

/**
 * Lattice's five variants, side by side, plus the disabled state each one
 * loses its identity to. `tests/browser/base.spec.ts` navigates here directly.
 */
export const Variants: Story = {
  render: (args) => (
    <div className="lat-story__stack">
      <div className="lat-story__row">
        {VARIANTS.map((variant) => (
          <Button {...args} key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
      <div className="lat-story__row">
        {VARIANTS.map((variant) => (
          <Button {...args} key={variant} variant={variant} disabled>
            {variant}
          </Button>
        ))}
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="lat-story__row">
      {SIZES.map((size) => (
        <Button {...args} key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};

/**
 * Disabled is a story rather than a control knob.
 *
 * A knob state is not in Storybook's index, so the sweep would never visit it —
 * and a disabled control is exactly where contrast quietly fails.
 */
export const Disabled: Story = {
  args: {disabled: true, children: 'Unavailable'},
};

/** `render` swaps the element without losing the appearance or the behaviour. */
export const AsLink: Story = {
  args: {children: 'Open the report'},
  render: (args) => <Button {...args} render={<a href="#story" />} />,
};
