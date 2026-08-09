/**
 * @vitest-environment node
 *
 * The a11y sweep forgives one 8-bit unit of compositing rounding. That
 * allowance is only safe if it cannot be spent anywhere else, which is what
 * these three cases pin: the tie is accepted, the same shortfall on another
 * surface is not, and a real drop on the tie's own surface is not.
 */
import {describe, expect, it} from 'vitest';
import {acceptedContrastFloors, summarizeViolations} from './browser/support/contrast-ledger.js';

const floors = acceptedContrastFloors();

/** The accent tint over `bg`: the ledger rounds to #ebf0dc, Firefox to #ebf0db. */
const ACCENT_TEXT = '#6a9b00';
const TIE_BACKGROUND = '#ebf0db';

function violations(background: string, ratio: number): never {
  return [
    {
      id: 'color-contrast',
      impact: 'serious',
      help: 'Elements must meet minimum color contrast ratio thresholds',
      nodes: [
        {
          target: ['span'],
          any: [
            {
              id: 'color-contrast',
              data: {
                fgColor: ACCENT_TEXT,
                bgColor: background,
                contrastRatio: ratio,
                expectedContrastRatio: '4.5:1',
                fontSize: '10px',
                fontWeight: 'normal',
              },
            },
          ],
        },
      ],
    },
  ] as never;
}

describe('the compositing-rounding allowance', () => {
  it('accepts the ledger composite measured one unit away', () => {
    expect(summarizeViolations(violations(TIE_BACKGROUND, 2.85), floors)).toEqual([]);
  });

  it('refuses the same shortfall against a surface the ledger never measured', () => {
    expect(summarizeViolations(violations('#c0c0c0', 2.85), floors)).not.toEqual([]);
  });

  it('refuses a real drop on the tie surface', () => {
    expect(summarizeViolations(violations(TIE_BACKGROUND, 2.5), floors)).not.toEqual([]);
  });
});
