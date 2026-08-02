# Lattice Visual Direction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three candidate visual directions — Instrument, Blueprint, Iridescent — as swappable overlay layers over the real components, so one can be chosen by looking at the real gallery.

**Architecture:** A Storybook global named `direction` mirrors the existing `theme` global, and the preview decorator sets `data-lat-direction` alongside `data-lat-theme` on the same wrapper. Each direction is one CSS file in `.storybook/directions/`, discovered by `import.meta.glob` in the browser and by `readdirSync` in the Playwright sweep — so **a direction is registered because its stylesheet exists**, mirroring the way a story is scanned because it exists. Nothing enumerates directions by hand.

**Tech Stack:** Storybook 10 (`@storybook/react-vite`), Playwright + `@axe-core/playwright`, Vitest 4, TypeScript 7, plain CSS with custom properties.

## Global Constraints

Copied from `docs/superpowers/specs/2026-08-02-lattice-visual-direction-design.md`. Every task's requirements implicitly include this section.

- **A direction may** override any token within its scope, add component-level rules, and add pseudo-elements.
- **A direction may not** change component markup, props, or any TypeScript in `src/*/*.tsx`. If a direction needs a DOM change, that is a finding for its own issue.
- **Direction stylesheets live only in `packages/react/.storybook/directions/`.** They are never imported by `src/styles.css` and never ship. `published-surface.test.ts` and the static CSS contract read only the published file.
- **Token overrides use the selector `[data-lat-theme][data-lat-direction='<name>']`.** Two attribute selectors (specificity 0,2,0) beat the token stylesheet's `[data-lat-theme]` (0,1,0) regardless of stylesheet load order. A single-attribute selector would tie and depend on order — do not rely on that.
- **Motion is authored only inside `@media (prefers-reduced-motion: no-preference)`.** There is no global reset and no direction may add one.
- **These values are fixed and may not be renegotiated:** accent hue 305°, peak chroma 0.200, accent step 9 pinned to L 0.591; grey hue 305° at peak 0.012; danger 27°, warning 75°, success 145°; step 9 is mode-invariant.
- **Severity is never conveyed by colour alone.** No direction may remove an icon or text label.
- **Node 24, pnpm.** Run all commands from `packages/react/` unless a task says otherwise.
- **Tokens must be built before Storybook or the browser tests run:** `pnpm --filter @chameleon-labs/lattice-tokens build`. `dist/` is not committed.

## File Structure

| File | Responsibility |
|---|---|
| `packages/react/.storybook/preview.tsx` | *Modify.* Adds the `direction` global, discovers direction stylesheets via `import.meta.glob`, sets `data-lat-direction` on the story wrapper. |
| `packages/react/.storybook/env.d.ts` | *Modify.* Adds the `import.meta.glob` type declaration. |
| `packages/react/.storybook/directions/instrument.css` | *Create (Task 3).* The precision pole. |
| `packages/react/.storybook/directions/blueprint.css` | *Create (Task 4).* Instrument plus the focus ring as ornament. |
| `packages/react/.storybook/directions/iridescent.css` | *Create (Task 6).* The expressive pole. |
| `packages/react/tests/browser/support/stories.ts` | *Modify.* Adds `directionNames()`, `DIRECTIONS`, and a `direction` parameter on `storyUrl`. |
| `packages/react/tests/browser/a11y.spec.ts` | *Modify.* Nests the direction axis into the axe sweep and the reduced-motion transform check. |
| `packages/react/tests/browser/directions.spec.ts` | *Create (Task 1).* Asserts the decorator applies the attribute and each direction's visual invariants. |
| `packages/react/src/specimen/specimen.stories.tsx` | *Create (Task 2).* One composed screen, titled `Components/Specimen`. |
| `packages/tokens/tests/iridescent-endpoint.test.ts` | *Create (Task 5).* Computes the violet gradient endpoint with the real pipeline, contracts it at 4.5:1, and guards the stylesheet against drift. |

### Two constraints discovered in the existing tests that dictate the above

`tests/story-coverage.test.ts` asserts **every directory under `src/` has a stories file** and **every story file is titled `Components/<Word>`** (regex `title:\s*'Components\/\w+'`). A specimen story therefore lives at `src/specimen/specimen.stories.tsx` titled `Components/Specimen`, which needs no change to any existing test and makes the sweep pick it up as a family automatically.

`storyUrl` is called by six existing tests (dialog, menu, switch, focus ring, forced-colors, transform). Its new `direction` parameter **must default to `'none'`** so those call sites stay untouched.

---

### Task 1: The direction axis

**Files:**
- Modify: `packages/react/.storybook/preview.tsx`
- Modify: `packages/react/.storybook/env.d.ts`
- Modify: `packages/react/tests/browser/support/stories.ts`
- Modify: `packages/react/tests/browser/a11y.spec.ts`
- Create: `packages/react/.storybook/directions/.gitkeep`
- Test: `packages/react/tests/browser/directions.spec.ts`

**Interfaces:**
- Produces: `directionNames(): string[]` and `DIRECTIONS: readonly string[]` from `tests/browser/support/stories.js`; `storyUrl(id: string, theme: 'light' | 'dark', direction?: string): string`. Later tasks add a `.css` file to `.storybook/directions/` and are swept automatically — they do not edit any list.

- [ ] **Step 1: Create the empty directions directory**

```bash
mkdir -p packages/react/.storybook/directions
touch packages/react/.storybook/directions/.gitkeep
```

- [ ] **Step 2: Write the failing test**

