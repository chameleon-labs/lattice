# Lattice — colour system design

**Date:** 2026-07-28
**Status:** superseded by
[Replacing Lattice's visual identity with a Figma-generated one](./2026-08-03-lattice-identity-design.md)
(2026-08-03), which replaces this document's generated OKLCH palette — a
shared lightness curve, a chroma envelope, and a build that fails on a
contrast miss — with pinned anchors from the Figma bundle and a contrast report that ships
regardless of a miss. Kept for the generated-colour reasoning this document
originated, most of which survives as *architecture* even though every value
it produced does not.
**Scope:** the colour system and its token pipeline. Components, typography and spacing are explicitly out of scope and tracked separately.

## Why "Lattice"

Chameleons have no violet pigment. Their colour comes from a lattice of guanine nanocrystals inside cells called iridophores, and the animal changes colour by tuning the *spacing* of that lattice — one structure, retuned, producing many colours.

That is what a token system is. The name is the architecture.

## Background: what we are avoiding

The reference point is a production design system we have worked in, whose colour layer is defined **per component**: a named entry for every part of every component, spread across dozens of files and thousands of lines. The consequence shows up in its dark theme, which is the light theme spread into a new object with a couple of overrides on top. Dark mode was never really built, because when every colour is addressed through a component name, a second mode means re-authoring all of them.

Every mature system we surveyed — Spectrum, Carbon, Primer, Radix, Chakra v3 — has a **semantic tier between primitives and components**. That reference system has primitives and component tokens and nothing in between. The missing tier is the single most important thing this design adds.

## Decisions

| Decision | Choice |
|---|---|
| Audience | Public repo under `chameleon-labs`, our products first. No stability promise stated. |
| Styling layer | CSS Modules + CSS custom properties. Zero runtime, no build coupling. |
| Scale source | Generated in OKLCH from a config, seeded by converting Radix's published scales to read off their curve shapes. |
| Contrast standard | WCAG 2.2 AA is a hard gate; APCA Lc computed and reported, never gated on. |
| Inventory | 5 UI scales + ordered severity ramp + categorical & sequential chart palettes. |
| Brand hue | Violet, 305°. |
| Solid step | Constrained so white text passes 4.5:1. |

### Why WCAG 2.2 AA over APCA

APCA is perceptually more accurate, particularly in dark mode. It is also not a conformance standard, and tabstop — the first consumer — audits pages with axe-core, which reports WCAG 2. A design system whose own palette was justified by a different standard than the product's audit engine would be indefensible. APCA is computed and shown alongside so the gap is visible rather than hidden.

## Architecture

Three tiers.

The repository is a pnpm workspace. `packages/tokens/` is this spec; `packages/react/` is the component layer and does not exist yet.

```
packages/tokens/
├── config/
│   ├── lightness.ts    shared L curve (light + dark)
│   ├── chroma.ts       chroma envelope, as a fraction of each scale's peak
│   ├── scales.ts       hue + peak chroma per scale
│   └── contracts.ts    which step pairs must pass, at what ratio
├── generate/
│   ├── oklch.ts        OKLCH <-> sRGB, binary-search gamut fit
│   ├── contrast.ts     WCAG 2.x ratio (gate) + APCA Lc (advisory)
│   ├── solve.ts        solve L against a target ratio
│   └── emit.ts         CSS + design-tokens JSON
├── dist/
│   ├── lattice.css     all tiers, both modes
│   └── tokens.json     design-token format
└── tests/
    └── contracts.test.ts   every pair, every scale, every mode
```

**Tier 1 — primitive, generated.** `--lat-accent-1…12`, `--lat-gray-1…12`, `--lat-danger-*`, `--lat-warning-*`, `--lat-success-*`. Emitted by the build. Never hand-edited. Never referenced by a component.

**Tier 2 — semantic, hand-authored.** Two sub-layers:

- *Step aliases* keep the step contract addressable: `--lat-bg-subtle: var(--lat-gray-2)`.
- *Role aliases* cover the ~15 common jobs: `--lat-text`, `--lat-text-subtle`, `--lat-border`, `--lat-border-interactive`, `--lat-focus-ring`, `--lat-solid`, `--lat-solid-hover`, `--lat-on-solid`.

Components reach for role aliases first and step aliases only where the role layer does not cover the case.

**Tier 3 — component tokens.** Permitted, but each one requires a written justification in review. This is the tier that undermined the reference system by becoming its default. The constraint is social, not technical, and that is deliberate — a lint rule here would be circumvented rather than obeyed.

### The step contract

Adopted from Radix, because a numbered scale whose numbers mean *jobs* makes contrast structural rather than re-checked per theme.

| Step | Job |
|---|---|
| 1–2 | app background, subtle component background |
| 3–5 | component background: rest, hover, active |
| 6–8 | borders: subtle, interactive, strong + focus ring |
| 9 | solid fill (peak chroma) |
| 10 | solid hover |
| 11 | low-contrast text |
| 12 | high-contrast text |

### Modes

`[data-lat-theme]` applies on **any** element, not only `:root`, so a section can be inverted independently. `prefers-color-scheme` supplies the default; an explicit attribute wins in both directions.

```css
:root, [data-lat-theme='light'] { /* light tokens */ }
[data-lat-theme='dark']         { /* dark tokens  */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-lat-theme='light']) { /* dark tokens */ }
}
```

## The generator

### The rule

**The shared lightness curve is the default. Per-hue solving is a correction, applied only where a contract would otherwise fail.**

This matters because the two decisions above are in tension. OKLCH lightness is perceptually uniform; WCAG 2's luminance is not — it weights green at 0.7152 against blue at 0.0722. At identical OKLCH L, a teal is far brighter by WCAG's maths than a violet, so a single shared L curve *cannot* satisfy WCAG AA across all hues.

Solving every step per hue would fix that and destroy the family resemblance. Solving only on failure keeps both.

Measured across all five scales in both modes:

| Scale | Mode | Curve L11 | Solved L11 | Drift | 11-on-2 | 9-vs-1 | Corrected |
|---|---|---|---|---|---|---|---|
| accent | light | 0.545 | 0.545 | — | 5.05 | 3.32 | none |
| accent | dark | 0.800 | 0.800 | — | 9.27 | 5.58 | none |
| gray | light | 0.545 | 0.545 | — | 4.71 | 3.06 | none |
| gray | dark | 0.800 | 0.800 | — | 9.57 | 6.04 | none |
| danger | light | 0.545 | 0.545 | — | 5.05 | 3.32 | none |
| danger | dark | 0.800 | 0.800 | — | 9.25 | 5.58 | none |
| warning | light | 0.545 | 0.545 | — | 4.78 | 3.12 | none |
| warning | dark | 0.800 | 0.800 | — | 9.49 | 5.93 | none |
| **success** | **light** | **0.545** | **0.541** | **−0.004** | 4.53 | 3.00 | **9, 11** |
| success | dark | 0.800 | 0.800 | — | 9.87 | 6.44 | none |

One correction across ten scale-modes, moving L by 0.004 — visually undetectable. The solver is a safety net, not a constant override.

**This table measures the curve alone**, before the accent's solid-step constraint is applied. It is the evidence for the rule, not the final accent scale — the accent's own `on-solid` constraint and the cascade below move its steps 9–12, and its final values are in *`on-solid` is computed* further down. The two are consistent: the constraint is a separate, deliberate override applied after the contrast contracts are satisfied.

### Contracts

| Step | Reference | Minimum |
|---|---|---|
| 9 | step 1 | 3.0:1 |
| 11 | step 2 | 4.5:1 |
| 12 | step 2 | 4.5:1 |

Step 10 tracks step 9 by a delta so hover stays coupled to solid rather than drifting independently.

### Corrections cascade

A correction to one step can collide with the next. Constraining the accent's solid step downward (below) moved step 10 to `L 0.546` while step 11 sat at `L 0.545` — solid-hover and low-contrast text would have rendered as the same colour.

**Therefore: corrections cascade downward, preserving a minimum ΔL of 0.040 between consecutive contract steps.** Steps 10, 11 and 12 are re-seated beneath a corrected step 9 rather than read off the curve. A step's contract is re-verified after re-seating; separation never wins over contrast.

### Gamut mapping

Requested chroma is fitted into sRGB by binary search on C, holding L and H. The fitted value is recorded, not the requested one, so the config never lies about what shipped.

### `on-solid` is computed, never assumed

For each scale the generator measures white and black against step 9 and picks the winner. Hard-coding white here is a recurring bug in hand-built systems.

At the unconstrained solid lightness of `L 0.660`, violet gave black 6.19:1 and white 3.39:1 — a black primary button. **Decision: constrain the accent's solid step to `L 0.591`**, the exact point where white reaches 4.50:1. The palette reads deeper and gives up some chroma at step 9; in exchange the primary button behaves conventionally. Non-accent scales keep the computed answer.

The resulting accent scale, light mode, after the constraint and the cascade:

| Step | OKLCH | Hex | ΔL to prev |
|---|---|---|---|
| 8 | `oklch(0.795 0.130 305)` | `#d0a6ff` | 0.053 |
| 9 | `oklch(0.591 0.200 305)` | `#9a54da` | 0.204 |
| 10 | `oklch(0.561 0.194 305)` | `#904dce` | 0.030 |
| 11 | `oklch(0.521 0.164 305)` | `#804ab3` | 0.040 |
| 12 | `oklch(0.320 0.084 305)` | `#3d2655` | 0.201 |

Contracts after re-seating: white on step 9 **4.51:1**; step 9 vs step 1 **4.41:1**; step 11 vs step 2 **5.58:1**; step 12 vs step 2 **12.33:1**. All clear.

The large gap between steps 8 and 9 is inherent to the step contract — 8 is a border, 9 is a solid fill — and Radix's scales show the same discontinuity.

## Severity ramp

axe reports four impact levels. They must read as *ordered*, which semantic `danger`/`warning` cannot express.

In light mode both lightness and chroma move monotonically, so the ramp reads as ordered in greyscale, under any CVD simulation, and in forced-colors mode.

| Level | Light | greyscale Y | on light | Dark | on dark |
|---|---|---|---|---|---|
| minor | `#ad8604` | 0.260 | 3.34:1 | `#c39800` | 7.02:1 |
| moderate | `#b36600` | 0.191 | 4.29:1 | `#e38300` | 6.75:1 |
| serious | `#b93a13` | 0.134 | 5.61:1 | `#f5714e` | 6.61:1 |
| critical | `#ad003a` | 0.092 | 7.27:1 | `#f56a7e` | 6.51:1 |

**Dark mode deliberately does not preserve greyscale ordering.** Forcing lightness to climb with severity produced `#ffb0b7` for `critical` — a pale pink, making the most urgent level the least urgent-looking. Dark therefore holds `L 0.70` flat and lets hue and chroma carry it. Ordering is conveyed by the mandatory icon + label, which status colours require regardless: colour never carries state alone.

## Chart palettes

Derived by enumerating all 5,040 orderings with violet fixed in slot 1, validating each in both modes, and keeping the best passing order. Adjacent slots alternate lightness tier — separation is carried by lightness, not hue, which is what survives protanopia and deuteranopia.

| Slot | Hue | Light | Dark |
|---|---|---|---|
| 1 | violet | `#a169da` | `#a169da` |
| 2 | orange | `#b64a00` | `#bf4e00` |
| 3 | aqua | `#009d9d` | `#009d9d` |
| 4 | yellow | `#856e00` | `#8b7400` |
| 5 | magenta | `#cd57a0` | `#cd57a0` |
| 6 | green | `#008652` | `#008c57` |
| 7 | blue | `#188ceb` | `#188ceb` |
| 8 | red | `#bd3855` | `#c43e5b` |

- Worst adjacent CVD ΔE **9.9** (target ≥ 8); worst normal-vision ΔE **18.3** (floor ≥ 15)
- All 8 clear 3:1 in both modes — **no relief obligation**
- Scatter / bubble / small-multiples cap: the **first 3 slots** validate all-pairs. Past three, fold to "Other" or facet.

An alternate ordering reached CVD ΔE 14.8 but left four dark slots below 3:1, permanently obligating direct labels or a table view. We took 9.9 with no obligation over 14.8 with one.

Surfaces used for validation: light `#fdfdfd`, dark `#111112` (gray-1 in each mode).

### Sequential ramp — the score

Single hue, violet, `100`→`700`:

`#eee1ff` · `#dcc5f9` · `#c6a7eb` · `#b189dd` · `#9b6bce` · `#8449bb` · `#6816a1`

Lightness is monotone; every adjacent gap clears ΔL ≥ 0.06. The full range is for **sequential** encoding, where the lightest step may recede into the surface. For **ordinal** encoding the ends are clamped: on light start no lighter than step 300 (2.04:1); on dark go no darker than step 600 (3.28:1).

## Testing

Tests are the deliverable, not a formality. `tests/contracts.test.ts` fails the build, not a linter.

1. **Step contracts** — every documented pair, every scale, every mode, against its WCAG minimum.
2. **Categorical palette** — the six checks, both modes, adjacent and all-pairs.
3. **Ordinal monotonicity** — the sequential ramp's lightness progression and clamped ends.
4. **Emitted-CSS snapshot** — an unintended token change surfaces as a review diff rather than in production.

APCA Lc is computed and reported in all four groups. It never fails a build.

## Distribution

Published as **`@chameleon-labs/lattice-tokens`**: `dist/lattice.css` and `dist/tokens.json`. Semver with real releases; no API stability promise stated. Consumers import one stylesheet and get CSS custom properties — no build-tool coupling, no runtime, no framework requirement.

The name is suffixed rather than bare because the component layer ships as a **second package, `@chameleon-labs/lattice-react`**. Every system this design draws on is structured that way, and the discriminator is the peer dependency: `@radix-ui/colors`, `@primer/primitives`, `@adobe/spectrum-tokens` and `@ariakit/core` declare no framework peer, while their component counterparts do. Splitting keeps the tokens installable by a consumer that never uses React, and lets the typography and spacing scales land in the same package without a rename — they are tokens too. The bare name `@chameleon-labs/lattice` stays unpublished, free to become a meta-package that re-exports both.

Both packages live in this repository, a pnpm workspace: `packages/tokens/` and, later, `packages/react/`. The workspace exists from the start rather than being retrofitted — the second package is committed work, not a maybe, so deferring only moves a guaranteed migration to a point where it would invalidate the paths every pipeline issue implements into.

## Non-goals for v1

Each of these is real work that tabstop's web app needs. They are excluded from *this* spec because they are separately designable, and each gets its own spec → plan → implementation cycle.

- **Component library** on Ariakit — the largest follow-up.
- **Typography scale** — families, sizes, line heights, weights.
- **Spacing and sizing scales**, radii, shadows, motion.
- External theming API (the indirection exists; it is not documented as public).
- P3 / wide-gamut output.
- `prefers-contrast` / high-contrast mode and forced-colors handling.

P3 and forced-colors are the most likely v2 additions to the colour system itself.

## Open questions

None. Every value in this document is computed and validated; nothing is a placeholder.
