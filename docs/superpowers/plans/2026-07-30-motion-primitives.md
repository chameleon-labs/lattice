# Motion Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish five duration and three easing primitives once in Lattice CSS and DTCG JSON, and make the reduced-motion component contract explicit on issue #11.

**Architecture:** A dedicated `config/motion.ts` owns the reviewed values and tuple types. A matching `generate/motion.ts` converts them into eight CSS custom properties and two DTCG groups; `generate/emit.ts` only composes that output into the existing global tier. Reduced-motion behavior remains in the future component layer because the token package cannot infer transition-property semantics.

**Tech Stack:** TypeScript 7, Vitest 4, Ajv against DTCG 2025.10, pnpm, GitHub CLI.

## Global Constraints

- Work only on `feat/motion-primitives`; never commit implementation work to `main`.
- Emit exactly 5 durations and 3 easings: 8 motion primitives total.
- Durations are exactly `instant: 0`, `fast: 100`, `base: 150`, `slow: 250`, and `slower: 400`, expressed in milliseconds.
- No duration may exceed `400ms`.
- Easings are exactly `standard: [0.2, 0, 0, 1]`, `entrance: [0, 0, 0, 1]`, and `exit: [0.3, 0, 1, 1]`.
- Every easing has exactly four finite numeric components in the inclusive range `[0, 1]`.
- Publish CSS as `--lat-duration-*` and `--lat-easing-*`.
- Publish DTCG as `global.duration.*` with `$type: "duration"` and numeric `ms` values, and `global.easing.*` with `$type: "cubicBezier"` and four-number tuple values.
- Emit motion once in the global tier after layout primitives and before semantic typography roles; never duplicate it into light, dark or nested theme scopes.
- Do not emit a `prefers-reduced-motion` rule, a global transition reset, semantic motion roles, elevation, shadows or component behavior.
- Add a dedicated reduced-motion acceptance checklist to issue #11 without replacing its existing body.
- Keep implementation changes uncommitted and unpushed until the user reviews the complete local diff and explicitly approves it.
- After approval, use small commits without co-author trailers or AI/generated-by attribution.

---

## File Map

**Create**

- `packages/tokens/config/motion.ts` — reviewed duration values, easing tuples and literal-name types.
- `packages/tokens/generate/motion.ts` — CSS/DTCG conversion and derived counts.
- `packages/tokens/tests/motion.test.ts` — exact contracts, bounds, generation and parity.

**Modify**

- `packages/tokens/generate/emit.ts` — compose motion into global CSS and DTCG output.
- `packages/tokens/tests/emit.test.ts` — counts, ordering, scope, parity and reset prohibition.
- `packages/tokens/tests/schema.test.ts` — positive and negative duration/cubic-Bézier schema coverage.
- `packages/tokens/tests/snapshot.test.ts` — require representative motion paths.
- `packages/tokens/tests/__snapshots__/lattice.css` — reviewed generated CSS.
- `packages/tokens/tests/__snapshots__/tokens.paths.txt` — reviewed generated DTCG shape.
- `README.md` — move primitive motion into current scope.
- `docs/superpowers/plans/2026-07-30-motion-primitives.md` — track execution evidence.

**External coordination**

- GitHub issue #11 — append the approved reduced-motion acceptance checklist.

---

### Task 1: Typed motion contracts

**Files:**

- Create: `packages/tokens/config/motion.ts`
- Create: `packages/tokens/tests/motion.test.ts`

**Interfaces:**

- Produces:
  - `DURATIONS`
  - `EASINGS`
  - `EasingCurve`
  - `DurationName`
  - `EasingName`
- Consumed by: `generate/motion.ts` and direct contract tests.

- [ ] **Step 1: Confirm the branch and clean baseline**

Run:

```bash
git branch --show-current
git status --short
pnpm test
```

Expected:

- branch is `feat/motion-primitives`;
- only the committed design documents exist before implementation;
- the existing 339 unit tests and four Firefox tests pass.

