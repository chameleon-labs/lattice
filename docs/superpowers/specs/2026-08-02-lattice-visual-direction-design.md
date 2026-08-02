# Lattice — visual direction

**Date:** 2026-08-02
**Status:** approved, unimplemented
**Package:** `@chameleon-labs/lattice-react` (evaluation harness), `@chameleon-labs/lattice-tokens` (the eventual fold-in)

## Purpose

Lattice is correct and anonymous. Fourteen component families render, every
contrast pair passes, every story is scanned — and nothing in a screenshot of
the result says *Lattice*. `radius-md` on every corner, a 1px transparent
border, `translateY(1px)` on press and a 2px focus ring is what a careful
engineer produces when no one has decided what the system should look like.

This document specifies how that decision gets made: three visual directions,
built as swappable layers over the real components, compared in the real
gallery, one chosen and folded in.

It does not choose the direction. Choosing requires seeing them, which is the
whole point of building them.

## What is already decided and is not up for re-litigation

The directions are constrained by work that has shipped, and stating the
constraints first is what stops this becoming a re-design.

- **The accent is hue 305°** — magenta — at peak chroma 0.200, with step 9
  pinned to L 0.591, the exact lightness where white text reaches 4.50:1.
- **Grey shares hue 305°** at peak 0.012, so surfaces are faintly accent-tinted
  rather than dead.
- **Status hues are fixed**: danger 27°, warning 75°, success 145°.
- **Step 9 is mode-invariant.** A solid fill is the same colour in both themes.
- **Shadows are not load-bearing on dark.** The #30 calibration measured a
  shadow at 1.315:1 on light and 1.016:1 on dark; at 50% black the dark figure
  still only reaches 1.058:1. This is why every elevation level above `flat`
  carries a surface step *and* a border.
- **Motion is authored only inside `prefers-reduced-motion: no-preference`.**
  There is no global reset to strip, and no direction may introduce one.
- **Severity is never colour alone.**

A direction retunes. It does not renegotiate.

## The mechanism

### Direction as an overlay layer

Each direction is one CSS file scoped to an attribute:

```
packages/react/.storybook/directions/
  instrument.css      [data-lat-direction='instrument'] { … }
  blueprint.css       [data-lat-direction='blueprint']  { … }
  iridescent.css      [data-lat-direction='iridescent'] { … }
```

A Storybook global named `direction` drives a toolbar control, mirroring the
existing `theme` global exactly. The preview decorator sets both attributes on
the same wrapper element:

```tsx
<div
  className="lat-story"
  data-lat-theme={theme}
  data-lat-direction={direction}
>
```

Every one of the fourteen families' existing stories therefore re-renders in the
selected direction with no story authored per direction. The comparison is made
against the real components, not against mockups of them.

`direction` defaults to `none` — the system exactly as it ships today, which is
the control the three are being judged against.

### What a direction may and may not touch

**May:** override any token within its scope; add component-level rules
(`[data-lat-direction='x'] .lat-button { … }`); add pseudo-elements.

**May not:** change component markup, props, or any TypeScript. If a direction
needs a DOM change to work, that is a finding about the component and belongs in
its own issue, not smuggled in through a theme layer.

This boundary is what keeps the three comparable — the differences are visual
rather than structural — and it is what makes the winner foldable, since a
token-and-CSS diff folds into a token config and a component stylesheet.

### Why not the alternatives

**A branch per direction**, implementing each properly in the real CSS, gives
the highest fidelity and was rejected on comparison: three built Storybooks
cannot be flipped between in under a second, and the flip is how the judgement
actually gets made.

**A specimen page per direction** with no story retuning was rejected as
insufficient on its own — it proves feel and not coverage. It is folded in below
as an addition rather than a replacement.

### The specimen story

Each direction is also judged on one composed screen, because a row of buttons is
not a design system and nobody has ever chosen one by looking at a row of
buttons. A single new story — `Specimen` — renders a realistic dense screen:

