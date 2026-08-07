import {describe, expect, it} from 'vitest';

import {DURATIONS, EASINGS} from '../config/motion.js';
import {MOTION_PRIMITIVE_COUNT, MOTION_PRIMITIVE_COUNTS, motionCss, motionTokens} from '../generate/motion.js';

describe('motion primitive contracts', () => {
  it('carries the exact five-duration scale', () => {
    expect(DURATIONS).toEqual({
      instant: 0,
      swift: 100,
      default: 200,
      deliberate: 350,
      expressive: 500,
    });
  });

  it('keeps every duration finite and non-negative', () => {
    const values = Object.values(DURATIONS);

    expect(values).toHaveLength(5);
    expect(values.every(Number.isFinite)).toBe(true);
    expect(values.every((value) => value >= 0)).toBe(true);
    expect(Math.max(...values)).toBe(500);
  });

  it('carries the exact two easing curves', () => {
    expect(EASINGS).toEqual({
      out: [0, 0, 0.2, 1],
      'in-out': [0.4, 0, 0.2, 1],
    });
  });

  it('keeps every easing finite, four-component and inside the approved range', () => {
    for (const [name, curve] of Object.entries(EASINGS)) {
      expect(curve, name).toHaveLength(4);
      expect(curve.every(Number.isFinite), name).toBe(true);
      expect(
        curve.every((component) => component >= 0 && component <= 1),
        name,
      ).toBe(true);
    }
  });
});

describe('motion primitive generation', () => {
  it('derives the exact family and total counts', () => {
    expect(MOTION_PRIMITIVE_COUNTS).toEqual({duration: 5, easing: 2});
    expect(MOTION_PRIMITIVE_COUNT).toBe(7);
  });

  it('emits exactly one CSS value per primitive', () => {
    const css = motionCss();

    expect(css.match(/--lat-/g)).toHaveLength(7);
    expect(css).toContain('--lat-duration-instant: 0ms;');
    expect(css).toContain('--lat-duration-default: 200ms;');
    expect(css).toContain('--lat-duration-expressive: 500ms;');
    expect(css).toContain('--lat-easing-out: cubic-bezier(0, 0, 0.2, 1);');
    expect(css).toContain('--lat-easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);');
    expect(css).not.toContain('prefers-reduced-motion');
    expect(css).not.toContain('transition');
  });

  it('emits duration and cubicBezier DTCG groups', () => {
    const tokens = motionTokens();

    expect(Object.keys(tokens)).toEqual(['duration', 'easing']);
    expect(tokens.duration.default).toEqual({
      $type: 'duration',
      $value: {value: 200, unit: 'ms'},
    });
    expect(tokens.easing.out).toEqual({
      $type: 'cubicBezier',
      $value: [0, 0, 0.2, 1],
    });
  });

  it('keeps CSS and DTCG names and values in parity', () => {
    const css = motionCss();
    const tokens = motionTokens();

    for (const [name, token] of Object.entries(tokens.duration)) {
      expect(css, `duration.${name}`).toContain(`--lat-duration-${name}: ${token.$value.value}${token.$value.unit};`);
    }
    for (const [name, token] of Object.entries(tokens.easing)) {
      expect(css, `easing.${name}`).toContain(`--lat-easing-${name}: cubic-bezier(${token.$value.join(', ')});`);
    }
  });

  it('is deterministic', () => {
    expect(motionCss()).toBe(motionCss());
    expect(JSON.stringify(motionTokens())).toBe(JSON.stringify(motionTokens()));
  });
});

describe('Lattice motion presets', () => {
  it('carries the five named durations', () => {
    expect(DURATIONS).toEqual({
      instant: 0,
      swift: 100,
      default: 200,
      deliberate: 350,
      expressive: 500,
    });
  });

  it('carries out and in-out, and no spring curve', () => {
    expect(Object.keys(EASINGS).sort()).toEqual(['in-out', 'out']);
  });
});