Create `packages/react/tests/browser/directions.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, storyUrl } from './support/stories.js'

/**
 * The direction axis, asserted at its seam.
 *
 * A direction is registered because its stylesheet exists — `directionNames()`
 * reads the directory, and the preview discovers the same files through
 * `import.meta.glob`. Both derive from one directory, so they cannot disagree
 * about which directions exist; this file proves the attribute actually reaches
 * the DOM, which is the part a glob cannot guarantee.
 */
test('every registered direction reaches the story wrapper', async ({ page }) => {
  for (const direction of DIRECTIONS) {
    await page.goto(storyUrl('components-button--default', 'light', direction))
    await page.locator('.lat-story').waitFor()

    const applied = await page
      .locator('.lat-story')
      .evaluate((el) => el.getAttribute('data-lat-direction'))

    expect(applied, direction).toBe(direction)
  }
})

test('the theme axis still works alongside the direction axis', async ({ page }) => {
  for (const theme of THEMES) {
    await page.goto(storyUrl('components-button--default', theme, 'none'))
    await page.locator('.lat-story').waitFor()

    const applied = await page
      .locator('.lat-story')
      .evaluate((el) => el.getAttribute('data-lat-theme'))

    expect(applied, theme).toBe(theme)
  }
})

test('`none` is always registered, so the shipped system stays the control', () => {
  expect(DIRECTIONS[0]).toBe('none')
})
```

- [ ] **Step 3: Run it to make sure it fails**

```bash
cd packages/react && pnpm test:browser -- directions.spec.ts
```

Expected: FAIL — `DIRECTIONS` and the three-argument `storyUrl` are not exported yet, so TypeScript rejects the import.

- [ ] **Step 4: Add the registry and the direction parameter to the support module**

In `packages/react/tests/browser/support/stories.ts`, add after `storyFamilies()`:

```ts
/**
 * The candidate directions, read from disk for the same reason `storyFamilies`
 * is: Playwright collects test files before the web server is up, so the shape
 * of the suite cannot come from a runtime fetch.
 *
 * `none` is prepended and is not a file — it is the system exactly as it ships,
 * which is the control the candidates are judged against.
 */
export function directionNames(): string[] {
  const directions = new URL('../../../.storybook/directions/', import.meta.url)

  return readdirSync(directions)
    .filter((file) => file.endsWith('.css'))
    .map((file) => file.replace(/\.css$/, ''))
    .sort()
}

export const DIRECTIONS: readonly string[] = ['none', ...directionNames()]
```

Then replace `storyUrl` with:

```ts
export function storyUrl(
  id: string,
  theme: 'light' | 'dark',
  direction: string = 'none'
): string {
  const globals = `theme:${theme};direction:${direction};a11y.manual:!true`

  return `/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=${encodeURIComponent(globals)}`
}
```

The default keeps the six existing call sites unchanged.

- [ ] **Step 5: Declare the glob type**

Replace `packages/react/.storybook/env.d.ts` with:

```ts
// A side-effect stylesheet import has no type of its own. The wildcard matches
// a package subpath as well as a relative path, which is what covers
// '@chameleon-labs/lattice-tokens/lattice.css'.
declare module '*.css'

// `import.meta.glob` is Vite's, and Storybook builds this preview with Vite.
// Declared here rather than by adding "vite/client" to tsconfig types, which
// would pull DOM ambient declarations into every file the config covers.
interface ImportMeta {
  glob: (pattern: string, options?: { eager?: boolean }) => Record<string, unknown>
}
```

- [ ] **Step 6: Add the global and the attribute to the preview**

In `packages/react/.storybook/preview.tsx`, add below the existing imports:

```tsx
/**
 * Every stylesheet in directions/ is loaded, and its filename is the direction's
 * name. Adding a direction is adding a file — nothing here enumerates them,
 * which is the same guarantee the story sweep makes about stories.
 *
 * The Playwright side reads the same directory with readdirSync. Two readers,
 * one directory, so they cannot drift about which directions exist.
 */
const directionStyles = import.meta.glob('./directions/*.css', { eager: true })

const DIRECTIONS = [
  // Not a file: the system exactly as it ships, and the control the candidates
  // are judged against.
  'none',
  ...Object.keys(directionStyles)
    .map((path) => path.slice('./directions/'.length).replace(/\.css$/, ''))
    .sort()
]
```

Replace the decorator with:

```tsx
const withTheme: Decorator = (Story, context) => (
  <div
    className="lat-story"
    data-lat-theme={String(context.globals['theme'] ?? 'light')}
    data-lat-direction={String(context.globals['direction'] ?? 'none')}
  >
    <Story />
  </div>
)
```

Add to `globalTypes`, beside `theme`:

```tsx
    direction: {
      description: 'Which candidate visual direction the story renders in',
      toolbar: {
        title: 'Direction',
        icon: 'paintbrush',
        items: DIRECTIONS.map((value) => ({
          value,
          title: value === 'none' ? 'None (shipped)' : value.charAt(0).toUpperCase() + value.slice(1)
        })),
        dynamicTitle: true
      }
    }
```

And extend `initialGlobals`:

```tsx
  initialGlobals: {
    theme: 'light',
    direction: 'none'
  },
```

- [ ] **Step 7: Run the test to verify it passes**

```bash
cd packages/react && pnpm test:browser -- directions.spec.ts
```

Expected: PASS, 3 tests. `DIRECTIONS` is `['none']` at this point — the loop runs once, which is correct.

- [ ] **Step 8: Extend the axe sweep across the direction axis**

In `packages/react/tests/browser/a11y.spec.ts`, add `DIRECTIONS` to the import from `./support/stories.js`, then wrap the existing theme loop:

```ts
for (const family of families) {
  const title = titleFor(family)

  for (const direction of DIRECTIONS) {
    for (const theme of THEMES) {
      test(`${title} has no axe violations in ${theme} / ${direction}`, async ({ page, request }) => {
```

