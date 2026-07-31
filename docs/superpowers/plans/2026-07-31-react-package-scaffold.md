# packages/react Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@chameleon-labs/lattice-react` as an emitting workspace package with both test harnesses wired, so [#37](https://github.com/chameleon-labs/lattice/issues/37) has somewhere to put fourteen components.

**Architecture:** A pnpm workspace package beside `packages/tokens`, inheriting `tsconfig.base.json` and overriding `noEmit` because this package emits where the token package does not. Two tsconfigs: one that typechecks everything, one that emits only `src`. Two test tiers: vitest with jsdom and React Testing Library for behaviour, and Playwright against a Vite demo app for real-browser assertions. No components ship in this plan — each task's deliverable is a piece of infrastructure with a test proving it works.

**Tech Stack:** TypeScript 7, React 19, `@ariakit/react` 0.4, vitest 4 + jsdom 30 + React Testing Library 16, Playwright 1.61 on Firefox, Vite 8.

**Issue:** [#36 — Scaffold packages/react](https://github.com/chameleon-labs/lattice/issues/36)
**Spec:** [Component library on Ariakit](../specs/2026-07-31-lattice-component-library-design.md)

## Global Constraints

- Node 24 (`.nvmrc` is `24.18.0`), pnpm 10.7.0, ESM throughout (`"type": "module"`).
- Inherit `tsconfig.base.json`; never re-declare its strictness settings. It sets `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules`, `module: NodeNext`.
- `verbatimModuleSyntax` means every type-only import must be written `import type`.
- `noUncheckedIndexedAccess` means every index access is `T | undefined`. Do not add non-null assertions to silence it; narrow explicitly.
- Script names must match `packages/tokens` exactly — `build`, `typecheck`, `test`, `test:unit`, `test:browser`, `test:watch` — so the root fan-out and CI work unchanged.
- React, `react-dom`, `@ariakit/react` and `@chameleon-labs/lattice-tokens` are **peer** dependencies. The package ships no runtime dependencies.
- No component code in this plan. Components are #37.
- Commit after every task.

---

### Task 1: Package skeleton and the peer boundary

The seam this whole system rests on is that `lattice-tokens` stays installable by a consumer that never touches React. That is currently true by accident. This task makes it true by assertion.

**Files:**
- Create: `packages/react/package.json`
- Create: `packages/react/tsconfig.json`
- Create: `packages/react/vitest.config.ts`
- Test: `packages/react/tests/package-contract.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the package name `@chameleon-labs/lattice-react`, resolvable by `pnpm --filter`.

- [ ] **Step 1: Write the failing test**

Create `packages/react/tests/package-contract.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

interface PackageJson {
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
  readonly peerDependencies?: Record<string, string>
}

const load = (relative: string): PackageJson =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8')) as PackageJson

const react = load('../package.json')
const tokens = load('../../tokens/package.json')

describe('lattice-react package boundary', () => {
  it('declares React, Ariakit and the token package as peers', () => {
    expect(Object.keys(react.peerDependencies ?? {}).sort()).toEqual([
      '@ariakit/react',
      '@chameleon-labs/lattice-tokens',
      'react',
      'react-dom'
    ])
  })

  it('ships no runtime dependencies', () => {
    expect(react.dependencies ?? {}).toEqual({})
  })
})

describe('lattice-tokens stays installable without React', () => {
  it('names no React or Ariakit package in any dependency field', () => {
    const combined = {
      ...tokens.dependencies,
      ...tokens.devDependencies,
      ...tokens.peerDependencies
    }

    const offenders = Object.keys(combined).filter(
      (name) => name === 'react' || name === 'react-dom' || name.startsWith('@ariakit/')
    )

    expect(offenders).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
cd packages/react && pnpm exec vitest run
```

Expected: failure. The exact message depends on how pnpm resolves from a directory with no manifest — either no test files are found or the config cannot be located. Do not chase a specific string; the point is that nothing passes yet.

- [ ] **Step 3: Create `packages/react/package.json`**

```json
{
  "name": "@chameleon-labs/lattice-react",
  "version": "0.0.0",
  "private": true,
  "description": "The component layer of Lattice, an accessibility-first design system. Ariakit supplies behaviour; Lattice decides appearance and guarantees legibility.",
  "license": "MIT",
  "author": "George Karan",
  "homepage": "https://github.com/chameleon-labs/lattice#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/chameleon-labs/lattice.git",
    "directory": "packages/react"
  },
  "bugs": "https://github.com/chameleon-labs/lattice/issues",
  "keywords": [
    "design-system",
    "react",
    "ariakit",
    "components",
    "accessibility",
    "wcag"
  ],
  "type": "module",
  "files": [
    "dist"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./styles.css": "./dist/styles.css",
    "./package.json": "./package.json"
  },
  "sideEffects": [
    "**/*.css"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.build.json && node scripts/copy-css.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run && playwright test",
    "test:unit": "vitest run",
    "test:browser": "playwright test",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "@ariakit/react": "^0.4.35",
    "@chameleon-labs/lattice-tokens": "*",
    "react": ">=19",
    "react-dom": ">=19"
  },
  "devDependencies": {
    "@ariakit/react": "^0.4.35",
    "@axe-core/playwright": "^4.12.1",
    "@chameleon-labs/lattice-tokens": "workspace:*",
    "@playwright/test": "^1.61.0",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^26.1.2",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "jsdom": "^30.0.1",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "typescript": "^7.0.2",
    "vite": "^8.2.0",
    "vitest": "^4.1.10"
  }
}
```

The token peer range is `*` on purpose. That package is `0.0.0` and `private`, so the first honest range is the one #10 sets when it decides a version. `workspace:*` in `devDependencies` is what makes it resolve today.

- [ ] **Step 4: Create `packages/react/tsconfig.json`**

This one typechecks everything and emits nothing. Task 2 adds the build variant.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2024", "DOM", "DOM.Iterable"]
  },
  "include": ["src", "tests", "demo", "scripts", "vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

`lib` is widened because this package touches the DOM, where the token package does not. `jsx: react-jsx` is what lets both `tsc` and esbuild use the automatic runtime, so no file needs to import React to use JSX.

- [ ] **Step 5: Create `packages/react/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}']
  }
})
```

`include` deliberately does not match `tests/browser/**`, which holds Playwright specs named `*.spec.ts`. The two runners must never pick up each other's files.

- [ ] **Step 6: Install and run the test**

```bash
cd /Users/george/WebstormProjects/lattice && pnpm install
cd packages/react && pnpm exec vitest run
```

Expected: PASS, three tests.

- [ ] **Step 7: Commit**

```bash
git add packages/react/package.json packages/react/tsconfig.json \
        packages/react/vitest.config.ts packages/react/tests/package-contract.test.ts \
        pnpm-lock.yaml
git commit --no-gpg-sign -m "Add the React package and assert the token package's peer boundary"
```

---

### Task 2: The emitting build

The token package publishes CSS and JSON and never emits JavaScript. This one emits both JavaScript and declarations, which is the single largest difference between them and the reason `noEmit` is overridden rather than inherited.

**Files:**
- Create: `packages/react/tsconfig.build.json`
- Create: `packages/react/src/index.ts`
- Create: `packages/react/src/styles.css`
- Create: `packages/react/scripts/copy-css.js`
- Test: `packages/react/tests/published-surface.test.ts`

**Interfaces:**
- Consumes: `package.json` from Task 1.
- Produces: `dist/index.js`, `dist/index.d.ts`, `dist/styles.css`. `src/index.ts` is the barrel every component in #37 re-exports from; `src/styles.css` is the single shipped stylesheet.

- [ ] **Step 1: Write the failing test**

Create `packages/react/tests/published-surface.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

interface PackageJson {
  readonly files?: readonly string[]
  readonly exports?: Record<string, string | Record<string, string>>
}

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as PackageJson

const targets = (entry: string | Record<string, string>): readonly string[] =>
  typeof entry === 'string' ? [entry] : Object.values(entry)

describe('published surface', () => {
  it('ships only dist', () => {
    expect(pkg.files).toEqual(['dist'])
  })

  it('exports the barrel, the stylesheet and package.json', () => {
    expect(Object.keys(pkg.exports ?? {}).sort()).toEqual([
      '.',
      './package.json',
      './styles.css'
    ])
  })

  it('points every export at dist, except package.json itself', () => {
    const entries = Object.entries(pkg.exports ?? {}).filter(([key]) => key !== './package.json')
    const paths = entries.flatMap(([, entry]) => targets(entry))

    expect(paths.length).toBeGreaterThan(0)
    for (const path of paths) {
      expect(path.startsWith('./dist/')).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run it and watch it pass**

```bash
cd packages/react && pnpm exec vitest run tests/published-surface.test.ts
```

Expected: PASS. Task 1's `package.json` already satisfies it. This test is a **regression guard**, not a driver — it exists so that a later change cannot quietly export a path outside `dist` or drop the stylesheet entry. Record that it passed on first run; do not weaken it to force a red.

- [ ] **Step 3: Run the build and watch it fail**

```bash
cd packages/react && pnpm build
```

Expected: failure — `tsconfig.build.json` does not exist, and neither does `src`. This is the driver for the rest of the task.

**Do not add a vitest test asserting `dist/` exists.** It would pass locally and fail in CI, because `pnpm -r test` runs before `pnpm -r build` — the ordering the existing workflow chose deliberately, since the build is the slowest and most complete step. Artefact existence is verified in CI after the build instead, which is exactly how the token package handles the same problem.

- [ ] **Step 4: Create `packages/react/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

Two configs rather than one because `tsc --noEmit` must see `tests`, `demo` and the config files, while the emit must see only `src` — otherwise `rootDir` widens and `dist` grows a directory level.

- [ ] **Step 5: Create `packages/react/src/index.ts`**

```ts
// The barrel every component re-exports from. Empty until #37.
export {}
```

- [ ] **Step 6: Create `packages/react/src/styles.css`**

```css
/*
 * The single stylesheet this package ships. Consumers import it once:
 *
 *   import '@chameleon-labs/lattice-react/styles.css'
 *
 * It is deliberately not imported by the JavaScript, so the components stay
 * usable in a bundler that is not configured for CSS — the same arrangement
 * lattice.css already has.
 *
 * Every value here must be a var(--lat-…) reference. #37 adds the component
 * rules and the static tests that enforce that.
 */
