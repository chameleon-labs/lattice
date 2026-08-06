# Lattice

> The design system behind [tabstop](https://github.com/chameleon-labs/tabstop) and whatever comes next. Accessibility is the constraint, not the feature.

**Status: early development.** Colour, typography, spacing/motion and elevation are specified and built, and twenty component families ship on top of them. Both packages publish from CI with provenance — see [Releasing](#releasing) — and the first cut is a **release candidate**, `0.1.0-rc.1`, published under the `rc` dist-tag rather than `latest`. At 0.x **no API stability is promised**: the token indirection layer exists and is used internally, but is not documented as a public theming API.

## The name

Chameleons have no violet pigment. Their colour comes from a lattice of guanine nanocrystals inside cells called *iridophores*, and the animal changes colour by tuning the **spacing** of that lattice — one structure, retuned, producing many colours.

That is what a token system is. The name is the architecture.

## What this is

Two packages.

| Package | What it is |
|---|---|
| `@chameleon-labs/lattice-tokens` | foundational design tokens — colour, typography, spacing, sizing, elevation, and motion |
| `@chameleon-labs/lattice-react` | the component layer on [Ariakit](https://github.com/ariakit/ariakit) — twenty component families |

They are separate because tokens carry no framework dependency and should stay installable by a consumer that never touches React.

It is opinionated about values and behaviour, and deliberately unopinionated about composition — Ariakit already solves composition, so Lattice's job is to decide what things look like and guarantee they stay legible.

### The one rule that shapes everything

Colours are **pinned, not generated**. The values come verbatim from the Figma bundle that generated Lattice's current identity, and nothing adjusts them. A build step converts every anchor to OKLCH, derives the few things the bundle leaves implicit — the tinted triple, one missing severity colour — and gamut-maps the result to sRGB.

Every documented pair is measured against its WCAG 2.2 AA minimum and printed to a **contrast ledger**, with APCA `Lc` reported alongside for the same pair. The build does **not** fail on a miss. Lattice's values are the identity, several of its pairs miss their minimum, and refusing to ship them would mean refusing to ship the design — so the ledger exists to keep every miss visible instead. See [the accepted contrast failures](#accepted-contrast-failures) below, and the design spec's §9 for the full ledger and how to reproduce it.

### Three tiers, and why the middle one matters

```
primitive   --lat-accent-solid       pinned or derived, rarely used directly
semantic    --lat-solid              hand-authored, what components consume
component   --lat-button-bg-rest     permitted, but each needs justification
```

Systems that skip the semantic tier end up unable to add a second theme without rewriting every component's colours. That failure mode is the reason this system exists in the shape it does.

### Accepted contrast failures

Reported, not hidden, and not fixed by nudging a Lattice value — the values are the identity. **Thirteen documented pairs fail AA**, by explicit approved decision. Reproduce these with `pnpm --filter @chameleon-labs/lattice-tokens build`; the full ledger, including how the count was twice corrected upward as more of the palette was measured, is in [the design spec's §9](./docs/superpowers/specs/2026-08-03-lattice-identity-design.md#9-the-contrast-ledger).

| pair | ratio | needs |
| --- | --- | --- |
| light focus ring vs `bg-raised` | **1.55:1** | 3:1 (SC 1.4.11) |
| light severity moderate text on its own tint | 2.26:1 | 4.5:1 |
| light `solid` as text on `bg` | 2.94:1 | 4.5:1 |
| light accent text on its own tint | 2.84:1 | 4.5:1 |
| light `on-solid` on `solid` | 3.33:1 | 4.5:1 |
| light warning text on its own tint | 3.15:1 | 4.5:1 |
| light warning severity text on its own tint | 3.15:1 | 4.5:1 |
| light success text on its own tint | 3.34:1 | 4.5:1 |
| light info text on its own tint | 3.61:1 | 4.5:1 |
| dark `text-subtle` on `bg-raised` | 3.67:1 | 4.5:1 |
| dark severity minor text on its own tint | 3.27:1 | 4.5:1 |
| light danger text on its own tint | 4.49:1 | 4.5:1 |
| light danger severity text on its own tint | 4.49:1 | 4.5:1 |

The light-mode focus ring is the most serious of these: a focus indicator a keyboard user cannot see is not a cosmetic miss, it is a loss of orientation. It ships as delivered because the Figma bundle's own components focus at `ring-primary/40`, and a token nobody reaches for guarantees nothing.

The severity ramp's `critical` and `serious` levels are anchored to the same colours as `danger` and `warning`, so their rows above duplicate them by construction rather than being independent failures — `moderate` and `minor` do not duplicate anything and are the two failures added when the count was corrected from nine to thirteen.

**Anything outside these thirteen is a real defect, not an accepted one.** The `Pages/System` and `Pages/Landing` Storybook stories — see [Development](#development) — are the acceptance test that checks for exactly that distinction: both bundle pages rebuilt from this package's public components alone, swept by the same axe-core suite. See [`docs/superpowers/plans/2026-08-03-lattice-gaps.md`](./docs/superpowers/plans/2026-08-03-lattice-gaps.md) for the full triage of every axe finding against this ledger, the resulting library gap list, and the deliberate omissions (`ScoreArc`, the score-history chart, the untouched shadcn components).

## Install

The current release is a candidate, `0.1.0-rc.1`. It carries the `rc` dist-tag — and, for now, `latest` as well: npm requires every package to have a `latest`, and with only one version published there is nothing else for it to point at. So a bare `npm i` currently gets the candidate. Ask for `@rc` explicitly anyway, so that the day `0.1.0` ships you keep getting candidates rather than silently changing channel.

Tokens alone, for a consumer that never touches React:

```sh
npm i @chameleon-labs/lattice-tokens@rc
```

```ts
import '@chameleon-labs/lattice-tokens/lattice.css'
```

With the components — `react`, `react-dom` and `@ariakit/react` are peers, and both stylesheets are imported by the application, in this order:

```sh
npm i @chameleon-labs/lattice-react@rc @chameleon-labs/lattice-tokens@rc @ariakit/react
```

```ts
import '@chameleon-labs/lattice-tokens/lattice.css'
import '@chameleon-labs/lattice-react/styles.css'
```

Dark is the default; light mode is opt-in per subtree with `data-lat-theme="light"`.

The two packages release **in lockstep** at one version, and the React package's peer range says so. A component stylesheet is nothing but `var(--lat-*)` references resolving into the token package, so a mismatched pair renders unstyled rather than failing loudly — the shared version number is what makes the supported pair obvious.

## Scope

**In:** colour scales, semantic colour tokens, light and dark modes (dark is the default), a per-scale computed on-solid, an ordered severity ramp, validated categorical and sequential chart palettes, primitive and semantic typography tokens, primitive spacing, breakpoints, containers and radii tokens, primitive motion tokens, four elevation roles (theme-independent), and twenty component families on Ariakit.

**Not yet:** semantic spacing roles, wide-gamut output, forced-colors handling. Each is tracked separately.

Components deferred with a reason: `EmptyState` — its four tabstop instances share no structure, and it makes no guarantee a consumer would otherwise have to remember, which is the admission test every shipped component passes. `Skeleton` and `Toast` — both want continuous motion, which the reduced-motion contract forbids until the pausability escape is designed. `Link`, `Tooltip`, `Select`, `Combobox` — no specified screen uses one.

Typography keeps the system sans stack as its default and provides seventeen semantic roles. Instrument Sans and JetBrains Mono, the identity's two families, are self-hosted by this package rather than loaded from Google Fonts — see [Fonts](#fonts) below.

## Design docs

Decisions live in [`docs/superpowers/specs/`](./docs/superpowers/specs/). Start with [the identity spec](./docs/superpowers/specs/2026-08-03-lattice-identity-design.md), the identity currently shipped, which supersedes the original [colour system](./docs/superpowers/specs/2026-07-28-lattice-color-system-design.md) design; then [typography](./docs/superpowers/specs/2026-07-30-lattice-typography-design.md), [spacing/motion](./docs/superpowers/specs/2026-07-30-lattice-spacing-and-motion-design.md), [elevation](./docs/superpowers/specs/2026-07-31-lattice-elevation-design.md), and [the component library](./docs/superpowers/specs/2026-07-31-lattice-component-library-design.md) designs — they record what was chosen, what was rejected, and the measurements behind each.

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

Storybook is also where the acceptance test for this whole identity lives: the
`Pages/System` and `Pages/Landing` stories are the bundle's documentation site
and the tabstop landing page, rebuilt using nothing but this package's exported
components. `tests/browser/a11y.spec.ts` sweeps both, in both themes, with the
same axe-core suite that checks every component story — see the [accepted
contrast failures](#accepted-contrast-failures) above for what is expected to
still fail there, and the [gap list](./docs/superpowers/plans/2026-08-03-lattice-gaps.md)
for what building them found the library still lacks.

A pnpm workspace. Root scripts fan out to every package; run them inside a package directory to work on one.

```
packages/
├── tokens/     @chameleon-labs/lattice-tokens — config/, generate/, tests/, dist/
└── react/      @chameleon-labs/lattice-react — src/, .storybook/, tests/, dist/
```

Inside `packages/tokens/`, `config/` declares reviewed token values and contracts and `generate/` turns them into artefacts. `dist/` is generated output and is not committed.

Never hand-edit a primitive token, and never hand-edit `dist/`. Change the config and rebuild — a value that is not declared or computed does not ship.

## Releasing

Both packages ship at one version, and releasing is one button: **Actions → Cut release → Run workflow**. Pick how far to move the version and it does the rest — bump both manifests, commit, tag, and start the release.

| bump | from `0.1.0-rc.1` | when |
|---|---|---|
| `current` | `0.1.0-rc.1` | the first release, or re-cutting one that failed before publishing |
| `prerelease` | `0.1.0-rc.2` | another candidate |
| `release` | `0.1.0` | graduate the candidate |
| `minor` | `0.1.0` | — the candidate *is* 0.1.0, so this graduates too |
| `major` | `1.0.0` | |

`dry_run` runs every check and works out the version without tagging anything.

**Only repository members can start one.** Both triggers — `workflow_dispatch` and pushing a `v*` tag — require write access, enforced by GitHub rather than by anything in the workflow; a fork or an outside contributor cannot reach either. The `npm-publish` environment on the release job is where that tightens further: add required reviewers in *Settings → Environments* and every release waits for an approval, with no change to the workflow. `NPM_TOKEN` belongs to that environment rather than to the repository at large, so no other workflow can read it.

Two things about the automation are worth knowing, because both are surprising:

- **A tag pushed by Actions does not trigger the release.** GitHub suppresses workflow events raised by the default `GITHUB_TOKEN` so a workflow cannot trigger itself in a loop, so `on: push: tags` never fires for it. `workflow_dispatch` is a documented exception, so `cut-release.yml` tags *and then dispatches* `release.yml` explicitly. A tag pushed from a laptop still triggers it the ordinary way — both paths work, for different reasons.
- **A bot commits the version bump straight to `main`**, so if `main` is protected the push needs an exemption.

The manual path still works if you would rather do it yourself — bump both manifests, commit, then `git tag v0.1.0-rc.1 && git push origin v0.1.0-rc.1`.

**The dist-tag is derived from the version, never remembered.** npm tags whatever it publishes `latest` unless told otherwise, so a forgotten `--tag` on a prerelease silently hands every consumer an RC. The workflow reads the version instead — `0.1.0-rc.1` publishes under `rc`, `0.1.0-beta.3` under `beta`, `0.1.0` under `latest` — marks the GitHub Release as a prerelease to match, and afterwards asserts that `latest` did *not* move to the prerelease — except on a package's very first publish, where npm assigns `latest` regardless because a package must have one and there is no other version to carry it.

[`.github/workflows/release.yml`](./.github/workflows/release.yml) re-runs the whole contract suite on the tagged commit, packs both packages, verifies the tarballs, publishes them to npm with provenance, and opens a GitHub Release. It needs an `NPM_TOKEN` secret — an npm automation token with publish rights on the `@chameleon-labs` scope.

**Two tools, deliberately.** `pnpm pack` builds the tarball, because only pnpm rewrites the `workspace:` protocol into a real semver range; `npm publish` ships that tarball, because only npm generates provenance — pnpm 10.7 has no such flag. The publish step uploads the exact bytes the verification step checked, so nothing can change in between.

**The exit code is not the evidence.** pnpm and npm both *skip* a package marked `private` rather than erroring: `pnpm publish -r` prints "There are no new packages that should be published" and exits 0. A release that did nothing looks exactly like one that worked. So the workflow asks the registry directly afterwards, and two scripts run on every PR — long before anyone tries to publish:

```sh
node scripts/bump-version.mjs --self-test   # the version arithmetic
node scripts/check-release.mjs              # manifests: private, versions, exports vs files
node scripts/verify-tarballs.mjs            # packs into .release/ and proves each is consumable
```

`bump-version.mjs` computes the next version and rewrites both manifests, in lockstep, with no semver dependency — the workspace root installs nothing and this runs before `pnpm install`. It follows npm's own rules, including the counterintuitive one: `patch` on `0.1.0-rc.1` gives **`0.1.0`**, not `0.1.1`, because the candidate was a rehearsal of that release. Its `--self-test` checks nineteen cases on every PR, since version arithmetic is a poor thing to debug mid-release.

`check-release.mjs` fails on a package still marked `private`, a version the two packages disagree on, a missing `publishConfig.access`, or an `exports` entry pointing outside `files` — which resolves locally, where the whole working tree is present, and 404s for the consumer. Given the tag it also asserts both manifests match it.

`verify-tarballs.mjs` packs each package and checks that every path its `exports` map promises is present and non-empty, that `README.md` and `LICENSE` are there, that no `workspace:` range survived into the packed manifest, and that no story or test file leaked into the consumer's module graph. The required set is derived from the manifest rather than hand-listed, so a new export cannot be added without the check following it.

Both are cheap to run locally; `.release/` is gitignored.

## Fonts

The identity's two families, Instrument Sans and JetBrains Mono, are
self-hosted rather than loaded from Google Fonts — see
[`packages/tokens/assets/fonts/`](./packages/tokens/assets/fonts/), exported
from `@chameleon-labs/lattice-tokens` at `./fonts/*`. Both are licensed under
the SIL Open Font License 1.1; the full text and provenance are in
[`OFL.txt`](./packages/tokens/assets/fonts/OFL.txt).

## Licence

[MIT](./LICENSE)
