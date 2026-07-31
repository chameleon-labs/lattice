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
