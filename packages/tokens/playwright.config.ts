import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
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
