# Typography Semantic Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement issue #27 by emitting eleven semantic typography roles, a zero-tracking primitive, and a `40rem` heading step-down with DTCG, snapshot, schema, mutation, and real-browser coverage.

**Architecture:** Keep primitive values in `config/typography.ts`, the hand-authored role matrix and narrow size map in `config/typography-roles.ts`, and semantic formatting in `generate/typography-roles.ts`. `generate/emit.ts` composes primitive declarations, five CSS aliases per role, default DTCG composites, and the CSS-only responsive override without duplicating the role matrix.

**Tech Stack:** TypeScript 7, Vitest 4, pnpm 10, CSS custom properties, DTCG 2025.10 tokens, AJV, Playwright Test 1.61, Firefox.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-30-lattice-typography-design.md`.
- Work on `feat/typography-semantic-roles`; never commit directly to `main`.
- Do not commit or push implementation changes until the complete local diff has been reviewed and explicitly approved.
- Use test-driven development: write each behavior test, observe the intended failure, then add the smallest implementation.
- Emit exactly eleven roles: `body`, `body-strong`, `lead`, `ui`, `caption`, `micro`, `code`, and headings 1–4.
- Every role references existing family, size, weight, letter-spacing, and line-height primitives.
- Keep system sans as the default; do not apply the optional Inter primitive to any semantic role.
- Retain `micro` as the only `2xs` role and classify it as restricted, non-essential, non-prose text.
- Keep exactly four heading roles. Only headings 1–3 step down, by one existing size, below `40rem`.
- Emit default/wide DTCG composites only. Do not invent conditional or `text-narrow` JSON tokens.
- Do not add font files, `@font-face`, a font-loading dependency, or a runtime dependency.

---

## File Structure

- Modify `packages/tokens/config/typography.ts`: add `LETTER_SPACINGS.normal = 0`.
- Create `packages/tokens/config/typography-roles.ts`: exact role matrix, classifications, breakpoint, and narrow heading sizes.
- Modify `packages/tokens/generate/typography.ts`: emit the letter-spacing primitive in CSS and DTCG.
- Create `packages/tokens/generate/typography-roles.ts`: emit five CSS aliases per role, eleven DTCG composites, and the responsive CSS block.
- Modify `packages/tokens/generate/emit.ts`: compose role output and accurately describe it in the generated header.
- Create `packages/tokens/tests/typography-roles.test.ts`: matrix, accessibility, alias integrity, direct CSS/DTCG, and responsive contracts.
- Modify `packages/tokens/tests/typography.test.ts`: letter-spacing primitive coverage.
- Modify `packages/tokens/tests/emit.test.ts`: integrated declaration counts and CSS/JSON parity.
- Modify `packages/tokens/tests/schema.test.ts`: composite validation and missing-property rejection.
- Modify `packages/tokens/tests/__snapshots__/lattice.css` and `tokens.paths.txt`: public artefact changes.
- Create `packages/tokens/playwright.config.ts`: two Firefox preference projects.
- Create `packages/tokens/tests/browser/typography-roles.spec.ts`: breakpoint and 320px reflow behavior.
- Modify `packages/tokens/package.json` and `pnpm-lock.yaml`: Playwright dependency and scripts.
- Modify `.github/workflows/ci.yml`: install only Firefox and its OS dependencies.
- Modify `README.md`: move semantic typography roles into implemented scope.

### Task 0: Record the approved contract before implementation

**Files:**
- None.

**Interfaces:**
- Produces: the issue-level role matrix required by #27's acceptance criteria and an accurate In Progress board state.

- [x] **Step 1: Comment the approved matrix on issue #27**

Use `gh issue comment 27 --repo chameleon-labs/lattice` to record:

```markdown
Approved role matrix before implementation:

| Role | Family | Size | Weight | Letter spacing | Line height | Narrow |
|---|---|---|---|---|---|---|
| body | sans | base | regular | normal | normal | — |
| body-strong | sans | base | semibold | normal | normal | — |
| lead | sans | lg | regular | normal | relaxed | — |
| ui | sans | sm | semibold | normal | snug | — |
| caption | sans | xs | regular | normal | normal | — |
| micro | sans | 2xs | regular | normal | normal | — |
| code | mono | sm | regular | normal | normal | — |
| heading-1 | sans | 4xl | bold | normal | tight | 3xl |
| heading-2 | sans | 3xl | bold | normal | tight | 2xl |
| heading-3 | sans | 2xl | semibold | normal | snug | xl |
| heading-4 | sans | xl | semibold | normal | snug | — |

`micro` is retained for restricted non-essential, non-prose labels. The public
hierarchy stops at four headings. `letter-spacing.normal` is `0rem`. DTCG emits
default composites; CSS alone carries the `40rem` condition for headings 1–3.
```

- [x] **Step 2: Set the project item to In Progress**

Resolve the current project item and Status field IDs from GitHub, set issue #27 to In Progress, and verify with:

```bash
gh issue view 27 --repo chameleon-labs/lattice --json projectItems
```

Expected: the `Lattice v1` project item reports `In Progress`.

### Task 1: Zero-tracking primitive

**Files:**
- Modify: `packages/tokens/tests/typography.test.ts`
- Modify: `packages/tokens/config/typography.ts`
- Modify: `packages/tokens/generate/typography.ts`

**Interfaces:**
- Produces: `LETTER_SPACINGS.normal`, CSS `--lat-letter-spacing-normal`, and DTCG `global.letter-spacing.normal`.
- Consumed by: `config/typography-roles.ts` and `generate/typography-roles.ts`.

- [x] **Step 1: Add failing primitive assertions**

Import `LETTER_SPACINGS` and add:

```ts
it('provides the zero-tracking primitive required by every role', () => {
  expect(LETTER_SPACINGS).toEqual({ normal: 0 })
  expect(typographyCss()).toContain('--lat-letter-spacing-normal: 0rem;')
  expect(typographyTokens()['letter-spacing'].normal).toEqual({
    $type: 'dimension',
    $value: { value: 0, unit: 'rem' }
  })
})
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/typography.test.ts
```

Expected: FAIL because `LETTER_SPACINGS` and the `letter-spacing` DTCG group do not exist.

- [x] **Step 3: Add the primitive**

In `config/typography.ts`:

```ts
export const LETTER_SPACINGS = {
  normal: 0
} as const
```

In `generate/typography.ts`:

- Add `LETTER_SPACINGS` to the primitive count.
- Emit `--lat-letter-spacing-${name}: ${value}rem;` after line-height declarations.
- Add a readonly `'letter-spacing'` group of `DimensionToken` to `TypographyTokenGroups`.
- Build that group with `{ $type: 'dimension', $value: { value, unit: 'rem' } }`.

- [x] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
pnpm exec vitest run tests/typography.test.ts
```

Expected: all typography primitive tests pass.

- [x] **Step 5: Mutation-check the value and unit**

Temporarily change `normal` to `0.01`, run the focused test, and confirm the exact-value assertion fails. Restore it, then temporarily emit `px` and confirm the DTCG assertion fails. Restore before continuing.

- [x] **Step 6: Hold the commit**

Do not commit. Record this intended commit boundary:

```text
Add typography role contracts
```

### Task 2: Exact role matrix and accessibility classifications

**Files:**
- Create: `packages/tokens/config/typography-roles.ts`
- Create: `packages/tokens/tests/typography-roles.test.ts`

**Interfaces:**
- Produces:
  - `TYPOGRAPHY_ROLES: Readonly<Record<TypographyRoleName, TypographyRole>>`
  - `NARROW_HEADING_SIZES`
  - `TYPOGRAPHY_BREAKPOINT_REM = 40`
  - `TypographyRoleName`
- Consumes primitive keys from `config/typography.ts`.

- [x] **Step 1: Write the failing exact-matrix test**

Create `typography-roles.test.ts` with the hand-authored expected object:

```ts
import { describe, expect, it } from 'vitest'

import {
  NARROW_HEADING_SIZES,
  TYPOGRAPHY_BREAKPOINT_REM,
  TYPOGRAPHY_ROLES
} from '../config/typography-roles.js'

describe('typography semantic roles', () => {
  it('carries the approved eleven-role matrix', () => {
    expect(TYPOGRAPHY_ROLES).toEqual({
      body: {
        fontFamily: 'sans',
        fontSize: 'base',
        fontWeight: 'regular',
        letterSpacing: 'normal',
        lineHeight: 'normal',
        classification: 'prose'
      },
      'body-strong': {
        fontFamily: 'sans',
        fontSize: 'base',
        fontWeight: 'semibold',
        letterSpacing: 'normal',
        lineHeight: 'normal',
        classification: 'prose'
      },
      lead: {
        fontFamily: 'sans',
        fontSize: 'lg',
        fontWeight: 'regular',
        letterSpacing: 'normal',
        lineHeight: 'relaxed',
        classification: 'prose'
      },
      ui: {
        fontFamily: 'sans',
        fontSize: 'sm',
        fontWeight: 'semibold',
        letterSpacing: 'normal',
        lineHeight: 'snug',
        classification: 'ui'
      },
      caption: {
        fontFamily: 'sans',
        fontSize: 'xs',
        fontWeight: 'regular',
        letterSpacing: 'normal',
        lineHeight: 'normal',
        classification: 'supporting'
      },
      micro: {
        fontFamily: 'sans',
        fontSize: '2xs',
        fontWeight: 'regular',
        letterSpacing: 'normal',
        lineHeight: 'normal',
        classification: 'restricted'
      },
      code: {
        fontFamily: 'mono',
        fontSize: 'sm',
        fontWeight: 'regular',
        letterSpacing: 'normal',
        lineHeight: 'normal',
        classification: 'code'
      },
      'heading-1': {
        fontFamily: 'sans',
        fontSize: '4xl',
        fontWeight: 'bold',
        letterSpacing: 'normal',
        lineHeight: 'tight',
        classification: 'display'
      },
      'heading-2': {
        fontFamily: 'sans',
        fontSize: '3xl',
        fontWeight: 'bold',
        letterSpacing: 'normal',
        lineHeight: 'tight',
        classification: 'display'
      },
      'heading-3': {
        fontFamily: 'sans',
        fontSize: '2xl',
        fontWeight: 'semibold',
        letterSpacing: 'normal',
        lineHeight: 'snug',
        classification: 'display'
      },
      'heading-4': {
        fontFamily: 'sans',
        fontSize: 'xl',
        fontWeight: 'semibold',
        letterSpacing: 'normal',
        lineHeight: 'snug',
        classification: 'display'
      }
    })
  })

  it('steps exactly the first three headings below 40rem', () => {
    expect(TYPOGRAPHY_BREAKPOINT_REM).toBe(40)
    expect(NARROW_HEADING_SIZES).toEqual({
      'heading-1': '3xl',
      'heading-2': '2xl',
      'heading-3': 'xl'
    })
  })
})
```

- [x] **Step 2: Run and verify the missing-module failure**

Run:

```bash
pnpm exec vitest run tests/typography-roles.test.ts
```

Expected: FAIL because `config/typography-roles.ts` does not exist.

- [x] **Step 3: Implement typed role contracts**

Define key types from the primitive objects:

```ts
export type TypographyRole = {
  readonly fontFamily: keyof typeof FONT_FAMILIES
  readonly fontSize: keyof typeof FONT_SIZES
  readonly fontWeight: keyof typeof FONT_WEIGHTS
  readonly letterSpacing: keyof typeof LETTER_SPACINGS
  readonly lineHeight: keyof typeof LINE_HEIGHTS
  readonly classification: 'prose' | 'ui' | 'supporting' | 'restricted' | 'code' | 'display'
}
```

Author the matrix with:

```ts
export const TYPOGRAPHY_ROLES = {
  body: {
    fontFamily: 'sans',
    fontSize: 'base',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    classification: 'prose'
  },
  'body-strong': {
    fontFamily: 'sans',
    fontSize: 'base',
    fontWeight: 'semibold',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    classification: 'prose'
  },
  lead: {
    fontFamily: 'sans',
    fontSize: 'lg',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'relaxed',
    classification: 'prose'
  },
  ui: {
    fontFamily: 'sans',
    fontSize: 'sm',
    fontWeight: 'semibold',
    letterSpacing: 'normal',
    lineHeight: 'snug',
    classification: 'ui'
  },
  caption: {
    fontFamily: 'sans',
    fontSize: 'xs',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    classification: 'supporting'
  },
  micro: {
    fontFamily: 'sans',
    fontSize: '2xs',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    classification: 'restricted'
  },
  code: {
    fontFamily: 'mono',
    fontSize: 'sm',
    fontWeight: 'regular',
    letterSpacing: 'normal',
    lineHeight: 'normal',
    classification: 'code'
  },
  'heading-1': {
    fontFamily: 'sans',
    fontSize: '4xl',
    fontWeight: 'bold',
    letterSpacing: 'normal',
    lineHeight: 'tight',
    classification: 'display'
  },
  'heading-2': {
    fontFamily: 'sans',
    fontSize: '3xl',
    fontWeight: 'bold',
    letterSpacing: 'normal',
    lineHeight: 'tight',
    classification: 'display'
  },
  'heading-3': {
    fontFamily: 'sans',
    fontSize: '2xl',
    fontWeight: 'semibold',
    letterSpacing: 'normal',
    lineHeight: 'snug',
    classification: 'display'
  },
  'heading-4': {
    fontFamily: 'sans',
    fontSize: 'xl',
    fontWeight: 'semibold',
    letterSpacing: 'normal',
    lineHeight: 'snug',
    classification: 'display'
  }
} as const satisfies Readonly<Record<string, TypographyRole>>

export type TypographyRoleName = keyof typeof TYPOGRAPHY_ROLES

export const TYPOGRAPHY_BREAKPOINT_REM = 40

export const NARROW_HEADING_SIZES = {
  'heading-1': '3xl',
  'heading-2': '2xl',
  'heading-3': 'xl'
} as const satisfies Partial<Record<TypographyRoleName, keyof typeof FONT_SIZES>>
```

- [x] **Step 4: Add accessibility and primitive-reference tests**

Add tests that:

- iterate every role and prove each key exists in its primitive table;
- select `classification === 'prose'` and assert numeric size ≥ `FONT_SIZES.base` and line height ≥ `LINE_HEIGHTS.normal`;
- assert only `micro` uses `2xs` and it is `restricted`;
- assert no role uses `inter`;
- assert exactly four role names start with `heading-`.

- [x] **Step 5: Run the focused test**

Run:

```bash
pnpm exec vitest run tests/typography-roles.test.ts
```

Expected: PASS.

- [x] **Step 6: Mutation-check matrix scope**

Temporarily delete `heading-4`, change `micro` to `xs`, and change `lead.lineHeight` to `snug`, one mutation at a time. The exact matrix, restricted-role, and prose-floor tests must fail respectively. Restore each mutation.

### Task 3: Semantic CSS and DTCG generator

**Files:**
- Create: `packages/tokens/generate/typography-roles.ts`
- Modify: `packages/tokens/tests/typography-roles.test.ts`

**Interfaces:**
- Produces:
  - `typographyRoleCss(): string`
  - `typographyRoleResponsiveCss(): string`
  - `typographyRoleTokens(): Readonly<Record<TypographyRoleName, TypographyCompositeToken>>`
  - `TYPOGRAPHY_ROLE_COUNT`
  - `TYPOGRAPHY_ROLE_PROPERTY_COUNT = 5`
  - `TYPOGRAPHY_RESPONSIVE_OVERRIDE_COUNT`
- Consumes: `TYPOGRAPHY_ROLES`, `NARROW_HEADING_SIZES`, `TYPOGRAPHY_BREAKPOINT_REM`.

- [x] **Step 1: Add failing CSS emission tests**

