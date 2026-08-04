# Lattice

> The design system behind [tabstop](https://github.com/chameleon-labs/tabstop) and whatever comes next. Accessibility is the constraint, not the feature.

**Status: early development.** Colour, typography, spacing/motion and elevation are specified and built, and fourteen component families ship on top of them; nothing is published yet.

## The name

Chameleons have no violet pigment. Their colour comes from a lattice of guanine nanocrystals inside cells called *iridophores*, and the animal changes colour by tuning the **spacing** of that lattice — one structure, retuned, producing many colours.

That is what a token system is. The name is the architecture.

## What this is

Two packages.

| Package | What it is |
|---|---|
| `@chameleon-labs/lattice-tokens` | foundational design tokens — colour, typography, spacing, sizing, elevation, and motion |
| `@chameleon-labs/lattice-react` | the component layer on [Ariakit](https://github.com/ariakit/ariakit) — fourteen component families |

They are separate because tokens carry no framework dependency and should stay installable by a consumer that never touches React.

It is opinionated about values and behaviour, and deliberately unopinionated about composition — Ariakit already solves composition, so Lattice's job is to decide what things look like and guarantee they stay legible.

### The one rule that shapes everything

Colours are **pinned, not generated**. The values come verbatim from Meridian, the Figma-produced identity Lattice now carries, and nothing adjusts them. A build step converts every anchor to OKLCH, derives the few things Meridian leaves implicit — the tinted triple, one missing severity colour — and gamut-maps the result to sRGB.

Every documented pair is measured against its WCAG 2.2 AA minimum and printed to a **contrast ledger**, with APCA `Lc` reported alongside for the same pair. The build does **not** fail on a miss. Meridian's values are the identity, several of its pairs miss their minimum, and refusing to ship them would mean refusing to ship the design — so the ledger exists to keep every miss visible instead. See [the accepted contrast failures](#accepted-contrast-failures) below, and the design spec's §9 for the full ledger and how to reproduce it.

### Three tiers, and why the middle one matters

```
primitive   --lat-accent-solid       pinned or derived, rarely used directly
semantic    --lat-solid              hand-authored, what components consume
component   --lat-button-bg-rest     permitted, but each needs justification
```

Systems that skip the semantic tier end up unable to add a second theme without rewriting every component's colours. That failure mode is the reason this system exists in the shape it does.

### Accepted contrast failures

Reported, not hidden, and not fixed by nudging a Meridian value — the values are the identity. Reproduce these with `pnpm --filter @chameleon-labs/lattice-tokens build`; the full ledger is in [the design spec's §9](./docs/superpowers/specs/2026-08-03-meridian-identity-design.md#9-the-contrast-ledger).

| pair | ratio | needs |
| --- | --- | --- |
| light focus ring vs `bg-raised` | **1.55:1** | 3:1 (SC 1.4.11) |
| light `solid` as text on `bg` | 2.94:1 | 4.5:1 |
| light accent text on its own tint | 2.84:1 | 4.5:1 |
| light `on-solid` on `solid` | 3.33:1 | 4.5:1 |
| light warning text on its own tint | 3.15:1 | 4.5:1 |
| light success text on its own tint | 3.34:1 | 4.5:1 |
| light info text on its own tint | 3.61:1 | 4.5:1 |
| dark `text-subtle` on `bg-raised` | 3.67:1 | 4.5:1 |
| light danger text on its own tint | 4.49:1 | 4.5:1 |

The light-mode focus ring is the most serious of these: a focus indicator a keyboard user cannot see is not a cosmetic miss, it is a loss of orientation. It ships as delivered because Meridian's own components focus at `ring-primary/40`, and a token nobody reaches for guarantees nothing.

## Scope

**In:** colour scales, semantic colour tokens, light and dark modes, a per-scale computed on-solid, an ordered severity ramp, validated categorical and sequential chart palettes, primitive and semantic typography tokens, primitive spacing, breakpoints, containers and radii tokens, primitive motion tokens, four elevation roles (theme-independent), and fourteen component families on Ariakit.

**Not yet:** semantic spacing roles, wide-gamut output, forced-colors handling. Each is tracked separately.

Components deferred with a reason: `EmptyState` — its four tabstop instances share no structure, and it makes no guarantee a consumer would otherwise have to remember, which is the admission test every shipped component passes. `Skeleton` and `Toast` — both want continuous motion, which the reduced-motion contract forbids until the pausability escape is designed. `Link`, `Tooltip`, `Select`, `Combobox` — no specified screen uses one.

Typography keeps the system sans stack as its default and provides seventeen semantic roles. Instrument Sans and JetBrains Mono, the Meridian identity's two families, are self-hosted by this package rather than loaded from Google Fonts — see [Fonts](#fonts) below.

## Design docs

Decisions live in [`docs/superpowers/specs/`](./docs/superpowers/specs/). Start with [Meridian](./docs/superpowers/specs/2026-08-03-meridian-identity-design.md), the identity currently shipped, which supersedes the original [colour system](./docs/superpowers/specs/2026-07-28-lattice-color-system-design.md) design; then [typography](./docs/superpowers/specs/2026-07-30-lattice-typography-design.md), [spacing/motion](./docs/superpowers/specs/2026-07-30-lattice-spacing-and-motion-design.md), [elevation](./docs/superpowers/specs/2026-07-31-lattice-elevation-design.md), and [the component library](./docs/superpowers/specs/2026-07-31-lattice-component-library-design.md) designs — they record what was chosen, what was rejected, and the measurements behind each.

## Development

Node 24 (see [`.nvmrc`](./.nvmrc)) and pnpm.

```sh
pnpm install
pnpm --filter @chameleon-labs/lattice-tokens build   # Storybook needs the emitted tokens
pnpm --filter @chameleon-labs/lattice-tokens exec playwright install firefox
pnpm build           # typecheck, then emit dist/
pnpm test            # vitest and Firefox browser coverage
pnpm storybook       # serve the component gallery at http://localhost:6006
pnpm build-storybook # the same gallery, built for production
```

`pnpm storybook` builds the tokens first, because the gallery imports the emitted
stylesheet and `dist/` is not committed.

A pnpm workspace. Root scripts fan out to every package; run them inside a package directory to work on one.

```
packages/
├── tokens/     @chameleon-labs/lattice-tokens — config/, generate/, tests/, dist/
└── react/      @chameleon-labs/lattice-react — src/, .storybook/, tests/, dist/
```

Inside `packages/tokens/`, `config/` declares reviewed token values and contracts and `generate/` turns them into artefacts. `dist/` is generated output and is not committed.

Never hand-edit a primitive token, and never hand-edit `dist/`. Change the config and rebuild — a value that is not declared or computed does not ship.

## Fonts

The Meridian identity's two families, Instrument Sans and JetBrains Mono, are
self-hosted rather than loaded from Google Fonts — see
[`packages/tokens/assets/fonts/`](./packages/tokens/assets/fonts/), exported
from `@chameleon-labs/lattice-tokens` at `./fonts/*`. Both are licensed under
the SIL Open Font License 1.1; the full text and provenance are in
[`OFL.txt`](./packages/tokens/assets/fonts/OFL.txt).

## Licence

[MIT](./LICENSE)
