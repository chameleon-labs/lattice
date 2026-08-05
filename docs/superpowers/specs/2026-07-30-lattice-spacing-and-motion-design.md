# Lattice — spacing, sizing, radii, elevation and motion

**Date:** 2026-07-30
**Status:** approved
**Scope:** the non-colour, non-typographic primitives. Colour and typography are specified separately; components are tracked separately again.

Sizes are `rem` — that is the token. Px equivalents are given **at the default root**, and are not the values: at a user default of 20px the whole system is 25% larger, which is the point of the unit.

## Decisions

| Decision | Choice |
|---|---|
| Spacing | Linear on a `0.25rem` grid with two fractional steps, thinning above `1.5rem`. Sixteen steps, `0`–`8rem`. |
| Breakpoints | `rem`, not `px`, so they respond to the user's font size. |
| Container widths | Capped by reading measure, not by viewport. |
| Radii | Five roles, not raw numbers. Nested radii are derived, not chosen. |
| Elevation | **Three signals, always together**: surface step, border, shadow. |
| Motion | Five durations, three easings. `prefers-reduced-motion` reduces motion without removing feedback. |
| Tokens | The same three tiers as colour: primitive → semantic role → component. |

Every number below is computed or measured.

## Spacing

**Linear, on a `0.25rem` grid.** This is the opposite of the type scale, and deliberately so: the typography spec argues that a type scale must be ratio-based because perceived size difference is multiplicative. Spacing is the reverse — it **composes additively**. Two 8px gaps beside a 16px one should equal 32px exactly, and a padding plus a border plus a gap should land on a predictable total. A ratio-based spacing scale makes that arithmetic impossible.

| Step | rem | px at default root |
|---|---|---|
| `0` | 0 | 0 |
| `0.5` | 0.125 | 2 |
| `1` | 0.25 | 4 |
| `1.5` | 0.375 | 6 |
| `2` | 0.5 | 8 |
| `3` | 0.75 | 12 |
| `4` | 1 | 16 |
| `5` | 1.25 | 20 |
| `6` | 1.5 | 24 |
| `8` | 2 | 32 |
| `10` | 2.5 | 40 |
| `12` | 3 | 48 |
| `16` | 4 | 64 |
| `20` | 5 | 80 |
| `24` | 6 | 96 |
| `32` | 8 | 128 |

**The step number is the multiplier**: step `6` is six quarter-rems, and step `0.5` is half of one. That property holds for every step including the fractional pair, which is what makes the arithmetic checkable rather than remembered.

The scale thins above `1.5rem` because the difference between 88px and 96px of page margin is not a decision anyone makes, while the difference between 4px and 8px of inset is one people make constantly.

### The two fractional steps, and why they exist

An earlier draft stopped at a strict `0.25rem` grid with no sub-4px value. Checked against what ships, that was the outlier: **every major system carries one** — Carbon and Primer at 2px, Spectrum at 1px, Tailwind at 2px with a literal 1px besides — and three of the four also carry 6px.

The reasoning for adding them is the one this system has already used twice. Omitting a value does not prevent its use; it prevents the use being *tokenised*. A 2px focus-ring offset is a real need — this spec creates it, in the focus-ring constraint below — and without a token someone writes `2px`, in `px`, outside the system and immune to the user's font size.

The fractional naming is borrowed from Tailwind because it is the only convention that adds the values without breaking the multiplier property: `0.5 × 4px = 2px`.

### Naming: multiples, not pixels

Primer and Spectrum name spacing tokens by pixel value — Primer's `base-size-16` **is** `1rem`. That is a deliberate divergence here rather than an oversight.

A px-derived name for a `rem` value is a lie the moment the root moves: at a user default of 20px, `base-size-16` computes to 20px and the name still says 16. Naming by multiple of the base unit stays true at any root, which matters more in a system whose first accessibility gate is that every dimension responds to the user's font size.

**On the range:** the full `0`–`8rem` span is kept, for the same reason the fractional steps were added. A team needing 96px of section spacing and finding no token writes `margin: 96px`. The cost of an unused token is a line in a stylesheet; the cost of an absent one is an untokenised hardcode.

