# Lattice — typography design

**Date:** 2026-07-30
**Status:** approved; primitives completed in #26, semantic roles tracked in #27
**Scope:** the typography scale and its tokens. Colour is specified separately; spacing and sizing are tracked separately again.

Throughout, sizes are given in `rem` — that is the token — with a px equivalent **at the default root** shown for readability. Those px figures are not the values: at a user default of 20px the whole scale is 25% larger, which is the point of the unit.

## Decisions

| Decision | Choice |
|---|---|
| Families | System sans remains the default; one monospace stack and one optional Inter stack are also available. Font delivery is out of scope in v1. |
| Scale | Ratio-based, snapped to `0.125rem`. Nine sizes, `0.625rem`–`2.25rem`. Ratio tightens near body size and widens at display. |
| Sizing unit | `rem` everywhere — declarations *and* media queries. Never `px`, never viewport units alone. |
| Fluid vs stepped | **Stepped**, with the three display sizes stepping down once at narrow viewports. |
| Line height | A named set, unitless, chosen by role rather than fixed per size. **≥ 1.5** for blocks of text. |
| Letter spacing | One `normal` primitive at `0rem`; every v1 role references it. |
| Weights | 400, 600, 700. 500 is excluded on purpose. |
| Roles | Eleven roles: seven text/UI roles and headings 1–4. `micro` is retained with a restricted-use contract. |
| Tokens | The same three tiers as colour: primitive → semantic role → component. |

Every number below is computed or measured.

## Why the system stack remains the default

A design system that exists to make accessible products has a hard time justifying a web font in v1.

- A web font introduces a loading state, and both of its outcomes are accessibility problems: invisible text until the font arrives, or a reflow when it does. Neither happens with a stack that is already installed.
- It is page weight on the critical path, and the fallback path has to be designed anyway.
- The system stack honours platform-level font substitution, which is where a reader who has configured a more readable face has configured it.

The stack is not a brand asset, and that is the cost. Products that already load Inter can opt into the Inter primitive without changing Lattice's default or making the token package responsible for delivery.

A monospace face is required, not optional. Any product rendering code, identifiers, selectors, file paths or columns of figures needs glyph-width stability. For figures inside a proportional face, `font-variant-numeric: tabular-nums` is usually the better answer than switching family.

```css
--lat-font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto,
                 'Helvetica Neue', Arial, sans-serif;
--lat-font-inter: InterVariable, 'Inter Variable', Inter, ui-sans-serif,
                  system-ui, -apple-system, 'Segoe UI', Roboto,
                  'Helvetica Neue', Arial, sans-serif;
--lat-font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
                 'Liberation Mono', monospace;
```

### Optional Inter, without font delivery

