import {defineConfig} from '@playwright/test';

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
  // Without this, tests inside one file share a worker, and a11y.spec.ts is one
  // file holding a test per component per theme — so the whole sweep ran on a
  // single core while the other files finished in seconds. Every test opens its
  // own page and asserts on its own story; none of them share state.
  fullyParallel: true,
  reporter: 'line',
  // Raised from the 30s default. Each family test navigates once per story, and
  // Storybook's dev server compiles a story's module the first time it is asked
  // for — so the opening navigations are slow, and slower still with every
  // worker asking at once. The tests themselves are not slow; the first visit is.
  timeout: 90_000,
  // Nothing here is retried locally: a failure on a laptop should be looked at,
  // not re-rolled until it passes, and a flaky assertion hidden by a retry is
  // worse than one that fails.
  //
  // CI is the other case. A shared runner drops connections that a laptop does
  // not, and this suite makes hundreds of requests to a dev server it started
  // moments earlier — a single reset socket failed a whole run once, which is
  // what prompted this. Two retries turn transport noise into a slower green
  // run; they cannot hide a real failure, because a real failure fails all
  // three attempts.
  retries: process.env.CI === undefined ? 0 : 2,
  use: {
    baseURL: 'http://localhost:6006',
  },
  webServer: {
    command: 'pnpm exec storybook dev -p 6006 --no-open --quiet',
    // Readiness is measured against the story index rather than against the
    // root, because that is what the sweep reads. A server that has bound its
    // port but has not finished indexing would serve the tests an empty list,
    // and every loop over it would pass vacuously.
    url: 'http://localhost:6006/index.json',
    // A cold Storybook boot exceeds Playwright's 60s default on CI.
    timeout: 180_000,
    reuseExistingServer: process.env.CI === undefined,
  },
  projects: [
    {
      name: 'firefox-default-16',
      use: {
        browserName: 'firefox',
        viewport: {width: 700, height: 900},
      },
    },
    {
      name: 'firefox-default-20',
      use: {
        browserName: 'firefox',
        viewport: {width: 700, height: 900},
        launchOptions: {
          firefoxUserPrefs: {
            'font.size.variable.x-western': 20,
            'font.size.fixed.x-western': 20,
          },
        },
      },
    },
  ],
});
