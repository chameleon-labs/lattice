# Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish three calibrated shadow primitives once in the global tier, and four elevation roles repeated inside every theme scope, so an elevated surface always carries surface, border and shadow together.

**Architecture:** A dedicated `config/elevation.ts` owns the reviewed shadow recipes and the four-level signal table. `generate/elevation.ts` turns them into shadow primitives (CSS + DTCG) and elevation roles (CSS + DTCG); `generate/emit.ts` only composes. Shadow primitives are theme-independent and emit once; elevation roles reference per-scope step aliases and are therefore repeated in every theme block, exactly as the semantic colour tier is.

**Tech Stack:** TypeScript 7, Vitest 4, Playwright (Firefox), Ajv against DTCG 2025.10, pnpm, GitHub CLI.

## Global Constraints

- Work only on `feat/elevation`; never commit implementation work to `main`.
- Node must be 24 (`.nvmrc` pins `24.18.0`). The repo's default shell may be on Node 20, where `vitest` fails at startup with `SyntaxError: ... 'node:util' does not provide an export named 'styleText'`. If that appears, run `export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"` first.
- Emit exactly 3 shadow primitives and 4 elevation levels carrying 10 role tokens per mode.
- Shadow recipes are exactly `small: 0 1 2 0 @ 0.1`, `medium: 0 4 8 -1 @ 0.12`, `large: 0 12 24 -4 @ 0.16`, as `offsetX offsetY blur spread @ alpha`, in `px`.
- The shadow colour is neutral: OKLCH lightness 0, **chroma 0**, hue 0, with alpha.
- Publish CSS as `--lat-shadow-*` and `--lat-elevation-{level}-{surface|border|shadow}`.
- Publish DTCG as `global.shadow.*` with `$type: "shadow"`, and `{mode}.elevation.{level}.*` whose values are DTCG references.
- Emit shadow primitives **once**, in the global tier, after motion primitives and before semantic typography roles. Never into a themed block.
- Emit elevation roles **inside every theme scope** — light, explicit dark, and the preference-driven dark block. Never into the global group.
- `flat` publishes a surface only. It must not publish a border or a shadow, and must not publish keyword-valued tokens.
- Every level above `flat` must publish all three of surface, border and shadow.
- Emit every geometry value with its unit, including zero — `0px`, matching the existing `--lat-radius-none: 0rem`.
- Do not emit a `forced-colors` media query, semantic spacing roles, a z-index scale, or inset shadows.
- Keep implementation changes uncommitted and unpushed until the user reviews the complete local diff and explicitly approves it.
- After approval, use small commits without co-author trailers or AI/generated-by attribution. The repo's GPG key is expired, so commits need `--no-gpg-sign`.

---

## File Map

**Create**

- `packages/tokens/config/elevation.ts` — reviewed shadow recipes, the four-level signal table, and literal-name types.
- `packages/tokens/generate/elevation.ts` — CSS/DTCG conversion for both families, plus derived counts.
- `packages/tokens/tests/elevation.test.ts` — exact contracts, completeness, generation and parity.
- `packages/tokens/tests/browser/elevation.spec.ts` — forced-colors coverage.

**Modify**

- `packages/tokens/generate/emit.ts` — compose shadows globally and elevation roles per theme block.
- `packages/tokens/tests/emit.test.ts` — counts, scope, parity, and the widened alias-reference assertion.
- `packages/tokens/tests/semantic.test.ts` — the widened per-block alias count and dangling-reference assertions.
- `packages/tokens/tests/schema.test.ts` — positive and negative shadow schema coverage.
- `packages/tokens/tests/snapshot.test.ts` — representative elevation paths.
- `packages/tokens/tests/__snapshots__/lattice.css` — reviewed generated CSS.
- `packages/tokens/tests/__snapshots__/tokens.paths.txt` — reviewed generated DTCG shape.
- `README.md` — move elevation into current scope.
- `docs/superpowers/plans/2026-07-31-elevation.md` — track execution evidence.

---

### Task 1: Typed elevation contracts

**Files:**

- Create: `packages/tokens/config/elevation.ts`
- Create: `packages/tokens/tests/elevation.test.ts`

**Interfaces:**

- Produces:
  - `ShadowRecipe`
  - `SHADOWS`
  - `ShadowName`
  - `ElevationLevel`
  - `ELEVATION_LEVELS`
  - `ELEVATION_SCALE`
- Consumed by: `generate/elevation.ts` and direct contract tests.

- [ ] **Step 1: Confirm the branch and clean baseline**

Run:

```bash
export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"
git branch --show-current
git status --short
pnpm test
```

Expected:

- branch is `feat/elevation`;
- only the committed design document exists before implementation;
- 354 unit tests across 13 files and 4 Firefox tests pass.

- [ ] **Step 2: Write the failing exact-contract tests**

