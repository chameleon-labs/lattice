# Typography Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement issue #26 by emitting the approved typography families, including an optional Inter stack, sizes, line heights, and weights once in `lattice.css` and under a global DTCG group in `tokens.json`.

**Architecture:** Keep authored values in a focused `config/typography.ts` module and formatting/emission in `generate/typography.ts`. `generate/emit.ts` composes that theme-independent output with the existing colour-mode output; it does not teach the colour generator about typography. The JSON shape gains a top-level `global` group, while `light` and `dark` remain the theme-dependent groups.

**Tech Stack:** TypeScript 7, Vitest 4, pnpm 10, CSS custom properties, DTCG 2025.10 tokens, AJV schema validation.

## Global Constraints

- Follow the approved spec at `docs/superpowers/specs/2026-07-30-lattice-typography-design.md`.
- Work directly in `/Users/george/WebstormProjects/lattice` on `main`; do not create a worktree.
- Do not commit or push until George has reviewed the complete local diff and explicitly approves it.
- Use test-driven development: write each behavior test, observe the intended failure, then add the smallest implementation.
- Typography primitives are theme-independent and must appear exactly once in CSS.
- The system sans stack remains the default. Inter is an opt-in primitive only.
- Inter delivery remains consumer-owned: do not add font files, `@font-face`, a CDN request, or a dependency.
- Sizes are `rem`, are exact multiples of `0.125rem`, and have adjacent ratios within `1.111–1.250`.
- Line heights are unitless. Font weights are exactly 400, 600, and 700.
- Do not implement semantic typography roles or the `40rem` heading step-down; those belong to #27.
- Do not add a runtime dependency.

---

## File Structure

- Create `packages/tokens/config/typography.ts`: the approved family stacks and primitive value tables.
- Create `packages/tokens/generate/typography.ts`: CSS formatting plus DTCG token construction for typography primitives.
- Create `packages/tokens/tests/typography.test.ts`: config contracts and direct emitter behavior.
- Modify `packages/tokens/generate/emit.ts`: compose the global typography block/group into both artefacts.
- Modify `packages/tokens/tests/emit.test.ts`: distinguish global leaves from per-mode colour leaves and pin scope/count behavior.
- Modify `packages/tokens/tests/schema.test.ts`: prove all new DTCG value shapes validate and malformed forms fail.
- Modify `packages/tokens/tests/snapshot.test.ts` snapshots: record the stylesheet and JSON path additions.
- Modify `README.md`, `packages/tokens/package.json`, and the typography spec header: remove stale colour-only/draft wording.

### Task 1: Typography value contract

**Files:**
- Create: `packages/tokens/config/typography.ts`
- Create: `packages/tokens/tests/typography.test.ts`

**Interfaces:**
- Produces: `FONT_FAMILIES`, `FONT_SIZES`, `LINE_HEIGHTS`, `FONT_WEIGHTS`, `FONT_SIZE_GRID_REM`, and `FONT_SIZE_RATIO_RANGE`.
- Consumed later by: `generate/typography.ts`.

- [ ] **Step 1: Write the failing config contract test**

```ts
import { describe, expect, it } from 'vitest'

import {
  FONT_FAMILIES,
  FONT_SIZE_GRID_REM,
  FONT_SIZE_RATIO_RANGE,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS
} from '../config/typography.js'

describe('typography primitives', () => {
  it('carries the approved family stacks in fallback order', () => {
    expect(FONT_FAMILIES.sans).toEqual([
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ])
    expect(FONT_FAMILIES.mono).toEqual([
      'ui-monospace',
      'SFMono-Regular',
      'SF Mono',
      'Menlo',
      'Consolas',
      'Liberation Mono',
      'monospace'
    ])
  })

  it('keeps every size on the 0.125rem grid and inside the ratio band', () => {
    const sizes = Object.values(FONT_SIZES)

    for (const size of sizes) {
      expect(Number.isInteger(size / FONT_SIZE_GRID_REM), String(size)).toBe(true)
    }
    for (let index = 1; index < sizes.length; index++) {
      const ratio = sizes[index]! / sizes[index - 1]!
      expect(ratio).toBeGreaterThanOrEqual(FONT_SIZE_RATIO_RANGE.min)
      expect(ratio).toBeLessThanOrEqual(FONT_SIZE_RATIO_RANGE.max)
    }
  })

  it('uses only unitless line heights and the approved weights', () => {
    expect(LINE_HEIGHTS).toEqual({
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 1.75
    })
    expect(Object.values(LINE_HEIGHTS).every(Number.isFinite)).toBe(true)
    expect(FONT_WEIGHTS).toEqual({ regular: 400, semibold: 600, bold: 700 })
  })
})
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run:

```bash
pnpm --filter @chameleon-labs/lattice-tokens test -- tests/typography.test.ts
```

Expected: FAIL because `../config/typography.js` does not exist.

- [ ] **Step 3: Add the exact approved config**

```ts
export const FONT_FAMILIES = {
  sans: [
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ],
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    'SF Mono',
    'Menlo',
    'Consolas',
    'Liberation Mono',
    'monospace'
  ]
} as const