- [ ] **Step 2: Write the failing exact-contract tests**

Create `packages/tokens/tests/motion.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { DURATIONS, EASINGS } from '../config/motion.js'

describe('motion primitive contracts', () => {
  it('carries the exact five-duration scale', () => {
    expect(DURATIONS).toEqual({
      instant: 0,
      fast: 100,
      base: 150,
      slow: 250,
      slower: 400
    })
  })

  it('keeps every duration finite, non-negative and within the ceiling', () => {
    const values = Object.values(DURATIONS)

    expect(values).toHaveLength(5)
    expect(values.every(Number.isFinite)).toBe(true)
    expect(values.every((value) => value >= 0)).toBe(true)
    expect(Math.max(...values)).toBe(400)
  })

  it('carries the exact three easing curves', () => {
    expect(EASINGS).toEqual({
      standard: [0.2, 0, 0, 1],
      entrance: [0, 0, 0, 1],
      exit: [0.3, 0, 1, 1]
    })
  })

  it('keeps every easing finite, four-component and inside the approved range', () => {
    for (const [name, curve] of Object.entries(EASINGS)) {
      expect(curve, name).toHaveLength(4)
      expect(curve.every(Number.isFinite), name).toBe(true)
      expect(curve.every((component) => component >= 0 && component <= 1), name).toBe(true)
    }
  })
})
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/motion.test.ts
```

Expected: FAIL because `config/motion.ts` does not exist.

- [ ] **Step 4: Implement the typed config**

Create `packages/tokens/config/motion.ts`:

```ts
export type EasingCurve = readonly [number, number, number, number]

export const DURATIONS = {
  instant: 0,
  fast: 100,
  base: 150,
  slow: 250,
  slower: 400
} as const satisfies Readonly<Record<string, number>>

export const EASINGS = {
  standard: [0.2, 0, 0, 1],
  entrance: [0, 0, 0, 1],
  exit: [0.3, 0, 1, 1]
} as const satisfies Readonly<Record<string, EasingCurve>>

export type DurationName = keyof typeof DURATIONS
export type EasingName = keyof typeof EASINGS
```

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/motion.test.ts
pnpm run typecheck
```

Expected: four focused tests pass and TypeScript exits `0`.

- [ ] **Step 6: Mutation-check the contracts**

Apply one temporary mutation at a time:

1. Change `base` from `150` to `151`; the exact-duration test must fail.
2. Change `slower` from `400` to `401`; the exact and ceiling tests must fail.
3. Remove one `entrance` component; TypeScript and the tuple-length test must fail.
4. Change `exit` to `[0.3, -0.1, 1, 1]`; the exact and range tests must fail.

Restore after every mutation and rerun the focused suite.

- [ ] **Step 7: Hold the intended commit boundary**

Do not commit yet. Record:

```text
Add motion primitive contracts
```

---

### Task 2: Dedicated motion generation

**Files:**

- Create: `packages/tokens/generate/motion.ts`
- Modify: `packages/tokens/tests/motion.test.ts`

**Interfaces:**

- Consumes: `DURATIONS`, `EASINGS`, `EasingCurve`, `DurationName`, `EasingName`.
- Produces:
  - `DurationToken`
  - `CubicBezierToken`
  - `MotionTokenGroups`
  - `MOTION_PRIMITIVE_COUNTS`
  - `MOTION_PRIMITIVE_COUNT`
  - `motionCss(): string`
  - `motionTokens(): MotionTokenGroups`

- [ ] **Step 1: Add failing generation tests**

Append to `packages/tokens/tests/motion.test.ts`:

```ts
import {
  MOTION_PRIMITIVE_COUNT,
  MOTION_PRIMITIVE_COUNTS,
  motionCss,
  motionTokens
} from '../generate/motion.js'

