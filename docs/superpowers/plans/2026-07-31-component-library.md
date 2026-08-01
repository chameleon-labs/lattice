# Component Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the styling contract and fourteen component families — 28 styled exports plus 4 provider re-exports — from `@chameleon-labs/lattice-react`.

**Architecture:** Thin wrappers over Ariakit where it supplies behaviour, ours on tokens where it does not. One plain stylesheet with stable `lat-*` class names and `data-*` variants. The three static contract rules are implemented as **pure functions tested against fixtures**, so they fail correctly from the first commit rather than passing vacuously over an empty stylesheet. Every component adds a section to the demo app, which is also the Playwright target.

**Tech Stack:** React 19, `@ariakit/react` 0.4.35, TypeScript 7, vitest 4 + jsdom + Testing Library, Playwright 1.61 on Firefox, `@axe-core/playwright` 4.12.

**Issue:** [#37](https://github.com/chameleon-labs/lattice/issues/37)
**Spec:** [Component library on Ariakit](../specs/2026-07-31-lattice-component-library-design.md)
**Builds on:** [#36 scaffold](https://github.com/chameleon-labs/lattice/issues/36), merged as PR #41.

## Global Constraints

- **Node 24 must be active.** `nvm use` in the repo root. A Node 20 shell fails both packages' suites inside rolldown.
- Commits are unsigned: `git commit --no-gpg-sign`. The signing key expired 2025-04-29.
- Build the token package before running browser tests: `pnpm --filter @chameleon-labs/lattice-tokens build`. The demo and the token-reference contract test both read its emitted `lattice.css`.
- A test that reads a file must declare `@vitest-environment node`. Under jsdom the global `URL` resolves `new URL(relative, import.meta.url)` against the document base.
- Inherit `tsconfig.base.json`. `verbatimModuleSyntax` means `import type`; `noUncheckedIndexedAccess` means index access is `T | undefined`; `exactOptionalPropertyTypes` means `prop?: X` does not accept `undefined` explicitly.
- **No colour literal in component CSS.** Every colour is `var(--lat-…)`. `transparent` and `currentColor` are permitted.
- **Spacing uses `--lat-space-*` primitives directly.** Semantic inset/gap roles are extracted later, in #38.
- **Movement is authored only inside `@media (prefers-reduced-motion: no-preference)`.** A *static* transform is fine; a *transitioned* transform is not.
- No component imports CSS. The consumer imports `styles.css` once.
- `data-*` attributes go after the props spread; `className` is prepended, never replaced. No `forwardRef`.
- Commit after every task.

## Component inventory

| Family | Exports | Ariakit |
|---|---|---|
| Button | `Button` | `Button` |
| Input | `Input` | native |
| TextField | `TextField` | `useId` |
| Switch | `Switch` | `Checkbox` |
| Disclosure | `Disclosure`, `DisclosureContent` | yes (+`DisclosureProvider` re-export) |
| Tabs | `TabList`, `Tab`, `TabPanel` | yes (+`TabProvider` re-export) |
| Menu | `MenuButton`, `Menu`, `MenuItem`, `MenuSeparator` | yes (+`MenuProvider` re-export) |
| Dialog | `Dialog`, `DialogHeading`, `DialogDismiss`, `DialogDisclosure` | yes (+`DialogProvider` re-export) |
| Card | `Card` | — |
| Badge | `Badge` | — |
| Callout | `Callout` | — |
| Table | `Table`, `THead`, `TBody`, `Tr`, `Th`, `Td` | native |
| VisuallyHidden | `VisuallyHidden` | re-exported unchanged |
| LiveRegion | `LiveRegion` | — |

`MenuGroup`, `MenuGroupLabel`, `DialogDescription`, `MenuItemCheckbox`, `MenuItemRadio` and `MenuBar` are out — no specified tabstop screen uses one.

## Naming

- Block: `lat-{family}` — e.g. `.lat-button`, `.lat-field`.
- Element: `lat-{family}__{part}` — e.g. `.lat-field__label`, `.lat-table__caption`.
- Modifier: never a class. Always `data-variant` / `data-size` / `data-tone`.

Contract rule 5 ("block selector appears once") counts only selectors matching `^\.lat-[a-z-]+$` — no `__`, no attribute, no pseudo-class.

---

### Task 1: The CSS contract checkers

The spec requires these before the first component. They are written as pure functions over a CSS string and proven against fixtures, so they fail for real rather than passing vacuously over an empty stylesheet — which is what would happen if they only ever read the shipped file.

**Files:**
- Create: `packages/react/tests/support/css-contract.ts`
- Test: `packages/react/tests/css-contract.test.ts`

**Interfaces:**
- Produces: `findColourLiterals`, `findTokenReferences`, `findGlobalSelectors`, `findUnpausableAnimations`, `findBlockSelectors`, `findAnimatedTransformsOutsideNoPreference` — each `(css: string) => string[]`, returning offending snippets. Task 2 applies them to the built stylesheet.

- [ ] **Step 1: Write the failing test**

Create `packages/react/tests/css-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  findAnimatedTransformsOutsideNoPreference,
  findBlockSelectors,
  findColourLiterals,
  findGlobalSelectors,
  findTokenReferences,
  findUnpausableAnimations
} from './support/css-contract.js'

describe('findColourLiterals', () => {
  it('flags hex and functional colour notations', () => {
    const css = `.a { color: #ff0000; background: rgb(1 2 3); border-color: oklch(0.5 0 0); }`
    expect(findColourLiterals(css)).toEqual(['#ff0000', 'rgb(', 'oklch('])
  })

  it('permits var(), transparent and currentColor', () => {
    const css = `.a { color: var(--lat-text); background: transparent; border-color: currentColor; }`
    expect(findColourLiterals(css)).toEqual([])
  })

  it('flags the named colours someone would actually type', () => {
    expect(findColourLiterals(`.a { color: red; }`)).toEqual(['red'])
  })
})