export const FONT_SIZES = {
  '2xs': 0.625,
  xs: 0.75,
  sm: 0.875,
  base: 1,
  lg: 1.125,
  xl: 1.25,
  '2xl': 1.5,
  '3xl': 1.875,
  '4xl': 2.25
} as const

export const LINE_HEIGHTS = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 1.75
} as const

export const FONT_WEIGHTS = {
  regular: 400,
  semibold: 600,
  bold: 700
} as const

export const FONT_SIZE_GRID_REM = 0.125
export const FONT_SIZE_RATIO_RANGE = { min: 1.111, max: 1.25 } as const
```

- [ ] **Step 4: Run the focused test**

Run:

```bash
pnpm --filter @chameleon-labs/lattice-tokens test -- tests/typography.test.ts
```

Expected: PASS.

- [ ] **Step 5: Hold the commit for user review**

Do not commit. Record the intended commit message for the eventual approved commit:

```text
Typography primitives and global token emission
```

### Task 2: Focused typography emitter

**Files:**
- Create: `packages/tokens/generate/typography.ts`
- Modify: `packages/tokens/tests/typography.test.ts`

**Interfaces:**
- Consumes: the five exports from `config/typography.ts`.
- Produces:
  - `typographyCss(): string`
  - `typographyTokens(): TypographyTokenGroups`
  - `TYPOGRAPHY_PRIMITIVE_COUNT: number`

- [ ] **Step 1: Add failing direct-emission tests**

Append:

```ts
import {
  TYPOGRAPHY_PRIMITIVE_COUNT,
  typographyCss,
  typographyTokens
} from '../generate/typography.js'

it('formats the exact CSS primitive names and values', () => {
  const css = typographyCss()

  expect(css).toContain(
    "--lat-font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, " +
      "'Helvetica Neue', Arial, sans-serif;"
  )
  expect(css).toContain('--lat-font-size-2xs: 0.625rem;')
  expect(css).toContain('--lat-font-size-base: 1rem;')
  expect(css).toContain('--lat-line-height-normal: 1.5;')
  expect(css).toContain('--lat-font-weight-semibold: 600;')
  expect(css.match(/--lat-/g)).toHaveLength(TYPOGRAPHY_PRIMITIVE_COUNT)
})

it('builds mechanically named DTCG groups', () => {
  const tokens = typographyTokens()

  expect(tokens['font-size'].base).toEqual({
    $type: 'dimension',
    $value: { value: 1, unit: 'rem' }
  })
  expect(tokens['line-height'].normal).toEqual({ $type: 'number', $value: 1.5 })
  expect(tokens['font-weight'].semibold).toEqual({ $type: 'fontWeight', $value: 600 })
  expect(tokens.font.sans).toEqual({
    $type: 'fontFamily',
    $value: [...FONT_FAMILIES.sans]
  })
})
```

- [ ] **Step 2: Run and observe the missing-module failure**

Run:

```bash
pnpm --filter @chameleon-labs/lattice-tokens test -- tests/typography.test.ts
```

Expected: FAIL because `generate/typography.ts` does not exist.

- [ ] **Step 3: Implement the focused emitter**

Use these public shapes:

```ts
export interface DimensionToken {
  readonly $type: 'dimension'
  readonly $value: { readonly value: number; readonly unit: 'rem' }
}

export interface NumberToken {
  readonly $type: 'number'
  readonly $value: number
}

export interface FontWeightToken {
  readonly $type: 'fontWeight'
  readonly $value: number
}

export interface FontFamilyToken {
  readonly $type: 'fontFamily'
  readonly $value: readonly string[]
}

