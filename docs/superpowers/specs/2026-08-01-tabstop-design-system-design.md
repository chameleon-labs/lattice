# Tabstop design system

**Status:** superseded by
[Replacing Lattice's visual identity with a Figma-generated one](./2026-08-03-lattice-identity-design.md)
(2026-08-03), never implemented. This document argued for a second, standalone
`--ts-*` system with a blue-violet primary. The Figma-generated identity now occupies the same slot
inside Lattice itself, so the reason to maintain two systems disappears with it.
Kept for its palette reasoning — particularly why severity must separate by
lightness as well as hue, which the new system carries forward.
**Audience:** engineers building tabstop, and PMs specifying it.

Tabstop is zero-setup accessibility monitoring: paste a URL, get an axe-core
audit, track the score over time, get emailed on regressions. This document
specifies the design system it is built from.

## The premise, stated plainly

This is a **standalone system**, independent of `@chameleon-labs/lattice`, which
tabstop consumes today. That was a deliberate call, made with the cost
understood: two systems now exist, they will drift, and a fix applied to one
does not reach the other. The alternative — documenting and extending Lattice —
was considered and rejected.

What this system deliberately keeps from Lattice's approach, because the
approach is sound regardless of which system it serves:

- Colours are **generated from a curve**, not picked. A lightness curve, a
  chroma envelope and a hue per scale produce every step.
- Contrast is a **contract checked against the generated values**, not a review
  step. Ninety pairs are verified; every one passes before a value ships.
- Three tiers — primitive, semantic, component — because a system without the
  middle tier cannot gain a second theme without rewriting every component.

The values in this document are the output of that generation, not hand-chosen
approximations. They were produced by solving each contracted step against its
contract and gamut-mapping the result into sRGB.

## Why this palette looks the way it does

Tabstop's subject *is* contrast and severity. That constrains the palette more
than a typical product would be constrained:

1. **The brand colour cannot live near a severity hue.** A primary button that
   reads as a finding is a defect in a product that reports findings. Primary is
   blue-violet at 265°, far from red 27°, orange 40°, amber 75° and green 145°.
2. **There is no `secondary` colour scale.** "Secondary" is a *button variant*
   drawing from `neutral`. A second brand hue would compete with severity for
   meaning, and severity has the stronger claim.
3. **Severity separates by lightness as well as hue.** `serious` (orange 40°)
   and `moderate` (amber 75°) are 35° apart, which is not enough under
   protanopia or deuteranopia. Their solid fills are therefore pinned to
   distinct lightnesses — critical 0.550, serious 0.620, minor 0.650,
   moderate 0.720 — so the ramp survives as a lightness ordering when hue fails.
4. **Severity is never conveyed by colour alone.** Every severity indicator
   carries an icon and a text label. This is a hard rule, not a recommendation,
   and it is what makes point 3 a safety net rather than the only defence.

---

# 1. Design tokens

## 1.1 Tiers

```
primitive   --ts-primary-9         generated; never referenced by a component
semantic    --ts-solid             what components consume
component   --ts-button-bg-rest    permitted, but each needs written justification
```

A component reads the semantic tier. Reaching past it into a primitive is the
error the tier structure exists to make visible.

## 1.2 The generation rules

**Lightness.** Steps 1–7 come from a shared curve. Steps 8, 11 and 12 are
*solved* per scale against their contrast contracts rather than read from the
curve, because a fixed curve cannot know how much luminance a given hue and
chroma contribute. Step 9 is pinned per scale. Step 10 is derived from step 9.

| Step | Light L | Dark L | Job |
|---|---|---|---|
| 1 | 0.994 | 0.175 | page background |
| 2 | 0.983 | 0.213 | subtle background |
| 3 | 0.960 | 0.255 | component fill / soft fill |
| 4 | 0.940 | 0.285 | component fill, hover |
| 5 | 0.920 | 0.315 | component fill, active |
| 6 | 0.895 | 0.350 | subtle border, separators |
| 7 | 0.860 | 0.405 | border |
| 8 | *solved* → 3:1 vs step 1 | *solved* | **interactive border** |
| 9 | *pinned per scale* | same | solid fill |
| 10 | step 9 ± 0.045 | same | solid fill, hover |
| 11 | *solved* → 4.5:1 vs step 3 | *solved* | low-contrast text |
| 12 | *solved* → 7:1 vs step 1 | *solved* | body text |

**Chroma** is a fraction of each scale's peak, by step:
`0.06, 0.12, 0.24, 0.36, 0.44, 0.52, 0.62, 0.78, 1.00, 0.95, 0.85, 0.35`.
Values are gamut-mapped into sRGB by reducing chroma while holding lightness
and hue, so no step silently shifts hue at the gamut boundary.

**Hue and peak chroma per scale:**

| Scale | Hue | Peak C | Step 9 L | Purpose |
|---|---|---|---|---|
| `primary` | 265° | 0.190 | 0.575 | brand, interactive |
| `neutral` | 265° | 0.012 | 0.620 | surfaces, borders, text |
| `critical` | 27° | 0.190 | 0.550 | axe *critical* |
| `serious` | 40° | 0.170 | 0.620 | axe *serious* |
| `moderate` | 75° | 0.160 | 0.720 | axe *moderate* |
| `minor` | 230° | 0.140 | 0.650 | axe *minor* |
| `success` | 145° | 0.160 | 0.600 | passing checks |

`neutral` shares the primary hue at a chroma low enough to read as grey. A
faintly brand-tinted grey is what makes a page feel like one system rather than
a brand colour dropped onto stock grey.

### Two rules that fall out of the arithmetic

**Step 9 is mode-invariant.** A solid fill is the same colour in both themes.
Only the surfaces around it move. This is why a `critical` badge is recognisably
the same badge in either theme.

**Hover moves away from the label colour, not simply darker.** A white-text
button deepens on hover; a black-text button *brightens*. Deepening a black-text
amber fill is exactly what breaks its 4.5:1. Encoding hover as "darker" would
have shipped a hover state that fails contrast on four of seven scales.

**Primary is pinned to its contrast boundary.** `oklch(0.575 0.19 265)` is the
exact lightness at which white label text reaches 4.5:1 against the fill. The
value is not aesthetic; a lighter primary would force black button labels, which
for a brand action is wrong however correct the arithmetic.

## 1.3 The palette

### Light

| Scale | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `primary` | `#fcfdff` | `#f7f9ff` | `#ecf2ff` | `#e2ebff` | `#d8e5ff` | `#ccddff` | `#bbd1ff` | `#6790ef` | `#406fe7` | `#3762d2` | `#4169cd` | `#46577e` |
| `neutral` | `#fdfdfe` | `#f9f9fa` | `#f1f2f4` | `#eaebee` | `#e3e4e8` | `#dadce1` | `#ced1d6` | `#909399` | `#83868e` | `#90949b` | `#6b6e75` | `#56585a` |
| `critical` | `#fffcfc` | `#fff7f6` | `#ffedeb` | `#ffe4e0` | `#ffdbd6` | `#ffcfc9` | `#ffbfb6` | `#e57065` | `#c9302d` | `#b52524` | `#c0433c` | `#7b4b45` |
| `serious` | `#fffcfc` | `#fff8f5` | `#ffeee8` | `#ffe5dc` | `#ffdcd0` | `#ffd0c0` | `#ffc0aa` | `#db7855` | `#d75928` | `#e36b3f` | `#b64e27` | `#764e40` |
| `moderate` | `#fffdfa` | `#fff8f0` | `#ffefdb` | `#ffe7c8` | `#ffdfb4` | `#fdd59f` | `#f7c886` | `#c1882c` | `#db9400` | `#eaa325` | `#966400` | `#6b5433` |
| `minor` | `#fbfeff` | `#f3fbff` | `#e2f5ff` | `#d4f0ff` | `#c5ebff` | `#b1e5ff` | `#94dcff` | `#3a9dc7` | `#009cce` | `#1cabdf` | `#00779e` | `#395c6d` |
| `success` | `#f9fff9` | `#f2fdf2` | `#e3f9e2` | `#d4f6d4` | `#c8f2c8` | `#bbecbb` | `#a8e3a9` | `#5aa35e` | `#31983d` | `#47a54f` | `#2c7f34` | `#425f43` |

### Dark

| Scale | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `primary` | `#0e1016` | `#141924` | `#182239` | `#19284c` | `#1c2f5c` | `#21376d` | `#294488` | `#385cb5` | `#406fe7` | `#3762d2` | `#5a85ec` | `#8a9ec8` |
| `neutral` | `#101011` | `#19191a` | `#222324` | `#292a2c` | `#303234` | `#393a3e` | `#47494d` | `#5e6066` | `#83868e` | `#90949b` | `#868990` | `#9c9ea0` |
| `critical` | `#150f0e` | `#231513` | `#361a17` | `#461a17` | `#541d19` | `#64211c` | `#7c2823` | `#a93933` | `#c9302d` | `#b52524` | `#df6056` | `#c6908a` |
| `serious` | `#150f0d` | `#211612` | `#331c13` | `#431e11` | `#502211` | `#5f2712` | `#773116` | `#a04420` | `#d75928` | `#e36b3f` | `#d56a44` | `#c19384` |
| `moderate` | `#13100c` | `#1e180f` | `#2e200c` | `#3a2502` | `#452c00` | `#513400` | `#644100` | `#845700` | `#db9400` | `#eaa325` | `#ba7d00` | `#b39a78` |
| `minor` | `#0d1113` | `#111b1f` | `#102630` | `#082e3e` | `#02374b` | `#004158` | `#00506c` | `#00688a` | `#009cce` | `#1cabdf` | `#1a94c2` | `#7ea3b6` |
| `success` | `#0e120e` | `#131b14` | `#172817` | `#163117` | `#173b1a` | `#19451d` | `#1f5624` | `#236e2b` | `#31983d` | `#47a54f` | `#4a9b4f` | `#87a687` |

Hex is the sRGB fallback. OKLCH is the authored form; a build emits both.

### On-solid

The label colour for each solid fill, identical in both themes:

| Scale | On-solid | Ratio |
|---|---|---|
| `primary` | white | 4.54:1 |
| `critical` | white | 5.34:1 |
| `neutral` | black | 5.77:1 |
| `serious` | black | 5.37:1 |
| `moderate` | black | 8.27:1 |
| `minor` | black | 6.68:1 |
| `success` | black | 5.68:1 |

Chosen per scale. A single global on-solid is how white-on-amber ships.

## 1.4 Semantic tokens

What components actually consume. Each resolves to a different primitive per
theme; the alias itself never changes.

| Token | Light | Dark |
|---|---|---|
| `--ts-bg` | `neutral-1` | `neutral-1` |
| `--ts-bg-subtle` | `neutral-2` | `neutral-2` |
| `--ts-surface` | `neutral-3` | `neutral-3` |
| `--ts-surface-hover` | `neutral-4` | `neutral-4` |
| `--ts-surface-active` | `neutral-5` | `neutral-5` |
| `--ts-border-subtle` | `neutral-6` | `neutral-6` |
| `--ts-border` | `neutral-7` | `neutral-7` |
| `--ts-border-interactive` | `neutral-8` | `neutral-8` |
| `--ts-solid` | `primary-9` | `primary-9` |
| `--ts-solid-hover` | `primary-10` | `primary-10` |
| `--ts-on-solid` | white | white |
| `--ts-text` | `neutral-12` | `neutral-12` |
| `--ts-text-subtle` | `neutral-11` | `neutral-11` |
| `--ts-focus-ring` | `primary-9` | `primary-9` |
| `--ts-scrim` | `rgb(0 0 0 / 0.5)` | `rgb(0 0 0 / 0.6)` |

Per-scale step aliases exist for the cases the role layer does not cover:
`--ts-critical-solid`, `--ts-critical-soft` (step 3), `--ts-critical-text`
(step 11), and so on for every scale.

**Aliases are emitted into every theme scope, not only `:root`.** A custom
property whose value contains `var()` resolves on the element carrying the
declaration, and the resolved value is what inherits. An alias declared only at
the root keeps the root theme's colour inside a nested opposite-theme section.
Re-declaring every alias per scope is what makes `[data-ts-theme]` work on any
element rather than only the document root.

## 1.5 Typography

**Families.** Three stacks. The mono stack is load-bearing rather than
decorative: tabstop renders CSS selectors and DOM snippets in every finding, and
proportional text makes a selector harder to read and harder to copy correctly.

```
--ts-font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
                "Helvetica Neue", Arial, sans-serif
--ts-font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
                "Liberation Mono", monospace
```

Inter is optional. An application that wants it redefines `--ts-font-sans` to
`"Inter", <the default stack>` and self-hosts the files. There is no separate
brand-font token, because a second family token invites two typefaces on one
page. This system does not bundle or load web fonts — a design system that ships
a font ships a network request its consumers did not choose.

**Scale.** Sizes in `rem` so they respond to user font-size preferences.
Tracking tightens as size grows, which is what keeps display text from looking
loose at the same tracking that suits body text.

| Role | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| `display` | 3.000rem / 48px | 700 | 1.05 | −0.03em |
| `h1` | 2.250rem / 36px | 700 | 1.15 | −0.02em |
| `h2` | 1.875rem / 30px | 700 | 1.20 | −0.015em |
| `h3` | 1.500rem / 24px | 600 | 1.25 | −0.01em |
| `h4` | 1.250rem / 20px | 600 | 1.35 | −0.005em |
| `h5` | 1.125rem / 18px | 600 | 1.40 | 0 |
| `h6` | 1.000rem / 16px | 600 | 1.45 | 0 |
| `body-lg` | 1.125rem / 18px | 400 | 1.60 | 0 |
| `body` | 1.000rem / 16px | 400 | 1.60 | 0 |
| `body-sm` | 0.875rem / 14px | 400 | 1.55 | +0.005em |
| `caption` | 0.750rem / 12px | 500 | 1.45 | +0.01em |
| `code` | 0.875rem / 14px | 400 | 1.50 | 0 |

`code` uses `--ts-font-mono`; every other role uses `--ts-font-sans`.

`caption` at 12px is the floor. Nothing smaller ships, and `caption` is never
used for text a user must read to complete a task — severity labels, error
messages and finding descriptions all use `body-sm` or larger.

## 1.6 Spacing and layout

4px base grid, emitted in `rem`. The token name is the multiplier.

| Token | rem | px |
|---|---|---|
| `--ts-space-0` | 0 | 0 |
| `--ts-space-1` | 0.25rem | 4 |
| `--ts-space-2` | 0.5rem | 8 |
| `--ts-space-3` | 0.75rem | 12 |
| `--ts-space-4` | 1rem | 16 |
| `--ts-space-5` | 1.25rem | 20 |
| `--ts-space-6` | 1.5rem | 24 |
| `--ts-space-8` | 2rem | 32 |
| `--ts-space-10` | 2.5rem | 40 |
| `--ts-space-12` | 3rem | 48 |
| `--ts-space-16` | 4rem | 64 |
| `--ts-space-20` | 5rem | 80 |
| `--ts-space-24` | 6rem | 96 |

The scale is deliberately gappy above 6. Offering every multiple invites
decisions that carry no meaning; the gaps are the opinion.

**Radii.**

| Token | Value |
|---|---|
| `--ts-radius-none` | 0 |
| `--ts-radius-sm` | 0.25rem / 4px |
| `--ts-radius-md` | 0.5rem / 8px |
| `--ts-radius-lg` | 0.75rem / 12px |
| `--ts-radius-xl` | 1rem / 16px |
| `--ts-radius-full` | 9999px |

**Nested radius.** Where an element is inset from its container by a small,
equal gap on all sides — a concentric pairing — the inner radius is
`max(0, outer − gap)`, or the two curves visibly disagree. Documented pairing:
outer `lg` (12px) with a `--ts-space-2` (8px) gap takes inner `sm` (4px).

The rule applies only to concentric pairings. Once the gap exceeds the outer
radius the formula yields zero and stops being useful, so an element inset by
generous padding simply picks its own radius from the scale.

**Breakpoints** (`rem`, min-width): `sm` 30, `md` 48, `lg` 64, `xl` 80.
**Containers** (max-width, `rem`): `prose` 42, `content` 64, `wide` 80.

## 1.7 Elevation

Five levels. Light and dark use **different mechanisms**, because a shadow tuned
for a white page is nearly invisible on a dark one — dimming the same shadow
produces depth that reads in one theme and vanishes in the other.

- **Light:** layered shadows at increasing blur and spread. Two layers per
  level — a tight, darker contact shadow and a wider, softer ambient one.
- **Dark:** a progressively lighter surface step plus a `border-subtle`
  hairline, with a much softer shadow present only as a secondary cue.

| Token | Role | Light | Dark |
|---|---|---|---|
| `--ts-elevation-0` | page content | none | `neutral-1`, no border |
| `--ts-elevation-1` | cards, table rows | `0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.10)` | `neutral-2` + `neutral-6` hairline |
| `--ts-elevation-2` | dropdowns, popovers | `0 2px 4px rgb(0 0 0 / 0.06), 0 4px 8px rgb(0 0 0 / 0.10)` | `neutral-3` + `neutral-6` hairline, `0 2px 6px rgb(0 0 0 / 0.35)` |
| `--ts-elevation-3` | nav bars, sticky headers | `0 1px 2px rgb(0 0 0 / 0.08), 0 4px 12px rgb(0 0 0 / 0.08)` | `neutral-2` + `neutral-7` hairline |
| `--ts-elevation-4` | dialogs | `0 8px 16px rgb(0 0 0 / 0.10), 0 16px 32px rgb(0 0 0 / 0.14)` | `neutral-4` + `neutral-7` hairline, `0 8px 24px rgb(0 0 0 / 0.45)` |

One further shadow token, used by pressed solid controls:

| Token | Value |
|---|---|
| `--ts-shadow-pressed` | `inset 0 2px 4px rgb(0 0 0 / 0.18)` |

This section is the one place raw colour literals are permitted, because a
shadow is where they are defined. Rule 2 governs components, which reference
the token.

Elevation never carries meaning on its own. A modal is not "important because it
is elevated"; it is important because of what it says.

## 1.8 Motion

| Token | Value | Use |
|---|---|---|
| `--ts-duration-fast` | 120ms | state changes: hover, focus |
| `--ts-duration-base` | 200ms | disclosure, dropdown |
| `--ts-duration-slow` | 320ms | modal, drawer |
| `--ts-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | most transitions |
| `--ts-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | dismissals |

**Reduced motion is a hard contract.** Under `prefers-reduced-motion: reduce`,
all durations collapse to `1ms` and transforms are removed; opacity changes may
remain. No component in this system uses continuous or looping motion — a
spinner that cannot be stopped is excluded until a pausability escape is
designed.

---

# 2. Component specifications

## 2.0 The universal contract

These apply to every interactive component and are not restated per component.

**States.** `default → hover → active → focus-visible → disabled`. Each state is
a defined token. A state is never produced by applying `opacity` or a filter to
the base — that changes the text colour along with the background and silently
breaks contrast.

**Focus.** `2px` solid `--ts-focus-ring` at `2px` offset, applied via
`:focus-visible` only, so pointer users do not see a ring on click but keyboard
users always do. The ring is never removed and never replaced by a `box-shadow`:
outline with offset survives forced-colors mode, and `box-shadow` does not.
Focus ring contrast is verified at ≥3:1 against both `--ts-bg` and
`--ts-surface`, because a ring that only clears against the page fails on a card.

**Disabled.** `--ts-surface` fill, `neutral-8` text. This deliberately fails
4.5:1, and that is correct — WCAG 1.4.3 exempts disabled controls, and a
disabled control that meets text contrast does not look disabled. `disabled`
and `aria-disabled` are never used to make something look inert while it still
responds.

**Target size.** ≥24×24 CSS px, per WCAG 2.2 AA (2.5.8). 44×44 on primary
flows and on anything in a table row.

**Motion.** All state transitions use `--ts-duration-fast` and
`--ts-ease-standard` unless stated otherwise.

## 2.1 Button

**Purpose.** Triggers an action. Never navigates — a control that changes the
URL is a link, and it must be an `<a>` so it keeps middle-click, right-click and
"open in new tab".

**Variants.**

| Variant | Rest | Hover | Active | Use |
|---|---|---|---|---|
| `primary` | `--ts-solid` fill, `--ts-on-solid` text | `--ts-solid-hover` | `--ts-solid-hover` + inset | one per view; the main action |
| `secondary` | `--ts-surface` fill, `--ts-text`, `--ts-border-interactive` | `--ts-surface-hover` | `--ts-surface-active` | supporting actions |
| `ghost` | transparent, `--ts-text` | `--ts-surface-hover` | `--ts-surface-active` | toolbars, low-emphasis rows |
| `destructive` | `critical-9` fill, white text | `critical-10` | `critical-10` + inset | irreversible actions only |

The solid variants share one fill across hover and active, and distinguish
active with `--ts-shadow-pressed` rather than a further colour step. A third step would need its own verified on-solid pairing,
and the ramp has no room for one below step 10 that still carries white text.
The neutral variants have that room, so they use distinct fills.

**Sizes.** `sm` 32px tall / `--ts-space-3` inline padding / `body-sm`;
`md` 40px / `--ts-space-4` / `body`; `lg` 48px / `--ts-space-5` / `body-lg`.
All use `--ts-radius-md`.

**Loading.** Retains its rest width so the layout does not shift, sets
`aria-busy="true"`, and keeps its accessible name. The label is not replaced by
a spinner alone.

**A11y.**
- A real `<button>` with a real `type`. Never a `<div>` with a click handler.
- Icon-only buttons **require** `aria-label`. This is required in the type
  signature, not documented as a convention.
- Label text meets 4.5:1 via the verified on-solid pairing.
- `destructive` is never distinguished from `primary` by colour alone; its label
  states the consequence ("Delete site", not "Confirm").

## 2.2 Input

**Purpose.** Single-line text entry. In tabstop the highest-traffic instance is
the URL field on the scan form.

**Variants.** `default`, `invalid`, `readonly`. Sizes match Button.

**States.** Rest: `--ts-bg` fill, `--ts-border-interactive` (`neutral-8`)
border, `--ts-radius-md`. Hover: border moves to `neutral-9` — a step that gains
contrast against the page in both themes, since step 9 is darker than step 8 in
light mode and lighter in dark. Focus: the universal ring, and the border
switches to `--ts-focus-ring`. Invalid: `critical-8` border plus an icon in the
field. Disabled: per the universal contract.

**A11y.**
- **A visible `<label>` is required.** Placeholder-as-label is prohibited: the
  placeholder disappears on input, fails contrast at typical placeholder greys,
  and is not reliably announced.
- Placeholder, when present, shows format only — `https://example.com` — never
  the field's name.
- Errors: `aria-invalid="true"` plus `aria-describedby` pointing at the message.
  The message carries an icon so the error is not signalled by red alone, and it
  states what to do, not merely what is wrong.
- Error text is `body-sm`, `critical-11`, verified at 4.5:1 on both `--ts-bg`
  and `--ts-surface`.
- Autocomplete and `inputmode` set appropriately; the URL field uses
  `type="url"` and `inputmode="url"`.

## 2.3 Card

**Purpose.** Groups related content into one surface. In tabstop: a monitored
site, a score summary, a finding group.

**Variants.** `flat` (`--ts-surface`, no shadow, `--ts-border-subtle`);
`raised` (elevation 1); `interactive` (elevation 1, gains elevation 2 and
`--ts-surface-hover` on hover).

**Padding** `--ts-space-6`; radius `--ts-radius-lg`. That padding is not a
concentric gap, so nested elements pick their own radius — `--ts-radius-md` for
a nested surface, `--ts-radius-sm` for a code block.

**A11y.**
- An `interactive` card contains **one** focusable element — typically the
  heading wrapped in a link — and the whole card is a click target for pointer
  users via that element's expanded hit area. A click handler on the card
  `<div>` is prohibited: it is unreachable by keyboard and invisible to
  assistive technology.
- Card headings participate in the page's heading order. A card does not reset
  heading levels to `h3` because it looks right.
- Nested interactive elements inside an `interactive` card are avoided; where
  unavoidable, the card is not itself interactive.

## 2.4 Badge

**Purpose.** A short status label. Tabstop's densest use is severity on a
findings list.

**Tones.** `neutral`, `primary`, `success`, and the four severity levels
`critical`, `serious`, `moderate`, `minor`.

**Appearance.** Soft by default: `<tone>-3` fill, `<tone>-11` text,
`<tone>-7` border, `--ts-radius-full`, `--ts-space-1`/`--ts-space-2` padding,
`body-sm`. The `<tone>-11` on `<tone>-3` pairing is verified at ≥4.5:1 in both
themes — that pairing is why step 11 is solved against step 3 rather than
against the page.

A `solid` badge variant exists for the single-value case (an overall score
grade) and uses `<tone>-9` with its verified on-solid colour.

**A11y.**
- **Text is required.** A badge with no text content is invalid; the type makes
  `children` mandatory. This is the enforcement point for
  severity-never-by-colour-alone.
- Severity badges additionally carry a distinct **icon per level**, so the four
  levels are distinguishable in greyscale and under any colour vision
  deficiency.
- A badge is not a control. If it filters or navigates, it is a Button or a
  link that happens to look like a badge.
- Where a badge conveys a count that changes, the change is announced through a
  live region, not by the badge alone.

## 2.5 Modal

**Purpose.** Interrupts to demand a decision. Used sparingly — in tabstop, for
destructive confirmations and the add-site flow.

**Sizes.** `sm` 24rem, `md` 32rem, `lg` 48rem; each `max-width: calc(100vw - var(--ts-space-8))`.
Elevation 4, radius `--ts-radius-lg`, padding `--ts-space-6`, scrim
`--ts-scrim`.

**A11y.** This component's requirements are non-negotiable because a broken
modal traps a keyboard user with no escape:
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title.
- Focus moves into the dialog on open — to the first interactive element, or to
  the dialog container when there is none.
- **Focus is trapped** while open, and **returns to the invoking element** on
  close. Losing the return point strands the user at the top of the document.
- `Esc` closes, unless closing would discard unsaved input, in which case `Esc`
  raises the confirmation rather than being disabled silently.
- Background content is `inert` and page scroll is locked.
- The close control has an accessible name ("Close dialog"), not just an ×.
- Destructive confirmations name the object and the consequence, and the
  confirming button is `destructive`.

## 2.6 Navigation bar

**Purpose.** Primary wayfinding. Two arrangements: `top` for the marketing and
auth surfaces, `sidebar` for the authenticated dashboard.

**Structure.** Elevation 3. `top`: 64px tall, `--ts-space-6` inline padding,
brand at the start, primary links centre or start-aligned, account menu at the
end. `sidebar`: 16rem wide, `--ts-space-4` padding, collapsing to an overlay
drawer below the `lg` breakpoint.

**States per item.** Rest `--ts-text-subtle`; hover `--ts-text` on
`--ts-surface-hover`; current `--ts-text` on `primary-3` with a 2px
`--ts-solid` indicator (left edge in `sidebar`, bottom edge in `top`).

**A11y.**
- `<nav>` with an `aria-label` — and distinct labels when both arrangements are
  present on one page, since two unlabelled `nav` landmarks are indistinguishable.
- The current item carries `aria-current="page"`. The colour and indicator are
  reinforcement, never the sole signal.
- **A skip-to-content link is the first focusable element in the document.** It
  is visually hidden until focused, then fully visible. For a product that
  audits this exact pattern, shipping without it would be indefensible.
- The mobile disclosure button carries `aria-expanded` and `aria-controls`; the
  drawer traps focus while open and restores it on close, as with Modal.
- Navigation order in the DOM matches visual order.
- The active item is distinguishable in forced-colors mode, so the indicator is
  a real border rather than a background image.

---

# 3. Implementation rules

These are the rules that keep the system a system. They are stated as
prohibitions because that is how they are checkable.

1. **Components consume semantic tokens.** A component referencing a primitive
   (`--ts-primary-9`) instead of a semantic token (`--ts-solid`) is a defect,
   because it is the thing that makes a second theme expensive.

2. **No raw hex, `rgb()`, or `hsl()` in any component.** Colour enters a
   component only through a token. A literal colour is invisible to theming and
   invisible to the contrast contracts.

3. **No raw pixel values for spacing, sizing, or radius.** Use `--ts-space-*`
   and `--ts-radius-*`. The two exceptions, both permitted and both requiring no
   justification because they cannot be expressed as tokens: hairline borders
   (`1px`, `2px`) and `9999px` for pill radius.

4. **Type is set through a role, not through properties.** A component applies
   `body-sm`; it does not set `font-size` and `line-height` independently. Font
   sizes are `rem`, never `px`, so user font-size preferences work.

5. **Never hand-edit a primitive.** Primitives are generated output. Change the
   curve, the envelope, or the scale's hue and regenerate. A value that is
   neither declared nor computed does not ship.

6. **The contrast contracts run in CI and fail the build.** All ninety pairs are
   checked on every change to the palette configuration. A palette change that
   breaks a contract does not merge. This is the difference between having
   contrast and claiming it.

7. **Component-tier tokens require written justification.** `--ts-button-bg-rest`
   is permitted, but each one is a small commitment to maintain, and a component
   tier that grows unchecked recreates the problem the semantic tier solved.

8. **Colour is never the sole carrier of meaning.** Every status, severity, and
   error state pairs colour with text and an icon. In this product specifically,
   a violation here is a violation of the thing being sold.

## What is deliberately not here

- **Wide-gamut (P3) output.** sRGB only. The generation already gamut-maps into
  sRGB; emitting P3 as well is separable work.
- **Forced-colors mode beyond the per-component notes.** The components specify
  what must survive; a systematic `forced-colors` pass is its own piece of work.
- **Chart tokens.** Tabstop plots scores over time, and a categorical and
  sequential palette validated for colour vision deficiency is a genuine
  requirement — but a separable one, with its own contracts.
- **Toast and Skeleton.** Both want continuous motion, which the reduced-motion
  contract forbids until a pausability escape is designed.

Each is real work that tabstop will need. Each gets its own design.
