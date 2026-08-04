// The named export, not the default. @axe-core/playwright is CJS, and under
// NodeNext resolution a default import of a CJS module gives the namespace
// object rather than the class — which Playwright's esbuild interop papers
// over at runtime while `tsc` correctly rejects it as not constructable.
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import {
  PAGE_SCOPED_RULES,
  THEMES,
  fetchStories,
  settle,
  storyFamilies,
  storyUrl,
  titleFor
} from './support/stories.js'

/**
 * Accessibility coverage, driven by Storybook's index rather than by a page.
 *
 * The demo this replaced carried a comment asking whoever added a variant to
 * remember to render it, because "if a variant is not rendered here, no axe scan
 * covers it". Nothing failed when they forgot. Here a story is scanned because
 * it exists: the list is fetched at run time, never declared.
 */
const families = storyFamilies()

/**
 * The guard that makes every loop in this file mean something.
 *
 * An empty index would leave each `for` body unexecuted and the suite green —
 * the same vacuous pass the CSS checkers avoid by being proven against fixtures
 * rather than only against the shipped file.
 */
test('the story index is populated', async ({ request }) => {
  expect(families.length).toBeGreaterThan(0)

  const stories = await fetchStories(request)

  // Strictly greater, so an index that listed exactly one story per family —
  // which is what a broken indexer tends to produce — still fails.
  expect(stories.length).toBeGreaterThan(families.length)
})

for (const family of families) {
  const title = titleFor(family)

  for (const theme of THEMES) {
    test(`${title} has no axe violations in ${theme}`, async ({ page, request }) => {
      const stories = (await fetchStories(request)).filter(
        (story) => story.title === `Components/${title}`
      )

      // A component whose stories file exists but indexes nothing would
      // otherwise sweep zero stories and pass.
      expect(stories.length).toBeGreaterThan(0)

      for (const story of stories) {
        await test.step(story.name, async () => {
          await page.goto(storyUrl(story.id, theme))

          // The decorator's element, which is also what paints the themed
          // surface. Waiting on it means axe never measures a half-mounted tree,
          // and settling means it never measures a half-finished transition.
          await page.locator('.lat-story').waitFor()
          await settle(page)

          const results = await new AxeBuilder({ page }).disableRules(PAGE_SCOPED_RULES).analyze()

          // Reported as a summary rather than as raw violations: the raw objects
          // carry the whole element tree, and a failure has to stay readable.
          const summary = results.violations.map((violation) => ({
            rule: violation.id,
            impact: violation.impact,
            help: violation.help,
            targets: violation.nodes.map((node) => node.target.join(' '))
          }))

          expect.soft(summary, `${story.id} in ${theme}`).toEqual([])
        })
      }
    })
  }

  /**
   * Sharded per family for the same reason as the sweep above.
   *
   * Written first as one test over all 42 stories, which exceeded Playwright's
   * 30s timeout: 42 serial navigations is a slow test however cheap each check
   * is. Splitting it by family keeps every assertion and lets the workers run
   * them at once.
   *
   * Not split by theme — whether a transform is animated is a property of the
   * stylesheet, and the stylesheet does not vary by mode.
   */
  test(`${title} animates no transform under reduced motion`, async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    const stories = (await fetchStories(request)).filter(
      (story) => story.title === `Components/${title}`
    )

    expect(stories.length).toBeGreaterThan(0)

    for (const story of stories) {
      await page.goto(storyUrl(story.id, 'light'))
      await page.locator('.lat-story').waitFor()

      const offenders = await page.evaluate(() =>
        [...document.querySelectorAll('*')]
          .filter((el) => getComputedStyle(el).transitionProperty.includes('transform'))
          .map((el) => el.className)
      )

      expect.soft(offenders, story.id).toEqual([])
    }
  })
}