describe('findTokenReferences', () => {
  it('returns every referenced custom property once', () => {
    const css = `.a { color: var(--lat-text); background: var(--lat-bg); outline-color: var(--lat-text); }`
    expect(findTokenReferences(css).sort()).toEqual(['--lat-bg', '--lat-text'])
  })

  it('ignores private component properties', () => {
    expect(findTokenReferences(`.a { color: var(--_solid); }`)).toEqual([])
  })
})

describe('findGlobalSelectors', () => {
  it('flags a universal selector', () => {
    expect(findGlobalSelectors(`* { transition: none; }`)).toEqual(['*'])
  })

  it('flags a descendant universal selector', () => {
    expect(findGlobalSelectors(`.lat-card * { margin: 0; }`)).toEqual(['.lat-card *'])
  })

  it('permits ordinary selectors', () => {
    expect(findGlobalSelectors(`.lat-card { margin: 0; }`)).toEqual([])
  })
})

describe('findUnpausableAnimations', () => {
  it('flags infinite animations', () => {
    expect(findUnpausableAnimations(`.a { animation: spin 1s infinite; }`)).toEqual([
      'spin 1s infinite'
    ])
  })

  it('flags anything longer than five seconds', () => {
    expect(findUnpausableAnimations(`.a { animation: x 6s ease; }`)).toEqual(['x 6s ease'])
    expect(findUnpausableAnimations(`.a { animation: x 5001ms ease; }`)).toEqual(['x 5001ms ease'])
  })

  it('permits a short finite animation', () => {
    expect(findUnpausableAnimations(`.a { animation: x 300ms ease; }`)).toEqual([])
  })
})

describe('findAnimatedTransformsOutsideNoPreference', () => {
  it('flags a transitioned transform at top level', () => {
    const css = `.a { transition-property: opacity, transform; }`
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual(['transition-property: opacity, transform'])
  })

  it('flags the transition shorthand naming transform', () => {
    const css = `.a { transition: transform 150ms ease; }`
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual(['transition: transform 150ms ease'])
  })

  it('permits a transitioned transform inside no-preference', () => {
    const css = `@media (prefers-reduced-motion: no-preference) { .a { transition-property: transform; } }`
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual([])
  })

  it('permits a static transform anywhere — position is a state signal, not motion', () => {
    const css = `.lat-switch::before { transform: translateX(100%); }`
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual([])
  })
})

