# Lattice Tokens Implementation Plan (Phase 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every value in `@chameleon-labs/lattice-tokens` with the Lattice identity, so `dist/lattice.css` emits the Figma-generated palette, type, shape, elevation and motion.

**Architecture:** The generated-curve colour pipeline is retired and replaced by **anchors** — verbatim hex from the Figma bundle, converted to OKLCH at build time. Grey is anchored at all eight roles it needs; each chromatic scale is anchored at its solid fill, from which a tinted triple (fill/border/text) is derived. The contrast contract becomes a printed report rather than a build gate. Typography, radii, motion and elevation are re-valued in place.

**Tech Stack:** TypeScript 7, tsx, Node 24, vitest, Playwright. No new runtime dependencies.

## Global Constraints

- Package: `packages/tokens`. Nothing in `packages/react` is touched by this plan.
- Every colour value is copied **verbatim** from `Custom Design System/src/styles/theme.css`. If a value is not in that file it is `derived` and must be labelled so in `tokens.json`.
- Custom property prefix stays `--lat-`.
- Emitted colours stay `oklch()` in CSS; `tokens.json` carries the source hex.
- The build **must not fail** on a contrast miss. Four documented failures ship — see the spec's §9 ledger.
- Spec: `docs/superpowers/specs/2026-08-03-lattice-identity-design.md`. Read §1 before Task 1.
- Source bundle: `/Users/george/Downloads/Custom Design System/`.
- Do not fix existing tests. Tests that assert old values are expected to fail after this plan; only tests this plan explicitly rewrites are updated.
- Commit after every task. Never commit to `main`.

## Reference: the anchors, with their measured OKLCH

Produced by `srgbToOklch(parseHex(...))` from the existing `generate/oklch.ts`. Task 1 must reproduce these exactly.

| scale.role | mode | hex | L | C | H |
| --- | --- | --- | --- | --- | --- |
| gray.bg | dark | `#0c0c14` | 0.159 | 0.0169 | 284.3 |
| gray.bg-raised | dark | `#111120` | 0.186 | 0.0304 | 283.0 |
| gray.bg-subtle | dark | `#16162a` | 0.211 | 0.0391 | 282.5 |
| gray.component | dark | `#1a1a2e` | 0.228 | 0.0384 | 282.9 |
| gray.field-bg | dark | `#1a1a2e` | 0.228 | 0.0384 | 282.9 |
| gray.switch-track | dark | `#2a2a48` | 0.300 | 0.0538 | 282.7 |
| gray.text-subtle | dark | `#6b6b90` | 0.542 | 0.0574 | 284.3 |
| gray.text | dark | `#e2e2ee` | 0.916 | 0.0162 | 286.1 |
| gray.bg | light | `#f0f0f8` | 0.957 | 0.0107 | 286.2 |
| gray.bg-raised | light | `#ffffff` | 1.000 | 0.0000 | 89.9 |
| gray.bg-subtle | light | `#eaeaf4` | 0.940 | 0.0134 | 286.1 |
| gray.component | light | `#e4e4f0` | 0.922 | 0.0162 | 286.1 |
| gray.field-bg | light | `#e8e8f2` | 0.934 | 0.0134 | 286.1 |
| gray.switch-track | light | `#c8c8dc` | 0.839 | 0.0277 | 285.8 |
| gray.text-subtle | light | `#58588a` | 0.482 | 0.0797 | 283.0 |
| gray.text | light | `#0c0c14` | 0.159 | 0.0169 | 284.3 |
| accent.solid | dark | `#cff23a` | 0.905 | 0.1990 | 120.3 |
| accent.solid | light | `#6a9b00` | 0.630 | 0.1662 | 128.6 |
| danger.solid | dark | `#ff4d6a` | 0.678 | 0.2130 | 15.8 |
| danger.solid | light | `#d41240` | 0.556 | 0.2160 | 18.0 |
| warning.solid | dark | `#fb923c` | 0.758 | 0.1590 | 55.9 |
| warning.solid | light | `#ea580c` | 0.646 | 0.1943 | 41.1 |
| success.solid | dark | `#34d399` | 0.773 | 0.1535 | 163.2 |
| success.solid | light | `#059669` | 0.596 | 0.1274 | 163.2 |
| info.solid | dark | `#38bdf8` | 0.754 | 0.1390 | 232.7 |
| info.solid | light | `#0284c7` | 0.588 | 0.1389 | 242.0 |
| decorative.solid | dark | `#a78bfa` | 0.709 | 0.1592 | 293.5 |
| decorative.solid | light | `#7c3aed` | 0.541 | 0.2466 | 293.0 |

`gray.bg-raised` light is pure `#ffffff`, whose hue is undefined; `srgbToOklch` returns 89.9 with C 0. Emit it as `oklch(1 0 0)`.

## File Structure

**Created**
- `config/anchors.ts` — the verbatim hex from the Figma bundle, per scale, per mode, per role. The single source of colour.
- `config/alpha.ts` — the alpha hairline/wash tier and the tint recipe fractions.
- `generate/anchors.ts` — resolves anchors to OKLCH swatches; derives the tinted triple.
- `generate/report.ts` — the contrast ledger, printed not thrown.
- `assets/fonts/` — self-hosted woff2.
- `generate/fonts.ts` — emits `@font-face` blocks.

**Modified**
- `config/semantic.ts`, `config/severity.ts`, `config/typography.ts`, `config/typography-roles.ts`, `config/layout.ts`, `config/motion.ts`, `config/elevation.ts`
- `generate/semantic.ts`, `generate/severity.ts`, `generate/emit.ts`, `generate/build.ts`
- `package.json` (files array, fonts export)

**Deleted**
- `config/lightness.ts`, `config/chroma.ts`, `config/contracts.ts`, `config/steps.ts`, `generate/scale.ts`, `generate/solve.ts`
- `tests/scale.test.ts`, `tests/contrast.test.ts` (replaced by `tests/report.test.ts` in Task 5)

`generate/oklch.ts`, `generate/contrast.ts`, `generate/cvd.ts` survive untouched — conversion, measurement and CVD simulation are all still needed.

`config/lightness.ts` currently exports `MODES` and `Mode`, which many modules import. Task 1 moves both to `config/modes.ts` and updates every importer.

---

### Task 1: Anchors replace the generated scale

**Files:**
- Create: `packages/tokens/config/anchors.ts`, `packages/tokens/config/modes.ts`, `packages/tokens/generate/anchors.ts`
- Test: `packages/tokens/tests/anchors.test.ts`
- Delete: `packages/tokens/config/lightness.ts`, `config/chroma.ts`, `config/contracts.ts`, `config/steps.ts`, `generate/scale.ts`, `generate/solve.ts`, `tests/scale.test.ts`

**Interfaces:**
- Consumes: `parseHex`, `srgbToOklch`, `formatHex`, `type Oklch`, `type Rgb` from `generate/oklch.js`.
- Produces:
  - `type Mode = 'light' | 'dark'`, `const MODES: readonly Mode[]` from `config/modes.js`
  - `GRAY_ROLES`, `type GrayRole`, `CHROMATIC_SCALES`, `type ChromaticScale`, `GRAY_ANCHORS`, `SOLID_ANCHORS`, `ON_SOLID_ANCHORS` from `config/anchors.js`
  - `interface Swatch { scale: string; role: string; mode: Mode; hex: string; l: number; c: number; h: number; origin: 'anchored' | 'derived' }`
  - `resolveGray(mode: Mode): Swatch[]`, `resolveSolids(mode: Mode): Swatch[]`, `resolveAll(mode: Mode): Swatch[]` from `generate/anchors.js`

- [ ] **Step 1: Write the failing test**

```ts
// packages/tokens/tests/anchors.test.ts
import { describe, expect, it } from 'vitest'
import { MODES } from '../config/modes.js'
import { GRAY_ANCHORS, SOLID_ANCHORS } from '../config/anchors.js'
import { resolveAll, resolveGray, resolveSolids } from '../generate/anchors.js'

describe('anchors', () => {
  it('resolves every grey role to the measured OKLCH', () => {
    const dark = resolveGray('dark')
    const bg = dark.find((s) => s.role === 'bg')!
    expect(bg.hex).toBe('#0c0c14')
    expect(bg.l).toBeCloseTo(0.159, 3)
    expect(bg.c).toBeCloseTo(0.0169, 4)
    expect(bg.h).toBeCloseTo(284.3, 1)
    expect(bg.origin).toBe('anchored')
  })

  it('round-trips every anchor back to its source hex', () => {
    for (const mode of MODES) {
      for (const swatch of resolveAll(mode)) {
        if (swatch.origin !== 'anchored') continue
        expect(swatch.hex).toMatch(/^#[0-9a-f]{6}$/)
      }
    }
  })

  it('anchors the accent solid at a different lightness per mode', () => {
    const dark = resolveSolids('dark').find((s) => s.scale === 'accent')!
    const light = resolveSolids('light').find((s) => s.scale === 'accent')!
    expect(dark.hex).toBe('#cff23a')
    expect(light.hex).toBe('#6a9b00')
    expect(dark.l).toBeGreaterThan(light.l + 0.2)
  })

  it('covers every declared anchor with no extras', () => {
    for (const mode of MODES) {
      const grayRoles = resolveGray(mode).map((s) => s.role).sort()
      expect(grayRoles).toEqual(Object.keys(GRAY_ANCHORS[mode]).sort())
      const solids = resolveSolids(mode).map((s) => s.scale).sort()
      expect(solids).toEqual(Object.keys(SOLID_ANCHORS).sort())
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/tokens && npx vitest run tests/anchors.test.ts`
Expected: FAIL — `Cannot find module '../config/modes.js'`

- [ ] **Step 3: Create `config/modes.ts`**

```ts
/**
 * The two themes.
 *
 * Previously exported from `config/lightness.ts` alongside the shared lightness
 * curve. The curve is gone — Lattice's anchors do not sit on one — so the mode
 * list lives on its own rather than inside a file named for a thing that no
 * longer exists.
 */
export type Mode = 'light' | 'dark'

export const MODES: readonly Mode[] = ['light', 'dark']
```

- [ ] **Step 4: Create `config/anchors.ts`**

