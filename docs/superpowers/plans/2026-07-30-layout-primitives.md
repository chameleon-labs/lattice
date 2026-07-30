# Layout Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the approved spacing, breakpoint, container and radius primitive vocabulary once in Lattice CSS and DTCG JSON.

**Architecture:** A dedicated `config/layout.ts` owns the reviewed values and radius-pairing contract. A matching `generate/layout.ts` converts that config into 28 CSS custom properties and four DTCG dimension groups; `generate/emit.ts` only composes that output into the existing global tier.

**Tech Stack:** TypeScript 7, Vitest 4, DTCG 2025.10 schema validation, pnpm.

## Global Constraints

- Work only on `feat/layout-primitives`; never commit implementation work to `main`.
- Use `global.space.*`, `global.breakpoint.*`, `global.container.*` and `global.radius.*` in DTCG.
- Mirror those paths as `--lat-space-*`, `--lat-breakpoint-*`, `--lat-container-*` and `--lat-radius-*` in CSS.
- Publish fractional spacing steps as `0-5` and `1-5`; DTCG token names cannot contain `.`.
- Emit exactly 16 spacing steps, 4 breakpoints, 3 containers and 5 radii: 28 primitives total.
- Every emitted value is a numeric DTCG `dimension` with unit `rem`.
- Do not emit a `full` container or any keyword-valued dimension token.
- Preserve `radius.full` as the `9999rem` sentinel.
- Semantic inset and gap mappings, elevation, shadows and motion remain out of scope.
- Keep implementation changes uncommitted and unpushed until the user reviews the complete local diff and explicitly approves it.
- After approval, use small commits without co-author trailers or AI/generated-by attribution.

---

## File Map

**Create**

- `packages/tokens/config/layout.ts` — reviewed primitive values and the documented nested-radius pairing.
- `packages/tokens/generate/layout.ts` — CSS/DTCG conversion and derived counts.
- `packages/tokens/tests/layout.test.ts` — exact values, arithmetic, ordering, naming and direct generator parity.

**Modify**

- `packages/tokens/generate/emit.ts` — compose layout output into the global CSS and DTCG tiers.
- `packages/tokens/tests/emit.test.ts` — global counts, layout parity and global-only scope.
- `packages/tokens/tests/schema.test.ts` — positive layout dimension validation.
- `packages/tokens/tests/snapshot.test.ts` — require representative layout paths.
- `packages/tokens/tests/__snapshots__/lattice.css` — reviewed generated CSS.
- `packages/tokens/tests/__snapshots__/tokens.paths.txt` — reviewed generated DTCG shape.
- `README.md` — move primitive spacing/sizing/radii into current scope.
- `docs/superpowers/plans/2026-07-30-layout-primitives.md` — track execution evidence.

---

### Task 1: Typed layout contracts

**Files:**

- Create: `packages/tokens/config/layout.ts`
- Create: `packages/tokens/tests/layout.test.ts`

**Interfaces:**

- Produces:
  - `SPACES`
  - `BREAKPOINTS`
  - `CONTAINERS`
  - `RADII`
  - `NESTED_RADIUS_PAIRINGS`
  - `SpaceName`, `BreakpointName`, `ContainerName`, `RadiusName`
- Consumed by: `generate/layout.ts` and direct contract tests.

- [ ] **Step 1: Write the failing exact-contract tests**

