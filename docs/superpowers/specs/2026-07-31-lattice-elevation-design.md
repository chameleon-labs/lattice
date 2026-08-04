# Lattice — elevation calibration and theme-dependent roles

**Date:** 2026-07-31
**Status:** superseded by
[Meridian: replacing Lattice's visual identity](./2026-08-03-meridian-identity-design.md)
(2026-08-03), which replaces the calibrated multi-level model and its
theme-dependent roles with four roles taken from the Figma-generated identity.
Kept for the calibration reasoning, which is why the replacement is a decision
rather than an oversight.
**Issue:** [#30 — Elevation calibration and theme-dependent roles](https://github.com/chameleon-labs/lattice/issues/30)

## Purpose

Complete the elevation layer approved in the broader
[spacing and motion specification](./2026-07-30-lattice-spacing-and-motion-design.md).
That document fixed the architecture — three signals, always together — but named
the shadows only `small`, `medium` and `large`. This slice makes those values
measured, reviewed and publishable, and adds the theme-dependent role tier that
bundles them.

Elevation is the one place in this system where a single mechanism is not enough,
and the reason is measurable rather than stylistic.

## What was measured

Candidates were composited over the real `gray-1` surface of each mode with
source-over blending, then measured with this system's own contrast module. They
were also rendered as real CSS on the real palette and reviewed by eye before
being chosen. The full calibration record, including every rejected candidate,
is recorded on issue #30.

### A shadow does not exist on a dark surface

Geometry fixed at `0 4px 8px -1px`, alpha varied, measured against the page
surface:

| alpha | light ratio | light ΔY | dark ratio | dark ΔY |
|---|---:|---:|---:|---:|
| 0.10 | 1.253:1 | 0.2087 | 1.013:1 | 0.0007 |
| 0.12 | 1.315:1 | 0.2470 | 1.016:1 | 0.0009 |
| 0.16 | 1.450:1 | 0.3202 | 1.020:1 | 0.0011 |
| 0.30 | 2.106:1 | 0.5420 | 1.037:1 | 0.0020 |
| 0.50 | 3.964:1 | 0.7718 | 1.058:1 | 0.0030 |

Tripling the alpha moves the light ground by 0.853 of a contrast ratio and the
dark ground by 0.024. At 50% black the dark ground still reaches only 1.058:1.
**No alpha makes a shadow load-bearing on a dark surface**, which is why a shadow
never ships alone.

### The signals trade places across modes

Measured against the page surface in each mode:

| Signal | light | dark |
|---|---:|---:|
| shadow @ .12 | **1.315:1** | 1.016:1 |
| `gray-2` surface | 1.035:1 | 1.053:1 |
| `gray-3` surface | 1.110:1 | 1.188:1 |
| `gray-6` border | 1.391:1 | **1.812:1** |
| `gray-7` border | 1.567:1 | **2.370:1** |

The shadow is the strongest signal on light and the weakest on dark. The border
is the reverse, and — as the broader spec established in a browser — the only one
that survives `forced-colors`, where the user agent strips shadows outright and
flattens surfaces to the system canvas. The surface step is worth little alone in
either mode, but it is what makes the other two read as one object.

Each signal covers a case the others cannot. That is the whole argument for
bundling them.

### Neutral, not hue-matched

Lattice's greys carry hue 305, so a shadow tinted to match was a real candidate.
Identical geometry, colour varied between neutral `rgb(0 0 0 / a)` and
hue-matched `oklch(0.15 0.05 305)`:

| alpha | neutral composite | hue-matched composite | ratio between them |
|---|---|---|---:|
| 0.10 | `#e4e4e4` | `#e5e4e6` | 1.0084 |
| 0.16 | `#d5d5d5` | `#d7d5d9` | 1.0142 |
| 0.20 | `#cacaca` | `#cecbd0` | 1.0185 |

The difference peaks at under 2%, on an edge that is blurred by design.
Hue-matching would cost a generated colour, a theme-dependent value and a wider
test surface for a difference the contrast module can measure but the eye cannot
find. **Neutral is chosen**, and it keeps the shadow primitives theme-independent
in value.

## Public contract

### Shadow primitives

Three, neutral, single-layer, identical in both modes.

| Token | CSS value |
|---|---|
| `--lat-shadow-small` | `0px 1px 2px 0px oklch(0 0 0 / 0.1)` |
| `--lat-shadow-medium` | `0px 4px 8px -1px oklch(0 0 0 / 0.12)` |
| `--lat-shadow-large` | `0px 12px 24px -4px oklch(0 0 0 / 0.16)` |

A single layer rather than an ambient-plus-direct pair. Two layers read
marginally softer on light and are indistinguishable on dark, which is not worth
doubling the values to generate, review and assert.

The colour is written `oklch` rather than `rgb` so the stylesheet continues to
hold no hex and no second colour syntax, keeping the rule established by the
colour system true for every declaration rather than most of them.

Geometry is expressed in `px`. This is a **deliberate divergence** from the `rem`
used by every other dimension token in the system: a shadow is an edge-rendering
effect rather than a layout measure, and scaling it with the user's font size
makes it bloom without improving legibility. The border it pairs with is likewise
a single pixel.

DTCG leaves use `$type: "shadow"` with the five fields the format requires:

```json
{
  "$type": "shadow",
  "$value": {
    "color": { "colorSpace": "oklch", "components": [0, 0, 0], "alpha": 0.1 },
    "offsetX": { "value": 0, "unit": "px" },
    "offsetY": { "value": 1, "unit": "px" },
    "blur": { "value": 2, "unit": "px" },
    "spread": { "value": 0, "unit": "px" }
  }
}
```

`hex` is omitted because the format makes it optional and hex cannot express
alpha.

### Elevation roles

Four levels. Every level above `flat` bundles all three signals.

| Level | Surface | Border | Shadow |
|---|---|---|---|
| `flat` | `gray-1` | — | — |
| `raised` | `gray-2` | `gray-6` | `shadow-small` |
| `overlay` | `gray-2` | `gray-7` | `shadow-medium` |
| `modal` | `gray-3` | `gray-7` | `shadow-large` |

CSS names are `--lat-elevation-{level}-{surface|border|shadow}`; every value is a
`var()` reference, never a literal.

`flat` publishes a **surface only**. Its border and shadow are an absence, not
keyword-valued tokens: a `none`-valued dimension token invites a consumer to
treat the absence as a value it can interpolate or override, and there is nothing
for it to name.

Ten role tokens exist per mode: one for `flat` and three each for `raised`,
`overlay` and `modal`.

### Published names and shapes

| Family | CSS | DTCG | Scope |
|---|---|---|---|
| Shadow | `--lat-shadow-*` | `global.shadow.*` | once, global |
| Elevation | `--lat-elevation-*` | `{mode}.elevation.*` | every theme scope |

## Architecture

Elevation is a dedicated module, matching the layout and motion slices:

- `packages/tokens/config/elevation.ts` owns the reviewed shadow recipes and the
  four-level signal table.
- `packages/tokens/generate/elevation.ts` converts those into shadow primitives
  and elevation roles in both representations, and exports derived counts.
- `packages/tokens/generate/emit.ts` composes only.

Shadow primitives join the existing global tier, after motion primitives. The
generated global CSS order becomes:

1. typography primitives;
2. layout primitives;
3. motion primitives;
4. shadow primitives;
5. semantic typography roles.

### Why the roles repeat per scope and the primitives do not

Shadow primitives are theme-independent: the same neutral black in both modes, so
one declaration is correct everywhere.

Elevation roles are theme-dependent, and are emitted **inside every theme scope**
alongside the semantic colour tier. The reason is the one the colour system
already established: a custom property whose value contains `var()` is
substituted at computed-value time on the element carrying the declaration, so a
role declared once at the root freezes to the root theme's greys and keeps them
inside a nested scope that redefines the primitive underneath. Re-declaring per
scope is what makes `[data-lat-theme]` work on any element rather than only on
the root.

### One existing assertion widens

`tests/emit.test.ts` currently asserts that every alias reference stays inside
its own mode, so a theme never leaks. An elevation shadow role legitimately
points at `{global.shadow.small}`, which is theme-independent by design. That
assertion widens to permit `global.` references specifically, and continues to
reject a reference from one mode into another. It is widened explicitly rather
than relaxed to "any reference", because the theme-leak guarantee is the point of
the test.

## Validation and testing

Implementation follows test-driven development. Tests are written and observed
failing before the code that satisfies them.

1. Pin every shadow recipe exactly: offsets, blur, spread, alpha and colour.
2. Assert the shadow colour is neutral — chroma zero — so a hue-matched value
   cannot reappear without review.
3. Assert every geometry value carries the `px` unit.
4. Assert the four levels and their exact signal assignments.
5. **Assert completeness: every level above `flat` defines a surface, a border
   and a shadow.** Deleting any one signal must fail. This is the assertion the
   whole spec exists to protect.
6. Assert `flat` publishes a surface and neither a border nor a shadow.
7. Assert CSS and DTCG parity for both families.
8. Assert shadow primitives appear exactly once, in the global tier, and never
   inside a theme scope.
9. Assert elevation roles appear in every theme scope and never in the global
   group.
10. Assert every elevation role reference resolves, and points either inside its
    own mode or at `global.`.
11. Validate the emitted JSON against the committed DTCG schema, including a
    negative case for a malformed shadow value.
12. Update snapshots only after observing the expected failures.

Browser coverage, added to the existing Playwright suite:

- under `forced-colors: active`, the border of an elevated level survives while
  the shadow is stripped — the guarantee that keeps elevation legible when the
  user agent overrides the palette.

The mechanism matters, and was verified before this spec was written. Playwright's
**declarative** `forcedColors` option — whether set in `playwright.config.ts`, on a
project, or through `test.use()` — is a no-op in this setup: the media query keeps
reporting `false` and nothing is stripped. The **runtime** call works in both
engines, including the Firefox the existing matrix uses:

```ts
await page.emulateMedia({ forcedColors: 'active' })
```

Measured after that call, on a card carrying all three signals:

| Property | Normal | forced-colors: active |
|---|---|---|
| `box-shadow` | `rgba(0,0,0,.12) 0 4px 8px -1px` | `none` |
| `border-color` | `rgb(218,216,220)` | `rgb(0,0,0)` — **survives** |
| `background-color` | `rgb(249,249,249)` | `rgb(255,255,255)` — flattened |

This reproduces the forced-colors table in the broader spec, so the test needs no
new browser project.

Mutation checks, applied one at a time and restored immediately:

- change a shadow offset, blur, spread or alpha;
- give the shadow colour a non-zero chroma;
- emit `rem` instead of `px`;
- delete the border from `raised`, or the shadow from `overlay`;
- give `flat` a border or a shadow;
- move shadow primitives into a theme scope;
- move elevation roles into the global group;
- point a light role at a dark primitive.

Each must fail a targeted test.

The complete gates remain:

```bash
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Two consecutive builds must produce identical checksums for `lattice.css` and
`tokens.json`.

## Documentation

The README moves elevation into the implemented scope, leaving semantic spacing,
wide-gamut output and components under "Not yet". The broader spacing and motion
specification remains the source for the research and rationale; this document
defines the implementation boundary for issue #30.

## Non-goals

- semantic spacing roles (`--lat-inset-*`, `--lat-gap-*`);
- a z-index scale, which the broader spec defers until a component inventory
  exists;
- inset or inner shadows;
- shadow colours other than neutral;
- component elevation behavior, which belongs to #11;
- a `forced-colors` stylesheet shipped by the token package.
