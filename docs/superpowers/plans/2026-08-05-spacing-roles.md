# Semantic Spacing Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract semantic inset and gap roles from the component stylesheets, completing tier 2 of the spacing layer ([#38](https://github.com/chameleon-labs/lattice/issues/38)).

**Architecture:** Three inset families plus a gap scale, emitted from `packages/tokens` as theme-independent globals that reference the `--lat-space-*` primitives rather than restating their values. Components migrate off primitives onto the roles; a contract test keeps them there.

**Tech Stack:** TypeScript 7, tsx, Node 24, vitest, Playwright.

## Global Constraints

- The vocabulary is **fixed and already approved** on [#38](https://github.com/chameleon-labs/lattice/issues/38#issuecomment-5185907486). Do not invent, rename or extend a rung without saying so and stopping.
- Roles are emitted **once, in the global tier**, never inside a `[data-lat-theme]` scope. Spacing does not vary by theme.
- Roles **reference primitives** — `var(--lat-space-2)` — rather than restating `0.5rem`. That is the semantic tier's whole purpose: change a primitive and every role follows.
- **No rendered value may change.** This is an extraction. Every migrated declaration must compute to exactly what it computed before. A migration that "tidies" a value is a defect.
- `.js` extension imports (NodeNext). Tests in each package's `tests/`. No jest-dom in `packages/react`.
- Commit signing: the repo sets `commit.gpgsign=true` and all keys are expired. Use `git -c commit.gpgsign=false commit -m "..."`.
- **No `Co-Authored-By` trailer.** This repo does not use them.
- `pages.css` is **out of scope** — it styles story scaffolding, not exported components.

## The approved vocabulary

> **Superseded naming.** The `control` family shipped as `--lat-inset-label-*`.
> Two of its seven consumers turned out to be headers rather than controls, so
> the name was wrong while the grouping was right. This file is left as the plan
> that was executed; the
> [spacing spec](../specs/2026-07-30-lattice-spacing-and-motion-design.md#the-shipped-inset-and-gap-vocabulary)
> is the current record.

| role | value | consumers |
| --- | --- | --- |
| `--lat-inset-control-sm` | `space-1 / space-3` | `.lat-button[data-size='sm']`, `.lat-code-block__copy` |
| `--lat-inset-control-md` | `space-2 / space-4` | `.lat-button[data-size='md']`, `.lat-tab`, `.lat-table__header` |
| `--lat-inset-control-lg` | `space-3 / space-5` | `.lat-button[data-size='lg']`, `.lat-card__header` |
| `--lat-inset-row-sm` | `space-2 / space-3` | `.lat-menu__item`, `.lat-disclosure`, `.lat-input` |
| `--lat-inset-row-md` | `space-3 / space-4` | `.lat-table__cell` |
| `--lat-inset-surface-sm` | `space-3` | `.lat-tab-panel`, `.lat-disclosure__content` |
| `--lat-inset-surface-md` | `space-4` | `.lat-callout`, `.lat-code-block__pre` |
| `--lat-inset-surface-lg` | `space-5` | `.lat-card__body` |
| `--lat-inset-surface-xl` | `space-6` | `.lat-dialog` |
| `--lat-gap-xs` | `space-1` | 9 uses |
| `--lat-gap-sm` | `space-2` | 14 uses |
| `--lat-gap-md` | `space-3` | 18 uses |
| `--lat-gap-lg` | `space-4` | 8 uses |

**Two documented exceptions stay on primitives**, each needing a comment saying why:

- `.lat-segmented-control__label` — `space-1-5 / space-4`, reproducing `py-1.5 px-4` from the reference design.
- `.lat-menu` — `space-1`, a track hugging its items rather than a container interior.

## File Structure

**Created**
- `packages/tokens/config/spacing-roles.ts` — the vocabulary as data, with the rationale for each family.
- `packages/tokens/generate/spacing-roles.ts` — CSS and DTCG emission.
- `packages/tokens/tests/spacing-roles.test.ts`
- `packages/react/tests/spacing-roles-css.test.ts` — the contract test.

**Modified**
- `packages/tokens/generate/emit.ts` — wire the new block into the `:root` group.
- 11 component stylesheets in `packages/react/src/*/`.
- `docs/superpowers/specs/2026-07-30-lattice-spacing-and-motion-design.md` — tier 2's table.

---

### Task 1: The vocabulary as config

**Files:**
- Create: `packages/tokens/config/spacing-roles.ts`
- Test: `packages/tokens/tests/spacing-roles.test.ts`

**Interfaces:**
- Produces: `INSET_ROLES`, `GAP_ROLES`, `type InsetRole`, `type GapRole`, `type SpaceName` re-export as needed.

An inset value is either a **pair** (block, inline) or a **single** symmetric value. Model that in the type so an invalid shape is a compile error rather than a runtime surprise.

- [ ] **Step 1: Write the failing test**

```ts
// packages/tokens/tests/spacing-roles.test.ts
import { describe, expect, it } from 'vitest'
import { SPACES } from '../config/layout.js'
import { GAP_ROLES, INSET_ROLES } from '../config/spacing-roles.js'

describe('spacing roles', () => {
  it('names every inset by purpose, not by size alone', () => {
    for (const name of Object.keys(INSET_ROLES)) {
      expect(name).toMatch(/^(control|row|surface)-/)
    }
  })

  it('gives controls more inline inset than block, and rows less', () => {
    // The two series are the finding this vocabulary encodes: a control needs
    // horizontal room for its label, a row is already bounded by its siblings.
    const lead = (role: string) => {
      const v = INSET_ROLES[role]!
      if (!Array.isArray(v)) throw new Error(`${role} is not a pair`)
      const [block, inline] = v
      return SPACES[inline]!.multiplier - SPACES[block]!.multiplier
    }
    for (const role of ['control-sm', 'control-md', 'control-lg']) expect(lead(role)).toBe(2)
    for (const role of ['row-sm', 'row-md']) expect(lead(role)).toBe(1)
  })

  it('keeps every surface inset symmetric', () => {
    for (const [name, value] of Object.entries(INSET_ROLES)) {
      if (!name.startsWith('surface-')) continue
      expect(Array.isArray(value)).toBe(false)
    }
  })

  it('orders the surface scale monotonically', () => {
    const sizes = ['surface-sm', 'surface-md', 'surface-lg', 'surface-xl']
      .map((r) => SPACES[INSET_ROLES[r] as string]!.multiplier)
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
    expect(new Set(sizes).size).toBe(sizes.length)
  })

  it('references only primitives that exist', () => {
    const names = [
      ...Object.values(INSET_ROLES).flatMap((v) => (Array.isArray(v) ? v : [v])),
      ...Object.values(GAP_ROLES)
    ]
    for (const name of names) expect(SPACES).toHaveProperty(name)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd packages/tokens && npx vitest run tests/spacing-roles.test.ts`
Expected: FAIL — `Cannot find module '../config/spacing-roles.js'`

- [ ] **Step 3: Write the config**

```ts
/**
 * Semantic spacing roles — tier 2 of the spacing layer.
 *
 * Extracted from the component stylesheets rather than designed ahead of them,
 * because a draft that specified `--lat-inset-sm|md|lg` before any component
 * existed failed on the first one written against it: two axes climbing one
 * three-step scale collide at the top, and the largest size repeats a value.
 *
 * What the measurement showed instead is three families, each answering a
 * different question:
 *
 * - **control** — how much room a control gives its label. Inline leads block
 *   by two steps at every rung.
 * - **row** — how much room a row in a list gives its content. Inline leads by
 *   one, because a row is already bounded by its siblings.
 * - **surface** — how much room a container gives its children. Symmetric.
 *
 * The control/row split is the useful part: they are not neighbours on one
 * scale, they encode a difference in kind, and naming them by purpose is what
 * stops a menu item reaching for a button's inset.
 *
 * Values are primitive *names*, not numbers, so a change to `SPACES` flows
 * through every role rather than being restated here.
 */
import type { SPACES } from './layout.js'

export type SpaceName = keyof typeof SPACES

/** A pair travels together: `[block, inline]`. A string is symmetric. */
export type InsetValue = readonly [SpaceName, SpaceName] | SpaceName

export const INSET_ROLES = {
  'control-sm': ['1', '3'],
  'control-md': ['2', '4'],
  'control-lg': ['3', '5'],

  'row-sm': ['2', '3'],
  'row-md': ['3', '4'],

  /**
   * Only `sm` and `md` repeat across the library; `lg` and `xl` are used once
   * each. They exist anyway because the alternative — snapping Dialog from
   * space-6 to space-5 so a rung earns its place — changes rendering to tidy a
   * token table. A single-use rung on an ordered scale is defensible in a way a
   * single-use pair would not be.
   */
  'surface-sm': '3',
  'surface-md': '4',
  'surface-lg': '5',
  'surface-xl': '6'
} as const satisfies Readonly<Record<string, InsetValue>>

export type InsetRole = keyof typeof INSET_ROLES

/**
 * Gaps are named by size, not purpose — unlike insets, the measurement showed
 * no purpose split to encode, and inventing one for symmetry would be a
 * distinction the system does not have.
 *
 * Stops at `space-4`. Larger gaps appear only in page layout, never in
 * component internals, and a role covering them would invite a component to
 * reach for a page-sized gap.
 */
export const GAP_ROLES = {
  xs: '1',
  sm: '2',
  md: '3',
  lg: '4'
} as const satisfies Readonly<Record<string, SpaceName>>

export type GapRole = keyof typeof GAP_ROLES
```

- [ ] **Step 4: Run it green, then commit**

Run: `npx vitest run tests/spacing-roles.test.ts` → PASS, 5 tests

```bash
git add packages/tokens
git -c commit.gpgsign=false commit -m "feat(tokens): the spacing-role vocabulary, as config

Three inset families extracted from the component stylesheets rather than
designed ahead of them. control and row are not neighbours on one scale —
inline leads block by two steps for a control and one for a row, which
encodes a difference in kind rather than of degree."
```

---

### Task 2: Emit the roles

**Files:**
- Create: `packages/tokens/generate/spacing-roles.ts`
- Modify: `packages/tokens/generate/emit.ts`
- Test: extend `packages/tokens/tests/spacing-roles.test.ts`

**Interfaces:**
- Produces: `spacingRoleCss(): string`, `spacingRoleTokens(): SpacingRoleTokenGroups`, `SPACING_ROLE_COUNT`.

**A decision this task must make explicit.** CSS wants a pair as one value so a call site can write `padding: var(--lat-inset-control-md)`. DTCG has **no two-dimension type** — a `dimension` token holds one value. So exact name-for-name parity is impossible for the pairs.

Resolve it this way, and record the reasoning in the module doc:

- **CSS** emits one property per rung, holding the shorthand: `--lat-inset-control-md: var(--lat-space-2) var(--lat-space-4);`
- **DTCG** emits each pair as a **group of two dimension tokens**, `block` and `inline`, each a real `dimension`. Symmetric surface roles emit as a single `dimension`.
- The parity assertion therefore checks **structural** correspondence — every CSS role has a DTCG counterpart resolving to the same values — rather than one name per name. Existing parity tests may assume 1:1; check and extend rather than weaken them.

- [ ] **Step 1: Write the failing tests**

```ts
  it('emits every role as a reference to a primitive, never a restated value', () => {
    const css = spacingRoleCss()
    // A role that inlines `0.5rem` silently detaches from the primitive it
    // was extracted from — the tier stops being a tier.
    expect(css).not.toMatch(/--lat-(inset|gap)-[a-z-]+:\s*[\d.]+rem/)
    expect(css).toContain('--lat-inset-control-md: var(--lat-space-2) var(--lat-space-4);')
    expect(css).toContain('--lat-inset-surface-xl: var(--lat-space-6);')
    expect(css).toContain('--lat-gap-md: var(--lat-space-3);')
  })

  it('gives every CSS role a DTCG counterpart with the same values', () => {
    const tokens = spacingRoleTokens()
    const pair = tokens.inset['control-md'] as { block: { $value: { value: number } }, inline: { $value: { value: number } } }
    expect(pair.block.$value.value).toBe(SPACES['2']!.rem)
    expect(pair.inline.$value.value).toBe(SPACES['4']!.rem)
    const single = tokens.inset['surface-xl'] as { $value: { value: number } }
    expect(single.$value.value).toBe(SPACES['6']!.rem)
  })
```

- [ ] **Step 2: Run and watch fail**, then implement `generate/spacing-roles.ts`, following `generate/layout.ts`'s shape for the DTCG side.

- [ ] **Step 3: Wire into `emit.ts`'s `:root` block**, alongside `layoutCss()` — **not** into `themedBlock`. Add a header-comment count like the other groups.

- [ ] **Step 4: Rebuild and check the output by eye**

```bash
cd packages/tokens && npx tsx generate/build.ts
grep -E "lat-(inset|gap)-" dist/lattice.css
```

Confirm all 13 roles appear once, in `:root`, and that none appears inside a `[data-lat-theme]` block.

- [ ] **Step 5: Refresh snapshots, run the suite, commit**

`npx vitest run` — update `tests/__snapshots__/` and any count assertion that derives from the token totals. Read the snapshot diff before accepting it.

---

### Task 3: Migrate the components

**Files:** the 11 stylesheets in the vocabulary table.

**No rendered value may change.** Verify that claim rather than assuming it — see Step 3.

- [ ] **Step 1: Capture a before-baseline**

With Storybook running, record the computed `padding` and `gap` of every affected selector in both themes. A small Playwright script writing JSON is fine; it is scaffolding, not a committed test.

- [ ] **Step 2: Migrate, one component per commit**

Replace each declaration with its role. Add the two exception comments:

```css
/* Not `--lat-inset-control-sm`: this reproduces the reference design's
   `py-1.5 px-4` exactly, and no rung sits at 1.5/4. Snapping it to a rung
   would change the rendering to tidy a token table. */
.lat-segmented-control__label { padding: var(--lat-space-1-5) var(--lat-space-4); }
```

```css
/* A track hugging its items, not a container interior — structurally the same
   as SegmentedControl's, which is why it takes no `--lat-inset-surface-*`. */
.lat-menu { padding: var(--lat-space-1); }
```

~~`.lat-input`'s split `padding-block` / `padding-inline` collapses to `padding: var(--lat-inset-row-sm)`. Confirm the computed result is identical.~~

> **This instruction was wrong and was not followed.** The two declarations are
> on different elements, not two axes of one: `.lat-input-field` (the wrapper)
> owns `padding-inline`, `.lat-input` (the `<input>`) owns `padding-block`.
> Collapsing them onto the wrapper keeps the field's outer height identical —
> which is exactly why "confirm the computed result is identical" would have
> passed — but shrinks the `<input>`'s own box from 36px to 20px. The wrapper is
> a `<div>`, not a `<label>`, so a click in the vertical padding would then land
> on nothing and stop focusing the field. `.lat-input` stays on primitives, with
> the reasoning in `input.css`.

- [ ] **Step 3: Diff the baseline**

Re-run the capture and diff against Step 1. **Every value must be identical.** Any difference is a defect in the migration, not an improvement — report it rather than accepting it.

- [ ] **Step 4: Full verification**

`npx vitest run`, `pnpm typecheck`, `npx playwright test`. The a11y sweep asserts the accepted contrast set; anything structural or novel is a regression.

---

### Task 4: The contract test

**Files:**
- Create: `packages/react/tests/spacing-roles-css.test.ts`

The issue's acceptance criterion is that **no component references a `--lat-space-*` primitive for a role the extraction covers**. Without a test, that decays on the next component.

- [ ] **Step 1: Write it**

Read the assembled stylesheet (follow `tests/stylesheet.test.ts`'s `assembleCss`), and for each component rule assert that `padding` and `gap` declarations use a role, with an explicit allow-list of the two documented exceptions. The allow-list must be small, named, and commented — a growing allow-list means the vocabulary is wrong and should be revisited rather than extended.

- [ ] **Step 2: Prove it discriminates**

Point one migrated component back at a primitive, confirm the test **fails**, restore, confirm it passes. Report both outcomes. A contract test whose failure you have not observed is not yet a contract.

- [ ] **Step 3: Confirm #37's assertion still holds** — every `var(--lat-*)` a component references exists in the emitted `lattice.css`. The new roles must satisfy it.

---

### Task 5: Documentation

- [ ] Update `docs/superpowers/specs/2026-07-30-lattice-spacing-and-motion-design.md`'s tier-2 table with the shipped vocabulary, and record that `--lat-inset-*` turned out to be three families rather than one scale — the spec predicted a single `sm|md|lg`, and the components disproved it.
- [ ] Note the two documented exceptions.
- [ ] Comment on [#38](https://github.com/chameleon-labs/lattice/issues/38) with what shipped and any divergence from the approved vocabulary.

---

## Self-Review

**Spec coverage.** #38's scope has three bullets: report what repeats (done on the issue, before this plan), emit the roles as theme-independent globals (Task 2), migrate components off primitives (Task 3). Its acceptance list adds CSS/DTCG parity (Task 2), the no-primitive assertion (Task 4), #37's cross-package assertion still holding (Task 4 Step 3), and tests observed failing first (every task's Step 1).

**Placeholder scan.** No TBD. Every code step carries real code or an exact command. Task 3 describes a migration table already given in full above rather than repeating 21 declarations.

**Type consistency.** `InsetValue` is defined in Task 1 and consumed in Task 2; `SpaceName` derives from `SPACES` so an invalid primitive name is a compile error. `spacingRoleCss`/`spacingRoleTokens` are named in Task 2 and used by `emit.ts` in the same task.

**The risk worth naming.** Task 3 is the one that can silently break things: a migration that changes a computed value looks like a successful refactor. Step 1 and Step 3 exist solely to make that impossible to miss, and skipping them removes the only evidence the extraction was value-preserving.