/**
 * Page-story sweep, separate from the per-family loop above.
 *
 * `storyFamilies()` walks directories under `src/` and excludes `pages/` —
 * a page ships one full document, not a family of component variants, so it
 * has no place in a sweep keyed to `Components/<Family>` titles (see the
 * exclusion and its comment in support/stories.ts). That exclusion is
 * correct, but its consequence was that nothing swept the pages at all: the
 * acceptance test for the whole identity went unaudited by the very tool
 * built to audit it.
 *
 * So this block is keyed to the index, not the filesystem: it asks
 * Storybook's own `/index.json` for every entry titled `Pages/*`, the same
 * way `fetchStories` is already used above, rather than hardcoding story
 * IDs. The next page to land needs no edit here to be picked up.
 *
 * Unlike the family loop, `PAGE_SCOPED_RULES` is **not** disabled. Landmark,
 * region and heading-order rules are meaningless against a lone component
 * dropped into an empty iframe — that's exactly why the family sweep turns
 * them off — but a page is the one place those rules ask a real question:
 * does it have a `<main>`, a single `<h1>`, a way to bypass repeated
 * content, and no content stranded outside a landmark? Disabling them here
 * would leave the acceptance test unable to fail for the reasons a page
 * actually fails.
 */
test.describe('page stories', () => {
  const pageStories = async (request: import('@playwright/test').APIRequestContext) =>
    (await fetchStories(request)).filter((story) => story.title.startsWith('Pages/'))

  test('the page-story index is populated', async ({ request }) => {
    const pages = await pageStories(request)

    // Mirrors "the story index is populated" above: if the index stops
    // matching `Pages/` — a rename, a moved directory, a title typo — this
    // fails loudly instead of the loop below silently sweeping zero pages
    // and reporting green.
    expect(pages.length).toBeGreaterThan(0)
  })

  for (const theme of THEMES) {
    test(`page stories have no axe violations in ${theme}`, async ({ page, request }) => {
      const pages = await pageStories(request)

      expect(pages.length).toBeGreaterThan(0)

      for (const story of pages) {
        await test.step(`${story.title} ${story.name}`, async () => {
          await page.goto(storyUrl(story.id, theme))

          await page.locator('.lat-story').waitFor()
          await settle(page)

          // No disableRules() call: the full default rule set runs, page
          // rules included — see the block comment above.
          const results = await new AxeBuilder({ page }).analyze()

          const summary = results.violations.map((violation) => ({
            rule: violation.id,
            impact: violation.impact,
            help: violation.help,
            targets: violation.nodes.map((node) => node.target.join(' '))
          }))

          expect.soft(summary, `${story.id} in ${theme}`).toEqual([])
        })
      }
    })
  }
})

/**
 * The shared focus recipe (`outline: none` + a `border-color`/`box-shadow`
 * pair) means "visible ring" is not the same assertion in both modes. Under
 * `forced-colors: none` the box-shadow carries it, since the author's own
 * `outline: none` is honoured. Under `forced-colors: active` box-shadow is
 * forced to `none` and border-color is forced to the same system value the
 * resting border already uses, so the ring has to be restated as an explicit
 * `outline` inside a `@media (forced-colors: active)` block — see button.css
 * — and that outline is what must be checked there instead.
 *
 * This assertion used to check only `outlineStyle !== 'none'`,
 * unconditionally — a contract Phase 2 inverted (the ring became a
 * box-shadow with `outline: none`) without updating the test, which is why
 * `pnpm test` was red. It never ran under forced-colors at all, so it also
 * caught nothing of C1.
 */
async function focusRing(page: import('@playwright/test').Page) {
  await page.locator('.lat-button').waitFor()

  // Drive focus purely by keyboard. A programmatic .focus() does not set the
  // heuristic Firefox uses for :focus-visible, so a test that used one would be
  // measuring the wrong thing — and would keep passing if the ring were removed.
  await page.keyboard.press('Tab')

  return page.evaluate(() => {
    const el = document.activeElement
    if (el === null) return null
    const style = getComputedStyle(el)
    return {
      className: el.className,
      matchesFocusVisible: el.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow
    }
  })
}

test('keyboard focus produces a visible ring', async ({ page }) => {
  await page.goto(storyUrl('components-button--default', 'light'))

  const focused = await focusRing(page)

  expect(focused).not.toBeNull()
  expect(focused?.className).toContain('lat-button')
  expect(focused?.matchesFocusVisible).toBe(true)
  expect(focused?.boxShadow).not.toBe('none')
})

