# Meridian: replacing Lattice's visual identity

**Status:** approved
**Date:** 2026-08-03
**Packages:** `@chameleon-labs/lattice-tokens`, `@chameleon-labs/lattice-react`
**Source:** the Figma Make bundle *Custom Design System*
(`figma.com/design/8pQ17TGPYffdfKoqEPkyEC`), delivered as two exports whose only
difference is `src/app/App.tsx` — one a design-system documentation site, the
other a tabstop landing page. The documentation site names the identity
**Meridian**, and that is the name used here.

## The premise

Lattice's values are replaced wholesale by the values Figma generated. Lattice's
*architecture* is not. The package keeps its name, its two-package split, its
generated-colour thesis, its three tiers, and Ariakit as the behaviour layer;
what changes is every number those mechanisms carry.

This is a deliberate inversion of how the system has worked until now. Until
today, values were derived and the derivation was the authority. From today, the
Figma output is the authority and derivation fills the gaps it left. The reason
to write that down is that it changes what a failure means: a contrast miss is
no longer a bug in the curve, it is a property of the identity, and the system
reports it rather than refusing to build.

### The rule that changes

> Colours are generated, not picked. The build **fails** if any documented pair
> misses its contrast contract.

becomes

> Colours are **pinned** where Figma spoke and generated where it did not. Every
> documented pair is still measured, in WCAG and APCA, and the result is
> **reported**. The build does not fail.

Nothing else about the token pipeline changes. The OKLCH solver, the sRGB gamut
mapping, the emit layer, and the DTCG output all survive; they take pinned
anchors as input instead of a curve alone.

## What survives

| | |
| --- | --- |
| Monorepo, two packages | unchanged |
| OKLCH solving + gamut mapping | unchanged mechanism, new inputs |
| Three tiers: primitive → semantic → component | unchanged |
| `--lat-*` custom properties, `lat-` classes, plain CSS | unchanged |
| `[data-lat-theme]` nested theming, aliases emitted per scope | unchanged |
| Ariakit as the behaviour layer | unchanged |
| Storybook as gallery and a11y fixture | unchanged; default flips to dark |
| Reduced-motion contract | unchanged |
| Edges are borders, never `box-shadow` | carried forward — see §5 |

## 1. Colour

### 1.1 The pinned anchors

Every value below is copied verbatim from the bundle's `src/styles/theme.css`.
These are the anchors; nothing generates them and nothing adjusts them.

| Meridian role | Lattice role | dark | light |
| --- | --- | --- | --- |
| `--background` | `--lat-bg` | `#0c0c14` | `#f0f0f8` |
| `--card`, `--popover` | `--lat-bg-raised` | `#111120` | `#ffffff` |
| `--secondary` | `--lat-component` | `#1a1a2e` | `#e4e4f0` |
| `--muted` | `--lat-bg-subtle` | `#16162a` | `#eaeaf4` |
| `--muted-foreground` | `--lat-text-subtle` | `#6b6b90` | `#58588a` |
| `--foreground` | `--lat-text` | `#e2e2ee` | `#0c0c14` |
| `--primary` | `--lat-solid` | `#cff23a` | `#6a9b00` |
| `--primary-foreground` | `--lat-on-solid` | `#0c0c14` | `#ffffff` |
| `--accent` | `--lat-accent-vivid` | `#cff23a` | `#cff23a` |
| `--destructive` | `--lat-danger-solid` | `#ff4d6a` | `#d41240` |
| `--input-background` | `--lat-field-bg` | `#1a1a2e` | `#e8e8f2` |
| `--switch-background` | `--lat-switch-track` | `#2a2a48` | `#c8c8dc` |
| `--border` | `--lat-border` | `rgb(255 255 255 / 0.07)` | `rgb(0 0 0 / 0.08)` |
| `--ring` | `--lat-focus-ring` | `rgb(207 242 58 / 0.35)` | `rgb(106 155 0 / 0.3)` |
| `--chart-2` | `--lat-info-solid` | `#38bdf8` | `#0284c7` |
| `--chart-5` | `--lat-success-solid` | `#34d399` | `#059669` |
| `--chart-3` | `--lat-decorative-solid` | `#a78bfa` | `#7c3aed` |
| `--chart-4` | `--lat-warning-solid` | `#fb923c` | `#ea580c` |

