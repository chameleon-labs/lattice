# Meridian Proof Implementation Plan (Phase 3 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild both Figma bundle pages as Storybook stories composed only of Lattice components, and use what they cannot express as the gap list.

**Architecture:** Two page stories in `packages/react/src/pages/`, built from the public API and nothing else. They are the acceptance test for the whole identity: a page that cannot be built from the library is a gap in the library, not a reason to reach past it.

**Tech Stack:** React 19, Storybook 10, Playwright, axe-core.

## Prerequisite

**Phases 1 and 2 must be complete and committed.**

```bash
cd packages/react && pnpm typecheck && pnpm build
```

Expected: both succeed.

## Global Constraints

- **Import only from `../index.js`.** No page story may import a component's internal module, and no page story may define a local styled element that duplicates something a component should provide. If a page needs a construction the library lacks, add it to the gap list in Task 4 — do not inline it.
- Pages may use plain layout elements (`div`, `section`, `header`) with layout-only CSS: flex, grid, gap, max-width, padding. Any *appearance* — colour, border, radius, type, shadow — must come from a component or a `var(--lat-*)` reference.
- Icons: inline SVG in a single shared `src/pages/icons.tsx`. The bundle uses `lucide-react`; Lattice takes no icon dependency, so the handful used are hand-inlined.
- Source: `/Users/george/Downloads/Custom Design System/src/app/App.tsx` (documentation site) and `/Users/george/Downloads/Custom Design System (1)/src/app/App.tsx` (landing page).
- Commit after every task. Never commit to `main`.

---

### Task 1: Storybook defaults to dark, with a working toggle

**Files:**
- Modify: `packages/react/.storybook/preview.tsx`, `.storybook/preview.css`
- Test: `packages/react/tests/browser/theme.spec.ts`

Phase 2 Task 1 already flipped `initialGlobals.theme` to `'dark'` and added `.lat-surface` to the decorator. This task verifies both hold and that the toggle actually re-themes.

- [ ] **Step 1: Write the failing test**

```ts
// packages/react/tests/browser/theme.spec.ts
import { expect, test } from '@playwright/test'

const page1 = '/iframe.html?id=button--variants'

test('a story with no theme global renders dark', async ({ page }) => {
  await page.goto(page1)
  const theme = await page
    .locator('.lat-surface')
    .first()
    .getAttribute('data-lat-theme')
  expect(theme).toBe('dark')
})

test('the light global re-themes the surface', async ({ page }) => {
  await page.goto(`${page1}&globals=theme:light`)
  const bg = await page
    .locator('.lat-surface')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor)
  // oklch(0.957 0.0107 286.2) -> #f0f0f8
  expect(bg).toBe('rgb(240, 240, 248)')
})
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `cd packages/react && pnpm dev & npx playwright test tests/browser/theme.spec.ts`
Expected: PASS if Phase 2 Task 1 landed correctly. If the first test fails, `initialGlobals.theme` was not flipped — fix it in `preview.tsx`.

- [ ] **Step 3: Make the surface fill the frame**

In `.storybook/preview.css`, ensure `.lat-story` sets `min-height: 100vh` so the dark page colour covers the whole iframe rather than only the content box. Without it, dark mode reads as a rectangle on a white canvas.

```css
.lat-story {
  min-height: 100vh;
  padding: var(--lat-space-6);
}

/* The page stories own their own padding and layout, so the decorator's is
   removed for them. */