Create `packages/tokens/tests/layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  BREAKPOINTS,
  CONTAINERS,
  NESTED_RADIUS_PAIRINGS,
  RADII,
  SPACES
} from '../config/layout.js'

describe('layout primitive contracts', () => {
  it('carries the exact sixteen-step spacing scale', () => {
    expect(SPACES).toEqual({
      '0': { multiplier: 0, rem: 0 },
      '0-5': { multiplier: 0.5, rem: 0.125 },
      '1': { multiplier: 1, rem: 0.25 },
      '1-5': { multiplier: 1.5, rem: 0.375 },
      '2': { multiplier: 2, rem: 0.5 },
      '3': { multiplier: 3, rem: 0.75 },
      '4': { multiplier: 4, rem: 1 },
      '5': { multiplier: 5, rem: 1.25 },
      '6': { multiplier: 6, rem: 1.5 },
      '8': { multiplier: 8, rem: 2 },
      '10': { multiplier: 10, rem: 2.5 },
      '12': { multiplier: 12, rem: 3 },
      '16': { multiplier: 16, rem: 4 },
      '20': { multiplier: 20, rem: 5 },
      '24': { multiplier: 24, rem: 6 },
      '32': { multiplier: 32, rem: 8 }
    })
  })

  it('carries the exact breakpoints, containers and radii', () => {
    expect(BREAKPOINTS).toEqual({ sm: 30, md: 48, lg: 64, xl: 80 })
    expect(CONTAINERS).toEqual({ prose: 42, content: 64, wide: 80 })
    expect(RADII).toEqual({ none: 0, sm: 0.25, md: 0.5, lg: 0.75, full: 9999 })
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/layout.test.ts
```

Expected: FAIL because `config/layout.ts` does not exist.

- [ ] **Step 3: Implement the typed config**

Create `packages/tokens/config/layout.ts`:

```ts
export interface SpaceValue {
  readonly multiplier: number
  readonly rem: number
}

export const SPACES = {
  '0': { multiplier: 0, rem: 0 },
  '0-5': { multiplier: 0.5, rem: 0.125 },
  '1': { multiplier: 1, rem: 0.25 },
  '1-5': { multiplier: 1.5, rem: 0.375 },
  '2': { multiplier: 2, rem: 0.5 },
  '3': { multiplier: 3, rem: 0.75 },
  '4': { multiplier: 4, rem: 1 },
  '5': { multiplier: 5, rem: 1.25 },
  '6': { multiplier: 6, rem: 1.5 },
  '8': { multiplier: 8, rem: 2 },
  '10': { multiplier: 10, rem: 2.5 },
  '12': { multiplier: 12, rem: 3 },
  '16': { multiplier: 16, rem: 4 },
  '20': { multiplier: 20, rem: 5 },
  '24': { multiplier: 24, rem: 6 },
  '32': { multiplier: 32, rem: 8 }
} as const satisfies Readonly<Record<string, SpaceValue>>

export const BREAKPOINTS = {
  sm: 30,
  md: 48,
  lg: 64,
  xl: 80
} as const

export const CONTAINERS = {
  prose: 42,
  content: 64,
  wide: 80
} as const

export const RADII = {
  none: 0,
  sm: 0.25,
  md: 0.5,
  lg: 0.75,
  full: 9999
} as const

export type SpaceName = keyof typeof SPACES
export type BreakpointName = keyof typeof BREAKPOINTS
export type ContainerName = keyof typeof CONTAINERS
export type RadiusName = keyof typeof RADII

export interface NestedRadiusPairing {
  readonly outer: RadiusName
  readonly gap: SpaceName
  readonly inner: RadiusName
}

export const NESTED_RADIUS_PAIRINGS = [
  { outer: 'lg', gap: '2', inner: 'sm' }
] as const satisfies readonly NestedRadiusPairing[]
```

- [ ] **Step 4: Add arithmetic, ordering and scope tests**

Append to `layout.test.ts`:

```ts
it('keeps every spacing value equal to its multiplier times one quarter rem', () => {
  for (const [name, space] of Object.entries(SPACES)) {
    expect(space.rem, name).toBe(space.multiplier * 0.25)
  }
})

it('keeps breakpoints unique and ascending', () => {
  const values: readonly number[] = Object.values(BREAKPOINTS)

  expect(new Set(values).size).toBe(values.length)
  expect(values).toEqual([...values].sort((left, right) => left - right))
})

it('keeps containers finite and omits a full token', () => {
  expect(Object.keys(CONTAINERS)).toEqual(['prose', 'content', 'wide'])
  expect(Object.values(CONTAINERS).every(Number.isFinite)).toBe(true)
  expect(CONTAINERS).not.toHaveProperty('full')
})

it('derives every documented finite inner radius from outer minus gap', () => {
  expect(NESTED_RADIUS_PAIRINGS).toEqual([{ outer: 'lg', gap: '2', inner: 'sm' }])

  for (const pairing of NESTED_RADIUS_PAIRINGS) {
    expect(RADII[pairing.inner]).toBe(RADII[pairing.outer] - SPACES[pairing.gap].rem)
    expect(pairing.outer).not.toBe('full')
    expect(pairing.inner).not.toBe('full')
  }
  expect(RADII.full).toBe(9999)
})

it('uses DTCG-safe public slugs for every spacing step', () => {
  expect(Object.keys(SPACES)).toContain('0-5')
  expect(Object.keys(SPACES)).toContain('1-5')
  expect(Object.keys(SPACES).some((name) => name.includes('.'))).toBe(false)
})
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
pnpm exec vitest run tests/layout.test.ts
pnpm run typecheck
```