Assert the exact five body aliases:

```ts
expect(typographyRoleCss()).toContain(
  '  --lat-text-body-font-family: var(--lat-font-sans);\\n' +
    '  --lat-text-body-font-size: var(--lat-font-size-base);\\n' +
    '  --lat-text-body-font-weight: var(--lat-font-weight-regular);\\n' +
    '  --lat-text-body-letter-spacing: var(--lat-letter-spacing-normal);\\n' +
    '  --lat-text-body-line-height: var(--lat-line-height-normal);'
)
expect(typographyRoleCss().match(/--lat-text-/g)).toHaveLength(11 * 5)
```

Assert the exact responsive block:

```ts
expect(typographyRoleResponsiveCss()).toBe(`@media (width < 40rem) {
  :root {
    --lat-text-heading-1-font-size: var(--lat-font-size-3xl);
    --lat-text-heading-2-font-size: var(--lat-font-size-2xl);
    --lat-text-heading-3-font-size: var(--lat-font-size-xl);
  }
}`)
```

- [x] **Step 2: Add failing DTCG composite tests**

Assert:

```ts
expect(typographyRoleTokens().body).toEqual({
  $type: 'typography',
  $value: {
    fontFamily: '{global.font.sans}',
    fontSize: '{global.font-size.base}',
    fontWeight: '{global.font-weight.regular}',
    letterSpacing: '{global.letter-spacing.normal}',
    lineHeight: '{global.line-height.normal}'
  }
})
expect(Object.keys(typographyRoleTokens())).toHaveLength(11)
```

- [x] **Step 3: Run and verify RED**

Run:

```bash
pnpm exec vitest run tests/typography-roles.test.ts
```

Expected: FAIL because `generate/typography-roles.ts` does not exist.

- [x] **Step 4: Implement the generator**

Define:

```ts
export interface TypographyCompositeToken {
  readonly $type: 'typography'
  readonly $value: {
    readonly fontFamily: string
    readonly fontSize: string
    readonly fontWeight: string
    readonly letterSpacing: string
    readonly lineHeight: string
  }
}
```

Use a single property descriptor table to map matrix keys to CSS suffixes and DTCG groups:

```ts
const PROPERTIES = [
  ['fontFamily', 'font-family', 'font'],
  ['fontSize', 'font-size', 'font-size'],
  ['fontWeight', 'font-weight', 'font-weight'],
  ['letterSpacing', 'letter-spacing', 'letter-spacing'],
  ['lineHeight', 'line-height', 'line-height']
] as const
```

For every role, generate CSS aliases as `--lat-text-${role}-${cssProperty}: var(--lat-${primitiveGroup}-${primitiveName});`. Generate DTCG references as `{global.${dtcgGroup}.${primitiveName}}`. Exclude `classification` from both artefacts.

Generate the responsive CSS from `NARROW_HEADING_SIZES`; do not hardcode a second heading map.

- [x] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
pnpm exec vitest run tests/typography-roles.test.ts
```

Expected: PASS.

- [x] **Step 6: Mutation-check generation**

Temporarily omit `letterSpacing` from `PROPERTIES`, change the breakpoint suffix to `px`, and map heading 3 to `2xl`, one at a time. The property-count, exact-responsive, and narrow-map tests must fail. Restore each mutation.

### Task 4: Compose roles into both published artefacts

**Files:**
- Modify: `packages/tokens/generate/emit.ts`
- Modify: `packages/tokens/tests/emit.test.ts`
- Modify: `packages/tokens/tests/schema.test.ts`
- Modify: `packages/tokens/tests/__snapshots__/lattice.css`
- Modify: `packages/tokens/tests/__snapshots__/tokens.paths.txt`

**Interfaces:**
- Consumes all public exports from `generate/typography-roles.ts`.
- Produces role aliases and the responsive block in `lattice.css`; produces `global.text.*` composites in `tokens.json`.

- [x] **Step 1: Add failing integrated CSS assertions**

Update global declaration counts to:

```ts
const GLOBAL_DECLARATIONS =
  TYPOGRAPHY_PRIMITIVE_COUNT + TYPOGRAPHY_ROLE_COUNT * TYPOGRAPHY_ROLE_PROPERTY_COUNT