describe('findBlockSelectors', () => {
  it('returns only unqualified block selectors', () => {
    const css = `
      .lat-button { color: red; }
      .lat-button[data-variant='solid'] { color: blue; }
      .lat-button:focus-visible { outline: none; }
      .lat-field__label { color: green; }
      .lat-card { color: teal; }
    `
    expect(findBlockSelectors(css).sort()).toEqual(['.lat-button', '.lat-card'])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd packages/react && pnpm exec vitest run tests/css-contract.test.ts
```

Expected: failure — `./support/css-contract.js` does not exist.

- [ ] **Step 3: Implement the checkers**

Create `packages/react/tests/support/css-contract.ts`:

```ts
// Static checks over the shipped stylesheet, expressed as pure functions so
// they can be proven against fixtures. A checker that only ever ran over the
// real file would pass vacuously while the file was empty, which is precisely
// when a contract most needs to be trustworthy.

const COMMENTS = /\/\*[\s\S]*?\*\//g

const stripComments = (css: string): string => css.replace(COMMENTS, '')

// Hex, every functional colour notation, and the named colours someone would
// plausibly type. The full 148-name CSS list is deliberately not enumerated:
// the rule exists to catch a hand-written value, not to be a CSS parser.
const NAMED = ['red', 'blue', 'green', 'black', 'white', 'gray', 'grey', 'orange', 'yellow']

export const findColourLiterals = (css: string): string[] => {
  const source = stripComments(css)
  const found: string[] = []

  for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    found.push(match[0])
  }

  for (const match of source.matchAll(/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g)) {
    found.push(match[0])
  }

  for (const name of NAMED) {
    if (new RegExp(`:\\s*${name}\\s*(;|\\}|$)`, 'm').test(source)) {
      found.push(name)
    }
  }

  return found
}

export const findTokenReferences = (css: string): string[] => {
  const names = new Set<string>()

  for (const match of stripComments(css).matchAll(/var\(\s*(--lat-[a-z0-9-]+)/g)) {
    const name = match[1]
    if (name !== undefined) {
      names.add(name)
    }
  }

  return [...names]
}

export const findGlobalSelectors = (css: string): string[] =>
  [...stripComments(css).matchAll(/(^|\})\s*([^{}]*\*[^{}]*)\{/g)]
    .map((match) => (match[2] ?? '').trim())
    .filter((selector) => selector.length > 0)

export const findUnpausableAnimations = (css: string): string[] => {
  const found: string[] = []

  for (const match of stripComments(css).matchAll(/animation:\s*([^;}]+)/g)) {
    const value = (match[1] ?? '').trim()

    if (/\binfinite\b/.test(value)) {
      found.push(value)
      continue
    }

    for (const duration of value.matchAll(/(\d*\.?\d+)(ms|s)\b/g)) {
      const raw = Number(duration[1])
      const ms = duration[2] === 's' ? raw * 1000 : raw
      if (ms > 5000) {
        found.push(value)
        break
      }
    }
  }

  return found
}

// A static transform is a position, not motion — the switch thumb sits at its
// on-state offset under `reduce` exactly as it does otherwise. Only a
// *transitioned* transform moves an element over time, so only that is gated.
export const findAnimatedTransformsOutsideNoPreference = (css: string): string[] => {
  const source = stripComments(css)
  const found: string[] = []
  const noPreference = /@media[^{]*prefers-reduced-motion:\s*no-preference[^{]*\{/g
  const guarded: Array<[number, number]> = []

  for (const match of source.matchAll(noPreference)) {
    // RegExpMatchArray.index is optional in the lib types, so it must be
    // narrowed rather than used directly under this repo's strictness.
    const opensAt = match.index ?? 0
    let depth = 1
    let index = opensAt + match[0].length

    while (index < source.length && depth > 0) {
      const char = source[index]
      if (char === '{') depth += 1
      if (char === '}') depth -= 1
      index += 1
    }

    guarded.push([opensAt, index])
  }

  const isGuarded = (at: number): boolean =>
    guarded.some(([start, end]) => at >= start && at < end)

  for (const match of source.matchAll(/transition(-property)?:\s*([^;}]+)/g)) {
    if (!/\btransform\b/.test(match[2] ?? '')) continue
    if (isGuarded(match.index ?? 0)) continue
    found.push(match[0].trim())
  }

  return found
}

export const findBlockSelectors = (css: string): string[] =>
  [...stripComments(css).matchAll(/(^|\}|\{)\s*(\.lat-[a-z-]+)\s*\{/g)]
    .map((match) => match[2] ?? '')
    .filter((selector) => selector.length > 0)
```

- [ ] **Step 4: Run the tests**

```bash
cd packages/react && pnpm exec vitest run tests/css-contract.test.ts
```

Expected: PASS, 16 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
cd packages/react && pnpm typecheck
cd /Users/george/WebstormProjects/lattice
git add packages/react/tests/support packages/react/tests/css-contract.test.ts
git commit --no-gpg-sign -m "Add the CSS contract checkers, proven against fixtures"
```

---

### Task 2: Button, the styling foundation, and the contract applied

Button is the reference implementation: it fixes the tone/variant/size mechanism, the focus rule and the motion rule that the other thirteen families follow. This task also points the Task 1 checkers at the real stylesheet and adds the browser assertions every later component inherits.

**Files:**
- Create: `packages/react/src/button/button.tsx`, `packages/react/src/button/button.css`
- Modify: `packages/react/src/styles.css`, `packages/react/src/index.ts`, `packages/react/demo/main.tsx`
- Test: `packages/react/tests/button.test.tsx`, `packages/react/tests/stylesheet.test.ts`, `packages/react/tests/browser/a11y.spec.ts`

**Interfaces:**
- Consumes: the checkers from Task 1.
- Produces: `Button`, `ButtonProps<T>`, `ButtonVariant`, `ButtonSize`, `ButtonTone`. The `--_*` private-property tone mechanism every later family reuses. `demo/main.tsx` exports a `Section` helper.

- [ ] **Step 1: Write the failing behaviour test**

Create `packages/react/tests/button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../src/button/button.js'

describe('Button', () => {
  it('defaults to soft, medium, accent', () => {
    render(<Button>Audit</Button>)
    const button = screen.getByRole('button', { name: 'Audit' })

    expect(button.dataset['variant']).toBe('soft')
    expect(button.dataset['size']).toBe('md')
    expect(button.dataset['tone']).toBe('accent')
  })

  it('maps props to data attributes', () => {
    render(
      <Button variant="solid" size="lg" tone="danger">
        Remove
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Remove' })

    expect(button.dataset['variant']).toBe('solid')
    expect(button.dataset['size']).toBe('lg')
    expect(button.dataset['tone']).toBe('danger')
  })

  it('does not let a consumer desync the attribute from the prop', () => {
    render(
      <Button variant="solid" data-variant="ghost">
        Audit
      </Button>
    )

    expect(screen.getByRole('button').dataset['variant']).toBe('solid')
  })

  it('adds className rather than replacing it', () => {
    render(<Button className="mine">Audit</Button>)
    const button = screen.getByRole('button')

    expect(button.classList.contains('lat-button')).toBe(true)
    expect(button.classList.contains('mine')).toBe(true)
  })

  it('renders as another element through render, keeping the class', () => {
    render(<Button render={<a href="/pages" />}>Pages</Button>)
    const link = screen.getByRole('link', { name: 'Pages' })

    expect(link.classList.contains('lat-button')).toBe(true)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd packages/react && pnpm exec vitest run tests/button.test.tsx
```

Expected: failure — `../src/button/button.js` does not exist.

- [ ] **Step 3: Implement Button**

Create `packages/react/src/button/button.tsx`:

```tsx
import { Button as AriakitButton, type ButtonProps as AriakitButtonProps } from '@ariakit/react'
import type { ElementType } from 'react'

export type ButtonVariant = 'solid' | 'soft' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonTone = 'accent' | 'neutral' | 'danger'

export interface ButtonOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  tone?: ButtonTone
}

export type ButtonProps<T extends ElementType = 'button'> = AriakitButtonProps<T> & ButtonOptions

export function Button<T extends ElementType = 'button'>({
  variant = 'soft',
  size = 'md',
  tone = 'accent',
  className,
  ...props
}: ButtonProps<T>) {
  return (
    <AriakitButton
      {...props}
      className={className === undefined ? 'lat-button' : `lat-button ${className}`}
      data-variant={variant}
      data-size={size}
      data-tone={tone}
    />
  )
}
```

- [ ] **Step 4: Write the stylesheet**

Create `packages/react/src/button/button.css`:

```css
.lat-button {
  /* Tone selects which family the variant rules read, so the variant rules stay
     tone-agnostic and a new tone is six declarations rather than a copy of every
     variant. Every later family reuses this mechanism. */
  --_solid: var(--lat-accent-solid);
  --_solid-hover: var(--lat-accent-solid-hover);
  --_component: var(--lat-accent-component);
  --_component-hover: var(--lat-accent-component-hover);
  --_component-active: var(--lat-accent-component-active);
  --_text: var(--lat-accent-text);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--lat-space-2);

  font-family: var(--lat-text-ui-font-family);
  font-size: var(--lat-text-ui-font-size);
  font-weight: var(--lat-text-ui-font-weight);
  line-height: var(--lat-text-ui-line-height);
  letter-spacing: var(--lat-text-ui-letter-spacing);

  border: 1px solid transparent;
  border-radius: var(--lat-radius-md);
  cursor: pointer;

  /* Colour feedback is unconditional — it is never what causes vestibular harm. */
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: var(--lat-duration-fast);
  transition-timing-function: var(--lat-easing-standard);
}

.lat-button[data-tone='neutral'] {
  --_solid: var(--lat-gray-solid);
  --_solid-hover: var(--lat-gray-solid-hover);
  --_component: var(--lat-gray-component);
  --_component-hover: var(--lat-gray-component-hover);
  --_component-active: var(--lat-gray-component-active);
  --_text: var(--lat-gray-text);
}

.lat-button[data-tone='danger'] {
  --_solid: var(--lat-danger-solid);
  --_solid-hover: var(--lat-danger-solid-hover);
  --_component: var(--lat-danger-component);
  --_component-hover: var(--lat-danger-component-hover);
  --_component-active: var(--lat-danger-component-active);
  --_text: var(--lat-danger-text);
}

.lat-button[data-size='sm'] { padding: var(--lat-space-1) var(--lat-space-2); }
.lat-button[data-size='md'] { padding: var(--lat-space-2) var(--lat-space-3); }
.lat-button[data-size='lg'] { padding: var(--lat-space-3) var(--lat-space-5); }

.lat-button[data-variant='solid'] { background-color: var(--_solid); color: var(--lat-on-solid); }
.lat-button[data-variant='solid']:hover { background-color: var(--_solid-hover); }

.lat-button[data-variant='soft'] { background-color: var(--_component); color: var(--_text); }
.lat-button[data-variant='soft']:hover { background-color: var(--_component-hover); }
.lat-button[data-variant='soft']:active { background-color: var(--_component-active); }

.lat-button[data-variant='ghost'] { background-color: transparent; color: var(--_text); }
.lat-button[data-variant='ghost']:hover { background-color: var(--_component-hover); }

/* :focus-visible only, and the outline is replaced rather than removed. */
.lat-button:focus-visible {
  outline: 2px solid var(--lat-focus-ring);
  outline-offset: 2px;
}

.lat-button:disabled,
.lat-button[aria-disabled='true'] {
  background-color: var(--lat-gray-component);
  color: var(--lat-gray-text-subtle);
  cursor: not-allowed;
}

/* Movement is authored only where it is welcome. Under `reduce` there is
   nothing to strip, which is why no global reset is needed. */
@media (prefers-reduced-motion: no-preference) {
  .lat-button:active {
    transition-property: background-color, border-color, color, box-shadow, transform;
    transform: translateY(1px);
  }
}
```

Replace `packages/react/src/styles.css` with:

```css
/*
 * The single stylesheet this package ships. Consumers import it once:
 *
 *   import '@chameleon-labs/lattice-react/styles.css'
 *
 * It is deliberately not imported by the JavaScript, so the components stay
 * usable in a bundler that is not configured for CSS.
 *
 * The build concatenates every @import below into one file — see
 * scripts/copy-css.js. Order is alphabetical and carries no cascade meaning:
 * no rule here depends on another family's specificity.
 */
@import './button/button.css';
```

- [ ] **Step 5: Make the build concatenate**

Replace `packages/react/scripts/copy-css.js`:

```js
// tsc emits JavaScript and declarations but ignores CSS. The stylesheet is
// assembled here rather than by a bundler: @import in a published file would
// cost the consumer a request waterfall, and inlining keeps the shipped CSS
// readable by the static contract tests.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const entry = join(packageRoot, 'src/styles.css')

const inline = async (file) => {
  const source = await readFile(file, 'utf8')
  const parts = []

  for (const line of source.split('\n')) {
    const match = /^@import\s+'([^']+)';/.exec(line.trim())
    if (match === null) {
      parts.push(line)
      continue
    }
    parts.push(await inline(resolve(dirname(file), match[1])))
  }

  return parts.join('\n')
}

await mkdir(join(packageRoot, 'dist'), { recursive: true })
await writeFile(join(packageRoot, 'dist/styles.css'), await inline(entry))
```

- [ ] **Step 6: Write the stylesheet contract test**

Create `packages/react/tests/stylesheet.test.ts`:

```ts
/**
 * @vitest-environment node
 *
 * Reads the built stylesheet, so `pnpm build` must have run. CI builds before
 * it tests; locally, run `pnpm build` first.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  findAnimatedTransformsOutsideNoPreference,
  findBlockSelectors,
  findColourLiterals,
  findGlobalSelectors,
  findTokenReferences,
  findUnpausableAnimations
} from './support/css-contract.js'

const read = (relative: string): string => {
  try {
    return readFileSync(new URL(relative, import.meta.url), 'utf8')
  } catch {
    throw new Error(`${relative} is missing — run \`pnpm build\` in both packages first`)
  }
}

const css = read('../dist/styles.css')
const tokensCss = read('../../tokens/dist/lattice.css')

const declared = new Set(
  [...tokensCss.matchAll(/(--lat-[a-z0-9-]+)\s*:/g)].map((match) => match[1])
)

describe('the shipped stylesheet', () => {
  it('contains no colour literal', () => {
    expect(findColourLiterals(css)).toEqual([])
  })

  it('references only tokens the token package declares', () => {
    const unknown = findTokenReferences(css).filter((name) => !declared.has(name))
    expect(unknown).toEqual([])
  })

  it('contains no universal selector and no global transition reset', () => {
    expect(findGlobalSelectors(css)).toEqual([])
    expect(css).not.toMatch(/transition:\s*none/)
  })

  it('ships no unpausable motion', () => {
    expect(findUnpausableAnimations(css)).toEqual([])
  })

  it('animates no transform outside prefers-reduced-motion: no-preference', () => {
    expect(findAnimatedTransformsOutsideNoPreference(css)).toEqual([])
  })

  it('declares each block selector exactly once', () => {
    const blocks = findBlockSelectors(css)
    const duplicated = blocks.filter((name, index) => blocks.indexOf(name) !== index)
    expect(duplicated).toEqual([])
  })
})
```

- [ ] **Step 7: Export it and add the demo section**

`packages/react/src/index.ts`:

```ts
export { Button } from './button/button.js'
export type { ButtonOptions, ButtonProps, ButtonSize, ButtonTone, ButtonVariant } from './button/button.js'
```

Replace `packages/react/demo/main.tsx`:

```tsx
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

import '@chameleon-labs/lattice-tokens/lattice.css'
import '../src/styles.css'

import { Button } from '../src/index.js'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`h-${title}`}>
      <h2 id={`h-${title}`}>{title}</h2>
      {children}
    </section>
  )
}

