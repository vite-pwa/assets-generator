import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, "favicon-48x48.ico"], [64, "favicon.ico"]]
    },
    maskable: {
      sizes: [512]
    },
    apple: {
      sizes: [180]
    }
  },
  images: [
    'elk/public/logo.svg',
    'elk/public-dev/logo.svg',
    'elk/public-staging/logo.svg',
    'pwa/public/favicon.svg',
  ],
})
