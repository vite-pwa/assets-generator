import type { Preset } from '../preset.ts'

/**
 * Minimal preset for 2023.
 *
 * @see https://dev.to/masakudamatsu/favicon-nightmare-how-to-maintain-sanity-3al7
 */
export const minimal2023Preset: Preset = {
  transparent: {
    sizes: [64, 192, 512],
    favicons: [[48, 'favicon.ico']],
  },
  maskable: {
    sizes: [512],
  },
  apple: {
    sizes: [180],
  },
}
