import { defineConfig } from '@vite-pwa/assets-generator/config'
import { minimal } from '@vite-pwa/assets-generator/presets/minimal'

export default defineConfig({
  preset: {
    ...minimal,
  },
  images: [
    'elk/public/logo.svg',
    'elk/public-dev/logo.svg',
    'elk/public-staging/logo.svg',
    'pwa/public/favicon.svg',
  ],
})
