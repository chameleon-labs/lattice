# Lattice — typography design

**Date:** 2026-07-30
**Status:** draft, ready for review
**Scope:** the typography scale and its tokens. Colour is specified separately; spacing and sizing are tracked separately again.

## Decisions

| Decision | Choice |
|---|---|
| Families | System stacks: one sans for UI, one monospace. No web font in v1. |
| Scale | Ratio-based, snapped to **0.125rem** (2px). Eight sizes, 12–36px. Ratio tightens near body size and widens at display. |
| Sizing unit | `rem` everywhere. Never `px`, never viewport units alone. |
| Fluid vs stepped | **Stepped.** Fluid is available as a documented escape hatch with one hard rule. |
| Line height | Unitless. **≥ 1.5** for text, ≥ 1.25 for display. |
| Letter spacing | `0` at every size in v1 — a value the format obliges us to state. |
| Weights | 400, 600, 700. 500 is excluded on purpose. |
| Tokens | The same three tiers as colour: primitive → semantic role → component. |

Every number below is computed or measured. Where a value was snapped or rounded, the shipped value is recorded rather than the ideal one — the same rule the colour system follows for gamut-fitted chroma.

## Why the system stack

A design system that exists to make accessible products has a hard time justifying a web font in v1.

- A web font introduces a loading state. Both of its outcomes are accessibility problems: invisible text until the font arrives, or a reflow when it does. Neither happens with a stack that is already installed.
- It is page weight on the critical path, and the fallback path has to be designed anyway.
- The system stack honours platform-level font substitution, which is where a reader who has configured a more readable face has configured it.

The stack is not a brand asset, and that is the cost. **Revisit when brand differentiation is worth a loading state** — at which point the font must be subsetted, preloaded, and served with `font-display: swap`, and the fallback metrics matched with `size-adjust` so the swap does not move the page.

A monospace face is required, not optional. Any product that renders code, identifiers, selectors, file paths, or columns of figures needs glyph-width stability; proportional digits in a table of numbers are a legibility problem, not a style one.

```css
--lat-font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
                 'Helvetica Neue', Arial, sans-serif;
--lat-font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
                 'Liberation Mono', monospace;
```

## The scale

| Name | rem | px at root 16 | Ratio to previous |
|---|---|---|---|
| `xs` | 0.75 | 12 | — |
| `sm` | 0.875 | 14 | 1.167 |
| `base` | 1 | 16 | 1.143 |
| `lg` | 1.125 | 18 | 1.125 |
| `xl` | 1.25 | 20 | 1.111 |
| `2xl` | 1.5 | 24 | 1.200 |
| `3xl` | 1.875 | 30 | 1.250 |
| `4xl` | 2.25 | 36 | 1.200 |

Every size is an even number of pixels at the default root and a multiple of `0.125rem`. Ratios sit in a band of 1.111–1.250.

### Why the ratio is not constant

A type scale is multiplicative, not additive: 12→14px is an obvious jump and 34→36px is invisible, so equal *steps* do not produce equal perceived differences. That rules out a linear scale.

But a single constant ratio is also wrong, and the reason is where the distinctions have to live. Around body size a product needs several closely-spaced sizes — caption, secondary, body, lead — and they must remain distinguishable at 2px apart. At display sizes the opposite holds: a heading needs to read as clearly larger than the one below it, which takes a wider step. So the ratio is **tightest at `xl` (1.111) and widest at `3xl` (1.250)**.

**A linear 0.25rem scale gets this exactly backwards.** Stepping 12, 16, 20, 24, 28 gives ratios that *fall* from 1.333 to 1.143: a jarring 33% jump between the two smallest sizes, where fine control matters most, and near-invisible steps at the top, where contrast matters most. 0.25rem steps are a **spacing** convention — spacing composes additively, so a uniform grid is right there and wrong here.

### Why 0.125rem snapping

Snapping to 1px lets a constant ratio survive, but the cost is not worth it. It produces values like `0.8125rem` and `2.0625rem`, which are hard to read, hard to recall and easy to mistype, and it puts four of seven sizes on a fractional line box at the default root (13 × 1.5 = 19.5px). Snapping to 2px keeps every size legible as a token and every text size on a whole line box.

The result converges closely with widely shipped scales — Tailwind's default is 12, 14, 16, 18, 20, 24, 30, 36 — and that is a feature rather than a coincidence to hide. The constraints above are not unusual ones, so arriving somewhere unfamiliar would have meant either a different constraint or a mistake. A developer reading `--lat-font-size-lg: 1.125rem` should not have to look it up.

**There is no size below `xs`.** A scale that offers 10 or 11px will have 10 or 11px used somewhere, and the smallest text in a system should still be readable. The floor is a decision, not the place the ratio happened to stop.

## Line height

Unitless, always. This is not a style preference — a length inherits as a length:

| Declaration on a 16px parent | Inherited by a 32px child | Effective ratio |
|---|---|---|
| `line-height: 1.5` | 48px | 1.5 |
| `line-height: 24px` | **24px** | **0.75** |

Measured in a browser. The second case puts lines on a collision course wherever a component nests larger text inside smaller, and it silently violates the 1.5 floor while the declaration still reads `24px`.

| Size | Line height | Line box at root 16 | Rationale |
|---|---|---|---|
| `xs`, `sm`, `base`, `lg`, `xl` | **1.5** | 18, 21, 24, 27, 30px | WCAG 2.2 SC 1.4.12 floor for blocks of text |
| `2xl`, `3xl`, `4xl` | **1.25** | 30, 37.5, 45px | Display sizes; 1.4.12 governs blocks of text, and 1.5 on a 36px heading reads as a gap |

