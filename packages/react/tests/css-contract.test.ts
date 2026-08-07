import {describe, expect, it} from 'vitest';
import {
  findAnimatedTransformsOutsideNoPreference,
  findBareFocusOutlines,
  findBlockSelectors,
  findColourLiterals,
  findGlobalSelectors,
  findTokenReferences,
  findUnpausableAnimations,
} from './support/css-contract.js';

describe('findColourLiterals', () => {
  it('flags hex and functional colour notations', () => {
    const css = `.a { color: #ff0000; background: rgb(1 2 3); border-color: oklch(0.5 0 0); }`;
    expect(findColourLiterals(css)).toEqual(['#ff0000', 'rgb(', 'oklch(']);
  });

  it('permits var(), transparent and currentColor', () => {
    const css = `.a { color: var(--lat-text); background: transparent; border-color: currentColor; }`;
    expect(findColourLiterals(css)).toEqual([]);
  });

  it('flags the named colours someone would actually type', () => {
    expect(findColourLiterals(`.a { color: red; }`)).toEqual(['red']);
  });

  it('ignores anything inside a comment', () => {
    expect(findColourLiterals(`/* was #ff0000 */ .a { color: var(--lat-text); }`)).toEqual([]);
  });

  // The dialog backdrop's scrim: the one literal this system permits, because
  // it is a scrim rather than a palette value. The exemption is exact-string,
  // not "any rgb() with these channels" — a differently-spaced or -valued
  // rgb() is still a hand-written colour and still gets flagged.
  it('permits exactly the dialog backdrop scrim', () => {
    expect(findColourLiterals(`.lat-dialog__backdrop { background: rgb(0 0 0 / 0.6); }`)).toEqual([]);
  });

  it('still flags an rgb() that only resembles the permitted scrim', () => {
    expect(findColourLiterals(`.a { background: rgb(0 0 0 / 0.5); }`)).toEqual(['rgb(']);
  });
});

describe('findTokenReferences', () => {
  it('returns every referenced custom property once', () => {
    const css = `.a { color: var(--lat-text); background: var(--lat-bg); outline-color: var(--lat-text); }`;
    expect(findTokenReferences(css).toSorted()).toEqual(['--lat-bg', '--lat-text']);
  });

  it('ignores private component properties', () => {
    expect(findTokenReferences(`.a { color: var(--_solid); }`)).toEqual([]);
  });
});

describe('findGlobalSelectors', () => {
  it('flags a universal selector', () => {
    expect(findGlobalSelectors(`* { transition: none; }`)).toEqual(['*']);
  });

  it('flags a descendant universal selector', () => {
    expect(findGlobalSelectors(`.lat-card * { margin: 0; }`)).toEqual(['.lat-card *']);
  });

  it('permits ordinary selectors', () => {
    expect(findGlobalSelectors(`.lat-card { margin: 0; }`)).toEqual([]);
  });
});

describe('findUnpausableAnimations', () => {
  it('flags infinite animations', () => {
    expect(findUnpausableAnimations(`.a { animation: spin 1s infinite; }`)).toEqual(['spin 1s infinite']);
  });

  it('flags anything longer than five seconds', () => {
    expect(findUnpausableAnimations(`.a { animation: x 6s ease; }`)).toEqual(['x 6s ease']);
    expect(findUnpausableAnimations(`.a { animation: x 5001ms ease; }`)).toEqual(['x 5001ms ease']);
  });

  it('permits a short finite animation', () => {
    expect(findUnpausableAnimations(`.a { animation: x 300ms ease; }`)).toEqual([]);
  });
});

describe('findAnimatedTransformsOutsideNoPreference', () => {
  it('flags a transitioned transform at top level', () => {
    const css = `.a { transition-property: opacity, transform; }`;
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual(['transition-property: opacity, transform']);
  });

  it('flags the transition shorthand naming transform', () => {
    const css = `.a { transition: transform 150ms ease; }`;
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual(['transition: transform 150ms ease']);
  });

  it('permits a transitioned transform inside no-preference', () => {
    const css = `@media (prefers-reduced-motion: no-preference) { .a { transition-property: transform; } }`;
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual([]);
  });

  it('permits a static transform anywhere — position is a state signal, not motion', () => {
    const css = `.lat-switch::before { transform: translateX(100%); }`;
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual([]);
  });

  it('still flags a transform transition that follows a guarded block', () => {
    const css = `
      @media (prefers-reduced-motion: no-preference) { .a { transition-property: transform; } }
      .b { transition-property: transform; }
    `;
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual(['transition-property: transform']);
  });
});

describe('findBareFocusOutlines', () => {
  it('flags an outline hung off bare :focus', () => {
    expect(findBareFocusOutlines(`.a:focus { outline: 2px solid var(--lat-focus-ring); }`)).toEqual(['.a:focus']);
  });

  it('permits an outline on :focus-visible', () => {
    expect(findBareFocusOutlines(`.a:focus-visible { outline: 2px solid var(--lat-focus-ring); }`)).toEqual([]);
  });

  // A wrapper reacting to focus landing on a descendant control — Input's
  // field wrapper is exactly this — isn't the bare-:focus problem this check
  // exists to catch. A naive `:focus\b` match would misfire here, since
  // ":focus-within" contains ":focus" at a word boundary.
  it('permits an outline on :focus-within', () => {
    expect(findBareFocusOutlines(`.a:focus-within { outline: 2px solid var(--lat-focus-ring); }`)).toEqual([]);
  });

  it('ignores a :focus rule that sets no outline', () => {
    expect(findBareFocusOutlines(`.a:focus { background-color: var(--lat-bg); }`)).toEqual([]);
  });
});

describe('findBlockSelectors', () => {
  it('returns only unqualified block selectors', () => {
    const css = `
      .lat-button { color: red; }
      .lat-button[data-variant='solid'] { color: blue; }
      .lat-button:focus-visible { outline: none; }
      .lat-field__label { color: green; }
      .lat-card { color: teal; }
    `;
    expect(findBlockSelectors(css).toSorted()).toEqual(['.lat-button', '.lat-card']);
  });

  // Dialog and Menu redeclare their block inside the no-preference query to add
  // an entrance transform. That is deliberate; the rule exists to catch the same
  // block declared twice at top level.
  it('ignores a block redeclared inside a media query', () => {
    const css = `
      .lat-dialog { opacity: 0; }
      @media (prefers-reduced-motion: no-preference) {
        .lat-dialog { transition-property: opacity, transform; }
      }
    `;
    expect(findBlockSelectors(css)).toEqual(['.lat-dialog']);
  });

  it('still catches the same block declared twice at top level', () => {
    const css = `.lat-card { color: var(--lat-text); } .lat-card { color: var(--lat-bg); }`;
    expect(findBlockSelectors(css)).toEqual(['.lat-card', '.lat-card']);
  });
});
