import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Stat} from '../src/stat/stat.js';

describe('Stat', () => {
  it('renders value, label and sub', () => {
    render(<Stat value="84" label="Components" sub="production-ready" />);
    expect(screen.getByText('84').textContent).toBe('84');
    expect(screen.getByText('Components').textContent).toBe('Components');
    expect(screen.getByText('production-ready').textContent).toBe('production-ready');
  });

  it('gives the value tabular figures so a row does not jitter', () => {
    render(<Stat value="84" label="Components" />);
    expect(screen.getByText('84').classList.contains('lat-stat__value')).toBe(true);
  });
});