test('keyboard focus produces a visible ring under forced-colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto(storyUrl('components-button--default', 'light'))

  const focused = await focusRing(page)

  expect(focused).not.toBeNull()
  expect(focused?.className).toContain('lat-button')
  expect(focused?.matchesFocusVisible).toBe(true)
  expect(focused?.outlineStyle).not.toBe('none')
  expect(parseFloat(focused?.outlineWidth ?? '0')).toBeGreaterThan(0)
})

// The counterpart — that a pointer press leaves no ring behind — is asserted
// statically, in tests/stylesheet.test.ts, rather than here. Whether a click
// matches :focus-visible is the browser's heuristic; what this system controls
// is that the ring hangs off :focus-visible and never off bare :focus.

test.describe('under prefers-reduced-motion: reduce', () => {
  // Applied per test with emulateMedia rather than through `test.use`, which
  // does not accept reducedMotion as a describe-scoped option here.

  // The counterpart to the per-family transform check above: movement is gated,
  // but the *position* the movement would travel to is not. A switch whose thumb
  // only reached its on-position by animating would have no state signal under
  // `reduce`.
  test('the switch thumb still moves between states', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    const thumbOffset = async (id: string) => {
      await page.goto(storyUrl(id, 'light'))
      await page.locator('.lat-switch').waitFor()
      return page.locator('.lat-switch').evaluate((el) => getComputedStyle(el, '::before').transform)
    }

    const off = await thumbOffset('components-switch--off')
    const on = await thumbOffset('components-switch--on')

    expect(off).not.toBe('none')
    expect(on).not.toBe(off)
  })
})

// These live here rather than in jsdom deliberately. Ariakit restores focus
// using real layout and animation frames; under jsdom focus simply stays on the
// dismiss button, so a jsdom assertion would either fail for the wrong reason or
// be weakened until it proved nothing.
//
// Each now runs against the story it is actually about, alone in its iframe,
// rather than hunting for its component on a page shared with thirteen others.
test('Dialog traps focus and returns it to the trigger', async ({ page }) => {
  await page.goto(storyUrl('components-dialog--closed', 'light'))

  const trigger = page.getByRole('button', { name: 'Remove page' })
  await trigger.click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  // Focus starts inside the dialog.
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)

  // Tabbing past the last focusable element wraps back inside rather than
  // escaping to the page behind.
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Tab')
  }
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await expect(trigger).toBeFocused()
})

test('Menu returns focus to its button', async ({ page }) => {
  await page.goto(storyUrl('components-menu--closed', 'light'))

  const button = page.getByRole('button', { name: 'Actions' })
  await button.click()

  await expect(page.getByRole('menu')).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(page.getByRole('menu')).toBeHidden()
  await expect(button).toBeFocused()
})

test('borders survive forced-colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto(storyUrl('components-button--default', 'light'))

  const width = await page
    .locator('.lat-button')
    .evaluate((el) => getComputedStyle(el).borderTopWidth)

  expect(parseFloat(width)).toBeGreaterThan(0)
})

// The counterpart to "the switch thumb still moves between states" above: the
// position surviving is not enough if the thing that moves is invisible.
// Before switch.css's forced-colors block, the track computed the same
// rgba(0,0,0,0) in both states and the thumb computed white-on-white Canvas
// with its box-shadow stripped — on and off were pixel-identical.
test('the switch off and on states are visually distinct under forced-colors', async ({
  page
}) => {
  await page.emulateMedia({ forcedColors: 'active' })

  const state = async (id: string) => {
    await page.goto(storyUrl(id, 'light'))
    await page.locator('.lat-switch').waitFor()
    return page.locator('.lat-switch').evaluate((el) => ({
      trackBackground: getComputedStyle(el).backgroundColor,
      thumbBackground: getComputedStyle(el, '::before').backgroundColor
    }))
  }

  const off = await state('components-switch--off')
  const on = await state('components-switch--on')

  // The thumb itself must be visible against the track in both states —
  // Canvas is the only colour it could otherwise collapse into.
  expect(off.thumbBackground).not.toBe('rgba(0, 0, 0, 0)')
  expect(on.thumbBackground).not.toBe('rgba(0, 0, 0, 0)')

  // And the two states must be distinguishable from each other, not merely
  // each individually visible.
  expect(off.trackBackground).not.toBe(on.trackBackground)
})
