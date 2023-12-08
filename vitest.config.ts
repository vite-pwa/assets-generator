/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    includeSource: ['src/api/*.ts'],
  },
  /* optimizeDeps: {
    exclude: ['sharp'],
  }, */
})
