import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Deliberately does not match tests/browser/**, which holds Playwright
    // specs named *.spec.ts. The two runners must never pick up each other's
    // files.
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts']
  }
})