export interface TypographyTokenGroups {
  readonly font: Readonly<Record<string, FontFamilyToken>>
  readonly 'font-size': Readonly<Record<string, DimensionToken>>
  readonly 'line-height': Readonly<Record<string, NumberToken>>
  readonly 'font-weight': Readonly<Record<string, FontWeightToken>>
}
```

Implement `typographyCss()` by iterating each config table. Quote only family names containing whitespace:

```ts
const cssFamily = (family: string): string => (family.includes(' ') ? `'${family}'` : family)
```

Set:

```ts
export const TYPOGRAPHY_PRIMITIVE_COUNT =
  Object.keys(FONT_FAMILIES).length +
  Object.keys(FONT_SIZES).length +
  Object.keys(LINE_HEIGHTS).length +
  Object.keys(FONT_WEIGHTS).length
```

Return the four DTCG groups with keys chosen so dropping the leading `global.` from a JSON path mechanically yields its CSS custom-property name:

```text
global.font.sans              -> --lat-font-sans
global.font-size.base         -> --lat-font-size-base
global.line-height.normal     -> --lat-line-height-normal
global.font-weight.semibold   -> --lat-font-weight-semibold
```

- [ ] **Step 4: Run the focused test**

Run:

```bash
pnpm --filter @chameleon-labs/lattice-tokens test -- tests/typography.test.ts
```

Expected: PASS.

- [ ] **Step 5: Mutation-check the direct contracts**

Temporarily make each mutation separately and run the focused test:

1. Change `FONT_SIZES.base` from `1` to `1.0625` — the ratio/grid test must fail.
2. Change `LINE_HEIGHTS.normal` from `1.5` to the string `'1.5rem'` using a temporary cast — the finite/unitless test must fail.
3. Remove the whitespace quoting branch — the CSS family assertion must fail.
4. Omit the `font-weight` group — the DTCG shape assertion must fail.

Restore each mutation before continuing.

### Task 3: Compose typography into both artefacts

**Files:**
- Modify: `packages/tokens/generate/emit.ts`
- Modify: `packages/tokens/tests/emit.test.ts`
- Modify: `packages/tokens/tests/schema.test.ts`

**Interfaces:**
- Consumes: `typographyCss()`, `typographyTokens()`, and `TYPOGRAPHY_PRIMITIVE_COUNT`.
- Preserves: `emitCss(scales): string` and `emitTokens(scales): DesignTokens`.
- Changes JSON root shape: adds `global`; preserves `light` and `dark`.

- [ ] **Step 1: Add failing CSS integration assertions**

Update the block helper to return four blocks: global, light, explicit dark, and preference dark. Locate the light rule with:

```ts
const lightAt = stylesheet.indexOf("\n:root,\n[data-lat-theme='light'] {")
```

Then assert:

```ts
it('declares theme-independent typography once before every themed block', () => {
  const [globalBlock, lightBlock, darkBlock, mediaBlock] = splitBlocks(css)

  expect(count(globalBlock)).toBe(TYPOGRAPHY_PRIMITIVE_COUNT)
  expect(count(lightBlock)).toBe(PER_BLOCK)
  expect(count(darkBlock)).toBe(PER_BLOCK)
  expect(count(mediaBlock)).toBe(PER_BLOCK)
  expect(css.match(/--lat-font-size-base:/g)).toHaveLength(1)
})
```

Change the total CSS declaration assertion to:

```ts
expect(count(css)).toBe(TYPOGRAPHY_PRIMITIVE_COUNT + PER_BLOCK * BLOCKS)
```

- [ ] **Step 2: Run the CSS tests and verify the scope failure**

Run:

```bash
pnpm --filter @chameleon-labs/lattice-tokens test -- tests/emit.test.ts
```

Expected: FAIL because there is no global typography block.

- [ ] **Step 3: Compose the global CSS block**

Import from `./typography.js` and prepend:

```ts
:root {
${typographyCss()}
}

