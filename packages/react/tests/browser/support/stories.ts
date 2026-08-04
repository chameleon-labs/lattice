import { readdirSync } from 'node:fs'
import type { APIRequestContext, Page } from '@playwright/test'

export interface StoryEntry {
  readonly id: string
  readonly title: string
  readonly name: string
  readonly type: string
}

interface StoryIndex {
  readonly entries: Record<string, StoryEntry>
}

/**
 * The component directories that ship stories, read from disk.
 *
 * This is the one piece that cannot come from `/index.json`. Playwright collects
 * test files *before* the web server is up, so a runtime fetch cannot decide how
 * many tests exist — but the sweep still wants a test per family rather than one
 * enormous test, both for parallelism and so a failure names the family it came
 * from.
 *
 * So the shape of the suite comes from the filesystem and the *contents* of each
 * shard come from the index. Neither is a hand-maintained list.
 */
export function storyFamilies(): string[] {
  const src = new URL('../../../src/', import.meta.url)

  return readdirSync(src, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    // `pages/` ships full-page stories titled `Pages/<Page>`, not
    // `Components/<Family>` — see the matching exclusion in
    // tests/exports.test.ts. This sweep is keyed to the Components
    // namespace, so a page story needs its own coverage rather than being
    // folded into a walk that assumes every directory is a component family.
    .filter((entry) => entry.name !== 'pages')
    .filter((entry) =>
      readdirSync(new URL(`${entry.name}/`, src)).some((file) => file.endsWith('.stories.tsx'))
    )
    .map((entry) => entry.name)
    .sort()
}

/** Every entry Storybook indexed as a story, in index order. */
export async function fetchStories(request: APIRequestContext): Promise<StoryEntry[]> {
  const response = await request.get('/index.json')

  if (!response.ok()) {
    throw new Error(`/index.json responded ${response.status()} — is Storybook serving?`)
  }

  const index = (await response.json()) as StoryIndex

  // `docs` entries are autodocs pages: Storybook's own chrome around a prop
  // table. Scanning those would measure Storybook rather than Lattice, the same
  // reason the :focus-visible pointer heuristic is asserted statically instead
  // of in a browser.
  return Object.values(index.entries).filter((entry) => entry.type === 'story')
}

/** A directory name — `text-field` — as it appears in a story title: `TextField`. */
export function titleFor(family: string): string {
  return family
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * A story in isolation, in a given theme, with the a11y addon told to stand down.
 *
 * The theme rides in as a Storybook global rather than as a separate story,
 * which is what keeps the story count equal to the number of distinct component
 * states rather than double it.
 *
 * `a11y.manual` is the other half, and it is not optional. @storybook/addon-a11y
 * runs axe *inside* the iframe when a story renders; AxeBuilder then injects and
 * runs axe over the same frame, and the second run aborts with "Axe is already
 * running". It is a race, so it surfaced on 4 of 74 tests rather than on all of
 * them — a suite that would have failed intermittently in CI and passed on a
 * rerun.
 *
 * Setting it here rather than as a preview parameter keeps the addon's automatic
 * panel working for anyone actually browsing Storybook. Only the sweep opts out,
 * and only because it is bringing its own axe.
 */
export function storyUrl(id: string, theme: 'light' | 'dark'): string {
  const globals = `theme:${theme};a11y.manual:!true`

  return `/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=${encodeURIComponent(globals)}`
}

export const THEMES = ['light', 'dark'] as const

/**
 * Wait for the story to stop moving before measuring it.
 *
 * `.lat-dialog` opens at `opacity: 0` and fades to 1 over
 * `--lat-duration-slower`. axe reading a frame part-way through that fade
 * measures a blended colour and reports a contrast violation against a dialog
 * that is perfectly legible at rest — intermittently, which is the worst
 * possible way to find out.
 *
 * Three rounds rather than one drain: Ariakit applies `data-enter` in an effect
 * after mount, so the transition does not exist yet on the first frame. Each
 * round waits a frame and then drains whatever has started, which catches a
 * transition however late it begins. `finished` rejects on a cancelled
 * animation, so each is swallowed individually.
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    for (let round = 0; round < 3; round += 1) {
      await frame()
      await Promise.all(
        document.getAnimations().map((animation) => animation.finished.catch(() => undefined))
      )
    }
  })
}

/**
 * Rules that ask a question about a *page* rather than about a component.
 *
 * A story renders one component into an empty iframe. It has no landmarks, no
 * `<main>`, no `<h1>` and nothing to bypass — and it should not: inventing page
 * scaffolding around each story would make these rules pass while testing
 * nothing. Every rule that judges the component itself stays on.
 */
export const PAGE_SCOPED_RULES = [
  'region',
  'landmark-one-main',
  'page-has-heading-one',
  'bypass',
  'html-has-lang'
]