describe('motion primitive generation', () => {
  it('derives the exact family and total counts', () => {
    expect(MOTION_PRIMITIVE_COUNTS).toEqual({ duration: 5, easing: 3 })
    expect(MOTION_PRIMITIVE_COUNT).toBe(8)
  })

  it('emits exactly one CSS value per primitive', () => {
    const css = motionCss()

    expect(css.match(/--lat-/g)).toHaveLength(8)
    expect(css).toContain('--lat-duration-instant: 0ms;')
    expect(css).toContain('--lat-duration-base: 150ms;')
    expect(css).toContain('--lat-duration-slower: 400ms;')
    expect(css).toContain('--lat-easing-standard: cubic-bezier(0.2, 0, 0, 1);')
    expect(css).toContain('--lat-easing-entrance: cubic-bezier(0, 0, 0, 1);')
    expect(css).toContain('--lat-easing-exit: cubic-bezier(0.3, 0, 1, 1);')
    expect(css).not.toContain('prefers-reduced-motion')
    expect(css).not.toContain('transition')
  })

  it('emits duration and cubicBezier DTCG groups', () => {
    const tokens = motionTokens()

    expect(Object.keys(tokens)).toEqual(['duration', 'easing'])
    expect(tokens.duration.base).toEqual({
      $type: 'duration',
      $value: { value: 150, unit: 'ms' }
    })
    expect(tokens.easing.standard).toEqual({
      $type: 'cubicBezier',
      $value: [0.2, 0, 0, 1]
    })
  })

  it('keeps CSS and DTCG names and values in parity', () => {
    const css = motionCss()
    const tokens = motionTokens()

    for (const [name, token] of Object.entries(tokens.duration)) {
      expect(css, `duration.${name}`).toContain(
        `--lat-duration-${name}: ${token.$value.value}${token.$value.unit};`
      )
    }
    for (const [name, token] of Object.entries(tokens.easing)) {
      expect(css, `easing.${name}`).toContain(
        `--lat-easing-${name}: cubic-bezier(${token.$value.join(', ')});`
      )
    }
  })

  it('is deterministic', () => {
    expect(motionCss()).toBe(motionCss())
    expect(JSON.stringify(motionTokens())).toBe(JSON.stringify(motionTokens()))
  })
})
```

Move the generator import directly below the config import so all imports remain
before the test declarations.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/motion.test.ts
```

Expected: FAIL because `generate/motion.ts` does not exist.

- [ ] **Step 3: Implement the generator**

Create `packages/tokens/generate/motion.ts`:

```ts
import {
  DURATIONS,
  EASINGS,
  type DurationName,
  type EasingCurve,
  type EasingName
} from '../config/motion.js'

export interface DurationToken {
  readonly $type: 'duration'
  readonly $value: {
    readonly value: number
    readonly unit: 'ms'
  }
}

export interface CubicBezierToken {
  readonly $type: 'cubicBezier'
  readonly $value: EasingCurve
}

export interface MotionTokenGroups {
  readonly duration: Readonly<Record<DurationName, DurationToken>>
  readonly easing: Readonly<Record<EasingName, CubicBezierToken>>
}

export const MOTION_PRIMITIVE_COUNTS = {
  duration: Object.keys(DURATIONS).length,
  easing: Object.keys(EASINGS).length
} as const

export const MOTION_PRIMITIVE_COUNT = Object.values(MOTION_PRIMITIVE_COUNTS).reduce(
  (total, count) => total + count,
  0
)

const durationToken = (value: number): DurationToken => ({
  $type: 'duration',
  $value: { value, unit: 'ms' }
})

const easingToken = (value: EasingCurve): CubicBezierToken => ({
  $type: 'cubicBezier',
  $value: value
})

const durationTokens = (): MotionTokenGroups['duration'] =>
  Object.fromEntries(
    Object.entries(DURATIONS).map(([name, value]) => [name, durationToken(value)])
  ) as MotionTokenGroups['duration']

const easingTokens = (): MotionTokenGroups['easing'] =>
  Object.fromEntries(
    Object.entries(EASINGS).map(([name, value]) => [name, easingToken(value)])
  ) as MotionTokenGroups['easing']

export function motionCss(): string {
  const durations = Object.entries(DURATIONS)
    .map(([name, value]) => `  --lat-duration-${name}: ${value}ms;`)
    .join('\n')
  const easings = Object.entries(EASINGS)
    .map(([name, value]) => `  --lat-easing-${name}: cubic-bezier(${value.join(', ')});`)
    .join('\n')

  return `${durations}\n${easings}`
}

export function motionTokens(): MotionTokenGroups {
  return {
    duration: durationTokens(),
    easing: easingTokens()
  }
}
```

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/motion.test.ts
pnpm run typecheck
```

Expected: nine focused tests pass and TypeScript exits `0`.

- [ ] **Step 5: Mutation-check generation**

Apply one temporary mutation at a time:

1. Emit `s` instead of `ms`; exact CSS and DTCG parity tests must fail.
2. Rename the CSS family from `duration` to `time`; exact-name and parity tests must fail.
3. Omit `entrance` from CSS; the declaration count and parity tests must fail.
4. Format easing values without `cubic-bezier()`; the exact CSS tests must fail.
5. Add a `prefers-reduced-motion` or `transition` string; the prohibition test must fail.

Restore after every mutation and rerun the focused suite.

- [ ] **Step 6: Hold the intended commit boundary**

Do not commit yet. Record:

```text
Generate global motion primitives
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

