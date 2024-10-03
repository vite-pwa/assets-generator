import type {
  Asset,
  AssetSize,
  AssetType,
  ResolvedAsset,
  ResolvedAssets,
  ResolvedAssetSize,
} from './types.ts'
import { defaultPngOptions } from './api/defaults.ts'

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

export function sameAssetSize(a: AssetSize, b: ResolvedAssetSize) {
  if (typeof a === 'number' && typeof b.original === 'number')
    return a === b.original

  if (typeof a !== 'number' && typeof b.original !== 'number')
    return a.width === b.width && a.height === b.height

  return false
}

export function cloneResolvedAssetsSizes({ png, assetName, assets }: ResolvedAssets) {
  return {
    assets: {
      transparent: cloneResolvedAssetSizes(assets.transparent),
      maskable: cloneResolvedAssetSizes(assets.maskable),
      apple: cloneResolvedAssetSizes(assets.apple),
    },
    png,
    assetName,
  } satisfies ResolvedAssets
}

export function cloneResolvedAssetSizes({ sizes, ...asset }: ResolvedAsset) {
  return {
    ...asset,
    sizes: [...sizes],
  } satisfies ResolvedAsset
}
