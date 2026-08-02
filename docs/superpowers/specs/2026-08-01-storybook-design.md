# Storybook: one gallery that is also the accessibility fixture

**Status:** approved
**Date:** 2026-08-01
**Package:** `@chameleon-labs/lattice-react`

## The problem

`packages/react/demo/main.tsx` is doing two jobs badly at once.

It is the only browsable view of the fourteen component families, so it is the
de facto gallery. It is also the sole Playwright target: `tests/browser/a11y.spec.ts`
scans `#theme-light` and `#theme-dark` with axe, sweeps every element on the page
for animated transforms, and reaches into it by id for `#light-switch-off`. Dialog
and menu focus-return click into it too.

Its own comment states the consequence:

> The demo is a test fixture, not a showcase: if a variant is not rendered here,
> no axe scan covers it. Every variant of every component belongs in Gallery.

That is coverage by convention. A new variant is scanned only if whoever added it
remembered to render it in `Gallery`. Nothing fails when they forget — the suite
stays green and the coverage silently shrinks. This is exactly the class of
guarantee the rest of the system refuses to leave to memory: the contrast
contracts fail the build, the CSS contract is a set of checkers proven against
fixtures, `published-surface.test.ts` asserts the package's exports rather than
trusting them.

A second problem follows from the first. Because every variant shares one page,
each browser test runs against a document containing thirteen other component
families. The dialog focus-trap test tabs six times and hopes; the forced-colors
test takes `.lat-button` `.first()`; the switch test hardcodes an id that exists
only because the demo happens to mint it.

## What this builds

Storybook 10, as the single gallery, replacing `demo/` outright. Stories become
both the documentation and the fixtures, and the axe sweep is driven by
Storybook's own story index rather than by a hand-maintained page.

The admission test this has to pass — the same one applied to every component —
is whether it makes a guarantee a consumer would otherwise have to remember. It
does: **a story is scanned because it exists.**

### Layout

```
packages/react/
  .storybook/
    main.ts          framework, story globs, addons
    preview.ts       token + component CSS, theme decorator, global toolbar
  src/
    button/
      button.tsx
      button.stories.tsx      co-located
    ...
```

Stories sit beside the component they document, so the two move together and
"does this family have stories?" is answered by listing a directory.

Co-location has one cost. `tsconfig.build.json` sets `rootDir: "src"` and
`include: ["src"]`, so without an exclude the stories compile into `dist/` and
ship to consumers. The config gains
`"exclude": ["src/**/*.stories.tsx"]`. `tsconfig.json` — the `--noEmit`
config that must see everything — keeps them, so stories are still typechecked.

`demo/` is deleted. `vite.config.ts` exists only to serve it and goes with it.
The root `pnpm demo` script becomes `pnpm storybook`.

### Theme as a global, not as duplicate stories

The demo renders both modes by nesting two `[data-lat-theme]` scopes in one
document. Under Storybook the equivalent is a decorator wrapping each story in a
themed element, driven by a Storybook global exposed as a toolbar control.

This is what makes the sweep tractable. A global is addressable from the URL:

```
/iframe.html?id=components-button--tones&globals=theme:dark
```

So one story yields both themes, and the story count stays equal to the number of
distinct component states rather than double it.

The decorator must set a background as well as the theme attribute.
`[data-lat-theme]` redeclares the tokens but paints nothing; a scope that only
sets the attribute renders dark text on Storybook's white canvas. This was found
once already, in the demo stylesheet, and the decorator is where it has to be
fixed for stories.

### The sweep

`tests/browser/a11y.spec.ts` is rewritten around Storybook's index:

1. Fetch `/index.json` and take every entry of type `story`.
2. For each story × each theme, visit its iframe and run `AxeBuilder`.
3. Assert no violations.

The two existing Firefox projects — 16px and 20px root font size — multiply over
this for free, so every story is checked at a non-default user font size exactly
as the page was.

The story list is read at runtime rather than declared. Adding a story adds a
scan; deleting one removes it. Nobody edits a list.

**Sharding.** Playwright collects test files *before* the web server starts, so a
runtime fetch cannot decide how many tests exist. The number of tests therefore
comes from the filesystem — one per component directory that ships a
`*.stories.tsx` — and the contents of each shard come from the index. Neither is
hand-maintained. This matters for more than parallelism: a single test walking
all 42 stories exceeded Playwright's 30s timeout when it was first written.

**Two axes cannot share a frame.** `@storybook/addon-a11y` runs axe inside the
story iframe when a story renders. `AxeBuilder` injects and runs its own over
the same frame, and the second aborts with *"Axe is already running"*. It is a
race, so it failed 4 of 74 tests rather than all of them — an intermittently red
CI suite that would pass on a rerun. The sweep therefore visits every story with
`globals=theme:<mode>;a11y.manual:!true`. `a11y.manual` being a *global* rather
than a parameter is what makes this addressable from the URL, so only the sweep
opts out and the panel still runs automatically for a human browsing Storybook.

**Settling.** `.lat-dialog` opens at `opacity: 0` and transitions to 1 over
`--lat-duration-slower`. axe reading a frame part-way through that fade measures
a blended colour and reports a contrast violation against a dialog that is
perfectly legible at rest. Each visit therefore drains
`document.getAnimations()` before scanning. Three rounds rather than one, because
Ariakit applies `data-enter` in an effect after mount, so on the first frame the
transition does not exist yet.

Per-test timeout is raised to 90s. Storybook's dev server compiles a story's
module the first time it is requested, so the opening navigations are slow and
slower still with every worker asking at once.

### The starvation check

