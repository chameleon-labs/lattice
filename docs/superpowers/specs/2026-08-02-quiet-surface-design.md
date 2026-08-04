# Quiet Surface: depth from light, colour for meaning

**Status:** superseded by
[Replacing Lattice's visual identity with a Figma-generated one](./2026-08-03-lattice-identity-design.md)
(2026-08-03). Lattice's Figma-generated identity tints its surfaces and makes the accent the primary
action — the opposite call to this document on both counts.

**One rule survives and is carried forward:** an edge is a real border, never
`box-shadow`, because `box-shadow` is not rendered under forced-colors. That was
an accessibility finding, not a style preference. The backdrop finding recorded
here — 80% of near-white laid over near-white renders no scrim — is also carried
forward and must not be reintroduced.
**Date:** 2026-08-02
**Packages:** `@chameleon-labs/lattice-tokens`, `@chameleon-labs/lattice-react`

## The problem

Open the `Dialog/Open` story beside [Kontur's modal](https://guides.kontur.ru/components/popup-elements/modal/)
and the difference is not a matter of one component's proportions. Measured, side
by side:

| | Kontur | Lattice today |
| --- | --- | --- |
| Modal surface | `#fff` | `oklch(0.958 0.0018 305)` |
| Modal radius | 16px | 12px |
| Backdrop | present, dims the page | `oklch(0.993 …)` at 0.8 |
| Primary action | `rgb(61, 61, 61)` | accent violet at chroma 0.2 |
| Control text | 16px / 400 | 14px / 600 |
| Hairlines | `box-shadow: 0 0 0 1px` | `border: 1px solid` |

Three of those rows are the whole story, and none of them is the radius.

**Our surfaces are tinted, so nothing floats.** `ELEVATION_LEVELS` gives `modal`
the `component` surface step, which in light mode is grey 3. A grey card on a
grey page does not read as lifted, however large its shadow.

**Our backdrop does nothing.** `.lat-dialog__backdrop` is `--lat-gray-1` at
`opacity: 0.8` — in light mode, 80% of near-white laid over near-white. The page
behind an open modal stays fully legible. The scrim is present in the markup and
absent in the render.

**Our colour is spent on presence rather than meaning.** Every solid button is
brand violet or a saturated status hue, so nothing is quiet enough to make
emphasis mean anything. Kontur's calm is not restraint applied to the modal; it
is restraint applied everywhere, which is what buys the one accented control its
force.

There is also a defect, found while measuring rather than looked for. The `<p>`
inside `.lat-dialog` computes to **Times**. Our typography lands only on elements
carrying an explicit role class, and `dialog.css` never sets a family, so any
unclassed content inside a Lattice surface falls through to the browser serif.
The `Dialog/Open` story has shipped this since the component library landed.

## What this builds

A system-wide visual direction, not a modal variant. Three rules:

1. **A surface that floats is the page's own white, lifted by shadow and a
   hairline** — not a tinted step.
2. **An edge is a hairline the whole system shares**, drawn with `--lat-ring`.

   This rule was originally written as "an edge is a ring, not a border",
   meaning `box-shadow: 0 0 0 1px` — which occupies no layout, so a state could
   thicken an edge without moving the pixel beside it. **Implementation
   disproved it.** `box-shadow` is not rendered in forced-colors, so a control
   whose only edge is a ring has no edge at all for a high-contrast user;
   `tests/browser/a11y.spec.ts` already asserted exactly this, and `card.css`
   already recorded the reason — "the border is the only one that survives
   forced-colors, where the user agent strips shadows and flattens surfaces".

   So edges stay real borders and `--lat-ring` supplies their *colour*. The
   Quiet Surface hairline is a value, not a mechanism. The no-layout-shift
   benefit is forfeited, and it was never worth an accessibility regression.
3. **Accent is opt-in emphasis.** The default action is neutral; violet is
   something a caller asks for.

The name for the direction is *Quiet Surface*.

## Tokens

### Radius

`RADII` gains `xl: 1` (16px). Containers — dialog, card, menu — move to `xl`;
controls stay at `md` (8px). That pairing is Kontur's measured one, and it
already has a home in our system: `NESTED_RADIUS_PAIRINGS` exists to record which
outer radius sits correctly around which inner one, and gains
`{ outer: 'xl', gap: '2', inner: 'md' }` — the existing entry encodes
`inner = outer − gap` (12px − 8px = 4px), and 16px − 8px = 8px holds it.

`CONTAINERS` gains `dialog: 37.5` (600px). The dialog is currently sized by
`prose` (42rem / 672px), which is a measure for running text and not a reason for
a dialog to be that wide.

### The `ui` role

```
ui: fontSize 'sm' → 'base'        (14px → 16px)
    fontWeight 'semibold' → 'regular'
    lineHeight 'snug'              (unchanged)
```

`snug` stays: at 16px it holds the line box at 22px and a medium button at 40px,
against Kontur's measured 38px. `normal` would give 24px and a 42px control,
which is a larger change than the direction asks for.

One edit. `--lat-text-ui-font-size` has eight call-sites across the component
CSS, so every control retunes together — which is the argument for the semantic
role tier existing at all.

### Rings and scrim

Two new semantic tokens:

- `--lat-ring`, the hairline an edge is drawn with.
- `--lat-scrim`, what a backdrop is actually made of.

`--lat-scrim` becomes a neutral black at 0.28 on light and 0.6 on dark, rather
than grey 1 at 0.8. The current value is not a tuning error; it is the wrong
colour entirely, and no alpha applied to grey 1 would fix it. Neutral rather than
tinted for the reason `elevation.ts` already records for shadows: measured, the
two differ by at most 1.019 contrast.

`--lat-ring` is translucent black on light and an opaque grey step on dark. That
difference in *kind* is why neither role can be an ordinary step alias, whose
shape is always scale-plus-step.

### Elevation, which is where the real work is

`elevation.ts` records the finding that governs this section:

> Composited over each mode's page surface and measured with this system's own
> contrast module, a shadow is worth 1.315:1 on light and 1.016:1 on dark at the
> same alpha — and at 50% black the dark figure still only reaches 1.058:1. There
> is no alpha at which a shadow becomes load-bearing on a dark surface, which is
> why every level above `flat` also carries a surface step and a border.

Quiet Surface asks for white surfaces whose edge is carried by a translucent
ring. **That works on light and collapses on dark**, for two compounding reasons:
a translucent black ring over a dark surface is invisible, and the shadow that
would otherwise cover for it was already worth nothing. Adopting the light-mode
treatment unconditionally would delete the only two signals dark mode has.

So elevation becomes mode-aware — a dimension `ELEVATION_LEVELS` does not have
today, since it is currently a single theme-independent table:

- **Light.** Levels above `flat` resolve their surface to the `bg` step — grey 1,
  the same step `flat` uses — and take their edge from `--lat-ring` plus the
  existing shadow recipe. An elevated surface being *identical* to the page
  beneath it is the intended outcome, not a collision: separation comes from the
  scrim and the shadow, which is exactly how Kontur's white-on-white modal reads.
- **Dark.** Levels keep exactly today's behaviour: a surface step *and* a border,
  because #30's measurement has not changed.
- `--lat-ring` resolves per mode — translucent black on light, an opaque grey
  step on dark, for the same reason.

This is the largest piece of the work and the one most likely to surface
surprises. It is also the piece that keeps the calibration honest instead of
quietly regressing it.

## Components

Thirteen stylesheets, 43 border declarations, 11 radius usages.

**No border converts to a `box-shadow`**, per the correction to rule 2 above.
What changes is the colour they are drawn in and the radius they sit on. The
`badge` severity edges and the `callout` accent stripe were already documented as
borders *specifically* so they survive forced-colors; the `table` row rules and
the `tabs` underline are structural, dividing content rather than bounding a
component. All of them stay exactly as they are.

**Focus rings stay `outline`.** `:focus-visible` is untouched. This was always
the rule for focus; the correction above simply extends the same reasoning to
every other edge.

**Containers, not controls, take `xl`.** `card` and `dialog` move to 16px.
`menu` does **not**: it pads by `space-1`, and `inner = outer − gap` would force
its items to a 12px radius, which is disproportionate for a dense list. A menu is
a control surface rather than a container.

**Button** takes the neutral default. `data-variant="solid"` with no tone
resolves to the grey solid; accent becomes something the caller names.

**Dialog** gets the treatment the comparison was built from: white surface, `xl`
radius, the new `dialog` container width, `space-6`/`space-8` padding (24px
block, 32px inline), a hairline above the footer,
and a slot for the close ✕ — `.lat-dialog__dismiss` has a class applied by
`DialogDismiss` today and no rule anywhere in `dialog.css`, so the affordance
exists in the API and not in the render.

**The Times fix.** Components owning a content region set
`font-family: var(--lat-text-body-font-family)` on that region, so unclassed
markup inherits the sans stack. This is a defect fix and is correct independently
of the redesign.

## What this breaks

Stated plainly, because all three are deliberate:

1. **Accent-solid buttons become neutral** in every consuming app that did not
   name a tone. This is an appearance change to the default, and it is the point
   of rule 3 — but it needs a major-version note, not a patch.
2. **Control text 14px → 16px changes button heights** (~37px → ~40px) and
   therefore any form layout that assumed the old rhythm.
3. **The contrast contracts need re-running.** `{ step: 11, reference: 2 }` and
   `{ step: 12, reference: 2 }` measure text against grey 2 as the worst case. If
   light-mode elevated surfaces become step 1, that pairing must be verified
   against step 1 as well — and if step 1 turns out to be the worse reference in
   light mode, the contract changes, not the colour.

## Testing

- **Tokens.** `contrast.test.ts` extends to the new surface reference.
  `elevation.test.ts` needs per-mode expectations, which it has never had.
  `snapshot.test.ts` and the emit tests move with the new tokens.
- **React.** The a11y sweep re-runs across every story. The forced-colors test is
  the one that matters most here: it is the check that proves the ring conversion
  did not weaken focus.
- **Visual.** The three-column comparison built during design
  (`mockup.html`, rendered against the real token and component CSS) is the
  reference for what "done" looks like.

## Found while building, and fixed here

**Portalled surfaces escaped the theme scope.** Dialog and Menu render into a
portal at `document.body`, which is outside the Storybook decorator's subtree, so
they resolved against the root theme. In dark mode this produced a white dialog
on a black page. It is **pre-existing** — the same bug is visible in the build
before this work, where the dark dialog renders on a light grey surface — but
white-on-black made it impossible to ignore. The decorator now stamps
`data-lat-theme` on the document element as well as the wrapper.

**The dismiss hook could not carry a shape.** `DialogDismiss` puts
`lat-dialog__dismiss` on every dismiss it renders, including one rendered as a
`Button`, so sizing that class collapsed every footer button to a 32px square
with its label spilling out. The icon close is now its own opt-in
`lat-dialog__close`, and the hook imposes no shape.

## Out of scope

- **The typeface.** Kontur ships Lab Grotesque, which is proprietary. We keep the
  current stack and fix the fallback; adopting an open grotesque is a separate
  decision with its own loading strategy.
- **Kontur's structural modal model** — Header/Content/Footer slots, sizes,
  sticky regions, page-level scrolling, the mini-modal variant, and the
  behavioural rules around backdrop dismissal. This spec is the visual direction
  only. That work is a candidate follow-up.
