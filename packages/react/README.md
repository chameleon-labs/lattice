# @chameleon-labs/lattice-react

The component layer of [Lattice](../../README.md), built on design tokens and
wrapping [Ariakit](https://ariakit.org) where behaviour is hard.

## Install

React, `react-dom`, `@ariakit/react` and `@chameleon-labs/lattice-tokens` are
peer dependencies. This package ships no runtime dependencies of its own.

Both stylesheets are imported by the application, in this order:

```ts
import '@chameleon-labs/lattice-tokens/lattice.css'
import '@chameleon-labs/lattice-react/styles.css'
```

The components never import CSS themselves, so the JavaScript stays usable in a
bundler that is not configured for CSS.

## Components

Fourteen families. Seven wrap Ariakit; seven are ours on tokens.

| Component | Guarantee |
|---|---|
| [`Button`](./src/button/README.md) | The focus, variant and motion contracts every other family follows |
| [`Input`](./src/input/README.md) | Invalid state is an attribute, not only a colour |
| [`TextField`](./src/text-field/README.md) | `aria-describedby` lists exactly what was rendered, and is absent otherwise |
| [`Switch`](./src/switch/README.md) | State is a position that survives reduced motion |
| [`Disclosure`](./src/disclosure/README.md) | A real button carrying `aria-expanded` |
| [`Tabs`](./src/tabs/README.md) | Roving focus, automatic activation, panels associated |
| [`Menu`](./src/menu/README.md) | Typeahead and focus return, on the overlay elevation |
| [`Dialog`](./src/dialog/README.md) | Focus trapped and returned, scroll locked, named by its heading |
| [`Card`](./src/card/README.md) | All three elevation signals; never `role="button"` |
| [`Badge`](./src/badge/README.md) | Text is required, so colour is never the only signal |
| [`Callout`](./src/callout/README.md) | No live role by default |
| [`Table`](./src/table/README.md) | Caption and scope required by the type |
| [`LiveRegion`](./src/live-region/README.md) | Never re-announces an unchanged message |
| [`VisuallyHidden`](./src/visually-hidden/README.md) | Ariakit's, unchanged |

Every component makes a guarantee a consumer would otherwise have to remember.
That is the admission test: `EmptyState` was requested and cut because it makes
none.

**Not here:** `EmptyState`, `Skeleton`, `Toast`, `Link`, `Tooltip`, `Select`,
`Combobox`. `Skeleton` and `Toast` both need a continuous-motion and pausability
decision the current contract does not permit.

## The class names are an escape hatch

They are stable and documented on purpose. The token package publishes `--lat-*`
names it expects consumers to read and override; publishing class names is the
same bargain one layer up. Variants are `data-*` attributes, so a consumer can
target `.lat-button[data-variant='solid']` without fighting specificity.

`className` is always **prepended**, never replaced — consumers add, they do not
take away.

## Development

```sh
pnpm demo         # from the repo root — builds tokens, then opens the gallery
```

Or from inside this package:

```sh
pnpm dev          # same thing: builds tokens, then serves on :5173
pnpm build        # tsc emits JS and declarations; the stylesheet is assembled
pnpm typecheck
pnpm test         # vitest (jsdom) then Playwright (Firefox at 16px and 20px)

pnpm --filter @chameleon-labs/lattice-react exec playwright install firefox
```

`dev` builds the token package first on purpose: the gallery imports the emitted
`lattice.css`, and `dist/` is not committed.

`demo/` is both the documentation and the target the browser tests drive, so
what a reviewer looks at and what the assertions measure cannot diverge. **If a
variant is not rendered there, no axe scan covers it.**

## How the guarantees are tested

Three tiers.

1. **Behaviour** — vitest with jsdom and Testing Library, one file per family.
2. **Real browser** — Playwright on Firefox at 16px and 20px root font size:
   axe-core clean per theme, a visible keyboard focus ring, no transform
   transitions under `reduce`, borders surviving `forced-colors`, and Dialog and
   Menu returning focus.
3. **Static contract** — pure functions over the built stylesheet, proven
   against fixtures in `tests/css-contract.test.ts` before being pointed at the
   real file. No colour literal, every `--lat-*` reference resolving against the
   token package, no universal selector, no unpausable motion, no transform
   transition outside `no-preference`, every focus ring on `:focus-visible`, and
   each block selector declared once at top level.

## Three things that will bite

A test that reads a file must declare `@vitest-environment node`. Under jsdom
the global `URL` resolves `new URL(relative, import.meta.url)` against the
document's base rather than the `file:` base you passed.

**One family per test file.** Two families sharing a jsdom document also share
`userEvent` state, which silently stopped Ariakit's composite from handling
arrow keys — passing alone, failing in the file.

**Focus restoration cannot be tested in jsdom.** Ariakit restores focus using
real layout and animation frames; under jsdom focus simply stays where it was.
Those assertions live in the browser suite.
