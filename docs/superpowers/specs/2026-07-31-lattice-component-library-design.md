# Lattice — component library on Ariakit

**Date:** 2026-07-31
**Status:** approved
**Issue:** [#11 — Spec: component library on Ariakit](https://github.com/chameleon-labs/lattice/issues/11)

## Purpose

Define `@chameleon-labs/lattice-react`, the component layer that turns the token
system into things a product can render. Ariakit supplies composition and
behaviour where it exists; Lattice decides appearance and guarantees legibility.
This document fixes what ships, how it is styled, how far its types go, and how
each accessibility promise is tested rather than asserted.

The token package is complete enough to build on. It emits 279 custom properties
across colour, eleven semantic typography roles, spacing, breakpoints,
containers, radii, motion primitives and calibrated elevation. Every blocker this
issue named — #6, #27, #28, #29, #30 — is closed.

## Inventory

Fourteen components.

| Component | Ariakit part | What it is for |
|---|---|---|
| `Button` | `Button` | The reference implementation of the styling, focus and motion contracts, and the trigger every overlay needs |
| `Input` | — native `<input>` | The bare styled control, for cases where the label lives elsewhere |
| `TextField` | — `useId` | `Input` plus label, description and error, wired |
| `Switch` | `Checkbox` | A binary control whose state is not a colour — #20's pause/resume |
| `Disclosure` | `Disclosure` | `aria-expanded` button and region — #19's violation rows |
| `Tabs` | `Tab`, `TabList`, `TabPanel` | Roving focus, panel association |
| `Menu` | `Menu` | Keyboard navigation, typeahead, focus return |
| `Dialog` | `Dialog` | Focus trap, focus return, scroll lock, labelling |
| `Card` | — | The `raised` elevation role as a component |
| `Badge` | — | A status marker that is never only a colour |
| `Callout` | — | An inline, persistent message carrying severity |
| `Table` | — native table elements | Correct table semantics by construction |
| `VisuallyHidden` | `VisuallyHidden` | Text for assistive technology only |
| `LiveRegion` | — | Announcements that do not repeat themselves |

Seven of the fourteen wrap Ariakit. That ratio changes what this package is: not a
thin skin over Ariakit, but **a component layer built on tokens that wraps Ariakit
where behaviour is hard**. The README's claim to be opinionated about values and
behaviour while staying unopinionated about composition still holds — it is just
carried by the token system for most of the list rather than by Ariakit.

### The admission test

Every component above makes a guarantee a consumer would otherwise have to
remember: behaviour Ariakit supplies, an ARIA relationship wired correctly, a
signal that is not only a colour, or a required prop that turns a common omission
into a compile error. The **Component guarantees** section below states each one.

That is the test for admission, and it is worth stating because it is what
excludes the near misses rather than taste.

### What is not here

**`EmptyState`** was on the requested list and is out on this test. It has no
guarantee to make: it is a heading, some text and a slot, composed from spacing
and typography the system already ships. The evidence against it is specific
rather than general — tabstop #29's state matrix names four empty states and they
share no structure. The dashboard's *is* the URL input (#20 is explicit that it
must be the form itself, not a message pointing at one); the home screen's is the
hero; the page-detail one is a chart placeholder; and the zero-violations state is
a celebration carrying a caveat about automated testing not proving
accessibility. A shared component would fight all four. Each screen composes
`Card`, `Button`, `Callout` and typography instead, which is the level this system
should be working at.

Shipping one would not have been unusual — Polaris, Atlassian and Primer (as
`Blankslate`) do, and Spectrum has `IllustratedMessage`, while Radix, MUI, Carbon
and Ariakit do not. The split tracks product systems against primitive ones, and
Lattice is a product system. It is the specific case that fails, not the category.

**`Skeleton`**, which tabstop #29 asks for on the dashboard and chart. Out for
now, and for a reason that makes it a decision rather than an omission: a shimmer
is the one thing in this system that would want *continuous* motion, which the
reduced-motion contract currently forbids outright. Admitting it means designing
the pausability escape, and that deserves its own issue rather than riding along
in a fourteen-component change.

**`Link`, `Tooltip`, `Toast`, `Select` and `Combobox`.** None is requested and
none is used by a specified tabstop screen. `Toast` is deferred rather than
forgotten for the same reason as `Skeleton`: a transient, auto-dismissing message
interacts with the reduced-motion and pausability criteria and deserves its own
decision.

