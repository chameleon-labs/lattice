import type {Meta, StoryObj} from '@storybook/react-vite';
import {useState} from 'react';
import {TextField} from '../text-field/text-field.js';
import {AddonButton} from './addon-button.js';

const EyeIcon = (): React.JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (): React.JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7c2 0 3.8.7 5.3 1.6M22 12s-3.6 7-10 7c-2 0-3.8-.7-5.3-1.6" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);

function PasswordToggleExample(): React.JSX.Element {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label="Password"
      type={visible ? 'text' : 'password'}
      defaultValue="correct-horse-battery"
      addonEnd={
        <AddonButton
          label={visible ? 'Hide password' : 'Show password'}
          onClick={() => {
            setVisible((shown) => !shown);
          }}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </AddonButton>
      }
    />
  );
}

const meta = {
  title: 'Components/AddonButton',
  component: AddonButton,
  tags: ['autodocs'],
  args: {
    label: 'Show password',
    children: <EyeIcon />,
  },
} satisfies Meta<typeof AddonButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {disabled: true},
};

/** The icon steps with the size; the pressable box never drops below 24px. */
export const Sizes: Story = {
  render: () => (
    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <AddonButton key={size} size={size} label={`Show password, ${size}`}>
          <EyeIcon />
        </AddonButton>
      ))}
    </div>
  ),
};

/**
 * The case this exists for. The toggle swaps its icon *and* its name, so the
 * change reaches a screen reader rather than only the eye.
 */
export const PasswordToggle: Story = {
  render: () => <PasswordToggleExample />,
};