Expected: all layout contract tests and TypeScript pass.

- [ ] **Step 6: Mutation-check the contracts**

Apply one temporary mutation at a time:

1. Change space `1-5` from `0.375` to `0.5`; the exact scale and multiplier test must fail.
2. Change breakpoint `lg` from `64` to `48`; the exact value and uniqueness tests must fail.
3. Add `full: 9999` to `CONTAINERS`; the exact keys and no-full tests must fail.
4. Change `RADII.lg` from `0.75` to `1`; the exact radii and nesting tests must fail.
5. Change `RADII.full` from `9999` to `999`; the exact radii and sentinel tests must fail.

Restore after every mutation and rerun the focused test.

- [ ] **Step 7: Hold the intended commit boundary**

Do not commit yet. Record this intended commit:

```text
Add layout primitive contracts
```

---

### Task 2: CSS and DTCG layout generation

**Files:**

- Create: `packages/tokens/generate/layout.ts`
- Modify: `packages/tokens/tests/layout.test.ts`

**Interfaces:**

- Consumes: all constants from `config/layout.ts`.
- Produces:
  - `DimensionToken`
  - `LayoutTokenGroups`
  - `LAYOUT_PRIMITIVE_COUNTS`
  - `LAYOUT_PRIMITIVE_COUNT`
  - `layoutCss(): string`
  - `layoutTokens(): LayoutTokenGroups`
- Consumed by: `generate/emit.ts` and integrated parity tests.

- [ ] **Step 1: Add failing generator tests**

Append imports:

```ts
import {
  LAYOUT_PRIMITIVE_COUNT,
  LAYOUT_PRIMITIVE_COUNTS,
  layoutCss,
  layoutTokens
} from '../generate/layout.js'
```

Append tests:

```ts
describe('layout primitive generation', () => {
  it('derives the exact family and total counts', () => {
    expect(LAYOUT_PRIMITIVE_COUNTS).toEqual({
      space: 16,
      breakpoint: 4,
      container: 3,
      radius: 5
    })
    expect(LAYOUT_PRIMITIVE_COUNT).toBe(28)
  })

  it('emits exactly one CSS dimension per primitive', () => {
    const css = layoutCss()

    expect(css.match(/--lat-/g)).toHaveLength(28)
    expect(css).toContain('--lat-space-0: 0rem;')
    expect(css).toContain('--lat-space-0-5: 0.125rem;')
    expect(css).toContain('--lat-space-1-5: 0.375rem;')
    expect(css).toContain('--lat-breakpoint-sm: 30rem;')
    expect(css).toContain('--lat-container-prose: 42rem;')
    expect(css).toContain('--lat-radius-full: 9999rem;')
  })

  it('emits four DTCG dimension groups with no keyword value', () => {
    const tokens = layoutTokens()

    expect(Object.keys(tokens)).toEqual(['space', 'breakpoint', 'container', 'radius'])
    expect(tokens.space['0-5']).toEqual({
      $type: 'dimension',
      $value: { value: 0.125, unit: 'rem' }
    })
    expect(tokens.radius.full).toEqual({
      $type: 'dimension',
      $value: { value: 9999, unit: 'rem' }
    })
    expect(JSON.stringify(tokens)).not.toMatch(/"value":"[^"]+"/)
  })
})
```

- [ ] **Step 2: Run and verify RED**

Run:

```bash
pnpm exec vitest run tests/layout.test.ts
```

Expected: FAIL because `generate/layout.ts` does not exist.

- [ ] **Step 3: Implement the generator**

Create `packages/tokens/generate/layout.ts`:

```ts
import { BREAKPOINTS, CONTAINERS, RADII, SPACES } from '../config/layout.js'

export interface DimensionToken {
  readonly $type: 'dimension'
  readonly $value: {
    readonly value: number
    readonly unit: 'rem'
  }
}

export interface LayoutTokenGroups {
  readonly space: Readonly<Record<string, DimensionToken>>
  readonly breakpoint: Readonly<Record<string, DimensionToken>>
  readonly container: Readonly<Record<string, DimensionToken>>
  readonly radius: Readonly<Record<string, DimensionToken>>
}

export const LAYOUT_PRIMITIVE_COUNTS = {
  space: Object.keys(SPACES).length,
  breakpoint: Object.keys(BREAKPOINTS).length,
  container: Object.keys(CONTAINERS).length,
  radius: Object.keys(RADII).length
} as const

export const LAYOUT_PRIMITIVE_COUNT = Object.values(LAYOUT_PRIMITIVE_COUNTS).reduce(
  (total, count) => total + count,
  0
)

const dimensionToken = (value: number): DimensionToken => ({
  $type: 'dimension',
  $value: { value, unit: 'rem' }
})

const dimensionGroup = (
  values: Readonly<Record<string, number>>
): Readonly<Record<string, DimensionToken>> =>
  Object.fromEntries(Object.entries(values).map(([name, value]) => [name, dimensionToken(value)]))

const spaceValues = (): Readonly<Record<string, number>> =>
  Object.fromEntries(Object.entries(SPACES).map(([name, space]) => [name, space.rem]))

const cssGroup = (name: string, values: Readonly<Record<string, number>>): string =>
  Object.entries(values)
    .map(([token, value]) => `  --lat-${name}-${token}: ${value}rem;`)
    .join('\n')

export function layoutCss(): string {
  return [
    cssGroup('space', spaceValues()),
    cssGroup('breakpoint', BREAKPOINTS),
    cssGroup('container', CONTAINERS),
    cssGroup('radius', RADII)
  ].join('\n')
}

export function layoutTokens(): LayoutTokenGroups {
  return {
    space: dimensionGroup(spaceValues()),
    breakpoint: dimensionGroup(BREAKPOINTS),
    container: dimensionGroup(CONTAINERS),
    radius: dimensionGroup(RADII)
  }
}
```

- [ ] **Step 4: Add direct CSS/DTCG parity coverage**

Append:

```ts
it('keeps CSS and DTCG names and values in parity', () => {
  const css = layoutCss()

  for (const [groupName, group] of Object.entries(layoutTokens())) {
    for (const [tokenName, token] of Object.entries(group)) {
      expect(token.$type, `${groupName}.${tokenName}`).toBe('dimension')
      expect(token.$value.unit, `${groupName}.${tokenName}`).toBe('rem')
      expect(css).toContain(
        `--lat-${groupName}-${tokenName}: ${token.$value.value}${token.$value.unit};`
      )
    }
  }
})
```

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
pnpm exec vitest run tests/layout.test.ts
pnpm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Mutation-check generation**

Apply one temporary mutation at a time:

1. Omit the `container` CSS group; the total CSS count and parity test must fail.
2. Emit `px` instead of `rem`; exact CSS and DTCG unit assertions must fail.
3. Rename `space` to `spacing`; the exact group and parity tests must fail.
4. Format fractional names with `.`; the exact CSS and DTCG-safe slug tests must fail.

Restore after every mutation.

- [ ] **Step 7: Hold the intended commit boundary**

Do not commit yet. Record:

```text
Generate global layout primitives
```

---

### Task 3: Published artefact composition and schema coverage

**Files:**

- Modify: `packages/tokens/generate/emit.ts`
- Modify: `packages/tokens/tests/emit.test.ts`
- Modify: `packages/tokens/tests/schema.test.ts`
- Modify: `packages/tokens/tests/snapshot.test.ts`
- Modify: `packages/tokens/tests/__snapshots__/lattice.css`
- Modify: `packages/tokens/tests/__snapshots__/tokens.paths.txt`

**Interfaces:**

- Consumes: every public export from `generate/layout.ts`.
- Produces: 28 global CSS declarations and 28 global DTCG leaves in the published artefacts.

