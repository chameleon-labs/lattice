import type {Meta, StoryObj} from '@storybook/react-vite';
import {Avatar} from './avatar.js';

const PORTRAIT = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23cff23a"/><circle cx="32" cy="25" r="12" fill="%230c0c14"/><path d="M8 64c0-14 11-22 24-22s24 8 24 22z" fill="%230c0c14"/></svg>',
)}`;

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {name: 'Ada Lovelace'},
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {src: PORTRAIT},
};

export const Initials: Story = {};

/** The case this exists for: a `src` that never paints falls back rather than showing a broken image. */
export const BrokenImage: Story = {
  args: {src: '/avatar-that-does-not-exist.png'},
};

export const Sizes: Story = {
  render: () => (
    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Avatar key={size} size={size} name={`Ada Lovelace ${size}`} />
      ))}
    </div>
  ),
};

/** Beside a visible name the avatar is decorative, so the person is announced once. */
export const BesideAName: Story = {
  render: () => (
    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
      <Avatar name="Ada Lovelace" decorative />
      <span>Ada Lovelace</span>
    </div>
  ),
};
