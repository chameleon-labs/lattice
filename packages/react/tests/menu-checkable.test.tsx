import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {
  Menu,
  MenuButton,
  MenuGroup,
  MenuGroupLabel,
  MenuItemCheckbox,
  MenuItemRadio,
  MenuProvider,
} from '../src/menu/menu.js';

const setup = () =>
  render(
    <MenuProvider defaultOpen defaultValues={{theme: 'system', density: [] as string[]}}>
      <MenuButton>Preferences</MenuButton>
      <Menu>
        <MenuGroup>
          <MenuGroupLabel>Theme</MenuGroupLabel>
          <MenuItemRadio name="theme" value="system">
            Match system
          </MenuItemRadio>
          <MenuItemRadio name="theme" value="dark">
            Dark
          </MenuItemRadio>
        </MenuGroup>
        <MenuItemCheckbox name="density" value="compact">
          Compact rows
        </MenuItemCheckbox>
      </Menu>
    </MenuProvider>,
  );

describe('a checkable menu item', () => {
  it('carries its role without the call site supplying one', () => {
    setup();

    expect(screen.getAllByRole('menuitemradio')).toHaveLength(2);
    expect(screen.getByRole('menuitemcheckbox', {name: 'Compact rows'})).toBeTruthy();
  });

  it('announces the checked state, so it is never only visual', () => {
    setup();

    expect(screen.getByRole('menuitemradio', {name: 'Match system'}).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('menuitemradio', {name: 'Dark'}).getAttribute('aria-checked')).toBe('false');
  });

  it('moves the selection exclusively', async () => {
    setup();

    await userEvent.click(screen.getByRole('menuitemradio', {name: 'Dark'}));

    expect(screen.getByRole('menuitemradio', {name: 'Dark'}).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('menuitemradio', {name: 'Match system'}).getAttribute('aria-checked')).toBe('false');
  });

  it('does not dismiss the menu when a choice is made', async () => {
    setup();

    await userEvent.click(screen.getByRole('menuitemradio', {name: 'Dark'}));

    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('toggles a checkbox rather than selecting exclusively', async () => {
    setup();
    const compact = screen.getByRole('menuitemcheckbox', {name: 'Compact rows'});

    await userEvent.click(compact);
    expect(screen.getByRole('menuitemcheckbox', {name: 'Compact rows'}).getAttribute('aria-checked')).toBe('true');

    await userEvent.click(screen.getByRole('menuitemcheckbox', {name: 'Compact rows'}));
    expect(screen.getByRole('menuitemcheckbox', {name: 'Compact rows'}).getAttribute('aria-checked')).toBe('false');
  });

  it('names the group from its label', () => {
    setup();

    expect(screen.getByRole('group', {name: 'Theme'})).toBeTruthy();
  });
});
