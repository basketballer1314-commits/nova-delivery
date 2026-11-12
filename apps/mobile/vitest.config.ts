import { defineConfig } from 'vitest/config'

// Tests purs (logique), sans React Native. On cible src/**/*.test.ts.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