The naming of `chart-2/3/5` as info, decorative and success is not an
interpretation — the documentation site's own token table labels them exactly
that way while binding them to the chart slots.

### 1.2 Two structural consequences

**Borders become alpha, not a scale step.** Meridian draws every hairline with
white or black at 7–8%, so an edge composites over whatever surface it lies on
and a card inside a card produces two visibly different greys from one token.
Lattice's border roles currently resolve to grey scale steps, which composite
with nothing. The token package gains an **alpha tier**: a small set of
`--lat-alpha-*` primitives in white and black, from which `--lat-border`,
`--lat-border-strong` and the tinted component fills are built. This is new
machinery, not a re-pointing.

**Tinted fills are a first-class pattern.** Meridian's destructive button, every
badge, and the impact ramp are all *colour at 10–15% over the surface, with a
20–25% border and full-strength text*. That triple is the single most repeated
construction in the bundle. It becomes a documented recipe with tokens per
scale (`--lat-danger-tint`, `--lat-danger-tint-border`, `--lat-danger-text`)
rather than a set of one-off alpha values re-typed per component.

### 1.3 What the generator still does

*Revised 2026-08-03 during planning, after converting every anchor to OKLCH.
The original text said the solver would walk the shared lightness curve outward
from each anchor to produce hover and active neighbours. Two measurements
disproved it.*

**The shared lightness curve does not survive contact with this palette.** It
holds that step N carries the same lightness in every scale, and that step 9 is
mode-invariant. Meridian's accent is `#cff23a` at **L 0.905, H 120.3** in dark
and `#6a9b00` at **L 0.630, H 128.6** in light — different lightness *and*
different hue per mode. Grey runs L 0.159 → 0.916 in dark at a near-constant
hue of ~284°, and its anchors do not sit on the curve either.

**Meridian has no colour hover states.** Its primary button hovers with
`opacity: 0.9`, secondary with `brightness(0.95)`, ghost with a 5% foreground
wash. There are no `-hover` or `-active` colours to generate, because the design
does not express hover as a colour.

So the curve, the chroma envelope, and the per-step contract machinery are
**retired for colour**, and the anchors *are* the palette. Grey is anchored at
all eight roles it needs; each chromatic scale is anchored at its solid. What
the generator still does:

1. **Converts every anchor to OKLCH** and emits `oklch()`, keeping the bit-depth
   benefit and leaving the wide-gamut path open.
2. **Derives the tinted triple** per chromatic scale — fill at 10%, border at
   20%, text at full strength — which is the single most repeated construction
   in the bundle and the only thing Meridian leaves implicit.
3. **Derives the one missing value**, light-mode `moderate` severity.
4. **Computes and reports** WCAG and APCA for every documented pair (§9).
5. **Gamut-checks** every value.

This is a smaller generator than the one it replaces, and honestly so: a system
whose values were handed to it should not pretend to have computed them. What
is derived is labelled `derived` in `tokens.json`; everything else is labelled
`anchored`.

### 1.4 Severity

The landing page's impact ramp is adopted directly for dark mode:

| impact | dark | light |
| --- | --- | --- |
| critical | `#ff4d6a` | `#d41240` (the declared destructive) |
| serious | `#fb923c` | `#ea580c` (the declared `chart-4`) |
| moderate | `#fbbf24` | **derived** |
| minor | `--lat-text-subtle` | `--lat-text-subtle` |

**Known gap:** the bundle declares no light-mode `moderate`. It is derived by
applying the same lightness delta that separates dark `#fb923c` from light
`#ea580c` to dark `#fbbf24`, and is marked derived in the output.

The rule that severity is never conveyed by colour alone — every severity
indicator carries an icon *and* a text label — survives from the prior system
and is unaffected by the palette change. It is what makes the ramp safe under
protanopia and deuteranopia regardless of hue spacing.

## 2. Typography

**Families.** Instrument Sans (variable, `wdth 75..100`, `wght 400..700`,
italic) for everything, JetBrains Mono (variable, `wght 100..800`) for the mono
roles. Both are self-hosted as woff2 in `@chameleon-labs/lattice-tokens` with
`@font-face` rules and `font-display: swap`. The bundle loads them from Google
Fonts; that is replaced, because a third-party request on every consumer's
critical path is not something a token package should impose, and an identity
that silently degrades to system fonts is not an identity.