### A superseded decision, recorded

An earlier draft of this document shipped five components and left `Card`,
`Table` and `Badge` for tabstop to hand-roll directly on tokens — the seam being
that Lattice ships only what Ariakit makes expensive to get wrong. **That seam is
gone.** This inventory includes those components, so tabstop consumes
`lattice-react` for substantially its whole UI rather than for a hard core.

The consequence worth naming: tabstop #17 currently states that a component
library is out of scope for `web/` and that the four screens should be built
first and extracted from later. That issue needs amending, and #19 through #23
are now downstream of this package rather than independent of it.

## Public contract

### Package and peers

`packages/react/`, beside `packages/tokens/`, inheriting `tsconfig.base.json` and
overriding `noEmit` — this package emits, where the token package does not.

| Peer | Range | Why a peer |
|---|---|---|
| `react`, `react-dom` | `>=19` | `useId` and ref-as-prop; no `forwardRef` anywhere in this package |
| `@ariakit/react` | `^0.4.35` | The seam that keeps `lattice-tokens` installable without React |
| `@chameleon-labs/lattice-tokens` | set by #10 | The app loads `lattice.css` itself; two copies would double-declare every custom property |

The token range is deliberately unset here. That package is still `0.0.0` and
`private`, so the first honest range is the one #10 establishes when it decides a
version. Development uses `workspace:*`.

### Styling

Component CSS ships as one plain stylesheet with stable class names.

```
@chameleon-labs/lattice-react/styles.css
```

Block-level names are `lat-{component}`. Variants, sizes and tones are `data-*`
attributes, not modifier classes:

```css
.lat-button[data-variant='solid'] { … }
```

Data attributes rather than modifier classes because the prop maps to the
attribute one-to-one, the current state is legible in a DOM inspector and in a
Playwright selector without a lookup table, and selector specificity stays flat
at `0,2,0` for every variant rule rather than climbing as combinations are added.

**The names are stable and documented, because they are an escape hatch.** The
token package already publishes `--lat-*` names it expects consumers to read and
override; publishing class names is the same bargain one layer up. This is the
answer to the issue's question about how consumers escape the system: they target
a documented selector, or they pass `className`, which is prepended so it can add
but never remove.

Three rules, each enforced by a test rather than by review:

1. **No colour literal appears in component CSS.** Every colour is a
   `var(--lat-…)` reference. This is the token package's own rule, applied to the
   layer above it.
2. **Every `--lat-*` a component references exists in the emitted `lattice.css`.**
   This is the cross-package form of the token package's "every alias reference
   resolves" assertion, and it is what stops the two packages drifting.
3. **Motion is opt-in.** See below.

Dimensions are `var()` references except hairline borders and focus outlines,
which are `px` for the reason the elevation spec already established: an edge
effect that scales with the user's font size blooms without becoming more legible.

Spacing references the `--lat-space-*` primitives directly for now. Semantic
inset and gap roles are extracted from these stylesheets once they exist, for
reasons set out below.

### Reduced motion

The issue's acceptance criteria are satisfied structurally rather than by a
cleanup pass.

Colour, background, border and opacity transitions are declared unconditionally.
Any transition that moves an element is authored **inside**
`@media (prefers-reduced-motion: no-preference)`:

```css
.lat-button {
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: var(--lat-duration-fast);
  transition-timing-function: var(--lat-easing-standard);
}

@media (prefers-reduced-motion: no-preference) {
  .lat-button:active {
    transition-property: background-color, border-color, color, box-shadow, transform;
    transform: translateY(1px);
  }
}
```

Under `reduce` there is nothing to strip, so a global reset is not merely
forbidden — it is unnecessary. The inversion matters: a system that authors
movement everywhere and removes it under `reduce` gets the criterion right only
where someone remembered, and its failure mode is silent. A system that authors
movement only where it is welcome fails closed.

Mapped to the acceptance criteria:

| Criterion | How it is met |
|---|---|
| Remove transform and positional movement under `reduce` | No transform transition is declared outside `no-preference` |
| Preserve opacity and colour feedback | Those transitions sit outside the media query |
| No global `* { transition: none }` reset | Asserted absent by a static test |
| Continuous or >5s motion is pausable | Nothing here ships continuous motion; asserted by a static test that rejects `infinite` and any duration above 5s |