a page header, a `Table` of rows carrying `Badge` severity markers, a `Callout`,
a `Card` group, a `TextField` and `Switch` pair, a `Menu` trigger and an open
`Dialog`.

One story, re-rendered per direction by the same global. It composes every family
whose appearance a direction changes, so it also serves as the cheap sweep target
described below.

## The three directions

### 1 · Instrument

The precision pole. Restraint is the statement.

| Aspect | Rule |
|---|---|
| Radius | `sm` (0.25rem) everywhere; `full` only on the switch thumb |
| Elevation | Borders do the work — `raised` and `overlay` lose their shadows entirely, `modal` drops from `large` to `small` |
| Density | One step tighter: `md` button padding `space-1`/`space-3` |
| Numerals | `font-variant-numeric: tabular-nums` on table cells, badges and any numeric role |
| Press | No transform; state reads through fill and border only |
| Colour | Neutral-dominant. Accent on interactive affordance, status hues on status. Nothing decorative is coloured |
| Border | Every surface carries a visible 1px border, not a transparent one |

The elevation rule is not a stylistic preference. The #30 calibration already
established that a shadow is worth 1.016:1 on dark, which is to say nothing.
Instrument makes dark mode's measured truth the rule in both modes, and the
system loses a signal it was never really carrying.

`tabular-nums` needs no new font. The system sans stack supports it, so this
costs one declaration and no bytes.

### 2 · Blueprint

Instrument's base with one loud move: **the focus ring is the ornament.**

Every other system minimises focus. A system whose README opens with
*"Accessibility is the constraint, not the feature"* has the standing to do the
opposite, and this is the direction that argues from the thesis rather than
decorating it. It also cashes in the name — a lattice is a grid.

| Aspect | Rule |
|---|---|
| Base | Instrument, entirely |
| Focus | 3px accent ring, `outline-offset: 3px`, plus an outer 1px halo at the accent's step-8 border colour |
| Selection | A persistent 3px accent rail on the leading edge of the selected tab, active menu item and current table row |
| Texture | A 1px structural grid, at the subtle-border step, in empty regions of `Card` and `Table` |
| Everything else | As Instrument |

**The conformance claim this direction can make.** WCAG 2.2 SC 2.4.13 *Focus
Appearance* (AAA) asks for an indicator at least as large as a 2px-thick
perimeter of the focused control, with at least 3:1 contrast between focused and
unfocused states. Lattice's current 2px ring at 2px offset is at the edge of
that. Blueprint's 3px ring clears it with room, on every component, in both
themes.

If Blueprint wins, Lattice ships a design direction that is also an AAA
conformance claim, and the claim is testable by the harness that already exists.
No other direction here can say that. **This is a hypothesis to verify during
implementation, not an assertion** — the measurement is part of the work, and if
it fails, it fails visibly rather than quietly.

### 3 · Iridescent

The expressive pole, built from the origin story rather than from a mood board.

The README already states it: chameleons have no violet pigment; the colour
comes from the *spacing* of a guanine nanocrystal lattice. Structural colour, not
pigment. That is a brief no other design system is entitled to use, and the
accent sitting at 305° — a magenta that resolves toward violet — means the
system has already half-committed to it.

**The signature:** solid fills carry a hue-shifted OKLCH gradient, interpolating
from the accent's 305° toward violet at roughly 275°, between two steps of
**near-identical lightness**. Colour that changes across a surface without the
surface changing brightness. Structural colour, literally.

| Aspect | Rule |
|---|---|
| Solid fills | Linear gradient, accent 305° → 275°, both endpoints at L 0.591 ± 0.005 |
| Radius | `lg` (0.75rem) on surfaces; `full` on badges, which become pills |
| Elevation | Generous — every level moves up one shadow step: `raised` to `medium`, `overlay` to `large`, `modal` to `large` at increased alpha |
| Motion | `duration-base` over `fast`; `easing-entrance` on overlay appearance |
| Status | Flat fills, unchanged. Only the accent is iridescent |

