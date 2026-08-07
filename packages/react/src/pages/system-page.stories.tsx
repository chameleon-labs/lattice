import type {Meta, StoryObj} from '@storybook/react-vite';
import {SystemPage} from './system-page.js';

/**
 * The bundle's documentation site, rebuilt from Lattice components alone.
 *
 * This is an acceptance test rather than a demo. Anything this page needs that
 * the library cannot express is a gap in the library — see the gap list in
 * docs/superpowers/plans/2026-08-03-lattice-proof.md Task 4.
 */
const meta = {
  title: 'Pages/System',
  component: SystemPage,
  parameters: {layout: 'fullscreen'},
} satisfies Meta<typeof SystemPage>;

export default meta;

export const Dark: StoryObj<typeof meta> = {globals: {theme: 'dark'}};
export const Light: StoryObj<typeof meta> = {globals: {theme: 'light'}};
