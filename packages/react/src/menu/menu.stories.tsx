import type {Meta, StoryObj} from '@storybook/react-vite';
import {
  Menu,
  MenuButton,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuItemCheckbox,
  MenuItemRadio,
  MenuProvider,
  MenuSeparator,
} from './menu.js';

/**
 * Ariakit supplies roving focus, typeahead and focus return; Lattice supplies
 * the surface, which uses the `overlay` elevation role.
 *
 * A part is wrapped when leaving it out would push semantics onto the call site —
 * which is why the checkable item and the group are here. Ariakit's remaining
 * parts stay available from `@ariakit/react` and unwrapped: an unstyled part
 * arriving through this package would look like a system component and behave
 * like an unfinished one.
 */
const meta = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

function Items(): React.JSX.Element {
  return (
    <>
      <MenuItem>Pause monitoring</MenuItem>
      <MenuItem>Copy link</MenuItem>
      <MenuSeparator />
      <MenuItem>Remove page</MenuItem>
    </>
  );
}

/** `tests/browser/a11y.spec.ts` opens this one and asserts focus returns on Escape. */
export const Closed: Story = {
  render: () => (
    <MenuProvider>
      <MenuButton>Actions</MenuButton>
      <Menu>
        <Items />
      </Menu>
    </MenuProvider>
  ),
};

/** Open on arrival, so the sweep scans the menu surface rather than only its button. */
export const Open: Story = {
  render: () => (
    <MenuProvider defaultOpen>
      <MenuButton>Actions</MenuButton>
      <Menu>
        <Items />
      </Menu>
    </MenuProvider>
  ),
};

/**
 * A choice inside a menu. The role and `aria-checked` come from
 * `MenuItemRadio`, and `MenuGroupLabel` names the group — none of it is the
 * call site's to remember.
 */
export const Choices: Story = {
  render: () => (
    <MenuProvider defaultOpen defaultValues={{theme: 'system'}}>
      <MenuButton>Preferences</MenuButton>
      <Menu>
        <MenuGroup>
          <MenuGroupLabel>Theme</MenuGroupLabel>
          <MenuItemRadio name="theme" value="system">
            Match system
          </MenuItemRadio>
          <MenuItemRadio name="theme" value="light">
            Light
          </MenuItemRadio>
          <MenuItemRadio name="theme" value="dark">
            Dark
          </MenuItemRadio>
        </MenuGroup>
        <MenuSeparator />
        <MenuItemCheckbox name="density" value="compact">
          Compact rows
        </MenuItemCheckbox>
      </Menu>
    </MenuProvider>
  ),
};
