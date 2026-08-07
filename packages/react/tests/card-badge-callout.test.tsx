import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Callout} from '../src/callout/callout.js';

const icon = <svg aria-hidden="true" />;

describe('Callout', () => {
  it('renders its children', () => {
    render(
      <Callout variant="danger" icon={icon}>
        That address cannot be audited.
      </Callout>,
    );

    expect(screen.getByText('That address cannot be audited.')).toBeDefined();
  });

  it('reflects the variant prop as data-variant', () => {
    const {container} = render(
      <Callout variant="warning" icon={icon}>
        Nearing the rate limit.
      </Callout>,
    );

    expect(container.querySelector('.lat-callout')?.getAttribute('data-variant')).toBe('warning');
  });

  it('renders the icon in a decorative, aria-hidden slot', () => {
    const {container} = render(
      <Callout variant="info" icon={<svg data-testid="callout-icon" />}>
        Score 84.
      </Callout>,
    );

    const slot = container.querySelector('.lat-callout__icon');
    expect(slot?.getAttribute('aria-hidden')).toBe('true');
    expect(slot?.querySelector('[data-testid="callout-icon"]')).not.toBeNull();
  });

  // A callout present on first render with role="alert" announces out of
  // context, which is worse than silence. The live role is opt-in.
  it('has no live role by default', () => {
    const {container} = render(
      <Callout variant="danger" icon={icon}>
        Audit failed.
      </Callout>,
    );
    const callout = container.querySelector('.lat-callout');

    expect(callout?.getAttribute('role')).toBeNull();
    expect(callout?.getAttribute('aria-live')).toBeNull();
  });

  it('takes role="status" when asked to announce politely', () => {
    render(
      <Callout variant="success" icon={icon} live="polite">
        Audit complete.
      </Callout>,
    );

    expect(screen.getByRole('status')).toBeDefined();
  });

  it('takes role="alert" when asked to announce assertively', () => {
    render(
      <Callout variant="danger" icon={icon} live="assertive">
        Audit failed.
      </Callout>,
    );

    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('renders its title as a heading before the body', () => {
    render(
      <Callout variant="danger" icon={icon} title="Rate limited">
        Try again in a minute.
      </Callout>,
    );

    expect(screen.getByText('Rate limited')).toBeDefined();
    expect(screen.getByText('Try again in a minute.')).toBeDefined();
  });
});