```

- [ ] **Step 7: Create `packages/react/scripts/copy-css.js`**

```js
// tsc emits JavaScript and declarations but ignores CSS, so the stylesheet is
// copied as a separate build step. No bundler stands between src and dist,
// which is what keeps the shipped file readable by the contract tests in #37.
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

await mkdir(join(packageRoot, 'dist'), { recursive: true })
await copyFile(join(packageRoot, 'src/styles.css'), join(packageRoot, 'dist/styles.css'))
```

- [ ] **Step 8: Build, then run the tests**

```bash
cd packages/react && pnpm build && pnpm exec vitest run
```

Expected: build succeeds; all tests PASS.

Then verify the artefacts by hand, with the same loop CI will run in Task 5:

```bash
cd packages/react
for f in dist/index.js dist/index.d.ts dist/styles.css; do
  test -s "$f" || { echo "missing or empty: $f"; exit 1; }
  echo "ok: $f ($(wc -c < "$f") bytes)"
done
```

Expected: three `ok:` lines.

- [ ] **Step 9: Verify the root fan-out and typecheck**

```bash
cd /Users/george/WebstormProjects/lattice && pnpm typecheck && pnpm build
```

Expected: both packages pass. Confirm `packages/tokens/dist` gained no new files — the React build must not write into its sibling.

- [ ] **Step 10: Commit**

```bash
git add packages/react/tsconfig.build.json packages/react/src packages/react/scripts \
        packages/react/tests/published-surface.test.ts
