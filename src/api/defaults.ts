import type { PngOptions, ResizeOptions } from 'sharp'
import type { AssetType } from '../types.ts'

export const defaultResizeOptions = {
  fit: 'contain',
  background: 'white',
} satisfies ResizeOptions

export const defaultDarkResizeOptions = {
  fit: 'contain',
  background: 'black',
} satisfies ResizeOptions

export const defaultPngCompressionOptions: PngOptions = {
  compressionLevel: 9,
  quality: 60,
}

export const defaultPngOptions: Record<AssetType, { padding: number, resizeOptions: ResizeOptions }> = {
  transparent: { padding: 0.05, resizeOptions: { fit: 'contain', background: 'transparent' } },
  maskable: { padding: 0.3, resizeOptions: { fit: 'contain', background: 'white' } },
  apple: { padding: 0.3, resizeOptions: { fit: 'contain', background: 'white' } },
}

export function createResizeOptions(dark: boolean, options: ResizeOptions) {
  return {
    ...(dark ? defaultDarkResizeOptions : defaultResizeOptions),
    ...options,
  } satisfies ResizeOptions
}

export function createPngCompressionOptions(options: PngOptions) {
  return {
    ...defaultPngCompressionOptions,
    ...options,
  } satisfies PngOptions
}