`--lat-font-inter` is an opt-in family primitive. It prefers the current variable web-family name `InterVariable`, then the local/current installed name `'Inter Variable'`, then the static family `Inter`, before falling through to the complete system sans stack. The names follow Inter's [official web CSS](https://rsms.me/inter/inter.css); Inter's [official site](https://rsms.me/inter/) documents its variable and static distributions.

Lattice does not bundle font files, emit `@font-face`, request a CDN, or add a font dependency. The consuming application owns loading Inter and choosing its subsets and caching policy. If it does not load Inter, the token behaves as the system stack with no network side effect. Semantic roles remain on `--lat-font-sans` unless a product explicitly opts into `--lat-font-inter`.

## The scale

| Name | rem | px at default root | Ratio to previous |
|---|---|---|---|
| `2xs` | 0.625 | 10 | — |
| `xs` | 0.75 | 12 | 1.200 |
| `sm` | 0.875 | 14 | 1.167 |
| `base` | 1 | 16 | 1.143 |
| `lg` | 1.125 | 18 | 1.125 |
| `xl` | 1.25 | 20 | 1.111 |
| `2xl` | 1.5 | 24 | 1.200 |
| `3xl` | 1.875 | 30 | 1.250 |
| `4xl` | 2.25 | 36 | 1.200 |

Every size is a multiple of `0.125rem`, and an even number of pixels when the root is at its default. Ratios sit in a band of **1.111–1.250**.

### Why the ratio is not constant

A type scale is multiplicative, not additive: 12→14px is an obvious jump and 34→36px is invisible, so equal steps do not produce equal perceived differences. That rules out a linear scale.

A single constant ratio is also wrong, and the reason is where the distinctions have to live. Around body size a product needs several closely-spaced sizes — caption, secondary, body, lead — that stay distinguishable two pixels apart. At display sizes the opposite holds: a heading must read as clearly larger than the one below it, which takes a wider step. So the ratio is **tightest at `xl` (1.111) and widest at `3xl` (1.250)**.

**A linear `0.25rem` scale gets this backwards.** Stepping 12, 16, 20, 24, 28 gives ratios that *fall* from 1.333 to 1.143: a jarring 33% jump between the two smallest sizes, where fine control matters most, and near-invisible steps at the top, where contrast matters most. Uniform `0.25rem` steps are a **spacing** convention — spacing composes additively, so a uniform grid is right there and wrong here.

This is also why the display end is not denser. Carbon runs 24, 28, 32, 36, whose ratios fall from 1.167 to 1.125; ours runs 24, 30, 36 and rises to 1.250 where separation is doing the most work.

### Why `0.125rem` snapping

A rejected alternative, recorded because the reasoning is not obvious: snapping to `0.0625rem` instead would let a single constant ratio survive the rounding. It was rejected because it produces token values like `0.8125rem` and `2.0625rem` — hard to read, hard to recall, easy to mistype — and because odd pixel sizes multiplied by a 1.5 line height always land on a half pixel.

The scale that results converges closely with widely shipped ones — Tailwind's default and Carbon's first six sizes are both 12, 14, 16, 18, 20, 24. That is a feature rather than a coincidence to hide: these constraints are not unusual, so arriving somewhere unfamiliar would have meant either a different constraint or a mistake. A developer reading `--lat-font-size-lg: 1.125rem` should not have to look it up.

### The smallest size, and the rule attached to it

`2xs` exists, and it is restricted.

An earlier draft stopped at `xs` on the reasoning that a scale offering 10px will have 10px used. That argument is wrong, and inverted: **omitting the size does not prevent small text, it prevents small text from being tokenised.** A team that needs a 10px chart axis label writes `font-size: 10px`, which is worse in every respect — it is `px`, so it ignores the user's font-size setting outright, it is invisible to any audit of the token layer, and it cannot be changed centrally. Measured: a `2xs` token renders 12.5px for a user at a 20px root; a hardcoded `10px` renders 10px forever.

It is also the scale-correct step. 10→12 is a ratio of 1.200, inside the band; 11→12 is 1.091, outside it, and gives a fractional line box.

**Usage rule — `2xs` is for non-essential, non-prose text.** Chart axis labels, dense tabular metadata, keyboard hints. Never for content a user must read to complete a task, never in the main reading column, and never for the only copy of a piece of information. This is a rule in the same sense as *colour never carries severity alone*: enforced socially and in review, because the alternative is teams routing around the system.

`xs` remains the floor for anything a reader is expected to read.

## Line height

A named set, decoupled from size:

| Name | Value |
|---|---|
| `tight` | 1.25 |
| `snug` | 1.375 |
| `normal` | 1.5 |
| `relaxed` | 1.625 |
| `loose` | 1.75 |

Line height is chosen by the **role**, not fixed to the size. Coupling one line height per size cannot express a table row and a paragraph at the same size, which is a case every mature system carries — Carbon ships `body01` and `bodyCompact01` at the same 14px with different leading. It also violates our own tier separation, established in the colour system: primitives are values, and roles are where meaning gets bundled.

**Unitless, always.** This is not a style preference — a length inherits as a length:

| Declaration on a 16px parent | Inherited by a 32px child | Effective ratio |
|---|---|---|
| `line-height: 1.5` | 48px | 1.5 |
| `line-height: 24px` | **24px** | **0.75** |

Measured in a browser. The second case puts lines on a collision course wherever a component nests larger text inside smaller, and it silently breaches the 1.5 floor while the declaration still reads `24px`.

`normal` (1.5) is the floor for **blocks of text**, which is what WCAG 2.2 SC 1.4.12 governs. Single-line UI labels and display headings may use `snug` or `tight`; a 36px heading at 1.5 reads as a gap rather than a line.

One limit worth stating: **1.5 is a Latin floor.** CJK text needs materially more leading — Spectrum ships 1.7 against 1.5 for exactly this — which is why `loose` exists even though no Latin role uses it today.

## Weights

`400` regular, `600` semibold, `700` bold.

**500 is excluded deliberately.** Across a system stack its availability is inconsistent, so it resolves to a synthesised weight on some platforms and a real one on others — the same token then renders differently per operating system, which is what a design system exists to prevent. Three weights that are real everywhere beat four where one is a lottery.

## Letter spacing

One primitive: `normal`, with a value of `0rem`.

The value is deliberately named rather than inlined into every role. DTCG requires `letterSpacing` in a `typography` composite, and issue #27 requires every composite property to reference a primitive. The primitive therefore ships as `--lat-letter-spacing-normal` in CSS and `global.letter-spacing.normal` in JSON.

`0rem` rather than unitless `0` keeps the CSS and DTCG representations identical: DTCG models letter spacing as a `dimension`, whose supported units are `rem` and `px`. Non-zero tracking remains deferred because the system family is not a single controlled face.

## Stepped, not fluid

Fluid sizing is excluded, but not for the reason first supposed. The usual formulation is unsafe, and a safe one exists — so safety is not the argument.

Measured at a **1280px viewport**, comparing a user default of 20px against a browser default of 16. The viewport matters and is stated because the `vw` terms depend on it — at 1280px, `0.5vw` is 6.4px, which is where 19.2 and 22.4 below come from.

| Declaration | root 16 | root 20 | Responds to the user |
|---|---|---|---|
| `font-size: 14px` | 14px | **14px** | **no** |
| `font-size: 0.875rem` | 14px | 17.5px | yes |
| `clamp(14px, 2vw, 22px)` | 22px | **22px** | **no** |
| `clamp(0.875rem, 0.8rem + 0.5vw, 1.375rem)` | 19.2px | 22.4px | yes |

A ceiling expressed in `px` then caps growth exactly where an enlarging reader needs it. Measured at a **1920px viewport**, where `0.5vw` is 9.6px:

| Preferred value `0.8rem + 0.5vw`, with ceiling | root 16 | root 24 |
|---|---|---|
| `…, 22px)` | 22px | **22px** — capped |
| `…, 1.375rem)` | 22px | 28.8px |

So a `clamp()` whose every term is `rem`-based is safe. **The real blocker is the token format**: DTCG's `dimension` type accepts a number and a unit of `px` or `rem`, and has no representation for a `clamp()`. A fluid scale would exist in the stylesheet and be inexpressible in `tokens.json`, breaking the artefact parity the colour system establishes.

**If fluid is ever introduced anyway, the rule is absolute:** every term of the `clamp()` — minimum, preferred and maximum — must be `rem`-based, and the preferred value must contain a `rem` term rather than viewport units alone. A `clamp()` built from `px` and `vw` is a WCAG 1.4.4 failure that looks like a feature.

## Display sizes step down on narrow viewports

A stepped scale with no viewport response puts a 36px heading on a 320px screen, which is roughly eight characters to the line. The three display sizes therefore step down one rung — and only those, because body text at `base` is comfortable at any width.

| Role | Wide | Narrow |
|---|---|---|
| `heading-1` | `4xl` | `3xl` |
| `heading-2` | `3xl` | `2xl` |
| `heading-3` | `2xl` | `xl` |
| everything else | — | unchanged |

No new sizes are introduced: the step-down moves a role along the existing scale, so the scale contract still describes every value that ships.

**The breakpoint is `40rem`, not `640px`,** and that is load-bearing. A media query in `rem` resolves against the browser's default font size, so it responds to the user's preference; one in `px` does not. Measured at a 700px viewport with the user's default raised to 20px: `(width < 40rem)` matched and `(width < 640px)` did not. A reader with larger text reaches the narrow layout sooner, which is the correct behaviour and the same argument that puts `rem` in every declaration.

## Architecture

Three tiers, matching the colour system.

**Tier 1 — primitive, generated.** `--lat-font-size-*`, `--lat-line-height-*`, `--lat-font-weight-*`, `--lat-letter-spacing-normal`, `--lat-font-sans`, `--lat-font-inter`, `--lat-font-mono`. Emitted by the build. Never hand-edited.

**Tier 2 — semantic role, generated from a hand-authored matrix.** CSS has no token value that can hold a structured typography object, so it exposes five mechanically related properties per role rather than inventing a shorthand:

```css
--lat-text-body-font-family: var(--lat-font-sans);
--lat-text-body-font-size: var(--lat-font-size-base);
--lat-text-body-font-weight: var(--lat-font-weight-regular);
--lat-text-body-letter-spacing: var(--lat-letter-spacing-normal);
--lat-text-body-line-height: var(--lat-line-height-normal);
```

In `tokens.json`, the same role is one DTCG `typography` composite under `global.text.*`. All five sub-properties reference the corresponding primitive:

```json
{
  "$type": "typography",
  "$value": {
    "fontFamily": "{global.font.sans}",
    "fontSize": "{global.font-size.base}",
    "fontWeight": "{global.font-weight.regular}",
    "letterSpacing": "{global.letter-spacing.normal}",
    "lineHeight": "{global.line-height.normal}"
  }
}
```

Two constraints come from that format and are worth knowing before the tokens are designed rather than after:

- **All five sub-properties are required**: `fontFamily`, `fontSize`, `fontWeight`, `letterSpacing`, `lineHeight`. There is no partial typography token, which is why letter spacing is decided rather than deferred — a role cannot omit it.
- **`dimension` accepts only `px` and `rem`.** The rem-everywhere decision is expressible in the JSON artefact; `em`, `ch` and `%` are not. Any future need for `ch`-based measure lives in CSS, not in the token file.

**Tier 3 — component tokens.** Permitted with a written justification in review, as in colour.

Aliases must be emitted **into every theme scope that redeclares a primitive they reference**, for the reason established in the colour system: a custom property holding a `var()` reference resolves on the element that declares it, so a single root declaration freezes. Typography has no light/dark split today, so this costs nothing now and is a trap the moment a density or reading mode is added.

The implementation preserves the tier boundary in its modules. `config/typography-roles.ts` owns the matrix and narrow size map; every key is typed against `config/typography.ts`. `generate/typography-roles.ts` turns that single source into CSS aliases and DTCG composites. `generate/emit.ts` only composes those results into the two artefacts.

### Role matrix

Every role uses `letter-spacing.normal`. System sans remains the default; the optional Inter primitive is never selected implicitly.

| Role | Family | Size | Weight | Line height | Narrow size |
|---|---|---|---|---|---|
| `body` | `sans` | `base` | `regular` | `normal` | — |
| `body-strong` | `sans` | `base` | `semibold` | `normal` | — |
| `lead` | `sans` | `lg` | `regular` | `relaxed` | — |
| `ui` | `sans` | `sm` | `semibold` | `snug` | — |
| `caption` | `sans` | `xs` | `regular` | `normal` | — |
| `micro` | `sans` | `2xs` | `regular` | `normal` | — |
| `code` | `mono` | `sm` | `regular` | `normal` | — |
| `heading-1` | `sans` | `4xl` | `bold` | `tight` | `3xl` |
| `heading-2` | `sans` | `3xl` | `bold` | `tight` | `2xl` |
| `heading-3` | `sans` | `2xl` | `semibold` | `snug` | `xl` |
| `heading-4` | `sans` | `xl` | `semibold` | `snug` | — |

`body`, `body-strong`, and `lead` are prose roles, so their size is at least `base` and their line height at least `normal`. `caption` may wrap and therefore also keeps `normal` leading. `ui` and the heading roles may use tighter leading because they represent single-line controls or display text.

`micro` deliberately survives as the only semantic route to `2xs`, with the primitive's restriction attached: non-essential, non-prose labels only; never task-critical content, main-column prose, or the sole copy of information.

There are four heading roles. A fifth remains excluded until a real hierarchy requires it; adding an unused public role would be permanent API without a present consumer.

### Responsive output and JSON boundary

Only CSS carries the conditional behavior:

```css
@media (width < 40rem) {
  :root {
    --lat-text-heading-1-font-size: var(--lat-font-size-3xl);
    --lat-text-heading-2-font-size: var(--lat-font-size-2xl);
    --lat-text-heading-3-font-size: var(--lat-font-size-xl);
  }
}
```

DTCG has no media-query condition, so `global.text.*` contains the default/wide composites only. The shared narrow map still makes the three aliases testable and guarantees they reference existing size primitives. Emitting invented `text-narrow` composites would describe static tokens without the condition that gives them meaning, so v1 does not do it.

## Accessibility constraints

These are gates, not guidance.

1. **Every size in `rem`**, declarations and media queries alike. A `px` size ignores the user's font-size setting outright, as measured above.
2. **Body text is at least `1rem`.** `base` is the floor for prose; `sm` and `xs` are for supporting text and never for the main reading column; `2xs` carries the further restriction above.
3. **Line height unitless, and at least `normal` (1.5) for blocks of text.**
4. **Nothing that holds text may have a fixed height.** SC 1.4.12 lets users override line, letter, word and paragraph spacing; a fixed height turns that into clipped text. Use `min-height`.
5. **Reflow at 320 CSS px** — the 400%-zoom equivalent — with no horizontal scrolling. Verified: at a 24px root and a 320px viewport, document scroll width stayed equal to the viewport.

One clarification, because the earlier draft implied otherwise: **WCAG sets no minimum font size.** No success criterion names one. The criteria that bear on size are 1.4.4 (resize to 200%) and 1.4.12 (text spacing), and a `rem`-based `2xs` satisfies both. The floors above are judgement, and are labelled as such rather than borrowed authority.

## Testing

Tests are the deliverable, as in colour.

1. **Scale contract** — every size is `rem`, is a multiple of `0.125rem`, and its ratio to the previous size falls inside the 1.111–1.250 band. The band is the assertion: it catches both a size edited to an arbitrary value and a step that has drifted far enough to read as a different scale.
2. **Floors** — no size below `2xs`; every prose role resolves to at least `1rem` and a line height of at least 1.5; `micro` is the only `2xs` role and carries its restricted classification.
3. **Unitless line heights** — asserted structurally, since a length is the failure mode.
4. **Role integrity** — the exact eleven-role matrix is pinned; every role names existing family, size, weight, letter-spacing, and line-height primitives; every composite contains all five properties.
5. **Step-down coverage** — exactly headings 1–3 step down one existing size below exactly `40rem`; heading 4 and every non-heading role remain unchanged.
6. **Emitted parity** — CSS's five role properties resolve to the same five aliases as each default DTCG composite; `tokens.json` validates against the published 2025.10 schema, including a negative test that removes a required composite property.
7. **Browser behaviour** — Playwright runs two isolated Firefox projects at a 700px viewport: the default 16px preference remains wide, while `font.size.variable.x-western` raised to 20 makes `(width < 40rem)` match and steps headings down. A 320 CSS px fixture with a 24px root renders representative content for all eleven roles and requires document scroll width to equal viewport width.
8. **Mutation checks** — tests must catch a missing role or property, an invalid primitive reference, a changed breakpoint unit, and an incorrect heading step.

Browser coverage uses `@playwright/test`; `pnpm test` runs it after Vitest. CI installs Firefox and its required OS dependencies with Playwright's browser-specific install command, rather than downloading three engines the package does not test.

## Non-goals for v1

- Font delivery, self-hosting, subsetting, and `size-adjust` fallback matching. The optional Inter primitive is only a family stack.
- Fluid sizing.
- A separate density scale. The decoupled line heights cover the common compact case without one.
- Vertical rhythm and baseline-grid alignment. `text-box-trim` is the eventual answer to uneven half-leading and is not Baseline yet; worth revisiting when it is.
- Language-specific stacks and their metrics. `loose` exists for CJK leading, but CJK families, weights and letter spacing are out of scope.

## Deferred question

- **Whether any size wants non-zero tracking.** v1 ships `0` everywhere, which the composite type obliges us to state explicitly. The instinct is that display sizes want slight negative tracking, but shipped practice points the other way: Carbon applies a small *positive* tracking to its 14px sets and zero above. Either way the right amount is face-dependent, and the face is whatever the platform supplies, so tuning against a stack we do not control would be guessing. Revisit alongside any decision to self-host.
