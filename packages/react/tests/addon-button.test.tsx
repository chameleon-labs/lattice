import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {AddonButton} from '../src/addon-button/addon-button.js';

const Icon = (): React.JSX.Element => <svg aria-hidden="true" viewBox="0 0 24 24" />;

describe('AddonButton', () => {
  it('names itself from label', () => {
    render(
      <AddonButton label="Show password">
        <Icon />
      </AddonButton>,
    );

    expect(screen.getByRole('button', {name: 'Show password'})).toBeTruthy();
  });

  it('is type=button, so it never submits the form it sits in', () => {
    render(
      <AddonButton label="Show password">
        <Icon />
      </AddonButton>,
    );

    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });

  it('keeps its tab stop when disabled', () => {
    render(
      <AddonButton label="Show password" disabled>
        <Icon />
      </AddonButton>,
    );
    const button = screen.getByRole('button', {name: 'Show password'});

    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('defaults to the md size', () => {
    render(
      <AddonButton label="Show password">
        <Icon />
      </AddonButton>,
    );

    expect(screen.getByRole('button').getAttribute('data-size')).toBe('md');
  });

  it('prepends className rather than replacing it', () => {
    render(
      <AddonButton label="Show password" className="mine">
        <Icon />
      </AddonButton>,
    );

    expect(screen.getByRole('button').className).toBe('lat-addon-button mine');
  });
});