```

Assert:

- the first `:root` contains exactly `GLOBAL_DECLARATIONS`;
- the responsive block contains exactly three `--lat-text-*-font-size` overrides;
- each default role property appears once outside the responsive block;
- no non-heading role appears inside the responsive block;
- the generated header reports the derived primitive and role counts.

- [x] **Step 2: Add failing JSON and parity assertions**

Assert `global.text` has exactly eleven keys. For each role and each of five properties, convert the DTCG reference to its CSS `var()` equivalent and compare it to the emitted CSS alias. Assert that `tokens.json` has no `text-narrow` group.

- [x] **Step 3: Run integrated tests and verify RED**

Run:

```bash
pnpm exec vitest run tests/emit.test.ts
```

Expected: FAIL because `emit.ts` does not compose role output.

- [x] **Step 4: Compose CSS and JSON**

In `emitCss()`:

```ts
:root {
${typographyCss()}
${typographyRoleCss()}
}
```

Append `typographyRoleResponsiveCss()` after the theme/media blocks so the role override remains a separate, inspectable condition.

In `emitTokens()`:

```ts
global: {
  ...typographyTokens(),
  text: typographyRoleTokens()
}
```

Update the generated header to report:

```text
Typography: 21 primitives; 11 semantic roles x 5 properties.
```

Derive every number from exported counts.

- [x] **Step 5: Add schema coverage**

Extend the positive typography test:

```ts
expect(global.text?.body?.$type).toBe('typography')
expect(global.text?.body?.$value).toEqual({
  fontFamily: '{global.font.sans}',
  fontSize: '{global.font-size.base}',
  fontWeight: '{global.font-weight.regular}',
  letterSpacing: '{global.letter-spacing.normal}',
  lineHeight: '{global.line-height.normal}'
})
```

Add a negative test that clones the artefact, deletes `global.text.body.$value.lineHeight`, and expects schema validation to fail.

- [x] **Step 6: Run integrated and schema tests**

Run:

```bash
pnpm exec vitest run tests/emit.test.ts tests/schema.test.ts
```

Expected: PASS.

- [x] **Step 7: Observe snapshot failures before updating**

Run:

```bash
pnpm exec vitest run tests/snapshot.test.ts
```

Expected: FAIL with one new letter-spacing primitive, 55 role declarations, three responsive declarations, one new primitive path, and eleven `global.text.*` token paths.

- [x] **Step 8: Update and inspect snapshots**

Run:

```bash
pnpm exec vitest run tests/snapshot.test.ts -u
```

Inspect that no colour value, colour alias, or themed selector changed.

### Task 5: Real-browser breakpoint and reflow coverage

**Files:**
- Modify: `packages/tokens/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `packages/tokens/playwright.config.ts`
- Create: `packages/tokens/tests/browser/typography-roles.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `emitCss(buildAllScales())`, `TYPOGRAPHY_ROLES`.
- Produces: `pnpm test:browser`; folds browser coverage into `pnpm test`.

- [x] **Step 1: Add Playwright Test**

Run from the repository root:

```bash
pnpm --filter @chameleon-labs/lattice-tokens add -D @playwright/test@^1.61.0
```

Add scripts:

```json
"test": "vitest run && playwright test",
"test:unit": "vitest run",
"test:browser": "playwright test"
```

- [x] **Step 2: Configure two isolated Firefox projects**

Create `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  projects: [
    {
      name: 'firefox-default-16',
      use: {
        browserName: 'firefox',
        viewport: { width: 700, height: 900 }
      }
    },
    {
      name: 'firefox-default-20',
      use: {
        browserName: 'firefox',
        viewport: { width: 700, height: 900 },
        launchOptions: {
          firefoxUserPrefs: {
            'font.size.variable.x-western': 20,
            'font.size.fixed.x-western': 20
          }
        }
      }
    }
  ]
})
```

- [x] **Step 3: Write the browser test before installing Firefox**

Create the test with:

```ts
import { expect, test } from '@playwright/test'