git commit --no-gpg-sign -m "Emit JavaScript, declarations and the stylesheet from packages/react"
```

---

### Task 3: The jsdom and React Testing Library harness

Tier 1 of the spec's three test tiers. Everything behavioural in #37 lands here, so it has to work before any component is written against it.

**Files:**
- Create: `packages/react/tests/setup.ts`
- Modify: `packages/react/vitest.config.ts`
- Test: `packages/react/tests/harness.test.tsx`

**Interfaces:**
- Consumes: the package and vitest config from Task 1.
- Produces: a working `render`/`screen` harness with automatic cleanup between tests.

- [ ] **Step 1: Write the failing test**

Create `packages/react/tests/harness.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('component test harness', () => {
  it('renders JSX into a DOM the assertions can read', () => {
    render(<p>lattice</p>)

    expect(screen.getByText('lattice')).toBeDefined()
  })

  it('cleans the document between tests', () => {
    expect(screen.queryByText('lattice')).toBeNull()
  })
})
```

The second test is the one that matters. Without cleanup it fails, because the previous test's markup is still mounted — and a component suite where mounts leak into each other produces failures that look like component bugs.

- [ ] **Step 2: Run it and watch it fail**

```bash
cd packages/react && pnpm exec vitest run tests/harness.test.tsx
```

Expected: the second test FAILS — `lattice` is still in the document.

- [ ] **Step 3: Create `packages/react/tests/setup.ts`**

```ts
// React Testing Library only auto-cleans when a global afterEach exists, and
// this package does not enable vitest globals. Registering it explicitly is
// what keeps one test's mounted tree out of the next one's queries.
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 4: Wire it into `packages/react/vitest.config.ts`**