// Both modes render on one page in scoped [data-lat-theme] sections. That
// attribute exists precisely so a theme can scope to any element, and one page
// halves the browser-test count without weakening the assertions: axe measures
// computed colour, which is per-element.
function Gallery() {
  return (
    <>
      <Section title="Button">
        {(['solid', 'soft', 'ghost'] as const).map((variant) =>
          (['accent', 'neutral', 'danger'] as const).map((tone) =>
            (['sm', 'md', 'lg'] as const).map((size) => (
              <Button key={`${variant}-${tone}-${size}`} variant={variant} tone={tone} size={size}>
                {variant} {tone} {size}
              </Button>
            ))
          )
        )}
      </Section>
    </>
  )
}

const container = document.getElementById('root')

if (container === null) {
  throw new Error('demo: #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <main>
      <h1>Lattice components</h1>
      <div data-lat-theme="light" id="theme-light">
        <h2>Light</h2>
        <Gallery />
      </div>
      <div data-lat-theme="dark" id="theme-dark">
        <h2>Dark</h2>
        <Gallery />
      </div>
    </main>
  </StrictMode>
)
```

- [ ] **Step 8: Write the browser assertions**

Create `packages/react/tests/browser/a11y.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark'] as const) {
  test(`no axe violations in ${theme}`, async ({ page }) => {
    await page.goto('/')

    const results = await new AxeBuilder({ page }).include(`#theme-${theme}`).analyze()

    expect(results.violations).toEqual([])
  })
}

