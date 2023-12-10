/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['setup-vitest.ts'],
    includeSource: ['src/api/*.ts'],
  },
})
