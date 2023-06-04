import type { PngOptions, ResizeOptions } from 'sharp'

export type AssetSize = number | { width: number; height: number }

export interface ResolvedAssetSize {
  original: AssetSize
  width: number
  height: number
}

/**
 * Favicon size and name.
 */
export type Favicon = [size: AssetSize, name: string]

export interface Asset {
  sizes: AssetSize[]
  padding?: number
  resizeOptions?: ResizeOptions
  favicons?: Favicon[]
}

export type AssetType = 'transparent' | 'maskable' | 'apple' // | 'screenshot

export interface ResolvedAsset extends Required<Omit<Asset, 'favicons' | 'sizes'>> {
  sizes: ResolvedAssetSize[]
  favicons?: Favicon[]
}

export interface Assets extends Record<AssetType, Asset> {
  /**
   * @default: { compressionLevel: 9, quality: 60 }`
   */
  png?: PngOptions
  /**
   * @default `pwa-<width>x<height>.png`, `maskable-icon-<width>x<height>.png`, `apple-touch-icon-<width>x<height>.png`
   */
  assetName?: (type: AssetType, size: ResolvedAssetSize) => string
}

export interface ResolvedAssets {
  assets: Record<AssetType, ResolvedAsset>
  png: PngOptions
  /**
   * @default `pwa-<width>x<height>.png`, `maskable-icon-<width>x<height>.png`, `apple-touch-icon-<width>x<height>.png`
   */
  assetName: (type: AssetType, size: ResolvedAssetSize) => string
}

export type LogLevel = 'info' | 'warn' | 'silent'

export interface BuildOptions {
  root: string
  logLevel?: LogLevel
  overrideAssets?: boolean
}

export interface ResolvedBuildOptions extends Required<BuildOptions> {}
