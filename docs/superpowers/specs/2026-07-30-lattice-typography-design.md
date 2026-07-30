# Lattice — typography design

**Date:** 2026-07-30
**Status:** draft, ready for review
**Scope:** the typography scale and its tokens. Colour is specified separately; spacing and sizing are tracked separately again.

## Decisions

| Decision | Choice |
|---|---|
| Families | System stacks: one sans for UI, one monospace. No web font in v1. |
| Scale | Modular, ratio **1.2**, snapped to whole pixels at the default root. Seven sizes, 13–40px. |
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

Seeded by a modular ratio and then snapped, so the relationships are principled and the values still land on whole pixels at the default root.

**Ratio 1.2**, base `1rem`, snapped to `0.0625rem`. The snapped value is what ships.

| Name | Ideal (rem) | Shipped (rem) | px at root 16 | Snap drift |
|---|---|---|---|---|
| `sm` | 0.8333 | **0.8125** | 13 | −0.33px |
| `base` | 1.0000 | **1.0000** | 16 | — |
| `lg` | 1.2000 | **1.1875** | 19 | −0.20px |
| `xl` | 1.4400 | **1.4375** | 23 | −0.04px |
| `2xl` | 1.7280 | **1.7500** | 28 | +0.35px |
| `3xl` | 2.0736 | **2.0625** | 33 | −0.18px |
| `4xl` | 2.4883 | **2.5000** | 40 | +0.19px |

Worst snap drift is 0.35px at the default root, and every size is a whole pixel there. Measured step-to-step ratios stay within 1.18–1.23 of the nominal 1.2.

**There is no size below `sm`.** A scale that offers 11px will have 11px used, and the smallest text in a system should still be readable. The floor is a decision, not the place the ratio happened to stop.

## Line height

Unitless, always. This is not a style preference — a length inherits as a length:

| Declaration on a 16px parent | Inherited by a 32px child | Effective ratio |
|---|---|---|
| `line-height: 1.5` | 48px | 1.5 |
| `line-height: 24px` | **24px** | **0.75** |

Measured in a browser. The second case puts lines on a collision course wherever a component nests larger text inside smaller, and it silently violates the 1.5 floor while the declaration still reads `24px`.

| Size | Line height | Rationale |
|---|---|---|
| `sm`, `base`, `lg`, `xl` | **1.5** | WCAG 2.2 SC 1.4.12 floor for blocks of text |
| `2xl`, `3xl`, `4xl` | **1.25** | Display sizes; 1.4.12 governs blocks of text, and 1.5 on a 40px heading reads as a gap |

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
2. **Body text is at least `1rem`.** The scale's `base` is the floor for prose; `sm` is for supporting text, never for the main reading column.
3. **No size below `0.8125rem`.**
4. **Line height unitless, ≥ 1.5 for text.**
5. **Nothing that holds text may have a fixed height.** SC 1.4.12 lets users override line, letter, word and paragraph spacing; a fixed height turns that into clipped text. Use `min-height`.
6. **Reflow at 320 CSS px** — the 400%-zoom equivalent — with no horizontal scrolling. Verified: at a 24px root and a 320px viewport, document scroll width stayed equal to the viewport.

## Testing

Tests are the deliverable, as in colour.

1. **Scale contract** — every size is `rem`, lands on a whole pixel at the default root, and sits within the snap tolerance of the ideal ratio.
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