```

Keep the existing colour selectors unchanged after it:

```css
:root,
[data-lat-theme='light'] { … }
```

Rename the internal `block()` helper to `themedBlock()` so its responsibility remains explicit.

- [ ] **Step 4: Add failing JSON integration assertions**

Generalize the leaf walker token type from `ColorToken` to:

```ts
interface TokenLeaf {
  readonly $type: string
  readonly $description?: string
  readonly $value: unknown
}
```

Filter colour leaves by `token.$type === 'color'`, not by `typeof token.$value`, because dimensions also carry object values.

Add:

```ts
it('carries global typography separately from the colour modes', () => {
  const global = tokens['global'] as Record<string, Record<string, TokenLeaf>>

  expect(global['font-size']?.['base']?.$value).toEqual({ value: 1, unit: 'rem' })
  expect(global['line-height']?.['normal']?.$value).toBe(1.5)
  expect(global['font-weight']?.['bold']?.$value).toBe(700)
  expect(tokens['light']).toBeDefined()
  expect(tokens['dark']).toBeDefined()
})
```

Change the total JSON leaf count to:

```ts
expect(leaves()).toHaveLength(TYPOGRAPHY_PRIMITIVE_COUNT + PER_BLOCK * MODES.length)
```

- [ ] **Step 5: Run the JSON tests and verify the missing-global failure**

Run:

```bash
pnpm --filter @chameleon-labs/lattice-tokens test -- tests/emit.test.ts
```

Expected: FAIL because `tokens.global` does not exist.

- [ ] **Step 6: Compose the global DTCG group**

Return:

```ts
return {
  $schema: DTCG_SCHEMA,
  $description:
    'Lattice design tokens. Generated from reviewed config and guarded by build-time contracts. Do not edit by hand.',
  global: {
    $description: 'Theme-independent primitives. Emitted once.',
    ...typographyTokens()
  },
  ...modes
}
```

- [ ] **Step 7: Extend the schema test with positive and negative shapes**

Add:

```ts
it('accepts every typography primitive value shape', () => {
  const global = tokens['global'] as Record<string, Record<string, { $value: unknown }>>

  expect(global.font?.sans?.$value).toBeInstanceOf(Array)
  expect(global['font-size']?.base?.$value).toEqual({ value: 1, unit: 'rem' })
  expect(global['line-height']?.normal?.$value).toBe(1.5)
  expect(global['font-weight']?.bold?.$value).toBe(700)
  expect(validate(tokens)).toBe(true)
})

it('rejects a dimension unit the format cannot represent', () => {
  const broken = structuredClone(tokens) as Record<string, unknown>
  const global = broken.global as Record<string, Record<string, Record<string, unknown>>>
  global['font-size']!.base = {
    $type: 'dimension',
    $value: { value: 1, unit: 'em' }
  }

  expect(validate(broken)).toBe(false)
})
```

- [ ] **Step 8: Run focused integration and schema tests**

Run:

```bash
pnpm --filter @chameleon-labs/lattice-tokens test -- tests/emit.test.ts tests/schema.test.ts
```

Expected: PASS.

- [ ] **Step 9: Mutation-check scope and type discrimination**

1. Move `typographyCss()` inside `themedBlock()` — the one-occurrence and per-block count tests must fail.
2. Remove `global` from `emitTokens()` — the JSON scope and count tests must fail.
3. Revert colour-leaf filtering to `typeof $value === 'object'` — the colour-specific assertions must fail on dimension tokens.
4. Emit one font size with `$type: 'number'` — the direct token assertion or schema test must fail.

Restore each mutation.

### Task 4: Snapshots and public copy

**Files:**
- Modify: `packages/tokens/tests/__snapshots__/lattice.css`
- Modify: `packages/tokens/tests/__snapshots__/tokens.paths.txt`
- Modify: `README.md`
- Modify: `packages/tokens/package.json`
- Modify: `docs/superpowers/specs/2026-07-30-lattice-typography-design.md`

**Interfaces:**
- Produces: the reviewable record of the new artefact shape and accurate public package scope.

- [ ] **Step 1: Run snapshots without update and inspect the intended failure**

Run:

```bash
pnpm --filter @chameleon-labs/lattice-tokens test -- tests/snapshot.test.ts
```

Expected: FAIL with a global typography block added to `lattice.css` and 20 `global.*` token paths added to `tokens.paths.txt`.

- [ ] **Step 2: Update snapshots**

Run:

```bash
pnpm --filter @chameleon-labs/lattice-tokens test -- tests/snapshot.test.ts -u
```

Inspect the diff. It must contain exactly:

- 20 global CSS declarations before the colour theme rules.
- 20 `global.*` JSON paths.
- No changed colour values or aliases.

- [ ] **Step 3: Correct stale public wording**

Make these precise edits:

- Typography spec status: `approved, implementation tracked in #26 and #27`.
- README status: colour, typography, and spacing/motion are specified; tokens remain unpublished.
- Package table: `@chameleon-labs/lattice-tokens` contains colour and foundational design tokens, not only the colour system.
- Scope: move typography out of “Not yet”; say typography primitives are implemented while semantic roles remain #27.
- Development description: config/generator now cover reviewed token values, not only colour curves.
- `packages/tokens/package.json` description: `The token layer of Lattice, an accessibility-first design system. Reviewed contracts guard colour, typography, and layout values at build time.`
- Add `typography` to package keywords.

