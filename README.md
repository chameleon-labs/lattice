# Lattice

> The design system behind [tabstop](https://github.com/chameleon-labs/tabstop) and whatever comes next. Accessibility is the constraint, not the feature.

**Status: early development.** Colour, typography, and spacing/motion are specified; nothing is published yet.

## The name

Chameleons have no violet pigment. Their colour comes from a lattice of guanine nanocrystals inside cells called *iridophores*, and the animal changes colour by tuning the **spacing** of that lattice — one structure, retuned, producing many colours.

That is what a token system is. The name is the architecture.

## What this is

Two packages, one of which exists so far.

| Package | What it is |
|---|---|
| `@chameleon-labs/lattice-tokens` | foundational design tokens — colour, typography, spacing, sizing, elevation, and motion |
| `@chameleon-labs/lattice-react` | the component layer on [Ariakit](https://github.com/ariakit/ariakit) — **not built yet** |

They are separate because tokens carry no framework dependency and should stay installable by a consumer that never touches React.

It is opinionated about values and behaviour, and deliberately unopinionated about composition — Ariakit already solves composition, so Lattice's job is to decide what things look like and guarantee they stay legible.

### The one rule that shapes everything

Colours are **generated**, not picked. A config declares a shared lightness curve, a chroma envelope, and a hue per scale; a build step emits OKLCH values, gamut-maps them to sRGB, and **fails the build** if any documented pair misses its contrast contract.

This means contrast is structural rather than something re-checked by hand each time a theme is added. WCAG 2.2 AA is the hard gate; APCA `Lc` is computed and reported alongside so the gap between the two standards stays visible.

### Three tiers, and why the middle one matters

```
primitive   --lat-accent-9          generated, never used directly
semantic    --lat-solid             hand-authored, what components consume
component   --lat-button-bg-rest    permitted, but each needs justification
```

Systems that skip the semantic tier end up unable to add a second theme without rewriting every component's colours. That failure mode is the reason this system exists in the shape it does.

## Scope

**In:** colour scales, semantic colour tokens, light and dark modes, an ordered severity ramp, validated categorical and sequential chart palettes, and typography primitives.

**Not yet:** components, semantic typography roles, spacing implementation, wide-gamut output, forced-colors handling. Each is tracked separately.

Typography keeps the system sans stack as its default and offers Inter as an optional primitive. Applications that opt into Inter provide the font themselves; the token package does not bundle or load web fonts.

## Design docs

Decisions live in [`docs/superpowers/specs/`](./docs/superpowers/specs/). Start with the [colour system](./docs/superpowers/specs/2026-07-28-lattice-color-system-design.md), [typography](./docs/superpowers/specs/2026-07-30-lattice-typography-design.md), and [spacing/motion](./docs/superpowers/specs/2026-07-30-lattice-spacing-and-motion-design.md) designs — they record what was chosen, what was rejected, and the measurements behind both.

## Development

Node 24 (see [`.nvmrc`](./.nvmrc)) and pnpm.

```sh
pnpm install
pnpm build    # typecheck, then emit dist/
pnpm test     # vitest
```

A pnpm workspace. Root scripts fan out to every package; run them inside `packages/tokens/` to work on one.

```
packages/
├── tokens/     @chameleon-labs/lattice-tokens — config/, generate/, tests/, dist/
└── react/      @chameleon-labs/lattice-react — not built yet
```

Inside `packages/tokens/`, `config/` declares reviewed token values and contracts and `generate/` turns them into artefacts. `dist/` is generated output and is not committed.

Never hand-edit a primitive token, and never hand-edit `dist/`. Change the config and rebuild — a value that is not declared or computed does not ship.

## Licence

[MIT](./LICENSE)
