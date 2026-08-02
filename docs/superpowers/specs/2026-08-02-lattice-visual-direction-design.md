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
  **Under review — see "The accent hue is open" below.** The directions are
  authored against the hue as a *variable*, never as a literal, so a change to it
  costs nothing here.
- **Grey shares the accent's hue** at peak 0.012, so surfaces are faintly
  accent-tinted rather than dead. Whatever the accent becomes, grey follows.
- **Status hues are fixed**: danger 27°, warning 75°, success 145°, with the
  severity ramp at 14°, 36°, 62° and 88°.
- **Step 9 is mode-invariant.** A solid fill is the same colour in both themes.
- **Shadows are not load-bearing on dark.** The #30 calibration measured a
  shadow at 1.315:1 on light and 1.016:1 on dark; at 50% black the dark figure
  still only reaches 1.058:1. This is why every elevation level above `flat`
  carries a surface step *and* a border.
- **Motion is authored only inside `prefers-reduced-motion: no-preference`.**
  There is no global reset to strip, and no direction may introduce one.
- **Severity is never colour alone.**

A direction retunes. It does not renegotiate.

## The accent hue is open

Raised after the directions were built: the magenta is not settled. This does not
disturb the work above — no direction hardcodes the accent, so the hue can change
underneath all three — but it is worth recording what the measurement found,
because the constraint is unusually sharp for this product.

**The brand must never be mistakable for a status.** Seven colours are already
spoken for, so the accent's job is to be far from all of them under colour-vision
deficiency, not merely far in degrees. Candidates were scored by simulating
protanopia, deuteranopia and tritanopia with the system's own `cvd` module and
taking the worst ΔE against all seven.

Each candidate had its step-9 lightness re-solved, because **the lightness at
which white text reaches 4.5:1 is hue-dependent** — 0.561 at 230° rising to 0.591
at 305°. Each was then built by the real pipeline, which fails if any contract
breaks. All five built.

| Hue | Solid | Step-9 L | Chroma fitted | Normal | Protan | Deutan | Tritan |
|---|---|---|---|---|---|---|---|
| 230° teal | `#0080a9` | 0.561 | **0.112** | 20.6 | 13.8 | 16.7 | 7.4 |
| 255° azure | `#0075e3` | 0.572 | 0.188 | 29.5 | 23.5 | 26.2 | 7.0 |
| 275° indigo | `#5d67ee` | 0.582 | 0.200 | 31.5 | 25.9 | 27.6 | 9.5 |
| 295° violet | `#895ae4` | 0.588 | 0.200 | 27.3 | 25.1 | 25.8 | **13.0** |
| 305° magenta *(current)* | `#9a54da` | 0.591 | 0.200 | 25.0 | 24.1 | 23.9 | 9.7 |

Three findings, each a measurement rather than a preference:

1. **Teal is out on chroma, not on separation.** sRGB cannot hold chroma 0.200 at
   230°, so gamut mapping reduces it to 0.112 — the brand colour would be visibly
   *less saturated than the status colours beside it*. The whole blue-green
   region 165°–245° has this problem.
2. **295° dominates 305° on every axis** — normal 27.3 vs 25.0, protan 25.1 vs
   24.1, deutan 25.8 vs 23.9, tritan 13.0 vs 9.7. A 34% improvement in the worst
   case for a 10° shift. If the answer is "keep purple", it should be 295°.
3. **The purple region is not arbitrary.** 285°–305° is the most separable band
   from the status palette overall, which means the original choice was defensible
   even though it was not optimal.

Changing it is three numbers in `packages/tokens/config/scales.ts`: the accent's
`hue`, its pinned `solid.lightness`, and `gray.hue`. Everything else is generated.

**Not decided here.** This section records what was measured, not what was
chosen, and the hue is deliberately left as it ships until someone picks.

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
from the accent's 305° toward violet at 275°, between two steps of **identical
lightness**. Colour that changes across a surface without the surface changing
brightness. Structural colour, literally.

