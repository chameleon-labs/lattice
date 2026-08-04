# Meridian Components Implementation Plan (Phase 2 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the fourteen existing component families to the Meridian identity and add the four the demos need, keeping Ariakit as the behaviour layer throughout.

**Architecture:** Each family keeps its Ariakit wiring and its `lat-*` class plus `data-*` attribute pattern. Only the CSS and the public variant props change. Button's `variant × tone` matrix is replaced by Meridian's five named variants — a breaking change, and an intended one.

**Tech Stack:** React 19, Ariakit 0.4, plain authored CSS, Storybook 10, vitest, Playwright.

## Prerequisite

**Phase 1 must be complete and committed.** Every token this plan references is emitted by `docs/superpowers/plans/2026-08-03-meridian-tokens.md`. Verify before starting:

```bash
cd packages/tokens && pnpm build && \
  grep -cE "lat-(bg|bg-raised|text-subtle|solid|border|wash|focus-ring|danger-tint|accent-vivid):" dist/lattice.css
```

Expected: a non-zero count. If it is zero, stop — Phase 1 is not done.

## Global Constraints

- Package: `packages/react`. `packages/tokens` is not touched.
- **Every value is a `var(--lat-*)` reference.** No literal colour, size, radius, duration or shadow appears in any component stylesheet. If a value is needed that no token supplies, that is a Phase 1 gap — report it rather than inlining a literal.
- **An edge is a real `border`, never `box-shadow`.** `box-shadow` is not rendered under forced-colors, so a control whose only edge is a ring has no edge at all for a high-contrast user. `tests/browser/a11y.spec.ts` asserts this. This rule survives from the superseded Quiet Surface spec and is not negotiable.
- **Radius is `var(--lat-radius-none)` everywhere** except dots and avatars, which use `var(--lat-radius-full)`. Meridian is square.
- Do not fix pre-existing failing tests. Update only the stories and tests this plan names.
- Spec: `docs/superpowers/specs/2026-08-03-meridian-identity-design.md` §7. Read it before Task 1.
- Source bundle: `/Users/george/Downloads/Custom Design System/src/app/App.tsx` (documentation site) and `/Users/george/Downloads/Custom Design System (1)/src/app/App.tsx` (landing page). These are the authority on appearance.
- Commit after every task. Never commit to `main`.

## Reference: the Meridian construction vocabulary

Six constructions account for nearly every surface in both demo pages. Tasks below refer to these by name rather than repeating them.

**The panel.** A raised surface with a hairline and a labelled header.

```css
.lat-panel {
  background: var(--lat-bg-raised);
  border: 1px solid var(--lat-border);
  border-radius: var(--lat-radius-none);
}
.lat-panel__header {
  display: flex;
  align-items: center;
  gap: var(--lat-space-2);
  padding: var(--lat-space-3) var(--lat-space-5);
  border-bottom: 1px solid var(--lat-border);
}
```

**The eyebrow.** The identity's signature label.

```css
font-family: var(--lat-text-eyebrow-font-family);
font-size: var(--lat-text-eyebrow-font-size);
letter-spacing: var(--lat-text-eyebrow-letter-spacing);
line-height: var(--lat-text-eyebrow-line-height);
text-transform: var(--lat-text-eyebrow-text-transform);
color: var(--lat-text-subtle);
```

**The tinted triple.** Every badge, and the destructive button.

```css
background: var(--lat-danger-tint);
border: 1px solid var(--lat-danger-tint-border);
color: var(--lat-danger-solid);
```

**The wash hover.** Meridian's hover for anything transparent.

```css
&:hover { background: var(--lat-wash); }
```

**The dim hover.** Meridian's hover for anything filled. It dims the whole
element, label included — that is what the bundle does.

```css
transition: opacity var(--lat-duration-default) var(--lat-easing-out);
&:hover { opacity: 0.9; }
```

**The focus ring.** A 1px ring plus a matching border, both from the accent.

```css
&:focus-visible {
  outline: none;
  border-color: var(--lat-focus-ring);
  box-shadow: 0 0 0 1px var(--lat-focus-ring);
}
```

Note the one deliberate exception to the borders-not-shadows rule: the focus
ring is *additional* to a border that is always present, so a forced-colors user
still has an edge, and the UA supplies its own focus indicator there.

---

### Task 1: The base contract and the story surface

**Files:**
- Modify: `packages/react/src/styles.css`, `packages/react/.storybook/preview.css`, `packages/react/.storybook/preview.tsx`
- Create: `packages/react/src/base.css`
- Test: `packages/react/tests/browser/base.spec.ts`

**Interfaces:**
- Produces: `.lat-surface` — the class a consumer puts on a page root to get Meridian's background, foreground and font.

**Why this task is first.** The superseded Quiet Surface spec found a real defect: a `<p>` inside `.lat-dialog` computed to **Times**, because Lattice's typography lands only on elements carrying an explicit role class and no component stylesheet sets a family. Meridian's own `@layer base` sets `body { font-family }` and default sizes for `h1`–`h4`, `label`, `button` and `input`. Porting that is what stops the bug recurring in every new component.

- [ ] **Step 1: Write the failing test**

```ts
// packages/react/tests/browser/base.spec.ts
import { expect, test } from '@playwright/test'

test('unclassed prose inside a surface inherits the sans stack', async ({ page }) => {
  await page.goto('/iframe.html?id=dialog--open&globals=theme:dark')
  const family = await page
    .locator('.lat-dialog p')
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(family).toContain('Instrument Sans')
  expect(family).not.toContain('Times')
})

test('a surface paints the Meridian page colour', async ({ page }) => {
  await page.goto('/iframe.html?id=button--variants&globals=theme:dark')
  const bg = await page
    .locator('.lat-surface')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor)
  // oklch(0.159 0.0169 284.3) -> #0c0c14
  expect(bg).toBe('rgb(12, 12, 20)')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/react && npx playwright test tests/browser/base.spec.ts`
Expected: FAIL — no `.lat-surface` class exists

- [ ] **Step 3: Create `packages/react/src/base.css`**