- [ ] **Step 1: Add failing integrated CSS assertions**

In `emit.test.ts`, import:

```ts
import {
  LAYOUT_PRIMITIVE_COUNT,
  LAYOUT_PRIMITIVE_COUNTS,
  layoutCss
} from '../generate/layout.js'
```

Update:

```ts
const GLOBAL_DECLARATIONS =
  TYPOGRAPHY_PRIMITIVE_COUNT +
  TYPOGRAPHY_ROLE_COUNT * TYPOGRAPHY_ROLE_PROPERTY_COUNT +
  LAYOUT_PRIMITIVE_COUNT
```

Add:

```ts
it('emits every layout primitive once in the global rule', () => {
  const [globalBlock] = splitBlocks(css)

  expect(globalBlock).toContain(layoutCss())
  expect(count(layoutCss())).toBe(LAYOUT_PRIMITIVE_COUNT)
  expect(css.match(/--lat-space-0-5:/g)).toHaveLength(1)
  expect(css.match(/--lat-breakpoint-sm:/g)).toHaveLength(1)
  expect(css.match(/--lat-container-prose:/g)).toHaveLength(1)
  expect(css.match(/--lat-radius-full:/g)).toHaveLength(1)
})

it('reports derived layout counts in the generated header', () => {
  expect(css).toContain(
    `/* Layout primitives: ${LAYOUT_PRIMITIVE_COUNTS.space} spacing; ` +
      `${LAYOUT_PRIMITIVE_COUNTS.breakpoint} breakpoints; ` +
      `${LAYOUT_PRIMITIVE_COUNTS.container} containers; ` +
      `${LAYOUT_PRIMITIVE_COUNTS.radius} radii. */`
  )
})
```

- [ ] **Step 2: Add failing JSON scope and parity assertions**

Update the expected leaf count by adding `LAYOUT_PRIMITIVE_COUNT`.

Add:

```ts
it('keeps layout primitives global and out of colour modes', () => {
  const global = tokens['global'] as Record<string, unknown>

  expect(Object.keys(global['space'] as object)).toHaveLength(16)
  expect(Object.keys(global['breakpoint'] as object)).toHaveLength(4)
  expect(Object.keys(global['container'] as object)).toEqual(['prose', 'content', 'wide'])
  expect(Object.keys(global['radius'] as object)).toHaveLength(5)
  expect(tokens['light']).not.toHaveProperty('space')
  expect(tokens['dark']).not.toHaveProperty('space')
})
```

For each group returned by `layoutTokens()`, assert that the matching CSS declaration exists with the same numeric value and `rem` unit.

- [ ] **Step 3: Run integrated tests and verify RED**

Run:

```bash
pnpm exec vitest run tests/emit.test.ts
```

Expected: FAIL because `emit.ts` has not composed layout output.

- [ ] **Step 4: Compose layout CSS and DTCG**

In `generate/emit.ts`, import:

```ts
import {
  LAYOUT_PRIMITIVE_COUNTS,
  layoutCss,
  layoutTokens
} from './layout.js'
```

Add the derived header:

```text
/* Layout primitives: 16 spacing; 4 breakpoints; 3 containers; 5 radii. */
```

Derive every number from `LAYOUT_PRIMITIVE_COUNTS`.

Compose global CSS in this order:

```ts
:root {
${typographyCss()}
${layoutCss()}
${typographyRoleCss()}
}
```

Compose DTCG:

```ts
global: {
  $description:
    'Theme-independent typography and layout primitives, plus semantic typography. Emitted once.',
  ...typographyTokens(),
  ...layoutTokens(),
  text: typographyRoleTokens()
}
```

- [ ] **Step 5: Add positive schema assertions**

In `schema.test.ts`, extend the global value-shape test:

```ts
expect(global['space']?.['0-5']?.$value).toEqual({ value: 0.125, unit: 'rem' })
expect(global['breakpoint']?.['sm']?.$value).toEqual({ value: 30, unit: 'rem' })
expect(global['container']?.['prose']?.$value).toEqual({ value: 42, unit: 'rem' })
expect(global['radius']?.['full']?.$value).toEqual({ value: 9999, unit: 'rem' })
expect(global['container']).not.toHaveProperty('full')
expect(validate(tokens)).toBe(true)
```