Replace the file with:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts']
  }
})
```

- [ ] **Step 5: Run the tests**

```bash
cd packages/react && pnpm exec vitest run
```

Expected: PASS, all tests including both harness tests.

- [ ] **Step 6: Commit**

```bash
git add packages/react/tests/setup.ts packages/react/tests/harness.test.tsx \
        packages/react/vitest.config.ts
git commit --no-gpg-sign -m "Add the jsdom and Testing Library harness, with cleanup between tests"
```

---

### Task 4: The demo app and the Playwright harness

Tier 2. The demo is not only documentation — it is the page the browser assertions drive, so what a reviewer looks at and what the tests measure cannot diverge.

**Files:**
- Create: `packages/react/demo/index.html`
- Create: `packages/react/demo/main.tsx`
- Create: `packages/react/demo/env.d.ts`
- Create: `packages/react/vite.config.ts`
- Create: `packages/react/playwright.config.ts`
- Test: `packages/react/tests/browser/harness.spec.ts`

**Interfaces:**
- Consumes: `src/styles.css` from Task 2; `packages/tokens/dist/lattice.css`, which must be built first.
- Produces: a demo served at `http://localhost:5173` with both stylesheets loaded. #37 adds a section per component to `demo/main.tsx`.

- [ ] **Step 1: Build the token package**

```bash
cd /Users/george/WebstormProjects/lattice && pnpm --filter @chameleon-labs/lattice-tokens build
```

The demo imports `@chameleon-labs/lattice-tokens/lattice.css`, and that file is generated rather than committed — `dist/` is gitignored. Task 5 makes CI do this in the right order.

- [ ] **Step 2: Write the failing test**

Create `packages/react/tests/browser/harness.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('serves the demo with both stylesheets applied', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Lattice components' })).toBeVisible()

  // Proves the token stylesheet is actually loaded rather than merely imported:
  // an unresolved custom property computes to the empty string.
  const surface = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--lat-bg').trim()
  )

  expect(surface).not.toBe('')
})
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd packages/react && pnpm exec playwright test
```

Expected: failure — there is no Playwright config and no server to reach.

