# Lattice — spacing, sizing, radii, elevation and motion

**Date:** 2026-07-30
**Status:** draft, ready for review
**Scope:** the non-colour, non-typographic primitives. Colour and typography are specified separately; components are tracked separately again.

Sizes are `rem` — that is the token. Px equivalents are given **at the default root**, and are not the values: at a user default of 20px the whole system is 25% larger, which is the point of the unit.

## Decisions

| Decision | Choice |
|---|---|
| Spacing | Linear on a `0.25rem` grid, thinning above `1.5rem`. Fourteen steps, `0`–`8rem`. |
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
| `1` | 0.25 | 4 |
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

Every value is a multiple of the base unit, so the step number *is* the multiplier: step `6` is six quarter-rems. The scale thins above `1.5rem` because the difference between 88px and 96px of page margin is not a decision anyone makes, while the difference between 4px and 8px of inset is one people make constantly.

**On the range:** the full `0`–`8rem` span is kept. The argument for cutting it is that large values go unused, but the failure mode of omitting them is the same one the typography floor had — a team needing 96px of section spacing writes `margin: 96px`, in `px`, outside the system. The cost of an unused token is a line in a stylesheet; the cost of an absent one is an untokenised hardcode.

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

Nothing above `400ms`. A transition long enough to notice is long enough to wait for, and the ceiling is a decision rather than an accident.

### Reduced motion reduces motion, not feedback

`prefers-reduced-motion: reduce` is a first-class requirement, and the common implementation of it is wrong. Disabling every transition globally — the `* { transition: none !important }` pattern — removes the feedback that tells a user their action registered, which harms comprehension rather than helping it. The preference is about **vestibular triggers**: movement, parallax, scaling, spinning.

**The rule: remove transform and position animation, keep opacity and colour.** Verified in a browser — under `prefers-reduced-motion: reduce`, a rule narrowing `transition-property` from `transform, opacity` to `opacity` and setting `transform: none` computes exactly that, so a fade survives while the slide does not.

Anything that moves continuously, or runs longer than five seconds, must also be pausable — WCAG 2.2 SC 2.2.2.

## Architecture

Three tiers, matching colour and typography.

**Tier 1 — primitive, generated.** `--lat-space-*`, `--lat-radius-*`, `--lat-shadow-*`, `--lat-duration-*`, `--lat-easing-*`, `--lat-breakpoint-*`, `--lat-container-*`.

**Tier 2 — semantic role, hand-authored.** `--lat-inset-*` for component padding, `--lat-gap-*` for layout rhythm, `--lat-elevation-*` bundling the three signals of a level.

**Tier 3 — component tokens.** Permitted with a written justification in review, as in colour.

Shadow and elevation tokens are **theme-dependent** and must be emitted into every theme scope, for the reason established in the colour system: a custom property holding a `var()` reference resolves on the element that declares it, so a single root declaration freezes and a nested theme keeps the wrong value. Spacing, radii and durations do not vary by theme and are emitted once.

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

- **Whether `--lat-space-0` earns a token.** Zero is zero, and a token for it is either useful consistency or noise.
- **Whether elevation levels should be named for depth or for use** — `raised`/`overlay`/`modal` names the use, which reads better and dates faster.
- **Whether the shadow colour should be neutral or hue-matched.** A shadow tinted toward the surface's hue reads as more natural, but it is one more thing to generate and to test.