**How this stays provable rather than decorative.** The gradient's endpoints are
each a real token, and each is subject to the same 4.5:1 contract against
`on-solid` that the flat fill passes today. Holding lightness constant across the
interpolation is what makes that tractable: contrast against the label is
approximately flat across the sweep, so validating the endpoints bounds the
middle.

Three consequences follow, and each is work rather than an assumption:

1. The generator emits a second accent step-9 at hue 275°, gamut-mapped into
   sRGB by the existing routine — chroma 0.200 at 275° may not survive sRGB
   intact, and reducing chroma while holding lightness and hue is what the
   pipeline already does.
2. `contracts.ts` gains the second endpoint as a contracted pair, so the build
   fails if the violet end misses 4.5:1 exactly as it would for the magenta end.
3. Status fills stay flat. A gradient on `danger` would make severity harder to
   recognise, and severity has the stronger claim — the same argument the tabstop
   spec makes for refusing a second brand hue.

**The honest risk.** Endpoint validation bounds the middle only under the
assumption that contrast varies monotonically between two endpoints of equal
lightness. That assumption is very likely true and is not proven. If the
implementation finds a mid-sweep dip, the answer is to sample the interpolation
at intervals and contract every sample — more expensive, still automatic, and
detected by measurement rather than by review.

## The accessibility sweep

This is the design's one genuinely awkward interaction, and it is worth stating
plainly rather than discovering it in CI.

`tests/browser/a11y.spec.ts` visits every story in the index × two themes.
Adding a third axis multiplies that by four (`none` plus three directions). At
the current 42 stories across fourteen files, the sweep goes from 84 axe runs
to 336.

**The decision: the full matrix runs.** Directions change fills, borders and
focus indicators, which is to say they change precisely the things axe checks.
A direction that cannot pass the sweep is not a candidate that needs discussing —
it is disqualified, and finding that out early is the cheapest possible outcome.
Scanning only the default direction would make the evaluation unsound in exactly
the way this system refuses everywhere else: *a story is scanned because it
exists.*

The cost is accepted because it is **temporary**. Two of the three directions are
deleted when one wins, and the matrix returns to its current size — smaller, in
fact, since `none` disappears too.

If the sweep becomes painful before that point, the escape is to subset by tag
rather than to stop scanning: every story at the default direction, plus the
`Specimen` story at every direction and theme. `Specimen` composes every family
whose appearance a direction touches, so the coverage loss is bounded and
nameable. This is the fallback, not the plan.

## Scope

**In:** the `direction` global and decorator wiring; three direction stylesheets;
the `Specimen` story; the sweep extended across the direction axis; for
Iridescent only, a second accent endpoint in the generator and its contract.

**Out:** choosing the winner (that is a human looking at a screen); folding the
winner into the real tokens and component CSS (a separate change, once there is a
winner); the documentation site; brand marks, logo and illustration; the written
voice, which the README already has and which is not the gap.

**Deleted on completion:** the two losing stylesheets, the `none` option, and —
if Iridescent loses — the second accent endpoint and its contract.

## Exit condition

The direction layer is evaluation scaffolding and must not become permanent.
It is confined to `.storybook/`, is never exported from the package, and
`published-surface.test.ts` already asserts the package's exports, so it cannot
leak to a consumer even by accident.

The work is done when one direction is chosen and the other two are gone. A
follow-up change folds the winner into `packages/tokens/config/` and the
component stylesheets, at which point `data-lat-direction` disappears entirely —
the winning direction is not a theme, it is what Lattice looks like.

## What this deliberately does not do

**It does not add a fourth, editorial direction.** Kontur's register was
considered and set aside: the editorial quality Lattice wants is already present
in its prose, and a direction that expressed it visually would be competing with
the README rather than extending it.

**It does not make the directions user-facing theming.** A consumer retuning hue
and radius is a reasonable future feature and is a different design — one about
which seams are public and stable. Borrowing this scaffolding for it would ship
an evaluation harness as an API.

**It does not touch the documentation site.** The site should express whatever
the system turns out to look like. Designing it first would invert that.