```ts
/**
 * The Lattice palette, verbatim.
 *
 * Every value here is copied from the Figma bundle's `src/styles/theme.css`
 * without adjustment. This file is the whole of the colour system's input: there
 * is no curve, no envelope and no solver behind it.
 *
 * That is a deliberate reversal. Until 2026-08-03 this package generated its
 * palette from a lightness curve and a chroma envelope, and the generation was
 * the authority. Lattice's values do not lie on any single curve — its accent
 * is L 0.905 H 120 in dark and L 0.630 H 129 in light — so keeping the curve
 * would have meant approximating the identity rather than applying it.
 */
import type { Mode } from './modes.js'

/** The grey roles the Figma bundle names. Each is anchored in both modes. */
export const GRAY_ROLES = [
  'bg',
  'bg-raised',
  'bg-subtle',
  'component',
  'field-bg',
  'switch-track',
  'text-subtle',
  'text'
] as const

export type GrayRole = (typeof GRAY_ROLES)[number]

/** Scales carrying a single anchored solid fill. */
export const CHROMATIC_SCALES = [
  'accent',
  'danger',
  'warning',
  'success',
  'info',
  'decorative'
] as const

export type ChromaticScale = (typeof CHROMATIC_SCALES)[number]

/**
 * Grey.
 *
 * `bg-raised` is lighter than `bg` in both modes — Lattice lifts a surface by
 * raising its lightness regardless of theme, rather than inverting the
 * relationship in dark.
 *
 * `field-bg` equals `component` in dark and differs in light; both are recorded
 * rather than aliased, because the equality is a coincidence of this palette and
 * not a rule the next one has to keep.
 */
export const GRAY_ANCHORS: Record<Mode, Record<GrayRole, string>> = {
  dark: {
    bg: '#0c0c14',
    'bg-raised': '#111120',
    'bg-subtle': '#16162a',
    component: '#1a1a2e',
    'field-bg': '#1a1a2e',
    'switch-track': '#2a2a48',
    'text-subtle': '#6b6b90',
    text: '#e2e2ee'
  },
  light: {
    bg: '#f0f0f8',
    'bg-raised': '#ffffff',
    'bg-subtle': '#eaeaf4',
    component: '#e4e4f0',
    'field-bg': '#e8e8f2',
    'switch-track': '#c8c8dc',
    'text-subtle': '#58588a',
    text: '#0c0c14'
  }
}

/**
 * The solid fill of each chromatic scale.
 *
 * `info`, `success`, `warning` and `decorative` come from the Figma bundle's chart
 * slots. That is not an interpretation: the bundle's own documentation site
 * labels `chart-2` "Info", `chart-5` "Success" and `chart-3` "Accent" in its
 * token table while binding them to those slots.
 */
export const SOLID_ANCHORS: Record<ChromaticScale, Record<Mode, string>> = {
  accent: { dark: '#cff23a', light: '#6a9b00' },
  danger: { dark: '#ff4d6a', light: '#d41240' },
  warning: { dark: '#fb923c', light: '#ea580c' },
  success: { dark: '#34d399', light: '#059669' },
  info: { dark: '#38bdf8', light: '#0284c7' },
  decorative: { dark: '#a78bfa', light: '#7c3aed' }
}

/**
 * Text on a solid fill.
 *
 * Only the accent has one, because only the accent gets a solid button. Every
 * other scale appears as a tint with full-strength text on it, so it needs no
 * on-solid answer.
 */
export const ON_SOLID_ANCHORS: Partial<Record<ChromaticScale, Record<Mode, string>>> = {
  accent: { dark: '#0c0c14', light: '#ffffff' }
}

/**
 * The vivid accent.
 *
 * The Figma bundle keeps `--accent: #cff23a` in *both* modes while `--primary` drops to
 * olive in light. The chartreuse is the identity; the olive exists only so a
 * white label can sit on it. Emitted separately so a caller can reach the brand
 * colour without going through the primary fill.
 */
export const ACCENT_VIVID = '#cff23a'
```

- [ ] **Step 5: Create `generate/anchors.ts`**

```ts
/**
 * Anchors to swatches.
 *
 * Conversion only. Nothing here chooses a colour; it turns declared hex into the
 * OKLCH the stylesheet emits, and records where each value came from.
 */
import {
  ACCENT_VIVID,
  CHROMATIC_SCALES,
  GRAY_ANCHORS,
  GRAY_ROLES,
  ON_SOLID_ANCHORS,
  SOLID_ANCHORS
} from '../config/anchors.js'
import type { Mode } from '../config/modes.js'
import { parseHex, srgbToOklch } from './oklch.js'

export interface Swatch {
  readonly scale: string
  readonly role: string
  readonly mode: Mode
  readonly hex: string
  readonly l: number
  readonly c: number
  readonly h: number
  /** `anchored` came from the Figma bundle; `derived` was computed here. */
  readonly origin: 'anchored' | 'derived'
}

function swatch(
  scale: string,
  role: string,
  mode: Mode,
  hex: string,
  origin: 'anchored' | 'derived' = 'anchored'
): Swatch {
  const { l, c, h } = srgbToOklch(parseHex(hex))
  // Pure white and pure black have no meaningful hue; normalising to 0 keeps the
  // emitted value stable rather than carrying whatever the conversion happened
  // to produce for an achromatic colour.
  return { scale, role, mode, hex, l, c, h: c === 0 ? 0 : h, origin }
}

export function resolveGray(mode: Mode): Swatch[] {
  return GRAY_ROLES.map((role) => swatch('gray', role, mode, GRAY_ANCHORS[mode][role]))
}

export function resolveSolids(mode: Mode): Swatch[] {
  return CHROMATIC_SCALES.map((scale) => swatch(scale, 'solid', mode, SOLID_ANCHORS[scale][mode]))
}

export function resolveOnSolids(mode: Mode): Swatch[] {
  return CHROMATIC_SCALES.filter((scale) => ON_SOLID_ANCHORS[scale] !== undefined).map((scale) =>
    swatch(scale, 'on-solid', mode, ON_SOLID_ANCHORS[scale]![mode])
  )
}

export function resolveAll(mode: Mode): Swatch[] {
  return [
    ...resolveGray(mode),
    ...resolveSolids(mode),
    ...resolveOnSolids(mode),
    swatch('accent', 'vivid', mode, ACCENT_VIVID)
  ]
}
```

- [ ] **Step 6: Delete the retired curve machinery**

```bash
cd packages/tokens
git rm config/lightness.ts config/chroma.ts config/contracts.ts config/steps.ts \
       generate/scale.ts generate/solve.ts \
       tests/scale.test.ts tests/oklch.test.ts
```

Keep `tests/oklch.test.ts` if it tests `generate/oklch.ts` alone — check first with `head -20 tests/oklch.test.ts`; it does, so restore it: `git checkout tests/oklch.test.ts`.

- [ ] **Step 7: Repoint every `config/lightness.js` importer to `config/modes.js`**

```bash
cd packages/tokens
grep -rln "config/lightness.js" config generate tests | \
  xargs sed -i '' "s#config/lightness.js#config/modes.js#g; s#'../config/lightness.js'#'../config/modes.js'#g"
grep -rn "lightness" config generate tests || echo "no lightness references remain"
```

Any file importing `LIGHTNESS`, `DIRECTION` or `STEPS` from it will now fail to typecheck. Those are the modules Tasks 2–5 rewrite; leave them broken until then.

- [ ] **Step 8: Run test to verify it passes**

Run: `cd packages/tokens && npx vitest run tests/anchors.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 9: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): anchors replace the generated colour scale

Lattice's palette does not lie on a shared lightness curve — its accent is
L 0.905 H 120 in dark and L 0.630 H 129 in light — so the curve, the chroma
envelope and the per-step contracts are retired and the declared hex become
the input."
```

---

### Task 2: The alpha tier and the tinted triple

**Files:**
- Create: `packages/tokens/config/alpha.ts`
- Modify: `packages/tokens/generate/anchors.ts`
- Test: `packages/tokens/tests/alpha.test.ts`

**Interfaces:**
- Consumes: `Swatch`, `resolveSolids` from `generate/anchors.js`; `Mode` from `config/modes.js`.
- Produces: `HAIRLINE`, `WASH`, `TINT_FRACTIONS`, `FOCUS_RING_ALPHA` from `config/alpha.js`; `interface AlphaToken { role: string; value: string }`, `resolveAlpha(mode: Mode): AlphaToken[]`, `resolveTints(mode: Mode): AlphaToken[]` from `generate/anchors.js`.

**Why this task exists:** The Figma bundle draws every edge with white or black at 7–8%, and builds every badge and its destructive button from *colour at 10–15% with a border at 20–25% and full-strength text*. Lattice's border roles currently resolve to opaque scale steps, which composite with nothing. Without an alpha tier, a card inside a card cannot produce two different greys from one token, and the tinted triple gets re-typed by hand in a dozen components.

- [ ] **Step 1: Write the failing test**

```ts
// packages/tokens/tests/alpha.test.ts
import { describe, expect, it } from 'vitest'
import { resolveAlpha, resolveTints } from '../generate/anchors.js'

