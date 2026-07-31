# @chameleon-labs/lattice-react

The component layer of [Lattice](../../README.md), built on design tokens and
wrapping [Ariakit](https://ariakit.org) where behaviour is hard.

**Status: scaffold.** No components ship yet — see
[#37](https://github.com/chameleon-labs/lattice/issues/37).

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

## Development

```sh
pnpm --filter @chameleon-labs/lattice-tokens build   # the demo needs the emitted tokens
pnpm --filter @chameleon-labs/lattice-react exec playwright install firefox

pnpm build        # tsc emits JS and declarations; the stylesheet is copied
pnpm typecheck
pnpm test         # vitest (jsdom) then Playwright (Firefox at 16px and 20px)
pnpm test:unit
pnpm test:browser
```

`demo/` is both the documentation and the target the browser tests drive, so
what a reviewer looks at and what the assertions measure cannot diverge.

Two tsconfigs: `tsconfig.json` typechecks everything and emits nothing;
`tsconfig.build.json` emits `src` alone.

### Two things that will bite

A test that reads a file must declare `@vitest-environment node`. Under jsdom
the global `URL` resolves `new URL(relative, import.meta.url)` against the
document's base — `http://localhost:3000` — rather than the passed `file:` base,
and `readFileSync` then rejects the result.

`demo/env.d.ts` declares the `*.css` module. Without it `pnpm typecheck` fails
on the two stylesheet imports in `demo/main.tsx`, because a side-effect
stylesheet import has no type of its own.