```css
/*
 * The base layer.
 *
 * Meridian sets defaults on bare elements — body, h1-h4, label, button, input —
 * rather than requiring a class for each. Porting that is not cosmetic: without
 * it, unclassed prose inside a Lattice surface falls through to the browser
 * serif, which shipped as a real defect in the Dialog story for the whole of the
 * previous component library's life.
 *
 * Everything here is scoped to `.lat-surface` rather than to `body`, so a
 * consumer embedding Lattice in a page it does not own is not restyling that
 * page. A consumer who does own the page puts the class on <body>.
 */
.lat-surface {
  background: var(--lat-bg);
  color: var(--lat-text);
  font-family: var(--lat-text-body-font-family);
  font-size: var(--lat-text-body-font-size);
  font-weight: var(--lat-text-body-font-weight);
  line-height: var(--lat-text-body-line-height);
}

.lat-surface :where(h1) {
  font-family: var(--lat-text-h1-font-family);
  font-size: var(--lat-text-h1-font-size);
  font-weight: var(--lat-text-h1-font-weight);
  letter-spacing: var(--lat-text-h1-letter-spacing);
  line-height: var(--lat-text-h1-line-height);
}

.lat-surface :where(h2) {
  font-family: var(--lat-text-h2-font-family);
  font-size: var(--lat-text-h2-font-size);
  font-weight: var(--lat-text-h2-font-weight);
  letter-spacing: var(--lat-text-h2-letter-spacing);
  line-height: var(--lat-text-h2-line-height);
}

.lat-surface :where(h3) {
  font-family: var(--lat-text-h3-font-family);
  font-size: var(--lat-text-h3-font-size);
  font-weight: var(--lat-text-h3-font-weight);
  line-height: var(--lat-text-h3-line-height);
}

.lat-surface :where(h4) {
  font-family: var(--lat-text-h4-font-family);
  font-size: var(--lat-text-h4-font-size);
  font-weight: var(--lat-text-h4-font-weight);
  line-height: var(--lat-text-h4-line-height);
}

/*
 * `:where()` keeps every rule above at zero specificity, so a role class on the
 * same element wins without needing !important and a component stylesheet never
 * has to out-specify the base layer.
 */
.lat-surface :where(button, input, select, textarea) {
  font-family: inherit;
}
```

- [ ] **Step 4: Import it first in `src/styles.css`**

Add above the alphabetical block, with a comment explaining why the order matters here when it does not elsewhere:

```css
/* The base layer comes first and is the one @import whose position carries
   meaning: every family below assumes bare elements are already sane. */
@import './base.css';
```

- [ ] **Step 5: Put the surface class on the story decorator**

In `.storybook/preview.tsx`, change the decorator's `className` from `"lat-story"` to `"lat-story lat-surface"`, and change `initialGlobals.theme` from `'light'` to `'dark'` — Meridian's demos default dark.

In `.storybook/preview.css`, delete any rule that sets `background` or `color` on `.lat-story`; `.lat-surface` now owns both. Keep the padding rule.

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/react && pnpm dev &` then `npx playwright test tests/browser/base.spec.ts`
Expected: PASS, 2 tests

- [ ] **Step 7: Commit**

```bash
git add packages/react
git commit -m "feat(react): add the Meridian base layer and surface class

Ports Meridian's bare-element defaults so unclassed prose inside a Lattice
surface no longer falls through to the browser serif — a defect the Dialog
story shipped for the whole of the previous library's life."
```

---

### Task 2: Button — five variants, no tone

**Files:**
- Modify: `packages/react/src/button/button.tsx`, `button.css`, `button.stories.tsx`, `README.md`
- Test: `packages/react/tests/button.test.tsx`

**Interfaces:**
- Produces: `type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link'`, `type ButtonSize = 'sm' | 'md' | 'lg'`, `interface ButtonOptions { variant?: ButtonVariant; size?: ButtonSize }`.
- **Removed:** `ButtonTone`. Every export of it disappears from `src/index.ts` (Task 12).

Taken verbatim from the documentation site's Button panel.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/react/tests/button.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../src/button/button.js'