The existing negative test for an invalid `em` dimension unit remains the schema mutation gate.

- [ ] **Step 6: Extend representative snapshot-path coverage**

In `snapshot.test.ts`, add these literal path fragments:

```ts
'global.space.0-5',
'global.breakpoint.sm',
'global.container.prose',
'global.radius.full',
```

- [ ] **Step 7: Run integrated and schema tests**

Run:

```bash
pnpm exec vitest run tests/emit.test.ts tests/schema.test.ts
```

Expected: PASS.

- [ ] **Step 8: Observe snapshot failures before updating**

Run:

```bash
pnpm exec vitest run tests/snapshot.test.ts
```

Expected: two snapshot failures showing exactly 28 new CSS declarations and 28 new global DTCG paths, with no colour value, alias or theme selector change.

- [ ] **Step 9: Update and inspect snapshots**

Run:

```bash
pnpm exec vitest run tests/snapshot.test.ts -u
git diff -- packages/tokens/tests/__snapshots__/lattice.css
git diff -- packages/tokens/tests/__snapshots__/tokens.paths.txt
```

Confirm:

- the CSS header adds only the derived layout count;
- the first `:root` gains 28 declarations;
- no light, dark or preference block changes;
- the path snapshot gains only the four approved global groups and 28 leaves.

- [ ] **Step 10: Mutation-check integration scope**

Apply one temporary mutation at a time:

1. Move `layoutCss()` into a themed block; the once-only CSS and block-count tests must fail.
2. Put `layoutTokens()` under `light`; the global-only JSON test and path snapshot must fail.
3. Add a `full` container; exact container keys and scope tests must fail.
4. Replace `radius.full` with a string keyword; direct generator and schema tests must fail.

Restore after every mutation.

- [ ] **Step 11: Hold the intended commit boundary**

Do not commit yet. Record:

```text
Publish global layout primitives
```

---

### Task 4: Documentation and complete verification

**Files:**

- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-30-layout-primitives.md`
- Review: every implementation file changed by Tasks 1–3.

**Interfaces:**

- Produces: accurate package scope, issue coordination evidence and a reviewable uncommitted implementation diff.

- [ ] **Step 1: Update README scope**

Change the scope so primitive spacing, breakpoints, containers and radii are in the token package. Keep semantic spacing, elevation and motion under “Not yet,” and keep components unimplemented.

- [ ] **Step 2: Verify issue coordination**

Confirm:

```bash
gh issue view 28 --repo chameleon-labs/lattice --json state,projectItems,url
```

Expected: issue #28 is open and its `Lattice v1` item is `In Progress`.

- [ ] **Step 3: Run the complete gates**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Expected:

- Vitest reports all unit files passing;
- Playwright reports four Firefox tests passing;
- typecheck and build exit 0;
- the diff has no whitespace errors.

- [ ] **Step 4: Prove deterministic artefacts**

Run:

```bash
pnpm build
shasum -a 256 packages/tokens/dist/lattice.css packages/tokens/dist/tokens.json
pnpm build
shasum -a 256 packages/tokens/dist/lattice.css packages/tokens/dist/tokens.json
```

Expected: both checksum pairs match exactly.

- [ ] **Step 5: Inspect the complete local diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff
```

Confirm:

- only issue #28 files changed;
- generated `dist/` remains ignored;
- no semantic inset/gap, elevation, shadow or motion token was introduced;
- no contributor-specific path, co-author trailer or AI attribution appears.

- [ ] **Step 6: Request implementation review**

Report:

- exact files changed;
- red/green and mutation evidence;
- unit, Firefox, typecheck, build and determinism results;
- any divergence from this plan.

Leave every implementation change uncommitted and unpushed until explicit approval.

- [ ] **Step 7: Create small commits only after approval**

Use these boundaries:

```text
Add layout primitive contracts
Generate global layout primitives
Publish global layout primitives
Document layout primitive support
```

Do not add co-author trailers or AI/generated-by attribution. Push only `feat/layout-primitives`; never push implementation commits directly to `main`.
