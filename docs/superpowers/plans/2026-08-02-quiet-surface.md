# Quiet Surface Implementation Plan

> **Status: superseded** by
> [Meridian: replacing Lattice's visual identity](../specs/2026-08-03-meridian-identity-design.md)
> (2026-08-03). Do not execute this plan. Its spec is superseded; see that
> document's header for the one rule carried forward.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the *Quiet Surface* visual direction across the whole design system — white elevated surfaces, ring hairlines, neutral-default actions and 16px controls — as specified in `docs/superpowers/specs/2026-08-02-quiet-surface-design.md`.

**Architecture:** Almost everything is driven from `packages/tokens/config/`, so the first four tasks change token config and the generator, and the component tasks then consume new tokens rather than inventing values. The one structural change is elevation becoming mode-aware: light-mode levels resolve their surface to the page-white step, dark mode keeps today's surface-step behaviour, because the #30 calibration proved a shadow carries nothing on dark.

**Tech Stack:** TypeScript, vitest (unit), Playwright (browser), Storybook 10, pnpm workspaces, Node ≥ 24.

## Global Constraints

- **Component CSS may not contain colour literals.** `findColourLiterals` permits only `var()`, `transparent` and `currentColor`. Every new colour must arrive as a token.
- **Focus outlines live on `:focus-visible` only.** `findBareFocusOutlines` flags an outline hung off bare `:focus`.
- **Transitioned `transform` must sit inside `@media (prefers-reduced-motion: no-preference)`.** `findAnimatedTransformsOutsideNoPreference` enforces it.
- **No global selectors.** `findGlobalSelectors` flags universal selectors.
- **Tokens are the source of truth in OKLCH**; the stylesheet holds no hex.
- Run token tests with `pnpm --filter @chameleon-labs/lattice-tokens test:unit`, react unit tests with `pnpm --filter @chameleon-labs/lattice-react test:unit`, browser tests with `test:browser`.
- The tokens package must be rebuilt (`pnpm --filter @chameleon-labs/lattice-tokens build`) before react tests see new tokens.

## Two deviations from the spec, decided during planning

Both are recorded here so the implementer does not "fix" them back:

1. **The `ui` role keeps `lineHeight: 'snug'`.** The spec said `normal`. At 16px, `normal` (1.5) gives a 24px line box and a ~42px control; `snug` (1.375) gives 22px and a ~40px control, which is nearer Kontur's measured 38px. Change font size and weight only.
2. **`--lat-scrim` is neutral black, not grey 12.** `elevation.ts` already established that a neutral shadow and a hue-tinted one differ by at most 1.019 contrast — under 2% — so the scrim follows the shadow precedent and uses `oklch(0 0 0 / …)`. This avoids a `color-mix` indirection for no measurable gain.

---

### Task 1: Radius `xl` and the `dialog` container

**Files:**
- Modify: `packages/tokens/config/layout.ts`
- Test: `packages/tokens/tests/layout.test.ts`

**Interfaces:**
- Produces: `RADII.xl = 1`, `CONTAINERS.dialog = 37.5`, and a second entry in `NESTED_RADIUS_PAIRINGS`. Later tasks reference `var(--lat-radius-xl)` and `var(--lat-container-dialog)`.

- [ ] **Step 1: Update the failing contract test**

In `packages/tokens/tests/layout.test.ts`, replace the body of the `carries the exact breakpoints, containers and radii` test:

```ts
  it('carries the exact breakpoints, containers and radii', () => {
    expect(BREAKPOINTS).toEqual({ sm: 30, md: 48, lg: 64, xl: 80 })
    expect(CONTAINERS).toEqual({ prose: 42, content: 64, wide: 80, dialog: 37.5 })
    expect(RADII).toEqual({ none: 0, sm: 0.25, md: 0.5, lg: 0.75, xl: 1, full: 9999 })
  })
```

Add a new test below it that pins the nesting rule:

```ts
  it('keeps every nested radius pairing satisfying inner = outer - gap', () => {
    for (const pairing of NESTED_RADIUS_PAIRINGS) {
      const outer = RADII[pairing.outer]
      const inner = RADII[pairing.inner]
      const gap = SPACES[pairing.gap].rem
      expect(inner, `${pairing.outer} around ${pairing.inner}`).toBeCloseTo(outer - gap, 5)
    }
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @chameleon-labs/lattice-tokens test:unit -- layout`
Expected: FAIL — `CONTAINERS` missing `dialog`, `RADII` missing `xl`.

- [ ] **Step 3: Add the values**

In `packages/tokens/config/layout.ts`:

```ts
export const CONTAINERS = {
  prose: 42,
  content: 64,
  wide: 80,
  /**
   * A dialog is not running text. It was sized by `prose` (42rem), which is a
   * measure chosen for reading, and 600px is where a confirmation stops looking
   * like a page.
   */
  dialog: 37.5
} as const

export const RADII = {
  none: 0,
  sm: 0.25,
  md: 0.5,
  lg: 0.75,
  /** Containers. Controls stay at `md`; the pair is the Quiet Surface shape. */
  xl: 1,
  full: 9999
} as const
```

And extend the pairings:

```ts
export const NESTED_RADIUS_PAIRINGS = [
  { outer: 'lg', gap: '2', inner: 'sm' },
  { outer: 'xl', gap: '2', inner: 'md' }
] as const satisfies readonly NestedRadiusPairing[]
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @chameleon-labs/lattice-tokens test:unit -- layout`
Expected: PASS. If `LAYOUT_PRIMITIVE_COUNTS` assertions fail, update the expected counts in the same file to match the two new primitives.

- [ ] **Step 5: Commit**

```bash
git add packages/tokens/config/layout.ts packages/tokens/tests/layout.test.ts
git commit -m "feat(tokens): add radius xl and the dialog container"
```

---

### Task 2: Retune the `ui` typography role

**Files:**
- Modify: `packages/tokens/config/typography-roles.ts`
- Test: `packages/tokens/tests/typography-roles.test.ts`

**Interfaces:**
- Produces: `--lat-text-ui-font-size` becomes `1rem` and `--lat-text-ui-font-weight` becomes `400`. Eight component call-sites retune with no CSS edit.

- [ ] **Step 1: Update the role expectation**

Find the assertion in `packages/tokens/tests/typography-roles.test.ts` covering the `ui` role and set it to:

```ts
    expect(TYPOGRAPHY_ROLES.ui).toEqual({
      fontFamily: 'sans',
      fontSize: 'base',
      fontWeight: 'regular',
      letterSpacing: 'normal',
      lineHeight: 'snug',
      classification: 'ui'
    })
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @chameleon-labs/lattice-tokens test:unit -- typography-roles`
Expected: FAIL — received `fontSize: 'sm'`, `fontWeight: 'semibold'`.

- [ ] **Step 3: Change the role**

In `packages/tokens/config/typography-roles.ts`:

```ts
  /**
   * Controls. 16px regular rather than 14px semibold: a control that shouts its
   * label is a control competing with the content it acts on. `snug` holds the
   * line box at 22px, which keeps a medium button at 40px.
   */
  ui: {
    fontFamily: 'sans',
    fontSize: 'base',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'snug',
    classification: 'ui'
  },
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @chameleon-labs/lattice-tokens test:unit`
Expected: PASS. `snapshot.test.ts` will also fail here — inspect its diff, confirm it shows only the `ui` role change, and update the snapshot.

- [ ] **Step 5: Commit**

```bash
git add packages/tokens/config/typography-roles.ts packages/tokens/tests/
git commit -m "feat(tokens): retune the ui role to 16px regular"
```

---

### Task 3: The `--lat-ring` and `--lat-scrim` roles

**Files:**
- Modify: `packages/tokens/config/semantic.ts`, `packages/tokens/generate/semantic.ts`
- Test: `packages/tokens/tests/emit.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MODE_ROLES` in the config, `modeRoleAliases(mode): Alias[]` in the generator, and the tokens `--lat-ring` and `--lat-scrim` emitted inside every theme block. Tasks 4–7 depend on both names.

These cannot be `ROLE_ALIASES`: that shape is `{ role, scale, slug }` and always resolves to a step. A ring on light is a translucent black — no step is translucent — and on dark it is an opaque grey step. The value differs in *kind* between modes, which is why it needs its own small table.

- [ ] **Step 1: Write the failing test**

Add to `packages/tokens/tests/emit.test.ts`:

```ts
describe('mode roles', () => {
  it('gives the ring a translucent edge on light and an opaque step on dark', () => {
    expect(modeRoleAliases('light')).toContainEqual({
      name: '--lat-ring',
      value: 'oklch(0 0 0 / 0.16)'
    })
    expect(modeRoleAliases('dark')).toContainEqual({
      name: '--lat-ring',
      value: 'var(--lat-gray-border)'
    })
  })

  it('makes the scrim darker on dark, where the page behind it is already dark', () => {
    expect(modeRoleAliases('light')).toContainEqual({
      name: '--lat-scrim',
      value: 'oklch(0 0 0 / 0.28)'
    })
    expect(modeRoleAliases('dark')).toContainEqual({
      name: '--lat-scrim',
      value: 'oklch(0 0 0 / 0.6)'
    })
  })

  it('emits both roles into every theme block', () => {
    const css = stylesheet(buildScales())
    // Three scopes: [data-lat-theme=light], [data-lat-theme=dark], and the
    // preference-driven block.
    expect(css.match(/--lat-ring:/g)).toHaveLength(3)
    expect(css.match(/--lat-scrim:/g)).toHaveLength(3)
  })
})
```

Import `modeRoleAliases` from `../generate/semantic.js`. Match the existing imports in the file for `stylesheet` and `buildScales`; if the helpers there are named differently, reuse whatever that file already uses to render a full stylesheet.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @chameleon-labs/lattice-tokens test:unit -- emit`
Expected: FAIL — `modeRoleAliases` is not exported.

- [ ] **Step 3: Add the config table**

In `packages/tokens/config/semantic.ts`, after `ON_SOLID_ROLE`:

```ts
/**
 * Roles whose value is a colour rather than a step reference.
 *
 * A step alias cannot express these. The ring is a translucent black on light —
 * no step carries alpha — and on dark a translucent black over a dark surface is
 * invisible, so it becomes an opaque grey step instead. The value differs in kind
 * between modes, not merely in lightness, which is why this table exists beside
 * ROLE_ALIASES rather than inside it.
 *
 * The alphas are neutral black for the same reason the shadows are: measured, a
 * neutral and a hue-tinted overlay differ by at most 1.019 contrast.
 */
export const MODE_ROLES: Readonly<Record<string, Readonly<Record<'light' | 'dark', string>>>> = {
  /** The hairline an edge is drawn with. 0.16 is Kontur's measured alpha. */
  ring: { light: 'oklch(0 0 0 / 0.16)', dark: 'var(--lat-gray-border)' },
  /**
   * What a backdrop is made of. The previous value was grey 1 at 0.8 — 80% of
   * near-white over near-white, which is why an open dialog dimmed nothing.
   */
  scrim: { light: 'oklch(0 0 0 / 0.28)', dark: 'oklch(0 0 0 / 0.6)' }
}

export const MODE_ROLE_NAMES: readonly string[] = Object.keys(MODE_ROLES)
```

Extend `ROLE_NAMES` to include them:

```ts
export const ROLE_NAMES: readonly string[] = [
  ...ROLE_ALIASES.map((alias) => alias.role),
  ON_SOLID_ROLE,
  ...MODE_ROLE_NAMES
]
```

- [ ] **Step 4: Emit them**

In `packages/tokens/generate/semantic.ts`, import `MODE_ROLES` and add:

```ts
/**
 * The roles whose value is a colour rather than a reference.
 *
 * Emitted per scope like every other alias, so a nested `[data-lat-theme]`
 * section gets its own ring rather than inheriting the root's.
 */
export function modeRoleAliases(mode: Mode): Alias[] {
  return Object.entries(MODE_ROLES).map(([role, byMode]) => ({
    name: `--lat-${role}`,
    value: byMode[mode]
  }))
}
```

Include them in `semanticBlock`:

```ts
export function semanticBlock(scales: readonly Scale[], mode: Mode, indent = '  '): string {
  const steps = stepAliases()
  const onSolids = onSolidAliases(scales, mode)
  const roles = roleAliases(scales, mode)
  const modeRoles = modeRoleAliases(mode)
  const declare = (alias: Alias): string => `${indent}${alias.name}: ${alias.value};`

  return [
    steps.map(declare).join('\n'),
    onSolids.map(declare).join('\n'),
    roles.map(declare).join('\n'),
    modeRoles.map(declare).join('\n')
  ].join('\n\n')
}
```

Update the count at the bottom of the file:

```ts
export const ALIAS_COUNT =
  SCALE_NAMES.length * STEPS +
  SCALE_NAMES.length +
  ROLE_ALIASES.length +
  1 +
  MODE_ROLE_NAMES.length
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter @chameleon-labs/lattice-tokens test:unit`
Expected: PASS. Update `snapshot.test.ts` after confirming the diff shows only the two added declarations per block.

- [ ] **Step 6: Commit**

```bash
git add packages/tokens/config/semantic.ts packages/tokens/generate/semantic.ts packages/tokens/tests/
git commit -m "feat(tokens): add the ring and scrim mode roles"
```

---

### Task 4: Mode-aware elevation

**Files:**
- Modify: `packages/tokens/config/elevation.ts`, `packages/tokens/generate/elevation.ts`, `packages/tokens/generate/emit.ts:116`
- Test: `packages/tokens/tests/elevation.test.ts`

**Interfaces:**
- Consumes: `--lat-ring` from Task 3.
- Produces: `ElevationLevel.surface` becomes `Readonly<Record<Mode, string>>`; `elevationCss(mode: Mode, indent?: string)` and `elevationTokens(mode)` keep their names but read the per-mode surface. `--lat-elevation-*-border` now resolves to `var(--lat-ring)` in both modes.

**Why only the surface is per-mode.** `--lat-ring` is itself mode-aware, so `--lat-elevation-modal-border: var(--lat-ring)` is *identical text* in every theme block and resolves differently in each — the same per-scope indirection the semantic tier already relies on. Only `surface` needs a genuine per-mode value. This keeps components mode-agnostic: a component draws one ring and never asks which theme it is in.

- [ ] **Step 1: Write the failing test**

Replace the `assigns the approved signals to each level` test in `packages/tokens/tests/elevation.test.ts`:

```ts
  it('assigns the approved signals to each level', () => {
    expect(ELEVATION_LEVELS).toEqual([
      { level: 'flat', surface: { light: 'bg', dark: 'bg' } },
      {
        level: 'raised',
        surface: { light: 'bg', dark: 'bg-subtle' },
        border: 'ring',
        shadow: 'small'
      },
      {
        level: 'overlay',
        surface: { light: 'bg', dark: 'bg-subtle' },
        border: 'ring',
        shadow: 'medium'
      },
      {
        level: 'modal',
        surface: { light: 'bg', dark: 'component' },
        border: 'ring',
        shadow: 'large'
      }
    ])
  })

  // The #30 calibration: a shadow is worth 1.315:1 on light and 1.016:1 on dark.
  // Light may therefore let the page white carry every level; dark may not, and
  // must keep a distinct surface step under everything above `flat`.
  it('keeps every dark level above flat on a surface step distinct from the page', () => {
    for (const level of ELEVATION_LEVELS) {
      if (level.level === 'flat') continue
      expect(level.surface.dark, level.level).not.toBe('bg')
    }
  })

  it('lets light rely on the page white at every level', () => {
    for (const level of ELEVATION_LEVELS) {
      expect(level.surface.light, level.level).toBe('bg')
    }
  })

  it('draws every edge with the ring, so a component never asks which mode it is in', () => {
    const light = elevationCss('light')
    const dark = elevationCss('dark')

    expect(light).toContain('--lat-elevation-modal-border: var(--lat-ring);')
    expect(dark).toContain('--lat-elevation-modal-border: var(--lat-ring);')
    expect(light).toContain('--lat-elevation-modal-surface: var(--lat-gray-bg);')
    expect(dark).toContain('--lat-elevation-modal-surface: var(--lat-gray-component);')
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @chameleon-labs/lattice-tokens test:unit -- elevation`
Expected: FAIL — `surface` is a string, and `elevationCss` takes no mode.

- [ ] **Step 3: Change the config shape**

In `packages/tokens/config/elevation.ts`, import `Mode` and rewrite the interface and table:

```ts
import type { Mode } from './lightness.js'

export interface ElevationLevel {
  readonly level: string
  /**
   * The surface step, per mode.
   *
   * Light lets the page white carry every level: a shadow is worth 1.315:1
   * there, which is enough to lift a white card off a white page, and the ring
   * supplies the edge. Dark cannot — a shadow is worth 1.016:1, which is
   * nothing — so every dark level above `flat` keeps a distinct surface step,
   * exactly as it did before this direction.
   */
  readonly surface: Readonly<Record<Mode, string>>
  /**
   * The edge. Always the ring, which is itself mode-aware: translucent black on
   * light, an opaque grey step on dark. Optional because `flat` has no edge.
   */
  readonly border?: 'ring'
  readonly shadow?: ShadowName
}

export const ELEVATION_LEVELS: readonly ElevationLevel[] = [
  { level: 'flat', surface: { light: 'bg', dark: 'bg' } },
  {
    level: 'raised',
    surface: { light: 'bg', dark: 'bg-subtle' },
    border: 'ring',
    shadow: 'small'
  },
  {
    level: 'overlay',
    surface: { light: 'bg', dark: 'bg-subtle' },
    border: 'ring',
    shadow: 'medium'
  },
  {
    level: 'modal',
    surface: { light: 'bg', dark: 'component' },
    border: 'ring',
    shadow: 'large'
  }
]
```

- [ ] **Step 4: Change the generator**

In `packages/tokens/generate/elevation.ts`:

```ts
export function elevationCss(mode: Mode, indent = '  '): string {
  const lines: string[] = []

  for (const level of ELEVATION_LEVELS) {
    lines.push(
      `${indent}--lat-elevation-${level.level}-surface: ` +
        `var(--lat-${ELEVATION_SCALE}-${level.surface[mode]});`
    )
    if (level.border) {
      lines.push(`${indent}--lat-elevation-${level.level}-border: var(--lat-ring);`)
    }
    if (level.shadow) {
      lines.push(`${indent}--lat-elevation-${level.level}-shadow: var(--lat-shadow-${level.shadow});`)
    }
  }

  return lines.join('\n')
}
```

And in `elevationTokens(mode)`, change the surface reference and the border:

```ts
    const signals: Record<string, ElevationReference> = {
      surface: {
        $type: 'color',
        $value: `{${mode}.${ELEVATION_SCALE}.${level.surface[mode]}}`
      }
    }
    if (level.border) {
      signals['border'] = { $type: 'color', $value: `{${mode}.ring}` }
    }
```

Update the doc comment above `elevationCss` — it currently claims the function "takes no mode", which stops being true.

- [ ] **Step 5: Pass the mode at the call site**

In `packages/tokens/generate/emit.ts:116`, change `elevationCss()` to `elevationCss(mode)`.

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm --filter @chameleon-labs/lattice-tokens test:unit && pnpm --filter @chameleon-labs/lattice-tokens build`
Expected: PASS, and the build emits. Update `snapshot.test.ts` after confirming the diff shows only elevation surface/border changes.

- [ ] **Step 7: Commit**

```bash
git add packages/tokens/
git commit -m "feat(tokens): make elevation mode-aware"
```

---

### Task 5: Re-verify the contrast contracts

**Files:**
- Modify: `packages/tokens/config/contracts.ts` (only if the measurement says so)
- Test: `packages/tokens/tests/contrast.test.ts`

**Interfaces:**
- Consumes: Task 4's surfaces.
- Produces: either a confirmation that the existing contracts still bound the worst case, or an added contract.

`CONTRACTS` measures text steps 11 and 12 against step 2 as the worst case, on the stated grounds that "step 2 is lighter than step 1 in dark mode and darker in light mode". Task 4 makes step 1 a surface that text actually sits on in light mode, so that reasoning needs re-checking rather than assuming.

- [ ] **Step 1: Write the test that measures both references**

Add to `packages/tokens/tests/contrast.test.ts`:

```ts
  it('keeps both text steps legible on step 1, now that light surfaces use it', () => {
    for (const mode of MODES) {
      for (const name of SCALE_NAMES) {
        const scale = scales.find((s) => s.name === name && s.mode === mode)!
        const step1 = scale.steps[0]
        for (const index of [10, 11]) {
          const ratio = contrast(scale.steps[index], step1)
          expect(ratio, `${name} ${mode} step ${index + 1} on step 1`).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  })
```

Reuse whatever helper the file already uses to build scales and measure contrast; match its existing imports rather than inventing names.

- [ ] **Step 2: Run it**

Run: `pnpm --filter @chameleon-labs/lattice-tokens test:unit -- contrast`

- [ ] **Step 3: Act on the result**

- **If it passes:** step 2 was indeed the worst case; leave `contracts.ts` untouched and keep the test as a regression guard.
- **If it fails:** step 1 is the worse reference in light mode. Add `{ step: 11, reference: 1, minimum: 4.5 }` and `{ step: 12, reference: 1, minimum: 4.5 }` to `CONTRACTS`, let the solver re-seat the steps, and update the comment above `CONTRACTS` to say which reference is worst in which mode. **Do not adjust a colour by hand to make this pass** — the contract is the thing that moves.

- [ ] **Step 4: Commit**

```bash
git add packages/tokens/
git commit -m "test(tokens): verify text contrast against the new light surfaces"
```

---

### Task 6: Dialog

**Files:**
- Modify: `packages/react/src/dialog/dialog.css`, `packages/react/src/dialog/dialog.tsx`, `packages/react/src/dialog/dialog.stories.tsx`
- Test: `packages/react/tests/dialog.test.tsx`

**Interfaces:**
- Consumes: `--lat-radius-xl`, `--lat-container-dialog`, `--lat-scrim`, `--lat-ring`, `--lat-elevation-modal-*`.
- Produces: `.lat-dialog__body` and `.lat-dialog__footer` class names, used by the stories and by consumers.

- [ ] **Step 1: Write the failing test**

Add to `packages/react/tests/dialog.test.tsx`:

```tsx
it('gives unclassed content the sans stack rather than the browser serif', () => {
  render(
    <DialogProvider defaultOpen>
      <Dialog>
        <DialogHeading>Remove this page?</DialogHeading>
        <p>This cannot be undone.</p>
      </Dialog>
    </DialogProvider>
  )

  const paragraph = screen.getByText('This cannot be undone.')
  expect(getComputedStyle(paragraph).fontFamily).not.toMatch(/times|serif/i)
})

it('renders a dismiss control that carries its own styling hook', () => {
  render(
    <DialogProvider defaultOpen>
      <Dialog>
        <DialogHeading>Remove this page?</DialogHeading>
        <DialogDismiss aria-label="Close" />
      </Dialog>
    </DialogProvider>
  )

  expect(screen.getByLabelText('Close')).toHaveClass('lat-dialog__dismiss')
})
```

Match the imports and render helper the file already uses.

- [ ] **Step 2: Run to verify the font test fails**

Run: `pnpm --filter @chameleon-labs/lattice-react test:unit -- dialog`
Expected: the font-family assertion FAILS (jsdom may report an empty string — if it does, move this assertion into `packages/react/tests/browser/a11y.spec.ts` as a Playwright check against the `Dialog/Open` story, where computed styles are real, and keep the class-name test here).

- [ ] **Step 3: Rewrite the stylesheet**

Replace `packages/react/src/dialog/dialog.css`:

```css
.lat-dialog__backdrop {
  position: fixed;
  inset: 0;
  /* Was gray-1 at 0.8 — eighty percent of near-white over near-white, which is
     why an open dialog dimmed nothing. The scrim is a colour, not an opacity. */
  background-color: var(--lat-scrim);
}

.lat-dialog {
  position: fixed;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  /* Static: this is where the dialog *is*, not motion. Centring must hold under
     prefers-reduced-motion: reduce exactly as it does otherwise. */
  transform: translate(-50%, -50%);

  inline-size: min(var(--lat-container-dialog), calc(100vw - var(--lat-space-8)));
  max-block-size: calc(100vh - var(--lat-space-8));
  overflow-y: auto;

  display: flex;
  flex-direction: column;

  /* Unclassed content inside a surface used to fall through to the browser
     serif, because typography only ever landed on an explicit role class. */
  font-family: var(--lat-text-body-font-family);
  color: var(--lat-text);

  background-color: var(--lat-elevation-modal-surface);
  border-radius: var(--lat-radius-xl);
  /* The edge is a ring, not a border: it occupies no layout, so nothing shifts
     when a state thickens it. */
  box-shadow:
    0 0 0 1px var(--lat-elevation-modal-border),
    var(--lat-elevation-modal-shadow);

  opacity: 0;
  transition-property: opacity;
  transition-duration: var(--lat-duration-slower);
  transition-timing-function: var(--lat-easing-entrance);
}

.lat-dialog[data-enter] {
  opacity: 1;
}

.lat-dialog__body {
  display: flex;
  flex-direction: column;
  gap: var(--lat-space-4);
  padding: var(--lat-space-6) var(--lat-space-8);
}

.lat-dialog__footer {
  display: flex;
  gap: var(--lat-space-3);
  padding: var(--lat-space-5) var(--lat-space-8);
  /* Structural: it divides the terminal actions from the content, so it is a
     border rather than a ring. */
  border-block-start: 1px solid var(--lat-ring);
}

.lat-dialog__heading {
  margin: 0;
  font-family: var(--lat-text-heading-3-font-family);
  font-size: var(--lat-text-heading-3-font-size);
  font-weight: var(--lat-text-heading-3-font-weight);
  line-height: var(--lat-text-heading-3-line-height);
  color: var(--lat-text);
}

.lat-dialog__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--lat-space-8);
  block-size: var(--lat-space-8);
  padding: 0;
  background: none;
  border: 0;
  border-radius: var(--lat-radius-md);
  color: var(--lat-text-subtle);
  cursor: pointer;
  transition-property: background-color, color;
  transition-duration: var(--lat-duration-fast);
  transition-timing-function: var(--lat-easing-standard);
}

.lat-dialog__dismiss:hover {
  background-color: var(--lat-component-hover);
  color: var(--lat-text);
}

.lat-dialog:focus-visible,
.lat-dialog__dismiss:focus-visible {
  outline: 2px solid var(--lat-focus-ring);
  outline-offset: 2px;
}

/* The entrance lift is movement, so it is authored only where movement is
   welcome. Under `reduce` the dialog still fades in and is still centred. */
@media (prefers-reduced-motion: no-preference) {
  .lat-dialog {
    transition-property: opacity, transform;
    transform: translate(-50%, calc(-50% + var(--lat-space-2)));
  }

  .lat-dialog[data-enter] {
    transform: translate(-50%, -50%);
  }
}
```

- [ ] **Step 4: Update the stories to use the regions**

In `packages/react/src/dialog/dialog.stories.tsx`, rewrite `Confirmation` so the footer and dismiss are exercised — the accessibility sweep only scans what a story renders:

```tsx
function Confirmation() {
  return (
    <>
      <div className="lat-dialog__body">
        <div className="lat-story__row" style={{ justifyContent: 'space-between' }}>
          <DialogHeading>Remove this page?</DialogHeading>
          <DialogDismiss className="lat-dialog__dismiss" aria-label="Close">
            ✕
          </DialogDismiss>
        </div>
        <p>This cannot be undone. Its audit history is removed with it.</p>
      </div>
      <div className="lat-dialog__footer">
        <DialogDismiss render={<Button variant="solid" tone="danger" />}>Remove</DialogDismiss>
        <DialogDismiss render={<Button tone="neutral" />}>Cancel</DialogDismiss>
      </div>
    </>
  )
}
```

Note the button order: the destructive action leads, cancel follows. Kontur's rule is that actions run left to right by importance, and the existing story had it reversed.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @chameleon-labs/lattice-tokens build && pnpm --filter @chameleon-labs/lattice-react test:unit -- dialog`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/react/src/dialog/ packages/react/tests/dialog.test.tsx
git commit -m "feat(react): rebuild the dialog on the quiet surface"
```

---

### Task 7: Button — neutral default and the ring

**Files:**
- Modify: `packages/react/src/button/button.css`, `packages/react/src/button/button.tsx`
- Test: `packages/react/tests/button.test.tsx`

**Interfaces:**
- Consumes: `--lat-ring`, the retuned `ui` role.
- Produces: a button whose default tone is `neutral`. Every other component that renders a `Button` inherits this.

**This is the breaking change.** A `<Button variant="solid">` with no tone rendered violet and now renders near-black. That is the point of the direction — colour becomes something a caller asks for — but it needs a changelog note, not a silent ship.

- [ ] **Step 1: Write the failing test**

Add to `packages/react/tests/button.test.tsx`:

```tsx
it('defaults to the neutral tone, so colour is something a caller asks for', () => {
  render(<Button variant="solid">Save changes</Button>)
  expect(screen.getByRole('button')).toHaveAttribute('data-tone', 'neutral')
})

it('still honours an explicit accent', () => {
  render(
    <Button variant="solid" tone="accent">
      Publish
    </Button>
  )
  expect(screen.getByRole('button')).toHaveAttribute('data-tone', 'accent')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @chameleon-labs/lattice-react test:unit -- button`
Expected: FAIL — received `data-tone="accent"`.

- [ ] **Step 3: Flip the default**

In `packages/react/src/button/button.tsx`, change the `tone` default from `'accent'` to `'neutral'`. Keep the prop's type unchanged.

- [ ] **Step 4: Convert the edge to a ring**

In `packages/react/src/button/button.css`, replace the `border` declaration in `.lat-button`:

```css
  /* The edge is a ring: box-shadow occupies no layout, so a hover or a focus
     state can thicken it without moving the control beside it. */
  border: 0;
  box-shadow: 0 0 0 1px transparent;
```

Give the soft and ghost variants their ring, and leave `solid` without one:

```css
.lat-button[data-variant='soft'] {
  background-color: var(--_component);
  color: var(--_text);
  box-shadow: 0 0 0 1px var(--lat-ring);
}
```

Keep `:focus-visible` exactly as it is — an `outline`, not a shadow. `box-shadow` does not render in Windows High Contrast Mode, and `tests/browser/a11y.spec.ts` has a forced-colors check that would be right to fail it.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @chameleon-labs/lattice-react test:unit`
Expected: PASS. Several component tests may assert violet defaults — update each to name `tone="accent"` explicitly where the intent was the accent.

- [ ] **Step 6: Commit**

```bash
git add packages/react/src/button/ packages/react/tests/
git commit -m "feat(react)!: default the button to the neutral tone"
```

---

### Task 8: Ring conversion across the remaining components

**Files:**
- Modify: `packages/react/src/badge/badge.css`, `callout/callout.css`, `card/card.css`, `disclosure/disclosure.css`, `input/input.css`, `menu/menu.css`, `switch/switch.css`
- Test: `packages/react/tests/css-contract.test.ts`, `packages/react/tests/stylesheet.test.ts`

**Interfaces:**
- Consumes: `--lat-ring`, `--lat-radius-xl`.
- Produces: no new names.

**Do not convert `table/table.css` or `tabs/tabs.css`.** Their borders are structural — row rules and the tab underline divide content rather than bound a component. Rings are for the edges of things.

- [ ] **Step 1: Write the guard test**

Add to `packages/react/tests/stylesheet.test.ts`:

```ts
it('draws component edges with the ring rather than a resting border', () => {
  const bounded = ['badge', 'callout', 'card', 'disclosure', 'input', 'menu', 'switch']

  for (const family of bounded) {
    const css = readFileSync(
      new URL(`../src/${family}/${family}.css`, import.meta.url),
      'utf8'
    )
    expect(css, `${family} should not draw a resting edge with a border colour token`)
      .not.toMatch(/border:\s*1px solid var\(--lat-border/)
  }
})
```

Match the file's existing import style for reading stylesheets.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @chameleon-labs/lattice-react test:unit -- stylesheet`
Expected: FAIL, naming the families still using a border.

- [ ] **Step 3: Convert each family**

For each of the seven, replace a resting edge of the form:

```css
  border: 1px solid var(--lat-border);
```

with:

```css
  border: 0;
  box-shadow: 0 0 0 1px var(--lat-ring);
```

Where a component already carries a shadow, compose rather than replace:

```css
  box-shadow:
    0 0 0 1px var(--lat-ring),
    var(--lat-elevation-raised-shadow);
```

Move container radii to `xl`: `card`, `menu` and `callout` outer surfaces take `var(--lat-radius-xl)`. Controls — `input`, `switch`, `badge` — stay at `md` or `full` as they are today.

Add `font-family: var(--lat-text-body-font-family)` to `card` and `callout` content regions, for the same reason the dialog needed it.

Where a component's hover thickens its edge, express it as a wider ring rather than a border-width change:

```css
.lat-input:hover {
  box-shadow: 0 0 0 1px var(--lat-border-interactive);
}
```

- [ ] **Step 4: Run every check**

Run: `pnpm --filter @chameleon-labs/lattice-react test:unit`
Expected: PASS, including `css-contract.test.ts` — if it reports a colour literal, the fix is a token, never an inline `oklch()`.

- [ ] **Step 5: Commit**

```bash
git add packages/react/src/
git commit -m "feat(react): draw component edges with the ring"
```

---

### Task 9: Verify the whole system

**Files:**
- Modify: none expected
- Test: `packages/react/tests/browser/a11y.spec.ts`

- [ ] **Step 1: Build everything**

Run: `pnpm build`
Expected: both packages build clean.

- [ ] **Step 2: Run every test in the monorepo**

Run: `pnpm test`
Expected: PASS. The forced-colors test is the one that matters most — it is the check proving the ring conversion did not weaken focus.

- [ ] **Step 3: Look at it**

Run: `pnpm storybook`, then compare the `Dialog/Open` story against the design mockup. Check both themes with the toolbar's theme switch. **Dark mode is the specific risk**: confirm every elevated surface is still distinguishable from the page behind it, since that is the property Task 4 was written to protect.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(react): quiet surface follow-ups from the visual pass"
```

---

## Self-Review

**Spec coverage.** Radius `xl` → Task 1. `ui` role → Task 2. Ring and scrim tokens → Task 3. Mode-aware elevation → Task 4. Contrast contract re-run → Task 5. Dialog (surface, radius, width, padding, footer hairline, dismiss, scrim) → Task 6. Button neutral default → Task 7. Ring conversion, container radii, structural-border exemption → Task 8. Times fix → Tasks 6 and 8. Focus-stays-outline → Tasks 6, 7, 9. Testing section → Tasks 5 and 9. Out-of-scope items are absent from the plan, as intended.

**Type consistency.** `elevationCss(mode)` is defined in Task 4 and called in Task 4's own emit change; `modeRoleAliases(mode)` is defined in Task 3 and consumed by Task 4's `var(--lat-ring)` output; `ElevationLevel.surface` changes shape in Task 4 and every reader in the same task. `--lat-container-dialog` from Task 1 is used in Task 6. `.lat-dialog__body` / `.lat-dialog__footer` are introduced in Task 6 and used only there.

**Known softness, flagged rather than hidden.** Three steps say "match the file's existing imports/helpers" instead of naming them — Task 3 Step 1, Task 5 Step 1, Task 8 Step 1 — because the exact helper names in `emit.test.ts`, `contrast.test.ts` and `stylesheet.test.ts` were not read while planning. The implementer should open each file first. Task 6 Step 2 carries a documented fallback if jsdom reports no computed font-family.