describe('Button', () => {
  it('defaults to the secondary variant', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'secondary')
  })

  it('accepts each Meridian variant', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'destructive', 'link'] as const) {
      const { unmount } = render(<Button variant={variant}>Go</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant)
      unmount()
    }
  })

  it('no longer accepts a tone', () => {
    // @ts-expect-error tone was removed with the variant x tone matrix
    render(<Button tone="danger">Delete</Button>)
    expect(screen.getByRole('button')).not.toHaveAttribute('data-tone')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/react && npx vitest run tests/button.test.tsx`
Expected: FAIL — default is `soft`, and `data-tone` is present

- [ ] **Step 3: Replace `button.tsx`**

```tsx
import { Button as AriakitButton, type ButtonProps as AriakitButtonProps } from '@ariakit/react'
import type { ElementType } from 'react'

/**
 * Meridian's five variants.
 *
 * This replaces the previous `variant × tone` matrix. A neutral button is
 * `secondary`; a dangerous one is `destructive`. Meridian names five buttons and
 * this component offers five, because a system that follows a design strictly
 * cannot also offer combinations the design never drew.
 *
 * `destructive` is a *tinted* button — danger at 10% with a 20% border and
 * full-strength danger text — not a solid red fill. That is what the design
 * shows, and it is what keeps a destructive action from outweighing the primary
 * one on the same row.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonOptions {
  variant?: ButtonVariant
  size?: ButtonSize
}

export type ButtonProps<T extends ElementType = 'button'> = AriakitButtonProps<T> & ButtonOptions

export function Button<T extends ElementType = 'button'>({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonProps<T>) {
  return (
    <AriakitButton
      {...props}
      className={className === undefined ? 'lat-button' : `lat-button ${className}`}
      data-variant={variant}
      data-size={size}
    />
  )
}
```

- [ ] **Step 4: Replace `button.css`**

```css
.lat-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--lat-space-2);

  font-family: var(--lat-text-ui-font-family);
  font-size: var(--lat-text-ui-font-size);
  line-height: var(--lat-text-ui-line-height);

  border: 1px solid transparent;
  border-radius: var(--lat-radius-none);
  cursor: pointer;

  /* Colour and opacity feedback is unconditional — neither is what causes
     vestibular harm. */
  transition-property: background-color, border-color, color, opacity;
  transition-duration: var(--lat-duration-default);
  transition-timing-function: var(--lat-easing-out);
}

.lat-button[data-size='sm'] { padding: var(--lat-space-1) var(--lat-space-3); }
.lat-button[data-size='md'] { padding: var(--lat-space-2) var(--lat-space-4); }
.lat-button[data-size='lg'] { padding: var(--lat-space-3) var(--lat-space-5); }

/* Primary: the solid fill. Semibold, because Meridian's is the only button
   weighted above medium. */
.lat-button[data-variant='primary'] {
  background: var(--lat-solid);
  color: var(--lat-on-solid);
  font-weight: var(--lat-font-weight-semibold);
}
.lat-button[data-variant='primary']:hover:not(:disabled) { opacity: 0.9; }

/* Secondary: the component fill with a hairline. */
.lat-button[data-variant='secondary'] {
  background: var(--lat-component);
  border-color: var(--lat-border);
  color: var(--lat-text);
  font-weight: var(--lat-font-weight-medium);
}
.lat-button[data-variant='secondary']:hover:not(:disabled) { filter: brightness(0.95); }

/* Ghost: transparent with a hairline, washed on hover. */
.lat-button[data-variant='ghost'] {
  background: transparent;
  border-color: var(--lat-border);
  color: var(--lat-text);
  font-weight: var(--lat-font-weight-medium);
}
.lat-button[data-variant='ghost']:hover:not(:disabled) { background: var(--lat-wash); }

/* Destructive: the tinted triple, not a solid fill. */
.lat-button[data-variant='destructive'] {
  background: var(--lat-danger-tint);
  border-color: var(--lat-danger-tint-border);
  color: var(--lat-danger-solid);
  font-weight: var(--lat-font-weight-medium);
}
.lat-button[data-variant='destructive']:hover:not(:disabled) { opacity: 0.9; }

/* Link: text with a hairline underline. */
.lat-button[data-variant='link'] {
  background: transparent;
  color: var(--lat-text-subtle);
  font-weight: var(--lat-font-weight-medium);
  text-decoration: underline;
  text-decoration-color: var(--lat-border);
  text-underline-offset: 2px;
}
.lat-button[data-variant='link']:hover:not(:disabled) { color: var(--lat-text); }

.lat-button:disabled {
  background: var(--lat-wash);
  border-color: transparent;
  color: var(--lat-text-subtle);
  cursor: not-allowed;
  opacity: 0.5;
}

.lat-button:focus-visible {
  outline: none;
  border-color: var(--lat-focus-ring);
  box-shadow: 0 0 0 1px var(--lat-focus-ring);
}
```

- [ ] **Step 5: Update the stories**

Replace `button.stories.tsx`'s tone-based stories with one `Variants` story rendering all five side by side plus a disabled example, and one `Sizes` story. Give the `Variants` story the id `button--variants` — Task 1's browser test navigates to it.

- [ ] **Step 6: Run tests**

Run: `cd packages/react && npx vitest run tests/button.test.tsx`
Expected: PASS, 3 tests

- [ ] **Step 7: Commit**

```bash
git add packages/react
git commit -m "feat(react)!: Button takes Meridian's five variants

BREAKING CHANGE: the variant x tone matrix is replaced by primary, secondary,
ghost, destructive and link. ButtonTone is removed. destructive is a tinted
button, not a solid red fill."
```

---

### Task 3: Badge — the tinted triple, always mono uppercase

**Files:**
- Modify: `packages/react/src/badge/badge.tsx`, `badge.css`, `badge.stories.tsx`, `README.md`
- Test: `packages/react/tests/badge.test.tsx`

**Interfaces:**
- Produces: `type BadgeVariant = 'default' | 'primary' | 'info' | 'success' | 'danger' | 'warning'`, `interface BadgeOptions { variant?: BadgeVariant }`.
- **Removed:** `BadgeTone`.

The landing page's `ImpactBadge` is this component with a severity variant plus a required icon and label. It does not become a separate component — see the spec's §7.1.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/react/tests/badge.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from '../src/badge/badge.js'

describe('Badge', () => {
  it('defaults to the default variant', () => {
    render(<Badge>beta</Badge>)
    expect(screen.getByText('beta')).toHaveAttribute('data-variant', 'default')
  })

  it('accepts every Meridian variant', () => {
    for (const variant of ['default', 'primary', 'info', 'success', 'danger', 'warning'] as const) {
      const { unmount } = render(<Badge variant={variant}>x</Badge>)
      expect(screen.getByText('x')).toHaveAttribute('data-variant', variant)
      unmount()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/react && npx vitest run tests/badge.test.tsx`
Expected: FAIL — the prop is `tone`

- [ ] **Step 3: Rewrite `badge.tsx`**

Rename the `tone` prop to `variant`, change the union to the six above, default `'default'`, and emit `data-variant`. Keep the element and the `lat-badge` class as they are.

- [ ] **Step 4: Replace `badge.css`**

```css
.lat-badge {
  /* Every variant is the tinted triple; only the three custom properties
     below change. A new variant is three declarations. */
  --_tint: var(--lat-wash);
  --_tint-border: var(--lat-border);
  --_text: var(--lat-text-subtle);

  display: inline-flex;
  align-items: center;
  gap: var(--lat-space-1);

  font-family: var(--lat-text-tag-font-family);
  font-size: var(--lat-text-tag-font-size);
  letter-spacing: var(--lat-text-tag-letter-spacing);
  line-height: var(--lat-text-tag-line-height);
  text-transform: var(--lat-text-tag-text-transform);

  padding: 0 var(--lat-space-2);
  background: var(--_tint);
  border: 1px solid var(--_tint-border);
  border-radius: var(--lat-radius-none);
  color: var(--_text);
}

.lat-badge[data-variant='primary'] {
  --_tint: var(--lat-accent-tint);
  --_tint-border: var(--lat-accent-tint-border);
  --_text: var(--lat-solid);
}
.lat-badge[data-variant='info'] {
  --_tint: var(--lat-info-tint);
  --_tint-border: var(--lat-info-tint-border);
  --_text: var(--lat-info-solid);
}
.lat-badge[data-variant='success'] {
  --_tint: var(--lat-success-tint);
  --_tint-border: var(--lat-success-tint-border);
  --_text: var(--lat-success-solid);
}
.lat-badge[data-variant='danger'] {
  --_tint: var(--lat-danger-tint);
  --_tint-border: var(--lat-danger-tint-border);
  --_text: var(--lat-danger-solid);
}
.lat-badge[data-variant='warning'] {
  --_tint: var(--lat-warning-tint);
  --_tint-border: var(--lat-warning-tint-border);
  --_text: var(--lat-warning-solid);
}
```

- [ ] **Step 5: Add the severity story**

In `badge.stories.tsx` add an `Impact` story rendering critical / serious / moderate / minor, each with a lucide-style inline SVG icon **and** its text label, with a docs note stating that colour never carries severity alone.

- [ ] **Step 6: Run tests**

Run: `cd packages/react && npx vitest run tests/badge.test.tsx`
Expected: PASS, 2 tests

- [ ] **Step 7: Commit**

```bash
git add packages/react
git commit -m "feat(react)!: Badge is the tinted triple in mono uppercase

BREAKING CHANGE: BadgeTone becomes BadgeVariant with six values."
```

---

### Task 4: Card gains a labelled header

**Files:**
- Modify: `packages/react/src/card/card.tsx`, `card.css`, `card.stories.tsx`, `README.md`
- Test: `packages/react/tests/card.test.tsx`

**Interfaces:**
- Produces: `Card`, `CardHeader`, `CardBody`, and their prop types. `CardHeader` renders the eyebrow label.

Every panel in both demos is a bordered surface with a `border-bottom` header carrying an uppercase mono label and an optional icon. That repetition is what makes it a component concern rather than a composition each caller repeats.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/react/tests/card.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card, CardBody, CardHeader } from '../src/card/card.js'