- [ ] **Step 4: Create `packages/react/demo/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lattice components</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `packages/react/demo/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// The token stylesheet first: every component value is a var() reference into it.
import '@chameleon-labs/lattice-tokens/lattice.css'
import '../src/styles.css'

const container = document.getElementById('root')

if (container === null) {
  throw new Error('demo: #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <main>
      <h1>Lattice components</h1>
    </main>
  </StrictMode>
)
```

- [ ] **Step 6: Declare the CSS module type**

`demo/main.tsx` imports two stylesheets, and TypeScript rejects a `.css` specifier with no declaration — so `pnpm typecheck`, which covers `demo`, fails without this.

Create `packages/react/demo/env.d.ts`:

```ts
// A side-effect stylesheet import has no type of its own. The wildcard matches
// a package subpath as well as a relative path, which is what covers
// '@chameleon-labs/lattice-tokens/lattice.css'.
declare module '*.css'
```

Verify it works before moving on:

```bash
cd packages/react && pnpm typecheck
```

Expected: exit zero. Without `env.d.ts` this reports two errors in `demo/main.tsx`.

- [ ] **Step 7: Create `packages/react/vite.config.ts`**

```ts
import { defineConfig } from 'vite'

// No @vitejs/plugin-react. Vite transpiles .tsx with esbuild using the jsx
// setting from tsconfig.json, and the plugin's only additions here would be
// Fast Refresh and the React Compiler — neither of which a Playwright target
// needs, against three more peer dependencies.
export default defineConfig({
  root: 'demo',
  server: {
    port: 5173,
    strictPort: true
  }
})
```

- [ ] **Step 8: Create `packages/react/playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test'

// The two Firefox projects are carried over from the token package: 16px and
// 20px root font size, so every component is checked at a non-default user
// font size for free.
//
// What is NOT carried over is `fullyParallel: false` and `workers: 1`. Those
// exist there because that suite asserts against shared emitted artefacts.
// Component assertions are per-component and independent, and serialising
// fourteen components would make the suite slow enough to stop being run.
export default defineConfig({
  testDir: './tests/browser',
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'pnpm exec vite',
    url: 'http://localhost:5173',
    reuseExistingServer: process.env.CI === undefined
  },
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

- [ ] **Step 9: Install Firefox and run the browser test**

```bash
cd packages/react && pnpm exec playwright install firefox && pnpm exec playwright test
```

Expected: PASS on both projects, two tests total.

- [ ] **Step 10: Confirm the two runners do not collide**

```bash
cd packages/react && pnpm test
```

Expected: vitest runs `tests/**/*.test.{ts,tsx}` and Playwright runs `tests/browser/*.spec.ts`, with neither picking up the other's files. If vitest reports the browser spec, its `include` is wrong.

- [ ] **Step 11: Commit**

```bash
git add packages/react/demo packages/react/vite.config.ts \
        packages/react/playwright.config.ts packages/react/tests/browser
git commit --no-gpg-sign -m "Add the demo app and the Playwright browser harness"
```

---

### Task 5: CI and documentation

The spec's claim is that these guarantees are tested rather than asserted. Until CI runs them, that is true only on a developer's machine — which is the exact argument the existing `ci.yml` header makes about the contrast contracts.

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Create: `packages/react/README.md`

**Interfaces:**
- Consumes: every script from Tasks 1–4.
- Produces: CI coverage for the new package.

- [ ] **Step 1: Add a token build step before Test in `.github/workflows/ci.yml`**

Insert immediately before the `Typecheck` step:

```yaml
      # The React package's demo imports the emitted token stylesheet, and
      # dist/ is gitignored — so the artefact has to exist before its browser
      # tests run. The full `pnpm -r build` below still runs for every package;
      # this is the one ordering dependency that cannot wait for it.
      - name: Build tokens
        run: pnpm --filter @chameleon-labs/lattice-tokens build
```

The existing Firefox install step needs no change: Playwright stores browser binaries in a shared per-revision cache, and both packages depend on the same `^1.61.0`, so one install serves both.

- [ ] **Step 2: Extend the artefact verification**

Replace the `Verify emitted artefacts` step's file list so it covers both packages:

```yaml
      - name: Verify emitted artefacts
        run: |
          set -euo pipefail
          for f in packages/tokens/dist/lattice.css \
                   packages/tokens/dist/tokens.json \
                   packages/react/dist/index.js \
                   packages/react/dist/index.d.ts \
                   packages/react/dist/styles.css; do
            test -s "$f" || { echo "missing or empty: $f"; exit 1; }
            echo "ok: $f ($(wc -c < "$f") bytes)"
          done
```

- [ ] **Step 3: Create `packages/react/README.md`**

```markdown
# @chameleon-labs/lattice-react

The component layer of [Lattice](../../README.md), built on design tokens and
wrapping [Ariakit](https://ariakit.org) where behaviour is hard.

**Status: scaffold.** No components ship yet — see
[#37](https://github.com/chameleon-labs/lattice/issues/37).

## Install

React, `react-dom`, `@ariakit/react` and `@chameleon-labs/lattice-tokens` are
peer dependencies. This package ships no runtime dependencies of its own.

Both stylesheets are imported by the application, in this order:

```ts
import '@chameleon-labs/lattice-tokens/lattice.css'
import '@chameleon-labs/lattice-react/styles.css'
```

The components never import CSS themselves, so the JavaScript stays usable in a
bundler that is not configured for CSS.

## Development

```sh
pnpm --filter @chameleon-labs/lattice-tokens build   # the demo needs the emitted tokens
pnpm --filter @chameleon-labs/lattice-react exec playwright install firefox

pnpm build        # tsc emits JS and declarations; the stylesheet is copied
pnpm typecheck
pnpm test         # vitest (jsdom) then Playwright (Firefox at 16px and 20px)
pnpm test:unit
pnpm test:browser
```

`demo/` is both the documentation and the target the browser tests drive, so
what a reviewer looks at and what the assertions measure cannot diverge.

Two tsconfigs: `tsconfig.json` typechecks everything and emits nothing;
`tsconfig.build.json` emits `src` alone.
```

- [ ] **Step 4: Update the root `README.md`**

In the two-package table, change the `@chameleon-labs/lattice-react` row's
description from `**not built yet**` to:

```
the component layer on [Ariakit](https://github.com/ariakit/ariakit) — **scaffold only**
```

In the repository tree, change the `packages/react/` line from
`not built yet` to `scaffold; components tracked in #37`.

- [ ] **Step 5: Verify the whole gate locally**

```bash
cd /Users/george/WebstormProjects/lattice
pnpm install
pnpm --filter @chameleon-labs/lattice-tokens build
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Expected: every command exits zero, and `git diff --check` reports no whitespace errors.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml README.md packages/react/README.md
git commit --no-gpg-sign -m "Run the React package in CI and document it"
```

---

## Definition of done

Checked against #36's acceptance criteria:

- [ ] `pnpm build`, `pnpm typecheck` and `pnpm test` pass from the root and inside `packages/react`.
- [ ] No React or Ariakit dependency reaches `@chameleon-labs/lattice-tokens` — asserted in `tests/package-contract.test.ts`, not merely observed.
- [ ] The React build writes nothing into `packages/tokens/dist`.
- [ ] CI runs the new package's vitest and Playwright suites, and verifies its three emitted artefacts.

## Notes for the implementer

- **Commits here are unsigned.** The repository's GPG key expired on 2025-04-29 and `commit.gpgsign` is `true`, so `--no-gpg-sign` is required on every commit until the key is renewed. This was an explicit decision, not an oversight.
- **Do not add components.** If a task tempts you toward one, the harness is incomplete — fix the harness. Components are #37, and the styling contract tests that govern them land there, before the first component.
- **Do not weaken a test to make it red.** `published-surface.test.ts` passes on first run by design; it is a regression guard against a later change, and the plan says so at the step.
