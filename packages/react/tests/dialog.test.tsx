import {render, screen, waitFor} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {Dialog, DialogDisclosure, DialogDismiss, DialogHeading, DialogProvider} from '../src/dialog/dialog.js';

const setup = () =>
  render(
    <DialogProvider>
      <DialogDisclosure>Remove page</DialogDisclosure>
      <Dialog>
        <DialogHeading>Remove this page?</DialogHeading>
        <p>This cannot be undone.</p>
        <DialogDismiss>Cancel</DialogDismiss>
      </Dialog>
    </DialogProvider>,
  );

describe('Dialog', () => {
  it('is closed until its disclosure is pressed', () => {
    setup();

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens as a dialog named by its heading', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', {name: 'Remove page'}));

    await screen.findByRole('dialog');

    // The heading names the dialog, so the accessible name is not left to the
    // first text node the browser happens to find. Ariakit marks the rest of
    // the document inert through a portal rather than setting aria-modal, which
    // is the stronger of the two mechanisms.
    expect(screen.getByRole('dialog', {name: 'Remove this page?'})).toBeDefined();
  });

  it('closes on dismiss', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', {name: 'Remove page'}));
    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', {name: 'Cancel'}));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', {name: 'Remove page'}));
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('moves focus into the dialog when it opens', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', {name: 'Remove page'}));
    const dialog = await screen.findByRole('dialog');

    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  // Regression: the trigger used to carry `data-variant="soft"` and
  // `data-tone="accent"`, neither of which button.css has a rule for, so the
  // trigger rendered unstyled. `secondary` is the variant button.css defines.
  it('renders its trigger with a variant button.css actually styles', () => {
    setup();

    const trigger = screen.getByRole('button', {name: 'Remove page'});

    expect(trigger.className).toContain('lat-button');
    expect(trigger.dataset.variant).toBe('secondary');
    expect(trigger.dataset.tone).toBeUndefined();
  });
});

// Focus *return* is asserted in tests/browser/a11y.spec.ts, not here. Ariakit
// restores focus using real layout and animation frames, which jsdom does not
// provide — under jsdom focus simply stays on the dismiss button. A jsdom test
// of it would either fail for the wrong reason or be weakened until it proved
// nothing.

describe('DialogDisclosure chrome', () => {
  it('stamps the button appearance by default', () => {
    render(
      <DialogProvider>
        <DialogDisclosure>Open</DialogDisclosure>
      </DialogProvider>,
    );
    const trigger = screen.getByRole('button', {name: 'Open'});

    expect(trigger.className).toBe('lat-button');
    expect(trigger.getAttribute('data-variant')).toBe('secondary');
  });

  it('omits it entirely when bare, so a trigger keeps its own geometry', () => {
    render(
      <DialogProvider>
        <DialogDisclosure bare aria-label="Open" className="mine" />
      </DialogProvider>,
    );
    const trigger = screen.getByRole('button', {name: 'Open'});

    expect(trigger.className).toBe('mine');
    expect(trigger.hasAttribute('data-variant')).toBe(false);
    expect(trigger.hasAttribute('data-size')).toBe(false);
  });
});
