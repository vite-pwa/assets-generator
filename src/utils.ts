import type { PngOptions, ResizeOptions } from 'sharp'
import type { Asset, AssetSize, AssetType, ResolvedAsset, ResolvedAssetSize } from './types.ts'

export const defaultPngCompressionOptions: PngOptions = {
  compressionLevel: 9,
  quality: 60,
}

export const defaultPngOptions: Record<AssetType, { padding: number; resizeOptions: ResizeOptions }> = {
  transparent: { padding: 0.05, resizeOptions: { fit: 'contain', background: 'transparent' } },
  maskable: { padding: 0.3, resizeOptions: { fit: 'contain', background: 'white' } },
  apple: { padding: 0.3, resizeOptions: { fit: 'contain', background: 'white' } },
}

export function toResolvedSize(size: AssetSize) {
  return {
    original: size,
    width: typeof size === 'number' ? size : size.width,
    height: typeof size === 'number' ? size : size.height,
  } satisfies ResolvedAssetSize
}

export function toResolvedAsset(type: AssetType, asset: Asset) {
  return {
    padding: defaultPngOptions[type].padding,
    resizeOptions: defaultPngOptions[type].resizeOptions,
    ...asset,
    sizes: asset.sizes.map(toResolvedSize),
  } satisfies ResolvedAsset
}

export function defaultAssetName(type: AssetType, size: ResolvedAssetSize) {
  switch (type) {
    case 'transparent':
      return `pwa-${size.width}x${size.height}.png`
    case 'maskable':
      return `maskable-icon-${size.width}x${size.height}.png`
    case 'apple':
      return `apple-touch-icon-${size.width}x${size.height}.png`
  }
}
