import type { Preset } from '../preset.ts'

/**
 * @deprecated use `minimal-2023` instead
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