test('keyboard focus produces a visible ring, pointer focus does not', async ({ page }) => {
  await page.goto('/')
  const button = page.locator('#theme-light .lat-button').first()

  await page.keyboard.press('Tab')
  await button.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')

  const keyboardOutline = await button.evaluate((el) => getComputedStyle(el).outlineWidth)
  expect(parseFloat(keyboardOutline)).toBeGreaterThan(0)

  await button.click()
  const pointerOutline = await button.evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(pointerOutline).toBe('none')
})

test('animates no transform under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const offenders = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .map((el) => getComputedStyle(el).transitionProperty)
      .filter((value) => value.includes('transform'))
  )

  expect(offenders).toEqual([])
})

test('borders survive forced-colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto('/')

  const width = await page
    .locator('#theme-light .lat-button')
    .first()
    .evaluate((el) => getComputedStyle(el).borderTopWidth)

  expect(parseFloat(width)).toBeGreaterThan(0)
})
```

- [ ] **Step 9: Build, test, and prove each contract rule bites**

```bash
cd /Users/george/WebstormProjects/lattice
pnpm --filter @chameleon-labs/lattice-tokens build
cd packages/react && pnpm build && pnpm test
```

Expected: all green.

Then, **one at a time**, apply each mutation to `src/button/button.css`, rebuild, confirm the named test fails, and restore:

| Mutation | Must fail |
|---|---|
| `color: #fff` on `.lat-button` | contains no colour literal |
| `var(--lat-nonexistent)` | references only tokens the token package declares |
| move the `transform` transition out of the media query | animates no transform outside … |
| add `* { transition: none }` | no universal selector … |
| add `animation: x 6s ease` | ships no unpausable motion |
| duplicate the `.lat-button { }` block | declares each block selector exactly once |
| delete `:focus-visible` | keyboard focus produces a visible ring |

