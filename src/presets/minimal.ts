import type { Preset } from '../preset.ts'

/**
 * Minimal preset.
 *
 * @deprecated use `minimal-2023` instead
 * @see https://www.leereamsnyder.com/favicons-in-2021
 */
export const minimalPreset: Preset = {
  transparent: {
    sizes: [64, 192, 512],
    favicons: [[64, 'favicon.ico']],
  },
  maskable: {
    sizes: [512],
  },
  apple: {
    sizes: [180],
  },
}