Every text size lands on a whole line box; `3xl` does not, at 37.5px. That is left alone rather than tuned around: browsers render half-pixel line boxes without trouble, and baseline-grid alignment is a stated non-goal, so contorting either the size or the ratio to chase it would be paying for something this system does not use.

## Weights

`400` regular, `600` semibold, `700` bold.

**500 is excluded deliberately.** Across a system stack its availability is inconsistent, so it resolves to a synthesised weight on some platforms and a real one on others — the same token then renders differently per operating system, which is exactly what a design system exists to prevent. Three weights that are real everywhere beat four where one is a lottery.

## Stepped, not fluid

Fluid type is excluded from v1 because the common formulation silently breaks the user's font-size setting. Measured, at a user default of 20px against a browser default of 16:

| Declaration | At root 16 | At root 20 | Responds to the user |
|---|---|---|---|
| `font-size: 14px` | 14px | **14px** | **no** |
| `font-size: 0.875rem` | 14px | 17.5px | yes |
| `clamp(14px, 2vw, 22px)` | 22px | **22px** | **no** |
| `clamp(0.875rem, 0.8rem + 0.5vw, 1.375rem)` | 19.2px | 22.4px | yes |

And a ceiling expressed in `px` caps growth exactly where a reader who has enlarged their text needs it. At a 24px root:

| Ceiling | Computed |
|---|---|
| `clamp(0.875rem, 0.8rem + 0.5vw, 22px)` | **22px** — capped |
| `clamp(0.875rem, 0.8rem + 0.5vw, 1.375rem)` | 28.8px |

**Therefore, if fluid sizing is ever introduced: every term of the `clamp()` — minimum, preferred and maximum — must be `rem`-based, and the preferred value must contain a `rem` term rather than viewport units alone.** A `clamp()` built from `px` and `vw` alone is a WCAG 1.4.4 failure that looks like a feature.

## Architecture

Three tiers, matching the colour system.

**Tier 1 — primitive, generated.** `--lat-font-size-*`, `--lat-line-height-*`, `--lat-font-weight-*`, `--lat-font-sans`, `--lat-font-mono`. Emitted by the build. Never hand-edited.

**Tier 2 — semantic role, hand-authored.** A role bundles the three properties that always travel together, so a component sets one thing rather than three:

`--lat-text-body`, `--lat-text-body-strong`, `--lat-text-caption`, `--lat-text-ui`, `--lat-text-code`, `--lat-text-heading-1` … `--lat-text-heading-4`.

Because a role is a bundle, it emits as a set of custom properties in CSS rather than one value, and in `tokens.json` as DTCG's composite `typography` type — which exists for exactly this.

Two constraints come from that format and are worth knowing before the tokens are designed rather than after:

- **All five sub-properties are required**: `fontFamily`, `fontSize`, `fontWeight`, `letterSpacing`, `lineHeight`. There is no partial typography token, which is why letter spacing is decided above instead of deferred — a role cannot omit it.
- **`dimension` accepts only `px` and `rem`.** The rem-everywhere decision is therefore expressible in the JSON artefact, and `em`, `ch` and `%` are not. Any future need for `ch`-based measure lives in CSS, not in the token file.

**Tier 3 — component tokens.** Permitted with a written justification in review, as in colour.

Aliases must be emitted **into every theme scope that redeclares a primitive they reference**, for the reason established in the colour system: a custom property holding a `var()` reference resolves on the element that declares it, so a single root declaration freezes. Typography has no light/dark split today, so this costs nothing now and is a trap the moment a density or reading mode is added.

## Accessibility constraints

These are gates, not guidance.

1. **Every size in `rem`.** A `px` size ignores the user's font-size setting outright, as measured above.
2. **Body text is at least `1rem`.** The scale's `base` is the floor for prose; `sm` and `xs` are for supporting text — labels, captions, metadata — and never for the main reading column.
3. **No size below `0.75rem`.**
4. **Line height unitless, ≥ 1.5 for text.**
5. **Nothing that holds text may have a fixed height.** SC 1.4.12 lets users override line, letter, word and paragraph spacing; a fixed height turns that into clipped text. Use `min-height`.
6. **Reflow at 320 CSS px** — the 400%-zoom equivalent — with no horizontal scrolling. Verified: at a 24px root and a 320px viewport, document scroll width stayed equal to the viewport.

## Testing

Tests are the deliverable, as in colour.

1. **Scale contract** — every size is `rem`, is a multiple of `0.125rem`, is an even number of pixels at the default root, and its ratio to the previous size falls inside the 1.111–1.250 band. The band is the assertion: it catches both a size edited to an arbitrary value and a step that has drifted far enough to read as a different scale.
2. **Floors** — no size below the minimum; every text line height at or above 1.5; every display line height at or above 1.25.
3. **Unitless line heights** — asserted structurally, since a length is the failure mode.
4. **Emitted parity** — the CSS and the JSON describe the same scale, and `tokens.json` validates against the published DTCG schema, including the composite `typography` tokens.
5. **Reflow and user-font-size behaviour** — a browser check at a raised root font size and a 320px viewport.

## Non-goals for v1

- Web fonts, self-hosting, subsetting, `size-adjust` fallback matching.
- Fluid sizing.
- A separate density or compact scale.
- Vertical rhythm or baseline-grid alignment.
- Language-specific stacks (CJK, Arabic) and their line-height needs.

## Open questions

- **Whether any size wants non-zero tracking.** v1 ships `0` everywhere, which the composite type obliges us to state explicitly. Display sizes usually want slight negative tracking, but the right amount is face-dependent and the face is whatever the platform supplies — so tuning it against a stack we do not control would be guessing. Revisit alongside any decision to self-host.
- **Whether headings need four levels or five.** Four roles are specified; a fifth is cheap to add and impossible to remove.