- [ ] **Step 10: Commit**

```bash
git add packages/react/src packages/react/demo packages/react/scripts packages/react/tests
git commit --no-gpg-sign -m "Add Button, the styling contract, and the browser a11y harness"
```

---

### Tasks 3–9: the remaining families

Each follows the identical shape established by Task 2, and **each is its own commit**:

1. Write the behaviour test in `tests/{family}.test.tsx`; run it; watch it fail.
2. Implement `src/{family}/{family}.tsx`.
3. Write `src/{family}/{family}.css`; add its `@import` to `src/styles.css`.
4. Export from `src/index.ts`.
5. Add a `<Section>` to `demo/main.tsx` — inside `Gallery`, so it renders in both themes.
6. `pnpm build && pnpm test`. The stylesheet contract tests and the axe scan now cover the new family automatically; no new browser test is needed unless the family's guarantee needs one (noted below).
7. Commit.

The per-family contracts follow. Every one of these is a rule the component makes true by construction, and each needs the named test.

#### Task 3: Input and TextField

`Input` — native `<input>`, `size` (`sm|md|lg`), `invalid?: boolean` mapping to `aria-invalid`. Class `lat-input`.

`TextField` composes it. Required `label`; optional `description` and `error`. Generates ids with `useId`.

```tsx
export interface TextFieldProps extends Omit<InputProps, 'aria-describedby' | 'aria-invalid'> {
  label: string
  description?: string
  error?: string
}
```