- [ ] **Step 4: Run documentation-sensitive and package build checks**

Run:

```bash
pnpm --filter @chameleon-labs/lattice-tokens test -- tests/snapshot.test.ts tests/schema.test.ts
pnpm --filter @chameleon-labs/lattice-tokens build
```

Expected: PASS and regenerated `dist/` contains the same 20 global declarations/paths.

### Task 5: Full verification and review handoff

**Files:**
- Review every file changed above.

- [ ] **Step 1: Run the complete gates**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: all commands exit 0 with no warnings or errors.

- [ ] **Step 2: Prove generated artefacts are deterministic**

Run the build twice, calculate checksums after each run, and compare:

```bash
pnpm build
shasum -a 256 packages/tokens/dist/lattice.css packages/tokens/dist/tokens.json
pnpm build
shasum -a 256 packages/tokens/dist/lattice.css packages/tokens/dist/tokens.json
```

Expected: both checksum pairs are identical.

- [ ] **Step 3: Inspect the complete local diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff
```

Expected: only issue #26 files are changed; no generated `dist/` files are tracked; no whitespace errors.

- [ ] **Step 4: Update the board and request review**

Set #26 to In Progress when implementation begins. After verification, leave the work uncommitted and report:

- exact files changed;
- test, typecheck, and build results;
- mutation results;
- any divergence from this plan;
- the local diff ready for George to review.

- [ ] **Step 5: Commit and push only after explicit approval**

After George approves the local diff:

```bash
git add README.md docs/superpowers/specs/2026-07-30-lattice-typography-design.md \
  docs/superpowers/plans/2026-07-30-typography-primitives.md \
  packages/tokens/package.json packages/tokens/config/typography.ts \
  packages/tokens/generate/typography.ts packages/tokens/generate/emit.ts \
  packages/tokens/tests/typography.test.ts packages/tokens/tests/emit.test.ts \
  packages/tokens/tests/schema.test.ts packages/tokens/tests/snapshot.test.ts \
  packages/tokens/tests/__snapshots__/lattice.css \
  packages/tokens/tests/__snapshots__/tokens.paths.txt
git -c commit.gpgsign=false commit -m "Typography primitives and global token emission"
```

Do not add an AI attribution trailer or generated-by wording. Do not push until separately approved if George asks to review the commit first.

### Task 6: Optional Inter primitive amendment

**Files:**
- Modify: `docs/superpowers/specs/2026-07-30-lattice-typography-design.md`
- Modify: `packages/tokens/tests/typography.test.ts`
- Modify: `packages/tokens/config/typography.ts`
- Modify: `packages/tokens/tests/__snapshots__/lattice.css`
- Modify: `packages/tokens/tests/__snapshots__/tokens.paths.txt`
- Modify: `README.md`

**Contract:**
- `--lat-font-sans` remains unchanged and remains the semantic-role default.
- `--lat-font-inter` starts with `InterVariable`, `'Inter Variable'`, and `Inter`, then uses the complete system sans fallback stack.
- `global.font.inter` mirrors the CSS stack as a DTCG `fontFamily` value.
- The package emits no `@font-face` rule and performs no font loading.

- [x] **Step 1: Amend the approved spec and this plan**

Record the opt-in nature of Inter and the consumer-owned delivery boundary before changing production code.

- [x] **Step 2: Write and observe failing boundary tests**

Extend `typography.test.ts` with hand-authored expectations for the Inter fallback order, exact CSS declaration, DTCG value, and absence of `@font-face`.

Run:

```bash
pnpm exec vitest run tests/typography.test.ts
```

Expected: FAIL because `FONT_FAMILIES.inter`, `--lat-font-inter`, and `global.font.inter` do not exist.

- [x] **Step 3: Add the smallest config change**

Extract the existing system sans tuple and reuse it as the tail of the new Inter tuple. Do not change the system sans value or add delivery code.

- [x] **Step 4: Verify focused behavior and refresh snapshots**

Run:

```bash
pnpm exec vitest run tests/typography.test.ts
pnpm exec vitest run tests/snapshot.test.ts
pnpm exec vitest run tests/snapshot.test.ts -u
```

The first two commands must respectively pass and show the expected one-declaration/one-path snapshot delta before the update.

- [x] **Step 5: Mutation-check and repeat the full verification**

Prove the focused test fails if the first Inter family is removed or reordered, and if an `@font-face` rule is introduced. Then repeat Task 5's test, typecheck, build, determinism, and diff checks.