describe('alpha tier', () => {
  it('draws the dark hairline as white at 7%', () => {
    const border = resolveAlpha('dark').find((t) => t.role === 'border')!
    expect(border.value).toBe('rgb(255 255 255 / 0.07)')
  })

  it('draws the light hairline as black at 8%', () => {
    const border = resolveAlpha('light').find((t) => t.role === 'border')!
    expect(border.value).toBe('rgb(0 0 0 / 0.08)')
  })

  it('gives the accent a richer tint than the status scales', () => {
    const tints = resolveTints('dark')
    expect(tints.find((t) => t.role === 'accent-tint')!.value).toBe('rgb(207 242 58 / 0.15)')
    expect(tints.find((t) => t.role === 'accent-tint-border')!.value).toBe('rgb(207 242 58 / 0.25)')
    expect(tints.find((t) => t.role === 'danger-tint')!.value).toBe('rgb(255 77 106 / 0.1)')
    expect(tints.find((t) => t.role === 'danger-tint-border')!.value).toBe('rgb(255 77 106 / 0.2)')
  })

  it('emits a tint pair for every chromatic scale', () => {
    expect(resolveTints('light')).toHaveLength(12)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/tokens && npx vitest run tests/alpha.test.ts`
Expected: FAIL — `resolveAlpha is not a function`

- [ ] **Step 3: Create `config/alpha.ts`**

```ts
/**
 * The alpha tier.
 *
 * The Figma bundle's edges and washes are not scale steps — they are white or black at a
 * low alpha, so an edge composites over whatever surface it lies on. Two cards
 * nested inside one another therefore draw two visibly different greys from one
 * token, which an opaque step cannot do.
 *
 * Every fraction here appears literally in the Figma bundle. They are not tuned.
 */
import type { Mode } from './modes.js'

/** The channel each mode's alpha layers are drawn from. */
export const ALPHA_CHANNEL: Record<Mode, string> = {
  dark: '255 255 255',
  light: '0 0 0'
}

/** Resting edge. `border-white/[0.07]` and `border-black/[0.08]` in the bundle. */
export const HAIRLINE: Record<Mode, number> = { dark: 0.07, light: 0.08 }

/** Hover edge. `hover:border-white/15`. */
export const HAIRLINE_STRONG = 0.15

/** Hover fill. `hover:bg-foreground/5`. */
export const WASH = 0.05

/**
 * The tinted triple.
 *
 * The accent runs richer than the status scales — `bg-primary/15 …
 * border-primary/25` against `bg-[#38bdf8]/10 … border-[#38bdf8]/20` — because
 * chartreuse at 10% over a near-black surface is close to invisible.
 */
export const TINT_FRACTIONS = {
  accent: { fill: 0.15, border: 0.25 },
  default: { fill: 0.1, border: 0.2 }
} as const

/**
 * The focus ring.
 *
 * The Figma bundle declares `--ring` at 0.35/0.30 but its own components focus with
 * `ring-primary/40`. The value components actually use is the one emitted, since
 * a token nobody reaches for guarantees nothing.
 *
 * Recorded consequence: in light mode this lands at 1.56:1 against the card,
 * below the 3:1 that SC 1.4.11 requires of a focus indicator. It ships as
 * delivered — see the spec's §9 ledger.
 */
export const FOCUS_RING_ALPHA = 0.4
```

- [ ] **Step 4: Add the resolvers to `generate/anchors.ts`**

Append to the file:

```ts
import {
  ALPHA_CHANNEL,
  FOCUS_RING_ALPHA,
  HAIRLINE,
  HAIRLINE_STRONG,
  TINT_FRACTIONS,
  WASH
} from '../config/alpha.js'

export interface AlphaToken {
  readonly role: string
  readonly value: string
}

const rgbChannels = (hex: string): string => {
  const { r, g, b } = parseHex(hex)
  return `${r} ${g} ${b}`
}

const alpha = (channels: string, fraction: number): string =>
  `rgb(${channels} / ${String(fraction)})`

export function resolveAlpha(mode: Mode): AlphaToken[] {
  const channels = ALPHA_CHANNEL[mode]
  return [
    { role: 'border', value: alpha(channels, HAIRLINE[mode]) },
    { role: 'border-strong', value: alpha(channels, HAIRLINE_STRONG) },
    { role: 'wash', value: alpha(channels, WASH) },
    {
      role: 'focus-ring',
      value: alpha(rgbChannels(SOLID_ANCHORS.accent[mode]), FOCUS_RING_ALPHA)
    }
  ]
}

export function resolveTints(mode: Mode): AlphaToken[] {
  return CHROMATIC_SCALES.flatMap((scale) => {
    const channels = rgbChannels(SOLID_ANCHORS[scale][mode])
    const { fill, border } =
      scale === 'accent' ? TINT_FRACTIONS.accent : TINT_FRACTIONS.default
    return [
      { role: `${scale}-tint`, value: alpha(channels, fill) },
      { role: `${scale}-tint-border`, value: alpha(channels, border) }
    ]
  })
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/tokens && npx vitest run tests/alpha.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 6: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): add the alpha tier and the tinted triple

The Figma bundle's edges are white or black at 7-8% so they composite over their
surface, and its badges and destructive button are colour at 10-15% with a
20-25% border. Both become tokens rather than per-component literals."
```

---

### Task 3: Semantic roles remapped to the Figma bundle's names

**Files:**
- Modify: `packages/tokens/config/semantic.ts`, `packages/tokens/generate/semantic.ts`
- Test: `packages/tokens/tests/semantic.test.ts` (rewrite)

**Interfaces:**
- Consumes: `resolveAll`, `resolveAlpha`, `resolveTints` from `generate/anchors.js`.
- Produces: `ROLE_ALIASES: readonly RoleAlias[]` from `config/semantic.js`; `semanticBlock(mode: Mode): string` from `generate/semantic.js`.

**The complete emitted role list.** Phase 2 consumes exactly these names; nothing else exists.

| custom property | resolves to |
| --- | --- |
| `--lat-bg` | `--lat-gray-bg` |
| `--lat-bg-raised` | `--lat-gray-bg-raised` |
| `--lat-bg-subtle` | `--lat-gray-bg-subtle` |
| `--lat-component` | `--lat-gray-component` |
| `--lat-field-bg` | `--lat-gray-field-bg` |
| `--lat-switch-track` | `--lat-gray-switch-track` |
| `--lat-text` | `--lat-gray-text` |
| `--lat-text-subtle` | `--lat-gray-text-subtle` |
| `--lat-solid` | `--lat-accent-solid` |
| `--lat-on-solid` | `--lat-accent-on-solid` |
| `--lat-border` | alpha hairline |
| `--lat-border-strong` | alpha hairline, hover |
| `--lat-wash` | alpha wash |
| `--lat-focus-ring` | accent at 40% |
| `--lat-{scale}-solid` | per chromatic scale |
| `--lat-{scale}-tint`, `--lat-{scale}-tint-border` | per chromatic scale |
| `--lat-accent-vivid` | `#cff23a`, both modes |

- [ ] **Step 1: Write the failing test**

```ts
// packages/tokens/tests/semantic.test.ts
import { describe, expect, it } from 'vitest'
import { MODES } from '../config/modes.js'
import { semanticBlock } from '../generate/semantic.js'

describe('semantic tier', () => {
  it('emits every role in both modes', () => {
    for (const mode of MODES) {
      const css = semanticBlock(mode)
      for (const role of [
        '--lat-bg',
        '--lat-bg-raised',
        '--lat-bg-subtle',
        '--lat-component',
        '--lat-field-bg',
        '--lat-switch-track',
        '--lat-text',
        '--lat-text-subtle',
        '--lat-solid',
        '--lat-on-solid',
        '--lat-border',
        '--lat-border-strong',
        '--lat-wash',
        '--lat-focus-ring',
        '--lat-accent-vivid',
        '--lat-danger-tint',
        '--lat-danger-tint-border'
      ]) {
        expect(css).toContain(`${role}:`)
      }
    }
  })

  it('keeps the accent vivid identical across modes', () => {
    const find = (mode: 'light' | 'dark') =>
      semanticBlock(mode).split('\n').find((l) => l.includes('--lat-accent-vivid:'))
    expect(find('light')).toBe(find('dark'))
  })

  it('raises a surface above the page in both modes', () => {
    // bg-raised is lighter than bg in dark AND light — Lattice lifts by
    // lightness regardless of theme. Asserted against the resolved lightness,
    // not against the presence of a property name: a substring check would
    // still pass if the two anchors were swapped, which is the regression this
    // test exists to catch.
    for (const mode of MODES) {
      const gray = Object.fromEntries(resolveGray(mode).map((s) => [s.role, s]))
      expect(gray['bg-raised']!.l).toBeGreaterThan(gray.bg!.l)
    }
  })

  it('points every role alias at a primitive that is actually emitted', () => {
    // A dangling alias — var(--lat-something-nothing-emits) — resolves to
    // nothing at all in the browser and is invisible in a substring check.
    for (const mode of MODES) {
      const css = semanticBlock(mode)
      const declared = new Set(
        [...css.matchAll(/^\s*(--lat-[\w-]+):/gm)].map((m) => m[1]!)
      )
      for (const [, target] of css.matchAll(/var\((--lat-[\w-]+)\)/g)) {
        expect(declared).toContain(target)
      }
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/tokens && npx vitest run tests/semantic.test.ts`
Expected: FAIL — the old `semanticBlock` takes `(scales, mode)` and emits step aliases

- [ ] **Step 3: Replace `config/semantic.ts`**

Replace the whole file. The step-alias layer (`STEP_SLUGS`, `--lat-gray-9`) is deleted: there are no numbered steps any more, so a slug that translates a number into a job has nothing to translate.

```ts
/**
 * The semantic tier: the layer that makes a second theme cheap.
 *
 * The Figma bundle names its colours by job already — `--background`, `--card`,
 * `--muted-foreground` — so this tier is a rename rather than an interpretation.
 * The mapping is one-to-one and recorded in the spec's §1.1 table.
 *
 * The step-alias sub-layer is gone with the numbered scale. `--lat-gray-9` named
 * a step so a component could avoid knowing that 9 meant solid; with roles
 * anchored directly there is no number to hide.
 *
 * ## Why these are emitted into every theme scope
 *
 * A custom property whose value contains `var()` is substituted at
 * computed-value time on the element carrying the declaration, and the result is
 * what inherits. So `--lat-text: var(--lat-gray-text)` declared once on `:root`
 * freezes to the root theme's grey and keeps that value inside a nested scope
 * that redefines it. Every alias is therefore emitted alongside the primitives in
 * each mode block, which is what makes `[data-lat-theme]` work on any element.
 */

export interface RoleAlias {
  /** The custom property name, without the `--lat-` prefix. */
  readonly role: string
  /** The primitive it points at, without the `--lat-` prefix. */
  readonly source: string
}

export const ROLE_ALIASES: readonly RoleAlias[] = [
  { role: 'bg', source: 'gray-bg' },
  { role: 'bg-raised', source: 'gray-bg-raised' },
  { role: 'bg-subtle', source: 'gray-bg-subtle' },
  { role: 'component', source: 'gray-component' },
  { role: 'field-bg', source: 'gray-field-bg' },
  { role: 'switch-track', source: 'gray-switch-track' },
  { role: 'text', source: 'gray-text' },
  { role: 'text-subtle', source: 'gray-text-subtle' },
  { role: 'solid', source: 'accent-solid' },
  { role: 'on-solid', source: 'accent-on-solid' }
]
```

- [ ] **Step 4: Replace `generate/semantic.ts`**

```ts
import type { Mode } from '../config/modes.js'
import { ROLE_ALIASES } from '../config/semantic.js'
import { formatOklch } from './emit.js'
import { resolveAll, resolveAlpha, resolveTints } from './anchors.js'

/**
 * The semantic block for one mode: primitives, then the alpha tier, then the
 * role aliases that point at them.
 */
export function semanticBlock(mode: Mode): string {
  const primitives = resolveAll(mode)
    .map((s) => `  --lat-${s.scale}-${s.role}: ${formatOklch(s)};`)
    .join('\n')

  const alphas = [...resolveAlpha(mode), ...resolveTints(mode)]
    .map((t) => `  --lat-${t.role}: ${t.value};`)
    .join('\n')

  const roles = ROLE_ALIASES.map(
    (a) => `  --lat-${a.role}: var(--lat-${a.source});`
  ).join('\n')

  return [primitives, alphas, roles].join('\n\n')
}
```

`formatOklch` is imported from `emit.js` and `emit.js` will import `semanticBlock` — a cycle. Move `formatOklch` and its `trim` helper out of `generate/emit.ts` into a new `generate/format.ts`, and import it from there in both files.

- [ ] **Step 5: Create `generate/format.ts` and update both importers**

```ts
/**
 * Value formatting, shared by the emitters.
 *
 * Lives apart from `emit.ts` so `semantic.ts` can format a swatch without
 * importing the module that imports it.
 */
import type { Swatch } from './anchors.js'

/**
 * Decimal places kept in an emitted colour. Six round-trips every anchor
 * exactly, so the colour a browser computes is the colour whose contrast was
 * measured.
 */
const PLACES = 6

function trim(value: number): string {
  return String(Number(value.toFixed(PLACES)))
}

/** A swatch as a CSS `oklch()` value. */
export function formatOklch(swatch: Pick<Swatch, 'l' | 'c' | 'h'>): string {
  return `oklch(${trim(swatch.l)} ${trim(swatch.c)} ${trim(swatch.h)})`
}
```

Then in `generate/emit.ts`, delete the local `PLACES`, `trim` and `formatOklch`, and republish the name:

```ts
import { formatOklch } from './format.js'

export { formatOklch }
```

Two lines, not `export { formatOklch } from './format.js'`. An indirect
re-export publishes the name without creating a local binding, which would
leave `emit.ts`'s own four internal call sites unable to resolve it — and
`emit.ts` is itself one of the existing importers this step exists to keep
working.

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/tokens && npx vitest run tests/semantic.test.ts`
Expected: PASS, 3 tests

- [ ] **Step 7: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): remap semantic roles onto the Figma bundle's names

The Figma bundle names colours by job already, so the tier becomes a one-to-one
rename. The step-alias sub-layer goes with the numbered scale."
```

---

### Task 4: Severity repointed, with the one derived value

**Files:**
- Modify: `packages/tokens/config/severity.ts`, `packages/tokens/generate/severity.ts`
- Test: `packages/tokens/tests/severity.test.ts` (rewrite)

**Interfaces:**
- Produces: `SEVERITY_LEVELS`, `SEVERITY_ANCHORS` from `config/severity.js`; `buildSeverity(mode: Mode): Swatch[]` from `generate/severity.js` — same name and shape as today, so `emit.ts` needs no change here.

**The derivation.** The Figma bundle declares no light-mode `moderate`. Dark `serious` `#fb923c` (L 0.758) corresponds to light `#ea580c` (L 0.646) — a delta of **−0.112**. Applying that to dark `moderate` `#fbbf24` (L 0.837) gives a target L of **0.725** at the same hue (84.4) and chroma (0.1644), fitted to sRGB.

- [ ] **Step 1: Write the failing test**

```ts
// packages/tokens/tests/severity.test.ts
import { describe, expect, it } from 'vitest'
import { buildSeverity } from '../generate/severity.js'

describe('severity ramp', () => {
  it('takes every dark level from the source', () => {
    const dark = Object.fromEntries(buildSeverity('dark').map((s) => [s.role, s.hex]))
    expect(dark.critical).toBe('#ff4d6a')
    expect(dark.serious).toBe('#fb923c')
    expect(dark.moderate).toBe('#fbbf24')
  })

  it('takes the declared light levels and derives only moderate', () => {
    const light = buildSeverity('light')
    const byRole = Object.fromEntries(light.map((s) => [s.role, s]))
    expect(byRole.critical!.hex).toBe('#d41240')
    expect(byRole.critical!.origin).toBe('anchored')
    expect(byRole.serious!.hex).toBe('#ea580c')
    expect(byRole.serious!.origin).toBe('anchored')
    expect(byRole.moderate!.origin).toBe('derived')
    expect(byRole.moderate!.l).toBeCloseTo(0.725, 2)
  })

  it('orders the ramp by lightness in both modes so it survives colour blindness', () => {
    // Hue alone does not separate serious from moderate under deuteranopia;
    // lightness ordering is the safety net. The mandatory icon and label are
    // the actual defence.
    //
    // Both modes, not just dark: the safety net is claimed for both themes, and
    // light's `moderate` is the one derived value in the ramp — the level most
    // able to drift out of order without anyone noticing.
    for (const mode of MODES) {
      const ramp = buildSeverity(mode)
      const l = (role: string) => ramp.find((s) => s.role === role)!.l
      expect(l('critical')).toBeLessThan(l('serious'))
      expect(l('serious')).toBeLessThan(l('moderate'))
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/tokens && npx vitest run tests/severity.test.ts`
Expected: FAIL — old `buildSeverity` returns swatches keyed by `level`, generated from the retired scale

- [ ] **Step 3: Replace `config/severity.ts`**

```ts
/**
 * The severity ramp.
 *
 * Taken from the impact badges on the Figma bundle's tabstop landing page. `minor`
 * carries no colour of its own — it uses `--lat-text-subtle`, which is what the
 * bundle does — so it is not anchored here.
 *
 * ## The rule that makes this safe
 *
 * Colour never carries severity alone. Every severity indicator ships an icon
 * **and** a text label. That is a hard rule, not a recommendation. The lightness
 * ordering below is a safety net for when hue fails — `serious` at hue 56 and
 * `moderate` at hue 84 are 28 degrees apart, which protanopia and deuteranopia
 * do not preserve — and the net is not the defence.
 */
import type { Mode } from './modes.js'

export const SEVERITY_LEVELS = ['critical', 'serious', 'moderate', 'minor'] as const

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number]

/**
 * `undefined` means the Figma bundle did not declare it and the generator must derive
 * it. Only light `moderate` is in that position.
 */
export const SEVERITY_ANCHORS: Record<Mode, Record<SeverityLevel, string | undefined>> = {
  dark: {
    critical: '#ff4d6a',
    serious: '#fb923c',
    moderate: '#fbbf24',
    minor: undefined
  },
  light: {
    critical: '#d41240',
    serious: '#ea580c',
    moderate: undefined,
    minor: undefined
  }
}

/**
 * How far light sits below dark for the same level.
 *
 * The Figma bundle declares two levels in both modes, so this is a choice rather than
 * the only available measurement:
 *
 * | level | dark L | light L | delta |
 * | --- | --- | --- | --- |
 * | critical | 0.678 | 0.556 | −0.122 |
 * | serious | 0.758 | 0.646 | **−0.112** |
 *
 * `serious` is the basis because it is `moderate`'s neighbour in both the ramp
 * and the colour wheel — serious sits at hue 56 and moderate at 84, both warm,
 * while critical is red at 16. How far a colour can drop in lightness between
 * modes depends on how much gamut headroom its hue has, so extrapolating from
 * the nearest hue is the smaller leap. Using critical's −0.122 instead would
 * put the derived value at L ≈ 0.715.
 *
 * Applied to dark `moderate` to place its light counterpart, so the derived
 * value sits where the palette's own arithmetic puts it rather than where it
 * looked right.
 */
export const LIGHT_LIGHTNESS_DELTA = -0.112
```

- [ ] **Step 4: Replace `generate/severity.ts`**

```ts
import type { Mode } from '../config/modes.js'
import {
  LIGHT_LIGHTNESS_DELTA,
  SEVERITY_ANCHORS,
  SEVERITY_LEVELS,
  type SeverityLevel
} from '../config/severity.js'
import type { Swatch } from './anchors.js'
import { fitToGamut, formatHex, oklchToSrgb, parseHex, srgbToOklch } from './oklch.js'

/**
 * `minor` has no colour of its own. It is emitted as an alias to
 * `--lat-text-subtle` by the emitter rather than as a swatch here.
 */
const COLOURED = SEVERITY_LEVELS.filter((l) => l !== 'minor')

function derive(mode: Mode, level: SeverityLevel): Swatch {
  // The only derivation the ramp needs: light `moderate`, placed by the same
  // lightness delta that separates the declared light and dark `serious`.
  const darkHex = SEVERITY_ANCHORS.dark[level]
  if (darkHex === undefined) throw new Error(`severity: no dark anchor for ${level}`)

  const dark = srgbToOklch(parseHex(darkHex))
  const fitted = fitToGamut({ l: dark.l + LIGHT_LIGHTNESS_DELTA, c: dark.c, h: dark.h })
  const hex = formatHex(oklchToSrgb(fitted))

  return {
    scale: 'severity',
    role: level,
    mode,
    hex,
    l: fitted.l,
    c: fitted.c,
    h: fitted.h,
    origin: 'derived'
  }
}

export function buildSeverity(mode: Mode): Swatch[] {
  return COLOURED.map((level) => {
    const hex = SEVERITY_ANCHORS[mode][level]
    if (hex === undefined) return derive(mode, level)

    const { l, c, h } = srgbToOklch(parseHex(hex))
    return { scale: 'severity', role: level, mode, hex, l, c, h, origin: 'anchored' as const }
  })
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/tokens && npx vitest run tests/severity.test.ts`
Expected: PASS, 3 tests

- [ ] **Step 6: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): repoint severity onto the Figma bundle's impact ramp

Three of six levels are declared; light moderate is derived by the same
lightness delta that separates declared light and dark serious."
```

---

### Task 5: The contrast gate becomes a report

**Files:**
- Create: `packages/tokens/generate/report.ts`
- Modify: `packages/tokens/generate/build.ts`
- Test: `packages/tokens/tests/report.test.ts`

`packages/tokens/tests/contrast.test.ts` **stays**. An earlier draft of this plan
deleted it, claiming it asserted contracts that no longer exist. That was wrong:
it tests `generate/contrast.ts`'s *maths* — WCAG coefficients against the
matrix-derived alternative, APCA reference values, sign and symmetry invariants,
low-clip behaviour, NaN rejection — and `generate/contrast.ts` not only survives
but becomes more load-bearing, since every figure in the new ledger comes out of
it. Deleting it would have left those primitives with no direct coverage while
increasing what depends on them.

**Interfaces:**
- Consumes: `contrastRatio`, `apcaLc` from `generate/contrast.js`; `parseHex` from `generate/oklch.js`.
- Produces: `interface LedgerEntry { name: string; text: string; background: string; ratio: number; apca: number; minimum: number; passes: boolean }`, `buildLedger(): LedgerEntry[]`, `formatLedger(entries: readonly LedgerEntry[]): string` from `generate/report.js`.

**This is the task that changes what the build means.** Four entries fail and the build still writes `dist/`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/tokens/tests/report.test.ts
import { describe, expect, it } from 'vitest'
import { buildLedger } from '../generate/report.js'

describe('contrast ledger', () => {
  it('records exactly the four known failures, in emission order', () => {
    const failing = buildLedger().filter((e) => !e.passes).map((e) => e.name)
    expect(failing).toEqual([
      'light on-solid on solid',
      'light solid as text on bg',
      'light focus ring on bg-raised',
      'dark text-subtle on bg-raised'
    ])
  })

  it('passes the dark focus ring, which the light one fails', () => {
    // The Figma bundle declares --ring at 0.35 but focuses its own components at primary/40,
    // and 0.40 is what this package emits. At 0.40 the dark ring reaches 3.20
    // and clears SC 1.4.11; the light ring reaches 1.55 and does not. The
    // asymmetry is the point — do not "fix" it by averaging the two.
    const dark = buildLedger().find((e) => e.name === 'dark focus ring on bg-raised')!
    expect(dark.passes).toBe(true)
    expect(dark.ratio).toBeGreaterThanOrEqual(3)
  })

  it('measures the light primary button label at 3.33:1', () => {
    const entry = buildLedger().find((e) => e.name === 'light on-solid on solid')!
    expect(entry.ratio).toBeCloseTo(3.33, 1)
    expect(entry.minimum).toBe(4.5)
  })

  it('measures the light focus ring below the 3:1 SC 1.4.11 floor', () => {
    const entry = buildLedger().find((e) => e.name === 'light focus ring on bg-raised')!
    expect(entry.ratio).toBeLessThan(3)
    expect(entry.minimum).toBe(3)
  })

  it('reports APCA alongside every WCAG figure', () => {
    for (const entry of buildLedger()) expect(Number.isFinite(entry.apca)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/tokens && npx vitest run tests/report.test.ts`
Expected: FAIL — `Cannot find module '../generate/report.js'`

- [ ] **Step 3: Create `generate/report.ts`**

```ts
/**
 * The contrast ledger.
 *
 * Until 2026-08-03 a missed contract stopped the build. Lattice's values are
 * the identity and four of its documented pairs miss WCAG, so the check became a
 * report: measured, printed, and shipped anyway.
 *
 * The ledger exists so those four stay visible. A number nobody prints becomes
 * folklore within a release, and the light-mode focus ring in particular — a
 * focus indicator a keyboard user cannot see — is not something to rediscover.
 *
 * Alpha values are composited over their surface before measuring, because that
 * is what a viewer sees.
 */
import { ALPHA_CHANNEL, FOCUS_RING_ALPHA } from '../config/alpha.js'
import { GRAY_ANCHORS, ON_SOLID_ANCHORS, SOLID_ANCHORS } from '../config/anchors.js'
import { MODES, type Mode } from '../config/modes.js'
import { apcaLc, contrastRatio } from './contrast.js'
import { formatHex, parseHex, type Rgb } from './oklch.js'

export interface LedgerEntry {
  readonly name: string
  readonly text: string
  readonly background: string
  readonly ratio: number
  readonly apca: number
  readonly minimum: number
  readonly passes: boolean
}

/**
 * Composite a translucent colour over an opaque one.
 *
 * `parseHex` returns channels in **0..1**, not 0..255, and `contrastRatio`
 * expects the same. Do not round here — rounding a 0..1 channel collapses it to
 * 0 or 1 and every ratio below becomes fiction.
 */
function over(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return {
    r: alpha * fg.r + (1 - alpha) * bg.r,
    g: alpha * fg.g + (1 - alpha) * bg.g,
    b: alpha * fg.b + (1 - alpha) * bg.b
  }
}

function entry(name: string, text: Rgb, background: Rgb, minimum: number): LedgerEntry {
  const ratio = contrastRatio(text, background)
  return {
    name,
    // formatHex, not a manual rgb() string: the channels are 0..1 floats and
    // would otherwise print as `rgb(0.811764 0.949019 0.227450)`.
    text: formatHex(text),
    background: formatHex(background),
    ratio,
    apca: apcaLc(text, background),
    minimum,
    // Rounded to two places first: a pair measuring 4.499 prints as 4.50 and
    // must not be reported as passing something it prints as meeting.
    passes: Number(ratio.toFixed(2)) >= minimum
  }
}

function forMode(mode: Mode): LedgerEntry[] {
  const gray = GRAY_ANCHORS[mode]
  const bg = parseHex(gray.bg)
  const raised = parseHex(gray['bg-raised'])
  const solid = parseHex(SOLID_ANCHORS.accent[mode])
  const onSolid = parseHex(ON_SOLID_ANCHORS.accent![mode])
  const ring = over(solid, FOCUS_RING_ALPHA, raised)
  // ALPHA_CHANNEL holds 0..255 strings for CSS output; normalise to the 0..1
  // the colour maths uses.
  const channel = ALPHA_CHANNEL[mode].split(' ').map((v) => Number(v) / 255)
  const hairline = { r: channel[0]!, g: channel[1]!, b: channel[2]! }

  return [
    entry(`${mode} text on bg`, parseHex(gray.text), bg, 4.5),
    entry(`${mode} text-subtle on bg-raised`, parseHex(gray['text-subtle']), raised, 4.5),
    entry(`${mode} on-solid on solid`, onSolid, solid, 4.5),
    entry(`${mode} solid as text on bg`, solid, bg, 4.5),
    // SC 1.4.11: a focus indicator needs 3:1 against what surrounds it.
    entry(`${mode} focus ring on bg-raised`, ring, raised, 3),
    entry(`${mode} hairline on bg-raised`, over(hairline, 0.08, raised), raised, 1)
  ]
}

export function buildLedger(): LedgerEntry[] {
  return MODES.flatMap(forMode)
}

export function formatLedger(entries: readonly LedgerEntry[]): string {
  return entries
    .map((e) => {
      const marker = e.passes ? '    ' : 'FAIL'
      return `  ${marker} ${e.name.padEnd(34)} ${e.ratio.toFixed(2).padStart(6)}:1  ` +
        `min ${e.minimum.toFixed(1)}  Lc ${e.apca.toFixed(1)}`
    })
    .join('\n')
}
```

The test expects failures in a specific order. `buildLedger` returns light entries then dark; confirm the expected array in Step 1 matches the actual order after implementing, and correct the *test* to the real order if it differs — the order is an artefact, not a requirement.

- [ ] **Step 4: Rewrite `generate/build.ts`**

Replace the scale loop and the `failures` gate. The new body:

```ts
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MODES } from '../config/modes.js'
import { allPairsCap, buildCategorical, ordinalRange, validateCategorical, validateSequential } from './charts.js'
import { emitCss, emitTokens } from './emit.js'
import { buildLedger, formatLedger } from './report.js'
import { buildSeverity } from './severity.js'

/**
 * Build entrypoint. Emits `dist/lattice.css` and `dist/tokens.json`.
 *
 * This build does not gate. Lattice's values are the identity, and four of its
 * documented pairs miss WCAG; refusing to write them would refuse to ship the
 * design. Every pair is still measured and printed — see generate/report.ts.
 */
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
await mkdir(dist, { recursive: true })

const ledger = buildLedger()
const failed = ledger.filter((e) => !e.passes)

console.log('lattice: identity, %d modes', MODES.length)
console.log('\nContrast ledger (reported, never gates):')
console.log(formatLedger(ledger))
console.log(
  '\n  %d of %d pairs miss their minimum. These ship — see docs/superpowers/specs/2026-08-03-lattice-identity-design.md §9.',
  failed.length,
  ledger.length
)

console.log('\nSeverity ramp:')
for (const mode of MODES) {
  for (const swatch of buildSeverity(mode)) {
    console.log('  %s  %s  %s  (%s)', mode.padEnd(5), swatch.role.padEnd(9), swatch.hex, swatch.origin)
  }
}
console.log('  usage rule: colour never carries severity alone — icon and label are mandatory')

console.log('\nChart palettes:')
for (const mode of MODES) {
  const categorical = validateCategorical(buildCategorical(mode), mode)
  const ordinal = validateSequential(ordinalRange(mode), mode)
  for (const report of [categorical, ordinal]) {
    for (const check of report.checks) {
      const marker = check.state === 'pass' ? '    ' : check.state === 'warn' ? 'WARN' : 'FAIL'
      console.log('  %s %s  %s  %s', marker, mode.padEnd(5), check.name.padEnd(20), check.detail)
    }
  }
}
console.log('  all-pairs cap: %d slots', allPairsCap(MODES))

const css = emitCss()
const tokens = `${JSON.stringify(emitTokens(), null, 2)}\n`

await writeFile(join(dist, 'lattice.css'), css, 'utf8')
await writeFile(join(dist, 'tokens.json'), tokens, 'utf8')

console.log(
  '\nlattice: wrote dist/lattice.css (%d bytes) and dist/tokens.json (%d bytes)',
  Buffer.byteLength(css, 'utf8'),
  Buffer.byteLength(tokens, 'utf8')
)
```

`emitCss()` and `emitTokens()` lose their `scales` parameter — Task 11 changes their signatures to match. Until then the build will not typecheck; that is expected.

- [ ] **Step 5: Confirm the contrast maths tests still pass**

`tests/contrast.test.ts` is not deleted. It may import something Task 1 removed;
if so, repoint those imports and keep every assertion.

Run: `cd packages/tokens && npx vitest run tests/contrast.test.ts`
Expected: PASS, unchanged from before this plan began.

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/tokens && npx vitest run tests/report.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 7: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): the contrast contract becomes a report

Four documented pairs miss WCAG and ship anyway, per the approved spec. They
are measured and printed on every build so they stay visible rather than
becoming folklore."
```

---

### Task 6: Typography — families, scale, and the mono roles

**Files:**
- Modify: `packages/tokens/config/typography.ts`, `packages/tokens/config/typography-roles.ts`
- Test: `packages/tokens/tests/typography.test.ts`, `tests/typography-roles.test.ts` (both rewritten)

**Interfaces:**
- Produces: `FONT_FAMILIES`, `FONT_SIZES`, `FONT_WEIGHTS`, `LETTER_SPACINGS`, `LINE_HEIGHTS` from `config/typography.js`; `TYPOGRAPHY_ROLES` from `config/typography-roles.js`. Names and shapes are unchanged, so `generate/typography.ts` and `generate/typography-roles.ts` need no edits.

**Why the mono roles matter.** The uppercase 10px mono label at 0.2em tracking is Lattice's most recognisable move — it appears on every panel header, every eyebrow, every table column and every badge in both demo pages. Without a role it gets re-typed in a dozen component stylesheets and drifts.

- [ ] **Step 1: Write the failing test**

```ts
// packages/tokens/tests/typography.test.ts
import { describe, expect, it } from 'vitest'
import { FONT_FAMILIES, FONT_SIZES, FONT_WEIGHTS, LETTER_SPACINGS } from '../config/typography.js'
import { typographyCss } from '../generate/typography.js'

describe('typography primitives', () => {
  it('leads the sans stack with Instrument Sans', () => {
    expect(FONT_FAMILIES.sans[0]).toBe('Instrument Sans')
  })

  it('leads the mono stack with JetBrains Mono', () => {
    expect(FONT_FAMILIES.mono[0]).toBe('JetBrains Mono')
  })

  it("carries the Figma bundle's scale including the 10px micro size", () => {
    expect(FONT_SIZES['3xs']).toBe(0.625)
    expect(FONT_SIZES.base).toBe(1)
    expect(FONT_SIZES['5xl']).toBe(3)
  })

  it('carries the 0.2em eyebrow tracking', () => {
    expect(LETTER_SPACINGS.eyebrow).toBe(0.2)
  })

  it('carries the four weights the Figma bundle uses', () => {
    expect(Object.values(FONT_WEIGHTS).sort()).toEqual([400, 500, 600, 700])
  })

  it('emits tracking in em, not rem', () => {
    // Tracking must scale with the text it tracks. The eyebrow's 0.2em at 10px
    // is 2px; the same value as rem would be 3.2px regardless of font size,
    // and would grow relative to the glyphs at every size below 1rem —
    // which is every size the mono roles use.
    expect(typographyCss()).toContain('--lat-letter-spacing-eyebrow: 0.2em;')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/tokens && npx vitest run tests/typography.test.ts`
Expected: FAIL — `FONT_SIZES['3xs']` is undefined

- [ ] **Step 3: Rewrite `config/typography.ts`**

**Corrected 2026-08-04.** An earlier draft of this step claimed the existing
exports were wrapper objects (`{ rem: number }`, `{ value: number }`,
`{ em: number }`) and that keeping them would leave the generators untouched.
That was wrong — the existing config uses **plain numbers**, and
`FONT_FAMILIES` holds **arrays of strings** which `generate/typography.ts`
joins with a `cssFamily` helper that quotes any name containing a space.
Introducing wrappers made `typographyCss()` throw on `stack.map` and emit
`[object Object]` for every other group, so no typography primitive reached the
stylesheet at all.

Keep the plain shapes. The only unit that changes is letter-spacing, from rem
to em — see Step 3b.

```ts
/**
 * Typography primitives.
 *
 * Instrument Sans and JetBrains Mono, self-hosted by this package (see
 * `assets/fonts/`). The stacks name the family the `@font-face` rules define,
 * then fall back to system faces of the same class.
 *
 * The scale is the Figma bundle's own type specimen, plus the two micro sizes its
 * components use that the specimen does not list — 10px and 11px, which carry
 * every eyebrow, badge and table header in both demo pages.
 */
const SYSTEM_SANS = ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] as const

export const FONT_FAMILIES = {
  sans: ['Instrument Sans', ...SYSTEM_SANS],
  mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
} as const

export const FONT_SIZES = {
  /** 10px — eyebrows, badges, table headers. The identity's signature size. */
  '3xs': 0.625,
  /** 11px — metadata lines. */
  '2xs': 0.6875,
  xs: 0.75,
  sm: 0.875,
  base: 1,
  lg: 1.125,
  xl: 1.25,
  '2xl': 1.5,
  '3xl': 1.875,
  '5xl': 3
} as const

export const FONT_WEIGHTS = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700
} as const

/**
 * Tracking, in **em**.
 *
 * Previously rem, which was wrong for this property: tracking has to scale with
 * the text it tracks. The eyebrow's 0.2em at 10px is 2px; as rem it would be a
 * fixed 3.2px at every size, growing relative to the glyphs at each of the
 * sub-1rem sizes the mono roles use.
 */
export const LETTER_SPACINGS = {
  /** Display and headings. The Figma bundle's `tracking-tight`. */
  tight: -0.025,
  normal: 0,
  /** Badges. `tracking-wider`. */
  wide: 0.05,
  /** Panel labels. `tracking-widest`. */
  wider: 0.1,
  /** Eyebrows. The literal `tracking-[0.2em]` the bundle writes out. */
  eyebrow: 0.2
} as const

export const LINE_HEIGHTS = {
  /** Display only. `leading-none`. */
  none: 1,
  /** Headings. `leading-[1.05]` on the hero. */
  tight: 1.05,
  snug: 1.25,
  /** The Figma bundle's base-layer default for every heading, label and control. */
  normal: 1.5,
  relaxed: 1.625
} as const
```

- [ ] **Step 3b: Emit tracking in em, and repoint the responsive overrides**

Two edits outside `config/typography.ts`, both consequences of Step 3.

In `generate/typography.ts`, letter-spacing is the one group whose unit changes.
In `typographyCss()`:

```ts
  const letterSpacings = Object.entries(LETTER_SPACINGS).map(
    ([name, value]) => `  --lat-letter-spacing-${name}: ${value}em;`
  )
```

and in `typographyTokens()`, the `letterSpacing` group's `unit` becomes `'em'`.
No other group changes — sizes stay rem, weights and line-heights stay unitless.

In `config/typography-roles.ts`, `NARROW_HEADING_SIZES` is keyed by the old role
names `heading-1`/`heading-2`/`heading-3`, which no longer exist. Repoint it to
the new names, stepping each down one rung of the scale:

```ts
/**
 * Heading sizes below {@link TYPOGRAPHY_BREAKPOINT_REM}.
 *
 * The Figma bundle's own hero is `text-5xl md:text-6xl`, so responsive display sizing
 * is part of the identity rather than an addition to it. Each role steps down
 * one rung; `h4` and the mono roles are already small enough to leave alone.
 */
export const NARROW_HEADING_SIZES = {
  display: '3xl',
  h1: '2xl',
  h2: 'xl',
  h3: 'lg'
} as const
```

`TYPOGRAPHY_BREAKPOINT_REM` stays at 40.

- [ ] **Step 4: Write the failing role test**

```ts
// packages/tokens/tests/typography-roles.test.ts
import { describe, expect, it } from 'vitest'
import { TYPOGRAPHY_ROLES } from '../config/typography-roles.js'

describe('typography roles', () => {
  it('defines the five mono roles', () => {
    for (const role of ['eyebrow', 'meta', 'tag', 'numeric', 'code']) {
      expect(TYPOGRAPHY_ROLES[role]!.fontFamily).toBe('mono')
    }
  })

  it('gives the eyebrow uppercase at 0.2em', () => {
    const eyebrow = TYPOGRAPHY_ROLES.eyebrow!
    expect(eyebrow.fontSize).toBe('3xs')
    expect(eyebrow.letterSpacing).toBe('eyebrow')
    expect(eyebrow.textTransform).toBe('uppercase')
  })

  it('gives the numeric role tabular figures', () => {
    expect(TYPOGRAPHY_ROLES.numeric!.fontVariantNumeric).toBe('tabular-nums')
  })

  it("matches the Figma bundle's specimen for the sans roles", () => {
    expect(TYPOGRAPHY_ROLES.display!.fontSize).toBe('5xl')
    expect(TYPOGRAPHY_ROLES.display!.fontWeight).toBe('bold')
    expect(TYPOGRAPHY_ROLES.h1!.fontSize).toBe('3xl')
    expect(TYPOGRAPHY_ROLES.h1!.fontWeight).toBe('semibold')
    expect(TYPOGRAPHY_ROLES.h2!.fontWeight).toBe('medium')
    expect(TYPOGRAPHY_ROLES.body!.fontSize).toBe('base')
  })

  // The three below assert the emitted CSS, not the config object. Everything
  // above would pass unchanged if Step 6's emission code were deleted outright —
  // the config fields were already true before it existed. These are what
  // actually cover the generator.

  it('emits the optional properties for the roles that declare them', () => {
    const css = typographyRoleCss()
    expect(css).toContain('--lat-text-eyebrow-text-transform: uppercase;')
    expect(css).toContain('--lat-text-tag-text-transform: uppercase;')
    expect(css).toContain('--lat-text-numeric-font-variant-numeric: tabular-nums;')
  })

  it('emits nothing extra for a role that declares neither', () => {
    // The failure this catches is a leaked `undefined` declaration, which is
    // silently invalid CSS rather than an error.
    const css = typographyRoleCss()
    expect(css).not.toContain('--lat-text-body-text-transform')
    expect(css).not.toContain('--lat-text-body-font-variant-numeric')
    expect(css).not.toContain('undefined')
  })

  it('carries the eyebrow tracking through to the emitted role', () => {
    // A role alias points at the primitive; it does not inline its value. The
    // literal `0.2em` belongs to typographyCss()'s primitive tier and is
    // asserted there. Checking for it here would assert against the two-tier
    // structure rather than for it.
    expect(typographyRoleCss()).toContain(
      '--lat-text-eyebrow-letter-spacing: var(--lat-letter-spacing-eyebrow);'
    )
  })
})
```

- [ ] **Step 5: Rewrite `config/typography-roles.ts`**

The interface gains two optional properties. Add them to `TypographyRole`:

```ts
export interface TypographyRole {
  readonly fontFamily: keyof typeof FONT_FAMILIES
  readonly fontSize: keyof typeof FONT_SIZES
  readonly fontWeight: keyof typeof FONT_WEIGHTS
  readonly letterSpacing: keyof typeof LETTER_SPACINGS
  readonly lineHeight: keyof typeof LINE_HEIGHTS
  /** Emitted only when present. Carries the eyebrow and tag casing. */
  readonly textTransform?: 'uppercase'
  /** Emitted only when present. Keeps a column of figures from jittering. */
  readonly fontVariantNumeric?: 'tabular-nums'
  readonly classification: 'prose' | 'ui' | 'supporting' | 'restricted' | 'code' | 'display'
}
```

Then the roles. Sans first:

```ts
export const TYPOGRAPHY_ROLES = {
  display: { fontFamily: 'sans', fontSize: '5xl', fontWeight: 'bold', letterSpacing: 'tight', lineHeight: 'none', classification: 'display' },
  h1: { fontFamily: 'sans', fontSize: '3xl', fontWeight: 'semibold', letterSpacing: 'tight', lineHeight: 'tight', classification: 'display' },
  h2: { fontFamily: 'sans', fontSize: '2xl', fontWeight: 'medium', letterSpacing: 'tight', lineHeight: 'normal', classification: 'display' },
  h3: { fontFamily: 'sans', fontSize: 'xl', fontWeight: 'medium', letterSpacing: 'normal', lineHeight: 'normal', classification: 'display' },
  h4: { fontFamily: 'sans', fontSize: 'base', fontWeight: 'medium', letterSpacing: 'normal', lineHeight: 'normal', classification: 'display' },
  body: { fontFamily: 'sans', fontSize: 'base', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'normal', classification: 'prose' },
  'body-strong': { fontFamily: 'sans', fontSize: 'base', fontWeight: 'semibold', letterSpacing: 'normal', lineHeight: 'normal', classification: 'prose' },
  lead: { fontFamily: 'sans', fontSize: 'lg', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'relaxed', classification: 'prose' },
  small: { fontFamily: 'sans', fontSize: 'sm', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'relaxed', classification: 'prose' },
  ui: { fontFamily: 'sans', fontSize: 'sm', fontWeight: 'medium', letterSpacing: 'normal', lineHeight: 'normal', classification: 'ui' },
  'ui-strong': { fontFamily: 'sans', fontSize: 'sm', fontWeight: 'semibold', letterSpacing: 'normal', lineHeight: 'normal', classification: 'ui' },
  caption: { fontFamily: 'sans', fontSize: 'xs', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'snug', classification: 'supporting' },

  // The mono roles. These carry the identity — see the spec's §2.
  eyebrow: { fontFamily: 'mono', fontSize: '3xs', fontWeight: 'regular', letterSpacing: 'eyebrow', lineHeight: 'normal', textTransform: 'uppercase', classification: 'restricted' },
  tag: { fontFamily: 'mono', fontSize: '3xs', fontWeight: 'regular', letterSpacing: 'wide', lineHeight: 'normal', textTransform: 'uppercase', classification: 'restricted' },
  meta: { fontFamily: 'mono', fontSize: '2xs', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'normal', classification: 'supporting' },
  numeric: { fontFamily: 'mono', fontSize: 'base', fontWeight: 'bold', letterSpacing: 'normal', lineHeight: 'none', fontVariantNumeric: 'tabular-nums', classification: 'ui' },
  code: { fontFamily: 'mono', fontSize: 'sm', fontWeight: 'regular', letterSpacing: 'normal', lineHeight: 'relaxed', classification: 'code' }
} as const satisfies Record<string, TypographyRole>
```

- [ ] **Step 6: Emit the two new properties**

In `generate/typography-roles.ts`, the function building each role's declarations must append `text-transform` and `font-variant-numeric` when present. Find the block that maps a role to CSS declarations and add:

```ts
...(role.textTransform === undefined
  ? []
  : [`  --lat-text-${name}-text-transform: ${role.textTransform};`]),
...(role.fontVariantNumeric === undefined
  ? []
  : [`  --lat-text-${name}-font-variant-numeric: ${role.fontVariantNumeric};`]),
```

- [ ] **Step 7: Run both tests**

Run: `cd packages/tokens && npx vitest run tests/typography.test.ts tests/typography-roles.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): Lattice typography, with five mono roles

Instrument Sans and JetBrains Mono, the Figma bundle's specimen scale, and the
uppercase 10px/0.2em eyebrow that every panel header in both demos uses."
```

---

### Task 7: Self-host the fonts

**Files:**
- Create: `packages/tokens/assets/fonts/` (woff2 files), `packages/tokens/assets/fonts/OFL.txt`, `packages/tokens/generate/fonts.ts`
- Modify: `packages/tokens/package.json`, `packages/tokens/generate/emit.ts`

**Interfaces:**
- Produces: `fontFaceCss(): string` from `generate/fonts.js`; a new package export `./fonts/*`.

**Why not the CDN.** The bundle `@import`s Google Fonts. A token package that puts a third-party request on every consumer's critical path, and whose identity silently degrades to system fonts when that request fails, is not shipping an identity.

- [ ] **Step 1: Fetch the variable fonts**

Both are SIL Open Font License 1.1.

Both URLs serve **TrueType**, so download to `.ttf` and convert. Downloading
straight to a `.woff2` filename would leave TTF bytes behind a woff2 extension
and every browser would reject the face.

```bash
cd packages/tokens && mkdir -p assets/fonts && cd assets/fonts

curl -fsSL --max-time 90 -o InstrumentSans-Variable.ttf \
  "https://github.com/google/fonts/raw/main/ofl/instrumentsans/InstrumentSans%5Bwdth%2Cwght%5D.ttf"
curl -fsSL --max-time 90 -o JetBrainsMono-Variable.ttf \
  "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/variable/JetBrainsMono%5Bwght%5D.ttf"

npx --yes ttf2woff2 < InstrumentSans-Variable.ttf > InstrumentSans-Variable.woff2
npx --yes ttf2woff2 < JetBrainsMono-Variable.ttf > JetBrainsMono-Variable.woff2
rm -f ./*.ttf
ls -la
```

Verified working: the sources are 194,336 and 300,144 bytes of TrueType, and
Instrument Sans converts to roughly 90KB of woff2. `file` reports a `wdth`
axis on Instrument Sans and a `wght` axis on both, which is what the
`font-stretch` and `font-weight` ranges in Step 3 describe.

Sanity-check the result before continuing — a zero-byte or TTF-sized `.woff2`
means the conversion silently failed:

```bash
ls -l ./*.woff2 && file ./*.woff2
```

Each should report "Web Open Font Format (Version 2)".

If the network is unavailable, stop and report — do not substitute a different
family, do not fall back to the CDN, and do not commit a placeholder file.

- [ ] **Step 2: Record the licence**

Copy the OFL text from each upstream repository into `assets/fonts/OFL.txt`, with a header naming both families, their versions, and their source URLs. Add a line to the repository's root `README.md` under a new "Fonts" heading naming both families and the licence.

- [ ] **Step 3: Create `generate/fonts.ts`**

```ts
/**
 * `@font-face` rules for the self-hosted families.
 *
 * Both files are variable fonts, so one face per family covers every weight the
 * roles ask for. `font-display: swap` shows fallback text immediately rather
 * than holding the first paint on a font that is part of the identity but not
 * part of the content.
 *
 * The URLs are relative to the emitted stylesheet, so a consumer copying
 * `dist/` wholesale gets working fonts with no build configuration.
 */
export function fontFaceCss(): string {
  return `@font-face {
  font-family: 'Instrument Sans';
  src: url('./fonts/InstrumentSans-Variable.woff2') format('woff2-variations');
  font-weight: 400 700;
  font-stretch: 75% 100%;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('./fonts/JetBrainsMono-Variable.woff2') format('woff2-variations');
  font-weight: 100 800;
  font-style: normal;
  font-display: swap;
}`
}
```

- [ ] **Step 4: Copy the fonts into `dist/` at build time**

In `generate/build.ts`, before the two `writeFile` calls:

```ts
import { cp } from 'node:fs/promises'

const fontsSource = fileURLToPath(new URL('../assets/fonts/', import.meta.url))
await cp(fontsSource, join(dist, 'fonts'), { recursive: true })
```

- [ ] **Step 5: Export the fonts from the package**

In `packages/tokens/package.json`, add to `exports`:

```json
"./fonts/*": "./dist/fonts/*"
```

and confirm `"files": ["dist"]` already covers the copied directory. It does.

- [ ] **Step 6: Verify**

Run: `cd packages/tokens && npx tsx generate/build.ts && ls dist/fonts && grep -c "@font-face" dist/lattice.css`
Expected: two woff2 files listed; `2` font-face blocks

- [ ] **Step 7: Commit**

```bash
git add packages/tokens ../../README.md
git commit -m "feat(tokens): self-host Instrument Sans and JetBrains Mono

The bundle imports them from Google Fonts. A token package should not put a
third-party request on a consumer's critical path, nor let its identity
degrade silently to system fonts when that request fails."
```

---

### Task 8: Radii — the system goes square

**Files:**
- Modify: `packages/tokens/config/layout.ts`
- Test: `packages/tokens/tests/layout.test.ts` (amend)

**The finding this encodes.** `--radius` is `0.1875rem` (3px) and `--radius-sm` is `calc(var(--radius) - 4px)` = **−1px**, which computes to 0. Both demo pages use `rounded-sm` 49 times and `rounded-full` 8 times and nothing else. Rendered, Lattice is square.

- [ ] **Step 1: Write the failing test**

```ts
// append to packages/tokens/tests/layout.test.ts
import { NESTED_RADIUS_PAIRINGS, RADII } from '../config/layout.js'

describe('radii', () => {
  it('is square by default', () => {
    expect(RADII.none).toBe(0)
    expect(Object.keys(RADII)).toEqual(['none', 'sm', 'full'])
  })

  it('keeps the declared 3px for large surfaces', () => {
    expect(RADII.sm).toBe(0.1875)
  })

  it('drops the nested-radius pairing', () => {
    expect(NESTED_RADIUS_PAIRINGS).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/tokens && npx vitest run tests/layout.test.ts`
Expected: FAIL — `RADII` still has five keys

- [ ] **Step 3: Replace `RADII` and `NESTED_RADIUS_PAIRINGS` in `config/layout.ts`**

```ts
/**
 * Radii.
 *
 * Three values, because Lattice renders as a square system. The Figma bundle's `--radius` is
 * 3px, but the `--radius-sm` its own components actually use is
 * `calc(var(--radius) - 4px)` — negative, so it computes to zero. Across both
 * demo pages the only radii that appear are that zero and `rounded-full`.
 *
 * The intermediate steps this scale used to carry (0.25rem, 0.5rem, 0.75rem)
 * have nothing to express here and are removed rather than left as tokens
 * nobody should reach for.
 */
export const RADII = {
  none: 0,
  /** The declared `--radius`. Available for large surfaces; nothing uses it yet. */
  sm: 0.1875,
  full: 9999
} as const

/**
 * Empty.
 *
 * The pairing rule existed to stop an inner corner looking wrong inside an outer
 * one. A square system does not have that problem.
 */
export const NESTED_RADIUS_PAIRINGS = [] as const satisfies readonly NestedRadiusPairing[]
```

- [ ] **Step 4: Document the Figma bundle's spacing subset**

`SPACES` is unchanged — the Figma bundle's 4/8/12/16/24/32/48/64/96/128 are all already present. Add a comment above `SPACES` recording which subset the identity uses, so a reader does not assume every step is equally blessed:

```ts
/**
 * The Figma bundle uses 4, 8, 12, 16, 24, 32, 48, 64, 96 and 128 — `1`, `2`, `3`, `4`,
 * `6`, `8`, `12`, `16`, `24` and `32` below. The half-steps and the odd
 * multiples remain available but appear nowhere in the identity.
 */
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/tokens && npx vitest run tests/layout.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): the radius scale goes square

The Figma bundle's rounded-sm computes to -1px and therefore zero, and it is the only
radius either demo page uses. Five values become three."
```

---

### Task 9: Motion presets

**Files:**
- Modify: `packages/tokens/config/motion.ts`
- Test: `packages/tokens/tests/motion.test.ts` (amend)

- [ ] **Step 1: Write the failing test**

```ts
// append to packages/tokens/tests/motion.test.ts
import { DURATIONS, EASINGS } from '../config/motion.js'

describe('source motion presets', () => {
  it('carries the five named durations', () => {
    expect(DURATIONS).toEqual({
      instant: 0,
      swift: 100,
      default: 200,
      deliberate: 350,
      expressive: 500
    })
  })

  it('carries out and in-out, and no spring curve', () => {
    expect(Object.keys(EASINGS).sort()).toEqual(['in-out', 'out'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/tokens && npx vitest run tests/motion.test.ts`
Expected: FAIL — durations are still `fast`/`base`/`slow`/`slower`

- [ ] **Step 3: Replace the values in `config/motion.ts`**

```ts
/**
 * Motion.
 *
 * The Figma bundle's five presets, from its documentation site's motion section.
 *
 * `expressive` is a duration and nothing else. Its listed easing is "spring",
 * which no CSS timing function reproduces, and Lattice does not take a
 * JavaScript animation dependency to provide one. The token records the 500ms
 * intent; a caller wanting true spring behaviour brings its own library. No
 * component in this system uses it.
 */
export const DURATIONS = {
  instant: 0,
  swift: 100,
  default: 200,
  deliberate: 350,
  expressive: 500
} as const satisfies Readonly<Record<string, number>>

/**
 * Two curves, because the Figma bundle names two: `ease-out` for entrances and state
 * changes, `ease-in-out` for the deliberate tier.
 */
export const EASINGS = {
  out: [0, 0, 0.2, 1],
  'in-out': [0.4, 0, 0.2, 1]
} as const satisfies Readonly<Record<string, EasingCurve>>
```

- [ ] **Step 4: Repoint the reduced-motion contract**

`generate/motion.ts` emits a reduced-motion block referencing `DURATIONS.fast` or similar. Find it with `grep -n "DURATIONS\." generate/motion.ts` and repoint every reference to a surviving name. The contract itself is unchanged: transforms and continuous motion are suppressed under `prefers-reduced-motion: reduce`; colour transitions are not.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/tokens && npx vitest run tests/motion.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): five motion presets from the Figma bundle"
```

---

### Task 10: Elevation collapses to four roles

**Files:**
- Modify: `packages/tokens/config/elevation.ts`, `packages/tokens/generate/elevation.ts`
- Test: `packages/tokens/tests/elevation.test.ts` (rewrite)
- Delete: `packages/tokens/tests/browser/elevation.spec.ts` — it measures the calibrated model against contracts that no longer exist.

**Interfaces:**
- Produces: `SHADOWS`, `ELEVATION_ROLES` from `config/elevation.js`; `elevationCss(): string` from `generate/elevation.js` (unchanged name, now takes no mode — the values are theme-independent).

- [ ] **Step 1: Write the failing test**

```ts
// packages/tokens/tests/elevation.test.ts
import { describe, expect, it } from 'vitest'
import { ELEVATION_ROLES, SHADOWS } from '../config/elevation.js'
import { elevationCss } from '../generate/elevation.js'

describe('elevation', () => {
  it('has four roles', () => {
    expect(Object.keys(ELEVATION_ROLES)).toEqual(['flat', 'raised', 'overlay', 'floating'])
  })

  it('gives flat no shadow at all', () => {
    expect(ELEVATION_ROLES.flat).toBe('none')
  })

  it("carries the Figma bundle's 2xl for the floating role", () => {
    expect(SHADOWS['2xl']).toBe('0 25px 50px -12px rgb(0 0 0 / 0.25)')
  })

  it('emits one token per role', () => {
    const css = elevationCss()
    for (const role of Object.keys(ELEVATION_ROLES)) {
      expect(css).toContain(`--lat-elevation-${role}:`)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/tokens && npx vitest run tests/elevation.test.ts`
Expected: FAIL — the calibrated model exports different names

- [ ] **Step 3: Replace `config/elevation.ts`**

```ts
/**
 * Elevation.
 *
 * Four roles, replacing the calibrated multi-level model, because four is all
 * the Figma bundle uses. Values are the Tailwind v4 shadows the bundle emits, verbatim.
 *
 * ## Recorded, not fixed
 *
 * These shadows are pure black at 10-25% alpha. Over the Figma bundle's `#0c0c14` page
 * they are close to invisible, which is why the identity reads as flat in dark
 * mode and leans on the hairline instead; `floating` is the only one that
 * carries. That is the design as delivered and it ships as delivered. The
 * observation is written down so a future change is a decision rather than a
 * discovery.
 *
 * Depth is not conveyed by shadow alone anywhere in this system: every raised
 * surface also carries a hairline border, which is what survives forced-colors.
 */
export const SHADOWS = {
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
} as const

export type ShadowName = keyof typeof SHADOWS

/**
 * What each role is for. `flat` is not an absence of styling — it is the
 * positive statement that a surface is distinguished by its hairline and its
 * fill, which is Lattice's default.
 */
export const ELEVATION_ROLES = {
  /** Cards, panels, inputs, buttons. Hairline only. */
  flat: 'none',
  /** The segmented-control thumb. */
  raised: SHADOWS.sm,
  /** Tooltip, popover, menu. */
  overlay: SHADOWS.lg,
  /** The hero audit card. The only shadow that reads in dark mode. */
  floating: SHADOWS['2xl']
} as const satisfies Record<string, string>
```

- [ ] **Step 4: Replace `generate/elevation.ts`**

```ts
import { ELEVATION_ROLES, SHADOWS } from '../config/elevation.js'

export const SHADOW_PRIMITIVE_COUNT = Object.keys(SHADOWS).length
export const ELEVATION_ROLE_COUNT = Object.keys(ELEVATION_ROLES).length

/**
 * Elevation tokens.
 *
 * Emitted once on `:root` rather than per theme. The prior system varied shadow
 * by mode; the Figma bundle declares one set and uses it in both.
 */
export function elevationCss(): string {
  return [
    ...Object.entries(SHADOWS).map(([name, value]) => `  --lat-shadow-${name}: ${value};`),
    ...Object.entries(ELEVATION_ROLES).map(([role, value]) => `  --lat-elevation-${role}: ${value};`)
  ].join('\n')
}
```

- [ ] **Step 5: Move the elevation call out of the themed block**

In `generate/emit.ts`, `themedBlock` currently ends with `elevationCss()`. Remove it from there and add `elevationCss()` to the `:root` block alongside `typographyCss()`.

- [ ] **Step 6: Delete the stale browser test**

```bash
cd packages/tokens && git rm tests/browser/elevation.spec.ts
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd packages/tokens && npx vitest run tests/elevation.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 8: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): elevation collapses to Lattice's four roles

The calibrated multi-level model is replaced by flat/raised/overlay/floating.
Recorded: these shadows are near-invisible on the Figma bundle's dark page, which is
why the identity leans on the hairline."
```

---

### Task 11: Wire the emitter and snapshot the result

**Files:**
- Modify: `packages/tokens/generate/emit.ts`
- Test: `packages/tokens/tests/emit.test.ts` (rewrite), `tests/snapshot.test.ts`, `tests/__snapshots__/lattice.css`, `tests/__snapshots__/tokens.paths.txt`

**Interfaces:**
- Produces: `emitCss(): string`, `emitTokens(): DesignTokens` — both lose their `scales` parameter, matching the call sites Task 5 wrote.

- [ ] **Step 0: Close the four loose ends earlier tasks left**

*Added 2026-08-04. Each was found during an earlier task and deferred here.*

**a. `generate/charts.ts` imports a deleted module.** Task 1 removed
`generate/solve.ts`, but `charts.ts` still imports `ship` from it, so the build
cannot run at all. `ship` is four lines and depends only on gamut helpers —
`fitToGamut`, `oklchToSrgb`, `formatHex` — none of which were retired. Move it
into `generate/oklch.ts` beside them:

```ts
/** A requested colour, resolved to what sRGB can actually show. */
export interface Shipped {
  readonly oklch: Oklch
  readonly hex: string
}

/**
 * Fits a requested colour into sRGB and reports it alongside the hex it emits.
 *
 * Chart palettes are the last thing still generated rather than anchored, so
 * this is where a requested colour becomes a shippable one. It lived in
 * `generate/solve.ts` until the contrast solver that surrounded it was retired.
 */
export function ship(request: Oklch): Shipped {
  const fitted = fitToGamut(request)

  return { oklch: fitted, hex: formatHex(oklchToSrgb(fitted)) }
}
```

Then repoint `charts.ts`'s import to `./oklch.js`. Do **not** resurrect
`solveLightness` — that one solved a lightness against a contrast target, and
there are no contracts left to solve against.

**b. Three test files still import deleted modules** — `tests/schema.test.ts`,
`tests/emit.test.ts` and `tests/browser/typography-roles.spec.ts`. Repoint or
retire each assertion as Step 3 describes for `emit.test.ts`; the same rule
applies to the other two.

**c. A stale comment in `generate/emit.ts`.** The header comment describing
elevation as "role tokens per theme" is no longer true — Task 10 moved
elevation to `:root`, emitted once for both modes. Correct it.

**d. A rationale lost from `config/motion.ts`.** Task 9 trimmed a false claim
about a 400ms ceiling from the file header and took an unrelated, still-true
sentence with it: that `instant` exists so a state change which must not
animate can say so with a token rather than by omitting one. Restore that
sentence.

- [ ] **Step 1: Update `emitCss` and `emitTokens` signatures**

In `generate/emit.ts`:

- `emitCss(scales: readonly Scale[])` → `emitCss()`. Replace `themedBlock(scales, mode)` with `themedBlock(mode)`.
- `themedBlock(scales, mode)` → `themedBlock(mode)`, and its body drops the `primitives` computation entirely — `semanticBlock(mode)` now emits primitives, alphas and roles together.
- `emitTokens(scales)` → `emitTokens()`. Where it iterated scales for colour tokens, iterate `resolveAll(mode)` instead, and set each token's `$extensions` to `{ 'com.chameleon-labs.lattice': { origin: swatch.origin } }` so `anchored` and `derived` travel with the tokens.
- Update the header comment counts: there are no longer "N scales x 12 steps". Replace with `Colour: ${GRAY_ROLES.length} grey roles + ${CHROMATIC_SCALES.length} chromatic solids, both modes.`
- Delete the now-unused `import type { Scale }` and the `STEPS` import.

- [ ] **Step 2: Add the severity `minor` alias**

`minor` has no colour of its own. In `themedBlock`, after the severity swatches, emit:

```ts
'  --lat-severity-minor: var(--lat-text-subtle);'
```

- [ ] **Step 3: Rewrite `tests/emit.test.ts`**

Delete every assertion referencing numbered steps (`--lat-gray-9`, `STEP_JOBS`, contract results). Keep and repoint the assertions that test emitter *mechanics* — that both theme blocks exist, that the `prefers-color-scheme` block excludes an explicit light stamp, that aliases appear in every scope. Add:

```ts
it('labels every colour token as anchored or derived', () => {
  const tokens = emitTokens()
  const colours = JSON.stringify(tokens)
  expect(colours).toContain('"origin": "anchored"')
  expect(colours).toContain('"origin": "derived"')
})

it('emits no numbered scale steps', () => {
  expect(emitCss()).not.toMatch(/--lat-\w+-\d+:/)
})
```

- [ ] **Step 4: Run the build and refresh the snapshots**

```bash
cd packages/tokens
npx tsx generate/build.ts
cp dist/lattice.css tests/__snapshots__/lattice.css
node -e "const t=require('./dist/tokens.json');const p=[];(function w(o,k){for(const[n,v]of Object.entries(o)){const q=k?k+'.'+n:n;if(v&&typeof v==='object'&&!('\$value'in v))w(v,q);else p.push(q)}})(t,'');require('fs').writeFileSync('tests/__snapshots__/tokens.paths.txt',p.sort().join('\n')+'\n')"
```

Read the diff before accepting it: `git diff tests/__snapshots__/lattice.css | head -80`. Confirm the emitted colours match the anchor table at the top of this plan.

- [ ] **Step 5: Run the full unit suite**

Run: `cd packages/tokens && npx vitest run`
Expected: `tests/anchors`, `alpha`, `semantic`, `severity`, `report`, `typography`, `typography-roles`, `layout`, `motion`, `elevation`, `emit`, `snapshot`, `oklch`, `schema` pass. `tests/charts.test.ts` may fail if it imports the retired scale builder — if so, repoint its imports to `generate/anchors.js`; the chart palettes themselves are out of scope for this plan and their values are unchanged.

- [ ] **Step 6: Verify the built stylesheet by eye**

```bash
cd packages/tokens && grep -E "lat-(bg|text|solid|border|focus-ring|accent-vivid):" dist/lattice.css | head -20
```

Expected: `--lat-bg` resolves to `oklch(0.159…)` in the dark block and `oklch(0.957…)` in the light block.

- [ ] **Step 7: Commit**

```bash
git add packages/tokens
git commit -m "feat(tokens): wire the emitter to anchors and refresh snapshots

emitCss and emitTokens no longer take scales. Every colour token carries an
origin of anchored or derived."
```

---

## Self-Review

**Spec coverage.** §1.1 anchors → Task 1. §1.2 alpha tier and tinted triple → Task 2. §1.3 the reduced generator → Tasks 1, 2, 4. §1.4 severity → Task 4. §2 typography and mono roles → Task 6; self-hosting → Task 7. §3 shape → Task 8. §4 spacing → Task 8 Step 4. §5 elevation → Task 10; the borders-not-shadows rule is a Phase 2 concern and is carried in that plan's constraints. §6 motion → Task 9. §9 the ledger → Task 5. §7 components and §8 proof are Phases 2 and 3. §10 supersede headers are already applied. §11 out-of-scope is honoured: no test outside `packages/tokens` is touched, and only tests asserting retired values are rewritten.

**Placeholder scan.** No TBD or TODO. Every code step carries real code. Task 7 Step 2 asks the implementer to copy licence text from upstream rather than reproducing two 4KB licences here; that is a fetch, not a decision.

**Type consistency.** `Swatch` is defined once in `generate/anchors.ts` and reused by `generate/severity.ts` — checked, the severity builder returns the same shape including `origin`. `Mode` moves to `config/modes.ts` in Task 1 Step 3 and every later task imports it from there. `formatOklch` moves to `generate/format.ts` in Task 3 Step 5 to break the cycle `emit → semantic → emit`; Task 11 does not reintroduce it. `emitCss()`/`emitTokens()` lose their parameter in Task 11, matching the call sites Task 5 wrote — Task 5 explicitly notes the build will not typecheck until Task 11, which is the one intentional gap and is called out in both tasks.

**Known ordering hazard.** Tasks 5 and 11 are coupled: the repository does not typecheck between them. Run them in order and do not skip Task 11.