A sweep over stories guarantees that everything with a story is scanned. It says
nothing about a component that has no story at all. That gap is closed in vitest,
not Playwright, because it is a question about source files rather than about a
browser:

`tests/story-coverage.test.ts` asserts that every component exported from
`src/index.ts` appears in at least one `*.stories.tsx` file. Shaped after
`published-surface.test.ts` — read the barrel, read the story files, compare.

Together the two are the mechanism that replaces the comment: every component has
a story, and every story is scanned.

### Retargeting the behavioural tests

Five tests currently reach into the shared demo page. Each moves to the story it
is actually about, which is stricter than what it does today:

| Test | Was | Becomes |
|---|---|---|
| focus ring on `:focus-visible` | `Tab` into whatever came first on the page | `Tab` into the Button story's only control |
| switch thumb moves under `reduce` | `#light-switch-off` / `#light-switch-on` | the Switch `Off` and `On` story ids |
| Dialog traps and returns focus | click `Remove page` inside `#theme-light` | the Dialog story, alone in its iframe |
| Menu returns focus | click `Actions` inside `#theme-light` | the Menu story, alone in its iframe |
| borders survive forced-colors | `.lat-button` `.first()` | the Button story's button |

The reduced-motion transform check is the exception: it is a statement about
every element the system renders, so it stays a sweep. It is sharded per family
like the axe pass — one test each, asserting no computed `transition-property`
names `transform` under `reducedMotion: 'reduce'`. Not sharded per *theme*,
because whether a transform is animated is a property of the stylesheet and the
stylesheet does not vary by mode. No axe on that pass, so it is cheap.

The static counterpart in `tests/stylesheet.test.ts`
(`findAnimatedTransformsOutsideNoPreference`, `findBareFocusOutlines`) is
untouched. Those assert properties of the stylesheet and do not depend on any
fixture.

### Addons

- `@storybook/addon-docs` — autodocs from the prop types, so the documentation
  is generated from the component's actual signature rather than written twice.
- `@storybook/addon-a11y` — axe in the Storybook UI, panel per story. This is
  developer feedback, not the gate; the gate is the Playwright sweep, which runs
  in CI and at two font sizes.

`@storybook/addon-vitest` is deliberately not taken. It would move the a11y run
into vitest, which means adding `@vitest/browser` and `@vitest/browser-playwright`
and a second browser-mode vitest project alongside the jsdom one — new
infrastructure to do a job the existing Playwright suite already does, with the
two font-size projects already wired.

### Serving

Playwright's `webServer` runs `storybook dev --no-open --quiet`. Dev mode serves
`/index.json`, which the sweep needs. The default 60s timeout is raised, since a
cold Storybook boot exceeds it on CI.

`build-storybook` runs in CI as its own step, so a Storybook that no longer
builds fails the build rather than being discovered at deploy time. Nothing is
deployed yet — the visual identity work is expected to change how all of this
looks, and publishing a gallery about to be restyled buys nothing. Deployment is
a separate issue.

`storybook-static/` is added to `.gitignore`.

## Story conventions

One `Meta` per family, titled `Components/<Family>`. Beyond that:

- **Every variant that exists in the type appears in a story.** The demo
  enumerated `variant × tone × size` for Button by mapping over the union types.
  Stories keep that: a story that maps over the union cannot fall behind the
  union.
- **Disabled and invalid states are stories**, not knobs. A knob state is not in
  the index, so the sweep never sees it.
- **Interactive families get a story per meaningful state** where the state is
  reachable — Dialog gets its trigger, Menu gets its button. Ariakit's
  `*Provider` renders nothing, so it wraps inside the story rather than
  appearing as one.

## Testing

| Concern | Where | How |
|---|---|---|
| every component has a story | vitest | `tests/story-coverage.test.ts` reads the barrel and the story files |
| every story is accessible | Playwright | sweep over `/index.json`, both themes, both font sizes |
| no animated transform under `reduce` | Playwright | second sweep, computed style |
| focus, focus-return, forced-colors | Playwright | per-story, by story id |
| stories never ship | vitest | `package-contract.test.ts` already asserts `files: ["dist"]`; the build exclude is proven by CI's artefact check |
| Storybook still builds | CI | `build-storybook` step |

The sweep's assertions are only trustworthy if the index is non-empty — an empty
`/index.json` would make every `for` loop vacuous and the suite green. The sweep
asserts the story count is greater than zero before iterating, for the same
reason the CSS checkers are proven against fixtures rather than only against the
shipped file.

## What the sweep found on its first run

Worth recording, because it is the evidence that the mechanism works rather than
merely runs.

**Lattice styles no link, and an unstyled link on a dark surface fails AA.** The
Card story originally demonstrated an actionable card with a bare
`<a href="…">`. The sweep measured it at below 4.5:1 in dark mode and failed.
This is not a component defect — the CSS contract forbids the global selectors
that styling a bare element would need, so `<a>` correctly inherits the browser's
default blue. It is a **gap**: the system has no link primitive, and a consumer
putting an inline link on a Lattice surface gets no help. The story now uses
`Button` rendered as an anchor, which is the styled control the system actually
offers. The gap itself belongs in its own issue.

No component defect was found. The other two failures were both test
infrastructure — the axe collision and the un-settled dialog fade, both described
above.

## Out of scope

- Deploying the Storybook. Separate issue, after the visual identity lands.
- Visual regression snapshots. The look is about to change; baselines taken now
  would all be thrown away.
- Documenting the token tiers as MDX pages. Worth doing, but it is documentation
  of the token package, not of the components, and belongs with that package.
