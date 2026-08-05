# @chameleon-labs/lattice-tokens

The token layer of [Lattice](../../README.md). Colour, typography, spacing,
sizing, elevation and motion, emitted as CSS custom properties and as
[DTCG](https://tr.designtokens.org/format/) JSON.

No framework dependency, and no runtime dependency of any kind — this package
ships CSS and JSON, not JavaScript. A consumer that never touches React can
install it alone.

## Install

```sh
npm i @chameleon-labs/lattice-tokens@rc
```

The current release is a candidate, published under the `rc` dist-tag rather
than `latest`, so an unqualified `npm i` will not find it. Drop the suffix once
`0.1.0` proper is out.

One import gets you every token:

```ts
import '@chameleon-labs/lattice-tokens/lattice.css'
```

Dark is the default. Light mode is opt-in per subtree:

```html
<div data-lat-theme="light">…</div>
```

## What it exports

| Entry | What it is |
|---|---|
| `./lattice.css` | every token as a CSS custom property, plus the `@font-face` rules |
| `./tokens.json` | the same values in DTCG format, for tooling that is not CSS |
| `./contrast-ledger.json` | every documented pair, measured — see below |
| `./fonts/*` | the two self-hosted variable fonts and their licence |

## The one rule

Colours are **pinned, not generated**. The values come verbatim from the Figma
bundle that produced Lattice's identity, and nothing adjusts them. The build
converts each anchor to OKLCH, derives the few things the bundle leaves implicit,
and gamut-maps the result to sRGB.

Never hand-edit a token, and never hand-edit `dist/`. Change the config and
rebuild — a value that is not declared or computed does not ship.

## The contrast ledger

Every documented pair is measured against its WCAG 2.2 AA minimum, with APCA
`Lc` reported alongside. **The build reports; it does not gate.** Lattice's
values are the identity, thirteen of its pairs miss their minimum, and refusing
to write them would mean refusing to ship the design.

`dist/contrast-ledger.json` is that measurement as data — passes and failures
alike, so a pair that starts failing tomorrow appears as a new failing entry
rather than as a colour that silently vanished from the file.
`@chameleon-labs/lattice-react` reads it to tell a documented, accepted
deficiency from a new defect in its axe sweep.

The thirteen accepted failures are listed in [the root README](../../README.md#accepted-contrast-failures).
**Anything outside them is a real defect.**

## Fonts

Instrument Sans and JetBrains Mono, self-hosted rather than loaded from Google
Fonts, and referenced by `@font-face` rules in `lattice.css`. Both are licensed
under the SIL Open Font License 1.1 — the full text and provenance are in
[`OFL.txt`](./assets/fonts/OFL.txt), which ships in the package at
`./fonts/OFL.txt`.

## Versioning

The two Lattice packages release **in lockstep** at one version. A component
stylesheet is `var(--lat-*)` references resolving into this package; a pair that
does not match renders unstyled rather than failing loudly, so the matching pair
is made obvious by the version number instead of by a compatibility table.

## Licence

[MIT](../../LICENSE)
