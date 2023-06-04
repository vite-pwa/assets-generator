import { defineConfig, minimal as preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset,
  images: [
    'elk/public/logo.svg',
    'elk/public-dev/logo.svg',
    'elk/public-staging/logo.svg',
    'pwa/public/favicon.svg',
  ],
})