The last row converts a promise into a build check. `Dialog` and `Menu` animate
entry and exit, which is where this rule earns its place: the opacity fade is
unconditional and the movement is not. If a future component wants continuous
motion — a progress indicator, a skeleton shimmer — that test fails and the pause
control has to be designed before it can pass.

### Prop API and wrapper depth

Thin wrappers where Ariakit exists. Its composition is re-exported largely
intact; Lattice adds variant, size and tone props, applies the class names, and
stays out of the way.

```tsx
export type ButtonVariant = 'solid' | 'soft' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonTone = 'accent' | 'neutral' | 'danger'

export type ButtonProps<T extends ElementType = 'button'> =
  AriakitButtonProps<T> & ButtonOptions

export function Button<T extends ElementType = 'button'>({
  variant = 'soft',
  size = 'md',
  tone = 'accent',
  className,
  ...props
}: ButtonProps<T>) {
  return (
    <AriakitButton
      {...props}
      className={className === undefined ? 'lat-button' : `lat-button ${className}`}
      data-variant={variant}
      data-size={size}
      data-tone={tone}
    />
  )
}
```

Four rules this reference implementation fixes for every component:

- **Generic over the rendered element.** Ariakit's `render` prop is preserved and
  keeps its types: `render={<a href="…" />}` narrows the props to anchor props.
  This is the composition escape hatch, and it is Ariakit's, not ours. Components
  with no Ariakit behind them accept the same prop for the same reason.
- **The `data-*` attributes are applied after the spread**, so a consumer cannot
  pass `data-variant` and desync the attribute from the prop. Every other DOM
  prop still passes through.
- **`className` is prepended.** Consumers add; they do not replace.
- **No `forwardRef`, and no CSS import in the JavaScript.** React 19 delivers
  `ref` inside `props`. The stylesheet is imported once by the consumer, so the
  JavaScript stays usable in a bundler that is not configured for CSS — the same
  arrangement `lattice.css` already has.

Tone is a third axis because #20 needs a destructive action beside a neutral one,
and a confirmation dialog's Remove button is the worst place in the product for a
consumer to be reaching outside the system. It costs almost nothing in CSS: tone
sets private custom properties that the variant rules read, so the variant rules
stay tone-agnostic and a new tone is a handful of declarations rather than a copy
of every variant.

```css
.lat-button { --_solid: var(--lat-accent-solid); /* … */ }
.lat-button[data-tone='danger'] { --_solid: var(--lat-danger-solid); /* … */ }
.lat-button[data-variant='solid'] { background-color: var(--_solid); color: var(--lat-on-solid); }
```

Focus is `:focus-visible` only, drawn with `--lat-focus-ring`, and the outline is
always replaced rather than removed.

### Component guarantees

Each of these is a rule the component makes true by construction, and each has a
test. They are the reason these components exist rather than being left to a
consumer.

**`Input` and `TextField` are two tiers, deliberately.** `Input` is the styled
control alone, for a search field whose label sits in a toolbar or a cell editor
inside a table. `TextField` composes it with a label, an optional description and
an optional error, and generates the ids that connect them — `aria-describedby`
listing the description and error actually rendered, and `aria-invalid` set when
an error is present. This wiring is not hard; it is **invisible**. A missing
`aria-describedby` looks identical in review to a present one, which is the exact
defect class this product exists to find.

**`Badge`, `Callout` and `Switch` never signal by colour alone.** `Badge` and
`Callout` require text content, and their tone drives a shape or icon difference
as well as a hue. `Switch` signals through thumb position and its label, not
through the track colour. #20 makes this argument for tabstop's delta badge; it
belongs one layer down, where it cannot be forgotten per-usage.

**`Callout` has no live role by default.** A callout rendered on page load with
`role="alert"` is announced immediately and out of context, which is worse than
silence. The live role is opt-in, for the case where the callout appears in
response to an action.

**`LiveRegion` announces on change, not on render.** #19 identifies the trap
precisely: a live region updated on every poll is unusable, which is itself the
kind of bug this product exists to find. The component holds the last announced
string and does nothing when the new one matches. `polite` is the default and
`assertive` is documented as a last resort.

