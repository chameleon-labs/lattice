import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Badge} from '../src/badge/badge.js';

describe('Badge', () => {
  it('defaults to the default variant', () => {
    render(<Badge>beta</Badge>);
    expect(screen.getByText('beta').dataset['variant']).toBe('default');
  });

  it('accepts every Lattice variant', () => {
    for (const variant of ['default', 'primary', 'info', 'success', 'danger', 'warning'] as const) {
      const {unmount} = render(<Badge variant={variant}>x</Badge>);
      expect(screen.getByText('x').dataset['variant']).toBe(variant);
      unmount();
    }
  });

  // The severity ramp gets its own variants rather than borrowing a
  // chromatic scale — moderate is amber (hue 84), and the nearest available
  // scale, info, is blue (hue 232), which would break both the ramp's hue
  // ordering and the lightness safety net the severity tokens are built on.
  it('accepts every severity level as its own variant', () => {
    for (const variant of ['critical', 'serious', 'moderate', 'minor'] as const) {
      const {unmount} = render(<Badge variant={variant}>x</Badge>);
      expect(screen.getByText('x').dataset['variant']).toBe(variant);
      unmount();
    }
  });

  it('no longer accepts a tone', () => {
    // @ts-expect-error tone was removed with BadgeTone; variant replaces it
    render(<Badge tone="critical">critical</Badge>);
    expect(screen.getByText('critical').dataset['tone']).toBeUndefined();
  });

  // The guarantee: text always accompanies colour. `children` is required in
  // the type, so a colour-only badge cannot be written.
  it('always carries text alongside its colour', () => {
    render(<Badge variant="danger">3 serious</Badge>);

    expect(screen.getByText('3 serious').textContent).not.toBe('');
  });

  it('adds className rather than replacing it', () => {
    render(<Badge className="mine">paused</Badge>);
    const badge = screen.getByText('paused');

    expect(badge.classList.contains('lat-badge')).toBe(true);
    expect(badge.classList.contains('mine')).toBe(true);
  });
});