Inside that test, change the single navigation line to pass the direction:

```ts
          await page.goto(storyUrl(story.id, theme, direction))
```

and the soft assertion's label:

```ts
          expect.soft(summary, `${story.id} in ${theme} / ${direction}`).toEqual([])
```

Close the extra brace at the end of the theme loop.

- [ ] **Step 9: Put the reduced-motion check on the direction axis too**

The existing comment says the transform check is not split by theme because "the stylesheet does not vary by mode". It *does* vary by direction, so this check must run per direction. Replace that test with:

```ts
  /**
   * Sharded per family for the same reason as the sweep above.
   *
   * Not split by theme — whether a transform is animated is a property of the
   * stylesheet, and the stylesheet does not vary by mode. It does vary by
   * direction, which is exactly why the direction axis is here and the theme
   * axis is not.
   */
  for (const direction of DIRECTIONS) {
    test(`${title} animates no transform under reduced motion / ${direction}`, async ({
      page,
      request
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })

      const stories = (await fetchStories(request)).filter(
        (story) => story.title === `Components/${title}`
      )

      expect(stories.length).toBeGreaterThan(0)

      for (const story of stories) {
        await page.goto(storyUrl(story.id, 'light', direction))
        await page.locator('.lat-story').waitFor()

        const offenders = await page.evaluate(() =>
          [...document.querySelectorAll('*')]
            .filter((el) => getComputedStyle(el).transitionProperty.includes('transform'))
            .map((el) => el.className)
        )

        expect.soft(offenders, `${story.id} / ${direction}`).toEqual([])
      }
    })
  }
```

- [ ] **Step 10: Run the full browser suite**

```bash
cd packages/react && pnpm test:browser
```

Expected: PASS. With `DIRECTIONS === ['none']` the matrix is its current size, so this run proves the refactor changed nothing.

- [ ] **Step 11: Typecheck and commit**

```bash
cd packages/react && pnpm typecheck
git add packages/react/.storybook packages/react/tests/browser
git commit --no-gpg-sign -m "Add the direction axis: a global, a registry read from disk, a swept axis"
```

---

### Task 2: The specimen screen

**Files:**
- Create: `packages/react/src/specimen/specimen.stories.tsx`

**Interfaces:**
- Consumes: the public barrel `../index.js`.
- Produces: story id `components-specimen--dashboard`, used by Tasks 3, 4 and 6 for their invariant assertions.

**Why this exists:** a row of buttons is not a design system. The specimen is the screen a direction is actually judged on, and because it composes every family whose appearance a direction changes, it doubles as the cheap sweep target named in the spec's fallback.

- [ ] **Step 1: Write the story**