Create `packages/tokens/tests/elevation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { ELEVATION_LEVELS, ELEVATION_SCALE, SHADOWS } from '../config/elevation.js'

describe('shadow primitive contracts', () => {
  it('carries the exact three-shadow scale', () => {
    expect(SHADOWS).toEqual({
      small: { offsetX: 0, offsetY: 1, blur: 2, spread: 0, alpha: 0.1 },
      medium: { offsetX: 0, offsetY: 4, blur: 8, spread: -1, alpha: 0.12 },
      large: { offsetX: 0, offsetY: 12, blur: 24, spread: -4, alpha: 0.16 }
    })
  })

  it('keeps every geometry value finite and every alpha inside the unit range', () => {
    const recipes = Object.values(SHADOWS)

    expect(recipes).toHaveLength(3)
    for (const recipe of recipes) {
      for (const value of [recipe.offsetX, recipe.offsetY, recipe.blur, recipe.spread]) {
        expect(Number.isFinite(value)).toBe(true)
      }
      expect(recipe.blur).toBeGreaterThanOrEqual(0)
      expect(recipe.alpha).toBeGreaterThan(0)
      expect(recipe.alpha).toBeLessThanOrEqual(1)
    }
  })

  // The measured basis: a shadow is worth 1.315:1 on light and 1.016:1 on dark,
  // so it grows monotonically and stays well under an opaque overlay.
  it('orders the scale so a heavier level is never lighter', () => {
    expect(SHADOWS.small.alpha).toBeLessThan(SHADOWS.medium.alpha)
    expect(SHADOWS.medium.alpha).toBeLessThan(SHADOWS.large.alpha)
    expect(SHADOWS.small.blur).toBeLessThan(SHADOWS.medium.blur)
    expect(SHADOWS.medium.blur).toBeLessThan(SHADOWS.large.blur)
    expect(Math.max(...Object.values(SHADOWS).map((s) => s.alpha))).toBeLessThanOrEqual(0.16)
  })
})

describe('elevation level contracts', () => {
  it('carries the exact four levels in order', () => {
    expect(ELEVATION_LEVELS.map((level) => level.level)).toEqual([
      'flat',
      'raised',
      'overlay',
      'modal'
    ])
  })

  it('assigns the approved signals to each level', () => {
    expect(ELEVATION_LEVELS).toEqual([
      { level: 'flat', surface: 'bg' },
      { level: 'raised', surface: 'bg-subtle', border: 'border-subtle', shadow: 'small' },
      { level: 'overlay', surface: 'bg-subtle', border: 'border', shadow: 'medium' },
      { level: 'modal', surface: 'component', border: 'border', shadow: 'large' }
    ])
  })

  // The assertion the whole specification exists to protect. A level with a
  // shadow and no border fails in dark mode and in forced-colors.
  it('gives every level above flat all three signals', () => {
    for (const level of ELEVATION_LEVELS) {
      if (level.level === 'flat') {
        continue
      }
      expect(level.surface, level.level).toBeTruthy()
      expect(level.border, level.level).toBeTruthy()
      expect(level.shadow, level.level).toBeTruthy()
    }
  })

  it('keeps flat as an absence rather than a keyword', () => {
    const flat = ELEVATION_LEVELS.find((level) => level.level === 'flat')!

    expect(flat.surface).toBe('bg')
    expect(flat.border).toBeUndefined()
    expect(flat.shadow).toBeUndefined()
  })

  it('draws every surface and border from one scale', () => {
    expect(ELEVATION_SCALE).toBe('gray')
  })
})
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/elevation.test.ts
```

Expected: FAIL because `config/elevation.ts` does not exist.

- [ ] **Step 4: Implement the typed config**

Create `packages/tokens/config/elevation.ts`:

```ts
/**
 * Theme-independent shadow recipes and the elevation signal table.
 *
 * The values are the outcome of a calibration recorded on issue #30, not taste.
 * Composited over each mode's page surface and measured with this system's own
 * contrast module, a shadow is worth 1.315:1 on light and 1.016:1 on dark at the
 * same alpha — and at 50% black the dark figure still only reaches 1.058:1.
 * There is no alpha at which a shadow becomes load-bearing on a dark surface,
 * which is why every level above `flat` also carries a surface step and a
 * border.
 *
 * The colour is neutral rather than tinted to the scale's hue 305. Measured, the
 * two differ by a contrast ratio of at most 1.019 — under 2%, on an edge that is
 * blurred by design.
 */

import type { ScaleName } from './scales.js'

export interface ShadowRecipe {
  /** Offsets, blur and spread in px. */
  readonly offsetX: number
  readonly offsetY: number
  readonly blur: number
  readonly spread: number
  /** Opacity of the neutral shadow colour, 0 to 1. */
  readonly alpha: number
}

export const SHADOWS = {
  small: { offsetX: 0, offsetY: 1, blur: 2, spread: 0, alpha: 0.1 },
  medium: { offsetX: 0, offsetY: 4, blur: 8, spread: -1, alpha: 0.12 },
  large: { offsetX: 0, offsetY: 12, blur: 24, spread: -4, alpha: 0.16 }
} as const satisfies Readonly<Record<string, ShadowRecipe>>

export type ShadowName = keyof typeof SHADOWS

/**
 * One elevation level.
 *
 * `surface` and `border` are step slugs from the semantic tier, so a role reads
 * as a sentence — `--lat-elevation-modal-border` is the grey scale's border
 * step — and resolves through the same per-scope indirection every other role
 * uses.
 *
 * `border` and `shadow` are optional because `flat` is the absence of both. A
 * `none`-valued token would invite a consumer to treat the absence as a value it
 * could interpolate or override, and there is nothing for it to name.
 */
export interface ElevationLevel {
  readonly level: string
  readonly surface: string
  readonly border?: string
  readonly shadow?: ShadowName
}

/**
 * Annotated rather than `as const`, matching `ROLE_ALIASES`. A const assertion
 * would give the array a union element type whose `flat` member has no `border`
 * or `shadow` property at all, and every `level.shadow` read in the generator
 * would then fail to compile.
 */
export const ELEVATION_LEVELS: readonly ElevationLevel[] = [
  { level: 'flat', surface: 'bg' },
  { level: 'raised', surface: 'bg-subtle', border: 'border-subtle', shadow: 'small' },
  { level: 'overlay', surface: 'bg-subtle', border: 'border', shadow: 'medium' },
  { level: 'modal', surface: 'component', border: 'border', shadow: 'large' }
]

/** Elevation surfaces and borders are grey; nothing here is accented. */
export const ELEVATION_SCALE: ScaleName = 'gray'
```

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/elevation.test.ts
pnpm run typecheck
```

Expected: eight focused tests pass and TypeScript exits `0`.

- [ ] **Step 6: Mutation-check the contracts**

Apply one temporary mutation at a time to `config/elevation.ts`:

1. Change `medium.alpha` from `0.12` to `0.2`; the exact-shadow and ceiling tests must fail.
2. Change `large.blur` from `24` to `8`; the exact-shadow and ordering tests must fail.
3. Remove `border` from the `raised` entry; the exact-signals and completeness tests must fail.
4. Add `border: 'border-subtle'` to the `flat` entry; the exact-signals and absence tests must fail.
5. Change `modal.surface` from `component` to `bg`; the exact-signals test must fail.

Restore after every mutation and rerun the focused suite.

- [ ] **Step 7: Hold the intended commit boundary**

Do not commit yet. Record:

```text
Add elevation contracts
```

---

### Task 2: Shadow primitive generation

**Files:**

- Create: `packages/tokens/generate/elevation.ts`
- Modify: `packages/tokens/tests/elevation.test.ts`

**Interfaces:**

- Consumes: `SHADOWS`, `ShadowName`, `ShadowRecipe`.
- Produces:
  - `ShadowColor`
  - `ShadowDimension`
  - `ShadowToken`
  - `SHADOW_PRIMITIVE_COUNT`
  - `shadowCss(): string`
  - `shadowTokens(): Readonly<Record<ShadowName, ShadowToken>>`

- [ ] **Step 1: Add failing shadow generation tests**

Add this import directly below the config import in `packages/tokens/tests/elevation.test.ts`:

```ts
import {
  SHADOW_PRIMITIVE_COUNT,
  shadowCss,
  shadowTokens
} from '../generate/elevation.js'
```

Append:

```ts
describe('shadow primitive generation', () => {
  it('derives the primitive count', () => {
    expect(SHADOW_PRIMITIVE_COUNT).toBe(3)
  })

  it('emits exactly one CSS value per shadow', () => {
    const css = shadowCss()

    expect(css.match(/--lat-/g)).toHaveLength(3)
    expect(css).toContain('--lat-shadow-small: 0px 1px 2px 0px oklch(0 0 0 / 0.1);')
    expect(css).toContain('--lat-shadow-medium: 0px 4px 8px -1px oklch(0 0 0 / 0.12);')
    expect(css).toContain('--lat-shadow-large: 0px 12px 24px -4px oklch(0 0 0 / 0.16);')
  })

  // Every dimension carries its unit, including zero, exactly as
  // --lat-radius-none: 0rem does. Bare 0 would be valid CSS and would break the
  // mechanical relationship with the DTCG value.
  it('gives every geometry value an explicit px unit', () => {
    for (const declaration of shadowCss().split('\n')) {
      const value = /: (.+);$/.exec(declaration)![1]!
      const [offsetX, offsetY, blur, spread] = value.split(' ')

      for (const part of [offsetX, offsetY, blur, spread]) {
        expect(part, declaration).toMatch(/^-?\d+px$/)
      }
    }
  })

  it('keeps the shadow colour neutral', () => {
    expect(shadowCss()).not.toMatch(/oklch\(0 (?!0 0)/)
    for (const token of Object.values(shadowTokens())) {
      const [lightness, chroma, hue] = token.$value.color.components

      expect(lightness).toBe(0)
      expect(chroma).toBe(0)
      expect(hue).toBe(0)
    }
  })

  it('emits DTCG shadow tokens with every required field', () => {
    const tokens = shadowTokens()

    expect(Object.keys(tokens)).toEqual(['small', 'medium', 'large'])
    expect(tokens.medium).toEqual({
      $type: 'shadow',
      $value: {
        color: { colorSpace: 'oklch', components: [0, 0, 0], alpha: 0.12 },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 4, unit: 'px' },
        blur: { value: 8, unit: 'px' },
        spread: { value: -1, unit: 'px' }
      }
    })
  })

  // hex cannot express alpha, and the format makes it optional. Carrying one
  // would publish an opaque black that contradicts the colour beside it.
  it('omits the hex fallback, which cannot carry alpha', () => {
    for (const token of Object.values(shadowTokens())) {
      expect(token.$value.color).not.toHaveProperty('hex')
    }
  })

  it('keeps CSS and DTCG shadows in parity', () => {
    const css = shadowCss()

    for (const [name, token] of Object.entries(shadowTokens())) {
      const { offsetX, offsetY, blur, spread, color } = token.$value

      expect(css, name).toContain(
        `--lat-shadow-${name}: ${offsetX.value}${offsetX.unit} ${offsetY.value}${offsetY.unit} ` +
          `${blur.value}${blur.unit} ${spread.value}${spread.unit} ` +
          `oklch(0 0 0 / ${color.alpha});`
      )
    }
  })

  it('is deterministic', () => {
    expect(shadowCss()).toBe(shadowCss())
    expect(JSON.stringify(shadowTokens())).toBe(JSON.stringify(shadowTokens()))
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/elevation.test.ts
```

Expected: FAIL because `generate/elevation.ts` does not exist.

- [ ] **Step 3: Implement shadow generation**

Create `packages/tokens/generate/elevation.ts`:

```ts
/**
 * Turning the calibrated recipes into the two artefacts.
 *
 * Two families with different scopes. Shadow primitives are theme-independent —
 * the same neutral black in both modes — so they emit once in the global tier.
 * Elevation roles reference per-scope step aliases, so they are repeated inside
 * every theme block for the reason the semantic colour tier already establishes:
 * a custom property holding a `var()` reference resolves on the element that
 * declares it, so one root declaration would freeze to the root theme.
 */

import { SHADOWS, type ShadowName, type ShadowRecipe } from '../config/elevation.js'

/**
 * The shadow's colour.
 *
 * Neutral by decision, and written in OKLCH so the stylesheet holds no hex and
 * no second colour syntax. `hex` is deliberately absent: DTCG makes it optional
 * and it cannot express alpha, so carrying one would publish an opaque black
 * next to a translucent one.
 */
export interface ShadowColor {
  readonly colorSpace: 'oklch'
  readonly components: readonly [number, number, number]
  readonly alpha: number
}

export interface ShadowDimension {
  readonly value: number
  readonly unit: 'px'
}

export interface ShadowToken {
  readonly $type: 'shadow'
  readonly $value: {
    readonly color: ShadowColor
    readonly offsetX: ShadowDimension
    readonly offsetY: ShadowDimension
    readonly blur: ShadowDimension
    readonly spread: ShadowDimension
  }
}

export const SHADOW_PRIMITIVE_COUNT = Object.keys(SHADOWS).length

const px = (value: number): ShadowDimension => ({ value, unit: 'px' })

const shadowToken = (recipe: ShadowRecipe): ShadowToken => ({
  $type: 'shadow',
  $value: {
    color: { colorSpace: 'oklch', components: [0, 0, 0], alpha: recipe.alpha },
    offsetX: px(recipe.offsetX),
    offsetY: px(recipe.offsetY),
    blur: px(recipe.blur),
    spread: px(recipe.spread)
  }
})

export function shadowCss(): string {
  return Object.entries(SHADOWS)
    .map(
      ([name, recipe]) =>
        `  --lat-shadow-${name}: ${recipe.offsetX}px ${recipe.offsetY}px ` +
        `${recipe.blur}px ${recipe.spread}px oklch(0 0 0 / ${recipe.alpha});`
    )
    .join('\n')
}

export function shadowTokens(): Readonly<Record<ShadowName, ShadowToken>> {
  return Object.fromEntries(
    Object.entries(SHADOWS).map(([name, recipe]) => [name, shadowToken(recipe)])
  ) as Readonly<Record<ShadowName, ShadowToken>>
}
```

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/elevation.test.ts
pnpm run typecheck
```

Expected: sixteen focused tests pass and TypeScript exits `0`.

- [ ] **Step 5: Mutation-check shadow generation**

Apply one temporary mutation at a time to `generate/elevation.ts`:

1. Emit `rem` instead of `px`; the unit and parity tests must fail.
2. Emit a bare `0` for `offsetX` instead of `0px`; the unit and parity tests must fail.
3. Give the colour components `[0, 0.05, 305]`; the neutrality test must fail.
4. Add `hex: '#000000'` to the colour; the exact-token and hex-omission tests must fail.
5. Drop `spread` from the token value; the exact-token test must fail.

Restore after every mutation and rerun the focused suite.

- [ ] **Step 6: Hold the intended commit boundary**

Do not commit yet. Record:

```text
Generate calibrated shadow primitives
```

---

### Task 3: Elevation role generation

**Files:**

- Modify: `packages/tokens/generate/elevation.ts`
- Modify: `packages/tokens/tests/elevation.test.ts`

**Interfaces:**

- Consumes: `ELEVATION_LEVELS`, `ELEVATION_SCALE`, and `Mode` from `../config/lightness.js`.
- Produces:
  - `ElevationRoleTokens`
  - `ELEVATION_ROLE_COUNT`
  - `elevationCss(indent?: string): string`
  - `elevationTokens(mode: Mode): ElevationRoleTokens`

`elevationCss` takes no mode. The declarations are identical in every scope
because they reference step aliases that are themselves redeclared per scope —
the same property `stepAliases()` already has.

- [ ] **Step 1: Add failing role generation tests**

Extend the generator import in `packages/tokens/tests/elevation.test.ts` to:

```ts
import {
  ELEVATION_ROLE_COUNT,
  SHADOW_PRIMITIVE_COUNT,
  elevationCss,
  elevationTokens,
  shadowCss,
  shadowTokens
} from '../generate/elevation.js'
```

Append:

```ts
describe('elevation role generation', () => {
  it('derives ten role tokens per mode', () => {
    expect(ELEVATION_ROLE_COUNT).toBe(10)
  })

  it('emits every role as a var reference, never a literal', () => {
    const css = elevationCss()

    // Two per line: the property being declared and the property it references.
    expect(css.match(/--lat-/g)).toHaveLength(ELEVATION_ROLE_COUNT * 2)
    for (const declaration of css.split('\n')) {
      expect(declaration).toMatch(/^ {2}--lat-elevation-[a-z-]+: var\(--lat-[a-z0-9-]+\);$/)
    }
  })

  it('resolves each level to its approved signals', () => {
    const css = elevationCss()

    expect(css).toContain('--lat-elevation-flat-surface: var(--lat-gray-bg);')
    expect(css).toContain('--lat-elevation-raised-surface: var(--lat-gray-bg-subtle);')
    expect(css).toContain('--lat-elevation-raised-border: var(--lat-gray-border-subtle);')
    expect(css).toContain('--lat-elevation-raised-shadow: var(--lat-shadow-small);')
    expect(css).toContain('--lat-elevation-overlay-border: var(--lat-gray-border);')
    expect(css).toContain('--lat-elevation-overlay-shadow: var(--lat-shadow-medium);')
    expect(css).toContain('--lat-elevation-modal-surface: var(--lat-gray-component);')
    expect(css).toContain('--lat-elevation-modal-shadow: var(--lat-shadow-large);')
  })

  it('gives flat a surface and nothing else', () => {
    const css = elevationCss()

    expect(css).toContain('--lat-elevation-flat-surface:')
    expect(css).not.toContain('--lat-elevation-flat-border')
    expect(css).not.toContain('--lat-elevation-flat-shadow')
    expect(css).not.toContain('none')
  })

  // The assertion the specification exists to protect, at the emitted layer.
  it('emits all three signals for every level above flat', () => {
    const css = elevationCss()

    for (const level of ['raised', 'overlay', 'modal']) {
      for (const signal of ['surface', 'border', 'shadow']) {
        expect(css, `${level}.${signal}`).toContain(`--lat-elevation-${level}-${signal}:`)
      }
    }
  })

  it('indents to the depth it is given', () => {
    expect(elevationCss('    ').split('\n').every((line) => line.startsWith('    '))).toBe(true)
  })

  it('references only its own mode, plus the theme-independent shadows', () => {
    for (const mode of ['light', 'dark'] as const) {
      const tokens = elevationTokens(mode)

      expect(tokens.raised.surface.$value).toBe(`{${mode}.gray.bg-subtle}`)
      expect(tokens.raised.border.$value).toBe(`{${mode}.gray.border-subtle}`)
      expect(tokens.raised.shadow.$value).toBe('{global.shadow.small}')
      expect(tokens.modal.surface.$value).toBe(`{${mode}.gray.component}`)
    }
  })

  it('types each DTCG role by the signal it carries', () => {
    const tokens = elevationTokens('light')

    expect(tokens.flat.surface.$type).toBe('color')
    expect(tokens.raised.border.$type).toBe('color')
    expect(tokens.raised.shadow.$type).toBe('shadow')
    expect(Object.keys(tokens.flat)).toEqual(['surface'])
    expect(Object.keys(tokens.modal)).toEqual(['surface', 'border', 'shadow'])
  })

  it('keeps CSS and DTCG roles in parity', () => {
    const css = elevationCss()

    for (const [level, signals] of Object.entries(elevationTokens('light'))) {
      for (const [signal, token] of Object.entries(signals)) {
        // {light.gray.bg-subtle} -> --lat-gray-bg-subtle
        // {global.shadow.small}  -> --lat-shadow-small
        // The first segment is the scope and is dropped in both cases; the CSS
        // name is mechanically the last two.
        const path = (token.$value as string).slice(1, -1).split('.')
        const property = `--lat-${path[1]}-${path[2]}`

        expect(css, `${level}.${signal}`).toContain(
          `--lat-elevation-${level}-${signal}: var(${property});`
        )
      }
    }
  })

  it('is deterministic', () => {
    expect(elevationCss()).toBe(elevationCss())
    expect(JSON.stringify(elevationTokens('dark'))).toBe(JSON.stringify(elevationTokens('dark')))
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/elevation.test.ts
```

Expected: FAIL because `elevationCss` and `elevationTokens` are not exported.

- [ ] **Step 3: Implement role generation**

Add to `packages/tokens/generate/elevation.ts`. Extend the config import to:

```ts
import {
  ELEVATION_LEVELS,
  ELEVATION_SCALE,
  SHADOWS,
  type ShadowName,
  type ShadowRecipe
} from '../config/elevation.js'
import type { Mode } from '../config/lightness.js'
```

Append:

```ts
/** A DTCG role: always a reference, never a value. */
export interface ElevationReference {
  readonly $type: 'color' | 'shadow'
  readonly $value: string
}

export type ElevationRoleTokens = Readonly<
  Record<string, Readonly<Record<string, ElevationReference>>>
>

export const ELEVATION_ROLE_COUNT = ELEVATION_LEVELS.reduce(
  (total, level) => total + 1 + (level.border ? 1 : 0) + (level.shadow ? 1 : 0),
  0
)

/**
 * The role declarations for one theme scope.
 *
 * Takes no mode: every value is a reference to a step alias that is itself
 * redeclared per scope, so the text is identical in the light block, the dark
 * block and the preference-driven block, and resolves differently in each.
 */
export function elevationCss(indent = '  '): string {
  const lines: string[] = []

  for (const level of ELEVATION_LEVELS) {
    lines.push(
      `${indent}--lat-elevation-${level.level}-surface: var(--lat-${ELEVATION_SCALE}-${level.surface});`
    )
    if (level.border) {
      lines.push(
        `${indent}--lat-elevation-${level.level}-border: var(--lat-${ELEVATION_SCALE}-${level.border});`
      )
    }
    if (level.shadow) {
      lines.push(`${indent}--lat-elevation-${level.level}-shadow: var(--lat-shadow-${level.shadow});`)
    }
  }

  return lines.join('\n')
}

export function elevationTokens(mode: Mode): ElevationRoleTokens {
  const groups: Record<string, Record<string, ElevationReference>> = {}

  for (const level of ELEVATION_LEVELS) {
    const signals: Record<string, ElevationReference> = {
      surface: { $type: 'color', $value: `{${mode}.${ELEVATION_SCALE}.${level.surface}}` }
    }
    if (level.border) {
      signals['border'] = {
        $type: 'color',
        $value: `{${mode}.${ELEVATION_SCALE}.${level.border}}`
      }
    }
    if (level.shadow) {
      // Theme-independent by design, so this is the one role that points out of
      // its own mode and into the global tier.
      signals['shadow'] = { $type: 'shadow', $value: `{global.shadow.${level.shadow}}` }
    }
    groups[level.level] = signals
  }

  return groups as ElevationRoleTokens
}
```

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/elevation.test.ts
pnpm run typecheck
```

Expected: twenty-six focused tests pass and TypeScript exits `0`.

- [ ] **Step 5: Mutation-check role generation**

Apply one temporary mutation at a time:

1. Drop the `if (level.border)` branch from `elevationCss`; the completeness and exact-signal tests must fail.
2. Point `shadow` at `{${mode}.shadow.${level.shadow}}`; the own-mode test must fail.
3. Emit `--lat-elevation-flat-border: none;`; the flat-absence and var-reference tests must fail.
4. Give `flat` a shadow in `elevationTokens`; the DTCG key-shape test must fail.
5. Change `$type` of a shadow role to `color`; the typed-role test must fail.

Restore after every mutation.

- [ ] **Step 6: Hold the intended commit boundary**

Do not commit yet. Record:

```text
Generate theme-dependent elevation roles
```

---

### Task 4: Published artefact composition

**Files:**

- Modify: `packages/tokens/generate/emit.ts`
- Modify: `packages/tokens/tests/emit.test.ts`
- Modify: `packages/tokens/tests/semantic.test.ts`
- Modify: `packages/tokens/tests/schema.test.ts`
- Modify: `packages/tokens/tests/snapshot.test.ts`
- Modify: `packages/tokens/tests/__snapshots__/lattice.css`
- Modify: `packages/tokens/tests/__snapshots__/tokens.paths.txt`

**Interfaces:**

- Consumes: every public export from `generate/elevation.ts`.
- Produces: 3 global CSS declarations, 10 per theme block across 3 blocks, 3 global DTCG leaves and 10 per mode.

- [ ] **Step 1: Widen the two existing assertions that elevation legitimately breaks**

Both changes are widenings with a stated reason, not relaxations. Make them
first so the later failures are only the new ones.

In `packages/tokens/tests/semantic.test.ts`, the per-block alias count currently
counts every `var()` declaration in a block, which now includes elevation roles.
Import the count:

```ts
import { ELEVATION_ROLE_COUNT } from '../generate/elevation.js'
```

and change the assertion in `carries the same alias count in each block` to:

```ts
      // Every alias but on-solid is a var() reference; on-solid is a colour.
      // Elevation roles are var() references in the same blocks, and are counted
      // separately so a change to either tier stays visible here.
      expect(declared).toHaveLength(ALIAS_COUNT - 1 + ELEVATION_ROLE_COUNT)
```

In the same file, `leaves no dangling reference in block %i` requires every
reference in a block to be declared in that same block. An elevation shadow role
references `--lat-shadow-*`, which is declared once on the global `:root` and
inherits into every scope — correct CSS, and the reason shadows are not repeated.
Change the test to resolve against the global block as well:

```ts
  it.each([0, 1, 2])('leaves no dangling reference in block %i', (index) => {
    const block = blocks(css)[index]!
    // The theme-independent global rule is in scope for every themed block,
    // because a custom property declared on :root inherits into it. Shadow
    // primitives live there and are deliberately not repeated per theme.
    const globalBlock = css.slice(0, css.indexOf("\n:root,\n[data-lat-theme='light'] {"))
    const declared = new Set(
      ([...(block.match(/(--lat-[a-z0-9-]+):/g) ?? []),
        ...(globalBlock.match(/(--lat-[a-z0-9-]+):/g) ?? [])]).map((m) => m.slice(0, -1))
    )
    const referenced = (block.match(/var\((--lat-[a-z0-9-]+)\)/g) ?? []).map((m) =>
      m.slice(4, -1)
    )

    expect(referenced.length).toBeGreaterThan(0)
    for (const reference of referenced) {
      expect(declared, reference).toContain(reference)
    }
  })
```

In `packages/tokens/tests/emit.test.ts`, `keeps every alias inside its own mode`
asserts every alias reference starts with its own mode. The elevation shadow role
points at `{global.shadow.*}` by design. Widen it to permit that one prefix while
still rejecting a cross-mode reference:

```ts
  it('keeps every alias inside its own mode, so a theme never leaks', () => {
    for (const { path, value } of aliasLeaves()) {
      // Shadow primitives are theme-independent and live in the global tier, so
      // an elevation role may point there. Nothing may point into another mode.
      if (value.startsWith('{global.')) {
        expect(path, `${path} -> ${value}`).toMatch(/\.elevation\./)
        continue
      }
      expect(value.startsWith(`{${path.split('.')[0]}.`), `${path} -> ${value}`).toBe(true)
    }
  })
```

- [ ] **Step 2: Run the suite and confirm only expected failures remain**

Run:

```bash
cd packages/tokens
pnpm exec vitest run
```

Expected: exactly one failure —
`tests/semantic.test.ts > carries the same alias count in each block`, off by
10, because `ELEVATION_ROLE_COUNT` has been added to the expected total but
nothing emits elevation roles yet. That single failure confirms the constant is
wired before composition begins, and Task 4 Step 5 clears it.

The dangling-reference widening and the `emit.test.ts` own-mode widening must
both still PASS at this point: neither changes behaviour until a `{global.*}`
reference or a `--lat-shadow-*` reference actually exists.

- [ ] **Step 3: Add failing integrated assertions**

In `packages/tokens/tests/emit.test.ts`, import:

```ts
import {
  ELEVATION_ROLE_COUNT,
  SHADOW_PRIMITIVE_COUNT,
  elevationCss,
  elevationTokens,
  shadowCss,
  shadowTokens
} from '../generate/elevation.js'
```

Add `SHADOW_PRIMITIVE_COUNT` to `GLOBAL_DECLARATIONS`, and `ELEVATION_ROLE_COUNT`
to `PER_BLOCK`:

```ts
const PER_BLOCK =
  PRIMITIVES + CHART_SLOTS + SEQUENTIAL_STEPS + SEVERITY_STEPS + ALIAS_COUNT + ELEVATION_ROLE_COUNT
const GLOBAL_DECLARATIONS =
  TYPOGRAPHY_PRIMITIVE_COUNT +
  TYPOGRAPHY_ROLE_COUNT * TYPOGRAPHY_ROLE_PROPERTY_COUNT +
  LAYOUT_PRIMITIVE_COUNT +
  MOTION_PRIMITIVE_COUNT +
  SHADOW_PRIMITIVE_COUNT
```

`PER_BLOCK` feeds both the per-block CSS count and the per-mode DTCG leaf count,
so adding `ELEVATION_ROLE_COUNT` there covers the roles in both artefacts. The
three global shadow leaves are not in `PER_BLOCK`, so add them explicitly to the
leaf-count assertion in `carries one token per primitive step, chart slot,
severity level and alias`:

```ts
    expect(leaves()).toHaveLength(
      TYPOGRAPHY_PRIMITIVE_COUNT +
        TYPOGRAPHY_ROLE_COUNT +
        LAYOUT_PRIMITIVE_COUNT +
        MOTION_PRIMITIVE_COUNT +
        SHADOW_PRIMITIVE_COUNT +
        PER_BLOCK * MODES.length
    )
```

Add to the `lattice.css` suite:

```ts
it('emits every shadow primitive once in the global rule', () => {
  const [globalBlock] = splitBlocks(css)

  expect(globalBlock).toContain(shadowCss())
  expect(count(shadowCss())).toBe(SHADOW_PRIMITIVE_COUNT)
  expect(css.match(/--lat-shadow-small:/g)).toHaveLength(1)
  expect(css.match(/--lat-shadow-large:/g)).toHaveLength(1)
})

it('repeats every elevation role in all three themed blocks', () => {
  const [globalBlock, lightBlock, darkBlock, mediaBlock] = splitBlocks(css)

  for (const block of [lightBlock, darkBlock, mediaBlock]) {
    expect(block).toContain(elevationCss())
  }
  expect(globalBlock).not.toContain('--lat-elevation-')
  expect(css.match(/--lat-elevation-modal-shadow:/g)).toHaveLength(3)
})

it('reports derived elevation counts in the generated header', () => {
  expect(css).toContain(
    `/* Elevation: ${SHADOW_PRIMITIVE_COUNT} shadows; ` +
      `${ELEVATION_ROLE_COUNT} role tokens per theme. */`
  )
})

it('never emits a forced-colors rule from the token package', () => {
  expect(css).not.toContain('forced-colors')
})
```

Add to the `tokens.json` suite:

```ts
it('keeps shadow primitives global and elevation roles per mode', () => {
  const global = tokens['global'] as Record<string, unknown>

  expect(global['shadow']).toEqual(shadowTokens())
  expect(global).not.toHaveProperty('elevation')

  for (const mode of MODES) {
    const group = tokens[mode] as Record<string, unknown>

    expect(group['elevation']).toEqual(elevationTokens(mode))
    expect(group).not.toHaveProperty('shadow')
  }
})
```

- [ ] **Step 4: Run integrated tests and verify RED**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/emit.test.ts
```

Expected: FAIL because `emit.ts` has not composed elevation output.

- [ ] **Step 5: Compose elevation into both artefacts**

In `packages/tokens/generate/emit.ts`, import:

```ts
import {
  ELEVATION_ROLE_COUNT,
  SHADOW_PRIMITIVE_COUNT,
  elevationCss,
  elevationTokens,
  shadowCss,
  shadowTokens
} from './elevation.js'
```

Add the derived header line directly after the motion header:

```ts
/* Elevation: ${SHADOW_PRIMITIVE_COUNT} shadows; ${ELEVATION_ROLE_COUNT} role tokens per theme. */
```

Add `shadowCss()` to the global rule, after motion and before the typography
roles:

```ts
:root {
${typographyCss()}
${layoutCss()}
${motionCss()}
${shadowCss()}
${typographyRoleCss()}
}
```

Add the roles to `themedBlock`, after the semantic tier:

```ts
  return [
    primitives,
    categorical,
    sequential,
    severity,
    semanticBlock(scales, mode),
    elevationCss()
  ].join('\n\n')
```

`themedBlock` is used for all three themed rules, including the indented media
block, whose caller already re-indents every line — so no separate indent
argument is needed here.

In `emitTokens`, add the roles to each mode group, beside `severity` and
`chart`:

```ts
    group['elevation'] = {
      $description:
        'Elevation levels. Every level above flat bundles a surface, a border and a ' +
        'shadow: the shadow reads on light, the surface step reads on dark, and the ' +
        'border is the only one that survives forced-colors.',
      ...elevationTokens(mode)
    }
```

and add the primitives to the global group, after motion:

```ts
    global: {
      $description:
        'Theme-independent typography, layout, motion and shadow primitives, plus semantic typography. Emitted once.',
      ...typographyTokens(),
      ...layoutTokens(),
      ...motionTokens(),
      shadow: shadowTokens(),
      text: typographyRoleTokens()
    },
```

- [ ] **Step 6: Add schema coverage**

In `packages/tokens/tests/schema.test.ts`, extend the global value-shape test
with:

```ts
    expect(global['shadow']?.['medium']?.$value).toEqual({
      color: { colorSpace: 'oklch', components: [0, 0, 0], alpha: 0.12 },
      offsetX: { value: 0, unit: 'px' },
      offsetY: { value: 4, unit: 'px' },
      blur: { value: 8, unit: 'px' },
      spread: { value: -1, unit: 'px' }
    })
```

Add:

```ts
  it('rejects a shadow missing a required field', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>
    const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>
    global['shadow']!['medium'] = {
      $type: 'shadow',
      $value: {
        color: { colorSpace: 'oklch', components: [0, 0, 0], alpha: 0.12 },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 4, unit: 'px' },
        blur: { value: 8, unit: 'px' }
      }
    }

    expect(validate(broken)).toBe(false)
  })

  it('rejects a shadow dimension unit the format cannot represent', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>
    const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>
    const shadow = global['shadow']!['medium'] as Record<string, Record<string, unknown>>
    shadow['$value']!['blur'] = { value: 8, unit: 'furlongs' }

    expect(validate(broken)).toBe(false)
  })
```

- [ ] **Step 7: Extend representative snapshot-path coverage**

In `packages/tokens/tests/snapshot.test.ts`, add to the fragment list:

```ts
      'global.shadow.medium',
      'light.elevation.raised.border',
      'dark.elevation.modal.shadow',
```

- [ ] **Step 8: Run every affected suite**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/elevation.test.ts tests/emit.test.ts tests/semantic.test.ts tests/schema.test.ts
```

Expected: PASS.

- [ ] **Step 9: Observe snapshot failures before updating**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/snapshot.test.ts
```

Expected: two snapshot failures showing:

- one derived elevation header line;
- three new declarations in the first `:root`;
- ten new declarations in each of the three themed blocks;
- three new `global.shadow.*` paths and ten new `{mode}.elevation.*` paths per mode;
- no colour value changes.

- [ ] **Step 10: Update and inspect snapshots**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/snapshot.test.ts -u
cd ../..
git diff --stat -- packages/tokens/tests/__snapshots__/
git diff -- packages/tokens/tests/__snapshots__/tokens.paths.txt
```

Confirm the CSS snapshot gained exactly 34 declaration lines plus one header, and
the paths file gained exactly 23 lines.

- [ ] **Step 11: Mutation-check integration scope**

Apply one temporary mutation at a time:

1. Move `shadowCss()` into `themedBlock`; the once-only and block-count tests must fail.
2. Move `elevationCss()` into the global `:root`; the per-block repetition and global-count tests must fail.
3. Put `shadow: shadowTokens()` under a mode group; the global-only JSON test must fail.
4. Remove `ELEVATION_ROLE_COUNT` from `PER_BLOCK`; the block-count test must fail.
5. Delete the `border` line from `elevationCss`; the completeness, block-count and snapshot tests must fail.

Restore after every mutation.

- [ ] **Step 12: Hold the intended commit boundary**

Do not commit yet. Record:

```text
Publish elevation in both artefacts
```

---

### Task 5: Forced-colors browser coverage

**Files:**

- Create: `packages/tokens/tests/browser/elevation.spec.ts`

**Interfaces:**

- Consumes: `emitCss` from `../../generate/emit.js`, `buildAllScales` from `../../generate/scale.js`.
- Produces: browser evidence that the border survives when the user agent strips
  the other two signals.

- [ ] **Step 1: Write the failing browser test**

The mechanism is settled and was verified before this plan was written.
Playwright's **declarative** `forcedColors` option — in `playwright.config.ts`, on
a project, or through `test.use()` — is a **no-op** in this setup: the media query
keeps reporting `false`. The **runtime** call works in Firefox and Chromium both.
Use it. Do not add a browser project.

Create `packages/tokens/tests/browser/elevation.spec.ts`:

```ts
/// <reference lib="dom" />

import { expect, test } from '@playwright/test'

import { emitCss } from '../../generate/emit.js'
import { buildAllScales } from '../../generate/scale.js'

const emittedCss = emitCss(buildAllScales())

const documentWith = (level: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
${emittedCss}
      #subject {
        background: var(--lat-elevation-${level}-surface);
        border: 1px solid var(--lat-elevation-${level}-border);
        box-shadow: var(--lat-elevation-${level}-shadow);
        padding: 1rem;
      }
    </style>
  </head>
  <body><div id="subject">Elevated</div></body>
</html>`

const readSubject = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const style = getComputedStyle(document.getElementById('subject')!)

    return {
      forced: matchMedia('(forced-colors: active)').matches,
      shadow: style.boxShadow,
      borderStyle: style.borderTopStyle,
      borderWidth: style.borderTopWidth,
      borderColor: style.borderTopColor,
      background: style.backgroundColor
    }
  })

// The whole reason elevation ships three signals. The user agent strips the
// shadow and flattens the surface to the system canvas; if the border did not
// survive, an elevated surface would be indistinguishable from the page.
test('the border survives forced-colors after the shadow is stripped', async ({ page }) => {
  await page.setContent(documentWith('overlay'))

  const before = await readSubject(page)

  expect(before.forced).toBe(false)
  expect(before.shadow).not.toBe('none')

  await page.emulateMedia({ forcedColors: 'active' })
  const after = await readSubject(page)

  expect(after.forced).toBe(true)
  expect(after.shadow).toBe('none')
  expect(after.borderStyle).toBe('solid')
  expect(after.borderWidth).toBe('1px')
  expect(after.borderColor).not.toBe(before.borderColor)
})

// Elevation must never be carried by the shadow alone, in either direction.
test('every level above flat still declares a border and a shadow', async ({ page }) => {
  for (const level of ['raised', 'overlay', 'modal']) {
    await page.setContent(documentWith(level))
    const seen = await readSubject(page)

    expect(seen.shadow, level).not.toBe('none')
    expect(seen.borderWidth, level).toBe('1px')
    expect(seen.borderStyle, level).toBe('solid')
  }
})
```

- [ ] **Step 2: Run the browser suite and verify RED**

Run:

```bash
cd packages/tokens
pnpm exec playwright test elevation
```

Expected: FAIL if run before Task 4 composed the roles, because
`--lat-elevation-overlay-border` resolves to nothing and the border collapses.
If Task 4 is already complete, this passes immediately — note that in the
execution record rather than manufacturing a failure.

- [ ] **Step 3: Run the full browser suite**

Run:

```bash
cd packages/tokens
pnpm exec playwright test
```

Expected: 4 existing Firefox tests plus 4 new ones — the two tests above run
under both the `firefox-default-16` and `firefox-default-20` projects.

- [ ] **Step 4: Mutation-check the browser guarantee**

1. In `config/elevation.ts`, remove `border` from `overlay`; the forced-colors
   test must fail because the border collapses to `0px`.
2. Restore, then remove `shadow` from `overlay`; the second test must fail.

Restore after each.

- [ ] **Step 5: Hold the intended commit boundary**

Do not commit yet. Record:

```text
Cover the forced-colors elevation guarantee
```

---

### Task 6: Documentation, verification and review

**Files:**

- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-31-elevation.md`
- Review: every implementation file changed by Tasks 1–5.

- [ ] **Step 1: Update README scope**

Change the scope paragraphs to:

```md
**In:** colour scales, semantic colour tokens, light and dark modes, an ordered severity ramp, validated categorical and sequential chart palettes, primitive and semantic typography tokens, primitive spacing, breakpoints, containers and radii tokens, primitive motion tokens, and calibrated elevation with theme-dependent roles.

**Not yet:** components, semantic spacing and motion, wide-gamut output, forced-colors handling. Each is tracked separately.
```

- [ ] **Step 2: Run the complete gates**

Run from the repository root:

```bash
export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Expected:

- every Vitest file passes;
- 8 Firefox tests pass;
- typecheck and build exit `0`;
- the diff has no whitespace errors.

- [ ] **Step 3: Prove deterministic artefacts**

Run:

```bash
pnpm build
shasum -a 256 packages/tokens/dist/lattice.css packages/tokens/dist/tokens.json
pnpm build
shasum -a 256 packages/tokens/dist/lattice.css packages/tokens/dist/tokens.json
```

Expected: both checksum pairs match exactly.

- [ ] **Step 4: Verify the emitted artefact by hand**

Run:

```bash
grep -c "lat-shadow-" packages/tokens/dist/lattice.css
grep -c "lat-elevation-" packages/tokens/dist/lattice.css
grep -c "forced-colors" packages/tokens/dist/lattice.css
```

Expected: `3`, `30`, and `0`.

- [ ] **Step 5: Inspect the complete local diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff
git ls-files --others --exclude-standard
git diff --cached --name-only
```

Confirm:

- only issue #30 files changed;
- generated `dist/` remains ignored;
- exactly 3 shadow primitives and 10 role tokens per theme were introduced;
- `flat` has a surface and no border or shadow;
- no `forced-colors` rule, semantic spacing role, z-index or inset shadow appeared;
- no contributor-specific path, co-author trailer or AI attribution appears;
- the index is empty and implementation remains uncommitted.

- [ ] **Step 6: Request implementation review**

Report:

- exact files changed;
- RED/GREEN and mutation evidence, including the two widened existing assertions
  and the reason each was widened;
- unit, Firefox, typecheck, build and determinism results;
- any divergence from this plan;
- the complete uncommitted implementation diff.

Leave every implementation change uncommitted and unpushed until explicit
approval.

- [ ] **Step 7: Create small commits only after approval**

Use these boundaries:

```text
Add elevation contracts
Generate calibrated shadow primitives
Generate theme-dependent elevation roles
Publish elevation in both artefacts
Cover the forced-colors elevation guarantee
Document elevation support
```

Commits need `--no-gpg-sign` while the repo's signing key is expired. Do not add
co-author trailers or AI/generated-by attribution. Push only `feat/elevation`;
never push implementation commits directly to `main`.