- Consumes: every public export from `generate/motion.ts`.
- Produces: eight global CSS declarations and eight global DTCG leaves in the
  published artefacts.

- [ ] **Step 1: Add failing integrated CSS and JSON assertions**

In `packages/tokens/tests/emit.test.ts`, import:

```ts
import {
  MOTION_PRIMITIVE_COUNT,
  MOTION_PRIMITIVE_COUNTS,
  motionCss,
  motionTokens
} from '../generate/motion.js'
```

Add `MOTION_PRIMITIVE_COUNT` to `GLOBAL_DECLARATIONS` and to the expected DTCG
leaf count.

Add:

```ts
it('emits every motion primitive once in the global rule', () => {
  const [globalBlock] = splitBlocks(css)

  expect(globalBlock).toContain(motionCss())
  expect(count(motionCss())).toBe(MOTION_PRIMITIVE_COUNT)
  expect(css.match(/--lat-duration-instant:/g)).toHaveLength(1)
  expect(css.match(/--lat-duration-slower:/g)).toHaveLength(1)
  expect(css.match(/--lat-easing-standard:/g)).toHaveLength(1)
  expect(css.match(/--lat-easing-exit:/g)).toHaveLength(1)
})

it('reports derived motion counts in the generated header', () => {
  expect(css).toContain(
    `/* Motion primitives: ${MOTION_PRIMITIVE_COUNTS.duration} durations; ` +
      `${MOTION_PRIMITIVE_COUNTS.easing} easings. */`
  )
})

it('does not emit component-level reduced-motion behavior', () => {
  expect(css).not.toContain('prefers-reduced-motion')
  expect(css).not.toMatch(/transition\s*:\s*none/)
})
```

Under the `tokens.json` suite, add:

```ts
it('keeps motion primitives global and out of colour modes', () => {
  const global = tokens['global'] as Record<string, unknown>
  const motion = motionTokens()

  expect(global['duration']).toEqual(motion.duration)
  expect(global['easing']).toEqual(motion.easing)
  expect(Object.keys(global['duration'] as object)).toHaveLength(5)
  expect(Object.keys(global['easing'] as object)).toHaveLength(3)
  expect(tokens['light']).not.toHaveProperty('duration')
  expect(tokens['light']).not.toHaveProperty('easing')
  expect(tokens['dark']).not.toHaveProperty('duration')
  expect(tokens['dark']).not.toHaveProperty('easing')
})
```