**Tests (this is the family's whole reason for existing):**
- the label's `htmlFor` matches the input's `id`;
- with a description only, `aria-describedby` is exactly the description id;
- with an error only, it is exactly the error id and `aria-invalid` is `"true"`;
- with both, it lists both ids in that order;
- **with neither, `aria-describedby` and `aria-invalid` are absent** — an empty `aria-describedby` is worse than none.

The error carries **no live role**, consistent with `Callout`: one present on first render announces out of context.

#### Task 4: Switch

Ariakit `Checkbox` with `role="switch"`. Class `lat-switch`, `appearance: none`, thumb as `::before` positioned with a **static** `transform` — the position is the state signal and must survive `reduce`. Only its *transition* sits inside `no-preference`.

**Tests:** exposes `role="switch"`; `aria-checked` follows state; clicking the associated label toggles it; the thumb's computed `transform` differs between states under `prefers-reduced-motion: reduce` (proving the signal is not motion-dependent).

#### Task 5: Disclosure and Tabs

`Disclosure` + `DisclosureContent`, re-exporting `DisclosureProvider`. `TabList` + `Tab` + `TabPanel`, re-exporting `TabProvider`. Selected state styles off `[aria-selected='true']`, which Ariakit sets.

Tabs activate automatically — APG's default, correct here because the panels are already rendered.

**Tests:** `Disclosure` toggles `aria-expanded` and the content's presence together; arrow keys move tab selection; each panel is associated with its tab via `aria-labelledby`.

#### Task 6: Menu and Dialog

`MenuButton`, `Menu`, `MenuItem`, `MenuSeparator` (+`MenuProvider`). `Menu` uses the `overlay` elevation role. `Dialog`, `DialogHeading`, `DialogDismiss`, `DialogDisclosure` (+`DialogProvider`); `Dialog` uses the `modal` elevation role and Ariakit's `backdrop`.

Both animate entry: **opacity unconditionally, transform only inside `no-preference`.** This is the pair the reduced-motion rule exists for.

**Tests:** `Menu` returns focus to its button on close and typeahead selects an item; `Dialog` returns focus to its trigger on close. **Browser test:** `Dialog` traps focus — Tab from the last focusable element returns to the first — and the page behind does not scroll.

#### Task 7: Card, Badge and Callout

`Card` — the `raised` elevation role, meaning all three signals together: `--lat-elevation-raised-surface`, `-border` and `-shadow`. It never becomes `role="button"`.

`Badge` — `tone` over eight values: `neutral | accent | success | danger | critical | serious | moderate | minor`. The last four read the severity ramp, so tabstop can pass an axe impact string straight through. `children` is **required** in the type, because the guarantee is that text always accompanies colour.

`Callout` — `tone` (`neutral | accent | success | danger`), optional `title`, required `children`, and `live?: 'polite' | 'assertive'` which is **absent by default**.

**Tests:** `Card` renders no `role` attribute; `Badge` fails to compile without children (type test); `Callout` has no `role` or `aria-live` unless `live` is passed, and has `role="status"`/`role="alert"` when it is.

#### Task 8: Table

`Table`, `THead`, `TBody`, `Tr`, `Th`, `Td` over native elements.

```tsx
export interface TableProps extends ComponentPropsWithoutRef<'table'> {
  caption: string
  visuallyHiddenCaption?: boolean
}

export interface ThProps extends Omit<ComponentPropsWithoutRef<'th'>, 'scope'> {
  scope: 'col' | 'row'
}
```

Both required properties are the point: the two commonest table omissions become compile errors.

**Tests:** the caption renders as a `<caption>` and is the table's accessible name; `visuallyHiddenCaption` wraps it in `VisuallyHidden` while keeping it in the accessibility tree; **type tests** asserting `<Table>` without `caption` and `<Th>` without `scope` both fail to compile.

#### Task 9: VisuallyHidden and LiveRegion

`VisuallyHidden` is **re-exported from Ariakit unchanged**. It already implements the clip-rect correctly, and wrapping it would add a class that does nothing. Note this in its README rather than inventing a wrapper to look consistent.

`LiveRegion`:

```tsx
export interface LiveRegionProps {
  message: string
  politeness?: 'polite' | 'assertive'
}
```

Holds the last announced string in a ref and updates the rendered text only when it differs. React's diffing would usually make an identical update a no-op anyway; doing it explicitly makes the guarantee the component's rather than the renderer's.

**Tests:** rendering the same message twice mutates the DOM once; a changed message updates it; `politeness` maps to `aria-live`; the region is present and empty on first render, so the container exists before the first announcement — a live region inserted at announcement time is not reliably read.

---

### Task 10: Documentation and the final gate

**Files:**
- Create: `packages/react/src/{family}/README.md` × 14
- Modify: `packages/react/README.md`, root `README.md`

- [ ] **Step 1: Write a README per family**

Each covers props, class names and `data-*` attributes — the class names because they are a published escape hatch, and an escape hatch nobody documented is not one.

- [ ] **Step 2: Update the package and root READMEs**

`packages/react/README.md`: status moves from "scaffold" to the component list. Root `README.md`: move components from "Not yet" into scope, and record the deferred inventory (`EmptyState`, `Skeleton`, `Toast`, `Link`, `Tooltip`, `Select`, `Combobox`) with the reason each is waiting.

- [ ] **Step 3: Run the full gate**

```bash
cd /Users/george/WebstormProjects/lattice
pnpm install
pnpm --filter @chameleon-labs/lattice-tokens build
pnpm typecheck && pnpm test && pnpm build && git diff --check
```

- [ ] **Step 4: Commit**

---

## Definition of done

Against #37's acceptance criteria:

- [ ] Static contract tests exist, are proven against fixtures, and each is shown failing under a targeted mutation.
- [ ] `@axe-core/playwright` reports zero violations per component, both themes, every variant the demo renders.
- [ ] Keyboard focus produces a measurably visible ring; pointer focus does not.
- [ ] Under `reducedMotion: 'reduce'`, no computed `transition-property` contains `transform`.
- [ ] Under `forcedColors: 'active'`, component borders survive.
- [ ] `Dialog` traps focus and returns it to its trigger; the page behind does not scroll.
- [ ] Every mutation in the spec's list fails a targeted test.
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm build` pass.

## Notes for the implementer

- **The demo is a test fixture, not a showcase.** If a variant is not rendered there, no axe scan covers it. Add every variant.
- **Do not add a component the inventory does not name.** The spec's admission test is that a component must make a guarantee a consumer would otherwise have to remember. `EmptyState` was cut on exactly that basis.
- **Resist widening the colour-literal checker into a CSS parser.** It exists to catch a hand-written value. If it produces a false positive, narrow the CSS, not the rule.
