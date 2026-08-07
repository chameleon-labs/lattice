import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {Switch} from '../src/switch/switch.js';

describe('Switch', () => {
  it('exposes role="switch" rather than a checkbox', () => {
    render(<Switch aria-label="Monitoring" />);

    expect(screen.getByRole('switch', {name: 'Monitoring'})).toBeDefined();
  });

  it('reflects state through aria-checked', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Monitoring" />);
    const control = screen.getByRole('switch');

    expect(control.getAttribute('aria-checked')).toBe('false');

    await user.click(control);

    expect(control.getAttribute('aria-checked')).toBe('true');
  });

  it('is toggled by its associated label', async () => {
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="monitoring">Monitoring</label>
        <Switch id="monitoring" />
      </>,
    );

    await user.click(screen.getByText('Monitoring'));

    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('adds className rather than replacing it', () => {
    render(<Switch aria-label="Monitoring" className="mine" />);
    const control = screen.getByRole('switch');

    expect(control.classList.contains('lat-switch')).toBe(true);
    expect(control.classList.contains('mine')).toBe(true);
  });
});