**Root size** is 16px, set on `html`, replacing the current root.

**Scale**, taken from the documentation site's own type specimen:

| role | size | weight |
| --- | --- | --- |
| display | 48 | bold (700) |
| h1 | 30 | semibold (600) |
| h2 | 24 | medium (500) |
| h3 | 20 | medium (500) |
| body | 16 | regular (400) |
| small | 14 | regular (400) |
| mono | 14 | regular (400) |

Meridian sets headings at `line-height: 1.5` and tracks display and headings
tight (`tracking-tight`); both are folded into the role tokens.

**Five new mono roles.** This is the identity's most recognisable move and it
needs somewhere to live, or the same three declarations get re-typed in a dozen
components:

| role | value |
| --- | --- |
| `eyebrow` | 10px mono, uppercase, **0.2em** tracking |
| `meta` | 10–11px mono, normal case |
| `tag` | 10px mono, uppercase, 0.05em tracking |
| `numeric` | mono, `font-variant-numeric: tabular-nums` |
| `code` | 14px mono |

The eleven existing sans roles are re-pointed to the scale above rather than
removed.

## 3. Shape

`--radius` is `0.1875rem` (3px), and `--radius-sm` is `calc(var(--radius) - 4px)`
— which is **−1px**, clamped to `0` at computed-value time. Both demo pages use
`rounded-sm` 49 times and `rounded-full` 8 times, and nothing else.

So the identity, as rendered, is **square**. The 3px reaches only the stock
shadcn files in `components/ui/` that were never touched by the design. The
radius scale is taken from what the design actually shows:

| token | value | used for |
| --- | --- | --- |
| `none` | 0 | the default: buttons, inputs, cards, panels, badges |
| `sm` | 3px | the declared `--radius`, available for large surfaces |
| `full` | 9999px | dots, avatars, status indicators |

Three values, not five. The intermediate steps in the current scale
(`sm: 0.25rem`, `md: 0.5rem`, `lg: 0.75rem`) have nothing to express in a square
system and are removed rather than left as tokens nobody should reach for.

The nested-radius pairing rule is dropped. It solves a problem — an inner corner
looking wrong inside an outer one — that a square system does not have.

## 4. Spacing

Meridian's declared scale is 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px. Lattice's
existing 4px-multiplier scale already contains every one of those values, so
`SPACES` is unchanged. The Meridian subset is documented as the preferred set;
the intermediate steps stay available.

Breakpoints and containers are unchanged. The bundle's demos are laid out at
`max-w-5xl` with `px-6 / md:px-10 / lg:px-12`, which the existing containers
already express.

## 5. Edge and elevation

**Edges are 1px solid borders using the alpha hairline.** Never `box-shadow`.
This rule is carried forward from the superseded Quiet Surface spec, and it is
carried forward for its reason, not its aesthetics: `box-shadow` is not rendered
under forced-colors, so a control whose only edge is a ring has no edge at all
for a high-contrast user. `tests/browser/a11y.spec.ts` already asserts this.

**Elevation collapses to four roles**, replacing the calibrated multi-level
model, because four is all Meridian uses:

| role | value (Tailwind v4 equivalents, as the bundle emits them) | used by |
| --- | --- | --- |
| `flat` | hairline only, no shadow | cards, panels, inputs, buttons |
| `raised` | `0 1px 3px 0 rgb(0 0 0/.1), 0 1px 2px -1px rgb(0 0 0/.1)` | segmented-control thumb |
| `overlay` | `0 10px 15px -3px rgb(0 0 0/.1), 0 4px 6px -4px rgb(0 0 0/.1)` | tooltip, popover, menu |
| `floating` | `0 25px 50px -12px rgb(0 0 0/.25)` | the hero audit card |

**Recorded, not fixed:** these shadows are pure black at 10–25% alpha. Over
`#0c0c14` they are close to invisible, which is why the identity reads as flat
in dark mode and leans on the hairline instead. `floating` is the only one that
carries. That is the design as delivered and it ships as delivered; the
observation is recorded so a future change is a decision rather than a
discovery.

