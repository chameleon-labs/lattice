import type {Meta, StoryObj} from '@storybook/react-vite';
import {Menu, MenuButton, MenuItem, MenuProvider, MenuSeparator} from '../menu/menu.js';
import {Avatar} from './avatar.js';

const PORTRAIT = '/avatar-sample.jpg';

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

/**
 * As a menu trigger. `decorative` is what makes this work: the button supplies
 * the role and the name, and the avatar adds neither.
 *
 * The avatar is the button's *content*, not the button itself. Rendering it
 * *as* the trigger — `render={<Avatar />}` — does not work today: MenuButton
 * stamps `lat-button`, and its padding collapses the image to nothing. See
 * #86.
 */
export const AsAMenuTrigger: Story = {
  render: () => (
    <MenuProvider>
      <MenuButton aria-label="Account menu">
        <Avatar name="Ada Lovelace" src={PORTRAIT} size="sm" decorative />
      </MenuButton>
      <Menu>
        <MenuItem>Profile</MenuItem>
        <MenuItem>Settings</MenuItem>
        <MenuSeparator />
        <MenuItem>Sign out</MenuItem>
      </Menu>
    </MenuProvider>
  ),
};