## Sizing

### Breakpoints are in `rem`

| Name | rem | px at default root |
|---|---|---|
| `sm` | 30 | 480 |
| `md` | 48 | 768 |
| `lg` | 64 | 1024 |
| `xl` | 80 | 1280 |

Measured while writing the typography spec: a media query in `rem` resolves against the browser's default font size, so it responds to the user's preference; one in `px` does not. At a 700px viewport with the user's default raised to 20px, `(width < 40rem)` matched and `(width < 640px)` did not.

That is the correct behaviour rather than a curiosity. A reader with larger text has less usable room at the same physical width, so they should reach the narrower layout **sooner**. A `px` breakpoint denies them that.

### Container widths are capped by measure, not by viewport

| Token | Max width | Intended use |
|---|---|---|
| `--lat-container-prose` | `42rem` | A single reading column |
| `--lat-container-content` | `64rem` | Forms, detail views |
| `--lat-container-wide` | `80rem` | Tables, dashboards |

**There is no `full` token.** Edge-to-edge is the absence of a container, not a container with an uncapped width, and the distinction matters for the artefacts rather than for taste: DTCG's `dimension` type requires a numeric `value` and a `unit` of `px` or `rem`, so a keyword like `none` has no representation as a dimension token. Shipping one would mean a token that exists in the stylesheet and cannot exist in `tokens.json`, breaking the parity this system tests for. A component that spans the viewport simply sets no container.

`prose` at `42rem` is roughly 65–70 characters at the body size, inside the 45–75 range that typographic research treats as comfortable. It is expressed in `rem` rather than `ch` for the same representability reason — `ch` is not a DTCG unit either. The `rem` value approximates the measure and stays in both artefacts.

## Radii

Five roles, not raw numbers, so a component asks for what it is rather than for a number.

| Role | rem | px at default root | For |
|---|---|---|---|
| `none` | 0 | 0 | Flush edges, table cells |
| `sm` | 0.25 | 4 | Inputs, badges, small controls |
| `md` | 0.5 | 8 | Buttons, cards |
| `lg` | 0.75 | 12 | Dialogs, panels, popovers |
| `full` | 9999 | sentinel | Pills, avatars, circular controls |

**Nested radii are derived, not chosen.** When a rounded element sits inside another with padding between them, the inner radius must be the outer radius minus the gap, or the two curves run non-concentric and the inset looks wrong:

```
inner radius = outer radius - gap
```

A card at `lg` (12px) with `2` (8px) of padding gives its inner element `sm` (4px). Picking the inner radius independently is the usual cause of the effect. `full` is exempt: it stays `full` at any nesting.

The finite pairing documented for v1 is therefore:

| Outer | Gap | Inner |
|---|---|---|
| `lg` | space `2` | `sm` |

`full` is a **sentinel rather than a measurement** — any value larger than half the element's shorter side produces the same pill, so `9999rem` is not a length anyone should read as one. It stays a `rem` value rather than the more familiar `9999px` so that it remains a DTCG `dimension` like every other radius, and rather than `50%` because percentages are not a DTCG unit and an ellipse is not what is wanted on a non-square element.

## Elevation

**Three signals, and they ship together.** This is the one place where a single mechanism is not enough, and the reason is measurable.

A shadow is a dark overlay, so its visibility depends entirely on what it falls on. Measured with this system's own contrast module, a black shadow against each surface:

| Shadow opacity | On light `#fdfdfd` | On dark `#111112` |
|---|---|---|
| 10% | 1.253:1 (ΔY 0.209) | **1.013:1 (ΔY 0.0007)** |
| 20% | 1.605:1 | 1.025:1 |
| 30% | 2.106:1 | 1.037:1 |

**On a dark surface a shadow is not subtle, it is absent** — roughly 300× less luminance separation than the same shadow on light, and pushing the opacity to 30% barely moves it. Any elevation model resting on shadow alone works in one theme and silently fails in the other.

And in forced-colors mode, measured in a browser, both of the usual answers disappear:

| Signal | Normal | forced-colors: active |
|---|---|---|
| `box-shadow` | `rgba(0,0,0,0.15) 0 2px 8px` | **`none`** |
| Surface step `#f1f1f2` | `rgb(241,241,242)` | **`rgb(255,255,255)`** |
| `1px` border | `rgb(153,153,153)` | `rgb(0,0,0)` — **survives** |

The user agent strips shadows outright and flattens surfaces to the system canvas. **The border is the only signal that survives**, recoloured but present.

Therefore an elevated surface carries all three:

| Level | Surface step | Border | Shadow |
|---|---|---|---|
| `flat` | `gray-1` | none | none |
| `raised` | `gray-2` | `gray-6` | small |
| `overlay` | `gray-2` | `gray-7` | medium |
| `modal` | `gray-3` | `gray-7` | large |

Each does the work the others cannot: the shadow reads on light, the surface step reads on dark, and the border reads when both have been stripped. This is the same rule as *colour never carries severity alone*, applied to depth.

## Motion

| Token | Duration | For |
|---|---|---|
| `instant` | 0ms | State changes that must not animate |
| `fast` | 100ms | Hover, focus, small colour changes |
| `base` | 150ms | Most transitions |
| `slow` | 250ms | Popovers, dropdowns, small overlays |
| `slower` | 400ms | Dialogs, drawers, full-surface change |

| Easing | Curve | For |
|---|---|---|
| `standard` | `cubic-bezier(0.2, 0, 0, 1)` | Movement within the viewport |
| `entrance` | `cubic-bezier(0, 0, 0, 1)` | Elements arriving — decelerate in |
| `exit` | `cubic-bezier(0.3, 0, 1, 1)` | Elements leaving — accelerate out |

The three-way split is not invented here: Carbon ships the same `standard` / `entrance` / `exit` taxonomy, which is reassuring about the vocabulary. The curves differ — Carbon's resolve to `y = 0.9` rather than `1`, giving a softer settle, and it carries `productive` and `expressive` variants of each. One variant is enough until a second is needed.

Nothing above `400ms`. A transition long enough to notice is long enough to wait for, and the ceiling is a decision rather than an accident.

This is a considered divergence: Primer ships durations to 1000ms across twelve steps. Offering a duration is not requiring it, and a wider range is defensible for choreographed or expressive motion — but five named durations that all sit inside a bound are easier to hold in mind than twelve that do not, and a ceiling is only a ceiling if something enforces it.

### Reduced motion reduces motion, not feedback

`prefers-reduced-motion: reduce` is a first-class requirement, and the common implementation of it is wrong. Disabling every transition globally — the `* { transition: none !important }` pattern — removes the feedback that tells a user their action registered, which harms comprehension rather than helping it. The preference is about **vestibular triggers**: movement, parallax, scaling, spinning.

**The rule: remove transform and position animation, keep opacity and colour.** Verified in a browser — under `prefers-reduced-motion: reduce`, a rule narrowing `transition-property` from `transform, opacity` to `opacity` and setting `transform: none` computes exactly that, so a fade survives while the slide does not.

Anything that moves continuously, or runs longer than five seconds, must also be pausable — WCAG 2.2 SC 2.2.2.

## Architecture

Three tiers, matching colour and typography.

**Tier 1 — primitive, generated.** `--lat-space-*`, `--lat-radius-*`, `--lat-shadow-*`, `--lat-duration-*`, `--lat-easing-*`, `--lat-breakpoint-*`, `--lat-container-*`.