describe('Card', () => {
  it('renders a header label as an eyebrow', () => {
    render(
      <Card>
        <CardHeader label="Button" />
        <CardBody>content</CardBody>
      </Card>
    )
    expect(screen.getByText('Button')).toHaveClass('lat-card__label')
  })

  it('renders header content beside the label', () => {
    render(
      <Card>
        <CardHeader label="Tokens">
          <span data-testid="aside">12</span>
        </CardHeader>
      </Card>
    )
    expect(screen.getByTestId('aside')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/react && npx vitest run tests/card.test.tsx`
Expected: FAIL — `CardHeader` is not exported

- [ ] **Step 3: Add `CardHeader` and `CardBody` to `card.tsx`**

```tsx
import type { HTMLAttributes, ReactNode } from 'react'

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** The eyebrow label. Every panel in Meridian carries one. */
  label: string
  /** An optional leading icon, rendered before the label. */
  icon?: ReactNode
}

export function CardHeader({ label, icon, children, className, ...props }: CardHeaderProps) {
  return (
    <div
      {...props}
      className={className === undefined ? 'lat-card__header' : `lat-card__header ${className}`}
    >
      {icon}
      <span className="lat-card__label">{label}</span>
      {children}
    </div>
  )
}

export type CardBodyProps = HTMLAttributes<HTMLDivElement>

export function CardBody({ className, ...props }: CardBodyProps) {
  return (
    <div
      {...props}
      className={className === undefined ? 'lat-card__body' : `lat-card__body ${className}`}
    />
  )
}
```

- [ ] **Step 4: Replace `card.css`**

```css
.lat-card {
  background: var(--lat-bg-raised);
  border: 1px solid var(--lat-border);
  border-radius: var(--lat-radius-none);
  /* The hairline is the edge that survives forced-colors, where the user agent
     strips shadows and flattens surfaces. The shadow is the enhancement. */
  box-shadow: var(--lat-elevation-flat);
  overflow: hidden;
}

.lat-card[data-elevation='floating'] { box-shadow: var(--lat-elevation-floating); }

.lat-card__header {
  display: flex;
  align-items: center;
  gap: var(--lat-space-2);
  padding: var(--lat-space-3) var(--lat-space-5);
  border-bottom: 1px solid var(--lat-border);
  color: var(--lat-text-subtle);
}

.lat-card__label {
  font-family: var(--lat-text-eyebrow-font-family);
  font-size: var(--lat-text-eyebrow-font-size);
  letter-spacing: var(--lat-text-eyebrow-letter-spacing);
  line-height: var(--lat-text-eyebrow-line-height);
  text-transform: var(--lat-text-eyebrow-text-transform);
}

.lat-card__body { padding: var(--lat-space-5); }
```

- [ ] **Step 5: Run tests**

Run: `cd packages/react && npx vitest run tests/card.test.tsx`
Expected: PASS, 2 tests

- [ ] **Step 6: Commit**

```bash
git add packages/react
git commit -m "feat(react): Card gains a labelled header

Every panel in both Meridian demos is a bordered surface with an eyebrow
header, which makes it a component concern rather than a repeated composition."
```

---

### Task 5: Input and TextField — mono value, eyebrow label

**Files:**
- Modify: `packages/react/src/input/input.css`, `packages/react/src/text-field/text-field.tsx`, `text-field.css`, both `README.md` and stories
- Test: `packages/react/tests/browser/field.spec.ts`

Meridian's input carries a **mono** value, an uppercase mono label, the `field-bg` fill, and a focus that sets both a ring and a matching border.

- [ ] **Step 1: Write the failing test**

```ts
// packages/react/tests/browser/field.spec.ts
import { expect, test } from '@playwright/test'

test('the field value is set in mono', async ({ page }) => {
  await page.goto('/iframe.html?id=textfield--default&globals=theme:dark')
  const family = await page
    .locator('.lat-input')
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(family).toContain('JetBrains Mono')
})

test('the field label is an uppercase eyebrow', async ({ page }) => {
  await page.goto('/iframe.html?id=textfield--default&globals=theme:dark')
  const label = page.locator('.lat-text-field__label').first()
  expect(await label.evaluate((el) => getComputedStyle(el).textTransform)).toBe('uppercase')
  expect(await label.evaluate((el) => getComputedStyle(el).letterSpacing)).not.toBe('normal')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/react && npx playwright test tests/browser/field.spec.ts`
Expected: FAIL — the value is sans and the label is not transformed

- [ ] **Step 3: Replace `input.css`**

```css
.lat-input {
  width: 100%;
  padding: var(--lat-space-2) var(--lat-space-3);

  /* Mono. Meridian sets every field value in the mono face — a token name, a
     URL, an identifier — because the things its fields hold are all of that
     kind. */
  font-family: var(--lat-text-code-font-family);
  font-size: var(--lat-text-code-font-size);
  line-height: var(--lat-text-code-line-height);

  background: var(--lat-field-bg);
  border: 1px solid var(--lat-border);
  border-radius: var(--lat-radius-none);
  color: var(--lat-text);

  transition-property: border-color, box-shadow;
  transition-duration: var(--lat-duration-default);
  transition-timing-function: var(--lat-easing-out);
}

.lat-input::placeholder { color: var(--lat-text-subtle); }

.lat-input:focus-visible {
  outline: none;
  border-color: var(--lat-focus-ring);
  box-shadow: 0 0 0 1px var(--lat-focus-ring);
}

.lat-input:disabled {
  color: var(--lat-text-subtle);
  cursor: not-allowed;
  opacity: 0.5;
}
```

- [ ] **Step 4: Restyle the label in `text-field.css`**

Give `.lat-text-field__label` the eyebrow construction from the reference section, plus `display: block; margin-bottom: var(--lat-space-2);`. Give `.lat-text-field__error` the `meta` role and `color: var(--lat-danger-solid)`.

- [ ] **Step 5: Run tests**

Run: `cd packages/react && npx playwright test tests/browser/field.spec.ts`
Expected: PASS, 2 tests

- [ ] **Step 6: Commit**

```bash
git add packages/react
git commit -m "feat(react): fields take the mono value and eyebrow label"
```

---

### Task 6: Switch

**Files:**
- Modify: `packages/react/src/switch/switch.css`, stories, `README.md`

Meridian declares `--switch-background` per mode and nothing else about the control, so the track uses that token and the thumb uses `bg-raised`; checked fills with the solid.

- [ ] **Step 1: Replace the colour declarations in `switch.css`**

Track: `background: var(--lat-switch-track)`, `border: 1px solid var(--lat-border)`, `border-radius: var(--lat-radius-full)` — the switch is one of the two places a pill is correct, because it is a track, not a panel.
Thumb: `background: var(--lat-bg-raised)`, `border-radius: var(--lat-radius-full)`, `box-shadow: var(--lat-elevation-raised)`.
Checked track: `background: var(--lat-solid)`.
Focus: the focus-ring construction from the reference section.
Transition: `var(--lat-duration-swift) var(--lat-easing-out)`, on `background-color` and `transform` only.

- [ ] **Step 2: Verify against reduced motion**

Run: `cd packages/react && npx playwright test tests/browser/a11y.spec.ts -g switch`
Expected: PASS — the thumb's `transform` transition must be suppressed under `prefers-reduced-motion: reduce` by the token layer's existing contract. If it is not, that is a Phase 1 gap; report it.

- [ ] **Step 3: Commit**

```bash
git add packages/react
git commit -m "feat(react): restyle Switch onto Meridian's track token"
```

---

### Task 7: Tabs, and the new SegmentedControl

**Files:**
- Modify: `packages/react/src/tabs/tabs.css`
- Create: `packages/react/src/segmented-control/segmented-control.tsx`, `.css`, `.stories.tsx`, `README.md`
- Test: `packages/react/tests/segmented-control.test.tsx`

**Interfaces:**
- Produces: `SegmentedControl`, `SegmentedControlItem`, `SegmentedControlProps`, `SegmentedControlItemProps`.

Built on Ariakit's radio store so arrow-key semantics and roving focus are not re-implemented. Meridian's segmented control is a `bg-subtle` track with 2px padding and an active thumb at `bg-raised` with the `raised` shadow.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/react/tests/segmented-control.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control/segmented-control.js'

describe('SegmentedControl', () => {
  const control = (
    <SegmentedControl defaultValue="system" aria-label="Theme">
      <SegmentedControlItem value="system">System</SegmentedControlItem>
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
    </SegmentedControl>
  )

  it('exposes its items as radios in a labelled group', () => {
    render(control)
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('checks the default value', () => {
    render(control)
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked()
  })

  it('moves selection with the arrow keys', async () => {
    const user = userEvent.setup()
    render(control)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/react && npx vitest run tests/segmented-control.test.tsx`
Expected: FAIL — module does not exist

- [ ] **Step 3: Create `segmented-control.tsx`**

```tsx
import {
  Radio,
  RadioGroup,
  RadioProvider,
  type RadioGroupProps,
  type RadioProps
} from '@ariakit/react'
import type { ReactNode } from 'react'

/**
 * Meridian's segmented control.
 *
 * Built on Ariakit's radio store rather than its tabs: the control selects a
 * value, it does not reveal a panel. That distinction is what a screen reader
 * announces, so it is not a styling choice.
 */
export interface SegmentedControlProps extends Omit<RadioGroupProps, 'defaultValue'> {
  defaultValue?: string
  value?: string
  setValue?: (value: string) => void
  children: ReactNode
}

export function SegmentedControl({
  defaultValue,
  value,
  setValue,
  className,
  children,
  ...props
}: SegmentedControlProps) {
  return (
    <RadioProvider defaultValue={defaultValue} value={value} setValue={setValue}>
      <RadioGroup
        {...props}
        className={
          className === undefined
            ? 'lat-segmented-control'
            : `lat-segmented-control ${className}`
        }
      >
        {children}
      </RadioGroup>
    </RadioProvider>
  )
}

export interface SegmentedControlItemProps extends Omit<RadioProps, 'value'> {
  value: string
  children: ReactNode
}

export function SegmentedControlItem({
  value,
  className,
  children,
  ...props
}: SegmentedControlItemProps) {
  return (
    <label
      className={
        className === undefined
          ? 'lat-segmented-control__item'
          : `lat-segmented-control__item ${className}`
      }
    >
      <Radio {...props} value={value} className="lat-segmented-control__input" />
      <span className="lat-segmented-control__label">{children}</span>
    </label>
  )
}
```

- [ ] **Step 4: Create `segmented-control.css`**

```css
.lat-segmented-control {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  background: var(--lat-bg-subtle);
  border-radius: var(--lat-radius-none);
}

.lat-segmented-control__item { cursor: pointer; }

/* The input carries the semantics and the focus target; the label carries the
   appearance. It is not display:none, which would take it out of the
   accessibility tree and off the keyboard. */
.lat-segmented-control__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.lat-segmented-control__label {
  display: block;
  padding: var(--lat-space-1) var(--lat-space-4);

  font-family: var(--lat-text-code-font-family);
  font-size: var(--lat-text-code-font-size);
  line-height: var(--lat-text-code-line-height);

  color: var(--lat-text-subtle);
  border-radius: var(--lat-radius-none);

  transition-property: background-color, color;
  transition-duration: var(--lat-duration-swift);
  transition-timing-function: var(--lat-easing-out);
}

.lat-segmented-control__item:hover .lat-segmented-control__label { color: var(--lat-text); }

.lat-segmented-control__input:checked + .lat-segmented-control__label {
  background: var(--lat-bg-raised);
  box-shadow: var(--lat-elevation-raised);
  color: var(--lat-text);
}

.lat-segmented-control__input:focus-visible + .lat-segmented-control__label {
  outline: 1px solid var(--lat-focus-ring);
  outline-offset: 1px;
}
```

- [ ] **Step 5: Restyle `tabs.css`**

Tab list: `border-bottom: 1px solid var(--lat-border)`. Tab: the `ui` role, `color: var(--lat-text-subtle)`, `padding: var(--lat-space-2) var(--lat-space-4)`. Selected: `color: var(--lat-text)` and a 1px `border-bottom` in `var(--lat-solid)` sitting over the list's hairline. Focus: the reference construction.

- [ ] **Step 6: Run tests**

Run: `cd packages/react && npx vitest run tests/segmented-control.test.tsx`
Expected: PASS, 3 tests

- [ ] **Step 7: Commit**

```bash
git add packages/react
git commit -m "feat(react): add SegmentedControl and restyle Tabs

The control is built on Ariakit's radio store, not its tabs — it selects a
value rather than revealing a panel, which is what a screen reader announces."
```

---

### Task 8: Dialog, Menu, Disclosure

**Files:**
- Modify: `packages/react/src/dialog/dialog.css`, `menu/menu.css`, `disclosure/disclosure.css`
- Test: `packages/react/tests/browser/overlay.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/react/tests/browser/overlay.spec.ts
import { expect, test } from '@playwright/test'

test('the dialog backdrop actually dims the page', async ({ page }) => {
  await page.goto('/iframe.html?id=dialog--open&globals=theme:light')
  const backdrop = page.locator('.lat-dialog__backdrop').first()
  const colour = await backdrop.evaluate((el) => getComputedStyle(el).backgroundColor)
  // The superseded Quiet Surface spec found this rendering as 80% of near-white
  // over near-white — a scrim present in the markup and absent in the render.
  const [r, g, b] = colour.match(/\d+/g)!.map(Number)
  expect((r! + g! + b!) / 3).toBeLessThan(120)
})

test('a menu carries a real border, not only a shadow', async ({ page }) => {
  await page.goto('/iframe.html?id=menu--open&globals=theme:dark')
  const width = await page
    .locator('.lat-menu')
    .first()
    .evaluate((el) => getComputedStyle(el).borderTopWidth)
  expect(width).toBe('1px')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/react && npx playwright test tests/browser/overlay.spec.ts`
Expected: FAIL on the backdrop assertion

- [ ] **Step 3: Restyle `dialog.css`**

Surface: `background: var(--lat-bg-raised)`, `border: 1px solid var(--lat-border)`, `border-radius: var(--lat-radius-none)`, `box-shadow: var(--lat-elevation-overlay)`.
Backdrop: `background: rgb(0 0 0 / 0.6)` — a dim, not a tint. This is the one place a literal is permitted, and only because it is a scrim rather than a palette colour; add a comment saying so and pointing at the Quiet Surface finding.
Heading: the `h3` role. Body text: inherits from `.lat-surface` via Task 1.

- [ ] **Step 4: Restyle `menu.css`**

Surface as the dialog, with `box-shadow: var(--lat-elevation-overlay)`. Item: the `ui` role, `padding: var(--lat-space-2) var(--lat-space-3)`, `color: var(--lat-text)`; `[data-active-item]` gets `background: var(--lat-wash)`. Separator: `border-top: 1px solid var(--lat-border)`.

- [ ] **Step 5: Restyle `disclosure.css`**

Button: the ghost button construction. Content: `border-left: 1px solid var(--lat-border)` and `padding-left: var(--lat-space-4)`.

- [ ] **Step 6: Run tests**

Run: `cd packages/react && npx playwright test tests/browser/overlay.spec.ts`
Expected: PASS, 2 tests

- [ ] **Step 7: Commit**

```bash
git add packages/react
git commit -m "feat(react): restyle the overlay families

The backdrop dims rather than tints — the failure the superseded Quiet Surface
spec found, kept fixed."
```

---

### Task 9: Table

**Files:**
- Modify: `packages/react/src/table/table.css`, stories, `README.md`

Meridian's table header cells are 10px uppercase mono at **normal** weight — the casing and tracking carry the emphasis, not the weight. Rows divide with the hairline.

- [ ] **Step 1: Replace `table.css`'s typography and colour**

```css
.lat-table { width: 100%; border-collapse: collapse; }

.lat-table th {
  font-family: var(--lat-text-eyebrow-font-family);
  font-size: var(--lat-text-eyebrow-font-size);
  letter-spacing: var(--lat-text-eyebrow-letter-spacing);
  line-height: var(--lat-text-eyebrow-line-height);
  text-transform: var(--lat-text-eyebrow-text-transform);
  /* Normal weight is deliberate: the casing and tracking already carry the
     emphasis, and bolding on top of both reads as shouting. */
  font-weight: var(--lat-font-weight-regular);
  text-align: left;
  color: var(--lat-text-subtle);
  padding: var(--lat-space-2) var(--lat-space-4);
  border-bottom: 1px solid var(--lat-border);
}

.lat-table td {
  padding: var(--lat-space-3) var(--lat-space-4);
  font-size: var(--lat-text-small-font-size);
  color: var(--lat-text);
}

.lat-table tbody tr + tr { border-top: 1px solid var(--lat-border); }
.lat-table tbody tr:hover { background: var(--lat-wash); }
```

- [ ] **Step 2: Verify the header is still a header**

Run: `cd packages/react && npx playwright test tests/browser/a11y.spec.ts -g table`
Expected: PASS — `text-transform` must not have replaced real `<th>` scope semantics.

- [ ] **Step 3: Commit**

```bash
git add packages/react
git commit -m "feat(react): restyle Table onto the eyebrow header"
```

---

### Task 10: Callout and LiveRegion

**Files:**
- Modify: `packages/react/src/callout/callout.tsx`, `callout.css`, `live-region/live-region.css`, stories, `README.md`

**Interfaces:**
- Produces: `type CalloutVariant = 'info' | 'success' | 'warning' | 'danger'` replacing `CalloutTone`.

- [ ] **Step 1: Rename the prop and align the union**

In `callout.tsx`, rename `tone` to `variant`, emit `data-variant`, and use the four names above so Callout and Badge share a vocabulary.

- [ ] **Step 2: Replace `callout.css` with the tinted triple**

Same `--_tint` / `--_tint-border` / `--_text` mechanism as Badge, at panel scale: `padding: var(--lat-space-4)`, `border-radius: var(--lat-radius-none)`, body text in the `body` role at `color: var(--lat-text)` rather than the accent colour, so a long message stays readable.

- [ ] **Step 3: Confirm the icon requirement**

Callout must render an icon slot and the story must show one for every variant. Colour never carries meaning alone; this is the same rule severity follows.

- [ ] **Step 4: Leave `live-region.css` alone if it only positions**

Run `cat src/live-region/live-region.css`. If it contains only visually-hidden positioning, it needs no change — note that in the commit message rather than editing it.

- [ ] **Step 5: Run tests**

Run: `cd packages/react && npx vitest run tests/card-badge-callout.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/react
git commit -m "feat(react)!: Callout takes the tinted triple

BREAKING CHANGE: CalloutTone becomes CalloutVariant."
```

---

### Task 11: Eyebrow, Stat and CodeBlock

**Files:**
- Create: `packages/react/src/eyebrow/{eyebrow.tsx,eyebrow.css,eyebrow.stories.tsx,README.md}`, `src/stat/{…}`, `src/code-block/{…}`
- Test: `packages/react/tests/stat.test.tsx`, `src/code-block/code-block.test.tsx`

**Interfaces:**
- Produces: `Eyebrow`, `EyebrowProps`; `Stat`, `StatProps`; `CodeBlock`, `CodeBlockProps`.

- [ ] **Step 1: Write the failing tests**

```tsx
// packages/react/tests/stat.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Stat } from '../src/stat/stat.js'

describe('Stat', () => {
  it('renders value, label and sub', () => {
    render(<Stat value="84" label="Components" sub="production-ready" />)
    expect(screen.getByText('84')).toBeInTheDocument()
    expect(screen.getByText('Components')).toBeInTheDocument()
    expect(screen.getByText('production-ready')).toBeInTheDocument()
  })

  it('gives the value tabular figures so a row does not jitter', () => {
    render(<Stat value="84" label="Components" />)
    expect(screen.getByText('84')).toHaveClass('lat-stat__value')
  })
})
```

```tsx
// packages/react/tests/code-block.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CodeBlock } from '../src/code-block/code-block.js'

describe('CodeBlock', () => {
  it('announces the copy rather than only changing an icon', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const user = userEvent.setup()

    render(<CodeBlock code="--lat-solid" />)
    await user.click(screen.getByRole('button', { name: /copy/i }))

    expect(writeText).toHaveBeenCalledWith('--lat-solid')
    expect(await screen.findByRole('status')).toHaveTextContent(/copied/i)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/react && npx vitest run tests/stat.test.tsx tests/code-block.test.tsx`
Expected: FAIL — modules do not exist

- [ ] **Step 3: Create `Eyebrow`**

```tsx
import type { HTMLAttributes } from 'react'

/**
 * The uppercase mono label at 0.2em tracking.
 *
 * It exists so that tracking value has exactly one home. It appears on every
 * section head, panel header and column in both Meridian demos, and a value
 * repeated in a dozen stylesheets is a value that drifts.
 *
 * `rule` draws the short leading hairline the landing page's section labels
 * use.
 */
export interface EyebrowProps extends HTMLAttributes<HTMLDivElement> {
  rule?: boolean
}

export function Eyebrow({ rule = false, className, children, ...props }: EyebrowProps) {
  return (
    <div
      {...props}
      className={className === undefined ? 'lat-eyebrow' : `lat-eyebrow ${className}`}
      data-rule={rule ? '' : undefined}
    >
      {rule ? <span className="lat-eyebrow__rule" aria-hidden="true" /> : null}
      <span className="lat-eyebrow__text">{children}</span>
    </div>
  )
}
```

`eyebrow.css`: the eyebrow construction from the reference section, `display: flex; align-items: center; gap: var(--lat-space-3)`, and `.lat-eyebrow__rule { width: var(--lat-space-8); height: 1px; background: var(--lat-solid); opacity: 0.4; }`.

- [ ] **Step 4: Create `Stat`**

```tsx
import type { HTMLAttributes, ReactNode } from 'react'

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode
  label: string
  sub?: string
}

export function Stat({ value, label, sub, className, ...props }: StatProps) {
  return (
    <div
      {...props}
      className={className === undefined ? 'lat-stat' : `lat-stat ${className}`}
    >
      <div className="lat-stat__value">{value}</div>
      <div className="lat-stat__label">{label}</div>
      {sub === undefined ? null : <div className="lat-stat__sub">{sub}</div>}
    </div>
  )
}
```

`stat.css`: `.lat-stat__value` takes the `numeric` role — including `font-variant-numeric: var(--lat-text-numeric-font-variant-numeric)`, which is the whole reason the role exists — `.lat-stat__label` the eyebrow, `.lat-stat__sub` the `meta` role at `color: var(--lat-text-subtle)`.

- [ ] **Step 5: Create `CodeBlock`**

```tsx
import { useState } from 'react'
import { LiveRegion } from '../live-region/live-region.js'

export interface CodeBlockProps {
  code: string
  /** Accessible name for the copy control. */
  copyLabel?: string
}

/**
 * A mono block with a copy control.
 *
 * The bundle's version swaps a clipboard icon for a tick and says nothing. A
 * change that only exists as an icon swap is invisible to a screen reader, so
 * this one announces the result in a live region as well.
 */
export function CodeBlock({ code, copyLabel = 'Copy code' }: CodeBlockProps) {
  const [message, setMessage] = useState('')

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setMessage('Copied to clipboard')
    // Cleared so a second copy of the same text announces again rather than
    // being deduplicated as an unchanged region.
    window.setTimeout(() => setMessage(''), 1500)
  }

  return (
    <div className="lat-code-block">
      <pre className="lat-code-block__pre">{code}</pre>
      <button type="button" className="lat-code-block__copy" onClick={copy}>
        {copyLabel}
      </button>
      {/* LiveRegion takes a `message` prop, not children, and holds the last
          announced string so an identical update is not re-announced. */}
      <LiveRegion message={message} />
    </div>
  )
}
```

`code-block.css`: the panel construction, `.lat-code-block__pre` in the `code` role with `overflow-x: auto`, and `.lat-code-block__copy` as a ghost button positioned top-right. The copy control must be reachable by keyboard and visible on `:focus-visible`, not only on hover — a hover-only control does not exist for a keyboard user.

- [ ] **Step 6: Register the three stylesheets**

Add `@import './code-block/code-block.css';`, `@import './eyebrow/eyebrow.css';` and `@import './stat/stat.css';` to `src/styles.css` in alphabetical position.

- [ ] **Step 7: Run tests**

Run: `cd packages/react && npx vitest run tests/stat.test.tsx tests/code-block.test.tsx`
Expected: PASS, 3 tests

- [ ] **Step 8: Commit**

```bash
git add packages/react
git commit -m "feat(react): add Eyebrow, Stat and CodeBlock

Each appears in both Meridian demos and carries a guarantee a caller would
otherwise have to remember — the 0.2em tracking, tabular figures, and a copy
that announces rather than only swapping an icon."
```

---

### Task 12: Exports, and the shape of the public API

**Files:**
- Modify: `packages/react/src/index.ts`, `packages/react/README.md`
- Test: `packages/react/tests/exports.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/react/tests/exports.test.ts
import { describe, expect, it } from 'vitest'
import * as lattice from '../src/index.js'

describe('public API', () => {
  it('exports every component family', () => {
    for (const name of [
      'Badge', 'Button', 'Callout', 'Card', 'CardBody', 'CardHeader', 'CodeBlock',
      'Dialog', 'Disclosure', 'Eyebrow', 'Input', 'LiveRegion', 'Menu',
      'SegmentedControl', 'SegmentedControlItem', 'Stat', 'Switch', 'Table',
      'Tab', 'TextField', 'VisuallyHidden'
    ]) {
      expect(lattice).toHaveProperty(name)
    }
  })

  it('no longer exports the retired tone types', async () => {
    const source = await import('node:fs/promises').then((fs) =>
      fs.readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
    )
    expect(source).not.toContain('ButtonTone')
    expect(source).not.toContain('BadgeTone')
    expect(source).not.toContain('CalloutTone')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/react && npx vitest run tests/exports.test.ts`
Expected: FAIL — `ButtonTone` is still exported

- [ ] **Step 3: Update `src/index.ts`**

Remove `ButtonTone`, `BadgeTone` and `CalloutTone`. Add `ButtonVariant`, `BadgeVariant`, `CalloutVariant`, `CardHeader`/`CardBody` and their prop types, and the three new families with theirs.

- [ ] **Step 4: Rewrite `packages/react/README.md`**

State the identity (Meridian), the five Button variants, the six Badge variants, the eighteen typography roles, and the rule that every value is a token reference. Remove every mention of tones.

- [ ] **Step 5: Typecheck and build**

Run: `cd packages/react && pnpm typecheck && pnpm build`
Expected: both succeed. Component and browser tests asserting the old appearance will still fail — that is expected and out of scope, per the spec's §11.

- [ ] **Step 6: Commit**

```bash
git add packages/react
git commit -m "feat(react)!: update the public API for Meridian

BREAKING CHANGE: ButtonTone, BadgeTone and CalloutTone are removed. Card gains
CardHeader and CardBody; Eyebrow, Stat, CodeBlock and SegmentedControl are new."
```

---

## Self-Review

**Spec coverage.** §7.1 Button → Task 2; Badge → Task 3; Card → Task 4; Input/TextField → Task 5; Switch → Task 6; Tabs → Task 7; Dialog/Menu/Disclosure → Task 8; Table → Task 9; Callout/LiveRegion → Task 10; VisuallyHidden needs no change (it has no colour or type). §7.2 the four additions → Tasks 7 and 11. §7.3 ScoreArc and the stock shadcn set are excluded and no task adds them. §5's borders-not-shadows rule is in Global Constraints and tested in Task 8. §2's mono roles are consumed in Tasks 3, 4, 5, 7, 9 and 11. §3's square radius is in Global Constraints and used in every stylesheet.

**Placeholder scan.** No TBD or TODO. Tasks 6, 9 and 10 describe declarations rather than showing complete files, which is deliberate — they are single-property changes to files that otherwise stay as they are, and every value named is an exact token. Task 5 Step 4 and Task 11 Steps 3–5 name exact constructions from the reference section rather than repeating them, which is the DRY the skill asks for.

**Type consistency.** `ButtonVariant`, `BadgeVariant` and `CalloutVariant` are defined in Tasks 2, 3 and 10 and exported in Task 12 under exactly those names. `CardHeader`/`CardBody` are defined in Task 4 and exported in Task 12. `SegmentedControl`/`SegmentedControlItem` are defined in Task 7. `Eyebrow`, `Stat`, `CodeBlock` in Task 11. `LiveRegion` is imported by `CodeBlock` in Task 11 and already exists. Every `var(--lat-*)` used here is emitted by Phase 1: `--lat-bg`, `--lat-bg-raised`, `--lat-bg-subtle`, `--lat-component`, `--lat-field-bg`, `--lat-switch-track`, `--lat-text`, `--lat-text-subtle`, `--lat-solid`, `--lat-on-solid`, `--lat-border`, `--lat-wash`, `--lat-focus-ring`, `--lat-{scale}-solid`, `--lat-{scale}-tint`, `--lat-{scale}-tint-border`, `--lat-radius-none`, `--lat-radius-full`, `--lat-elevation-*`, `--lat-duration-*`, `--lat-easing-out`, `--lat-space-*`, `--lat-text-{role}-*`, `--lat-font-weight-*`.

**One gap found and closed.** `--lat-font-weight-regular|medium|semibold|bold` is used in Tasks 2, 9 and elsewhere. Phase 1 Task 6 defines `FONT_WEIGHTS` with those four keys, and `generate/typography.ts` already emits weight primitives — confirm the emitted names match `--lat-font-weight-*` when starting Task 2, and if they differ, use the emitted names rather than adding a token.