**`Table` requires a caption.** `Table` takes a required `caption` prop rendered
as a `<caption>`, wrapped in `VisuallyHidden` when `visuallyHiddenCaption` is
set. `Th` requires `scope`. Both are enforced in the type signature, so the
common omissions are compile errors rather than audit findings. The set is
presentational — `Table`, `THead`, `TBody`, `Tr`, `Th`, `Td` over native
elements. No sorting, selection or grid navigation: #20 and #21 rule out sorting
and bulk operations, and a sortable header is a different a11y contract that
should arrive with its consumer.

**`Card` does not become a button.** An interactive card exposes its action
through a real control inside it, not `role="button"` on the container. A card
whose whole surface is clickable is achieved by stretching a link's hit area in
CSS, which keeps one accessible name and one tab stop.

**`Tabs` activate automatically.** Panels here are cheap and already rendered, so
APG's automatic activation is correct and cheaper for keyboard users than
requiring Enter on every move. Manual activation is available as a prop for a
panel that is expensive to build.

### TypeScript

Variant, size and tone props are string-literal unions. Component props extend
Ariakit's own prop types, so nothing Ariakit accepts is lost. Where a guarantee
above is expressible in the type system — `Table`'s caption, `Th`'s scope — it is
expressed there rather than documented.

That is the whole of it. **No `LatticeToken` union ships**, and `lattice-tokens`
gains no types-only artefact.

The issue asks whether it should, and the answer turns on finding a consumer.
There is none: no component prop accepts a token name, because variants are the
API and a typed escape hatch would be designing an escape before anyone has
needed one. A union published for nobody is a third artefact to generate, assert
and keep in step with the stylesheet, buying an autocomplete list that no code in
either package reads.

The reasons for it are real but premature. Generating it beside the CSS would
make drift impossible, and a TypeScript consumer installing only tokens would get
types. Both survive the wait — `tokens.json` is already a published artefact, so
whoever needs the union can generate it from a stable public surface whenever the
need appears, and by then the shape it should take will be evidence rather than a
guess. Deferred to a named issue rather than dropped.

Components consuming tokens through CSS rather than through TypeScript is not a
gap this leaves open. It is how the styling contract already works, and rule 2 —
every referenced `--lat-*` exists in the emitted stylesheet — checks the same
thing the union would have, at the layer where the reference actually lives.

## Semantic spacing roles

The issue's comment defers component-facing inset and gap mappings until "the
component inventory shows the roles actually needed". **An inventory naming
fourteen components is not that demonstration.** Fourteen stylesheets with real
padding in them are, and they do not exist yet.

So the roles come last, extracted from what the shipped component CSS repeats,
and until then components reference `--lat-space-*` primitives directly.

### The evidence for waiting

A first draft of this document specified `--lat-inset-sm|md|lg` and
`--lat-gap-sm|md|lg` ahead of the components. That vocabulary failed on the first
component written against it:

```css
.lat-button[data-size='sm'] { padding: var(--lat-inset-sm) var(--lat-inset-md); }
.lat-button[data-size='md'] { padding: var(--lat-inset-md) var(--lat-inset-lg); }
.lat-button[data-size='lg'] { padding: var(--lat-inset-lg) var(--lat-inset-lg); }
```

A control needs more horizontal inset than vertical at every size, so two axes
climbing one three-step scale collide at the top and the largest size has to
repeat a value and break the pattern. The scale is wrong, and the interesting
part is *how* it is wrong: this suggests an inset role may need to be a **pair**
that travels together rather than a single step. That is not a question this
document can answer, and it is exactly the kind of question writing the components
answers for free — the more so now that there are fourteen of them rather than
five.

### What waiting costs, and why it is affordable here

Components ship referencing primitives and later move to roles — ordinarily a
migration, and a visible one. Here it is free: **nothing is published.** Release
belongs to #10 and has not happened, so this package has no consumers to break
and no changelog to apologise in. This is the only window in which that is true.

### What is fixed

That the tier exists, and that it lands in `lattice-tokens` rather than here.
Neither is a new decision: the spacing and motion specification's tier table
already names `--lat-inset-*`, `--lat-gap-*` and `--lat-elevation-*` together as
tier 2, and the third of those shipped in the token package. It also keeps the
roles reachable by a consumer that never imports React.

