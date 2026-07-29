import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Scaffold only: there is nothing to assert until the contract suite lands
    // in #9. Remove this line then — an empty suite must not pass once the
    // tests are the deliverable.
    passWithNoTests: true
  }
})