.lat-story:has(> .lat-page) {
  padding: 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/react && npx playwright test tests/browser/theme.spec.ts`
Expected: PASS, 2 tests

- [ ] **Step 5: Commit**

```bash
git add packages/react
git commit -m "feat(react): Storybook defaults to dark and fills the frame"
```

---

### Task 2: The Meridian documentation page

**Files:**
- Create: `packages/react/src/pages/icons.tsx`, `packages/react/src/pages/system-page.tsx`, `system-page.stories.tsx`, `packages/react/src/pages/pages.css`
- Modify: `packages/react/src/styles.css`

Rebuild `/Users/george/Downloads/Custom Design System/src/app/App.tsx` — the six-section documentation site: Overview, Tokens, Typography, Components, Patterns, Motion.

**What it must exercise:** `Card` with `CardHeader`, `Eyebrow` with and without the rule, `Stat`, `Badge` in all six variants, `Button` in all five, `SegmentedControl`, `Table`, `CodeBlock`, `Input`.

- [ ] **Step 1: Create the icon set**

`src/pages/icons.tsx` exporting `Copy`, `Check`, `ChevronRight`, `Circle`, `Square`, `Triangle`, `Sun`, `Moon`, `Zap` as inline SVG components taking `size` and inheriting `currentColor`. Each is a `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">` with the lucide path data.

Add `aria-hidden="true"` to every icon by default — they are all decorative here, sitting beside a text label.

- [ ] **Step 2: Build the page in section components**

`src/pages/system-page.tsx` exports one `SystemPage` composed of `OverviewSection`, `TokensSection`, `TypographySection`, `ComponentsSection`, `PatternsSection` and `MotionSection`, each a local function in the same file. Follow the source's structure and copy; the goal is a faithful rebuild, not a reinterpretation.

The root element carries `className="lat-page lat-surface"`.

- [ ] **Step 3: Layout-only CSS**

`src/pages/pages.css` holds grid and flex rules for the page shells and nothing else. Every colour, border, radius and type value is a component or a `var(--lat-*)`. Add `@import './pages/pages.css';` to `src/styles.css`.

- [ ] **Step 4: The story**

```tsx
// packages/react/src/pages/system-page.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SystemPage } from './system-page.js'

/**
 * The Meridian documentation site, rebuilt from Lattice components alone.
 *
 * This is an acceptance test rather than a demo. Anything this page needs that
 * the library cannot express is a gap in the library — see the gap list in
 * docs/superpowers/plans/2026-08-03-meridian-proof.md Task 4.
 */
const meta = {
  title: 'Pages/System',
  component: SystemPage,
  parameters: { layout: 'fullscreen' }
} satisfies Meta<typeof SystemPage>

export default meta

export const Dark: StoryObj<typeof meta> = { globals: { theme: 'dark' } }
export const Light: StoryObj<typeof meta> = { globals: { theme: 'light' } }
```

- [ ] **Step 5: Compare against the source side by side**

Run Storybook and open the story beside the original bundle:

```bash
cd packages/react && pnpm dev
# in another shell
cd "/Users/george/Downloads/Custom Design System" && npm i && npm run dev
```

Check, in order: the eyebrow tracking, the hairline weight, the square corners, the mono/sans split, and the chartreuse. Note every mismatch — they feed Task 4.

- [ ] **Step 6: Commit**

```bash
git add packages/react
git commit -m "feat(react): rebuild the Meridian documentation page from Lattice

Composed only of the public API. It is the acceptance test for the identity."
```

---

### Task 3: The tabstop landing page

**Files:**
- Create: `packages/react/src/pages/landing-page.tsx`, `landing-page.stories.tsx`
- Modify: `packages/react/src/pages/pages.css`, `icons.tsx`

Rebuild `/Users/george/Downloads/Custom Design System (1)/src/app/App.tsx` — nav, hero with the mock audit card, trust bar, how-it-works, score chart, why, v1 scope, CTA, footer.

**Two deliberate omissions.** `ScoreArc` is product surface and is excluded per the spec's §7.3; render the score as a `Stat` instead. The Recharts line chart is a charting concern, not a design-system one; render the score history as a `Table` and note it in the gap list.

- [ ] **Step 1: Add the icons this page needs**

Extend `icons.tsx` with `ArrowRight`, `Globe`, `Mail`, `TrendingDown`, `ExternalLink`, `AlertCircle`, `AlertTriangle`, `Info`, `X`.

- [ ] **Step 2: Build the page**

`src/pages/landing-page.tsx` exporting `LandingPage`, composed of `Nav`, `Hero`, `TrustBar`, `HowItWorks`, `ScoreHistory`, `Why`, `V1Scope`, `CTA` and `Footer` as local functions.

The impact badges use `Badge` with a severity variant, each carrying an icon **and** its text label — the rule from the spec's §1.4, and the reason the ramp is safe.

- [ ] **Step 3: The story**

Same shape as Task 2's, titled `Pages/Landing`, with `Dark` and `Light` stories.

- [ ] **Step 4: Verify the trust bar's figures do not jitter**

```ts
// append to packages/react/tests/browser/theme.spec.ts
test('stat values use tabular figures', async ({ page }) => {
  await page.goto('/iframe.html?id=pages-landing--dark')
  const variant = await page
    .locator('.lat-stat__value')
    .first()
    .evaluate((el) => getComputedStyle(el).fontVariantNumeric)
  expect(variant).toContain('tabular-nums')
})
```

Run: `cd packages/react && npx playwright test tests/browser/theme.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/react
git commit -m "feat(react): rebuild the tabstop landing page from Lattice

ScoreArc and the Recharts chart are deliberately not rebuilt — the first is
product surface, the second is a charting concern."
```

---

### Task 4: The accessibility sweep, and the gap list

**Files:**
- Modify: `packages/react/tests/browser/a11y.spec.ts`
- Create: `docs/superpowers/plans/2026-08-03-meridian-gaps.md`

- [ ] **Step 1: Extend the sweep to the page stories**

The sweep is driven by `storyFamilies()` from `tests/browser/support/stories.js`, which reads Storybook's index at run time rather than from a declared list — a story is scanned because it exists. So the two page stories are picked up with no change to the spec file. Confirm rather than assume:

```bash
cd packages/react && npx playwright test tests/browser/a11y.spec.ts --reporter=list 2>&1 | grep -i "pages"
```

Expected: four lines — system and landing, each in both themes. If none appear, `storyFamilies()` is filtering on a title prefix the pages do not match; widen the filter rather than hard-coding story IDs.

- [ ] **Step 2: Run the sweep and capture the result**

Run: `cd packages/react && npx playwright test tests/browser/a11y.spec.ts --reporter=list > /tmp/a11y.txt 2>&1; tail -40 /tmp/a11y.txt`

**Expect failures, and do not fix them here.** Five contrast pairs are known to fail by design (spec §9), and axe will report the light-mode focus ring and the dark `text-subtle`. Record them; changing a value to satisfy axe would be reversing an approved decision.

- [ ] **Step 3: Write the gap list**

Create `docs/superpowers/plans/2026-08-03-meridian-gaps.md` with three sections, each entry naming the page, what it needed, and what was done instead:

1. **Library gaps** — constructions a page needed that no component provides. Each is a candidate for a future component, with the admission test applied: does it carry a guarantee a caller would otherwise have to remember?
2. **Known contrast failures** — the axe findings that correspond to the spec's §9 ledger, marked as accepted, with a pointer to the ledger. Anything axe reports that is *not* in the ledger is a real defect and must be listed separately.
3. **Deliberate omissions** — `ScoreArc`, the Recharts chart, and the ~50 stock shadcn components, each with its reason.

- [ ] **Step 4: Update the root README**

Replace the "fourteen component families" description with the Meridian identity: eighteen families, the five Button variants, dark by default, and a pointer to the two page stories as the acceptance test. Remove the "one rule that shapes everything" section describing generated colour — it is no longer true — and replace it with the anchored-palette rule and a pointer to the §9 ledger.

- [ ] **Step 5: Commit**

```bash
git add packages/react docs README.md
git commit -m "feat: sweep the page stories and record the gap list

The known contrast failures are accepted per the approved spec; anything axe
reports outside that ledger is a real defect and is listed as one."
```

---

## Self-Review

**Spec coverage.** §8's requirements are all here: dark default (Task 1), both pages rebuilt from components alone (Tasks 2 and 3), the axe sweep extended to them (Task 4), and the gap list as the output (Task 4). §7.3's exclusions are honoured explicitly in Task 3 rather than silently. §1.4's icon-and-label rule is enforced in Task 3 Step 2. §9's ledger is cross-referenced in Task 4 Step 2 so a known failure is not "fixed" by reversing an approved decision.

**Placeholder scan.** No TBD or TODO. Tasks 2 and 3 describe the pages by their section structure and point at the exact source files rather than reproducing 1,700 lines of TSX, which is the only sane form for a faithful-rebuild task; every component the rebuild must exercise is named.

**Type consistency.** `SystemPage` and `LandingPage` are each defined and consumed within their own task. `icons.tsx` is created in Task 2 Step 1 and extended in Task 3 Step 1 — the second task adds names rather than redefining any. `.lat-page` is introduced in Task 2 Step 2 and referenced by the `:has()` rule written in Task 1 Step 3, which runs first; the rule is inert until the class exists, which is correct.