The argument that does **not** apply is the colour system's. Its semantic tier
earns its place because a theme swap would otherwise rewrite every component, and
spacing has no modes. Density would be the analogue, and this system ships none.
The case for semantic spacing is coordination, not theming, and coordination is
what extraction serves better than invention.

## Architecture

```
packages/react/
├── package.json          @chameleon-labs/lattice-react
├── tsconfig.json         extends ../../tsconfig.base.json, overrides noEmit
├── playwright.config.ts
├── src/
│   ├── index.ts
│   ├── styles.css        imports each component stylesheet
│   └── {button,input,text-field,switch,disclosure,tabs,menu,dialog,
│        card,badge,callout,table,visually-hidden,
│        live-region}/*.{tsx,css}
├── demo/                 Vite app: every component × variant × mode
├── tests/                vitest + React Testing Library
└── tests/browser/        Playwright against demo
```

Two public entries, mirroring how the token package publishes its artefacts
rather than a single barrel:

```json
"exports": {
  ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
  "./styles.css": "./dist/styles.css",
  "./package.json": "./package.json"
}
```

The build is `tsc` emitting declarations and JavaScript, plus a copy of the CSS.
No bundler stands between the source and the shipped stylesheet, which is what
keeps rule 1 and rule 2 checkable by reading the published file.

`demo/` is not only documentation. It is the page the browser tests drive, so the
thing reviewers look at and the thing the assertions run against cannot diverge.

This package gets **its own `playwright.config.ts`** rather than reusing the token
package's. It keeps that config's two Firefox projects at 16px and 20px root font
size, so every component is checked at a non-default user font size for free, but
drops `fullyParallel: false` and `workers: 1`. Those exist because the token
suite asserts against shared emitted artefacts; component assertions are
per-component and independent, and fourteen components serialised would make the
suite slow enough to stop being run.

## Rejected alternatives

**CSS Modules**, which the issue sketched. Real isolation and per-component
tree-shaking, at a cost that a design system pays disproportionately: hashed
class names are not something a consumer can target, so the documented escape
hatch disappears and `className` plus a specificity fight is all that remains.
Two further frictions are specific to this repository — `noUncheckedIndexedAccess`
is on, so a CSS-module lookup is `string | undefined` and needs either an explicit
map per component or a codegen step to be checked at all; and `*.module.css` has
no type without adding `vite/client` to a library package whose `types` is
currently `["node"]`. Cross-component rules — `Dialog` styling the `Button` in its
footer, `Card` styling a nested `Badge` — become `:global()` by construction, and
fourteen components that compose freely hit that constantly.

**An opinionated API of our own** — collapsing Ariakit's parts into single
components with our props, or `Table` as one data-driven component. Nicer call
sites, but it re-invents the composition Ariakit already solved, and every new use
case becomes a new prop rather than a new arrangement.

**Storybook.** Complete and familiar, but a large dependency tree and a second
browser harness beside the Playwright one this repository already runs and has
already verified for `forced-colors`. The demo app is smaller and doubles as the
test target.

## Validation and testing

Implementation follows test-driven development. Tests are written and observed
failing before the code that satisfies them.

**The three static contract tests in tier 3 are written first**, before any
component. Fourteen components arriving in one change means the styling contract
cannot be validated against a second component before thirteen more are built on
it, so the contract has to be executable from the start rather than reviewed at
the end.

**Tier 1 — behaviour**, vitest with React Testing Library:

1. Every prop maps to its `data-*` attribute, and a consumer-supplied
   `data-variant` cannot override it.
2. `className` is added, never replaced.
3. `render` passes through and preserves element typing.
4. `TextField` generates ids and wires `aria-describedby` and `aria-invalid` to
   the description and error it actually rendered — and omits them when it did
   not.
5. `Dialog` returns focus to its trigger on close.
6. `Disclosure` toggles `aria-expanded` and the region's presence together.
7. `Tabs` moves selection with arrow keys and associates each panel with its tab.
8. `Menu` returns focus to its trigger, and typeahead selects.
9. `Switch` exposes `role="switch"` and `aria-checked`, and its label toggles it.
10. `LiveRegion` renders no announcement when the message is unchanged, and one
    when it changes.
