import {render, screen, waitFor} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {Menu, MenuButton, MenuItem, MenuProvider, MenuSeparator} from '../src/menu/menu.js';

const setup = () =>
  render(
    <MenuProvider>
      <MenuButton>Actions</MenuButton>
      <Menu>
        <MenuItem>Pause monitoring</MenuItem>
        <MenuItem>Copy link</MenuItem>
        <MenuSeparator />
        <MenuItem>Remove page</MenuItem>
      </Menu>
    </MenuProvider>,
  );

describe('Menu', () => {
  it('is closed until its button is pressed', () => {
    setup();

    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('opens a menu of menuitems', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', {name: 'Actions'}));

    await screen.findByRole('menu');
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('marks the button as expanded while open', async () => {
    const user = userEvent.setup();
    setup();
    const button = screen.getByRole('button', {name: 'Actions'});

    expect(button.getAttribute('aria-expanded')).toBe('false');

    await user.click(button);

    await waitFor(() => {
      expect(button.getAttribute('aria-expanded')).toBe('true');
    });
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', {name: 'Actions'}));
    await screen.findByRole('menu');

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
  });

  // Focus return is asserted in the browser suite, for the reason recorded in
  // tests/dialog.test.tsx: jsdom does not restore focus the way a real engine
  // does.

  it('gives the separator a presentational role rather than a menuitem one', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', {name: 'Actions'}));
    await screen.findByRole('menu');

    expect(screen.getByRole('separator')).toBeDefined();
  });

  // Regression: the trigger used to carry `data-variant="soft"` and
  // `data-tone="accent"`, neither of which button.css has a rule for, so the
  // trigger rendered unstyled. `secondary` is the variant button.css defines.
  it('renders its button with a variant button.css actually styles', () => {
    setup();

    const trigger = screen.getByRole('button', {name: 'Actions'});

    expect(trigger.className).toContain('lat-button');
    expect(trigger.dataset.variant).toBe('secondary');
    expect(trigger.dataset.tone).toBeUndefined();
  });
});