- [ ] **Step 2: Run integrated tests and verify RED**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/emit.test.ts
```

Expected: FAIL because `emit.ts` has not composed motion output.

- [ ] **Step 3: Compose motion CSS and DTCG**

In `packages/tokens/generate/emit.ts`, import:

```ts
import {
  MOTION_PRIMITIVE_COUNTS,
  motionCss,
  motionTokens
} from './motion.js'
```

Add the derived header:

```ts
/* Motion primitives: ${MOTION_PRIMITIVE_COUNTS.duration} durations; ${MOTION_PRIMITIVE_COUNTS.easing} easings. */
```

Compose global CSS in this order:

```ts
:root {
${typographyCss()}
${layoutCss()}
${motionCss()}
${typographyRoleCss()}
}
```

Compose DTCG:

```ts
global: {
  $description:
    'Theme-independent typography, layout and motion primitives, plus semantic typography. Emitted once.',
  ...typographyTokens(),
  ...layoutTokens(),
  ...motionTokens(),
  text: typographyRoleTokens()
}
```

- [ ] **Step 4: Add positive and negative schema assertions**

In `packages/tokens/tests/schema.test.ts`, extend the global value-shape test:

```ts
expect(global['duration']?.['base']?.$value).toEqual({ value: 150, unit: 'ms' })
expect(global['easing']?.['standard']?.$value).toEqual([0.2, 0, 0, 1])
```

Add:

```ts
it('rejects a duration unit the format cannot represent', () => {
  const broken = structuredClone(tokens) as Record<string, unknown>
  const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>
  global['duration']!['base'] = {
    $type: 'duration',
    $value: { value: 150, unit: 'frames' }
  }

  expect(validate(broken)).toBe(false)
})

it('rejects a cubicBezier x coordinate outside the format range', () => {
  const broken = structuredClone(tokens) as Record<string, unknown>
  const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>
  global['easing']!['standard'] = {
    $type: 'cubicBezier',
    $value: [1.1, 0, 0, 1]
  }

  expect(validate(broken)).toBe(false)
})
```

- [ ] **Step 5: Extend representative snapshot-path coverage**

In `packages/tokens/tests/snapshot.test.ts`, add:

```ts
'global.duration.base',
'global.easing.standard',
```

- [ ] **Step 6: Run integrated and schema tests**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/motion.test.ts tests/emit.test.ts tests/schema.test.ts
```

Expected: PASS.

- [ ] **Step 7: Observe snapshot failures before updating**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/snapshot.test.ts
```

Expected: two snapshot failures showing:

- one derived motion-count header;
- eight new declarations in the first `:root`;
- eight new `global.duration.*` / `global.easing.*` paths;
- no light, dark, preference or colour-value changes.

- [ ] **Step 8: Update and inspect snapshots**

Run:

```bash
cd packages/tokens
pnpm exec vitest run tests/snapshot.test.ts -u
cd ../..
git diff -- packages/tokens/tests/__snapshots__/lattice.css
git diff -- packages/tokens/tests/__snapshots__/tokens.paths.txt
```

Confirm the snapshot diff contains only the expected header, eight global CSS
declarations and eight global DTCG paths.

- [ ] **Step 9: Mutation-check integration scope**

Apply one temporary mutation at a time:

1. Move `motionCss()` into a themed block; once-only CSS and block-count tests must fail.
2. Put `motionTokens()` under `light`; global-only JSON and snapshot tests must fail.
3. Remove `MOTION_PRIMITIVE_COUNT` from the leaf count; the count test must fail.
4. Add a global reduced-motion reset; the reset-prohibition test must fail.
5. Replace a `cubicBezier` tuple with a string; direct generator and schema tests must fail.

Restore after every mutation.

- [ ] **Step 10: Hold the intended commit boundary**

Do not commit yet. Record:

```text
Publish global motion primitives
```

---

### Task 4: Documentation, issue coordination and complete verification

**Files:**

- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-30-motion-primitives.md`
- Review: every implementation file changed by Tasks 1–3.
- External: append acceptance criteria to GitHub issue #11.