The dialog backdrop dims the page rather than tinting it — the failure the Quiet
Surface spec found (80% of near-white over near-white) is not reintroduced.

## 6. Motion

Meridian's five presets replace the current durations:

| preset | duration | easing |
| --- | --- | --- |
| instant | 0ms | — |
| swift | 100ms | ease-out |
| default | 200ms | ease-out |
| deliberate | 350ms | ease-in-out |
| expressive | 500ms | spring |

`expressive` is emitted as a **duration token only**. No CSS timing function
reproduces a spring, and Lattice does not take a JavaScript animation dependency
to provide one, so the token records the 500ms intent and documents that a
caller wanting true spring behaviour supplies its own animation library. No
component in the library uses `expressive`.

The reduced-motion contract is unchanged: transforms and continuous motion are
suppressed under `prefers-reduced-motion: reduce`, colour transitions are not,
because colour feedback is never what causes vestibular harm.

## 7. Components

### 7.1 The fourteen, restyled

Ariakit wiring is retained. Appearance and public variant APIs are rewritten to
Meridian's own axes, discarding the previous `variant × tone` matrix.

**Button** — `variant: primary | secondary | ghost | destructive | link`, plus
`size`. Verbatim from the documentation site's Button panel:

| variant | construction |
| --- | --- |
| primary | `--lat-solid` fill, `--lat-on-solid` text, semibold, hover dims to 90% |
| secondary | `--lat-component` fill, hairline border, medium weight |
| ghost | transparent, hairline border, hover fills at 5% foreground |
| destructive | danger **tint** at 10%, tint border at 20%, danger text — not a solid red fill |
| link | transparent, no border, muted text, underline with a hairline decoration colour |
| disabled | 5% foreground fill, muted text, 50% opacity |

The tone axis is gone. A neutral button is `secondary`; a dangerous one is
`destructive`. This is a breaking API change and is intended as one.

**Badge** — `variant: default | primary | info | success | danger`. Always the
tinted triple from §1.2, always mono uppercase at 10px with `tracking-wider`.
The landing page's `ImpactBadge` is this component with a severity variant plus
a required icon and label; it does not become a separate component.

**Card** — gains a header slot: a `border-b` row carrying an uppercase mono
eyebrow and an optional icon, with the body at `p-5`/`p-6`. Every panel in both
demos is built this way, which is what makes it a component concern rather than
a composition each caller repeats.

**Input / TextField** — `--lat-field-bg` fill, hairline border, **mono** value
text, and an uppercase mono eyebrow as the label. Focus is a 1px ring at
`primary/40` plus a border at `primary/40`.

**Callout, Dialog, Disclosure, LiveRegion, Menu, Switch, Table, Tabs,
VisuallyHidden** — restyled to the same vocabulary: hairline edges, square
corners, mono uppercase for any label or column header, `--lat-bg-raised`
surfaces on `--lat-bg` pages. Table header cells adopt the 10px uppercase mono
treatment with `font-weight: normal`, and rows divide with the hairline at 50%.

### 7.2 Four added

Each earns its place by appearing in both demos and carrying a guarantee a
caller would otherwise have to remember:

- **SegmentedControl** — `--lat-bg-subtle` track with 2px padding, active thumb
  at `--lat-bg-raised` with `raised` elevation, mono labels. Built on Ariakit's
  radio store so arrow-key semantics and roving focus are not re-implemented.
- **Eyebrow** — the uppercase 10px mono label with 0.2em tracking, optionally
  with the leading hairline rule the landing page uses. It exists so the
  tracking value has exactly one home.
- **Stat** — value, label, and sub-label in the trust-bar arrangement, with the
  numeric role's tabular figures applied so a row of stats does not jitter.
- **CodeBlock** — mono block with a hover-revealed copy control, including the
  live-region announcement on copy that the bundle's version omits.

### 7.3 Deliberately not added

**ScoreArc.** It is tabstop product surface, not system surface: one consumer,
one arrangement, and no guarantee a caller would otherwise have to remember.
This is the same admission test that kept `EmptyState` out.

The ~50 remaining stock shadcn components in the bundle's `components/ui/`
directory are not ported. They are unmodified shadcn defaults that the design
never touched — they carry no Meridian decisions, and porting them to Ariakit
would be inventing a design system rather than applying one.

## 8. Proof