**Tier 2 — semantic role, hand-authored.** `--lat-inset-*` for component padding, `--lat-gap-*` for layout rhythm, `--lat-elevation-*` bundling the three signals of a level. Shipped for spacing in [#38](https://github.com/chameleon-labs/lattice/issues/38) — see [the vocabulary below](#the-shipped-inset-and-gap-vocabulary), which is not the one this section predicted.

**Tier 3 — component tokens.** Permitted with a written justification in review, as in colour.

Shadow and elevation tokens are **theme-dependent** and must be emitted into every theme scope, for the reason established in the colour system: a custom property holding a `var()` reference resolves on the element that declares it, so a single root declaration freezes and a nested theme keeps the wrong value. Spacing, radii and durations do not vary by theme and are emitted once.

### Primitive layout slice

The primitive layout slice is a dedicated module rather than an extension of typography or a generic token registry:

- `config/layout.ts` owns the reviewed spacing, breakpoint, container and radius values, plus the documented finite nested-radius pairing.
- `generate/layout.ts` turns that config into CSS declarations and DTCG dimension groups.
- `generate/emit.ts` composes both representations into the existing global output once, before any theme-dependent colour block.

It contains exactly 28 tokens: sixteen spacing steps, four breakpoints, three containers and five radii. The public paths mirror each other:

| Family | CSS | DTCG |
|---|---|---|
| Spacing | `--lat-space-*` | `global.space.*` |
| Breakpoints | `--lat-breakpoint-*` | `global.breakpoint.*` |
| Containers | `--lat-container-*` | `global.container.*` |
| Radii | `--lat-radius-*` | `global.radius.*` |

DTCG names cannot contain `.`, so the two fractional spacing steps use the multiplier-preserving slugs `0-5` and `1-5` in both artefacts: `--lat-space-0-5` matches `global.space.0-5`, and `--lat-space-1-5` matches `global.space.1-5`.

This slice does not add semantic inset or gap roles. Those mappings remain deferred until the component inventory demonstrates the vocabulary it needs. It also does not add a `full` container: edge-to-edge remains the absence of a container.

### The shipped inset and gap vocabulary

Deferring the mapping until components existed was the right call, and the reason is that **the vocabulary this document assumed turned out to be wrong**.

The assumption above — one `--lat-inset-*` family sized `sm|md|lg` — was drafted before any component was written. It fails on contact with the first one. Two axes climbing a single three-step scale collide at the top: the largest label inset and the smallest surface inset want the same rung for different reasons, and one of them has to be wrong.

What fourteen component stylesheets actually showed is **three families, distinguished by what they inset rather than by how much**:

| Role | Block / inline | Where it came from |
|---|---|---|
| `--lat-inset-label-sm` | `space-1` / `space-3` | `.lat-button[data-size='sm']`, `.lat-code-block__copy` |
| `--lat-inset-label-md` | `space-2` / `space-4` | `.lat-button[data-size='md']`, `.lat-tab`, `.lat-table__header` |
| `--lat-inset-label-lg` | `space-3` / `space-5` | `.lat-button[data-size='lg']`, `.lat-card__header` |
| `--lat-inset-row-sm` | `space-2` / `space-3` | `.lat-menu__item`, `.lat-disclosure` |
| `--lat-inset-row-md` | `space-3` / `space-4` | `.lat-table__cell` |
| `--lat-inset-surface-sm` | `space-3` | `.lat-tab-panel`, `.lat-disclosure__content` |
| `--lat-inset-surface-md` | `space-4` | `.lat-callout`, `.lat-code-block__pre` |
| `--lat-inset-surface-lg` | `space-5` | `.lat-card__body` |
| `--lat-inset-surface-xl` | `space-6` | `.lat-dialog` |
| `--lat-gap-xs` \| `sm` \| `md` \| `lg` | `space-1` … `space-4` | 13 component declarations; 36 more in the proof pages, which keep primitives |

The finding worth keeping is the **shape of the pairs**, not the sizes. Inline leads block by *two* steps for a label and by *one* for a row, at every rung. That is a difference in kind rather than degree — a short label reads as cramped long before a paragraph does, and a row is already bounded by its siblings — and it is exactly what stops a menu item reaching for a button's inset. A single `sm|md|lg` scale cannot express it.

**The `label` family was called `control` until the migration was already written**, and the rename is worth recording because the mistake is easy to repeat. Five of its seven consumers are controls, so the name looked right; the other two are headers — `.lat-table__header` is a `<th>`, `.lat-card__header` a `<div>` wrapping `.lat-card__label`. A role named for interactivity that two non-interactive elements have to borrow is doing exactly what the vocabulary exists to prevent, and the fix was the name rather than the grouping: what all seven share is a short label needing horizontal room. Renaming cost one commit before release and would have been a breaking change after.

Gaps went the other way: named by size, because the measurement showed no purpose split to encode, and inventing one for symmetry would be a distinction the system does not have. They stop at `space-4`; larger gaps appear only in page layout, and a role covering them would invite a component to reach for a page-sized gap.

**Both artefacts point at the primitive** — `var(--lat-space-2)` in CSS, `{global.space.2}` in DTCG — rather than restating a resolved number, so the tier stays a tier. Parity between them is structural rather than name-for-name: DTCG defines no two-dimension type, so a pair emits as a group of two dimensions, `block` and `inline`.

Three placements stay on primitives, each with the reason in the stylesheet beside it:

- `.lat-segmented-control__label` reproduces `py-1.5 px-4`, and no rung sits at 1.5/4 — the nearest already measured 4px short. Snapping it to a rung would change rendering to tidy a token table.
- `.lat-menu` is a track hugging its items, not a container giving its children room. The surface rungs start at 12px, which would make the active-item highlight read as a floating chip rather than a full-width row.
- `.lat-input` splits one inset across two elements: the wrapper owns the inline gutter, the `<input>` owns the block padding that makes its own box clickable. A role describes one element's inset; this one spans two.

The proof pages keep primitives. They are application layout demonstrating the system, not library components, and their rules routinely mix a covered rung with an uncovered one in a single declaration.

`packages/react/tests/spacing-roles-css.test.ts` holds the line. Its allow-list carries two of those three: `.lat-input` needs no entry, because its declarations are axis longhands and the test only asserts the shapes a role actually covers. The list is asserted to stay at two, and each entry is asserted to still be needed — a fourth entry means the vocabulary is wrong and should be revisited rather than extended.

## Accessibility constraints

These are gates, not guidance.

1. **Spacing and sizing in `rem`.** A `px` layout does not grow with the user's text, so text enlarges inside a container that does not.
2. **Breakpoints in `rem`**, for the reason measured above.
3. **Elevation never rests on one signal.** Surface step, border and shadow ship together; a level defined by shadow alone fails in dark mode and in forced-colors.
4. **Nothing that holds text has a fixed height** — carried over from the typography spec, and it is a spacing decision as much as a type one. Use `min-height`.
5. **Reduced motion removes movement, not feedback.**
6. **Anything moving continuously for more than five seconds is pausable** (SC 2.2.2).
7. **A focus ring is never removed, only restyled.** It uses the colour system's `--lat-focus-ring` and must remain visible against every surface it can appear on.

## Testing

1. **Spacing contract** — every step is `rem` and an exact multiple of the base unit, so the step number is the multiplier.
2. **Breakpoint contract** — every breakpoint is `rem`; ascending; no duplicates.
3. **Radius nesting** — for each documented pairing, inner radius equals outer minus gap.
4. **Elevation completeness** — every level above `flat` defines all three signals. The assertion is the point: a level with a shadow and no border is the failure this spec exists to prevent.
5. **Shadow visibility** — the measured ratio against both surfaces is pinned, so a change that makes shadows the primary signal fails rather than passing quietly.
6. **Motion bounds** — no duration exceeds 400ms; every easing parses as a valid cubic-bezier.
7. **Emitted parity** — CSS and JSON describe the same values, and `tokens.json` validates against the published DTCG schema.

## Non-goals for v1

- A grid system. Flexbox and CSS grid with these spacing tokens cover it; a column system is a layer of indirection this does not need yet.
- Container queries. They are the right answer for component-level responsiveness and deserve their own decision rather than being folded in here.
- Animation choreography — staggering, orchestration, spring physics.
- Z-index scale. Related to elevation but a different problem, and better solved once the component inventory exists.

## Open questions

- **Whether `--lat-space-0` earns a token.** Kept for now: `gap: 0` and `padding: 0` are common enough that a token makes a layout read consistently, and Tailwind agrees. Worth noting the field is split — Carbon, Primer and Spectrum all omit it.
- **Whether elevation levels should be named for depth or for use** — `raised`/`overlay`/`modal` names the use, which reads better and dates faster.
- **Whether the shadow colour should be neutral or hue-matched.** A shadow tinted toward the surface's hue reads as more natural, but it is one more thing to generate and to test.