import { TYPOGRAPHY_ROLES } from '../../config/typography-roles.js'
import { emitCss } from '../../generate/emit.js'
import { buildAllScales } from '../../generate/scale.js'

const emittedCss = emitCss(buildAllScales())
const applicationCss = Object.keys(TYPOGRAPHY_ROLES)
  .map(
    (role) => `[data-role="${role}"] {
  font-family: var(--lat-text-${role}-font-family);
  font-size: var(--lat-text-${role}-font-size);
  font-weight: var(--lat-text-${role}-font-weight);
  letter-spacing: var(--lat-text-${role}-letter-spacing);
  line-height: var(--lat-text-${role}-line-height);
}`
  )
  .join('\\n')
```

The first test sets in-memory HTML with `page.setContent()`, checks the computed root size, checks `matchMedia('(width < 40rem)')`, and checks heading 1:

- project `firefox-default-16`: root `16px`, media false, heading 1 `36px`;
- project `firefox-default-20`: root `20px`, media true, heading 1 `37.5px`.

The second test sets the viewport to 320px, applies `html { font-size: 24px }`, renders representative wrapping text for all eleven roles, and asserts:

```ts
expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
```

- [x] **Step 4: Install Firefox and verify the browser test**

Run:

```bash
cd packages/tokens
pnpm exec playwright install firefox
pnpm test:browser
```

Expected: four tests pass, two tests across two Firefox projects.

- [x] **Step 5: Add CI browser installation**

After `pnpm install --frozen-lockfile`, add:

```yaml
- name: Install Firefox
  run: pnpm --filter @chameleon-labs/lattice-tokens exec playwright install --with-deps firefox
```

Keep the existing `pnpm -r test` command so browser checks are a required gate.

- [x] **Step 6: Mutation-check the browser boundary**

Temporarily change the emitted query to `640px`; the large-default project must fail because Firefox still reports the query unmatched at 700px. Restore it. Temporarily remove the heading 1 override; the computed-size assertion must fail. Restore it.

### Task 6: Documentation, issue record, and full verification

**Files:**
- Modify: `README.md`
- Review every file changed by Tasks 1–5.

**Interfaces:**
- Produces: accurate public scope, a reviewable local diff, and issue #27 coordination.

- [x] **Step 1: Update README scope**

Move semantic typography roles out of “Not yet.” State that the token package now contains primitive and semantic typography, while components remain unimplemented.

- [x] **Step 2: Verify issue coordination remains accurate**

Confirm issue #27 still contains the approved matrix comment and its `Lattice v1` project item remains In Progress.

- [x] **Step 3: Run the complete gates**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Expected: all commands exit 0; Vitest reports all unit files passing and Playwright reports four Firefox tests passing.

- [x] **Step 4: Prove deterministic artefacts**

Run the build twice and compare:

```bash
pnpm build
shasum -a 256 packages/tokens/dist/lattice.css packages/tokens/dist/tokens.json
pnpm build
shasum -a 256 packages/tokens/dist/lattice.css packages/tokens/dist/tokens.json
```

Expected: both checksum pairs match exactly.

- [x] **Step 5: Inspect the complete local diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff
```

Expected: only issue #27 files are changed; generated `dist/` files remain ignored; no contributor-specific paths or AI attribution appear.

- [x] **Step 6: Request implementation review**

Report:

- exact files changed;
- red-green and mutation evidence;
- Vitest, Playwright, typecheck, build, and determinism results;
- any divergence from this plan.

Leave implementation changes uncommitted and unpushed until explicit approval.

- [x] **Step 7: Create small commits only after approval**

Use these boundaries:

```text
Add typography role contracts
Emit semantic typography roles
Test responsive typography in Firefox
Document semantic typography support
```

Do not add co-author trailers or AI/generated-by attribution. Push only `feat/typography-semantic-roles`; never push implementation commits directly to `main`.