| Aspect | Rule |
|---|---|
| Solid fills | Linear gradient, accent 305° → 275°, both endpoints at **L 0.575**, C 0.200 — `#954fd5` → `#5b65ec` |
| Radius | `lg` (0.75rem) on surfaces; `full` on badges, which become pills |
| Elevation | Generous — every level moves up one shadow step: `raised` to `medium`, `overlay` to `large`, `modal` to `large` at increased alpha |
| Motion | `duration-base` over `fast`; `easing-entrance` on overlay appearance |
| Status | Flat fills, unchanged. Only the accent is iridescent |

**How this stays provable rather than decorative.** Each endpoint is subject to
the same 4.5:1 contract against white that the flat accent fill passes today, and
the interpolation between them is sampled and contracted at every step.

### What the measurement changed

This section originally claimed that holding lightness constant made contrast
"approximately flat" across the sweep, so validating the endpoints would bound
the middle. **The first half of that is wrong and the second half is right.**
Both were measured against the real pipeline before implementation, and the
design below is the corrected version.

**Contrast is not flat across hue at fixed lightness — it falls toward blue.**
At the accent's pinned L 0.591, hue 305° reaches exactly 4.500:1 against white
and hue 275° reaches only 4.338:1. The lightness a hue *needs* in order to clear
4.5:1 varies:

| Hue | L needed for 4.5:1 at C 0.200 |
|---|---|
| 305° | 0.5911 |
| 295° | 0.5889 |
| 285° | 0.5860 |
| 275° | 0.5823 |

Reducing chroma makes this worse rather than better — at L 0.591, dropping the
violet end from C 0.200 to C 0.150 moves it from 4.338:1 to 4.241:1, because it
slides toward a mid-grey that has less contrast against white than the saturated
colour did. **Chroma is the wrong lever; lightness is the right one.**

**So both endpoints are pinned to the darker of the two required lightnesses.**
At L 0.575 the magenta end measures 4.817:1 and the violet end 4.641:1, with the
worst point across a 61-sample sweep at 4.641:1. L 0.5823 — the exact solved
boundary — was rejected: it measures 4.49997:1 and fails, which is precisely the
kind of margin-free value that passes a solver and fails a build.

The cost is that the gradient's magenta end sits fractionally darker than the
shipped `--lat-accent-solid` at L 0.591. The difference is `#954fd5` against
`#9a54db`, which is not perceptible in isolation and does mean the fill no longer
begins at exactly the brand solid.

**The monotonicity assumption held.** Across 61 samples the worst contrast always
falls at the violet endpoint, never in the middle — so endpoint validation really
does bound the sweep for this hue range. The sampling is kept anyway, because it
costs nothing and the assumption was only established for *this* range.

Two consequences follow:

1. Status fills stay flat. A gradient on `danger` would make severity harder to
   recognise, and severity has the stronger claim — the same argument the tabstop
   spec makes for refusing a second brand hue.
2. The endpoints are **not** emitted as shipped tokens. Wiring a token through
   the generator for a candidate that may lose is the scaffolding-becoming-
   permanent risk this spec's exit condition exists to prevent, and the direction
   stylesheets are not shipped, so such a token would have no consumer. The
   values are computed by the real pipeline modules and contracted in a test,
   which keeps the guarantee — the build fails if either end misses 4.5:1 —
   without shipping anything. If Iridescent wins, the fold-in promotes them into
   `scales.ts` and `contracts.ts` properly.

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
Iridescent only, a test in the tokens package that computes both gradient
endpoints with the real pipeline and contracts the sweep between them.

**Out:** choosing the winner (that is a human looking at a screen); folding the
winner into the real tokens and component CSS (a separate change, once there is a
winner); the documentation site; brand marks, logo and illustration; the written
voice, which the README already has and which is not the gap.

**Deleted on completion:** the two losing stylesheets, the `none` option, and —
if Iridescent loses — the gradient endpoint test.

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
