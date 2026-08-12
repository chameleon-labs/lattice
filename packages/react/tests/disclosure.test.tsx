import {render, screen, waitFor} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {Disclosure, DisclosureContent, DisclosureProvider} from '../src/disclosure/disclosure.js';

describe('Disclosure', () => {
  const setup = () =>
    render(
      <DisclosureProvider>
        <Disclosure>Affected nodes</Disclosure>
        <DisclosureContent>
          <p>Three nodes</p>
        </DisclosureContent>
      </DisclosureProvider>,
    );

  // Ariakit keeps the content mounted and marks it `hidden` rather than
  // unmounting it. `hidden` removes it from the accessibility tree and from the
  // layout, which is what matters here — and a stable DOM is what lets the
  // content animate open without measuring twice.
  const content = () => {
    const id = screen.getByRole('button', {name: 'Affected nodes'}).getAttribute('aria-controls');
    const element = id === null ? null : document.getElementById(id);
    if (element === null) {
      throw new Error('disclosure content was never rendered');
    }
    return element;
  };

  it('starts collapsed, with aria-expanded false and the content hidden', () => {
    setup();

    expect(screen.getByRole('button', {name: 'Affected nodes'}).getAttribute('aria-expanded')).toBe('false');
    expect(content().hasAttribute('hidden')).toBe(true);
  });

  it('toggles aria-expanded and the content together', async () => {
    const user = userEvent.setup();
    setup();
    const trigger = screen.getByRole('button', {name: 'Affected nodes'});

    await user.click(trigger);

    // Ariakit flushes its state asynchronously, so the attribute change lands
    // after the click resolves rather than with it.
    await waitFor(() => {
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(content().hasAttribute('hidden')).toBe(false);
    });

    await user.click(trigger);

    await waitFor(() => {
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(content().hasAttribute('hidden')).toBe(true);
    });
  });

  it('is a real button, not a clickable div', () => {
    setup();

    expect(screen.getByRole('button', {name: 'Affected nodes'}).tagName).toBe('BUTTON');
  });
});

describe('Disclosure chrome', () => {
  it('stamps its own appearance by default', () => {
    render(
      <DisclosureProvider>
        <Disclosure>Affected nodes</Disclosure>
      </DisclosureProvider>,
    );

    expect(screen.getByRole('button', {name: 'Affected nodes'}).className).toBe('lat-disclosure');
  });

  it('omits it when bare, for a whole row that expands', () => {
    render(
      <DisclosureProvider>
        <Disclosure bare className="row">
          Affected nodes
        </Disclosure>
      </DisclosureProvider>,
    );

    expect(screen.getByRole('button', {name: 'Affected nodes'}).className).toBe('row');
  });
});