Storybook remains the single gallery, with two changes: **dark is the default
theme**, and a theme toggle is available on every story.

Both bundle pages are rebuilt as page stories composed only of Lattice
components — the Meridian documentation site and the tabstop landing page. They
are the acceptance test for this work. Anything either page needs that the
library cannot express is a gap, and the gap list is the output of building
them.

The existing axe-core sweep runs over both page stories as well as the
per-component stories.

## 9. The contrast ledger

Because the gate is now a report, the report is part of the spec. Measured with
WCAG 2.x on the delivered values:

| pair | ratio | verdict |
| --- | --- | --- |
| dark `foreground` on `background` | 15.16 | passes |
| dark `primary-foreground` on `primary` | 15.22 | passes |
| light `foreground` on `background` | 17.18 | passes |
| light `muted-foreground` on `card` | 6.61 | passes |
| dark danger text on its 10% tint | 5.23 | passes |
| dark info text on its 10% tint | 7.46 | passes |
| dark success text on its 10% tint | 8.27 | passes |
| **light `primary-foreground` (#fff) on `primary` (#6a9b00)** | **3.33** | **fails AA for the button label** |
| **dark `muted-foreground` on `card`** | **3.67** | **fails AA for body text** |
| **light `primary` as text on `background`** | **2.94** | **fails AA** |
| **light focus ring `primary/40` vs `card`** | **1.56** | **fails SC 1.4.11 (needs 3:1)** |
| **`--ring` at 0.35 vs dark `card`** | **2.73** | **fails SC 1.4.11** |
| dark focus ring `primary/40` vs `card` | 3.20 | passes SC 1.4.11 |
| hairline border vs its surface | 1.19 | decorative; see below |

Five failures ship. That is the consequence of the decision in §"The premise",
taken knowingly, and the ledger exists so it stays visible rather than becoming
folklore.

Two notes on the last row. The hairline at 1.19 is not itself a violation —
decorative borders carry no contrast requirement. It matters only for the text
input, where the border would otherwise be the sole means of identifying the
control; there the filled `--lat-field-bg` provides identification, so the
control is distinguishable without relying on its edge.

The light-mode focus ring is the most serious entry in the table, because a
focus indicator that cannot be seen is a keyboard user's only means of
orientation. It is recorded here and left as delivered.

APCA `Lc` is computed and emitted alongside every WCAG figure, as before.

## 10. Superseded

Three specs conflict with this direction. Each keeps its file and gains a
`Status: superseded` header pointing here, because the reasoning is worth more
than the tidiness of deleting it:

- **`2026-08-02-quiet-surface-design.md`** — white floating surfaces, neutral
  default action, accent as opt-in emphasis. Meridian tints its surfaces and
  makes the accent the primary action, which is the opposite call. **One rule
  survives:** edges are borders, not `box-shadow`, for the forced-colors reason
  recorded in §5.
- **`2026-07-31-lattice-elevation-design.md`** — the calibrated multi-level
  model and theme-dependent roles, replaced by the four roles in §5.
- **`2026-08-01-tabstop-design-system-design.md`** — the standalone `--ts-*`
  system with a blue-violet primary. Meridian occupies the same slot and the
  reason for a second system disappears with it.

`docs/superpowers/plans/2026-08-02-quiet-surface.md` is marked superseded
alongside its spec.

## 11. Out of scope

- **Fixing the existing test suite.** Explicitly deferred, with one carve-out
  that is not a fix but a specified behaviour change: the colour **contract
  checks** become reports rather than assertions, per §"The premise", because
  otherwise the token package cannot build at all. Everything else — unit tests,
  snapshot tests, and the Playwright browser tests — will fail against the new
  appearance and is **left failing**, to be addressed as its own piece of work.
  A red suite at the end of this work is the expected outcome, not a defect.
- **Renaming the package.** It remains `@chameleon-labs/lattice`. Meridian is
  the identity the system carries, not the system.
- **Tailwind.** The bundle is Tailwind v4; Lattice stays on plain authored CSS
  and takes the *values*, not the toolchain. No Tailwind dependency reaches a
  consumer.
- **Wide-gamut output and forced-colors handling** remain tracked separately and
  are unaffected.
- **The ~50 untouched shadcn components**, per §7.3.