**Interfaces:**

- Produces: accurate package scope, a durable component-layer accessibility
  contract, full verification evidence and a reviewable uncommitted diff.

- [ ] **Step 1: Update README scope**

Change the scope paragraphs to:

```md
**In:** colour scales, semantic colour tokens, light and dark modes, an ordered severity ramp, validated categorical and sequential chart palettes, primitive and semantic typography tokens, primitive spacing, breakpoints, containers and radii tokens, and primitive motion tokens.

**Not yet:** components, semantic spacing and motion, elevation, wide-gamut output, forced-colors handling. Each is tracked separately.
```

- [ ] **Step 2: Append the issue #11 reduced-motion contract**

Read and preserve the current body:

```bash
gh issue view 11 --repo chameleon-labs/lattice --json body,url
```

Append this section exactly once:

```md
## Reduced-motion acceptance criteria

- [ ] Under `prefers-reduced-motion: reduce`, remove transform animation and positional movement.
- [ ] Preserve opacity and colour transition feedback.
- [ ] Do not use a global `* { transition: none }` reset.
- [ ] Make continuous motion, or motion lasting longer than five seconds, pausable.
```

Use an idempotent update:

```bash
current_body=$(gh issue view 11 --repo chameleon-labs/lattice --json body --jq .body)
if [[ "$current_body" != *"## Reduced-motion acceptance criteria"* ]]; then
  addition=$'## Reduced-motion acceptance criteria\n\n- [ ] Under `prefers-reduced-motion: reduce`, remove transform animation and positional movement.\n- [ ] Preserve opacity and colour transition feedback.\n- [ ] Do not use a global `* { transition: none }` reset.\n- [ ] Make continuous motion, or motion lasting longer than five seconds, pausable.'
  gh api --method PATCH repos/chameleon-labs/lattice/issues/11 \
    -f body="${current_body}"$'\n\n'"${addition}"
fi
```

Verify:

```bash
gh issue view 11 --repo chameleon-labs/lattice --json body,url
```

Expected: the original body is unchanged above one new checklist section.

- [ ] **Step 3: Verify issue #29 coordination**

Run:

```bash
gh issue view 29 --repo chameleon-labs/lattice --json state,projectItems,url
```

Expected: issue #29 is open and its `Lattice v1` item is `In Progress`.

- [ ] **Step 4: Run the complete gates**

Run from the repository root:

```bash
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Expected:

- every Vitest file passes;
- all four Firefox tests pass;
- typecheck and build exit `0`;
- the diff has no whitespace errors.

- [ ] **Step 5: Prove deterministic artefacts**

Run:

```bash
pnpm build
shasum -a 256 packages/tokens/dist/lattice.css packages/tokens/dist/tokens.json
pnpm build
shasum -a 256 packages/tokens/dist/lattice.css packages/tokens/dist/tokens.json
```

Expected: both checksum pairs match exactly.

- [ ] **Step 6: Inspect the complete local diff**

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

- only issue #29 files changed;
- generated `dist/` remains ignored;
- exactly eight motion primitives were introduced;
- no reduced-motion CSS, transition reset, semantic motion, elevation or shadow
  token was introduced;
- no contributor-specific path, co-author trailer or AI attribution appears;
- the index is empty and implementation remains uncommitted.

- [ ] **Step 7: Request implementation review**

Report:

- exact files changed;
- RED/GREEN and mutation evidence;
- issue #11 and #29 coordination evidence;
- unit, Firefox, typecheck, build and determinism results;
- any divergence from this plan;
- the complete uncommitted implementation diff.

Leave every implementation change uncommitted and unpushed until explicit
approval.

- [ ] **Step 8: Create small commits only after approval**

Use these boundaries:

```text
Add motion primitive contracts
Generate global motion primitives
Publish global motion primitives
Document motion primitive support
```

Do not add co-author trailers or AI/generated-by attribution. Push only
`feat/motion-primitives`; never push implementation commits directly to `main`.