11. `Table` fails to compile without a caption, and `Th` without a scope —
    asserted as type tests.

**Tier 2 — real browser**, Playwright against `demo/`, on both Firefox font-size
projects:

12. `@axe-core/playwright` reports zero violations for each component, in both
    modes, in every variant, size and tone the demo renders.
13. Keyboard focus produces a measurably visible ring — computed outline width
    above zero — and the ring does not appear on pointer focus.
14. Under `emulateMedia({ reducedMotion: 'reduce' })`, no element's computed
    `transition-property` contains `transform`. `Dialog` and `Menu` are the
    components this is aimed at.
15. Under `emulateMedia({ forcedColors: 'active' })`, component borders survive.
    The mechanism is the one the elevation spec verified: the declarative option
    is a no-op in this setup and the runtime call works in both engines.
16. `Dialog` traps focus: Tab from the last focusable element returns to the
    first, and the page behind does not scroll.

**Tier 3 — static contract**, vitest reading the built stylesheet:

17. No colour literal — no hex, no `rgb(`, no bare `oklch(` — appears in
    component CSS.
18. Every `var(--lat-*)` referenced resolves to a custom property declared in the
    token package's emitted `lattice.css`.
19. No selector contains `*`, and no `transition: none` declaration exists.
20. No `animation` is `infinite` or longer than five seconds.
21. Each component's unqualified block selector — `.lat-button` with no attribute
    or pseudo-class attached — appears exactly once.

Mutation checks, applied one at a time and restored immediately:

- move a `transform` transition outside the `no-preference` query;
- replace a `var(--lat-…)` colour with its literal value;
- reference a `--lat-*` name that does not exist;
- remove the `:focus-visible` outline from a component;
- render a `TextField` error without wiring `aria-describedby`;
- give `Callout` a live role by default;
- return the same string twice from `LiveRegion` and expect two announcements;
- add `* { transition: none }` to any stylesheet.

Each must fail a targeted test.

The gates, matching the token package:

```bash
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

## Documentation

`demo/` renders every component in every variant, size and tone, in light and
dark, and is the page the browser tests drive. Each component directory carries a
README covering its props, its class names and its `data-*` attributes — the
class names because they are a published escape hatch, and an escape hatch nobody
documented is not one.

The root README moves components from "Not yet" into scope, and records the
deferred inventory with the reason each item is waiting.

## Decomposition

Three child issues.

| | Issue | Depends on |
|---|---|---|
| A | Scaffold `packages/react` — package, tsconfig, build, test and CI wiring | — |
| B | The component library: styling contract, static contract tests, all fourteen components, demo app, Playwright a11y harness | A |
| C | `lattice-tokens`: extract semantic inset and gap roles | B |

B is one pull request by decision. The cost is that it is large to review, and
the mitigation is the ordering inside it: the three static contract tests land
before the first component, so every component after `Button` is checked against
an executable contract rather than against a reviewer's memory of one.

C is an extraction, not an invention. Its input is the padding and gap values
that appear in the fourteen stylesheets B produces, and its first task is to report
what actually repeats — including whether an inset role is one step or a
vertical/horizontal pair. Components migrate from primitives to roles as part of
it, while the package is still unpublished.

Publishing stays on #10, and the deferred `LatticeToken` union gets its own issue
so the decision is findable rather than only recorded here.

## Non-goals

- `EmptyState`, which makes no guarantee and whose four tabstop instances share
  no structure;
- `Skeleton` and `Toast`, both of which need a continuous-motion and pausability
  decision this contract does not yet permit;
- `Link`, `Tooltip`, `Select` and `Combobox` — none requested, none used by a
  specified screen;
- sorting, row selection and grid keyboard navigation in `Table`;
- charts, which the token package already serves with validated palettes and
  which #21 explicitly wants hand-rolled;
- a theming API beyond the `data-lat-theme` attribute the colour system already
  defines;
- component-tier colour tokens (`--lat-button-bg-rest`), which the README permits
  with justification and which no component here has needed;
- a `LatticeToken` union and any types-only artefact from `lattice-tokens`,
  deferred to its own issue until a consumer exists;
- server components, beyond the requirement that every component be SSR-safe and
  touch no browser global at module scope;
- publishing and release, which belong to #10.