Create `packages/react/src/specimen/specimen.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Badge,
  Button,
  Callout,
  Card,
  Switch,
  Table,
  TextField
} from '../index.js'

/**
 * One composed screen, for judging a visual direction.
 *
 * Every other story isolates a family so a failure names it. This one does the
 * opposite on purpose: a direction is a claim about how things look *next to
 * each other*, and that claim cannot be evaluated a component at a time.
 *
 * It is titled under Components/ because `story-coverage.test.ts` requires every
 * story file to be, and because the browser sweep matches stories by
 * `Components/<Family>` — a story titled anything else would be indexed,
 * rendered, and never scanned.
 */
const meta = {
  title: 'Components/Specimen'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const ROWS = [
  { page: '/pricing', issue: 'Links rely on colour alone', impact: 'critical' as const },
  { page: '/docs/install', issue: 'Form label not programmatically associated', impact: 'serious' as const },
  { page: '/blog', issue: 'Heading levels skip from h2 to h4', impact: 'moderate' as const },
  { page: '/about', issue: 'Redundant alt text on decorative image', impact: 'minor' as const }
]

export const Dashboard: Story = {
  render: () => (
    <div className="lat-story__stack">
      <h1>Accessibility report</h1>

      <Callout tone="warning" title="Automated testing is not proof">
        Four issues were found by axe. Automated checks cover roughly a third of
        WCAG success criteria — a clean run is a starting point, not a pass.
      </Callout>

      <div className="lat-story__row">
        <Card>
          <h2>Score</h2>
          <p>82 of 100, down 4 since the last run.</p>
          <div className="lat-story__row">
            <Badge tone="critical">1 critical</Badge>
            <Badge tone="serious">1 serious</Badge>
            <Badge tone="moderate">1 moderate</Badge>
            <Badge tone="minor">1 minor</Badge>
          </div>
        </Card>

        <Card>
          <h2>Monitoring</h2>
          <Switch defaultChecked>Email me on regressions</Switch>
        </Card>
      </div>

      <Table
        caption="Issues found on the most recent run"
        columns={[
          { key: 'page', header: 'Page' },
          { key: 'issue', header: 'Issue' },
          { key: 'impact', header: 'Impact' }
        ]}
        rows={ROWS.map((row) => ({
          key: row.page,
          page: row.page,
          issue: row.issue,
          impact: <Badge tone={row.impact}>{row.impact}</Badge>
        }))}
      />

      <div className="lat-story__row">
        <TextField label="Add a URL to monitor" placeholder="https://example.com" />
        <Button>Run audit</Button>
        <Button variant="soft" tone="neutral">
          Export
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check the component APIs actually match**

The `Table`, `Callout`, `Card`, `Switch` and `TextField` props above are written from the component library spec. Before running anything, open each component's `.tsx` and its existing `.stories.tsx` and correct the props in the specimen to match the real signatures.

```bash
cd packages/react && sed -n '1,60p' src/table/table.tsx && sed -n '1,40p' src/callout/callout.tsx
```

Fix the specimen to match what you find. **Do not change any component to match the specimen** — the global constraints forbid it.

- [ ] **Step 3: Typecheck**

```bash
cd packages/react && pnpm typecheck
```

Expected: PASS. If it fails, the props are still wrong — fix the story, not the component.

- [ ] **Step 4: Verify the story is indexed and swept**

```bash
cd packages/react && pnpm test:unit -- story-coverage
```

Expected: PASS — in particular `titles every story file under the Components namespace` and `gives every component directory a stories file`.

```bash
cd packages/react && pnpm test:browser -- a11y.spec.ts
```

Expected: PASS, and the run now includes `Specimen has no axe violations in light / none`.

- [ ] **Step 5: Commit**

```bash
git add packages/react/src/specimen
git commit --no-gpg-sign -m "Add the specimen screen, the surface a direction is judged on"
```

---

### Task 3: Instrument

**Files:**
- Create: `packages/react/.storybook/directions/instrument.css`
- Modify: `packages/react/tests/browser/directions.spec.ts`

**Interfaces:**
- Consumes: `storyUrl(id, theme, 'instrument')`, story id `components-specimen--dashboard`.
- Produces: the direction name `instrument`, picked up automatically by `directionNames()` and the glob.

- [ ] **Step 1: Write the failing test**

Append to `packages/react/tests/browser/directions.spec.ts`:

```ts
test.describe('instrument', () => {
  test('borders do the elevation work — raised and overlay cast no shadow', async ({ page }) => {
    await page.goto(storyUrl('components-card--default', 'light', 'instrument'))
    await page.locator('.lat-card').waitFor()

    const shadow = await page
      .locator('.lat-card')
      .evaluate((el) => getComputedStyle(el).boxShadow)

    // The #30 calibration measured a shadow at 1.016:1 on dark — nothing.
    // Instrument makes dark mode's measured truth the rule in both modes.
    expect(shadow).toBe('none')
  })

  test('corners are the tight radius everywhere', async ({ page }) => {
    await page.goto(storyUrl('components-button--default', 'light', 'instrument'))
    await page.locator('.lat-button').waitFor()

    const radius = await page
      .locator('.lat-button')
      .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)

    // --lat-radius-sm is 0.25rem, which is 4px at the default root font size.
    expect(radius).toBe('4px')
  })

  test('numerals are tabular where numbers are compared down a column', async ({ page }) => {
    await page.goto(storyUrl('components-specimen--dashboard', 'light', 'instrument'))
    await page.locator('.lat-table').waitFor()

    const variant = await page
      .locator('.lat-table td')
      .first()
      .evaluate((el) => getComputedStyle(el).fontVariantNumeric)

    expect(variant).toContain('tabular-nums')
  })

  test('press feedback carries no transform', async ({ page }) => {
    await page.goto(storyUrl('components-button--default', 'light', 'instrument'))
    await page.locator('.lat-button').waitFor()

    const animated = await page
      .locator('.lat-button')
      .evaluate((el) => getComputedStyle(el).transitionProperty.includes('transform'))

    expect(animated).toBe(false)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
cd packages/react && pnpm test:browser -- directions.spec.ts
```

Expected: FAIL on all four — there is no `instrument.css`, so the direction renders as the shipped system.

- [ ] **Step 3: Write the stylesheet**

Create `packages/react/.storybook/directions/instrument.css`:

```css
/*
 * Instrument — the precision pole.
 *
 * Restraint is the statement. Borders carry elevation, corners are tight,
 * numbers line up, and colour is spent only where it means something.
 *
 * Token overrides are scoped `[data-lat-theme][data-lat-direction=...]` — two
 * attribute selectors, so they beat the token stylesheet's single-attribute
 * `[data-lat-theme]` on specificity rather than on load order.
 */

[data-lat-theme][data-lat-direction='instrument'] {
  /* One radius, tight. `full` survives only where a shape is the affordance —
     the switch thumb — and that is set on the component below. */
  --lat-radius-sm: 0.125rem;
  --lat-radius-md: 0.25rem;
  --lat-radius-lg: 0.25rem;

  /* The #30 calibration established a shadow is worth 1.315:1 on light and
     1.016:1 on dark. Instrument stops pretending the second number is a signal
     and lets the border it already carries do the work. */
  --lat-elevation-raised-shadow: none;
  --lat-elevation-overlay-shadow: none;
  --lat-elevation-modal-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.1);
}

/* Every surface states its edge. The shipped button carries a transparent
   border to hold its box size; here the border is the point. */
[data-lat-direction='instrument'] .lat-button[data-variant='solid'] {
  border-color: var(--_solid);
}

[data-lat-direction='instrument'] .lat-button[data-variant='soft'],
[data-lat-direction='instrument'] .lat-button[data-variant='ghost'] {
  border-color: var(--lat-border);
}

/* One step tighter. The shipped `md` is space-2 / space-3. */
[data-lat-direction='instrument'] .lat-button[data-size='md'] {
  padding: var(--lat-space-1) var(--lat-space-3);
}

/*
 * Tabular numerals wherever numbers are read down a column or compared between
 * rows. The system sans stack supports this, so it costs one declaration and no
 * bytes — no font is added.
 */
[data-lat-direction='instrument'] .lat-table td,
[data-lat-direction='instrument'] .lat-table th,
[data-lat-direction='instrument'] .lat-badge {
  font-variant-numeric: tabular-nums;
}

/*
 * State reads through fill and border only.
 *
 * The shipped button adds `transform` to its transition list inside a
 * no-preference query and translates 1px on press. Instrument removes the
 * movement, so the transition list must lose `transform` with it — otherwise
 * the reduced-motion sweep sees a transform-animated element with nothing to
 * animate.
 */
@media (prefers-reduced-motion: no-preference) {
  [data-lat-direction='instrument'] .lat-button:active {
    transition-property: background-color, border-color, color, box-shadow;
    transform: none;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd packages/react && pnpm test:browser -- directions.spec.ts
```

Expected: PASS. If the radius assertion reports `2px` rather than `4px`, the button reads `--lat-radius-md` and the override above set it to `0.25rem` — confirm which token the component actually uses and align the assertion with the component, not the other way round.

If the `tabular-nums` test fails because the table's class is not `.lat-table`, read `src/table/table.tsx` for the real class name and correct both the stylesheet and the test.

- [ ] **Step 5: Run the full sweep — the direction is now scanned because it exists**

```bash
cd packages/react && pnpm test:browser
```

Expected: PASS, and the matrix has doubled — every family now runs in `none` and `instrument`. Any axe violation here is a real finding about the direction, not about the harness.

- [ ] **Step 6: Look at it**

```bash
cd packages/react && pnpm dev
```

Open http://localhost:6006, pick **Components/Specimen → Dashboard**, and switch the Direction toolbar between None and Instrument in both themes. This is the deliverable — the tests prove it is legal, not that it is good.

- [ ] **Step 7: Commit**

```bash
git add packages/react/.storybook/directions/instrument.css packages/react/tests/browser/directions.spec.ts
git commit --no-gpg-sign -m "Direction: Instrument — borders carry elevation, tight corners, tabular numerals"
```

---

### Task 4: Blueprint

**Files:**
- Create: `packages/react/.storybook/directions/blueprint.css`
- Modify: `packages/react/tests/browser/directions.spec.ts`

**Interfaces:**
- Consumes: `storyUrl(id, theme, 'blueprint')`.
- Produces: the direction name `blueprint`.

**The claim this task tests:** WCAG 2.2 SC 2.4.13 *Focus Appearance* (AAA) asks for an indicator at least as large as a 2px-thick perimeter of the focused control. The shipped 2px ring sits at the edge of that; Blueprint's 3px ring clears it. **This is a hypothesis being measured, not an assertion.** If the measurement fails, report it — do not weaken the test.

- [ ] **Step 1: Write the failing test**

Append to `packages/react/tests/browser/directions.spec.ts`:

```ts
test.describe('blueprint', () => {
  test('the focus ring is thick enough to clear SC 2.4.13', async ({ page }) => {
    await page.goto(storyUrl('components-button--default', 'light', 'blueprint'))
    await page.locator('.lat-button').waitFor()

    // Keyboard-driven: a programmatic .focus() does not set the heuristic
    // Firefox uses for :focus-visible, so the ring would not be showing.
    await page.keyboard.press('Tab')

    const focus = await page.evaluate(() => {
      const el = document.activeElement
      if (el === null) return null
      const style = getComputedStyle(el)
      return {
        width: parseFloat(style.outlineWidth),
        offset: parseFloat(style.outlineOffset),
        style: style.outlineStyle
      }
    })

    expect(focus).not.toBeNull()
    expect(focus?.style).not.toBe('none')
    // SC 2.4.13 wants an area at least equal to a 2px perimeter of the control.
    // A 3px ring clears that with room, at every control size.
    expect(focus?.width).toBeGreaterThanOrEqual(3)
    expect(focus?.offset).toBeGreaterThanOrEqual(3)
  })

  test('the selected tab carries a rail, not only a colour', async ({ page }) => {
    await page.goto(storyUrl('components-tabs--default', 'light', 'blueprint'))
    await page.locator('.lat-tab').first().waitFor()

    const rail = await page
      .locator('.lat-tab[aria-selected="true"]')
      .evaluate((el) => getComputedStyle(el, '::before').inlineSize)

    // A rail exists and has width. `auto` or `0px` means the pseudo-element
    // never rendered.
    expect(rail).not.toBe('auto')
    expect(parseFloat(rail)).toBeGreaterThan(0)
  })

  test('it keeps Instrument’s elevation rule', async ({ page }) => {
    await page.goto(storyUrl('components-card--default', 'light', 'blueprint'))
    await page.locator('.lat-card').waitFor()

    const shadow = await page
      .locator('.lat-card')
      .evaluate((el) => getComputedStyle(el).boxShadow)

    expect(shadow).toBe('none')
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
cd packages/react && pnpm test:browser -- directions.spec.ts
```

Expected: FAIL on all three — no `blueprint.css` exists.

- [ ] **Step 3: Write the stylesheet**

Create `packages/react/.storybook/directions/blueprint.css`:

```css
/*
 * Blueprint — Instrument's base, with one loud move.
 *
 * Every other system minimises focus. A system whose README opens with
 * "Accessibility is the constraint, not the feature" has the standing to do the
 * opposite: here the focus ring is the ornament, and the thing that makes the
 * system recognisable is the thing that makes it usable.
 *
 * It also cashes in the name. A lattice is a grid, and the grid shows.
 */

[data-lat-theme][data-lat-direction='blueprint'] {
  --lat-radius-sm: 0.125rem;
  --lat-radius-md: 0.25rem;
  --lat-radius-lg: 0.25rem;

  --lat-elevation-raised-shadow: none;
  --lat-elevation-overlay-shadow: none;
  --lat-elevation-modal-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.1);
}

[data-lat-direction='blueprint'] .lat-button[data-variant='solid'] {
  border-color: var(--_solid);
}

[data-lat-direction='blueprint'] .lat-button[data-variant='soft'],
[data-lat-direction='blueprint'] .lat-button[data-variant='ghost'] {
  border-color: var(--lat-border);
}

[data-lat-direction='blueprint'] .lat-button[data-size='md'] {
  padding: var(--lat-space-1) var(--lat-space-3);
}

[data-lat-direction='blueprint'] .lat-table td,
[data-lat-direction='blueprint'] .lat-table th,
[data-lat-direction='blueprint'] .lat-badge {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: no-preference) {
  [data-lat-direction='blueprint'] .lat-button:active {
    transition-property: background-color, border-color, color, box-shadow;
    transform: none;
  }
}

/*
 * The move.
 *
 * 3px at 3px offset, plus a 1px halo drawn with box-shadow so the ring reads
 * against both a light and a dark surface without needing to know which it is
 * on. `outline` cannot express two rings; a shadow can, and it does not affect
 * layout.
 */
[data-lat-direction='blueprint'] :focus-visible {
  outline: 3px solid var(--lat-focus-ring);
  outline-offset: 3px;
  box-shadow: 0 0 0 1px var(--lat-border-interactive);
}

/*
 * Selection is a rail, never only a fill.
 *
 * The same argument the system already makes about severity: a state that is
 * only a colour is a state some people cannot see.
 */
[data-lat-direction='blueprint'] .lat-tab {
  position: relative;
}

[data-lat-direction='blueprint'] .lat-tab[aria-selected='true']::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 3px;
  background-color: var(--lat-solid);
}

[data-lat-direction='blueprint'] .lat-menu-item[aria-current='true'],
[data-lat-direction='blueprint'] .lat-table tbody tr[aria-current='true'] {
  box-shadow: inset 3px 0 0 0 var(--lat-solid);
}

/*
 * The grid shows.
 *
 * A 1px structural rule at the subtle-border step, in the regions that are
 * otherwise empty. Decoration that is made of the same material as the borders
 * around it rather than applied on top of them.
 */
[data-lat-direction='blueprint'] .lat-card {
  background-image: linear-gradient(
      to right,
      var(--lat-border-subtle) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, var(--lat-border-subtle) 1px, transparent 1px);
  background-size: var(--lat-space-6) var(--lat-space-6);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd packages/react && pnpm test:browser -- directions.spec.ts
```

Expected: PASS. If the rail test fails because the tab class is not `.lat-tab` or selection is not expressed as `aria-selected`, read `src/tabs/tabs.tsx` and correct the stylesheet and test together.

- [ ] **Step 5: Run the full sweep**

```bash
cd packages/react && pnpm test:browser
```

Expected: PASS. Watch specifically for contrast violations on the `Card` grid texture — a background image behind text is exactly the case axe checks, and `border-subtle` was chosen because it is the faintest step. If it fails, that is a real finding about the direction: report it rather than removing the check.

- [ ] **Step 6: Commit**

```bash
git add packages/react/.storybook/directions/blueprint.css packages/react/tests/browser/directions.spec.ts
git commit --no-gpg-sign -m "Direction: Blueprint — the focus ring as ornament, selection as a rail"
```

---

### Task 5: The Iridescent gradient endpoint, contracted

**Files:**
- Create: `packages/tokens/tests/iridescent-endpoint.test.ts`

**Interfaces:**
- Consumes: `oklchToSrgb`, `fitToGamut`, `formatHex`, `parseHex` from `../generate/oklch.js`; `contrastRatio` from `../generate/contrast.js`.
- Produces: two hex strings — the magenta and violet gradient endpoints — asserted here and consumed by `iridescent.css` in Task 6.

**Two deviations from the spec as first written, both already folded into the spec.**

*First,* the endpoints are not emitted as shipped tokens. Wiring a token through the generator for a candidate that may lose is the scaffolding-becoming-permanent risk the exit condition exists to prevent, and the direction stylesheets are not shipped, so such a token would have no consumer. The values are computed by the real pipeline modules and contracted in a test instead.

*Second, and more important:* **the spec's original lightness was measured and found wrong before this plan was written.** Contrast is not flat across hue at fixed lightness — it falls toward blue. At the accent's pinned L 0.591, hue 305° gives 4.500:1 against white but hue 275° gives only 4.338:1. Lowering chroma makes it *worse*, not better. Both endpoints are therefore pinned to **L 0.575**, the darker of the two required lightnesses plus margin, which measures 4.817:1 and 4.641:1. The exact solved boundary, L 0.5823, was rejected because it measures 4.49997:1 and fails.

The values below are measured output, not estimates. The test asserts them so the stylesheet cannot drift from the pipeline that justified it.

- [ ] **Step 1: Write the test**

Create `packages/tokens/tests/iridescent-endpoint.test.ts`:

```ts
/**
 * @vitest-environment node
 *
 * The Iridescent direction's gradient, held to the same contract as a flat fill.
 *
 * A gradient cannot be validated the way a swatch is, so the direction is built
 * to make validation tractable: both endpoints sit at the same lightness and
 * differ only in hue.
 *
 * What that does *not* buy is flat contrast. Measured against this pipeline,
 * contrast at fixed lightness falls as hue moves toward blue: at L 0.591 — the
 * lightness `scales.ts` pins the accent's solid to — hue 305 reaches 4.500:1
 * against white while hue 275 reaches only 4.338:1. Reducing chroma makes it
 * worse rather than better, sliding toward a mid-grey with less contrast than
 * the saturated colour had. Lightness is the lever; chroma is not.
 *
 * So both ends are pinned to the darker lightness the *worse* hue needs, with
 * margin. L 0.5823 is the exact solved boundary and measures 4.49997:1, which
 * is the kind of value that satisfies a solver and fails a build.
 */
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../generate/contrast.js'
import { fitToGamut, formatHex, oklchToSrgb, parseHex } from '../generate/oklch.js'

const WHITE = parseHex('#ffffff')

/**
 * Both endpoints. Lightness and chroma are shared; only hue moves.
 *
 * 275 is not arbitrary — far enough from 305 to read as a shift, and short of
 * the 265 the tabstop system uses for its own brand, so the two stay
 * distinguishable.
 */
const LIGHTNESS = 0.575
const CHROMA = 0.2
const MAGENTA = { l: LIGHTNESS, c: CHROMA, h: 305 }
const VIOLET = { l: LIGHTNESS, c: CHROMA, h: 275 }

const hexOf = (color: { l: number; c: number; h: number }): string =>
  formatHex(oklchToSrgb(fitToGamut(color)))

const ratioOf = (color: { l: number; c: number; h: number }): number =>
  contrastRatio(oklchToSrgb(fitToGamut(color)), WHITE)

describe('the iridescent gradient', () => {
  it('holds white text clear of 4.5:1 on both endpoints', () => {
    expect(ratioOf(MAGENTA)).toBeGreaterThanOrEqual(4.5)
    expect(ratioOf(VIOLET)).toBeGreaterThanOrEqual(4.5)
  })

  it('holds it across the whole sweep, not only at the ends', () => {
    const failures: string[] = []

    for (let step = 0; step <= 60; step += 1) {
      const hue = MAGENTA.h + (VIOLET.h - MAGENTA.h) * (step / 60)
      const ratio = ratioOf({ l: LIGHTNESS, c: CHROMA, h: hue })

      if (ratio < 4.5) failures.push(`h ${hue.toFixed(1)} → ${ratio.toFixed(3)}:1`)
    }

    expect(failures).toEqual([])
  })

  it('puts the worst point at the violet end rather than in the middle', () => {
    // Measured, not assumed. This is what makes endpoint validation meaningful
    // for this hue range — and the reason the sweep above is kept anyway is
    // that it was only ever established for this range.
    const ratios = Array.from({ length: 61 }, (_, step) =>
      ratioOf({ l: LIGHTNESS, c: CHROMA, h: MAGENTA.h + (VIOLET.h - MAGENTA.h) * (step / 60) })
    )

    expect(Math.min(...ratios)).toBe(ratios[ratios.length - 1])
  })

  it('pins the exact hexes the stylesheet uses', () => {
    // Not a tautology: `iridescent.css` hardcodes these two strings, and this is
    // what stops the stylesheet drifting from the pipeline that justified it.
    expect({ magenta: hexOf(MAGENTA), violet: hexOf(VIOLET) }).toEqual({
      magenta: '#954fd5',
      violet: '#5b65ec'
    })
  })
})
```

- [ ] **Step 2: Run it to verify it passes**

```bash
cd packages/tokens && pnpm vitest run iridescent-endpoint
```

Expected: PASS, 4 tests. The measured ratios are 4.817:1 at the magenta end and 4.641:1 at the violet end.

**If the hex assertion fails**, the pipeline's gamut mapping has changed since these values were measured on 2026-08-02. Do not simply paste the new values in — first check that both ratio tests still pass, because a changed hex with a dropped ratio is a real regression rather than a rounding difference.

- [ ] **Step 3: Commit**

```bash
git add packages/tokens/tests/iridescent-endpoint.test.ts
git commit --no-gpg-sign -m "Contract the iridescent gradient endpoints across the whole sweep"
```

---

### Task 6: Iridescent

**Files:**
- Create: `packages/react/.storybook/directions/iridescent.css`
- Modify: `packages/react/tests/browser/directions.spec.ts`

**Interfaces:**
- Consumes: the two hex values contracted in Task 5.
- Produces: the direction name `iridescent`.

- [ ] **Step 1: Write the failing test**

Append to `packages/react/tests/browser/directions.spec.ts`:

```ts
test.describe('iridescent', () => {
  test('the solid fill is a gradient, not a flat colour', async ({ page }) => {
    await page.goto(storyUrl('components-button--default', 'light', 'iridescent'))
    await page.locator('.lat-button').waitFor()

    const image = await page
      .locator('.lat-button')
      .evaluate((el) => getComputedStyle(el).backgroundImage)

    expect(image).toContain('gradient')
  })

  test('the fill is the same in both themes, because step 9 is mode-invariant', async ({
    page
  }) => {
    const fillIn = async (theme: 'light' | 'dark') => {
      await page.goto(storyUrl('components-button--default', theme, 'iridescent'))
      await page.locator('.lat-button').waitFor()
      return page.locator('.lat-button').evaluate((el) => getComputedStyle(el).backgroundImage)
    }

    expect(await fillIn('light')).toBe(await fillIn('dark'))
  })

  test('status fills stay flat — severity has the stronger claim', async ({ page }) => {
    await page.goto(storyUrl('components-badge--severity-tones', 'light', 'iridescent'))
    await page.locator('.lat-badge').first().waitFor()

    const images = await page
      .locator('.lat-badge')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundImage))

    expect(images.every((image) => image === 'none')).toBe(true)
  })

  test('badges are pills', async ({ page }) => {
    await page.goto(storyUrl('components-badge--default', 'light', 'iridescent'))
    await page.locator('.lat-badge').waitFor()

    const radius = await page
      .locator('.lat-badge')
      .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)

    expect(parseFloat(radius)).toBeGreaterThan(100)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
cd packages/react && pnpm test:browser -- directions.spec.ts
```

Expected: FAIL on the gradient, mode-invariance and pill assertions. The status-fills-flat test may pass vacuously — it will become meaningful once the stylesheet exists.

- [ ] **Step 3: Write the stylesheet**

Create `packages/react/.storybook/directions/iridescent.css`. The two hexes are the values contracted in Task 5 — if you change either, that test fails, which is the point:

```css
/*
 * Iridescent — the expressive pole, built from the origin story.
 *
 * Chameleons have no violet pigment. Their colour comes from the *spacing* of a
 * lattice of guanine nanocrystals, and the animal changes colour by retuning
 * that spacing. Structural colour, not pigment.
 *
 * So the signature is a fill whose hue travels — magenta 305 to violet 275 —
 * across a surface whose *lightness never changes*. Colour that moves without
 * the surface getting brighter or darker. That is what structural colour looks
 * like, and it is the one thing in this system that no other design system is
 * entitled to do.
 *
 * Holding lightness constant is what makes it provable — though not in the way
 * it first appears. Contrast at fixed lightness is *not* flat across hue; it
 * falls toward blue, which is why both ends sit at L 0.575 rather than at the
 * accent's own L 0.591. See packages/tokens/tests/iridescent-endpoint.test.ts,
 * which walks the interpolation and contracts all 61 samples. These two hexes
 * are that test's output; changing either one fails it.
 *
 * Measured: 4.817:1 at the magenta end, 4.641:1 at the violet end, against white.
 */

[data-lat-theme][data-lat-direction='iridescent'] {
  --_iridescent-from: #954fd5;
  --_iridescent-to: #5b65ec;

  --lat-radius-md: 0.75rem;
  --lat-radius-lg: 1rem;

  /* Every level moves up one step. Elevation is generous here because the
     direction is about surfaces reading as objects. */
  --lat-elevation-raised-shadow: 0 4px 8px -1px rgb(0 0 0 / 0.12);
  --lat-elevation-overlay-shadow: 0 12px 24px -4px rgb(0 0 0 / 0.16);
  --lat-elevation-modal-shadow: 0 12px 24px -4px rgb(0 0 0 / 0.22);
}

/*
 * Only the accent is iridescent.
 *
 * A gradient on `danger` would make severity harder to recognise, and severity
 * has the stronger claim — the same argument the tabstop spec makes when it
 * refuses a second brand hue. Status fills stay flat, so this is scoped to the
 * default tone rather than applied to every solid.
 */
[data-lat-direction='iridescent'] .lat-button[data-variant='solid']:not([data-tone]),
[data-lat-direction='iridescent'] .lat-button[data-variant='solid'][data-tone='accent'] {
  background-image: linear-gradient(
    100deg,
    var(--_iridescent-from) 0%,
    var(--_iridescent-to) 100%
  );
}

/* Pills. A badge is a marker, and a marker reads as a shape before it reads as
   a word. */
[data-lat-direction='iridescent'] .lat-badge {
  border-radius: var(--lat-radius-full);
}

/* Overlays arrive rather than appear. Still inside the no-preference gate —
   there is no exception here and the direction does not ask for one. */
@media (prefers-reduced-motion: no-preference) {
  [data-lat-direction='iridescent'] .lat-dialog,
  [data-lat-direction='iridescent'] .lat-menu {
    transition-duration: var(--lat-duration-base);
    transition-timing-function: var(--lat-easing-entrance);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd packages/react && pnpm test:browser -- directions.spec.ts
```

Expected: PASS. If the mode-invariance test fails, a hex was written as a token reference rather than a literal — step 9 is mode-invariant only because these are literals, and a `var()` into a themed token would move between modes.

If the gradient does not appear, check whether the button's default tone renders as `data-tone="accent"` or with no attribute at all, and align the selector with what `src/button/button.tsx` actually emits.

- [ ] **Step 5: Run the full sweep — this is the direction most likely to find a real problem**

```bash
cd packages/react && pnpm test:browser
```

Expected: PASS. The matrix is now four directions × two themes × every family. A contrast violation on the gradient button is the risk the spec named; if axe reports one, report the failure with its measured ratio rather than adjusting the test.

- [ ] **Step 6: Verify the whole suite, both packages**

```bash
cd /Users/george/WebstormProjects/lattice/.claude/worktrees/design-directions-spec && pnpm build && pnpm test
```

Expected: PASS throughout — tokens build, tokens tests including the endpoint contract, react unit tests, react browser sweep.

- [ ] **Step 7: Commit**

```bash
git add packages/react/.storybook/directions/iridescent.css packages/react/tests/browser/directions.spec.ts
git commit --no-gpg-sign -m "Direction: Iridescent — structural colour, contracted across the sweep"
```

- [ ] **Step 8: Look at all three and choose**

```bash
cd packages/react && pnpm dev
```

Open **Components/Specimen → Dashboard** and cycle the Direction toolbar through None, Instrument, Blueprint and Iridescent, in both themes. Then do the same on Button, Table, Dialog and Badge.

The choice is a human decision and is not part of this plan. What this plan delivers is the ability to make it by looking.

---

## Notes for whoever executes this

**Commits are unsigned** (`--no-gpg-sign` throughout) because the repository's GPG key expired on 2025-04-29. If the key has been renewed by the time you run this, drop the flag.

**The class names and props in Tasks 2, 3, 4 and 6 are written from the specs, not read from every component.** Task 2 Step 2 exists to reconcile them. When a selector does not match, the component is right and the stylesheet is wrong — the global constraints forbid changing `src/*/*.tsx` to suit a direction.

**A failing axe result is a finding, not an obstacle.** Three of these directions are candidates and one will be chosen; a direction that cannot pass the sweep has been usefully eliminated, which is cheaper than discovering it after the fold-in. Report it, do not weaken the assertion.
