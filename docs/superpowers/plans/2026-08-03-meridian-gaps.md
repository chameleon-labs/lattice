# Meridian gap list

**Source:** Phase 3 of `2026-08-03-meridian-proof` — both bundle pages rebuilt
as Storybook stories (`Pages/System`, `Pages/Landing`) from
`@chameleon-labs/lattice-react`'s public API alone, per the design spec's §8
("Both bundle pages are rebuilt as page stories composed only of Lattice
components... They are the acceptance test for this work. Anything either
page needs that the library cannot express is a gap.").

This document consolidates the gap lists from Task 2 (`system-page.tsx`) and
Task 3 (`landing-page.tsx`), plus the accessibility triage run for Task 4:
`cd packages/react && npx playwright test tests/browser/a11y.spec.ts`.

## 1. Library gaps

Constructions a page needed that no component provides. Each is checked
against the admission test the system already uses (see
`packages/react/README.md`, "Every component makes a guarantee a consumer
would otherwise have to remember"): does this carry a guarantee a caller
would otherwise have to remember, or is it a one-off arrangement?

### `Stat` has no size axis

`stat.css` reads `--lat-text-numeric-*`, which resolves to 16px
(`--lat-font-size-base`) at every call site. `Stat` has no `size` prop, so
every statistic that uses it — the documentation site's overview tiles, the
landing page's trust bar and score-history summary — renders at the same
visual weight, regardless of how much prominence the surrounding layout
gives it.

The landing page's hero audit score is no longer one of these call sites:
its source is a large, colour-coded `ScoreArc` gauge, and rather than
accept the visual-weight loss of a plain `Stat`, it is built as a
page-local component (§3 below, "Deliberate omissions" → `ScoreArc`) that
reproduces the gauge's own sizing rather than reaching for this token. The
`Stat`-has-no-size-axis gap is unaffected by that choice — it is still real
for every other statistic on both pages — but the hero score is no longer
its motivating example.

**Admission test:** passes. A caller reaching for a prominent statistic has
to remember to compensate with ad hoc CSS today; a `size` axis (e.g.
`sm | md | lg`, `lg` mapping to the display role's numerals with tabular
figures) would remove that burden and is a plausible near-term addition.

### The `display` role (48px) has no component or bare-element class

Meridian's type scale names `display` alongside `h1`–`h4`, but only the
headings get bare-element rules in `base.css`. Both pages needed a 48px
headline (`SystemPage`'s hero, `LandingPage`'s hero `<h1>`) and there was no
supported way to reach it — not a component, not a class, not a bare
`<h1>` rule. Built as the one sanctioned appearance exception in
`pages.css` (`.lat-page__display`, reading `--lat-text-display-*` directly),
documented in the file's header comment as deliberate rather than a
workaround. See §3 below — this is also the class Task 4 deduplicated.

**Admission test:** passes. Every consumer that wants a display headline
would otherwise re-type the same five token references; the two pages
already needed it twice.

### No `Link` distinct from `Button`

Both pages needed real, in-page and external text links (`SystemPage`'s
sidebar nav could use real buttons, but `LandingPage`'s header/footer
anchors and inline CTAs cannot — they need `<a href>` for right-click,
open-in-new-tab, and crawlability). The library's only interactive text
element is `Button`, so both pages used `Button variant="link"
render={<a href="…" />}` — Ariakit's polymorphic pattern (already
demonstrated in `card.stories.tsx`/`button.stories.tsx`). It works: a real
anchor, `Button`'s focus and hover contract. But it is `Button`'s CSS
(body-sized underline) standing in for a distinct 10–11px mono nav/footer
link treatment the source bundle actually uses, and it means "give me a
polymorphic element" and "give me link-styled text" are conflated into one
prop that was designed for the former.

**Admission test:** passes. A caller wanting an inline text link today must
know to reach for `Button variant="link"` plus the polymorphic `render`
prop — an API two levels removed from what they are asking for — and gets
`Button`'s type scale, not a link-appropriate one. Worth a named `Link`
component if a third page recurs this pattern (flagged in Task 3's report).

### `TextField` always renders a visible label

`landing-page.tsx`'s hero and CTA URL fields are icon-adjacent with a
placeholder and no visible label, matching the source bundle exactly.
`TextField`'s API has no way to suppress the visible label, so both call
sites fell back to the bare `Input` export plus a manual `aria-label`,
correct for accessibility but meaning `TextField` itself — the component
that owns the label/description/error wiring contract — was not exercised
on either page, and a caller wanting "icon-adjacent, no visible label" has
no supported path through it.

**Admission test:** passes. The guarantee `TextField` exists to provide
(`aria-describedby` wired correctly, per its own README entry) is exactly
what a caller loses by dropping to bare `Input` — they now have to
remember to wire the accessible name themselves, which is the failure mode
`TextField` exists to prevent.

### No oversized/faint decorative numeral treatment

The source's `HowItWorks` step index is drawn at 48px, mono, 10% opacity
(`font-mono text-5xl font-bold text-primary/10`) — a decorative background
numeral, not a legible label. Nothing in Meridian's type scale expresses
"huge and nearly invisible": the `display` role is the right size but is
sans, not mono, and carries no opacity variant. Rather than inventing a
*second* appearance exception in `pages.css` (the file sanctions exactly
one — the `display` role), the landing page's step index reads as a
compact meta-style label instead, the same construction
`system-page__section-index` already uses for "00"/"01". This loses the
decorative scale of the source but keeps the numbering legible.

**Admission test:** marginal — flagged, not asserted as a clear pass. It is
purely decorative (the numbering is legible without it), so unlike the
other four entries it carries no guarantee a caller would forget to
provide; it is closer to a documented aesthetic gap than a missing
contract. Listed because Task 3's report raised it and a reviewer may
weigh it differently.

### `CodeBlock` forwarded no props (found, and fixed, in Task 2)

Not a live gap — recorded for completeness, since it shaped how the
documentation page had to be built and was later found, via the a11y sweep,
to be a real defect (§2 below). `CodeBlock`'s public props were originally
`{ code, copyLabel }` only: no `className`, no rest spread, no way to give
two instances on one page distinct accessible names. Fixed in Task 2's
follow-up (`CodeBlockProps` now extends `HTMLAttributes<HTMLDivElement>`,
plus a new `regionLabel` prop) once the sweep confirmed a keyboard-access
defect downstream of the same gap. See §2.

## 2. Known contrast failures

### 2.1 The thirteen ledger rows, accepted

The design spec's §9 measures every documented Meridian token pair with
WCAG 2.x and reports (does not gate on) the result. **Thirteen fail AA** —
corrected up from an earlier count of nine during the whole-phase component
review, once the severity ramp's own tint tokens were measured separately
from the chromatic scales they resemble. These ship **by explicit approved
decision**: Meridian's values are the identity, not a defect to fix, and
nothing here changes a colour, an alpha, or a threshold. Full ledger,
figures, and the reproduction command (`pnpm --filter
@chameleon-labs/lattice-tokens build`) are in
[`docs/superpowers/specs/2026-08-03-meridian-identity-design.md`](../specs/2026-08-03-meridian-identity-design.md#9-the-contrast-ledger).

Running `cd packages/react && npx playwright test
tests/browser/a11y.spec.ts` (130 tests) produces **32 failures — 28 against
the fourteen appearance-changed component families (Badge, Button, Card,
Dialog, Eyebrow, SegmentedControl, Stat, Table, Tabs, TextField), left red
by design spec §11 ("everything else... will fail against the new
appearance and is left failing, to be addressed as its own piece of
work"), and 4 against the two page stories** (`Pages/System`,
`Pages/Landing`, each in both themes). **Every one of the 32 failures'
underlying `color-contrast` violation instances — probed directly for
`fgColor`/`bgColor`/`contrastRatio` rather than taken from axe's selector
list alone — resolves to one of the thirteen ledger pairs.** Zero
structural violations (`landmark-one-main`, `region`,
`page-has-heading-one`, `bypass`, `html-has-lang`, `landmark-unique`,
`scrollable-region-focusable`) anywhere in the sweep, on either the
component families or the two pages.

Ten of the thirteen ledger rows appear as exact matches (fg/bg pair
measured, ratio matching the spec's own figure to within axe's rounding):

| ledger row (§9) | measured on the pages |
| --- | --- |
| dark severity minor text on its tint (3.27) | 3.27 — `Badge[data-variant="minor"]` / default-variant badges (same tokens) |
| dark `muted-foreground` on `card` (3.67) | 3.67 — `text-subtle` directly on `--lat-bg-raised` |
| light severity moderate text on its tint (2.26) | 2.25 — `Badge[data-variant="moderate"]` |
| light accent text on its 15% tint (2.84) | 2.84 — `Badge[data-variant="primary"]` |
| light `primary` as text on `background` (2.94) | 2.93 — `.landing-page__accent-text` |
| light warning text on its 10% tint (3.15) | 3.14 — `Badge[data-variant="warning"]`, severity `serious` |
| light `primary-foreground` on `primary` (3.33) | 3.33 — primary `Button`, primary `Badge`, the logo mark |
| light success text on its 10% tint (3.34) | 3.35 — `Badge[data-variant="success"]` |
| light info text on its 10% tint (3.61) | 3.61 — `Badge[data-variant="info"]` |
| light danger text on its 10% tint (4.49, "fails by 0.01") | 4.48 — `Badge[data-variant="danger"]`, severity `critical`, destructive `Button` |

The remaining three ledger rows (the light focus ring at 1.55:1, the
decorative hairline, and the dark pairs that pass) either are not
`color-contrast`-rule findings (the focus ring is SC 1.4.11 non-text
contrast, which axe-core's default rule set does not check) or do not fail
in the first place, so axe reports nothing for them — expected, not a gap
in the sweep.

### 2.2 The same accepted deficiencies, on additional host surfaces

**This is not a fourth bucket and not a new defect** — it is the
phenomenon the ledger's own text warns about: "the ledger measures token
pairs, and a composition can create a surface nobody enumerated." Five
more `color-contrast` pairs were measured on the two pages that are not a
literal ledger row, because the ledger's §9 table measures each deficient
token against exactly one documented host surface, and both pages put the
same deficient token on others:

| pair | ratio | relationship to the ledger |
| --- | --- | --- |
| dark `text-subtle` on `--lat-bg` directly | 3.83 | same deficient token as "dark `muted-foreground` on `card`" (3.67); measured on the page background instead of a card. **Named explicitly in this task's brief as the expected case.** |
| dark `text-subtle` on `--lat-bg-subtle` directly | 3.49 | same token, on `SegmentedControl` labels and `Stat` sub-lines sitting on `--lat-bg-subtle` rather than `--lat-bg-raised` |
| dark `text-subtle` on wash-over-nav-surface | 3.47 | same token; the landing page's sticky nav composites `--lat-wash` under the brand's default `Badge` over a page-authored background, a third neutral host |
| light success text on wash-over-`--lat-bg` (topbar) | 2.97 | same "light success text on its 10% tint" deficiency (3.34–3.35 elsewhere on the page), composited over `--lat-bg` in the system page's topbar instead of over a `Card`'s `--lat-bg-raised` |
| light accent-solid text directly on white `--lat-bg-raised` (a `Card`) | 3.33 | same "light `primary` as text on `background`" deficiency (2.94, measured against the page background); the landing page's `HowItWorks` step-detail lines put the same accent-as-text construction on a white card instead |

Each of these is the *same* already-accepted deficient token — never a new
pairing between two individually-fine tokens (that failure mode was found
once, in Task 2, and fixed — see below) — recurring against a neutral or
tint host the ledger's per-token-pair model does not individually walk.
Consistent with the constraint on this task, none of these was changed:
doing so would mean picking a different host surface or a different token
per composition, which is exactly the kind of one-off nudge the ledger
exists to avoid. They are recorded here because the brief asked this
triage to work from usage, not only from the row, and because a future
change to `--lat-text-subtle`, `--lat-accent-solid`, or a status colour
should account for all of its host surfaces, not just the one the ledger
happens to measure.

Component-family stories (badges rendered bare in `Badge`'s own stories,
outside any `Card`) show the same pattern again, against yet another host:
the Storybook `.lat-story` decorator's own themed background, which is
neither `--lat-bg`, `--lat-bg-raised`, nor `--lat-bg-subtle` composited the
same way a real page would. Ratios there run slightly lower than the
page-composited numbers above for the same tokens (e.g. light severity
`moderate` measures 2.01 in `Badge`'s own story versus 2.25 on the landing
page, light `danger`/`critical` measures 3.98 in `Badge`'s story versus
4.48 on a page) — not listed row-by-row here because they are the same
already-accepted tokens on a demo-chrome surface no real consumer ever
renders against, but noted so the pattern is not mistaken for something
new when the component-family suite is eventually brought current per
§11.

### 2.3 Real defects — none outstanding

Two real defects were found by this line of work, both **before** this
task, during Task 2's construction of `Pages/System`, and both are already
fixed on this branch (confirmed by the sweep above reporting zero
structural violations and zero unaccepted pairs):

1. **A 2.2:1 composition defect** — a neutral-variant `Badge`
   (`--lat-text-subtle`) was placed on `--lat-accent-tint`, a chromatic
   surface sized for solid text, by the Command Palette's active-row
   highlight in `pages.css`. Individually-fine tokens, an unmeasured
   pairing invented by the page. **Fixed** by removing the row's added
   background entirely — the row's `Badge` now renders against its own
   built-in tint over the `Card` surface, landing on the accepted
   "severity minor" pairing (§2.1) like every other default `Badge` on the
   page, and the "active" affordance moved to the `ChevronRight` icon
   instead, matching the source bundle's own mechanism.
2. **`scrollable-region-focusable`** on `CodeBlock`'s `<pre>` — reachable
   by mouse and by screen reader, unreachable by keyboard, because
   `overflow-x: auto` had no `tabIndex` and `CodeBlock` forwarded no props
   for a page to add one. **Fixed** in `src/code-block/code-block.tsx`:
   `tabIndex={0}`, `role="region"`, a new `regionLabel` prop (default
   `'Code sample'`, needed once two `CodeBlock`s on one page triggered
   `landmark-unique`), and full `HTMLAttributes` forwarding.

This task's own sweep (§2.1–§2.2) found no further instance of either
category. Both the rule that catches the first (an unmeasured
neutral-on-chromatic pairing) and the rule that catches the second
(keyboard reachability) ran clean.

## 3. Deliberate omissions

Decisions, not gaps — each earns its place by *not* passing the admission
test, or by falling outside what a design system is responsible for.

### `ScoreArc`

The landing page's hero audit card centres on a colour-coded circular
gauge. Design spec §7.3: "It is tabstop product surface, not system
surface: one consumer, one arrangement, and no guarantee a caller would
otherwise have to remember. This is the same admission test that kept
`EmptyState` out." It stays out of the component library on that basis —
but, unlike the Recharts line chart below, it is not down-rendered to a
lesser library component. Nothing in the library reproduces a colour-coded
arc gauge, so it is built as `src/pages/score-arc.tsx`: a page-local
component, imported only by `landing-page.tsx`, that keeps the source's
exact geometry (the −210°→30° sweep, the `size`-proportional radius and
stroke) while reading every colour through a token — `currentColor` set by
a `landing-page__score-arc--{good,warn,bad}` modifier class in
`pages.css`, never the source's literal hex. This is the pattern the
architecture note in §7.3 anticipates: excluded from the library, not
excluded from the page.

### The Recharts score-history line chart

`ScoreHistory`'s nine-point trend, drawn in the source with a Recharts
`<LineChart>`, is rendered instead as a `Table` of all nine `(date,
score)` points. Charting is not a design-system concern here — Lattice
ships tokens and accessible primitives, not a charting library — so no
chart component was built or is planned. Cost: the *shape* of the
regression (a sharp week-over-week cliff) is legible at a glance in a line
chart and is not in a table without reading every row; the `CardHeader`'s
`danger` `Badge` ("−20 pts since Jul 21") restores the headline number as
a single glance-able fact, partially compensating.

### The ~50 stock shadcn components

The bundle's `components/ui/` directory ships roughly fifty unmodified
shadcn defaults — Accordion, Command, Popover, Sheet, and the rest of the
library shadcn generates by default — that neither demo page's design ever
touched. Design spec §7.3: "They carry no Meridian decisions, and porting
them to Ariakit would be inventing a design system rather than applying
one." None were ported; none are planned.
