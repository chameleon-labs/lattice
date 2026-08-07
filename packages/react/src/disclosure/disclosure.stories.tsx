import type {Meta, StoryObj} from '@storybook/react-vite';
import {Disclosure, DisclosureContent, DisclosureProvider} from './disclosure.js';

/**
 * A real `<button>` carrying `aria-expanded`, paired with its content — not a
 * clickable div.
 */
const meta = {
  title: 'Components/Disclosure',
  component: Disclosure,
  tags: ['autodocs'],
} satisfies Meta<typeof Disclosure>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  render: () => (
    <DisclosureProvider>
      <Disclosure>Affected nodes</Disclosure>
      <DisclosureContent>
        <p>Three nodes match this rule.</p>
      </DisclosureContent>
    </DisclosureProvider>
  ),
};

/** Expanded on arrival, so the sweep scans the content rather than only the trigger. */
export const Expanded: Story = {
  render: () => (
    <DisclosureProvider defaultOpen>
      <Disclosure>Affected nodes</Disclosure>
      <DisclosureContent>
        <p>Three nodes match this rule.</p>
      </DisclosureContent>
    </DisclosureProvider>
  ),
};
