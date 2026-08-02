import type { Meta, StoryObj } from '@storybook/react-vite'
import { Menu, MenuButton, MenuItem, MenuProvider, MenuSeparator } from './menu.js'

/**
 * Ariakit supplies roving focus, typeahead and focus return; Lattice supplies
 * the surface, which uses the `overlay` elevation role.
 *
 * Only the parts a real screen uses are wrapped. Ariakit's remaining menu parts
 * are available from `@ariakit/react` but are deliberately not re-exported: an
 * unstyled part arriving through this package would look like a system component
 * and behave like an unfinished one.
 */
const meta = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs']
} satisfies Meta<typeof Menu>

export default meta

type Story = StoryObj<typeof meta>

function Items() {
  return (
    <>
      <MenuItem>Pause monitoring</MenuItem>
      <MenuItem>Copy link</MenuItem>
      <MenuSeparator />
      <MenuItem>Remove page</MenuItem>
    </>
  )
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
  )
}

/** Open on arrival, so the sweep scans the menu surface rather than only its button. */
export const Open: Story = {
  render: () => (
    <MenuProvider defaultOpen>
      <MenuButton>Actions</MenuButton>
      <Menu>
        <Items />
      </Menu>
    </MenuProvider>
  )
}
