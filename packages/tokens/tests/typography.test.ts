import {describe, expect, it} from 'vitest';
import {FONT_FAMILIES, FONT_SIZES, FONT_WEIGHTS, LETTER_SPACINGS} from '../config/typography.js';
import {typographyCss} from '../generate/typography.js';

describe('typography primitives', () => {
  it('leads the sans stack with Instrument Sans', () => {
    expect(FONT_FAMILIES.sans[0]).toBe('Instrument Sans');
  });

  it('leads the mono stack with JetBrains Mono', () => {
    expect(FONT_FAMILIES.mono[0]).toBe('JetBrains Mono');
  });

  it("carries the Figma bundle's scale including the 10px micro size", () => {
    expect(FONT_SIZES['3xs']).toBe(0.625);
    expect(FONT_SIZES.base).toBe(1);
    expect(FONT_SIZES['5xl']).toBe(3);
  });

  it('carries the 0.2em eyebrow tracking', () => {
    expect(LETTER_SPACINGS.eyebrow).toBe(0.2);
  });

  it('carries the four weights the Figma bundle uses', () => {
    expect(Object.values(FONT_WEIGHTS).sort()).toEqual([400, 500, 600, 700]);
  });

  it('emits tracking in em, not rem', () => {
    // Tracking must scale with the text it tracks. The eyebrow's 0.2em at 10px
    // is 2px; the same value as rem would be 3.2px regardless of font size,
    // and would grow relative to the glyphs at every size below 1rem —
    // which is every size the mono roles use.
    expect(typographyCss()).toContain('--lat-letter-spacing-eyebrow: 0.2em;');
  });
});
